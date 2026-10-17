// Event store tests — restart/outbox retention, duplicate ACK, dropped
// connection, stale presence and proof vs transport status, per
// OPENCODE-BUILD-ORDER.md item 5.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createEnvelope } from '../src/lib/envelope.js';
import { createEventStore } from '../src/lib/store.js';
import { createTransport } from '../src/lib/transport.js';

/**
 * In-memory stand-in for chrome.storage.local / SQLite.
 *
 * load() hands back clones on purpose: a real storage adapter round-trips
 * through JSON, so the restarted store must not be able to reach back into the
 * previous process's objects.
 */
function memoryAdapter() {
  let rows = [];
  return {
    saves: 0,
    async load() {
      return structuredClone(rows);
    },
    async save(envs) {
      this.saves += 1;
      rows = structuredClone(envs);
    },
    peek() {
      return structuredClone(rows);
    },
  };
}

function envelope(overrides = {}) {
  return createEnvelope({
    producer_node: 'node-ext-01',
    target_node: 'node-native-01',
    target_role: '06',
    event_type: 'task.proposed',
    correlation_id: 'task-1',
    idempotency_key: 'task-1:propose',
    expires_at: '2999-01-01T00:00:00.000Z',
    payload_hash: 'hash-1',
    payload: { title: 'fixture task' },
    ...overrides,
  });
}

/* ------------------------------------------------------------ sequencing */

test('the store assigns monotonic sequences and keeps list() ordered', async () => {
  const store = createEventStore();
  await store.ready();

  const a = await store.append(envelope({ idempotency_key: 'k-a', correlation_id: 'task-a' }));
  const b = await store.append(envelope({ idempotency_key: 'k-b', correlation_id: 'task-b' }));
  const c = await store.append(envelope({ idempotency_key: 'k-c', correlation_id: 'task-c' }));

  assert.equal(a.envelope.sequence, 1);
  assert.equal(b.envelope.sequence, 2);
  assert.equal(c.envelope.sequence, 3);
  assert.deepEqual(store.list().map((e) => e.sequence), [1, 2, 3]);
});

test('list() returns a copy the caller cannot splice', async () => {
  const store = createEventStore();
  await store.append(envelope());
  const snapshot = store.list();
  snapshot.push(envelope({ idempotency_key: 'ghost' }));
  assert.equal(store.list().length, 1);
});

test('an invalid envelope is refused, not stored', async () => {
  const store = createEventStore();
  const broken = envelope();
  delete broken.event_type;
  await assert.rejects(() => store.append(broken), /refusing to append invalid envelope/);
  assert.equal(store.list().length, 0);
});

test('a persist adapter without load/save is rejected at construction', () => {
  assert.throws(() => createEventStore({ persist: {} }), /must provide load\(\) and save\(\)/);
});

/* ---------------------------------------------------------------- dedupe */

test('dedupe: appending the same message_id twice stores it once', async () => {
  const store = createEventStore();
  const env = envelope();

  const first = await store.append(env);
  const second = await store.append(env);

  assert.equal(first.stored, true);
  assert.equal(first.reason, 'stored');
  assert.equal(second.stored, false);
  assert.equal(second.reason, 'duplicate_message_id');
  assert.equal(store.list().length, 1, 'exactly one event survives');
  assert.equal(store.byIdempotencyKey(env.idempotency_key).message_id, env.message_id);
});

test('dedupe: a re-encoded duplicate is still the same event', async () => {
  // Same message, different key order and a lost null: must not be executed twice.
  const store = createEventStore();
  const env = envelope();
  await store.append(env);

  const reordered = {};
  for (const key of [...Object.keys(env)].reverse()) reordered[key] = env[key];
  const result = await store.append(reordered);

  assert.equal(result.stored, false);
  assert.equal(store.list().length, 1);
});

test('dedupe: one message_id with two different bodies is refused as a conflict', async () => {
  const store = createEventStore();
  const env = envelope();
  await store.append(env);

  await assert.rejects(
    () => store.append({ ...env, payload: { title: 'something else entirely' } }),
    /already stored with different content/,
  );
  assert.equal(store.list().length, 1, 'the stored event is not overwritten');
});

test('dedupe: same idempotency_key, new message_id is a replay and is NOT executed', async () => {
  const store = createEventStore();
  const original = envelope({ idempotency_key: 'task-1:dispatch', message_id: 'msg-original' });
  const replay = envelope({
    idempotency_key: 'task-1:dispatch',
    message_id: 'msg-replay',
    created_at: '2026-10-17T12:05:00.000Z',
    payload: { title: 'fixture task' },
  });

  await store.append(original);
  const result = await store.append(replay);

  assert.equal(result.stored, false);
  assert.equal(result.reason, 'replay_idempotency_key');
  assert.equal(store.list().length, 1, 'the replay is never stored, so it can never be executed');
  assert.equal(store.wasReplayed(replay), true);
  assert.equal(store.wasReplayed(original), false);
  assert.equal(store.wasReplayed('msg-replay'), true);
  // The replay points back at the message that owns the work.
  assert.equal(result.envelope.message_id, 'msg-original');
});

