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

// Candidate selectors for the ChatGPT web-app composer (tried in order).
const COMPOSER_SELECTORS = [
  '#prompt-textarea',
  'div#prompt-textarea[contenteditable="true"]',
  'form [contenteditable="true"]',
  'main [contenteditable="true"]',
  'form textarea',
];

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
 * Defensively locate the editable composer on a page.
 * page: minimal interface { $$(selector) -> [handle], } where each handle
 * has isVisible() and describe metadata. Returns { selector, handle }.
 * Throws E_NO_COMPOSER (none) or E_AMBIGUOUS_COMPOSER (more than one).
 */
async function locateComposer(page) {
  const seen = new Set();
  const visible = [];
  for (const sel of COMPOSER_SELECTORS) {
    let handles = [];
    try {
      handles = (await page.$$(sel)) || [];
    } catch {
      continue;
    }
    for (const h of handles) {
      if (seen.has(h)) continue;
      seen.add(h);
      let vis = false;
      try {
        vis = await h.isVisible();
      } catch {
        vis = false;
      }
      if (vis) visible.push({ selector: sel, handle: h });
    }
  }
  if (visible.length === 0) {
    throw new AdapterError(
      'E_NO_COMPOSER',
      'No editable ChatGPT composer found (tried: ' + COMPOSER_SELECTORS.join(', ') + '). ' +
        'Failing: login may be required or UI changed.',
    );
  }
  if (visible.length > 1) {
    throw new AdapterError(
      'E_AMBIGUOUS_COMPOSER',
      `Ambiguous UI: ${visible.length} visible composer candidates; refusing to guess.`,
    );
  }
  return visible[0];
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
  AdapterError,
  parseArgs,
  loadOutbound,
  assertLiveConfirmed,
  isChatGptWebAppTab,
  isLoginUrl,
  selectTargetTab,
  safeTabUrl,
  locateComposer,
  countAssistantMessages,
  readLastAssistantText,
  verifyReply,
  buildReceipt,
  runOnce,
};
