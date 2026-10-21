// Offline reconstruction from the raw log: datasets, shapes, receipt, time travel, raw bytes.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { StreamReducer, transportOf } from './reducer.mjs';
import { ShapeInferencer, templateUrl } from '../shapes/infer.mjs';
import { ruleMatchesEvent, extractRecords, extractFromAssembled } from '../shapes/extract.mjs';
import { collectorSourceSha } from '../config.mjs';
import { extractFamilyRecords, familyRecordsFromEvent } from '../families/families.mjs';
import { CorpusCollector } from '../intel/corpus.mjs';
import { siteOf } from '../profiles/profiles.mjs';
import { discoverModel, modelSummary } from '../intel/discover.mjs';
import { resolveModel } from '../intel/identity.mjs';
import { correlateRendered, correlateActions } from '../intel/correlate.mjs';
import { buildGraph } from '../intel/graph.mjs';
import { ScopedLearner } from '../intel/learn.mjs';

export async function derive(session, profile, { onProgress, families, learner } = {}) {
  // Fail closed during rebuild: old MODEL/entities must not appear to be current.
  const knowledgeRun = { schema: 'capture-studio.knowledge-status/1',
    status: 'deriving', startedAt: new Date().toISOString(), dataset: 'entities' };
  session.kv.set('KNOWLEDGE_STATUS', knowledgeRun);
  // Events kept in memory are bounded per stream (evidence + drift); the dataset keeps all of them.
  const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? 'auto', keepEvents: true, maxEventsPerStream: 400 });
  const shapes = new ShapeInferencer();
  const ds = {
    events: session.dataset('events'), streams: session.dataset('streams'), timeline: session.dataset('timeline'),
  };
  for (const d of Object.values(ds)) d.reset();
  const rules = profile?.records ?? [];
  const recordSets = new Map(rules.map((r) => [r.name, session.dataset(`records-${r.name}`)]));
  for (const d of recordSets.values()) d.reset();
  // "final" revision mode keeps only the latest record per identity; "all" streams every observation.
  const finals = new Map(rules.filter((r) => r.revisions === 'final' && r.key).map((r) => [r.name, new Map()]));
  const emit = (rule, recs) => { const f = finals.get(rule.name); if (!f) return recordSets.get(rule.name).push(recs); for (const r of recs) { const prev = f.get(r._key); f.set(r._key, { ...r, _revision: (prev?._revision ?? 0) + 1 }); } };
  let n = 0, batch = [];
  const flush = () => { if (batch.length) { ds.events.push(batch); batch = []; } };
  // Complete-evidence collectors: fed with EVERY decoded event (not the bounded in-memory window).
  let siteName = '';
  try { siteName = siteOf(new URL(session.meta?.target?.url).hostname); } catch { /* no target url */ }
  const corpus = new CorpusCollector({ session, site: siteName });
  const famEvents = {};
  for await (const rec of session.records()) {
    const evs = reducer.ingest(rec);
    for (const ev of evs) {
      batch.push(ev);
      const st = reducer.streams.get(ev.sid);
      corpus.addEvent(ev, st);
      for (const { dataset, record } of familyRecordsFromEvent(profile, ev, st, session)) (famEvents[dataset] ??= []).push(record);
      shapes.observeEvent(ev, st);
      for (const rule of rules) if (ruleMatchesEvent(rule, ev, st)) emit(rule, extractRecords(rule, ev, st));
    }
    if (batch.length > 500) flush();
    if (['action', 'nav', 'gap', 'run.start', 'run.end', 'lifecycle', 'done', 'fail', 'stream.armed', 'stream.arm_failed', 'ws.open', 'ws.close'].includes(rec.k)) {
      ds.timeline.push({ seq: rec.seq, t: rec.t, k: rec.k, sid: rec.sid, kind: rec.kind ?? rec.event, label: rec.target?.label, url: rec.url, reason: rec.reason, error: rec.error ?? rec.errorText });
    }
    if (++n % 5000 === 0) onProgress?.(n);
  }
  flush();
  const summary = reducer.summary();
  ds.streams.push(summary.streams.map((s) => ({ ...s, endpoint: `${s.method ?? (s.kind === 'ws' ? 'WS' : 'GET')} ${templateUrl(s.url)}` })));
  for (const rule of rules.filter((r) => r.source === 'assembled')) {
    for (const s of reducer.streams.values()) recordSets.get(rule.name).push(extractFromAssembled(rule, s._delta.doc, s));
  }
  for (const [name, f] of finals) recordSets.get(name).push([...f.values()]);
  const domInspect = session.kv.get('DOM_INSPECT') ?? null;
  const domTurns = session.kv.get('DOM_TURNS') ?? [];
  const familyList = families ? families.names().map((n) => families.load(n)) : [];
  const report = shapes.report(reducer, { families: familyList, profile, domInspect, domTurns, calibrator: learner?.calibrator });
  session.kv.set('SHAPES', report);
  corpus.addDomTurns(domTurns);
  const corpusResult = corpus.result(reducer);
  session.kv.set('CORPUS_STATS', corpusResult.stats);
  const familySets = extractFamilyRecords(profile, reducer, { session, domTurns, eventRecords: famEvents });
  const familyCounts = {};
  for (const name of listFamilyDatasets(session)) session.dataset(name).reset();
  for (const [name, recs] of Object.entries(familySets)) { session.dataset(name).push(recs); familyCounts[name] = recs.length; }
  const assembled = {};
  for (const s of reducer.streams.values()) if (s._delta.revisions > 0) assembled[s.sid] = { endpoint: `${s.method ?? 'GET'} ${templateUrl(s.url)}`, revisions: s._delta.revisions, dialects: [...s._delta.detected], doc: s._delta.doc };
  session.kv.set('ASSEMBLED', assembled);
  session.kv.set('DOM_BLOCKS', [...reducer.dom.blocks.values()]);
  const receipt = buildReceipt(session, reducer, summary);
  receipt.fidelity_breakdown = fidelityBreakdown(reducer, summary, n);
  receipt.quality = Object.fromEntries(Object.entries(report.quality).filter(([k]) => k !== 'assumptions').map(([k, v]) => [k, v.score]));
  receipt.family = report.families[0] ? { best: report.families[0].family, score: report.families[0].score, linked: profile?.family ?? null } : null;
  session.kv.set('RECEIPT', receipt);

  // ---- Knowledge layer: corpus -> model -> entities -> hypotheses -> temporal graph. ----
  // Isolated: any failure is recorded (MODEL.error / MODEL.stage) and never affects the outputs
  // written above. Raw is never touched; everything here is recomputable from raw.
  const resetEntities = () => session.dataset('entities').reset();
  resetEntities();
  let knowledge, stage = 'discover';
  try {
    const L = learner ?? new ScopedLearner();
    const model = discoverModel(corpusResult.samples, { learner: L, ctx: { site: siteName, family: profile?.family ?? undefined }, families: familyList, patchGroups: corpusResult.patchGroups });
    stage = 'identity';
    const resolutions = resolveModel(model);
    const entities = resolutions.flatMap((r) => r.entities);
    stage = 'correlate';
    const subjectsAll = [...entities].sort((a, b) => b.observations - a.observations || (a.eid < b.eid ? -1 : 1));
    const subjects = subjectsAll.slice(0, 500).map((e) => ({ id: e.eid, kind: 'entity', attrs: e.attrs, t0: e.first, t1: e.last }));
    const blocksAll = [...reducer.dom.blocks.values()].filter((b) => !b.removed && (b.text?.length ?? 0) >= 20);
    const elements = blocksAll.slice(-2000).map((b) => ({ id: b.id, text: b.text, firstT: b.firstT, lastT: b.lastT }));
    const renderedHyps = correlateRendered(subjects, elements);
    const actionHyps = correlateActions(reducer.actions, summary.streams);
    const caps = { subjectsTotal: subjectsAll.length, subjectsUsed: subjects.length, elementsTotal: blocksAll.length, elementsUsed: elements.length };
    stage = 'graph';
    const graph = buildGraph({ model, resolutions, renderedHyps, actionHyps, session });
    stage = 'persist';
    session.kv.set('MODEL', { ...modelSummary(model), corpus: corpusResult.stats });
    session.dataset('entities').push(entities);
    session.kv.set('GRAPH', graph.toJSON());
    session.kv.set('HYPOTHESES', { rendered: renderedHyps, actions: actionHyps, caps });
    // Last write of the completed knowledge transaction. Zero entities is a
    // successful empty result, even though Dataset.push([]) creates no file.
    session.kv.set('KNOWLEDGE_STATUS', { ...knowledgeRun, status: 'complete',
      completedAt: new Date().toISOString(), entityCount: entities.length,
      typeCount: model.types.length, entitiesDatasetPresent: entities.length > 0 });
    knowledge = { types: model.types.length, entities: entities.length, edges: graph.edges.size, corpusSamples: corpusResult.stats.samples, corpusDropped: Object.values(corpusResult.stats.dropped).reduce((a, b) => a + b, 0), unmodelledGroups: model.unmodelled.length };
  } catch (e) {
    knowledge = { error: String(e?.message ?? e), stage };
    resetEntities();
    session.kv.set('MODEL', knowledge);
    session.kv.set('GRAPH', null);
    session.kv.set('HYPOTHESES', null);
    session.kv.set('KNOWLEDGE_STATUS', { ...knowledgeRun, status: 'failed',
      completedAt: new Date().toISOString(), stage, error: knowledge.error });
  }
  receipt.knowledge = knowledge;
  session.kv.set('RECEIPT', receipt);
  return { records: n, summary, report, receipt, knowledge, familyCounts, recordCounts: Object.fromEntries([...recordSets].map(([k, d]) => [k, d.count])) };
}

