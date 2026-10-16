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

// ---- turn-aware fakes (current ChatGPT DOM) ----

function fakeMarkdown(text) {
  return { async innerText() { return text; } };
}

function fakeAssistantNode(text) {
  return {
    _text: text,
    async innerText() { return this._text; },
    async $(sel) {
      if (sel === '.markdown') return fakeMarkdown(this._text);
      return null;
    },
  };
}

function fakeTurn(role, text) {
  return {
    _role: role,
    _text: text,
    describe: { role, text },
    async innerText() { return this._text; },
    async $(sel) {
      if (sel === '.markdown') return fakeMarkdown(this._text);
      if (sel === '[data-message-author-role="user"]') return this._role === 'user' ? fakeMarkdown(this._text) : null;
      if (sel === '[data-message-author-role="assistant"]') return this._role === 'assistant' ? fakeMarkdown(this._text) : null;
      return null;
    },
    async evaluate() {
      // Mimics the real-DOM evaluate branch in getTurnInfo.
      return { role: this._role, text: this._text };
    },
  };
}

// Minimal turn-aware page: tracks queried selectors for no-touch proofs,
// serves article turns + assistant descendants + stop-button + one composer.
function fakeTurnPage(opts = {}) {
  const state = {
    turns: (opts.turns || []).map((t) => ({ role: t.role, text: t.text })),
    streaming: !!opts.streaming,
    submitted: 0,
    bringToFrontCalls: 0,
    composerTouched: 0,
    queriedSelectors: [],
    composerCount: opts.composerCount ?? 1,
    _composer: null,
    _firstComposerSel: null,
  };
  const page = {
    _state: state,
    _url: opts.url || CHAT_URL,
    url() { return this._url; },
    async bringToFront() { state.bringToFrontCalls += 1; },
    async $$(sel) {
      state.queriedSelectors.push(sel);
      if (sel === 'article[data-testid^="conversation-turn-"]') {
        return state.turns.map((t) => fakeTurn(t.role, t.text));
      }
      if (sel === 'article[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]') {
        return state.turns.filter((t) => t.role === 'assistant').map((t) => fakeAssistantNode(t.text));
      }
      if (sel === 'article[data-testid^="conversation-turn-"] [data-message-author-role="user"]') {
        return state.turns.filter((t) => t.role === 'user').map((t) => fakeAssistantNode(t.text));
      }
      if (sel === '[data-testid="stop-button"]') {
        return state.streaming ? [fakeHandle({ text: 'stop' })] : [];
      }
      if (state.composerCount > 0 && /prompt-textarea|contenteditable|textarea/.test(sel)) {
        if (!state._composer) {
          state._composer = [];
          for (let i = 0; i < state.composerCount; i++) {
            state._composer.push(fakeHandle({
              onPress: async () => {
                state.submitted += 1;
                if (opts.onSubmit) await opts.onSubmit(state, page);
              },
            }));
          }
          state._firstComposerSel = sel;
        }
        return sel === state._firstComposerSel ? state._composer : [];
      }
      return [];
    },
  };
  return page;
}

test('fixture uses current ChatGPT turn DOM (article turns + markdown)', () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8');
  assert.ok(html.includes('article'), 'fixture has article turns');
  assert.ok(html.includes('data-testid="conversation-turn-'), 'fixture turns carry conversation-turn testids');
  assert.ok(html.includes('data-message-author-role="assistant"'), 'assistant turn present');
  assert.ok(html.includes('data-message-author-role="user"'), 'user turn present');
  assert.ok(html.includes('class="markdown"'), 'text lives in .markdown');
  assert.ok(html.includes(CORR), 'user turn carries the correlation ID');
  assert.ok(html.includes(ACK), 'assistant turn carries the expected marker');
});

test('turn-aware reply: baseline count then new assistant turn after submit', async () => {
  const page = fakeTurnPage({
    url: CHAT_URL,
    turns: [
      { role: 'user', text: `hello ${CORR}` },
      { role: 'assistant', text: 'older reply' },
    ],
    onSubmit: async (state) => {
      state.turns.push({ role: 'user', text: `follow-up ${CORR}` });
      state.turns.push({ role: 'assistant', text: ACK });
    },
  });
  const before = await lib.countAssistantMessages(page);
  assert.equal(before, 1, 'baseline assistant-turn count before submit');
  const receipt = await lib.runOnce(fakeBrowser([page]), {
    message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 5000,
  });
  assert.equal(page._state.submitted, 1, 'exactly one submit');
  assert.equal(await lib.countAssistantMessages(page), 2, 'new assistant turn detected after send');
  assert.equal(receipt.actualResponse, ACK);
  assert.equal(receipt.mode, 'live');
});

