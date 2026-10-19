// Resolve human aliases from the existing role catalog against the REAL Bus registry.
// This module never creates bindings, guesses conversation URLs or grants send permission.
const NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const refusal = (reason) => ({ok:false, reason});
export function resolveRole(alias, catalog, registry) {
  if (typeof alias !== 'string' || !NAME.test(alias)) return refusal('INVALID_ALIAS');
  if (!Array.isArray(catalog?.roles) || !registry || typeof registry !== 'object')
    return refusal('REGISTRY_UNAVAILABLE');
  const matches = catalog.roles.filter(role => Array.isArray(role.aliases)
    && role.aliases.includes(alias));
  if (matches.length === 0) return refusal('ALIAS_UNKNOWN');
  if (matches.length !== 1) return refusal('ALIAS_AMBIGUOUS');
  const role = matches[0];
  const agents = Object.values(registry).filter(a => a?.role_id === role.id && a.kind === 'conversation');
  if (agents.length !== 1) return refusal(agents.length ? 'ROLE_AMBIGUOUS' : 'ROLE_UNBOUND');
  const agent = agents[0];
  if (agent.status !== 'bound' || !agent.binding?.ref || !agent.binding?.confirmed_by)
    return refusal('ROLE_UNBOUND');
  if (!Number.isSafeInteger(agent.revision) || agent.revision < 1) return refusal('BAD_BINDING_REVISION');
  return {ok:true, target:agent.agent_id, role_id:role.id, revision:agent.revision,
    adapter:agent.binding.adapter, ref:agent.binding.ref, confirmed_by:agent.binding.confirmed_by};
}
