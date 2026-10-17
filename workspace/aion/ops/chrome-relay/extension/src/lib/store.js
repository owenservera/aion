// AION Chrome Relay Station — durable event store.
//
// WHY an append-only log instead of a state map: the contract's audit record
// lives in GitHub, and a receipt you cannot replay back from the beginning is
// not a receipt. Delivery-state changes mutate the stored envelope in place
// (same id, same sequence) so the log stays ordered by sequence while staying
// cheap to persist.
//
// WHY this module is DOM-free: it is driven by the service worker, the side
// panel AND the Node test runner, so it must not assume any host API.

import { UNSEQUENCED, sameContent, validateEnvelope } from './envelope.js';
import { deliveryTransition } from './state.js';

/**
 * Create an event store.
 *
 * @param {{ persist?: { load(): Promise<object[]>, save(object[]): Promise<void> } }} [options]
 *   `persist` is OPTIONAL. Without an adapter the store is in-memory only and
 *   cannot survive a restart — stated out loud rather than pretended away.
 *
 * @returns {{
 *   ready(): Promise<void>,
 *   persist(): Promise<object[]>,
 *   append(object): Promise<{ stored: boolean, reason: string, envelope?: object }>,
 *   list(): object[],
 *   byIdempotencyKey(string): object|undefined,
 *   byTask(string): object[],
 *   cursor(): number,
 *   markSent(string): Promise<boolean>,
 *   markAcked(string): Promise<boolean>,
 *   markNacked(string): Promise<boolean>,
 *   ackIsNotExecution(): boolean,
 *   wasReplayed(object|string): boolean,
 *   retryable(): object[]
 * }}
 *
 * IMPORTANT for callers: when a `persist` adapter is supplied, `await
 * store.ready()` once before reading. Loading is asynchronous by definition,
 * and reading before it settles would look like an empty outbox — exactly the
 * "restart lost my work" failure this store exists to prevent.
 */
