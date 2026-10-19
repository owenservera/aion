// AION Bus — agent registry and genealogy (BUS-V1-V2-DESIGN §1.3, DECISION §6).
//
// Pure functions over a plain `{ [agent_id]: agent }` map. Persistence lives in
// ledger.js; this module only decides what a valid registry is.
//
// An agent is a REGISTRY ENTRY, not a running process. A bound conversation
// agent is an open browser conversation that answers only when spoken to; it
// is never presented as thinking while idle.

import {
  AGENT_KIND, AGENT_STATUS, OPS, REASON, BusError, assertPlain, exactKeys, isAgentId, isPlain, isUtc, refuse,
} from './contracts.js';

export const AGENT_FIELDS = Object.freeze([
  'agent_id', 'parent_agent_id', 'name', 'kind', 'role_id', 'status', 'binding', 'ops', 'revision',
  'created_utc', 'updated_utc',
]);
export const BINDING_FIELDS = Object.freeze(['adapter', 'ref', 'label', 'bound_utc', 'confirmed_by']);
export const MAX_AGENTS = 256;

function bad(detail) { return new BusError(REASON.STORE_CORRUPT, detail); }

export function validateBinding(binding) {
  if (binding === null) return null;
  exactKeys(binding, BINDING_FIELDS, 'binding');
  if (!/^[a-z0-9][a-z0-9.-]{1,63}$/.test(binding.adapter)) throw bad('binding.adapter');
  if (typeof binding.ref !== 'string' || binding.ref.length < 1 || binding.ref.length > 2048) throw bad('binding.ref');
  if (binding.label !== null && (typeof binding.label !== 'string' || binding.label.length > 120)) throw bad('binding.label');
  if (!isUtc(binding.bound_utc)) throw bad('binding.bound_utc');
  if (typeof binding.confirmed_by !== 'string' || binding.confirmed_by.length < 1 || binding.confirmed_by.length > 128) throw bad('binding.confirmed_by');
  return binding;
}

export function validateAgent(agent, key) {
  exactKeys(agent, AGENT_FIELDS, `agent ${String(key).slice(0, 64)}`);
  if (!isAgentId(agent.agent_id) || agent.agent_id !== key) throw bad('agent_id / key mismatch');
  if (agent.parent_agent_id !== null && !isAgentId(agent.parent_agent_id)) throw bad('parent_agent_id');
  if (typeof agent.name !== 'string' || agent.name.length < 1 || agent.name.length > 120) throw bad('name');
  if (!Object.values(AGENT_KIND).includes(agent.kind)) throw bad('kind');
  if (agent.role_id !== null && (typeof agent.role_id !== 'string' || !/^[0-9A-Za-z-]{1,16}$/.test(agent.role_id))) throw bad('role_id');
  if (!Object.values(AGENT_STATUS).includes(agent.status)) throw bad('status');
  validateBinding(agent.binding);
  if (agent.status === AGENT_STATUS.BOUND && agent.binding === null) throw bad('bound agent without binding');
  if (agent.status === AGENT_STATUS.UNBOUND && agent.binding !== null) throw bad('unbound agent with binding');
  if (agent.kind === AGENT_KIND.OWNER && (agent.binding !== null || agent.ops.length)) throw bad('owner is not commandable');
  if (!Array.isArray(agent.ops) || agent.ops.length > OPS.length || agent.ops.some((op) => !OPS.includes(op))
    || new Set(agent.ops).size !== agent.ops.length) throw bad('ops');
  if (!Number.isSafeInteger(agent.revision) || agent.revision < 1) throw bad('revision');
  if (!isUtc(agent.created_utc) || !isUtc(agent.updated_utc)) throw bad('timestamps');
  return agent;
}

/**
 * Genealogy: exactly one owner root (parent null), every other agent has an
 * existing parent, no cycles, nothing has a conversation/executor as root.
 * Returns problems instead of throwing so the panel can render them.
 */
