// AION Relay Bridge — envelope <-> ACP mapping.
//
// THIS FILE IS THE SEAM BETWEEN THE THREE FORMATS, so it is also the file where
// they must be kept apart (BRIDGE-DESIGN.md section 1, dossier line 17):
//
//   * Chrome native framing (4-byte LE length + UTF-8 JSON) lives in framing.js.
//   * ACP JSON-RPC lives in acp-client.js / framing.js.
//   * The 19-field AION relay envelope lives in ../../extension/src/lib.
//
// An ACP JSON-RPC message is NOT a relay envelope. Nothing here forwards one as
// the other: every translation is an explicit, named, total function, and an
// unmapped method or event type produces a clear error instead of a guessed
// envelope. The relay library is IMPORTED, never reimplemented — envelope
// construction, validation, the state machines and the event store all come
// from extension/src/lib so the bridge cannot drift from the extension's schema.
//
// Two directions, both documented inline:
//   relay -> ACP : envelopeToRequest()   (what the extension asked for)
//   ACP  -> relay: messageToEnvelopes() (what the agent said)

import {
  SCHEMA_VERSION,
  TASK_STATES,
  createEnvelope,
  validateEnvelope,
} from '../../extension/src/lib/index.js';

export const MAP_ERROR = Object.freeze({
  UNMAPPED_ENVELOPE_EVENT: 'unmapped_envelope_event',
  UNMAPPED_ACP_METHOD: 'unmapped_acp_method',
  INVALID_ENVELOPE: 'invalid_envelope',
  INVALID_ACP_MESSAGE: 'invalid_acp_message',
  MISSING_PAYLOAD_FIELD: 'missing_payload_field',
});

export class EnvelopeMapError extends Error {
  constructor(code, message, detail = {}) {
    super(message);
    this.name = 'EnvelopeMapError';
    this.code = code;
    Object.assign(this, detail);
  }
}

/** Text copied out of agent output is bounded: progress is not an archive. */
export const MAX_TEXT_CHARS = 8000;
export const MAX_PLAN_ENTRIES = 50;
export const MAX_COMMAND_ENTRIES = 100;
export const MAX_PROMPT_CHARS = 32000;

/**
 * Relay event types that translate into an ACP request in Milestone 1.
 *
 * Deliberately short. `task.proposed` is NOT here: proposing a task is not an
 * ACP operation, and mapping it would mean the bridge can start work before
 * anything approved it. `task.approved` is the earliest dispatchable event
 * because the contract puts approval before dispatch.
 */
export const ENVELOPE_TO_ACP = Object.freeze({
  'task.approved': Object.freeze({ method: 'session/prompt', requires: ['text'] }),
  'task.cancelled': Object.freeze({ method: 'session/cancel', requires: [] }),
});

/** Every event type the relay->ACP direction understands. */
export const DISPATCHABLE_EVENT_TYPES = Object.freeze(Object.keys(ENVELOPE_TO_ACP));

/**
 * ACP request methods this bridge will issue, and the mapper for each result.
 *
 * This table IS the authority: `messageToEnvelopes` looks a method up HERE and
 * throws for anything absent, which is what makes "no guessed envelope" a
 * property of the code rather than a promise in a comment.
 */
const RESULT_MAPPERS = Object.freeze({
  initialize: mapInitializeResult,
  'session/new': mapSessionNewResult,
  'session/load': mapSessionRestoreResult,
  'session/resume': mapSessionRestoreResult,
  'session/fork': mapSessionRestoreResult,
  'session/list': mapSessionListResult,
  'session/prompt': mapPromptResult,
  'session/cancel': mapCancelResult,
});

/** Every ACP method with a relay-envelope translation. */
export const ACP_KNOWN_METHODS = Object.freeze(Object.keys(RESULT_MAPPERS));

/**
 * ACP `session/update` kinds recognised in Milestone 1.
 *
 * An unrecognised kind is reported as `unrecognised`, never copied verbatim:
 * agent output is untrusted input at this boundary.
 */
export const ACP_SESSION_UPDATES = Object.freeze([
  'user_message_chunk',
  'agent_message_chunk',
  'agent_thought_chunk',
  'tool_call',
  'tool_call_update',
  'plan',
  'available_commands_update',
  'current_mode_update',
]);

