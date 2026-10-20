/**
 * AION P2 — integrated pure, read-only turn/response anchoring.
 * Adapted from multi-ai-chat/src/content/responseTracking.ts at upstream
 * cdcf6a7fb05609b219fd85395a116f26476a7f92 (MIT).
 * No Send confirmation, retry, actuator or operation-ID generation here.
 */
export function captureAssistantBaseline(messages = []) {
  return new Map(messages.filter((m) => m.role === 'assistant')
    .map((m) => [m.messageKey, { text: m.text, revision: m.revision ?? 0 }]));
}

/**
 * Fail closed if no authoritative freshly observed user message ID is supplied.
 * Prefer provider-derived keys. Positional/remount keys can never prove a match.
 * Only assistants between that user and the next user belong to this candidate.
 */
export function assistantFollowingConfirmedUser(messages = [], confirmedUserMessageKey = '') {
  if (!confirmedUserMessageKey || confirmedUserMessageKey.startsWith('provisional:')) {
    return { status: 'unknown', reason: 'no_confirmed_user_message', assistant: null };
  }
  const anchors = messages.filter((m) =>
    m.role === 'user' && m.identity === 'provider_dom_id'
    && m.messageKey === confirmedUserMessageKey);
  if (anchors.length !== 1) {
    return { status: 'unknown', reason: 'user_anchor_absent_or_ambiguous', assistant: null };
  }
  const start = messages.indexOf(anchors[0]);
  const inTurn = [];
  for (let i = start + 1; i < messages.length; i++) {
    if (messages[i].role === 'user') break;
    if (messages[i].role === 'assistant') inTurn.push(messages[i]);
  }
  if (inTurn.length !== 1) {
    return { status: 'unknown', reason: inTurn.length ? 'ambiguous_assistant_candidates' : 'no_assistant_yet', assistant: null };
  }
  const assistant = inTurn[0];
  if (assistant.identity !== 'provider_dom_id' || !assistant.text.trim()
    || assistant.textTruncated || assistant.incomplete) {
    return { status: 'unknown', reason: 'assistant_empty_incomplete_or_provisional', assistant: null };
  }
  // It is only candidate evidence. Dev's P1 correlation must independently
  // establish a real new user turn and positive completion/operation pairing.
  return { status: 'candidate', reason: 'anchored_read_only', assistant };
}

/** Do not fall back to an older answer when latest assistant is an empty shell. */
export function latestChangedAssistant(messages = [], baseline = new Map(),
  { confirmedUserMessageKey = '' } = {}) {
  const anchor = assistantFollowingConfirmedUser(messages, confirmedUserMessageKey);
  if (anchor.status !== 'candidate') return null;
  const message = anchor.assistant;
  const previous = baseline.get(message.messageKey);
  if (previous && previous.text === message.text) return null;
  return message;
}