// Metadata-only lab receipt in the format of EXPERIMENTS.md. Safe to paste into an issue:
// no payload text, no URLs beyond host, no headers.
export function buildReceipt(session, reducer, summary = reducer.summary()) {
  const m = session.meta;
  const streams = summary.streams;
  const counts = summary.transportCounts;
  const kinds = Object.keys(counts);
  const transport = kinds.includes('WEBSOCKET') && kinds.some((k) => k.startsWith('HTTP_') || k === 'EVENT_SOURCE') ? 'MIXED'
    : kinds.includes('HTTP_SSE') || kinds.includes('HTTP_NDJSON') || kinds.includes('HTTP_STREAMED') ? 'HTTP_FETCH'
      : kinds.includes('EVENT_SOURCE') ? 'EVENT_SOURCE' : kinds.includes('WEBSOCKET') ? 'WEBSOCKET' : 'UNKNOWN';
  const armed = streams.filter((s) => s.armed === 'stream');
  const armedWithData = armed.filter((s) => s.bytes > 0);
  const armFailed = streams.filter((s) => s.armError);
  const streaming = streams.filter((s) => ['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET'].includes(s.transport));
  const chunks = streams.reduce((a, s) => a + (s.chunks || s.frames || 0), 0);
  const bytes = streams.reduce((a, s) => a + s.bytes, 0);
  const start = reducer.run?.t ?? null;
  const firstByte = Math.min(...streaming.map((s) => s.firstChunkT ?? Infinity));
  const last = Math.max(...streaming.map((s) => s.endT ?? s.lastChunkT ?? -Infinity));
  const lost = reducer.gaps.reduce((a, g) => a + (g.droppedRecords ?? 0), 0);
  const incomplete = streams.filter((s) => s.status === 'incomplete_at_stop').length;
  const verdict = !streams.length ? 'BLOCKED' : armedWithData.length && !lost ? 'A1_RAW_CAPTURE_VIABLE' : armedWithData.length ? 'A1_PARTIAL' : 'A1_UNAVAILABLE';
  let host = '';
  try { host = new URL(m.target?.url).hostname; } catch { /* ignore */ }
  return {
    date_utc: new Date(m.createdAt ?? Date.now()).toISOString(),
    windows_version_observed: m.os ?? 'unknown',
    chrome_version_observed: m.browser ?? 'unknown',
    collector_source_sha: m.collector?.sourceSha ?? collectorSourceSha(),
    attachment_method_and_scope: `CDP flatten session on one user-selected tab (${host}); profile ${m.profile?.name}@v${m.profile?.version}; Network.* observation only, no Fetch interception`,
    actual_response_transport: transport,
    transport_counts: counts,
    cdp_stream_resource_content: armedWithData.length ? 'SUPPORTED_AND_DATA' : armed.length ? 'NO_DATA' : armFailed.length ? 'ERROR' : 'NOT_TESTED',
    stream_resource_content_detail: { armed: armed.length, armed_with_data: armedWithData.length, arm_failed: armFailed.length, buffered_prefix_bytes: streams.reduce((a, s) => a + s.preBytes, 0) },
    raw_chunks_received: chunks,
    raw_bytes_received: bytes,
    first_byte_observed_ms: Number.isFinite(firstByte) && start ? firstByte - start : null,
    first_local_durable_write_ms: 'see raw manifest; writes batched at <=50 ms, fsync <=1 s',
    last_response_or_terminal_ms: Number.isFinite(last) && start ? last - start : null,
    final_visible_text_matches_decoded_payload: 'see studio correlation suggestions (kind=correlation / uncorrelated_ui)',
    replay_and_gap_diagnostics: { gap_records: reducer.gaps.length, dropped_records: lost, streams_incomplete_at_stop: incomplete, coverage_note: 'streams in flight before attach are not observed' },
    data_retained_locally: 'YES',
    other_account_or_sensitive_data_collected: 'NO (credential policy: cookies/auth headers dropped, auth endpoints metadata-only, in-body tokens masked)',
    live_evidence_reference_private_or_redacted: `local session ${m.id}`,
    verdict,
    verdict_scope: 'Describes only this capture experiment: the browser build, tab, profile and responses observed in this session. It does not certify other sites, other transports, continuous capture, or completeness of server-side data.',
  };
}

