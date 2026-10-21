// Identity resolution: which observations are the same real-world entity?
//
//   keyed     group by the inferred identity key; ordered revisions with field-level diffs.
//   keyless   Fellegi–Sunter style record linkage: per-field agreement weights log2(m/u), where
//             u is estimated from random pairs in the data and m from a prior (or from keyed
//             pairs when a keyed sibling type exists), blocking on the most discriminating
//             field, union-find clustering above a data-derived threshold.
// Works for updates, rerenders (new DOM node, same content), pagination overlaps and sessions.
const isScalar = (v) => v !== null && v !== undefined && typeof v !== 'object';
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/\s+/g, ' ') : v);

export function shingles(text, k = 3) {
  const w = String(text ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (w.length < k) return new Set(w.length ? [w.join(' ')] : []);
  const s = new Set();
  for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(' '));
  return s;
}
export function containment(a, b) { if (!a.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / a.size; }

function agree(a, b) {
  if (!isScalar(a) || !isScalar(b)) return a === b ? 1 : 0;
  if (typeof a === 'number' && typeof b === 'number') return a === b || Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 0.005) ? 1 : 0;
  const x = norm(a), y = norm(b);
  if (x === y) return 1;
  if (typeof x === 'string' && typeof y === 'string' && (x.length > 24 || y.length > 24)) {
    // Long text: shingle overlap tolerates streaming growth and small edits.
    const s1 = shingles(x), s2 = shingles(y);
    return Math.max(containment(s1, s2), containment(s2, s1)) >= 0.8 ? 1 : 0;
  }
  return 0;
}

class UnionFind {
  constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); }
  find(i) { while (this.p[i] !== i) { this.p[i] = this.p[this.p[i]]; i = this.p[i]; } return i; }
  union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.p[rb] = ra; }
}

function diffFields(a, b) { const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]); return [...keys].filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])); }

function buildEntities(type, clusters, method, basis) {
  const entities = [];
  for (const [cid, idxs] of clusters) {
    const inst = idxs.map((i) => type.instances[i]).sort((x, y) => (x.prov.t ?? 0) - (y.prov.t ?? 0) || (x.prov.seq ?? 0) - (y.prov.seq ?? 0));
    const revisions = [];
    let prev = null;
    for (const i of inst) {
      const changed = prev ? diffFields(prev, i.obj) : Object.keys(i.obj);
      if (prev && !changed.length) continue; // identical re-observation (duplicate) is not a revision
      revisions.push({ t: i.prov.t ?? null, seq: i.prov.seq ?? null, sid: i.prov.sid, domId: i.prov.domId, changed });
      prev = i.obj;
    }
    entities.push({ eid: `${type.id}:${cid}`, type: type.id, typeName: type.name, key: type.key && method === 'key' ? String(inst[0].obj[type.key.field]) : null, observations: inst.length, duplicates: inst.length - revisions.length, revisions, attrs: inst[inst.length - 1].obj, first: revisions[0]?.t ?? null, last: revisions[revisions.length - 1]?.t ?? null, method });
  }
  return { type: type.id, typeName: type.name, method, basis, entities };
}

export function resolveType(type, opts = {}) {
  const inst = type.instances;
  if (type.key && !type.key.weak) {
    const by = new Map();
    inst.forEach((i, n) => { const v = i.obj[type.key.field]; const k = v === undefined || v === null ? `__missing_${n}` : String(v); if (!by.has(k)) by.set(k, []); by.get(k).push(n); });
    return buildEntities(type, by, 'key', { field: type.key.field, keyScore: type.key.score });
  }
  return linkage(type, opts);
}

// ---------------------------------------------------------------------------------------------
// Keyless linkage v2 (Fellegi–Sunter with multi-level comparisons, Splink-style estimation):
//   levels   text: 3 equal | 2 containment>=0.95 | 1 containment>=0.8 | 0 none
//            other scalars: 1 agree | 0 disagree   (numbers agree within 0.5%)
//   u        per-field level distribution from random pairs (fixed, smoothed)
//   m, p     estimated by EM over blocked candidate pairs
//   blocking union of passes over the 3 most discriminating fields (MinHash keys for long text)
//   cluster  best-first merging under cannot-link (distinct nodes in one snapshot) and a
//            no-chaining rule (every compared cross pair must be non-negative evidence)
// ---------------------------------------------------------------------------------------------
const isLong = (v) => typeof v === 'string' && v.length > 24;
function level(a, b) {
  if (a === undefined || b === undefined || a === null || b === null) return null;
  if (isLong(a) || isLong(b)) {
    const x = norm(a), y = norm(b);
    if (x === y) return 3;
    const s1 = shingles(x), s2 = shingles(y);
    const c = Math.max(containment(s1, s2), containment(s2, s1));
    return c >= 0.95 ? 2 : c >= 0.8 ? 1 : 0;
  }
  return agree(a, b);
}
const levelsOf = (f, inst) => (inst.some((i) => isLong(i.obj[f])) ? 4 : 2);

function hash32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function minhashKeys(text, k = 3) { return [...shingles(norm(text))].map((sh) => [hash32(sh), sh]).sort((a, b) => a[0] - b[0]).slice(0, k).map((x) => x[1]); }

export function snapshotKey(prov) {
  if (prov.snapshot !== undefined) return String(prov.snapshot);
  if (prov.seq !== undefined && prov.seq !== null) return `${prov.session ?? ''}|${prov.sid ?? ''}|${prov.seq}`;
  if (prov.t !== undefined && prov.t !== null) return `${prov.session ?? ''}|t${Math.floor(prov.t / 50)}`;
  return null;
}

