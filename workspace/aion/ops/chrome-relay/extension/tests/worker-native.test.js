// Service worker: native relay wiring + own-extension-only endpoints.
//
// A fake `chrome` and a fake native host. No browser, no ACP agent, no page, no
// registry. Every test drives `handleMessage` exactly as Chrome would deliver a
// runtime message, through the same listener the extension installs.
//
// What is held here:
//   1. sender validation fails CLOSED (page, other extension, content script)
//   2. a Port existing is never reported as a connection
//   3. ACP initialize is reported only after a real relay.hello reply, and is
//      never issued automatically
//   4. host events are validated before they are stored; a bad one is refused
//   5. a worker restart reloads retained events and cursor and re-sends NOTHING
//   6. the transport never moves the proof or approval fields
//   7. the chatgpt endpoints are extension-only, one-shot, and gesture-gated
import { test as baseTest } from 'node:test';
import assert from 'node:assert/strict';

/** Hard per-test deadline: a regression must fail, not stall the suite. */
const TEST_TIMEOUT_MS = 5_000;
const test = (name, fn) => baseTest(name, { timeout: TEST_TIMEOUT_MS }, fn);

const EXTENSION_ID = 'kgjfielmhcdlggjppmliabpiljnonhki';

// Imported once; the worker resolves `chrome` lazily per call, so a fake can be
// installed and swapped between tests.
const worker = await import('../src/background/service-worker.js');
const { __testing, RELAY_STATUS, WORKER_ERROR, authorizeSender, installRuntimeListeners, handleMessage } = worker;
const { createEnvelope } = await import('../src/lib/envelope.js');
const { CHATGPT_ACTION, CHATGPT_ERROR } = await import('../src/background/chatgpt-port.js');

/** The action name the worker's read-only preflight sends. */
const CHATGPT_ACTION_PING = CHATGPT_ACTION.PING;

/** A healthy page: one visible composer, not generating. */
function defaultPingReply(message) {
  return {
    action: message.action,
    ok: true,
    href: 'https://chatgpt.com/c/abc',
    state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1 }
  };
}

/* ------------------------------------------------------------------ *
 * Fakes
 * ------------------------------------------------------------------ */

const HOST_REPLY = {
  'relay.ping': () => ({
    type: 'relay.reply',
    ok: true,
    host: { name: 'com.aion.relay', node_id: 'node-native-01', protocol_version: 'aion.relay-nm/0.1' },
    agent: { path: 'C:\\secret\\agent.exe', status: 'idle', running: false }
  }),
  'relay.hello': () => ({
    type: 'relay.reply',
    ok: true,
    protocol_version: 'aion.relay-nm/0.1',
    agent: { path: 'C:\\secret\\agent.exe', status: 'ready', running: true }
  })
};

/**
 * A fake chrome whose native host answers per `replyFor`, and whose tabs hold
 * one chatgpt tab. `posted` records every command the extension sent.
 */
function fakeChrome(options = {}) {
  const storage = new Map();
  const posted = [];
  const listeners = { message: [], installed: [], startup: [], clicked: [], alarm: [] };
  const chatTab = { id: 7, windowId: 1, active: true, status: 'complete', url: 'https://chatgpt.com/c/abc?share=secret#f' };
  const otherTab = { id: 8, windowId: 1, active: false, status: 'complete', url: 'https://example.com/?token=leak' };

  const replyFor = options.replyFor ?? ((type) => HOST_REPLY[type]?.());
  const contentActions = options.contentActions ?? {};
  // Structured transport errors, matching the adapter's onError contract.
  const errors = [];

  const api = {
    runtime: {
      id: EXTENSION_ID,
      lastError: undefined,
      connectNative(name) {
        if (options.hostMissing) throw new Error('Specified native messaging host not found.');
        const nl = { message: [], disconnect: [] };
        const port = {
          name,
          postMessage(message) {
            posted.push(message);
            if (typeof options.onPost === 'function') options.onPost(message, port);
            const reply = replyFor(message.type, message);
            if (reply !== undefined && reply !== null) {
              const framed = { ...reply, id: message.id };
              queueMicrotask(() => { for (const f of nl.message) f(framed); });
            }
          },
          disconnect() { for (const f of nl.disconnect) f({}); },
          onMessage: { addListener: (f) => nl.message.push(f) },
          onDisconnect: { addListener: (f) => nl.disconnect.push(f) },
          kill: () => { for (const f of nl.disconnect) f({}); },
          push: (m) => { for (const f of nl.message) f(m); }
        };
        api.lastPort = port;
        return port;
      },
      onMessage: { addListener: (f) => listeners.message.push(f) },
      onInstalled: { addListener: (f) => listeners.installed.push(f) },
      onStartup: { addListener: (f) => listeners.startup.push(f) }
    },
    storage: {
      local: {
        async get(key) { return storage.has(key) ? { [key]: storage.get(key) } : {}; },
        async set(bag) { for (const [k, v] of Object.entries(bag)) storage.set(k, JSON.parse(JSON.stringify(v))); }
      }
    },
    alarms: {
      create: () => {},
      onAlarm: { addListener: (f) => listeners.alarm.push(f) }
    },
    action: { onClicked: { addListener: (f) => listeners.clicked.push(f) } },
    sidePanel: { open: async () => {} },
    tabs: {
      async query(info) {
        api.queries = (api.queries || []).concat(info);
        return [chatTab, otherTab].filter((t) => t.url.startsWith('https://chatgpt.com'));
      },
      connect(tabId, info) {
        api.connectedPorts = (api.connectedPorts || []).concat({ tabId, name: info && info.name });
        const pl = { message: [], disconnect: [] };
        const port = {
          posted: [],
          postMessage(message) {
            port.posted.push(message);
            // A live page answers the read-only preflight, which the worker
            // performs BEFORE reserving or submitting. A mock that only knows
            // `run-turn` leaves that probe unanswered and the run hangs.
            const declared = contentActions[message.action];
            const answer = declared !== undefined
              ? declared
              : (message.action === CHATGPT_ACTION_PING ? defaultPingReply(message) : undefined);
            const reply = typeof answer === 'function' ? answer(port, message) : answer;
            if (reply !== undefined && reply !== null) {
              queueMicrotask(() => { for (const f of pl.message) f(reply); });
            }
          },
          disconnect() {},
          onMessage: { addListener: (f) => pl.message.push(f) },
          onDisconnect: { addListener: (f) => pl.disconnect.push(f) }
        };
        return port;
      }
    }
  };

  return { api, storage, posted, listeners, chatTab, otherTab, errors };
}