function listFamilyDatasets(session) {
  try { return readdirSync(path.join(session.dir, 'datasets')).filter((f) => f.startsWith('family-') && f.endsWith('.jsonl')).map((f) => f.slice(0, -6)); } catch { return []; }
}

// Raw bytes of one stream reassembled from disk, with the chunk map.
// Uses the per-stream locator and seek index when present (whole segments are skipped), and
// falls back to an ordered full scan when the session has no index.
export async function streamBytes(session, sid) {
  const parts = [], map = [];
  let offset = 0;
  const iter = typeof session.streamRecords === 'function' ? session.streamRecords(sid) : session.records();
  for await (const r of iter) {
    if (r.sid !== sid) continue;
    if (r.k === 'chunk' || r.k === 'body') {
      const b = Buffer.from(r.b64 ?? '', 'base64');
      parts.push(b); map.push({ seq: r.seq, t: r.t, offset, length: b.length, pre: !!r.pre, retrospective: r.k === 'body', redactions: r.redactions });
      offset += b.length;
    } else if (r.k === 'ws.frame') {
      const b = r.opcode === 2 ? Buffer.from(r.payload ?? '', 'base64') : Buffer.from(r.payload ?? '', 'utf8');
      parts.push(b); map.push({ seq: r.seq, t: r.t, offset, length: b.length, dir: r.dir, opcode: r.opcode });
      offset += b.length;
    }
  }
  return { bytes: Buffer.concat(parts), map };
}