test('a replay after a restart is still a replay, not new work', async () => {
  const adapter = memoryAdapter();
  const first = createEventStore({ persist: adapter });
  await first.append(envelope({ idempotency_key: 'task-1:dispatch', message_id: 'msg-original' }));

  const restarted = createEventStore({ persist: adapter });
  await restarted.ready();
  const result = await restarted.append(envelope({
    idempotency_key: 'task-1:dispatch',
    message_id: 'msg-replay',
    created_at: '2026-10-17T12:05:00.000Z',
  }));

  assert.equal(result.reason, 'replay_idempotency_key');
  assert.equal(restarted.list().length, 1);
});

/* -------------------------------------------------------- restart / outbox */

test('restart: every event survives and the cursor is intact', async () => {
  const adapter = memoryAdapter();
  const before = createEventStore({ persist: adapter });

  const proposed = envelope({ idempotency_key: 'task-1:propose', message_id: 'msg-1', correlation_id: 'task-1' });
  const approved = envelope({
    idempotency_key: 'task-1:approve',
    message_id: 'msg-2',
    correlation_id: 'task-1',
    event_type: 'task.approved',
    task_state: 'APPROVED',
    causation_id: 'msg-1',
  });
  const progress = envelope({
    idempotency_key: 'task-1:progress',
    message_id: 'msg-3',
    correlation_id: 'task-1',
    event_type: 'task.progress',
    task_state: 'RUNNING',
    causation_id: 'msg-2',
  });

  await before.append(proposed);
  await before.append(approved);
  await before.append(progress);
  await before.markSent('msg-1');
  await before.markSent('msg-2');
  await before.markAcked('msg-1');
  await before.markAcked('msg-2');
  // msg-3 was persisted but never sent: it must still be here, still OUTBOX.

  assert.equal(before.cursor(), 2);
  assert.equal(before.retryable().length, 1);
  const persistedBefore = adapter.peek();

  // --- simulate the service worker being suspended and restarted ---
  const after = createEventStore({ persist: adapter });
  await after.ready();

  const survived = after.list();
  assert.equal(survived.length, 3, 'no event is lost across a restart');
  assert.deepEqual(survived.map((e) => e.message_id), ['msg-1', 'msg-2', 'msg-3']);
  assert.deepEqual(survived, persistedBefore, 'the rehydrated log is identical, delivery states included');

  assert.equal(after.cursor(), 2, 'the acknowledged cursor is intact');
  assert.equal(after.byIdempotencyKey('task-1:approve').task_state, 'APPROVED');
  assert.equal(after.byTask('task-1').length, 3);
  assert.equal(after.retryable().length, 1);
  assert.equal(after.retryable()[0].message_id, 'msg-3', 'the unsent event is still queued after restart');
  assert.equal(after.retryable()[0].delivery_state, 'OUTBOX');

  // The restarted store resumes from the cursor without re-delivering acked work.
  await after.markSent('msg-3');
  await after.markAcked('msg-3');
  assert.equal(after.cursor(), 3);
  assert.equal(after.retryable().length, 0);
});

test('restart: an empty outbox starts at cursor 0', async () => {
  const store = createEventStore({ persist: memoryAdapter() });
  await store.ready();
  assert.equal(store.cursor(), 0);
  assert.deepEqual(store.list(), []);
});

test('restart: a corrupt persisted log surfaces instead of reading as empty', async () => {
  const adapter = memoryAdapter();
  const good = createEventStore({ persist: adapter });
  await good.append(envelope());
  const rows = adapter.peek();
  rows[0].event_type = 'task.exec'; // forged / corrupted on disk

  const bad = createEventStore({
    persist: {
      async load() {
        return rows;
      },
      async save() {},
    },
  });
  await assert.rejects(() => bad.ready(), /failed to load|invalid/);
});

test('restart: delivery_state survives the round trip through the adapter', async () => {
  const adapter = memoryAdapter();
  const store = createEventStore({ persist: adapter });
  await store.append(envelope({ message_id: 'm1', idempotency_key: 'k1' }));
  await store.append(envelope({ message_id: 'm2', idempotency_key: 'k2' }));
  await store.markSent('m1');
  await store.markSent('m2');
  // A nack only means something after a send; an unsent event cannot be nacked.
  await store.markNacked('m2');

  const restarted = createEventStore({ persist: adapter });
  await restarted.ready();
  assert.equal(restarted.list().find((e) => e.message_id === 'm1').delivery_state, 'SENT');
  assert.equal(restarted.list().find((e) => e.message_id === 'm2').delivery_state, 'RETRY');
});

/* ------------------------------------------------------- duplicate ACKs */