/** Install a fake chrome for one test and tear it down afterwards. */
async function withChrome(options = {}, body) {
  const fake = fakeChrome(options);
  __testing.reset();
  globalThis.chrome = fake.api;
  installRuntimeListeners(fake.api);
  try {
    // Hydrate once up front so the transport exists and every test body starts
    // from the same, already-wired state.
    await handleMessage({ type: 'aion/status' }, extensionPage(), () => {});
    await body(fake);
  } finally {
    // Close the transport before dropping the fake. The adapter owns bounded
    // reconnect timers, and a timer that outlives its test fires into the NEXT
    // test's worker state — which is how a passing suite turns flaky.
    const transport = __testing.transport;
    if (transport && typeof transport.close === 'function') {
      try { transport.close(); } catch { /* already closed */ }
    }
    globalThis.chrome = undefined;
    __testing.reset();
  }
}

/** Deliver a runtime message the way Chrome would, and await the reply. */
function send(message, sender = extensionPage()) {
  return new Promise((resolve) => {
    handleMessage(message, sender, resolve);
  });
}

const extensionPage = (id = EXTENSION_ID) => ({ id, url: `chrome-extension://${id}/src/panel/sidepanel.html` });

function envelope(overrides = {}) {
  return createEnvelope({
    producer_node: 'node-native-01',
    target_node: 'node-ext-01',
    event_type: 'task.progress',
    correlation_id: 'task-1',
    causation_id: 'dispatch-1',
    payload: { note: 'from the host' },
    ...overrides
  });
}

/**
 * Let pending work drain before observing it.
 *
 * Several assertions here read state the worker produces through a promise chain
 * (append serialisation, storage writes, listener callbacks). A fixed sleep makes
 * the scheduler decide when the test looks; draining the macrotask queue plus a
 * bounded number of turns is deterministic and still hard-bounded by the
 * per-test deadline.
 */
