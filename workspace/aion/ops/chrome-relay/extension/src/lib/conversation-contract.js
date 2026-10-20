/**
 * AION P1 — canonical, data-only observation contracts.
 * Source authority: accepted Track B design, document 12, 2026-10-20.
 * Event and snapshot are separate from the effect Bus and its sanitized ledger.
 */
export const CONVERSATION_EVENT_SCHEMA = 'aion.conversation.event/1';
export const CONVERSATION_SNAPSHOT_SCHEMA = 'aion.conversation.snapshot/1';
export const RECEIVE_LIMITS = Object.freeze({ messages: 200, textChars: 16384, idChars: 512 });
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v, allowed, required = allowed) => isObject(v)
  && Object.keys(v).every((k) => allowed.includes(k))
  && required.every((k) => Object.hasOwn(v, k));
const key = (v) => typeof v === 'string' && v.length > 0 && v.length <= RECEIVE_LIMITS.idChars;
const seq = (v) => Number.isSafeInteger(v) && v >= 0;
const pos = (v) => Number.isSafeInteger(v) && v > 0;
const role = (v) => v === 'user' || v === 'assistant';
const identity = (v) => v === 'provider_dom_id' || v === 'provisional_page_position';
const completion = (v) => ['not_assistant', 'unknown', 'incomplete_or_unknown', 'inferred_settled'].includes(v);
const coverageReason = (v) => typeof v === 'string' && v.length <= 160;

export function validateConversationBinding(binding) {
  return exact(binding, ['provider', 'account_key', 'conversation_id', 'ref', 'revision'])
    && ['provider', 'account_key', 'conversation_id', 'ref'].every((field) => key(binding[field]))
    && pos(binding.revision);
}
export function validateObservationCursor(cursor) {
  return exact(cursor, ['epoch', 'sequence']) && key(cursor.epoch) && seq(cursor.sequence);
}
export function validateObservedMessage(message) {
  return exact(message, [
    'key', 'role', 'revision', 'identity', 'text', 'text_truncated',
    'incomplete', 'completion'
  ]) && key(message.key) && role(message.role) && pos(message.revision)
    && identity(message.identity)
    && typeof message.text === 'string' && message.text.length <= RECEIVE_LIMITS.textChars
    && typeof message.text_truncated === 'boolean'
    && typeof message.incomplete === 'boolean'
    && completion(message.completion)
    && (message.role === 'assistant' || message.completion === 'not_assistant');
}
export function validateObservationCoverage(coverage) {
  return exact(coverage, ['complete_history', 'reason', 'bounded', 'ambiguous_identity'])
    && typeof coverage.complete_history === 'boolean'
    && coverageReason(coverage.reason)
    && typeof coverage.bounded === 'boolean'
    && typeof coverage.ambiguous_identity === 'boolean';
}
export function validateConversationEvent(event) {
  return exact(event, [
    'schema', 'kind', 'binding', 'page_epoch', 'cursor',
    'observed_at_ms', 'message', 'coverage'
  ]) && event.schema === CONVERSATION_EVENT_SCHEMA
    && event.kind === 'message.observed'
    && validateConversationBinding(event.binding) && key(event.page_epoch)
    && validateObservationCursor(event.cursor) && seq(event.observed_at_ms)
    && validateObservedMessage(event.message) && validateObservationCoverage(event.coverage);
}
export function validateConversationSnapshot(snapshot) {
  return exact(snapshot, [
    'schema', 'binding', 'page_epoch', 'cursor', 'observed_at_ms',
    'messages', 'coverage'
  ]) && snapshot.schema === CONVERSATION_SNAPSHOT_SCHEMA
    && validateConversationBinding(snapshot.binding) && key(snapshot.page_epoch)
    && validateObservationCursor(snapshot.cursor) && seq(snapshot.observed_at_ms)
    && Array.isArray(snapshot.messages)
    && snapshot.messages.length <= RECEIVE_LIMITS.messages
    && snapshot.messages.every(validateObservedMessage)
    && validateObservationCoverage(snapshot.coverage);
}
/** Projection: never spread untrusted DOM/page objects into a canonical record. */
export function projectObservedMessage(m) {
  return {
    key: m.messageKey,
    role: m.role,
    revision: m.revision,
    identity: m.identity,
    text: m.text,
    text_truncated: m.textTruncated === true,
    incomplete: m.incomplete === true,
    completion: m.completion,
  };
}
export function projectObservationCoverage(c = {}) {
  return {
    complete_history: c.complete_history === true,
    reason: typeof c.reason === 'string' ? c.reason.slice(0, 160) : 'not_proven',
    bounded: c.bounded === true,
    ambiguous_identity: c.ambiguousIdentity === true,
  };
}
export function createConversationEvent({
  binding, pageEpoch, cursor, message, coverage, observedAtMs
}) {
  const event = {
    schema: CONVERSATION_EVENT_SCHEMA,
    kind: 'message.observed',
    binding,
    page_epoch: pageEpoch,
    cursor,
    observed_at_ms: observedAtMs,
    message: projectObservedMessage(message),
    coverage: projectObservationCoverage(coverage),
  };
  if (!validateConversationEvent(event)) throw new TypeError('invalid AION receive event');
  return event;
}
export function createConversationSnapshot({
  binding, pageEpoch, cursor, messages, coverage, observedAtMs
}) {
  const snapshot = {
    schema: CONVERSATION_SNAPSHOT_SCHEMA,
    binding,
    page_epoch: pageEpoch,
    cursor,
    observed_at_ms: observedAtMs,
    messages: messages.map(projectObservedMessage),
    coverage: projectObservationCoverage(coverage),
  };
  if (!validateConversationSnapshot(snapshot)) throw new TypeError('invalid AION receive snapshot');
  return snapshot;
}
