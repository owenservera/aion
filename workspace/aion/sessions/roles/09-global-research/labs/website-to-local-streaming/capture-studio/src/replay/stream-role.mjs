// Stream role classifier: what is this response/stream FOR (chat reply, history load, config, ...).
// Pure and offline: no I/O, no clock, no randomness, never mutates its input. Not wired into the
// reducer, derive or any transport label (a later lane integrates it).
//
//   classifyStreamRole(stream, opts?) -> { role, confidence, evidence }
//
// INPUT (all optional; each is exactly what the product already produces):
//   stream = {
//     summary:   one row of StreamReducer.summary().streams (mime, resourceType, method, status_code,
//                kind, bytes, chunks, frames, events, esMessages, heartbeats, status, coverage, ...)
//     events:    StreamReducer.eventsOf(sid), the decoded L2 events ({ json, jsonNested, heartbeat,
//                type, dir, ... }). Only structure is read; payload values are never copied out.
//     assembled: StreamReducer.assembled(sid) -> { doc, revisions, blocks, ... }
//     map:       applyStreamMap(map, events) result, or a STREAM_COMPONENTS stream entry
//                ({ components: [{ component, text | textLength }], stats })
//   }
//   A bare summary row (no events/assembled/map/summary key) is also accepted.
//
// OUTPUT
//   role        one of STREAM_ROLES. 'unknown' is the default and the answer to any ambiguity.
//   confidence  'none' (unknown only) | 'low' | 'medium' | 'high'. A HEURISTIC ordinal: it counts how
//               many kinds of structural signal are present. The kinds are all derived from the same
//               events (a stream map and the delta assembler read the very same payloads), so they are
//               NOT statistically independent and the level is not calibrated or a probability.
//   evidence    [{ feature, count }] in EVIDENCE_FEATURES order. feature is an enum name, count a
//               positive integer. No payload text, keys, ids, URLs or credential bytes appear here.
//
// PRINCIPLES
//   * Value types and structure decide the role. URL, endpoint and key names are never evidence by
//     themselves; neither are chunk count, framing (SSE/NDJSON/WS) or a null/absent error key.
//   * Masking, redaction counts and credential-SHAPED strings (JWT-like, opaque, starred) are capture
//     policy or incidental values, not endpoint purpose. They are weak hints at most: auth needs a
//     typed token-exchange response structure.
//   * Incremental text proves only that text grows (editor, log, notification, chat). chat-reply also
//     needs chat-specific structure: a mapped message component or a typed assistant role frame.
//   * A specific role needs score >= 2 (see each detector). Score-1 hints are reported as
//     weak_evidence_only and the role stays unknown. Two different roles at score >= 2 conflict:
//     unknown.
//   * Inspection is bounded (opts). If a bound prevented a complete look, inspection_truncated is
//     reported and confidence steps down one level.

// Bump when classification behaviour changes: persisted STREAM_ROLES artifacts carry it, and a consumer
// that finds an older (or missing) version must re-derive instead of reusing the artifact.
export const STREAM_ROLE_CLASSIFIER_VERSION = 1;
export const STREAM_ROLES_SCHEMA = 'capture-studio.stream-roles/1';
export const STREAM_ROLES_CONFIDENCE_SCALE = 'heuristic-ordinal (none|low|medium|high); uncalibrated, not a probability; signals derive from the same events and are not independent';

export const STREAM_ROLES = Object.freeze(['chat-reply', 'history-load', 'config', 'telemetry', 'push-presence', 'asset', 'auth', 'unknown']);
export const CONFIDENCE_LEVELS = Object.freeze(['none', 'low', 'medium', 'high']);
export const EVIDENCE_FEATURES = Object.freeze([
  // verdict / coverage markers
  'empty_stream', 'no_structural_evidence', 'weak_evidence_only', 'conflicting_role_evidence', 'incomplete_capture', 'inspection_truncated',
  // shared context
  'json_events', 'heartbeat_events',
  // reply: text growth, then chat-specific structure
  'delta_growth_targets', 'delta_growth_steps', 'mapped_text_components', 'assembled_text_blocks',
  'mapped_message_components', 'assistant_role_frames',
  // history
  'message_entries', 'message_roles_distinct',
  // config
  'descriptor_array_entries', 'boolean_leaves',
  // telemetry
  'numeric_leaves', 'timestamp_values', 'repeated_record_shape',
  // presence
  'small_flat_payloads',
  // auth: structure first, then weak hints
  'token_exchange_structure', 'token_exchange_request', 'credential_shaped_values', 'masked_credential_values', 'masked_credential_spans',
  // asset
  'asset_media_type', 'asset_resource_type', 'non_json_body',
]);

