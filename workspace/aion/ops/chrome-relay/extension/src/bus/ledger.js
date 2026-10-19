// AION Bus — durable operation ledger.
//
// ONE storage key (`aion.relay.bus.v1`, schema `aion.bus/1`) holds the
// registry, grants, commands, nonces, observation dedupe, rate window, kill
// switch and a bounded audit log. It is deliberately SEPARATE from the ChatGPT
// no-resend task store (`aion.relay.chatgpt.tasks.v1`): bus code can never
// rewrite that ledger, and the delivery adapter keeps using it unchanged.
//
// Storage is any object with chrome.storage.local's shape:
//   get(key) -> Promise<{ [key]: value }>      set({ [key]: value }) -> Promise
// The extension passes chrome.storage.local; Node passes node-storage.js; tests
// pass an in-memory fake. Every mutation is read -> validate -> apply ->
// validate -> write, serialized per storage object, and a refused or failed
// write throws: callers must treat the operation as NOT persisted.

import {
  BUS_SCHEMA, BUS_STATE_KEY, BUS_STATE_VERSION, COMMAND_STATE, DEFAULT_CONFIG, GRANT_ID, OPS, ORIGIN, REASON,
  TERMINAL_STATES, TRANSITIONS, BusError, assertPlain, exactKeys, isAgentId, isPlain, isUtc, refuse,
} from './contracts.js';
import { seedAgents, validateRegistry } from './registry.js';

export const STATE_FIELDS = Object.freeze([
  'schema', 'version', 'created_utc', 'updated_utc', 'seq', 'config', 'kill', 'commander', 'agents', 'grants',
  'commands', 'nonces', 'observations', 'rate', 'events',
]);
export const GRANT_FIELDS = Object.freeze([
  'grant_id', 'ref', 'agents', 'ops', 'max_count', 'used_count', 'rate_per_hour', 'expires_utc', 'created_utc',
  'revoked', 'cwd',
]);
export const COMMAND_FIELDS = Object.freeze([
  'command_id', 'chain_id', 'hop', 'nonce', 'origin_kind', 'origin_ref', 'op', 'to', 'text', 'text_sig',
  'text_chars', 'grant_id', 'correlation_id', 'reply_token', 'adapter', 'binding_ref', 'state', 'attempted',
  'reason', 'detail', 'reply', 'report_of', 'report_command_id', 'executor_ref', 'created_utc', 'updated_utc', 'history',
]);
export const LIMITS = Object.freeze({
  commands: 1000, nonces: 5000, observations: 2000, rate: 2000, events: 500, history: 24, grants: 64,
});

const gates = new WeakMap();

/* --------------------------------------------------------------- validate */

function validateConfig(config) {
  exactKeys(config, Object.keys(DEFAULT_CONFIG), 'config');
  if (typeof config.arm_token !== 'string' || config.arm_token.length < 2 || config.arm_token.length > 32 || /\s/.test(config.arm_token)) refuse(REASON.STORE_CORRUPT, 'config.arm_token');
  for (const [key, lo, hi] of [['max_hops', 0, 16], ['max_text_chars', 1, 8000], ['max_block_chars', 64, 16384],
    ['rate_per_agent_per_hour', 1, 1000], ['max_report_excerpt_chars', 0, 4000]]) {
    if (!Number.isSafeInteger(config[key]) || config[key] < lo || config[key] > hi) refuse(REASON.STORE_CORRUPT, `config.${key}`);
  }
  if (!Array.isArray(config.ops_enabled) || config.ops_enabled.some((op) => !OPS.includes(op))) refuse(REASON.STORE_CORRUPT, 'config.ops_enabled');
  if (typeof config.report_back !== 'boolean') refuse(REASON.STORE_CORRUPT, 'config.report_back');
  if (typeof config.watch !== 'boolean') refuse(REASON.STORE_CORRUPT, 'config.watch');
}

