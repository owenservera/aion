// AION Chrome Relay Station — ChatGPT page-side adapter (content script).
//
// WHAT THIS FILE IS FOR
//   The M1 introspection chain: a command arrives, the composer is filled and the
//   answer submitted, the answer is awaited, read back, and handed to
//   `correlate.js`, which decides — not this file — whether it may be reported.
//
// REQUIRES the manifest entry to declare `"type": "module"` for this script. It
// imports `../lib/index.js` for the relay envelope rather than re-implementing
// validation, and `./correlate.js` for the verdict. There is no copy of the
// correlation rules here to drift out of sync with the module that enforces them.
//
// TRUST (ARCHITECTURE.md §Authority model)
//   The page is untrusted. This script never listens to page events and never
//   accepts a command that did not arrive over the extension port. A page script
//   cannot reach `chrome.runtime`, so it cannot drive this adapter. Every command
//   below requires an explicit `user_gesture: true` from the extension side: the
//   adapter never composes, submits or reads on load, on a timer, or on its own.
//
// SECRETS
//   No cookie jar, no storage bag, no session token, no page bootstrap payload and
//   no network endpoint is read anywhere below. There is no `fetch`, no XHR and no
//   `postMessage` to the page: the only data that leaves is the text ChatGPT
//   rendered into the conversation tree, which the owner explicitly asked for by
//   commanding this turn.
//
// TECHNIQUE
//   Ported from the proven extensions/chatgpt/content.js: `execCommand('insertText')`
//   with a textContent + InputEvent fallback for the ProseMirror composer; a
//   pointerdown/mousedown/mouseup/click MouseEvent sequence for React controls that
//   ignore `.click()`; `data-testid="stop-button"` presence as the generating
//   indicator; and `channel === 'final'` assistant blocks as the only answer.
//   Deviations are marked "DEVIATION" with the reason.

import { createEnvelope } from '../lib/index.js';
import {
  DEFAULT_POLL_MS,
  DEFAULT_SETTLE_MS,
  DEFAULT_TIMEOUT_MS,
  REASON,
  correlateReply,
  extractFinalReply,
  normalizeText,
  waitForGenerationEnd,
} from './correlate.js';

const PORT_NAME = 'aion-chatgpt';

/** Selectors, ported from the proven adapter and the M0.5 capture adapter. */
const COMPOSER_SELECTOR = '#prompt-textarea';
const STOP_BUTTON_SELECTOR = '[data-testid="stop-button"]';
const SEND_BUTTON_SELECTOR = '[data-testid="send-button"]';
const USER_SELECTOR = '[data-message-author-role="user"]';
const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]';
const USER_FALLBACK_SELECTOR = '[class*="user-message"]';
const ASSISTANT_FALLBACK_SELECTORS = ['[class*="MarkdownRoot-"]', '.markdown'];
const TEXT_SELECTORS = ['.markdown', '[class*="MarkdownRoot-"]'];

/** Bound on a single turn, whatever a command asks for. */
const MAX_TIMEOUT_MS = 300000;
/** Captured reply length kept in the envelope payload. Correlation sees it all. */
const MAX_STORED_REPLY_CHARS = 8000;
/** One turn at a time. A second command while one is in flight is refused. */
let activeTurn = false;

/* ------------------------------------------------------------------ primitives */

/** React ignores plain `.click()` on some controls — the proven synthetic sequence. */
function fireClick(element) {
  if (!element) return false;
  try {
    if (element.focus) {
      try {
        element.focus();
      } catch (err) {
        /* focus is best effort */
      }
    }
    const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : { x: 0, y: 0 };
    ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((type) => {
      element.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: globalThis,
          clientX: (rect.x || 0) + 5,
          clientY: (rect.y || 0) + 5,
          button: 0,
        }),
      );
    });
    return true;
  } catch (err) {
    return false;
  }
}

/** Composer state: generating indicator plus the submit control's reachability. */
function sendState() {
  const stop = document.querySelector(STOP_BUTTON_SELECTOR);
  const send = document.querySelector(SEND_BUTTON_SELECTOR);
  return {
    generating: !!stop,
    sendPresent: !!send,
    sendDisabled: send ? !!send.disabled : true,
  };
}