// Time travel: state of streams, assembled content and visible DOM blocks at wall time t.
export async function stateAt(session, t, profile) {
  const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? 'auto', keepEvents: false });
  for await (const r of session.records({ toT: t })) { if (r.t > t) break; reducer.ingest(r); }
  const s = reducer.summary();
  return {
    t, streams: s.streams.map((x) => ({ sid: x.sid, endpoint: `${x.method ?? ''} ${templateUrl(x.url)}`, status: x.status, bytes: x.bytes, events: x.events, transport: transportOf(x), transportDetail: x.transportDetail, assembledTexts: reducer.assembled(x.sid)?.texts?.slice(0, 3) })),
    dom: [...reducer.dom.blocks.values()].filter((b) => !b.removed).slice(-200),
    actions: reducer.actions.slice(-20), nav: reducer.nav.slice(-5), gaps: reducer.gaps,
  };
}

// Re-decode ONE stream from raw bytes, independently of any other stream. Cheap enough to run
// interactively (the stream locator skips every segment the stream does not appear in) and the
// single place that answers "what exactly did this endpoint send, and what did we make of it".
export async function reconstructStream(session, sid, { profile, dialect, limitEvents = 2000 } = {}) {
  const reducer = new StreamReducer({
    deltaDialect: dialect ?? profile?.decode?.delta ?? 'auto',
    keepEvents: true, maxEventsPerStream: limitEvents, deltaOpsLog: 200,
  });
  const iter = typeof session.streamRecords === 'function' ? session.streamRecords(sid) : session.records();
  let records = 0;
  for await (const r of iter) {
    if (r.sid !== sid && !['run.start', 'run.end'].includes(r.k)) continue;
    reducer.ingest(r);
    records++;
  }
  const stream = reducer.summary().streams.find((s) => s.sid === sid) ?? null;
  const delta = reducer.deltaOf(sid);
  return {
    sid, records, stream,
    events: reducer.eventsOf(sid),
    assembled: reducer.assembled(sid),
    deltaStats: delta?.stats() ?? null,
    opsLog: delta?.opsLog ?? [],
  };
}

