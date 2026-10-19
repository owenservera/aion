// AION Bus — command validation, guards C3–C8 (C1/C2 are grammar + watcher).
//
// Pure: given the ledger state, a parsed command and the registered adapters,
// return an accept decision or a machine-readable refusal. No I/O, no clock of
// its own, no side effects. The bus applies the decision inside one durable
// write so validation and reservation cannot be separated by a crash.

import { AGENT_KIND, AGENT_STATUS, REASON } from './contracts.js';
import { selectGrant } from './grants.js';

const HOUR_MS = 3600 * 1000;

export function recentDispatches(state, agentId, now) {
  const since = Date.parse(now) - HOUR_MS;
  return state.rate.filter((r) => r.agent_id === agentId && Date.parse(r.at) > since).length;
}

/** Is `agentId` commandable right now, and through which adapter? */
export function targetProblem(state, agentId, op, adapters) {
  if (!agentId || !Object.hasOwn(state.agents, agentId)) return { reason: REASON.UNKNOWN_AGENT, detail: `no agent ${agentId}` };
  const agent = state.agents[agentId];
  if (agent.kind === AGENT_KIND.OWNER) return { reason: REASON.AGENT_NOT_COMMANDABLE, detail: 'the owner is not a target' };
  if (agent.status === AGENT_STATUS.RETIRED) return { reason: REASON.AGENT_RETIRED, detail: `${agentId} is retired` };
  if (agent.status === AGENT_STATUS.PAUSED) return { reason: REASON.AGENT_PAUSED, detail: `${agentId} is paused` };
  if (agent.status !== AGENT_STATUS.BOUND || !agent.binding) return { reason: REASON.AGENT_UNBOUND, detail: `${agentId} has no owner-confirmed binding` };
  if (!agent.ops.includes(op)) return { reason: REASON.AGENT_NOT_COMMANDABLE, detail: `${agentId} does not accept ${op}` };
  const adapter = adapters?.[agent.binding.adapter];
  if (!adapter) return { reason: REASON.NO_ADAPTER, detail: `adapter ${agent.binding.adapter} is not loaded` };
  if (adapter.manifest.kind !== agent.kind) return { reason: REASON.NO_ADAPTER, detail: `adapter ${adapter.manifest.name} serves ${adapter.manifest.kind}, agent is ${agent.kind}` };
  if (op === 'cancel' && !adapter.manifest.capabilities.cancel) return { reason: REASON.OP_NOT_SUPPORTED, detail: `${adapter.manifest.name} cannot cancel` };
  return null;
}

/**
 * Validate one parsed owner command. Returns
 *   { ok:true, agent_id, grant_id, adapter } or { ok:false, reason, detail }.
 * `status` with no `to` targets the commander (it is answered by a report).
 */
export function validateParsed(state, parsed, { adapters, now }) {
  const reject = (reason, detail) => ({ ok: false, reason, detail });
  if (state.kill.engaged) return reject(REASON.KILL_ENGAGED, state.kill.reason ?? 'kill switch engaged');
  if (!state.config.ops_enabled.includes(parsed.op)) return reject(REASON.OP_NOT_ENABLED, `op ${parsed.op} is not enabled`);
  if (Object.hasOwn(state.nonces, parsed.nonce)) return reject(REASON.NONCE_REPLAYED, 'nonce already used');
  const commanderId = state.commander.agent_id;
  // Chat-turn commands already proved they came from the commander (ingest).
  // Structured ingress (CLI/MCP) may target executors with no commander at
  // all; only `status` (answered INTO the commander) needs one here.

  if (parsed.op === 'status') {
    if (!commanderId) return reject(REASON.NO_COMMANDER, 'status is answered into the commander; none is designated');
    if (parsed.to !== null && !Object.hasOwn(state.agents, parsed.to)) return reject(REASON.UNKNOWN_AGENT, `no agent ${parsed.to}`);
    // A status answer is a report into the commander: it needs report authority.
    const problem = targetProblem(state, commanderId, 'send', adapters);
    if (problem) return reject(problem.reason, `commander: ${problem.detail}`);
    const grant = selectGrant(state, commanderId, 'send', now);
    if (!grant.ok) return reject(grant.reason, `report to commander: ${grant.detail}`);
    return { ok: true, agent_id: commanderId, grant_id: grant.grant.grant_id, adapter: state.agents[commanderId].binding.adapter };
  }

  if (commanderId && parsed.to === commanderId) return reject(REASON.AGENT_NOT_COMMANDABLE, 'the commander does not command itself');
  const problem = targetProblem(state, parsed.to, parsed.op, adapters);
  if (problem) return reject(problem.reason, problem.detail);
  const adapter = adapters[state.agents[parsed.to].binding.adapter];
  if (parsed.op === 'send' && parsed.text.length > adapter.manifest.capabilities.max_text_chars) {
    return reject(REASON.TEXT_TOO_LONG, `adapter accepts at most ${adapter.manifest.capabilities.max_text_chars} chars`);
  }
  const grant = selectGrant(state, parsed.to, parsed.op, now);
  if (!grant.ok) return reject(grant.reason, grant.detail);
  const limit = Math.min(state.config.rate_per_agent_per_hour, grant.grant.rate_per_hour);
  if (recentDispatches(state, parsed.to, now) >= limit) return reject(REASON.RATE_LIMITED, `${parsed.to} reached ${limit}/hour`);
  if (parsed.op === 'send' && adapter.manifest.capabilities.concurrency === 1) {
    const busy = Object.values(state.commands).some((c) => c.to === parsed.to && c.op !== 'status'
      && ['RESERVED', 'DISPATCHED', 'SUBMISSION_OBSERVED', 'UNRESOLVED'].includes(c.state));
    if (busy) {
      return reject(adapter.manifest.kind === AGENT_KIND.EXECUTOR ? REASON.EXECUTOR_BUSY : REASON.TARGET_BUSY,
        `${parsed.to} has an unresolved command; nothing is queued or re-sent`);
    }
  }
  return { ok: true, agent_id: parsed.to, grant_id: grant.grant.grant_id, adapter: adapter.manifest.name };
}
