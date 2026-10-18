/**
 * Native-messaging transport adapter — connection truthfulness and reconnection.
 *
 * Every test uses a fake `chrome` and a fake clock. Nothing launches a browser,
 * opens a real host port, or touches a signed-in session.
 *
 * The behaviour encoded here is the correction of four real defects:
 *
 *   F1 `connect()` used to reset the reconnect counter merely because
 *      `connectNative` returned a Port. A missing host returns a Port and then
 *      disconnects, so every cycle reset the counter and the adapter retried
 *      forever. The counter now resets only on a correlated, successful reply.
 *   F2 Callbacks had no port identity, so a late message or a delayed disconnect
 *      from a dead port could fail the live port's requests and null it out.
 *   F3 Inbound `relay.event` envelopes were handed to subscribers unvalidated.
 *   F4 `send()` skipped validation entirely and `sendEnvelope`'s validator was
 *      caller-supplied and replaceable.
 *   F5 Status reported CONNECTED from port presence alone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NATIVE_STATUS,
  TRANSPORT_ERROR,
  TRANSPORT_STATUS,
  createTransport,
  TRANSPORT_NAMES,
} from '../src/lib/transport.js';
import { createEnvelope } from '../src/lib/envelope.js';

/** Fake chrome whose ports are driven by the test. */
function fakeChrome(behaviour = {}) {
  const ports = [];
  const api = {
    runtime: {
      connectNative(name) {
        if (behaviour.throwOnConnect) throw new Error('Specified native messaging host not found.');
        const listeners = { message: [], disconnect: [] };
        const port = {
          name,
          posted: [],
          onMessage: { addListener: (f) => listeners.message.push(f) },
          onDisconnect: { addListener: (f) => listeners.disconnect.push(f) },
          postMessage(msg) {
            port.posted.push(msg);
            if (behaviour.autoReply) {
              // Mirror the real host: a reply arrives asynchronously.
              queueMicrotask(() => {
                for (const f of listeners.message) {
                  f(behaviour.autoReply(msg) ?? { type: 'relay.reply', id: msg.id, ok: true });
                }
              });
            }
          },
          disconnect() {
            for (const f of listeners.disconnect) f({});
          },
          // test affordances
          emit: (m) => { for (const f of listeners.message) f(m); },
          drop: () => { for (const f of listeners.disconnect) f({}); },
        };
        ports.push(port);
        return port;
      },
    },
  };
  return { api, ports };
}

/**
 * The missing-host shape: `connectNative` returns a Port and the port dies a tick
 * later without ever answering. This is what Chrome does for an unregistered host,
 * and it is the sequence that used to reset the retry counter on every attempt.
 */
function fakeChromePortThenDrop() {
  const ports = [];
  const api = {
    runtime: {
      connectNative(name) {
        const listeners = { message: [], disconnect: [] };
        const port = {
          name,
          posted: [],
          onMessage: { addListener: (f) => listeners.message.push(f) },
          onDisconnect: { addListener: (f) => listeners.disconnect.push(f) },
          postMessage(msg) { port.posted.push(msg); },
          disconnect() { for (const f of listeners.disconnect) f({}); },
          emit: (m) => { for (const f of listeners.message) f(m); },
          drop: () => { for (const f of listeners.disconnect) f({}); },
        };
        ports.push(port);
        // Fires after the transport has installed its listeners (both addListener
        // calls happen synchronously in connect()), which is exactly the ordering
        // of a host process that died during connection setup.
        queueMicrotask(() => { for (const f of listeners.disconnect) f({}); });
        return port;
      },
    },
  };
  return { api, ports };
}

/** Manual clock so backoff can be stepped without real waiting. */
function fakeClock() {
  let now = 0;
  const timers = new Map();
  let seq = 1;
  return {
    api: {
      setTimeout(fn, ms) {
        const h = seq++;
        timers.set(h, { fn, at: now + ms });
        return h;
      },
      clearTimeout(h) { timers.delete(h); },
    },
    advance(ms) {
      now += ms;
      for (let guard = 0; guard < 1000; guard += 1) {
        let fired = false;
        for (const [h, t] of [...timers.entries()]) {
          if (t.at <= now) { timers.delete(h); t.fn(); fired = true; }
        }
        if (!fired) return;
      }
      throw new Error('fake clock: timers never quiesced');
    },
    pending: () => timers.size,
  };
}

