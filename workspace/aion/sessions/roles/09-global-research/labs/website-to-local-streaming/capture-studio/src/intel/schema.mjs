// Schema induction for arbitrary JSON-like values, online and bounded.
//
// Approach (after genson / Spark JSON inference, extended):
//   - Each path keeps per-kind statistics; a value never forces a premature decision.
//   - describe() decides late: object vs dynamic-key map, plain object vs tagged union,
//     enum vs free string, and attaches string/number formats.
//   - Every decision carries the statistic it was based on, so uncertainty is inspectable.
// Memory is bounded: distinct-value tracking caps out, variant tracking drops high-cardinality tags.

const DISTINCT_CAP = 200;
const TAG_MAX_VALUES = 24;
const KEY_CAP = 400;

export const FORMAT_TESTS = {
  uuid: (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
  iso_time: (s) => /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s),
  url: (s) => /^(https?:)?\/\/[^\s]+$/.test(s) || /^\/[\w\-./%?=&#]+$/.test(s) && s.length > 1 && s.includes('/') && !/\s/.test(s) && s.length < 300,
  email: (s) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s),
  pointer: (s) => /^\/[\w~-]+(\/[\w~-]+)*$/.test(s) && s.length < 80,
  token_id: (s) => /^[A-Za-z][A-Za-z0-9]*[_-][A-Za-z0-9_-]{6,}$/.test(s) && !/\s/.test(s),
  hex_id: (s) => /^[0-9a-f]{12,}$/i.test(s),
  numeric_string: (s) => /^-?\d+(\.\d+)?$/.test(s),
  markdown: (s) => s.length > 20 && /(^|\n)(#{1,6} |\* |- |\d+\. |```|\|.*\|)/.test(s),
  multiline: (s) => s.includes('\n'),
};

const kindOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v);

export class SchemaNode {
  constructor() {
    this.count = 0;
    this.kinds = {};
    this.str = null; this.num = null; this.bool = null;
    this.obj = null; this.arr = null;
  }

  observe(v, depth = 0) {
    this.count++;
    const k = kindOf(v);
    this.kinds[k] = (this.kinds[k] ?? 0) + 1;
    if (depth > 24) return this;
    if (k === 'string') this._str(v);
    else if (k === 'integer' || k === 'number') this._num(v);
    else if (k === 'boolean') { this.bool ??= { t: 0, f: 0 }; v ? this.bool.t++ : this.bool.f++; }
    else if (k === 'array') this._arr(v, depth);
    else if (k === 'object') this._obj(v, depth);
    return this;
  }

  _str(s) {
    const st = (this.str ??= { n: 0, lenSum: 0, lenMin: Infinity, lenMax: 0, distinct: new Map(), overflow: false, formats: {}, examples: [] });
    st.n++; st.lenSum += s.length; st.lenMin = Math.min(st.lenMin, s.length); st.lenMax = Math.max(st.lenMax, s.length);
    if (!st.overflow) { st.distinct.set(s, (st.distinct.get(s) ?? 0) + 1); if (st.distinct.size > DISTINCT_CAP) { st.overflow = true; st.distinct = new Map(); } }
    for (const [f, test] of Object.entries(FORMAT_TESTS)) if (test(s)) st.formats[f] = (st.formats[f] ?? 0) + 1;
    if (st.examples.length < 3 && !st.examples.includes(s)) st.examples.push(s.length > 120 ? s.slice(0, 117) + '…' : s);
  }

  _num(x) {
    const st = (this.num ??= { n: 0, min: Infinity, max: -Infinity, sum: 0, distinct: new Set(), overflow: false, epochS: 0, epochMs: 0, changes: 0, last: undefined, examples: [] });
    st.n++; st.min = Math.min(st.min, x); st.max = Math.max(st.max, x); st.sum += x;
    if (st.last !== undefined && st.last !== x) st.changes++;
    st.last = x;
    if (!st.overflow) { st.distinct.add(x); if (st.distinct.size > DISTINCT_CAP) { st.overflow = true; st.distinct = new Set(); } }
    if (x > 9.4e8 && x < 4.2e9) st.epochS++;
    if (x > 9.4e11 && x < 4.2e12) st.epochMs++;
    if (st.examples.length < 3 && !st.examples.includes(x)) st.examples.push(x);
  }

  _arr(a, depth) {
    const st = (this.arr ??= { n: 0, lenSum: 0, lenMax: 0, empty: 0, items: new SchemaNode() });
    st.n++; st.lenSum += a.length; st.lenMax = Math.max(st.lenMax, a.length); if (!a.length) st.empty++;
    for (const x of a.slice(0, 200)) st.items.observe(x, depth + 1);
  }

