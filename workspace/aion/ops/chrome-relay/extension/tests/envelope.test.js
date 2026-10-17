// Envelope layer tests — ENVELOPE-CONTRACT.md v0.1.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EVENT_KINDS,
  REQUIRED_FIELDS,
  SCHEMA_VERSION,
  createEnvelope,
  decodeEnvelope,
  encodeEnvelope,
  isExpired,
  sameContent,
  validateEnvelope,
} from '../src/lib/envelope.js';

/** A complete, valid envelope with every required field populated. */
function sampleEnvelope(overrides = {}) {
  return createEnvelope({
    producer_node: 'node-ext-01',
    target_node: 'node-native-01',
    target_role: '06',
    event_type: 'task.proposed',
    correlation_id: 'task-42',
    causation_id: null,
    idempotency_key: 'task-42:propose',
    expires_at: '2026-10-17T12:00:00.000Z',
    priority: 5,
    approved_scope_ref: 'scope-readonly-01',
    payload_ref: null,
    payload_hash: 'abc123',
    task_state: 'PROPOSED',
    delivery_state: 'OUTBOX',
    payload: { note: 'fixture' },
    ...overrides,
  });
}

test('createEnvelope fills identity, clock, sequence and the two starting states', () => {
  const env = createEnvelope({
    producer_node: 'node-ext-01',
    event_type: 'relay.hello',
    target_role: null,
    expires_at: null,
    payload: null,
  });

  assert.match(env.message_id, /^[0-9a-f-]{36}$/i, 'message_id must be a uuid');
  assert.equal(env.schema_version, SCHEMA_VERSION);
  assert.match(env.created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(env.sequence, 0, 'unspecified sequence is the UNSEQUENCED sentinel for the store to assign');
  assert.equal(env.delivery_state, 'OUTBOX');
  assert.equal(env.task_state, 'PROPOSED');
  assert.equal(env.idempotency_key, env.message_id, 'an event with no explicit key is its own idempotency unit');
});

test('createEnvelope never fabricates an event kind or a producer', () => {
  // Guard against the two defaults that would let `createEnvelope({})` invent a
  // plausible-looking hello event from nothing.
  const empty = createEnvelope({});
  assert.equal(empty.event_type, null);
  assert.equal(empty.producer_node, null);
  assert.equal(validateEnvelope(empty).valid, false, 'an envelope with no event kind must not validate');
});

test('createEnvelope does not overwrite fields the caller supplied', () => {
  const env = sampleEnvelope({ sequence: 7, delivery_state: 'RETRY', task_state: 'APPROVED' });
  assert.equal(env.sequence, 7);
  assert.equal(env.delivery_state, 'RETRY');
  assert.equal(env.task_state, 'APPROVED');
});

test('REQUIRED_FIELDS is frozen and holds the 19 contract fields', () => {
  assert.ok(Object.isFrozen(REQUIRED_FIELDS));
  assert.equal(REQUIRED_FIELDS.length, 19);
  for (const field of [
    'schema_version', 'message_id', 'correlation_id', 'causation_id', 'idempotency_key',
    'producer_node', 'target_node', 'target_role', 'event_type', 'created_at', 'expires_at',
    'sequence', 'priority', 'approved_scope_ref', 'payload_ref', 'payload_hash',
    'delivery_state', 'task_state', 'payload',
  ]) {
    assert.ok(REQUIRED_FIELDS.includes(field), `${field} must be required`);
  }
});

test('EVENT_KINDS is frozen and matches the contract allowlist exactly', () => {
  assert.ok(Object.isFrozen(EVENT_KINDS));
  assert.equal(EVENT_KINDS.length, 20);
  assert.deepEqual([...EVENT_KINDS].sort(), [
    'context.capsule.updated',
    'delivery.ack',
    'delivery.nack',
    'delivery.replay_requested',
    'operator.alert',
    'proof.rejected',
    'proof.submitted',
    'proof.verified',
    'relay.capabilities',
    'relay.health',
    'relay.hello',
    'role.tab_presence',
    'task.accepted',
    'task.approved',
    'task.blocked',
    'task.cancelled',
    'task.dispatched',
    'task.progress',
    'task.proposed',
    'task.started',
  ]);
});

test('validateEnvelope accepts a well-formed envelope', () => {
  const result = validateEnvelope(sampleEnvelope());
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('validateEnvelope never throws, whatever it is handed', () => {
  for (const junk of [null, undefined, 42, 'a string', [], new Date()]) {
    const result = validateEnvelope(junk);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
});

test('validation rejects a missing required field, one case per representative field', () => {
  // Representative set: an id field, a reference field, a routing field, a
  // clock field, an ordering field, a state field and the body.
  const representatives = [
    'message_id',
    'idempotency_key',
    'producer_node',
    'target_role',
    'event_type',
    'created_at',
    'expires_at',
    'sequence',
    'priority',
    'approved_scope_ref',
    'payload_ref',
    'payload_hash',
    'delivery_state',
    'task_state',
    'payload',
    'schema_version',
  ];

  for (const field of representatives) {
    const env = sampleEnvelope();
    delete env[field];
    const result = validateEnvelope(env);
    assert.equal(result.valid, false, `omitting ${field} must invalidate the envelope`);
    assert.ok(
      result.errors.some((e) => e.includes(field)),
      `error for omitted ${field} must name the field, got: ${result.errors.join('; ')}`,
    );
  }
});

test('validation rejects a field that is present but undefined', () => {
  const env = sampleEnvelope();
  env.message_id = undefined;
  const result = validateEnvelope(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('undefined')));
});

test('validation rejects an unknown or disallowed event_type', () => {
  for (const kind of ['task.exec', 'shell.run', '', null, 'TASK.PROPOSED']) {
    const result = validateEnvelope(sampleEnvelope({ event_type: kind }));
    assert.equal(result.valid, false, `event_type ${String(kind)} must be rejected`);
    assert.ok(
      result.errors.some((e) => e.includes('event_type')),
      `error must name event_type, got: ${result.errors.join('; ')}`,
    );
  }
});

test('validation rejects a smuggled unknown field', () => {
  const env = sampleEnvelope();
  env.script = 'rm -rf';
  const result = validateEnvelope(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('unknown field')));
});

test('validation rejects a wrong schema_version, bad instants and bad states', () => {
  assert.equal(validateEnvelope(sampleEnvelope({ schema_version: 'aion.relay-envelope/9.9' })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ created_at: 'yesterday' })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ created_at: '2026-10-17T12:00:00+02:00' })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ sequence: -1 })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ sequence: 1.5 })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ delivery_state: 'MAYBE' })).valid, false);
  assert.equal(validateEnvelope(sampleEnvelope({ task_state: 'ALMOST_DONE' })).valid, false);
});