export function validateGrant(grant, key) {
  exactKeys(grant, GRANT_FIELDS, 'grant');
  if (!GRANT_ID.test(grant.grant_id) || grant.grant_id !== key) refuse(REASON.STORE_CORRUPT, 'grant_id');
  if (typeof grant.ref !== 'string' || grant.ref.length < 1 || grant.ref.length > 256) refuse(REASON.STORE_CORRUPT, 'grant.ref');
  if (!Array.isArray(grant.agents) || grant.agents.length < 1 || grant.agents.some((a) => !isAgentId(a))) refuse(REASON.STORE_CORRUPT, 'grant.agents');
  if (!Array.isArray(grant.ops) || grant.ops.length < 1 || grant.ops.some((op) => !OPS.includes(op))) refuse(REASON.STORE_CORRUPT, 'grant.ops');
  if (!Number.isSafeInteger(grant.max_count) || grant.max_count < 1 || grant.max_count > 10000) refuse(REASON.STORE_CORRUPT, 'grant.max_count');
  if (!Number.isSafeInteger(grant.used_count) || grant.used_count < 0 || grant.used_count > grant.max_count) refuse(REASON.STORE_CORRUPT, 'grant.used_count');
  if (!Number.isSafeInteger(grant.rate_per_hour) || grant.rate_per_hour < 1 || grant.rate_per_hour > 1000) refuse(REASON.STORE_CORRUPT, 'grant.rate_per_hour');
  if (!isUtc(grant.expires_utc) || !isUtc(grant.created_utc)) refuse(REASON.STORE_CORRUPT, 'grant timestamps');
  if (typeof grant.revoked !== 'boolean') refuse(REASON.STORE_CORRUPT, 'grant.revoked');
  if (grant.cwd !== null && (typeof grant.cwd !== 'string' || grant.cwd.length < 1 || grant.cwd.length > 1024)) refuse(REASON.STORE_CORRUPT, 'grant.cwd');
}

export function validateCommand(c, key) {
  exactKeys(c, COMMAND_FIELDS, 'command');
  if (typeof c.command_id !== 'string' || !/^[a-z0-9]{8,40}$/.test(c.command_id) || c.command_id !== key) refuse(REASON.STORE_CORRUPT, 'command_id');
  if (typeof c.chain_id !== 'string' || !/^[a-z0-9]{8,40}$/.test(c.chain_id)) refuse(REASON.STORE_CORRUPT, 'chain_id');
  if (!Number.isSafeInteger(c.hop) || c.hop < 0 || c.hop > 64) refuse(REASON.STORE_CORRUPT, 'hop');
  if (c.nonce !== null && (typeof c.nonce !== 'string' || c.nonce.length > 64)) refuse(REASON.STORE_CORRUPT, 'nonce');
  if (!Object.values(ORIGIN).includes(c.origin_kind)) refuse(REASON.STORE_CORRUPT, 'origin_kind');
  if (typeof c.origin_ref !== 'string' || c.origin_ref.length > 128) refuse(REASON.STORE_CORRUPT, 'origin_ref');
  if (!OPS.includes(c.op) && c.op !== 'report') refuse(REASON.STORE_CORRUPT, 'op');
  if (c.to !== null && !isAgentId(c.to)) refuse(REASON.STORE_CORRUPT, 'to');
  if (c.text !== null && (typeof c.text !== 'string' || c.text.length > 8000)) refuse(REASON.STORE_CORRUPT, 'text');
  if (!Object.values(COMMAND_STATE).includes(c.state)) refuse(REASON.STORE_CORRUPT, 'state');
  if (typeof c.attempted !== 'boolean') refuse(REASON.STORE_CORRUPT, 'attempted');
  // Text is held only until the single attempt. After that it is gone, so no
  // later code path has anything to re-send.
  if (c.attempted && c.text !== null) refuse(REASON.STORE_CORRUPT, 'text retained after attempt');
  if (c.reason !== null && (typeof c.reason !== 'string' || c.reason.length > 64)) refuse(REASON.STORE_CORRUPT, 'reason');
  if (c.detail !== null && (typeof c.detail !== 'string' || c.detail.length > 240)) refuse(REASON.STORE_CORRUPT, 'detail');
  if (c.reply !== null) {
    exactKeys(c.reply, ['chars', 'sig', 'excerpt', 'observed_utc'], 'reply');
    if (!Number.isSafeInteger(c.reply.chars) || typeof c.reply.sig !== 'string' || typeof c.reply.excerpt !== 'string'
      || c.reply.excerpt.length > 4000 || !isUtc(c.reply.observed_utc)) refuse(REASON.STORE_CORRUPT, 'reply');
  }
  if (c.executor_ref !== null && (typeof c.executor_ref !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(c.executor_ref))) refuse(REASON.STORE_CORRUPT, 'executor_ref');
  if (!Array.isArray(c.history) || c.history.length > LIMITS.history) refuse(REASON.STORE_CORRUPT, 'history');
  if (!isUtc(c.created_utc) || !isUtc(c.updated_utc)) refuse(REASON.STORE_CORRUPT, 'command timestamps');
}