export function genealogyProblems(agents) {
  const problems = [];
  const ids = Object.keys(agents);
  const roots = ids.filter((id) => agents[id].parent_agent_id === null);
  if (roots.length !== 1) problems.push(`expected exactly one root, found ${roots.length}`);
  for (const id of roots) if (agents[id].kind !== AGENT_KIND.OWNER) problems.push(`root ${id} is not an owner`);
  for (const id of ids) {
    const agent = agents[id];
    if (agent.kind === AGENT_KIND.OWNER && agent.parent_agent_id !== null) problems.push(`owner ${id} has a parent`);
    if (agent.parent_agent_id !== null && !Object.hasOwn(agents, agent.parent_agent_id)) problems.push(`orphan ${id}: parent ${agent.parent_agent_id} missing`);
    if (agent.parent_agent_id === id) problems.push(`self-parent ${id}`);
  }
  // Cycle detection: walk up from each node with a step bound.
  for (const id of ids) {
    const seen = new Set([id]);
    let cursor = agents[id].parent_agent_id;
    while (cursor !== null && Object.hasOwn(agents, cursor)) {
      if (seen.has(cursor)) { problems.push(`cycle through ${id}`); break; }
      seen.add(cursor);
      cursor = agents[cursor].parent_agent_id;
    }
  }
  return [...new Set(problems)];
}

export function validateRegistry(agents) {
  assertPlain(agents, 'agents');
  const ids = Object.keys(agents);
  if (ids.length > MAX_AGENTS) throw new BusError(REASON.STORE_FULL, 'agent registry over limit');
  for (const id of ids) validateAgent(agents[id], id);
  const problems = genealogyProblems(agents);
  if (problems.length) throw bad(`genealogy: ${problems.join('; ')}`);
  // One binding target cannot be two agents: a message addressed to one agent
  // must never land in another agent's conversation.
  const refs = new Map();
  for (const id of ids) {
    const b = agents[id].binding;
    if (!b || agents[id].status === AGENT_STATUS.RETIRED) continue;
    const k = `${b.adapter}\u0000${b.ref}`;
    if (refs.has(k)) throw bad(`binding shared by ${refs.get(k)} and ${id}`);
    refs.set(k, id);
  }
  return agents;
}

export function makeAgent({ agent_id, parent_agent_id, name, kind, role_id = null, ops = null }, now) {
  const defaultOps = kind === AGENT_KIND.OWNER ? [] : ['send', 'status'];
  return { agent_id, parent_agent_id, name, kind, role_id, status: AGENT_STATUS.UNBOUND, binding: null,
    ops: ops ?? defaultOps, revision: 1, created_utc: now, updated_utc: now };
}

/**
 * The seed registry: the genealogy written in DECISION-2026-10-19 §6, which the
 * owner has NOT confirmed. Every agent starts UNBOUND; binding requires an
 * explicit owner action naming the conversation or executor.
 */
export function seedAgents(now) {
  const list = [
    { agent_id: 'owen', parent_agent_id: null, name: 'Owen (owner)', kind: AGENT_KIND.OWNER },
    { agent_id: 'aion', parent_agent_id: 'owen', name: 'AION (CEO / oracle)', kind: AGENT_KIND.CONVERSATION },
    { agent_id: 'aion-pm', parent_agent_id: 'aion', name: 'AION PM', kind: AGENT_KIND.CONVERSATION },
    { agent_id: 'aion-bff', parent_agent_id: 'aion', name: 'AION BFF (Grok Bot)', kind: AGENT_KIND.CONVERSATION },
    { agent_id: 'role-05', parent_agent_id: 'owen', name: '05 Chief of Chiefs', kind: AGENT_KIND.CONVERSATION, role_id: '05' },
    ...[['01', 'Dashboard & Tracking'], ['02', 'Long-term Planning'], ['03', 'Chief of Staff'], ['04', 'OpenCode Output & Efficiency'],
      ['06', 'TOOLSMITH'], ['07', 'Intake'], ['08', 'Z-FORGE']].map(([id, name]) => ({
      agent_id: `role-${id}`, parent_agent_id: 'role-05', name: `${id} ${name}`, kind: AGENT_KIND.CONVERSATION, role_id: id })),
    { agent_id: 'opencode', parent_agent_id: 'owen', name: 'OpenCode (Windows executor)', kind: AGENT_KIND.EXECUTOR, ops: ['send', 'status', 'cancel'] },
  ];
  const agents = {};
  for (const entry of list) agents[entry.agent_id] = makeAgent(entry, now);
  return validateRegistry(agents);
}

/* -------------------------------------------------------- pure mutations */

function clone(agents) { return structuredClone(agents); }
function touch(agent, now) { agent.revision += 1; agent.updated_utc = now; return agent; }
function need(agents, id) {
  if (!isAgentId(id) || !Object.hasOwn(agents, id)) refuse(REASON.UNKNOWN_AGENT, `no agent ${String(id).slice(0, 64)}`);
  return agents[id];
}

