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
const ASSISTANT_SELECTORS = [
  '[data-message-author-role="assistant"]',
];

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
    confirmCorrelation: null,
    cdp: CDP_DEFAULT,
    outboundFile: path.resolve(__dirname, '..', 'AION-OUTBOUND-M05-001.md'),
    timeoutMs: 120000,
    receiptDir: __dirname,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') args.live = true;
    else if (a === '--confirm-correlation') args.confirmCorrelation = argv[++i] ?? null;
    else if (a.startsWith('--confirm-correlation=')) args.confirmCorrelation = a.split('=').slice(1).join('=');
    else if (a === '--cdp') args.cdp = argv[++i] ?? args.cdp;
    else if (a.startsWith('--cdp=')) args.cdp = a.split('=').slice(1).join('=');
    else if (a === '--outbound-file') args.outboundFile = argv[++i] ?? args.outboundFile;
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
  }
  args.mode = args.live ? 'live' : 'dry-run';
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

/** Count assistant messages currently rendered in the conversation. */
async function countAssistantMessages(page) {
  let total = 0;
  for (const sel of ASSISTANT_SELECTORS) {
    let handles = [];
    try {
      handles = (await page.$$(sel)) || [];
    } catch {
      continue;
    }
    total += handles.length;
  }
  return total;
}

/** Read visible text of the last assistant message. */
async function readLastAssistantText(page) {
  for (const sel of ASSISTANT_SELECTORS) {
    let handles = [];
    try {
      handles = (await page.$$(sel)) || [];
    } catch {
      continue;
    }
    if (handles.length > 0) {
      const last = handles[handles.length - 1];
      try {
        const t = await last.innerText();
        if (t && t.trim()) return t.trim();
      } catch {
        continue;
      }
    }
  }
  throw new AdapterError('E_NO_RESPONSE', 'Assistant reply arrived but its text could not be read.');
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
    await sleep(Math.min(1000, Math.max(1, deadline - now())));
    after = await countAssistantMessages(page);
    if (after > before) break;
  }
  if (after <= before) {
    throw new AdapterError('E_NO_RESPONSE', `No new assistant reply appeared within ${timeoutMs}ms; failing without resend.`);
  }

  // 6. Capture visible reply text from THIS conversation and verify.
  const actualResponse = await readLastAssistantText(page);
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
  AdapterError,
  parseArgs,
  loadOutbound,
  assertLiveConfirmed,
  isChatGptWebAppTab,
  isLoginUrl,
  selectTargetTab,
  safeTabUrl,
  locateComposer,
  isFallbackTextarea,
  isInComposerForm,
  countAssistantMessages,
  readLastAssistantText,
  verifyReply,
  buildReceipt,
  runOnce,
};
