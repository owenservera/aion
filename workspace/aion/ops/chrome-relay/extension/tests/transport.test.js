// Transport tests — OPENCODE-BUILD-ORDER.md item 4: "do not connect real
// hosts or silently send tasks in MVP".
import test from 'node:test';
import assert from 'node:assert/strict';

import { createEnvelope } from '../src/lib/envelope.js';
import { createEventStore } from '../src/lib/store.js';
import { TRANSPORT_NAMES, TRANSPORT_STATUS, createTransport } from '../src/lib/transport.js';

/** Resolve after the current microtask queue drains. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function envelope(overrides = {}) {
  return createEnvelope({
    producer_node: 'node-ext-01',
    target_node: 'node-native-01',
    target_role: '06',
    event_type: 'task.proposed',
    correlation_id: 'task-1',
    expires_at: '2999-01-01T00:00:00.000Z',
    payload: { title: 'fixture' },
    ...overrides,
  });
}

test('the three MVP transport names are still exposed, plus the live native adapter', () => {
  // The 'native' adapter was added for the native-host milestone. The MVP three are
  // unchanged and still refuse to perform I/O; 'native' is the single opt-in
  // live adapter.
  // (MVP guarantee: none of the three perform I/O.)
  assert.deepEqual(
    [...TRANSPORT_NAMES].filter((n) => n !== 'native'),
    ['disabled-native', 'disabled-loopback', 'fixture'],
  );
  assert.ok(TRANSPORT_NAMES.includes('native'));
});

test('an unknown transport name fails loudly at construction', () => {
  assert.throws(() => createTransport('websocket'), /unknown transport/);
  assert.throws(() => createTransport(''), /unknown transport/);
  assert.throws(() => createTransport(undefined), /unknown transport/);
});

test('a disabled transport reports DISABLED and is not enabled', () => {
  for (const name of ['disabled-native', 'disabled-loopback']) {
    const transport = createTransport(name);
    assert.equal(transport.name, name);
    assert.equal(transport.enabled, false);
    assert.equal(transport.status(), TRANSPORT_STATUS.DISABLED);
  }
});

test('a disabled transport refuses to send and performs no I/O', async () => {
  // Tripwires: if any code path reached the network these throw and the test
  // fails loudly. The MVP must not be able to contact a real host.
  const tripwires = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator'];
  const originals = new Map();
  const touched = [];
  for (const key of tripwires) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get() {
        touched.push(key);
        throw new Error(`transport touched globalThis.${key}`);
      },
    });
  }

  try {
    for (const name of ['disabled-native', 'disabled-loopback']) {
      const transport = createTransport(name);
      await assert.rejects(
        () => transport.send(envelope()),
        /disabled in the MVP fixture build/,
        `${name} must refuse to send`,
      );
    }
    assert.deepEqual(touched, [], 'a refused send must not touch any global I/O surface');
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('a disabled transport has no message source and does not throw on subscribe', () => {
  const transport = createTransport('disabled-native');
  let fired = 0;
  const unsubscribe = transport.onMessage(() => {
    fired += 1;
  });
  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
  transport.close();
  assert.equal(fired, 0);
  assert.equal(transport.replay(), 0);
});

test('a disabled send leaves the event UNSENT in the outbox', async () => {
  const store = createEventStore();
  const transport = createTransport('disabled-native');
  const env = envelope();
  await store.append(env);

  await assert.rejects(() => transport.send(env));
  // Mode D: queued, visibly unsent, never claimed as delivered.
  assert.equal(store.list()[0].delivery_state, 'OUTBOX');
  assert.equal(store.cursor(), 0);
  assert.equal(store.retryable().length, 1);
});

test('the fixture transport is enabled and performs no I/O either', () => {
  const transport = createTransport('fixture');
  assert.equal(transport.enabled, true);
  assert.equal(transport.status(), TRANSPORT_STATUS.READY);
});

test('the fixture transport replays its fixtures to a listener', async () => {
  const fixtures = [
    envelope({ message_id: 'f1', idempotency_key: 'f1' }),
    envelope({ message_id: 'f2', idempotency_key: 'f2', event_type: 'relay.hello', task_state: 'PROPOSED' }),
  ];
  const transport = createTransport('fixture', { fixtures });
  const seen = [];
  transport.onMessage((env) => seen.push(env.message_id));

  await flush();
  assert.deepEqual(seen, ['f1', 'f2']);
});

test('a late fixture subscriber still receives the corpus', async () => {
  const transport = createTransport('fixture', { fixtures: [envelope({ message_id: 'f1', idempotency_key: 'f1' })] });
  const first = [];
  transport.onMessage((env) => first.push(env.message_id));
  await flush();

  const second = [];
  transport.onMessage((env) => second.push(env.message_id));
  await flush();
  assert.deepEqual(first, ['f1']);
  assert.deepEqual(second, ['f1'], 'a UI panel that mounts late is not left with a blank state');
});

test('an unsubscribe stops delivery', async () => {
  const transport = createTransport('fixture', { fixtures: [envelope({ message_id: 'f1', idempotency_key: 'f1' })] });
  const seen = [];
  const unsubscribe = transport.onMessage((env) => seen.push(env.message_id));
  unsubscribe();
  transport.replay();
  await flush();
  assert.deepEqual(seen, []);
});

test('fixture replay is explicit and re-deliverable', async () => {
  const transport = createTransport('fixture', { fixtures: [envelope({ message_id: 'f1', idempotency_key: 'f1' })] });
  const seen = [];
  transport.onMessage((env) => seen.push(env.message_id));
  await flush();
  assert.equal(transport.replay(), 1);
  await flush();
  assert.deepEqual(seen, ['f1', 'f1']);
});

test('a malformed fixture is skipped rather than thrown at the UI', async () => {
  const broken = envelope({ message_id: 'bad', idempotency_key: 'bad' });
  delete broken.event_type;
  const transport = createTransport('fixture', {
    fixtures: [broken, envelope({ message_id: 'good', idempotency_key: 'good' })],
  });
  const seen = [];
  transport.onMessage((env) => seen.push(env.message_id));
  await flush();
  assert.deepEqual(seen, ['good']);
});

test('the fixture transport accepts a valid send and rejects an invalid one', async () => {
  const transport = createTransport('fixture');
  const receipt = await transport.send(envelope());
  assert.equal(receipt.ok, true);
  assert.equal(receipt.transport, 'fixture');
  assert.equal(transport.sentCount(), 1);

  const broken = envelope({ message_id: 'bad', idempotency_key: 'bad' });
  broken.event_type = 'task.exec';
  await assert.rejects(() => transport.send(broken), /refusing to send invalid envelope/);
  assert.equal(transport.sentCount(), 1, 'a refused send leaves no trace');
});

test('fixtures may be supplied lazily by a function', async () => {
  const transport = createTransport('fixture', { fixtures: () => [envelope({ message_id: 'lazy', idempotency_key: 'lazy' })] });
  const seen = [];
  transport.onMessage((env) => seen.push(env.message_id));
  await flush();
  assert.deepEqual(seen, ['lazy']);
});

test('a non-array fixture set is rejected', () => {
  const transport = createTransport('fixture', { fixtures: 'nope' });
  assert.throws(() => transport.onMessage(() => {}), /must be an array or a function/);
});

test('close() makes the transport refuse sends and cancel queued deliveries', async () => {
  const transport = createTransport('fixture', { fixtures: [envelope({ message_id: 'f1', idempotency_key: 'f1' })] });
  const seen = [];
  transport.onMessage((env) => seen.push(env.message_id));
  transport.close(); // connection drops before the queued microtask runs

  assert.equal(transport.status(), TRANSPORT_STATUS.CLOSED);
  assert.equal(transport.enabled, true, 'closed is a runtime state, not a build-time disable');
  await flush();
  assert.deepEqual(seen, [], 'a delivery in flight when the connection died is not delivered');

  await assert.rejects(() => transport.send(envelope()), /closed/);
});

test('onMessage requires a callback', () => {
  const transport = createTransport('fixture');
  assert.throws(() => transport.onMessage(null), /requires a callback/);
});

test('the fixture transport fabricates no ACK: delivery and execution stay separate', async () => {
  const store = createEventStore();
  const transport = createTransport('fixture');
  const env = envelope();
  await store.append(env);

  await transport.send(env);
  assert.equal(store.list()[0].delivery_state, 'OUTBOX', 'a send is not an ack');
  assert.equal(store.cursor(), 0);
  assert.equal(store.ackIsNotExecution(), true);
});
