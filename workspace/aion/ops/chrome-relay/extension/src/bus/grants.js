// AION Bus — scoped owner grants (C5).
//
// A grant is the traceable owner authority a command acts under: which agents,
// which ops, how many sends, how fast, until when, and (for executors) which
// working directory. Counts are consumed INSIDE the same durable write that
// reserves the command, so a crash between "decrement" and "dispatch" can lose
// a send but can never replenish one.

import { GRANT_ID, OPS, REASON, isAgentId, isUtc, refuse } from './contracts.js';
import { validateGrant } from './ledger.js';

export function createGrant(state, input, now) {
  const grant = {
    grant_id: input.grant_id,
    ref: input.ref,
    agents: [...new Set(input.agents ?? [])],
    ops: [...new Set(input.ops ?? ['send'])],
    max_count: input.max_count,
    used_count: 0,
    rate_per_hour: input.rate_per_hour ?? 10,
    expires_utc: input.expires_utc,
    created_utc: now,
    revoked: false,
    cwd: input.cwd ?? null,
  };
  if (typeof grant.grant_id !== 'string' || !GRANT_ID.test(grant.grant_id)) refuse(REASON.BAD_VALUE, 'grant_id shape');
  if (Object.hasOwn(state.grants, grant.grant_id)) refuse(REASON.BAD_VALUE, `grant ${grant.grant_id} exists; grants are never overwritten`);
  if (grant.agents.some((a) => !isAgentId(a) || !Object.hasOwn(state.agents, a))) refuse(REASON.UNKNOWN_AGENT, 'grant names an unknown agent');
  if (grant.ops.some((op) => !OPS.includes(op))) refuse(REASON.BAD_VALUE, 'grant op');
  if (!isUtc(grant.expires_utc) || Date.parse(grant.expires_utc) <= Date.parse(now)) refuse(REASON.BAD_VALUE, 'grant must expire in the future');
  validateGrant(grant, grant.grant_id);
  state.grants[grant.grant_id] = grant;
  return grant;
}

export function revokeGrant(state, grantId) {
  const grant = state.grants[grantId];
  if (!grant) refuse(REASON.NO_GRANT, `no grant ${String(grantId).slice(0, 64)}`);
  grant.revoked = true;
  return grant;
}

/**
 * The best usable grant for (agent, op), or the most informative refusal.
 * Soonest-expiring usable grant wins, so long-lived grants are spent last.
 */
export function selectGrant(state, agentId, op, now) {
  const t = Date.parse(now);
  const covering = Object.values(state.grants).filter((g) => g.agents.includes(agentId) && g.ops.includes(op));
  if (covering.length === 0) {
    return { ok: false, reason: Object.keys(state.grants).length ? REASON.GRANT_SCOPE : REASON.NO_GRANT,
      detail: `no grant covers ${op} to ${agentId}` };
  }
  const live = covering.filter((g) => !g.revoked && Date.parse(g.expires_utc) > t);
  if (live.length === 0) return { ok: false, reason: REASON.GRANT_EXPIRED, detail: 'every covering grant is expired or revoked' };
  const usable = live.filter((g) => g.used_count < g.max_count);
  if (usable.length === 0) return { ok: false, reason: REASON.GRANT_EXHAUSTED, detail: 'every covering grant is used up' };
  usable.sort((a, b) => Date.parse(a.expires_utc) - Date.parse(b.expires_utc));
  return { ok: true, grant: usable[0] };
}

/** Consume one unit. Called only inside the reserving mutation. */
export function consumeGrant(state, grantId) {
  const grant = state.grants[grantId];
  if (!grant || grant.used_count >= grant.max_count) refuse(REASON.GRANT_EXHAUSTED, 'grant changed under reservation');
  grant.used_count += 1;
  return grant;
}