/** The generating probe handed to the DOM-free wait. */
function isGenerating() {
  return !!document.querySelector(STOP_BUTTON_SELECTOR);
}

/**
 * Fill the composer. Ported from the proven `composerFill`, with one DEVIATION:
 * the composer is emptied first.
 *
 * REASON: the proven version appends to whatever is already in the box. On a
 * reused tab that silently submits the operator's half-written text together with
 * the probe, which would both leak content and produce an answer that cannot be
 * correlated.
 */
function composerFill(text) {
  const editor = document.querySelector(COMPOSER_SELECTOR);
  if (!editor) return { ok: false, error: 'composer #prompt-textarea not found' };
  try {
    editor.focus();
  } catch (err) {
    /* focus is best effort */
  }

  try {
    editor.textContent = '';
  } catch (err) {
    /* a non-writable node is handled by the insert path below */
  }
  try {
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } catch (err) {
    /* best effort: the insert path re-syncs React anyway */
  }

  let inserted = false;
  try {
    inserted = document.execCommand('insertText', false, text);
  } catch (err) {
    inserted = false;
  }
  if (!inserted) {
    try {
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
      inserted = true;
    } catch (err2) {
      return { ok: false, error: 'composer insert failed' };
    }
  }
  return { ok: true };
}

function sleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

/** Origin + path only. Query strings and fragments are dropped: data minimisation. */
function safeUrl() {
  try {
    return `${location.origin}${location.pathname}`;
  } catch (err) {
    return null;
  }
}

/* ------------------------------------------------------------------- reading */

