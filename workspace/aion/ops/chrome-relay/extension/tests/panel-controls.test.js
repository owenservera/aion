// AION Chrome Relay Station — side panel operator controls.
//
// Regression cover for the panel's truthfulness and single-send guarantees.
// Node built-ins only: a DOM stub and a chrome.* stub, no browser, no Playwright,
// no Puppeteer, no live relay. The module is re-imported with a cache-busting
// query per test so module-level probe state cannot leak between cases.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveCommandDeadline } from '../src/lib/command-deadlines.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const panelPath = resolve(root, 'src', 'panel', 'panel.js');
const panelUrl = pathToFileURL(panelPath).href;
const panelHtml = readFileSync(resolve(root, 'src', 'panel', 'sidepanel.html'), 'utf8');
const panelCss = readFileSync(resolve(root, 'src', 'panel', 'panel.css'), 'utf8');
const panelSource = readFileSync(panelPath, 'utf8');

const OPERATOR_TYPES = [
  'aion/native-ping',
  'aion/native-hello',
  'aion/chatgpt-tabs',
  'aion/chatgpt-ping',
  'aion/chatgpt-run',
  'aion/chatgpt-submit',
  'aion/chatgpt-observe',
  'aion/chatgpt-read',
  'aion/chatgpt-reconcile'
];

// The approval reference is OPERATOR-SUPPLIED. The panel holds no grant of its
// own, so every test that sends one has to name the approval it acts under.
const SCOPE_REF = 'workspace/aion/ops/chrome-relay/AUTHORIZATION-2026-10-17.md';

const CONTROL_IDS = [
  'role-grid', 'refresh-btn', 'knowledge-bar', 'knowledge-text', 'mode-chip', 'fallback-reason',
  'relay-transport', 'relay-adapter', 'relay-detail', 'relay-boots', 'relay-started',
  'proof-status', 'proof-timestamp', 'proof-staleness', 'proof-verifier', 'proof-note',
  'queue-count', 'queue-oldest', 'queue-cursor', 'gate-panel', 'gate-count', 'gate-list',
  'gate-note', 'result-native', 'result-chatgpt', 'result-run', 'result-submit',
  'result-observe', 'result-read', 'result-reconcile', 'probe-hold', 'probe-blockers',
  'tab-select', 'probe-text', 'probe-correlation', 'probe-token', 'probe-scope-ref', 'probe-confirm',
  'btn-native-ping', 'btn-native-hello', 'btn-chatgpt-tabs', 'btn-chatgpt-ping',
  'btn-chatgpt-run', 'btn-chatgpt-submit', 'btn-chatgpt-observe', 'btn-chatgpt-read',
  'btn-chatgpt-reconcile', 'btn-probe-reconcile'
];

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

function makeElement(id) {
  const listeners = {};
  const el = {
    id,
    listeners,
    children: [],
    dataset: {},
    attributes: {},
    className: '',
    value: '',
    checked: false,
    disabled: false,
    rows: 2,
    append(...kids) { el.children.push(...kids); },
    setAttribute(key, value) { el.attributes[key] = String(value); },
    removeAttribute(key) { delete el.attributes[key]; },
    addEventListener(type, fn) { listeners[type] = fn; }
  };
  // Real DOM: assigning textContent drops child nodes.
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(value) { text = String(value); if (text === '') el.children.length = 0; }
  });
  return el;
}

let importCounter = 0;

// The real timer, captured before any test installs a fake clock.
const realSetTimeout = globalThis.setTimeout;

/**
 * A minimal deterministic clock.
 *
 * Injected over globalThis.setTimeout so the panel's own deadline code runs
 * unmodified. Node's built-in mock timers differ between releases, so the
 * suite does not depend on them.
 */
function installFakeClock() {
  const real = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  let now = 0;
  let seq = 0;
  const pending = new Map();

  globalThis.setTimeout = (fn, delay) => {
    seq += 1;
    pending.set(seq, { fn, at: now + (Number(delay) || 0) });
    return seq;
  };
  globalThis.clearTimeout = (id) => pending.delete(id);

  return {
    get pending() { return pending.size; },
    restore() { globalThis.setTimeout = real; globalThis.clearTimeout = realClear; },
    async advance(ms) {
      const target = now + ms;
      for (;;) {
        let chosenId = null;
        let chosenAt = Infinity;
        for (const [id, timer] of pending) {
          if (timer.at <= target && timer.at < chosenAt) {
            chosenAt = timer.at;
            chosenId = id;
          }
        }
        if (chosenId === null) break;
        const timer = pending.get(chosenId);
        pending.delete(chosenId);
        now = timer.at;
        timer.fn();
        // Drain the promise continuations the callback set up.
        for (let i = 0; i < 25; i += 1) await Promise.resolve();
      }
      now = target;
    }
  };
}

/**
 * Build a fresh DOM + chrome.* world and load the panel into it.
 *
 * @param {{ reply?: (msg: object) => object, withRuntime?: boolean }} options
 */
async function loadPanel(options = {}) {
  const { reply, withRuntime = true } = options;

  const ids = new Map();
  for (const id of CONTROL_IDS) ids.set(id, makeElement(id));
  const sent = [];

  const chromeStub = withRuntime
    ? {
        runtime: {
          id: 'stub-extension-id',
          lastError: undefined,
          sendMessage(message, callback) {
            sent.push(message);
            const value = reply ? reply(message) : { ok: true };
            if (value === undefined) return; // deliberately never answers
            // A reply may be a promise, standing in for a call still in flight.
            if (value && typeof value.then === 'function') {
              value.then(
                (resolved) => { setTimeout(() => callback(resolved), 0); },
                (error) => { setTimeout(() => callback({ ok: false, error: String(error) }), 0); }
              );
              return;
            }
            setTimeout(() => callback(value), 0);
          }
        }
      }
    : undefined;

  globalThis.document = {
    readyState: 'complete',
    visibilityState: 'visible',
    getElementById: (id) => ids.get(id) || null,
    createElement: (tag) => makeElement('<' + tag + '>'),
    addEventListener() {}
  };
  globalThis.chrome = chromeStub;

  importCounter += 1;
  const mod = await import(panelUrl + '?case=' + importCounter);

  const env = {
    mod,
    sent,
    get: (id) => ids.get(id),
    click(id) { ids.get(id).listeners.click(); },
    input(id) { ids.get(id).listeners.input({}); },
    change(id) { ids.get(id).listeners.change({}); },
    blockers: () => ids.get('probe-blockers').children.map((li) => li.textContent),
    settle: () => new Promise((resolve) => realSetTimeout(resolve, 5)),
    runs: () => sent.filter((m) => m.type === 'aion/chatgpt-run'),
    of: (type) => sent.filter((m) => m.type === type)
  };
  await env.settle();
  return env;
}

/** Fill the form and tick the confirmation so the run button arms. */
async function armProbe(env, tabId = '7') {
  env.get('tab-select').value = tabId;
  env.change('tab-select');
  env.get('probe-text').value = 'hello';
  env.get('probe-correlation').value = 'corr-1';
  env.get('probe-token').value = 'tok-1';
  env.get('probe-scope-ref').value = SCOPE_REF;
  env.input('probe-text');
  env.input('probe-correlation');
  env.input('probe-token');
  env.input('probe-scope-ref');
  env.get('probe-confirm').checked = true;
  env.change('probe-confirm');
}

async function selectOneTab(env, tab = { id: 7, url: 'https://chatgpt.com/c/abc' }) {
  env.click('btn-chatgpt-tabs');
  await env.settle();
  env.get('tab-select').value = String(tab.id);
  env.change('tab-select');
}

/**
 * Run the REAL worker-side driver ping for tab 7 and return the reply the
 * worker's actionReply hands the panel.
 *
 * The panel used to be tested against a flat `{ok, tab_id, status, detail}`
 * shape that no driver produces. This feeds the actual driver output, wrapped
 * in the actual worker envelope, so the contract mismatch cannot come back.
 */
