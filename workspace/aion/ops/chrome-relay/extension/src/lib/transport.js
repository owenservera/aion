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
export const TRANSPORT_NAMES = Object.freeze(['disabled-native', 'disabled-loopback', 'fixture', 'native']);

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
  if (name === 'native') {
    return nativeTransport(opts);
  }
  return fixtureTransport(name, opts);
}

/* ---------------------------------------------------------------- native */

/** Wire message types the bridge host speaks (see bridge/src/host.js handleCommand). */
const NATIVE_HOST_NAME = 'com.aion.relay';
const NATIVE_ERROR = 'relay.error';
const NATIVE_EVENT = 'relay.event';

const NATIVE_STATUS = Object.freeze({
  UNAVAILABLE: 'UNAVAILABLE',
  CONNECTED: 'CONNECTED',
  CLOSED: 'CLOSED',
});

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_BACKOFF = Object.freeze({ baseMs: 250, maxMs: 8_000, maxAttempts: 4 });

/**
 * The one transport that opens a real native-messaging host port.
 *
 * Wire model - easy to get wrong: from the EXTENSION side there is **no framing
 * to write**. Chrome's `connectNative` returns a Port immediately and does the
 * 4-byte length prefixing itself; both sides exchange plain JSON objects. The
 * length-prefixed framing exists only on the host process's stdin.
 *
 * Connection model - there is **no handshake to await**. A Port is returned
 * synchronously whether or not the host exists; a missing or unregistered host
 * surfaces later as a disconnect, not a throw. So this reports CONNECTED once it
 * holds a port and downgrades only on disconnect. Awaiting a server greeting the
 * host never sends would hang forever, which is exactly what a previous attempt
 * at this adapter did.
 *
 * Liveness is proved by `relay.ping`, which the host answers without spawning
 * anything. `relay.hello` is what actually starts the ACP agent.
 */
