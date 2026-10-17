// AION Relay Bridge — ACP client (Agent Client Protocol v1).
//
// Transport: newline-delimited JSON-RPC 2.0 over the child's stdin/stdout
// (verified on this host, opencode 2.0.32). Logs go to stderr, never stdout
// (ACP-10): the ACP stdout stream is a protocol channel and a single stray log
// line desynchronises it.
//
// Scope, deliberately narrow: initialize -> session/new -> session/prompt ->
// session/cancel, plus load/resume/fork because ACP-02 requires proving that a
// mismatched cwd is refused. Nothing here forwards a relay envelope: this
// module speaks ACP, envelope-map.js speaks envelopes, and host.js is the only
// place the two meet (BRIDGE-DESIGN.md section 3).
//
// Every external effect is injectable: `spawn`, `logger` and `timeouts`. The test
// suite never spawns the real agent — it injects a fake ACP child — and nothing
// here can be coerced into spawning a browser or loading an extension.

import { spawn as nodeSpawn } from 'node:child_process';
import {
  JSONRPC_ERROR,
  JSONRPC_VERSION,
  createNdjsonDecoder,
  encodeJsonRpcLine,
} from './framing.js';
import { assertCwdAllowed, cwdKey, normalizePathForCompare } from './config.js';

/** Client status values. `dead` is recoverable; `failed` means it never started. */
export const CLIENT_STATUS = Object.freeze({
  IDLE: 'idle',
  STARTING: 'starting',
  READY: 'ready',
  DEAD: 'dead',
  FAILED: 'failed',
  CLOSED: 'closed',
});

export const ACP_ERROR = Object.freeze({
  NOT_STARTED: 'agent_not_started',
  AGENT_GONE: 'agent_unavailable',
  SPAWN_FAILED: 'agent_spawn_failed',
  SPAWN_TIMEOUT: 'agent_spawn_timeout',
  REQUEST_FAILED: 'acp_request_failed',
  TIMEOUT: 'acp_timeout',
  PROTOCOL_MISMATCH: 'protocol_version_mismatch',
  CONCURRENT_PROMPT: 'prompt_in_flight',
  CWD_MISMATCH: 'cwd_mismatch',
  CWD_NOT_ALLOWED: 'cwd_not_allowed',
  UNKNOWN_SESSION: 'unknown_session',
  PROTOCOL_ERROR: 'acp_protocol_error',
  NOT_PROMPTED: 'prompt_not_active',
});

export class AcpClientError extends Error {
  constructor(code, message, data = undefined) {
    super(message);
    this.name = 'AcpClientError';
    this.code = code;
    if (data !== undefined) this.data = data;
  }
}

/** Default logger: stderr only. Never stdout (ACP-10). */
export function createStderrLogger() {
  const emit = (level, args) => {
    // process.stderr, never process.stdout: see ACP-10.
    process.stderr.write(`[aion-bridge] ${level} ${args.map(stringify).join(' ')}\n`);
  };
  return {
    debug: (...args) => emit('debug', args),
    info: (...args) => emit('info', args),
    warn: (...args) => emit('warn', args),
    error: (...args) => emit('error', args),
  };
}

const NULL_LOGGER = { debug() {}, info() {}, warn() {}, error() {} };

/**
 * Create an ACP client.
 *
 * @param {object} options
 * @param {ReturnType<typeof createConfig>} options.config
 * @param {(command: string, args: string[], options: object) => object} [options.spawn]
 * @param {{debug:Function,info:Function,warn:Function,error:Function}} [options.logger]
 * @param {(info: {reason: string, code?: number|null, signal?: string|null, sessions: number}) => void} [options.onExit]
 * @param {(info: {sessionId: string, update: object}) => void} [options.onOrphanUpdate]
 * @param {(info: {method: string, id: string|number|null, params: object}) => void} [options.onUnsupportedRequest]
 */