async function realDriverPingReply(options = {}) {
  const { createChatGPTPortDriver } = await import('../src/background/chatgpt-port.js');
  const { answer, connectThrows = false } = options;
  const tab = {
    id: 7,
    windowId: 1,
    active: true,
    status: 'complete',
    url: 'https://chatgpt.com/c/abc123?share=secret#frag'
  };
  const chromeApi = {
    tabs: {
      async query() { return [tab]; },
      connect() {
        if (connectThrows) {
          throw new Error('Could not establish connection. Receiving end does not exist.');
        }
        const listeners = [];
        const port = {
          name: 'aion-chatgpt',
          posted: [],
          onMessage: { addListener(fn) { listeners.push(fn); } },
          onDisconnect: { addListener() {} },
          postMessage(message) {
            port.posted.push(message);
            const reply = answer ? answer(message) : undefined;
            if (reply === undefined || reply === null) return;
            queueMicrotask(() => { for (const fn of listeners) fn(reply); });
          },
          disconnect() {}
        };
        return port;
      }
    }
  };
  const driver = createChatGPTPortDriver({ chrome: chromeApi });
  const result = await driver.ping({ tab_id: 7 });
  // actionReply() in the worker: body fields spread at the top level, `ok`
  // normalised, `code`/`error` always present, and the body kept as `result`.
  return {
    ...result,
    ok: result.ok === true,
    code: result.ok === true ? (result.code ?? null) : (result.code ?? 'internal_error'),
    error: result.ok === true ? (result.error ?? null) : (result.error ?? 'the request failed'),
    result,
    type: 'aion/chatgpt-ping'
  };
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

test('boots without sending an operator action and with a disarmed probe form', async () => {
  const env = await loadPanel();

  const operator = env.sent.filter((m) => OPERATOR_TYPES.includes(m.type));
  assert.deepEqual(operator.map((m) => m.type), [], 'no operator action may fire on load');

  assert.equal(env.get('probe-text').value, '');
  assert.equal(env.get('probe-correlation').value, '');
  assert.equal(env.get('probe-token').value, '');
  assert.equal(env.get('probe-confirm').checked, false);
  assert.equal(env.get('btn-chatgpt-run').disabled, true);
  assert.equal(env.get('btn-chatgpt-ping').disabled, true);
  assert.equal(env.get('btn-probe-reconcile').disabled, true);
  assert.equal(env.get('tab-select').disabled, true);
  assert.ok(env.blockers().length > 0, 'the operator must be told what is missing');
});

test('typing alone never arms the probe', async () => {
  const env = await loadPanel();
  env.get('probe-text').value = 'hello';
  env.get('probe-correlation').value = 'corr-1';
  env.get('probe-token').value = 'tok-1';
  env.get('probe-confirm').checked = true;
  env.input('probe-text');
  env.input('probe-correlation');
  env.input('probe-token');
  env.change('probe-confirm');

  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'a tab must be selected first');
});

/* ------------------------------------------------------------------ *
 * Tab validation
 * ------------------------------------------------------------------ */

test('sanitizeTab rejects a missing, coerced or non-ChatGPT tab', async (t) => {
  const { sanitizeTab, sanitizeChatgptUrl } = (await loadPanel()).mod;

  for (const raw of [
    null,
    'nope',
    { url: 'https://chatgpt.com/c/a' },          // id missing entirely
    { id: null, url: 'https://chatgpt.com/c/a' },  // Number(null) === 0
    { id: '', url: 'https://chatgpt.com/c/a' },     // Number('') === 0
    { id: undefined, url: 'https://chatgpt.com/c/a' },
    { id: '7', url: 'https://chatgpt.com/c/a' },   // not a number
    { id: NaN, url: 'https://chatgpt.com/c/a' },
    { id: 1.5, url: 'https://chatgpt.com/c/a' },
    { id: -3, url: 'https://chatgpt.com/c/a' },
    { id: 7 },                                      // url missing
    { id: 7, url: '' },
    { id: 7, url: null },
    { id: 7, url: 42 },
    { id: 7, url: 'http://chatgpt.com/c/a' },       // not https
    { id: 7, url: 'https://www.chatgpt.com/c/a' },  // not the exact host
    { id: 7, url: 'https://chatgpt.com.evil.test/c/a' },
    { id: 7, url: 'https://evil.test/?x=https://chatgpt.com' },
    { id: 7, url: 'https://chatgpt.com:8443/c/a' },  // port
    { id: 7, url: 'https://user:pw@chatgpt.com/c/a' },
    { id: 7, url: 'https://chatgpt.com/c/a?token=abc' }, // query
    { id: 7, url: 'https://chatgpt.com/c/a#frag' },      // fragment
    { id: 7, url: 'not a url at all' }
  ]) {
    assert.equal(sanitizeTab(raw), null, 'must reject ' + JSON.stringify(raw));
  }

  const good = sanitizeTab({ id: 7, url: 'https://chatgpt.com/c/abc' });
  assert.deepEqual(good, { id: 7, url: 'https://chatgpt.com/c/abc' });

  // The ChatGPT home page is a real, legitimate tab and is kept.
  assert.deepEqual(sanitizeTab({ id: 4, url: 'https://chatgpt.com' }), {
    id: 4,
    url: 'https://chatgpt.com/'
  });

  // 0 is a legitimate tab id when it is genuinely a number.
  assert.deepEqual(sanitizeTab({ id: 0, url: 'https://chatgpt.com/c/abc' }), {
    id: 0,
    url: 'https://chatgpt.com/c/abc'
  });

  assert.equal(sanitizeChatgptUrl('https://chatgpt.com/c/a b'), 'https://chatgpt.com/c/ab');
  void t;
});

test('the real driver tab shape is accepted by the real panel sanitizer', async () => {
  // The regression: the worker emits `tab_id` (mirroring chrome.tabs.query) and
  // the panel read only `id`, so every real entry was rejected — 0 listed, 1
  // rejected. This feeds the ACTUAL driver output into the ACTUAL panel
  // sanitizer; no invented intermediate shape.
  const { sanitizeTab: panelSanitizeTab } = (await loadPanel()).mod;
  const { sanitizeTab: driverSanitizeTab } = await import('../src/background/chatgpt-port.js');

  const fromDriver = driverSanitizeTab({
    id: 7,
    windowId: 1,
    active: true,
    status: 'complete',
    url: 'https://chatgpt.com/c/abc123?share=secret#frag'
  });
  assert.deepEqual(fromDriver, {
    tab_id: 7,
    url: 'https://chatgpt.com/c/abc123',
    window_id: 1,
    active: true,
    status: 'complete'
  });

  // The panel must now accept it, and keep the rest of the record out.
  assert.deepEqual(panelSanitizeTab(fromDriver), { id: 7, url: 'https://chatgpt.com/c/abc123' });
});

test('a real driver ping renders as tab reachability, never as UNKNOWN placeholders', async () => {
  const reply = await realDriverPingReply({
    answer: (message) => ({
      action: message.action,
      ok: true,
      href: 'https://chatgpt.com/c/abc123?share=secret#frag',
      title: 'private conversation title',
      state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 },
      note: 'read-only probe; nothing composed or sent'
    })
  });

  // Premise guard: this is the real driver contract, not an invented shape.
  assert.equal(reply.result.tab.tab_id, 7);
  assert.equal(reply.result.action, 'ping');
  assert.equal(reply.result.state.composer_visible_count, 1);

  const env = await loadPanel({ reply: () => reply });
  env.get('tab-select').value = '7';
  env.get('tab-select').disabled = false;
  env.change('tab-select');
  env.click('btn-chatgpt-ping');
  await env.settle();

  const shown = env.get('result-chatgpt').textContent;
  assert.match(shown, /Tab: 7/);
  assert.match(shown, /Status: ANSWERED — tab reachability only; not ACP or M1 proof/);
  assert.match(shown, /State: .*composer_visible_count=1/);
  assert.match(shown, /State: .*generating=false/);
  assert.match(shown, /Note: read-only probe; nothing composed or sent/);
  assert.doesNotMatch(shown, /UNKNOWN/, 'a successful real ping must not render UNKNOWN placeholders');
  assert.doesNotMatch(shown, /private conversation title/, 'the driver drops the title and so must the panel');
  assert.doesNotMatch(shown, /share=secret/, 'only the sanitized tab url may be shown');
});

test('a real driver ping failure keeps its code and claims no reachability', async () => {
  const reply = await realDriverPingReply({ connectThrows: true });
  assert.equal(reply.ok, false);

  const env = await loadPanel({ reply: () => reply });
  env.get('tab-select').value = '7';
  env.get('tab-select').disabled = false;
  env.change('tab-select');
  env.click('btn-chatgpt-ping');
  await env.settle();

  const shown = env.get('result-chatgpt').textContent;
  assert.match(shown, /FAILED — no_content_script/);
  assert.match(shown, /Code: no_content_script/);
  assert.doesNotMatch(shown, /ANSWERED/, 'a failed ping is not reachability');
});

