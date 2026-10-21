import { foldRevision } from './history.mjs';

// Canonical temporal evidence graph.
//
// Three strata, kept separate:
//   observations  immutable references into raw evidence (session, seq, sid, byte span, dom id)
//   entities      semantic nodes with time-indexed versioned state (event-sourced revisions)
//   edges         typed relations (contains, references, rendered_as, caused, same_as, ...)
//                 each with confidence, status (hypothesis | confirmed | rejected) and evidence
// Unknown/evolving schemas are fine: entity state is whatever attributes were observed.
// stateAt(t) replays revisions to reconstruct the semantic state at any moment.
export class TemporalGraph {
  constructor() { this.nodes = new Map(); this.edges = new Map(); this.changes = []; this.types = new Map(); }

  addType(t) { this.types.set(t.id, { id: t.id, name: t.name, key: t.key?.field ?? null, confidence: t.confidence, fields: t.fields.map((f) => ({ name: f.name, type: f.type, role: f.role, roleConfidence: f.roleConfidence })) }); }

  upsertEntity({ eid, type, typeName, key, attrs = {}, t, evidence, changed, removed = [] }) {
    let n = this.nodes.get(eid);
    if (!n) { n = { eid, type, typeName, key, attrs: {}, history: [], firstT: null, lastT: null }; this.nodes.set(eid, n); }
    const before = n.attrs;
    n.attrs = foldRevision({ ...n.attrs }, { values: attrs, removed });
    if (Number.isFinite(t)) {
      n.firstT = n.firstT === null ? t : Math.min(n.firstT, t);
      n.lastT = n.lastT === null ? t : Math.max(n.lastT, t);
    }
    const rev = { t, changed: changed ?? Object.keys(attrs).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(attrs[k])), values: attrs, ...(removed.length ? { removed: [...removed] } : {}), evidence };
    n.history.push(rev);
    this.changes.push({ t, eid, revision: n.history.length, changed: rev.changed });
    return n;
  }

  relate({ kind, from, to, confidence, status = 'hypothesis', evidence, t, attrs }) {
    const id = `${kind}:${from}->${to}`;
    const prev = this.edges.get(id);
    if (prev && prev.confidence >= confidence) return prev;
    const startedAt = prev?.t ?? (Number.isFinite(t) ? t : null);
    const statusHistory = prev?.statusHistory ?? (prev ? [{ t: prev.t ?? null, status: prev.status }] : [{ t: startedAt, status }]);
    const e = { id, kind, from, to, confidence: +(+confidence).toFixed(3),
      status: prev?.status ?? status, statusHistory, evidence, t: startedAt, ...(attrs ? { attrs } : {}) };
    this.edges.set(id, e);
    return e;
  }

  // Corrections apply at a known time. Never mutate the meaning of an earlier stateAt(t).
  setEdgeStatus(id, status, at = Date.now()) {
    const e = this.edges.get(id);
    if (!e || e.status === status) return e;
    if (!['hypothesis', 'confirmed', 'rejected'].includes(status)) throw new Error('Invalid edge status.');
    const when = Number.isFinite(at) ? at : Date.now();
    e.statusHistory ??= [{ t: e.t ?? null, status: e.status }];
    e.statusHistory.push({ t: Math.max(when, e.t ?? when), status });
    e.status = status;
    return e;
  }

  stateAt(t) {
    const nodes = [];
    for (const n of this.nodes.values()) {
      if (!Number.isFinite(n.firstT) || n.firstT > t) continue;
      const revs = n.history.filter((r) => Number.isFinite(r.t) && r.t <= t).sort((a, b) => a.t - b.t);
      // Materialise the attribute state as of t by folding revision values in order.
      const attrs = revs.reduce((acc, r) => foldRevision(acc, r), {});
      nodes.push({ eid: n.eid, typeName: n.typeName, key: n.key, revision: revs.length, latestChange: revs.at(-1)?.t ?? null, attrs });
    }
    const edges = [];
    for (const e of this.edges.values()) {
      // An undated hypothesis is visible in toJSON(), but is not a fact at an arbitrary past time.
      if (!Number.isFinite(e.t) || e.t > t) continue;
      const statuses = (e.statusHistory ?? [{ t: e.t, status: e.status }])
        .filter((h) => Number.isFinite(h.t) && h.t <= t).sort((a, b) => a.t - b.t);
      const historicalStatus = statuses.at(-1)?.status;
      if (!historicalStatus || historicalStatus === 'rejected') continue;
      edges.push({ ...e, status: historicalStatus });
    }
    return { t, nodes, edges };
  }

  neighbors(eid) { return [...this.edges.values()].filter((e) => e.from === eid || e.to === eid); }

  toJSON() {
    return { types: [...this.types.values()], nodes: [...this.nodes.values()], edges: [...this.edges.values()], stats: { nodes: this.nodes.size, edges: this.edges.size, changes: this.changes.length, byKind: countBy([...this.edges.values()], 'kind'), byStatus: countBy([...this.edges.values()], 'status') } };
  }
}

