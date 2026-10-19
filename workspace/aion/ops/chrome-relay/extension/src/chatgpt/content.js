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

import { createEnvelope } from '../lib/envelope.js';
import {
  DEFAULT_POLL_MS,
  DEFAULT_SETTLE_MS,
  DEFAULT_TIMEOUT_MS,
  REASON,
  correlateReply,
  extractFinalReply,
  normalizeText,
} from './correlate.js';

const PORT_NAME = 'aion-chatgpt';

/**
 * Selectors that can identify the ChatGPT composer.
 *
 * `#prompt-textarea` is the legacy composer id. The current page renders a
 * ProseMirror contenteditable editor (UI Automation reports class `ProseMirror`
 * and accessible name `Ask ChatGPT`) and did not expose the legacy id in the
 * 2026-10-18 live run, so a second, equally narrow selector is allowed.
 *
 * DEVIATION (deliberate): this is NOT a generic `textarea` or
 * `[contenteditable]` query. Any editable region elsewhere on the page is not
 * the composer, and typing a probe into it would land in the wrong surface. The
 * fallback is scoped to a ProseMirror editor that is explicitly editable, and
 * every candidate must still pass the visible/exactly-one/editable gate below.
 */
const COMPOSER_SELECTORS = [
  '#prompt-textarea',
  '.ProseMirror[contenteditable="true"]',
];
const STOP_BUTTON_SELECTOR = '[data-testid="stop-button"]';
/**
 * Candidate selectors for the submit control.
 *
 * `[data-testid="send-button"]` is the legacy marker. The control the live page
 * reports through UI Automation has class tokens including
 * `size-token-button-composer` / `bg-composer-primary` and accessible name
 * `Send`, with no `data-testid` exposed, so the exact accessible name is also
 * accepted. The named form is deliberately exact and `button`-scoped; a bare
 * first button or arbitrary page text is never used.
 */
const SEND_BUTTON_SELECTORS = [
  '[data-testid="send-button"]',
  'button[aria-label="Send"]',
];
const SEND_BUTTON_NAME = 'send';
const USER_SELECTOR = '[data-message-author-role="user"]';
const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]';
const USER_FALLBACK_SELECTOR = '[class*="user-message"]';
const ASSISTANT_FALLBACK_SELECTORS = ['[class*="MarkdownRoot-"]', '.markdown'];
const TEXT_SELECTORS = ['.markdown', '[class*="MarkdownRoot-"]'];

/**
 * Bound on a single turn, whatever a command asks for.
 *
 * This is the LAST clamp in the chain: `Math.min(MAX_TIMEOUT_MS, timeout_ms)`
 * below means a page can never wait longer than this even if a caller asks for
 * more. It must therefore be AT LEAST the worker's own run ceiling
 * (`MAX_RUN_TIMEOUT_MS` in background/chatgpt-port.js, also 300s) — if it were
 * lower, the worker's budget would be silently truncated here and a slow turn
 * would again be read mid-generation, which is the 2026-10-18
 * `generation_incomplete` failure. Equality is correct: both numbers express the
 * same finite ceiling, so the worker's budget survives to the page unchanged.
 *
 * This is a bound, not a relaxed check. Exceeding it still yields
 * GENERATION_TIMEOUT / GENERATION_NEVER_STARTED, which correlate.js refuses; a
 * reply that arrives past this bound is still never accepted.
 */
const MAX_TIMEOUT_MS = 300000;
/** Captured reply length kept in the envelope payload. Correlation sees it all. */
const MAX_STORED_REPLY_CHARS = 8000;
const MAX_PAGE_TASKS = 64;
const MAX_BASELINE_TURNS = 256;
const MAX_MUTATION_RECORDS = 2048;
const SUBMISSION_CONFIRM_MS = 5000;
const COMPOSER_SETUP_MS = 400;

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
  COMPOSER_STATE_UNKNOWN: 'composer_state_unknown',
  // The submit control is not resolvable as exactly one visible control. Both
  // are refused BEFORE any text is typed, so a missing/ambiguous send cannot
  // leave a probe in the composer.
  SEND_MISSING: 'send_missing',
  SEND_AMBIGUOUS: 'send_ambiguous'
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