test('a conflicting or malformed tab id is refused, and nothing is coerced', async () => {
  const { sanitizeTab: panelSanitizeTab } = (await loadPanel()).mod;

  // Both spellings present and agreeing is fine; disagreeing is refused rather
  // than resolved, because picking one guesses which tab is about to be typed in.
  assert.deepEqual(
    panelSanitizeTab({ tab_id: 7, id: 7, url: 'https://chatgpt.com/c/a' }),
    { id: 7, url: 'https://chatgpt.com/c/a' },
    'agreeing dual ids must be accepted'
  );
  assert.equal(panelSanitizeTab({ tab_id: 7, id: 8, url: 'https://chatgpt.com/c/a' }), null);
  assert.equal(panelSanitizeTab({ tab_id: 7, id: '7', url: 'https://chatgpt.com/c/a' }), null,
    'a string id beside a numeric one is a disagreement, not a match');

  // Provided-but-malformed never falls through to the other spelling.
  for (const raw of [
    { tab_id: '7', url: 'https://chatgpt.com/c/a' },
    { tab_id: null, url: 'https://chatgpt.com/c/a' },
    { tab_id: '', url: 'https://chatgpt.com/c/a' },
    { tab_id: NaN, url: 'https://chatgpt.com/c/a' },
    { tab_id: 1.5, url: 'https://chatgpt.com/c/a' },
    { tab_id: -1, url: 'https://chatgpt.com/c/a' },
    { tab_id: 7, id: null, url: 'https://chatgpt.com/c/a' },
    { url: 'https://chatgpt.com/c/a' }
  ]) {
    assert.equal(panelSanitizeTab(raw), null, 'must refuse ' + JSON.stringify(raw));
  }

  // A numeric id beside a malformed one is still refused: no coercion, and no
  // silent preference for whichever field happens to be well-formed.
  assert.equal(panelSanitizeTab({ tab_id: null, id: 7, url: 'https://chatgpt.com/c/a' }), null);

  // The url rules are unchanged by the id change.
  assert.equal(panelSanitizeTab({ tab_id: 7, url: 'https://example.com/' }), null);
  assert.equal(panelSanitizeTab({ tab_id: 7, url: 'https://chatgpt.com/c/a?token=abc' }), null);
});

test('a tab list with unsafe entries offers only the safe one, and counts the rejects', async () => {
  const env = await loadPanel({
    reply: () => ({
      ok: true,
      tabs: [
        { id: 7, url: 'https://chatgpt.com/c/abc' },
        { id: null, url: 'https://chatgpt.com/c/bad-id' },
        { id: '', url: 'https://chatgpt.com/c/bad-id2' },
        { id: 8, url: 'https://evil.test/c/x' },
        { id: 9 },
        null,
        'string'
      ]
    })
  });

  env.click('btn-chatgpt-tabs');
  await env.settle();

  const options = env.get('tab-select').children;
  assert.equal(options.length, 2, 'placeholder plus one safe tab');
  assert.equal(options[1].value, '7');
  assert.equal(options[1].textContent, 'tab 7 — https://chatgpt.com/c/abc');
  assert.equal(env.get('tab-select').disabled, false);
  assert.match(env.get('result-chatgpt').textContent, /6 entr\(y\/ies\) rejected/);
});

test('no selectable tab is offered when every entry is unsafe', async () => {
  const env = await loadPanel({
    reply: () => ({ ok: true, tabs: [{ id: null, url: 'https://chatgpt.com/c/a' }, { id: 2 }] })
  });

  env.click('btn-chatgpt-tabs');
  await env.settle();

  assert.equal(env.get('tab-select').children.length, 1, 'only the placeholder');
  assert.equal(env.get('tab-select').disabled, true, 'selector must stay unusable');
  assert.equal(env.get('btn-chatgpt-ping').disabled, true);
});

/* ------------------------------------------------------------------ *
 * Reply shapes
 * ------------------------------------------------------------------ */

test('reads flattened and nested reply shapes without inventing values', async () => {
  const shapes = [
    { reply: { ok: true, host: 'flat-host' } },
    { reply: { result: { ok: true, host: 'flat-host' } } },
    { reply: { reply: { ok: true, host: 'flat-host' } } },
    { reply: { verdict: { ok: true, host: 'flat-host' } } }
  ];

  for (const { reply } of shapes) {
    const env = await loadPanel({ reply: () => reply });
    env.click('btn-native-ping');
    await env.settle();
    assert.match(env.get('result-native').textContent, /flat-host/);
    assert.match(env.get('result-native').textContent, /Status: UNKNOWN/,
      'an unobserved field stays UNKNOWN across every shape');
  }
});

test('a nested tab list is accepted', async () => {
  const env = await loadPanel({
    reply: () => ({ result: { ok: true, tabs: [{ id: 3, url: 'https://chatgpt.com/g/x' }] } })
  });
  env.click('btn-chatgpt-tabs');
  await env.settle();
  assert.equal(env.get('tab-select').children.length, 2);
});

/* ------------------------------------------------------------------ *
 * The live probe
 * ------------------------------------------------------------------ */

test('sends exactly one message with exactly the agreed command shape', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, captured: 'partial text' }) });
  await selectOneTab(env);
  await armProbe(env);
  assert.equal(env.get('btn-chatgpt-run').disabled, false);

  env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.runs().length, 1);
  const message = env.runs()[0];
  assert.deepEqual(message, {
    type: 'aion/chatgpt-run',
    tabId: 7,
    command: {
      text: 'hello',
      correlation_id: 'corr-1',
      expected_reply_token: 'tok-1',
      approved_scope_ref: SCOPE_REF,
      timeout_ms: 300000,
      user_gesture: true
    }
  });
});

test('every commanded run names the approval the operator supplied', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true }) });
  await selectOneTab(env);
  await armProbe(env);

  env.click('btn-chatgpt-run');
  await env.settle();
  env.click('btn-probe-reconcile');
  await env.settle();
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.runs().length, 2);
  for (const run of env.runs()) {
    // The worker refuses a run with no approval reference: a gesture is not
    // authorisation, and the panel must not be able to invent or widen one.
    // The reference is the operator's own, typed into the panel — never one
    // the panel carries for them.
    assert.equal(
      run.command.approved_scope_ref,
      SCOPE_REF,
      'the run must carry the approval reference the operator supplied'
    );
  }
});

test('a capture is never presented as verified', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, captured: 'partial text' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.match(env.get('result-run').textContent, /CAPTURED — not independently verified/);
  assert.equal(env.get('result-run').dataset.state, 'captured');
  assert.match(env.get('probe-hold').textContent, /not independently verified/);
});

test('the message and the confirmation are cleared the moment the request is dispatched', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const env = await loadPanel({
    reply: async () => {
      await gate;
      return { ok: true };
    }
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');

  // Dispatch has happened but the worker has not answered yet.
  assert.equal(env.runs().length, 1);
  assert.equal(env.get('probe-text').value, '');
  assert.equal(env.get('probe-confirm').checked, false);
  // The correlation id and the reply token are NOT blanked: they are the
  // address of the operation, and a read-only poll needs them long after
  // this panel has given up waiting.
  assert.equal(env.get('probe-correlation').value, 'corr-1');
  assert.equal(env.get('probe-token').value, 'tok-1');
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'locked while in flight');
  assert.equal(env.get('btn-probe-reconcile').disabled, true,
    'an in-flight probe cannot be reconciled away yet');
  assert.match(env.get('probe-hold').textContent, /Outcome unknown/);

  release();
  await env.settle();
});

test('reconcile is refused while a probe is still in flight', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const env = await loadPanel({
    reply: async () => {
      await gate;
      return { ok: true };
    }
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');

  assert.equal(env.get('btn-probe-reconcile').disabled, true);

  // Even if the click lands, nothing may be re-armed while the run may still be
  // executing: the request is out and its outcome is not yet known.
  env.click('btn-probe-reconcile');
  await env.settle();

  assert.match(env.get('result-run').textContent, /NOT RECONCILED — a probe is still in flight/);
  assert.match(env.get('probe-hold').textContent, /still in flight/);
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'still locked, nothing was re-armed');
  assert.equal(env.get('btn-probe-reconcile').disabled, true);

  release();
  await env.settle();

  assert.match(env.get('result-run').textContent, /CAPTURED/,
    'the real outcome still lands after the refused reconcile');
  assert.equal(env.get('btn-probe-reconcile').disabled, false,
    'reconcile re-opens once the outcome is known');
});

