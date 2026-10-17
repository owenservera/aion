// AION Chrome Relay Station — transport abstraction.
//
// Binding source: OPENCODE-BUILD-ORDER.md item 4 — "Implement transport
// abstraction supporting disabled/native adapter, disabled local loopback
// adapter and offline fixture adapter; do not connect real hosts or silently
// send tasks in MVP."
//
// WHY there is no live adapter here: the native host and the loopback relay
// are both separately gated. Shipping an enabled adapter inside the MVP would
// mean the extension could reach a real host with no authorization. The
// enabled path is therefore a fixture that performs no I/O whatsoever.

import { validateEnvelope } from './envelope.js';

/** Transport names. The first two are permanently disabled in the MVP. */
export const TRANSPORT_NAMES = Object.freeze(['disabled-native', 'disabled-loopback', 'fixture']);

/** Lifecycle status strings a UI can render without interpreting the name. */
export const TRANSPORT_STATUS = Object.freeze({
  DISABLED: 'DISABLED',
  READY: 'READY',
  CLOSED: 'CLOSED',
});

/**
 * Create a transport.
 *
 * @param {'disabled-native'|'disabled-loopback'|'fixture'} name
 * @param {{ fixtures?: object[] | (() => object[]) }} [opts]
 * @returns {{
 *   name: string,
 *   enabled: boolean,
 *   status(): string,
 *   send(object): Promise<{ ok: boolean, transport: string, message_id?: string }>,
 *   onMessage((object) => void): () => void,
 *   replay(): number,
 *   close(): void
 * }}
 */
export function createTransport(name, opts = {}) {
  if (!TRANSPORT_NAMES.includes(name)) {
    throw new Error(`unknown transport: ${String(name)} (expected one of ${TRANSPORT_NAMES.join(', ')})`);
  }

  if (name === 'disabled-native' || name === 'disabled-loopback') {
    return disabledTransport(name);
  }
  return fixtureTransport(name, opts);
}

/* ------------------------------------------------------------- disabled */

/**
 * A disabled transport.
 *
 * `send()` REFUSES. It performs no network, file or host access of any kind —
 * there is deliberately no code path here that could grow into one, because
 * the MVP must not connect real hosts or silently send tasks. Callers are
 * expected to catch the refusal, keep the event in the outbox and show it as
 * UNSENT (FALLBACK-AND-ACCEPTANCE mode D).
 */
function disabledTransport(name) {
  return {
    name,
    enabled: false,
    status() {
      return TRANSPORT_STATUS.DISABLED;
    },
    async send() {
      throw new Error(
        `transport "${name}" is disabled in the MVP fixture build; ` +
          'no host was contacted and the event stays UNSENT in the outbox',
      );
    },
    onMessage() {
      // No source of messages exists while disabled. Returning a working
      // unsubscribe keeps callers from special-casing the disabled adapters.
      return () => {};
    },
    replay() {
      return 0;
    },
    close() {
      // Nothing to release: this transport never held a resource.
    },
  };
}

/* -------------------------------------------------------------- fixture */

/**
 * Offline fixture transport. No I/O: fixtures come from `opts` and handshakes
 * are counted in memory.
 */
function fixtureTransport(name, opts) {
  const listeners = new Set();
  const sent = [];
  let closed = false;

  const readFixtures = () => {
    const source = typeof opts.fixtures === 'function' ? opts.fixtures() : opts.fixtures;
    if (source === undefined || source === null) return [];
    if (!Array.isArray(source)) throw new TypeError('opts.fixtures must be an array or a function returning one');
    return source;
  };

  /**
   * Hand each fixture to every listener.
   *
   * Async by design: replaying synchronously from inside onMessage() would run
   * a caller's handler before it has finished registering, which is how
   * re-entrancy bugs start.
   */
  const deliver = () => {
    const fixtures = readFixtures();
    for (const listener of listeners) {
      for (const fixture of fixtures) {
        const check = validateEnvelope(fixture);
        // A malformed fixture is dropped, not thrown: the UI must keep running
        // and report the gap rather than white-screen on bad test data.
        if (!check.valid) continue;
        queueMicrotask(() => {
          if (!closed) listener(structuredClone(fixture));
        });
      }
    }
    return fixtures.length;
  };

  return {
    name,
    enabled: true,
    status() {
      return closed ? TRANSPORT_STATUS.CLOSED : TRANSPORT_STATUS.READY;
    },
    /**
     * Accept a message into the offline path.
     *
     * Refuses once closed: a send against a gone transport must throw so the
     * caller leaves the event unacked and retryable rather than assuming it
     * landed (the dropped-connection case).
     */
    async send(env) {
      if (closed) throw new Error(`transport "${name}" is closed; message was not delivered`);
      const check = validateEnvelope(env);
      if (!check.valid) {
        throw new Error(`refusing to send invalid envelope: ${check.errors.join('; ')}`);
      }
      sent.push({ message_id: env.message_id, sequence: env.sequence, delivery_state: env.delivery_state });
      return { ok: true, transport: name, message_id: env.message_id };
    },
    /** Register a listener; returns an unsubscribe function. */
    onMessage(cb) {
      if (typeof cb !== 'function') throw new TypeError('onMessage requires a callback');
      listeners.add(cb);
      deliver(); // a late subscriber still sees the fixture corpus
      return () => listeners.delete(cb);
    },
    /** Re-deliver all fixtures to the current listeners. */
    replay() {
      return deliver();
    },
    /** Drop the connection. Subsequent sends refuse; queued deliveries are cancelled. */
    close() {
      closed = true;
      listeners.clear();
    },
    /** In-memory record of what this transport was asked to send. Test aid. */
    sentCount() {
      return sent.length;
    },
  };
}
