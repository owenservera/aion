export const PRIMARY = Object.freeze({ providerID: 'openai', id: 'gpt-6.1-sol', variant: 'medium' });
export const FALLBACK = Object.freeze({ providerID: 'opencode', id: 'minimax-m3.1-flash-free' });
const stages = new Set(['primary', 'intent', 'waiting', 'reconcile', 'switching', 'switched', 'admitting', 'confirmed', 'stopped']);
const sid = value => typeof value === 'string' && /^ses[a-zA-Z0-9_-]{1,120}$/.test(value);
const same = (a, b) => a?.providerID === b.providerID && a?.id === b.id;

// Only adapter-verified structured provider codes qualify. Raw provider messages never persist.
export function classify(model, error, verifiedCodes = []) {
  if (!error || typeof error.message !== 'string') return 'unknown';
  if (error.status === 401 || error.status === 403 || error.type === 'provider.auth') return 'auth';
  if (error.type === 'provider.context-overflow') return 'context';
  let code;
  try { code = JSON.parse(error.message).error?.code; } catch { /* Plain messages are not structured evidence. */ }
  if (typeof code === 'string' && verifiedCodes.some(rule =>
    rule.providerID === model?.providerID && rule.code === code &&
    typeof rule.source === 'string' && rule.source.startsWith('https://'))) return 'quota';
  if (error.status === 429) return 'throttle';
  if (error.type === 'provider.invalid-request') return 'invalid';
  return 'unavailable';
}

function valid(record, projectID, rootID) {
  if (!record || record.version !== 1 || record.projectID !== projectID || record.rootID !== rootID ||
      !['primary', 'fallback', 'stopped'].includes(record.mode) || !record.sessions ||
      Object.getPrototypeOf(record.sessions) !== Object.prototype ||
      !Object.hasOwn(record.sessions, rootID)) throw new Error('invalid_state');
  for (const [id, value] of Object.entries(record.sessions)) {
    if (!sid(id) || !value || !stages.has(value.stage) ||
        (id !== rootID && !sid(value.parentID))) throw new Error('invalid_state');
    const seen = new Set([id]);
    let parent = value.parentID;
    while (parent) {
      if (seen.has(parent) || !record.sessions[parent]) throw new Error('invalid_state');
      seen.add(parent); parent = record.sessions[parent].parentID;
    }
    if (id !== rootID && !seen.has(rootID)) throw new Error('invalid_state');
  }
  return record;
}

/** Staging port, NOT an OpenCode plugin. One host owner must serialize all calls through this object.
 * store.get/set must be durable, atomic and exclusively owned. A thrown write poisons this instance.
 * host.inspectSafe must hold a dispatch fence through switch/admission and return minimized evidence.
 * host capability flags are a review gate, not runtime feature detection or proof of host support.
 */