/**
 * ACP stop reason -> relay event + task state.
 *
 * `end_turn` maps to `task.progress` with task_state RUNNING and NEVER to
 * `proof.submitted`. The contract is explicit: "executor completion never
 * implies independently verified proof", and an ACP turn ending is an executor
 * statement, not evidence. PROOF_SUBMITTED is therefore unreachable from ACP in
 * Milestone 1 — by design, not by oversight.
 */
export const STOP_REASON_EVENTS = Object.freeze({
  end_turn: Object.freeze({ event_type: 'task.progress', task_state: 'RUNNING' }),
  cancelled: Object.freeze({ event_type: 'task.cancelled', task_state: 'CANCELLED' }),
  max_tokens: Object.freeze({ event_type: 'task.blocked', task_state: 'BLOCKED' }),
  max_turn_requests: Object.freeze({ event_type: 'task.blocked', task_state: 'BLOCKED' }),
  refusal: Object.freeze({ event_type: 'task.blocked', task_state: 'BLOCKED' }),
  error: Object.freeze({ event_type: 'task.blocked', task_state: 'BLOCKED' }),
});

/** Stop reasons this bridge recognises; anything else fails closed to BLOCKED. */
export const ACP_STOP_REASONS = Object.freeze(Object.keys(STOP_REASON_EVENTS));

/**
 * Events that describe the transport, not a task.
 *
 * The schema requires a `task_state` on every envelope including health beats,
 * and there is no NEUTRAL value in the contract's state machine. These carry the
 * machine's initial state plus `payload.taxonomy: 'non-task'` so no consumer can
 * read a health beat as "a task is proposed".
 */
export const NON_TASK_EVENTS = Object.freeze([
  'relay.hello', 'relay.capabilities', 'relay.health', 'operator.alert',
]);

/* ================================================== direction 1: relay -> ACP */

/**
 * Extract a cwd the extension asked for, or null.
 *
 * Returned for the host's allowlist check ONLY. The value is never handed to
 * ACP directly: an extension that could pick its own cwd would be handing any
 * web page a write path (BRIDGE-DESIGN.md section 6).
 */
export function extractRequestedCwd(env) {
  const payload = env && typeof env === 'object' ? env.payload : null;
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.cwd !== 'string' || payload.cwd === '') return null;
  return payload.cwd;
}

/**
 * Translate one relay envelope into the ACP request it authorises.
 *
 * @param {object} env   a validated relay envelope
 * @param {{ sessionId?: string, resolveSessionId?: () => string }} ctx
 * @returns {{ method: string, params: object, event_type: string, correlation_id: string|null }}
 * @throws {EnvelopeMapError} on an unmapped event type or a missing field
 */
export function envelopeToRequest(env, ctx = {}) {
  const check = validateEnvelope(env);
  if (!check.valid) {
    throw new EnvelopeMapError(
      MAP_ERROR.INVALID_ENVELOPE,
      `refusing to dispatch an invalid envelope: ${check.errors.join('; ')}`,
      { errors: check.errors },
    );
  }

  const mapping = ENVELOPE_TO_ACP[env.event_type];
  if (!mapping) {
    throw new EnvelopeMapError(
      MAP_ERROR.UNMAPPED_ENVELOPE_EVENT,
      `relay event "${env.event_type}" has no ACP translation in Milestone 1; ` +
        `dispatchable events are: ${DISPATCHABLE_EVENT_TYPES.join(', ')}`,
      { event_type: env.event_type, dispatchable: DISPATCHABLE_EVENT_TYPES },
    );
  }

  const payload = env.payload && typeof env.payload === 'object' ? env.payload : {};
  const sessionId = pickSessionId(env, payload, ctx);

  if (mapping.method === 'session/prompt') {
    for (const field of mapping.requires) {
      if (typeof payload[field] !== 'string' || payload[field] === '') {
        throw new EnvelopeMapError(
          MAP_ERROR.MISSING_PAYLOAD_FIELD,
          `${env.event_type} requires payload.${field} to be a non-empty string`,
          { field },
        );
      }
    }
    if (payload.text.length > MAX_PROMPT_CHARS) {
      throw new EnvelopeMapError(
        MAP_ERROR.MISSING_PAYLOAD_FIELD,
        `payload.text is ${payload.text.length} chars, over the ${MAX_PROMPT_CHARS} char dispatch limit`,
      );
    }
    if (!sessionId) {
      throw new EnvelopeMapError(
        MAP_ERROR.MISSING_PAYLOAD_FIELD,
        'session/prompt needs a session: payload.session_id or a ctx.resolveSessionId()',
        { field: 'session_id' },
      );
    }
    return {
      method: 'session/prompt',
      params: { sessionId, prompt: [{ type: 'text', text: payload.text }] },
      event_type: env.event_type,
      correlation_id: env.correlation_id,
    };
  }

  if (mapping.method === 'session/cancel') {
    if (!sessionId) {
      throw new EnvelopeMapError(
        MAP_ERROR.MISSING_PAYLOAD_FIELD,
        'session/cancel needs a session: payload.session_id or a ctx.resolveSessionId()',
        { field: 'session_id' },
      );
    }
    return {
      method: 'session/cancel',
      params: { sessionId },
      event_type: env.event_type,
      correlation_id: env.correlation_id,
    };
  }

  /* istanbul ignore next -- ENVELOPE_TO_ACP holds no other method */
  throw new EnvelopeMapError(
    MAP_ERROR.UNMAPPED_ENVELOPE_EVENT,
    `relay event "${env.event_type}" maps to unsupported method "${mapping.method}"`,
  );
}

