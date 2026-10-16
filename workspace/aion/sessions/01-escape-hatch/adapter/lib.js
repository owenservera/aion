'use strict';
/**
 * lib.js — pure, testable helpers for the M05 one-shot ChatGPT web-app adapter.
 *
 * No Playwright import here: every helper that touches a page/browser works
 * against a minimal injected interface ({ $$, url(), ... }), so unit tests
 * run with fakes and NEVER connect to a real Chrome/CDP endpoint.
 */

const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_CORRELATION = 'AION-M05-20261016-COC-001';
const EXPECTED_REPLY = 'ACK-M05-COC-001';
const CDP_DEFAULT = 'http://127.0.0.1:9244';
// Verbatim outbound block as it appears in AION-OUTBOUND-M05-001.md.
// The script never fabricates this text; it extracts it from the file.
const OUTBOUND_MESSAGE = [
  'AION-M05-20261016-COC-001',
  '',
  'This is an authorized AION-originated transport verification request. Please reply with exactly the following text on one line:',
  '',
  'ACK-M05-COC-001',
].join('\n');

// Candidate selectors for the ChatGPT web-app composer (tried in order,
// most-specific first so the ProseMirror #prompt-textarea contenteditable
// wins over generic/noisy matches).
const COMPOSER_SELECTORS = [
  '#prompt-textarea',
  'div#prompt-textarea[contenteditable="true"]',
  'form [contenteditable="true"]',
  'main [contenteditable="true"]',
  'form textarea',
];

// Selectors identifying the composer submit button. The genuine editor is
// the contenteditable inside the <form> that contains one of these.
const SEND_BUTTON_SELECTORS = [
  '[data-testid="send-button"]',
  '#composer-submit-button',
];

// Fallback/hidden textarea signals (ChatGPT web app renders a hidden
// <textarea name="prompt-textarea" class="wcDTda" ...> alongside the real
// ProseMirror div — it must never count as a composer candidate).
const FALLBACK_TEXTAREA_NAMES = new Set(['prompt-textarea']);
const FALLBACK_TEXTAREA_CLASSES = new Set(['wcDTda']);

// Selectors identifying assistant messages in the ChatGPT web app.
// Current DOM: turns are article[data-testid^="conversation-turn-"];
// assistant turns contain [data-message-author-role="assistant"];
// visible text lives in .markdown. Legacy bare-role selector is kept as
// a fallback so older fakes/fixtures still resolve.
const TURN_SELECTOR = 'article[data-testid^="conversation-turn-"]';
const ASSISTANT_IN_TURN_SELECTOR =
  'article[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]';
const USER_IN_TURN_SELECTOR =
  'article[data-testid^="conversation-turn-"] [data-message-author-role="user"]';
const USER_SELECTOR = '[data-message-author-role="user"]';
const MARKDOWN_SELECTOR = '.markdown';
const STOP_BUTTON_SELECTOR = '[data-testid="stop-button"]';
const ASSISTANT_SELECTORS = [
  ASSISTANT_IN_TURN_SELECTOR,
  '[data-message-author-role="assistant"]',
];
const USER_SELECTORS = [
  USER_IN_TURN_SELECTOR,
  USER_SELECTOR,
];

// Fallback selectors for the live ChatGPT DOM observed 2026-10-16
// (no article / conversation-turn / message-author-role / data-turn).
// User turns: elements inside [class*='user-message'] (bg-user-message /
// group/user-message); user text lives in DIV.text-size-chat.whitespace-pre-wrap.
// Assistant replies: DIV[class^=MarkdownRoot-] (match via substring) with a
// .markdown fallback; both must exclude anything inside a user-message container
// because the user prompt text itself contains the correlation AND 'ACK-M05'.
const USER_FALLBACK_SELECTOR = "[class*='user-message']";
const ASSISTANT_FALLBACK_SELECTORS = [
  "[class*='MarkdownRoot-']",
  '.markdown',
];

// Selectors for read-only DOM inspection (--inspect-dom). Any element
// matching ANY of these is summarized (no text is ever returned).
const INSPECT_DOM_SELECTORS = [
  'article',
  '[data-testid*="conversation-turn"]',
  '[data-message-author-role]',
  '[data-turn]',
  'div.whitespace-pre-wrap',
  '.markdown',
];
const INSPECT_ACK_MARKER = 'ACK-M05';
const INSPECT_MAX_ANCESTORS = 6;
const INSPECT_MARKER_MAX_ANCESTORS = 12;
const INSPECT_CLASS_TOKENS_MAX_ELEMENT = 12;
const INSPECT_CLASS_TOKENS_MAX_TREE = 8;
const INSPECT_CLASS_TOKENS_MAX_MARKER = 4;
const INSPECT_TREE_MAX_DEPTH = 6;
const INSPECT_TREE_MAX_NODES = 200;

// URL fragments that indicate the tab is NOT authenticated.
const LOGIN_MARKERS = ['/auth/login', '/auth/signup', '/login'];

class AdapterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Parse CLI args. Default mode is ALWAYS dry-run. */
function parseArgs(argv) {
  const args = {
    live: false,
    readLast: false,
    inspectDom: false,
    confirmCorrelation: null,
    correlation: null,
    cdp: CDP_DEFAULT,
    outboundFile: path.resolve(__dirname, '..', 'AION-OUTBOUND-M05-001.md'),
    timeoutMs: 120000,
    receiptDir: __dirname,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') args.live = true;
    else if (a === '--read-last') args.readLast = true;
    else if (a === '--inspect-dom') args.inspectDom = true;
    else if (a === '--confirm-correlation') args.confirmCorrelation = argv[++i] ?? null;
    else if (a.startsWith('--confirm-correlation=')) args.confirmCorrelation = a.split('=').slice(1).join('=');
    else if (a === '--correlation') args.correlation = argv[++i] ?? null;
    else if (a.startsWith('--correlation=')) args.correlation = a.split('=').slice(1).join('=');
    else if (a === '--cdp') args.cdp = argv[++i] ?? args.cdp;
    else if (a.startsWith('--cdp=')) args.cdp = a.split('=').slice(1).join('=');
    else if (a === '--outbound-file') args.outboundFile = argv[++i] ?? args.outboundFile;
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
  }
  args.mode = args.readLast ? 'read-last' : args.inspectDom ? 'inspect-dom' : args.live ? 'live' : 'dry-run';
  return args;
}

/**
 * Load the exact AION-owned message from the outbound file.
 * Never fabricates: throws unless the file contains the expected
 * correlation AND the verbatim message block.
 */
function loadOutbound(mdPath) {
  let text;
  try {
    text = fs.readFileSync(mdPath, 'utf8');
  } catch (err) {
    throw new AdapterError('E_OUTBOUND_MISSING', `Outbound file unreadable: ${mdPath} (${err.message})`);
  }
  const corrMatch = text.match(/AION-M05-20261016-COC-001/);
  if (!corrMatch) {
    throw new AdapterError('E_OUTBOUND_CORRELATION', `Correlation ${EXPECTED_CORRELATION} not found in ${mdPath}; refusing to fabricate a message.`);
  }
  if (!text.includes(OUTBOUND_MESSAGE)) {
    throw new AdapterError('E_OUTBOUND_MESSAGE', `Verbatim outbound message block not found in ${mdPath}; refusing to substitute text.`);
  }
  return {
    correlation: EXPECTED_CORRELATION,
    expectedReply: EXPECTED_REPLY,
    message: OUTBOUND_MESSAGE,
  };
}

/** Live send requires BOTH --live AND exact --confirm-correlation. */
function assertLiveConfirmed(args, correlation) {
  if (!args.live) return { live: false };
  if (args.confirmCorrelation !== correlation) {
    throw new AdapterError(
      'E_CONFIRMATION',
      'Live send refused: requires BOTH --live AND --confirm-correlation ' +
        `${correlation} (exact match). Got: ${JSON.stringify(args.confirmCorrelation)}.`,
    );
  }
  return { live: true };
}

/** Read-last (no-send) requires --read-last AND exact --correlation. Never sends. */
function assertReadLastConfirmed(args, correlation = EXPECTED_CORRELATION) {
  if (!args.readLast) return { readLast: false };
  const got = args.correlation ?? args.confirmCorrelation;
  if (got !== correlation) {
    throw new AdapterError(
      'E_CONFIRMATION',
      'Read-last refused: requires BOTH --read-last AND --correlation ' +
        `${correlation} (exact match). Got: ${JSON.stringify(got)}.`,
    );
  }
  return { readLast: true, correlation };
}

/** Inspect-dom (read-only) requires --inspect-dom AND exact --correlation. Never sends. */
function assertInspectDomConfirmed(args, correlation = EXPECTED_CORRELATION) {
  if (!args.inspectDom) return { inspectDom: false };
  const got = args.correlation ?? args.confirmCorrelation;
  if (got !== correlation) {
    throw new AdapterError(
      'E_CONFIRMATION',
      'Inspect-dom refused: requires BOTH --inspect-dom AND --correlation ' +
        `${correlation} (exact match). Got: ${JSON.stringify(got)}.`,
    );
  }
  return { inspectDom: true, correlation };
}