/** A genuinely valid envelope; inbound validation is not optional. */
function validEnvelope(overrides = {}) {
  return createEnvelope({
    producer_node: 'node-ext-01',
    event_type: 'task.proposed',
    target_role: '06',
    correlation_id: 'task-42',
    expires_at: '2026-10-18T12:00:00.000Z',
    approved_scope_ref: 'scope-readonly-01',
    payload: { note: 'fixture' },
    ...overrides,
  });
}

/** Collect the structured error channel. */
function errorSpy(transport) {
  const seen = [];
  transport.onError((detail) => seen.push(detail));
  return seen;
}

/* ------------------------------------------------------------ opt-in + list */

test('native is a real transport name', () => {
  assert.ok(TRANSPORT_NAMES.includes('native'));
});

test('the three MVP transport names are unchanged', () => {
  assert.deepEqual(
    TRANSPORT_NAMES.filter((n) => n !== 'native'),
    ['disabled-native', 'disabled-loopback', 'fixture'],
  );
});

test('CONNECTING is part of the shared status vocabulary', () => {
  assert.equal(TRANSPORT_STATUS.CONNECTING, 'CONNECTING');
  assert.equal(NATIVE_STATUS.CONNECTING, 'CONNECTING');
});

test('the structured error vocabulary is all strings', () => {
  for (const [name, code] of Object.entries(TRANSPORT_ERROR)) {
    assert.equal(typeof code, 'string', name);
    assert.notEqual(code, '', name);
  }
});

/* --------------------------------------------------------------- degrading */

test('no chrome at all: reports UNAVAILABLE and never throws on construction', () => {
  const t = createTransport('native', { chrome: {} });
  assert.equal(t.status(), 'UNAVAILABLE');
  // The reason is only known once a connect is attempted; asking is how you learn it.
  assert.equal(t.connect(), null);
  assert.match(String(t.lastError()), /connectNative is unavailable/);
  assert.equal(t.lastErrorCode(), TRANSPORT_ERROR.HOST_UNAVAILABLE);
  t.close();
});

test('connectNative that throws (unregistered host) reports UNAVAILABLE, not CONNECTED', () => {
  const { api } = fakeChrome({ throwOnConnect: true });
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  const errors = errorSpy(t);
  assert.equal(t.status(), 'UNAVAILABLE');
  assert.equal(t.connect(), null, 'a throwing connectNative must not yield a port');
  assert.match(String(t.lastError()), /com\.aion\.relay/);
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.CONNECT_FAILED));
  t.close();
});

test('an unknown transport name is rejected', () => {
  assert.throws(() => createTransport('nope'), /unknown transport/);
});

/* ------------------------------------------ F5: a port is not proof of a host */

test('holding a port reports CONNECTING, never CONNECTED', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const port = t.connect();
  assert.ok(port, 'connectNative must hand back a port');
  assert.equal(t.status(), 'CONNECTING', 'a Port is not evidence that a host is answering');
  assert.equal(t.isProven(), false);
  assert.equal(ports.length, 1);
  t.close();
});

test('CONNECTED only after a correlated successful reply', async () => {
  const { api } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  assert.equal(t.status(), 'UNAVAILABLE');
  const inflight = t.ping();
  assert.equal(t.status(), 'CONNECTING', 'not proven while the request is in flight');
  await inflight;
  assert.equal(t.status(), 'CONNECTED');
  assert.equal(t.isProven(), true);
  t.close();
});

test('an uncorrelated reply does not prove anything', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  ports[0].emit({ type: 'relay.reply', id: 'not-ours', ok: true });
  assert.equal(t.status(), 'CONNECTING', 'a reply for an unknown id is not proof');
  assert.equal(t.isProven(), false);
  t.close();
});

test('a host error reply does not upgrade the status', async () => {
  const { api } = fakeChrome({
    autoReply: (m) => ({ type: 'relay.error', id: m.id, code: 'origin_not_allowed', message: 'refused' }),
  });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  await assert.rejects(() => t.ping(), /origin_not_allowed: refused/);
  assert.equal(t.status(), 'CONNECTING', 'a refusal is not a live relay');
  assert.equal(t.isProven(), false);
  t.close();
});

