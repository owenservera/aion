// Track B capability projection only. Sources publish observed facts; this module
// does NOT probe Chrome/Windows/OpenCode or grant execution permission.
export const READINESS_SCHEMA = 'aion.capability/1';
export const ACTIONS = Object.freeze(['inspect', 'compose', 'submit', 'observe_reply', 'cancel']);
export const STATES = Object.freeze(['READY', 'UNVERIFIED', 'BLOCKED', 'UNKNOWN', 'STALE', 'UNSUPPORTED']);
const VALID = new Set(STATES);
const DEFAULT_TTL_MS = 2_000;

export function projectReadiness(observation, { now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError('invalid readiness clock or ttl');
  }
  const unknown = (state, reason) => ({
    schema: READINESS_SCHEMA, target: observation?.target ?? null,
    endpoint: observation?.endpoint ?? null, observed_utc: observation?.observed_utc ?? null,
    state, actions: Object.fromEntries(ACTIONS.map(action => [action, state])),
    blockers: [reason], age_ms: null
  });
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
    return unknown('UNKNOWN', 'no_observation');
  }
  if (typeof observation.target !== 'string' || !observation.target.trim()) {
    return unknown('UNKNOWN', 'target_unverified');
  }
  const observed = Date.parse(observation.observed_utc ?? '');
  if (!Number.isFinite(observed) || observed > now + 1_000) return unknown('UNKNOWN', 'invalid_observation_time');
  const age = Math.max(0, now - observed);
  if (age > ttlMs) return { ...unknown('STALE', 'observation_expired'), age_ms: age };
  if (observation.health !== 'CONNECTED') {
    return { ...unknown('UNKNOWN', 'endpoint_not_connected'), age_ms: age };
  }
  const provided = observation.actions && typeof observation.actions === 'object' && !Array.isArray(observation.actions)
    ? observation.actions : {};
  const verifiedTarget = observation.identity_verified === true;
  const granted = observation.authority === 'GRANTED';
  const actions = Object.fromEntries(ACTIONS.map(action => {
    const raw = provided[action];
    if (!VALID.has(raw)) return [action, 'UNKNOWN'];
    if (raw !== 'READY') return [action, raw];
    if (!verifiedTarget) return [action, 'UNVERIFIED'];
    if ((action === 'compose' || action === 'submit' || action === 'cancel') && !granted) {
      return [action, 'BLOCKED'];
    }
    if (action === 'submit' && observation.submit_actuation_verified !== true) {
      return [action, 'UNVERIFIED'];
    }
    return [action, 'READY'];
  }));
  const blockers = [];
  if (!verifiedTarget) blockers.push('identity_not_verified');
  if (!granted) blockers.push('grant_required');
  if (actions.submit === 'UNVERIFIED') blockers.push('submit_actuation_unverified');
  return {
    schema: READINESS_SCHEMA, target: observation.target,
    endpoint: observation.endpoint ?? null, observed_utc: observation.observed_utc,
    state: actions.submit === 'READY' ? 'READY' : 'UNVERIFIED',
    actions, blockers, age_ms: age
  };
}
