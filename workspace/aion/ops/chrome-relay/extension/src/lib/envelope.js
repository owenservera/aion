// AION Chrome Relay Station — envelope layer.
//
// Binding schema: workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md v0.1
//
// WHY this module is DOM-free: the service worker, the side panel and the Node
// test runner all import it. Any host-API reference here would make one of
// those three importers unusable, so every function below is pure.

/** Schema tag carried by every envelope. Bump only with a contract revision. */
export const SCHEMA_VERSION = 'aion.relay-envelope/0.1';

/**
 * The event allowlist, verbatim from the contract's "Event families".
 *
 * WHY an allowlist and not a pattern: the relay is an untrusted-input boundary
 * (a role tab can be pointed at arbitrary content). An unknown event_type is
 * rejected at validation rather than being handed to a handler, so a future
 * typo or a forged kind can never reach an executor.
 */
export const EVENT_KINDS = Object.freeze([
  // control / capability
  'relay.hello',
  'relay.capabilities',
  'relay.health',
  // presence: a tab is UI metadata only, it is NOT model reasoning
  'role.tab_presence',
  // task lifecycle
  'task.proposed',
  'task.approved',
  'task.dispatched',
  'task.accepted',
  'task.started',
  'task.progress',
  'task.blocked',
  'task.cancelled',
  // evidence
  'proof.submitted',
  'proof.verified',
  'proof.rejected',
  // context
  'context.capsule.updated',
  // delivery feedback
  'delivery.ack',
  'delivery.nack',
  'delivery.replay_requested',
  // operator surface
  'operator.alert',
]);

/**
 * Required fields: the 18 the contract names explicitly, plus `payload`.
 *
 * The contract sentence lists 18 names; an envelope that cannot carry its own
 * body is not a complete envelope, so `payload` is the 19th. It may be `null`
 * for pointer-only events (a `payload_ref` + `payload_hash` pair is the
 * data-minimised form the architecture requires).
 *
 * A required field means "the key must be present and not `undefined`".
 * Deliberately NOT "truthy": a root event has no `causation_id`, a
 * `relay.hello` has no `expires_at`, and an unsampled event has no
 * `payload_ref`. Treating those as schema violations would make honest
 * events unencodable. `null` is the explicit "not applicable" marker;
 * omitting the key is the bug we want to catch.
 */
export const REQUIRED_FIELDS = Object.freeze([
  'schema_version',
  'message_id',
  'correlation_id',
  'causation_id',
  'idempotency_key',
  'producer_node',
  'target_node',
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
]);

/**
 * Fields where `null` legitimately means "not applicable / not yet known".
 *
 * Note what is NOT here: `producer_node` and `event_type`. A producer always
 * knows who it is, and defaulting those two would let `createEnvelope({})`
 * fabricate a plausible-looking `relay.hello` that passes validation.
 * Missing them fails loudly, with the field name in the error.
 */
const NULLABLE_FIELDS = Object.freeze(new Set([
  'correlation_id',   // root events have no parent correlation
  'causation_id',     // root events cause only themselves
  'expires_at',       // a hello or a progress tick does not expire
  'approved_scope_ref', // pre-approval events have no grant yet
  'payload_ref',      // pointer-only events carry the body elsewhere
  'payload_hash',     // no sampled body -> no hash; a fake hash is worse than none
  'target_node',      // broadcasts have no single target node
  'target_role',      // non role-directed events (hello/health) have no target
  'payload',          // data-minimised pointer form is payload_ref + hash
]));

/** Identifier-ish fields: when present they must be non-empty strings. */
const STRING_FIELDS = Object.freeze([
  'message_id',
  'idempotency_key',
  'producer_node',
  'target_node',
  'target_role',
  'event_type',
  'payload_hash',
]);

/** ISO-8601 UTC instant, e.g. `2026-10-17T12:00:00.000Z`. */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/** Sentinel used for "the store has not sequenced this yet". Sequences are 1-based. */
export const UNSEQUENCED = 0;