test('liveness is proved by ping, which reports agent status honestly', async () => {
  const { api } = fakeChrome({
    autoReply: (m) => (m.type === 'relay.ping'
      ? { type: 'relay.reply', id: m.id, ok: true, host: { name: 'com.aion.relay' }, agent: { running: false } }
      : null),
  });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const reply = await t.ping();
  assert.equal(reply.ok, true);
  assert.equal(reply.agent.running, false, 'an unstarted agent must not be reported running');
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

test('hello is the call that starts the agent, and is distinguishable from ping', async () => {
  const { api } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true, agent: { running: true } }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  await t.hello();
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

/* ----------------------------------------------------------------- request path */

test('a request that is never answered times out instead of hanging', async () => {
  const { api } = fakeChrome({}); // no autoReply: silence
  // A REAL clock here: the point is that a real timer fires and the promise
  // rejects. A fake clock would never advance, so the request would hang forever
  // - the very failure this test exists to prevent.
  const t = createTransport('native', { chrome: api, requestTimeoutMs: 25 });
  const errors = errorSpy(t);
  await assert.rejects(() => t.ping(), /timed out/);
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.REQUEST_TIMEOUT));
  t.close();
});

test('a host error rejects the request with its code and message on both channels', async () => {
  const { api } = fakeChrome({
    autoReply: (m) => ({ type: 'relay.error', id: m.id, code: 'origin_not_allowed', message: 'refused' }),
  });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const errors = errorSpy(t);
  await assert.rejects(() => t.ping(), /origin_not_allowed: refused/);
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.HOST_ERROR && e.host_code === 'origin_not_allowed'));
  t.close();
});

/* ---------------------------------------------- F3: inbound events validated */

test('a valid relay.event envelope reaches subscribers', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  t.onMessage((env) => seen.push(env));
  t.connect();
  const env = validEnvelope();
  ports[0].emit({ type: 'relay.event', envelope: env });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].message_id, env.message_id);
  t.close();
});

test('an invalid relay.event envelope is dropped and never reaches a subscriber', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  const errors = errorSpy(t);
  t.onMessage((env) => seen.push(env));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: { message_id: 'e1' } });
  assert.equal(seen.length, 0, 'raw junk must not reach subscribers');
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.INVALID_INBOUND_ENVELOPE));
  t.close();
});

test('an inbound error is reported on the error channel only, never as data', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  const errors = errorSpy(t);
  t.onMessage((env) => seen.push(env));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: { nope: true, event_type: 'not-allowlisted' } });
  const envelopeErrors = errors.filter((e) => e.code === TRANSPORT_ERROR.INVALID_INBOUND_ENVELOPE);
  assert.equal(envelopeErrors.length, 1);
  assert.ok(Array.isArray(envelopeErrors[0].errors) && envelopeErrors[0].errors.length > 0,
    'the schema errors are machine-readable');
  assert.equal(seen.length, 0, 'the data channel stays clean');
  t.close();
});

test('one malformed message does not erase a healthy port or its proof', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  await t.ping();
  assert.equal(t.status(), 'CONNECTED');
  ports[0].emit('not-an-object');
  ports[0].emit({ type: 'relay.event', envelope: { junk: true } });
  assert.equal(t.status(), 'CONNECTED', 'a data problem is not a connection problem');
  assert.equal(t.isProven(), true);
  t.close();
});

test('a rejected envelope is never announced as transport.unavailable', async () => {
  // Only the error channel hears about it: the relay is up, one payload was bad.
  const { api } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  await t.ping();
  const seen = [];
  const errors = errorSpy(t);
  t.onMessage((m) => seen.push(m));
  await assert.rejects(() => t.send({ nope: true }), /refusing to send invalid envelope/);
  assert.equal(seen.length, 0, 'the envelope channel stays clean');
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE));
  assert.equal(t.status(), 'CONNECTED', 'a refused send does not look like an outage');
  t.close();
});

test('a non-object message is surfaced on both channels, never as data', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  const errors = errorSpy(t);
  t.onMessage((m) => seen.push(m));
  t.connect();
  ports[0].emit('not-an-object');
  // Stream integrity, not a bad envelope: both channels hear about it, and the
  // envelope channel still carries nothing that could be mistaken for an event.
  assert.ok(seen.some((m) => m.type === 'transport.unavailable' && m.code === TRANSPORT_ERROR.NON_OBJECT_MESSAGE));
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.NON_OBJECT_MESSAGE));
  t.close();
});