test('streaming reply: stop-button disappears then stable text is captured', async () => {
  const page = fakeTurnPage({
    url: CHAT_URL,
    turns: [{ role: 'assistant', text: 'older reply' }],
    onSubmit: async (state) => {
      // Streaming starts: partial text + stop button visible.
      state.streaming = true;
      state.turns.push({ role: 'assistant', text: 'ACK-M05' });
      setTimeout(() => {
        // Streaming finishes: full text, stop button gone.
        const last = state.turns[state.turns.length - 1];
        last.text = ACK;
        state.streaming = false;
      }, 300);
    },
  });
  assert.equal(await lib.isStreaming(page), false, 'not streaming before submit');
  const receipt = await lib.runOnce(fakeBrowser([page]), {
    message: lib.OUTBOUND_MESSAGE, correlation: CORR, expectedReply: ACK, timeoutMs: 8000,
  });
  assert.equal(page._state.submitted, 1);
  assert.equal(await lib.isStreaming(page), false, 'streaming finished (stop-button gone)');
  assert.equal(receipt.actualResponse, ACK, 'stable full text captured, not the partial chunk');
});

test('read-last parses --read-last --correlation and gates on exact match', () => {
  const args = lib.parseArgs(['--read-last', '--correlation', CORR]);
  assert.equal(args.readLast, true);
  assert.equal(args.mode, 'read-last');
  assert.deepEqual(lib.assertReadLastConfirmed(args, CORR), { readLast: true, correlation: CORR });
  assert.throws(
    () => lib.assertReadLastConfirmed(lib.parseArgs(['--read-last']), CORR),
    (e) => e.code === 'E_CONFIRMATION',
  );
  assert.throws(
    () => lib.assertReadLastConfirmed(lib.parseArgs(['--read-last', '--correlation', 'WRONG']), CORR),
    (e) => e.code === 'E_CONFIRMATION',
  );
  // Existing live gate unchanged.
  assert.throws(() => lib.assertLiveConfirmed(lib.parseArgs(['--live']), CORR),
    (e) => e.code === 'E_CONFIRMATION');
});

test('read-last happy path: last correlated user turn + next assistant, sanitized receipt', async () => {
  const page = fakeTurnPage({
    url: 'https://chatgpt.com/c/abc123?utm_source=x#frag',
    turns: [
      { role: 'user', text: `first ${CORR}` },
      { role: 'assistant', text: 'first reply' },
      { role: 'user', text: `second ${CORR} with more context` },
      { role: 'assistant', text: `here you go\n${ACK}\nbye` },
    ],
  });
  const receipt = await lib.runReadLast(fakeBrowser([page]), { correlation: CORR });
  assert.equal(receipt.mode, 'read-last');
  assert.equal(receipt.correlation, CORR);
  assert.equal(receipt.matched, true);
  assert.ok(receipt.actualResponse.includes(ACK), 'assistant turn immediately after LAST match captured');
  assert.equal(receipt.tabUrlSafe, 'https://chatgpt.com/c/abc123', 'query/hash stripped');
  assert.ok(receipt.startedAt && receipt.endedAt);
  assert.ok(!JSON.stringify(receipt).includes('utm_source'));
  assert.ok(!/cookie|token/i.test(JSON.stringify(receipt)));
});