/* ================================================== direction 2: ACP -> relay */

/**
 * Translate one ACP message into relay envelope(s).
 *
 * @param {object} message   a JSON-RPC message (response, error response,
 *                           notification or agent->client request)
 * @param {object} ctx
 * @param {string} ctx.acpMethod        the method this message answers
 * @param {string} [ctx.correlationId]  relay correlation to carry forward
 * @param {string} [ctx.causationId]    message_id of the dispatch that caused it
 * @param {string} [ctx.sessionId]      ACP session id
 * @param {string} [ctx.sessionCwd]     cwd the session was pinned to
 * @param {string} [ctx.targetNode]
 * @param {string} [ctx.targetRole]
 * @param {string} [ctx.nodeId]         producer_node for emitted envelopes
 * @param {number} [ctx.sequence]
 * @param {() => number} [ctx.nextSequence]
 * @returns {object[]} relay envelopes
 * @throws {EnvelopeMapError} when the method or message has no translation
 */
export function messageToEnvelopes(message, ctx = {}) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new EnvelopeMapError(MAP_ERROR.INVALID_ACP_MESSAGE, 'expected a JSON-RPC object');
  }

  if (typeof message.method === 'string') {
    if (message.method === 'session/update') return [mapSessionUpdate(message, ctx)];
    // Agent->client request or an unknown notification: surfaced, never guessed.
    return [unsupportedRequestAlert(message, ctx)];
  }

  const method = ctx.acpMethod;
  if (typeof method !== 'string' || method === '') {
    throw new EnvelopeMapError(
      MAP_ERROR.UNMAPPED_ACP_METHOD,
      'cannot map an ACP response without knowing which method it answers; ' +
        'pass ctx.acpMethod (a guess here is how a relay envelope gets mistaken for an ACP reply)',
      { known: ACP_KNOWN_METHODS },
    );
  }
  const mapper = RESULT_MAPPERS[method];
  if (!mapper) {
    throw new EnvelopeMapError(
      MAP_ERROR.UNMAPPED_ACP_METHOD,
      `ACP method "${method}" has no relay-envelope translation in Milestone 1; ` +
        `known methods are: ${ACP_KNOWN_METHODS.join(', ')}`,
      { method, known: ACP_KNOWN_METHODS },
    );
  }

  if (message.error !== undefined && message.error !== null) {
    return [errorEnvelope(message, ctx, method)];
  }
  return [mapper(message.result ?? {}, ctx, method)];
}

/* ----------------------------------------------------------------- mappers */

