/**
 * AION P2 — integrated exact-bound, read-only ChatGPT observation helper.
 *
 * Adapted from:
 *  - multi-ai-chat/src/content/{chatgptDom,responseTracking}.ts (MIT)
 *    upstream cdcf6a7fb05609b219fd85395a116f26476a7f92
 *  - chatgpt-bridge/src/bridge/coordinator/passiveObservationRouter.js
 *    upstream 0ffdae90239988f253058c05253226152acd55d2 (MIT),
 *    for keyed snapshot revisions and passive classification only.
 *
 * No mutation, fetch, chrome API, private API, timers, message sends, or Bus.
 */
import {
  CHATGPT_READ_SELECTORS, chatGptConversationFromUrl, readChatGptDomMessages,
} from './profile.js';
import { classifyPassiveTerminal } from '../../lib/terminal-evidence.js';

const validKey = (v) => typeof v === 'string' && v.length > 0 && v.length <= 512;

/**
 * caller-proved context must originate from AION's binding/session owner,
 * not untrusted page text. URL alone is NEVER evidence of account identity.
 * New instance on any binding or page epoch change; no implicit rebinding.
 */
export function createChatGptPassiveObserver({
  bindingKey, accountKey, conversationId, pageEpoch,
  maxMessages = 100, maxTextChars = 16384,
} = {}) {
  if (![bindingKey, accountKey, conversationId, pageEpoch].every(validKey)) {
    throw new TypeError('AION exact binding/account/conversation/page epoch required');
  }
  const remembered = new Map();
  let baselineCaptured = false;
  let lastStatus = 'initializing';
  const maximum = Number.isSafeInteger(maxMessages) ? Math.max(1, Math.min(200, maxMessages)) : 100;

  function sample(root, {
    pageUrl, authenticatedBindingKey, authenticatedAccountKey,
    observedPageEpoch, generationByMessageKey = {}, nowMs = 0,
  } = {}) {
    // Reject rather than sample another tab, route, account or page epoch.
    // The two authenticated keys MUST be independently vouched for by the
    // parent extension's existing binding authority.
    if (authenticatedBindingKey !== bindingKey || authenticatedAccountKey !== accountKey) {
      return { status: 'unbound', reason: 'binding_or_account_mismatch', events: [], snapshot: null };
    }
    if (observedPageEpoch !== pageEpoch) {
      return { status: 'reset_required', reason: 'page_epoch_changed', events: [], snapshot: null };
    }
    if (chatGptConversationFromUrl(pageUrl) !== conversationId) {
      return { status: 'unbound', reason: 'not_exact_thread_route', events: [], snapshot: null };
    }
    if (!root || typeof root.querySelectorAll !== 'function') {
      return { status: 'unknown', reason: 'dom_unavailable', events: [], snapshot: null };
    }
    if (root.querySelector?.(CHATGPT_READ_SELECTORS.loggedOut)) {
      return { status: 'unbound', reason: 'logged_out_ui', events: [], snapshot: null };
    }

    const read = readChatGptDomMessages(root, { maxMessages: maximum, maxTextChars });
    if (read.coverage.duplicateKeys) {
      return { status: 'unknown', reason: 'duplicate_message_keys', events: [],
        snapshot: { messages: [], coverage: read.coverage } };
    }
    const events = [];
    const now = Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : 0;
    const currentKeys = new Set();
    const snapshot = read.messages.map((msg) => {
      currentKeys.add(msg.messageKey);
      const signature = JSON.stringify([msg.role, msg.text, msg.textTruncated,
        msg.incomplete, msg.identity, msg.hasCopyControl]);
      const prev = remembered.get(msg.messageKey);
      const revision = prev ? prev.revision + Number(prev.signature !== signature) : 1;
      const stableSince = !prev || prev.signature !== signature ? now : prev.stableSince;
      const rawSignals = generationByMessageKey?.[msg.messageKey] || {};
      const stopVisible = Boolean(root.querySelector?.(CHATGPT_READ_SELECTORS.stopAction));
      const passive = msg.role === 'assistant' ? classifyPassiveTerminal({
        turn: { key: msg.identity === 'provider_dom_id' ? msg.messageKey : '' },
        output: {
          answer: msg.text,
          state: rawSignals.outputFinal === true && msg.hasCopyControl ? 'final' : 'unknown',
        },
        generation: {
          state: rawSignals.generationStopped === true ? 'stopped' : 'unknown',
          streamingVisible: rawSignals.streamingVisible === true || stopVisible,
          stopVisible,
          activeTool: rawSignals.activeTool === true,
        },
        blocker: { state: rawSignals.blockerAbsent === true ? 'none' : 'unknown' },
        stableForMs: now > 0 && stableSince > 0 ? now - stableSince : 0,
        textTruncated: msg.textTruncated,
        degraded: read.coverage.ambiguousIdentity,
      }) : null;
      const enriched = {
        ...msg, revision, pageEpoch,
        completion: passive?.state || 'not_assistant',
        completionVerified: false,
      };
      remembered.set(msg.messageKey, { signature, revision, stableSince });
      if (baselineCaptured && (!prev || prev.signature !== signature)) {
        // first_seen is NOT a claim this is a new provider turn: after DOM
        // remount/virtualization it could be old. Correlation uses P1 + anchor.
        events.push({ change: prev ? 'revised' : 'first_seen',
          currentTurnConfirmed: false, ...enriched });
      }
      return enriched;
    });
    // Strictly bounded in-memory state; cannot claim older messages are gone.
    for (const key of remembered.keys()) {
      if (!currentKeys.has(key) && remembered.size > maximum) remembered.delete(key);
    }
    baselineCaptured = true;
    lastStatus = 'observing';
    return {
      status: lastStatus,
      reason: '',
      bindingKey, accountKey, conversationId, pageEpoch,
      events,
      snapshot: {
        messages: snapshot,
        coverage: { ...read.coverage, complete_history: false },
        baselineCaptured: true,
      },
    };
  }

  return Object.freeze({
    sample,
    // No constructor or export exposes any effect/send method.
    state: () => ({ status: lastStatus, baselineCaptured, remembered: remembered.size }),
  });
}