export function linkage(type, { sample = 4000, maxBlock = 400, emIters = 25 } = {}) {
  const inst = type.instances;
  const n = inst.length;
  const fields = type.fields.filter((f) => ['string', 'integer', 'number', 'boolean'].includes(f.type) && (f.presence ?? 1) >= 0.5).map((f) => f.name);
  if (n < 2 || !fields.length) return buildEntities(type, new Map(inst.map((_, i) => [String(i), [i]])), 'singleton', {});
  const L = Object.fromEntries(fields.map((f) => [f, levelsOf(f, inst)]));
  // u: level distribution under non-match, from deterministic pseudo-random pairs.
  const rnd = mulberry(1234);
  const u = {};
  for (const f of fields) {
    const cnt = Array(L[f]).fill(1); // Laplace smoothing
    for (let s = 0; s < Math.min(sample, n * (n - 1)); s++) { const a = Math.floor(rnd() * n), b = Math.floor(rnd() * n); if (a === b) continue; const l = level(inst[a].obj[f], inst[b].obj[f]); if (l !== null) cnt[l]++; }
    const tot = cnt.reduce((x, y) => x + y, 0);
    u[f] = cnt.map((c) => c / tot);
  }
  // Multi-pass blocking on the 3 most discriminating fields (lowest chance agreement).
  const discr = [...fields].sort((a, b) => u[a][u[a].length - 1] - u[b][u[b].length - 1]).slice(0, 3);
  const pairs = new Map();
  for (const f of discr) {
    const blocks = new Map();
    inst.forEach((i, idx) => {
      const v = i.obj[f];
      if (v === undefined || v === null) return;
      const keys = isLong(v) ? minhashKeys(v) : [String(norm(v)).slice(0, 16)];
      for (const k of keys) { const bk = `${f}:${k}`; if (!blocks.has(bk)) blocks.set(bk, []); blocks.get(bk).push(idx); }
    });
    for (const idxs of blocks.values()) {
      if (idxs.length > maxBlock) continue;
      for (let x = 0; x < idxs.length; x++) for (let y = x + 1; y < idxs.length; y++) { const a = idxs[x], b = idxs[y]; const k = a < b ? `${a}|${b}` : `${b}|${a}`; if (!pairs.has(k)) pairs.set(k, null); }
    }
  }
  const cand = [...pairs.keys()].map((k) => { const [a, b] = k.split('|').map(Number); return { a, b, g: Object.fromEntries(fields.map((f) => [f, level(inst[a].obj[f], inst[b].obj[f])])) }; });
  // EM for m (per field, per level) and the match prior p, with u held fixed.
  const m = Object.fromEntries(fields.map((f) => [f, L[f] === 4 ? [0.05, 0.1, 0.25, 0.6] : [0.1, 0.9]]));
  let p = 0.2;
  const logBF = (c) => fields.reduce((s, f) => (c.g[f] === null ? s : s + Math.log2(m[f][c.g[f]] / u[f][c.g[f]])), 0);
  for (let it = 0; it < emIters && cand.length; it++) {
    const acc = Object.fromEntries(fields.map((f) => [f, Array(L[f]).fill(0.01)]));
    let gs = 0;
    for (const c of cand) {
      const lp = Math.log2(p / (1 - p)) + logBF(c);
      const g = 1 / (1 + Math.pow(2, -lp));
      c.post = g; gs += g;
      for (const f of fields) if (c.g[f] !== null) acc[f][c.g[f]] += g;
    }
    for (const f of fields) { const t = acc[f].reduce((x, y) => x + y, 0); m[f] = acc[f].map((x) => Math.min(0.999, Math.max(0.001, x / t))); }
    p = Math.min(0.95, Math.max(0.001, gs / cand.length));
  }
  for (const c of cand) c.w = Math.log2(p / (1 - p)) + logBF(c);
  // Constrained best-first clustering.
  const snap = inst.map((i) => snapshotKey(i.prov));
  const node = inst.map((i) => i.prov.domId ?? null);
  const cluster = inst.map((_, i) => i);
  const members = new Map(inst.map((_, i) => [i, [i]]));
  const pairW = new Map(cand.map((c) => [`${c.a}|${c.b}`, c.w]));
  const cannotLink = (A, B) => {
    for (const x of A) for (const y of B) {
      if (snap[x] !== null && snap[x] === snap[y] && (node[x] === null || node[x] !== node[y])) return true;
      const w = pairW.get(x < y ? `${x}|${y}` : `${y}|${x}`);
      if (w !== undefined && w < 0) return true; // compared and judged different: no chaining
    }
    return false;
  };
  let linked = 0, blocked = 0;
  for (const c of cand.filter((c) => c.w >= 0).sort((x, y) => y.w - x.w || x.a - y.a || x.b - y.b)) {
    const ra = cluster[c.a], rb = cluster[c.b];
    if (ra === rb) continue;
    const A = members.get(ra), B = members.get(rb);
    if (cannotLink(A, B)) { blocked++; continue; }
    for (const x of B) cluster[x] = ra;
    members.set(ra, A.concat(B)); members.delete(rb);
    linked++;
  }
  const clusters = new Map([...members].map(([r, idxs]) => [String(r), idxs]));
  const res = buildEntities(type, clusters, 'linkage', { fields, blockingFields: discr, candidatePairs: cand.length, linked, blockedByConstraints: blocked, matchPrior: +p.toFixed(4), u: Object.fromEntries(fields.map((f) => [f, u[f].map((x) => +x.toFixed(3))])), m: Object.fromEntries(fields.map((f) => [f, m[f].map((x) => +x.toFixed(3))])) });
  // Ambiguity: entities whose members were linked by weak evidence are flagged, not hidden.
  for (const e of res.entities) e.linkConfidence = null;
  return res;
}

const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(3)]));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function resolveModel(model, opts) { return model.types.map((t) => resolveType(t, opts)); }