test('duplicate ACK is idempotent: state stays ACKED and the cursor does not move', async () => {
  const store = createEventStore();
  const first = await store.append(envelope({ message_id: 'm1', idempotency_key: 'k1' }));
  await store.append(envelope({ message_id: 'm2', idempotency_key: 'k2' }));
  await store.markSent('m1');
  await store.markSent('m2');
  await store.markAcked('m1');
  await store.markAcked('m2');
  assert.equal(store.cursor(), 2);

  // A redelivered ACK for m1 must not throw, must not reset anything, and must
  // not drag the cursor backwards.
  await store.markAcked('m1');
  await store.markAcked('m1');

  const m1 = store.list().find((e) => e.message_id === 'm1');
  assert.equal(m1.delivery_state, 'ACKED');
  assert.equal(store.cursor(), 2, 'the cursor is monotonic across duplicate ACKs');
  assert.equal(store.retryable().length, 0);
  assert.equal(store.ackIsNotExecution(), true, 'the ACK-is-not-execution rule is encoded in the store');
});

test('an ACK cannot be walked back by a late NACK', async () => {
  const store = createEventStore();
  await store.append(envelope({ message_id: 'm1', idempotency_key: 'k1' }));
  await store.markSent('m1');
  await store.markAcked('m1');
  await assert.rejects(() => store.markNacked('m1'), /illegal delivery transition/);
  assert.equal(store.list()[0].delivery_state, 'ACKED');
});

test('delivery state for an unknown message_id is a no-op, not a crash', async () => {
  const store = createEventStore();
  assert.equal(await store.markSent('does-not-exist'), false);
  assert.equal(await store.markAcked('does-not-exist'), false);
});

/* ---------------------------------------------------- dropped connection */

test('dropped connection: a vanished transport leaves the event unacked and retryable', async () => {
  const store = createEventStore();
  const transport = createTransport('fixture');
  const env = envelope({ message_id: 'm1', idempotency_key: 'k1' });
  await store.append(env);

  // First attempt: the transport disappears after the message is handed over
  // but before any ACK can come back.
  await store.markSent('m1');
  transport.close();
  await assert.rejects(() => transport.send(env), /closed/);

  assert.equal(store.list().find((e) => e.message_id === 'm1').delivery_state, 'SENT');
  assert.equal(store.cursor(), 0, 'nothing was acknowledged');
  assert.equal(store.retryable().length, 1, 'the event is still queued, never silently lost');

  // Reconciliation: mark it for retry, reconnect, resend.
  await store.markNacked('m1');
  assert.equal(store.list().find((e) => e.message_id === 'm1').delivery_state, 'RETRY');

  const reconnected = createTransport('fixture');
  assert.equal(reconnected.status(), 'READY');
  const resent = await reconnected.send(env);
  assert.equal(resent.ok, true);
  await store.markSent('m1');
  await store.markAcked('m1');

  assert.equal(store.cursor(), 1);
  assert.equal(store.retryable().length, 0);
});

test('dropped connection: a store with a live persist adapter loses nothing', async () => {
  const adapter = memoryAdapter();
  const store = createEventStore({ persist: adapter });
  const transport = createTransport('fixture');
  const env = envelope({ message_id: 'm1', idempotency_key: 'k1' });
  await store.append(env);
  await store.markSent('m1');
  transport.close(); // connection dies mid-delivery

  // Restart against the same adapter: the half-delivered event must reappear.
  const restarted = createEventStore({ persist: adapter });
  await restarted.ready();
  const recovered = restarted.list().find((e) => e.message_id === 'm1');
  assert.ok(recovered, 'the half-delivered event survived the restart');
  assert.equal(recovered.delivery_state, 'SENT');
  assert.equal(restarted.cursor(), 0);
  assert.equal(restarted.retryable().length, 1);
});

/* --------------------------------------------------- proof vs transport */

test('proof vs transport status are modelled separately', async () => {
  // A VERIFIED proof and a DISABLED transport coexist; neither implies the other.
  const store = createEventStore();
  const transport = createTransport('disabled-native');

  const verified = envelope({
    message_id: 'proof-1',
    idempotency_key: 'task-1:verified',
    correlation_id: 'task-1',
    event_type: 'proof.verified',
    task_state: 'VERIFIED',
  });
  await store.append(verified);

  assert.equal(transport.status(), 'DISABLED', 'proof evidence does not connect a transport');
  assert.equal(store.byTask('task-1')[0].task_state, 'VERIFIED');
  assert.equal(store.list()[0].delivery_state, 'OUTBOX', 'a verified proof is still undelivered here');
  assert.equal(store.cursor(), 0);
  assert.equal(store.ackIsNotExecution(), true);

  // And the reverse: an acknowledged delivery is still not a verified proof.
  await store.markSent('proof-1');
  await store.markAcked('proof-1');
  assert.equal(store.cursor(), 1);
  assert.equal(store.list()[0].task_state, 'VERIFIED', 'the task state is untouched by delivery');
  assert.notEqual(store.list()[0].delivery_state, 'VERIFIED', 'delivery and task states are distinct axes');
});
