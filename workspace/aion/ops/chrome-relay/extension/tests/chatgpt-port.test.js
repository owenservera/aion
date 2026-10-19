// ChatGPT tab port driver tests (worker side).
//
// No browser, no content script, no page: every test drives the driver with a
// fake `chrome.tabs` and a fake port that answers on cue.
//
// What is held here:
//   1. only chatgpt.com tabs are addressable, and only sanitized facts leave
//   2. runTurn refuses without an explicit confirmation, and opens no port
//   3. runTurn sends exactly one command and never retries it
//   4. replies are validated as data; they are never obeyed
//   5. a content-script reply cannot smuggle a second turn or a new action
//   6. every failure mode reports a stable code rather than hanging
import { test as baseTest } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Every test here gets a hard per-test deadline.
 *
 * The driver under test runs real timers (a port that never answers must time
 * out), so a regression that removed the timeout would hang the suite rather
 * than fail it. 5s sits far above the fastest path (~20ms) and far below
 * anything that would stall a run.
 */
const TEST_TIMEOUT_MS = 5_000;
const test = (name, fn) => baseTest(name, { timeout: TEST_TIMEOUT_MS }, fn);

import { acceptedAdapterReply, verdictForEnvelope } from './fixtures/chatgpt-accepted.js';
import {
  CHATGPT_ACTION,
  CHATGPT_ERROR,
  CHATGPT_PORT_NAME,
  CHATGPT_TAB_PATTERN,
  DEFAULT_CHATGPT_GRACE_MS,
  DEFAULT_CHATGPT_TIMEOUTS,
  MAX_PORT_GUARD_MS,
  MAX_RUN_TIMEOUT_MS,
  createChatGPTPortDriver,
  isChatGptUrl,
  sanitizeTab,
  sanitizeUrl
} from '../src/background/chatgpt-port.js';

const CHAT_TAB = { id: 7, windowId: 3, active: true, status: 'complete', url: 'https://chatgpt.com/c/abc123?share=secret#frag' };
const OTHER_TAB = { id: 9, windowId: 3, active: false, status: 'complete', url: 'https://example.com/?token=leak' };

/**
 * A fake chrome.tabs whose ports answer through `behaviour.answer(port, msg)`.
 *
 * Every opened port is retained so a test can assert on what was written, and so
 * a reply can be withheld to exercise the timeout.
 */
function fakeTabs(behaviour = {}) {
  const opened = [];
  const api = {
    storage: memoryStorage(),
    queries: [],
    tabs: {
      async query(info) {
        api.queries.push(info);
        if (behaviour.queryThrows) throw new Error('tabs.query exploded');
        const all = behaviour.tabs ?? [CHAT_TAB, OTHER_TAB];
        // The real chrome filters server-side; emulate that, because the driver
        // must not rely on its own filter alone.
        return all.filter((t) => typeof t.url === 'string' && t.url.startsWith('https://chatgpt.com'));
      },
      connect(tabId, info) {
        if (behaviour.connectThrows) {
          throw new Error('Could not establish connection. Receiving end does not exist.');
        }
        const listeners = { message: [], disconnect: [] };
        const port = {
          name: info && info.name,
          tabId,
          posted: [],
          disconnected: false,
          postMessage(msg) {
            port.posted.push(msg);
            if (behaviour.postThrows) throw new Error('port is gone');
            if (typeof behaviour.answer === 'function') {
              let reply = behaviour.answer(port, msg);
              // A live page answers the read-only preflight whether or not the test
              // cares about it. Tests that pass no `answer` at all stay silent,
              // which is what the timeout tests need.
              if (reply === undefined || reply === null) {
                reply = msg.action === CHATGPT_ACTION.PING
                  ? {
                    action: msg.action,
                    ok: true,
                    href: 'https://chatgpt.com/c/abc',
                    state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 }
                  }
                  : null;
              }
              if (reply !== undefined && reply !== null) {
                queueMicrotask(() => {
                  for (const f of listeners.message) f(reply);
                });
              }
            }
          },
          disconnect() { port.disconnected = true; },
          onMessage: { addListener: (f) => listeners.message.push(f) },
          onDisconnect: { addListener: (f) => listeners.disconnect.push(f) },
          // test affordances
          emit: (m) => { for (const f of listeners.message) f(m); },
          kill: () => { for (const f of listeners.disconnect) f({}); }
        };
        opened.push(port);
        return port;
      }
    }
  };
  return { api, opened };
}

function memoryStorage() {
  const bag = {};
  return { local: {
    async get(key) { return Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}; },
    async set(value) { Object.assign(bag, structuredClone(value)); },
  } };
}

/**
 * Budgets, deliberately split in two.
 *
 * Happy paths get a LARGE budget they never approach (they resolve in ~1ms), so a
 * loaded machine cannot turn a fast reply into a spurious timeout. Only the tests
 * whose ASSERTION is the timeout get a small one, and those wait for it on
 * purpose. One shared tiny timeout for everything is what makes a suite pass
 * alone and fail in a full run.
 */
const FAST = { ping: 60, state: 60, read: 60, run: 60, stop: 60 };
const ROOMY = { ping: 4000, state: 4000, read: 4000, run: 4000, stop: 4000 };
/** And a small grace, so no test ever waits out the production 5s pad. */
const NO_GRACE = { graceMs: 60 };

/**
 * Poll until `predicate` holds, or fail loudly at the deadline.
 *
 * Fixed sleeps let the scheduler decide when a test observes its own effect.
 * This waits for the actual condition and is still hard-bounded.
 */
