/**
 * Native-host SAFETY tests: the origin gate, cwd ordering, sequence ownership and
 * the pinned config.
 *
 * Each block pins one property that a real defect broke:
 *
 *   F6 the origin comes from argv only. The first framed stdin message is NOT a
 *      fallback — it is a value the writer chooses, so honouring it verifies
 *      nothing. Unset argv origin is a refusal.
 *   F7 cwd validation runs BEFORE the envelope is stored, so a refused request
 *      cannot consume its idempotency key and turn a corrected retry into a fake
 *      "replayed, already done".
 *   F9 the host's emitted-envelope counter is the host's own. An inbound
 *      `sequence` must not be adopted into it.
 *   F10 `expectedExtensionId` is pinned in the entry point. No config file and no
 *      caller override may repoint it.
 *
 * Nothing here registers a native host, writes the registry, launches a browser
 * or spawns the real ACP agent: the ACP client is injected in every test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { createEnvelope } from '../../extension/src/lib/index.js';
import { createHost, createRedactingLogger, HOST_ERROR } from '../src/host.js';
import { ACP_ERROR, AcpClientError } from '../src/acp-client.js';
import { createConfig } from '../src/config.js';
import { createNativeFrameDecoder } from '../src/framing.js';
import { PINNED_EXTENSION_ID, loadHostConfig } from '../bin/aion-relay-host.mjs';

const ID = PINNED_EXTENSION_ID;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, '..', 'bin', 'aion-relay-host.mjs');
const NODE = 'native-host:com.aion.relay';
const GOOD_CWD = 'C:/0-BlackBoxProject-0/AION';
const BAD_CWD = 'C:/somewhere-else';

const settle = () => new Promise((r) => setImmediate(r));
const errorsIn = (msgs) => msgs.filter((m) => m && m.type === 'relay.error');
const repliesIn = (msgs) => msgs.filter((m) => m && m.type === 'relay.reply');
const eventsIn = (msgs) => msgs.filter((m) => m && m.type === 'relay.event');

/** A disposable config file directory. */
function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aion-host-safety-'));
}

/**
 * An in-memory ACP client with the surface the host uses. Every call is counted so
 * a test can prove a command executed exactly once.
 */
function fakeClient(overrides = {}) {
  const calls = { initialize: 0, newSession: 0, request: 0, prompt: 0, cancel: 0, restart: 0 };
  const base = {
    calls,
    async initialize() { calls.initialize += 1; return { protocolVersion: 1, agentCapabilities: {} }; },
    async newSession({ cwd } = {}) {
      calls.newSession += 1;
      return { sessionId: 'acp-session-1', cwd };
    },
    async request(method) { calls.request += 1; return { method, ok: true }; },
    prompt({ onUpdate } = {}) {
      calls.prompt += 1;
      if (typeof onUpdate === 'function') onUpdate({ sessionUpdate: 'agent_message_chunk', content: { text: 'hi' } }, { sessionId: 'acp-session-1' });
      return Promise.resolve({ stopReason: 'end_turn' });
    },
    cancel() { calls.cancel += 1; return { cancelled: true }; },
    async restart() { calls.restart += 1; },
    status() { return 'ready'; },
    close() {},
  };
  return Object.assign(base, overrides);
}

function harness(overrides = {}) {
  const input = new PassThrough();
  const output = new PassThrough();
  const out = [];
  const decoder = createNativeFrameDecoder({ onMessage: (m) => out.push(m) });
  output.on('data', (b) => { decoder.push(b); });
  const logs = [];
  const logger = createRedactingLogger({ level: 'error', sink: (l) => logs.push(l) });
  const client = overrides.client ?? fakeClient();
  const config = createConfig({
    expectedExtensionId: ID,
    agentPath: '',
    sessionCwd: GOOD_CWD,
    ...(overrides.config ?? {}),
  });
  const host = createHost({
    config,
    logger,
    client,
    input,
    output,
    ...(overrides.host ?? {}),
  });
  return { host, state: host.state, out, logs, config, client };
}

