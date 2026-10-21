// Generic delta/patch assembler. Many streaming UIs send a document once and then patches.
// Two widely used dialects are recognised automatically:
//   json-patch : RFC 6902 operations  { op, path, value }  (or arrays of them)
//   path-ops   : compact operations   { p: "/a/b", o: "append|replace|add|remove|patch", v }
//                where a bare { v: "..." } continues appending to the previous path.
//   typed-events : { type: "x_start" | "x_delta" | "x_stop" | "a.b.delta" | "...done", index?, delta? }
//                start events carry objects, delta events append strings to the indexed block,
//                stop/done events finalise. Detected from the event-type shape, not the provider.
// Anything else is treated as a full document replacement when it is a plain object.
// Every applied operation counts as a revision, so intermediate states can be replayed.

const PATH_OPS = new Set(['append', 'replace', 'add', 'remove', 'patch', 'set', 'truncate']);
const TYPED = /(^|[._])(start|stop|delta|done|created|completed|added|in_progress)$/;
const TYPED_START = /(^|[._])(start|created|added|in_progress)$/;
const TYPED_STOP = /(^|[._])(stop|done|completed)$/;
const INDEX_KEYS = ['index', 'output_index', 'content_index'];

function parsePointer(p) {
  if (p === '' || p === '/' || p === undefined || p === null) return [];
  return String(p).split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getParent(doc, parts, create) {
  let node = doc;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (node[k] === undefined || node[k] === null || typeof node[k] !== 'object') {
      if (!create) return undefined;
      node[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    node = node[k];
  }
  return node;
}

export function detectDialect(json) {
  const arr = Array.isArray(json) ? json : [json];
  if (!arr.length || arr.some((x) => !x || typeof x !== 'object')) return null;
  if (arr.every((x) => typeof x.op === 'string' && typeof x.path === 'string')) return 'json-patch';
  if (!Array.isArray(json) && typeof json.type === 'string' && TYPED.test(json.type)) return 'typed-events';
  if (!Array.isArray(json)) {
    const keys = Object.keys(json);
    if (keys.length && keys.every((k) => ['p', 'o', 'v', 'c'].includes(k)) && ('v' in json || 'o' in json)) {
      if (json.o === undefined || PATH_OPS.has(json.o)) return 'path-ops';
    }
  }
  return null;
}

export class DeltaAssembler {
  constructor(dialect = 'auto') {
    this.dialect = dialect;
    this.doc = undefined;
    this.lastPath = null;
    this.revisions = 0;
    this.detected = new Set();
    this.unapplied = 0;
  }

  apply(json) {
    if (json === undefined || this.dialect === 'none') return false;
    const d = this.dialect === 'auto' ? detectDialect(json) : this.dialect;
    if (d === 'json-patch') { this.detected.add(d); for (const op of [].concat(json)) this._jsonPatch(op); this.revisions++; return true; }
    if (d === 'typed-events') { this.detected.add(d); if (this._typed(json)) { this.revisions++; return true; } this.unapplied++; return false; }
    if (d === 'path-ops') {
      this.detected.add(d);
      // A path-op with an object value at the root and no op is a full document.
      if ((json.p === undefined || json.p === '') && json.o === undefined && json.v && typeof json.v === 'object' && !Array.isArray(json.v)) {
        this.doc = structuredClone(json.v); this.lastPath = null; this.revisions++; return true;
      }
      this._pathOp(json); this.revisions++; return true;
    }
    if (json && typeof json === 'object' && !Array.isArray(json) && this.dialect === 'auto') {
      // Plain object: keep as the latest full snapshot only if nothing patch-like has been seen
      // or it clearly carries a document (heuristic: many keys).
      if (!this.detected.size || Object.keys(json).length >= 3) { this.doc = structuredClone(json); this.revisions++; return true; }
    }
    this.unapplied++;
    return false;
  }

  _ensureDoc() { if (this.doc === undefined || this.doc === null || typeof this.doc !== 'object') this.doc = {}; }

  _set(parts, value, mode) {
    this._ensureDoc();
    if (!parts.length) { if (mode === 'append' && typeof this.doc === 'string') this.doc += value; else this.doc = value; return; }
    const parent = getParent(this.doc, parts, true);
    const key = parts[parts.length - 1];
    if (mode === 'append') {
      const cur = parent[key];
      if (typeof cur === 'string' && typeof value === 'string') parent[key] = cur + value;
      else if (Array.isArray(cur)) cur.push(...[].concat(value));
      else if (cur === undefined) parent[key] = value;
      else parent[key] = value;
    } else if (mode === 'add' && Array.isArray(parent) && (key === '-' || /^\d+$/.test(key))) {
      if (key === '-') parent.push(value); else parent.splice(Number(key), 0, value);
    } else if (mode === 'remove') {
      if (Array.isArray(parent)) parent.splice(Number(key), 1); else delete parent[key];
    } else if (mode === 'truncate') {
      const cur = parent[key];
      if (typeof cur === 'string' || Array.isArray(cur)) parent[key] = cur.slice(0, Number(value));
    } else parent[key] = value;
  }

  _jsonPatch(op) {
    const parts = parsePointer(op.path);
    if (op.op === 'add') this._set(parts, structuredClone(op.value), 'add');
    else if (op.op === 'replace') this._set(parts, structuredClone(op.value), 'replace');
    else if (op.op === 'remove') this._set(parts, undefined, 'remove');
    else this.unapplied++; // move/copy/test are rare in streams; counted, not guessed
  }

  _pathOp(op) {
    if (op.o === 'patch' && Array.isArray(op.v)) { for (const sub of op.v) this._pathOp(sub); return; }
    const path = op.p !== undefined ? op.p : this.lastPath;
    if (path === null || path === undefined) { this.unapplied++; return; }
    this.lastPath = path;
    const mode = op.o ?? 'append';
    this._set(parsePointer(path), op.v === undefined ? undefined : structuredClone(op.v), mode === 'set' ? 'replace' : mode);
  }

  _typed(ev) {
    const t = ev.type;
    if (this.doc === undefined || typeof this.doc !== 'object' || this.doc === null) this.doc = {};
    const key = INDEX_KEYS.filter((k) => Number.isInteger(ev[k])).map((k) => ev[k]).join('.');
    const rootObj = () => { for (const [k, v] of Object.entries(this.doc)) if (k !== 'blocks' && v && typeof v === 'object' && !Array.isArray(v)) return v; return this.doc; };
    const objectFields = Object.entries(ev).filter(([k, v]) => k !== 'type' && k !== 'delta' && !INDEX_KEYS.includes(k) && v && typeof v === 'object' && !Array.isArray(v));
    if (TYPED_START.test(t)) {
      if (!objectFields.length) return false;
      for (const [k, v] of objectFields) {
        if (key) { this.doc.blocks ??= {}; this.doc.blocks[key] = { ...(this.doc.blocks[key] ?? {}), ...structuredClone(v) }; }
        else this.doc[k] = { ...(this.doc[k] ?? {}), ...structuredClone(v) };
      }
      return true;
    }
    if (/delta/.test(t)) {
      const target = key ? ((this.doc.blocks ??= {})[key] ??= {}) : rootObj();
      const d = ev.delta;
      if (typeof d === 'string') target.text = (target.text ?? '') + d;
      else if (d && typeof d === 'object') {
        for (const [k, v] of Object.entries(d)) {
          if (k === 'type') continue;
          // Block-level string deltas append; message-level fields (stop reasons) replace.
          if (key && typeof v === 'string') target[k] = (typeof target[k] === 'string' ? target[k] : '') + v;
          else target[k] = structuredClone(v);
        }
      } else return false;
      for (const [k, v] of objectFields) rootObj()[k] = structuredClone(v);
      return true;
    }
    if (TYPED_STOP.test(t)) {
      for (const [k, v] of objectFields) this.doc[k] = { ...(this.doc[k] ?? {}), ...structuredClone(v) };
      if (key && this.doc.blocks?.[key]) this.doc.blocks[key]._done = true; else if (!objectFields.length) this.doc._done = true;
      return true;
    }
    return false;
  }

  // Longest string leaves are the most likely human-visible text.
  texts(minLength = 1) {
    const out = [];
    const walk = (node, p) => {
      if (typeof node === 'string') { if (node.length >= minLength) out.push({ path: p, text: node }); return; }
      if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, `${p}/${k}`);
    };
    walk(this.doc, '');
    return out.sort((a, b) => b.text.length - a.text.length);
  }
}
