// Observation corpus: the discovery engine's input, built from any recorded session.
// Every sample keeps provenance back to raw evidence (session, stream, seq, time, DOM node).
import { templateUrl } from '../shapes/infer.mjs';

const PATCH_DIALECTS = new Set(['path-ops', 'json-patch', 'typed-events']);

export function discriminatorOf(ev) {
  if (ev.envelope?.headers?.length) { const h = ev.envelope.headers.filter((x) => !/^\d+$/.test(x)); if (h.length) return h.slice(0, 2).join('|'); }
  if (ev.event && ev.event !== 'message') return ev.event;
  const j = ev.json;
  if (j && typeof j === 'object' && !Array.isArray(j)) for (const k of ['type', 'event', 'kind', 'op', 'action', 'method', 'object', '__typename']) if (typeof j[k] === 'string' && j[k].length <= 48) return j[k];
  return Array.isArray(j) ? '[array]' : '(object)';
}

export function buildCorpus(reducer, { domTurns = [], domItems = [], session } = {}) {
  const samples = [];
  const patchGroups = new Set();
  for (const s of reducer.streams.values()) {
    const endpoint = `${s.method ?? (s.kind === 'ws' ? 'WS' : 'GET')} ${templateUrl(s.url)}`;
    const dialects = [...(s._delta?.detected ?? [])];
    const isPatch = dialects.some((d) => PATCH_DIALECTS.has(d));
    for (const e of s._events ?? []) {
      if (e.json === undefined || e.json === null || typeof e.json !== 'object') continue;
      const group = `${endpoint} :: ${discriminatorOf(e)}`;
      if (isPatch) patchGroups.add(group);
      samples.push({ value: e.json, source: { kind: 'event', group, endpoint, sid: s.sid, seq: e.seq, t: e.t, session: session?.id } });
    }
    if (s._delta?.revisions > 0 && s._delta.doc && typeof s._delta.doc === 'object' && isPatch) {
      samples.push({ value: s._delta.doc, source: { kind: 'assembled', group: `${endpoint} :: (assembled)`, endpoint, sid: s.sid, seq: null, t: s.endT ?? s.lastChunkT, session: session?.id, revisions: s._delta.revisions, final: s.status === 'complete' } });
    }
  }
  for (const t of domTurns) {
    // DOM node handles, positions and capture flags are provenance, not entity data.
    const { blocks, domId, index, roleAttribute, truncated, redactions, ...rest } = t;
    if (rest.id === domId) delete rest.id;
    samples.push({ value: { ...rest, blockTypes: [...new Set((blocks ?? []).map((b) => b.type))] }, source: { kind: 'dom', group: 'page :: turns', domId, index, session: session?.id } });
  }
  for (const it of domItems) samples.push({ value: it.value, source: { kind: 'dom', group: `page :: ${it.group}`, domId: it.domId, session: session?.id } });
  return { samples, patchGroups };
}