/** A dispatchable envelope (task.approved is the only inbound event type mapped). */
function dispatchable(overrides = {}) {
  return createEnvelope({
    event_type: 'task.approved',
    producer_node: 'extension-relay',
    target_role: 'operator',
    correlation_id: 'task-42',
    payload: { text: 'do the thing' },
    expires_at: '2027-01-01T00:00:00.000Z',
    ...overrides,
  });
}

/* ===================================================== F6: origin comes from argv */

test('F6: no argv origin refuses the connection at construction', () => {
  const h = harness();
  assert.equal(h.state.refused, true);
  assert.equal(h.state.origin, '');
  assert.match(h.logs.join('\n'), /origin missing/);
  assert.ok(errorsIn(h.out).some((e) => e.code === HOST_ERROR.ORIGIN_MISSING));
  h.host.stop();
});

test('F6: a self-asserted first frame cannot supply the origin', async () => {
  const h = harness();
  h.host.receive('chrome-extension://kgjfielmhcdlggjppmliabpiljnonhki/');
  h.host.receive({ type: 'relay.ping', id: 'p1' });
  await settle();
  await settle();

  assert.equal(h.state.origin, '', 'the claimed origin was not adopted');
  assert.equal(h.state.dispatched, 0);
  assert.equal(repliesIn(h.out).length, 0, 'no command is answered as if authorised');
  h.host.stop();
});

test('F6: only the pinned extension id executes anything', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  assert.equal(h.state.refused, false);
  h.host.receive({ type: 'relay.ping', id: 'p1' });
  await settle();
  assert.equal(repliesIn(h.out).length, 1, 'the pinned origin is answered normally');
  h.host.stop();
});

/* ============================== F7: cwd is validated before the envelope is stored */

test('F7: a disallowed cwd is refused without consuming the idempotency key', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  const envelope = dispatchable({
    message_id: 'msg-cwd-1',
    idempotency_key: 'task-42:dispatch',
    payload: { text: 'do the thing', cwd: BAD_CWD },
  });

  h.host.receive({ type: 'relay.send', id: 's1', envelope });
  await settle();
  await settle();

  assert.equal(h.state.dispatched, 0, 'nothing executed');
  const refusal = errorsIn(h.out).find((e) => e.code === HOST_ERROR.CWD_NOT_ALLOWED);
  assert.ok(refusal, 'the cwd refusal is reported');
  assert.equal(h.host.store.list().length, 0, 'a refused envelope must not be stored');
  h.host.stop();
});

test('F7: the corrected retry with the same key executes exactly once', async () => {
  const h = harness({ host: { initialOrigin: ID } });

  h.host.receive({
    type: 'relay.send',
    id: 's1',
    envelope: dispatchable({
      message_id: 'msg-cwd-2',
      idempotency_key: 'task-42:dispatch',
      payload: { text: 'do the thing', cwd: BAD_CWD },
    }),
  });
  await settle();
  await settle();
  assert.equal(h.client.calls.prompt, 0, 'the refused attempt ran nothing');

  // Same message_id and idempotency_key, corrected cwd. Before the fix this came
  // back `replayed: true` and never ran: the rejection had poisoned the retry.
  h.host.receive({
    type: 'relay.send',
    id: 's2',
    envelope: dispatchable({
      message_id: 'msg-cwd-2',
      idempotency_key: 'task-42:dispatch',
      payload: { text: 'do the thing', cwd: GOOD_CWD },
    }),
  });
  await settle();
  await settle();
  await settle();

  const reply = repliesIn(h.out).find((r) => r.id === 's2');
  assert.ok(reply, 'the corrected retry is answered');
  assert.equal(reply.replayed, undefined, 'it is NOT reported as a replay');
  assert.equal(reply.ok, true);
  assert.equal(h.client.calls.prompt, 1, 'executed exactly once');
  assert.equal(h.state.dispatched, 1);
  h.host.stop();
});

