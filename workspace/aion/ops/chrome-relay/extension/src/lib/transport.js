// AION Chrome Relay Station — transport abstraction.
//
// Binding source: OPENCODE-BUILD-ORDER.md item 4 — "Implement transport
// abstraction supporting disabled/native adapter, disabled local loopback
// adapter and offline fixture adapter; do not connect real hosts or silently
// send tasks in MVP."
//
// WHY the only enabled non-fixture path is `native`: the native host is the
// browser-facing edge this relay is built around, and it is reachable only when
// the owner has registered `com.aion.relay` and pinned its extension id. The
// loopback relay stays disabled, and the fixture transport performs no I/O at
// all, so the offline suite can never reach a real host.

import { validateEnvelope } from './envelope.js';

/** Transport names. The first two are permanently disabled in the MVP. */
export const TRANSPORT_NAMES = Object.freeze(['disabled-native', 'disabled-loopback', 'fixture', 'native']);

/** Lifecycle status strings a UI can render without interpreting the name. */
export const TRANSPORT_STATUS = Object.freeze({
  DISABLED: 'DISABLED',
  READY: 'READY',
  /** A port exists but nothing has proved the host is answering yet. */
  CONNECTING: 'CONNECTING',
  CLOSED: 'CLOSED',
});

/**
 * Create a transport.
 *
 * `native` additionally exposes `connect/ping/hello/send/sendEnvelope/cancel`,
 * `isProven()`, `lastErrorCode()` and `onError()`; see `nativeTransport`.
 *
 * @param {'disabled-native'|'disabled-loopback'|'fixture'|'native'} name
 * @param {{ fixtures?: object[] | (() => object[]), chrome?: object }} [opts]
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
const NATIVE_REPLY = 'relay.reply';
const NATIVE_ERROR = 'relay.error';
const NATIVE_EVENT = 'relay.event';

export const NATIVE_STATUS = Object.freeze({
  UNAVAILABLE: 'UNAVAILABLE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  CLOSED: 'CLOSED',
});

/**
 * Machine-readable failure codes, surfaced on the error channel and in
 * `lastErrorCode()`. Prose alone is not something a worker can branch on.
 */
export const TRANSPORT_ERROR = Object.freeze({
  HOST_UNAVAILABLE: 'host_unavailable',
  CONNECT_FAILED: 'connect_failed',
  DISCONNECTED: 'disconnected',
  RECONNECT_EXHAUSTED: 'reconnect_exhausted',
  NON_OBJECT_MESSAGE: 'non_object_message',
  INVALID_INBOUND_ENVELOPE: 'invalid_inbound_envelope',
  INVALID_OUTBOUND_ENVELOPE: 'invalid_outbound_envelope',
  REQUEST_TIMEOUT: 'request_timeout',
  POST_FAILED: 'post_failed',
  HOST_ERROR: 'host_error',
  CLOSED: 'closed',
});

/**
 * Codes that describe a BAD PIECE OF DATA rather than a broken connection.
 *
 * These are reported on the error channel ONLY. The envelope channel carries
 * envelopes, so injecting `transport.unavailable` there for one malformed envelope
 * would push non-envelope objects at exactly the subscribers that inbound
 * validation exists to protect, and would make the operator's relay look down
 * because one message was junk. Every other failure — a dead port, an exhausted
 * retry budget, a host refusal, even a non-object message, which is a stream
 * integrity problem rather than a payload problem — still notifies both channels,
 * so existing consumers of `transport.unavailable` keep working.
 */