test('a failed response does not re-arm and is not read as not-sent', async () => {
  const env = await loadPanel({ reply: () => ({ ok: false, error: 'executor refused' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.get('btn-chatgpt-run').disabled, true);
  assert.equal(env.get('btn-probe-reconcile').disabled, false);
  // A bare failure is not proof that nothing was dispatched, so the panel must
  // not report it as a clean NOT SENT.
  assert.match(env.get('result-run').textContent, /UNCERTAIN — executor refused/);
  assert.match(env.get('result-run').textContent, /not known here/);
  assert.doesNotMatch(
    env.get('result-run').textContent,
    /NOT SENT/,
    'a dispatched request must never be reported as not sent'
  );
});

test('a definite post-dispatch failure is reported as failed and still locked', async () => {
  const env = await loadPanel({
    reply: () => ({ ok: false, uncertain: false, error: 'executor rejected the task' })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.match(env.get('result-run').textContent, /FAILED — executor rejected the task/);
  assert.match(env.get('result-run').textContent, /not known here/);
  assert.doesNotMatch(env.get('result-run').textContent, /NOT SENT/);
  assert.equal(env.get('btn-chatgpt-run').disabled, true);
});

test('an uncertain outcome is held, not retried, and never claimed as not sent', async () => {
  const env = await loadPanel({ reply: () => ({ ok: false, uncertain: true, error: 'no reply in time' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.match(env.get('result-run').textContent, /UNCERTAIN — no reply in time/);
  assert.doesNotMatch(env.get('result-run').textContent, /NOT SENT/);
  assert.equal(env.get('btn-chatgpt-run').disabled, true);

  // The operator must not be able to rearm by retyping: the lock is the phase,
  // not the form contents.
  env.get('probe-text').value = 'second attempt';
  env.get('probe-correlation').value = 'corr-2';
  env.get('probe-token').value = 'tok-2';
  env.get('probe-confirm').checked = true;
  env.input('probe-text');
  env.input('probe-correlation');
  env.input('probe-token');
  env.change('probe-confirm');
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'typing must not rearm a held probe');
});

test('a worker pre-dispatch rejection is the only evidence-backed NOT SENT', async () => {
  const env = await loadPanel({
    reply: () => ({ ok: false, dispatched: false, error: 'no approved executor' })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.match(env.get('result-run').textContent, /NOT SENT — the worker rejected this before dispatch/);
  assert.match(env.get('probe-hold').textContent, /Locked until reconciled/);
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'still locked even when nothing was sent');
});

test('repeated clicks produce exactly one authorized send', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true }) });
  await selectOneTab(env);
  await armProbe(env);

  for (let i = 0; i < 5; i += 1) env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.runs().length, 1, 'one authorization, one send');
});

test('reconcile re-arms without resending anything', async () => {
  const env = await loadPanel({ reply: () => ({ ok: false, error: 'unreachable' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.runs().length, 1);
  assert.equal(env.get('btn-probe-reconcile').disabled, false);

  env.click('btn-probe-reconcile');
  await env.settle();

  assert.equal(env.runs().length, 1, 'reconcile must not send');
  assert.equal(env.get('btn-probe-reconcile').disabled, true);
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'blank form must not arm');
  assert.equal(env.get('probe-text').value, '');
  assert.match(env.get('probe-hold').textContent, /Nothing was resent/);

  // And a fresh authorization does send.
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();
  assert.equal(env.runs().length, 2);
});

/* ------------------------------------------------------------------ *
 * The split engine, from the panel
 * ------------------------------------------------------------------ */

test('the submit control posts exactly one submission with the fields the worker requires', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, correlation_id: 'corr-1', observer: { observer_id: 'obs-1' } }) });
  await selectOneTab(env);
  await armProbe(env);
  assert.equal(env.get('btn-chatgpt-submit').disabled, false);

  env.click('btn-chatgpt-submit');
  await env.settle();

  const submits = env.of('aion/chatgpt-submit');
  assert.equal(submits.length, 1, 'one click is one submission');
  assert.deepEqual(submits[0], {
    type: 'aion/chatgpt-submit',
    tabId: 7,
    command: {
      text: 'hello',
      correlation_id: 'corr-1',
      expected_reply_token: 'tok-1',
      approved_scope_ref: SCOPE_REF,
      user_gesture: true,
      // The split engine keys the operation on a stable identity and refuses
      // a correlation marker alone.
      task_id: 'corr-1',
      operation_key: 'corr-1',
      timeout_ms: resolveCommandDeadline({ command: 'submit-turn' }).workMs
    }
  });

  // The submit shares the run's lock: only one send at a time, whichever
  // path sends it.
  assert.equal(env.get('btn-chatgpt-run').disabled, true);
  assert.equal(env.get('btn-chatgpt-submit').disabled, true);
  assert.equal(env.runs().length, 0, 'the submit is not the legacy run path');
});

test('one observe click is one read-only command, and it moves no deadline', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, read_only: true, observer: { observer_id: 'obs-1' } }) });
  await selectOneTab(env);
  await armProbe(env);
  // The split engine's submit is what arms the observer, so the poll follows a
  // submit and not a legacy run.
  env.click('btn-chatgpt-submit');
  await env.settle();

  const before = env.sent.length;
  env.click('btn-chatgpt-observe');
  await env.settle();

  assert.equal(env.sent.length, before + 1, 'one click is one command, and nothing repeats');
  const polls = env.of('aion/chatgpt-observe');
  assert.equal(polls.length, 1);

  const observePlan = resolveCommandDeadline({ command: 'observe-turn' });
  const runPlan = resolveCommandDeadline({ command: 'run-turn' });

  // Exactly the read-only identity fields. No text, no gesture, no approval,
  // and no page action: a poll cannot fill, click, stop or send.
  assert.deepEqual(polls[0], {
    type: 'aion/chatgpt-observe',
    tabId: 7,
    command: {
      correlation_id: 'corr-1',
      expected_reply_token: 'tok-1',
      timeout_ms: observePlan.workMs
    }
  });
  assert.equal('action' in polls[0], false, 'the panel never names a page action');
  assert.equal('text' in polls[0].command, false);
  assert.equal('user_gesture' in polls[0].command, false);
  assert.equal('approved_scope_ref' in polls[0].command, false);

  // The poll carries the observe budget, which is far below the generation
  // budget: a poll can never outlast — let alone move — the operation.
  assert.equal(polls[0].command.timeout_ms, observePlan.workMs);
  assert.ok(polls[0].command.timeout_ms < runPlan.workMs);

  // And it says what it is.
  assert.match(env.get('result-observe').textContent, /Read-only poll/);
  assert.match(env.get('result-observe').textContent, /Nothing was sent/);
});