test('F7: a real replay of a stored envelope is still refused as a replay', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  const envelope = dispatchable({
    message_id: 'msg-dup-1',
    idempotency_key: 'task-42:dispatch',
    payload: { text: 'do the thing', cwd: GOOD_CWD },
  });

  h.host.receive({ type: 'relay.send', id: 's1', envelope });
  await settle();
  await settle();
  await settle();
  h.host.receive({ type: 'relay.send', id: 's2', envelope });
  await settle();
  await settle();

  const replay = repliesIn(h.out).find((r) => r.id === 's2');
  assert.ok(replay, 'the replay is answered');
  assert.equal(replay.replayed, true, 'dedupe at the host still holds');
  assert.equal(h.client.calls.prompt, 1, 'and it did not execute twice');
  h.host.stop();
});

/* ==================================== F9: the host owns its emitted-envelope sequence */

test('F9: an inbound sequence does not become the host counter', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  h.host.receive({
    type: 'relay.send',
    id: 's1',
    envelope: dispatchable({
      message_id: 'msg-seq-1',
      idempotency_key: 'task-42:dispatch',
      sequence: 9_999,
      payload: { text: 'do the thing' },
    }),
  });
  await settle();
  await settle();
  await settle();

  const emitted = eventsIn(h.out).flatMap((m) => m.envelope.sequence);
  assert.ok(emitted.length > 0, 'the dispatch emitted envelopes');
  for (const sequence of emitted) {
    assert.ok(sequence < 9_999, `host sequence ${sequence} must not inherit the caller's numbering`);
  }
  assert.equal(h.state.sequence, Math.max(...emitted), 'the host counter is its own');
  h.host.stop();
});

/* ================================================== F10: the extension id is pinned */

test('F10: a caller override may not repoint the pinned extension id', () => {
  assert.throws(
    () => loadHostConfig(tempDir(), { expectedExtensionId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }),
    /may not change expectedExtensionId/,
  );
});

