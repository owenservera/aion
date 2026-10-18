// AION Chrome Relay Station — MV3 service worker.
//
// MV3 discipline: this worker is event-driven and is terminated by Chrome
// whenever it is idle. Nothing here may assume an immortal JS global. Every
// entry point awaits ONE hydration promise first, then mutates and persists.
//
// THE NATIVE RELAY (item 3)
//   The worker constructs the real `native` adapter and speaks to the host in
//   the host's own vocabulary: `relay.ping` proves the host process answers,
//   `relay.hello` is the call that starts the ACP agent. Nothing else is sent,
//   and nothing is sent automatically.
//
//   WHAT "CONNECTED" IS NOT. Chrome's `connectNative` returns a Port
//   synchronously whether or not a host exists, so holding one proves nothing.
//   The worker therefore keeps its own ladder and refuses to climb it without a
//   real reply:
//
//     DISABLED         no native adapter in this build
//     IDLE             adapter ready, no port opened
//     PORT_OPEN        a port exists, nothing has been proven — NOT a connection
//     VERIFIED         a real `relay.ping` reply came back ok   <- liveness
//     ACP_INITIALIZED  a real `relay.hello` reply came back ok <- ACP initialize
//     UNAVAILABLE      no port, or the host did not answer
//     DEGRADED         a verified port went away
//
//   The adapter's own status string is echoed as `transport_status` and is never
//   interpreted here: it reports CONNECTING until a ping/hello has been
//   correlated with a successful reply.
//
//   ACP initialize is OPTIONAL and only ever runs on an explicit
//   `aion/native-hello`: it starts a child process on the operator's machine.
//
// THE CHATGPT TAB PORT (item 4)
//   One-shot, operator-driven messages to a chatgpt.com content script, via
//   ./chatgpt-port.js. Only chatgpt.com tabs are addressable, replies are
//   validated rather than obeyed, and composing/submitting requires an explicit
//   confirmation. There is no auto-send, no retry and no replay.
//
// SECRETS
//   No cookie, no token, no page bootstrap payload, no storage bag read. Nothing
//   here logs an envelope payload; only ids, sequences and event types.

import { createEventStore, createTransport, isExpired, TASK_STATES, validateEnvelope } from '../lib/index.js';
import { CHATGPT_ERROR, createChatGPTPortDriver } from './chatgpt-port.js';

const STORAGE_KEY = 'aion.relay.state.v1';
const EVENTS_KEY = 'aion.relay.events.v1';
const SCHEMA = 'aion.relay.worker-state/0.1';

// Presence refresh cadence. Two minutes is well inside Chrome's alarm floor of
// 30 seconds for unpacked MV3 workers and keeps polling cheap.
const PRESENCE_ALARM = 'aion.presence.refresh';
const PRESENCE_PERIOD_MINUTES = 2;
const MAX_EVENTS = 500;

/** Native adapter name. 'disabled-native' remains available for a locked-down build. */
const NATIVE_ADAPTER = 'native';

/**
 * Worker-side relay ladder. Deliberately NOT the adapter's own status strings:
 * those describe port ownership, which is not liveness.
 */
export const RELAY_STATUS = Object.freeze({
  DISABLED: 'DISABLED',
  IDLE: 'IDLE',
  PORT_OPEN: 'PORT_OPEN',
  VERIFIED: 'VERIFIED',
  ACP_INITIALIZED: 'ACP_INITIALIZED',
  UNAVAILABLE: 'UNAVAILABLE',
  DEGRADED: 'DEGRADED',
});

/** Refusal codes for the runtime endpoints. Callers branch on these. */
export const WORKER_ERROR = Object.freeze({
  SENDER_UNTRUSTED: 'sender_not_trusted',
  NOT_INITIALISED: 'worker_not_initialised',
  NO_NATIVE_ADAPTER: 'no_native_adapter',
  INTERNAL: 'internal_error',
});

/** How much of a host reply the worker echoes back. Host paths are not included. */
const MAX_HOST_ID_CHARS = 200;

// State names are the literals named in ENVELOPE-CONTRACT.md. TASK_STATES is
// used only to CONFIRM they are real states. If the contract and the lib ever
// disagree, this worker reports UNKNOWN rather than counting a state that does
// not exist and showing a confident zero.
const APPROVAL_PENDING_STATE = 'APPROVAL_PENDING';
const OUTBOX_STATE = 'OUTBOX';

const STATE_NAMES_CONFIRMED =
  Array.isArray(TASK_STATES) &&
  TASK_STATES.includes(APPROVAL_PENDING_STATE) &&
  typeof OUTBOX_STATE === 'string';

/* ------------------------------------------------------------------ *
 * chrome.* availability
 *
 * Resolved lazily, never captured at module load: importing this file
 * under Node (the test runner) must not need a browser, and a test must
 * be able to install a fake `chrome` before the first call.
 * ------------------------------------------------------------------ */

function getChrome() {
  try {
    return typeof chrome !== 'undefined' && chrome ? chrome : null;
  } catch {
    return null;
  }
}

function hasApi(path) {
  const api = getChrome();
  let node = api;
  for (const key of path) {
    if (!node) return false;
    node = node[key];
  }
  return !!node;
}

const hasStorage = () => hasApi(['storage', 'local']);
const hasAlarms = () => hasApi(['alarms']);
const hasTabs = () => hasApi(['tabs']);
const hasAction = () => hasApi(['action', 'onClicked']);

/* ------------------------------------------------------------------ *
 * Storage adapter
 * ------------------------------------------------------------------ */

function readStorage() {
  if (!hasStorage()) return Promise.resolve(null);
  try {
    const api = getChrome();
    return api.storage.local.get(STORAGE_KEY).then(
      (bag) => (bag && bag[STORAGE_KEY]) || null,
      () => null
    );
  } catch (error) {
    return Promise.resolve(null);
  }
}

