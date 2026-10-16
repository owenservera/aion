'use strict';
/**
 * send-m05.test.js — unit tests for the M05 adapter (node:test).
 *
 * HARD CONSTRAINT: these tests NEVER connect to, probe, or inspect a real
 * Chrome on CDP ports 9244/9245. They use injected fake browser/page objects
 * plus a local HTML fixture served on 127.0.0.1 from a temp in-test server.
 *
 * Run: cd adapter && NODE_PATH=/home/box/aion-tools/node_modules node --test
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const lib = require('./lib');

const CORR = 'AION-M05-20261016-COC-001';
const ACK = 'ACK-M05-COC-001';
const CHAT_URL = 'https://chatgpt.com/c/abc123';

// ---- fakes (injected instead of Playwright) ----

function fakeHandle(opts = {}) {
  return {
    _visible: opts.visible !== false,
    _text: opts.text || '',
    _filled: null,
    _pressed: [],
    async isVisible() { return this._visible; },
    async innerText() { return this._text; },
    async fill(t) { this._filled = t; if (opts.onFill) await opts.onFill(t); },
    async press(k) { this._pressed.push(k); if (opts.onPress) await opts.onPress(k); },
  };
}

// Minimal fake page: url(), bringToFront(), $$(selector).
function fakePage(opts = {}) {
  const page = {
    _url: opts.url || CHAT_URL,
    _composerCount: opts.composerCount ?? 1,
    _assistantTexts: [...(opts.assistantTexts || [])],
    _replyOnSubmit: opts.replyOnSubmit, // text appended after Enter
    _submitted: 0,
    _composer: null,
    url() { return this._url; },
    async bringToFront() {},
    async $$(sel) {
      if (sel === '[data-message-author-role="assistant"]') {
        return this._assistantTexts.map((t) => fakeHandle({ text: t }));
      }
      if (this._composerCount > 0 && /prompt-textarea|contenteditable|textarea/.test(sel)) {
        if (!this._composer) {
          // Only the FIRST matching selector owns the handle(s), so
          // multi-selector scans do not look ambiguous.
          this._composer = [];
          for (let i = 0; i < this._composerCount; i++) {
            this._composer.push(fakeHandle({
              onPress: async () => {
                this._submitted += 1;
                if (this._replyOnSubmit !== undefined) this._assistantTexts.push(this._replyOnSubmit);
              },
            }));
          }
          this._firstComposerSel = sel;
        }
        return sel === this._firstComposerSel ? this._composer : [];
      }
      return [];
    },
  };
  return page;
}

function fakeBrowser(pages) {
  return { contexts: () => [{ pages: () => pages }] };
}

// ---- tests ----

test('default mode is dry-run (no flags send nothing)', () => {
  const args = lib.parseArgs([]);
  assert.equal(args.live, false);
  assert.equal(args.mode, 'dry-run');
  assert.equal(args.cdp, 'http://127.0.0.1:9244');
});

test('live without exact confirmation flag is refused', () => {
  const corr = CORR;
  assert.throws(() => lib.assertLiveConfirmed(lib.parseArgs(['--live']), corr),
    (e) => e.code === 'E_CONFIRMATION');
  assert.throws(() => lib.assertLiveConfirmed(lib.parseArgs(['--live', '--confirm-correlation', 'WRONG']), corr),
    (e) => e.code === 'E_CONFIRMATION');
  assert.throws(() => lib.assertLiveConfirmed(lib.parseArgs(['--live', '--confirm-correlation', '']), corr),
    (e) => e.code === 'E_CONFIRMATION');
});

test('live with BOTH exact flags is accepted', () => {
  const args = lib.parseArgs(['--live', '--confirm-correlation', CORR]);
  assert.deepEqual(lib.assertLiveConfirmed(args, CORR), { live: true });
});

test('missing tab: no chatgpt.com web-app tab fails clearly', async () => {
  assert.throws(() => lib.selectTargetTab([]), (e) => e.code === 'E_NO_TAB');
  assert.throws(
    () => lib.selectTargetTab([{ url: 'https://example.com/' }, { url: 'https://mail.google.com/' }]),
    (e) => e.code === 'E_NO_TAB',
  );
  // Login pages do not count as authenticated web-app tabs.
  assert.equal(lib.isChatGptWebAppTab('https://chatgpt.com/auth/login'), false);
  await assert.rejects(
    lib.runOnce(fakeBrowser([fakePage({ url: 'https://example.com/' })]), {
      message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 10,
    }),
    (e) => e.code === 'E_NO_TAB',
  );
});

test('ambiguous tabs are refused, never guessed', () => {
  assert.throws(
    () => lib.selectTargetTab([{ url: CHAT_URL }, { url: 'https://chatgpt.com/c/other' }]),
    (e) => e.code === 'E_AMBIGUOUS_TAB',
  );
});

test('missing composer fails (login/changed UI), single chatgpt tab', async () => {
  const page = fakePage({ url: CHAT_URL, composerCount: 0, assistantTexts: [] });
  await assert.rejects(lib.locateComposer(page), (e) => e.code === 'E_NO_COMPOSER');
  await assert.rejects(
    lib.runOnce(fakeBrowser([page]), {
      message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 10,
    }),
    (e) => e.code === 'E_NO_COMPOSER',
  );
});

test('mismatched response is rejected', () => {
  assert.throws(() => lib.verifyReply('Hello from some other model', ACK), (e) => e.code === 'E_MISMATCH');
  assert.equal(lib.verifyReply(`some preamble\n${ACK}\nfooter`, ACK), true);
});

test('mismatched live reply fails end-to-end against mock', async () => {
  const page = fakePage({ url: CHAT_URL, assistantTexts: [], replyOnSubmit: 'I am a different assistant, hello!' });
  await assert.rejects(
    lib.runOnce(fakeBrowser([page]), {
      message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 5000,
    }),
    (e) => e.code === 'E_MISMATCH',
  );
  assert.equal(page._submitted, 1, 'composer must be submitted exactly once');
});

test('happy path against mock: submit once, capture reply, sanitized receipt', async () => {
  const page = fakePage({
    url: 'https://chatgpt.com/c/abc123?utm_source=x#frag',
    assistantTexts: ['older message'],
    replyOnSubmit: ACK,
  });
  const receipt = await lib.runOnce(fakeBrowser([page]), {
    message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 5000,
  });
  assert.equal(page._submitted, 1, 'exactly one submit, no retries');
  assert.equal(page._composer[0]._filled, lib.OUTBOUND_MESSAGE, 'exact outbound text filled, unmodified');
  assert.equal(receipt.mode, 'live');
  assert.equal(receipt.correlation, CORR);
  assert.equal(receipt.matched, true);
  assert.equal(receipt.actualResponse, ACK);
  assert.equal(receipt.tabUrlSafe, 'https://chatgpt.com/c/abc123', 'query/hash stripped from receipt URL');
  assert.ok(receipt.startedAt && receipt.endedAt);
});

test('outbound text loads verbatim from AION-OUTBOUND-M05-001.md, never fabricated', () => {
  const mdPath = path.resolve(__dirname, '..', 'AION-OUTBOUND-M05-001.md');
  const outbound = lib.loadOutbound(mdPath);
  assert.equal(outbound.correlation, CORR);
  assert.equal(outbound.expectedReply, ACK);
  assert.ok(outbound.message.includes(CORR));
  assert.ok(outbound.message.includes(ACK));
  assert.throws(() => lib.loadOutbound(path.join(__dirname, 'does-not-exist.md')),
    (e) => e.code === 'E_OUTBOUND_MISSING');
});

test('local HTML fixture served on 127.0.0.1 exposes composer + expected marker', async () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const port = server.address().port;
    const res = await fetch(`http://127.0.0.1:${port}/fixture.html`);
    const body = await res.text();
    assert.ok(body.includes('id="prompt-textarea"'), 'fixture has the composer target');
    assert.ok(body.includes('data-message-author-role="assistant"'), 'fixture has an assistant message');
    assert.ok(body.includes(ACK), 'fixture carries the expected marker');
  } finally {
    await new Promise((r) => server.close(r));
  }
});

test('receipt never carries secrets; URLs are scrubbed', () => {
  const r = lib.buildReceipt({
    correlation: CORR, expectedReply: ACK,
    tabUrl: 'https://chatgpt.com/c/abc?session=xyz#tok',
    actualResponse: ACK, startedAt: 't0', endedAt: 't1', mode: 'live',
  });
  const s = JSON.stringify(r);
  assert.ok(!s.includes('session=xyz') && !s.includes('#tok'));
  assert.ok(!/cookie|token/i.test(s));
  assert.equal(r.tabUrlSafe, 'https://chatgpt.com/c/abc');
});

test('fixture models live ChatGPT composer: ProseMirror div + hidden fallback textarea + send button', () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8');
  assert.ok(html.includes('id="prompt-textarea"'), 'fixture has #prompt-textarea editor');
  assert.ok(html.includes('contenteditable'), 'fixture editor is contenteditable');
  assert.ok(html.includes('name="prompt-textarea"'), 'fixture has hidden fallback textarea');
  assert.ok(html.includes('wcDTda'), 'fixture fallback carries wcDTda marker');
  assert.ok(html.includes('aria-hidden'), 'fixture fallback is aria-hidden');
  assert.ok(
    html.includes('data-testid="send-button"') || html.includes('id="composer-submit-button"'),
    'fixture form contains the send button',
  );
});

test('composer prefers visible #prompt-textarea over hidden/fallback textarea (live E_AMBIGUOUS_COMPOSER fix)', async () => {
  // Live ChatGPT UI: one ProseMirror div (matching several selectors via
  // distinct ElementHandle wrappers for the SAME node) plus one hidden
  // fallback <textarea> that still reports visible. Must resolve to the div.
  const editorDesc = { key: 'prosemirror-div-1', tagName: 'DIV', id: 'prompt-textarea' };
  const fallbackDesc = {
    key: 'fallback-textarea-1', tagName: 'TEXTAREA', name: 'prompt-textarea',
    className: 'wcDTda', hidden: true, ariaHidden: 'true', display: 'none', width: 0, height: 0,
  };
  const mkEditorWrapper = () => {
    const h = fakeHandle({});
    h.describe = editorDesc;
    return h;
  };
  const fallback = fakeHandle({});
  fallback.describe = fallbackDesc;
  assert.equal(await lib.isFallbackTextarea(fallback), true, 'hidden textarea is a non-candidate');
  const probeEditor = mkEditorWrapper();
  assert.equal(await lib.isFallbackTextarea(probeEditor), false, 'ProseMirror div is genuine');

  const page = {
    async $$(sel) {
      if (sel === '#prompt-textarea') return [mkEditorWrapper()];
      if (sel === 'div#prompt-textarea[contenteditable="true"]') return [mkEditorWrapper()];
      if (sel === 'form [contenteditable="true"]') return [mkEditorWrapper()];
      if (sel === 'main [contenteditable="true"]') return [mkEditorWrapper()];
      if (sel === 'form textarea') return [fallback];
      return [];
    },
  };
  const found = await lib.locateComposer(page);
  assert.equal(found.selector, '#prompt-textarea', 'most-specific #prompt-textarea wins');
  assert.equal(found.handle.describe.key, 'prosemirror-div-1');
});

test('same DOM node via multiple selectors dedupes via evaluate marking (Playwright wrapper duplicates)', async () => {
  // Playwright returns a FRESH ElementHandle per $$ call, so the same div
  // appears as distinct objects. DOM marking must collapse them to one.
  const backing = {};
  const mkWrapper = () => ({
    async isVisible() { return true; },
    async evaluate(fn) {
      const src = String(typeof fn === 'function' ? fn : '');
      if (src.includes('__aionComposerKey')) {
        if (!backing.key) backing.key = 'live-div-1';
        return backing.key;
      }
      if (src.includes('closest')) return null; // form check indeterminate
      return false; // fallback probe: DIV is never a fallback textarea
    },
  });
  const page = {
    async $$(sel) {
      if (/prompt-textarea|contenteditable/.test(sel)) return [mkWrapper()];
      return [];
    },
  };
  const found = await lib.locateComposer(page);
  assert.ok(found && found.handle, 'single editor resolves despite wrapper duplicates');
  assert.equal(found.selector, '#prompt-textarea');
});

test('two genuinely different visible editors still refuse with E_AMBIGUOUS_COMPOSER', async () => {
  const a = fakeHandle({});
  a.describe = { key: 'editor-a', tagName: 'DIV', id: 'prompt-textarea' };
  const b = fakeHandle({});
  b.describe = { key: 'editor-b', tagName: 'DIV', id: 'other-editor' };
  const page = {
    async $$(sel) {
      if (sel === '#prompt-textarea') return [a];
      if (sel === 'form [contenteditable="true"]') return [b];
      return [];
    },
  };
  await assert.rejects(lib.locateComposer(page), (e) => e.code === 'E_AMBIGUOUS_COMPOSER');
});

test('hidden fallback textarea alone is E_NO_COMPOSER (non-candidate, never guessed)', async () => {
  const fallback = fakeHandle({});
  fallback.describe = {
    key: 'fallback-only', tagName: 'TEXTAREA', name: 'prompt-textarea',
    className: 'wcDTda', ariaHidden: 'true', display: 'none', width: 0, height: 0,
  };
  const page = {
    async $$(sel) {
      if (sel === 'form textarea') return [fallback];
      return [];
    },
  };
  // Even though the textarea reports visible, it is filtered → no composer.
  await assert.rejects(lib.locateComposer(page), (e) => e.code === 'E_NO_COMPOSER');
});