test('F10: host.config.json may not repoint the pinned extension id', () => {
  const dir = tempDir();
  fs.writeFileSync(
    path.join(dir, 'host.config.json'),
    JSON.stringify({ expectedExtensionId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }),
  );
  assert.throws(() => loadHostConfig(dir, {}), /may not change expectedExtensionId/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('F10: the pin survives every other config field', () => {
  const dir = tempDir();
  fs.writeFileSync(
    path.join(dir, 'host.config.json'),
    JSON.stringify({ logLevel: 'warn', nodeId: 'node-b', allowedCwds: ['C:/allowed'] }),
  );
  const config = loadHostConfig(dir, {});
  assert.equal(config.expectedExtensionId, ID);
  assert.equal(config.logLevel, 'warn', 'ordinary fields are still honoured');
  assert.equal(config.nodeId, 'node-b');
  fs.rmSync(dir, { recursive: true, force: true });
});

/* ==================================== entry point: refusals exit non-zero, quietly */

function runBin(args) {
  try {
    execFileSync(process.execPath, [BIN, ...args], {
      encoding: 'utf8',
      timeout: 10_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stderr: '' };
  } catch (err) {
    return { status: err.status, stderr: String(err.stderr ?? '') };
  }
}

test('entry point: no origin on argv exits 2 rather than serving', () => {
  const result = runBin(['--parent-window=1234']);
  assert.equal(result.status, 2, `expected exit 2, got ${result.status}`);
  assert.match(result.stderr, /expected Chrome to pass the extension origin/);
});

test('entry point: a refused origin exits non-zero instead of logging ready', () => {
  const result = runBin(['chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/']);
  assert.equal(result.status, 4, `expected exit 4, got ${result.status}`);
  assert.match(result.stderr, /is not allowed; refusing to serve/);
  assert.equal(/ready for extension/.test(result.stderr), false, 'it must never claim readiness');
});

/* ------------------------------------------------------------------- guardrails */

/* ============================================ relay.hello = capabilities only
 *
 * Real runtime finding: `relay.ping` returned ok at 11:40:46Z, then `relay.hello`
 * called `initialize` (which succeeded) and `session/new` (which failed with an
 * agent-side -32603 at 11:41:05Z). The failure escaped every inner catch, so
 * `handleFrame` answered `relay.error` with `id: null` — unmatchable — and the
 * caller sat out its full 40s timeout with no diagnosis.
 *
 * Two independent fixes are pinned below: hello must not need a session, and
 * every failure must be answerable by the caller that asked.
 */

/** A client whose `session/new` fails the way the live agent's did. */
function fakeClientWithBrokenSession() {
  return fakeClient({
    newSession() {
      this.calls.newSession += 1;
      return Promise.reject(new AcpClientError(
        ACP_ERROR.REQUEST_FAILED,
        'ACP session/new failed: Internal service failure (code -32603)',
      ));
    },
  });
}

test('relay.hello reports initialize capabilities and does not create a session', async () => {
  const client = fakeClientWithBrokenSession();
  const h = harness({ client, host: { initialOrigin: ID } });

  h.host.receive({ type: 'relay.hello', id: 'h-1' });
  await settle();
  await settle();
  await settle();

  const reply = repliesIn(h.out).find((r) => r.id === 'h-1');
  assert.ok(reply, 'hello is answered');
  assert.equal(reply.ok, true, 'a broken session/new cannot fail a capability probe');
  assert.equal(reply.agent.protocolVersion, 1, 'the initialize result is reported');
  assert.equal(client.calls.initialize, 1);
  assert.equal(client.calls.newSession, 0, 'hello must not create a session');
  assert.equal(h.state.sessionId, null, 'no session exists');
  assert.equal(errorsIn(h.out).length, 0, 'no error at all');
  h.host.stop();
});

test('relay.hello never claims session readiness', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  h.host.receive({ type: 'relay.hello', id: 'h-1' });
  await settle();
  await settle();

  const reply = repliesIn(h.out).find((r) => r.id === 'h-1');
  assert.equal(reply.session.created, false);
  assert.equal(reply.session.session_id, null);
  assert.match(reply.session.note, /only then is session readiness claimed/);
  h.host.stop();
});

test('relay.ping separates capabilities from session readiness', async () => {
  const h = harness({ host: { initialOrigin: ID } });

  h.host.receive({ type: 'relay.hello', id: 'h-1' });
  await settle();
  await settle();
  h.host.receive({ type: 'relay.ping', id: 'p-1' });
  await settle();

  const ping = repliesIn(h.out).find((r) => r.id === 'p-1');
  assert.equal(ping.capabilities_observed, true, 'initialize was observed');
  assert.equal(ping.session.created, false, 'no session exists yet');
  assert.equal(ping.agent.running, true, 'the child process is up — a different claim');

  // A dispatch is the first moment a session is created.
  h.host.receive({
    type: 'relay.send',
    id: 's-1',
    envelope: dispatchable({ message_id: 'msg-sess-1', idempotency_key: 'task-42:dispatch' }),
  });
  await settle();
  await settle();
  await settle();

  h.host.receive({ type: 'relay.ping', id: 'p-2' });
  await settle();
  const after = repliesIn(h.out).find((r) => r.id === 'p-2');
  assert.equal(after.session.created, true);
  assert.equal(typeof after.session.session_id, 'string');
  h.host.stop();
});

test('initialize is idempotent: repeated hellos negotiate once', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  h.host.receive({ type: 'relay.hello', id: 'h-1' });
  h.host.receive({ type: 'relay.hello', id: 'h-2' });
  h.host.receive({ type: 'relay.hello', id: 'h-3' });
  await settle();
  await settle();
  await settle();

  assert.equal(h.client.calls.initialize, 1, 'one initialize for three hellos');
  assert.equal(repliesIn(h.out).filter((r) => r.ok === true).length, 3, 'all three are answered');
  h.host.stop();
});

test('a session failure on dispatch is answered with the ORIGINAL request id', async () => {
  const client = fakeClientWithBrokenSession();
  const h = harness({ client, host: { initialOrigin: ID } });

  h.host.receive({
    type: 'relay.send',
    id: 'send-7',
    envelope: dispatchable({ message_id: 'msg-broken-1', idempotency_key: 'task-42:dispatch' }),
  });
  await settle();
  await settle();
  await settle();

  const err = errorsIn(h.out)[0];
  assert.ok(err, 'the dispatch is answered with an error');
  assert.equal(err.id, 'send-7', 'the id must be the caller id, never null');
  assert.equal(h.state.sessionId, null, 'no session is claimed');
  assert.match(err.message, /-32603/, 'the agent-side failure code survives into the operator text');
  assert.equal(err.message.includes('\n'), false, 'one line, no stack');
  assert.equal(client.calls.newSession, 1, 'one attempt, no automatic retry');
  h.host.stop();
});

test('a failure that escapes every inner catch still answers the right id', async () => {
  // The reported defect exactly: a plain Error out of initialize, which no inner
  // catch handles, used to reach handleFrame's catch and answer id:null.
  const client = fakeClient({
    initialize() {
      this.calls.initialize += 1;
      return Promise.reject(new Error('boom from somewhere deep\n    at Object.<anonymous> (/secret/path.js:1:1)'));
    },
  });
  const h = harness({ client, host: { initialOrigin: ID } });

  h.host.receive({ type: 'relay.hello', id: 'hello-9' });
  await settle();
  await settle();
  await settle();

  const err = errorsIn(h.out)[0];
  assert.ok(err, 'the failure is reported rather than swallowed');
  assert.equal(err.id, 'hello-9', 'correlated to the request that caused it');
  assert.equal(err.code, HOST_ERROR.INTERNAL);
  assert.equal(err.message, 'boom from somewhere deep', 'first line only, no stack, no path');
  assert.equal(/at Object|secret\/path/.test(err.message), false);
  h.host.stop();
});

test('no error text emitted anywhere in this run carries a stack', async () => {
  const client = fakeClientWithBrokenSession();
  const h = harness({ client, host: { initialOrigin: ID } });
  h.host.receive({ type: 'relay.hello', id: 'h-1' });
  await settle();
  h.host.receive({
    type: 'relay.send',
    id: 's-1',
    envelope: dispatchable({ message_id: 'msg-stack-1', idempotency_key: 'task-42:dispatch' }),
  });
  await settle();
  await settle();
  await settle();

  for (const message of h.out) {
    if (typeof message.message !== 'string') continue;
    assert.equal(/\n\s+at /.test(message.message), false, `stack leaked: ${message.message}`);
  }
  h.host.stop();
});

test('a failed session creation is not retried in the background', async () => {
  const client = fakeClientWithBrokenSession();
  const h = harness({ client, host: { initialOrigin: ID } });
  h.host.receive({
    type: 'relay.send',
    id: 's-1',
    envelope: dispatchable({ message_id: 'msg-noretry-1', idempotency_key: 'task-42:dispatch' }),
  });
  // Give any hypothetical retry loop ample opportunity to show itself.
  for (let i = 0; i < 5; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
    await settle();
  }
  assert.equal(client.calls.newSession, 1, 'exactly one session attempt');
  assert.equal(client.calls.initialize, 1, 'and no repeated initialize');
  h.host.stop();
});

test('the host never logs a credential-looking payload it was handed', async () => {
  const logs = [];
  const h = harness({
    host: { initialOrigin: ID },
    logger: createRedactingLogger({ level: 'debug', sink: (l) => logs.push(l) }),
  });
  h.host.receive({
    type: 'relay.send',
    id: 's1',
    envelope: dispatchable({
      message_id: 'msg-secret-1',
      idempotency_key: 'task-42:dispatch',
      payload: { text: 'hello', apiToken: 'super-secret-value' },
    }),
  });
  await settle();
  await settle();
  const text = logs.join('\n');
  assert.equal(text.includes('super-secret-value'), false, 'no secret value may reach a log line');
  h.host.stop();
});

test('a hostile cwd is refused rather than silently rewritten', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  h.host.receive({
    type: 'relay.send',
    id: 's1',
    envelope: dispatchable({
      message_id: 'msg-hostile-1',
      idempotency_key: 'task-42:dispatch',
      payload: { text: 'x', cwd: `${GOOD_CWD}/../elsewhere` },
    }),
  });
  await settle();
  await settle();
  assert.ok(errorsIn(h.out).some((e) => e.code === HOST_ERROR.CWD_NOT_ALLOWED));
  assert.equal(h.client.calls.prompt, 0);
  h.host.stop();
});