function mapInitializeResult(result, ctx) {
  const capabilities = result && typeof result === 'object' ? result : {};
  return finalize(createEnvelope({
    event_type: 'relay.capabilities',
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      taxonomy: 'non-task',
      stage: 'initialize',
      protocol_version: capabilities.protocolVersion ?? null,
      agent_name: capabilities.agentInfo?.name ?? null,
      agent_version: capabilities.agentInfo?.version ?? null,
      agent_capabilities: boundedBoolMap(capabilities.agentCapabilities),
      mcp_capabilities: boundedBoolMap(capabilities.mcpCapabilities),
      prompt_capabilities: boundedBoolMap(capabilities.promptCapabilities),
      // Auth METHOD ids are not credentials (dossier: never collect or relay
      // actual credentials); the ids are enough to know a login is required.
      auth_methods: Array.isArray(capabilities.authMethods)
        ? capabilities.authMethods.map((entry) => (typeof entry?.id === 'string' ? entry.id : null)).filter(Boolean)
        : [],
      session_capabilities: Array.isArray(capabilities.sessionCapabilities)
        ? capabilities.sessionCapabilities.filter((v) => typeof v === 'string')
        : [],
    },
    delivery_state: 'SENT',
    task_state: 'PROPOSED',
  }), ctx, 'relay.capabilities');
}

function mapSessionNewResult(result, ctx) {
  return finalize(createEnvelope({
    event_type: 'relay.health',
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      taxonomy: 'non-task',
      stage: 'session.created',
      acp_session_id: stringOrNull(result?.sessionId),
      // The cwd is reported, never trusted from the caller: it is the host's
      // own configured root, and showing it lets an operator audit the pin.
      session_cwd: stringOrNull(ctx.sessionCwd),
    },
    delivery_state: 'SENT',
    task_state: 'PROPOSED',
  }), ctx, 'relay.health');
}

function mapSessionRestoreResult(result, ctx, method) {
  return finalize(createEnvelope({
    event_type: 'relay.health',
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      taxonomy: 'non-task',
      stage: 'session.restored',
      method,
      acp_session_id: stringOrNull(result?.sessionId) ?? stringOrNull(ctx.sessionId),
      session_cwd: stringOrNull(ctx.sessionCwd),
    },
    delivery_state: 'SENT',
    task_state: 'PROPOSED',
  }), ctx, 'relay.health');
}

function mapSessionListResult(result, ctx) {
  const sessions = Array.isArray(result?.sessions) ? result.sessions : [];
  return finalize(createEnvelope({
    event_type: 'relay.health',
    producer_node: ctx.nodeId,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      taxonomy: 'non-task',
      stage: 'session.listed',
      count: sessions.length,
      // Ids and paths only. A session list is a directory of other people's
      // projects; the minimum that lets an operator reconcile is enough.
      sessions: sessions.slice(0, MAX_COMMAND_ENTRIES).map((entry) => ({
        session_id: stringOrNull(entry?.sessionId),
        cwd: stringOrNull(entry?.cwd),
      })),
      has_more: result?.hasMore === true || typeof result?.nextCursor === 'string',
    },
    delivery_state: 'SENT',
    task_state: 'PROPOSED',
  }), ctx, 'relay.health');
}

/**
 * The prompt result. The stop reason is the load-bearing field (ACP-03), and
 * the task state is derived from it through STOP_REASON_EVENTS.
 */
function mapPromptResult(result, ctx) {
  const raw = result && typeof result === 'object' ? result : {};
  const stopReason = typeof raw.stopReason === 'string' ? raw.stopReason : 'unknown';
  const mapping = STOP_REASON_EVENTS[stopReason] ?? STOP_REASON_EVENTS.error;
  return finalize(createEnvelope({
    event_type: mapping.event_type,
    task_state: mapping.task_state,
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      stage: 'prompt.finished',
      acp_session_id: stringOrNull(ctx.sessionId),
      stop_reason: stopReason,
      // Unknown stop reasons fail closed to BLOCKED; flagging it keeps the
      // "we did not understand this" visible instead of hiding it in a guess.
      recognised_stop_reason: Object.prototype.hasOwnProperty.call(STOP_REASON_EVENTS, stopReason),
      cancelled_by_host: ctx.cancelled === true,
    },
    delivery_state: 'SENT',
    task_state: mapping.task_state,
  }), ctx, mapping.event_type);
}