  _obj(o, depth) {
    const st = (this.obj ??= { n: 0, fields: new Map(), keyOverflow: false, keysPerObj: 0, tags: new Map(), fieldSets: new Map() });
    st.n++;
    const keys = Object.keys(o);
    st.keysPerObj += keys.length;
    for (const k of keys) {
      if (!st.fields.has(k)) { if (st.fields.size >= KEY_CAP) { st.keyOverflow = true; continue; } st.fields.set(k, new SchemaNode()); }
      st.fields.get(k).observe(o[k], depth + 1);
    }
    // Tagged-union evidence: for each low-cardinality string field, which field sets co-occur.
    const sig = keys.slice().sort().join('|');
    st.fieldSets.set(sig, (st.fieldSets.get(sig) ?? 0) + 1);
    if (st.fieldSets.size > 500) st.fieldSets = new Map([...st.fieldSets].sort((a, b) => b[1] - a[1]).slice(0, 200));
    for (const k of keys) {
      const v = o[k];
      if (typeof v !== 'string' || v.length > 48) continue;
      let t = st.tags.get(k);
      if (t === null) continue;
      if (!t) { t = new Map(); st.tags.set(k, t); }
      let g = t.get(v);
      if (!g) { if (t.size >= TAG_MAX_VALUES) { st.tags.set(k, null); continue; } g = { n: 0, keys: new Map() }; t.set(v, g); }
      g.n++;
      for (const kk of keys) if (kk !== k) g.keys.set(kk, (g.keys.get(kk) ?? 0) + 1);
    }
  }

  // ------------------------------------------------------------------------------------------
  describe(name = '$') {
    const total = this.count || 1;
    const kinds = Object.entries(this.kinds).sort((a, b) => b[1] - a[1]);
    const out = { path: name, count: this.count, kinds: Object.fromEntries(kinds), nullable: !!this.kinds.null };
    const main = kinds.filter(([k]) => k !== 'null');
    out.type = main.length === 0 ? 'null' : main.length === 1 ? main[0][0] : (main.every(([k]) => k === 'integer' || k === 'number') ? 'number' : 'union');
    if (out.type === 'union') out.union = main.map(([k, n]) => ({ kind: k, share: +(n / total).toFixed(3) }));
    if (this.str) out.string = describeString(this.str);
    if (this.num) out.number = describeNumber(this.num);
    if (this.bool) out.boolean = { trueShare: +(this.bool.t / (this.bool.t + this.bool.f)).toFixed(3) };
    if (this.arr) out.array = { avgLen: +(this.arr.lenSum / this.arr.n).toFixed(2), maxLen: this.arr.lenMax, emptyShare: +(this.arr.empty / this.arr.n).toFixed(3), items: this.arr.items.describe(`${name}[*]`) };
    if (this.obj) { const od = describeObject(this.obj, name); if (out.type === 'union') out.object = od; else Object.assign(out, od); }
    return out;
  }
}

function describeString(st) {
  const formats = {};
  for (const [f, n] of Object.entries(st.formats)) if (n / st.n >= 0.9) formats[f] = +(n / st.n).toFixed(3);
  const d = { n: st.n, avgLen: +(st.lenSum / st.n).toFixed(1), minLen: st.lenMin, maxLen: st.lenMax, formats, examples: st.examples };
  if (!st.overflow) {
    d.distinct = st.distinct.size;
    d.uniqueness = +(st.distinct.size / st.n).toFixed(3);
    // Enum: few distinct values, each repeated, short.
    if (st.distinct.size <= 12 && st.n >= Math.max(4, st.distinct.size * 2) && d.avgLen <= 40) d.enum = [...st.distinct].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ value: v, share: +(n / st.n).toFixed(3) }));
  } else { d.distinct = `>${DISTINCT_CAP}`; d.uniqueness = 1; }
  return d;
}

function describeNumber(st) {
  const d = { n: st.n, min: st.min, max: st.max, mean: +(st.sum / st.n).toFixed(3), examples: st.examples, changeRate: +(st.changes / Math.max(1, st.n - 1)).toFixed(3) };
  if (!st.overflow) { d.distinct = st.distinct.size; d.uniqueness = +(st.distinct.size / st.n).toFixed(3); } else { d.distinct = `>${DISTINCT_CAP}`; d.uniqueness = 1; }
  if (st.epochS / st.n >= 0.9) d.format = 'epoch_s'; else if (st.epochMs / st.n >= 0.9) d.format = 'epoch_ms';
  return d;
}