// ---- options: validated and clamped --------------------------------------------------------------
// Anything that is not a finite number (NaN, +-Infinity, strings, objects) falls back to the default.
// Budgets are clamped into a sane range. Growth thresholds can only be TIGHTENED: a caller cannot
// lower them below the defaults and thereby force text-growth (and confidence) out of weak data.
const OPTION_SPECS = Object.freeze({
  maxEvents: [5000, 1, 100000],        // events examined per stream (the first N, in order)
  maxNodes: [2000, 50, 100000],        // JSON nodes visited per document, per pass
  minGrowthSteps: [3, 3, 1000],        // appends to one target before it counts as text growth
  minGrowthDistinct: [3, 3, 1000],     // ...of at least this many distinct pieces
  minGrowthChars: [6, 6, 100000],
  smallDocBytes: [8192, 256, 65536],   // an auth response is a small document
});

export function resolveClassifierOptions(opts) {
  const src = opts !== null && typeof opts === 'object' && !Array.isArray(opts) ? opts : {};
  const out = {};
  for (const [k, [def, lo, hi]] of Object.entries(OPTION_SPECS)) {
    const v = src[k];
    // Non-finite, zero and negative values are rejected (default), not clamped to the minimum.
    out[k] = typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.min(hi, Math.max(lo, Math.floor(v))) : def;
  }
  return Object.freeze(out);
}

const CHAT_ROLES = new Set(['user', 'assistant', 'system', 'tool', 'human', 'ai', 'model', 'bot']);
const ASSISTANT_ROLES = new Set(['assistant', 'model', 'ai', 'bot']);
const INDEX_KEYS = ['index', 'output_index', 'content_index', 'block_index', 'candidate_index', 'choice_index'];
const ASSET_MIME = /^(?:image|audio|video|font)\/|^text\/(?:css|javascript|html)$|^application\/(?:javascript|x-javascript|ecmascript|wasm|font-[\w-]+|x-font-[\w-]+|vnd\.ms-fontobject)$/;
const ASSET_RESOURCE_TYPES = new Set(['Image', 'Stylesheet', 'Script', 'Font', 'Media', 'Manifest', 'TextTrack']);
const INCOMPLETE_STATUS = new Set(['failed', 'canceled', 'incomplete_at_stop']);
const JWT_SHAPED = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;
const OPAQUE_SECRET = /^[A-Za-z0-9_\-+/=]{40,}$/;
const TOKEN_VALUE = /^[A-Za-z0-9._~+/=-]{20,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const NUMERIC_TEXT = /^\s*-?\d+(?:\.\d+)?\s*$/;
// Token-exchange response slots. Key names are only HALF of the test: the value must also have the
// right type (credential-shaped string / plausible expiry integer) and both slots must be present.
const TOKEN_SLOT_KEYS = new Set(['accesstoken', 'idtoken', 'refreshtoken', 'sessiontoken', 'authtoken', 'token']);
const EXPIRY_SLOT_KEYS = new Set(['expiresin', 'expiresat', 'expires', 'expiry', 'exp']);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isTimestampNumber = (v) => typeof v === 'number' && Number.isFinite(v) && ((v >= 1e9 && v <= 4.2e9) || (v >= 1e12 && v <= 4.2e12));
const isExpiryNumber = (v) => Number.isInteger(v) && ((v >= 30 && v <= 3.2e7) || isTimestampNumber(v));
const isOpaqueSecret = (s) => OPAQUE_SECRET.test(s) && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s) && !UUID.test(s);
const starCount = (s) => s.match(/\*/g)?.length ?? 0;
const isMasked = (s) => s.length >= 8 && starCount(s) >= 8 && starCount(s) / s.length >= 0.5;
const slotKey = (k) => String(k).toLowerCase().replace(/[_-]/g, '');

// Bounded traversal: every walker spends from a budget and records when a bound hid something.
const mkBudget = (n) => ({ n, hit: false });
const spend = (b) => { if (b.n <= 0) { b.hit = true; return false; } b.n--; return true; };

// ---- input normalisation ------------------------------------------------------------------------
function normalize(stream) {
  const s = isObj(stream) ? stream : {};
  const wrapped = Array.isArray(s.events) || 'summary' in s || 'assembled' in s || 'map' in s;
  return {
    summary: wrapped ? (isObj(s.summary) ? s.summary : {}) : s,
    events: wrapped && Array.isArray(s.events) ? s.events : [],
    assembled: wrapped && isObj(s.assembled) ? s.assembled : null,
    map: wrapped && isObj(s.map) ? s.map : null,
  };
}

// Same choice the reducer makes for delta reconstruction: an unwrapped nested document wins.
const jsonOf = (ev) => (ev?.jsonNested?.json !== undefined ? ev.jsonNested.json : ev?.json);