function mapCancelResult(_result, ctx) {
  return finalize(createEnvelope({
    event_type: 'task.cancelled',
    task_state: 'CANCELLED',
    producer_node: ctx.nodeId,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      stage: 'prompt.cancel_requested',
      acp_session_id: stringOrNull(ctx.sessionId),
      // A cancel request is NOT a cancellation. The cancelled stop reason from
      // the prompt result is what actually proves it (ACP-06).
      cancellation_confirmed: false,
    },
    delivery_state: 'SENT',
    task_state: 'CANCELLED',
  }), ctx, 'task.cancelled');
}

/** `session/update` -> one `task.progress` envelope. */
function mapSessionUpdate(message, ctx) {
  const params = message.params && typeof message.params === 'object' ? message.params : {};
  const projection = projectAcpUpdate(params.update ?? null);
  return finalize(createEnvelope({
    event_type: 'task.progress',
    task_state: 'RUNNING',
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    // Causality: this progress is caused by the dispatch that started the turn.
    causation_id: ctx.causationId ?? null,
    payload: {
      stage: 'prompt.update',
      acp_session_id: stringOrNull(params.sessionId) ?? stringOrNull(ctx.sessionId),
      ...projection,
    },
    delivery_state: 'SENT',
    task_state: 'RUNNING',
  }), ctx, 'task.progress');
}

/** A JSON-RPC error response -> `task.blocked`, with the error detail retained. */
function errorEnvelope(message, ctx, method) {
  const error = message.error && typeof message.error === 'object' ? message.error : {};
  return finalize(createEnvelope({
    event_type: 'task.blocked',
    task_state: 'BLOCKED',
    producer_node: ctx.nodeId,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      stage: 'acp.error',
      method,
      acp_error_code: Number.isInteger(error.code) ? error.code : null,
      // The message is agent text and is bounded + secret-stripped like any
      // other agent output: an error string can echo a request header.
      acp_error_message: boundText(dropSecretFields(error.message)).text,
      blocked_from: stringOrNull(ctx.blockedFrom ?? ctx.taskState),
    },
    delivery_state: 'SENT',
    task_state: 'BLOCKED',
  }), ctx, 'task.blocked');
}

/** An ACP request/notification the bridge does not implement -> `operator.alert`. */
function unsupportedRequestAlert(message, ctx) {
  return finalize(createEnvelope({
    event_type: 'operator.alert',
    task_state: 'PROPOSED',
    producer_node: ctx.nodeId,
    target_node: ctx.targetNode ?? null,
    target_role: ctx.targetRole ?? null,
    correlation_id: ctx.correlationId ?? null,
    causation_id: ctx.causationId ?? null,
    payload: {
      taxonomy: 'non-task',
      stage: 'acp.unsupported',
      alert: 'acp_message_not_implemented',
      method: typeof message.method === 'string' ? message.method : null,
      detail: 'this bridge implements no agent->client requests; the agent was answered with method_not_found',
    },
    delivery_state: 'SENT',
    task_state: 'PROPOSED',
  }), ctx, 'operator.alert');
}

/* ------------------------------------------------- ACP update projection */

/**
 * Project one ACP `session/update` body onto an allowlisted, bounded payload.
 *
 * Allowlist, not blacklist: `tool_call.rawInput` and `content` blocks can carry
 * arbitrary file contents and anything else the model felt like typing, and the
 * contract requires data minimisation plus "never relay actual credentials".
 * Dropping unknown keys is what makes a credential-shaped field structurally
 * unable to reach an envelope (ACP-11).
 */
