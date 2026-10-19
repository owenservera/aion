// AION Bus — versioned contracts (Bus V1 commander loop, Bus V2 local executors).
//
// Binding design: workspace/aion/ops/chrome-relay/BUS-V1-V2-DESIGN.md and
// ENVELOPE-CONTRACT.md "v0.2 additions". Authority: canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md.
//
// PROVIDER-NEUTRAL BY CONSTRUCTION. Nothing in this directory except
// `adapters/chatgpt.js` knows that chatgpt.com exists. The core speaks of
// "conversation" agents (any browser-chat provider) and "executor" agents (any
// local tool), each bound through a named adapter.
//
// Pure module: no host API, no DOM, no Node built-ins, so the service worker,
// the native bridge, the MCP server and Node tests all import the same code.

/* ------------------------------------------------------------------ schemas */

export const BUS_STATE_KEY = 'aion.relay.bus.v1';
export const BUS_SCHEMA = 'aion.bus/1';
export const BUS_STATE_VERSION = 1;
export const COMMAND_BLOCK = 'AION_CMD_V1';
export const REPORT_HEADER = 'AION_REPORT_V1';
export const AGENT_SCHEMA = 'aion.agent/1';
export const ADAPTER_MANIFEST_SCHEMA = 'aion.bus.adapter/1';

/* ---------------------------------------------------------------- vocabulary */

/** Agent kinds. `owner` is the genealogy root (a human, never commandable). */
export const AGENT_KIND = Object.freeze({ OWNER: 'owner', CONVERSATION: 'conversation', EXECUTOR: 'executor' });
export const AGENT_STATUS = Object.freeze({ UNBOUND: 'unbound', BOUND: 'bound', PAUSED: 'paused', RETIRED: 'retired' });

/** Every op the grammar can name. Which are ENABLED is configuration (C4). */
export const OPS = Object.freeze(['send', 'status', 'cancel']);
export const DEFAULT_OPS_ENABLED = Object.freeze(['send', 'status']);

/** Where a command or report came from (ENVELOPE-CONTRACT v0.2 `origin_kind`). */
export const ORIGIN = Object.freeze({
  OWNER_PHONE: 'owner_phone',
  COMMANDER_REPLY: 'commander_reply',
  AGENT_REPORT: 'agent_report',
  EXECUTOR_REPORT: 'executor_report',
  MCP_INGRESS: 'mcp_ingress',
  OPERATOR_CLI: 'operator_cli',
});

/**
 * Command state machine, verbatim from ENVELOPE-CONTRACT v0.2, plus UNRESOLVED
 * (BUS-V1-V2-DESIGN §1.5) for "something was attempted and the outcome is not
 * known". No transition below ever re-sends.
 */
export const COMMAND_STATE = Object.freeze({
  OBSERVED: 'OBSERVED',
  VALIDATED: 'VALIDATED',
  RESERVED: 'RESERVED',
  DISPATCHED: 'DISPATCHED',
  SUBMISSION_OBSERVED: 'SUBMISSION_OBSERVED',
  REPLY_CHECKED: 'REPLY_CHECKED',
  REPORTED: 'REPORTED',
  REJECTED: 'REJECTED',
  HALTED: 'HALTED',
  UNRESOLVED: 'UNRESOLVED',
});

/**
 * Delivery state (the brief's vocabulary), derived from — never stored apart
 * from — the command state, so the two cannot disagree.
 *   PREPARED        reserved durably, nothing attempted yet
 *   SENT_OBSERVED   the target confirmed it received the text; no reply yet
 *   REPLY_OBSERVED  a correlated reply was checked
 *   CONSUMED        the reply was reported back (terminal success)
 *   OUTCOME_UNKNOWN attempted; whether it landed is not known. NEVER resent.
 *   NOT_SENT        refused or halted before any attempt (positive no-send)
 */
export const DELIVERY = Object.freeze({
  PREPARED: 'PREPARED',
  SENT_OBSERVED: 'SENT_OBSERVED',
  REPLY_OBSERVED: 'REPLY_OBSERVED',
  CONSUMED: 'CONSUMED',
  OUTCOME_UNKNOWN: 'OUTCOME_UNKNOWN',
  NOT_SENT: 'NOT_SENT',
});

