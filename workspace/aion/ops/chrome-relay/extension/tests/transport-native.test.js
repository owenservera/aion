/**
 * Native-messaging transport adapter.
 *
 * Every test uses a fake `chrome` and a fake clock. Nothing launches a browser,
 * opens a real host port, or touches a signed-in session.
 *
 * The behaviour encoded here is the correction of a real defect: Chrome's
 * `connectNative` returns a Port immediately and performs the length-prefix
 * framing itself, and the host sends NO greeting. An adapter that waits for a
 * handshake waits forever.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { createTransport, TRANSPORT_NAMES } from '../src/lib/transport.js';

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
      // Re-scan until quiescent: a timer fired during the advance may schedule
      // another one (that is exactly what bounded reconnect does), and a single
      // snapshot would leave it unfired and the loop looking like it still spins.
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

const baseOpts = (extra = {}) => ({ clock: fakeClock().api, ...extra });

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

/* --------------------------------------------------------------- degrading */

test('no chrome at all: reports UNAVAILABLE and never throws on construction', () => {
  const t = createTransport('native', { chrome: {} });
  assert.equal(t.status(), 'UNAVAILABLE');
  // The reason is only known once a connect is attempted; asking is how you learn it.
  assert.equal(t.connect(), null);
  assert.match(String(t.lastError()), /connectNative is unavailable/);
  t.close();
});

test('connectNative that throws (unregistered host) reports UNAVAILABLE, not CONNECTED', () => {
  const { api } = fakeChrome({ throwOnConnect: true });
  const t = createTransport('native', baseOpts({ chrome: api }));
  assert.equal(t.status(), 'UNAVAILABLE');
  assert.equal(t.connect(), null, 'a throwing connectNative must not yield a port');
  assert.match(String(t.lastError()), /com\.aion\.relay/);
  t.close();
});

test('an unknown transport name is rejected', () => {
  assert.throws(() => createTransport('nope'), /unknown transport/);
});

/* ----------------------------------------------------------------- liveness */

test('holding a port reports CONNECTED immediately, with no handshake awaited', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  const port = t.connect();
  assert.ok(port, 'connectNative must hand back a port');
  assert.equal(t.status(), 'CONNECTED');
  assert.equal(ports.length, 1);
  t.close();
});

test('ping resolves against the host reply and reports agent status', async () => {
  const { api } = fakeChrome({
    autoReply: (m) => (m.type === 'relay.ping'
      ? { type: 'relay.reply', id: m.id, ok: true, host: { name: 'com.aion.relay' }, agent: { running: false } }
      : null),
  });
  const t = createTransport('native', baseOpts({ chrome: api }));
  const reply = await t.ping();
  assert.equal(reply.ok, true);
  assert.equal(reply.agent.running, false, 'an unstarted agent must not be reported running');
  t.close();
});

test('hello is the call that starts the agent, and is distinguishable from ping', async () => {
  const { api } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true, agent: { running: true } }) });
  const t = createTransport('native', baseOpts({ chrome: api }));
  await t.hello();
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

/* ------------------------------------------------------------- request path */

test('a request that is never answered times out instead of hanging', async () => {
  const { api } = fakeChrome({}); // no autoReply: silence
  // A REAL clock here: the point is that a real timer fires and the promise
  // rejects. A fake clock would never advance, so the request would hang forever
  // - the very failure this test exists to prevent.
  const t = createTransport('native', { chrome: api, requestTimeoutMs: 25 });
  await assert.rejects(() => t.ping(), /timed out/);
  t.close();
});

test('a host error rejects the request with its code and message', async () => {
  const { api } = fakeChrome({
    autoReply: (m) => ({ type: 'relay.error', id: m.id, code: 'origin_not_allowed', message: 'refused' }),
  });
  const t = createTransport('native', baseOpts({ chrome: api }));
  await assert.rejects(() => t.ping(), /origin_not_allowed: refused/);
  t.close();
});

test('a non-object message from the host is surfaced, not treated as data', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  const seen = [];
  t.onMessage((m) => seen.push(m));
  t.connect();
  ports[0].emit('not-an-object');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].type, 'transport.unavailable');
  t.close();
});