export function projectAcpUpdate(update) {
  const source = update && typeof update === 'object' ? update : {};
  const kind = typeof source.sessionUpdate === 'string' ? source.sessionUpdate : 'unrecognised';

  if (!ACP_SESSION_UPDATES.includes(kind)) {
    return { kind: 'unrecognised', observed_session_update: boundText(String(kind)).text, unrecognised: true };
  }

  switch (kind) {
    case 'user_message_chunk':
    case 'agent_message_chunk':
    case 'agent_thought_chunk': {
      const text = boundText(source.content?.text);
      return {
        kind,
        text: text.text,
        truncated: text.truncated,
        // Agent reasoning is UI metadata, not a result: named so the panel can
        // hide it and cannot promote it to "the agent concluded".
        reasoning_only: kind === 'agent_thought_chunk',
      };
    }
    case 'tool_call':
    case 'tool_call_update': {
      return {
        kind,
        tool_call_id: stringOrNull(source.toolCallId),
        title: boundText(source.title).text,
        status: stringOrNull(source.status),
        tool_kind: stringOrNull(source.kind),
        // rawInput / content are deliberately absent. See the doc comment.
        redacted_fields: ['rawInput', 'content'].filter((field) => field in source),
      };
    }
    case 'plan': {
      const entries = Array.isArray(source.entries) ? source.entries.slice(0, MAX_PLAN_ENTRIES) : [];
      return {
        kind,
        entries: entries.map((entry) => ({
          content: boundText(entry?.content).text,
          status: stringOrNull(entry?.status),
          priority: Number.isFinite(entry?.priority) ? entry.priority : null,
        })),
        entry_count: Array.isArray(source.entries) ? source.entries.length : 0,
        truncated_entries: Math.max(0, (Array.isArray(source.entries) ? source.entries.length : 0) - entries.length),
      };
    }
    case 'available_commands_update': {
      const commands = Array.isArray(source.availableCommands) ? source.availableCommands.slice(0, MAX_COMMAND_ENTRIES) : [];
      return {
        kind,
        commands: commands.map((entry) => ({
          name: boundText(entry?.name).text,
          description: boundText(entry?.description).text,
        })),
        command_count: Array.isArray(source.availableCommands) ? source.availableCommands.length : 0,
        // Slash commands are the closest thing to "let the page drive the
        // agent", so the count is reported even when the list is dropped.
        accepted: false,
      };
    }
    case 'current_mode_update':
      return { kind, mode_id: stringOrNull(source.currentModeId) };
    /* istanbul ignore next -- every ACP_SESSION_UPDATES entry is handled */
    default:
      return { kind: 'unrecognised', observed_session_update: kind, unrecognised: true };
  }
}

/**
 * Direction 2, reversed: reconstruct the ACP update shape from a
 * `task.progress` envelope this mapper produced.
 *
 * Used for replaying known progress into a freshly restarted agent's UI (ACP-09
 * recovery) and for round-trip verification. It is NOT a client->agent prompt:
 * ACP has no method for a client to push progress at an agent, and this must
 * never be used as one.
 */
export function acpUpdateFromEnvelope(env) {
  const check = validateEnvelope(env);
  if (!check.valid || env.event_type !== 'task.progress') {
    throw new EnvelopeMapError(
      MAP_ERROR.INVALID_ENVELOPE,
      'acpUpdateFromEnvelope requires a valid task.progress envelope',
      { errors: check.errors ?? [] },
    );
  }
  const payload = env.payload ?? {};
  if (typeof payload.kind !== 'string') {
    throw new EnvelopeMapError(MAP_ERROR.MISSING_PAYLOAD_FIELD, 'task.progress payload.kind is required');
  }
  if (payload.kind === 'unrecognised') {
    return { sessionUpdate: null, unrecognised: true, observed: payload.observed_session_update ?? null };
  }
  if (payload.kind.endsWith('_chunk')) {
    return { sessionUpdate: payload.kind, content: { type: 'text', text: payload.text ?? '' } };
  }
  if (payload.kind === 'tool_call' || payload.kind === 'tool_call_update') {
    return {
      sessionUpdate: payload.kind,
      toolCallId: payload.tool_call_id ?? null,
      title: payload.title ?? '',
      status: payload.status ?? null,
    };
  }
  if (payload.kind === 'plan') {
    return {
      sessionUpdate: 'plan',
      entries: Array.isArray(payload.entries)
        ? payload.entries.map((entry) => ({ content: entry.content ?? '', status: entry.status ?? null, priority: entry.priority ?? null }))
        : [],
    };
  }
  if (payload.kind === 'available_commands_update') {
    return {
      sessionUpdate: 'available_commands_update',
      // Commands are never re-offered: the bridge advertises none, so a
      // reconstructed list is dropped rather than hinted at.
      availableCommands: [],
      dropped_command_count: payload.command_count ?? 0,
    };
  }
  if (payload.kind === 'current_mode_update') {
    return { sessionUpdate: 'current_mode_update', currentModeId: payload.mode_id ?? null };
  }
  throw new EnvelopeMapError(
    MAP_ERROR.MISSING_PAYLOAD_FIELD,
    `no ACP update reconstruction for kind "${payload.kind}"`,
    { kind: payload.kind },
  );
}