export const TRANSITIONS = Object.freeze({
  OBSERVED: ['VALIDATED', 'REJECTED', 'HALTED'],
  VALIDATED: ['RESERVED', 'REJECTED', 'HALTED'],
  RESERVED: ['DISPATCHED', 'HALTED'],
  // DISPATCHED -> REJECTED is a POSITIVE no-send from the adapter only.
  // ... -> HALTED from an attempted state ONLY by explicit owner disposal.
  DISPATCHED: ['SUBMISSION_OBSERVED', 'REPLY_CHECKED', 'UNRESOLVED', 'REJECTED', 'HALTED'],
  SUBMISSION_OBSERVED: ['REPLY_CHECKED', 'UNRESOLVED', 'HALTED'],
  // UNRESOLVED -> REJECTED only on a LATER positive no-send from the target.
  UNRESOLVED: ['SUBMISSION_OBSERVED', 'REPLY_CHECKED', 'REJECTED', 'HALTED'],
  // REPLY_CHECKED -> HALTED when the report back is blocked (hop limit, kill,
  // grant). The reply stays recorded; only the report is withheld.
  REPLY_CHECKED: ['REPORTED', 'HALTED'],
  REPORTED: [],
  REJECTED: [],
  HALTED: [],
});

export const TERMINAL_STATES = Object.freeze(['REPORTED', 'REJECTED', 'HALTED']);
/** States in which an attempt may have reached the target. */
export const ATTEMPTED_STATES = Object.freeze(['DISPATCHED', 'SUBMISSION_OBSERVED', 'UNRESOLVED', 'REPLY_CHECKED', 'REPORTED']);

export function deliveryState(command) {
  switch (command.state) {
    case 'OBSERVED': case 'VALIDATED': case 'RESERVED': return DELIVERY.PREPARED;
    case 'DISPATCHED': case 'UNRESOLVED': return DELIVERY.OUTCOME_UNKNOWN;
    case 'SUBMISSION_OBSERVED': return DELIVERY.SENT_OBSERVED;
    case 'REPLY_CHECKED': return DELIVERY.REPLY_OBSERVED;
    case 'REPORTED': return DELIVERY.CONSUMED;
    case 'REJECTED': return command.attempted ? DELIVERY.OUTCOME_UNKNOWN : DELIVERY.NOT_SENT;
    case 'HALTED': return command.reply ? DELIVERY.REPLY_OBSERVED : command.attempted ? DELIVERY.OUTCOME_UNKNOWN : DELIVERY.NOT_SENT;
    default: return DELIVERY.OUTCOME_UNKNOWN;
  }
}

/**
 * Closed failure vocabulary. A verifier switches on the code; `detail` is prose.
 * A new rejection path cannot appear without being declared here (tests assert it).
 */
export const REASON = Object.freeze({
  // grammar (C2)
  NO_BLOCK: 'no_command_block',
  MULTIPLE_BLOCKS: 'multiple_command_blocks',
  UNTERMINATED_BLOCK: 'unterminated_command_block',
  BLOCK_TOO_LARGE: 'command_block_too_large',
  MALFORMED_LINE: 'malformed_line',
  UNKNOWN_KEY: 'unknown_key',
  DUPLICATE_KEY: 'duplicate_key',
  MISSING_KEY: 'missing_key',
  BAD_VALUE: 'bad_value',
  TEXT_TOO_LONG: 'text_too_long',
  CONTROL_CHARACTERS: 'control_characters',
  UNTERMINATED_TEXT: 'unterminated_text',
  // channel (C1/C2)
  NOT_ARMED: 'not_owner_armed',
  NOT_COMMANDER: 'not_commander_conversation',
  NO_COMMANDER: 'no_commander_bound',
  STALE_TURN: 'turn_before_baseline',
  DUPLICATE_OBSERVATION: 'duplicate_observation',
  // validation (C3–C6)
  OP_NOT_ENABLED: 'op_not_enabled',
  UNKNOWN_AGENT: 'unknown_agent',
  AGENT_UNBOUND: 'agent_unbound',
  AGENT_PAUSED: 'agent_paused',
  AGENT_RETIRED: 'agent_retired',
  AGENT_NOT_COMMANDABLE: 'agent_not_commandable',
  OP_NOT_SUPPORTED: 'op_not_supported_by_adapter',
  NO_GRANT: 'no_grant',
  GRANT_EXPIRED: 'grant_expired',
  GRANT_EXHAUSTED: 'grant_exhausted',
  GRANT_SCOPE: 'grant_does_not_cover',
  RATE_LIMITED: 'rate_limited',
  NONCE_REPLAYED: 'nonce_replayed',
  HOP_LIMIT: 'hop_limit',
  KILL_ENGAGED: 'kill_switch_engaged',
  NO_ADAPTER: 'adapter_unavailable',
  EXECUTOR_BUSY: 'executor_busy',
  TARGET_BUSY: 'target_busy',
  // delivery outcomes
  BINDING_TARGET_MISSING: 'binding_target_missing',
  BINDING_AMBIGUOUS: 'binding_ambiguous',
  BINDING_CHANGED: 'binding_changed_since_preflight',
  WRONG_CONVERSATION: 'wrong_conversation',
  TARGET_REFUSED: 'target_refused_no_send',
  OUTCOME_UNKNOWN: 'outcome_unknown',
  REPLY_REJECTED: 'reply_rejected',
  REPLY_PARTIAL: 'reply_partial',
  TIMEOUT: 'timeout',
  TRANSPORT_LOST: 'transport_lost',
  ADAPTER_ERROR: 'adapter_error',
  STALE_RESERVATION: 'stale_reservation_not_dispatched',
  NOTHING_TO_CANCEL: 'nothing_to_cancel',
  OWNER_DISPOSED: 'owner_disposed',
  EXECUTOR_AUTH_REQUIRED: 'executor_auth_required',
  EXECUTOR_ERROR: 'executor_error',
  REPORT_RETRIES_EXHAUSTED: 'report_retries_exhausted',
  // storage
  STORE_CORRUPT: 'bus_store_corrupt',
  STORE_BUSY: 'bus_store_busy',
  STORE_FULL: 'bus_store_full',
  SCHEMA_UNSUPPORTED: 'bus_schema_unsupported',
});
export const REASONS = Object.freeze(Object.values(REASON));