test('read-last NEVER touches composer, send button, fill/press/click/focus', async () => {
  const touched = { fill: 0, press: 0, click: 0, focus: 0, type: 0 };
  const composer = {
    async isVisible() { return true; },
    async fill() { touched.fill += 1; throw new Error('must not fill'); },
    async press() { touched.press += 1; throw new Error('must not press'); },
    async click() { touched.click += 1; throw new Error('must not click'); },
    async focus() { touched.focus += 1; throw new Error('must not focus'); },
    async type() { touched.type += 1; throw new Error('must not type'); },
  };
  const page = fakeTurnPage({
    turns: [
      { role: 'user', text: `ping ${CORR}` },
      { role: 'assistant', text: ACK },
    ],
  });
  const orig$$ = page.$$.bind(page);
  page.$$ = async (sel) => {
    if (/prompt-textarea|contenteditable|composer-submit|send-button/.test(sel)) {
      throw new Error(`read-last must never query composer/send selector: ${sel}`);
    }
    if (sel === '#prompt-textarea' || sel === 'form textarea') {
      return [composer];
    }
    return orig$$(sel);
  };
  // No bringToFront on the read path either (avoids focus steal).
  let broughtToFront = 0;
  page.bringToFront = async () => { broughtToFront += 1; };
  const receipt = await lib.runReadLast(fakeBrowser([page]), { correlation: CORR });
  assert.equal(receipt.actualResponse, ACK);
  assert.deepEqual(touched, { fill: 0, press: 0, click: 0, focus: 0, type: 0 }, 'no type/focus/click/submit');
  assert.equal(broughtToFront, 0, 'read-last never brings the tab to front (no focus)');
  for (const sel of page._state.queriedSelectors) {
    assert.ok(!/prompt-textarea|contenteditable|composer-submit/.test(sel), `composer selector never queried: ${sel}`);
    assert.ok(!/send-button/.test(sel), `send-button selector never queried: ${sel}`);
  }
});

test('read-last refuses when no user turn carries the correlation', async () => {
  const page = fakeTurnPage({
    turns: [
      { role: 'user', text: 'unrelated question' },
      { role: 'assistant', text: ACK },
    ],
  });
  await assert.rejects(
    lib.runReadLast(fakeBrowser([page]), { correlation: CORR }),
    (e) => e.code === 'E_NO_CORRELATED_MESSAGE',
  );
});

test('read-last fails clearly when no assistant turn follows the correlated user', async () => {
  const page = fakeTurnPage({
    turns: [{ role: 'user', text: `waiting ${CORR}` }],
  });
  await assert.rejects(
    lib.runReadLast(fakeBrowser([page]), { correlation: CORR }),
    (e) => e.code === 'E_NO_RESPONSE',
  );
});

// ---- inspect-dom fakes (read-only structure probe) ----

const SECRET_A = 'SECRET-BODY-AAA-UNIQUE-7f3a';
const SECRET_B = 'SECRET-BODY-BBB-UNIQUE-9c1e';

function fakeDomEl({ tag = 'DIV', attrs = {}, text = '', parent = null }) {
  const el = {
    tagName: tag,
    innerText: text,
    textContent: text,
    parentElement: parent,
    parentNode: parent,
    children: [],
    childNodes: [],
    getAttribute(name) {
      const v = attrs[name];
      return v !== undefined && v !== null ? String(v) : null;
    },
    hasAttribute(name) {
      return attrs[name] !== undefined && attrs[name] !== null;
    },
    // Minimal read-only selector matching for the 6 inspect selectors.
    matches(sel) {
      const s = String(sel || '');
      const cls = String(attrs.class || attrs.className || '').split(/\s+/).filter(Boolean);
      const tid = attrs['data-testid'] !== undefined && attrs['data-testid'] !== null
        ? String(attrs['data-testid'])
        : null;
      if (s === 'article') return String(tag).toUpperCase() === 'ARTICLE';
      if (s === '[data-testid*="conversation-turn"]') return !!tid && tid.includes('conversation-turn');
      if (s === '[data-message-author-role]') return attrs['data-message-author-role'] !== undefined;
      if (s === '[data-turn]') return attrs['data-turn'] !== undefined;
      if (s === 'div.whitespace-pre-wrap') {
        return String(tag).toUpperCase() === 'DIV' && cls.includes('whitespace-pre-wrap');
      }
      if (s === '.markdown') return cls.includes('markdown');
      return false;
    },
  };
  el.childNodes = el.children;
  return el;
}