export function validateState(state) {
  exactKeys(state, STATE_FIELDS, 'bus state');
  if (state.schema !== BUS_SCHEMA) refuse(REASON.SCHEMA_UNSUPPORTED, `schema ${String(state.schema).slice(0, 40)}`);
  if (state.version !== BUS_STATE_VERSION) refuse(REASON.SCHEMA_UNSUPPORTED, `version ${state.version}`);
  if (!isUtc(state.created_utc) || !isUtc(state.updated_utc)) refuse(REASON.STORE_CORRUPT, 'state timestamps');
  if (!Number.isSafeInteger(state.seq) || state.seq < 0) refuse(REASON.STORE_CORRUPT, 'seq');
  validateConfig(state.config);
  exactKeys(state.kill, ['engaged', 'at', 'reason'], 'kill');
  if (typeof state.kill.engaged !== 'boolean') refuse(REASON.STORE_CORRUPT, 'kill.engaged');
  exactKeys(state.commander, ['agent_id', 'baseline_sig', 'baseline_utc', 'last_seen_sig'], 'commander');
  if (state.commander.agent_id !== null && !isAgentId(state.commander.agent_id)) refuse(REASON.STORE_CORRUPT, 'commander.agent_id');
  validateRegistry(state.agents);
  if (state.commander.agent_id !== null && !Object.hasOwn(state.agents, state.commander.agent_id)) refuse(REASON.STORE_CORRUPT, 'commander not in registry');
  assertPlain(state.grants, 'grants');
  if (Object.keys(state.grants).length > LIMITS.grants) refuse(REASON.STORE_FULL, 'grants over limit');
  for (const [k, g] of Object.entries(state.grants)) validateGrant(g, k);
  assertPlain(state.commands, 'commands');
  if (Object.keys(state.commands).length > LIMITS.commands) refuse(REASON.STORE_FULL, 'commands over limit');
  for (const [k, c] of Object.entries(state.commands)) validateCommand(c, k);
  assertPlain(state.nonces, 'nonces');
  assertPlain(state.observations, 'observations');
  if (!Array.isArray(state.rate) || !Array.isArray(state.events)) refuse(REASON.STORE_CORRUPT, 'rate/events');
  return state;
}

export function freshState(now, config = {}) {
  return {
    schema: BUS_SCHEMA, version: BUS_STATE_VERSION, created_utc: now, updated_utc: now, seq: 0,
    config: { ...DEFAULT_CONFIG, ops_enabled: [...DEFAULT_CONFIG.ops_enabled], ...config },
    kill: { engaged: false, at: null, reason: null },
    commander: { agent_id: null, baseline_sig: null, baseline_utc: null, last_seen_sig: null },
    agents: seedAgents(now), grants: {}, commands: {}, nonces: {}, observations: {}, rate: [], events: [],
  };
}

/**
 * Schema migrations, oldest first. Each takes the previous version's object
 * and returns the next version's. v1 is the first shipped format; the hook is
 * exercised by tests with a synthetic v0 so a future v2 has a proven path.
 */
export const MIGRATIONS = Object.freeze({
  0: (old, now) => {
    // Synthetic pre-release shape: { schema:'aion.bus/0', agents, grants }.
    const next = freshState(now);
    if (isPlain(old.agents)) next.agents = old.agents;
    if (isPlain(old.grants)) next.grants = old.grants;
    next.kill = { engaged: true, at: now, reason: 'migrated from v0: re-arm explicitly' };
    return next;
  },
});

export function migrate(raw, now) {
  let state = raw;
  let version = isPlain(state) && Number.isSafeInteger(state.version) ? state.version
    : (isPlain(state) && state.schema === 'aion.bus/0' ? 0 : null);
  if (version === null) refuse(REASON.SCHEMA_UNSUPPORTED, 'unrecognised bus state');
  if (version > BUS_STATE_VERSION) refuse(REASON.SCHEMA_UNSUPPORTED, `state version ${version} is newer than this code`);
  while (version < BUS_STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) refuse(REASON.SCHEMA_UNSUPPORTED, `no migration from ${version}`);
    state = step(state, now);
    version = state.version;
  }
  return validateState(state);
}

/* ------------------------------------------------------------------ store */

/** Bounded insertion-ordered maps/arrays: drop oldest. */
function trimMap(map, limit, keep = () => false) {
  const keys = Object.keys(map);
  let excess = keys.length - limit;
  for (const key of keys) {
    if (excess <= 0) break;
    if (keep(key)) continue;
    delete map[key];
    excess -= 1;
  }
}