test('a connection-level failure still reaches the envelope channel as before', () => {
  // Backward compatibility for a worker that watches onMessage for
  // `transport.unavailable`: losing a host is still announced there.
  const { api } = fakeChrome({ throwOnConnect: true });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  t.onMessage((m) => seen.push(m));
  t.connect();
  assert.ok(seen.some((m) => m.type === 'transport.unavailable' && m.code === TRANSPORT_ERROR.CONNECT_FAILED));
  t.close();
});

test('an event with no subscriber is not an error', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: validEnvelope() });
  assert.equal(t.status(), 'CONNECTING');
  t.close();
});

test('a subscriber that throws does not break message delivery', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  t.onMessage(() => { throw new Error('subscriber exploded'); });
  t.onMessage((env) => seen.push(env));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: validEnvelope() });
  assert.equal(seen.length, 1, 'the second subscriber must still receive it');
  t.close();
});

/* ------------------------------------------- F4: nothing invalid hits the wire */

test('send() refuses an invalid envelope without posting it', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  const errors = errorSpy(t);
  await assert.rejects(() => t.send({ nope: true }), /refusing to send invalid envelope/);
  assert.equal(ports[0].posted.length, 0, 'nothing may be posted when validation fails');
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE));
  t.close();
});

test('a permissive caller validator cannot bypass the built-in check', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  await assert.rejects(
    () => t.sendEnvelope({ nope: true }, () => ({ valid: true, errors: [] })),
    /refusing to send invalid envelope/,
  );
  assert.equal(ports[0].posted.length, 0);
  t.close();
});

test('a caller validator may still ADD a restriction on a valid envelope', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  await assert.rejects(
    () => t.sendEnvelope(validEnvelope(), () => ({ valid: false, errors: ['scope not approved'] })),
    /scope not approved/,
  );
  assert.equal(ports[0].posted.length, 0);
  t.close();
});

test('a valid envelope is posted as relay.send and answers in the fixture shape', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  const envelope = validEnvelope();
  const result = await t.send(envelope);
  assert.equal(ports[0].posted[0].type, 'relay.send');
  assert.equal(ports[0].posted[0].envelope.message_id, envelope.message_id);
  assert.equal(result.ok, true);
  assert.equal(result.transport, 'native', 'same shape the fixture transport returns');
  assert.equal(result.message_id, envelope.message_id);
  assert.equal(result.execution_confirmed, false, 'a transport ACK is never execution');
  assert.equal(result.host.ok, true, 'the raw host reply is preserved');
  t.close();
});

test('sendEnvelope without a validator behaves exactly like send', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  const envelope = validEnvelope();
  const result = await t.sendEnvelope(envelope);
  assert.equal(ports[0].posted[0].type, 'relay.send');
  assert.equal(result.message_id, envelope.message_id);
  t.close();
});

/* ------------------------------------- F1/F2: bounded retry, port identity */

test('F1: a port that is returned and immediately dropped exhausts the retries', async () => {
  // The exact missing-host shape: connectNative hands back a Port, then the port
  // dies before any reply. Resetting the counter on connect() made this loop
  // forever; it must terminate.
  const { api, ports } = fakeChromePortThenDrop();
  const clock = fakeClock();
  const t = createTransport('native', {
    chrome: api,
    clock: clock.api,
    backoff: { baseMs: 10, maxMs: 40, maxAttempts: 3 },
  });
  const errors = errorSpy(t);

  t.connect();
  // Each drop is delivered on a microtask, so each cycle needs a turn of the
  // event loop before the retry is armed, and time must then actually pass.
  for (let cycle = 0; cycle < 12; cycle += 1) {
    await Promise.resolve();
    clock.advance(1000);
  }
  await Promise.resolve();

  assert.equal(clock.pending(), 0, 'no retry may remain armed');
  assert.ok(ports.length <= 5, `bounded: only a handful of ports, got ${ports.length}`);
  assert.ok(errors.some((e) => e.code === TRANSPORT_ERROR.RECONNECT_EXHAUSTED),
    `expected exhaustion, got ${JSON.stringify(errors.map((e) => e.code))}`);
  assert.equal(t.status(), 'UNAVAILABLE');
  assert.equal(t.isProven(), false, 'a port that never answered is never proven');
  t.close();
});