async function settle(turns = 6) {
  for (let i = 0; i < turns; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/* ================================================ 1. sender authorisation */

test('sender validation fails closed for anything but this extension', async () => {
  await withChrome({}, async () => {
    const refused = [
      [undefined, 'no_sender'],
      [null, 'no_sender'],
      [{}, 'sender_is_not_this_extension'],
      [{ id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, 'sender_is_not_this_extension'],
      [{ id: EXTENSION_ID, tab: { id: 3, url: 'https://chatgpt.com/' } }, 'sender_is_a_tab'],
      [{ id: EXTENSION_ID, url: 'https://chatgpt.com/' }, 'sender_url_not_an_extension_page'],
      [{ id: EXTENSION_ID, url: `chrome-extension://${EXTENSION_ID}/../../evil.html` }, 'sender_url_not_an_extension_page']
    ];
    for (const [sender, reason] of refused) {
      const verdict = authorizeSender(sender);
      assert.equal(verdict.ok, false, JSON.stringify(sender));
      assert.equal(verdict.reason, reason, JSON.stringify(sender));
    }
    assert.deepEqual(authorizeSender(extensionPage()), { ok: true });
    // An extension page with no url at all is still ours.
    assert.deepEqual(authorizeSender({ id: EXTENSION_ID }), { ok: true });
  });
});

test('an untrusted sender cannot reach any endpoint, and nothing is sent', async () => {
  const hostile = { id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', url: 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/x.html' };
  await withChrome({}, async (fake) => {
    for (const type of ['aion/status', 'aion/native-ping', 'aion/native-hello', 'aion/chatgpt-tabs', 'aion/chatgpt-run']) {
      const reply = await send({ type }, hostile);
      assert.equal(reply.ok, false, type);
      assert.equal(reply.code, WORKER_ERROR.SENDER_UNTRUSTED, type);
    }
    assert.deepEqual(fake.posted, [], 'an untrusted sender must never cause a host command');
    assert.equal(fake.api.connectedPorts, undefined, 'and never reaches a tab');
  });
});

test('a content script cannot use runtime messaging; the tab port is the only path', async () => {
  await withChrome({}, async (fake) => {
    const reply = await send({ type: 'aion/chatgpt-run', command: { text: 'x', user_gesture: true } }, {
      id: EXTENSION_ID,
      tab: { id: 7, url: 'https://chatgpt.com/c/abc' }
    });
    assert.equal(reply.ok, false);
    assert.equal(reply.code, WORKER_ERROR.SENDER_UNTRUSTED);
    assert.equal(fake.api.connectedPorts, undefined);
  });
});

/* ================================================== 2. no Port-as-CONNECTED */

test('a Port alone is never reported as a connection', async () => {
  // The host answers relay.ping, but with a refusal: the port exists and the
  // request round-trips, yet nothing is proven about the host's health.
  await withChrome({
    replyFor: (type) => (type === 'relay.ping' ? { type: 'relay.error', code: 'agent_unavailable', message: 'no agent' } : null)
  }, async (fake) => {
    const before = await send({ type: 'aion/status' });
    assert.equal(before.relay.status, RELAY_STATUS.IDLE);
    assert.equal(before.relay.verified, false);
    assert.equal(before.relay.acp_initialized, false);
    assert.equal(fake.posted.length, 0, 'reading status must not contact the host');

    const reply = await send({ type: 'aion/native-ping' });
    assert.equal(reply.ok, false);
    assert.equal(reply.relay_status, RELAY_STATUS.UNAVAILABLE);
    assert.equal(reply.verified, undefined);
    assert.equal(fake.posted[0].type, 'relay.ping', 'the probe really was sent');

    const after = await send({ type: 'aion/status' });
    assert.equal(after.relay.verified, false, 'a refused probe proves nothing');
    assert.equal(after.relay.status, RELAY_STATUS.UNAVAILABLE);
    assert.equal(typeof after.relay.transport_status, 'string', 'the adapter view is echoed, not interpreted');
  });
});

test('a real relay.ping reply is what moves the ladder to VERIFIED', async () => {
  await withChrome({}, async (fake) => {
    const reply = await send({ type: 'aion/native-ping' });
    assert.equal(reply.ok, true);
    assert.equal(reply.relay_status, RELAY_STATUS.VERIFIED);
    assert.equal(reply.host.node_id, 'node-native-01');
    assert.equal(reply.host.protocol_version, 'aion.relay-nm/0.1');
    assert.equal(reply.agent.running, false, 'an idle agent must not be reported running');
    assert.ok(reply.verified_at, 'the time of the proof is recorded');

    // The agent's filesystem path is not redistributed by this worker.
    assert.equal(JSON.stringify(reply).includes('agent.exe'), false);

    const status = await send({ type: 'aion/status' });
    assert.equal(status.relay.status, RELAY_STATUS.VERIFIED);
    assert.equal(status.relay.verified, true);
    assert.equal(status.relay.acp_initialized, false);
  });
});

test('an unregistered host degrades without throwing', async () => {
  await withChrome({ hostMissing: true }, async () => {
    const reply = await send({ type: 'aion/native-ping' });
    assert.equal(reply.ok, false);
    assert.equal(reply.relay_status, RELAY_STATUS.UNAVAILABLE);
    const status = await send({ type: 'aion/status' });
    assert.equal(status.relay.verified, false);
    assert.ok(status.relay.last_error);
  });
});

/* ================================================ 3. hello is explicit only */

test('ACP initialize is never issued automatically', async () => {
  await withChrome({}, async (fake) => {
    await send({ type: 'aion/status' });
    await send({ type: 'aion/native-ping' });
    const installed = fake.listeners.installed[0];
    if (installed) await installed();
    assert.deepEqual(
      fake.posted.filter((m) => m.type === 'relay.hello'),
      [],
      'relay.hello starts a child process and must only ever follow an explicit request'
    );
  });
});

test('aion/native-hello reports ACP initialize only after a real reply', async () => {
  await withChrome({}, async (fake) => {
    const reply = await send({ type: 'aion/native-hello' });
    assert.equal(reply.ok, true);
    assert.equal(reply.acp_initialized, true);
    assert.equal(reply.relay_status, RELAY_STATUS.ACP_INITIALIZED);
    assert.equal(fake.posted[0].type, 'relay.hello');

    const status = await send({ type: 'aion/status' });
    assert.equal(status.relay.acp_initialized, true);
    assert.equal(status.relay.verified, true);
    assert.equal(status.relay.counters.hellos, 1);
  });
});

test('a hello the host does not confirm never claims ACP initialize', async () => {
  // The host answers, but does not confirm. That is the case this worker owns:
  // whatever the adapter decides to do with a non-ok reply, an unconfirmed hello
  // must not move the ladder to ACP_INITIALIZED.
  await withChrome({
    replyFor: (type) => (type === 'relay.hello'
      ? { type: 'relay.reply', ok: false, code: 'session_new_failed', message: 'Internal service failure -32603' }
      : null)
  }, async () => {
    const reply = await send({ type: 'aion/native-hello' });
    assert.equal(reply.ok, false, `DEBUG ${JSON.stringify(reply).slice(0, 300)}`);
    assert.equal(reply.acp_initialized, false);
    assert.notEqual(reply.relay_status, RELAY_STATUS.ACP_INITIALIZED);
    assert.equal(reply.session_ready, false);
    assert.match(String(reply.error || reply.detail), /did not confirm|session_new_failed/);

    const status = await send({ type: 'aion/status' });
    assert.equal(status.relay.acp_initialized, false);
    assert.notEqual(status.relay.status, RELAY_STATUS.ACP_INITIALIZED);
  });
});

/* ==================================================== 4. relay.event intake */

test('a valid host event is validated and stored', async () => {
  await withChrome({}, async (fake) => {
    await send({ type: 'aion/status' }); // hydrate + subscribe
    const event = envelope({ message_id: 'h1', idempotency_key: 'task-1:progress' });
    fake.api.lastPort = null;
    // Drive the transport's subscriber through a real port round trip.
    await send({ type: 'aion/native-ping' });
    fake.api.lastPort.push({ type: 'relay.event', envelope: event });
    await settle();

    const status = await send({ type: 'aion/status' });
    assert.equal(status.relay.counters.events_accepted, 1);
    assert.equal(status.outbox.retained_events, 1);
  });
});

test('an invalid host event is refused, counted and never stored', async () => {
  await withChrome({}, async (fake) => {
    await send({ type: 'aion/status' });
    await send({ type: 'aion/native-ping' });
    // Genuinely invalid: an event_type outside the allowlist and a dropped
    // required field. The adapter refuses it before any subscriber sees it and
    // reports it on onError, so it can only be counted — never stored.
    const forged = envelope({ message_id: 'forged', idempotency_key: 'forged' });
    forged.event_type = 'task.exec';
    delete forged.causation_id;
    fake.api.lastPort.push({ type: 'relay.event', envelope: forged });
    await settle();

    const status = await send({ type: 'aion/status' });
    assert.equal(status.outbox.retained_events, 0, 'a forged event must not reach the durable log');
    assert.equal(status.relay.counters.events_accepted, 0);
    assert.ok(status.relay.last_error, 'a refused host event leaves a reason an operator can read');
  });
});

test('a boundary failure degrades a verified relay instead of leaving it verified', async () => {
  await withChrome({}, async (fake) => {
    await send({ type: 'aion/status' });
    const ping = await send({ type: 'aion/native-ping' });
    assert.equal(ping.relay_status, RELAY_STATUS.VERIFIED, 'precondition: the relay was verified');

    // A host event the adapter refuses on this worker's behalf. It is reported,
    // counted and never stored, and the relay stops claiming it is verified.
    const forged = envelope({ message_id: 'forged', idempotency_key: 'forged' });
    forged.event_type = 'task.exec';
    fake.api.lastPort.push({ type: 'relay.event', envelope: forged });
    await settle();

    const status = await send({ type: 'aion/status' });
    assert.ok(status.relay.last_error, 'an operator must be able to read why');
    assert.equal(status.relay.status, RELAY_STATUS.DEGRADED, 'a verified relay that errors is degraded');
    assert.equal(status.relay.verified, false, 'and it stops claiming verification');
    assert.equal(status.outbox.retained_events, 0);
  });
});

/**
 * The REAL `relay.hello` reply, as bridge/src/host.js `handleHello` sends it.
 *
 * Copied from the bridge's actual
 * `send({ ok:true, protocol_version, agent: info, session })`, where `info` is
 * the ACP `initialize` result — NOT an invented shape. The bug this guards
 * against was reading only top-level strings, which returned null for every
 * field the panel displays while the host had reported all three.
 */
function realHelloReply() {
  return {
    type: 'relay.reply',
    ok: true,
    protocol_version: 1,
    agent: {
      protocolVersion: 1,
      agentInfo: { name: 'OpenCode', version: '2.0.32' },
      agentCapabilities: {
        fs: { readTextFile: true, writeTextFile: false },
        terminal: false,
        // Neither of these is a capability this bridge knows, and both would
        // name a filesystem location or free prose if they were echoed.
        cwd: 'C:\\Users\\someone\\secret-project',
        note: 'a sentence, not an identifier'
      },
      // Never redistributed: a filesystem path from the host.
      agentPath: 'C:\\Program Files\\agent\\agent.exe'
    },
    session: { created: false }
  };
}

test('a real hello reply yields protocol, agent version and capability NAMES', async () => {
  await withChrome({
    replyFor: (type) => (type === 'relay.hello' ? realHelloReply() : null)
  }, async () => {
    const reply = await send({ type: 'aion/native-hello' });
    assert.equal(reply.ok, true);
    assert.equal(reply.acp_initialized, true);

    // Protocol is a NUMBER on this wire and must survive as one.
    assert.equal(reply.protocol, 1);
    assert.equal(typeof reply.protocol, 'number', 'a numeric protocol must not be stringified');

    // Version is the AGENT's, from agentInfo — never the protocol number.
    assert.equal(reply.version, '2.0.32');
    assert.notEqual(reply.version, reply.protocol);

    // Capability NAMES from the allowlist only. `cwd` and `note` are
    // identifier-shaped keys and would pass any pattern test; only an allowlist
    // keeps them out.
    assert.deepEqual(reply.capabilities, ['fs', 'terminal']);

    // Nothing shaped like a path, a sentence or an executable may leak.
    const blob = JSON.stringify(reply);
    assert.equal(blob.includes('secret-project'), false, 'a cwd value leaked');
    assert.equal(blob.includes('agent.exe'), false, 'the agent path leaked');
    assert.equal(blob.includes('Program Files'), false);
    assert.equal(blob.includes('a sentence'), false, 'a free-text capability value leaked');
  });
});

test('the ping reply reports host identity without inventing agent facts', async () => {
  await withChrome({}, async () => {
    const reply = await send({ type: 'aion/native-ping' });
    assert.equal(reply.ok, true);
    assert.equal(reply.host.node_id, 'node-native-01');
    // This host's agent block is `{status, running}` with no agentInfo, so no
    // agent version may be claimed — absent or null, never back-filled from the
    // protocol number.
    assert.ok(reply.version === undefined || reply.version === null,
      `ping must not fabricate a version, got ${JSON.stringify(reply.version)}`);
    assert.equal(reply.agent.status, 'idle');
    assert.equal(reply.agent.running, false);
  });
});

test('a string protocol version stays a string and is never coerced', async () => {
  await withChrome({
    replyFor: (type) => (type === 'relay.hello'
      ? { ...realHelloReply(), protocol_version: '0.9', agent: { ...realHelloReply().agent, protocolVersion: '0.9' } }
      : null)
  }, async () => {
    const reply = await send({ type: 'aion/native-hello' });
    assert.equal(reply.protocol, '0.9');
    assert.equal(typeof reply.protocol, 'string', '"0.9" and 0.9 are different claims');
  });
});

test('a non-integer agent protocol falls back to the bridge own, never rounded', async () => {
  await withChrome({
    replyFor: (type) => (type === 'relay.hello'
      ? { ...realHelloReply(), agent: { ...realHelloReply().agent, protocolVersion: 1.5 } }
      : null)
  }, async () => {
    const reply = await send({ type: 'aion/native-hello' });
    // 1.5 is not a protocol version that can be reported, and rounding it to 2
    // would invent one. The bridge's own `protocol_version: 1` is the next most
    // specific honest answer.
    assert.equal(reply.protocol, 1);
    assert.notEqual(reply.protocol, 1.5);
  });
});

test('the ChatGPT path does not depend on ACP, and hello claims no session', async () => {
  await withChrome({
    contentActions: { ping: (port, msg) => ({ action: msg.action, ok: true, href: 'https://chatgpt.com/c/abc', state: {} }) },
    // The host initialises ACP but has no executor session to give.
    replyFor: (type) => (type === 'relay.hello'
      ? { type: 'relay.reply', ok: true, protocol_version: 'aion.relay-nm/0.1', agent: { status: 'ready', running: true }, capabilities: ['session/prompt'] }
      : HOST_REPLY[type]?.())
  }, async () => {
    const hello = await send({ type: 'aion/native-hello' });
    assert.equal(hello.ok, true);
    assert.equal(hello.acp_initialized, true);
    assert.equal(hello.session_ready, false, 'initialize must not be reported as a usable session');
    assert.equal(hello.session, null);
    // `session/prompt` is not a capability this bridge reports: the allowlist is
    // fs/terminal/mcp, the same set the bridge declares in clientCapabilities.
    // An unrecognised name is dropped, so the panel shows "none reported"
    // rather than a capability we cannot vouch for.
    assert.deepEqual(hello.capabilities, []);

    // The tab path is independent of all of it.
    const tabs = await send({ type: 'aion/chatgpt-tabs' });
    assert.equal(tabs.ok, true);
    const ping = await send({ type: 'aion/chatgpt-ping', tabId: 7 });
    assert.equal(ping.ok, true);
  });
});

/* ======================================================= 5. worker restart */

test('a restart reloads retained events and the cursor and re-sends nothing', async () => {
  await withChrome({}, async (fake) => {
    // Generation 1: store two events and acknowledge the first.
    await send({ type: 'aion/status' });
    await send({ type: 'aion/native-ping' });
    const store = __testing.store;
    await store.append(envelope({ message_id: 'e1', idempotency_key: 'task-1:one' }));
    await store.append(envelope({ message_id: 'e2', idempotency_key: 'task-1:two' }));
    // OUTBOX -> SENT -> ACKED is the contract's delivery line; there is no edge
    // straight from OUTBOX to ACKED.
    await store.markSent('e1');
    await store.markAcked('e1');
    const before = await send({ type: 'aion/status' });
    assert.equal(before.outbox.retained_events, 2);
    assert.equal(before.outbox.cursor, 1);
    const postedBefore = fake.posted.length;

    // --- the worker is suspended and restarted here: every JS value is gone.
    __testing.reset();
    installRuntimeListeners(fake.api);
    const after = await send({ type: 'aion/status' });

    assert.equal(after.outbox.retained_events, 2, 'retained events survive the restart');
    assert.equal(after.outbox.cursor, 1, 'the acknowledged cursor survives the restart');
    assert.equal(after.relay.status, RELAY_STATUS.IDLE, 'the ladder restarts unproven');
    assert.equal(after.relay.verified, false);
    assert.equal(
      fake.posted.length,
      postedBefore,
      'a restart must not re-send anything: a non-idempotent task would run twice'
    );
    assert.match(after.relay.replay_policy, /never re-sent automatically/);
  });
});

test('hydration is one promise even under a burst of concurrent messages', async () => {
  await withChrome({}, async (fake) => {
    const replies = await Promise.all([
      send({ type: 'aion/status' }),
      send({ type: 'aion/status' }),
      send({ type: 'aion/status' }),
      send({ type: 'aion/chatgpt-tabs' })
    ]);
    const boots = replies.slice(0, 3).map((r) => r.relay.boot_count);
    assert.equal(new Set(boots).size, 1, `three events in one tick must share one hydration, got ${boots}`);
    assert.equal(replies.every((r) => r.ok === true), true);

    // And a genuine restart is still counted: one boot per worker generation.
    const before = replies[0].relay.boot_count;
    __testing.reset();
    installRuntimeListeners(fake.api);
    const after = await send({ type: 'aion/status' });
    assert.equal(after.relay.boot_count, before + 1);
    void fake;
  });
});

/* ==================================== 6. the transport moves nothing else */

test('a verified transport never changes the proof or approval fields', async () => {
  await withChrome({}, async () => {
    const before = await send({ type: 'aion/status' });
    await send({ type: 'aion/native-ping' });
    await send({ type: 'aion/native-hello' });
    const after = await send({ type: 'aion/status' });

    assert.deepEqual(after.proof, before.proof, 'transport liveness is not proof');
    assert.deepEqual(after.approval, before.approval, 'a connection approves nothing');
    assert.equal(after.proof.last_evidence_at, null);
    assert.equal(after.approval.pending, 0);
    assert.notEqual(after.relay.status, before.relay.status);
  });
});

/* ============================================== 7. chatgpt endpoints */

test('aion/chatgpt-tabs lists sanitized chatgpt tabs only', async () => {
  await withChrome({}, async () => {
    const reply = await send({ type: 'aion/chatgpt-tabs' });
    assert.equal(reply.ok, true);
    assert.equal(reply.count, 1);
    assert.deepEqual(reply.result.tabs, [{
      tab_id: 7,
      url: 'https://chatgpt.com/c/abc',
      window_id: 1,
      active: true,
      status: 'complete'
    }]);
    const blob = JSON.stringify(reply);
    assert.equal(blob.includes('example.com'), false);
    assert.equal(blob.includes('share=secret'), false);
  });
});

test('aion/chatgpt-ping reaches the tab by the agreed tabId field', async () => {
  await withChrome({
    contentActions: { ping: (port, msg) => ({ action: msg.action, ok: true, href: 'https://chatgpt.com/c/abc', state: { generating: false, sendPresent: true, sendDisabled: false } }) }
  }, async (fake) => {
    const reply = await send({ type: 'aion/chatgpt-ping', tabId: 7 });
    assert.equal(reply.ok, true);
    assert.deepEqual(fake.api.connectedPorts, [{ tabId: 7, name: 'aion-chatgpt' }]);
    assert.equal(reply.result.tab.tab_id, 7);
  });
});

test('aion/chatgpt-run refuses without the agreed user_gesture', async () => {
  await withChrome({}, async (fake) => {
    const command = { text: 'hello', correlation_id: 'task-1', expected_reply_token: 'ACK-1' };
    for (const gesture of [undefined, false, 'true']) {
      const reply = await send({ type: 'aion/chatgpt-run', tabId: 7, command: { ...command, user_gesture: gesture, approved_scope_ref: 'grant-7' } });
      assert.equal(reply.ok, false);
      assert.equal(reply.code, CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED);
      assert.equal(reply.submitted, false);
    }
    assert.equal(fake.api.connectedPorts, undefined, 'no gesture means no port is ever opened');
  });
});

test('aion/chatgpt-run submits exactly one turn on an explicit gesture', async () => {
  const captured = [];
  await withChrome({
    contentActions: {
      'run-turn': (port, msg) => {
        captured.push(msg);
        return {
          action: msg.action,
          ok: true,
          verdict: { schema: 'aion.chatgpt-verdict/0.1', accepted: true, reason: 'accepted', correlation_id: 'task-1' },
          envelope: createEnvelope({
            producer_node: 'node-ext-chatgpt',
            event_type: 'proof.submitted',
            task_state: 'PROOF_SUBMITTED',
            correlation_id: 'task-1',
            payload: { accepted: true }
          })
        };
      }
    }
  }, async () => {
    const reply = await send({
      type: 'aion/chatgpt-run',
      tabId: 7,
      command: {
        text: 'hello there',
        correlation_id: 'task-1',
        expected_reply_token: 'ACK-1',
        user_gesture: true,
        approved_scope_ref: 'grant-7'
      }
    });
    assert.equal(reply.ok, true, `DEBUG ${JSON.stringify(reply).slice(0, 300)}`);
    assert.equal(captured.length, 1, 'exactly one command, and no replay');
    assert.equal(captured[0].action, 'run-turn');
    assert.equal(captured[0].user_gesture, true);
    assert.equal(captured[0].text, 'hello there');
    assert.equal(captured[0].correlation_id, 'task-1');
    assert.ok(reply.result.envelope.message_id, 'the validated envelope is returned to the caller');
    // Panel-facing flattened shape.
    assert.equal(reply.captured, true);
    assert.equal(reply.correlation_id, 'task-1');
    assert.equal(reply.expected_reply_token, 'ACK-1');
    assert.ok(reply.captured_at || reply.finished_at, 'a capture is timestamped');
  });
});

test('a smuggled target or extra key cannot redirect or extend a chatgpt request', async () => {
  const captured = [];
  await withChrome({
    contentActions: {
      'read-final': (port, msg) => {
        captured.push(msg);
        return { action: msg.action, ok: true, verdict: { accepted: false, reason: 'no_final_block' } };
      }
    }
  }, async (fake) => {
    // The nested command carries an attacker-chosen tab id and an action name.
    const reply = await send({
      type: 'aion/chatgpt-read',
      tabId: 7,
      command: { correlation_id: 'task-1', action: 'run-turn', text: 'send me', confirm: true, tab_id: 8 }
    });
    // The smuggled target is REFUSED, not obeyed: tab 8 is not a chatgpt tab.
    assert.equal(reply.ok, false);
    assert.equal(reply.code, CHATGPT_ERROR.NOT_A_CHATGPT_TAB);
    assert.equal(captured.length, 0, 'no request may reach a page under a smuggled target');
    assert.equal(fake.api.connectedPorts, undefined, 'and no port may be opened for tab 8');

    // With the smuggled target removed, only the named keys survive.
    const clean = await send({ type: 'aion/chatgpt-read', tabId: 7, correlation_id: 'task-1', action: 'run-turn', text: 'x' });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].action, 'read-final');
    assert.equal(captured[0].text, undefined);
    assert.equal(captured[0].confirm, undefined);
    assert.equal(clean.ok, false, 'a non-correlated read is not a success');
  });
});

test('a submission requires an approval reference, not just a gesture', async () => {
  await withChrome({}, async (fake) => {
    const base = { text: 'hello', correlation_id: 'task-1', expected_reply_token: 'ACK-1', user_gesture: true };
    const refused = await send({ type: 'aion/chatgpt-run', tabId: 7, command: base });
    assert.equal(refused.ok, false);
    assert.equal(refused.code, CHATGPT_ERROR.APPROVAL_REQUIRED);
    assert.equal(fake.api.connectedPorts, undefined, 'a gesture alone must not open a port');
  });
});

test('a correlation already dispatched is never submitted twice', async () => {
  const captured = [];
  await withChrome({
    contentActions: {
      'run-turn': (port, msg) => {
        captured.push(msg);
        return {
          action: msg.action,
          ok: true,
          verdict: { accepted: true, reason: 'accepted', correlation_id: 'task-1' },
          envelope: createEnvelope({
            producer_node: 'node-ext-chatgpt',
            event_type: 'proof.submitted',
            task_state: 'PROOF_SUBMITTED',
            correlation_id: 'task-1',
            payload: {}
          })
        };
      }
    }
  }, async () => {
    const command = { text: 'hello', correlation_id: 'task-1', expected_reply_token: 'ACK-1', user_gesture: true, approved_scope_ref: 'grant-7' };
    const first = await send({ type: 'aion/chatgpt-run', tabId: 7, command });
    assert.equal(first.ok, true);
    assert.equal(captured.length, 1);

    // The same correlation again is refused: the reservation is durable, so this
    // holds across a restart, not just within one JS lifetime.
    const second = await send({ type: 'aion/chatgpt-run', tabId: 7, command });
    assert.equal(second.ok, false);
    assert.equal(second.code, CHATGPT_ERROR.ALREADY_DISPATCHED);
    assert.equal(captured.length, 1, 'the page must be touched exactly once');

    // A DIFFERENT correlation is unaffected.
    const other = await send({ type: 'aion/chatgpt-run', tabId: 7, command: { ...command, correlation_id: 'task-2' } });
    assert.equal(other.ok, true);
    assert.equal(captured.length, 2);
  });
});

test('every action endpoint answers with the agreed {ok, result} envelope', async () => {
  await withChrome({
    contentActions: { ping: (port, msg) => ({ action: msg.action, ok: true, href: 'https://chatgpt.com/c/abc', state: {} }) }
  }, async () => {
    const ok = await send({ type: 'aion/native-ping' });
    assert.equal(typeof ok.ok, 'boolean');
    assert.equal(ok.code, null, 'a success carries no error code');
    assert.ok(ok.result, 'the agreed result envelope is present');
    assert.equal(ok.type, 'aion/native-ping');

    const refused = await send({ type: 'aion/chatgpt-run', command: { text: 'x' } });
    assert.equal(refused.ok, false);
    assert.equal(typeof refused.code, 'string');
    assert.ok(refused.error);
    assert.deepEqual(refused.result, {
      ok: false,
      code: CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED,
      error: refused.error,
      submitted: false,
      captured: false
    });
  });
});

test('an unknown message type is ignored without a reply channel', () => {
  const kept = handleMessage({ type: 'aion/not-a-thing' }, extensionPage(), () => {
    throw new Error('a reply must not be produced for an unknown type');
  });
  assert.equal(kept, false);
  assert.equal(handleMessage(null, extensionPage(), () => {}), false);
  assert.equal(handleMessage({ noType: true }, extensionPage(), () => {}), false);
});

/* ============================================================== 8. secrets */

test('the worker reads no credential and logs no payload', async () => {
  const fs = await import('node:fs/promises');
  const raw = await fs.readFile(new URL('../src/background/service-worker.js', import.meta.url), 'utf8');
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const forbidden of ['document.cookie', 'localStorage', 'sessionStorage', '__NEXT_DATA__', 'accessToken', 'access_token', 'chrome.cookies', 'fetch(', 'XMLHttpRequest']) {
    assert.equal(code.includes(forbidden), false, `service-worker.js must not execute ${forbidden}`);
  }
  // No credential surface is executed, and only the host surfaces this worker is
  // allowed to touch appear at all (they are reached through local `api`
  // variables, so the set is checked as a subset, not an exact list).
  for (const forbidden of ['chrome.cookies', 'chrome.scripting', 'chrome.desktopCapture', 'chrome.webRequest']) {
    assert.equal(code.includes(forbidden), false, `service-worker.js must not use ${forbidden}`);
  }
  assert.deepEqual([...new Set([...code.matchAll(/\bchrome\.(\w+)\b/g)].map((m) => m[1]))].sort(), ['storage', 'tabs']);
});

test('a host event payload is never echoed back in status', async () => {
  await withChrome({}, async (fake) => {
    await send({ type: 'aion/status' });
    await send({ type: 'aion/native-ping' });
    fake.api.lastPort.push({
      type: 'relay.event',
      envelope: envelope({ message_id: 'h9', idempotency_key: 'task-1:secret', payload: { answer: 'sensitive page text' } })
    });
    await settle();
    const status = await send({ type: 'aion/status' });
    assert.equal(JSON.stringify(status).includes('sensitive page text'), false);
    assert.equal(status.relay.counters.events_accepted, 1);
  });
});