// Human-visible text of one stream, reconstructed from raw bytes.
export async function streamText(session, sid, opts = {}) {
  const r = await reconstructStream(session, sid, opts);
  const texts = r.assembled?.texts ?? [];
  const fromEvents = r.events.filter((e) => typeof e.text === 'string' && e.text.length > 0).map((e) => e.text);
  return {
    sid,
    assembledText: texts[0]?.text ?? null,
    assembledPath: texts[0]?.path ?? null,
    revisions: r.assembled?.revisions ?? 0,
    blocks: r.assembled?.blocks ?? [],
    eventTextChars: fromEvents.reduce((a, s) => a + s.length, 0),
  };
}

export async function search(sessions, query, { limit = 100 } = {}) {
  const q = String(query).toLowerCase();
  const hits = [];
  for (const session of sessions) {
    for await (const ev of session.dataset('events').iterate()) {
      const hay = typeof ev.data === 'string' ? ev.data : typeof ev.text === 'string' ? ev.text : ev.json !== undefined ? JSON.stringify(ev.json) : '';
      const i = hay.toLowerCase().indexOf(q);
      if (i >= 0) { hits.push({ session: session.id, layer: 'L2', sid: ev.sid, seq: ev.seq, t: ev.t, snippet: hay.slice(Math.max(0, i - 60), i + 100) }); if (hits.length >= limit) return hits; }
    }
    for (const b of session.kv.get('DOM_BLOCKS', []) ?? []) {
      const i = (b.text ?? '').toLowerCase().indexOf(q);
      if (i >= 0) { hits.push({ session: session.id, layer: 'L3', domId: b.id, t: b.lastT, snippet: b.text.slice(Math.max(0, i - 60), i + 100) }); if (hits.length >= limit) return hits; }
    }
  }
  return hits;
}

// The five categories the owner must be able to tell apart. Counts only; no content.
export function fidelityBreakdown(reducer, summary, rawRecords) {
  const streams = summary.streams;
  const redactedStreams = streams.filter((s) => s.redactions > 0);
  const protectedBy = {};
  for (const s of streams) if (s.bodyExcluded) protectedBy[s.bodyExcluded] = (protectedBy[s.bodyExcluded] ?? 0) + 1;
  const pausedNot = (reducer.paused ?? []).reduce((a, p) => a + Object.values(p.notCaptured ?? {}).reduce((x, y) => x + y, 0), 0);
  return {
    original: { streams_with_body: streams.filter((s) => s.bytes > 0).length, bytes: streams.reduce((a, s) => a + s.bytes, 0), raw_records: rawRecords, note: 'byte-faithful as delivered by the browser, except masked spans below' },
    transformed: { streams: redactedStreams.length, masked_spans: redactedStreams.reduce((a, s) => a + s.redactions, 0), note: 'credential-like values overwritten in place with *; offsets preserved; each mask recorded on its chunk' },
    protected: { metadata_only_streams: Object.values(protectedBy).reduce((a, b) => a + b, 0), by_reason: protectedBy, note: 'deliberately not captured: credential policy, profile exclusions, resource types; request/response metadata kept' },
    derived: { decoded_events: streams.reduce((a, s) => a + s.events, 0), assembled_streams: streams.filter((s) => s.deltaRevisions > 0).length, note: 'recomputable from raw at any time' },
    lost_or_unobserved: { gap_records: reducer.gaps.length, dropped_records: reducer.gaps.reduce((a, g) => a + (g.droppedRecords ?? 0), 0), streams_incomplete_at_stop: streams.filter((s) => s.status === 'incomplete_at_stop').length, streams_interrupted: streams.filter((s) => s.interrupted).length, paused_records_not_captured: pausedNot, retrospective_only_streams: streams.filter((s) => s.retrospective).length, note: 'plus anything opened before attach, which cannot be counted' },
  };
}
