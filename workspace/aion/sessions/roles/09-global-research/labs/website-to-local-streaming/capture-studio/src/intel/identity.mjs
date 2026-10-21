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

export function resolveType(type, { mPrior = 0.92, threshold } = {}) {
  const inst = type.instances;
  if (type.key && !type.key.weak) {
    const by = new Map();
    inst.forEach((i, n) => { const v = i.obj[type.key.field]; const k = v === undefined || v === null ? `__missing_${n}` : String(v); if (!by.has(k)) by.set(k, []); by.get(k).push(n); });
    return buildEntities(type, by, 'key', { field: type.key.field, keyScore: type.key.score });
  }
  return linkage(type, { mPrior, threshold });
}

export function linkage(type, { mPrior = 0.92, threshold, sample = 3000 } = {}) {
  const inst = type.instances;
  const n = inst.length;
  const fields = type.fields.filter((f) => ['string', 'integer', 'number', 'boolean'].includes(f.type) && (f.presence ?? 1) >= 0.5).map((f) => f.name);
  if (n < 2 || !fields.length) return buildEntities(type, new Map(inst.map((_, i) => [String(i), [i]])), 'singleton', {});
  // Estimate u (chance agreement) per field from random pairs.
  const rnd = mulberry(1234);
  const u = {}, m = {};
  for (const f of fields) {
    let ag = 0, tot = 0;
    for (let s = 0; s < Math.min(sample, n * (n - 1) / 2); s++) { const a = Math.floor(rnd() * n), b = Math.floor(rnd() * n); if (a === b) continue; tot++; ag += agree(inst[a].obj[f], inst[b].obj[f]); }
    u[f] = Math.min(0.5, Math.max(0.005, tot ? ag / tot : 0.1));
    m[f] = mPrior;
  }
  const wAgree = Object.fromEntries(fields.map((f) => [f, Math.log2(m[f] / u[f])]));
  const wDis = Object.fromEntries(fields.map((f) => [f, Math.log2((1 - m[f]) / (1 - u[f]))]));
  const maxScore = fields.reduce((a, f) => a + Math.max(0, wAgree[f]), 0);
  const T = threshold ?? maxScore * 0.5;
  // Blocking on the most discriminating field (highest agree weight), by normalised prefix.
  const blockField = [...fields].sort((a, b) => wAgree[b] - wAgree[a])[0];
  const blocks = new Map();
  inst.forEach((i, idx) => {
    const v = norm(i.obj[blockField]);
    const keys = typeof v === 'string' && v.length > 24 ? [...shingles(v)].slice(0, 3) : [String(v).slice(0, 12)];
    for (const k of keys) { if (!blocks.has(k)) blocks.set(k, []); blocks.get(k).push(idx); }
  });
  const uf = new UnionFind(n);
  let compared = 0, linked = 0;
  for (const idxs of blocks.values()) {
    if (idxs.length > 400) continue; // degenerate block: no information
    for (let a = 0; a < idxs.length; a++) for (let b = a + 1; b < idxs.length; b++) {
      compared++;
      let s = 0;
      for (const f of fields) { const x = inst[idxs[a]].obj[f], y = inst[idxs[b]].obj[f]; if (x === undefined || y === undefined) continue; s += agree(x, y) ? wAgree[f] : wDis[f]; }
      if (s >= T) { uf.union(idxs[a], idxs[b]); linked++; }
    }
  }
  const clusters = new Map();
  for (let i = 0; i < n; i++) { const r = String(uf.find(i)); if (!clusters.has(r)) clusters.set(r, []); clusters.get(r).push(i); }
  return buildEntities(type, clusters, 'linkage', { fields, u: round(u), weights: round(wAgree), threshold: +T.toFixed(2), blockField, compared, linked });
}

const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(3)]));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function resolveModel(model, opts) { return model.types.map((t) => resolveType(t, opts)); }