test('the read-final control reads the addressed operation back, and only that one', async () => {
  const env = await loadPanel({
    reply: () => ({ ok: true, correlation_id: 'corr-1', verdict: { accepted: true, reason: 'matched', reply: 'Hello from the page.' } })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  env.click('btn-chatgpt-read');
  await env.settle();

  const reads = env.of('aion/chatgpt-read');
  assert.equal(reads.length, 1, 'one click is one command');
  assert.deepEqual(reads[0], {
    type: 'aion/chatgpt-read',
    tabId: 7,
    command: {
      correlation_id: 'corr-1',
      expected_reply_token: 'tok-1',
      timeout_ms: resolveCommandDeadline({ command: 'read-final' }).workMs
    }
  });
  assert.match(env.get('result-read').textContent, /Hello from the page\./);
  assert.match(env.get('result-read').textContent, /Nothing was sent/);
});

test('the read-back carries no text: the prompt is never re-transmitted', async () => {
  // The read control is read-only. It re-transmitted the whole prompt on every
  // read, which contradicted its own text-free contract and re-put the message
  // into the tab on a control that is supposed to change nothing.
  const env = await loadPanel({ reply: () => ({ ok: true, correlation_id: 'corr-1' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  env.click('btn-chatgpt-read');
  await env.settle();

  const reads = env.of('aion/chatgpt-read');
  assert.equal(reads.length, 1);
  assert.equal('outbound_text' in reads[0].command, false, 'the read must not re-send the prompt');
  assert.equal('text' in reads[0].command, false);
  assert.doesNotMatch(JSON.stringify(reads[0]), /hello/, 'the prompt text does not travel with the read');
});

test('a read-only control changes no send state and sends nothing', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, read_only: true }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  const holdBefore = env.get('probe-hold').textContent;
  const runDisabled = env.get('btn-chatgpt-run').disabled;

  env.click('btn-chatgpt-observe');
  env.click('btn-chatgpt-read');
  await env.settle();

  assert.equal(env.get('probe-hold').textContent, holdBefore, 'a poll changes no hold state');
  assert.equal(env.get('btn-chatgpt-run').disabled, runDisabled, 'a poll re-arms nothing');
  assert.equal(env.runs().length, 1, 'a read-only control never sends');
  assert.equal(env.of('aion/chatgpt-submit').length, 0);
  assert.equal(env.of('aion/chatgpt-run').length, 1);
  assert.equal(env.of('aion/chatgpt-read').length, 1, 'the read-back ran');
  // A legacy run arms no observer, so the poll is not offered and is not sent
  // even when a click reaches the handler.
  assert.equal(env.of('aion/chatgpt-observe').length, 0, 'a poll without an observer sends nothing');
});

test('the identity survives a panel timeout, so the operation stays addressable', async () => {
  const env = await loadPanel({ reply: () => undefined }); // never answers
  await selectOneTab(env);
  await armProbe(env);
  const clock = installFakeClock();
  try {
    env.click('btn-chatgpt-submit');
    assert.equal(env.of('aion/chatgpt-submit').length, 1);
    await clock.advance(resolveCommandDeadline({ command: 'submit-turn' }).panelMs);
    assert.match(env.get('result-submit').textContent, /UNCERTAIN/);

    // The panel gave up on the answer, but the operation it dispatched is
    // still addressable: the correlation id and the token survived.
    assert.equal(env.get('probe-correlation').value, 'corr-1');
    assert.equal(env.get('probe-token').value, 'tok-1');
    assert.equal(env.get('btn-chatgpt-observe').disabled, false);
    assert.equal(env.get('btn-chatgpt-read').disabled, false);
    assert.equal(env.get('btn-chatgpt-reconcile').disabled, false);

    env.click('btn-chatgpt-observe');
    await clock.advance(0);
    const polls = env.of('aion/chatgpt-observe');
    assert.equal(polls.length, 1);
    assert.equal(polls[0].command.correlation_id, 'corr-1');
    assert.equal(polls[0].command.expected_reply_token, 'tok-1');
  } finally {
    clock.restore();
  }
});

test('an explicit new run drops the addressable operation', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  assert.equal(env.get('btn-chatgpt-observe').disabled, false);
  assert.equal(env.get('btn-chatgpt-read').disabled, false);
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, false);

  env.click('btn-probe-reconcile');
  await env.settle();

  // Reconciling is the explicit new run: the operation is done with, and its
  // address goes with it.
  assert.equal(env.get('probe-correlation').value, '');
  assert.equal(env.get('probe-token').value, '');
  assert.equal(env.get('btn-chatgpt-observe').disabled, true);
  assert.equal(env.get('btn-chatgpt-read').disabled, true);
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, true);
  assert.equal(env.of('aion/chatgpt-observe').length, 0, 'reconcile polls nothing');
  assert.equal(env.of('aion/chatgpt-reconcile').length, 0, 'the local reset sends nothing');
});

test('the reply token never appears in human-facing text', async () => {
  const env = await loadPanel({
    reply: () => ({
      ok: true,
      expected_reply_token: 'tok-1',
      correlation_id: 'corr-1',
      captured: 'partial text',
      observer: { observer_id: 'obs-1' },
      verdict: { accepted: true, reason: 'matched', reply: 'the page said hello' }
    })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();
  env.click('btn-chatgpt-observe');
  await env.settle();
  env.click('btn-chatgpt-read');
  await env.settle();

  for (const id of ['result-run', 'result-submit', 'result-observe', 'result-read', 'probe-hold']) {
    assert.doesNotMatch(env.get(id).textContent, /tok-1/, id + ' must not echo the reply token');
  }
  // The correlation id is not a secret and may be shown.
  assert.match(env.get('result-submit').textContent, /corr-1/);
});

/* ------------------------------------------------------------------ *
 * Observe needs an observer; a legacy run has none
 * ------------------------------------------------------------------ */

test('observe is offered only for a submitted turn; a legacy run offers only the read-back', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true }) });
  await selectOneTab(env);
  await armProbe(env);

  // Nothing is addressed yet, so no follow-up is offered.
  assert.equal(env.get('btn-chatgpt-observe').disabled, true);
  assert.equal(env.get('btn-chatgpt-read').disabled, true);
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, true);

  env.click('btn-chatgpt-run');
  await env.settle();

  // The legacy run arms no observer, so Observe is not offered: a poll against
  // it could only ever answer `observer_identity_required`.
  assert.equal(env.get('btn-chatgpt-observe').disabled, true, 'a legacy run has no observer to poll');
  // The read-back is, because it can scan the page without a durable observer.
  assert.equal(env.get('btn-chatgpt-read').disabled, false, 'the read-back needs no observer');
  // And the operation is addressable, so the reconciliation door is open.
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, false, 'the operation is addressable');

  // Even a click that reaches the handler sends no poll and says why.
  env.click('btn-chatgpt-observe');
  await env.settle();
  assert.equal(env.of('aion/chatgpt-observe').length, 0, 'no observer means no poll is sent');
  assert.match(env.get('result-observe').textContent, /no armed observer/);
});

test('a submitted turn can be polled and read back', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true, observer: { observer_id: 'obs-1' } }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  assert.equal(env.get('btn-chatgpt-observe').disabled, false, 'a submitted turn has an observer');
  assert.equal(env.get('btn-chatgpt-read').disabled, false);
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, false);

  env.click('btn-chatgpt-observe');
  await env.settle();
  assert.equal(env.of('aion/chatgpt-observe').length, 1, 'the poll ran');
  assert.equal(env.of('aion/chatgpt-run').length, 0, 'a poll never sends');
});

test('a timed-out legacy run keeps its address and still offers no poll', async () => {
  const env = await loadPanel({ reply: () => undefined }); // never answers
  await selectOneTab(env);
  await armProbe(env);
  const clock = installFakeClock();
  try {
    env.click('btn-chatgpt-run');
    assert.equal(env.runs().length, 1);
    await clock.advance(resolveCommandDeadline({ command: 'run-turn' }).panelMs);
    assert.match(env.get('result-run').textContent, /UNCERTAIN/);

    // The panel gave up on the answer, but the operation it dispatched is
    // still addressable — a timeout is exactly when the operator most needs
    // to ask about it.
    assert.equal(env.get('probe-correlation').value, 'corr-1', 'the address survives the timeout');
    assert.equal(env.get('probe-token').value, 'tok-1');
    assert.equal(env.get('btn-chatgpt-observe').disabled, true, 'a legacy run still has no observer');
    assert.equal(env.get('btn-chatgpt-read').disabled, false, 'the read-back is still offered');
    assert.equal(env.get('btn-chatgpt-reconcile').disabled, false, 'the operation is still addressable');
  } finally {
    clock.restore();
  }
});

/* ------------------------------------------------------------------ *
 * The read-only reconciliation door
 * ------------------------------------------------------------------ */