/** True only for https chatgpt.com web-app tab URLs (no login pages). */
function isChatGptWebAppTab(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  if (u.hostname !== 'chatgpt.com' && !u.hostname.endsWith('.chatgpt.com')) return false;
  if (LOGIN_MARKERS.some((m) => u.pathname.includes(m))) return false;
  if (u.pathname === '/auth/login' || u.pathname === '/login') return false;
  return true;
}

/** True when the URL looks like a login/auth page (unauthenticated). */
function isLoginUrl(url) {
  try {
    const u = new URL(url);
    return LOGIN_MARKERS.some((m) => u.pathname.includes(m));
  } catch {
    return false;
  }
}

/**
 * Pick the single authenticated chatgpt.com web-app tab.
 * tabs: [{ url, title?, ref }] — ref is the opaque page handle (never logged).
 * Throws E_NO_TAB when none, E_AMBIGUOUS_TAB when more than one.
 */
function selectTargetTab(tabs) {
  const matches = (tabs || []).filter((t) => isChatGptWebAppTab(t.url));
  if (matches.length === 0) {
    throw new AdapterError(
      'E_NO_TAB',
      'No authenticated chatgpt.com WEB APP tab found on the CDP endpoint. ' +
        'Open chatgpt.com in the BFF Linux Chrome and log in, then retry.',
    );
  }
  if (matches.length > 1) {
    throw new AdapterError(
      'E_AMBIGUOUS_TAB',
      `Ambiguous UI: ${matches.length} chatgpt.com web-app tabs found; ` +
        'close extras so exactly one remains, then retry.',
    );
  }
  return matches[0];
}

/** Strip a tab URL to origin+pathname (drop query/hash: may carry secrets). */
function safeTabUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return 'unparseable-url';
  }
}

/**
 * Stable dedup key from injected describe metadata (unit-test fakes).
 * Returns a string key when the handle carries one, else null.
 */