test('encode/decode round-trips an envelope losslessly', () => {
  const env = sampleEnvelope({ payload: { nested: { list: [1, 'two', null], flag: true } } });
  const wire = encodeEnvelope(env);
  assert.equal(typeof wire, 'string');
  const back = decodeEnvelope(wire);
  assert.deepEqual(back, env);
  assert.equal(back.payload.nested.list[1], 'two');
});

test('decodeEnvelope throws on malformed JSON', () => {
  assert.throws(() => decodeEnvelope('{not json'), /malformed JSON/);
});

test('decodeEnvelope throws when the JSON is well formed but off-contract', () => {
  const broken = { ...sampleEnvelope(), event_type: 'task.exec' };
  assert.throws(() => decodeEnvelope(JSON.stringify(broken)), /event_type not allowlisted/);
});

test('encodeEnvelope refuses to serialise an invalid envelope', () => {
  const broken = sampleEnvelope();
  delete broken.producer_node;
  assert.throws(() => encodeEnvelope(broken), /missing required field: producer_node/);
});

test('isExpired is true only for a past expires_at', () => {
  const past = sampleEnvelope({ expires_at: '2026-01-01T00:00:00.000Z' });
  const future = sampleEnvelope({ expires_at: '2999-01-01T00:00:00.000Z' });
  const at = Date.parse('2026-06-01T00:00:00.000Z');

  assert.equal(isExpired(past, at), true);
  assert.equal(isExpired(future, at), false);
  // Boundary: the instant it expires IS expired, not one tick later.
  assert.equal(isExpired(sampleEnvelope({ expires_at: '2026-06-01T00:00:00.000Z' }), at), true);
  assert.equal(isExpired(sampleEnvelope({ expires_at: null }), at), false, 'no expiry means no expiry');
});

test('isExpired fails closed on an unparsable expires_at', () => {
  // "We cannot tell when this grant dies" must not read as "it never dies".
  assert.equal(isExpired({ expires_at: 'not-a-date' }, Date.now()), true);
});

test('sameContent compares deeply and ignores key order', () => {
  const a = sampleEnvelope({ payload: { x: 1, y: [1, 2, { z: 'v' }] } });
  // Same envelope, keys inserted in the opposite order. (It has to be the SAME
  // envelope: createEnvelope mints a fresh message_id on every call.)
  const b = {};
  for (const key of Object.keys(a).reverse()) b[key] = a[key];
  assert.equal(sameContent(a, b), true);

  const c = { ...a, payload: { x: 1, y: [1, 2, { z: 'different' }] } };
  assert.equal(sameContent(a, c), false);
});

test('sameContent distinguishes null from undefined and rejects cycles', () => {
  assert.equal(sameContent({ a: null }, { a: undefined }), false);
  assert.equal(sameContent({}, { a: undefined }), false);

  const cyclicA = { name: 'loop' };
  cyclicA.self = cyclicA;
  const cyclicB = { name: 'loop' };
  cyclicB.self = cyclicB;
  assert.equal(sameContent(cyclicA, cyclicB), false, 'a cycle is refused, not recursed');
});

test('sameContent is not fooled by key count or type differences', () => {
  assert.equal(sameContent([1, 2], { 0: 1, 1: 2 }), false, 'an array is not an object');
  assert.equal(sameContent({ a: 1 }, { a: '1' }), false);
  assert.equal(sameContent({ a: 1 }, { a: 1, b: 2 }), false);
});
