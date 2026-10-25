// Source-preserving native event projection for the existing /chat shell.
// Read-only. Unknown native payloads stay opaque. No HTML, network, CDP or effects.
export const NATIVE_EVENT_SCHEMA = 'aion.discovery.native-event/1';
export const NATIVE_GRAPH_SCHEMA = 'aion.discovery.native-graph/1';
const OPS = new Set(['open', 'append', 'replace', 'close', 'invalidate']);
function fail(code) { const e = new Error(code); e.code = code; throw e; }
function str(x) { return typeof x === 'string' && x.length > 0 && x.length <= 512; }
function scopeEq(a,b) { return a?.origin===b?.origin && a?.account===b?.account && a?.conversationId===b?.conversationId; }
function serializable(x) { if (x === undefined) return true; try { return JSON.stringify(x) !== undefined; } catch { return false; } }
function clone(x) { return x === undefined ? undefined : structuredClone(x); }

// Event IDs are source minted, never guessed from text, timestamp, tab title or similar.
// Source evidence must be verified by Core before passing in: grounded:true is a
// projection marker only, NOT a stand-alone authenticity or G1-G7 check.
export function projectNativeEvents(events, { scope } = {}) {
  if (!Array.isArray(events) || !scope || !str(scope.origin) || !str(scope.account) || !str(scope.conversationId))
    fail('INVALID_NATIVE_INPUT');
  const seen = new Map(), turns = new Map(), blocks = new Map();
  let lastSeq = -1, replayed = 0;
  for (const e of events) {
    if (!e || e.schema !== NATIVE_EVENT_SCHEMA || !scopeEq(e.scope, scope)) fail('NATIVE_SCOPE_MISMATCH');
    if (!str(e.eventId) || !str(e.turnId) || !str(e.blockId) || !OPS.has(e.op)
      || !Number.isSafeInteger(e.sequence) || e.sequence < 0
      || !Number.isSafeInteger(e.revision) || e.revision < 0) fail('INVALID_NATIVE_EVENT');
    if (!e.evidence || e.evidence.grounded !== true || !str(e.evidence.sid)
      || !Number.isSafeInteger(e.evidence.seq) || e.evidence.seq < 0) fail('NATIVE_EVIDENCE_UNGROUNDED');
    if (!serializable(e.payload) || (e.text !== undefined && typeof e.text !== 'string')) fail('INVALID_NATIVE_CONTENT');
    const frozen = JSON.stringify(e);
    if (seen.has(e.eventId)) {
      if (seen.get(e.eventId) !== frozen) fail('CONFLICTING_NATIVE_EVENT_ID');
      replayed++;
      continue;
    }
    if (e.sequence <= lastSeq) fail('NONMONOTONIC_NATIVE_SEQUENCE');
    const key = JSON.stringify([e.turnId, e.blockId]);
    const current = blocks.get(key);
    if (e.op === 'open') {
      if (current || !str(e.kind) || e.revision !== 0) fail('INVALID_NATIVE_OPEN');
      if (turns.has(e.turnId) && e.role && turns.get(e.turnId).role !== e.role) fail('TURN_ROLE_CHANGED');
      if (!turns.has(e.turnId)) {
        if (!['user','assistant','system','tool','unknown'].includes(e.role)) fail('TURN_ROLE_MISSING');
        turns.set(e.turnId, { id:e.turnId, role:e.role, blocks:[], firstSequence:e.sequence });
      }
      const b = { id:e.blockId, turnId:e.turnId, kind:e.kind,
        nativeType:e.nativeType ?? null, revision:0, text:e.text ?? '',
        payload:clone(e.payload), state:'open', evidence:[] };
      blocks.set(key,b); turns.get(e.turnId).blocks.push(b);
    } else {
      if (!current || current.state !== 'open') fail('NATIVE_BLOCK_NOT_OPEN');
      if (e.op === 'close') {
        if (e.revision !== current.revision) fail('CLOSE_REVISION_MISMATCH');
        current.state = 'closed';
      } else if (e.op === 'invalidate') {
        if (e.revision !== current.revision) fail('INVALIDATE_REVISION_MISMATCH');
        current.state = 'invalidated';
      } else {
        if (e.revision !== current.revision + 1) fail('REVISION_GAP_OR_REPLAY');
        if (e.op === 'append') {
          if (e.text === undefined || e.payload !== undefined) fail('INVALID_APPEND');
          current.text += e.text;
        } else if (e.op === 'replace') {
          if (e.text === undefined && e.payload === undefined) fail('INVALID_REPLACE');
          if (e.text !== undefined) current.text=e.text;
          if (e.payload !== undefined) current.payload=clone(e.payload);
        }
        current.revision=e.revision;
      }
    }
    const b = blocks.get(key);
    b.evidence.push({ sid:e.evidence.sid, seq:e.evidence.seq, eventId:e.eventId, sourceSequence:e.sequence });
    seen.set(e.eventId,frozen); lastSeq=e.sequence;
  }
  return { schema:NATIVE_GRAPH_SCHEMA, scope:clone(scope), lastSequence:lastSeq, replayed,
    turns:[...turns.values()].map(t=>({ ...t, blocks:t.blocks.map(b=>({ ...b, evidence:[...b.evidence] })) })),
    effectAuthorization:false, acceptedConversation:false, userGoal:'unknown' };
}