/* ------------------------------------------------------- secrets and bounds */

/**
 * Key names whose values are credentials.
 *
 * Deliberately NOT bare `key`, `auth` or `token`-in-the-middle: this relay has
 * legitimate non-secret fields like `idempotency_key` and `payload_hash`, and a
 * redactor that eats those destroys dedupe and evidence while protecting
 * nothing.
 */
export const SECRET_KEY_PATTERN = /(passwd|password|passphrase|secret|api[_-]?key|access[_-]?key|private[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|bearer|authorization|credential|cookie)/i;

export const REDACTED = '[redacted]';

/** Value shapes that are a credential wherever they appear, key name aside. */
const SECRET_VALUE_PATTERNS = Object.freeze([
  /Bearer\s+[A-Za-z0-9._~+/-]{8,}=*/gi,
  /\bsk-(?:ant-)?[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g,
]);

/**
 * Replace secret-shaped substrings in a string.
 *
 * A log line and an envelope are the two places a credential can leak, and both
 * call this. Keep it dependency-free and idempotent.
 */
export function scrubString(input) {
  if (typeof input !== 'string' || input === '') return input;
  let out = input;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, pattern.flags), REDACTED);
  }
  return out;
}

/**
 * Copy `value`, dropping credential-shaped keys and scrubbing the rest.
 *
 * @returns {{ value: any, dropped: string[] }} names only — a dropped key's
 *   NAME is evidence, its value is not.
 */
export function dropSecretFields(value) {
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((entry) => dropSecretFields(entry));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  const dropped = [];
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      dropped.push(key);
      continue;
    }
    out[key] = dropSecretFields(entry);
  }
  if (dropped.length > 0) Object.defineProperty(out, '__dropped_secret_fields', { value: dropped, enumerable: false });
  return out;
}

/** Keys dropped by the last `dropSecretFields` call on `value`, if any. */
export function droppedSecretFields(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value.__dropped_secret_fields) ? value.__dropped_secret_fields : [];
}

/* ---------------------------------------------------------------- internals */

function finalize(env, ctx, expectedEventType) {
  const check = validateEnvelope(env);
  if (!check.valid) {
    throw new EnvelopeMapError(
      MAP_ERROR.INVALID_ENVELOPE,
      `mapping produced an invalid ${expectedEventType} envelope: ${check.errors.join('; ')}`,
      { errors: check.errors },
    );
  }
  env.sequence = nextSequence(ctx);
  return env;
}

function nextSequence(ctx) {
  if (typeof ctx.nextSequence === 'function') {
    const value = ctx.nextSequence();
    return Number.isInteger(value) && value >= 0 ? value : 0;
  }
  return Number.isInteger(ctx.sequence) && ctx.sequence >= 0 ? ctx.sequence : 0;
}

function pickSessionId(env, payload, ctx) {
  if (typeof payload.session_id === 'string' && payload.session_id !== '') return payload.session_id;
  if (typeof payload.acp_session_id === 'string' && payload.acp_session_id !== '') return payload.acp_session_id;
  if (typeof ctx.sessionId === 'string' && ctx.sessionId !== '') return ctx.sessionId;
  if (typeof ctx.resolveSessionId === 'function') {
    const resolved = ctx.resolveSessionId();
    if (typeof resolved === 'string' && resolved !== '') return resolved;
  }
  return null;
}

function boundText(value) {
  if (typeof value !== 'string') return { text: '', truncated: false };
  const scrubbed = scrubString(value);
  if (scrubbed.length <= MAX_TEXT_CHARS) return { text: scrubbed, truncated: false };
  return { text: scrubbed.slice(0, MAX_TEXT_CHARS), truncated: true };
}

function boundedBoolMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'boolean') out[key] = entry;
    else if (typeof entry === 'string' || typeof entry === 'number') out[key] = entry;
    else if (Array.isArray(entry)) out[key] = entry.length;
  }
  return out;
}

function stringOrNull(value) {
  return typeof value === 'string' && value !== '' ? value : null;
}

export { SCHEMA_VERSION, TASK_STATES };