/**
 * Build a complete envelope from partial input.
 *
 * Fills only what the caller left out: identity (`message_id`), clock
 * (`created_at`), ordering (`sequence`) and the two starting state values.
 * Everything else is the caller's responsibility — silently inventing a
 * target role or an approved scope would be a privilege decision, and the
 * contract forbids the extension from granting itself permissions.
 */
export function createEnvelope(fields = {}) {
  const src = fields && typeof fields === 'object' ? fields : {};
  const messageId = pick(src.message_id, newMessageId());
  return {
    schema_version: pick(src.schema_version, SCHEMA_VERSION),
    message_id: messageId,
    correlation_id: has(src, 'correlation_id') ? src.correlation_id : null,
    causation_id: has(src, 'causation_id') ? src.causation_id : null,
    // Default to the message id: an event that is its own idempotency unit.
    // Task events should pass a task-scoped key so a retry of the SAME step
    // dedupes instead of being treated as new work.
    idempotency_key: pick(src.idempotency_key, messageId),
    producer_node: has(src, 'producer_node') ? src.producer_node : null,
    target_node: has(src, 'target_node') ? src.target_node : null,
    target_role: has(src, 'target_role') ? src.target_role : null,
    event_type: has(src, 'event_type') ? src.event_type : null,
    created_at: pick(src.created_at, newIsoInstant()),
    expires_at: has(src, 'expires_at') ? src.expires_at : null,
    sequence: pick(src.sequence, UNSEQUENCED),
    priority: pick(src.priority, 0),
    approved_scope_ref: has(src, 'approved_scope_ref') ? src.approved_scope_ref : null,
    payload_ref: has(src, 'payload_ref') ? src.payload_ref : null,
    payload_hash: has(src, 'payload_hash') ? src.payload_hash : null,
    delivery_state: pick(src.delivery_state, 'OUTBOX'),
    task_state: pick(src.task_state, 'PROPOSED'),
    payload: has(src, 'payload') ? src.payload : null,
  };
}

/**
 * Validate a candidate envelope. Never throws — callers use this on untrusted
 * input, including plain objects that may not be envelopes at all.
 *
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEnvelope(obj) {
  const errors = [];
  try {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { valid: false, errors: ['envelope must be a plain object'] };
    }

    for (const field of REQUIRED_FIELDS) {
      if (!has(obj, field)) {
        errors.push(`missing required field: ${field}`);
      } else if (obj[field] === undefined) {
        errors.push(`required field is undefined: ${field}`);
      } else if (obj[field] === null && !NULLABLE_FIELDS.has(field)) {
        errors.push(`required field is null: ${field}`);
      }
    }
    // One unknown-field report is enough: it is a typo or an attempted smuggle.
    const unknown = Object.keys(obj).filter((k) => !REQUIRED_FIELDS.includes(k));
    if (unknown.length > 0) {
      errors.push(`unknown field(s): ${unknown.sort().join(', ')}`);
    }

    if (obj.schema_version !== SCHEMA_VERSION) {
      errors.push(`schema_version must be ${SCHEMA_VERSION}, got ${String(obj.schema_version)}`);
    }

    if (!EVENT_KINDS.includes(obj.event_type)) {
      errors.push(`event_type not allowlisted: ${String(obj.event_type)}`);
    }

    for (const field of STRING_FIELDS) {
      const value = obj[field];
      if (value !== undefined && value !== null && (typeof value !== 'string' || value.length === 0)) {
        errors.push(`${field} must be a non-empty string`);
      }
    }

    if (obj.target_role !== undefined && obj.target_role !== null && typeof obj.target_role !== 'string') {
      errors.push('target_role must be a string or null');
    }

    errors.push(...validateInstant('created_at', obj.created_at));
    errors.push(...validateInstant('expires_at', obj.expires_at));

    if (!isNonNegativeInteger(obj.sequence)) {
      errors.push(`sequence must be a non-negative integer, got ${String(obj.sequence)}`);
    }
    if (!isNonNegativeInteger(obj.priority)) {
      errors.push(`priority must be a non-negative integer, got ${String(obj.priority)}`);
    }

    // The two state machines live in state.js; referenced by string literal set
    // here so that envelope.js stays importable without importing state.js
    // (keeps the dependency graph acyclic and the failure messages local).
    const deliveryStates = ['OUTBOX', 'SENT', 'ACKED', 'RETRY', 'DEAD_LETTER'];
    if (!deliveryStates.includes(obj.delivery_state)) {
      errors.push(`delivery_state invalid: ${String(obj.delivery_state)}`);
    }
    const taskStates = [
      'PROPOSED', 'APPROVAL_PENDING', 'APPROVED', 'DISPATCHED', 'ACCEPTED', 'RUNNING',
      'PROOF_SUBMITTED', 'VERIFIED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'EXPIRED',
    ];
    if (!taskStates.includes(obj.task_state)) {
      errors.push(`task_state invalid: ${String(obj.task_state)}`);
    }

    return { valid: errors.length === 0, errors };
  } catch (err) {
    // A validator that can throw is a validator that can be crashed by input.
    return { valid: false, errors: [`envelope validation failed: ${err && err.message}`] };
  }
}

/** Serialise an envelope to its wire form. Throws if the envelope is invalid. */
export function encodeEnvelope(obj) {
  const { valid, errors } = validateEnvelope(obj);
  if (!valid) throw new Error(`cannot encode invalid envelope: ${errors.join('; ')}`);
  return JSON.stringify(obj);
}

