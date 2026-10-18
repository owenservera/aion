// AION Relay Bridge — native host main loop.
//
// This is the only place the three wire formats meet:
//
//   Chrome frame  --framing.js-->   command object
//   command       --envelope-map--> ACP JSON-RPC request   (acp-client.js)
//   ACP response  --envelope-map--> relay envelope         (framing.js back out)
//
// It is also the trust boundary, so the checks that matter live here:
//
//   NM-02  the `origin` Chrome hands us must be the expected extension id
//   ACP-02 cwd is fixed by this host; an extension-supplied cwd is honoured only
//          when it matches the configured allowlist
//   ACP-09 child death is detected, surfaced as operator.alert, and leaves no
//          orphaned session behind
//   ACP-11 nothing that could be a credential reaches an envelope or a log line
//
// It does NOT register anything, write to the registry, launch a browser, or
// load an extension. Registering `com.aion.relay` is an owner-gated step
// (BRIDGE-DESIGN.md section 5) and only a manifest TEMPLATE ships here.

import { PassThrough } from 'node:stream';
import {
  createEnvelope,
  createEventStore,
  deliveryTransition,
  validateEnvelope,
} from '../../extension/src/lib/index.js';
import { FramingError, createNativeFrameDecoder, encodeNativeFrame } from './framing.js';
import { ACP_ERROR, AcpClientError, createAcpClient } from './acp-client.js';
import {
  MAP_ERROR,
  EnvelopeMapError,
  REDACTED,
  SECRET_KEY_PATTERN,
  dropSecretFields,
  envelopeToRequest,
  extractRequestedCwd,
  messageToEnvelopes,
} from './envelope-map.js';
import { assertCwdAllowed, normalizePathForCompare } from './config.js';

export const HOST_ERROR = Object.freeze({
  ORIGIN_MISSING: 'origin_missing',
  ORIGIN_NOT_ALLOWED: 'origin_not_allowed',
  INVALID_FRAME: 'invalid_frame',
  INVALID_COMMAND: 'invalid_command',
  UNKNOWN_COMMAND: 'unknown_command',
  INVALID_ENVELOPE: 'invalid_envelope',
  UNMAPPED_ENVELOPE_EVENT: MAP_ERROR.UNMAPPED_ENVELOPE_EVENT,
  UNMAPPED_ACP_METHOD: MAP_ERROR.UNMAPPED_ACP_METHOD,
  CWD_NOT_ALLOWED: 'cwd_not_allowed',
  AGENT_UNAVAILABLE: ACP_ERROR.AGENT_GONE,
  SPAWN_FAILED: ACP_ERROR.SPAWN_FAILED,
  INTERNAL: 'internal_error',
});

/* ========================================================= logging (ACP-10, ACP-11) */

const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

/**
 * Create a logger that writes to an arbitrary sink and cannot emit a secret.
 *
 * Two properties, both load-bearing:
 *
 *  - The default sink is STDERR. The ACP child's stdout is a protocol channel;
 *    a log line there desynchronises JSON-RPC for the rest of the session
 *    (ACP-10). Nothing in this bridge calls console.log.
 *  - Every value is scrubbed before formatting: credential-shaped keys are
 *    dropped, credential-shaped substrings are replaced, and values registered
 *    via registerSecret() are replaced even when their key looks innocent
 *    (ACP-11).
 */
export function createRedactingLogger(options = {}) {
  const sink = typeof options.sink === 'function'
    ? options.sink
    : (line) => { process.stderr.write(`${line}\n`); };
  const now = typeof options.now === 'function' ? options.now : () => new Date().toISOString();
  let threshold = LEVELS[options.level] ?? LEVELS.debug;
  const secrets = new Set();
  const emitted = [];

  for (const secret of options.secrets ?? []) registerSecret(secret);

  function registerSecret(value) {
    if (typeof value !== 'string' || value.length < 4) return;
    secrets.add(value);
  }

  function redactString(text) {
    let out = String(text);
    for (const secret of secrets) {
      if (out.includes(secret)) out = out.split(secret).join(REDACTED);
    }
    return scrubText(out);
  }

  function redact(value) {
    if (typeof value === 'string') return redactString(value);
    if (Array.isArray(value)) return value.map(redact);
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(key)) continue;
      out[key] = redact(entry);
    }
    return out;
  }

  function emit(level, args) {
    if (LEVELS[level] < threshold) return;
    const parts = args.map((arg) => {
      if (typeof arg === 'string') return redactString(arg);
      try {
        return JSON.stringify(redact(arg));
      } catch {
        return redactString(String(arg));
      }
    });
    const line = `[aion-bridge] ${now()} ${level} ${parts.join(' ')}`;
    emitted.push(line);
    sink(line);
  }

  return {
    debug: (...args) => emit('debug', args),
    info: (...args) => emit('info', args),
    warn: (...args) => emit('warn', args),
    error: (...args) => emit('error', args),
    registerSecret,
    setLevel(level) {
      threshold = LEVELS[level] ?? threshold;
    },
    /** Every line this logger produced. Test aid; contents are already scrubbed. */
    lines: () => emitted.slice(),
  };
}