function stubDocWithSecrets() {
  const html = fakeDomEl({ tag: 'HTML', text: '' });
  const body = fakeDomEl({ tag: 'BODY', text: '', parent: html });
  const main = fakeDomEl({ tag: 'MAIN', text: '', parent: body });
  const el1Text = `user says ${CORR} plus ${SECRET_A}`;
  const el2Text = `reply marker ACK-M05 plus ${SECRET_B}`;
  const el3Text = 'plain hello';
  // el1 carries many class tokens (14) to prove truncation: elements cap 12,
  // tree cap 8, marker ancestors cap 4. role/dir/aria-label exercise tree fields.
  const el1 = fakeDomEl({
    tag: 'ARTICLE',
    attrs: {
      'data-testid': 'conversation-turn-3',
      role: 'article',
      dir: 'ltr',
      'aria-label': 'SECRET-ARIA-LABEL-zz9',
      class: 'turn c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14',
    },
    text: el1Text,
    parent: main,
  });
  const el2 = fakeDomEl({
    tag: 'DIV', attrs: { class: 'markdown extra-a extra-b', role: 'group' }, text: el2Text, parent: el1,
  });
  const el3 = fakeDomEl({
    tag: 'DIV',
    attrs: { 'data-message-author-role': 'assistant', 'data-turn': '3', 'data-message-id': 'msg-123' },
    text: el3Text,
    parent: main,
  });
  // Tree traversal links (read-only children).
  html.children = [body]; html.childNodes = html.children;
  body.children = [main]; body.childNodes = body.children;
  main.children = [el1, el3]; main.childNodes = main.children;
  el1.children = [el2]; el1.childNodes = el1.children;
  el2.children = []; el2.childNodes = [];
  el3.children = []; el3.childNodes = [];
  const all = [el1, el2, el3];
  const allWithRoot = [html, body, main, el1, el2, el3];
  // Text nodes for the TreeWalker path (parents link back to elements).
  const textNodes = [
    { nodeValue: el1Text, textContent: el1Text, parentElement: el1, parentNode: el1 },
    { nodeValue: el2Text, textContent: el2Text, parentElement: el2, parentNode: el2 },
    { nodeValue: el3Text, textContent: el3Text, parentElement: el3, parentNode: el3 },
  ];
  const doc = {
    body,
    documentElement: html,
    createTreeWalker() {
      let i = 0;
      return { nextNode() { return i < textNodes.length ? textNodes[i++] : null; } };
    },
    // Ignores the actual selector string except '*': returns the fixed
    // candidate set, mirroring "matches ANY of the selectors".
    querySelectorAll(sel) {
      if (String(sel) === '*') return allWithRoot;
      return all;
    },
  };
  return { doc, all, texts: [el1Text, el2Text, el3Text] };
}

// Minimal read-only page: url()/title()/evaluate() only. Every interaction
// or navigation entry point is a counted spy that throws if ever called.
function fakeInspectPage({ url = CHAT_URL, title = 'ChatGPT', doc = null } = {}) {
  const calls = {
    evaluate: 0, $$: 0, $: 0,
    bringToFront: 0, fill: 0, press: 0, click: 0, focus: 0, type: 0,
    goto: 0, reload: 0, goBack: 0, goForward: 0, keyboard: 0, mouse: 0,
  };
  const boom = (name) => { calls[name] += 1; throw new Error(`inspect-dom must never call ${name}`); };
  const page = {
    _calls: calls,
    _url: url,
    _title: title,
    url() { return this._url; },
    async title() { return this._title; },
    async evaluate(fn, payload) {
      calls.evaluate += 1;
      // Execute the REAL in-page function against the stub document so the
      // test proves the shipped fn itself never returns element text.
      const prev = globalThis.document;
      globalThis.document = doc || stubDocWithSecrets().doc;
      try {
        return await fn(payload);
      } finally {
        if (prev === undefined) delete globalThis.document;
        else globalThis.document = prev;
      }
    },
    async $$(...a) { calls.$$ += 1; throw new Error(`inspect-dom must never call $$ (${a[0]})`); },
    async $(...a) { calls.$ += 1; throw new Error(`inspect-dom must never call $ (${a[0]})`); },
    async bringToFront() { boom('bringToFront'); },
    async fill() { boom('fill'); },
    async press() { boom('press'); },
    async click() { boom('click'); },
    async focus() { boom('focus'); },
    async type() { boom('type'); },
    async goto() { boom('goto'); },
    async reload() { boom('reload'); },
    async goBack() { boom('goBack'); },
    async goForward() { boom('goForward'); },
    get keyboard() { calls.keyboard += 1; throw new Error('inspect-dom must never touch keyboard'); },
    get mouse() { calls.mouse += 1; throw new Error('inspect-dom must never touch mouse'); },
  };
  return page;
}