const DATA_ERROR_CODES = Object.freeze(new Set([
  TRANSPORT_ERROR.INVALID_INBOUND_ENVELOPE,
  TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE,
]));

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
 * Connection model - there is **no greeting to await**, and a Port is therefore
 * NOT evidence of anything. `connectNative` returns a Port synchronously whether
 * or not the host exists; an unregistered host surfaces later as a disconnect,
 * not a throw. Two consequences this adapter is built around:
 *
 *   - Status is CONNECTING while a port is merely held, and CONNECTED only once a
 *     CORRELATED, SUCCESSFUL reply has come back. Reporting CONNECTED on port
 *     presence is how a missing host gets displayed as a live relay.
 *   - The reconnect counter is reset by that same proof and by nothing else. A
 *     port-then-immediate-drop cycle against an unregistered host otherwise
 *     resets the counter on every attempt and retries forever.
 *
 * Port identity: every callback closes over the port it was installed on and is
 * ignored unless it is still the current port. Without that check, a late message
 * or disconnect from a dead port would fail the requests of the port that
 * replaced it and null the live port out from under it.
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
  const errorSubscribers = new Set();

  let port = null;
  let closed = false;
  let attempts = 0;
  let reconnectTimer = null;
  let nextRequestId = 1;
  let lastError = null;
  let lastErrorCode = null;
  /** True only after a correlated, successful reply from the current port. */
  let proven = false;
  const pending = new Map();

  /**
   * Record a failure and tell both channels.
   *
   * Deliberately does NOT clear the port: one malformed message is a data
   * problem, not a connection problem, and erasing a healthy port for it would
   * turn a host hiccup into an outage. See DATA_ERROR_CODES for why a data
   * failure stays off the envelope channel.
   */
  function reportError(code, reason, extra = {}) {
    lastError = reason;
    lastErrorCode = code;
    if (!DATA_ERROR_CODES.has(code)) {
      for (const fn of subscribers) {
        try { fn({ type: 'transport.unavailable', code, reason }); } catch { /* subscriber threw */ }
      }
    }
    const detail = { code, reason, ...extra };
    for (const fn of errorSubscribers) {
      try { fn(detail); } catch { /* subscriber threw */ }
    }
    return detail;
  }

  function failPending(code, message) {
    if (pending.size === 0) return;
    reportError(code, message);
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
      // Bounded: stop retrying and degrade, rather than spinning forever. The
      // counter is NOT reset by merely obtaining a port (see connect), so a host
      // that hands back a port and drops it immediately still terminates here.
      reportError(TRANSPORT_ERROR.RECONNECT_EXHAUSTED, 'reconnect attempts exhausted; manual resume required');
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
    proven = false;
    failPending(TRANSPORT_ERROR.DISCONNECTED, 'the native host port closed before replying');
    scheduleReconnect();
  }

  function connect() {
    if (closed || port) return port;
    const runtime = chromeApi && chromeApi.runtime;
    if (!runtime || typeof runtime.connectNative !== 'function') {
      reportError(TRANSPORT_ERROR.HOST_UNAVAILABLE, 'chrome.runtime.connectNative is unavailable in this context');
      return null;
    }
    let next;
    try {
      next = runtime.connectNative(hostName);
    } catch (err) {
      // An unregistered host can throw here rather than disconnect later.
      reportError(TRANSPORT_ERROR.CONNECT_FAILED, `could not open host ${hostName}: ${err && err.message}`);
      scheduleReconnect();
      return null;
    }
    if (!next) {
      reportError(TRANSPORT_ERROR.CONNECT_FAILED, `connectNative returned no port for ${hostName}`);
      scheduleReconnect();
      return null;
    }

    port = next;
    // A new port is UNPROVEN. Nothing here resets `attempts`, clears `lastError`
    // or claims liveness: a Port is not evidence (see the doc block).
    proven = false;

    // Identity capture. Each callback checks that the port it was installed on
    // is still the live one, so a late message or a delayed disconnect from a
    // dead port cannot fail the new port's requests or null the new port out.
    const mine = next;
    if (mine.onMessage && typeof mine.onMessage.addListener === 'function') {
      mine.onMessage.addListener((message) => {
        if (port !== mine) return; // stale port: ignore entirely
        onMessage(message);
      });
    }
    if (mine.onDisconnect && typeof mine.onDisconnect.addListener === 'function') {
      mine.onDisconnect.addListener(() => {
        if (port !== mine) return; // stale port: its death is not the live port's death
        onDisconnect();
      });
    }
    return port;
  }

  function onMessage(message) {
    if (!message || typeof message !== 'object') {
      reportError(TRANSPORT_ERROR.NON_OBJECT_MESSAGE, 'the host sent a non-object message');
      return;
    }
    if (message.type === NATIVE_EVENT) {
      // Inbound envelopes are UNTRUSTED until they pass the schema check: a
      // malformed or hostile event must never reach a subscriber, and it must
      // not be silently swallowed either. It is dropped from the data channel
      // and reported on the error channel.
      const check = validateEnvelope(message.envelope);
      if (!check.valid) {
        reportError(
          TRANSPORT_ERROR.INVALID_INBOUND_ENVELOPE,
          `host event dropped: ${check.errors.join('; ')}`,
          { correlation_id: (message.envelope && message.envelope.correlation_id) || null, errors: check.errors },
        );
        return;
      }
      for (const fn of subscribers) {
        try { fn(message.envelope); } catch { /* subscriber threw */ }
      }
      return;
    }

    const entry = message.id != null ? pending.get(message.id) : undefined;
    // Uncorrelated: never resolves anything and never counts as proof.
    if (!entry) return;
    pending.delete(message.id);
    if (entry.timer) clock.clearTimeout(entry.timer);
    if (message.type === NATIVE_ERROR) {
      reportError(TRANSPORT_ERROR.HOST_ERROR, `${message.code}: ${message.message}`, {
        host_code: message.code,
        correlation_id: entry.correlationId ?? null,
      });
      entry.reject(new Error(`${message.code}: ${message.message}`));
      return;
    }
    if (message.type === NATIVE_REPLY && message.ok === true) {
      // THE proof of a live host: a reply that matches a request this adapter
      // made. This is the only thing that clears the reconnect counter and the
      // last error, and the only thing that upgrades status to CONNECTED.
      proven = true;
      attempts = 0;
      lastError = null;
      lastErrorCode = null;
    }
    entry.resolve(message);
  }

  /** Send one command and await its reply. Rejects rather than hanging. */
  function request(type, payload = {}) {
    return new Promise((resolve, reject) => {
      const live = port || connect();
      if (!live) {
        const detail = lastError ?? 'not connected';
        reportError(TRANSPORT_ERROR.HOST_UNAVAILABLE, detail, { requested: type });
        reject(new Error(`native host unavailable: ${detail}`));
        return;
      }
      const id = `n${nextRequestId++}`;
      const correlationId = payload.envelope && payload.envelope.correlation_id
        ? payload.envelope.correlation_id
        : null;
      const timer = clock.setTimeout(() => {
        pending.delete(id);
        reportError(TRANSPORT_ERROR.REQUEST_TIMEOUT, `native request ${type} timed out after ${requestTimeoutMs}ms`, {
          requested: type,
          correlation_id: correlationId,
        });
        reject(new Error(`native request ${type} timed out after ${requestTimeoutMs}ms`));
      }, requestTimeoutMs);
      pending.set(id, { resolve, reject, timer, correlationId });
      try {
        live.postMessage({ ...payload, type, id });
      } catch (err) {
        pending.delete(id);
        clock.clearTimeout(timer);
        reportError(TRANSPORT_ERROR.POST_FAILED, `failed to post ${type}: ${err && err.message}`, { requested: type });
        reject(new Error(`failed to post ${type}: ${err && err.message}`));
      }
    });
  }

  /**
   * The one path that puts an envelope on the wire.
   *
   * The built-in `validateEnvelope` is MANDATORY and cannot be replaced: a
   * caller-supplied validator may only ADD restrictions. An earlier version took
   * the validator as a parameter and fell back to "valid" when it was absent, so
   * both `send()` (no validator) and a permissive caller validator put unchecked
   * objects on the wire.
   *
   * The result is shaped like the fixture transport's (`ok`, `transport`,
   * `message_id`) so a caller can treat both the same way, plus the raw host
   * reply under `host`. `execution_confirmed` is hard-coded false: this is a
   * transport-level ACK, never evidence that anything executed.
   */
  async function sendRelay(type, envelope, extraValidate) {
    const check = validateEnvelope(envelope);
    if (!check.valid) {
      const message = `refusing to send invalid envelope: ${check.errors.join('; ')}`;
      reportError(TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE, message, {
        correlation_id: (envelope && envelope.correlation_id) || null,
        errors: check.errors,
      });
      const err = new Error(message);
      err.code = TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE;
      throw err;
    }
    if (typeof extraValidate === 'function') {
      const extra = extraValidate(envelope) || { valid: false, errors: ['validator returned no verdict'] };
      if (!extra.valid) {
        const err = new Error(`invalid envelope: ${(extra.errors || []).join('; ')}`);
        err.code = TRANSPORT_ERROR.INVALID_OUTBOUND_ENVELOPE;
        throw err;
      }
    }

    const reply = await request(type, { envelope });
    return {
      ...reply,
      ok: reply.ok === true,
      transport: 'native',
      message_id: envelope.message_id,
      execution_confirmed: false,
      host: reply,
    };
  }

  return {
    name: 'native',
    enabled: true,

    /**
     * CLOSED / CONNECTED / CONNECTING / UNAVAILABLE.
     *
     * CONNECTED requires a correlated successful reply. A held port with no
     * proof is CONNECTING, which is how a missing host stays visibly unproven.
     */
    status() {
      if (closed) return NATIVE_STATUS.CLOSED;
      if (proven) return NATIVE_STATUS.CONNECTED;
      if (port) return NATIVE_STATUS.CONNECTING;
      return NATIVE_STATUS.UNAVAILABLE;
    },

    /** True once a correlated, successful reply has arrived on the live port. */
    isProven() {
      return proven === true;
    },

    lastError() {
      return lastError;
    },

    /** Machine-readable companion to lastError(). */
    lastErrorCode() {
      return lastErrorCode;
    },

    connect,

    ping() {
      return request('relay.ping');
    },

    hello() {
      return request('relay.hello');
    },

    /**
     * Validates before putting anything on the wire. `validate` is an optional
     * EXTRA restriction; the built-in schema check always runs first.
     */
    send(envelope) {
      return sendRelay('relay.send', envelope);
    },

    cancel(correlationId) {
      return request('relay.cancel', { correlation_id: correlationId });
    },

    /** Same mandatory built-in check, plus an optional caller restriction. */
    sendEnvelope(envelope, validate) {
      return sendRelay('relay.send', envelope, validate);
    },

    onMessage(fn) {
      if (typeof fn !== 'function') return undefined;
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    /**
     * Structured failure channel, kept separate from the envelope channel so a
     * dropped or refused message is never mistaken for delivered data.
     *
     * @param {(detail: { code: string, reason: string, correlation_id?: string|null, errors?: string[] }) => void} fn
     */
    onError(fn) {
      if (typeof fn !== 'function') return undefined;
      errorSubscribers.add(fn);
      return () => errorSubscribers.delete(fn);
    },

    close() {
      closed = true;
      if (reconnectTimer) {
        clock.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      failPending(TRANSPORT_ERROR.CLOSED, 'transport closed');
      proven = false;
      if (port) {
        const live = port;
        port = null;
        try { live.disconnect(); } catch { /* already gone */ }
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
