import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATFORM_SEED_SCHEMA, DESIGN_DIRECTIVE_SCHEMA,
  projectAdapterSemantics, projectPlatformAdapters,
  validateDesignDirective, validatePlatformSeed, inspectPlatformSeed
} from '../src/platform/semantics.mjs';
import {runPlatformInspect} from '../src/platform/inspect.mjs';

const chat = () => ({manifest:{schema:'aion.bus.adapter/1',name:'chatgpt.com',
  kind:'conversation',capabilities:{deliver:true,observe:true,cancel:false,live_verified:true},
  authority:'GRANTED',is_open:true,private_token:'must never print'}});
const native = () => ({manifest:{schema:'aion.bus.adapter/1',name:'opencode-v2',
  kind:'executor',capabilities:{deliver:true,observe:true,cancel:true}}});
const seed = () => ({schema:PLATFORM_SEED_SCHEMA, executable:false,edition:'example',
  axes:{provider_family:['ai_conversation_webapp'],application_shape:['conversational_thread'],realization_mode:['browser_mediated']},provenance:{counts:{total_records:2}},
  invariants:['Never dispatch from seed'], alias_policy:{runtime_id_renames:'NOT_AUTHORIZED',taxonomy_aliases:{ai_chat_webapp:'ai_conversation_webapp'}},
  semantic_capabilities:[
    {id:'conversation.send',effect:'EXTERNAL_MUTATION',status:'DESIGN'},
    {id:'conversation.observe_reply',effect:'READ',status:'DESIGN'},
    {id:'executor.prompt',effect:'EXTERNAL_MUTATION',status:'DESIGN'},
    {id:'operation.dispose',effect:'LOCAL_STATE_MUTATION',status:'DESIGN'}
  ],provider_examples:[{provider_id:'chatgpt.com',application_family:'ai_conversation_webapp',application_shape:'conversational_thread',realization_mode:'browser_mediated',status:'DONOR_ONLY',capabilities:[]}]});
const directive = () => ({schema:DESIGN_DIRECTIVE_SCHEMA,id:'APD-001',mode:'DESIGN_ONLY',
  verb:'SPECIFY_CAPABILITY',subject:'conversation.send',target:'track-b/semantic-contracts',
  inputs:['VF-0005'],required_outputs:['implementation packet'],constraints:['NO_LIVE_EFFECT'],
  decision_state:'PROPOSED',execution_authority:null});