const looksLikeDynamicKey = (k) => /^\d+(\.\d+)*$/.test(k) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k) || /^[0-9a-f]{16,}$/i.test(k) || /^\d{4}-\d{2}-\d{2}/.test(k) || (/^[A-Za-z0-9_-]{16,}$/.test(k) && /\d/.test(k));

function describeObject(st, name) {
  const n = st.n;
  const keys = [...st.fields.keys()];
  const dynamicShare = keys.length ? keys.filter(looksLikeDynamicKey).length / keys.length : 0;
  const avgKeys = st.keysPerObj / n;
  // Map detection: many distinct keys relative to keys per object, or keys that look like ids.
  const isMap = st.keyOverflow || (keys.length >= 6 && dynamicShare >= 0.8) || (keys.length >= 20 && keys.length > avgKeys * 3);
  if (isMap) {
    const merged = new SchemaNode();
    for (const child of st.fields.values()) mergeInto(merged, child);
    return { type: 'map', map: { distinctKeys: keys.length + (st.keyOverflow ? '+' : ''), dynamicKeyShare: +dynamicShare.toFixed(3), sampleKeys: keys.slice(0, 5), values: merged.describe(`${name}[*]`) }, decision: { map: `keys look dynamic (${Math.round(dynamicShare * 100)}%) or vastly outnumber keys per object` } };
  }
  const fields = {};
  for (const [k, child] of st.fields) {
    const d = child.describe(`${name}.${k}`);
    d.presence = +(child.count / n).toFixed(3);
    d.required = child.count === n;
    fields[k] = d;
  }
  const out = { type: 'object', objects: n, fields };
  const tagged = detectTag(st, n);
  if (tagged) out.tagged = tagged;
  return out;
}

// A field is a discriminator when its values partition objects into groups whose field sets differ.
function detectTag(st, n) {
  let best = null;
  for (const [field, groups] of st.tags) {
    if (!groups || groups.size < 2) continue;
    const covered = [...groups.values()].reduce((a, g) => a + g.n, 0);
    if (covered / n < 0.9) continue;
    const sets = [...groups.entries()].map(([v, g]) => ({ value: v, n: g.n, keys: new Set([...g.keys].filter(([, c]) => c / g.n >= 0.5).map(([k]) => k)) }));
    let simSum = 0, pairs = 0;
    for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) { simSum += jaccard(sets[i].keys, sets[j].keys); pairs++; }
    const avgSim = pairs ? simSum / pairs : 1;
    const score = (1 - avgSim) * Math.min(1, covered / n);
    if (avgSim < 0.75 && (!best || score > best.score)) best = { field, score: +score.toFixed(3), avgFieldSetSimilarity: +avgSim.toFixed(3), variants: sets.sort((a, b) => b.n - a.n).map((s) => ({ value: s.value, share: +(s.n / n).toFixed(3), fields: [...s.keys].sort() })) };
  }
  return best;
}

