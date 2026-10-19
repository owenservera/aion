// Agent Fabric: cross-field invariants supplement JSON Schema 2020-12.
// This module never performs IO, agent dispatch, or tool authorization.
// Call a full JSON Schema validator BEFORE these semantic guards.
function fail(code){ const e=new Error(code);e.code=code;throw e; }
function obj(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function assertSchema(data,kind){
 if(!obj(data)||data.schema!==kind)fail('SCHEMA_MISMATCH');
}
function str(x){return typeof x==='string'&&x.length>0;}
function uniq(xs){return Array.isArray(xs)&&xs.length===new Set(xs).size;}
function nonblankRef(x){return str(x)&&!/(?:SECRET|PASSWORD|TOKEN)\s*=\s*[^\s]+/i.test(x);}
export function assertPortableAgent(data){
 assertSchema(data,'aion.agent-definition/1');
 const c=data.capabilities;
 if(!obj(c)||!uniq(c.allow)||!uniq(c.deny))fail('CAPABILITY_SET_INVALID');
 if(c.allow.some(x=>c.deny.includes(x)))fail('CONFLICTING_CAPABILITY_POLICY');
 if(data.mode==='subagent'&&c.allow.includes('subagent')&&data.limits?.max_child_depth===0)
   fail('SUBAGENT_DEPTH_POLICY_CONFLICT');
 if(!str(data.instruction?.sha256)||data.instruction.sha256.length!==64)
   fail('UNPINNED_AGENT_INSTRUCTIONS');
 if(!['ask','deny','pre_admission_only'].includes(data.model_policy?.fallback))
   fail('MODEL_FALLBACK_UNSPECIFIED');
 const refs=data.skills?.map(x=>x.id+'@'+x.version);
 if(!uniq(refs))fail('DUPLICATED_SKILL_VERSION');
 return data;
}
export function assertRuntimeCapabilities(data){
 assertSchema(data,'aion.runtime-capabilities/1');
 if(!obj(data.probes))fail('PROBES_MISSING');
 const required=['installed','reachable','authenticated','ready','authorized'];
 for(const name of required){
  const p=data.probes[name];
  if(!obj(p)||!['YES','NO','UNKNOWN'].includes(p.state))fail('PROBE_INVALID');
  if(p.state==='YES'&&!nonblankRef(p.evidence_ref))fail('PROBE_EVIDENCE_MISSING');
 }
 if(data.probes.ready.state==='YES'&&
   ['installed','reachable','authenticated'].some(x=>data.probes[x].state!=='YES'))
   fail('READY_WITHOUT_LIVE_EVIDENCE');
 if(data.binding?.status==='UNBOUND'&&data.probes.authorized.state==='YES')
   fail('UNBOUND_NOT_AUTHORIZED');
 return data;
}
export function assertContextPack(data){
 assertSchema(data,'aion.context-pack/1');
 if(!obj(data.audience)||!str(data.audience.principal)||!str(data.audience.project_id))fail('AUDIENCE_MISSING');
 if(!Array.isArray(data.sources)||!Array.isArray(data.omissions))fail('SOURCE_MANIFEST_INVALID');
 if(!obj(data.budget)||data.budget.estimated_used_tokens>data.budget.max_input_tokens
   ||data.budget.max_input_tokens<=0)fail('CONTEXT_BUDGET_EXCEEDED');
 if(data.sources.some(s=>s.sensitivity==='secret'&&s.included_ranges?.length))
   fail('SECRET_INCLUDED_IN_CONTEXT');
 if(data.sources.some(s=>s.trust==='contradicted'&&s.freshness!=='contradicted'))
   fail('CONTRADICTION_HIDDEN');
 if(!str(data.manifest_sha256)||data.manifest_sha256.length!==64)
   fail('CONTEXT_MANIFEST_UNPINNED');
 return data;
}
export function assertTaskHandoff(data){
 assertSchema(data,'aion.task-handoff/1');
 if(!str(data.work_ref)||!str(data.project_id)||!str(data.objective))fail('WORK_IDENTITY_INCOMPLETE');
 if(!Array.isArray(data.acceptance)||data.acceptance.length===0)fail('ACCEPTANCE_MISSING');
 if(!str(data.target_agent?.agent_definition_ref)||!str(data.target_agent?.deployment_id)
    ||!Number.isSafeInteger(data.target_agent?.binding_revision)
    ||data.target_agent.binding_revision<1)fail('TARGET_BINDING_UNPINNED');
 if(!obj(data.attempt_policy)||data.attempt_policy.retry_after_unknown_effect!==false)
   fail('UNKNOWN_EFFECT_RETRY_FORBIDDEN');
 if(data.attempt_policy.max_attempts>1&&!nonblankRef(data.attempt_policy.idempotency_key))
   fail('RETRY_WITHOUT_IDEMPOTENCY_KEY');
 if(!uniq(data.permissions?.allowed_capabilities)||!uniq(data.permissions?.allowed_resources))
   fail('PERMISSION_SCOPE_INVALID');
 return data;
}
export function assertExecutionReceipt(data){
 assertSchema(data,'aion.execution-receipt/1');
 if(data.outcome==='VERIFIED'&&
   (data.verification!=='INDEPENDENTLY_VERIFIED'||!nonblankRef(data.verifier_ref)
    ||!Array.isArray(data.evidence_refs)||data.evidence_refs.length===0))
   fail('UNSUPPORTED_VERIFIED_CLAIM');
 if(data.verification==='INDEPENDENTLY_VERIFIED'&&
   (!nonblankRef(data.verifier_ref)||!data.evidence_refs?.length))
   fail('VERIFIER_EVIDENCE_MISSING');
 if(data.outcome==='UNKNOWN'&&data.verification==='INDEPENDENTLY_VERIFIED')
   fail('UNKNOWN_CANNOT_BE_VERIFIED_COMPLETION');
 return data;
}
export function guardEnvelope(kind,value){
 const guards={
  'aion.agent-definition/1':assertPortableAgent,
  'aion.runtime-capabilities/1':assertRuntimeCapabilities,
  'aion.context-pack/1':assertContextPack,
  'aion.task-handoff/1':assertTaskHandoff,
  'aion.execution-receipt/1':assertExecutionReceipt
 };
 if(!Object.hasOwn(guards,kind))fail('UNKNOWN_ENVELOPE');
 return guards[kind](value);
}