export class Supervisor {
  constructor({ store, host, projectID, rootID, verifiedCodes = [] }) {
    if (!sid(rootID) || typeof projectID !== 'string' || !projectID) throw new Error('invalid_scope');
    Object.assign(this, { store, host, projectID, rootID, verifiedCodes });
    this.key = `failover/v1/${encodeURIComponent(projectID)}/${rootID}`;
    this.tail = Promise.resolve();
    this.poisoned = false;
  }
  exclusive(fn) {
    const run = this.tail.then(async () => {
      if (this.poisoned) throw new Error('supervisor_disabled');
      try { return await fn(); } catch {
        this.poisoned = true;
        // Fixed code only: thrown stores/providers may contain credentials or prompt text.
        this.host.notice({ rootID: this.rootID, reason: 'supervisor_disabled' });
        throw new Error('supervisor_disabled');
      }
    });
    this.tail = run.catch(() => {});
    return run;
  }
  async load() { return valid(await this.store.get(this.key), this.projectID, this.rootID); }
  async save(record) {
    valid(record, this.projectID, this.rootID);
    await this.store.set(this.key, structuredClone(record));
  }
  async stop(record, reason) {
    record.mode = 'stopped';
    for (const value of Object.values(record.sessions)) value.stage = 'stopped';
    record.reason = reason;
    await this.save(record);
    this.host.notice({ rootID: this.rootID, reason });
    return 'stopped';
  }
  initialize() {
    return this.exclusive(async () => {
      const existing = await this.store.get(this.key);
      if (existing !== undefined) return valid(existing, this.projectID, this.rootID);
      const root = await this.host.identity(this.rootID);
      if (root?.id !== this.rootID || root.projectID !== this.projectID || root.parentID) throw new Error('scope');
      const record = { version: 1, projectID: this.projectID, rootID: this.rootID,
        mode: 'primary', sessions: { [this.rootID]: { stage: 'primary' } } };
      await this.save(record);
      return record;
    });
  }
  enroll(sessionID) {
    return this.exclusive(async () => {
      const record = await this.load();
      if (!sid(sessionID)) throw new Error('scope');
      const info = await this.host.identity(sessionID);
      if (info?.id !== sessionID || info.projectID !== this.projectID ||
          !Object.hasOwn(record.sessions, info.parentID)) throw new Error('scope');
      if (record.mode === 'stopped') return 'stopped';
      if (!Object.hasOwn(record.sessions, sessionID)) {
        record.sessions[sessionID] = { parentID: info.parentID,
          stage: record.mode === 'fallback' ? 'intent' : 'primary' };
        await this.save(record);
      }
      return record.mode;
    });
  }
  retry(event) {
    return this.exclusive(async () => {
      const record = await this.load();
      if (!Object.hasOwn(record.sessions, event.sessionID)) return 'outside_scope';
      const info = await this.host.identity(event.sessionID);
      if (info?.id !== event.sessionID || info.projectID !== this.projectID ||
          info.parentID !== record.sessions[event.sessionID].parentID) throw new Error('scope');
      if (record.mode === 'stopped') { event.decision = { retry: false }; return 'stopped'; }
      if (record.mode === 'fallback') {
        event.decision = { retry: false };
        if (same(event.model, PRIMARY) && ['intent', 'waiting', 'reconcile', 'switching', 'switched'].includes(record.sessions[event.sessionID].stage))
          return 'intent';
        if (same(event.model, FALLBACK)) return this.stop(record, 'fallback_unavailable');
        return this.stop(record, 'model_override');
      }
      if (!same(event.model, PRIMARY) || classify(event.model, event.error, this.verifiedCodes) !== 'quota') return 'ignored';
      event.decision = { retry: false };
      record.mode = 'fallback';
      for (const value of Object.values(record.sessions)) value.stage = 'intent';
      await this.save(record);
      return 'intent';
    }).catch(() => { event.decision = { retry: false }; throw new Error('supervisor_disabled'); });
  }
  // Invoke independently from the host after retry returns; never await terminal inside its hook.
  recover() {
    return this.exclusive(async () => {
      const record = await this.load();
      if (record.mode !== 'fallback') return record.mode;
      if (this.host.capabilities?.dispatchFence !== true || this.host.capabilities?.futureChildren !== true)
        return this.stop(record, 'host_contract_unverified');
      for (const [sessionID, state] of Object.entries(record.sessions)) {
        if (state.stage === 'confirmed') continue;
        // No transport retry after an uncertain admission: at most one submit per session.
        if (state.stage === 'admitting') return this.stop(record, 'admission_ambiguous');
        state.stage = 'waiting'; await this.save(record);
        const evidence = await this.host.inspectSafe(sessionID);
        if (evidence?.terminal !== true) return this.stop(record, 'terminal_unproven');
        state.stage = 'reconcile'; await this.save(record);
        if (evidence.projectID !== this.projectID || evidence.rootID !== this.rootID ||
            evidence.sessionID !== sessionID || evidence.toolsSettled !== true ||
            evidence.inboxEmpty !== true || evidence.sideEffectsKnown !== true)
          return this.stop(record, 'reconciliation_unsafe');
        state.stage = 'switching'; await this.save(record);
        await this.host.switchModel({ sessionID, model: { ...FALLBACK } });
        const info = await this.host.identity(sessionID);
        if (info?.id !== sessionID || info.projectID !== this.projectID || !same(info.model, FALLBACK))
          return this.stop(record, 'switch_unconfirmed');
        state.stage = 'switched'; await this.save(record);
        state.stage = 'admitting'; await this.save(record);
        // This is a continuation, never a replay of the original prompt or any tool invocation.
        const ack = await this.host.admitRecovery({ sessionID,
          text: 'Continue the existing task from its recorded context and partial work. Do not replay completed tools. If any previous side effect is uncertain, stop and request owner review.' });
        if (ack?.admitted !== true) return this.stop(record, 'admission_ambiguous');
        state.stage = 'confirmed'; await this.save(record);
      }
      return 'confirmed';
    });
  }
}