export function createBusStore({ storage, now = () => new Date().toISOString(), key = BUS_STATE_KEY, initialConfig = {} } = {}) {
  if (!storage || typeof storage.get !== 'function' || typeof storage.set !== 'function') {
    refuse(REASON.STORE_CORRUPT, 'durable storage unavailable');
  }
  async function load() {
    const bag = await storage.get(key);
    if (!isPlain(bag)) refuse(REASON.STORE_CORRUPT, 'storage returned a non-object');
    if (!Object.hasOwn(bag, key)) return { state: freshState(now(), initialConfig), fresh: true };
    // Present-but-undefined is corruption, never "absent".
    if (bag[key] === undefined || bag[key] === null) refuse(REASON.STORE_CORRUPT, 'bus state present but empty');
    const raw = structuredClone(bag[key]);
    const migrated = raw.version === BUS_STATE_VERSION ? validateState(raw) : migrate(raw, now());
    return { state: migrated, fresh: false, migrated: raw.version !== BUS_STATE_VERSION };
  }
  function compact(state) {
    // Never prune a non-terminal command: it may hold a conversation lock or an
    // unknown outcome that someone has to reconcile.
    trimMap(state.commands, LIMITS.commands, (id) => !TERMINAL_STATES.includes(state.commands[id].state));
    if (Object.keys(state.commands).length > LIMITS.commands) refuse(REASON.STORE_FULL, 'too many unresolved commands');
    trimMap(state.nonces, LIMITS.nonces);
    trimMap(state.observations, LIMITS.observations);
    if (state.rate.length > LIMITS.rate) state.rate.splice(0, state.rate.length - LIMITS.rate);
    if (state.events.length > LIMITS.events) state.events.splice(0, state.events.length - LIMITS.events);
  }
  return {
    key,
    async read() { return structuredClone((await load()).state); },
    /**
     * Recovery from an unreadable ledger: the raw value is preserved under a
     * quarantine key (never deleted) and a fresh state is written WITH THE KILL
     * SWITCH ENGAGED, so nothing dispatches until the owner re-binds, re-grants
     * and resumes. Refuses to quarantine a ledger that is actually readable.
     */
    async quarantine(reason = 'owner reset') {
      const withLock = typeof storage.withLock === 'function' ? (fn) => storage.withLock(fn) : (fn) => fn();
      return withLock(async () => {
        let readable = false;
        try { await load(); readable = true; } catch { readable = false; }
        if (readable) refuse(REASON.BAD_VALUE, 'the bus ledger is readable; quarantine is only for an unreadable one');
        const bag = await storage.get(key);
        const at = now();
        const backupKey = `${key}.quarantine.${at.replace(/[^0-9]/g, '')}`;
        await storage.set({ [backupKey]: bag[key] ?? null });
        const fresh = freshState(at, initialConfig);
        fresh.kill = { engaged: true, at, reason: `ledger quarantined (${String(reason).slice(0, 80)}); re-bind, re-grant, then resume` };
        appendEvent(fresh, at, 'ledger.quarantined', { backup_key: backupKey });
        validateState(fresh);
        await storage.set({ [key]: fresh });
        return { backup_key: backupKey, kill: fresh.kill };
      });
    },
    /**
     * Serialized read-modify-write. `fn(draft, ctx)` mutates the draft and may
     * return a value; the write happens only if it returns without throwing.
     */
    mutate(fn) {
      const prior = gates.get(storage) ?? Promise.resolve();
      // Storage that is shared ACROSS processes (Node file storage) supplies
      // withLock so the lock spans the whole read-modify-write.
      const withLock = typeof storage.withLock === 'function' ? (fn) => storage.withLock(fn) : (fn) => fn();
      const run = prior.catch(() => {}).then(() => withLock(async () => {
        const { state } = await load();
        const draft = structuredClone(state);
        const result = await fn(draft, { now: now() });
        draft.seq += 1;
        draft.updated_utc = now();
        compact(draft);
        validateState(draft);
        const written = await storage.set({ [key]: draft });
        if (written === false) refuse(REASON.STORE_CORRUPT, 'storage write refused');
        return { result, state: structuredClone(draft) };
      }));
      gates.set(storage, run.catch(() => {}));
      return run;
    },
  };
}

/* ---------------------------------------------------------- state helpers */

export function appendEvent(state, now, event, fields = {}) {
  state.events.push({ at: now, event, ...Object.fromEntries(Object.entries(fields)
    .filter(([, v]) => v === null || ['string', 'number', 'boolean'].includes(typeof v))
    .map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 160) : v])) });
}

/** The only way a command changes state. Illegal transitions throw. */
export function transition(command, next, now, { reason = null, detail = null } = {}) {
  if (!(TRANSITIONS[command.state] ?? []).includes(next)) {
    throw new BusError(REASON.STORE_CORRUPT, `illegal transition ${command.state} -> ${next}`);
  }
  command.state = next;
  command.updated_utc = now;
  if (reason !== null) command.reason = reason;
  if (detail !== null) command.detail = String(detail).slice(0, 240);
  command.history.push({ state: next, at: now, reason });
  if (command.history.length > LIMITS.history) command.history.splice(1, command.history.length - LIMITS.history);
  return command;
}