function mergeInto(target, src) {
  // Approximate merge for map values: replay summary statistics structurally.
  target.count += src.count;
  for (const [k, c] of Object.entries(src.kinds)) target.kinds[k] = (target.kinds[k] ?? 0) + c;
  if (src.str) { const t = (target.str ??= { n: 0, lenSum: 0, lenMin: Infinity, lenMax: 0, distinct: new Map(), overflow: false, formats: {}, examples: [] }); t.n += src.str.n; t.lenSum += src.str.lenSum; t.lenMin = Math.min(t.lenMin, src.str.lenMin); t.lenMax = Math.max(t.lenMax, src.str.lenMax); for (const [f, c] of Object.entries(src.str.formats)) t.formats[f] = (t.formats[f] ?? 0) + c; if (!t.overflow && !src.str.overflow) for (const [v, c] of src.str.distinct) t.distinct.set(v, (t.distinct.get(v) ?? 0) + c); else t.overflow = true; if (t.distinct.size > DISTINCT_CAP) { t.overflow = true; t.distinct = new Map(); } for (const e of src.str.examples) if (t.examples.length < 3) t.examples.push(e); }
  if (src.num) { const t = (target.num ??= { n: 0, min: Infinity, max: -Infinity, sum: 0, distinct: new Set(), overflow: false, epochS: 0, epochMs: 0, changes: 0, last: undefined, examples: [] }); t.n += src.num.n; t.min = Math.min(t.min, src.num.min); t.max = Math.max(t.max, src.num.max); t.sum += src.num.sum; t.epochS += src.num.epochS; t.epochMs += src.num.epochMs; t.changes += src.num.changes; if (!t.overflow && !src.num.overflow) for (const v of src.num.distinct) t.distinct.add(v); else t.overflow = true; for (const e of src.num.examples) if (t.examples.length < 3) t.examples.push(e); }
  if (src.bool) { const t = (target.bool ??= { t: 0, f: 0 }); t.t += src.bool.t; t.f += src.bool.f; }
  if (src.arr) { const t = (target.arr ??= { n: 0, lenSum: 0, lenMax: 0, empty: 0, items: new SchemaNode() }); t.n += src.arr.n; t.lenSum += src.arr.lenSum; t.lenMax = Math.max(t.lenMax, src.arr.lenMax); t.empty += src.arr.empty; mergeInto(t.items, src.arr.items); }
  if (src.obj) { const t = (target.obj ??= { n: 0, fields: new Map(), keyOverflow: false, keysPerObj: 0, tags: new Map(), fieldSets: new Map() }); t.n += src.obj.n; t.keysPerObj += src.obj.keysPerObj; t.keyOverflow ||= src.obj.keyOverflow; for (const [k, c] of src.obj.fields) { if (!t.fields.has(k)) t.fields.set(k, new SchemaNode()); mergeInto(t.fields.get(k), c); } for (const [k, g] of src.obj.tags) { if (g === null) { t.tags.set(k, null); continue; } if (t.tags.get(k) === null) continue; const tg = t.tags.get(k) ?? new Map(); for (const [v, gg] of g) { const x = tg.get(v) ?? { n: 0, keys: new Map() }; x.n += gg.n; for (const [kk, c] of gg.keys) x.keys.set(kk, (x.keys.get(kk) ?? 0) + c); tg.set(v, x); } t.tags.set(k, tg); } }
}

export function jaccard(a, b) { if (!a.size && !b.size) return 1; let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); }

export function induce(values) { const n = new SchemaNode(); for (const v of values) n.observe(v); return n.describe(); }

// ---------------------------------------------------------------------------------------------
// Flattening, similarity and alignment (cross-endpoint / cross-site clustering, drift repair)
// ---------------------------------------------------------------------------------------------
export function flatten(desc, out = []) {
  if (!desc) return out;
  out.push(desc);
  if (desc.fields) for (const f of Object.values(desc.fields)) flatten(f, out);
  if (desc.object?.fields) for (const f of Object.values(desc.object.fields)) flatten(f, out);
  if (desc.array) flatten(desc.array.items, out);
  if (desc.map) flatten(desc.map.values, out);
  return out;
}

export const tokens = (name) => String(name).replace(/\[\*\]/g, '').split(/[.\s]/).pop().replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

const SYNONYMS = [
  ['id', 'uuid', 'key', 'identifier'], ['title', 'name', 'label', 'headline', 'subject'], ['text', 'content', 'body', 'message', 'value', 'description', 'summary'],
  ['created', 'createdat', 'timestamp', 'time', 'date', 'ts', 'inserted'], ['updated', 'modified', 'changed'], ['url', 'href', 'link', 'uri', 'permalink'],
  ['author', 'user', 'owner', 'by', 'creator', 'sender', 'from'], ['status', 'state', 'stage', 'phase'], ['count', 'total', 'num', 'number', 'amount'],
  ['price', 'cost', 'amount', 'value'], ['role', 'kind', 'type'], ['parent', 'thread', 'conversation', 'container'], ['done', 'completed', 'finished', 'closed'],
  ['assignee', 'owner', 'responsible'], ['due', 'deadline', 'dueat', 'duedate'],
];
const SYN = new Map();
SYNONYMS.forEach((g, i) => g.forEach((w) => { if (!SYN.has(w)) SYN.set(w, new Set()); SYN.get(w).add(i); }));
const synGroups = (toks) => { const s = new Set(); for (const t of toks) for (const g of SYN.get(t) ?? []) s.add(g); return s; };

export function nameSimilarity(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const ja = jaccard(new Set(ta), new Set(tb));
  if (ja === 1) return 1;
  const joinedA = ta.join(''), joinedB = tb.join('');
  if (joinedA === joinedB) return 0.95;
  const ga = synGroups([...ta, joinedA]), gb = synGroups([...tb, joinedB]);
  const sg = ga.size && gb.size ? jaccard(ga, gb) : 0;
  return Math.max(ja, sg * 0.85);
}