function scrubText(text) {
  // Reuse the envelope mapper's value-shaped rules so one policy governs both
  // leak surfaces: log lines and envelope payloads.
  return dropSecretFields(text);
}

/* ==================================================================== host */

/**
 * Create the native host.
 *
 * @param {object} options
 * @param {object} options.config     validated config (see config.js)
 * @param {NodeJS.ReadableStream} [options.input]   Chrome -> host (default: PassThrough)
 * @param {NodeJS.WritableStream} [options.output]  host -> Chrome (default: PassThrough)
 * @param {Function} [options.spawn]                injected; the suite never spawns the real agent
 * @param {object} [options.logger]                 defaults to a redacting stderr logger
 * @param {object} [options.client]                 injected ACP client (tests)
 */
export function createHost(options) {
  if (!options || !options.config) throw new TypeError('createHost requires a validated config');
  const config = options.config;
  const input = options.input ?? new PassThrough();
  const output = options.output ?? new PassThrough();
  const logger = options.logger ?? createRedactingLogger({ level: config.logLevel });

  const state = {
    origin: null,
    refused: false,
    started: false,
    sequence: 0,
    sessionId: null,
    sessionCwd: config.sessionCwd,
    /** Memoised ACP `initialize` (capabilities only). Never implies a session. */
    initializedPromise: null,
    /** What `initialize` returned, for truthful status reporting. */
    capabilities: null,
    /** Memoised `session/new`, created lazily on dispatch only. */
    sessionPromise: null,
    dispatched: 0,
    refusedMessages: 0,
    emittedEvents: 0,
    failedDeliveries: 0,
    agentLossAlerts: 0,
  };

  /** Incoming relay events, deduped by message_id + idempotency_key (contract). */
  const store = createEventStore();

  /** correlation_id -> { sessionId, promise }, so a cancel can find its turn. */
  const inFlight = new Map();

  // Chrome does NOT send the caller's origin as a message. It passes it to the
  // native host as the first command-line argument ("chrome-extension://<id>/",
  // plus "--parent-window=<n>" on Windows) and then speaks framed JSON on stdin.
  //
  // That argv value is therefore REQUIRED. There used to be a fallback where the
  // first framed stdin message was treated as the origin, which is worthless as a
  // check: whoever writes those bytes decides the origin, so the "verification"
  // only verified that the writer was the writer. A missing origin is now a
  // refusal (ORIGIN_MISSING) rather than an open door.
  applyOrigin(options.initialOrigin, 'command line');

  const client = options.client ?? createAcpClient({
    config,
    spawn: options.spawn,
    logger,
    onExit: (info) => {
      state.agentLossAlerts += 1;
      state.sessionId = null;
      state.sessionPromise = null;
      state.initializedPromise = null;
      state.capabilities = null;
      inFlight.clear(); // ACP-09: no orphaned turns after the child dies
      logger.warn(`acp agent gone (${info.reason ?? 'unknown'}); in-flight turns abandoned`);
      emitEnvelope(buildAlert({
        alert: 'acp_agent_unavailable',
        reason: info.reason ?? 'unknown',
        exit_code: info.code ?? null,
        abandoned_sessions: info.sessions ?? 0,
        // Durable truth lives in the ledger. An in-process session id surviving
        // a dead child would be a lie, so it is discarded rather than kept.
        recoverable: true,
      }));
    },
    onUnsupportedRequest: (info) => {
      emitEnvelope(buildAlert({
        alert: 'acp_message_not_implemented',
        method: info.method,
        detail: 'answered with jsonrpc method_not_found; the agent was granted nothing',
      }));
    },
  });

  const decoder = createNativeFrameDecoder({
    maxFrameBytes: config.maxFrameBytes,
    onMessage: handleFrame,
    onError: (err) => {
      logger.error(`native framing error: ${err.message}`);
      sendError(null, HOST_ERROR.INVALID_FRAME, err.message);
      // A desynchronised Chrome stream is fatal to this connection: later
      // frames can no longer be attributed to a trustworthy boundary.
      state.refused = true;
    },
  });

  input.on('data', (chunk) => {
    try {
      decoder.push(chunk);
    } catch (err) {
      logger.error(`failed to read from Chrome: ${err && err.message}`);
    }
  });
  input.on('error', (err) => logger.warn(`input stream error: ${err && err.message}`));

  /* ------------------------------------------------------------- outbound */

  /** Write one Chrome-framed message. Delivery failures are counted, not hidden. */
  function send(message) {
    try {
      output.write(encodeNativeFrame(message, { maxFrameBytes: config.maxFrameBytes }));
      return true;
    } catch (err) {
      state.failedDeliveries += 1;
      logger.warn(`failed to write to Chrome: ${err && err.message}`);
      return false;
    }
  }

  function emitEnvelope(env) {
    if (!env) return false;
    state.emittedEvents += 1;
    return send({ type: 'relay.event', envelope: env });
  }

  function sendError(id, code, message, extra = {}) {
    logger.warn(`refusing command ${String(id)}: ${code}: ${message}`);
    send({ type: 'relay.error', id: id ?? null, code, message: scrubText(String(message)), ...extra });
  }

  function nextSequence() {
    state.sequence += 1;
    return state.sequence;
  }

  function envelopeCtx(extra = {}) {
    return {
      nodeId: config.nodeId,
      nextSequence,
      sessionCwd: state.sessionCwd,
      sessionId: state.sessionId,
      ...extra,
    };
  }

  /**
   * A host-level alert envelope.
   *
   * Built with the relay library's own constructor rather than through
   * messageToEnvelopes, because an operator alert has NO ACP message behind it:
   * this is the host speaking about itself, and pretending it came from a
   * translated JSON-RPC reply would be exactly the conflation this milestone
   * forbids.
   */
  function buildAlert(payload) {
    const env = createEnvelope({
      event_type: 'operator.alert',
      task_state: 'PROPOSED',
      producer_node: config.nodeId,
      correlation_id: payload.correlation_id ?? null,
      causation_id: payload.causation_id ?? null,
      payload: { taxonomy: 'non-task', ...payload },
      delivery_state: 'SENT',
      task_state: 'PROPOSED',
    });
    const check = validateEnvelope(env);
    if (!check.valid) {
      logger.error(`operator alert failed validation: ${check.errors.join('; ')}`);
      return null;
    }
    env.sequence = nextSequence();
    return env;
  }

  /* --------------------------------------------------------------- inbound */

  /**
   * Run the NM-02 origin check exactly once. Refusal is terminal: once refused,
   * every later frame is answered with a refusal and nothing is executed.
   *
   * WHAT THIS ACTUALLY PROVES, stated plainly so nobody over-trusts it: the value
   * arrives in the process's own argv, and anything able to launch this process
   * locally can put any string there. Chrome's `allowed_origins` check in the
   * native-messaging manifest is a BROWSER-side check that narrows who may start
   * the host at all — it is not strong local authentication, and it does not
   * travel with the argv value. What NM-02 adds is that this host compares the
   * argv origin against the pinned extension id and executes nothing when they
   * differ, so a copy-pasted command line from another extension is refused
   * rather than obeyed. Unset is a refusal, never a wildcard.
   */
  function applyOrigin(value, source) {
    if (state.origin !== null) return;
    if (typeof value !== 'string' || value === '') {
      state.origin = '';
      state.refused = true;
      logger.error(`origin missing (${source}); refusing the connection`);
      sendError(null, HOST_ERROR.ORIGIN_MISSING, `no extension origin was supplied by Chrome (${source})`);
      return;
    }
    state.origin = value;
    if (config.expectedExtensionId === '' || value !== config.expectedExtensionId) {
      state.refused = true;
      logger.error(`origin "${value}" is not the configured extension id; refusing every message`);
      sendError(null, HOST_ERROR.ORIGIN_NOT_ALLOWED, `origin "${value}" is not allowed by this host`);
      return;
    }
    logger.info(`origin accepted from ${source}: ${value}`);
  }

  function handleFrame(value) {
    if (state.refused) {
      state.refusedMessages += 1;
      sendError(null, HOST_ERROR.ORIGIN_NOT_ALLOWED, 'connection refused at the origin check; no command was executed');
      return;
    }
    // NOT serialised against other commands on purpose: a second event for a
    // session whose turn is still running must be REJECTED (ACP-05), not queued
    // behind the first and silently accepted after it finishes.
    handleCommand(value).catch((err) => {
      // EVERY failure answers the id that asked, including one that escaped every
      // inner catch. A `relay.error` with id:null is unmatchable by construction:
      // the caller has one request outstanding and can only wait for its own
      // timeout. That is exactly how a real `session/new` failure turned into a
      // 40-second caller timeout with no diagnosis attached to it.
      const id = requestIdOf(value);
      const text = safeErrorText(err);
      logger.error(`command failed: ${errorCode(err)}: ${text}`);
      sendError(id, errorCode(err), text, { correlation_id: envelopeCorrelationId(value) });
    });
  }

  async function handleCommand(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      sendError(null, HOST_ERROR.INVALID_COMMAND, 'a native message must be a JSON object');
      return;
    }
    const id = message.id ?? null;
    switch (message.type) {
      case 'relay.ping':
        send({
          type: 'relay.reply',
          id,
          ok: true,
          host: { name: config.hostName, node_id: config.nodeId, protocol_version: config.protocolVersion },
          agent: {
            // The path is reported as CONFIGURED, not as verified: only a
            // successful spawn proves a binary exists there.
            path: config.agentPath,
            status: client.status(),
            running: client.status() === 'ready',
          },
          // Truthful, separate facts: an initialized agent and a created session
          // are different milestones, and neither implies the other.
          capabilities_observed: state.capabilities !== null,
          session: sessionReport(),
          session_cwd: config.sessionCwd,
          allowed_cwds: config.allowedCwds.slice(),
        });
        return;

      case 'relay.hello':
        await handleHello(id);
        return;

      case 'relay.send':
        await handleSend(id, message);
        return;

      case 'relay.cancel':
        await handleCancel(id, message);
        return;

      case 'relay.shutdown':
        send({ type: 'relay.reply', id, ok: true, stopped: true });
        await stop();
        return;

      default:
        sendError(id, HOST_ERROR.UNKNOWN_COMMAND, `unknown command type ${JSON.stringify(message.type)}`);
    }
  }

  /**
   * `relay.hello` answers ONE question: can this bridge initialize the agent, and
   * what does the agent support?
   *
   * It deliberately does NOT create an ACP session. Session creation is a
   * dispatch-time concern (`ensureSession`), for two reasons: `session/new` is a
   * heavier operation that can fail for reasons that have nothing to do with
   * "is the relay talking to a real agent", and a hello that created a session
   * would have to report session readiness from a side effect. On a real run,
   * `session/new` failing inside hello turned a capability probe into an
   * uncorrelated error the caller could only time out on.
   */
  async function handleHello(id) {
    const info = await ensureInitialized();
    const [envelope] = messageToEnvelopes({ result: info ?? {} }, envelopeCtx({ acpMethod: 'initialize' }));
    emitEnvelope(envelope);
    send({
      type: 'relay.reply',
      id,
      ok: true,
      protocol_version: config.protocolVersion,
      agent: info ?? null,
      session: sessionReport(),
    });
  }

  /**
   * What can honestly be said about the session RIGHT NOW.
   *
   * `created:false` is the point: `relay.ping` and `relay.hello` answer before
   * any session exists, and a status that implied otherwise would report session
   * readiness this host never observed.
   */
  function sessionReport() {
    return state.sessionId
      ? { created: true, session_id: state.sessionId }
      : {
        created: false,
        session_id: null,
        note: 'no ACP session exists yet; one is created on dispatch, and only then is session readiness claimed',
      };
  }

  /** `relay.send` — the one path that reaches the ACP agent. */
  async function handleSend(id, message) {
    const env = message.envelope;
    const check = validateEnvelope(env);
    if (!check.valid) {
      sendError(id, HOST_ERROR.INVALID_ENVELOPE, `invalid envelope: ${check.errors.join('; ')}`, {
        correlation_id: (env && env.correlation_id) || null,
      });
      return;
    }

    // ACP-02: the host fixes cwd. An extension-supplied cwd is honoured ONLY
    // when it is in the allowlist. Anything else is refused outright rather
    // than silently rewritten, because "silently ignored" reads to the caller
    // like "it was used".
    //
    // THIS CHECK RUNS BEFORE THE ENVELOPE IS STORED, deliberately. It used to run
    // after `store.append`, which meant a refused envelope had already consumed
    // its idempotency key: the caller correcting the cwd and retrying the SAME
    // message_id/idempotency_key was answered `replayed: true` and never
    // executed. A rejection that poisons the retry is worse than the rejection.
    const requestedCwd = extractRequestedCwd(env);
    if (requestedCwd !== null) {
      const verdict = assertCwdAllowed(config, requestedCwd);
      if (!verdict.allowed) {
        logger.info(`refusing cwd before storing: ${verdict.reason}`);
        sendError(id, HOST_ERROR.CWD_NOT_ALLOWED, verdict.reason, { correlation_id: env.correlation_id });
        return;
      }
    }

    // Dedupe at the receiving host (contract): a replayed idempotency key is
    // recorded as evidence and NOT executed a second time.
    let appended;
    try {
      appended = await store.append(env);
    } catch (err) {
      sendError(id, HOST_ERROR.INVALID_ENVELOPE, err && err.message, { correlation_id: env.correlation_id });
      return;
    }
    if (!appended.stored) {
      logger.info(`refusing replayed envelope: ${appended.reason}`);
      send({
        type: 'relay.reply',
        id,
        ok: true,
        replayed: true,
        reason: appended.reason,
        message_id: env.message_id,
        correlation_id: env.correlation_id,
      });
      return;
    }

    // NOTE (deliberately absent): the host's own emitted-envelope counter is not
    // advanced from an inbound `env.sequence`. That counter numbers what THIS
    // host emits; adopting a caller's number would make two hosts' sequence
    // spaces overlap and would let an extension inflate or rewind host output.
    // Callers own their own sequence.

    try {
      // Lazily, and only here: `envelopeToRequest` needs a real session id, and a
      // dispatch is the first moment a session is actually needed.
      await ensureSession();
    } catch (err) {
      sendError(id, errorCode(err), safeErrorText(err), { correlation_id: env.correlation_id });
      return;
    }

    let request;
    try {
      request = envelopeToRequest(env, {
        sessionId: state.sessionId ?? undefined,
        resolveSessionId: () => state.sessionId,
      });
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: env.correlation_id });
      return;
    }

    state.dispatched += 1;

    if (request.method === 'session/prompt') {
      await dispatchPrompt(id, env, request);
      return;
    }

    try {
      const result = await client.request(request.method, request.params);
      const envelopes = messageToEnvelopes({ result: result ?? {} }, envelopeCtx({
        acpMethod: request.method,
        correlationId: env.correlation_id,
        causationId: env.message_id,
      }));
      for (const out of envelopes) emitEnvelope(out);
      send({ type: 'relay.reply', id, ok: true, method: request.method, events: envelopes.map((e) => e.event_type) });
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: env.correlation_id });
    }
  }

  async function dispatchPrompt(id, env, request) {
    const sessionId = request.params.sessionId;
    const correlationId = env.correlation_id;
    let promptPromise;

    try {
      promptPromise = client.prompt({
        sessionId,
        text: request.params.prompt[0].text,
        correlationId,
        onUpdate: (update, info) => {
          // Every session/update becomes a task.progress envelope caused by
          // the dispatch envelope (causation_id), so the chain is auditable.
          const [progress] = messageToEnvelopes(
            { method: 'session/update', params: { sessionId: info.sessionId, update } },
            envelopeCtx({ acpMethod: 'session/update', correlationId, causationId: env.message_id }),
          );
          emitEnvelope(progress);
        },
      });
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: correlationId });
      return;
    }

    const key = correlationId ?? env.message_id;
    inFlight.set(key, { sessionId, promise: promptPromise });

    let outcome;
    try {
      outcome = await promptPromise;
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: correlationId });
      return;
    } finally {
      inFlight.delete(key);
    }

    let envelopes;
    try {
      envelopes = messageToEnvelopes({ result: { stopReason: outcome.stopReason } }, envelopeCtx({
        acpMethod: 'session/prompt',
        correlationId,
        causationId: env.message_id,
        cancelled: client.status() !== 'idle',
      }));
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: correlationId });
      return;
    }
    for (const out of envelopes) emitEnvelope(out);
    send({
      type: 'relay.reply',
      id,
      ok: true,
      method: 'session/prompt',
      stop_reason: outcome.stopReason,
      events: envelopes.map((e) => e.event_type),
    });
  }

  async function handleCancel(id, message) {
    const correlationId = typeof message.correlation_id === 'string' ? message.correlation_id : null;
    const sessionId = typeof message.session_id === 'string'
      ? message.session_id
      : (inFlight.get(correlationId)?.sessionId ?? state.sessionId);

    if (!sessionId) {
      sendError(id, HOST_ERROR.INVALID_COMMAND, 'no ACP session is established; nothing to cancel');
      return;
    }
    try {
      const accepted = client.cancel(sessionId);
      // A cancel REQUEST is not a cancellation. The cancelled stop reason,
      // arriving later as task.cancelled, is the proof (ACP-06).
      const [envelope] = messageToEnvelopes({ result: {} }, envelopeCtx({
        acpMethod: 'session/cancel',
        correlationId,
        sessionId,
      }));
      emitEnvelope(envelope);
      send({ type: 'relay.reply', id, ok: true, ...accepted, cancellation_confirmed: false });
    } catch (err) {
      sendError(id, errorCode(err), err && err.message, { correlation_id: correlationId });
    }
  }

  /* ---------------------------------------------------------------- agent */

  /**
   * ACP `initialize`, memoised and IDEMPOTENT.
   *
   * Concurrent callers share one in-flight promise, so a burst of pings and a
   * hello cannot negotiate the protocol twice. A rejection clears the memo so a
   * LATER explicit call may try again — nothing here retries on its own, because
   * a background retry against a failing agent is work the caller never asked for.
   *
   * Returns the agent's capability report. Never creates a session.
   */
  async function ensureInitialized() {
    if (state.initializedPromise) return state.initializedPromise;
    state.initializedPromise = (async () => {
      const info = await client.initialize();
      state.capabilities = info ?? null;
      logger.info('acp agent initialized; capabilities observed, no session created');
      return info;
    })();
    try {
      return await state.initializedPromise;
    } catch (err) {
      state.initializedPromise = null; // retryable BY A LATER CALL, never automatically
      throw err;
    }
  }

  /**
   * ACP `session/new`, LAZY: called only when a command actually needs a session.
   *
   * Idempotent for the same reason as ensureInitialized, and it refuses to report
   * a session it does not have — a response without a session id leaves
   * `state.sessionId` null, so nothing downstream can claim session readiness.
   */
  async function ensureSession() {
    if (state.sessionId) return state.sessionId;
    if (state.sessionPromise) return state.sessionPromise;
    state.sessionPromise = (async () => {
      await ensureInitialized();
      const session = await client.newSession({ cwd: config.sessionCwd });
      if (!session || typeof session.sessionId !== 'string' || session.sessionId === '') {
        throw new AcpClientError(
          ACP_ERROR.REQUEST_FAILED,
          'session/new returned no sessionId; this host creates no session and claims no session readiness',
        );
      }
      state.sessionId = session.sessionId;
      state.sessionCwd = normalizePathForCompare(config.sessionCwd) ?? config.sessionCwd;
      logger.info(`acp session ${session.sessionId} created, pinned to ${state.sessionCwd}`);
      return state.sessionId;
    })();
    try {
      return await state.sessionPromise;
    } catch (err) {
      state.sessionPromise = null; // a later dispatch may try again; this one does not
      throw err;
    }
  }

  async function stop() {
    state.started = false;
    try {
      await store.ready();
    } catch {
      /* a bad log must not block shutdown */
    }
    client.close();
  }

  /** ACP-09 recovery: a new child, no stale ids, session created lazily again. */
  async function restart() {
    inFlight.clear();
    state.sessionId = null;
    state.sessionPromise = null;
    state.initializedPromise = null;
    state.capabilities = null;
    await client.restart();
    return ensureInitialized();
  }

  const api = {
    state,
    client,
    store,
    start() {
      state.started = true;
      return api;
    },
    stop,
    restart,
    ensureInitialized,
    ensureSession,
    /** Backward-compatible alias: the old name meant "agent AND session". */
    ensureAgent: ensureSession,
    /** Test aid: write a value into the host exactly as Chrome would. */
    receive(value) {
      input.write(encodeNativeFrame(value, { maxFrameBytes: config.maxFrameBytes }));
    },
  };

  return api;
}