test('inspect-dom parses --inspect-dom --correlation and gates on exact match', () => {
  const args = lib.parseArgs(['--inspect-dom', '--correlation', CORR]);
  assert.equal(args.inspectDom, true);
  assert.equal(args.mode, 'inspect-dom');
  assert.deepEqual(lib.assertInspectDomConfirmed(args, CORR), { inspectDom: true, correlation: CORR });
  assert.throws(
    () => lib.assertInspectDomConfirmed(lib.parseArgs(['--inspect-dom']), CORR),
    (e) => e.code === 'E_CONFIRMATION',
  );
  assert.throws(
    () => lib.assertInspectDomConfirmed(lib.parseArgs(['--inspect-dom', '--correlation', 'WRONG']), CORR),
    (e) => e.code === 'E_CONFIRMATION',
  );
  // Existing gates unchanged.
  assert.throws(() => lib.assertLiveConfirmed(lib.parseArgs(['--live']), CORR),
    (e) => e.code === 'E_CONFIRMATION');
  assert.deepEqual(
    lib.assertReadLastConfirmed(lib.parseArgs(['--read-last', '--correlation', CORR]), CORR),
    { readLast: true, correlation: CORR },
  );
});

test('inspect-dom evaluate fn never returns element text (document stub, direct call)', () => {
  const { doc, texts } = stubDocWithSecrets();
  const prev = globalThis.document;
  globalThis.document = doc;
  let out;
  try {
    out = lib.inspectDomEvaluate({
      correlation: CORR,
      ackMarker: 'ACK-M05',
      selectors: lib.INSPECT_DOM_SELECTORS,
      maxAncestors: 6,
    });
  } finally {
    if (prev === undefined) delete globalThis.document;
    else globalThis.document = prev;
  }
  assert.ok(out && typeof out === 'object' && !Array.isArray(out), 'evaluate returns { elements, tree, markers }');
  assert.equal(out.elements.length, 3);
  const dumped = JSON.stringify(out);
  assert.ok(!dumped.includes(SECRET_A), 'element text must never leak');
  assert.ok(!dumped.includes(SECRET_B), 'element text must never leak');
  assert.ok(!dumped.includes('plain hello'), 'not even short element text leaks');
  assert.ok(!dumped.includes('SECRET-ARIA-LABEL-zz9'), 'aria-label VALUE must never leak (presence boolean only)');
  for (const el of out.elements) {
    assert.ok(typeof el.index === 'number');
    assert.ok(typeof el.tag === 'string' && el.tag);
    assert.ok('data-testid' in el);
    assert.ok('data-message-author-role' in el);
    assert.ok('data-turn' in el);
    assert.equal(typeof el.hasDataMessageId, 'boolean');
    assert.equal(typeof el.containsCorrelation, 'boolean');
    assert.equal(typeof el.containsAck, 'boolean');
    assert.equal(typeof el.textLength, 'number');
    assert.equal(typeof el.depth, 'number');
    assert.ok(Array.isArray(el.ancestors));
    for (const a of el.ancestors) {
      assert.match(a, /^(ARTICLE|DIV|MAIN|BODY|HTML|FORM|SECTION)(\[data-testid=[^\]]+\])?$/);
    }
    assert.ok(!('text' in el), 'raw text key must never be present');
    // New: which selector(s) matched + class tokens only (truncate 12).
    assert.ok(Array.isArray(el.matchedSelectors), 'matchedSelectors array');
    assert.ok(Array.isArray(el.classTokens), 'classTokens array');
    assert.ok(el.classTokens.length <= 12, 'element class tokens truncate to 12');
    for (const t of el.classTokens) {
      assert.equal(typeof t, 'string');
      assert.ok(t && !/\s/.test(t), 'class tokens only, no whitespace/raw class string');
    }
  }
  assert.equal(out.elements[0].containsCorrelation, true);
  assert.equal(out.elements[0].containsAck, false);
  assert.equal(out.elements[0].textLength, texts[0].length);
  assert.equal(out.elements[0].tag, 'ARTICLE');
  assert.ok(out.elements[0].matchedSelectors.includes('article'), 'article selector reported');
  assert.ok(
    out.elements[0].matchedSelectors.includes('[data-testid*="conversation-turn"]'),
    'conversation-turn selector reported',
  );
  assert.equal(out.elements[0].classTokens.length, 12, '14 tokens truncate to 12');
  assert.equal(out.elements[1].containsAck, true, "text contains 'ACK-M05'");
  assert.equal(out.elements[1].containsCorrelation, false);
  assert.ok(out.elements[1].matchedSelectors.includes('.markdown'), '.markdown selector reported');
  assert.equal(out.elements[2].hasDataMessageId, true, 'data-message-id presence is boolean true');
  assert.equal(out.elements[2]['data-message-author-role'], 'assistant');
  assert.equal(out.elements[2]['data-turn'], '3');
  assert.equal(out.elements[0].hasDataMessageId, false);
  // New: tree (DCA of correlation text nodes, depth-limited, max 200).
  assert.ok(Array.isArray(out.tree), 'tree array present');
  assert.ok(out.tree.length >= 1 && out.tree.length <= 200, 'tree depth-limited and capped');
  for (const n of out.tree) {
    assert.ok(typeof n.tag === 'string' && n.tag);
    assert.ok('data-testid' in n);
    assert.ok('role' in n, 'role attr reported');
    assert.equal(typeof n.hasAriaLabel, 'boolean', 'aria-label presence only');
    assert.ok(!('aria-label' in n), 'aria-label value must never be present');
    assert.ok(Array.isArray(n.classTokens) && n.classTokens.length <= 8, 'tree class tokens max 8');
    assert.ok('dir' in n, 'dir attr reported');
    assert.equal(typeof n.containsCorrelation, 'boolean');
    assert.equal(typeof n.containsAck, 'boolean');
    assert.equal(typeof n.textLength, 'number');
    assert.ok(typeof n.relativeDepth === 'number' && n.relativeDepth < 6, 'tree depth-limited to 6 levels');
    assert.ok(!('text' in n), 'tree nodes never carry text');
  }
  // DCA of the single correlation text node is the ARTICLE turn itself.
  assert.equal(out.tree[0].tag, 'ARTICLE');
  // New: markers — every text node containing correlation or ACK-M05.
  assert.ok(Array.isArray(out.markers), 'markers array present');
  assert.ok(Array.isArray(out.markerNodes) && Array.isArray(out.textNodes), 'marker aliases present');
  assert.equal(out.markers.length, 2, 'only CORR + ACK text nodes reported (plain node excluded)');
  const corrMarker = out.markers.find((m) => m.containsCorrelation);
  const ackMarker = out.markers.find((m) => m.containsAck && !m.containsCorrelation);
  assert.ok(corrMarker && ackMarker, 'one CORR marker and one ACK marker');
  for (const m of out.markers) {
    assert.equal(typeof m.containsCorrelation, 'boolean');
    assert.equal(typeof m.containsAck, 'boolean');
    assert.equal(typeof m.textLength, 'number');
    assert.ok(Array.isArray(m.ancestors) && m.ancestors.length >= 1 && m.ancestors.length <= 12);
    for (const a of m.ancestors) {
      assert.equal(typeof a, 'string');
      assert.match(a, /^(ARTICLE|DIV|MAIN|BODY|HTML|FORM|SECTION)/);
    }
    assert.ok(!('text' in m), 'markers never carry text');
  }
  assert.ok(corrMarker.ancestors.length <= 12, 'marker chains cap at 12 levels');
  // Marker ancestor class tokens cap at 4 (el1 has 14 classes).
  const corrTop = corrMarker.ancestors[0];
  const dotCount = (corrTop.match(/\./g) || []).length;
  assert.ok(dotCount <= 4, `marker ancestor class tokens max 4 (got ${corrTop})`);
});

