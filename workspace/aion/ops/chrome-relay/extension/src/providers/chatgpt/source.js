/**
 * AION P1/P2 receive composition: a PURE, watch-only ConversationSource.
 * Bound context comes from the authenticated extension binding owner, never
 * page text. No port, network, storage, action/Send methods or Bus side effects.
 * I1 still requires the separately authorized Chrome->host->CLI transport.
 */
import { BoundedReceiveJournal } from '../../lib/receive-journal.js';
import { validateConversationBinding, validateConversationEvent,
  createConversationEvent, createConversationSnapshot } from '../../lib/conversation-contract.js';
import { createChatGptPassiveObserver } from './observer.js';

export function createChatGptConversationSource({
  binding, pageEpoch, streamEpoch, maxMessages = 100,
} = {}) {
  if (!validateConversationBinding(binding)
    || typeof pageEpoch !== 'string' || !pageEpoch
    || typeof streamEpoch !== 'string' || !streamEpoch) {
    throw new TypeError('authenticated binding/pageEpoch/streamEpoch required');
  }
  const observer = createChatGptPassiveObserver({
    bindingKey: binding.ref, accountKey: binding.account_key,
    conversationId: binding.conversation_id, pageEpoch, maxMessages,
  });
  const journal = new BoundedReceiveJournal({
    bindingKey: binding.ref, pageEpoch, streamEpoch,
    validateEvent: validateConversationEvent,
  });
  let latest = null;
  let revoked = false;

  function sample(root, proof = {}) {
    if (revoked) return { status: 'unbound', reason: 'source_revoked', events: [], snapshot: null };
    // Only the caller that owns the authenticated binding supplies these facts.
    const read = observer.sample(root, proof);
    if (read.status === 'unbound' || read.status === 'reset_required') {
      revoked = true;
      latest = null;
      return { status: read.status, reason: read.reason, events: [], snapshot: null };
    }
    if (read.status !== 'observing' || !read.snapshot) {
      return { status: read.status, reason: read.reason, events: [], snapshot: null };
    }
    const now = Number.isSafeInteger(proof.nowMs) && proof.nowMs >= 0
      ? proof.nowMs : Date.now();
    const coverage = read.snapshot.coverage;
    journal.setCoverage({ complete_history: false });
    const events = [];
    for (const msg of read.events) {
      // Prospective cursor is sequential because this synchronous sampler owns
      // the only journal writer. Journal checks the canonical record BEFORE append.
      const cursor = { epoch: streamEpoch, sequence: journal.metadata().latestSequence + 1 };
      const event = createConversationEvent({
        binding, pageEpoch, cursor, message: msg, coverage, observedAtMs: now,
      });
      const result = journal.publish({
        event, bindingKey: binding.ref, pageEpoch,
        messageKey: msg.messageKey, revision: msg.revision,
      });
      if (result.accepted) {
        if (result.cursor.epoch !== cursor.epoch || result.cursor.sequence !== cursor.sequence) {
          throw new Error('receive journal cursor mismatch');
        }
        events.push(event);
      }
    }
    latest = createConversationSnapshot({
      binding, pageEpoch,
      cursor: { epoch: streamEpoch, sequence: journal.metadata().latestSequence },
      messages: read.snapshot.messages, coverage, observedAtMs: now,
    });
    return { status: 'observing', events, snapshot: latest };
  }
  return Object.freeze({
    sample,
    readSnapshot: () => latest ? structuredClone(latest) : null,
    readPage: (options) => journal.readPage(options),
    status: () => ({ revoked, ...journal.metadata() }),
  });
}