/* ---------------------------------------------------------------- internals */

/**
 * The request id of an inbound frame, or null when there is none.
 *
 * Used so that EVERY failure — including one that escapes each inner catch — is
 * answerable by the caller that asked. `relay.error` with `id: null` is
 * unmatchable by design: a caller with one request outstanding can only sit out
 * its own timeout, which is what turned a real agent failure into a 40-second
 * silent wait.
 */
function requestIdOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value.id === undefined ? null : value.id;
}

/** The relay correlation_id carried by an inbound frame, for the error's evidence. */
function envelopeCorrelationId(value) {
  if (!value || typeof value !== 'object') return null;
  const env = value.envelope;
  if (!env || typeof env !== 'object') return null;
  return typeof env.correlation_id === 'string' ? env.correlation_id : null;
}

/**
 * One line of operator-facing text for a failure: scrubbed, single line, bounded.
 *
 * A stack trace is not operator text — it is source layout, it can carry paths
 * and payload fragments, and it is useless to whoever reads the operator log. The
 * scrubbed message keeps the diagnosable part (including an upstream JSON-RPC
 * code, which is the thing that identifies the failure).
 */
function safeErrorText(err) {
  if (err === null || err === undefined) return 'unknown error';
  const raw = typeof err === 'string' ? err : (err.message || String(err));
  const firstLine = scrubText(String(raw)).split('\n')[0].trim();
  return (firstLine === '' ? 'unknown error' : firstLine).slice(0, 500);
}

