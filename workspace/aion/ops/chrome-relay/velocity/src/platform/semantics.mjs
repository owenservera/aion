// AION Platform semantic overlay v1: descriptions only, NEVER execution authority.
// Existing Bus/grants/bindings/adapter methods remain the sole runtime sources.
// This module performs no I/O, sends, reads of browser pages, or ledger mutations.
export const PLATFORM_VIEW_SCHEMA = 'aion.platform.capabilities/1';
export const PLATFORM_SEED_SCHEMA = 'aion.platform.semantic-seed/0.1';
export const DESIGN_DIRECTIVE_SCHEMA = 'aion.platform.directive/0.1';

const profiles = Object.freeze({
  'chatgpt.com': Object.freeze({
    provider: 'chatgpt.com', application_family: 'ai_conversation_webapp',
    application_shape: 'conversational_thread', realization_mode: 'browser_mediated',
    kind: 'conversation', meanings: Object.freeze({
      deliver: 'conversation.send', observe: 'conversation.observe_reply'
    })
  }),
  'opencode-v2': Object.freeze({
    provider: 'opencode', application_family: 'native_agent_runtime',
    application_shape: 'coding_ide', realization_mode: 'api_native',
    kind: 'executor', meanings: Object.freeze({
      deliver: 'executor.prompt', observe: 'operation.observe'
    })
  })
});

const verbs = new Set([
  'INDEX_EVIDENCE', 'MAP_SEMANTICS', 'EVALUATE_ARCHITECTURE',
  'DECIDE_CONTRACT', 'SPECIFY_CAPABILITY', 'EMIT_BUILD_PACKET',
  'VERIFY_IMPLEMENTATION', 'PROMOTE_SPEC'
]);
const directiveKeys = Object.freeze([
  'schema', 'id', 'mode', 'verb', 'subject', 'target', 'inputs',
  'required_outputs', 'constraints', 'decision_state', 'execution_authority'
]);
const riskClasses = new Set(['READ', 'LOCAL_STATE_MUTATION', 'EXTERNAL_MUTATION']);
const protectedRisks = Object.freeze({
  'conversation.send': 'EXTERNAL_MUTATION',
  'conversation.stop_generation': 'EXTERNAL_MUTATION',
  'executor.prompt': 'EXTERNAL_MUTATION',
  'operation.dispose': 'LOCAL_STATE_MUTATION'
});
const validId = x => typeof x === 'string' && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(x) && x.length <= 96;
function record(x) {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.keys(x).every(k => {
    const d = Object.getOwnPropertyDescriptor(x, k);
    return d && Object.hasOwn(d, 'value') && !['__proto__','constructor','prototype'].includes(k);
  });
}
const result = (ok, code, extra = {}) => Object.freeze({ok, code, ...extra});
const boundedStrings = (items, max = 32) => Array.isArray(items) && items.length <= max
  && items.every(x => typeof x === 'string' && x.length > 0 && x.length <= 256 && !/[\u0000-\u001f]/.test(x));

/** Design-only directive validator. Never converts a directive into a Bus command. */
export function validateDesignDirective(directive) {
  if (!record(directive) || Object.keys(directive).length !== directiveKeys.length
    || !directiveKeys.every(k => Object.hasOwn(directive, k))) return result(false, 'INVALID_DIRECTIVE_SHAPE');
  if (directive.schema !== DESIGN_DIRECTIVE_SCHEMA || directive.mode !== 'DESIGN_ONLY'
    || directive.execution_authority !== null) return result(false, 'DESIGN_ONLY_REQUIRED');
  if (!/^APD-[0-9]{3,8}$/.test(directive.id) || !verbs.has(directive.verb)
    || !validId(directive.subject)
    || typeof directive.target !== 'string' || !directive.target || directive.target.length > 128
    || !boundedStrings(directive.inputs, 64)
    || !boundedStrings(directive.required_outputs, 32)
    || !boundedStrings(directive.constraints, 32)
    || !['PROPOSED','SOURCE_GROUNDED','DECISION_READY','DECIDED','SPECIFIED','BUILD_PACKET_READY','DEFERRED','REJECTED'].includes(directive.decision_state))
    return result(false, 'INVALID_DIRECTIVE_VALUE');
  return result(true, 'DESIGN_DIRECTIVE_VALID', {dispatchable: false});
}