test('the reconcile door is one read-only command, and it changes nothing here', async () => {
  const env = await loadPanel({
    reply: (message) => (message.type === 'aion/chatgpt-reconcile'
      ? {
          ok: true,
          correlation_id: 'corr-1',
          phase: 'NEEDS_RECONCILIATION',
          lock_active: true,
          settled: false,
          resolved: false,
          reason: 'observation_pending'
        }
      : { ok: true })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  const holdBefore = env.get('probe-hold').textContent;
  const before = env.sent.length;

  env.click('btn-chatgpt-reconcile');
  await env.settle();

  const reconciles = env.of('aion/chatgpt-reconcile');
  assert.equal(reconciles.length, 1, 'one click is one command');
  assert.equal(env.sent.length, before + 1, 'nothing repeats on its own');
  assert.deepEqual(reconciles[0], {
    type: 'aion/chatgpt-reconcile',
    tabId: 7,
    command: {
      correlation_id: 'corr-1',
      expected_reply_token: 'tok-1',
      timeout_ms: resolveCommandDeadline({ command: 'reconcile-turn' }).workMs
    }
  });

  // It has no send authority at all: no gesture, no approval, no text.
  assert.equal('user_gesture' in reconciles[0].command, false);
  assert.equal('approved_scope_ref' in reconciles[0].command, false);
  assert.equal('text' in reconciles[0].command, false);
  assert.equal('outbound_text' in reconciles[0].command, false);
  assert.equal('action' in reconciles[0], false, 'the panel never names a page action');

  // It reports the worker's answer and nothing else.
  const shown = env.get('result-reconcile').textContent;
  assert.match(shown, /Read-only reconciliation/);
  assert.match(shown, /Nothing was sent/);
  assert.match(shown, /Phase: NEEDS_RECONCILIATION/);
  assert.match(shown, /Lock active: true/);
  assert.match(shown, /Settlement: false/);
  assert.match(shown, /Reason: observation_pending/);

  // And it changes NOTHING here: no state cleared, nothing re-armed.
  assert.equal(env.get('probe-hold').textContent, holdBefore, 'a reconcile changes no hold state');
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'a reconcile re-arms nothing');
  assert.equal(env.get('btn-chatgpt-submit').disabled, true, 'a reconcile re-arms nothing');
  assert.equal(env.get('probe-correlation').value, 'corr-1', 'the address survives');
  assert.equal(env.get('probe-token').value, 'tok-1');
  assert.equal(env.get('btn-chatgpt-observe').disabled, false, 'the operation stays addressable');
  assert.equal(env.get('btn-chatgpt-read').disabled, false);
  assert.equal(env.of('aion/chatgpt-run').length, 0, 'a reconcile never sends');
  assert.equal(env.of('aion/chatgpt-submit').length, 1, 'a reconcile never re-sends');
});

test('the reconcile door is closed with no address and holds one command at a time', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const env = await loadPanel({
    reply: async (message) => {
      if (message.type !== 'aion/chatgpt-reconcile') return { ok: true };
      await gate;
      return { ok: true, phase: 'NEEDS_RECONCILIATION', lock_active: true, settled: false, reason: 'observation_pending' };
    }
  });
  await selectOneTab(env);
  await armProbe(env);

  // No address: the door is closed, and a click that reaches the handler
  // sends nothing.
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, true);
  env.click('btn-chatgpt-reconcile');
  await env.settle();
  assert.equal(env.of('aion/chatgpt-reconcile').length, 0);
  assert.match(env.get('result-reconcile').textContent, /no operation to address/);

  env.click('btn-chatgpt-submit');
  await env.settle();
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, false);

  env.click('btn-chatgpt-reconcile');
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, true, 'one command at a time');
  env.click('btn-chatgpt-reconcile');
  await env.settle();
  assert.equal(env.of('aion/chatgpt-reconcile').length, 1, 'a second click queues nothing');
  assert.match(env.get('result-reconcile').textContent, /already in flight/);

  release();
  await env.settle();
  assert.equal(env.get('btn-chatgpt-reconcile').disabled, false, 'the door re-opens for the next question');
});