export class BusError extends Error {
  constructor(code, detail = code) {
    super(`${code}: ${detail}`);
    this.code = code;
    this.detail = detail;
  }
}
export function refuse(code, detail) { throw new BusError(code, detail); }

/* ------------------------------------------------------------------ defaults */

export const DISPOSITIONS = Object.freeze(['owner_saw_delivered', 'owner_saw_not_delivered', 'owner_abandoned']);
export const MAX_REPORT_ATTEMPTS = 3;

export const DEFAULT_CONFIG = Object.freeze({
  /** Owner arm prefix on the first non-empty line of the user turn (C1). Owner-changeable. */
  arm_token: 'AION>',
  /** Report chains stop here (C6). The design's open owner decision; 3 until set. */
  max_hops: 3,
  /** Bounded command text (BUS-V1-V2-DESIGN §1.4). */
  max_text_chars: 2000,
  /** Bounded fenced block, bytes of UTF-16 code units. */
  max_block_chars: 4096,
  /** Rolling-hour cap per target agent, on top of any grant rate. */
  rate_per_agent_per_hour: 20,
  /** Reply excerpt carried in a report; the full reply is never stored. */
  max_report_excerpt_chars: 1200,
  ops_enabled: DEFAULT_OPS_ENABLED,
  /** Report replies back into the commander conversation. */
  report_back: true,
  /** Periodic commander scans (alarm). OFF until the owner turns it on. */
  watch: false,
});

/* ---------------------------------------------------------------- primitives */

const DANGEROUS = new Set(['__proto__', 'prototype', 'constructor']);
export const AGENT_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
export const NONCE = /^(?!(?:__proto__|prototype|constructor)$)[A-Za-z0-9_-]{6,64}$/;
export const GRANT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
/** C0 controls except TAB/LF/CR, DEL, C1 controls and bidi overrides. */
export const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;

