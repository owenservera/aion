import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {guardEnvelope} from '../src/semantic-guards.mjs';
const here=fileURLToPath(new URL('../',import.meta.url));
const cases=[
 ['agent-definition.reviewer.json','agent-definition.v1.schema.json','aion.agent-definition/1'],
 ['runtime-capabilities.offline.json','runtime-capabilities.v1.schema.json','aion.runtime-capabilities/1'],
 ['context-pack.example.json','context-pack.v1.schema.json','aion.context-pack/1'],
 ['task-handoff.example.json','task-handoff.v1.schema.json','aion.task-handoff/1'],
 ['execution-receipt.unverified.json','execution-receipt.v1.schema.json','aion.execution-receipt/1']
];
const fixture=n=>JSON.parse(readFileSync(join(here,'fixtures',n),'utf8'));
const schema=n=>JSON.parse(readFileSync(join(here,'contracts',n),'utf8'));
const copy=x=>structuredClone(x);
test('five standard JSON Schema 2020-12 contracts and matching fixtures load',()=>{
 for(const [sample,spec,id] of cases){
  const s=schema(spec),x=fixture(sample);
  assert.equal(s.$schema,'https://json-schema.org/draft/2020-12/schema');
  assert.equal(s.type,'object');
  assert.equal(s.additionalProperties,false);
  assert.equal(s.properties.schema.const,id);
  for(const key of s.required)assert.ok(Object.hasOwn(x,key),sample+': missing '+key);
  assert.equal(guardEnvelope(id,x),x);
 }
});
test('schema defs use only local refs and never arbitrary code',()=>{
 for(const [,spec] of cases){
  const s=schema(spec);
  const refs=JSON.stringify(s).match(/"\$ref":"[^"]+"/g)??[];
  for(const raw of refs)assert.match(raw,/"\$ref":"#\/\$defs\/[a-zA-Z0-9_-]+"/);
  assert.doesNotMatch(JSON.stringify(s),/javascript:|file:|eval\(/i);
 }
});
test('portable agent refuses duplicate/contradictory capability permissions',()=>{
 const a=fixture(cases[0][0]);
 a.capabilities.deny.push('read');
 assert.throws(()=>guardEnvelope(a.schema,a),{code:'CONFLICTING_CAPABILITY_POLICY'});
 a.capabilities.deny.pop();
 a.capabilities.allow.push('read');
 assert.throws(()=>guardEnvelope(a.schema,a),{code:'CAPABILITY_SET_INVALID'});
});
test('configured engine is not assumed to be reachable, authenticated or ready',()=>{
 const e=fixture(cases[1][0]);
 const falseReady=copy(e);falseReady.probes.ready={state:'YES',evidence_ref:'invented'};
 assert.throws(()=>guardEnvelope(e.schema,falseReady),{code:'READY_WITHOUT_LIVE_EVIDENCE'});
 const unproven=copy(e);unproven.probes.reachable={state:'YES',evidence_ref:null};
 assert.throws(()=>guardEnvelope(e.schema,unproven),{code:'PROBE_EVIDENCE_MISSING'});
});
test('secret content never enters a ContextPack and output budget is bounded',()=>{
 const pack=fixture(cases[2][0]);
 const secret=copy(pack);secret.sources[0].sensitivity='secret';
 assert.throws(()=>guardEnvelope(pack.schema,secret),{code:'SECRET_INCLUDED_IN_CONTEXT'});
 const over=copy(pack);over.budget.estimated_used_tokens=over.budget.max_input_tokens+1;
 assert.throws(()=>guardEnvelope(pack.schema,over),{code:'CONTEXT_BUDGET_EXCEEDED'});
});
test('handoff binds exact deployment revision and forbids retry after unknown effect',()=>{
 const req=fixture(cases[3][0]);
 const retry=copy(req);retry.attempt_policy.retry_after_unknown_effect=true;
 assert.throws(()=>guardEnvelope(req.schema,retry),{code:'UNKNOWN_EFFECT_RETRY_FORBIDDEN'});
 const unbound=copy(req);unbound.target_agent.binding_revision=0;
 assert.throws(()=>guardEnvelope(req.schema,unbound),{code:'TARGET_BINDING_UNPINNED'});
});
test('unverified or unknown operation never promotes itself into completion',()=>{
 const base=fixture(cases[4][0]);
 const fake=copy(base);fake.outcome='VERIFIED';
 assert.throws(()=>guardEnvelope(base.schema,fake),{code:'UNSUPPORTED_VERIFIED_CLAIM'});
 const ambiguous=copy(base);ambiguous.verification='INDEPENDENTLY_VERIFIED';
 assert.throws(()=>guardEnvelope(base.schema,ambiguous),{code:'VERIFIER_EVIDENCE_MISSING'});
});
test('unknown envelope fails closed',()=>{
 assert.throws(()=>guardEnvelope('aion.not-real/1',{}),{code:'UNKNOWN_ENVELOPE'});
});