function describeKey(handle) {
  try {
    const d = handle && handle.describe;
    if (d && typeof d === 'object') {
      for (const k of ['key', 'backendNodeId', 'nodeId', 'uid']) {
        if (d[k] !== undefined && d[k] !== null && String(d[k]) !== '') {
          return `describe:${k}=${String(d[k])}`;
        }
      }
      if (d.id !== undefined && d.id !== null && String(d.id) !== '') {
        const tag = String(d.tagName || d.tag || '').toUpperCase();
        return `describe:id=${String(d.id)}|tag=${tag}`;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Stable DOM-identity key via handle.evaluate marking.
 * The marker is stored ON the DOM node, so distinct ElementHandle wrappers
 * for the SAME node (one per $$ call, as Playwright returns) collapse
 * to one key, while genuinely different nodes get different keys.
 * Returns null when evaluate is unavailable (fakes) — caller then falls
 * back to object identity.
 */
async function domMarkKey(handle) {
  if (!handle || typeof handle.evaluate !== 'function') return null;
  try {
    const k = await handle.evaluate((el) => {
      try {
        if (!el.__aionComposerKey) {
          el.__aionComposerKey = `k${Math.random().toString(36).slice(2)}`;
        }
        return el.__aionComposerKey;
      } catch {
        return null;
      }
    });
    if (typeof k === 'string' && k) return `dom:${k}`;
  } catch {
    /* evaluate blocked (CSP etc.) — fall back to object identity */
  }
  return null;
}

/** Read one attribute best-effort (real handles and describe fakes). */
async function safeAttr(handle, name) {
  try {
    if (handle && typeof handle.getAttribute === 'function') {
      const v = await handle.getAttribute(name);
      if (v !== null && v !== undefined) return String(v);
    }
  } catch {
    /* ignore */
  }
  try {
    const d = handle && handle.describe;
    if (d && typeof d === 'object') {
      if (d[name] !== undefined && d[name] !== null) return String(d[name]);
      if (name === 'class' && d.className !== undefined && d.className !== null) return String(d.className);
      if (name === 'aria-hidden' && d.ariaHidden !== undefined && d.ariaHidden !== null) return String(d.ariaHidden);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * True when the handle is a hidden/fallback <textarea> that must NOT count
 * as a composer candidate: display:none, zero-size, hidden attr,
 * aria-hidden, or the known fallback markers (name=prompt-textarea,
 * class wcDTda). Non-textarea editors (the ProseMirror contenteditable div)
 * are NEVER fallback. Unknown-tag handles without evaluate/describe info
 * (legacy unit fakes) default to genuine so existing tests keep passing.
 */
async function isFallbackTextarea(handle) {
  // Fast path 1: live DOM inspection via evaluate (most reliable).
  if (handle && typeof handle.evaluate === 'function') {
    try {
      const r = await handle.evaluate((el) => {
        try {
          const tag = ((el.tagName || '') + '').toUpperCase();
          if (tag !== 'TEXTAREA') return false;
          if (el.hidden) return true;
          if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
          if (el.getAttribute && el.getAttribute('name') === 'prompt-textarea') return true;
          const cls = el.getAttribute ? (el.getAttribute('class') || '') : '';
          if ((` ${cls} `).split(/\s+/).includes('wcDTda')) return true;
          const style = el.getAttribute ? (el.getAttribute('style') || '') : '';
          if (/display\s*:\s*none/i.test(style)) return true;
          try {
            const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
            if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return true;
          } catch {
            /* ignore */
          }
          try {
            const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
            if (rect && (rect.width === 0 || rect.height === 0)) return true;
          } catch {
            /* ignore */
          }
          if (el.clientWidth === 0 && el.clientHeight === 0) return true;
          return false;
        } catch {
          return false;
        }
      });
      if (r === true) return true;
      // r === false may still be a describe-fake whose evaluate stub does
      // not reflect its describe metadata — fall through to describe checks.
    } catch {
      /* fall through */
    }
  }

  // Fast path 2: describe metadata (unit-test fakes).
  try {
    const d = handle && handle.describe;
    if (d && typeof d === 'object') {
      const tag = String(d.tagName || d.tag || '').toUpperCase();
      const cls = String(d.className || d.class || '');
      const classes = cls.split(/\s+/).filter(Boolean);
      const name = d.name !== undefined && d.name !== null ? String(d.name) : null;
      const ariaHidden = d.ariaHidden !== undefined ? d.ariaHidden : d['aria-hidden'];
      const hidden = d.hidden === true || d.hidden === 'true';
      const dispNone = d.display === 'none';
      const visHidden = d.visibility === 'hidden';
      const zeroSize = (d.width === 0 || d.height === 0) && (d.width !== undefined || d.height !== undefined);
      const hasFallbackMarker = (name !== null && FALLBACK_TEXTAREA_NAMES.has(name)) ||
        classes.some((c) => FALLBACK_TEXTAREA_CLASSES.has(c));
      if (tag === 'TEXTAREA') {
        if (hidden || ariaHidden === true || ariaHidden === 'true' || dispNone || visHidden || zeroSize) return true;
        if (hasFallbackMarker) return true;
        return false;
      }
      if (tag !== '' && tag !== 'TEXTAREA') return false; // DIV etc. never fallback
      if (hasFallbackMarker && (hidden || ariaHidden === true || ariaHidden === 'true' || dispNone || visHidden || zeroSize)) return true;
    }
  } catch {
    /* ignore */
  }

  // Fast path 3: individual getAttribute/boundingBox probes (no evaluate).
  try {
    if (handle && typeof handle.getAttribute === 'function') {
      const tagProp = handle.tagName || handle.tag || null;
      const tag = tagProp ? String(tagProp).toUpperCase() : null;
      const [aria, name, cls, style] = await Promise.all([
        safeAttr(handle, 'aria-hidden'),
        safeAttr(handle, 'name'),
        safeAttr(handle, 'class'),
        safeAttr(handle, 'style'),
      ]);
      const classes = String(cls || '').split(/\s+/).filter(Boolean);
      const hasMarker = (name !== null && FALLBACK_TEXTAREA_NAMES.has(name)) ||
        classes.some((c) => FALLBACK_TEXTAREA_CLASSES.has(c));
      const isHiddenAttr = aria === 'true' || /display\s*:\s*none/i.test(String(style || ''));
      if (tag === 'TEXTAREA' && (isHiddenAttr || hasMarker)) return true;
      if (tag === null && hasMarker && isHiddenAttr) return true;
      if (typeof handle.boundingBox === 'function' && (tag === 'TEXTAREA' || (tag === null && hasMarker))) {
        try {
          const box = await handle.boundingBox();
          if (box === null) return true; // display:none reports null
          if (box && (box.width === 0 || box.height === 0)) return true;
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }

  return false;
}

/**
 * Best-effort check: is this handle inside the <form> that contains the
 * send button? Used only to label candidates (preference), never to
 * silently discard a genuinely different visible editor.
 * Returns true/false, or null when it cannot be determined.
 */
async function isInComposerForm(handle) {
  if (!handle || typeof handle.evaluate !== 'function') return null;
  try {
    const r = await handle.evaluate(
      (el, sels) => {
        try {
          const form = el.closest ? el.closest('form') : null;
          if (!form) return false;
          return sels.some((s) => {
            try {
              return !!form.querySelector(s);
            } catch {
              return false;
            }
          });
        } catch {
          return null;
        }
      },
      SEND_BUTTON_SELECTORS,
    );
    return r === true ? true : r === false ? false : null;
  } catch {
    return null;
  }
}

/**
 * Defensively locate the editable composer on a page.
 * page: minimal interface { $$(selector) -> [handle], } where each handle
 * has isVisible() and optionally evaluate/getAttribute/describe metadata.
 * Returns { selector, handle }.
 *
 * Fixed behaviour (was E_AMBIGUOUS_COMPOSER on live ChatGPT UI):
 * - The ProseMirror <div id="prompt-textarea" contenteditable> inside the
 *   send-button form is preferred (selectors run most-specific first).
 * - Hidden/fallback <textarea> (name=prompt-textarea, class wcDTda,
 *   display:none, zero-size, aria-hidden, hidden) are non-candidates.
 * - The SAME DOM node found via several selectors (Playwright returns a
 *   fresh ElementHandle per $$ call) is deduped via DOM marking, so one
 *   editor matching N selectors still counts as ONE candidate.
 * - Throws E_NO_COMPOSER (none genuine) or E_AMBIGUOUS_COMPOSER (more than
 *   one genuinely different visible editor — never guessed).
 */
async function locateComposer(page) {
  const seenDomKeys = new Set();
  const seenHandles = new Set();
  const visible = [];
  const genuine = [];
  for (const sel of COMPOSER_SELECTORS) {
    let handles = [];
    try {
      handles = (await page.$$(sel)) || [];
    } catch {
      continue;
    }
    for (const h of handles) {
      let vis = false;
      try {
        vis = await h.isVisible();
      } catch {
        vis = false;
      }
      if (!vis) continue;
      // Dedupe the same DOM node seen via an earlier (more specific) selector.
      let key = describeKey(h);
      if (!key) {
        try {
          key = await domMarkKey(h);
        } catch {
          key = null;
        }
      }
      if (key ? seenDomKeys.has(key) : seenHandles.has(h)) continue;
      if (key) seenDomKeys.add(key);
      else seenHandles.add(h);

      const entry = { selector: sel, handle: h, key };
      visible.push(entry);
      let fallback = false;
      try {
        fallback = await isFallbackTextarea(h);
      } catch {
        fallback = false;
      }
      entry.fallback = fallback;
      if (fallback) continue;
      try {
        entry.inComposerForm = await isInComposerForm(h);
      } catch {
        entry.inComposerForm = null;
      }
      genuine.push(entry);
    }
  }
  if (genuine.length === 0) {
    const ignored = visible.length;
    throw new AdapterError(
      'E_NO_COMPOSER',
      'No editable ChatGPT composer found (tried: ' + COMPOSER_SELECTORS.join(', ') + '). ' +
        (ignored > 0
          ? `${ignored} hidden/fallback textarea candidate(s) ignored ` +
            '(display:none/zero-size/aria-hidden/name=prompt-textarea/class=wcDTda). '
          : '') +
        'Failing: login may be required or UI changed.',
    );
  }
  if (genuine.length > 1) {
    const detail = genuine
      .map((g) => `${g.selector}${g.inComposerForm === true ? '[in-send-form]' : ''}`)
      .join(', ');
    throw new AdapterError(
      'E_AMBIGUOUS_COMPOSER',
      `Ambiguous UI: ${genuine.length} visible composer candidates; refusing to guess. (selectors: ${detail})`,
    );
  }
  // Single genuine editor: because selectors run most-specific first, this
  // is the #prompt-textarea contenteditable (or, when that id is absent,
  // the editor inside the send-button form) — fallbacks already excluded.
  return { selector: genuine[0].selector, handle: genuine[0].handle };
}

/**
 * Collect assistant-turn handles, turn-aware first with legacy fallback.
 * Turn structure (current ChatGPT DOM): article[data-testid^="conversation-turn-"]
 * containing [data-message-author-role="assistant"], text in .markdown.
 * Dedupe across selectors via describe/dom keys so the same node counted
 * via two selectors still counts once; legacy fakes without keys fall back
 * to first-non-empty to avoid double-counting fresh-wrapper fakes.
 */
async function getAssistantHandles(page) {
  // Preferred: turn-aware descendant selector.
  try {
    const turnAware = (await page.$$(ASSISTANT_IN_TURN_SELECTOR)) || [];
    if (turnAware.length > 0) return turnAware;
  } catch {
    /* ignore */
  }
  // If the page exposes conversation turns but no assistant descendant yet,
  // trust the turn structure (count is 0) instead of falling back to a
  // legacy selector that could match stale nodes.
  try {
    const turns = (await page.$$(TURN_SELECTOR)) || [];
    if (turns.length > 0) {
      try {
        return (await page.$$(ASSISTANT_IN_TURN_SELECTOR)) || [];
      } catch {
        return [];
      }
    }
  } catch {
    /* ignore */
  }
  // Legacy fallback (older fakes/fixtures without article turns).
  for (const sel of ASSISTANT_SELECTORS.slice(1)) {
    try {
      const handles = (await page.$$(sel)) || [];
      if (handles.length > 0) return handles;
    } catch {
      continue;
    }
  }
  // Live-DOM fallback (2026-10-16, no article/role/turn elements):
  // assistant replies via [class*='MarkdownRoot-'] or .markdown, excluding
  // anything inside a user-message container. Kept AFTER existing selectors.
  for (const sel of ASSISTANT_FALLBACK_SELECTORS) {
    let handles = [];
    try {
      handles = (await page.$$(sel)) || [];
    } catch {
      continue;
    }
    if (handles.length === 0) continue;
    const kept = [];
    for (const h of handles) {
      let insideUser = false;
      if (h && typeof h.evaluate === 'function') {
        try {
          insideUser = await h.evaluate((el) => {
            try {
              let p = el.parentElement || el.parentNode || null;
              let g = 0;
              while (p && g < 1000) {
                g += 1;
                try {
                  let c = null;
                  try {
                    c = p.getAttribute ? p.getAttribute('class') : null;
                  } catch (e) { c = null; }
                  if ((c === null || c === undefined) && typeof p.className === 'string') c = p.className;
                  if (c !== null && c !== undefined && String(c).indexOf('user-message') !== -1) return true;
                } catch (e) { /* ignore */ }
                try {
                  p = p.parentElement || p.parentNode || null;
                } catch (e) { break; }
                if (p && !p.tagName) break;
              }
              return false;
            } catch (e) { return false; }
          });
        } catch {
          insideUser = false;
        }
      }
      if (!insideUser) kept.push(h);
    }
    if (kept.length > 0) return kept;
    // All candidates were inside user-message containers: not replies.
  }
  return [];
}

/**
 * In-page (evaluate-only, read-only) fallback extractor for the live DOM
 * observed 2026-10-16. Fully self-contained: uses only `document`, no Node
 * closures, so it can run via page.evaluate(fn).
 *
 * - User turns: leaf-most elements whose class contains 'user-message'
 *   (covers bg-user-message / group/user-message without relying on hashed
 *   suffixes like block-BQZwFn).
 * - Assistant replies: outermost elements whose class contains 'MarkdownRoot-'
 *   OR has a 'markdown' class token, excluding anything inside a user-message
 *   container (the user prompt itself contains both the correlation ID and
 *   'ACK-M05', so the ACK must come only from the assistant reply).
 * - Order is document order (index in querySelectorAll('*')); caller pairs
 *   each user turn with the first assistant reply that follows it.
 *
 * Returns { users: [{text, order}], assistants: [{text, order}] } (texts
 * untrimmed here; caller trims). Never throws: returns empty lists on failure.
 */
function fallbackTurnsEvaluate() {
  try {
    var all = [];
    try {
      var list = document.querySelectorAll('*');
      all = Array.prototype.slice.call(list);
    } catch (e) {
      all = [];
    }
    var classStr = function (el) {
      try {
        if (el.getAttribute) {
          var c = el.getAttribute('class');
          if (c !== null && c !== undefined) return String(c);
        }
      } catch (e) { /* ignore */ }
      try {
        if (typeof el.className === 'string') return el.className;
        if (el.className !== undefined && el.className !== null) return String(el.className);
      } catch (e) { /* ignore */ }
      return '';
    };
    var textOf = function (el) {
      try {
        var t = el.innerText;
        if (typeof t === 'string' && t.length > 0) return t;
      } catch (e) { /* ignore */ }
      try {
        return String(el.textContent || '');
      } catch (e) {
        return '';
      }
    };
    var isUser = function (el) {
      try {
        return classStr(el).indexOf('user-message') !== -1;
      } catch (e) {
        return false;
      }
    };
    var isAsst = function (el) {
      try {
        var c = classStr(el);
        if (c.indexOf('MarkdownRoot-') !== -1) return true;
        var parts = c.split(/\s+/);
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] === 'markdown') return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    };
    var parentOf = function (el) {
      try {
        return el.parentElement || el.parentNode || null;
      } catch (e) {
        return null;
      }
    };
    var isAncestor = function (anc, desc) {
      var p = parentOf(desc);
      var g = 0;
      while (p && g < 1000) {
        g += 1;
        if (p === anc) return true;
        if (!p.tagName) break;
        p = parentOf(p);
      }
      return false;
    };
    var hasUserAncestor = function (el) {
      var p = parentOf(el);
      var g = 0;
      while (p && g < 1000) {
        g += 1;
        if (p.tagName && isUser(p)) return true;
        if (!p.tagName) break;
        p = parentOf(p);
      }
      return false;
    };
    var users = [];
    var assts = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isUser(el)) users.push({ el: el, order: i });
      else if (isAsst(el)) assts.push({ el: el, order: i });
    }
    var leafUsers = users.filter(function (u) {
      for (var k = 0; k < users.length; k++) {
        if (users[k].el !== u.el && isAncestor(u.el, users[k].el)) return false;
      }
      return true;
    });
    var cleanAssts = assts.filter(function (a) {
      return !hasUserAncestor(a.el);
    });
    var outerAssts = cleanAssts.filter(function (a) {
      for (var k = 0; k < cleanAssts.length; k++) {
        if (cleanAssts[k].el !== a.el && isAncestor(cleanAssts[k].el, a.el)) return false;
      }
      return true;
    });
    var toOut = function (list2) {
      return list2.map(function (e) {
        var t = '';
        try {
          t = textOf(e.el);
        } catch (x) {
          t = '';
        }
        return { text: t, order: e.order };
      });
    };
    return { users: toOut(leafUsers), assistants: toOut(outerAssts) };
  } catch (e) {
    return { users: [], assistants: [] };
  }
}

/** Run fallbackTurnsEvaluate inside the page (read-only evaluate). */
async function getFallbackTurns(page) {
  if (!page || typeof page.evaluate !== 'function') return null;
  try {
    const r = await page.evaluate(fallbackTurnsEvaluate);
    if (r && typeof r === 'object' && Array.isArray(r.users) && Array.isArray(r.assistants)) {
      return r;
    }
  } catch {
    /* evaluate blocked — caller falls back to $$ handles */
  }
  return null;
}

/**
 * Pairing helper on fallback-evaluate data: LAST user turn containing
 * `correlation` + FIRST assistant reply that follows it in document order.
 * Returns { replyText, userOrder, assistantOrder } or throws AdapterError.
 */
function pairFallbackReply(data, correlation) {
  const users = (data && Array.isArray(data.users) ? data.users : []).slice()
    .sort((a, b) => a.order - b.order);
  const assts = (data && Array.isArray(data.assistants) ? data.assistants : []).slice()
    .sort((a, b) => a.order - b.order);
  let target = null;
  for (let i = users.length - 1; i >= 0; i--) {
    if ((users[i].text || '').includes(correlation)) {
      // Scan from the END would give the last; but there may be nested
      // duplicates — since evaluate already returns leaf-most users in order,
      // the LAST match in document order is the target.
      target = users[i];
      break;
    }
  }
  // Because users are sorted ascending, walking from the end picks the LAST.
  if (!target) {
    throw new AdapterError(
      'E_NO_CORRELATED_MESSAGE',
      `No user turn containing ${JSON.stringify(correlation)} was found; refusing to guess.`,
    );
  }
  let best = null;
  for (const a of assts) {
    if (a.order > target.order) {
      const t = (a.text || '').trim();
      if (!t) continue;
      if (!best || a.order < best.order) best = a;
    }
  }
  if (!best) {
    throw new AdapterError(
      'E_NO_RESPONSE',
      'No assistant reply found after the correlated message.',
    );
  }
  const replyText = (best.text || '').trim();
  if (!replyText) {
    throw new AdapterError('E_NO_RESPONSE', 'Assistant reply after the correlated message could not be read.');
  }
  return { replyText, userOrder: target.order, assistantOrder: best.order };
}

/** Count assistant turns currently rendered in the conversation. */
async function countAssistantMessages(page) {
  const handles = await getAssistantHandles(page);
  if (handles.length > 0) return handles.length;
  // Live-DOM fallback: count via read-only evaluate when $$ yields nothing
  // (e.g. minimal mock pages that only implement evaluate).
  const data = await getFallbackTurns(page);
  if (data && Array.isArray(data.assistants)) {
    const nonEmpty = data.assistants.filter((a) => ((a.text || '').trim() !== ''));
    if (nonEmpty.length > 0) return nonEmpty.length;
    if (data.assistants.length > 0) return data.assistants.length;
  }
  return handles.length;
}

/** Read text from a single handle, preferring its .markdown descendant. */
async function readHandleText(handle) {
  if (!handle) return '';
  if (typeof handle.$ === 'function') {
    try {
      const md = await handle.$(MARKDOWN_SELECTOR);
      if (md && typeof md.innerText === 'function') {
        const t = await md.innerText();
        if (t && t.trim()) return t.trim();
      }
    } catch {
      /* fall through to handle text */
    }
  }
  if (typeof handle.innerText === 'function') {
    try {
      const t = await handle.innerText();
      if (t && t.trim()) return t.trim();
    } catch {
      /* ignore */
    }
  }
  return '';
}

/** Read visible text of the last assistant turn (prefers .markdown). */
async function readLastAssistantText(page) {
  const handles = await getAssistantHandles(page);
  for (let i = handles.length - 1; i >= 0; i--) {
    const t = await readHandleText(handles[i]);
    if (t) return t;
  }
  // Live-DOM fallback: read-only evaluate (user text contains ACK too, so
  // only assistant-side texts are considered here).
  const data = await getFallbackTurns(page);
  if (data && Array.isArray(data.assistants)) {
    const sorted = data.assistants.slice().sort((a, b) => a.order - b.order);
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = (sorted[i].text || '').trim();
      if (t) return t;
    }
  }
  throw new AdapterError('E_NO_RESPONSE', 'Assistant reply arrived but its text could not be read.');
}

/** True while the assistant is still streaming (stop button visible). */
async function isStreaming(page) {
  try {
    const handles = (await page.$$(STOP_BUTTON_SELECTOR)) || [];
    return handles.length > 0;
  } catch {
    return false;
  }
}

/** Wait until [data-testid=stop-button] disappears (streaming finished). */
async function waitForStreamingEnd(page, deadline, now, sleepFn) {
  const sleepImpl = sleepFn || sleep;
  while (now() < deadline) {
    let streaming = false;
    try {
      streaming = await isStreaming(page);
    } catch {
      streaming = false;
    }
    if (!streaming) return;
    await sleepImpl(Math.min(250, Math.max(1, deadline - now())));
  }
  let still = false;
  try {
    still = await isStreaming(page);
  } catch {
    still = false;
  }
  if (still) {
    throw new AdapterError('E_NO_RESPONSE', 'Assistant streaming did not finish in time; failing without resend.');
  }
}

/**
 * Wait until the last assistant text is non-empty and stable across two
 * consecutive reads (guards against capturing a half-streamed chunk).
 */
async function readStableAssistantText(page, deadline, now, sleepFn) {
  const sleepImpl = sleepFn || sleep;
  let prev = null;
  while (now() < deadline) {
    let cur = '';
    try {
      cur = await readLastAssistantText(page);
    } catch {
      cur = '';
    }
    if (cur && cur === prev) return cur;
    if (cur) prev = cur;
    await sleepImpl(Math.min(250, Math.max(1, deadline - now())));
  }
  // Final attempt: return last readable text if any, else throw.
  try {
    const last = await readLastAssistantText(page);
    if (last && (!prev || last === prev)) return last;
    if (last) return last;
  } catch {
    /* fall through */
  }
  throw new AdapterError('E_NO_RESPONSE', 'Assistant reply text did not stabilize in time; failing without resend.');
}

/**
 * Extract { role, text } from a conversation-turn handle.
 * Tries evaluate (real DOM) first, then $ probing (fakes with $),
 * then describe metadata, then plain innerText.
 */
async function getTurnInfo(turn) {
  if (!turn) return { role: null, text: '' };
  if (typeof turn.evaluate === 'function') {
    try {
      const info = await turn.evaluate((el) => {
        try {
          const roleEl = el.querySelector ? el.querySelector('[data-message-author-role]') : null;
          const role = roleEl ? roleEl.getAttribute('data-message-author-role') : null;
          const md = el.querySelector ? el.querySelector('.markdown') : null;
          const text = md
            ? (md.innerText || md.textContent || '')
            : (el.innerText || el.textContent || '');
          return { role, text };
        } catch {
          return null;
        }
      });
      if (info && typeof info === 'object' && (info.role || info.text)) {
        return { role: info.role || null, text: String(info.text || '') };
      }
    } catch {
      /* fall through */
    }
  }
  if (typeof turn.$ === 'function') {
    try {
      let role = null;
      try {
        const u = await turn.$(USER_SELECTOR);
        if (u) role = 'user';
        else {
          const a = await turn.$('[data-message-author-role="assistant"]');
          if (a) role = 'assistant';
        }
      } catch {
        /* ignore */
      }
      let text = '';
      try {
        const md = await turn.$(MARKDOWN_SELECTOR);
        if (md && typeof md.innerText === 'function') {
          text = await md.innerText();
        } else if (typeof turn.innerText === 'function') {
          text = await turn.innerText();
        }
      } catch {
        try {
          text = await turn.innerText();
        } catch {
          text = '';
        }
      }
      if (role || text) return { role, text: String(text || '') };
    } catch {
      /* fall through */
    }
  }
  try {
    const d = turn.describe;
    if (d && typeof d === 'object' && (d.role || d.text)) {
      let text = String(d.text || '');
      try {
        if (typeof turn.innerText === 'function') {
          const t = await turn.innerText();
          if (t) text = t;
        }
      } catch {
        /* keep describe text */
      }
      return { role: d.role || null, text };
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof turn.innerText === 'function') {
      const text = await turn.innerText();
      return { role: null, text: String(text || '') };
    }
  } catch {
    /* ignore */
  }
  return { role: null, text: '' };
}

/**
 * READ-ONLY: locate the LAST user turn containing `correlation` and return
 * the assistant turn immediately after it. Never touches composer/send.
 * Only uses $$/$/innerText/evaluate reads on turn/role/markdown selectors.
 */
async function findCorrelatedReply(page, correlation) {
  const turns = await (async () => {
    try {
      return (await page.$$(TURN_SELECTOR)) || [];
    } catch {
      return [];
    }
  })();
  if (turns.length > 0) {
    const infos = [];
    for (const t of turns) infos.push(await getTurnInfo(t));
    let userIdx = -1;
    for (let i = infos.length - 1; i >= 0; i--) {
      if (infos[i].role === 'user' && (infos[i].text || '').includes(correlation)) {
        userIdx = i;
        break;
      }
    }
    if (userIdx === -1) {
      for (let i = infos.length - 1; i >= 0; i--) {
        if ((infos[i].text || '').includes(correlation)) {
          userIdx = i;
          break;
        }
      }
    }
    if (userIdx === -1) {
      // No correlated article turn: fall through to legacy + live-DOM
      // fallbacks below (which throw E_NO_CORRELATED_MESSAGE if truly absent).
    } else {
      for (let j = userIdx + 1; j < infos.length; j++) {
        const txt = (infos[j].text || '').trim();
        if (!txt) continue;
        if (infos[j].role === 'assistant' || !infos[j].role) {
          if (infos[j].role === 'user') continue;
          return { replyText: txt, userIndex: userIdx, assistantIndex: j };
        }
      }
      // Correlated article user exists but no assistant follows yet: still give
      // the live-DOM fallback a chance (different subtree), else report.
      try {
        const fbAfterArticle = await getFallbackTurns(page);
        if (fbAfterArticle && (fbAfterArticle.users.length > 0 || fbAfterArticle.assistants.length > 0)) {
          const paired = pairFallbackReply(fbAfterArticle, correlation);
          return { replyText: paired.replyText, userIndex: paired.userOrder, assistantIndex: paired.assistantOrder };
        }
      } catch (fbErr) {
        if (fbErr instanceof AdapterError && fbErr.code === 'E_NO_CORRELATED_MESSAGE') {
          // Fallback sees no correlated user either; fall through to the
          // canonical legacy error path below.
        } else if (fbErr instanceof AdapterError) {
          throw fbErr;
        }
      }
      throw new AdapterError(
        'E_NO_RESPONSE',
        `No assistant turn after the correlated user turn (index ${userIdx}); reply may still be streaming.`,
      );
    }
  }
  // Legacy fallback (no article turns): last user match + last assistant text.
  // NOTE: existing selectors stay first choice; live-DOM fallbacks below run
  // only when the above found nothing.
  let userHandles = [];
  for (const sel of USER_SELECTORS) {
    try {
      userHandles = (await page.$$(sel)) || [];
    } catch {
      userHandles = [];
    }
    if (userHandles.length > 0) break;
  }
  let lastUser = -1;
  for (let i = userHandles.length - 1; i >= 0; i--) {
    let t = '';
    try {
      t = await readHandleText(userHandles[i]);
    } catch {
      t = '';
    }
    // readHandleText prefers .markdown; fall back to innerText already.
    if (!t && typeof userHandles[i].innerText === 'function') {
      try {
        t = await userHandles[i].innerText();
      } catch {
        t = '';
      }
    }
    if ((t || '').includes(correlation)) {
      lastUser = i;
      break;
    }
  }
  if (lastUser !== -1) {
    const asst = await getAssistantHandles(page);
    if (asst.length === 0) {
      // Before giving up, try the live-DOM evaluate fallback (may see replies
      // the legacy selectors miss). Falls through to its own E_NO_RESPONSE.
      const fbEarly = await getFallbackTurns(page);
      if (fbEarly && (fbEarly.users.length > 0 || fbEarly.assistants.length > 0)) {
        return (function () {
          const paired = pairFallbackReply(fbEarly, correlation);
          return { replyText: paired.replyText, userIndex: paired.userOrder, assistantIndex: paired.assistantOrder };
        })();
      }
      throw new AdapterError('E_NO_RESPONSE', 'No assistant reply found after the correlated message.');
    }
    const replyText = await readHandleText(asst[asst.length - 1]);
    if (!replyText) {
      throw new AdapterError('E_NO_RESPONSE', 'Assistant reply after the correlated message could not be read.');
    }
    return { replyText, userIndex: lastUser, assistantIndex: asst.length - 1 };
  }
  // Live-DOM fallback (2026-10-16): read-only evaluate pairing.
  // LAST user turn containing the correlation + FIRST assistant reply that
  // follows it in document order. Assistant-only text (user prompt itself
  // contains 'ACK-M05', so user text must never count as the reply).
  const fb = await getFallbackTurns(page);
  if (fb && (fb.users.length > 0 || fb.assistants.length > 0)) {
    const paired = pairFallbackReply(fb, correlation);
    return { replyText: paired.replyText, userIndex: paired.userOrder, assistantIndex: paired.assistantOrder };
  }
  // Last resort when evaluate is unavailable: $$ with the fallback selectors.
  // Only read-only $$/innerText; never composer/send selectors.
  let fbUserHandles = [];
  try {
    fbUserHandles = (await page.$$(USER_FALLBACK_SELECTOR)) || [];
  } catch {
    fbUserHandles = [];
  }
  let fbLastUser = -1;
  for (let i = fbUserHandles.length - 1; i >= 0; i--) {
    let t = '';
    try {
      if (typeof fbUserHandles[i].innerText === 'function') t = await fbUserHandles[i].innerText();
    } catch {
      t = '';
    }
    if ((t || '').includes(correlation)) {
      fbLastUser = i;
      break;
    }
  }
  if (fbLastUser !== -1) {
    const asst = await getAssistantHandles(page);
    if (asst.length === 0) {
      throw new AdapterError('E_NO_RESPONSE', 'No assistant reply found after the correlated message.');
    }
    const replyText = await readHandleText(asst[asst.length - 1]);
    if (!replyText) {
      throw new AdapterError('E_NO_RESPONSE', 'Assistant reply after the correlated message could not be read.');
    }
    return { replyText: replyText.trim(), userIndex: fbLastUser, assistantIndex: asst.length - 1 };
  }
  throw new AdapterError(
    'E_NO_CORRELATED_MESSAGE',
    `No user message containing ${JSON.stringify(correlation)} was found; refusing to guess.`,
  );
}

/** Build the sanitized read-last receipt (never includes cookies/tokens). */
function buildReadLastReceipt({ correlation, tabUrl, actualResponse, startedAt, endedAt }) {
  return {
    tool: 'aion-m05-chatgpt-webapp-adapter',
    mode: 'read-last',
    correlation,
    matched: true,
    tabUrlSafe: safeTabUrl(tabUrl),
    startedAt,
    endedAt,
    actualResponse: String(actualResponse).slice(0, 2000),
  };
}

/** Collect tab refs from an injected browser (shared by live + read-last). */
async function collectTabRefs(browser) {
  let pages = [];
  if (typeof browser.contexts === 'function') {
    for (const ctx of browser.contexts()) pages.push(...ctx.pages());
  } else if (typeof browser.pages === 'function') {
    pages = await browser.pages();
  } else {
    throw new AdapterError('E_BROWSER', 'Injected browser exposes neither contexts() nor pages().');
  }
  return pages.map((p) => {
    let url = '';
    try {
      url = typeof p.url === 'function' ? p.url() : String(p.url || '');
    } catch {
      url = '';
    }
    return { url, title: '', ref: p };
  });
}

/**
 * READ-ONLY flow: attach is done by the caller; here we select the single
 * chatgpt.com tab, refuse login pages, and capture the reply after the
 * correlated user turn. NEVER fills, presses, clicks, focuses or submits.
 */
async function runReadLast(browser, opts) {
  const startedAt = new Date().toISOString();
  const correlation = opts.correlation;
  if (!correlation) {
    throw new AdapterError('E_CONFIRMATION', 'Read-last requires a correlation (exact match).');
  }
  const tabs = await collectTabRefs(browser);
  const target = selectTargetTab(tabs);
  const page = target.ref;
  const tabUrl = target.url;
  if (isLoginUrl(tabUrl)) {
    throw new AdapterError('E_LOGIN_REQUIRED', `Login required at ${safeTabUrl(tabUrl)}; refusing to bypass. Log in manually and retry.`);
  }
  // NOTE: deliberately NO bringToFront / fill / press / click / focus here.
  const found = await findCorrelatedReply(page, correlation);
  const endedAt = new Date().toISOString();
  return buildReadLastReceipt({
    correlation,
    tabUrl,
    actualResponse: found.replyText,
    startedAt,
    endedAt,
  });
}

/**
 * In-page inspector for --inspect-dom. Runs INSIDE the page via
 * page.evaluate(fn, payload), so it must stay fully self-contained
 * (no Node closures; all inputs come through `opts`).
 *
 * Returns TEXT-FREE `{ elements, tree, markers }` (+ `markerNodes` /
 * `textNodes` aliases for `markers`):
 * - elements: for every element matching ANY of the selectors: index,
 *   tag, selected attributes, which selector(s) matched, class tokens
 *   (max 12), booleans derived from the text, text length, depth and an
 *   ancestor chain of tags+data-testid. The element text itself is
 *   NEVER returned.
 * - tree: descendant summary starting from the deepest common ancestor
 *   of all text nodes containing the correlation ID, depth-limited to 6
 *   levels and capped at 200 nodes. Per node: tag, data-testid, role,
 *   aria-label presence (boolean only), class tokens (max 8), dir,
 *   containsCorrelation / containsAck booleans, textLength.
 * - markers: one entry per text node containing the correlation ID or
 *   the ACK marker: ancestor chain (tag+data-testid+class tokens max 4,
 *   up to 12 levels) plus which-marker booleans. Text itself NEVER
 *   returned.
 */
function inspectDomEvaluate(opts) {
  const o = opts || {};
  const correlation = typeof o.correlation === 'string' ? o.correlation : '';
  const ackMarker = typeof o.ackMarker === 'string' && o.ackMarker ? o.ackMarker : 'ACK-M05';
  const selectors = Array.isArray(o.selectors) && o.selectors.length > 0
    ? o.selectors
    : ['article'];
  const maxAncestors = typeof o.maxAncestors === 'number' && o.maxAncestors > 0
    ? Math.min(o.maxAncestors, 12)
    : 6;
  const markerMaxAncestors = typeof o.markerMaxAncestors === 'number' && o.markerMaxAncestors > 0
    ? Math.min(o.markerMaxAncestors, 12)
    : 12;
  const classMaxEl = typeof o.classMaxEl === 'number' && o.classMaxEl > 0
    ? Math.min(o.classMaxEl, 12)
    : 12;
  const classMaxTree = typeof o.classMaxTree === 'number' && o.classMaxTree > 0
    ? Math.min(o.classMaxTree, 8)
    : 8;
  const classMaxMarker = typeof o.classMaxMarker === 'number' && o.classMaxMarker > 0
    ? Math.min(o.classMaxMarker, 4)
    : 4;
  const treeMaxDepth = typeof o.treeMaxDepth === 'number' && o.treeMaxDepth > 0
    ? Math.min(o.treeMaxDepth, 6)
    : 6;
  const treeMaxNodes = typeof o.treeMaxNodes === 'number' && o.treeMaxNodes > 0
    ? Math.min(o.treeMaxNodes, 200)
    : 200;

  const getAttr = (el, name) => {
    try {
      if (el && el.getAttribute) {
        const v = el.getAttribute(name);
        return v !== null && v !== undefined ? String(v) : null;
      }
    } catch {
      /* ignore */
    }
    return null;
  };
  const hasAttr = (el, name) => {
    try {
      if (el && el.hasAttribute) return !!el.hasAttribute(name);
      return getAttr(el, name) !== null;
    } catch {
      return false;
    }
  };
  // Class tokens only (never the raw string path beyond tokens), truncated.
  const classTokensOf = (el, max) => {
    try {
      let raw = null;
      try {
        raw = el && el.getAttribute ? el.getAttribute('class') : null;
      } catch {
        raw = null;
      }
      if ((raw === null || raw === undefined || raw === '') && el && el.className !== undefined) {
        try {
          raw = typeof el.className === 'string' ? el.className : null;
        } catch {
          raw = null;
        }
      }
      if (raw === null || raw === undefined) return [];
      const toks = String(raw).split(/\s+/).filter(Boolean);
      return toks.slice(0, max);
    } catch {
      return [];
    }
  };
  const textOf = (el) => {
    try {
      if (el.innerText !== undefined && el.innerText !== null) return String(el.innerText);
      return String(el.textContent || '');
    } catch {
      return '';
    }
  };
  const tagOf = (el) => {
    try {
      return String(el.tagName || '').toUpperCase();
    } catch {
      return '';
    }
  };

  let nodes = [];
  try {
    const combined = selectors.join(',');
    nodes = Array.from(document.querySelectorAll(combined));
  } catch {
    nodes = [];
  }
  const elements = nodes.map((el, index) => {
    const text = textOf(el);
    const tag = tagOf(el);
    // Which selector(s) matched this element (best effort, read-only).
    let matchedSelectors = [];
    try {
      if (el && typeof el.matches === 'function') {
        matchedSelectors = selectors.filter((s) => {
          try {
            return !!el.matches(s);
          } catch {
            return false;
          }
        });
      }
    } catch {
      matchedSelectors = [];
    }
    const toks = classTokensOf(el, classMaxEl);
    let hasDataMessageId = false;
    try {
      hasDataMessageId = el.hasAttribute
        ? !!el.hasAttribute('data-message-id')
        : getAttr(el, 'data-message-id') !== null;
    } catch {
      hasDataMessageId = false;
    }
    // Ancestor chain: tags + data-testid only, innermost first, capped.
    const ancestors = [];
    try {
      let node = el;
      let n = 0;
      while (node && n < maxAncestors) {
        const t = tagOf(node);
        if (!t) break;
        let tid = null;
        try {
          tid = node.getAttribute ? node.getAttribute('data-testid') : null;
        } catch {
          tid = null;
        }
        ancestors.push(tid !== null && tid !== undefined && String(tid) !== ''
          ? `${t}[data-testid=${String(tid)}]`
          : t);
        try {
          node = node.parentElement;
        } catch {
          break;
        }
        n += 1;
        if (t === 'HTML') break;
      }
    } catch {
      /* best effort */
    }
    // Full depth: number of ancestors up to the root (uncapped loop guard).
    let depth = 0;
    try {
      let p = el;
      while (p && p.parentElement) {
        depth += 1;
        p = p.parentElement;
        if (depth > 1000) break;
      }
    } catch {
      /* keep partial depth */
    }
    return {
      index,
      tag,
      'data-testid': getAttr(el, 'data-testid'),
      'data-message-author-role': getAttr(el, 'data-message-author-role'),
      'data-turn': getAttr(el, 'data-turn'),
      hasDataMessageId,
      matchedSelectors: matchedSelectors.slice(),
      matchingSelectors: matchedSelectors.slice(),
      classTokens: toks.slice(),
      classList: toks.slice(),
      classes: toks.slice(),
      containsCorrelation: correlation ? text.indexOf(correlation) !== -1 : false,
      containsAck: text.indexOf(ackMarker) !== -1,
      textLength: text.length,
      depth,
      ancestors,
    };
  });

  // ---- marker text nodes: every text node containing correlation or ACK ----
  const textMatches = [];
  try {
    const root = (document.body || document.documentElement) || null;
    let walker = null;
    try {
      if (root && typeof document.createTreeWalker === 'function') {
        try {
          const nf = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT)
            ? NodeFilter.SHOW_TEXT
            : 4;
          walker = document.createTreeWalker(root, nf);
        } catch {
          walker = null;
        }
      }
    } catch {
      walker = null;
    }
    if (walker) {
      try {
        let tn = walker.nextNode();
        let guard = 0;
        while (tn && guard < 100000) {
          guard += 1;
          let val = '';
          try {
            val = String(tn.nodeValue !== undefined && tn.nodeValue !== null
              ? tn.nodeValue
              : (tn.textContent || ''));
          } catch {
            val = '';
          }
          const hasCorr = correlation ? val.indexOf(correlation) !== -1 : false;
          let hasAck = false;
          try {
            hasAck = val.indexOf(ackMarker) !== -1;
          } catch {
            hasAck = false;
          }
          if (hasCorr || hasAck) {
            let parent = null;
            try {
              parent = tn.parentElement || tn.parentNode || null;
            } catch {
              parent = null;
            }
            textMatches.push({
              parent,
              valueLength: val.length,
              containsCorrelation: hasCorr,
              containsAck: hasAck,
            });
          }
          try {
            tn = walker.nextNode();
          } catch {
            break;
          }
        }
      } catch {
        /* best effort */
      }
    }
  } catch {
    /* best effort */
  }
  // Fallback when TreeWalker is unavailable (e.g. minimal stubs): scan all
  // elements for marker text and treat the element as the text-node parent.
  // Read-only; still text-free (lengths + booleans only).
  if (textMatches.length === 0) {
    try {
      let all = null;
      try {
        all = Array.from(document.querySelectorAll('*'));
      } catch {
        all = null;
      }
      const pool = (all && all.length > 0) ? all : nodes;
      for (const el of (pool || [])) {
        let t = '';
        try {
          t = textOf(el);
        } catch {
          t = '';
        }
        const hasCorr = correlation ? t.indexOf(correlation) !== -1 : false;
        let hasAck = false;
        try {
          hasAck = t.indexOf(ackMarker) !== -1;
        } catch {
          hasAck = false;
        }
        if (hasCorr || hasAck) {
          textMatches.push({
            parent: el,
            valueLength: t.length,
            containsCorrelation: hasCorr,
            containsAck: hasAck,
          });
        }
        if (textMatches.length > 1000) break;
      }
    } catch {
      /* best effort */
    }
  }

  // Ancestor chain for each marker text node (up to 12 levels).
  const markers = textMatches.map((m, index) => {
    const ancestors = [];
    const ancestorDetails = [];
    try {
      let node = m.parent;
      let n = 0;
      while (node && n < markerMaxAncestors) {
        const t = tagOf(node);
        if (!t) break;
        const tid = getAttr(node, 'data-testid');
        const toks = classTokensOf(node, classMaxMarker);
        let label = t;
        if (tid !== null && tid !== '') label += `[data-testid=${tid}]`;
        if (toks.length > 0) label += `.${toks.join('.')}`;
        ancestors.push(label);
        ancestorDetails.push({ tag: t, testid: tid, 'data-testid': tid, classTokens: toks.slice() });
        try {
          node = node.parentElement || node.parentNode || null;
          // Stop above the document node (no tagName).
          if (node && !node.tagName) break;
        } catch {
          break;
        }
        n += 1;
        if (t === 'HTML') break;
      }
    } catch {
      /* best effort */
    }
    return {
      index,
      containsCorrelation: !!m.containsCorrelation,
      containsAck: !!m.containsAck,
      textLength: typeof m.valueLength === 'number' ? m.valueLength : 0,
      ancestors: ancestors.slice(),
      ancestorChain: ancestors.slice(),
      ancestorDetails,
    };
  });

  // ---- tree: deepest common ancestor of correlation text-node parents ----
  const chainToRoot = (el) => {
    const chain = [];
    try {
      let node = el;
      let guard = 0;
      while (node && node.tagName && guard < 1000) {
        guard += 1;
        chain.push(node);
        try {
          node = node.parentElement || node.parentNode || null;
        } catch {
          break;
        }
        if (node && !node.tagName) break;
      }
    } catch {
      /* best effort */
    }
    return chain; // innermost first
  };
  let dca = null;
  try {
    const corrParents = textMatches
      .filter((m) => m.containsCorrelation && m.parent && m.parent.tagName)
      .map((m) => m.parent);
    if (corrParents.length === 1) {
      dca = corrParents[0];
    } else if (corrParents.length > 1) {
      const chains = corrParents.map((p) => chainToRoot(p).slice().reverse()); // root first
      let common = null;
      const minLen = Math.min.apply(null, chains.map((c) => c.length));
      for (let d = 0; d < minLen; d++) {
        const cand = chains[0][d];
        let allSame = true;
        for (let c = 1; c < chains.length; c++) {
          if (chains[c][d] !== cand) {
            allSame = false;
            break;
          }
        }
        if (!allSame) break;
        common = cand;
      }
      dca = common;
    }
  } catch {
    dca = null;
  }

  const tree = [];
  let treeRoot = null;
  try {
    if (dca) {
      treeRoot = {
        tag: tagOf(dca),
        'data-testid': getAttr(dca, 'data-testid'),
        testid: getAttr(dca, 'data-testid'),
      };
      const seen = new Set();
      const queue = [{ el: dca, relDepth: 0 }];
      let qi = 0;
      while (qi < queue.length && tree.length < treeMaxNodes) {
        const cur = queue[qi];
        qi += 1;
        if (!cur || !cur.el || !cur.el.tagName) continue;
        if (seen.has(cur.el)) continue;
        seen.add(cur.el);
        if (cur.relDepth >= treeMaxDepth) continue;
        const text = textOf(cur.el);
        const toks = classTokensOf(cur.el, classMaxTree);
        const tid = getAttr(cur.el, 'data-testid');
        const role = getAttr(cur.el, 'role');
        const entry = {
          index: tree.length,
          relativeDepth: cur.relDepth,
          depth: cur.relDepth,
          tag: tagOf(cur.el),
          'data-testid': tid,
          testid: tid,
          role,
          hasAriaLabel: hasAttr(cur.el, 'aria-label'),
          ariaLabelPresent: hasAttr(cur.el, 'aria-label'),
          classTokens: toks.slice(),
          classList: toks.slice(),
          dir: getAttr(cur.el, 'dir'),
          containsCorrelation: correlation ? text.indexOf(correlation) !== -1 : false,
          containsAck: text.indexOf(ackMarker) !== -1,
          textLength: text.length,
        };
        tree.push(entry);
        if (tree.length >= treeMaxNodes) break;
        if (cur.relDepth + 1 >= treeMaxDepth) continue;
        let kids = [];
        try {
          if (cur.el.children && typeof cur.el.children.length === 'number') {
            kids = Array.from(cur.el.children);
          } else if (cur.el.childNodes && typeof cur.el.childNodes.length === 'number') {
            kids = Array.from(cur.el.childNodes).filter((n) => {
              try {
                return !!(n && n.tagName);
              } catch {
                return false;
              }
            });
          }
        } catch {
          kids = [];
        }
        for (const k of kids) {
          if (tree.length + queue.length - qi >= treeMaxNodes) break;
          queue.push({ el: k, relDepth: cur.relDepth + 1 });
        }
      }
    }
  } catch {
    /* best effort: keep partial tree */
  }

  return {
    elements,
    tree,
    treeRoot,
    markers,
    markerNodes: markers,
    textNodes: markers,
  };
}

/**
 * Run the in-page inspector against a page handle (read-only).
 * Only calls page.evaluate + (read-only) page.url()/page.title().
 * NEVER focuses, types, clicks, presses keys or navigates.
 */
async function collectInspectDom(page, opts) {
  const correlation = opts && opts.correlation;
  if (!correlation) {
    throw new AdapterError('E_CONFIRMATION', 'Inspect-dom requires a correlation (exact match).');
  }
  if (!page || typeof page.evaluate !== 'function') {
    throw new AdapterError('E_INSPECT', 'Inspect-dom requires a page with evaluate(); refusing to guess.');
  }
  const payload = {
    correlation,
    ackMarker: INSPECT_ACK_MARKER,
    selectors: INSPECT_DOM_SELECTORS,
    maxAncestors: INSPECT_MAX_ANCESTORS,
    markerMaxAncestors: INSPECT_MARKER_MAX_ANCESTORS,
    classMaxEl: INSPECT_CLASS_TOKENS_MAX_ELEMENT,
    classMaxTree: INSPECT_CLASS_TOKENS_MAX_TREE,
    classMaxMarker: INSPECT_CLASS_TOKENS_MAX_MARKER,
    treeMaxDepth: INSPECT_TREE_MAX_DEPTH,
    treeMaxNodes: INSPECT_TREE_MAX_NODES,
  };
  let raw;
  try {
    raw = await page.evaluate(inspectDomEvaluate, payload);
  } catch (err) {
    throw new AdapterError('E_INSPECT', `Inspect-dom evaluate failed: ${err && err.message}`);
  }
  // New shape: { elements, tree, markers (+aliases) }. Legacy fakes may
  // still return a bare array — normalize to the object shape.
  if (Array.isArray(raw)) {
    return {
      elements: raw,
      tree: [],
      treeRoot: null,
      markers: [],
      markerNodes: [],
      textNodes: [],
    };
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw.elements)) {
    const markers = Array.isArray(raw.markers)
      ? raw.markers
      : Array.isArray(raw.markerNodes)
        ? raw.markerNodes
        : Array.isArray(raw.textNodes)
          ? raw.textNodes
          : [];
    const tree = Array.isArray(raw.tree) ? raw.tree : [];
    return {
      elements: raw.elements,
      tree,
      treeRoot: raw.treeRoot || null,
      markers,
      markerNodes: markers,
      textNodes: markers,
    };
  }
  throw new AdapterError('E_INSPECT', 'Inspect-dom returned no element list; refusing to guess.');
}

/**
 * READ-ONLY flow: same tab selection and same no-interaction guarantees
 * as runReadLast (no bringToFront/fill/press/click/focus/type/navigation).
 * Evaluates inspectDomEvaluate in the page and returns a TEXT-FREE
 * summary plus the (scrubbed) page URL and title.
 */
async function runInspectDom(browser, opts) {
  const startedAt = new Date().toISOString();
  const correlation = opts && opts.correlation;
  if (!correlation) {
    throw new AdapterError('E_CONFIRMATION', 'Inspect-dom requires a correlation (exact match).');
  }
  const tabs = await collectTabRefs(browser);
  const target = selectTargetTab(tabs);
  const page = target.ref;
  const tabUrl = target.url;
  if (isLoginUrl(tabUrl)) {
    throw new AdapterError('E_LOGIN_REQUIRED', `Login required at ${safeTabUrl(tabUrl)}; refusing to bypass. Log in manually and retry.`);
  }
  // NOTE: deliberately NO bringToFront / fill / press / click / focus /
  // type / goto / reload / navigation here — evaluate-only, like read-last.
  let tabTitle = '';
  try {
    if (page && typeof page.title === 'function') {
      const t = await page.title();
      if (typeof t === 'string') tabTitle = t;
    }
  } catch {
    tabTitle = '';
  }
  const collected = await collectInspectDom(page, { correlation });
  const elements = collected.elements;
  const endedAt = new Date().toISOString();
  return {
    tool: 'aion-m05-chatgpt-webapp-adapter',
    mode: 'inspect-dom',
    correlation,
    tabUrlSafe: safeTabUrl(tabUrl),
    tabTitle: String(tabTitle || '').slice(0, 300),
    url: safeTabUrl(tabUrl),
    title: String(tabTitle || '').slice(0, 300),
    selectors: INSPECT_DOM_SELECTORS.slice(),
    elementCount: elements.length,
    elements,
    tree: collected.tree,
    treeRoot: collected.treeRoot,
    treeNodeCount: collected.tree.length,
    markers: collected.markers,
    markerNodes: collected.markers,
    textNodes: collected.markers,
    markerCount: collected.markers.length,
    startedAt,
    endedAt,
  };
}

/**
 * Verify the captured reply contains the expected exact marker.
 * Throws E_MISMATCH otherwise (reject synthetic/other-LLM output).
 */
function verifyReply(actualText, expectedReply = EXPECTED_REPLY) {
  const lines = String(actualText).split('\n').map((l) => l.trim());
  if (!lines.includes(expectedReply)) {
    throw new AdapterError(
      'E_MISMATCH',
      `Response mismatch: expected a line exactly equal to ${JSON.stringify(expectedReply)}; got: ${JSON.stringify(String(actualText).slice(0, 300))}`,
    );
  }
  return true;
}

/** Build the sanitized JSON receipt (never includes cookies/tokens). */
function buildReceipt({ correlation, expectedReply, tabUrl, actualResponse, startedAt, endedAt, mode }) {
  return {
    tool: 'aion-m05-chatgpt-webapp-adapter',
    mode,
    correlation,
    expectedReply,
    matched: true,
    tabUrlSafe: safeTabUrl(tabUrl),
    startedAt,
    endedAt,
    // Full visible assistant text, capped to keep the receipt short.
    actualResponse: String(actualResponse).slice(0, 2000),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One-shot live flow against an injected browser object.
 * browser: { contexts() -> [{ pages() -> [page] }] } (Playwright) or
 *          { pages() -> [page] } (fake). Never imported here — injected.
 * page interface: { url(), bringToFront(), $$, ... }.
 * opts: { message, correlation, expectedReply, timeoutMs, now? }.
 */
async function runOnce(browser, opts) {
  const startedAt = new Date().toISOString();
  const now = opts.now || Date.now;
  const timeoutMs = opts.timeoutMs || 120000;

  // 1. Collect tabs (URL + title only — never cookies/tokens/DOM dumps).
  let pages = [];
  if (typeof browser.contexts === 'function') {
    for (const ctx of browser.contexts()) pages.push(...ctx.pages());
  } else if (typeof browser.pages === 'function') {
    pages = await browser.pages();
  } else {
    throw new AdapterError('E_BROWSER', 'Injected browser exposes neither contexts() nor pages().');
  }
  const tabs = pages.map((p) => {
    let url = '';
    let title = '';
    try {
      url = typeof p.url === 'function' ? p.url() : String(p.url || '');
    } catch {
      url = '';
    }
    try {
      title = typeof p.title === 'function' ? '' : '';
    } catch {
      title = '';
    }
    return { url, title, ref: p };
  });

  // 2. Select the single authenticated web-app tab.
  const target = selectTargetTab(tabs);
  const page = target.ref;
  const tabUrl = target.url;

  // 3. Refuse when a login page is showing.
  if (isLoginUrl(tabUrl)) {
    throw new AdapterError('E_LOGIN_REQUIRED', `Login required at ${safeTabUrl(tabUrl)}; refusing to bypass. Log in manually and retry.`);
  }
  if (typeof page.bringToFront === 'function') {
    try {
      await page.bringToFront();
    } catch {
      /* non-fatal */
    }
  }

  // 4. Locate exactly one editable composer.
  const { handle: composer } = await locateComposer(page);

  // 5. Snapshot assistant count, submit ONCE, wait for a NEW reply.
  const before = await countAssistantMessages(page);
  try {
    await composer.fill(opts.message);
  } catch (err) {
    throw new AdapterError('E_SUBMIT', `Could not fill composer (single attempt, no retry): ${err.message}`);
  }
  try {
    await composer.press('Enter');
  } catch (err) {
    throw new AdapterError('E_SUBMIT', `Could not submit composer (single attempt, no retry): ${err.message}`);
  }

  const deadline = now() + timeoutMs;
  let after = before;
  while (now() < deadline) {
    await sleep(Math.min(250, Math.max(1, deadline - now())));
    after = await countAssistantMessages(page);
    if (after > before) break;
  }
  if (after <= before) {
    throw new AdapterError('E_NO_RESPONSE', `No new assistant reply appeared within ${timeoutMs}ms; failing without resend.`);
  }

  // 6. Streaming finished when [data-testid=stop-button] disappears;
  // then capture stable text (two consecutive equal reads).
  await waitForStreamingEnd(page, deadline, now);
  const actualResponse = await readStableAssistantText(page, deadline, now);
  verifyReply(actualResponse, opts.expectedReply);

  const endedAt = new Date().toISOString();
  return buildReceipt({
    correlation: opts.correlation,
    expectedReply: opts.expectedReply,
    tabUrl,
    actualResponse,
    startedAt,
    endedAt,
    mode: 'live',
  });
}

module.exports = {
  EXPECTED_CORRELATION,
  EXPECTED_REPLY,
  CDP_DEFAULT,
  OUTBOUND_MESSAGE,
  COMPOSER_SELECTORS,
  SEND_BUTTON_SELECTORS,
  TURN_SELECTOR,
  ASSISTANT_IN_TURN_SELECTOR,
  USER_IN_TURN_SELECTOR,
  USER_SELECTOR,
  MARKDOWN_SELECTOR,
  STOP_BUTTON_SELECTOR,
  ASSISTANT_SELECTORS,
  USER_SELECTORS,
  USER_FALLBACK_SELECTOR,
  ASSISTANT_FALLBACK_SELECTORS,
  fallbackTurnsEvaluate,
  getFallbackTurns,
  pairFallbackReply,
  AdapterError,
  parseArgs,
  loadOutbound,
  assertLiveConfirmed,
  assertReadLastConfirmed,
  assertInspectDomConfirmed,
  isChatGptWebAppTab,
  isLoginUrl,
  selectTargetTab,
  safeTabUrl,
  locateComposer,
  isFallbackTextarea,
  isInComposerForm,
  getAssistantHandles,
  countAssistantMessages,
  readHandleText,
  readLastAssistantText,
  isStreaming,
  waitForStreamingEnd,
  readStableAssistantText,
  getTurnInfo,
  findCorrelatedReply,
  buildReadLastReceipt,
  collectTabRefs,
  runReadLast,
  INSPECT_DOM_SELECTORS,
  INSPECT_ACK_MARKER,
  INSPECT_MAX_ANCESTORS,
  INSPECT_MARKER_MAX_ANCESTORS,
  INSPECT_CLASS_TOKENS_MAX_ELEMENT,
  INSPECT_CLASS_TOKENS_MAX_TREE,
  INSPECT_CLASS_TOKENS_MAX_MARKER,
  INSPECT_TREE_MAX_DEPTH,
  INSPECT_TREE_MAX_NODES,
  inspectDomEvaluate,
  collectInspectDom,
  runInspectDom,
  verifyReply,
  buildReceipt,
  runOnce,
};