// Decoded JSON documents in order. Heartbeats carry no content and are only counted.
function collectDocs(events, o) {
  const docs = [];
  let heartbeats = 0;
  let channelEvents = 0;
  const examined = events.slice(0, o.maxEvents);
  for (const ev of examined) {
    if (!isObj(ev)) continue;
    if (ev.dir !== undefined || ev.type === 'eventsource') channelEvents++;
    if (ev.heartbeat === true) { heartbeats++; continue; }
    const j = jsonOf(ev);
    if (j && typeof j === 'object') docs.push(j);
  }
  return { docs, heartbeats, channelEvents, skippedEvents: events.length - examined.length };
}

// ---- incremental text (proves growth, NOT that it is a chat reply) -----------------------------
function createGrowth() {
  const targets = new Map();   // target -> { n, distinct:Set, chars }
  const lastText = new Map();  // target -> last full string seen (cumulative snapshots)
  const state = { lastPath: null, truncatedDocs: 0 };
  const step = (target, piece) => {
    if (typeof piece !== 'string' || piece.length === 0 || NUMERIC_TEXT.test(piece)) return;
    let t = targets.get(target);
    if (!t) targets.set(target, t = { n: 0, distinct: new Set(), chars: 0 });
    t.n++; t.chars += piece.length;
    if (t.distinct.size < 64) t.distinct.add(piece);
  };
  const cumulative = (target, value) => {
    if (typeof value !== 'string') return;
    const prev = lastText.get(target);
    if (typeof prev === 'string' && prev.length > 0 && value.length > prev.length && value.startsWith(prev)) step(target, value.slice(prev.length));
    lastText.set(target, value);
  };
  return { targets, step, cumulative, state };
}

function expandPatch(json) {
  if (isObj(json) && json.o === 'patch' && Array.isArray(json.v)) return json.v;
  return [json];
}

// String leaves under a `delta` key (typed events, chat-completions choices[].delta, ...).
function walkDelta(node, path, depth, idx, g, b) {
  if (!spend(b)) return;
  if (depth > 5) { b.hit = true; return; }
  if (Array.isArray(node)) {
    if (node.length > 32) b.hit = true;
    node.slice(0, 32).forEach((x, i) => walkDelta(x, `${path}[${i}]`, depth + 1, idx, g, b));
    return;
  }
  if (!isObj(node)) return;
  const entries = Object.entries(node);
  if (entries.length > 40) b.hit = true;
  for (const [k, v] of entries.slice(0, 40)) {
    if (k === 'delta') {
      if (typeof v === 'string') g.step(`${idx}|${path}.delta`, v);
      else if (isObj(v)) {
        const de = Object.entries(v);
        if (de.length > 20) b.hit = true;
        for (const [dk, dv] of de.slice(0, 20)) if (dk !== 'type' && typeof dv === 'string') g.step(`${idx}|${path}.delta.${dk}`, dv);
      }
    } else if (v && typeof v === 'object') walkDelta(v, `${path}.${k}`, depth + 1, idx, g, b);
  }
}

// Leaves of a plain document, for cumulative-snapshot detection.
function snapshotLeaves(node, path, depth, g, b) {
  if (!spend(b)) return;
  if (depth > 6) { b.hit = true; return; }
  if (typeof node === 'string') { g.cumulative(`leaf|${path}`, node); return; }
  if (Array.isArray(node)) {
    if (node.length > 32) b.hit = true;
    node.slice(0, 32).forEach((x, i) => snapshotLeaves(x, `${path}[${i}]`, depth + 1, g, b));
    return;
  }
  if (isObj(node)) {
    const entries = Object.entries(node);
    if (entries.length > 40) b.hit = true;
    for (const [k, v] of entries.slice(0, 40)) snapshotLeaves(v, `${path}.${k}`, depth + 1, g, b);
  }
}

function feedGrowth(g, json, maxNodes) {
  const b = mkBudget(maxNodes);
  for (const u of expandPatch(json)) {
    if (Array.isArray(u)) { // RFC 6902 operations: only a string that extends the previous value is growth
      if (u.length > 50) b.hit = true;
      for (const op of u.slice(0, 50)) if (isObj(op) && typeof op.path === 'string' && (op.op === 'add' || op.op === 'replace')) g.cumulative(`jp|${op.path}`, op.value);
      continue;
    }
    if (!isObj(u)) continue;
    if ('p' in u || 'o' in u || ('v' in u && !('type' in u))) { // path-op: { p, o, v } or a bare { v } continuation
      const path = typeof u.p === 'string' ? u.p : g.state.lastPath;
      if (typeof u.p === 'string') g.state.lastPath = u.p;
      const mode = u.o === undefined ? 'append' : u.o;
      if (path != null && typeof u.v === 'string') {
        if (mode === 'append') g.step(`po|${path}`, u.v);
        else if (mode === 'replace' || mode === 'set' || mode === 'add') g.cumulative(`po|${path}`, u.v);
      }
      continue;
    }
    const idx = INDEX_KEYS.filter((k) => Number.isInteger(u[k])).map((k) => u[k]).join('.');
    walkDelta(u, '', 0, idx, g, b);
    snapshotLeaves(u, '', 0, g, b);
  }
  if (b.hit) g.state.truncatedDocs++;
}