/** A semantic seed is inert even when valid. Fail closed on risk and ID drift. */
export function validatePlatformSeed(seed) {
  if (!record(seed) || seed.schema !== PLATFORM_SEED_SCHEMA || seed.executable !== false)
    return result(false, 'SEED_MUST_BE_NONEXECUTABLE');
  if (!record(seed.axes) || !record(seed.provenance)
    || !Array.isArray(seed.invariants) || !Array.isArray(seed.semantic_capabilities)
    || !Array.isArray(seed.provider_examples) || !record(seed.alias_policy))
    return result(false, 'INVALID_SEED_SHAPE');
  if (seed.alias_policy.runtime_id_renames !== 'NOT_AUTHORIZED')
    return result(false, 'RUNTIME_ID_REWRITE_FORBIDDEN');
  if (seed.semantic_capabilities.length > 512 || seed.provider_examples.length > 512)
    return result(false, 'SEED_LIMIT_EXCEEDED');
  const ids = new Set();
  for (const c of seed.semantic_capabilities) {
    if (!record(c) || !validId(c.id) || ids.has(c.id) || !riskClasses.has(c.effect)
      || (Object.hasOwn(protectedRisks, c.id) && protectedRisks[c.id] !== c.effect))
      return result(false, 'INVALID_CAPABILITY_OR_RISK');
    ids.add(c.id);
  }
  const providers = new Set();
  for (const p of seed.provider_examples) {
    if (!record(p) || !validId(p.provider_id) || providers.has(p.provider_id)
      || typeof p.status !== 'string' || !Array.isArray(p.capabilities)
      || p.capabilities.some(id => !ids.has(id))) return result(false, 'INVALID_PROVIDER_EXAMPLE');
    providers.add(p.provider_id);
  }
  return result(true, 'SEED_VALID_DESIGN_ONLY', {
    dispatchable: false, semantic_capabilities: ids.size, provider_examples: providers.size
  });
}

/**
 * Derive a non-authoritative capability description ONLY from actual AION
 * adapter manifests. No donor registry, account tier, browser DOM, or grants.
 * Static declaration never becomes readiness, permission, or observed effect.
 */
export function projectAdapterSemantics(adapter) {
  const manifest = record(adapter?.manifest) ? adapter.manifest : adapter;
  const name = record(manifest) && typeof manifest.name === 'string'
    && manifest.name.length <= 64 ? manifest.name : 'unknown';
  const profile = Object.hasOwn(profiles, name) ? profiles[name] : null;
  const structurallyValid = record(manifest) && manifest.schema === 'aion.bus.adapter/1'
    && profile && manifest.kind === profile.kind && record(manifest.capabilities);
  const meanings = structurallyValid ? Object.entries(profile.meanings).map(([flag, id]) => ({
    semantic_id: id, adapter_flag: flag,
    declaration: manifest.capabilities[flag] === true ? 'IMPLEMENTED_DECLARED'
      : manifest.capabilities[flag] === false ? 'UNSUPPORTED_BY_ADAPTER' : 'UNKNOWN',
    runtime_readiness: 'NOT_OBSERVED', authority: 'NOT_ASSESSED',
    effect_observed: false
  })) : [];
  return {
    schema: 'aion.platform.provider/1', adapter: name,
    provider: structurallyValid ? profile.provider : null,
    application_family: structurallyValid ? profile.application_family : 'unknown',
    application_shape: structurallyValid ? profile.application_shape : 'unknown',
    realization_mode: structurallyValid ? profile.realization_mode : 'unknown',
    source: structurallyValid ? 'EXISTING_AION_ADAPTER_MANIFEST' : 'UNVERIFIED_OR_UNKNOWN_ADAPTER',
    capabilities: meanings, live_availability: 'NOT_OBSERVED',
    authorization: 'NOT_ASSESSED', executable_from_projection: false
  };
}

export function projectPlatformAdapters(adapters = {}) {
  if (!record(adapters) && !Array.isArray(adapters))
    throw new TypeError('adapter collection must be plain map or array');
  const entries = Array.isArray(adapters) ? adapters : Object.values(adapters);
  if (entries.length > 256) throw new RangeError('too many adapter manifests');
  const projected = entries.map(projectAdapterSemantics);
  projected.sort((a, b) => a.adapter.localeCompare(b.adapter));
  return {
    schema: PLATFORM_VIEW_SCHEMA,
    role: 'READ_ONLY_SEMANTIC_PROJECTION',
    can_authorize: false, can_dispatch: false, can_migrate_bus_state: false,
    adapters: projected
  };
}

export function inspectPlatformSeed(seed) {
  const checked = validatePlatformSeed(seed);
  if (!checked.ok) return checked;
  return result(true, 'PLATFORM_SEED_INSPECTED', {
    schema: 'aion.platform.inspect/1', edition: seed.edition ?? null,
    status: 'DESIGN_ONLY_NOT_LIVE_CAPABILITY', runtime_authority: false,
    donor_counts: seed.provenance?.counts ?? null,
    semantic_capabilities: seed.semantic_capabilities.map(c => ({
      id: c.id, effect: c.effect, status: c.status
    })),
    providers: seed.provider_examples.map(p => ({id: p.provider_id, status: p.status})),
    dispatchable: false
  });
}
