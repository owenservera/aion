/**
 * PACK-02 — AION read-only ChatGPT web page inspection profile.
 * Adapted from multi-ai-chat/src/content/chatgptDom.ts, donor upstream
 * cdcf6a7fb05609b219fd85395a116f26476a7f92 (MIT).
 * No composer, Send, click, Enter, private API or effect commands.
 */
export const CHATGPT_READ_SELECTORS = Object.freeze({
  messages: '[data-message-author-role="user"], [data-message-author-role="assistant"]',
  assistant: '[data-message-author-role="assistant"]',
  user: '[data-message-author-role="user"]',
  copyAction: '[data-testid="copy-turn-action-button"]',
  stopAction: [
    '[data-testid="stop-button"]',
    '[data-testid="composer-stop-button"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label="Stop streaming"]',
  ].join(', '),
  loggedOut: [
    '[data-testid="login-button"]',
    '[data-testid="signup-button"]',
    'a[href^="/auth/login"]',
    'a[href^="/auth/signup"]',
  ].join(', '),
});

export function chatGptConversationFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !['chatgpt.com', 'chat.openai.com'].includes(url.hostname)) {
      return null;
    }
    const match = /^\/c\/([a-zA-Z0-9_-]{8,128})\/?$/.exec(url.pathname);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function attribute(node, name) {
  return typeof node?.getAttribute === 'function' ? node.getAttribute(name) : null;
}
function query(node, selector) {
  return typeof node?.querySelector === 'function' ? node.querySelector(selector) : null;
}
function closest(node, selector) {
  return typeof node?.closest === 'function' ? node.closest(selector) : null;
}

export function isIncompleteChatGptAssistantTurn(turn) {
  if (!turn) return false;
  const assistant = attribute(turn, 'data-message-author-role') === 'assistant'
    || Boolean(query(turn, CHATGPT_READ_SELECTORS.assistant));
  // Read-side donor heuristic: absence of the copy control is one negative
  // signal, not positive proof that the answer is still streaming.
  return assistant && !query(turn, CHATGPT_READ_SELECTORS.copyAction)
    && !query(closest(turn, '[data-testid^="conversation-turn-"]'), CHATGPT_READ_SELECTORS.copyAction);
}

function containerFor(node) {
  return closest(node, '[data-testid^="conversation-turn-"]') || node;
}

export function readChatGptDomMessages(root, { maxMessages = 100, maxTextChars = 16384 } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return { messages: [], coverage: { complete_history: false, reason: 'no_dom_root', scanned: 0 } };
  }
  const maximum = Number.isSafeInteger(maxMessages) ? Math.max(1, Math.min(200, maxMessages)) : 100;
  const charLimit = Number.isSafeInteger(maxTextChars) ? Math.max(1, Math.min(16384, maxTextChars)) : 16384;
  const elements = Array.from(root.querySelectorAll(CHATGPT_READ_SELECTORS.messages));
  // The newest bounded view is useful to watch, but older history remains UNKNOWN.
  const observed = elements.slice(-maximum);
  let ambiguousIdentity = false;
  const messages = observed.map((node, index) => {
    const container = containerFor(node);
    const role = attribute(node, 'data-message-author-role');
    const rawId = attribute(node, 'data-message-id')
      || attribute(container, 'data-message-id');
    const testid = attribute(container, 'data-testid') || '';
    const stableKey = rawId && rawId.length <= 256 ? rawId : null;
    const identity = stableKey ? 'provider_dom_id' : 'provisional_page_position';
    // Note that displayed DOM position is relative to this sample's bounded
    // tail, NOT a globally unique message identity across page remounts.
    if (!stableKey) ambiguousIdentity = true;
    const content = query(node, '[data-message-text], .markdown, [class*="whitespace-pre-wrap"]') || node;
    const rawText = typeof content.innerText === 'string'
      ? content.innerText : typeof content.textContent === 'string' ? content.textContent : '';
    const text = rawText.slice(0, charLimit);
    const incomplete = role === 'assistant' && isIncompleteChatGptAssistantTurn(container);
    return {
      messageKey: stableKey || `provisional:${index}:${testid.slice(0, 64)}`,
      identity,
      role,
      text,
      textTruncated: rawText.length > charLimit,
      incomplete,
      hasCopyControl: Boolean(query(container, CHATGPT_READ_SELECTORS.copyAction)),
      index, // DOM order within this bounded sample only
    };
  });
  const keyCounts = new Map();
  for (const msg of messages) {
    keyCounts.set(msg.messageKey, (keyCounts.get(msg.messageKey) || 0) + 1);
  }
  const duplicateKeys = [...keyCounts.values()].some((count) => count > 1);
  const coverageReason = duplicateKeys ? 'duplicate_message_keys'
    : elements.length > maximum ? 'bounded_dom_window'
    : ambiguousIdentity ? 'provisional_message_identity'
    : 'dom_history_not_proven';
  return {
    messages,
    coverage: {
      complete_history: false,
      reason: coverageReason,
      scanned: elements.length,
      observed: messages.length,
      bounded: elements.length > maximum,
      ambiguousIdentity: ambiguousIdentity || duplicateKeys,
      duplicateKeys,
      shadowDomOrIframeCoverage: 'unknown',
    },
  };
}