function growthSummary(g, o) {
  let targets = 0; let steps = 0;
  for (const t of g.targets.values()) {
    if (t.n >= o.minGrowthSteps && t.distinct.size >= o.minGrowthDistinct && t.chars >= o.minGrowthChars) { targets++; steps += t.n; }
  }
  return { targets, steps };
}

function mappedTextComponents(map) {
  if (!map) return 0;
  const comps = Array.isArray(map.components) ? map.components : [];
  if (isObj(map.stats) && Number.isFinite(map.stats.mapped) && map.stats.mapped < 2) return 0;
  return comps.filter((c) => isObj(c) && c.component !== 'message' && (Number.isFinite(c.textLength) ? c.textLength : (typeof c.text === 'string' ? c.text.length : 0)) > 0).length;
}

// An ACTUAL mapped reply: the map opened a message container AND built text under it. A map that only
// matched a terminal / finalize event ([DONE], message_stop, ...) has no components and gives 0.
function mappedMessageComponents(map) {
  if (!map || mappedTextComponents(map) === 0) return 0;
  return (Array.isArray(map.components) ? map.components : []).filter((c) => isObj(c) && c.component === 'message').length;
}

function assembledTextBlocks(assembled) {
  if (!assembled || !(assembled.revisions >= 3) || !Array.isArray(assembled.blocks)) return 0;
  return assembled.blocks.filter((b) => isObj(b) && typeof b.text === 'string' && b.text.length > 0).length;
}

function growthFacts(docs, assembled, map, o) {
  const g = createGrowth();
  for (const d of docs) feedGrowth(g, d, o.maxNodes);
  const { targets, steps } = growthSummary(g, o);
  const mapped = mappedTextComponents(map);
  const blocks = assembledTextBlocks(assembled);
  return { targets, steps, mapped, blocks, incremental: targets > 0 || mapped > 0 || blocks > 0, truncatedDocs: g.state.truncatedDocs };
}

// ---- structure of the decoded JSON ---------------------------------------------------------------
function textual(v, d = 0) {
  if (d > 3) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.slice(0, 20).some((x) => textual(x, d + 1));
  if (isObj(v)) return textual(v.text, d + 1) || textual(v.content, d + 1) || textual(v.parts, d + 1) || textual(v.value, d + 1);
  return false;
}

const roleValueOf = (node) => {
  const raw = typeof node.role === 'string' ? node.role : (isObj(node.author) && typeof node.author.role === 'string' ? node.author.role : null);
  return raw === null ? null : raw.toLowerCase();
};

// A message-like entry has a chat role VALUE and non-empty textual content. Returns the role or null.
function messageRole(o) {
  if (!isObj(o)) return null;
  const node = isObj(o.message) && !('role' in o) ? o.message : o;
  const role = roleValueOf(node);
  if (role === null || !CHAT_ROLES.has(role)) return null;
  return textual(node.content) || textual(node.text) || textual(node.parts) ? role : null;
}

// A typed assistant frame: an assistant-ish role VALUE next to a content slot (which may still be
// empty: message_start, the first chat-completions chunk). A model-list entry has no content slot.
function isAssistantFrame(node) {
  const role = roleValueOf(node);
  return role !== null && ASSISTANT_ROLES.has(role) && ('content' in node || 'parts' in node || 'text' in node);
}

const scalarKind = (v) => (typeof v === 'string' ? 's' : typeof v === 'number' ? 'n' : typeof v === 'boolean' ? 'b' : v === null ? 'z' : 'o');
const isScalar = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const signature = (rec) => Object.keys(rec).sort().map((k) => `${k}:${scalarKind(rec[k])}`).join(',');

function createStats() {
  return {
    booleans: 0, numbers: 0, strings: 0, longStrings: 0, ts: 0, jwt: 0, opaque: 0, masked: 0,
    msg: { count: 0, roles: new Set() },
    descriptorEntries: 0, assistantFrames: 0,
  };
}

function scalarStats(st, v) {
  if (typeof v === 'boolean') st.booleans++;
  else if (typeof v === 'number') { st.numbers++; if (isTimestampNumber(v)) st.ts++; }
  else if (typeof v === 'string') {
    st.strings++;
    if (v.length > 80) st.longStrings++;
    if (ISO_TIME.test(v)) st.ts++;
    if (JWT_SHAPED.test(v)) st.jwt++;
    else if (isMasked(v)) st.masked++;
    else if (isOpaqueSecret(v)) st.opaque++;
  }
}