export function isPlain(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  if (Object.getOwnPropertySymbols(value).length) return false;
  for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (DANGEROUS.has(key) || !Object.hasOwn(d, 'value') || !d.enumerable) return false;
  }
  return true;
}
export function assertPlain(value, what) { if (!isPlain(value)) refuse(REASON.STORE_CORRUPT, `${what} is not a plain object`); return value; }
export function exactKeys(value, keys, what) {
  assertPlain(value, what);
  const have = Object.keys(value);
  const missing = keys.filter((k) => !Object.hasOwn(value, k));
  const extra = have.filter((k) => !keys.includes(k));
  if (missing.length || extra.length) refuse(REASON.STORE_CORRUPT, `${what} fields: missing [${missing}] extra [${extra}]`);
}
export function isUtc(value) {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function isAgentId(value) { return typeof value === 'string' && AGENT_ID.test(value) && !DANGEROUS.has(value); }
export function boundedString(value, max) { return typeof value === 'string' && value.length > 0 && value.length <= max; }

/** FNV-1a 32-bit, hex. A continuity signature, NOT a security digest. */
export function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Correlation ids must match the shape correlate.js detects as an AION id
 * (`AION-<seg>(-<seg>)+`, alphanumeric segments) so the existing negative-case
 * rejection (foreign/near-miss ids) applies to bus traffic unchanged.
 */
export const CORRELATION = /^AION-BUS-[0-9]{8}-[A-Za-z0-9]{6,32}$/;
export const REPLY_TOKEN = /^ACK-[A-Za-z0-9]{6,32}$/;

export function correlationFor(commandId, now) {
  const day = new Date(now).toISOString().slice(0, 10).replaceAll('-', '');
  return `AION-BUS-${day}-${commandId.replace(/[^A-Za-z0-9]/g, '').slice(0, 32)}`;
}

/* ------------------------------------------------------- adapter manifests */

/**
 * Capability manifest every adapter publishes. The router reads capabilities;
 * it never sniffs adapter names. This is what makes the core provider-neutral.
 */
export const ADAPTER_MANIFEST_KEYS = Object.freeze(['schema', 'name', 'version', 'kind', 'provider', 'capabilities']);
export const CAPABILITY_KEYS = Object.freeze([
  'deliver', 'observe', 'cancel', 'report_target', 'max_text_chars', 'concurrency', 'durable_readback', 'live_verified',
]);
export function validateManifest(manifest) {
  const problems = [];
  if (!isPlain(manifest)) return { ok: false, problems: ['manifest is not a plain object'] };
  for (const key of ADAPTER_MANIFEST_KEYS) if (!Object.hasOwn(manifest, key)) problems.push(`missing ${key}`);
  for (const key of Object.keys(manifest)) if (!ADAPTER_MANIFEST_KEYS.includes(key)) problems.push(`unknown ${key}`);
  if (manifest.schema !== ADAPTER_MANIFEST_SCHEMA) problems.push('schema');
  if (!/^[a-z0-9][a-z0-9.-]{1,63}$/.test(String(manifest.name))) problems.push('name');
  if (!boundedString(manifest.version, 32)) problems.push('version');
  if (![AGENT_KIND.CONVERSATION, AGENT_KIND.EXECUTOR].includes(manifest.kind)) problems.push('kind');
  if (!boundedString(manifest.provider, 64)) problems.push('provider');
  const c = manifest.capabilities;
  if (!isPlain(c)) problems.push('capabilities');
  else {
    for (const key of CAPABILITY_KEYS) if (!Object.hasOwn(c, key)) problems.push(`capabilities.${key} missing`);
    for (const key of Object.keys(c)) if (!CAPABILITY_KEYS.includes(key)) problems.push(`capabilities.${key} unknown`);
    for (const key of ['deliver', 'observe', 'cancel', 'report_target', 'durable_readback', 'live_verified']) {
      if (typeof c[key] !== 'boolean') problems.push(`capabilities.${key}`);
    }
    if (!Number.isSafeInteger(c.max_text_chars) || c.max_text_chars < 1 || c.max_text_chars > 100000) problems.push('capabilities.max_text_chars');
    if (!Number.isSafeInteger(c.concurrency) || c.concurrency < 1 || c.concurrency > 16) problems.push('capabilities.concurrency');
    if (c.deliver !== true) problems.push('capabilities.deliver must be true');
  }
  return { ok: problems.length === 0, problems };
}

/**
 * Normalised adapter outcome. Adapters return one of these; anything else is
 * coerced to `unknown` (fail closed: unknown is never "not sent").
 *   reply      a correlated reply was checked          -> REPLY_CHECKED
 *   sent       target received, reply pending          -> SUBMISSION_OBSERVED
 *   not_sent   POSITIVE evidence nothing was submitted  -> REJECTED (no attempt)
 *   unknown    attempted; outcome unknown               -> UNRESOLVED
 *   pending    observe-only: nothing new learned        -> (no transition)
 */
export const OUTCOME = Object.freeze(['reply', 'sent', 'not_sent', 'unknown', 'pending']);

export function normalizeOutcome(raw, { maxReplyChars = 8000 } = {}) {
  if (!isPlain(raw) || !OUTCOME.includes(raw.outcome)) {
    return { outcome: 'unknown', reason: REASON.ADAPTER_ERROR, detail: 'adapter returned no recognised outcome', reply: null, evidence: null, session_ref: null };
  }
  const reason = typeof raw.reason === 'string' && raw.reason.length <= 64 ? raw.reason : null;
  const detail = typeof raw.detail === 'string' ? raw.detail.slice(0, 240) : null;
  let reply = null;
  if (raw.outcome === 'reply') {
    if (typeof raw.reply !== 'string' || raw.reply.length === 0) {
      return { outcome: 'unknown', reason: REASON.REPLY_PARTIAL, detail: 'reply outcome without reply text', reply: null, evidence: null, session_ref: null };
    }
    reply = raw.reply.slice(0, maxReplyChars);
  }
  const evidence = isPlain(raw.evidence) ? sanitizeEvidence(raw.evidence) : null;
  // A target-side reference (executor session id) the adapter needs to
  // reconcile after a restart. Opaque, bounded, never a credential.
  const session_ref = typeof raw.session_ref === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(raw.session_ref) ? raw.session_ref : null;
  return { outcome: raw.outcome, reason, detail, reply, evidence, session_ref };
}

/** Evidence is bounded scalars only: never nested page data, never secrets. */
export function sanitizeEvidence(evidence) {
  const out = {};
  for (const [key, value] of Object.entries(evidence).slice(0, 16)) {
    if (!/^[a-z_]{1,40}$/.test(key) || /token|cookie|secret|password|auth/i.test(key)) continue;
    if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, 128);
  }
  return out;
}