/**
 * Is this candidate actually editable?
 *
 * Attribute evidence only, and fail closed: a node we cannot prove editable is
 * not a composer. This is what stops a disabled/read-only/aria-disabled decoy
 * from being typed into even when it matches a composer selector.
 */
function isEditableComposer(node) {
  if (!node) return false;
  try {
    if (node.disabled === true) return false;
    if (node.readOnly === true) return false;
    if (node.getAttribute) {
      if (node.getAttribute('aria-disabled') === 'true') return false;
      if (node.getAttribute('contenteditable') === 'false') return false;
      if (typeof node.hasAttribute === 'function' && node.hasAttribute('inert')) return false;
    }
    if (node.contentEditable === 'false') return false;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Every composer-shaped node, deduped by identity.
 *
 * One node can match BOTH selectors (a legacy id on a ProseMirror editor).
 * Counting it twice would turn a single composer into an "ambiguous" refusal,
 * so a node is considered exactly once.
 */
function composerCandidates() {
  const found = [];
  const seen = new Set();
  for (const selector of COMPOSER_SELECTORS) {
    let nodes = [];
    try {
      nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    } catch (err) {
      nodes = [];
    }
    for (const node of nodes) {
      if (!node || seen.has(node)) continue;
      seen.add(node);
      if (isEditableComposer(node)) found.push(node);
    }
  }
  return found;
}

/** Every visible composer, deduped by node identity. */
function visibleComposers() {
  return composerCandidates().filter(isVisible);
}

/**
 * Normalised accessible name, from `aria-label`/`title` first, then rendered
 * text. Only used to recognise a control whose name is exactly "Send"; it is
 * never used to take arbitrary page text as a command.
 */
function accessibleName(node) {
  if (!node) return '';
  try {
    if (node.getAttribute) {
      for (const attr of ['aria-label', 'title']) {
        const value = node.getAttribute(attr);
        if (typeof value === 'string' && value.trim() !== '') {
          return value.replace(/\s+/g, ' ').trim();
        }
      }
    }
    const text = typeof node.innerText === 'string' && node.innerText.trim() !== ''
      ? node.innerText
      : node.textContent;
    if (typeof text === 'string') return text.replace(/\s+/g, ' ').trim();
  } catch (err) {
    return '';
  }
  return '';
}

/** Is this node a submit control we are allowed to consider? */
function isSendControl(node) {
  if (!node) return false;
  try {
    // The legacy marker is authoritative even when the control has no name.
    if (node.getAttribute && node.getAttribute('data-testid') === 'send-button') return true;
    return accessibleName(node).toLowerCase() === SEND_BUTTON_NAME;
  } catch (err) {
    return false;
  }
}

/**
 * The narrowest root that can contain the submit control.
 *
 * Scoping to the composer's own `form` keeps a same-named button elsewhere on
 * the page out of the candidate set. When there is no form (or no composer),
 * the document is the only root available, and the exactly-one rule still
 * applies to what is found there.
 */
function sendScopeRoot() {
  const editor = visibleComposers()[0];
  if (editor && typeof editor.closest === 'function') {
    try {
      const form = editor.closest('form');
      if (form) return form;
    } catch (err) {
      /* fall through to document */
    }
  }
  return document;
}

/**
 * Every visible submit control, deduped by node identity.
 *
 * A disabled control still COUNTS as present: an empty composer legitimately
 * renders Send disabled, and the enablement re-check happens after the fill.
 * Ambiguity is a refusal, never a guess.
 */
function sendControls() {
  const root = sendScopeRoot();
  const found = [];
  const seen = new Set();
  const add = (node) => {
    if (!node || seen.has(node)) return;
    seen.add(node);
    if (isSendControl(node)) found.push(node);
  };
  for (const selector of SEND_BUTTON_SELECTORS) {
    let nodes = [];
    try {
      nodes = Array.prototype.slice.call(root.querySelectorAll(selector));
    } catch (err) {
      nodes = [];
    }
    for (const node of nodes) add(node);
  }
  // Exact accessible-name match, for a control whose "Send" name is rendered as
  // nested text rather than an aria-label.
  let buttons = [];
  try {
    buttons = Array.prototype.slice.call(root.querySelectorAll('button'));
  } catch (err) {
    buttons = [];
  }
  for (const node of buttons) add(node);
  return found.filter(isVisible);
}

/** True when the control is disabled by property or ARIA. */
function isSendDisabled(node) {
  if (!node) return true;
  try {
    if (node.disabled === true) return true;
    if (node.getAttribute && node.getAttribute('aria-disabled') === 'true') return true;
  } catch (err) {
    return true;
  }
  return false;
}

/** Composer state: generating indicator, submit presence/enablement/count, composer count. */
function sendState() {
  const stop = document.querySelector(STOP_BUTTON_SELECTOR);
  const sends = sendControls();
  const send = sends.length === 1 ? sends[0] : null;
  return {
    generating: !!stop,
    sendPresent: sends.length >= 1,
    sendDisabled: send ? isSendDisabled(send) : true,
    sendControlCount: sends.length,
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
 * Refusals, each of which leaves the page exactly as it was:
 *   - no visible composer            (nothing to type into)
 *   - more than one visible composer (which one is the operator's? unknown)
 *   - a generation already running   (typing now would land mid-turn)
 *   - a non-empty draft              (an operator's own unsent text; the old
 *                                     fill emptied the box and took it with it)
 *   - no / ambiguous Send control    (nothing that could submit the text)
 *
 * The draft refusal is a deliberate behaviour change: this adapter used to clear
 * the composer unconditionally so a reused tab could not leak a half-written
 * prompt into the probe. Overwriting is a worse failure than refusing.
 */
function preflightComposer() {
  const visible = visibleComposers();
  const state = sendState();
  if (visible.length === 0) {
    return {
      ok: false,
      code: NO_SEND.COMPOSER_MISSING,
      error: 'no visible editable composer was found; nothing was typed or sent',
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
  // The submit control must be resolvable BEFORE any text is typed. It may be
  // disabled here: an empty composer legitimately renders Send disabled, and the
  // enablement re-check happens after the fill in runTurn.
  const sends = sendControls();
  if (sends.length === 0) {
    return {
      ok: false,
      code: NO_SEND.SEND_MISSING,
      error: 'no visible Send control was found; nothing was typed or sent',
      composer_visible_count: visible.length,
      send_control_count: 0
    };
  }
  if (sends.length !== 1) {
    return {
      ok: false,
      code: NO_SEND.SEND_AMBIGUOUS,
      error: `${sends.length} visible Send controls were found; refusing to guess which one submits`,
      composer_visible_count: visible.length,
      send_control_count: sends.length
    };
  }
  return {
    ok: true,
    editor: visible[0],
    send: sends[0],
    composer_visible_count: visible.length,
    send_control_count: sends.length
  };
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

// No transcript snapshots: baseline signatures only detect continuity changes;
// node identity and full outbound equality are independently required for pairing.
function turnSignature(block) {
  const text = normalizeText(block.text);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${block.role}:${text.length}:${hash >>> 0}`;
}

function containsCorrelation(text, id) {
  const source = normalizeText(text).toLowerCase(), wanted = id.toLowerCase();
  for (let at = source.indexOf(wanted); at >= 0; at = source.indexOf(wanted, at + 1)) {
    if (!/[a-z0-9_-]/.test(source[at - 1] || '') && !/[a-z0-9_-]/.test(source[at + wanted.length] || '')) return true;
  }
  return false;
}

function createTurnEngine(options = {}) {
  const now = options.now ?? (() => performance.now());
  const setTimer = options.setTimeout ?? ((fn, ms) => globalThis.setTimeout(fn, ms));
  const clearTimer = options.clearTimeout ?? ((timer) => globalThis.clearTimeout(timer));
  const Observer = options.MutationObserver ?? globalThis.MutationObserver;
  const randomId = options.randomId ?? (() => globalThis.crypto.randomUUID());
  let pageId;
  try { pageId = randomId(); } catch { pageId = null; }
  const tasks = new Map();
  let active = null;
  const validId = (value) => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 128;
  const currentState = () => { try { return sendState(); } catch { return null; } };
  const refuse = (reason, extra = {}) => ({ ok: false, reason, submitted: false, no_send: true, ...extra });
  const identity = (entry) => ({ task_id: entry.taskId, operation_key: entry.operationKey,
    correlation_id: entry.correlationId, observer_id: entry.observerId, page_instance_id: pageId });
  function meta(entry) {
    return { ...identity(entry), phase: entry.phase, click_attempted: entry.clickAttempted,
      submission_observed: entry.submissionObserved, generation_started: entry.started,
      generation_complete: entry.complete, continuity: entry.continuity, method: entry.method,
      remaining_ms: Math.max(0, entry.deadline - now()), reason: entry.reason };
  }
  function receipt(entry) {
    return structuredClone({ ok: !entry.terminal || entry.complete, ...identity(entry), observation: meta(entry),
      click_attempted: entry.clickAttempted, submission_observed: entry.submissionObserved,
      submitted: entry.submissionObserved ? true : entry.noSubmit ? false : undefined,
      uncertain: !entry.complete && !entry.noSubmit, pending: !entry.terminal,
      ...(entry.terminal ? entry.result : {}), generation: { started: entry.started, complete: entry.complete, asserted_by_caller: false } });
  }
  function notifySubmit(entry) {
    if (entry.resolveSubmit) { const resolve = entry.resolveSubmit; entry.resolveSubmit = null; resolve(receipt(entry)); }
  }
  function cleanup(entry) {
    for (const timer of entry.timers) { try { clearTimer(timer); } catch { /* token still gates late callbacks */ } }
    entry.timers.clear();
    try { entry.observer?.disconnect(); } catch { /* never resume a disconnected observer */ }
  }
  function finish(entry, reason, complete = false, candidate = null, noSubmit = false) {
    if (entry.terminal) return;
    entry.terminal = true; entry.reason = reason; entry.complete = complete; entry.noSubmit = noSubmit;
    entry.phase = noSubmit ? 'REFUSED_NO_SUBMIT' : 'NEEDS_RECONCILIATION';
    cleanup(entry);
    try {
    if (noSubmit) entry.result = { ...refuse(reason), state: currentState() };
    else {
      const extracted = candidate ? extractFinalReply([{ kind: 'final', role: 'assistant', channel: 'final', text: candidate.text }], { source: 'dom-assistant-turn' }) : null;
      const verdict = correlateReply({ reply: extracted?.ok ? extracted.text : null,
        expected: { correlation_id: entry.correlationId, reply_token: entry.token }, outbound_text: entry.text,
        role: 'assistant', channel: 'final', source: 'dom-assistant-turn', model: extracted?.model ?? null,
        generation_started: entry.started, generation_complete: complete });
      const payload = { schema: verdict.schema, correlation_id: entry.correlationId, accepted: verdict.accepted,
        reason: verdict.reason, detail: verdict.detail, reply_text: verdict.accepted ? verdict.reply.slice(0, MAX_STORED_REPLY_CHARS) : null,
        expected_reply: verdict.expected_reply, model: extracted?.model ?? null,
        generation: { started: entry.started, complete, reason: complete ? REASON.ACCEPTED : reason, elapsed_ms: now() - entry.created },
        extraction: extracted ? { ok: extracted.ok, reason: extracted.reason, detail: extracted.detail } : { ok: false, reason: REASON.NO_FINAL_BLOCK, detail: 'no task-paired final candidate' },
        observed: verdict.observed, source_url: safeUrl(), started_at: entry.startedAt, captured_at: new Date().toISOString() };
      entry.result = { ok: verdict.accepted, verdict,
        envelope: buildEnvelope(verdict.accepted ? 'accepted' : 'rejected', entry.correlationId, entry.correlationId, payload), state: currentState() };
      if (complete) entry.phase = verdict.accepted ? 'REPLY_CHECKED' : 'REPLY_REJECTED';
    }
    } catch {
      entry.complete = false; entry.phase = 'NEEDS_RECONCILIATION'; entry.reason = 'observer_result_error';
      entry.result = { ok: false, reason: entry.reason, uncertain: !noSubmit,
        ...(noSubmit ? { submitted: false, no_send: true } : {}) };
    }
    if (noSubmit || entry.result.ok) active = null;
    entry.text = null; entry.baseline = null; entry.userNode = null; entry.editor = null;
    notifySubmit(entry);
    for (const resolve of entry.waiters) resolve(receipt(entry));
    entry.waiters.clear();
  }
  function unknown(entry, reason) { entry.continuity = false; finish(entry, reason); }
  function timer(entry, delay, operation) {
    let handle, fired = false, armed = false;
    try {
      handle = setTimer(() => {
        fired = true; entry.timers.delete(handle);
        if (entry.terminal) return;
        if (!armed) { unknown(entry, 'observer_timer_error'); return; }
        try { operation(); } catch { unknown(entry, 'observer_error'); }
      }, Math.max(1, delay));
      armed = true;
      if (!fired && !entry.terminal) entry.timers.add(handle);
      else { try { clearTimer(handle); } catch {} }
    } catch { unknown(entry, 'observer_timer_error'); }
  }
  function expire(entry) { finish(entry, entry.started ? REASON.GENERATION_TIMEOUT : REASON.GENERATION_NEVER_STARTED); }
  function edge(entry, generating) {
    if (generating) { entry.started = true; entry.generating = true; entry.endedAt = null; }
    else if (entry.started && entry.generating) { entry.generating = false; entry.endedAt = now(); }
  }
  function hasStop(node) {
    return matches(node, STOP_BUTTON_SELECTOR) || !!node?.querySelector?.(STOP_BUTTON_SELECTOR);
  }
  function mutationEdges(entry, records) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record.type === 'childList') {
        for (const node of record.removedNodes || []) if (hasStop(node)) edge(entry, false);
        for (const node of record.addedNodes || []) if (hasStop(node)) edge(entry, true);
      } else if (record.type === 'attributes' && record.attributeName === 'data-testid') {
        const next = records.slice(i + 1).find((item) => item.type === 'attributes' && item.target === record.target && item.attributeName === record.attributeName);
        const value = next ? next.oldValue : record.target.getAttribute('data-testid');
        if (record.oldValue !== 'stop-button' && value === 'stop-button') edge(entry, true);
        if (record.oldValue === 'stop-button' && value !== 'stop-button') edge(entry, false);
      }
    }
  }
  function pairedTurns(entry) {
    const scan = readOrderedTurns();
    if (!scan.ok || scan.blocks.length > MAX_BASELINE_TURNS + 8 || scan.blocks.length < entry.baseline.length) throw new Error('turn continuity unavailable');
    for (let i = 0; i < entry.baseline.length; i++) {
      if (scan.blocks[i].node !== entry.baseline[i].node || turnSignature(scan.blocks[i]) !== entry.baseline[i].signature) throw new Error('baseline changed');
    }
    const tail = scan.blocks.slice(entry.baseline.length);
    if (!tail.length) { if (entry.submissionObserved) throw new Error('user turn disappeared'); return null; }
    const user = tail[0];
    if (user.role !== 'user' || normalizeText(user.text) !== normalizeText(entry.text) || !containsCorrelation(user.text, entry.correlationId)
      || (entry.userNode && entry.userNode !== user.node) || tail.slice(1).some((block) => block.role !== 'assistant') || tail.length > 2) throw new Error('foreign or ambiguous turn');
    entry.userNode = user.node; entry.submissionObserved = true;
    return tail[1] ?? null;
  }
  function sample(entry, records = []) {
    if (entry.terminal || !entry.clickAttempted) return;
    if (now() >= entry.deadline) { expire(entry); return; }
    try {
      if (!Array.isArray(records) || records.length > MAX_MUTATION_RECORDS) throw new Error('mutation evidence overflow');
      const url = safeUrl();
      if (url !== entry.url) {
        if (!entry.urlBound && entry.url === 'https://chatgpt.com/' && /^https:\/\/chatgpt\.com\/c\/[^/?#]+$/.test(url || '')) { entry.url = url; entry.urlBound = true; }
        else throw new Error('conversation changed');
      }
      const candidate = pairedTurns(entry);
      mutationEdges(entry, records);
      edge(entry, isGenerating());
      if (now() >= entry.deadline) { expire(entry); return; }
      if (entry.submissionObserved) { entry.phase = entry.started ? 'OBSERVING' : 'SUBMISSION_OBSERVED'; notifySubmit(entry); }
      if (candidate) {
        const signature = turnSignature(candidate);
        if (entry.candidateSignature !== signature) { entry.candidateSignature = signature; entry.quietSince = now(); }
      }
      if (candidate && entry.submissionObserved && entry.started && !entry.generating && entry.endedAt !== null
        && now() - Math.max(entry.endedAt, entry.quietSince) >= DEFAULT_SETTLE_MS) finish(entry, REASON.ACCEPTED, true, candidate);
    } catch { unknown(entry, 'observation_continuity_lost'); }
  }
  function poll(entry) {
    timer(entry, Math.min(DEFAULT_POLL_MS, entry.deadline - now()), () => {
      // Drain queued mutation evidence before a read-only sample; a fast start
      // and end in one JS task must not collapse into an idle snapshot.
      sample(entry, entry.observer?.takeRecords?.() ?? []);
      if (!entry.terminal) poll(entry);
    });
  }
  function activate(entry) {
    if (now() >= entry.deadline) { expire(entry); return; }
    try {
      const scan = readOrderedTurns();
      if (!scan.ok || scan.blocks.length !== entry.baseline.length || scan.blocks.some((block, i) => block.node !== entry.baseline[i].node || turnSignature(block) !== entry.baseline[i].signature)) {
        unknown(entry, 'pre_activation_baseline_changed'); return;
      }
      const composers = visibleComposers(), controls = sendControls();
      if (composers.length !== 1 || composers[0] !== entry.editor || normalizeText(composerDraft(entry.editor)) !== normalizeText(entry.text)
        || isGenerating() || safeUrl() !== entry.url) {
        unknown(entry, 'pre_activation_state_changed'); return;
      }
      if (controls.length !== 1 || isSendDisabled(controls[0])) {
        finish(entry, 'pre_activation_refused', false, null, true); return;
      }
      if (Observer) {
        entry.observer = new Observer((records) => sample(entry, records));
        entry.observer.observe(document.documentElement || document, { subtree: true, childList: true, characterData: true,
          attributes: true, attributeFilter: ['data-testid'], attributeOldValue: true });
        entry.method = 'mutation-observer+poll';
      }
      // Observer installed and baseline idle BEFORE the sole activation path.
      if (entry.terminal || now() >= entry.deadline) { if (!entry.terminal) expire(entry); return; }
      entry.clickAttempted = true; entry.phase = 'ACTIVATION_POSSIBLE';
      if (!fireClick(controls[0])) { unknown(entry, 'activation_uncertain'); return; }
      sample(entry, entry.observer?.takeRecords?.() ?? []);
      if (!entry.terminal) {
        timer(entry, Math.min(SUBMISSION_CONFIRM_MS, entry.deadline - now()), () => { sample(entry, entry.observer?.takeRecords?.() ?? []); notifySubmit(entry); });
        poll(entry);
      }
    } catch { unknown(entry, 'activation_error'); }
  }
  function submit(command) {
    command = { ...command };
    if (command.user_gesture !== true) return refuse('gesture_required');
    const work = command.timeout_ms === undefined ? DEFAULT_TIMEOUT_MS : command.timeout_ms;
    if (typeof work !== 'number' || !Number.isSafeInteger(work) || work <= 0) return refuse('invalid_work_budget');
    const correlationId = typeof command.correlation_id === 'string' ? command.correlation_id.trim() : '';
    const taskId = command.task_id === undefined ? correlationId : command.task_id;
    const operationKey = command.operation_key === undefined ? correlationId : command.operation_key;
    const prior = tasks.get(operationKey);
    if (prior) return { ...receipt(prior), ok: false, reason: 'operation_already_seen', no_new_submit: true };
    if (active) return refuse('turn_in_flight');
    const pre = preflightComposer();
    if (!pre.ok) return refuse(REASON.BAD_INPUT, { code: pre.code, error: pre.error, composer_visible_count: pre.composer_visible_count, state: sendState() });
    const token = typeof command.expected_reply_token === 'string' ? command.expected_reply_token.trim() : '';
    if (!validId(correlationId) || !validId(token) || !validId(taskId) || !validId(operationKey)
      || typeof command.text !== 'string' || !command.text.trim() || command.text.length > 8000) return refuse('invalid_turn_request');
    if (!containsCorrelation(command.text, correlationId)) return refuse('outbound_correlation_required');
    if (!validId(pageId) || (command.page_instance_id !== undefined && command.page_instance_id !== pageId)) return refuse('page_instance_mismatch');
    if ([...tasks.values()].some((item) => item.taskId === taskId || item.correlationId === correlationId)) return refuse('identity_already_seen');
    if (tasks.size >= MAX_PAGE_TASKS) return refuse('page_task_store_full');
    const baseline = readOrderedTurns();
    if (!baseline.ok || baseline.blocks.length > MAX_BASELINE_TURNS) return refuse('baseline_unavailable');
    let observerId;
    try { observerId = randomId(); } catch { return refuse('observer_identity_unavailable'); }
    if (!validId(observerId) || [...tasks.values()].some((item) => item.observerId === observerId)) return refuse('observer_identity_unavailable');
    const created = now();
    const entry = { taskId, operationKey, observerId, correlationId, token, text: command.text,
      editor: pre.editor, baseline: baseline.blocks.map((block) => ({ node: block.node, signature: turnSignature(block) })),
      url: safeUrl(), urlBound: false, created, startedAt: new Date().toISOString(), deadline: created + COMPOSER_SETUP_MS + Math.min(MAX_TIMEOUT_MS, work),
      phase: 'SUBMIT_RESERVED', clickAttempted: false, submissionObserved: false, started: false, complete: false, generating: false,
      endedAt: null, quietSince: created, continuity: true, noSubmit: false, terminal: false, reason: null,
      method: 'poll', timers: new Set(), waiters: new Set() };
    tasks.set(operationKey, entry); active = entry;
    const pending = new Promise((resolve) => { entry.resolveSubmit = resolve; });
    try {
      const fill = composerFill(entry.text);
      if (!fill.ok) finish(entry, fill.code || 'composer_insert_failed', false, null, true);
      else {
        timer(entry, entry.deadline - now(), () => expire(entry));
        if (!entry.terminal) timer(entry, COMPOSER_SETUP_MS, () => activate(entry));
      }
    } catch { unknown(entry, 'preparation_error'); }
    return pending;
  }
  function lookup(command) {
    if (!command || typeof command !== 'object' || command.page_instance_id !== pageId) return null;
    const entry = tasks.get(command.operation_key);
    return entry && command.task_id === entry.taskId && command.correlation_id === entry.correlationId
      && command.observer_id === entry.observerId ? entry : null;
  }
  function observe(command) {
    const entry = lookup(command);
    if (!entry) return { ok: false, reason: 'observer_identity_mismatch', read_only: true, uncertain: true };
    sample(entry, entry.observer?.takeRecords?.() ?? []);
    return structuredClone({ ...receipt(entry), read_only: true });
  }
  function run(command, respond) {
    const submission = submit(command);
    if (!submission || typeof submission.then !== 'function') { respond(submission); return; }
    return submission.then((value) => {
      const entry = lookup(value);
      if (!entry || entry.terminal) { respond(entry ? receipt(entry) : value); return; }
      return new Promise((resolve) => { entry.waiters.add((result) => {
        try { respond(result); } catch { /* a closed port cannot cancel/replay the task */ }
        resolve();
      }); });
    });
  }
  function readFinal(command) {
    const request = command && typeof command === 'object' ? command : {};
    const entry = lookup(request);
    if (entry && request.expected_reply_token === entry.token) {
      sample(entry, entry.observer?.takeRecords?.() ?? []);
      const value = structuredClone(receipt(entry));
      if (!entry.terminal) value.verdict = correlateReply({ reply: null,
        expected: { correlation_id: entry.correlationId, reply_token: entry.token }, generation_complete: false, generation_started: entry.started });
      return { ...value, ok: entry.complete && entry.result?.ok === true, read_only: true };
    }
    // Never scan an idle page and replace missing observer evidence with a
    // caller boolean. A fresh document has no observation history to recover.
    // EVERY refusal below carries the same machine-readable verdict: a caller
    // whose identity does not match this page's observer is refused, but it is
    // refused HONESTLY — a bare `{ok:false}` with no reason would leave the
    // worker/panel holding no machine-readable answer at all, which is how a
    // missing verdict quietly becomes "unknown reason" instead of a stated
    // "not observed here". It never consults the caller's `generation_complete`.
    const known = tasks.get(typeof request.operation_key === 'string' ? request.operation_key : '');
    const verdict = correlateReply({ reply: null, expected: { correlation_id: request.correlation_id,
      reply_token: request.expected_reply_token }, generation_complete: false, generation_started: null });
    return { ok: false, verdict, reason: known ? 'observer_identity_mismatch' : 'observer_evidence_required', read_only: true,
      generation: { started: false, complete: false, asserted_by_caller: false } };
  }
  return { submit, observe, run, readFinal, pageInstanceId: pageId,
    dispose() { for (const entry of tasks.values()) if (!entry.terminal) unknown(entry, 'observer_disposed'); } };
}

const turnEngine = createTurnEngine();
function runTurn(command, respond) { return turnEngine.run(command, respond); }
function readFinal(command) { return turnEngine.readFinal(command); }

/* ------------------------------------------------------------------ plumbing */

const ACTIONS = {
  ping() {
    return { ok: true, href: safeUrl(), title: document.title, state: sendState(), note: 'read-only probe; nothing composed or sent' };
  },
  state() {
    return { ok: true, state: sendState() };
  },
  'run-turn': runTurn,
  'submit-turn': (command) => turnEngine.submit(command),
  'observe-turn': (command) => turnEngine.observe(command),
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
        try { port.postMessage(Object.assign({ action }, result)); } catch { /* retain observer independently of this port */ }
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
  createTurnEngine,
  turnEngine,
  readOrderedTurns,
  readFinalReplyAfterLastUserTurn,
  normalizeText,
  // The composing seam, exposed so the preflight can be regression-tested
  // without a browser: sendState, the gate itself, and the fill that uses it.
  sendState,
  sendControls,
  preflightComposer,
  composerFill,
  visibleComposers,
  isVisible,
  // The page-side turn ceiling, so the cross-module budget ordering (page clamp
  // >= worker run ceiling) can be asserted rather than assumed.
  MAX_TIMEOUT_MS
};