function noteContainer(st, members) {
  const roles = members.map(messageRole).filter((r) => r !== null);
  if (roles.length > st.msg.count) st.msg = { count: roles.length, roles: new Set(roles) };
  return roles.length;
}

function descriptorArray(items) {
  if (items.length < 3 || !items.every(isObj)) return false;
  const sigs = new Map();
  for (const it of items) sigs.set(signature(it), (sigs.get(signature(it)) ?? 0) + 1);
  if (Math.max(...sigs.values()) / items.length < 0.8) return false;
  return items.every((it) => Object.values(it).filter(isScalar).length >= 2) && items.some((it) => Object.values(it).some((v) => typeof v === 'string'));
}

function scan(node, depth, st, b) {
  if (!spend(b)) return;
  if (depth > 8) { b.hit = true; return; }
  if (Array.isArray(node)) {
    if (node.length > 500) b.hit = true;
    const members = node.slice(0, 500);
    const msgs = noteContainer(st, members);
    if (msgs === 0 && descriptorArray(members)) st.descriptorEntries += members.length;
    for (const x of members) scan(x, depth + 1, st, b);
  } else if (isObj(node)) {
    if (isAssistantFrame(node)) st.assistantFrames++;
    const all = Object.values(node);
    if (all.length > 200) b.hit = true;
    const vals = all.slice(0, 200);
    if (vals.length >= 2) noteContainer(st, vals);
    for (const x of vals) scan(x, depth + 1, st, b);
  } else scalarStats(st, node);
}

// Typed token-exchange response: a credential-shaped string in a token slot AND an expiry integer in
// an expiry slot, in the same object (top level, or one `data` wrapper). Neither alone is enough.
function tokenExchangeIn(obj) {
  if (!isObj(obj)) return false;
  let token = false; let expiry = false;
  for (const [k, v] of Object.entries(obj).slice(0, 40)) {
    const key = slotKey(k);
    if (TOKEN_SLOT_KEYS.has(key) && typeof v === 'string' && (JWT_SHAPED.test(v) || isMasked(v) || TOKEN_VALUE.test(v))) token = true;
    if (EXPIRY_SLOT_KEYS.has(key) && isExpiryNumber(v)) expiry = true;
  }
  return token && expiry;
}
const tokenExchange = (doc) => tokenExchangeIn(doc) || (isObj(doc) && tokenExchangeIn(doc.data));

// Records for telemetry: the largest array of >=3 objects (depth <= 2) or the document itself.
function recordsOf(doc) {
  const pick = (arr) => (arr.length >= 3 && arr.every(isObj) ? arr : null);
  if (Array.isArray(doc)) return pick(doc) ?? [];
  if (!isObj(doc)) return [];
  let best = null;
  for (const v of Object.values(doc)) {
    if (Array.isArray(v)) { const p = pick(v); if (p && (!best || p.length > best.length)) best = p; }
    else if (isObj(v)) for (const w of Object.values(v)) if (Array.isArray(w)) { const p = pick(w); if (p && (!best || p.length > best.length)) best = p; }
  }
  return best ?? [doc];
}

function analyze(docs, assembledDoc, o) {
  const st = createStats();
  const records = [];
  let truncatedDocs = 0;
  let exchanges = 0;
  for (const d of docs) {
    const b = mkBudget(o.maxNodes);
    scan(d, 0, st, b);
    if (b.hit) truncatedDocs++;
    if (tokenExchange(d)) exchanges++;
    for (const r of recordsOf(d)) { if (records.length < 500) records.push(r); else truncatedDocs = Math.max(truncatedDocs, 1); }
  }
  // The assembled document is derived from the same events; scanning both would double-count.
  if (!docs.length && assembledDoc && typeof assembledDoc === 'object') {
    const b = mkBudget(o.maxNodes);
    scan(assembledDoc, 0, st, b);
    if (b.hit) truncatedDocs++;
  }
  // Telemetry record statistics (flat scalars of each record plus one nesting level).
  const sigs = new Map();
  const rs = { numbers: 0, strings: 0, booleans: 0, longStrings: 0, tsRecords: 0, tsValues: 0 };
  for (const r of records) {
    const part = createStats();
    scan(r, 0, part, mkBudget(200));
    rs.numbers += part.numbers; rs.strings += part.strings; rs.booleans += part.booleans; rs.longStrings += part.longStrings;
    rs.tsValues += part.ts; if (part.ts > 0) rs.tsRecords++;
    const s = signature(r);
    sigs.set(s, (sigs.get(s) ?? 0) + 1);
  }
  const dominant = sigs.size ? Math.max(...sigs.values()) : 0;
  return { st, records: records.length, rs, dominant, exchanges, truncatedDocs };
}