test('inspect-dom handles live shape: DIVs with neither turn selector, both markers in one node', () => {
  // Mirrors the live --inspect-dom output: 2 DIVs matched (no article, no
  // data-message-author-role, no data-turn), each containing BOTH markers.
  const mkDiv = (text, parent) => {
    const el = fakeDomEl({ tag: 'DIV', attrs: { class: 'flex gap-2' }, text, parent });
    el.children = []; el.childNodes = [];
    return el;
  };
  const html = fakeDomEl({ tag: 'HTML', text: '' });
  const body = fakeDomEl({ tag: 'BODY', text: '', parent: html });
  html.children = [body]; html.childNodes = html.children;
  body.children = []; body.childNodes = [];
  const bothText = `got ${CORR} and ACK-M05-COC-001 here plus 171 chars of padding lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor`;
  const d1 = mkDiv(bothText, body);
  const d2 = mkDiv(bothText, body);
  body.children = [d1, d2]; body.childNodes = body.children;
  const doc = {
    body,
    documentElement: html,
    createTreeWalker() {
      const tns = [
        { nodeValue: bothText, textContent: bothText, parentElement: d1, parentNode: d1 },
        { nodeValue: bothText, textContent: bothText, parentElement: d2, parentNode: d2 },
      ];
      let i = 0;
      return { nextNode() { return i < tns.length ? tns[i++] : null; } };
    },
    querySelectorAll(sel) {
      if (String(sel) === '*') return [html, body, d1, d2];
      return [d1, d2];
    },
  };
  const prev = globalThis.document;
  globalThis.document = doc;
  let out;
  try {
    out = lib.inspectDomEvaluate({
      correlation: CORR,
      ackMarker: 'ACK-M05',
      selectors: lib.INSPECT_DOM_SELECTORS,
      maxAncestors: 6,
    });
  } finally {
    if (prev === undefined) delete globalThis.document;
    else globalThis.document = prev;
  }
  assert.equal(out.elements.length, 2);
  for (const el of out.elements) {
    assert.equal(el.tag, 'DIV');
    assert.equal(el.containsCorrelation, true);
    assert.equal(el.containsAck, true);
    assert.ok(Array.isArray(el.matchedSelectors));
    assert.ok(!el.matchedSelectors.includes('article'), 'live DIVs match no article selector');
    assert.ok(Array.isArray(el.classTokens) && el.classTokens.length <= 12);
  }
  const dumped = JSON.stringify(out);
  assert.ok(!dumped.includes(bothText), 'no text leaks even when both markers share one node');
  assert.equal(out.markers.length, 2, 'both text nodes reported');
  for (const m of out.markers) {
    assert.equal(m.containsCorrelation, true);
    assert.equal(m.containsAck, true);
  }
  // DCA of two sibling DIVs is BODY; tree stays within caps.
  assert.ok(Array.isArray(out.tree) && out.tree.length >= 1 && out.tree.length <= 200);
  assert.equal(out.tree[0].tag, 'BODY');
  for (const n of out.tree) assert.ok(n.relativeDepth < 6);
});

