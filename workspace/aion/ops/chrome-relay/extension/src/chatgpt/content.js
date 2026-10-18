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

/**
 * Machine-readable "nothing was sent" reasons.
 *
 * These are refusals of the COMPOSING step, not correlation verdicts, so they
 * are deliberately separate from REASON in correlate.js: a caller that sees one
 * of these knows no text was typed, no control was clicked and no request was
 * made, which REASON.BAD_INPUT does not imply.
 */
export const NO_SEND = Object.freeze({
  COMPOSER_MISSING: 'composer_missing',
  COMPOSER_AMBIGUOUS: 'composer_ambiguous',
  COMPOSER_DRAFT_PRESENT: 'composer_draft_present',
  GENERATION_ACTIVE: 'generation_active',
  // The composer exists and counts as visible, but its contents could not be
  // read. Refusing is the only safe reading: "I cannot see your draft" is not
  // "you have no draft".
  COMPOSER_STATE_UNKNOWN: 'composer_state_unknown'
});

/** Exactly one visible composer, or nothing is typed. */
const REQUIRED_COMPOSER_COUNT = 1;

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

/**
 * Is this element actually visible?
 *
 * Deliberately not "does it match the selector". chatgpt.com keeps hidden
 * composers around (collapsed threads, background tabs, pre-rendered shells),
 * and typing into one of those is how a probe lands in the wrong conversation.
 * Layout evidence is consulted where it exists and simply skipped where it does
 * not, so this works in the DOM stub as well as in the page.
 */
function isVisible(node) {
  if (!node) return false;
  try {
    if (node.hidden === true) return false;
    if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') return false;

    const view = node.ownerDocument && node.ownerDocument.defaultView;
    const computed = view && typeof view.getComputedStyle === 'function' ? view.getComputedStyle(node) : null;
    const inline = node.style || {};
    const display = (computed && computed.display) || inline.display;
    if (display === 'none') return false;
    const visibility = (computed && computed.visibility) || inline.visibility;
    if (visibility === 'hidden' || visibility === 'collapse') return false;
    if (typeof node.getClientRects === 'function') {
      const rects = node.getClientRects();
      // Present but empty means no layout box at all. A stub that does not
      // implement it returns undefined, which is not evidence of hidden.
      if (rects && typeof rects.length === 'number' && rects.length === 0) return false;
    }
    if (typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      // width/height of exactly zero is the standard "laid out but invisible".
      // Undefined means the stub has no box model, so it is not evidence.
      if (rect && typeof rect.width === 'number' && typeof rect.height === 'number'
        && rect.width === 0 && rect.height === 0) return false;
    }
    return true;
  } catch (err) {
    // FAIL CLOSED. An unreadable layout is not evidence that the composer is
    // usable, and treating it as visible is how text lands in a node nobody can
    // see. The cost is a refusal on a page whose layout API throws, which is the
    // right direction for exactly this question.
    return false;
  }
}

/** Every visible composer in the document, in document order. */
function visibleComposers() {
  let nodes = [];
  try {
    nodes = Array.prototype.slice.call(document.querySelectorAll(COMPOSER_SELECTOR));
  } catch (err) {
    return [];
  }
  return nodes.filter(isVisible);
}

/** Composer state: generating indicator, submit reachability, composer count. */
function sendState() {
  const stop = document.querySelector(STOP_BUTTON_SELECTOR);
  const send = document.querySelector(SEND_BUTTON_SELECTOR);
  return {
    generating: !!stop,
    sendPresent: !!send,
    sendDisabled: send ? !!send.disabled : true,
    // A COUNT, not a boolean: the difference between "one composer" and "two
    // composers" is the difference between typing and guessing.
    composer_visible_count: visibleComposers().length,
  };
}

/**
 * Whatever the composer already holds, or `null` when it cannot be read.
 *
 * The `null` matters: returning '' on a read failure reports "empty", and an
 * empty composer is exactly the state that authorises overwriting whatever is
 * really in the box. A draft we cannot read is a draft we must not overwrite.
 */
function composerDraft(editor) {
  if (!editor) return '';
  try {
    if (typeof editor.value === 'string') return editor.value;
    if (typeof editor.innerText === 'string' && editor.innerText !== '') return editor.innerText;
    if (typeof editor.textContent === 'string') return editor.textContent;
  } catch (err) {
    return null;
  }
  return '';
}

/**
 * The gate every composing path passes BEFORE any text is touched.
 *
 * Four refusals, each of which leaves the page exactly as it was:
 *   - no visible composer            (nothing to type into)
 *   - more than one visible composer (which one is the operator's? unknown)
 *   - a generation already running   (typing now would land mid-turn)
 *   - a non-empty draft              (an operator's own unsent text; the old
 *                                     fill emptied the box and took it with it)
 *
 * The last one is a deliberate behaviour change: this adapter used to clear the
 * composer unconditionally so a reused tab could not leak a half-written
 * prompt into the probe. Overwriting is a worse failure than refusing.
 */