// ---- small flat state frames (push-presence) -----------------------------------------------------
function isSmallFlat(doc) {
  if (!isObj(doc)) return false;
  const vals = Object.values(doc);
  if (vals.length === 0 || vals.length > 6) return false;
  return vals.every((v) => v === null || typeof v === 'boolean' || (typeof v === 'number' && !isTimestampNumber(v)) || (typeof v === 'string' && v.length <= 48 && !ISO_TIME.test(v)));
}

// Public helper for later integration, counts only (never content).
//   incrementalText   text provably grows (delta / cumulative snapshot / mapped text / assembler blocks).
//                     This alone is NOT a chat reply: editors, logs and notifications grow too.
//   chatCorroborated  a mapped message component with text, or a typed assistant role frame.
//   strong            incrementalText && chatCorroborated (what chat-reply requires).
//   kinds             how many of {incremental text, mapped message, assistant frame} are present (0-3).
//                     They are derived from the same events: a heuristic tally, not independent proof.
export function streamingEvidence(stream, opts = {}) {
  const o = resolveClassifierOptions(opts);
  const { events, assembled, map } = normalize(stream);
  const { docs } = collectDocs(events, o);
  const f = growthFacts(docs, assembled, map, o);
  const a = analyze(docs, null, o);
  const mappedMessage = mappedMessageComponents(map);
  const frames = a.st.assistantFrames;
  return {
    growthTargets: f.targets, growthSteps: f.steps, mappedTextComponents: f.mapped, assembledTextBlocks: f.blocks,
    mappedMessageComponents: mappedMessage, assistantRoleFrames: frames,
    incrementalText: f.incremental, chatCorroborated: mappedMessage > 0 || frames > 0,
    kinds: [f.incremental, mappedMessage > 0, frames > 0].filter(Boolean).length,
    strong: f.incremental && (mappedMessage > 0 || frames > 0),
    truncated: events.length > o.maxEvents || f.truncatedDocs > 0 || a.truncatedDocs > 0,
  };
}

// ---- detectors: each returns { role, score, features } or null ---------------------------------------
const feat = (feature, count) => ({ feature, count });

function detectReply(f, a, mappedMessage) {
  if (!f.incremental) return null;
  const frames = a.st.assistantFrames;
  const features = [
    feat('delta_growth_targets', f.targets), feat('delta_growth_steps', f.steps),
    feat('mapped_text_components', f.mapped), feat('assembled_text_blocks', f.blocks),
    feat('mapped_message_components', mappedMessage), feat('assistant_role_frames', frames),
  ];
  // Incremental text without chat-specific structure is only a weak hint (editor, log, notification).
  if (mappedMessage === 0 && frames === 0) return { role: 'chat-reply', score: 1, features };
  return { role: 'chat-reply', score: mappedMessage > 0 && frames > 0 ? 3 : 2, features };
}

function detectHistory(a) {
  const { count, roles } = a.st.msg;
  if (count < 2) return null;
  return { role: 'history-load', score: roles.size >= 2 ? 3 : 2, features: [feat('message_entries', count), feat('message_roles_distinct', roles.size)] };
}

function telemetryFacts(a) {
  const { rs, records, dominant } = a;
  const scalars = rs.numbers + rs.strings + rs.booleans;
  const repeated = records >= 3 && dominant / records >= 0.6;
  const numeric = scalars > 0 && rs.numbers / scalars >= 0.4 && rs.longStrings === 0;
  const timed = records > 0 && rs.tsRecords / records >= 0.5;
  return { repeated, numeric, timed };
}

function detectTelemetry(a) {
  const t = telemetryFacts(a);
  if (!t.repeated || !t.numeric) return null;
  return { role: 'telemetry', score: t.timed ? 2 : 1, features: [
    feat('repeated_record_shape', a.dominant), feat('numeric_leaves', a.rs.numbers), feat('timestamp_values', a.rs.tsValues),
  ] };
}

function detectConfig(a, ctx) {
  const { st } = a;
  if (ctx.jsonEvents < 1 || ctx.jsonEvents > 2 || ctx.heartbeats > 0 || ctx.channel) return null;
  const scalars = st.booleans + st.numbers + st.strings;
  const boolDense = st.booleans >= 3 && scalars > 0 && st.booleans / scalars >= 0.3;
  const descriptors = st.descriptorEntries >= 3;
  if (!boolDense && !descriptors) return null;
  return { role: 'config', score: (boolDense ? 2 : 0) + (descriptors ? 1 : 0), features: [
    feat('descriptor_array_entries', st.descriptorEntries), feat('boolean_leaves', st.booleans),
  ] };
}