/**
 * Write one value under STORAGE_KEY.
 *
 * Takes the value itself, not a pre-keyed object. Wrapping here and again at
 * the call call site produced a doubly-nested record that readStorage could
 * never unwrap, which silently reset the boot counter on every restart.
 */
function writeStorage(value) {
  if (!hasStorage()) return Promise.resolve(false);
  try {
    const api = getChrome();
    return api.storage.local.set({ [STORAGE_KEY]: value }).then(
      () => true,
      () => false
    );
  } catch (error) {
    return Promise.resolve(false);
  }
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

// Defaults describe a station that has observed nothing. "never observed" is a
// distinct value from every live state; the panel renders it as UNKNOWN.
// fallback_mode is null, not "E": nothing has been determined yet, and claiming
// SAFE_MANUAL would be a claim this worker cannot support.
function defaultNative() {
  return {
    // Ladder position. IDLE until someone asks for a port.
    status: RELAY_STATUS.IDLE,
    // True when the adapter merely HOLDS a port. Explicitly not a connection.
    port_open: false,
    verified_at: null,
    acp_initialized_at: null,
    // Host identity from a real reply. Identity, never trust.
    host: null,
    agent: null,
    last_error: null,
    ping_count: 0,
    hello_count: 0,
    events_accepted: 0,
    events_rejected: 0,
    last_event_at: null
  };
}

function defaultState() {
  return {
    schema: SCHEMA,
    worker_started_at: null,
    worker_boot_count: 0,
    last_refresh_at: null,
    fallback_mode: null,
    fallback_reason: 'No fallback mode has been determined. Nothing observed yet.',
    degraded_reason: null,
    native: defaultNative()
  };
}

/**
 * Storage adapter for createEventStore({ persist }).
 *
 * The store requires an object with load()/save(events). save() receives the
 * full ordered event array. The event log lives under its own storage key so a
 * corrupt or oversized log cannot take the small status record with it.
 */
function makePersistAdapter() {
  return {
    async load() {
      if (!hasStorage()) return [];
      try {
        const api = getChrome();
        const bag = await api.storage.local.get(EVENTS_KEY);
        const log = bag && bag[EVENTS_KEY];
        return Array.isArray(log) ? log : [];
      } catch (error) {
        // An unreadable log is not an empty log. Say so instead of silently
        // starting from zero and overwriting real outbox entries.
        return Promise.reject(new Error('event log could not be read: ' + String(error)));
      }
    },
    async save(events) {
      if (!hasStorage()) return;
      const api = getChrome();
      await api.storage.local.set({ [EVENTS_KEY]: events });
    }
  };
}

let cachedState = null;
let cachedStore = null;
let cachedTransport = null;
let cachedChatGPT = null;

/**
 * Serialises every inbound relay.event append.
 *
 * Two host events arriving in the same tick would otherwise race on the store's
 * `nextSequence()` and could assign one sequence twice.
 */
let appendChain = Promise.resolve();

/* ------------------------------------------------------------------ *
 * Hydration — ONE promise, concurrency safe
 * ------------------------------------------------------------------ */

let hydration = null;

async function rehydrate() {
  const stored = await readStorage();
  // readStorage() already unwrapped the storage key, so `stored` IS the state
  // record. Reading it as a nested object would silently discard everything
  // that was persisted.
  const state = Object.assign(defaultState(), stored && typeof stored === 'object' ? stored : {});
  state.native = Object.assign(defaultNative(), state.native && typeof state.native === 'object' ? state.native : {});

  if (state.worker_started_at) {
    state.worker_boot_count = (Number(state.worker_boot_count) || 0) + 1;
  }
  state.worker_started_at = new Date().toISOString();
  // Every JS value is gone with the previous worker generation, so the port is
  // gone with it. The ladder restarts at PORT_OPEN=false until a real reply
  // says otherwise; the durable evidence (events, cursor) is untouched.
  state.native.port_open = false;
  state.native.status = RELAY_STATUS.IDLE;

  cachedState = state;

  // Persist immediately. Without this the boot counter never increments across
  // a suspension, because nothing else writes before the first event fires.
  await writeStorage(state);

  cachedStore = createEventStore({ persist: makePersistAdapter() });

  // The real adapter. It opens no port by itself: nothing below connects
  // without an explicit `aion/native-ping` or `aion/native-hello`.
  cachedTransport = createTransport(NATIVE_ADAPTER, {});
  subscribeRelayEvents(cachedTransport);
  subscribeTransportErrors(cachedTransport);

  // Reading before ready() settles would look like an empty outbox.
  try {
    await cachedStore.ready();
  } catch (error) {
    state.degraded_reason = 'Event log failed to load; outbox contents are UNKNOWN.';
    cachedStore = null;
    await writeStorage(state);
  }

  cachedChatGPT = hasTabs() ? createChatGPTPortDriver({ chrome: getChrome() }) : null;
  return state;
}

/**
 * The one hydration promise.
 *
 * Concurrency-safe by construction: parallel events in the same tick all await
 * the same promise, so storage is read once and the boot counter increments
 * once. If hydration REJECTS, the promise is cleared so the next event retries
 * instead of every future event inheriting one failure forever.
 */
function ensureReady() {
  if (!hydration) {
    hydration = rehydrate().catch((error) => {
      hydration = null;
      throw error;
    });
  }
  return hydration;
}

async function persistState() {
  if (!cachedState) return false;
  const ok = await writeStorage(cachedState);
  if (!ok) {
    // Losing state is worse than being loud about it.
    cachedState.degraded_reason = 'chrome.storage.local write rejected; state not durable.';
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Native relay
 * ------------------------------------------------------------------ */

function nativeState() {
  if (!cachedState) cachedState = defaultState();
  if (!cachedState.native) cachedState.native = defaultNative();
  return cachedState.native;
}

/**
 * Consume host events.
 *
 * The adapter hands a subscriber either a relay envelope or a
 * `{ type: 'transport.unavailable' }` notice, so both shapes are handled here.
 * Every envelope is VALIDATED before it is stored: a malformed one is counted
 * and refused, because a forged or corrupted event that reached the durable log
 * would be read back as fact on the next worker generation.
 *
 * Validation failures do NOT arrive here — the adapter rejects them before they
 * reach a subscriber and reports them on `onError` instead. That channel is
 * subscribed in subscribeTransportErrors below, so a rejected host event is
 * still counted and still degrades the reported status; it is simply never
 * stored, which is the whole point.
 */
function subscribeRelayEvents(transport) {
  if (!transport || typeof transport.onMessage !== 'function') return;
  transport.onMessage((message) => {
    if (!message || typeof message !== 'object') {
      noteNativeError('the host sent a message this worker cannot read');
      return;
    }
    if (message.type === 'transport.unavailable') {
      noteNativeError(String(message.reason || 'transport unavailable'));
      return;
    }
    acceptRelayEvent(message);
  });
}

/**
 * Subscribe to the adapter's structured error channel.
 *
 * The adapter emits `{ code, reason, correlation_id?, errors? }` for every
 * boundary failure it refuses — including inbound envelopes that fail schema
 * validation. This worker retains the last one and counts them, so a host that
 * starts sending malformed events shows up as DEGRADED with a reason instead of
 * as a silent, permanently empty log.
 */
function subscribeTransportErrors(transport) {
  if (!transport || typeof transport.onError !== 'function') return;
  transport.onError((error) => {
    if (!error || typeof error !== 'object') {
      noteNativeError('the transport reported an unreadable error');
      return;
    }
    const native = nativeState();
    if (typeof error.code === 'string' && error.code !== 'transport.unavailable') {
      native.events_rejected += 1;
    }
    const parts = [error.code, error.reason];
    if (Array.isArray(error.errors) && error.errors.length > 0) parts.push(error.errors.join('; '));
    if (typeof error.correlation_id === 'string' && error.correlation_id !== '') {
      parts.push(`correlation_id=${error.correlation_id}`);
    }
    noteNativeError(parts.filter(Boolean).join(': '));
  });
}

function acceptRelayEvent(envelope) {
  const check = validateEnvelope(envelope);
  const native = nativeState();
  if (!check.valid) {
    native.events_rejected += 1;
    noteNativeError(`a host event failed envelope validation: ${check.errors.join('; ')}`);
    return;
  }
  native.events_accepted += 1;
  native.last_event_at = new Date().toISOString();
  // Serialised append: see appendChain above.
  appendChain = appendChain
    .then(async () => {
      if (!cachedStore) return;
      try {
        await cachedStore.append(structuredClone(envelope));
      } catch (error) {
        // The store refuses replays and illegal transitions on purpose. That is
        // a dedupe outcome, not a worker failure, so it is counted, not thrown.
        nativeState().events_rejected += 0;
        noteNativeError(`a host event was not stored: ${String(error && error.message ? error.message : error)}`);
      }
    })
    .catch(() => {});
}

function noteNativeError(reason) {
  const native = nativeState();
  const text = String(reason).slice(0, 500);
  native.last_error = text;
  if (native.status === RELAY_STATUS.VERIFIED || native.status === RELAY_STATUS.ACP_INITIALIZED) {
    native.status = RELAY_STATUS.DEGRADED;
  } else if (native.status !== RELAY_STATUS.UNAVAILABLE) {
    native.status = RELAY_STATUS.UNAVAILABLE;
  }
  if (cachedState) cachedState.degraded_reason = text;
}

/**
 * The adapter's own status string, passed through VERBATIM.
 *
 * Never interpreted into a connection claim. The adapter reports CONNECTING
 * until a ping/hello has actually been correlated with a successful reply, so
 * CONNECTING means "a port exists, nothing has been proven yet" — which is the
 * only thing this worker will say about it.
 */
function adapterStatus(transport) {
  try {
    const value = transport ? transport.status() : null;
    return typeof value === 'string' && value !== '' ? value : 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/** A port exists but no host reply has been seen. Never reported as CONNECTED. */
const ADAPTER_STATUS_UNPROVEN = 'CONNECTING';

function portOpenUnproven(transport) {
  return adapterStatus(transport) === ADAPTER_STATUS_UNPROVEN;
}

/**
 * One protocol/version scalar, kept honest.
 *
 * A protocol version is legitimately a NUMBER — the bridge sends
 * `protocol_version: 1` — so a string-only reader silently discarded the real
 * value and the panel rendered UNKNOWN. Numbers stay numbers and strings stay
 * strings; nothing is coerced either way, because "1" and 1 are different claims
 * and a coercion would hide which one the host actually made.
 */
function protocolScalar(value) {
  if (typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value !== '') return value.slice(0, MAX_HOST_ID_CHARS);
  return null;
}

/**
 * The ONLY capability names this worker will report.
 *
 * An allowlist, not a pattern. ACP capability entries are maps whose keys name
 * the capability and whose values can be settings, paths or arbitrary agent
 * prose; a pattern test passes anything identifier-shaped, which is how a `cwd`
 * key or a `note` key became a "capability" on a real run. These three are the
 * capabilities this bridge itself declares (`bridge/src/acp-client.js`
 * clientCapabilities: fs, terminal; plus mcp). Anything else is not reported,
 * and absence is shown as absence.
 */
const AGENT_CAPABILITY_ALLOWLIST = Object.freeze(['fs', 'terminal', 'mcp']);

/**
 * Capability NAMES from the allowlist, never values.
 *
 * Accepts the ACP map form (`agentCapabilities: { fs: {...} }`) and the array
 * form some agents send (`[{ fs: {...} }, ...]`). Returns null when the host
 * reported no capability block at all (UNKNOWN), and an array — possibly empty —
 * when it did.
 */
function capabilityNames(value) {
  const entries = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' ? Object.keys(value).map((key) => ({ [key]: value[key] })) : null);
  if (entries === null) return null;
  const names = [];
  for (const entry of entries.slice(0, 100)) {
    if (typeof entry === 'string') {
      if (AGENT_CAPABILITY_ALLOWLIST.includes(entry)) names.push(entry);
      continue;
    }
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      for (const key of Object.keys(entry)) {
        if (AGENT_CAPABILITY_ALLOWLIST.includes(key)) names.push(key);
      }
    }
  }
  return [...new Set(names)].slice(0, AGENT_CAPABILITY_ALLOWLIST.length);
}

/**
 * Host and agent identity, from a real `relay.ping` / `relay.hello` reply.
 *
 * The agent block in a hello reply IS the ACP initialize result:
 *   { protocolVersion, agentInfo: { name, version }, agentCapabilities: [...] }
 * Reading only top-level strings out of it returned null for every field the
 * panel displays, which is why Protocol/Version/Capabilities rendered UNKNOWN
 * against a host that had reported all three.
 */
function sanitizeHostIdentity(reply) {
  const host = reply && reply.host && typeof reply.host === 'object' ? reply.host : {};
  const agent = reply && reply.agent && typeof reply.agent === 'object' ? reply.agent : null;
  const agentInfo = agent && agent.agentInfo && typeof agent.agentInfo === 'object' ? agent.agentInfo : {};
  const trim = (value) => (typeof value === 'string' && value !== '' ? value.slice(0, MAX_HOST_ID_CHARS) : null);

  // The agent's own protocol version is the most specific answer available; the
  // bridge's `protocol_version` is the fallback when the agent reported none.
  const protocol = protocolScalar(agent && agent.protocolVersion)
    ?? protocolScalar(reply && reply.protocol_version)
    ?? protocolScalar(host.protocol_version);
  // The AGENT's version. It is not the protocol version and is never filled in
  // from it: the panel shows both, so conflating them would be a false claim.
  const version = trim(agentInfo.version);
  const capabilities = capabilityNames(agent && agent.agentCapabilities)
    ?? capabilityNames(reply && reply.capabilities);

  return {
    host: {
      name: trim(host.name),
      node_id: trim(host.node_id),
      protocol_version: protocol
    },
    // Name/status/running only. A filesystem path is not needed to answer "is the
    // agent up", and is not this worker's to redistribute.
    agent: agent
      ? { name: trim(agentInfo.name), status: trim(agent.status), running: agent.running === true }
      : null,
    protocol,
    version,
    capabilities
  };
}

/**
 * `aion/native-ping` — prove the host answers.
 *
 * relay.ping is answered by the host without spawning anything, which is why it
 * is the right liveness probe. The worker reports VERIFIED only when a real
 * reply with ok === true came back.
 */
async function handleNativePing() {
  await ensureReady();
  const transport = cachedTransport;
  const native = nativeState();
  if (!transport || typeof transport.ping !== 'function') {
    return { ok: false, code: WORKER_ERROR.NO_NATIVE_ADAPTER, error: 'this build has no native adapter' };
  }
  native.port_open = portOpenUnproven(transport);
  native.ping_count += 1;
  try {
    const reply = await transport.ping();
    native.port_open = portOpenUnproven(transport);
    // The adapter's own view, echoed unaltered. The worker's ladder below is the
    // only claim this worker makes, and it moves only on a real reply.
    const transport_status = adapterStatus(transport);
    if (!reply || reply.ok !== true) {
      native.status = RELAY_STATUS.UNAVAILABLE;
      native.last_error = 'the host answered the ping but did not confirm it';
      await persistState();
      return {
        ok: false,
        relay_status: native.status,
        transport_status,
        // Panel-facing flattened shape: { ok, host, transport, status, detail }
        transport: transport_status,
        status: native.status,
        host: native.host,
        detail: native.last_error,
        port_open: native.port_open
      };
    }
    const identity = sanitizeHostIdentity(reply);
    native.host = identity.host;
    native.agent = identity.agent;
    native.status = RELAY_STATUS.VERIFIED;
    native.verified_at = new Date().toISOString();
    native.last_error = null;
    await persistState();
    return {
      ok: true,
      // Only reached on a real host reply.
      relay_status: native.status,
      transport_status,
      // Panel-facing flattened shape: { ok, host, transport, status, detail }
      transport: transport_status,
      status: native.status,
      detail: 'Host answered relay.ping. Transport liveness only: not executor acceptance, not proof.',
      host: native.host,
      agent: native.agent,
      protocol: identity.host.protocol_version,
      capabilities: identity.capabilities,
      verified_at: native.verified_at,
      port_open: native.port_open
    };
  } catch (error) {
    native.port_open = portOpenUnproven(transport);
    native.status = RELAY_STATUS.UNAVAILABLE;
    native.last_error = String(error && error.message ? error.message : error).slice(0, 500);
    await persistState();
    return {
      ok: false,
      relay_status: native.status,
      transport_status: adapterStatus(transport),
      transport: adapterStatus(transport),
      status: native.status,
      host: native.host,
      detail: native.last_error,
      port_open: native.port_open,
      error: native.last_error
    };
  }
}

/**
 * `aion/native-hello` — the ACP initialize call, on explicit request only.
 *
 * relay.hello is what starts the child agent on the operator's machine, so it
 * is never issued automatically: not on start-up, not on an alarm, not on a
 * ping. ACP_INITIALIZED is reported only after the host's own ok reply.
 */
async function handleNativeHello() {
  await ensureReady();
  const transport = cachedTransport;
  const native = nativeState();
  if (!transport || typeof transport.hello !== 'function') {
    return { ok: false, code: WORKER_ERROR.NO_NATIVE_ADAPTER, error: 'this build has no native adapter' };
  }
  native.hello_count += 1;
  try {
    const reply = await transport.hello();
    native.port_open = portOpenUnproven(transport);
    const transport_status = adapterStatus(transport);
    if (!reply || reply.ok !== true) {
      // hello without a confirming reply proves nothing about ACP. Fall back to
      // VERIFIED only if a ping had already proven liveness; otherwise there is
      // no claim left to fall back to.
      native.status = native.verified_at ? RELAY_STATUS.VERIFIED : RELAY_STATUS.UNAVAILABLE;
      native.last_error = 'the host answered hello but did not confirm it; ACP initialize is NOT claimed';
      await persistState();
      return {
        ok: false,
        relay_status: native.status,
        transport_status,
        transport: transport_status,
        status: native.status,
        acp_initialized: false,
        // Same panel-facing shape on every hello outcome, so the UI never has to
        // branch on which fields happen to be present.
        protocol: native.host ? native.host.protocol_version : null,
        version: null,
        capabilities: null,
        session_ready: false,
        session: null,
        host: native.host,
        detail: native.last_error,
        error: native.last_error
      };
    }
    const identity = sanitizeHostIdentity(reply);
    native.host = identity.host;
    native.agent = identity.agent;
    native.status = RELAY_STATUS.ACP_INITIALIZED;
    native.acp_initialized_at = new Date().toISOString();
    native.verified_at = native.verified_at || native.acp_initialized_at;
    native.last_error = null;
    await persistState();
    return {
      ok: true,
      relay_status: native.status,
      transport_status,
      transport: transport_status,
      status: native.status,
      acp_initialized: true,
      // Panel-facing flattened shape: { ok, protocol, version, capabilities }
      protocol: identity.host.protocol_version,
      version: identity.version,
      capabilities: identity.capabilities,
      host: native.host,
      agent: native.agent,
      acp_initialized_at: native.acp_initialized_at,
      // WHAT IS NOT CLAIMED. relay.hello initialises ACP; it does not make an
      // executor turn available. A session is a separate, lazily-created thing
      // and nothing here reports one as ready — a probe that says "initialized"
      // and a panel that shows "agent running" must not collapse into one claim.
      session_ready: false,
      session: null,
      detail: 'Host acknowledged relay.hello (ACP initialize). No ACP session is claimed by this step.'
    };
  } catch (error) {
    native.port_open = portOpenUnproven(transport);
    native.status = native.verified_at ? RELAY_STATUS.VERIFIED : RELAY_STATUS.UNAVAILABLE;
    native.last_error = String(error && error.message ? error.message : error).slice(0, 500);
    await persistState();
    return {
      ok: true,
      relay_status: native.status,
      transport_status: adapterStatus(transport),
      transport: adapterStatus(transport),
      status: native.status,
      acp_initialized: false,
      host: native.host,
      protocol: native.host ? native.host.protocol_version : null,
      version: null,
      capabilities: null,
      session_ready: false,
      session: null,
      detail: native.last_error,
      error: native.last_error
    };
  }
}

/* ------------------------------------------------------------------ *
 * ChatGPT tab port
 * ------------------------------------------------------------------ */

/**
 * `aion/chatgpt-*` — command shape.
 *
 * The agreed panel contract is:
 *   { type:'aion/chatgpt-ping',  tabId }
 *   { type:'aion/chatgpt-run',   tabId, command:{ text, correlation_id,
 *                                                    expected_reply_token,
 *                                                    user_gesture:true } }
 *
 * `tab_id` is accepted as an alias of `tabId`, and the nested `command` object
 * is flattened into the driver's own arguments. Only the keys named below are
 * read: the incoming message is NEVER spread, so a caller cannot smuggle an
 * action name, a second target, or any browser command through an unrecognised
 * key.
 */
function chatgptCommand(message, allowed) {
  const source = (message && typeof message.command === 'object' && message.command !== null && !Array.isArray(message.command))
    ? message.command
    : message;
  const command = {};
  for (const key of allowed) {
    if (source[key] !== undefined) command[key] = source[key];
  }
  // `tabId` (panel contract) and `tab_id` (driver contract) are the same field.
  if (command.tab_id === undefined) {
    const alias = message.tabId ?? (source !== message ? source.tabId : undefined);
    if (alias !== undefined) command.tab_id = alias;
  }
  return command;
}

async function handleChatGptTabs() {
  await ensureReady();
  const driver = cachedChatGPT;
  if (!driver) {
    return { ok: false, code: CHATGPT_ERROR.NO_TABS_API, error: `${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable`, tabs: [] };
  }
  return driver.listTabs();
}

async function handleChatGptPing(message) {
  await ensureReady();
  const driver = cachedChatGPT;
  if (!driver) {
    return { ok: false, code: CHATGPT_ERROR.NO_TABS_API, error: `${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable` };
  }
  return driver.ping(chatgptCommand(message, ['tab_id']));
}

/**
 * `aion/chatgpt-run` — the ONLY path that composes and submits into a signed-in
 * ChatGPT session.
 *
 * THREE independent gates, all of which must pass, in this order:
 *   1. the sender is this extension's own page (checked in handleMessage)
 *   2. `command.user_gesture === true` — an explicit click-level assertion
 *   3. `command.approved_scope_ref` — the approval this turn acts under
 *
 * A boolean gesture is not authorisation: the contract states the extension
 * cannot grant its own permissions, so the approval reference is required and is
 * recorded durably with the dispatch. Gates 2 and 3 are checked BEFORE any port
 * is opened, so a mis-wired caller cannot produce a send.
 *
 * The driver additionally refuses to submit a correlation that already holds a
 * dispatch reservation, in memory or in chrome.storage.local. That reservation
 * never expires on its own, so neither a worker restart nor an expired port
 * guard can cause an automatic duplicate submission.
 */
async function handleChatGptRun(message) {
  await ensureReady();
  const driver = cachedChatGPT;
  if (!driver) {
    return { ok: false, code: CHATGPT_ERROR.NO_TABS_API, error: `${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable` };
  }
  const nested = message && typeof message.command === 'object' && message.command !== null;
  const source = nested ? message.command : message;
  const gesture = source.user_gesture;
  if (gesture !== true) {
    return {
      ok: false,
      code: CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED,
      error: `${CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED}: command.user_gesture must be true to submit one turn; nothing was typed or sent`,
      submitted: false,
      captured: false
    };
  }
  const scopeRef = source.approved_scope_ref;
  if (typeof scopeRef !== 'string' || scopeRef.trim() === '') {
    return {
      ok: false,
      code: CHATGPT_ERROR.APPROVAL_REQUIRED,
      error: `${CHATGPT_ERROR.APPROVAL_REQUIRED}: command.approved_scope_ref must name the approval this turn acts under; a gesture alone is not authorisation`,
      submitted: false,
      captured: false
    };
  }
  return driver.runTurn(chatgptCommand(message, [
    // user_gesture is re-checked inside the driver, so it is forwarded rather
    // than assumed: one gate per process is not two gates.
    'tab_id', 'text', 'correlation_id', 'expected_reply_token', 'timeout_ms', 'approved_scope_ref', 'user_gesture'
  ]));
}

async function handleChatGptRead(message) {
  await ensureReady();
  const driver = cachedChatGPT;
  if (!driver) {
    return { ok: false, code: CHATGPT_ERROR.NO_TABS_API, error: `${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable` };
  }
  return driver.readFinal(chatgptCommand(message, [
    'tab_id', 'correlation_id', 'expected_reply_token', 'outbound_text', 'generation_complete'
  ]));
}

/* ------------------------------------------------------------------ *
 * Derived truth
 * ------------------------------------------------------------------ */

function deriveStatus(state, store, transport) {
  const native = state && state.native ? state.native : defaultNative();

  // A store that failed to hydrate must never be reported as an empty outbox.
  if (!store) {
    return {
      observed: true,
      observed_at: new Date().toISOString(),
      degraded: true,
      relay: relayBlock(state, transport, native),
      outbox: { count: null, oldest_created_at: null, cursor: null },
      proof: { last_evidence_at: null, note: 'Event store unavailable; outbox, proof and approval are UNKNOWN.' },
      approval: { pending: null, note: 'Approval state not observed; event store unavailable.' },
      fallback: { mode: state.fallback_mode, reason: state.degraded_reason || 'Event store unavailable.' },
      role_tab_presence_note:
        'Tab presence is browser UI metadata. It is never evidence that an agent is running.',
      task_note: 'A delivery ACK proves delivery only. Executor acceptance is a separate event.'
    };
  }

  let events = [];
  try {
    events = store.list().slice(-MAX_EVENTS);
  } catch (error) {
    events = [];
  }

  const now = Date.now();
  const live = events.filter((event) => {
    try {
      return !isExpired(event, now);
    } catch (error) {
      return true;
    }
  });

  let approvalPending = 0;
  let newestEvidenceAt = null;
  let queued = 0;
  let oldestQueuedAt = null;

  for (const event of live) {
    if (!event || typeof event !== 'object') continue;

    if (event.task_state === APPROVAL_PENDING_STATE) approvalPending += 1;

    if (event.delivery_state === OUTBOX_STATE) {
      queued += 1;
      const at = event.created_at;
      if (at && (oldestQueuedAt === null || Date.parse(at) < Date.parse(oldestQueuedAt))) {
        oldestQueuedAt = at;
      }
    }

    if (typeof event.event_type === 'string' && event.event_type.startsWith('proof.')) {
      const at = event.created_at;
      if (at && (newestEvidenceAt === null || Date.parse(at) > Date.parse(newestEvidenceAt))) {
        newestEvidenceAt = at;
      }
    }
  }

  let cursor = null;
  try {
    const value = store.cursor();
    if (Number.isFinite(value)) cursor = value;
  } catch (error) {
    cursor = null;
  }

  let retained = 0;
  try {
    retained = store.list().length;
  } catch (error) {
    retained = 0;
  }

  return {
    observed: true,
    observed_at: new Date().toISOString(),
    degraded: false,
    relay: relayBlock(state, transport, native),
    outbox: { count: queued, oldest_created_at: oldestQueuedAt, cursor, retained_events: retained },
    proof: {
      last_evidence_at: newestEvidenceAt,
      note:
        newestEvidenceAt === null
          ? 'No proof event observed. Transport delivery would not change this field.'
          : 'Newest proof event timestamp. Verification is a separate claim.'
    },
    approval: {
      pending: STATE_NAMES_CONFIRMED ? approvalPending : null,
      note: STATE_NAMES_CONFIRMED
        ? approvalPending === 0
          ? 'No task is currently held at APPROVAL_PENDING.'
          : 'Tasks held at APPROVAL_PENDING. They are not progressing.'
        : 'Task state vocabulary unconfirmed against the lib. Approval state is UNKNOWN.'
    },
    fallback: { mode: state.fallback_mode, reason: state.fallback_reason },
    role_tab_presence_note:
      'Tab presence is browser UI metadata. It is never evidence that an agent is running.',
    task_note: 'A delivery ACK proves delivery only. Executor acceptance is a separate event.'
  };
}

/**
 * The relay block.
 *
 * `status` is the worker's ladder, not the adapter's port ownership: an
 * unproven port is reported separately as `port_open` and is explicitly not a
 * connection. `replay_policy` is constant on purpose — this worker never
 * re-sends a retained event by itself.
 */
function relayBlock(state, transport, native) {
  const name = transport ? transport.name : 'unknown';
  const enabled = transport ? transport.enabled === true : false;
  const detail = native.status === RELAY_STATUS.VERIFIED
    ? 'Host answered relay.ping. Transport liveness only.'
    : native.status === RELAY_STATUS.ACP_INITIALIZED
      ? 'Host acknowledged relay.hello and reported the agent. Agent availability is the host\'s claim.'
      : native.status === RELAY_STATUS.PORT_OPEN
        ? 'Chrome returned a port. That is not a connection; no host reply has been observed.'
        : native.status === RELAY_STATUS.UNAVAILABLE
          ? 'No verified host connection. Nothing has been sent.'
          : native.status === RELAY_STATUS.DEGRADED
            ? 'A verified host connection was lost. Retries are bounded; nothing is re-sent automatically.'
            : enabled
              ? 'Native adapter constructed. No port has been opened; nothing has been sent.'
              : 'Adapter is disabled in this build. No host was contacted.';

  return {
    name,
    enabled,
    // The worker's own ladder: the only status claim this worker makes.
    status: native.status,
    // The adapter's view, echoed unaltered and never interpreted.
    transport_status: adapterStatus(transport),
    detail,
    // A port existed but no host reply had been correlated when this was read.
    // Never the same thing as connected.
    port_open: native.port_open === true,
    // Liveness, proven by a real relay.ping reply only.
    verified: native.status === RELAY_STATUS.VERIFIED || native.status === RELAY_STATUS.ACP_INITIALIZED,
    verified_at: native.verified_at,
    // ACP initialize, proven by a real relay.hello reply only.
    acp_initialized: native.status === RELAY_STATUS.ACP_INITIALIZED,
    acp_initialized_at: native.acp_initialized_at,
    host: native.host,
    agent: native.agent,
    last_error: native.last_error,
    counters: {
      pings: native.ping_count,
      hellos: native.hello_count,
      events_accepted: native.events_accepted,
      events_rejected: native.events_rejected
    },
    replay_policy: 'Retained events are never re-sent automatically. A non-idempotent task needs an explicit operator action.',
    boot_count: state.worker_boot_count,
    worker_started_at: state.worker_started_at,
    degraded_reason: state.degraded_reason
  };
}

async function handleStatus() {
  await ensureReady();
  return deriveStatus(cachedState, cachedStore, cachedTransport);
}

/* ------------------------------------------------------------------ *
 * Sender validation — fail closed
 * ------------------------------------------------------------------ */

/**
 * May this sender use the native/chatgpt endpoints?
 *
 * Allowed: this extension's own pages (side panel, options, popup). Refused:
 *   - a web page (no sender.id at all)
 *   - another extension (a different sender.id)
 *   - a content script on any tab (sender.tab is present) — the content script
 *     is reached through ./chatgpt-port.js, never through runtime messaging
 *   - an unknown extension id, which is never treated as "probably fine"
 */
export function authorizeSender(sender) {
  const api = getChrome();
  const id = api && api.runtime ? api.runtime.id : null;
  if (typeof id !== 'string' || id === '') {
    return { ok: false, reason: 'extension_id_unknown' };
  }
  if (!sender || typeof sender !== 'object') {
    return { ok: false, reason: 'no_sender' };
  }
  if (sender.id !== id) {
    return { ok: false, reason: 'sender_is_not_this_extension' };
  }
  if (sender.tab) {
    return { ok: false, reason: 'sender_is_a_tab' };
  }
  if (sender.url !== undefined) {
    if (typeof sender.url !== 'string' || !isOwnExtensionPage(sender.url, id)) {
      return { ok: false, reason: 'sender_url_not_an_extension_page' };
    }
  }
  return { ok: true };
}

/**
 * Is this URL a page of THIS extension?
 *
 * The raw string is checked BEFORE parsing, because `new URL()` silently
 * resolves `..` segments: `chrome-extension://<id>/../../evil.html` parses to a
 * perfectly innocent `/evil.html` and a post-parse check would wave it through.
 * Chrome normalises real sender URLs, so seeing a traversal here means the value
 * is not something Chrome produced, and the only safe answer is no.
 */
function isOwnExtensionPage(url, id) {
  if (typeof url !== 'string' || url === '') return false;
  const prefix = `chrome-extension://${id}/`;
  if (!url.startsWith(prefix)) return false;
  const rest = url.slice(prefix.length);
  if (rest.split(/[/?#]/).some((segment) => segment === '..')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'chrome-extension:' && parsed.hostname === id;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Message routing
 * ------------------------------------------------------------------ */

/**
 * Uniform response envelope for the action endpoints.
 *
 * The agreed shape is `{ ok, result }`, and the result fields are ALSO spread at
 * the top level so a caller can read `reply.tabs` without unwrapping. Both
 * spellings carry the same values; `ok` is normalised to a real boolean and
 * `code` is always present (null on success) so a refusal is never a bare
 * falsy value.
 */
function actionReply(result, type) {
  const body = result && typeof result === 'object' ? result : {};
  const ok = body.ok === true;
  return {
    ...body,
    ok,
    code: ok ? (body.code ?? null) : (body.code ?? WORKER_ERROR.INTERNAL),
    error: ok ? (body.error ?? null) : (body.error ?? 'the request failed'),
    result: body,
    type
  };
}

/** Endpoints that act rather than observe. Each is explicit and single-shot. */
const NATIVE_ENDPOINTS = Object.freeze({
  'aion/native-ping': handleNativePing,
  'aion/native-hello': handleNativeHello
});

const CHATGPT_ENDPOINTS = Object.freeze({
  'aion/chatgpt-tabs': handleChatGptTabs,
  'aion/chatgpt-ping': handleChatGptPing,
  'aion/chatgpt-run': handleChatGptRun,
  'aion/chatgpt-read': handleChatGptRead
});

/**
 * Dispatch one runtime message.
 *
 * Returns `true` when the channel is being kept open for an async reply.
 * Split out from the listener so the test harness drives exactly the same code
 * path Chrome would.
 */
export function handleMessage(message, sender, sendResponse) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return false;
  const type = message.type;
  if (typeof type !== 'string') return false;

  const isActEndpoint = Object.prototype.hasOwnProperty.call(NATIVE_ENDPOINTS, type)
    || Object.prototype.hasOwnProperty.call(CHATGPT_ENDPOINTS, type);

  if (!isActEndpoint && type !== 'aion/status' && type !== 'aion/refresh') return false;

  // Read-only status is still extension-only: a web page must not learn this
  // installation's relay state either.
  const auth = authorizeSender(sender);
  if (!auth.ok) {
    sendResponse({
      observed: false,
      ok: false,
      code: WORKER_ERROR.SENDER_UNTRUSTED,
      error: `${WORKER_ERROR.SENDER_UNTRUSTED}: ${auth.reason}`,
      type
    });
    return false;
  }

  const fail2 = (error) => {
    sendResponse({
      observed: false,
      ok: false,
      code: WORKER_ERROR.INTERNAL,
      error: String(error && error.message ? error.message : error),
      type
    });
  };

  if (type === 'aion/status') {
    handleStatus().then((status) => sendResponse({ ...status, ok: true }), fail2);
    return true;
  }

  if (type === 'aion/refresh') {
    ensureReady()
      .then(() => refreshPresence(typeof message.reason === 'string' ? message.reason : 'manual'))
      .then(() => deriveStatus(cachedState, cachedStore, cachedTransport))
      .then((status) => sendResponse({ ...status, ok: true }), fail2);
    return true;
  }

  const native = NATIVE_ENDPOINTS[type];
  if (native) {
    native().then((result) => sendResponse(actionReply(result, type)), fail2);
    return true;
  }

  const chatgpt = CHATGPT_ENDPOINTS[type];
  chatgpt(message).then((result) => sendResponse(actionReply(result, type)), fail2);
  return true;
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

async function refreshPresence(reason) {
  await ensureReady();
  cachedState.last_refresh_at = new Date().toISOString();
  cachedState.worker_boot_count = Number(cachedState.worker_boot_count) || 0;
  await persistState();
  return { refreshed_at: cachedState.last_refresh_at, reason };
}

function schedulePresence() {
  if (!hasAlarms()) return;
  try {
    const api = getChrome();
    api.alarms.create(PRESENCE_ALARM, { periodInMinutes: PRESENCE_PERIOD_MINUTES });
  } catch (error) {
    // An alarm we cannot create is an unknown refresh cadence, not a zero one.
    cachedState = cachedState || defaultState();
    cachedState.degraded_reason = 'Presence alarm could not be created; refresh cadence unknown.';
  }
}

/**
 * Register every listener against an API object.
 *
 * Exported (and idempotent) so the test harness installs the SAME wiring a
 * browser would, instead of a parallel copy that could drift.
 */
export function installRuntimeListeners(api) {
  if (!api || typeof api !== 'object') return false;
  if (installedFor === api) return true;

  try {
    if (api.action && api.action.onClicked) {
      api.action.onClicked.addListener(async (tab) => {
        await ensureReady();
        if (tab && Number.isInteger(tab.windowId)) {
          try {
            await api.sidePanel.open({ windowId: tab.windowId });
          } catch (error) {
            // Side panel open can be refused by policy; say so instead of failing silently.
            if (cachedState) cachedState.degraded_reason = 'Side panel open refused for this window.';
            await persistState();
          }
        }
      });
    }

    if (api.runtime && api.runtime.onInstalled) {
      api.runtime.onInstalled.addListener(async () => {
        await ensureReady();
        await refreshPresence('install');
      });
    }

    if (api.runtime && api.runtime.onStartup) {
      api.runtime.onStartup.addListener(async () => {
        await ensureReady();
        await refreshPresence('browser-start');
      });
    }

    if (api.runtime && api.runtime.onMessage) {
      api.runtime.onMessage.addListener(handleMessage);
    }

    if (api.alarms && api.alarms.onAlarm) {
      api.alarms.onAlarm.addListener((alarm) => {
        if (!alarm || alarm.name !== PRESENCE_ALARM) return;
        refreshPresence('alarm').catch(() => {});
      });
    }
  } catch (error) {
    return false;
  }

  installedFor = api;
  return true;
}

let installedFor = null;

// Registering at import time is what a real service worker does. It is guarded
// so importing this file under Node is a no-op instead of a crash.
try {
  const api = getChrome();
  if (api && api.runtime) installRuntimeListeners(api);
} catch {
  /* no browser here; the test harness installs its own */
}

schedulePresence();

/* ------------------------------------------------------------------ *
 * Test surface
 * ------------------------------------------------------------------ */

export const __testing = {
  ensureReady,
  rehydrate,
  handleStatus,
  deriveStatus,
  handleMessage,
  authorizeSender,
  refreshPresence,
  chatgptCommand,
  defaultState,
  relayBlock,
  /** Drop every cached JS value: the exact effect of a worker restart. */
  reset() {
    hydration = null;
    cachedState = null;
    cachedStore = null;
    cachedTransport = null;
    cachedChatGPT = null;
    appendChain = Promise.resolve();
    installedFor = null;
  },
  get state() { return cachedState; },
  get store() { return cachedStore; },
  get transport() { return cachedTransport; },
  get chatgpt() { return cachedChatGPT; },
  get hydrated() { return hydration; }
};