function preflightComposer() {
  const visible = visibleComposers();
  const state = sendState();
  if (visible.length === 0) {
    return {
      ok: false,
      code: NO_SEND.COMPOSER_MISSING,
      error: 'no visible #prompt-textarea was found; nothing was typed or sent',
      composer_visible_count: 0
    };
  }
  if (visible.length !== REQUIRED_COMPOSER_COUNT) {
    return {
      ok: false,
      code: NO_SEND.COMPOSER_AMBIGUOUS,
      error: `${visible.length} visible composers were found; refusing to guess which one is the operator's`,
      composer_visible_count: visible.length
    };
  }
  if (state.generating) {
    return {
      ok: false,
      code: NO_SEND.GENERATION_ACTIVE,
      error: 'a generation is already running; nothing was typed or sent',
      composer_visible_count: visible.length
    };
  }
  const draft = composerDraft(visible[0]);
  if (draft === null) {
    return {
      ok: false,
      code: NO_SEND.COMPOSER_STATE_UNKNOWN,
      error: 'the composer contents could not be read; refusing to assume it is empty',
      composer_visible_count: visible.length
    };
  }
  if (draft.trim() !== '') {
    return {
      ok: false,
      code: NO_SEND.COMPOSER_DRAFT_PRESENT,
      error: 'the composer holds unsent text; refusing to erase it. Nothing was typed or sent',
      composer_visible_count: visible.length,
      draft_chars: draft.length
    };
  }
  return { ok: true, editor: visible[0], composer_visible_count: visible.length };
}

/** The generating probe handed to the DOM-free wait. */
function isGenerating() {
  return !!document.querySelector(STOP_BUTTON_SELECTOR);
}

/**
 * Fill the composer, but only through the preflight.
 *
 * DEVIATION from the proven `composerFill` (which appended to whatever was in the
 * box): this refuses unless exactly one VISIBLE composer exists, nothing is
 * generating, and the composer is empty. The gate lives INSIDE the fill rather
 * than in its caller, so a call site added later inherits the refusal instead of
 * re-deriving — or forgetting — it. Nothing is erased and nothing is typed until
 * all three hold.
 */
function composerFill(text) {
  const pre = preflightComposer();
  if (!pre.ok) {
    return {
      ok: false,
      code: pre.code,
      error: pre.error,
      composer_visible_count: pre.composer_visible_count
    };
  }
  const editor = pre.editor;

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

  // Preflight BEFORE the turn lock: a refusal must not occupy the single turn
  // slot, and it must not have touched the page at all.
  const pre = preflightComposer();
  if (!pre.ok) {
    respond({
      ok: false,
      code: pre.code,
      reason: REASON.BAD_INPUT,
      error: pre.error,
      no_send: true,
      submitted: false,
      composer_visible_count: pre.composer_visible_count,
      state: sendState()
    });
    return;
  }

  activeTurn = true;
  const startedAt = new Date().toISOString();
  try {
    const fill = composerFill(text);
    if (!fill.ok) {
      respond({
        ok: false,
        code: fill.code || null,
        reason: REASON.BAD_INPUT,
        error: fill.error,
        no_send: true,
        submitted: false,
        state: sendState()
      });
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
      const fail = (err) =>
        respond({ ok: false, reason: 'adapter_error', error: String(err && err.message ? err.message : err) });
      try {
        // A handler either answers itself through `respond` (the callback
        // actions: run-turn, read-final) or RETURNS its result (the read-only
        // probes: ping, state, stop). Forward a returned value through the same
        // `respond` guard so a probe is no longer silently dropped, while a
        // callback that answered and also returned something still answers once.
        const result = handler(message, respond);
        if (result && typeof result.then === 'function') {
          result.then((value) => { if (value !== undefined) respond(value); }, fail);
        } else if (result !== undefined) {
          respond(result);
        }
      } catch (err) {
        fail(err);
      }
    });
  });
}

// Exported for the DOM-stub test only; the extension path above never calls it
// directly. Kept behind the same guard as the port listener so importing this
// file under Node is a no-op.
export const __testing = {
  readOrderedTurns,
  readFinalReplyAfterLastUserTurn,
  normalizeText,
  // The composing seam, exposed so the preflight can be regression-tested
  // without a browser: sendState, the gate itself, and the fill that uses it.
  sendState,
  preflightComposer,
  composerFill,
  visibleComposers,
  isVisible
};