test('a refused reconciliation keeps the worker code and the durable facts', async () => {
  const env = await loadPanel({
    reply: (message) => (message.type === 'aion/chatgpt-reconcile'
      ? {
          ok: false,
          code: 'observer_not_armed',
          error: 'observer_not_armed: no observer is armed for this operation',
          reason: 'observer_not_armed',
          phase: 'NEEDS_RECONCILIATION',
          lock_active: true,
          settled: false,
          uncertain: true
        }
      : { ok: true })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  env.click('btn-chatgpt-reconcile');
  await env.settle();

  const shown = env.get('result-reconcile').textContent;
  assert.match(shown, /UNCERTAIN — /);
  assert.match(shown, /Code: observer_not_armed/);
  assert.match(shown, /Lock active: true/, 'the durable facts are shown even on a refusal');
  assert.match(shown, /Phase: NEEDS_RECONCILIATION/);
  assert.equal(env.get('result-reconcile').dataset.state, 'warn');
});

test('a pending submission is uncertain and carries the worker code, never a bare failure', async () => {
  const env = await loadPanel({
    reply: (message) => (message.type === 'aion/chatgpt-tabs'
      ? { ok: true, tabs: [{ id: 7, url: 'https://chatgpt.com/c/abc' }] }
      : {
          ok: false,
          code: 'submit_pending',
          error: 'submit_pending: activation attempted; submission_observed=false',
          submitted: true,
          uncertain: true,
          observer: { observer_id: 'obs-1' }
        })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  const text = env.get('result-submit').textContent;
  assert.match(text, /^UNCERTAIN — /);
  assert.doesNotMatch(text, /UNCERTAIN — UNCERTAIN/, 'the outcome is worded once, not twice');
  assert.match(text, /Code: submit_pending/);
  assert.match(text, /not known here/);
  assert.doesNotMatch(text, /NOT SENT/, 'a dispatched submission is never reported as not sent');
  assert.equal(env.get('result-submit').dataset.state, 'warn');
});

test('a refused submission is the only evidence-backed NOT SENT', async () => {
  const env = await loadPanel({
    reply: (message) => (message.type === 'aion/chatgpt-tabs'
      ? { ok: true, tabs: [{ id: 7, url: 'https://chatgpt.com/c/abc' }] }
      : { ok: false, code: 'turn_refused', error: 'turn_refused: no_submit', submitted: false, uncertain: false })
  });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-submit');
  await env.settle();

  const text = env.get('result-submit').textContent;
  assert.match(text, /NOT SENT — the worker refused this before dispatch/);
  assert.match(text, /Code: turn_refused/);
  assert.equal(env.get('result-submit').dataset.state, 'warn');
});

test('every operator action the panel can send is in the shared catalog', async () => {
  const { ACTION_CATALOG } = await import('../src/panel/view-model.js');
  const catalog = new Set(ACTION_CATALOG.map((action) => action.type));
  for (const type of OPERATOR_TYPES) {
    assert.ok(catalog.has(type), type + ' must be in the shared catalog');
  }
  // Nothing that sends is ever machine-callable.
  for (const action of ACTION_CATALOG.filter((a) => a.kind === 'send')) {
    assert.equal(action.machine_view, false, action.type + ' must not be machine-callable');
  }
});

/* ------------------------------------------------------------------ *
 * Deadlines
 * ------------------------------------------------------------------ */

test('native diagnostics remain unchanged; ChatGPT tab discovery uses its complete plan', async () => {
  const env = await loadPanel({ reply: () => undefined }); // never answers
  const clock = installFakeClock();
  try {
    env.click('btn-native-ping');
    await clock.advance(5000);
    assert.match(env.get('result-native').textContent, /UNCERTAIN/,
      'a diagnostic must give up in five seconds');
    assert.match(env.get('result-native').textContent, /No reply within 5s/,
      'the host check keeps the five second budget');

    env.click('btn-chatgpt-tabs');
    await clock.advance(resolveCommandDeadline({ command: 'tabs' }).panelMs);
    assert.match(env.get('result-chatgpt').textContent, /UNCERTAIN/);
  } finally {
    clock.restore();
  }
});

test('the ChatGPT tab ping outlasts the driver ping and stays bounded', async () => {
  const env = await loadPanel({ reply: () => undefined }); // never answers
  const clock = installFakeClock();
  try {
    env.get('tab-select').value = '7';
    env.get('tab-select').disabled = false;
    env.change('tab-select');
    env.click('btn-chatgpt-ping');

    // The driver's own ping budget is 5000ms. If the panel gave up at the same
    // five seconds, a driver timeout would be masked by the panel's deadline and
    // the operator would never see the driver's code.
    await clock.advance(5000);
    assert.doesNotMatch(env.get('result-chatgpt').textContent, /UNCERTAIN/,
      'the panel must still be waiting while the driver ping may answer');

    const panelMs = resolveCommandDeadline({ command: 'ping' }).panelMs;
    await clock.advance(panelMs - 5000);
    assert.match(env.get('result-chatgpt').textContent, /UNCERTAIN/);
    assert.match(env.get('result-chatgpt').textContent, new RegExp(`No reply within ${panelMs / 1000}s`));
  } finally {
    clock.restore();
  }
});

test('the ACP handshake carries its own bounded twenty second deadline', async () => {
  const env = await loadPanel({ reply: () => undefined }); // never answers
  const clock = installFakeClock();
  try {
    env.click('btn-native-hello');
    await clock.advance(5000);
    assert.doesNotMatch(env.get('result-native').textContent, /UNCERTAIN/,
      'a real initialize observed at 4.7s must not be timed out at five seconds');

    await clock.advance(15000);
    assert.match(env.get('result-native').textContent, /UNCERTAIN/,
      'the hello deadline is still bounded, at twenty seconds');
    assert.match(env.get('result-native').textContent, /No reply within 20s/);
  } finally {
    clock.restore();
  }
});

test('the live probe is still waiting well past the diagnostic deadline', async () => {
  const env = await loadPanel({ reply: () => undefined });
  const clock = installFakeClock();
  const { MAX_PORT_GUARD_MS } = await import('../src/background/chatgpt-port.js');
  const panelMs = resolveCommandDeadline({ command: 'run-turn' }).panelMs;
  try {
    // The tab list never answers, so the tab is selected from the stub directly.
    env.get('tab-select').value = '7';
    env.get('tab-select').disabled = false;
    env.change('tab-select');
    env.get('probe-text').value = 'hello';
    env.get('probe-correlation').value = 'corr-1';
    env.get('probe-token').value = 'tok-1';
    env.get('probe-scope-ref').value = SCOPE_REF;
    env.get('probe-confirm').checked = true;
    env.input('probe-text');
    env.input('probe-correlation');
    env.input('probe-token');
    env.input('probe-scope-ref');
    env.change('probe-confirm');

    env.click('btn-chatgpt-run');
    await clock.advance(15000);
    assert.equal(env.runs().length, 1);
    assert.doesNotMatch(env.get('result-run').textContent, /UNCERTAIN/,
      'fifteen seconds must not end a live run');

    // The 2026-10-18 turn outlived the worker's 120s page budget and was refused
    // `generation_incomplete`. The panel must therefore still be listening well
    // past two minutes, which is where the previous 180s deadline used to sit.
    await clock.advance(120000);
    assert.equal(env.runs().length, 1);
    assert.doesNotMatch(env.get('result-run').textContent, /UNCERTAIN/,
      '120s is the latency the live run must survive, so the panel cannot have given up');

    // And past the worker's OWN guard. If the panel's generic deadline ever
    // drops to the guard's, it reports a vague UNKNOWN where the worker actually
    // has a stable timeout code to show.
    await clock.advance(MAX_PORT_GUARD_MS - 135000);
    assert.doesNotMatch(env.get('result-run').textContent, /UNCERTAIN/,
      `the panel must still be listening at the worker guard (${MAX_PORT_GUARD_MS}ms)`);

    await clock.advance(panelMs);
    assert.match(env.get('result-run').textContent, /UNCERTAIN/,
      'the live deadline is finite, and firing it is not a claim that nothing was sent');
    assert.match(env.get('result-run').textContent, new RegExp(`No reply within ${Math.round(panelMs / 1000)}s`));
    assert.equal(env.get('btn-chatgpt-run').disabled, true, 'a timed-out run is still locked');
    assert.equal(env.get('btn-probe-reconcile').disabled, false);
  } finally {
    clock.restore();
  }
});

test('the panel deadline outlasts the worker guard, which outlasts the page budget', async () => {
  // The whole failure of 2026-10-18 was a bound-versus-latency mismatch, and the
  // three numbers that decide it live in three different files. This asserts the
  // ORDERING, so a future edit to any one of them cannot silently restore the
  // bug by making one layer's deadline shorter than the layer it wraps.
  const { MAX_RUN_TIMEOUT_MS, MAX_PORT_GUARD_MS, DEFAULT_CHATGPT_GRACE_MS } =
    await import('../src/background/chatgpt-port.js');
  const { __testing: contentTesting } = await import('../src/chatgpt/content.js');

  // 1. the panel's own live deadline, read out of the module that owns it.
  assert.match(panelSource, /const LIVE_RUN_TIMEOUT_MS = resolveCommandDeadline/);
  const panelMs = resolveCommandDeadline({ command: 'run-turn' }).panelMs;
  assert.ok(Number.isFinite(panelMs), 'the panel deadline is a finite number');

  // 2. page clamp >= worker run ceiling, or the worker's budget is truncated
  //    silently in the page and a slow turn is read mid-generation again.
  assert.ok(contentTesting.MAX_TIMEOUT_MS >= MAX_RUN_TIMEOUT_MS,
    'the page clamp must not be shorter than the budget the worker hands it');

  // 3. worker guard > page budget, or the worker gives up while the page is
  //    still entitled to be working.
  assert.ok(MAX_PORT_GUARD_MS >= MAX_RUN_TIMEOUT_MS + DEFAULT_CHATGPT_GRACE_MS,
    'the port guard must outlast the page budget plus the grace the worker adds');

  // 4. panel deadline > worker guard. Otherwise the panel's generic
  //    "no reply within Ns" races the worker's stable timeout code, and the
  //    operator is shown UNKNOWN where a real code existed.
  assert.ok(panelMs > MAX_PORT_GUARD_MS,
    `the panel deadline (${panelMs}ms) must outlast the worker guard (${MAX_PORT_GUARD_MS}ms)`);

  // And the whole chain is still bounded: no layer waits without an end.
  for (const [label, ms] of [
    ['page clamp', contentTesting.MAX_TIMEOUT_MS],
    ['worker run ceiling', MAX_RUN_TIMEOUT_MS],
    ['worker port guard', MAX_PORT_GUARD_MS],
    ['panel live deadline', panelMs]
  ]) {
    assert.ok(Number.isFinite(ms) && ms > 0, `${label} is a positive finite bound`);
  }
});

test('panel timeout cleans its wait and ignores a late callback without rearming', async () => {
  const env = await loadPanel();
  await armProbe(env);
  let callback;
  globalThis.chrome.runtime.sendMessage = (message, cb) => { env.sent.push(message); callback = cb; };
  const clock = installFakeClock();
  try {
    env.click('btn-chatgpt-run');
    assert.equal(clock.pending, 1);
    await clock.advance(resolveCommandDeadline({ command: 'run-turn' }).panelMs);
    const result = env.get('result-run').textContent;
    assert.match(result, /UNCERTAIN/);
    callback({ ok: true, captured: true });
    await clock.advance(0);
    assert.equal(env.get('result-run').textContent, result);
    assert.equal(env.get('btn-chatgpt-run').disabled, true);
    assert.equal(clock.pending, 0);
    assert.equal(env.runs().length, 1);
  } finally { clock.restore(); }
});

test('synchronous panel timer expiry or setup failure never posts the command', async () => {
  for (const timer of [(fn) => { fn(); return 1; }, () => { throw new Error('timer setup'); }]) {
    const env = await loadPanel();
    await armProbe(env);
    const real = globalThis.setTimeout, clear = globalThis.clearTimeout;
    try {
      globalThis.setTimeout = timer;
      globalThis.clearTimeout = () => { throw new Error('timer cleanup'); };
      env.click('btn-chatgpt-run');
      await Promise.resolve(); await Promise.resolve();
      assert.equal(env.runs().length, 0);
      assert.equal(env.get('btn-chatgpt-run').disabled, true);
    } finally { globalThis.setTimeout = real; globalThis.clearTimeout = clear; }
  }
});

/* ------------------------------------------------------------------ *
 * Read-only actions stay available
 * ------------------------------------------------------------------ */

test('diagnostics remain available while a probe is held', async () => {
  const env = await loadPanel({ reply: () => ({ ok: false, error: 'unreachable' }) });
  await selectOneTab(env);
  await armProbe(env);
  env.click('btn-chatgpt-run');
  await env.settle();

  assert.equal(env.get('btn-chatgpt-run').disabled, true);

  const count = (type) => env.sent.filter((m) => m.type === type).length;
  const before = { ping: count('aion/native-ping'), hello: count('aion/native-hello'), tabs: count('aion/chatgpt-tabs') };

  env.click('btn-native-ping');
  env.click('btn-native-hello');
  env.click('btn-chatgpt-tabs');
  await env.settle();

  assert.equal(count('aion/native-ping'), before.ping + 1, 'host check stays available');
  assert.equal(count('aion/native-hello'), before.hello + 1, 'ACP init stays available');
  assert.equal(count('aion/chatgpt-tabs'), before.tabs + 1, 'tab search stays available');
  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'a held probe stays held while diagnostics run');
});

/* ------------------------------------------------------------------ *
 * Standalone degradation
 * ------------------------------------------------------------------ */

test('without a runtime every action degrades and nothing is sent', async () => {
  const env = await loadPanel({ withRuntime: false });

  env.click('btn-native-ping');
  env.click('btn-native-hello');
  env.click('btn-chatgpt-tabs');
  await env.settle();

  assert.match(env.get('result-native').textContent, /unavailable in standalone review/);
  assert.match(env.get('result-chatgpt').textContent, /unavailable in standalone review/);
  assert.equal(env.sent.length, 0);
  assert.equal(env.get('btn-chatgpt-run').disabled, true);
  assert.equal(env.get('tab-select').disabled, true);
});

/* ------------------------------------------------------------------ *
 * Validator
 * ------------------------------------------------------------------ */

test('validateProbeInput rejects each missing or malformed field', async () => {
  const { validateProbeInput } = (await loadPanel()).mod;
  const base = { text: 'a', correlationId: 'c', token: 't', tabId: 1, confirmed: true, scopeRef: SCOPE_REF };

  assert.deepEqual(validateProbeInput(base), []);
  assert.equal(validateProbeInput({ ...base, text: '   ' }).length, 1);
  assert.equal(validateProbeInput({ ...base, text: 'x'.repeat(2001) }).length, 1);
  assert.equal(validateProbeInput({ ...base, correlationId: '' }).length, 1);
  assert.equal(validateProbeInput({ ...base, correlationId: 'c c' }).length, 1);
  assert.equal(validateProbeInput({ ...base, correlationId: 'c/1' }).length, 1);
  assert.equal(validateProbeInput({ ...base, correlationId: 'x'.repeat(129) }).length, 1);
  assert.equal(validateProbeInput({ ...base, token: 'https://x' }).length, 1);
  assert.equal(validateProbeInput({ ...base, tabId: null }).length, 1);
  assert.equal(validateProbeInput({ ...base, confirmed: false }).length, 1);
  assert.equal(validateProbeInput({ ...base, confirmed: 'true' }).length, 1,
    'only a real boolean true is a confirmation');
});

test('the approval reference is required, bounded and free of a hardcoded grant', async () => {
  const { scopeRefProblem, validateProbeInput } = (await loadPanel()).mod;
  const base = { text: 'a', correlationId: 'c', token: 't', tabId: 1, confirmed: true };

  // Absent or blank is a refusal, not a default.
  assert.match(scopeRefProblem(''), /required/);
  assert.match(scopeRefProblem('   '), /required/);
  assert.match(scopeRefProblem(undefined), /required/);
  assert.match(scopeRefProblem(null), /required/);
  assert.equal(scopeRefProblem(SCOPE_REF), null);
  assert.equal(scopeRefProblem('  ' + SCOPE_REF + '  '), null, 'a trimmed reference is usable');
  assert.equal(validateProbeInput({ ...base }).length, 1, 'no reference means no send');

  // The worker's own bound: 1-128 characters, a conservative charset.
  assert.match(scopeRefProblem('x'.repeat(129)), /1-128/);
  assert.equal(scopeRefProblem('x'.repeat(128)), null);
  assert.match(scopeRefProblem('has space'), /1-128 characters of/);
  assert.match(scopeRefProblem('quote"inside'), /1-128 characters of/);
  assert.match(scopeRefProblem('__proto__'), /1-128 characters of/);

  // The panel holds NO grant of its own. A hardcoded authorization record
  // would be the panel granting itself permission, which the contract forbids.
  assert.equal(
    /AUTHORIZATION-\d{4}-\d{2}-\d{2}/.test(panelSource),
    false,
    'the panel must not carry a hardcoded approval record'
  );
});

test('a send without an approval reference is refused before anything is dispatched', async () => {
  const env = await loadPanel({ reply: () => ({ ok: true }) });
  await selectOneTab(env);
  // Everything except the approval reference.
  env.get('probe-text').value = 'hello';
  env.get('probe-correlation').value = 'corr-1';
  env.get('probe-token').value = 'tok-1';
  env.get('probe-confirm').checked = true;
  env.input('probe-text');
  env.input('probe-correlation');
  env.input('probe-token');
  env.change('probe-confirm');

  assert.equal(env.get('btn-chatgpt-run').disabled, true, 'no approval, no armed run');
  assert.equal(env.get('btn-chatgpt-submit').disabled, true, 'no approval, no armed submit');
  assert.ok(env.blockers().some((line) => /Approval reference is required/.test(line)));

  // Even a direct click sends nothing.
  env.click('btn-chatgpt-run');
  env.click('btn-chatgpt-submit');
  await env.settle();

  assert.equal(env.runs().length, 0);
  assert.equal(env.of('aion/chatgpt-submit').length, 0);
  assert.match(env.get('result-run').textContent, /NOT SENT — Approval reference is required/);
  assert.match(env.get('result-submit').textContent, /NOT SENT — Approval reference is required/);
});

/* ------------------------------------------------------------------ *
 * Structural invariants
 * ------------------------------------------------------------------ */

test('each operator action has exactly one call site', () => {
  for (const type of OPERATOR_TYPES) {
    const uses = panelSource.match(new RegExp("'" + type + "'", 'g')) || [];
    assert.equal(uses.length, 1, type + ' must have exactly one call site');
  }
});

test('no operator action is reachable from the boot path', () => {
  const boot = panelSource.slice(panelSource.indexOf('function boot()'));
  const body = boot.slice(0, boot.indexOf('\n}'));
  for (const type of OPERATOR_TYPES) {
    assert.equal(body.includes(type), false, type + ' must not be sent on load');
  }
  assert.match(body, /wireOperatorControls\(\)/);
});

test('results are written with textContent, never with an HTML sink', () => {
  for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write']) {
    assert.equal(panelSource.includes(sink), false, sink + ' must not appear');
  }
  assert.match(panelSource, /node\.textContent = text/);
});

test('markup is labelled and described by existing ids', () => {
  const clean = panelHtml.replace(/<!--[\s\S]*?-->/g, '');
  const ids = [...clean.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');

  for (const m of clean.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) {
    assert.ok(ids.includes(m[1]), 'label target ' + m[1] + ' must exist');
  }
  for (const attr of ['aria-labelledby', 'aria-describedby']) {
    for (const m of clean.matchAll(new RegExp('\\s' + attr + '="([^"]+)"', 'g'))) {
      for (const ref of m[1].split(/\s+/).filter(Boolean)) {
        assert.ok(ids.includes(ref), attr + ' target ' + ref + ' must exist');
      }
    }
  }
  const controls = [...clean.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map((m) => m[0]);
  const labelled = new Set([...clean.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
  for (const control of controls) {
    const id = (control.match(/\sid="([^"]+)"/) || [])[1];
    assert.ok(id && labelled.has(id), 'control needs a label: ' + control.slice(0, 60));
  }
});

test('every id the panel hooks exists in the markup, and every class is styled', () => {
  const clean = panelHtml.replace(/<!--[\s\S]*?-->/g, '');
  const ids = [...clean.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const hook of [...new Set([...panelSource.matchAll(/el\('([^']+)'\)/g)].map((m) => m[1]))]) {
    assert.ok(ids.includes(hook), 'el(\'' + hook + '\') has no element');
  }
  const classes = new Set(
    [...clean.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
  );
  for (const cls of classes) {
    assert.ok(panelCss.includes('.' + cls), 'unstyled class ' + cls);
  }
});

test('no external assets, credentials or automation tooling', () => {
  const sources = panelSource + panelHtml + panelCss;
  for (const pattern of [/playwright/i, /puppeteer/i, /orca/i, /(src|href)=["']https?:/i]) {
    assert.equal(pattern.test(sources), false, 'must not contain ' + pattern);
  }
  // Credential-shaped literals only. `parsed.password` is the URL API field
  // used to reject a URL carrying userinfo, not a stored secret.
  for (const pattern of [
    /api[_-]?key/i,
    /bearer /i,
    /\bpassword\s*[:=]\s*['"][^'"]+['"]/i,
    /\bsecret\s*[:=]\s*['"][^'"]+['"]/i,
    /\btoken\s*[:=]\s*['"][^'"]+['"]/i
  ]) {
    assert.equal(pattern.test(sources), false, 'must not contain ' + pattern);
  }
});