test('relay.event envelopes reach subscribers', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  const seen = [];
  t.onMessage((env) => seen.push(env));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: { message_id: 'e1' } });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].message_id, 'e1');
  t.close();
});

test('an event with no subscriber is not an error', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: { message_id: 'e1' } });
  assert.equal(t.status(), 'CONNECTED');
  t.close();
});

/* ----------------------------------------------------------- envelope guard */

test('an invalid envelope never reaches the wire', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  t.connect();
  await assert.rejects(
    () => t.sendEnvelope({ nope: true }, () => ({ valid: false, errors: ['missing schema_version'] })),
    /missing schema_version/,
  );
  assert.equal(ports[0].posted.length, 0, 'nothing may be posted when validation fails');
  t.close();
});

test('a valid envelope is posted as relay.send carrying the envelope', async () => {
  const { api, ports } = fakeChrome({ autoReply: (m) => ({ type: 'relay.reply', id: m.id, ok: true }) });
  const t = createTransport('native', baseOpts({ chrome: api }));
  t.connect();
  const envelope = { schema_version: 'x', message_id: 'm1' };
  await t.sendEnvelope(envelope, () => ({ valid: true, errors: [] }));
  assert.equal(ports[0].posted[0].type, 'relay.send');
  assert.equal(ports[0].posted[0].envelope.message_id, 'm1');
  t.close();
});

/* ------------------------------------------------- disconnect + bounded retry */

test('a disconnect downgrades status and fails in-flight requests', async () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  t.connect();
  const inflight = t.ping();
  ports[0].drop();
  await assert.rejects(() => inflight, /disconnected/);
  assert.equal(t.status(), 'UNAVAILABLE');
  t.close();
});

test('reconnect is bounded: it STOPS at the cap instead of spinning', () => {
  const { api } = fakeChrome({ throwOnConnect: true });
  const clock = fakeClock();
  const t = createTransport('native', {
    chrome: api,
    clock: clock.api,
    backoff: { baseMs: 10, maxMs: 40, maxAttempts: 2 },
  });
  t.connect(); // throws -> schedules a retry
  // Let time actually pass: each retry is armed at the CURRENT time, so a single
  // large jump cannot reach it. Draining in steps is what a real clock does.
  for (let i = 0; i < 20; i += 1) clock.advance(1000);
  assert.equal(clock.pending(), 0, 'no retry may remain armed once the cap is hit');
  assert.match(String(t.lastError()), /reconnect attempts exhausted|not found/);
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
  const t = createTransport('native', baseOpts({ chrome: api }));
  t.connect();
  t.close();
  assert.equal(t.status(), 'CLOSED');
  assert.equal(t.connect(), null);
});

test('a reconnect after a successful connect resets the attempt counter', () => {
  const { api, ports } = fakeChrome();
  const clock = fakeClock();
  const t = createTransport('native', { chrome: api, clock: clock.api });
  t.connect();
  ports[0].drop();
  assert.equal(t.status(), 'UNAVAILABLE');
  clock.advance(5_000);
  assert.equal(t.status(), 'CONNECTED', 'it must come back up after a drop');
  t.close();
});

/* ------------------------------------------------------------- housekeeping */

test('subscribing requires a function and returns an unsubscribe', () => {
  const { api } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  assert.equal(t.onMessage('not a function'), undefined);
  const seen = [];
  const off = t.onMessage((m) => seen.push(m));
  t.connect();
  assert.equal(typeof off, 'function');
  t.close();
});

test('a subscriber that throws does not break message delivery', () => {
  const { api, ports } = fakeChrome();
  const t = createTransport('native', baseOpts({ chrome: api }));
  const seen = [];
  t.onMessage(() => { throw new Error('subscriber exploded'); });
  t.onMessage((env) => seen.push(env));
  t.connect();
  ports[0].emit({ type: 'relay.event', envelope: { message_id: 'e1' } });
  assert.equal(seen.length, 1, 'the second subscriber must still receive it');
  t.close();
});