function errorCode(err) {
  if (err instanceof FramingError) return HOST_ERROR.INVALID_FRAME;
  if (err instanceof EnvelopeMapError) {
    return err.code === MAP_ERROR.UNMAPPED_ACP_METHOD
      ? HOST_ERROR.UNMAPPED_ACP_METHOD
      : HOST_ERROR.UNMAPPED_ENVELOPE_EVENT;
  }
  if (err instanceof AcpClientError) {
    if (err.code === ACP_ERROR.CWD_NOT_ALLOWED || err.code === ACP_ERROR.CWD_MISMATCH) return HOST_ERROR.CWD_NOT_ALLOWED;
    if (err.code === ACP_ERROR.SPAWN_FAILED) return HOST_ERROR.SPAWN_FAILED;
    if (err.code === ACP_ERROR.AGENT_GONE) return HOST_ERROR.AGENT_UNAVAILABLE;
    // The agent's own failure text (including a JSON-RPC code like -32603)
    // travels in the MESSAGE; the code stays one of this host's names.
    return HOST_ERROR.AGENT_UNAVAILABLE;
  }
  // Only a STRING code is a code. A raw JSON-RPC error carries a numeric one
  // (`-32603`), and forwarding that into `relay.error.code` would give the
  // operator a number where every other code in this protocol is a name.
  if (err && typeof err.code === 'string' && err.code !== '') return err.code;
  return HOST_ERROR.INTERNAL;
}

/**
 * Delivery bookkeeping shared with the relay library.
 *
 * Host-emitted envelopes are not persisted in Milestone 1: the durable outbox
 * for host->extension events is a later milestone, and pretending otherwise
 * would be a claim the code cannot back. What IS real today is that a failed
 * write downgrades the delivery instead of pretending it landed.
 */
export function noteDeliveryFailure(current, target = 'RETRY') {
  return deliveryTransition(current, target);
}