test('design seed remains inert and reports finite reviewable semantic IDs', () => {
  const s=seed(),v=validatePlatformSeed(s);
  assert.equal(v.ok,true);assert.equal(v.dispatchable,false);
  assert.equal(v.semantic_capabilities,4);
  const i=inspectPlatformSeed(s);
  assert.equal(i.ok,true);assert.equal(i.runtime_authority,false);
  assert.equal(i.providers[0].status,'DONOR_ONLY');
});
test('invalid seed or executable seed is rejected',()=>{
  assert.equal(validatePlatformSeed({...seed(),executable:true}).ok,false);
  assert.equal(validatePlatformSeed({...seed(),schema:'aion.bus/1'}).ok,false);
  assert.equal(validatePlatformSeed({...seed(),alias_policy:{runtime_id_renames:'ALLOWED'}}).ok,false);
});
test('legacy family aliases are explicit and provider records cannot drift to old names',()=>{
  const old=seed();old.provider_examples[0].application_family='ai_chat_webapp';
  assert.equal(validatePlatformSeed(old).code,'INVALID_PROVIDER_EXAMPLE');
  const wrong=seed();wrong.alias_policy.taxonomy_aliases.ai_chat_webapp='unknown_family';
  assert.equal(validatePlatformSeed(wrong).code,'INVALID_TAXONOMY_ALIASES');
});
test('unknown mutation risk cannot become READ and protected risk cannot be downgraded',()=>{
  const bad=seed();bad.semantic_capabilities[0].effect='READ';
  assert.equal(validatePlatformSeed(bad).code,'INVALID_CAPABILITY_OR_RISK');
  const unknown=seed();unknown.semantic_capabilities.push({id:'page.click',effect:'UNKNOWN',status:'DESIGN'});
  assert.equal(validatePlatformSeed(unknown).code,'INVALID_CAPABILITY_OR_RISK');
});
test('duplicate or nonexistent semantic references cannot pass seed validation',()=>{
  const duplicate=seed();duplicate.semantic_capabilities.push({...duplicate.semantic_capabilities[0]});
  assert.equal(validatePlatformSeed(duplicate).ok,false);
  const unsupported=seed();unsupported.provider_examples[0].capabilities=['not.a.capability'];
  assert.equal(validatePlatformSeed(unsupported).ok,false);
});
test('design directives are explicitly non-dispatchable, even when otherwise valid',()=>{
  const r=validateDesignDirective(directive());
  assert.equal(r.ok,true);assert.equal(r.dispatchable,false);
});
test('design directives cannot sneak in browser effects, grants, unknown verbs or extra fields',()=>{
  for(const d of [
    {...directive(),mode:'EXECUTE'},
    {...directive(),execution_authority:'browser:all'},
    {...directive(),verb:'SEND'},
    {...directive(),grant_ref:'fake'},
    {...directive(),decision_state:'BUILT_LIVE'},
    {...directive(),inputs:['ok',{}]}
  ])assert.equal(validateDesignDirective(d).ok,false);
});
test('known ChatGPT adapter projects semantics but never infers readiness, authority or effects',()=>{
  const v=projectAdapterSemantics(chat());
  assert.equal(v.provider_id,'chatgpt.com');
  assert.equal(v.application_family,'ai_conversation_webapp');
  assert.equal(v.realization_mode,'browser_mediated');
  assert.deepEqual(v.capabilities.map(x=>x.semantic_id),['conversation.send','conversation.observe_reply']);
  assert(v.capabilities.every(x=>x.runtime_readiness==='NOT_OBSERVED'&&x.authority==='NOT_ASSESSED'));
  assert.equal(v.live_availability,'NOT_OBSERVED');assert.equal(v.executable_from_projection,false);
  assert(!JSON.stringify(v).includes('private_token'));
  assert(!JSON.stringify(v).includes('GRANTED'));
});
test('OpenCode adapter is native and cannot pretend to be browser conversation',()=>{
  const v=projectAdapterSemantics(native());
  assert.equal(v.application_family,'native_agent_runtime');
  assert.equal(v.capabilities[0].semantic_id,'executor.prompt');
  assert.equal(v.capabilities[0].declaration,'IMPLEMENTED_DECLARED');
  assert.equal(v.capabilities[0].effect_observed,false);
});
test('unknown and wrong-kind adapters cannot obtain known provider semantic capabilities',()=>{
  for(const x of [
    {manifest:{schema:'aion.bus.adapter/1',name:'claude.ai',kind:'conversation',capabilities:{deliver:true}}},
    {manifest:{schema:'aion.bus.adapter/1',name:'chatgpt.com',kind:'executor',capabilities:{deliver:true}}},
    {manifest:{schema:'unknown',name:'chatgpt.com',kind:'conversation',capabilities:{deliver:true}}},
    {manifest:{name:'chatgpt.com',kind:'conversation',capabilities:{deliver:true}}}
  ]){
    const v=projectAdapterSemantics(x);
    assert.equal(v.application_family,'unknown');assert.deepEqual(v.capabilities,[]);
    assert.equal(v.executable_from_projection,false);
  }
});
test('a missing manifest capability is UNKNOWN, never an authorization fallback',()=>{
  const v=projectAdapterSemantics({manifest:{schema:'aion.bus.adapter/1',name:'chatgpt.com',
    kind:'conversation',capabilities:{deliver:true}}});
  assert.equal(v.capabilities[1].declaration,'UNKNOWN');
  assert.equal(v.capabilities[1].runtime_readiness,'NOT_OBSERVED');
});
test('projection is read-only, bounded and stable across canonical adapter map order',()=>{
  const manifestMap={'opencode-v2':native(),'chatgpt.com':chat()};
  const before=JSON.stringify(manifestMap);const view=projectPlatformAdapters(manifestMap);
  assert.equal(JSON.stringify(manifestMap),before);
  assert.equal(view.adapters.length,2);assert.equal(view.can_dispatch,false);
  assert.equal(view.can_authorize,false);assert.equal(view.can_migrate_bus_state,false);
  assert.deepEqual(view.adapters.map(x=>x.adapter),['chatgpt.com','opencode-v2']);
  assert.throws(()=>projectPlatformAdapters('fake'));
});
test('inspection CLI does not require any Bus, connections or effects',()=>{
  let accesses=0;const lines=[];
  const rc=runPlatformInspect(['inspect','--json'],{print:s=>lines.push(JSON.parse(s)),
    readSeed:()=>{accesses++;return seed()}});
  assert.equal(rc,0);assert.equal(accesses,1);
  assert.equal(lines[0].schema,'aion.platform.inspect/1');
  assert.equal(lines[0].dispatchable,false);
  assert.equal(lines[0].donor_counts.total_records,2);
});
test('inspection CLI invalid syntax and invalid seed refuse without partial output',()=>{
  const lines=[];
  assert.equal(runPlatformInspect(['run'],{print:s=>lines.push(JSON.parse(s))}),2);
  assert.equal(lines[0].code,'BAD_PLATFORM_COMMAND');
  const bad=[];
  assert.equal(runPlatformInspect(['validate'],{print:s=>bad.push(JSON.parse(s)),readSeed:()=>({...seed(),executable:true})}),3);
  assert.equal(bad[0].code,'SEED_MUST_BE_NONEXECUTABLE');
});
test('inspect validate accepts the design seed but grants no execution',()=>{
  const out=[];
  const rc=runPlatformInspect(['validate'],{print:s=>out.push(JSON.parse(s)),readSeed:seed});
  assert.equal(rc,0);assert.equal(out[0].execution_authority,false);
  assert.equal(out[0].semantic_capabilities,4);
});