// Profile of a field's value distribution, comparable across sites regardless of naming.
export function valueSignature(d) {
  const f = d.string?.formats ?? {};
  return {
    kind: d.type === 'integer' ? 'number' : d.type,
    format: Object.keys(f)[0] ?? d.number?.format ?? null,
    long: (d.string?.avgLen ?? 0) > 40,
    unique: (d.string?.uniqueness ?? d.number?.uniqueness ?? 0) > 0.9,
    enum: !!d.string?.enum,
    volatile: (d.number?.changeRate ?? 0) > 0.3,
  };
}

export function valueSimilarity(a, b) {
  const sa = valueSignature(a), sb = valueSignature(b);
  let s = 0;
  if (sa.kind === sb.kind) s += 0.4; else if ((sa.kind === 'number' && sb.kind === 'string' && (b.string?.formats?.numeric_string)) || (sb.kind === 'number' && sa.kind === 'string' && a.string?.formats?.numeric_string)) s += 0.25;
  if (sa.format && sa.format === sb.format) s += 0.25; else if (!sa.format && !sb.format) s += 0.1;
  if (sa.long === sb.long) s += 0.1;
  if (sa.unique === sb.unique) s += 0.1;
  if (sa.enum === sb.enum) s += 0.08;
  if (sa.volatile === sb.volatile) s += 0.07;
  return Math.min(1, s);
}

// Align the fields of two object schemas (greedy maximum-weight matching on combined similarity).
export function alignFields(a, b, { minScore = 0.45 } = {}) {
  const fa = Object.entries(a.fields ?? {}), fb = Object.entries(b.fields ?? {});
  const cands = [];
  for (const [na, da] of fa) for (const [nb, db] of fb) {
    const ns = nameSimilarity(na, nb), vs = valueSimilarity(da, db);
    const score = 0.55 * ns + 0.45 * vs;
    if (score >= minScore) cands.push({ a: na, b: nb, score: +score.toFixed(3), name: +ns.toFixed(3), value: +vs.toFixed(3) });
  }
  cands.sort((x, y) => y.score - x.score);
  const usedA = new Set(), usedB = new Set(), pairs = [];
  for (const c of cands) { if (usedA.has(c.a) || usedB.has(c.b)) continue; usedA.add(c.a); usedB.add(c.b); pairs.push(c); }
  return { pairs, unmatchedA: fa.map(([n]) => n).filter((n) => !usedA.has(n)), unmatchedB: fb.map(([n]) => n).filter((n) => !usedB.has(n)) };
}

// Structural similarity between two object schemas in [0,1].
export function schemaSimilarity(a, b) {
  if (!a?.fields || !b?.fields) return 0;
  const { pairs } = alignFields(a, b);
  const na = Object.keys(a.fields).length, nb = Object.keys(b.fields).length;
  const matched = pairs.reduce((s, p) => s + p.score, 0);
  return +(2 * matched / (na + nb)).toFixed(3);
}

// Schema evolution between two descriptions of the "same" object: drift and repair proposals.
export function schemaDiff(oldD, newD) {
  const of = oldD?.fields ?? {}, nf = newD?.fields ?? {};
  const removed = Object.keys(of).filter((k) => !(k in nf));
  const added = Object.keys(nf).filter((k) => !(k in of));
  const typeChanged = Object.keys(of).filter((k) => k in nf && of[k].type !== nf[k].type).map((k) => ({ field: k, from: of[k].type, to: nf[k].type }));
  const presenceDrop = Object.keys(of).filter((k) => k in nf && of[k].presence - nf[k].presence > 0.3).map((k) => ({ field: k, from: of[k].presence, to: nf[k].presence }));
  // Repair: removed field likely renamed to an added field with similar values (and similar name).
  const repairs = [];
  if (removed.length && added.length) {
    const sub = (d, keys) => ({ fields: Object.fromEntries(keys.map((k) => [k, d.fields[k]])) });
    const al = alignFields(sub(oldD, removed), sub(newD, added), { minScore: 0.35 });
    for (const p of al.pairs) repairs.push({ from: p.a, to: p.b, confidence: +(0.4 * p.value + 0.6 * Math.max(p.value * 0.8, p.score)).toFixed(3), basis: { nameSimilarity: p.name, valueSimilarity: p.value } });
  }
  return { removed, added, typeChanged, presenceDrop, repairs, drifted: !!(removed.length || typeChanged.length || presenceDrop.length) };
}