test('inspect-dom happy path via mock: scrubbed URL + title, text-free summaries', async () => {
  const { doc, texts } = stubDocWithSecrets();
  const page = fakeInspectPage({
    url: 'https://chatgpt.com/c/abc123?utm_source=x#frag',
    title: 'ChatGPT — probe',
    doc,
  });
  const summary = await lib.runInspectDom(fakeBrowser([page]), { correlation: CORR });
  assert.equal(summary.mode, 'inspect-dom');
  assert.equal(summary.correlation, CORR);
  assert.equal(summary.tabUrlSafe, 'https://chatgpt.com/c/abc123', 'query/hash stripped');
  assert.equal(summary.url, 'https://chatgpt.com/c/abc123');
  assert.equal(summary.title, 'ChatGPT — probe');
  assert.equal(summary.tabTitle, 'ChatGPT — probe');
  assert.equal(summary.elementCount, 3);
  assert.deepEqual(summary.selectors, lib.INSPECT_DOM_SELECTORS);
  const dumped = JSON.stringify(summary);
  assert.ok(!dumped.includes(SECRET_A) && !dumped.includes(SECRET_B), 'no element text in output');
  assert.ok(!dumped.includes('plain hello'), 'not even short element text leaks');
  assert.ok(!dumped.includes('SECRET-ARIA-LABEL-zz9'), 'aria-label value never leaks');
  assert.ok(!dumped.includes('utm_source') && !dumped.includes('#frag'));
  // NOTE: key names classTokens/classList legitimately contain "token";
  // strip them before the no-secrets scan so the check targets values.
  assert.ok(!/cookie|token/i.test(dumped.replace(/classTokens|classList/g, '')));
  const byIndex = summary.elements;
  assert.equal(byIndex[0].containsCorrelation, true);
  assert.equal(byIndex[1].containsAck, true);
  assert.equal(byIndex[0].textLength, texts[0].length);
  for (const el of byIndex) {
    assert.ok(Array.isArray(el.matchedSelectors), 'per-element matched selectors');
    assert.ok(Array.isArray(el.classTokens) && el.classTokens.length <= 12, 'per-element class tokens cap 12');
  }
  // Tree + markers ride along in the summary (text-free).
  assert.ok(Array.isArray(summary.tree) && summary.tree.length >= 1 && summary.tree.length <= 200);
  assert.equal(summary.treeNodeCount, summary.tree.length);
  for (const n of summary.tree) {
    assert.ok(n.relativeDepth < 6);
    assert.ok(Array.isArray(n.classTokens) && n.classTokens.length <= 8);
    assert.equal(typeof n.hasAriaLabel, 'boolean');
  }
  assert.ok(Array.isArray(summary.markers) && summary.markers.length === 2);
  assert.equal(summary.markerCount, 2);
  assert.deepEqual(summary.markerNodes, summary.markers);
  assert.deepEqual(summary.textNodes, summary.markers);
  for (const m of summary.markers) {
    assert.ok(Array.isArray(m.ancestors) && m.ancestors.length <= 12);
  }
  // collectInspectDom normalizes to the object shape.
  const collected = await lib.collectInspectDom(page, { correlation: CORR });
  assert.ok(Array.isArray(collected.elements) && collected.elements.length === 3);
  assert.ok(Array.isArray(collected.tree) && collected.tree.length >= 1);
  assert.ok(Array.isArray(collected.markers) && collected.markers.length === 2);
});