/**
 * Parse a wire envelope. Throws on malformed JSON *and* on schema violation —
 * a receiver must never be handed a partially trusted object.
 */
export function decodeEnvelope(str) {
  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (err) {
    throw new Error(`cannot decode envelope: malformed JSON (${err && err.message})`);
  }
  const { valid, errors } = validateEnvelope(parsed);
  if (!valid) throw new Error(`cannot decode envelope: ${errors.join('; ')}`);
  return parsed;
}

/**
 * Has this envelope passed its expiry?
 *
 * Fails CLOSED: an unparsable non-empty `expires_at` counts as expired,
 * because "we cannot tell when this grant dies" must not be read as "this
 * grant lives forever" (contract: expired grants are never auto-replayed).
 */
export function isExpired(env, now = Date.now()) {
  if (!env || typeof env !== 'object') return false;
  const raw = env.expires_at;
  if (raw === undefined || raw === null || raw === '') return false;
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return true;
  return ts <= now;
}

/**
 * Stable deep equality, key order independent.
 *
 * Used for dedupe: two envelopes that mean the same thing must compare equal
 * regardless of how the JSON was built, otherwise a re-encoded replay looks
 * like a new message and gets executed twice.
 */
export function sameContent(a, b) {
  return deepEqual(a, b, new Set());
}

/* ---------------------------------------------------------------- internals */

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function pick(value, fallback) {
  return value === undefined ? fallback : value;
}

function newMessageId() {
  // globalThis.crypto exists in the extension and in Node >= 19; using it
  // avoids a dependency and gives us a real UUID instead of a counter that
  // two independent nodes would collide on.
  return globalThis.crypto.randomUUID();
}

function newIsoInstant() {
  return new Date().toISOString();
}

function validateInstant(field, value) {
  if (value === undefined || value === null) return [];
  if (typeof value !== 'string') return [`${field} must be an ISO-8601 UTC string`];
  if (!ISO_UTC.test(value) || Number.isNaN(Date.parse(value))) {
    return [`${field} must be an ISO-8601 UTC string, got ${value}`];
  }
  return [];
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function deepEqual(a, b, seen) {
  if (a === b) return true;
  // Distinguish null from undefined: a replay that drops a field is not a replay.
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b);

  if (seen.has(a)) return false; // cyclic input: refuse rather than recurse forever
  seen.add(a);
  try {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i += 1) {
      if (aKeys[i] !== bKeys[i]) return false;
      if (!deepEqual(a[aKeys[i]], b[bKeys[i]], seen)) return false;
    }
    return true;
  } finally {
    seen.delete(a);
  }
}