export function createEventStore({ persist } = {}) {
  if (persist && (typeof persist.load !== 'function' || typeof persist.save !== 'function')) {
    throw new TypeError('persist adapter must provide load() and save()');
  }

  /** @type {object[]} ordered by sequence ascending */
  let events = [];
  let byMessageId = new Map();
  let byIdempotency = new Map();
  /** Replays are NOT stored; they are evidence that something tried twice. */
  const replays = new Map();

  let settleReady;
  const readyPromise = new Promise((resolve) => {
    settleReady = resolve;
  });
  const loadPromise = persist ? hydrate(persist) : Promise.resolve();
  loadPromise.then(settleReady, (err) => {
    // A corrupt or unreadable outbox must be visible: swallow this and the
    // caller sees an empty log and "recovers" by overwriting real work.
    settleReady(Promise.reject(new Error(`event store failed to load: ${err && err.message}`)));
  });
  // Mark the rejection as observed so a caller that never awaits ready() does
  // not take the process down; awaiters still receive the rejection.
  readyPromise.catch(() => {});

  const store = {
    /** Resolves once any persist adapter has been read; rejects on a bad log. */
    ready() {
      return readyPromise;
    },

    /** Snapshot of every event, ordered by sequence. */
    async persist() {
      return events.map(clone);
    },

    /**
     * Append an event.
     *
     * Resolves to a result describing what happened, so a caller can tell a
     * benign duplicate from an idempotency replay. Plain `await
     * store.append(env)` remains correct for callers that only care that it
     * finished.
     */
    async append(env) {
      await store.ready();
      const result = addIncoming(env);
      if (result.stored) await saveAll();
      return result;
    },

    list() {
      // Copy the array (not the envelopes) so a caller iterating the result
      // cannot splice the store out from under a concurrent append.
      return events.slice();
    },

    byIdempotencyKey(key) {
      if (typeof key !== 'string' || key === '') return undefined;
      return byIdempotency.get(key);
    },

    /**
     * Every envelope for one task.
     *
     * `taskId` is matched against `correlation_id`, this design's task/thread
     * identifier: the root task.proposed sets it and every later event in the
     * chain carries it forward.
     */
    byTask(taskId) {
      if (typeof taskId !== 'string' || taskId === '') return [];
      return events.filter((env) => env.correlation_id === taskId);
    },

    /**
     * Highest acknowledged sequence; 0 means "nothing acknowledged yet".
     *
     * Sequences are 1-based, so 0 is an honest sentinel and the resume point
     * after a restart is `cursor() + 1`.
     */
    cursor() {
      let highest = 0;
      for (const env of events) {
        if (env.delivery_state === 'ACKED' && env.sequence > highest) highest = env.sequence;
      }
      return highest;
    },

    /** Mark SENT after a send attempt that did not throw. */
    async markSent(id) {
      await store.ready();
      return transitionDelivery(id, 'SENT');
    },

    /**
     * Mark ACKED. Proves DELIVERY only — see ackIsNotExecution().
     * A second ACK of the same message is a no-op, not an error, and cannot
     * move the cursor.
     */
    async markAcked(id) {
      await store.ready();
      return transitionDelivery(id, 'ACKED');
    },

    /**
     * Mark RETRY after a nack or a dropped connection. The event stays in the
     * log and stays retryable; it is never deleted.
     */
    async markNacked(id) {
      await store.ready();
      return transitionDelivery(id, 'RETRY');
    },

    /**
     * The contract rule, encoded so no caller can quietly drop it:
     * "An ACK only proves delivery, not executor acceptance, and executor
     * completion never implies independently verified proof."
     */
    ackIsNotExecution() {
      return true;
    },

    /** Was this message_id (or envelope) refused as an idempotency replay? */
    wasReplayed(envOrId) {
      const id = typeof envOrId === 'string' ? envOrId : (envOrId && envOrId.message_id);
      if (typeof id !== 'string' || id === '') return false;
      for (const record of replays.values()) {
        if (record.message_id === id) return true;
      }
      return false;
    },

    /**
     * Envelopes still owing a delivery outcome: not ACKED, not dead-lettered.
     * A restart resumes from this list, which is why nothing is ever removed.
     */
    retryable() {
      return events.filter(
        (env) => env.delivery_state !== 'ACKED' && env.delivery_state !== 'DEAD_LETTER',
      );
    },
  };

  return store;

  /* ------------------------------------------------------------- internals */

  async function hydrate(adapter) {
    const loaded = (await adapter.load()) ?? [];
    if (!Array.isArray(loaded)) throw new TypeError('persist.load() must resolve to an array');

    const ordered = loaded
      .map(clone)
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    events = [];
    byMessageId = new Map();
    byIdempotency = new Map();

    for (const env of ordered) {
      const check = validateEnvelope(env);
      if (!check.valid) {
        throw new Error(`persisted event ${env && env.message_id} is invalid: ${check.errors.join('; ')}`);
      }
      // A duplicate inside the persisted log must not become a second
      // execution: first occurrence wins, later ones are dropped.
      if (byMessageId.has(env.message_id)) continue;
      if (byIdempotency.has(env.idempotency_key)) continue;
      events.push(env);
      byMessageId.set(env.message_id, env);
      byIdempotency.set(env.idempotency_key, env);
    }
  }

  /** Validate, dedupe, sequence and index one incoming envelope. */
  function addIncoming(env) {
    const check = validateEnvelope(env);
    if (!check.valid) {
      throw new Error(`refusing to append invalid envelope: ${check.errors.join('; ')}`);
    }
    const stored = clone(env);

    const existingById = byMessageId.get(stored.message_id);
    if (existingById) {
      // Same identity. Identical bytes are a benign duplicate. Different bytes
      // mean two distinct events claim one identity: source drift or forgery,
      // which must never be silently absorbed.
      if (!sameContent(contentOf(existingById), contentOf(stored))) {
        throw new Error(`message_id ${stored.message_id} already stored with different content`);
      }
      return { stored: false, reason: 'duplicate_message_id', envelope: existingById };
    }

    const existingByKey = byIdempotency.get(stored.idempotency_key);
    if (existingByKey) {
      // A replay: a NEW message id claiming work already recorded. The
      // contract requires reconciliation before any retry, so the replay is
      // recorded as evidence and is NOT executed.
      replays.set(stored.idempotency_key, {
        idempotency_key: stored.idempotency_key,
        message_id: stored.message_id,
        replayed_message_id: existingByKey.message_id,
        created_at: stored.created_at,
      });
      return { stored: false, reason: 'replay_idempotency_key', envelope: existingByKey };
    }

    if (stored.sequence === UNSEQUENCED || stored.sequence === undefined || stored.sequence === null) {
      stored.sequence = nextSequence();
    }
    events.push(stored);
    byMessageId.set(stored.message_id, stored);
    byIdempotency.set(stored.idempotency_key, stored);
    return { stored: true, reason: 'stored', envelope: stored };
  }

  function nextSequence() {
    let highest = 0;
    for (const env of events) {
      if (typeof env.sequence === 'number' && env.sequence > highest) highest = env.sequence;
    }
    return highest + 1;
  }

  async function transitionDelivery(id, target) {
    const env = byMessageId.get(id);
    if (!env) return false;
    // Duplicate operation: no-op. This is what makes a re-delivered ACK
    // idempotent, and it cannot move the cursor because nothing changed.
    if (env.delivery_state === target) return true;
    if (!deliveryTransition(env.delivery_state, target)) {
      throw new Error(`illegal delivery transition ${env.delivery_state} -> ${target} for ${id}`);
    }
    env.delivery_state = target;
    await saveAll();
    return true;
  }

  async function saveAll() {
    if (!persist) return;
    await persist.save(events.map(clone));
  }
}

/* ---------------------------------------------------------------- helpers */

/**
 * Content identity of an envelope for dedupe comparison.
 *
 * `sequence` is excluded because the STORE assigns it; a caller re-appending
 * the same logical event must not trip the conflict check merely because the
 * stored copy was sequenced and the incoming one was not.
 */
function contentOf(env) {
  const copy = { ...env };
  delete copy.sequence;
  return copy;
}

function clone(env) {
  // structuredClone isolates the persisted snapshot and the caller's copy
  // from later in-place delivery_state updates.
  return structuredClone(env);
}