/** Visible text of one node: the rendered subtree first, raw text as a last resort. */
function readNodeText(node) {
  if (!node) return '';
  for (const selector of TEXT_SELECTORS) {
    let inner = null;
    try {
      inner = node.querySelector(selector);
    } catch (err) {
      inner = null;
    }
    const target = inner || node;
    const value = target.innerText !== undefined && target.innerText !== null ? target.innerText : target.textContent;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function matches(node, selector) {
  try {
    return typeof node.matches === 'function' && node.matches(selector);
  } catch (err) {
    return false;
  }
}

/**
 * A user node may sit inside a plain container (`group/user-message`) with no role
 * attribute. DEVIATION-free: this is the exclusion the M0.5 adapter documented as
 * load-bearing — the outbound prompt itself contains the correlation id and the
 * expected token, so anything inside a user container can never be an answer.
 */
function insideUserContainer(node) {
  try {
    return typeof node.closest === 'function' && !!node.closest(`${USER_SELECTOR}, ${USER_FALLBACK_SELECTOR}`);
  } catch (err) {
    return false;
  }
}

/** Classify a scanned node, or null when it is neither side of the conversation. */
function classifyNode(node) {
  if (!node) return null;
  if (matches(node, USER_SELECTOR) || matches(node, USER_FALLBACK_SELECTOR)) return 'user';
  if (insideUserContainer(node)) return null;
  if (matches(node, ASSISTANT_SELECTOR)) return 'assistant';
  for (const selector of ASSISTANT_FALLBACK_SELECTORS) {
    if (matches(node, selector)) return 'assistant';
  }
  return null;
}

/**
 * Read the conversation as an ordered `[{role, text}]` list.
 *
 * One `querySelectorAll` with a comma-separated selector is used on purpose: a
 * single query returns nodes in document order, which is what pairs an answer with
 * the turn that follows it. Nested assistant markup (`.markdown` inside a
 * `MarkdownRoot` div inside an assistant container) yields duplicates, so an
 * already-accepted node suppresses any node it contains.
 */
function readOrderedTurns() {
  const selector = [
    USER_SELECTOR,
    ASSISTANT_SELECTOR,
    USER_FALLBACK_SELECTOR,
    ...ASSISTANT_FALLBACK_SELECTORS,
  ].join(', ');

  let nodes = [];
  try {
    nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
  } catch (err) {
    return { ok: false, error: 'conversation tree could not be queried', blocks: [] };
  }

  const blocks = [];
  for (const node of nodes) {
    const role = classifyNode(node);
    if (!role) continue;
    if (blocks.some((block) => block.node.contains && block.node.contains(node))) continue;
    const text = readNodeText(node);
    if (!text.trim()) continue;
    blocks.push({ kind: role === 'user' ? 'user' : 'final', role, channel: role === 'user' ? null : 'final', node, text });
  }
  return { ok: true, error: null, blocks };
}

/**
 * Take the answer that FOLLOWS the most recent user turn.
 *
 * DEVIATION from the proven `readLastAssistantText`, which returns the last
 * assistant node in the tab: on a conversation that already had turns, that
 * returns the PREVIOUS answer whenever our own answer has not rendered yet — a
 * stale reply that happens to contain the right correlation would then pass. Here
 * the last user turn is located first and only later assistant nodes are eligible,
 * so a missing answer reads as missing instead of as the old one.
 */
function readFinalReplyAfterLastUserTurn() {
  const scan = readOrderedTurns();
  if (!scan.ok) return { ok: false, error: scan.error, blocks: [] };

  let lastUserIndex = -1;
  for (let i = 0; i < scan.blocks.length; i += 1) {
    if (scan.blocks[i].role === 'user') lastUserIndex = i;
  }

  const candidates = scan.blocks
    .slice(lastUserIndex + 1)
    .filter((block) => block.role === 'assistant')
    .map((block) => ({ kind: 'final', role: 'assistant', channel: 'final', text: block.text }));

  return {
    ok: true,
    error: null,
    blocks: candidates,
    waited_for_user_turn: lastUserIndex >= 0,
  };
}

/* ------------------------------------------------------------------- envelope */

function buildEnvelope(kind, messageId, correlationId, payload) {
  return createEnvelope({
    producer_node: 'node-ext-chatgpt',
    target_node: 'node-native-01',
    target_role: null,
    event_type: kind === 'accepted' ? 'proof.submitted' : 'proof.rejected',
    correlation_id: correlationId || null,
    causation_id: null,
    idempotency_key: correlationId ? `chatgpt:${correlationId}` : `chatgpt:${messageId}`,
    expires_at: null,
    approved_scope_ref: null,
    payload_ref: null,
    payload_hash: null,
    delivery_state: 'OUTBOX',
    task_state: kind === 'accepted' ? 'PROOF_SUBMITTED' : 'REJECTED',
    payload,
  });
}

/* --------------------------------------------------------------------- turns */

async function runTurn(command, respond) {
  if (activeTurn) {
    respond({ ok: false, reason: 'turn_in_flight', error: 'a turn is already in progress in this tab' });
    return;
  }
  if (command.user_gesture !== true) {
    respond({
      ok: false,
      reason: 'gesture_required',
      error: 'this adapter composes only on an explicit commanded gesture; nothing was typed or sent',
    });
    return;
  }

  const text = typeof command.text === 'string' ? command.text : '';
  const correlationId = typeof command.correlation_id === 'string' ? command.correlation_id.trim() : '';
  const expectedToken = typeof command.expected_reply_token === 'string' ? command.expected_reply_token.trim() : '';

  activeTurn = true;
  const startedAt = new Date().toISOString();
  try {
    const fill = composerFill(text);
    if (!fill.ok) {
      respond({ ok: false, reason: REASON.BAD_INPUT, error: fill.error });
      return;
    }

    // One tick for React to register the inserted text, as the proven adapter does.
    await sleep(400);
    const beforeSend = sendState();
    if (beforeSend.sendDisabled) {
      respond({
        ok: false,
        reason: 'send_button_disabled',
        error: 'the send control stayed disabled after the composer was filled; nothing was submitted',
        state: beforeSend,
      });
      return;
    }
    if (!fireClick(document.querySelector(SEND_BUTTON_SELECTOR))) {
      respond({ ok: false, reason: 'send_button_missing', error: 'the send control could not be activated' });
      return;
    }

    // `mustHaveStarted` is what stops a pre-generation read from passing off the
    // previous turn's answer as this turn's; see correlate.js.
    const wait = await waitForGenerationEnd({
      isGenerating,
      timeoutMs: Math.min(MAX_TIMEOUT_MS, Number(command.timeout_ms) > 0 ? Number(command.timeout_ms) : DEFAULT_TIMEOUT_MS),
      pollMs: DEFAULT_POLL_MS,
      settleMs: DEFAULT_SETTLE_MS,
      mustHaveStarted: true,
      sleep,
    });

    const captured = readFinalReplyAfterLastUserTurn();
    const extracted = captured.ok ? extractFinalReply(captured.blocks, { source: 'dom-assistant-turn' }) : null;

    const verdict = correlateReply({
      reply: extracted && extracted.ok ? extracted.text : null,
      expected: { correlation_id: correlationId, reply_token: expectedToken },
      outbound_text: text,
      role: 'assistant',
      channel: 'final',
      source: 'dom-assistant-turn',
      model: extracted ? extracted.model : null,
      generation_complete: wait.ok === true,
      generation_started: wait.started === true,
    });

    const payload = {
      schema: verdict.schema,
      correlation_id: correlationId || null,
      accepted: verdict.accepted,
      reason: verdict.reason,
      detail: verdict.detail,
      reply_text: verdict.accepted ? verdict.reply.slice(0, MAX_STORED_REPLY_CHARS) : null,
      expected_reply: verdict.expected_reply,
      model: extracted ? extracted.model : null,
      generation: { started: wait.started === true, complete: wait.ok === true, reason: wait.reason, elapsed_ms: wait.elapsed_ms },
      extraction: extracted
        ? { ok: extracted.ok, reason: extracted.reason, detail: extracted.detail }
        : { ok: false, reason: REASON.BAD_INPUT, detail: captured.error },
      observed: verdict.observed,
      source_url: safeUrl(),
      started_at: startedAt,
      captured_at: new Date().toISOString(),
    };

    respond({
      ok: verdict.accepted,
      verdict,
      envelope: buildEnvelope(verdict.accepted ? 'accepted' : 'rejected', verdict.correlation_id || null, correlationId, payload),
      state: sendState(),
    });
  } finally {
    activeTurn = false;
  }
}

function readFinal(command, respond) {
  const correlationId = typeof command.correlation_id === 'string' ? command.correlation_id.trim() : '';
  const expectedToken = typeof command.expected_reply_token === 'string' ? command.expected_reply_token.trim() : '';
  const captured = readFinalReplyAfterLastUserTurn();
  const extracted = captured.ok ? extractFinalReply(captured.blocks, { source: 'dom-assistant-turn' }) : null;
  const verdict = correlateReply({
    reply: extracted && extracted.ok ? extracted.text : null,
    expected: { correlation_id: correlationId, reply_token: expectedToken },
    outbound_text: typeof command.outbound_text === 'string' ? command.outbound_text : null,
    role: 'assistant',
    channel: 'final',
    source: 'dom-assistant-turn',
    generation_complete: command.generation_complete === true,
    generation_started: null,
  });
  respond({
    ok: verdict.accepted,
    verdict,
    generation: { complete: command.generation_complete === true, asserted_by_caller: true },
  });
}

/* ------------------------------------------------------------------ plumbing */

const ACTIONS = {
  ping() {
    return { ok: true, href: safeUrl(), title: document.title, state: sendState(), note: 'read-only probe; nothing composed or sent' };
  },
  state() {
    return { ok: true, state: sendState() };
  },
  'run-turn': runTurn,
  'read-final': readFinal,
  stop() {
    const button = document.querySelector(STOP_BUTTON_SELECTOR);
    return { ok: true, what: button && fireClick(button) ? 'stopped' : 'not generating' };
  },
};

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;
    port.onMessage.addListener((message) => {
      const action = message && typeof message.action === 'string' ? message.action : '';
      const handler = Object.prototype.hasOwnProperty.call(ACTIONS, action) ? ACTIONS[action] : null;
      if (!handler) {
        port.postMessage({ action, ok: false, reason: 'unknown_action', error: `no action ${JSON.stringify(action)}` });
        return;
      }
      let answered = false;
      const respond = (result) => {
        if (answered) return;
        answered = true;
        port.postMessage(Object.assign({ action }, result));
      };
      try {
        Promise.resolve(handler(message, respond)).catch((err) =>
          respond({ ok: false, reason: 'adapter_error', error: String(err && err.message ? err.message : err) }),
        );
      } catch (err) {
        respond({ ok: false, reason: 'adapter_error', error: String(err && err.message ? err.message : err) });
      }
    });
  });
}

// Exported for the DOM-stub test only; the extension path above never calls it
// directly. Kept behind the same guard as the port listener so importing this
// file under Node is a no-op.
export const __testing = { readOrderedTurns, readFinalReplyAfterLastUserTurn, normalizeText };