// Auth needs a typed token-exchange response (credential-shaped token in a token slot + an expiry
// integer in an expiry slot), a successful response when the status is known and a plausible method
// when it is known. Credential-shaped values, masking and redaction counts are weak hints only: with
// no exchange structure they stay at score 1 (unknown). Credential contents are never decoded or emitted.
function detectAuth(a, ctx, summary, o) {
  const { st } = a;
  const redactions = Number(summary.redactions) > 0 ? Math.floor(Number(summary.redactions)) : 0;
  const hints = [feat('credential_shaped_values', st.jwt + st.opaque), feat('masked_credential_values', st.masked), feat('masked_credential_spans', redactions)];
  const hasHint = st.jwt + st.opaque + st.masked + redactions > 0;
  const status = Number(summary.status_code);
  const statusKnown = Number.isFinite(status) && status > 0;
  const statusOk = !statusKnown || (status >= 200 && status < 300);
  const method = typeof summary.method === 'string' ? summary.method.toUpperCase() : null;
  const methodOk = method === null || method === 'POST' || method === 'GET';
  const smallDoc = !Number.isFinite(summary.bytes) || summary.bytes <= o.smallDocBytes;
  const structural = a.exchanges > 0 && ctx.jsonEvents >= 1 && ctx.jsonEvents <= 3 && !ctx.channel && smallDoc && statusOk && methodOk;
  if (structural) {
    const requestSeen = method === 'POST' && statusKnown;
    return { role: 'auth', score: requestSeen ? 3 : 2, features: [feat('token_exchange_structure', a.exchanges), feat('token_exchange_request', requestSeen ? 1 : 0), ...hints] };
  }
  return hasHint ? { role: 'auth', score: 1, features: hints } : null;
}

function detectPresence(a, ctx, smallFlat) {
  if (!ctx.channel || ctx.heartbeats < 2 || smallFlat < 3) return null;
  if (a.st.ts > 0 || a.st.longStrings > 0) return null;
  return { role: 'push-presence', score: 2, features: [feat('small_flat_payloads', smallFlat), feat('heartbeat_events', ctx.heartbeats)] };
}

function detectAsset(summary, ctx) {
  if (ctx.jsonEvents > 0 || ctx.channel) return null;
  const mime = String(summary.mime ?? '').toLowerCase().split(';')[0].trim();
  const mimeHit = ASSET_MIME.test(mime);
  const typeHit = ASSET_RESOURCE_TYPES.has(summary.resourceType);
  if (!mimeHit && !typeHit) return null;
  const body = Math.max(1, Math.floor(Number(summary.chunks) || 0));
  return { role: 'asset', score: mimeHit && typeHit ? 3 : mimeHit ? 2 : 1, features: [
    feat('asset_media_type', mimeHit ? 1 : 0), feat('asset_resource_type', typeHit ? 1 : 0), feat('non_json_body', body),
  ] };
}

// ---- verdict -----------------------------------------------------------------------------------
const orderOf = new Map(EVIDENCE_FEATURES.map((f, i) => [f, i]));
function finish(features) {
  const merged = new Map();
  for (const { feature, count } of features) {
    const n = Math.floor(Number(count));
    if (n > 0) merged.set(feature, Math.max(merged.get(feature) ?? 0, n));
  }
  return [...merged].map(([feature, count]) => ({ feature, count })).sort((a, b) => orderOf.get(a.feature) - orderOf.get(b.feature));
}

function incompleteCapture(summary) {
  return INCOMPLETE_STATUS.has(summary.status)
    || (typeof summary.coverage === 'string' && summary.coverage !== 'observed_from_request_start')
    || Number(summary.eventsOnlyOnDisk) > 0
    || summary.truncatedAtBytes !== undefined;
}

const LEVEL_BY_SCORE = { 2: 'medium', 3: 'high' };
const stepDown = (level) => (level === 'high' ? 'medium' : level === 'medium' ? 'low' : level);

// kv STREAM_ROLES document, built from summary rows that already carry role fields, i.e. the streams of
// StreamReducer.summary({ includeStreamRoles: true }). Pure and deterministic (no clock). Keyed by sid
// only: no join id, message id or DOM link is inferred here. `unknown` rows are kept and explicit.
export function buildStreamRoles(rows, { eventWindow = null } = {}) {
  const list = Array.isArray(rows) ? rows.filter((r) => isObj(r) && r.sid !== undefined) : [];
  if (!list.length) return { schema: STREAM_ROLES_SCHEMA, status: 'no_streams' };
  const byRole = Object.fromEntries(STREAM_ROLES.map((r) => [r, 0]));
  const streams = list.map((r) => {
    const role = STREAM_ROLES.includes(r.role) ? r.role : 'unknown';
    byRole[role]++;
    return {
      sid: r.sid,
      role,
      roleConfidence: CONFIDENCE_LEVELS.includes(r.roleConfidence) ? r.roleConfidence : 'none',
      roleEvidence: Array.isArray(r.roleEvidence) ? r.roleEvidence.map((e) => ({ feature: e.feature, count: e.count })) : [],
      eventsOmitted: Number(r.eventsOnlyOnDisk) > 0 ? Number(r.eventsOnlyOnDisk) : 0,
    };
  });
  return {
    schema: STREAM_ROLES_SCHEMA,
    classifier: { id: 'stream-role', version: STREAM_ROLE_CLASSIFIER_VERSION, options: { ...resolveClassifierOptions() } },
    confidenceScale: STREAM_ROLES_CONFIDENCE_SCALE,
    inputs: { eventWindow, source: 'reducer events + assembled + built-in stream maps', identity: 'sid only; no join ids inferred' },
    streams,
    totals: { streams: streams.length, byRole, unknown: byRole.unknown },
  };
}