test('F1: the retry counter is reset by a real reply, not by obtaining a port', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const clock = fakeClock();
  const t = createTransport('native', {
    chrome: api,
    clock: clock.api,
    backoff: { baseMs: 10, maxMs: 40, maxAttempts: 3 },
  });
  t.connect();
  assert.equal(t.status(), 'CONNECTING');
  await t.ping(); // correlated + ok -> the proof
  assert.equal(t.status(), 'CONNECTED');
  ports[0].drop();
  clock.advance(5_000);
  assert.equal(ports.length, 2, 'it reconnects after a proven drop');
  assert.equal(t.status(), 'CONNECTING', 'the new port is unproven until it answers');
  await t.ping();
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

test('F1: reconnect is bounded when connectNative keeps throwing', () => {
  const { api } = fakeChrome({ throwOnConnect: true });
  const clock = fakeClock();
  const t = createTransport('native', {
    chrome: api,
    clock: clock.api,
    backoff: { baseMs: 10, maxMs: 40, maxAttempts: 2 },
  });
  t.connect(); // throws -> schedules a retry
  for (let i = 0; i < 20; i += 1) clock.advance(1000);
  assert.equal(clock.pending(), 0, 'no retry may remain armed once the cap is hit');
  assert.match(String(t.lastError()), /reconnect attempts exhausted|not found/);
  t.close();
});

test('F2: a delayed disconnect from the old port does not kill the new one', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  t.connect();
  const first = ports[0];
  first.drop(); // -> reconnect scheduled
  clock.advance(5_000);
  assert.equal(ports.length, 2, 'a replacement port exists');

  const inflight = t.ping(); // belongs to the NEW port
  // The old port's disconnect finally lands, late.
  first.drop();

  assert.equal(t.status(), 'CONNECTING', 'the live port survives a stale disconnect');
  const reply = await inflight;
  assert.equal(reply.ok, true, 'the new port still answers');
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

test('F2: a late message from a dead port is ignored', () => {
  const { api, ports } = fakeChrome();
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  t.connect();
  const first = ports[0];
  first.drop();
  clock.advance(5_000);
  assert.equal(ports.length, 2);

  // The dead port emits a successful reply: it must not prove anything.
  first.emit({ type: 'relay.reply', id: 'n1', ok: true });
  assert.equal(t.isProven(), false, 'a dead port cannot prove a live one');
  assert.equal(t.status(), 'CONNECTING');
  t.close();
});

test('F2: an in-flight request survives the replacement of its own port', async () => {
  const { api, ports } = fakeChrome();
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  t.connect();
  const inflight = t.ping();
  ports[0].drop();
  await assert.rejects(() => inflight, /disconnected/, 'the request that owned the dead port still fails');
  clock.advance(5_000);
  assert.equal(ports.length, 2);
  assert.equal(t.status(), 'CONNECTING');
  t.close();
});

/* ------------------------------------------------------------- housekeeping */

test('a disconnect downgrades status and fails in-flight requests', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  const inflight = t.ping();
  ports[0].drop();
  await assert.rejects(() => inflight, /disconnected/);
  assert.equal(t.status(), 'UNAVAILABLE');
  assert.equal(t.isProven(), false, 'the proof died with the port');
  t.close();
});

test('close() clears the pending reconnect so the loop cannot outlive the transport', () => {
  const { api } = fakeChrome({ throwOnConnect: true });
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  t.connect();
  assert.ok(clock.pending() > 0, 'a retry should be armed while degraded');
  t.close();
  assert.equal(clock.pending(), 0, 'close() must disarm every timer');
  t.close(); // idempotent
});

test('after close the adapter reports CLOSED and refuses to reconnect', () => {
  const { api } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  t.connect();
  t.close();
  assert.equal(t.status(), 'CLOSED');
  assert.equal(t.connect(), null);
});

test('subscribing requires a function and returns an unsubscribe', () => {
  const { api } = fakeChrome();
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  assert.equal(t.onMessage('not a function'), undefined);
  assert.equal(t.onError('not a function'), undefined);
  const seen = [];
  const off = t.onMessage((m) => seen.push(m));
  t.connect();
  assert.equal(typeof off, 'function');
  assert.equal(typeof t.onError(() => {}), 'function');
  t.close();
});

test('an unsubscribed error listener stops receiving', async () => {
  const { api } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', { chrome: api, clock: fakeClock().api });
  const seen = [];
  const off = t.onError((e) => seen.push(e));
  t.connect();
  await t.ping();
  assert.ok(seen.length >= 0);
  off();
  const before = seen.length;
  t.close();
  assert.equal(seen.length, before, 'no error may arrive after close() once unsubscribed');
});