export function createAcpClient(options) {
  if (!options || typeof options !== 'object') throw new TypeError('createAcpClient requires options');
  const config = options.config;
  if (!config) throw new TypeError('createAcpClient requires a validated config');

  const spawnFn = typeof options.spawn === 'function' ? options.spawn : nodeSpawn;
  const logger = options.logger || createStderrLogger();
  const timeouts = { ...config.timeouts };

  /** @type {null | { child: object, decoder: object } } */
  let link = null;
  let status = CLIENT_STATUS.IDLE;
  let lastExit = null;
  let nextRequestId = 1;
  let initializeResult = null;

  /** @type {Map<string|number, {resolve: Function, reject: Function, timer: any, method: string}>} */
  const pending = new Map();

  /**
   * Sessions live in THIS process only. ACP is a private per-process server
   * (dossier: "ACP process closes when parent stdin closes"), so a session id
   * that survives a child restart would be a lie — hence sessions are dropped
   * wholesale on exit (ACP-09, no orphaned sessions).
   * @type {Map<string, {sessionId: string, cwd: string, createdAt: string, prompt: null|object, cancelling: boolean}>}
   */
  const sessions = new Map();

  /* ------------------------------------------------------------- lifecycle */

  function requireStarted() {
    if (!link) {
      throw new AcpClientError(
        ACP_ERROR.NOT_STARTED,
        status === CLIENT_STATUS.DEAD
          ? 'the ACP agent process is gone; restart() it before sending'
          : `the ACP agent process is not running (status: ${status})`,
      );
    }
  }

  /** The one and only writer to the ACP child's stdin. */
  function writeLine(message) {
    requireStarted();
    const line = encodeJsonRpcLine(message);
    try {
      link.child.stdin.write(line);
    } catch (err) {
      throw new AcpClientError(ACP_ERROR.AGENT_GONE, `failed to write to the ACP agent: ${err && err.message}`);
    }
  }

  async function start() {
    if (link) return api;
    status = CLIENT_STATUS.STARTING;

    const spawnOptions = {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: normalizePathForCompare(config.sessionCwd) ?? config.sessionCwd,
      windowsHide: true,
      env: { ...process.env },
    };

    let child;
    try {
      child = spawnFn(config.agentPath, [...config.agentArgs], spawnOptions);
    } catch (err) {
      status = CLIENT_STATUS.FAILED;
      lastExit = { reason: 'spawn_failed', message: err && err.message };
      throw new AcpClientError(
        ACP_ERROR.SPAWN_FAILED,
        `failed to spawn the ACP agent at "${config.agentPath}": ${err && err.message}`,
      );
    }
    if (!child || !child.stdin || !child.stdout) {
      status = CLIENT_STATUS.FAILED;
      throw new AcpClientError(ACP_ERROR.SPAWN_FAILED, 'spawn did not return a usable child process');
    }

    const decoder = createNdjsonDecoder({
      onMessage: handleAgentMessage,
      onError: (err) => {
        // A malformed ACP line means the stream is desynchronised. The child
        // cannot be trusted after that, so it is stopped rather than resynced.
        logger.error(`acp stdout protocol error: ${err.message}`);
        failAllPending(ACP_ERROR.PROTOCOL_ERROR, `ACP stdout protocol error: ${err.message}`);
        stopChild();
      },
    });

    link = { child, decoder };

    // stderr is the log channel. It is drained (an undrained pipe fills and
    // blocks the child) and never forwarded to ACP stdout.
    child.stderr?.setEncoding?.('utf8');
    child.stderr?.on('data', (text) => {
      for (const line of String(text).split(/\r?\n/)) {
        if (line.trim() !== '') logger.info(`acp-stderr: ${line}`);
      }
    });
    child.stderr?.on('error', () => {});

    child.stdout.setEncoding?.('utf8');
    child.stdout.on('data', (chunk) => decoder.push(chunk));
    child.stdout.on('end', () => decoder.end());
    child.stdout.on('error', () => {});

    child.on('error', (err) => {
      status = CLIENT_STATUS.FAILED;
      lastExit = { reason: 'error', message: err && err.message };
      logger.error(`acp agent process error: ${err && err.message}`);
      failAllPending(ACP_ERROR.SPAWN_FAILED, `ACP agent process error: ${err && err.message}`);
    });

    child.on('exit', (code, signal) => {
      const sessionsAtExit = sessions.size;
      // An exit we asked for is not an incident: reporting it as one would make
      // every clean shutdown look like a crashed agent.
      const intentional = status === CLIENT_STATUS.CLOSED;
      link = null;
      decoder.error();
      sessions.clear(); // ACP-09: no orphaned sessions after the child dies
      status = intentional ? CLIENT_STATUS.CLOSED : CLIENT_STATUS.DEAD;
      lastExit = { reason: intentional ? 'closed' : 'exit', code, signal, sessionsAtExit };
      if (intentional) return;
      failAllPending(ACP_ERROR.AGENT_GONE, `the ACP agent exited (code ${code}, signal ${signal}); every in-flight request was abandoned`);
      logger.warn(`acp agent exited (code ${code}, signal ${signal}); ${sessionsAtExit} session(s) discarded`);
      try {
        options.onExit?.({ reason: 'exit', code, signal, sessions: sessionsAtExit });
      } catch (err) {
        logger.error(`onExit handler threw: ${err && err.message}`);
      }
    });

    await waitForSpawn(child, timeouts.spawnMs);
    status = CLIENT_STATUS.READY;
    return api;
  }

  function stopChild() {
    if (!link) return;
    const { child } = link;
    link = null;
    try {
      child.stdin?.end();
    } catch { /* already gone */ }
    try {
      child.kill();
    } catch { /* already gone */ }
  }

  /** Close the child for good. Not restartable; use restart() for that. */
  function close() {
    status = CLIENT_STATUS.CLOSED;
    failAllPending(ACP_ERROR.AGENT_GONE, 'the bridge is shutting down');
    sessions.clear();
    stopChild();
  }

  /**
   * Recover from child death (ACP-09): a fresh agent process with an empty
   * session table. Durable state must come from the ledger, never from an
   * assumption that a session survived.
   */
  async function restart() {
    close();
    status = CLIENT_STATUS.IDLE;
    initializeResult = null;
    nextRequestId = 1;
    lastExit = null;
    await start();
    return api;
  }

  /* -------------------------------------------------------------- requests */

  /**
   * Send one ACP request and await its response.
   *
   * `async` on purpose: a caller should be able to `await` every failure the
   * same way. An API that sometimes throws synchronously and sometimes rejects
   * is a footgun, and the not-started check fires exactly when a caller's
   * error handling is most likely to be missing.
   */
  async function request(method, params, opts = {}) {
    requireStarted();
    const id = nextRequestId++;
    const timeoutMs = Number.isFinite(opts.timeoutMs)
      ? opts.timeoutMs
      : (method === 'initialize' ? timeouts.initializeMs : timeouts.requestMs);

    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, timer: null, method };
      if (timeoutMs > 0) {
        entry.timer = setTimeout(() => {
          pending.delete(id);
          reject(new AcpClientError(ACP_ERROR.TIMEOUT, `ACP ${method} timed out after ${timeoutMs}ms`, { method }));
        }, timeoutMs);
        entry.timer.unref?.();
      }
      pending.set(id, entry);
      try {
        writeLine({ jsonrpc: JSONRPC_VERSION, id, method, params });
      } catch (err) {
        pending.delete(id);
        if (entry.timer) clearTimeout(entry.timer);
        reject(err);
      }
    });
  }

  /** Fire-and-forget notification. No reply, no id. */
  function notify(method, params) {
    writeLine({ jsonrpc: JSONRPC_VERSION, method, params });
  }

  /** Send an error response to an agent-initiated request we do not implement. */
  function respondError(id, code, message) {
    if (id === undefined || id === null) return;
    writeLine({ jsonrpc: JSONRPC_VERSION, id, error: { code, message } });
  }

  function failAllPending(code, message) {
    if (pending.size === 0) return;
    const snapshot = [...pending.entries()];
    pending.clear();
    for (const [, entry] of snapshot) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.reject(new AcpClientError(code, message, { method: entry.method }));
    }
  }

  function handleAgentMessage(message) {
    const hasId = Object.prototype.hasOwnProperty.call(message, 'id');
    if (hasId && (message.result !== undefined || message.error !== undefined)) {
      const entry = pending.get(message.id);
      if (!entry) {
        logger.warn(`ACP response for unknown request id ${String(message.id)} ignored`);
        return;
      }
      pending.delete(message.id);
      if (entry.timer) clearTimeout(entry.timer);
      if (message.error) {
        entry.reject(new AcpClientError(
          ACP_ERROR.REQUEST_FAILED,
          `ACP ${entry.method} failed: ${message.error.message ?? 'unknown error'} (code ${message.error.code ?? 'n/a'})`,
          message.error,
        ));
        return;
      }
      entry.resolve(message.result);
      return;
    }

    if (typeof message.method === 'string') {
      if (hasId) {
        // An agent->client request. Milestone 1 implements none of them
        // (no fs, no terminal, no permission prompts), so the honest answer is
        // "not implemented" plus a surfaced alert — never silence, which would
        // hang the agent's prompt forever.
        respondError(message.id, JSONRPC_ERROR.METHOD_NOT_FOUND, `AION relay bridge does not implement "${message.method}"`);
        options.onUnsupportedRequest?.({ method: message.method, id: message.id, params: message.params ?? null });
        return;
      }
      if (message.method === 'session/update') {
        const params = message.params ?? {};
        const session = sessions.get(params.sessionId);
        const prompt = session?.prompt;
        if (prompt) {
          try {
            prompt.onUpdate(params.update ?? null, { sessionId: params.sessionId });
          } catch (err) {
            logger.error(`session/update handler threw: ${err && err.message}`);
          }
          return;
        }
        options.onOrphanUpdate?.({ sessionId: params.sessionId ?? null, update: params.update ?? null });
        return;
      }
      // Any other notification is surfaced, not swallowed: an unknown
      // notification may carry a capability or permission change.
      options.onUnsupportedRequest?.({ method: message.method, id: null, params: message.params ?? null });
      return;
    }

    logger.warn(`ignoring unclassifiable ACP message: ${JSON.stringify(message).slice(0, 120)}`);
  }

  /* --------------------------------------------------------------- ACP ops */

  /**
   * `initialize`. Negotiates the protocol version and fails CLOSED on a
   * mismatch: a v2 agent may reuse a v1 method name with different semantics,
   * and guessing is how a milestone claims a capability it never checked.
   */
  async function initialize(opts = {}) {
    await start();
    const result = await request('initialize', {
      protocolVersion: config.protocolVersion,
      clientCapabilities: {
        // Milestone 1 implements neither: declaring them would invite the
        // agent to ask for file writes this bridge has no business granting.
        fs: { readTextFile: false, writeTextFile: false },
        terminal: false,
      },
    }, { timeoutMs: timeouts.initializeMs });

    const reported = result?.protocolVersion;
    if (reported !== undefined && reported !== config.protocolVersion) {
      throw new AcpClientError(
        ACP_ERROR.PROTOCOL_MISMATCH,
        `agent speaks ACP protocolVersion ${JSON.stringify(reported)}, this bridge speaks ${config.protocolVersion}`,
      );
    }
    initializeResult = result ?? null;
    return initializeResult;
  }

  /** cwd admission — the same allowlist the host enforces, applied again here. */
  function assertCwd(requested) {
    const verdict = assertCwdAllowed(config, requested ?? config.sessionCwd);
    if (!verdict.allowed) {
      throw new AcpClientError(ACP_ERROR.CWD_NOT_ALLOWED, verdict.reason, { code: verdict.code });
    }
    return verdict.cwd;
  }

  async function newSession(opts = {}) {
    await ensureInitialized();
    const cwd = assertCwd(opts.cwd);
    const result = await request('session/new', {
      cwd,
      // Always empty: an MCP server list from the extension would be an
      // extension-granted capability, and the contract forbids that.
      mcpServers: [],
    });
    const sessionId = result?.sessionId;
    if (typeof sessionId !== 'string' || sessionId === '') {
      throw new AcpClientError(ACP_ERROR.REQUEST_FAILED, 'session/new returned no sessionId');
    }
    sessions.set(sessionId, {
      sessionId,
      cwd,
      createdAt: new Date().toISOString(),
      prompt: null,
      cancelling: false,
    });
    return { sessionId, cwd, capabilities: result };
  }

  /**
   * ACP-02: load/resume/fork REQUIRE a cwd matching the session's original
   * directory. A mismatch is refused here — before anything is sent — so a
   * cross-project resume can never reach the agent.
   */
  function assertSessionCwd(sessionId, cwd) {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new AcpClientError(
        ACP_ERROR.UNKNOWN_SESSION,
        `unknown ACP session "${String(sessionId)}": this host created no such session (agent restart invalidates every id)`,
      );
    }
    const wanted = cwdKey(cwd ?? session.cwd);
    if (wanted !== cwdKey(session.cwd)) {
      throw new AcpClientError(
        ACP_ERROR.CWD_MISMATCH,
        `cwd "${String(cwd)}" does not match session "${sessionId}"'s cwd "${session.cwd}"`,
        { sessionCwd: session.cwd, requested: wanted },
      );
    }
    // Defence in depth: the session cwd must still be inside the allowlist.
    const verdict = assertCwdAllowed(config, session.cwd);
    if (!verdict.allowed) {
      throw new AcpClientError(ACP_ERROR.CWD_NOT_ALLOWED, verdict.reason, { code: verdict.code });
    }
    return session;
  }

  async function loadSession(opts = {}) {
    await ensureInitialized();
    assertSessionCwd(opts.sessionId, opts.cwd);
    return request('session/load', { sessionId: opts.sessionId, cwd: opts.cwd, mcpServers: [] });
  }

  async function resumeSession(opts = {}) {
    await ensureInitialized();
    assertSessionCwd(opts.sessionId, opts.cwd);
    return request('session/resume', { sessionId: opts.sessionId, cwd: opts.cwd, mcpServers: [] });
  }

  async function forkSession(opts = {}) {
    await ensureInitialized();
    const session = assertSessionCwd(opts.sessionId, opts.cwd);
    const result = await request('session/fork', { sessionId: opts.sessionId, cwd: opts.cwd, mcpServers: [] });
    const sessionId = result?.sessionId;
    if (typeof sessionId !== 'string' || sessionId === '') {
      throw new AcpClientError(ACP_ERROR.REQUEST_FAILED, 'session/fork returned no sessionId');
    }
    sessions.set(sessionId, {
      sessionId,
      cwd: session.cwd,
      createdAt: new Date().toISOString(),
      prompt: null,
      cancelling: false,
    });
    return { sessionId, cwd: session.cwd };
  }

  async function listSessions(opts = {}) {
    await ensureInitialized();
    const params = {};
    if (typeof opts.cwd === 'string') params.cwd = assertCwd(opts.cwd);
    if (typeof opts.cursor === 'string') params.cursor = opts.cursor;
    return request('session/list', params);
  }

  /**
   * `session/prompt`.
   *
   * ACP-05: one active prompt per session. A second concurrent prompt is
   * REJECTED locally, before a byte is sent, so two relay events cannot be
   * interleaved into one agent turn and produce an untraceable answer.
   */
  async function prompt(opts = {}) {
    await ensureInitialized();
    const session = sessions.get(opts.sessionId);
    if (!session) {
      throw new AcpClientError(ACP_ERROR.UNKNOWN_SESSION, `unknown ACP session "${String(opts.sessionId)}"`);
    }
    if (session.prompt) {
      throw new AcpClientError(
        ACP_ERROR.CONCURRENT_PROMPT,
        `session "${session.sessionId}" already has an active prompt (id ${session.prompt.id}); ` +
          'ACP allows one active prompt per session and interleaving them would destroy traceability',
        { sessionId: session.sessionId, activePromptId: session.prompt.id },
      );
    }
    const text = opts.text;
    if (typeof text !== 'string' || text === '') {
      throw new TypeError('prompt requires non-empty text');
    }

    const entry = {
      id: `${session.sessionId}:${nextRequestId}`,
      correlationId: opts.correlationId ?? null,
      onUpdate: typeof opts.onUpdate === 'function' ? opts.onUpdate : () => {},
      startedAt: new Date().toISOString(),
    };
    session.prompt = entry;
    session.cancelling = false;

    try {
      const result = await request('session/prompt', {
        sessionId: session.sessionId,
        prompt: [{ type: 'text', text }],
      }, { timeoutMs: timeouts.promptMs });
      return {
        sessionId: session.sessionId,
        stopReason: result?.stopReason ?? null,
        raw: result ?? null,
      };
    } finally {
      // Always release the session, including on cancel, crash or timeout, so
      // the "one prompt at a time" guard cannot wedge on an abandoned turn.
      if (session.prompt === entry) session.prompt = null;
    }
  }

  /**
   * `session/cancel` — a NOTIFICATION. The agent answers the in-flight
   * `session/prompt` with `stopReason: "cancelled"`; that prompt result, not
   * this call, is what proves the cancellation (ACP-06).
   */
  function cancel(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new AcpClientError(ACP_ERROR.UNKNOWN_SESSION, `unknown ACP session "${String(sessionId)}"`);
    }
    if (!session.prompt) {
      throw new AcpClientError(ACP_ERROR.NOT_PROMPTED, `session "${session.sessionId}" has no active prompt to cancel`);
    }
    session.cancelling = true;
    notify('session/cancel', { sessionId: session.sessionId });
    return { accepted: true, sessionId: session.sessionId };
  }

  async function ensureInitialized() {
    await start();
    if (!initializeResult) await initialize();
  }

  const api = {
    start,
    close,
    restart,
    initialize,
    newSession,
    loadSession,
    resumeSession,
    forkSession,
    listSessions,
    prompt,
    cancel,
    request,
    notify,
    status: () => status,
    lastExit: () => lastExit,
    agentInfo: () => initializeResult,
    sessionCount: () => sessions.size,
    sessionIds: () => [...sessions.keys()],
    hasActivePrompt: (sessionId) => Boolean(sessions.get(sessionId)?.prompt),
    pendingRequestCount: () => pending.size,
    assertCwd,
  };

  return api;
}

/* ---------------------------------------------------------------- internals */

function waitForSpawn(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (child.pid !== undefined) {
      resolve();
      return;
    }
    let settled = false;
    const timer = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => {
        if (settled) return;
        settled = true;
        try { child.kill(); } catch { /* ignore */ }
        reject(new AcpClientError(ACP_ERROR.SPAWN_TIMEOUT, `the ACP agent did not start within ${timeoutMs}ms`));
      }, timeoutMs)
      : null;
    timer?.unref?.();

    child.once('spawn', () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve();
    });
    child.once('error', (err) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      reject(new AcpClientError(ACP_ERROR.SPAWN_FAILED, `failed to start the ACP agent: ${err && err.message}`));
    });
  });
}

function stringify(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}