const countBy = (arr, k) => arr.reduce((a, x) => ((a[x[k]] = (a[x[k]] ?? 0) + 1), a), {});
const nFromHistory = (history) => history.reduce((state, rev) => foldRevision(state, rev), {});

// Build the graph from discovery + identity + correlation outputs.
export function buildGraph({ model, resolutions, renderedHyps = [], actionHyps = [], session }) {
  const g = new TemporalGraph();
  for (const t of model.types) g.addType(t);
  const keyIndex = new Map(); // typeId|key -> eid
  for (const r of resolutions) for (const e of r.entities) {
    let first = true;
    for (const rev of e.revisions) {
      g.upsertEntity({ eid: e.eid, type: e.type, typeName: e.typeName, key: e.key, attrs: rev.values ?? (first ? e.attrs : {}), t: rev.t, changed: rev.changed, removed: rev.removed ?? [], evidence: { session: rev.session ?? session?.id, seq: rev.seq, sid: rev.sid, domId: rev.domId, t: rev.t } });
      first = false;
    }
    if (!e.revisions.length) g.upsertEntity({ eid: e.eid, type: e.type, typeName: e.typeName, key: e.key, attrs: e.attrs, t: e.first });
    // Current state = folded state; also carry the entity's identity confidence.
    const node = g.nodes.get(e.eid);
    node.attrs = e.revisions.some((r) => r.removed?.length) ? nFromHistory(node.history) : e.attrs; node.confidence = e.confidence; node.confidenceBasis = e.confidenceBasis; node.idBasis = e.idBasis; node.anchor = e.anchor;
    if (e.key !== null) keyIndex.set(`${e.type}|${e.scope}|${e.key}`, e.eid);
  }
  // Instance-level reference edges from type-level inclusion dependencies.
  for (const rel of model.relationships) {
    if (rel.kind !== 'references') continue;
    const src = resolutions.find((r) => r.type === rel.from);
    for (const e of src?.entities ?? []) {
      const v = e.attrs?.[rel.field];
      if (v === undefined || v === null) continue;
      const target = keyIndex.get(`${rel.to}|${e.scope}|${String(v)}`);
      if (target) g.relate({ kind: 'references', from: e.eid, to: target, confidence: rel.confidence, evidence: { relationship: rel.id, field: rel.field }, t: e.first });
    }
  }
  // Composition at instance level: same observation, nested path.
  for (const rel of model.relationships) {
    if (rel.kind !== 'contains') continue;
    const parent = resolutions.find((r) => r.type === rel.from), child = resolutions.find((r) => r.type === rel.to);
    if (!parent || !child) continue;
    const bySeq = new Map();
    for (const e of parent.entities) for (const rv of e.revisions) if (rv.seq !== null && rv.seq !== undefined) bySeq.set(`${rv.session ?? ''}|${rv.sid}|${rv.seq}`, e.eid);
    for (const e of child.entities) for (const rv of e.revisions) { const p = bySeq.get(`${rv.session ?? ''}|${rv.sid}|${rv.seq}`); if (p) g.relate({ kind: 'contains', from: p, to: e.eid, confidence: rel.confidence, evidence: { relationship: rel.id }, t: rv.t }); }
  }
  for (const h of renderedHyps) if (h.to) g.relate({ kind: 'rendered_as', from: h.from.entity ?? `stream:${h.from.stream}`, to: `dom:${h.to.element}`, confidence: h.score, status: h.status === 'likely' ? 'hypothesis' : h.status, evidence: h.features, t: h.t ?? null });
  for (const h of actionHyps) g.relate({ kind: 'preceded', from: `action:${h.from.actionSeq}`, to: `stream:${h.to.sid}`, confidence: h.score, status: h.status === 'likely' ? 'hypothesis' : h.status, evidence: { ...h.features, scoredRelation: h.relation, score: h.score }, t: h.t ?? null });
  return g;
}
