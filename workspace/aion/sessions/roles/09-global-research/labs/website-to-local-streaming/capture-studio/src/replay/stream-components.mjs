// Builds the kv document STREAM_COMPONENTS: for each response stream, which stream-map the events
// match and which UI component parts they build. Pure: no I/O, no clock, no randomness.
// Honest by construction: a stream with no best map gets mapId null and its candidate list, never a
// guessed map. Full unmapped detail stays out of the document (count plus a short sample only).
import { detectStreamMap, applyStreamMap } from '../profiles/stream-map.mjs';

export const STREAM_COMPONENTS_SCHEMA = 'capture-studio.stream-components/1';
export const COMPONENT_TEXT_CAP = 2000;
export const UNMAPPED_SAMPLE_SIZE = 5;

const componentEntry = (c) => {
  const full = typeof c.text === 'string' ? c.text : '';
  const truncated = full.length > COMPONENT_TEXT_CAP;
  return {
    componentKey: c.componentKey ?? null,
    component: c.component,
    text: truncated ? full.slice(0, COMPONENT_TEXT_CAP) : full,
    textTruncated: truncated,
    textLength: full.length,
    opened: c.opened,
    closed: c.closed,
  };
};

// eventsBySid: Map<sid, { events: object[], omitted: number }>, events in raw order.
// omitted = events that were evicted from the in-memory window (text may then be incomplete).
// componentsImpl(map, events) must behave like applyStreamMap; an exception propagates to the caller.
export function buildStreamComponents(eventsBySid, { componentsImpl = applyStreamMap } = {}) {
  const ordered = [...eventsBySid.entries()]
    .filter(([, v]) => Array.isArray(v.events) && v.events.length > 0)
    .sort(([a, va], [b, vb]) => (Number(va.events[0].seq) - Number(vb.events[0].seq)) || (a < b ? -1 : a > b ? 1 : 0));

  const streams = [];
  for (const [sid, { events, omitted }] of ordered) {
    const eventsOmitted = omitted ?? 0;
    const { map, candidates } = detectStreamMap(events);
    if (!map) {
      streams.push({ sid, mapId: null, candidates, eventsOmitted });
      continue;
    }
    const r = componentsImpl(map, events);
    streams.push({
      sid,
      mapId: map.id,
      eventsOmitted,
      stats: r.stats,
      components: r.components.map(componentEntry),
      unmappedCount: r.unmapped.length,
      unmappedSample: r.unmapped.slice(0, UNMAPPED_SAMPLE_SIZE).map((u) => ({ seq: u.seq, reason: u.reason })),
    });
  }

  const mapped = streams.filter((s) => s.mapId !== null);
  const totals = {
    streams: streams.length,
    mapped: mapped.length,
    noMap: streams.length - mapped.length,
    components: mapped.reduce((a, s) => a + s.components.length, 0),
    unmappedCount: mapped.reduce((a, s) => a + s.unmappedCount, 0),
    eventsOmitted: streams.reduce((a, s) => a + s.eventsOmitted, 0),
  };
  return { schema: STREAM_COMPONENTS_SCHEMA, streams, totals };
}