async function waitFor(predicate, label, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (predicate()) return;
    if (Date.now() > deadline) throw new Error(`timed out after ${timeoutMs}ms waiting for: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/**
 * A complete, valid submission: an explicit gesture AND the approval it acts
 * under, plus the text and correlation a turn needs. A gesture alone is not
 * authorisation, so both gates are present in every test that is not
 * specifically testing the gates.
 */
const GATE = {
  user_gesture: true,
  approved_scope_ref: 'grant-1',
  correlation_id: 'task-1',
  expected_reply_token: 'ACK-1',
  text: 'hello'
};

function driver(behaviour = {}, extra = {}) {
  const fake = fakeTabs(behaviour);
  return {
    ...fake,
    driver: createChatGPTPortDriver({ chrome: fake.api, timeouts: ROOMY, ...NO_GRACE, ...extra })
  };
}

/** A driver whose budgets are deliberately tiny, for tests asserting a timeout. */
function impatientDriver(behaviour = {}, extra = {}) {
  const fake = fakeTabs(behaviour);
  return {
    ...fake,
    driver: createChatGPTPortDriver({ chrome: fake.api, timeouts: FAST, ...NO_GRACE, ...extra })
  };
}

/** A valid content-script envelope for an accepted turn. */
function acceptedEnvelope() {
  return acceptedAdapterReply().envelope;
}

/**
 * Wrap a run-turn answer so the read-only preflight is answered properly.
 *
 * A real page answers `ping` with page state; a test focused on the run-turn
 * reply shape would otherwise answer it with a run-turn body, and the preflight
 * would (correctly) refuse for `composer_count_unknown`.
 */
function withPing(runTurnAnswer, state = {}) {
  return (port, msg) => {
    if (msg.action === CHATGPT_ACTION.PING) {
      return {
        action: msg.action,
        ok: true,
        href: 'https://chatgpt.com/c/abc123',
        state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, ...state }
      };
    }
    return runTurnAnswer(port, msg);
  };
}

// The fake calls answer(port, msg); the port argument is first so a reply can be
// shaped from what the driver actually wrote.
const PING_REPLY = (port, msg) => ({
  action: msg.action,
  ok: true,
  href: 'https://chatgpt.com/c/abc123',
  title: 'a private conversation title',
  state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 },
  note: 'read-only probe'
});

/* ------------------------------------------------------------ url handling */

test('isChatGptUrl accepts chatgpt.com and nothing else', () => {
  assert.equal(isChatGptUrl('https://chatgpt.com/c/abc'), true);
  assert.equal(isChatGptUrl('https://chatgpt.com/'), true);
  assert.equal(isChatGptUrl('http://chatgpt.com/c/abc'), false, 'http is not the page this adapter serves');
  assert.equal(isChatGptUrl('https://evil.chatgpt.com.attacker.test/'), false);
  assert.equal(isChatGptUrl('https://notchatgpt.com/'), false);
  assert.equal(isChatGptUrl('https://example.com/'), false);
  assert.equal(isChatGptUrl(''), false);
  assert.equal(isChatGptUrl(null), false);
});

test('sanitizeUrl drops query and fragment', () => {
  assert.equal(sanitizeUrl('https://chatgpt.com/c/abc?share=x#f'), 'https://chatgpt.com/c/abc');
  assert.equal(sanitizeUrl('https://example.com/?token=leak'), 'https://example.com/');
  assert.equal(sanitizeUrl('not a url'), null);
});

test('sanitizeTab reduces a tab to id, url and chrome-owned facts', () => {
  const sanitized = sanitizeTab(CHAT_TAB);
  assert.deepEqual(sanitized, {
    tab_id: 7,
    url: 'https://chatgpt.com/c/abc123',
    window_id: 3,
    active: true,
    status: 'complete'
  });
  const blob = JSON.stringify(sanitized);
  assert.equal(blob.includes('secret'), false, 'a query value must not survive');
  assert.equal(blob.includes('title'), false, 'no page title may survive');
});

test('sanitizeTab refuses a non-chatgpt tab and a tab with no id', () => {
  assert.equal(sanitizeTab(OTHER_TAB), null);
  assert.equal(sanitizeTab({ url: 'https://chatgpt.com/' }), null);
  assert.equal(sanitizeTab(null), null);
});

/* --------------------------------------------------------------- list tabs */

test('listTabs returns chatgpt tabs only, sanitized', async () => {
  const { driver: d, api } = driver();
  const result = await d.listTabs();
  assert.equal(result.ok, true);
  assert.equal(result.count, 1);
  assert.equal(result.tabs[0].tab_id, 7);
  assert.deepEqual(api.queries, [{ url: CHATGPT_TAB_PATTERN }]);
  const blob = JSON.stringify(result);
  assert.equal(blob.includes('example.com'), false, 'an unrelated tab must not be listed');
  assert.equal(blob.includes('secret'), false);
});

test('listTabs reports a failure instead of throwing when tabs.query fails', async () => {
  const { driver: d } = driver({ queryThrows: true });
  const result = await d.listTabs();
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.QUERY_FAILED);
  assert.deepEqual(result.tabs, []);
});

test('a driver with no chrome.tabs reports tabs_unavailable', async () => {
  const d = createChatGPTPortDriver({ chrome: {}, timeouts: FAST });
  const result = await d.listTabs();
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.NO_TABS_API);
});

/* -------------------------------------------------------------------- ping */

test('ping connects with the content-script port name and returns sanitized facts', async () => {
  const { driver: d, opened } = driver({ answer: PING_REPLY });
  const result = await d.ping({});
  assert.equal(result.ok, true);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].name, CHATGPT_PORT_NAME);
  assert.equal(opened[0].tabId, 7);
  assert.deepEqual(opened[0].posted, [{ action: CHATGPT_ACTION.PING }]);
  assert.equal(result.tab.tab_id, 7);
  assert.deepEqual(result.state, {
    generating: false,
    send_present: true,
    send_disabled: false,
    // The count is preserved end to end: the preflight cannot distinguish one
    // composer from two if this field is dropped in transit.
    composer_visible_count: 1,
    // This fixture predates `sendControlCount`; absence must stay visible as
    // null rather than being invented as zero.
    send_control_count: null
  });
  // The page title is conversation content: it must not come back.
  assert.equal(JSON.stringify(result).includes('private conversation title'), false);
  assert.equal(opened[0].disconnected, true, 'the one-shot port is released');
});

test('sanitizeState carries sendControlCount only as a validated nonnegative integer', async () => {
  const cases = [
    [1, 1],
    [0, 0],
    ['1', null],
    [-1, null],
    [1.5, null],
    [undefined, null]
  ];
  for (const [raw, expected] of cases) {
    const { driver: d } = driver({
      answer: (port, msg) => ({
        action: msg.action,
        ok: true,
        href: 'https://chatgpt.com/c/abc',
        state: { generating: false, sendPresent: true, sendDisabled: false, sendControlCount: raw, composer_visible_count: 1 }
      })
    });
    const result = await d.ping({});
    assert.equal(result.state.send_control_count, expected, `sendControlCount ${JSON.stringify(raw)}`);
  }
});

test('ping without an answer reports content_timeout and does not hang', async () => {
  const { driver: d } = impatientDriver({}); // silent page
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.match(result.error, /nothing is retried automatically/);
});

test('ping against a tab with no content script reports no_content_script', async () => {
  const { driver: d } = driver({ connectThrows: true });
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.NO_CONTENT_SCRIPT);
});

test('ping refuses a tab id that is not a chatgpt tab', async () => {
  const { driver: d, opened } = driver({ answer: PING_REPLY });
  const result = await d.ping({ tab_id: 9 });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.NOT_A_CHATGPT_TAB);
  assert.equal(opened.length, 0, 'a non-chatgpt tab must never be connected to');
});

test('ping with no chatgpt tab open reports no_chatgpt_tab', async () => {
  const { driver: d } = driver({ tabs: [], answer: PING_REPLY });
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.NO_CHATGPT_TAB);
});

test('a reply for a different action is refused, not accepted', async () => {
  const { driver: d } = driver({ answer: (port, msg) => ({ action: 'read-final', ok: true }) });
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.REPLY_MISMATCH);
});

test('an unknown action reported by the content script is surfaced', async () => {
  const { driver: d } = driver({
    answer: (port, msg) => ({ action: msg.action, ok: false, reason: CHATGPT_ERROR.UNKNOWN_ACTION, error: 'no action' })
  });
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.UNKNOWN_ACTION);
});

test('a non-object reply is refused rather than treated as a result', async () => {
  const { driver: d } = driver({ answer: () => 'pong' });
  const result = await d.ping({});
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.MALFORMED_REPLY);
});

/* ---------------------------------------------------------------- run turn */

test('runTurn refuses without an explicit user_gesture and opens no port', async () => {
  const { driver: d, opened } = driver({ answer: (p, m) => ({ action: m.action, ok: true }) });
  for (const command of [
    {},
    { user_gesture: false },
    { user_gesture: 'true' },
    { user_gesture: 1 },
    { text: 'hi', correlation_id: 't' }
  ]) {
    const result = await d.runTurn(command);
    assert.equal(result.ok, false, JSON.stringify(command));
    assert.equal(result.code, CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED);
  }
  assert.equal(opened.length, 0, 'nothing may reach the page without an explicit gesture');
});

test('runTurn validates its arguments before touching a tab', async () => {
  const { driver: d, opened } = driver({});
  const cases = [
    // Authorisation is checked before content: a turn with no approval is
    // refused for that reason, whatever else is wrong with it.
    [{ user_gesture: true }, CHATGPT_ERROR.APPROVAL_REQUIRED],
    [{ ...GATE, text: undefined }, CHATGPT_ERROR.TEXT_REQUIRED],
    [{ ...GATE, text: '   ' }, CHATGPT_ERROR.TEXT_REQUIRED],
    [{ ...GATE, text: 'x'.repeat(9000) }, CHATGPT_ERROR.TEXT_TOO_LONG],
    [{ ...GATE, correlation_id: undefined }, CHATGPT_ERROR.CORRELATION_REQUIRED],
    [{ ...GATE, correlation_id: '' }, CHATGPT_ERROR.CORRELATION_REQUIRED]
  ];
  for (const [command, code] of cases) {
    const result = await d.runTurn(command);
    assert.equal(result.ok, false, JSON.stringify(command).slice(0, 60));
    assert.equal(result.code, code);
  }
  assert.equal(opened.length, 0);
});

test('runTurn submits exactly one gesture-flagged turn and returns a validated envelope', async () => {
  // One envelope object: createEnvelope() mints a fresh message_id per call, so
  // building a second one for the comparison would compare two different ids.
  const expected = acceptedEnvelope();
  const { driver: d, opened } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: true,
      verdict: { ...verdictForEnvelope(expected), private_test_field: 'must not be echoed by default' },
      envelope: expected,
      // content.js's runTurn reply carries sendState(), which now includes the
      // composer count, so it must survive the trip back.
      state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 }
    }))
  });

  const result = await d.runTurn({
    ...GATE,
    text: 'hello there',
    correlation_id: 'task-1',
    expected_reply_token: 'ACK-1'
  });

  assert.equal(result.ok, true, `DEBUG ${JSON.stringify(result).slice(0, 300)}`);
  // The preflight probes read-only, then exactly one run-turn is submitted.
  assert.deepEqual(opened.flatMap((p) => p.posted.map((m) => m.action)), [CHATGPT_ACTION.PING, CHATGPT_ACTION.RUN_TURN]);
  assert.deepEqual(opened[1].posted, [{
    action: CHATGPT_ACTION.RUN_TURN,
    user_gesture: true,
    text: 'hello there',
    correlation_id: 'task-1',
    expected_reply_token: 'ACK-1',
    timeout_ms: ROOMY.run
  }]);
  assert.deepEqual(result.state, {
    generating: false,
    send_present: true,
    send_disabled: false,
    composer_visible_count: 1,
    send_control_count: null
  });
  assert.equal(result.envelope.message_id, expected.message_id);
  assert.equal(JSON.stringify(result).includes('must not be echoed by default'), false);
  assert.equal(opened[0].disconnected, true);
});

test('runTurn refuses an accepted turn whose envelope is invalid', async () => {
  const broken = acceptedEnvelope();
  delete broken.event_type;
  const { driver: d } = driver({
    answer: withPing((port, msg) => ({ action: msg.action, ok: true, verdict: verdictForEnvelope(broken), envelope: broken }))
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.INVALID_ENVELOPE);
  assert.equal(result.envelope, null);
});

test('runTurn reports a non-correlated turn as a refusal, never a success', async () => {
  const { driver: d } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: false,
      verdict: { accepted: false, reason: 'correlation_mismatch' },
      envelope: null
    }))
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.submitted, true, 'it did submit; that is reported honestly');
  assert.equal(result.envelope, null);
});

test('an early named refusal keeps the content reason instead of no_reason', async () => {
  // content.js answers the send_button_disabled branch with `reason` and no
  // `verdict`. Absence of a verdict is not "no reason", and absence of a
  // `submitted` field is not proof that nothing was sent.
  const { driver: d } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: false,
      reason: 'send_button_disabled',
      error: 'the send control stayed disabled after the composer was filled; nothing was submitted',
      state: { generating: false, sendPresent: true, sendDisabled: true, sendControlCount: 1, composer_visible_count: 1 }
    }))
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.error, 'turn_refused: send_button_disabled');
  assert.equal(result.verdict.reason, 'send_button_disabled');
  assert.equal(result.captured, false);
  assert.equal(result.submitted, true, 'an absent submitted field is not an explicit no-send');
  assert.notEqual(result.uncertain, false, 'only an explicit no-send may settle the uncertainty');
});

test('an explicit submitted:false is propagated but still consumes the correlation', async () => {
  const written = [];
  const memory = {};
  const storage = {
    local: {
      async get(key) { return Object.prototype.hasOwnProperty.call(memory, key) ? { [key]: memory[key] } : {}; },
      async set(entry) {
        written.push(entry);
        Object.assign(memory, entry);
      }
    }
  };
  const fake = fakeTabs({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: false,
      reason: 'send_button_disabled',
      error: 'the send control stayed disabled; nothing was submitted',
      no_send: true,
      submitted: false,
      state: { generating: false, sendPresent: true, sendDisabled: true, sendControlCount: 1, composer_visible_count: 1 }
    }))
  });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });

  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.submitted, false, 'an explicit content-script field is the only proof of no-send');
  assert.equal(result.uncertain, false, 'a proven no-send is a definite outcome');
  assert.equal(result.captured, false);
  assert.equal(result.verdict.reason, 'send_button_disabled');

  // A proven no-send is still not a free retry: the reservation was written
  // before the page was touched and remains consumed.
  assert.ok(written.length > 0, 'the dispatch was recorded');
  const again = await d.runTurn(GATE);
  assert.equal(again.code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  assert.equal(
    fake.opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN).length,
    1,
    'the page was asked to run exactly once'
  );
});

test('a silent page makes runTurn time out rather than retrying', async () => {
  // The preflight is answered, so what times out is the RUN itself.
  const { driver: d, opened } = impatientDriver({
    answer: (port, msg) => (msg.action === CHATGPT_ACTION.PING
      ? pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 })(port, msg)
      : null)
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal(opened.flatMap((p) => p.posted.map((m) => m.action)).filter((a) => a === 'run-turn').length, 1,
    'a timeout must not produce a second attempt');
});

test('a second turn while one is in flight is refused without opening a port', async () => {
  // One driver, one gated port: the first turn is held open so the in-flight
  // guard is actually observable.
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const opened = [];
  const d = createChatGPTPortDriver({
    chrome: {
      storage: memoryStorage(),
      tabs: {
        query: async () => [CHAT_TAB],
        connect: () => {
          const listeners = { message: [], disconnect: [] };
          const port = {
            posted: [],
            postMessage(msg) {
              port.posted.push(msg);
              const reply = msg.action === CHATGPT_ACTION.PING
                ? {
                  action: msg.action,
                  ok: true,
                  href: 'https://chatgpt.com/c/abc',
                  state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 }
                }
                : acceptedAdapterReply({ correlationId: msg.correlation_id, token: msg.expected_reply_token });
              // The preflight probe answers immediately; only the TURN is held
              // open, or the gate would block the probe that precedes it.
              if (msg.action === CHATGPT_ACTION.PING) {
                for (const f of listeners.message) f(reply);
                return;
              }
              gate.then(() => {
                for (const f of listeners.message) f(reply);
              });
            },
            disconnect() {},
            onMessage: { addListener: (f) => listeners.message.push(f) },
            onDisconnect: { addListener: (f) => listeners.disconnect.push(f) }
          };
          opened.push(port);
          return port;
        }
      }
    },
    timeouts: { ...FAST, run: 2000 },
    graceMs: 100
  });

  const first = d.runTurn({ ...GATE, text: 'one' });
  // Wait for the port to actually exist rather than assuming a tick was enough.
  await waitFor(() => opened.length === 2, 'the first turn to open its port after the preflight');
  const second = await d.runTurn({ ...GATE, text: 'two' });

  assert.equal(second.ok, false);
  assert.equal(second.code, CHATGPT_ERROR.TURN_IN_FLIGHT);
  assert.equal(opened.length, 2, 'the refused turn must not open a further port');

  release();
  const settled = await first;
  assert.equal(settled.ok, true);
  const submitted = opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN);
  assert.deepEqual(submitted.map((m) => m.text), ['one'], 'only the first turn reached the page');
});

test('a page that navigates mid-turn reports port_closed', async () => {
  // The preflight succeeds, then the tab goes away while the turn is in flight.
  const { driver: d, opened } = driver({
    answer: (port, msg) => (msg.action === CHATGPT_ACTION.PING
      ? pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 })(port, msg)
      : null)
  });
  const promise = d.runTurn(GATE);
  await waitFor(() => opened.length >= 2, 'the turn to open its port after the preflight');
  opened[opened.length - 1].kill();
  const result = await promise;
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.PORT_CLOSED);
  assert.equal(opened.flatMap((p) => p.posted.map((m) => m.action)).filter((a) => a === 'run-turn').length, 1,
    'a closed port must not be retried');
});

test('a submission also requires the approval it acts under', async () => {
  const { driver: d, opened } = driver({ answer: (p, m) => ({ action: m.action, ok: true }) });
  for (const scope of [undefined, '', '   ', 42]) {
    const result = await d.runTurn({ user_gesture: true, text: 'hi', correlation_id: 'task-1', approved_scope_ref: scope });
    assert.equal(result.ok, false, String(scope));
    assert.equal(result.code, CHATGPT_ERROR.APPROVAL_REQUIRED);
    assert.equal(result.submitted, false);
  }
  assert.equal(opened.length, 0, 'a gesture without an approval must not reach the page');
});

test('a dispatch reservation survives a restart and blocks a duplicate submission', async () => {
  // Generation 1 submits task-1 and records the reservation durably.
  const bag = new Map();
  const storage = {
    local: {
      async get(key) { return bag.has(key) ? { [key]: bag.get(key) } : {}; },
      async set(entry) { for (const [k, v] of Object.entries(entry)) bag.set(k, JSON.parse(JSON.stringify(v))); }
    }
  };
  let submitted = 0;
  const answer = withPing((p, m) => {
    submitted += 1;
    return acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token });
  });

  const first = createChatGPTPortDriver({ chrome: { tabs: fakeTabs({ answer }).api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  const one = await first.runTurn(GATE);
  assert.equal(one.ok, true);
  assert.equal(submitted, 1);

  // Generation 2: a brand-new driver, brand-new JS state, same storage.
  const second = createChatGPTPortDriver({ chrome: { tabs: fakeTabs({ answer }).api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  const two = await second.runTurn(GATE);
  assert.equal(two.ok, false, 'a completed dispatch must never be repeated automatically');
  assert.equal(two.code, CHATGPT_ERROR.ALREADY_DISPATCHED);
  assert.equal(submitted, 1, 'the page was touched exactly once, across a restart');

  // A distinct operation is allowed after a fully checked prior reply; it is
  // not a replay of the original correlation or stable operation.
  const other = await second.runTurn({ ...GATE, correlation_id: 'task-2' });
  assert.equal(other.ok, true);
  assert.equal(submitted, 2);
});

test('a reservation is written BEFORE the page is touched', async () => {
  const openedAtWrite = [];
  let opened = 0;
  const storage = {
    local: {
      async get() { return {}; },
      async set() { openedAtWrite.push(opened); }
    }
  };
  const fake = fakeTabs({ answer: withPing((p, m) => {
    opened += 1;
    return acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token });
  }) });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  await d.runTurn(GATE);
  assert.ok(openedAtWrite.length >= 2, `expected a reservation write, got ${openedAtWrite.length}`);
  // The FIRST write is the in-flight reservation and must precede any page
  // contact; the later ones settle the reservation afterwards.
  assert.equal(openedAtWrite[0], 0, 'nothing may reach the page before the dispatch is recorded');
  assert.equal(opened, 1);
});

/* -------------------------------------------------------------- read final */

test('readFinal needs no gesture, sends only read-final, and returns the verdict', async () => {
  // The capture is a REAL one, envelope and all: a claimed accepted read with
  // nothing to check it against is a contract mismatch, not a correlated final
  // reply (tests/chatgpt-submit-observe.test.js holds that boundary).
  const { driver: d, opened } = driver({
    answer: (port, msg) => ({
      ...acceptedAdapterReply({ correlationId: msg.correlation_id, token: msg.expected_reply_token }),
      action: msg.action,
      generation: { complete: true, asserted_by_caller: true }
    })
  });

  const result = await d.readFinal({ correlation_id: 'task-1', expected_reply_token: 'ACK-1', generation_complete: true });
  assert.equal(result.ok, true);
  assert.equal(result.read_only, true);
  assert.equal(opened[0].posted.length, 1);
  const sent = opened[0].posted[0];
  assert.equal(sent.action, CHATGPT_ACTION.READ_FINAL);
  assert.equal('user_gesture' in sent, false, 'reading must never imply a gesture');
  assert.equal('text' in sent, false, 'readFinal must not be able to compose');
  assert.equal(result.generation.complete, true);
});

test('readFinal never sends a run command even if asked to', async () => {
  const { driver: d, opened } = driver({
    answer: (port, msg) => ({ action: msg.action, ok: true, verdict: { accepted: false, reason: 'no_final_block' } })
  });
  // A caller trying to smuggle an action through an unrelated field.
  const result = await d.readFinal({ correlation_id: 'task-1', action: CHATGPT_ACTION.RUN_TURN, text: 'send this' });
  assert.equal(result.ok, false);
  assert.equal(opened[0].posted[0].action, CHATGPT_ACTION.READ_FINAL);
  assert.equal('text' in opened[0].posted[0], false);
});

test('readFinal rejects a non-string correlation id', async () => {
  const { driver: d, opened } = driver({});
  const result = await d.readFinal({ correlation_id: 42 });
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.BAD_ARGUMENT);
  assert.equal(opened.length, 0);
});

/* ==================================================== class-only DOM fixture */

/**
 * A fixture DOM, not a real one.
 *
 * WHY THIS EXISTS. It was previously recorded that a fixture could not exercise
 * the capture path because it has no `data-message-author-role` attributes.
 * That is wrong: content.js `classifyNode` matches `[class*="user-message"]`,
 * `[class*="MarkdownRoot-"]` and `.markdown` as fallbacks, and
 * `readOrderedTurns` includes all of them in its query. This stub proves it by
 * running content.js's REAL read path over markup that carries class selectors
 * only, then feeding the verdict through the driver's real reply path.
 *
 * It implements only the five selector forms that path uses. A stub that grew a
 * general CSS engine would be a worse test, because it would silently agree with
 * whatever the fixture happens to contain.
 */
function createFixtureDom({ trailingUser = false } = {}) {
  const matchers = {
    '[data-message-author-role="user"]': (n) => n.attrs.role === 'user',
    '[data-message-author-role="assistant"]': (n) => n.attrs.role === 'assistant',
    '[class*="user-message"]': (n) => String(n.attrs.class || '').includes('user-message'),
    '[class*="MarkdownRoot-"]': (n) => String(n.attrs.class || '').includes('MarkdownRoot-'),
    '.markdown': (n) => String(n.attrs.class || '').split(/\s+/).includes('markdown')
  };

  const make = (attrs, text, children = []) => {
    const node = {
      attrs,
      textContent: text,
      innerText: text,
      children,
      parent: null
    };
    for (const child of children) child.parent = node;

    node.matches = (selector) => {
      const fn = matchers[selector];
      return typeof fn === 'function' && fn(node);
    };
    node.closest = (selector) => {
      const parts = selector.split(',').map((s) => s.trim());
      for (let cur = node; cur; cur = cur.parent) {
        if (parts.some((p) => typeof matchers[p] === 'function' && matchers[p](cur))) return cur;
      }
      return null;
    };
    node.contains = (other) => {
      if (other === node) return true;
      return node.children.some((c) => c.contains(other));
    };
    node.querySelector = (selector) => {
      for (const child of node.children) {
        if (child.matches(selector)) return child;
        const deeper = child.querySelector(selector);
        if (deeper) return deeper;
      }
      return null;
    };
    return node;
  };

  // The document order is the fixture's whole point: a user turn, then the
  // answer that follows it.
  const userText = 'probe please task-1';
  const answerText = ['ACK-1', 'task-1', 'The class-only fixture answer.'].join('\n');
  const userBlock = make({ class: 'group/user-message' }, userText);
  const markdown = make({ class: 'markdown' }, answerText);
  const assistantBlock = make({ class: 'MarkdownRoot-fixture' }, '', [markdown]);
  const order = [userBlock, assistantBlock];
  // The "asked, not yet answered" shape: a user turn with nothing after it.
  if (trailingUser) order.push(make({ class: 'group/user-message' }, 'a second probe task-1'));

  // A comma-separated selector list returns nodes in DOCUMENT order, which is the
  // property content.js's read path depends on to pair an answer with the turn
  // that follows it. Filtering the document (rather than grouping per selector)
  // is what preserves that; grouping silently reorders, and would let an earlier
  // answer be attributed to a later question.
  const all = (selector) => {
    const parts = selector.split(',').map((part) => part.trim())
      .filter((part) => typeof matchers[part] === 'function');
    return order.filter((node) => parts.some((part) => matchers[part](node)));
  };

  return {
    order,
    userText,
    answerText,
    document: {
      querySelectorAll: (selector) => all(selector),
      querySelector: () => null,
      title: 'class-only fixture'
    },
    location: { origin: 'https://chatgpt.com', pathname: '/c/fixture' }
  };
}

/**
 * Run content.js's real read path over the fixture.
 *
 * Installs the stub on globalThis for the duration only: content.js is a page
 * script, and importing it under Node must not leave a document behind for the
 * rest of the suite.
 */
async function readFixtureVerdict() {
  const fixture = createFixtureDom();
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  globalThis.document = fixture.document;
  globalThis.location = fixture.location;
  try {
    const content = await import('../src/chatgpt/content.js');
    const correlate = await import('../src/chatgpt/correlate.js');
    const captured = content.__testing.readFinalReplyAfterLastUserTurn();
    assert.equal(captured.ok, true, captured.error);
    assert.equal(captured.waited_for_user_turn, true, 'the fixture has a user turn to read after');
    assert.ok(captured.blocks.length > 0, 'class-only markup must yield an assistant block');

    const extracted = correlate.extractFinalReply(captured.blocks, { source: 'dom-assistant-turn' });
    assert.equal(extracted.ok, true, extracted.detail);
    const verdict = correlate.correlateReply({
      reply: extracted.text,
      expected: { correlation_id: 'task-1', reply_token: 'ACK-1' },
      outbound_text: fixture.userText,
      role: 'assistant',
      channel: 'final',
      source: 'dom-assistant-turn',
      generation_complete: true,
      generation_started: true
    });
    assert.equal(verdict.accepted, true, `fixture verdict must accept: ${verdict.detail}`);
    return { fixture, verdict };
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousLocation === undefined) delete globalThis.location; else globalThis.location = previousLocation;
  }
}

test('a class-only fixture (no data-message-author-role) is readable and correlates', async () => {
  const { fixture } = await readFixtureVerdict();
  // The premise being retired: this markup has no role attributes at all.
  assert.equal(fixture.order.every((n) => n.attrs.role === undefined), true);
  assert.match(fixture.order[1].attrs.class, /MarkdownRoot-/);
});

test('the driver accepts a run reply derived from a class-only fixture', async () => {
  const { verdict } = await readFixtureVerdict();
  const { driver: d, opened } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: true,
      verdict,
      envelope: acceptedAdapterReply({ replyText: verdict.reply }).envelope,
      state: { generating: false, sendPresent: true, sendDisabled: false }
    }))
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, true, `DEBUG ${JSON.stringify(result).slice(0, 300)}`);
  assert.equal(result.captured, true);
  assert.equal(result.correlation_id, 'task-1');
  assert.equal(opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN).length, 1);
});

test('a fixture turn with no answer after it yields no final block, and no capture', async () => {
  // The negative half of the fixture: a user turn is last, so nothing may be
  // extracted as an answer. This is the case that must never be papered over by
  // reading the PREVIOUS answer, which is exactly what the old tab-order bug did.
  const fixture = createFixtureDom({ trailingUser: true });
  const previousDocument = globalThis.document;
  globalThis.document = fixture.document;
  try {
    const content = await import('../src/chatgpt/content.js');
    const correlate = await import('../src/chatgpt/correlate.js');
    const captured = content.__testing.readFinalReplyAfterLastUserTurn();
    assert.equal(captured.blocks.length, 0, 'the earlier answer must not be offered as this turn\'s');
    const extracted = correlate.extractFinalReply(captured.blocks, { source: 'dom-assistant-turn' });
    assert.equal(extracted.ok, false);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }

  // And the driver, handed that refusal, reports a refusal rather than a capture.
  const { driver: d } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: false,
      verdict: { accepted: false, reason: 'no_final_block' },
      envelope: null
    }))
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TURN_REFUSED);
  assert.equal(result.captured, false);
  assert.equal(result.envelope, null);
});

/* ------------------------------------------------------------------ misc */

/* ======================================================== preflight refusal */

/** A ping reply shaped like content.js `sendState()` with a composer count. */
function pingWith(state) {
  return (port, msg) => ({ action: msg.action, ok: true, href: 'https://chatgpt.com/c/abc', state });
}

test('runTurn refuses before submitting when the page reports no composer', async () => {
  const { driver: d, opened } = driver({
    answer: pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 0 })
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.PREFLIGHT_REFUSED);
  assert.equal(result.reason, 'composer_missing');
  assert.equal(result.composer_visible_count, 0);
  assert.equal(result.submitted, false);
  // Only the read-only probe was sent. No run-turn ever reached the page.
  assert.deepEqual(opened.flatMap((p) => p.posted.map((m) => m.action)), ['ping']);
});

test('runTurn refuses when two composers are visible', async () => {
  const { driver: d, opened } = driver({
    answer: pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 2 })
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'composer_ambiguous');
  assert.equal(result.composer_visible_count, 2);
  assert.deepEqual(opened.flatMap((p) => p.posted.map((m) => m.action)), ['ping']);
});

test('runTurn refuses when a generation is already running', async () => {
  const { driver: d, opened } = driver({
    answer: pingWith({ generating: true, sendPresent: false, sendDisabled: true, composer_visible_count: 1 })
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'generation_active');
  assert.deepEqual(opened.flatMap((p) => p.posted.map((m) => m.action)), ['ping']);
});

test('runTurn refuses when the page reports no composer count at all', async () => {
  // An older content script cannot be preflighted, and "cannot check" is not
  // "safe to proceed".
  const { driver: d, opened } = driver({
    answer: (port, msg) => ({ action: msg.action, ok: true, href: 'https://chatgpt.com/c/abc', state: { generating: false, sendPresent: true, sendDisabled: false } })
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'composer_count_unknown');
  assert.deepEqual(opened.flatMap((p) => p.posted.map((m) => m.action)), ['ping']);
});

test('runTurn refuses before reserving or running when the page reports no send control', async () => {
  const written = [];
  const storage = {
    local: {
      async get() { return {}; },
      async set(entry) { written.push(entry); }
    }
  };
  const actions = [];
  const fake = fakeTabs({
    answer: (port, msg) => {
      actions.push(msg.action);
      if (msg.action === CHATGPT_ACTION.PING) {
        return pingWith({
          generating: false,
          sendPresent: false,
          sendDisabled: true,
          sendControlCount: 0,
          composer_visible_count: 1
        })(port, msg);
      }
      return acceptedAdapterReply({ correlationId: msg.correlation_id, token: msg.expected_reply_token });
    }
  });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  const result = await d.runTurn(GATE);

  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.PREFLIGHT_REFUSED);
  assert.equal(result.reason, 'send_missing');
  assert.equal(result.send_control_count, 0);
  assert.equal(result.submitted, false);
  assert.deepEqual(actions, ['ping'], 'only the read-only probe reached the page');
  assert.equal(written.length, 0, 'a missing send control must not burn a reservation');
});

test('runTurn refuses when two send controls make the target ambiguous', async () => {
  const fake = fakeTabs({
    answer: (port, msg) => {
      if (msg.action === CHATGPT_ACTION.PING) {
        return pingWith({
          generating: false,
          sendPresent: true,
          sendDisabled: false,
          sendControlCount: 2,
          composer_visible_count: 1
        })(port, msg);
      }
      return acceptedAdapterReply({ correlationId: msg.correlation_id, token: msg.expected_reply_token });
    }
  });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs }, timeouts: ROOMY, ...NO_GRACE });
  const result = await d.runTurn(GATE);

  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.PREFLIGHT_REFUSED);
  assert.equal(result.reason, 'send_ambiguous');
  assert.equal(result.send_control_count, 2);
  assert.equal(result.submitted, false);
  assert.deepEqual(
    fake.opened.flatMap((p) => p.posted.map((m) => m.action)),
    ['ping'],
    'nothing may be typed or run when the submit control is ambiguous'
  );
});

test('a validated send count of one but sendPresent:false is refused as missing', async () => {
  const fake = fakeTabs({
    answer: (port, msg) => {
      if (msg.action === CHATGPT_ACTION.PING) {
        return pingWith({
          generating: false,
          sendPresent: false,
          sendDisabled: true,
          sendControlCount: 1,
          composer_visible_count: 1
        })(port, msg);
      }
      return acceptedAdapterReply({ correlationId: msg.correlation_id, token: msg.expected_reply_token });
    }
  });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs }, timeouts: ROOMY, ...NO_GRACE });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'send_missing');
  assert.deepEqual(fake.opened.flatMap((p) => p.posted.map((m) => m.action)), ['ping']);
});

test('a validated send count of one with sendPresent:true proceeds', async () => {
  const expected = acceptedEnvelope();
  const { driver: d, opened } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: true,
      verdict: verdictForEnvelope(expected),
      envelope: expected,
      state: { generating: false, sendPresent: true, sendDisabled: false, sendControlCount: 1, composer_visible_count: 1 }
    }), { sendControlCount: 1 })
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, true);
  assert.equal(result.state.send_control_count, 1);
  assert.equal(opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN).length, 1);
});

test('a refused preflight leaves no dispatch reservation behind', async () => {
  const written = [];
  const storage = {
    local: {
      async get() { return {}; },
      async set(entry) { written.push(entry); }
    }
  };
  const fake = fakeTabs({ answer: pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 0 }) });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(written.length, 0, 'a preflight refusal must not burn a reservation on work that never happened');
});

/* ==================================================== fail-closed reservation */

test('an unreadable reservation store refuses the dispatch and never runs it', async () => {
  const storage = {
    local: {
      async get() { throw new Error('storage unavailable'); },
      async set() { throw new Error('storage unavailable'); }
    }
  };
  const fake = fakeTabs({ answer: (p, m) => (m.action === 'ping'
    ? pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 })(p, m)
    : acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token })) });
  const d = createChatGPTPortDriver({ chrome: { tabs: fake.api.tabs, storage }, timeouts: ROOMY, ...NO_GRACE });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false, 'an unreadable store must not read as "nothing dispatched"');
  assert.equal(result.code, CHATGPT_ERROR.RESERVATION_FAILED);
  assert.equal(result.submitted, false);
  assert.equal(result.correlation_id, 'task-1');
  // Accurate claim: the read-only preflight may have opened a port, but no
  // `run-turn` may ever have been written.
  const actions = fake.opened.flatMap((p) => p.posted.map((m) => m.action));
  assert.equal(actions.includes('run-turn'), false, 'no run may reach the page');
  assert.equal(actions.filter((a) => a === 'ping').length, 1, 'only the read-only probe ran');
});

test('the driver exposes no retry, reconnect or send capability', () => {
  const { driver: d } = driver();
  // A one-shot port driver. Anything that could re-submit a turn is absent by
  // construction, not merely unused.
  assert.equal(d.retry, undefined);
  assert.equal(d.reconnect, undefined);
  assert.equal(d.send, undefined);
  assert.equal(d.autoRun, undefined);
  assert.equal(d.portName, CHATGPT_PORT_NAME);
});

test('no credential access appears anywhere in the driver', async () => {
  const source = await import('node:fs/promises');
  const raw = await source.readFile(new URL('../src/background/chatgpt-port.js', import.meta.url), 'utf8');
  // Comments are stripped first, on purpose: this file NAMES the credential
  // surfaces in prose precisely to say they are never read, and a naive grep
  // would punish that. What must not exist is executable access.
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const forbidden of ['document.cookie', 'localStorage', '__NEXT_DATA__', 'accessToken', 'access_token', 'sessionStorage', 'indexedDB', 'chrome.cookies', 'fetch(', 'XMLHttpRequest']) {
    assert.equal(code.includes(forbidden), false, `chatgpt-port.js must not execute ${forbidden}`);
  }
  // The only host surface it touches is tabs.query / tabs.connect.
  assert.deepEqual([...code.matchAll(/api\.tabs\.(\w+)/g)].map((m) => m[1]), ['query', 'connect']);
});

/* ============================================ bounded budgets (M1 live fix) */

test('the run ceiling outlasts the latency that was actually observed', () => {
  // The 2026-10-18 dispatch was refused `generation_incomplete` because a real
  // turn outlived a 120s page budget and the candidate was read mid-generation.
  // This is the exact regression: the budget must be well above that, and it must
  // still be a finite number — "wait longer" is not the same as "wait forever".
  assert.ok(MAX_RUN_TIMEOUT_MS > 120_000,
    `the run ceiling must exceed the observed >120s turn latency, got ${MAX_RUN_TIMEOUT_MS}ms`);
  assert.ok(Number.isFinite(MAX_RUN_TIMEOUT_MS) && Number.isFinite(MAX_PORT_GUARD_MS),
    'both ceilings are finite numbers');
});

test('the port guard outlives the run budget, and the default run budget IS the ceiling', () => {
  // The worker's own wait is the page's budget plus a grace, capped. It must
  // exceed the page's budget, or the worker gives up while the page is still
  // allowed to be working — the panel would then see the worker's timeout
  // instead of the page's real refusal.
  assert.ok(MAX_PORT_GUARD_MS > MAX_RUN_TIMEOUT_MS,
    'the port guard must outlast the page budget it guards');
  assert.ok(MAX_PORT_GUARD_MS >= MAX_RUN_TIMEOUT_MS + DEFAULT_CHATGPT_GRACE_MS,
    'the grace the worker adds must still fit inside the port-guard ceiling');
  // The DEFAULT is the ceiling, so a caller that asks for nothing gets the same
  // budget the ceiling allows. A lower default would leave the ceiling to be
  // reached only by explicitly asking for it.
  assert.equal(DEFAULT_CHATGPT_TIMEOUTS.run, MAX_RUN_TIMEOUT_MS);
});

test('valid work budgets clamp; malformed budgets refuse before touching the page', async () => {
  // Three shapes, one clamp. These exercise `boundedTimeout()` through the real
  // public path against PRODUCTION budgets — the value that reaches the page is
  // what is asserted, not the helper's return value. The page answers at once, so
  // the 300s budgets are never waited out; the per-test deadline catches a hang.
  const cases = [
    { label: 'absent', timeout_ms: undefined, expected: MAX_RUN_TIMEOUT_MS },
    { label: 'far above the ceiling', timeout_ms: MAX_RUN_TIMEOUT_MS * 1000, expected: MAX_RUN_TIMEOUT_MS },
    { label: 'negative', timeout_ms: -5000 },
    { label: 'not a number', timeout_ms: 'forever' },
    { label: 'infinite', timeout_ms: Infinity },
    { label: 'zero', timeout_ms: 0 },
    { label: 'a genuine smaller ask is honoured, not raised', timeout_ms: 45_000, expected: 45_000 }
  ];
  for (const { label, timeout_ms, expected } of cases) {
    const fake = fakeTabs({
      answer: withPing((port, msg) => ({
        action: msg.action,
        ok: false,
        verdict: { accepted: false, reason: 'correlation_mismatch' },
        envelope: null
      }))
    });
    // No `timeouts` override: this is the budget the extension actually runs with.
    const d = createChatGPTPortDriver({ chrome: fake.api });
    const command = { ...GATE, text: 'probe', correlation_id: `c-${label}` };
    if (timeout_ms !== undefined) command.timeout_ms = timeout_ms;
    const result = await d.runTurn(command);

    assert.equal(result.ok, false, label);
    const submitted = fake.opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN);
    if (expected === undefined) {
      assert.equal(result.code, CHATGPT_ERROR.BAD_ARGUMENT);
      assert.equal(fake.opened.length, 0);
      continue;
    }
    assert.equal(submitted.length, 1, `${label}: exactly one turn reached the page`);
    assert.equal(submitted[0].timeout_ms, expected,
      `${label}: the page must be handed exactly ${expected}ms, got ${submitted[0].timeout_ms}ms`);
    assert.ok(Number.isFinite(submitted[0].timeout_ms), `${label}: the bound stays finite`);
    assert.ok(submitted[0].timeout_ms <= MAX_RUN_TIMEOUT_MS, `${label}: nothing exceeds the ceiling`);
  }
});

test('the clamp is against the ceiling, not a rewrite to it', async () => {
  // A caller that asks for a smaller budget than the ceiling keeps it: a turn
  // deliberately given a short bound must be reported short, not padded out to
  // the ceiling. The clamp only ever shortens.
  const { driver: d, opened } = driver({
    answer: withPing((port, msg) => ({
      action: msg.action,
      ok: false,
      verdict: { accepted: false, reason: 'correlation_mismatch' },
      envelope: null
    }))
  });
  await d.runTurn({ ...GATE, text: 'probe', correlation_id: 'c-small' });
  const submitted = opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN);
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].timeout_ms, ROOMY.run,
    'a configured run budget below the ceiling is handed through unchanged');
  assert.ok(ROOMY.run < MAX_RUN_TIMEOUT_MS, 'this fixture is only meaningful while ROOMY.run is below the ceiling');
});

test('the port guard outlasts the page budget it guards, in the wiring itself', async () => {
  // The nesting, not just the constants: a page that stays silent until the
  // worker's own budget has run out must produce a driver TIMEOUT, not a hang
  // and not a second attempt. The guard is `min(guard, timeout + grace)`, so a
  // tiny run budget with the production guard ceiling still resolves.
  const { driver: d, opened } = impatientDriver({
    answer: (port, msg) => (msg.action === CHATGPT_ACTION.PING
      ? pingWith({ generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 })(port, msg)
      : null)
  });
  const result = await d.runTurn(GATE);
  assert.equal(result.ok, false);
  assert.equal(result.code, CHATGPT_ERROR.TIMEOUT);
  assert.equal(
    opened.flatMap((p) => p.posted).filter((m) => m.action === CHATGPT_ACTION.RUN_TURN).length,
    1,
    'an exhausted guard must never retry the turn'
  );
});