function nativeTransport(opts = {}) {
  const hostName = opts.hostName ?? NATIVE_HOST_NAME;
  const requestTimeoutMs = Number.isInteger(opts.requestTimeoutMs) && opts.requestTimeoutMs > 0
    ? opts.requestTimeoutMs
    : DEFAULT_REQUEST_TIMEOUT_MS;
  const backoff = { ...DEFAULT_BACKOFF, ...(opts.backoff ?? {}) };
  const clock = opts.clock ?? {
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(h),
  };
  const random = typeof opts.random === 'function' ? opts.random : Math.random;

  const chromeApi = opts.chrome ?? (typeof chrome !== 'undefined' ? chrome : null);
  const subscribers = new Set();

  let port = null;
  let closed = false;
  let attempts = 0;
  let reconnectTimer = null;
  let nextRequestId = 1;
  let lastError = null;
  const pending = new Map();

  function reportUnavailable(reason) {
    lastError = reason;
    for (const fn of subscribers) {
      try { fn({ type: 'transport.unavailable', reason }); } catch { /* subscriber threw */ }
    }
  }

  function failPending(code, message) {
    if (pending.size === 0) return;
    const snapshot = [...pending.entries()];
    pending.clear();
    for (const [, entry] of snapshot) {
      if (entry.timer) clock.clearTimeout(entry.timer);
      entry.reject(new Error(`${code}: ${message}`));
    }
  }

  function scheduleReconnect() {
    if (closed || reconnectTimer) return;
    attempts += 1;
    if (attempts > backoff.maxAttempts) {
      // Bounded: stop retrying and degrade, rather than spinning forever.
      reportUnavailable('reconnect attempts exhausted; manual resume required');
      return;
    }
    const window = Math.min(backoff.baseMs * (2 ** (attempts - 1)), backoff.maxMs);
    const delay = Math.floor(window * (0.5 + random() * 0.5)); // jitter
    reconnectTimer = clock.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function onDisconnect() {
    port = null;
    failPending('disconnected', 'the native host port closed before replying');
    scheduleReconnect();
  }

  function connect() {
    if (closed || port) return port;
    const runtime = chromeApi && chromeApi.runtime;
    if (!runtime || typeof runtime.connectNative !== 'function') {
      reportUnavailable('chrome.runtime.connectNative is unavailable in this context');
      return null;
    }
    try {
      port = runtime.connectNative(hostName);
    } catch (err) {
      // An unregistered host can throw here rather than disconnect later.
      port = null;
      reportUnavailable(`could not open host ${hostName}: ${err && err.message}`);
      scheduleReconnect();
      return null;
    }
    port.onMessage.addListener((message) => onMessage(message));
    if (typeof port.onDisconnect.addListener === 'function') {
      port.onDisconnect.addListener(() => onDisconnect());
    }
    // Holding a live port is the strongest liveness signal Chrome offers here;
    // ping() then proves the host process itself is answering.
    attempts = 0;
    lastError = null;
    return port;
  }

  function onMessage(message) {
    if (!message || typeof message !== 'object') {
      reportUnavailable('the host sent a non-object message');
      return;
    }
    if (message.type === NATIVE_EVENT) {
      for (const fn of subscribers) {
        try { fn(message.envelope); } catch { /* subscriber threw */ }
      }
      return;
    }
    const entry = message.id != null ? pending.get(message.id) : undefined;
    if (!entry) return;
    pending.delete(message.id);
    if (entry.timer) clock.clearTimeout(entry.timer);
    if (message.type === NATIVE_ERROR) {
      entry.reject(new Error(`${message.code}: ${message.message}`));
      return;
    }
    entry.resolve(message);
  }

  /** Send one command and await its reply. Rejects rather than hanging. */
  function request(type, payload = {}) {
    return new Promise((resolve, reject) => {
      const live = port || connect();
      if (!live) {
        reject(new Error(`native host unavailable: ${lastError ?? 'not connected'}`));
        return;
      }
      const id = `n${nextRequestId++}`;
      const timer = clock.setTimeout(() => {
        pending.delete(id);
        reject(new Error(`native request ${type} timed out after ${requestTimeoutMs}ms`));
      }, requestTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      try {
        live.postMessage({ ...payload, type, id });
      } catch (err) {
        pending.delete(id);
        clock.clearTimeout(timer);
        reject(new Error(`failed to post ${type}: ${err && err.message}`));
      }
    });
  }

  return {
    name: 'native',
    enabled: true,

    status() {
      if (closed) return NATIVE_STATUS.CLOSED;
      if (port) return NATIVE_STATUS.CONNECTED;
      return NATIVE_STATUS.UNAVAILABLE;
    },

    lastError() {
      return lastError;
    },

    connect,

    ping() {
      return request('relay.ping');
    },

    hello() {
      return request('relay.hello');
    },

    send(envelope) {
      return request('relay.send', { envelope });
    },

    cancel(correlationId) {
      return request('relay.cancel', { correlation_id: correlationId });
    },

    /** Validates before putting anything on the wire. */
    async sendEnvelope(envelope, validate) {
      const check = typeof validate === 'function' ? validate(envelope) : { valid: true, errors: [] };
      if (!check.valid) throw new Error(`invalid envelope: ${(check.errors || []).join('; ')}`);
      return request('relay.send', { envelope });
    },

    onMessage(fn) {
      if (typeof fn !== 'function') return undefined;
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    close() {
      closed = true;
      if (reconnectTimer) {
        clock.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      failPending('closed', 'transport closed');
      if (port) {
        try { port.disconnect(); } catch { /* already gone */ }
        port = null;
      }
    },
  };
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
   * Hand one envelope to one listener.
   *
   * Async by design: replaying synchronously from inside onMessage() would run
   * a caller's handler before it has finished registering, which is how
   * re-entrancy bugs start.
   */
  const deliverTo = (listener, fixture) => {
    const check = validateEnvelope(fixture);
    // A malformed fixture is dropped, not thrown: the UI must keep running and
    // report the gap rather than white-screen on bad test data.
    if (!check.valid) return;
    queueMicrotask(() => {
      // Re-check membership, not just the flag: a delivery queued a tick ago
      // must not fire at a listener that has since unsubscribed, and close()
      // clears the set so an in-flight delivery dies with the connection
      // rather than arriving after it.
      if (!closed && listeners.has(listener)) listener(structuredClone(fixture));
    });
  };

  /** Deliver the whole fixture corpus to every current listener. */
  const deliverAll = () => {
    const fixtures = readFixtures();
    for (const listener of listeners) {
      for (const fixture of fixtures) deliverTo(listener, fixture);
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
      // Only the NEW listener gets the corpus on registration: re-delivering
      // to the existing ones would duplicate every message the moment a panel
      // re-mounts. Use replay() for an intentional re-delivery.
      for (const fixture of readFixtures()) deliverTo(cb, fixture);
      return () => listeners.delete(cb);
    },
    /** Re-deliver all fixtures to the current listeners. */
    replay() {
      return deliverAll();
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