// One-line receipt entry for a STREAM_ROLES document.
export function describeStreamRoles(doc) {
  if (!doc || !doc.totals) return doc?.status ?? 'error';
  const parts = STREAM_ROLES.filter((r) => doc.totals.byRole[r] > 0).map((r) => `${doc.totals.byRole[r]} ${r}`);
  return `${doc.totals.streams} streams: ${parts.join(', ')}`;
}

export function classifyStreamRole(stream, opts = {}) {
  const o = resolveClassifierOptions(opts);
  const { summary, events, assembled, map } = normalize(stream);
  const incomplete = incompleteCapture(summary);
  const { docs, heartbeats: eventHeartbeats, channelEvents, skippedEvents } = collectDocs(events, o);
  const heartbeats = events.length === 0 ? Math.floor(Number(summary.heartbeats) || 0) : eventHeartbeats;
  const ctx = {
    jsonEvents: docs.length,
    heartbeats,
    // A push channel is a socket / EventSource / SSE framing. Chunk count (HTTP_STREAMED) is not one.
    channel: summary.kind === 'ws' || Number(summary.esMessages) > 0 || channelEvents > 0 || summary.decoder === 'sse',
  };

  const counts = ['bytes', 'chunks', 'frames', 'events', 'esMessages'].reduce((n, k) => n + (Number(summary[k]) > 0 ? Number(summary[k]) : 0), 0);
  const hasContentSignal = events.length > 0 || (assembled?.revisions > 0) || mappedTextComponents(map) > 0;
  if (counts === 0 && !hasContentSignal) {
    return { role: 'unknown', confidence: 'none', evidence: finish([feat('empty_stream', 1), ...(incomplete ? [feat('incomplete_capture', 1)] : [])]) };
  }

  const growth = growthFacts(docs, assembled, map, o);
  const a = analyze(docs, assembled?.doc, o);
  const smallFlat = docs.filter(isSmallFlat).length;
  const telemetry = detectTelemetry(a);
  const candidates = [
    detectReply(growth, a, mappedMessageComponents(map)),
    detectHistory(a),
    // Time-series records are dynamic data: they take precedence over the static-config reading.
    telemetry,
    telemetry && telemetry.score >= 2 ? null : detectConfig(a, ctx),
    detectAuth(a, ctx, summary, o),
    detectPresence(a, ctx, smallFlat),
    detectAsset(summary, ctx),
  ].filter(Boolean);

  // Replies and history reloads legitimately contain credential-like or flat-looking values: when a
  // content role is established, the incidental detectors never compete with it.
  const content = candidates.filter((c) => (c.role === 'chat-reply' || c.role === 'history-load') && c.score >= 2);
  const qualified = (content.length ? content : candidates.filter((c) => c.score >= 2)).sort((x, y) => y.score - x.score);
  const truncated = skippedEvents > 0 || growth.truncatedDocs > 0 || a.truncatedDocs > 0;
  const flags = [
    ...(incomplete ? [feat('incomplete_capture', 1)] : []),
    ...(truncated ? [feat('inspection_truncated', skippedEvents + Math.max(growth.truncatedDocs, a.truncatedDocs) || 1)] : []),
  ];
  const base = ctx.jsonEvents > 0 ? [feat('json_events', ctx.jsonEvents)] : [];

  if (qualified.length === 0) {
    const weak = candidates.filter((c) => c.score >= 1);
    return { role: 'unknown', confidence: 'none', evidence: finish([...base, ...flags, feat(weak.length ? 'weak_evidence_only' : 'no_structural_evidence', 1), ...weak.flatMap((c) => c.features)]) };
  }
  if (qualified.length > 1) {
    return { role: 'unknown', confidence: 'none', evidence: finish([...base, ...flags, feat('conflicting_role_evidence', qualified.length), ...qualified.flatMap((c) => c.features)]) };
  }
  const top = qualified[0];
  let confidence = LEVEL_BY_SCORE[top.score];
  if (incomplete) confidence = stepDown(confidence);
  if (truncated) confidence = stepDown(confidence);
  return { role: top.role, confidence, evidence: finish([...base, ...flags, ...top.features]) };
}