test('inspect-dom NEVER interacts: no focus/typing/clicking/keys/navigation, evaluate-only', async () => {
  const { doc } = stubDocWithSecrets();
  const page = fakeInspectPage({ doc });
  const summary = await lib.runInspectDom(fakeBrowser([page]), { correlation: CORR });
  assert.ok(summary.elementCount >= 0);
  const c = page._calls;
  assert.equal(c.evaluate, 1, 'exactly one read-only evaluate');
  assert.equal(c.bringToFront, 0, 'never brings tab to front (no focus)');
  assert.deepEqual(
    { fill: c.fill, press: c.press, click: c.click, focus: c.focus, type: c.type },
    { fill: 0, press: 0, click: 0, focus: 0, type: 0 },
    'no typing/clicking/key presses',
  );
  assert.deepEqual(
    { goto: c.goto, reload: c.reload, goBack: c.goBack, goForward: c.goForward },
    { goto: 0, reload: 0, goBack: 0, goForward: 0 },
    'no navigation',
  );
  assert.equal(c.$$, 0, 'never queries composer/send selectors via $$');
  assert.equal(c.$, 0, 'never queries via $');
  assert.equal(c.keyboard, 0, 'never touches keyboard');
  assert.equal(c.mouse, 0, 'never touches mouse');
});

test('inspect-dom uses the same tab selection as read-last (refuses none/ambiguous)', async () => {
  const { doc } = stubDocWithSecrets();
  await assert.rejects(
    lib.runInspectDom(fakeBrowser([]), { correlation: CORR }),
    (e) => e.code === 'E_NO_TAB',
  );
  await assert.rejects(
    lib.runInspectDom(
      fakeBrowser([
        fakeInspectPage({ url: 'https://example.com/', doc }),
        fakeInspectPage({ url: 'https://mail.google.com/', doc }),
      ]),
      { correlation: CORR },
    ),
    (e) => e.code === 'E_NO_TAB',
  );
  await assert.rejects(
    lib.runInspectDom(
      fakeBrowser([
        fakeInspectPage({ url: CHAT_URL, doc }),
        fakeInspectPage({ url: 'https://chatgpt.com/c/other', doc }),
      ]),
      { correlation: CORR },
    ),
    (e) => e.code === 'E_AMBIGUOUS_TAB',
  );
  await assert.rejects(
    lib.runInspectDom(fakeBrowser([fakeInspectPage({ url: CHAT_URL, doc })]), {}),
    (e) => e.code === 'E_CONFIRMATION',
  );
  await assert.rejects(
    lib.collectInspectDom({ url: () => CHAT_URL }, { correlation: CORR }),
    (e) => e.code === 'E_INSPECT',
  );
});