export function addAgent(agents, input, now) {
  if (!isPlain(input)) refuse(REASON.BAD_VALUE, 'agent input must be an object');
  if (!isAgentId(input.agent_id)) refuse(REASON.BAD_VALUE, 'agent_id shape');
  if (Object.hasOwn(agents, input.agent_id)) refuse(REASON.BAD_VALUE, `agent ${input.agent_id} exists`);
  if (input.kind === AGENT_KIND.OWNER) refuse(REASON.BAD_VALUE, 'only one owner root exists');
  const next = clone(agents);
  next[input.agent_id] = makeAgent({ agent_id: input.agent_id, parent_agent_id: input.parent_agent_id ?? null,
    name: input.name, kind: input.kind, role_id: input.role_id ?? null, ops: input.ops ?? null }, now);
  if (next[input.agent_id].parent_agent_id && next[next[input.agent_id].parent_agent_id]?.status === AGENT_STATUS.RETIRED) {
    refuse(REASON.AGENT_RETIRED, 'cannot add a child under a retired agent');
  }
  return validateRegistry(next);
}

export function reparentAgent(agents, id, parent, now) {
  const next = clone(agents);
  const agent = need(next, id);
  if (agent.kind === AGENT_KIND.OWNER) refuse(REASON.BAD_VALUE, 'owner cannot be reparented');
  need(next, parent);
  agent.parent_agent_id = parent;
  touch(agent, now);
  return validateRegistry(next);
}

/** Bind an agent to an adapter target. The adapter has already canonicalised `ref`. */
export function bindAgent(agents, id, { adapter, ref, label = null, confirmed_by }, now) {
  const next = clone(agents);
  const agent = need(next, id);
  if (agent.kind === AGENT_KIND.OWNER) refuse(REASON.AGENT_NOT_COMMANDABLE, 'owner cannot be bound');
  if (agent.status === AGENT_STATUS.RETIRED) refuse(REASON.AGENT_RETIRED, `${id} is retired`);
  agent.binding = { adapter, ref, label, bound_utc: now, confirmed_by };
  agent.status = agent.status === AGENT_STATUS.PAUSED ? AGENT_STATUS.PAUSED : AGENT_STATUS.BOUND;
  touch(agent, now);
  return validateRegistry(next);
}

export function unbindAgent(agents, id, now) {
  const next = clone(agents);
  const agent = need(next, id);
  if (agent.status === AGENT_STATUS.RETIRED) refuse(REASON.AGENT_RETIRED, `${id} is retired`);
  agent.binding = null;
  agent.status = AGENT_STATUS.UNBOUND;
  touch(agent, now);
  return validateRegistry(next);
}

export function setPaused(agents, id, paused, now) {
  const next = clone(agents);
  const agent = need(next, id);
  if (agent.status === AGENT_STATUS.RETIRED) refuse(REASON.AGENT_RETIRED, `${id} is retired`);
  if (agent.kind === AGENT_KIND.OWNER) refuse(REASON.AGENT_NOT_COMMANDABLE, 'owner cannot be paused');
  agent.status = paused ? AGENT_STATUS.PAUSED : (agent.binding ? AGENT_STATUS.BOUND : AGENT_STATUS.UNBOUND);
  touch(agent, now);
  return validateRegistry(next);
}

/** Retire never deletes: history and genealogy stay intact. */
export function retireAgent(agents, id, now) {
  const next = clone(agents);
  const agent = need(next, id);
  if (agent.kind === AGENT_KIND.OWNER) refuse(REASON.BAD_VALUE, 'owner cannot be retired');
  agent.status = AGENT_STATUS.RETIRED;
  touch(agent, now);
  return validateRegistry(next);
}

/* ---------------------------------------------------------------- queries */

export function lineage(agents, id) {
  const chain = [];
  let cursor = need(agents, id).parent_agent_id;
  while (cursor !== null && chain.length < MAX_AGENTS) { chain.push(cursor); cursor = agents[cursor].parent_agent_id; }
  return chain;
}
export function childrenOf(agents, id) {
  return Object.keys(agents).filter((k) => agents[k].parent_agent_id === id).sort();
}
/** Indented text tree for panels, CLI and reports. Status is shown, never inferred. */
export function renderTree(agents) {
  const root = Object.keys(agents).find((k) => agents[k].parent_agent_id === null);
  if (!root) return '(no root)';
  const out = [];
  const walk = (id, depth) => {
    const a = agents[id];
    const bound = a.binding ? ` -> ${a.binding.adapter}:${a.binding.label ?? a.binding.ref}` : '';
    out.push(`${'  '.repeat(depth)}${id} [${a.kind}/${a.status}]${bound}`);
    for (const child of childrenOf(agents, id)) walk(child, depth + 1);
  };
  walk(root, 0);
  return out.join('\n');
}
