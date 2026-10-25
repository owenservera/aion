import test from 'node:test';
import assert from 'node:assert/strict';
import { makeUnknownSiteFixture } from '../fixtures/unknown-site.mjs';
import { runDiscoveryReadReplay } from '../src/workbench.mjs';
import { evaluateStructuralRead, TRUTH_SCHEMA } from '../src/structural-read-verdict.mjs';

const code=c=>e=>e?.code===c;
async function scenario(){
  const f=makeUnknownSiteFixture();
  const replay=await runDiscoveryReadReplay({...f,allowSynthetic:true});
  // The independent reference and candidate interpreter are separate injected
  // fixture producers. In production BOTH require original session-bound readers.
  const refs=(captureId,feature)=>[{nativeId:captureId+'-native-'+feature,
    role:feature==='user-turn'?'user':'assistant',kind:'message',sequence:1}];
  const trusted=async(captureId,feature)=>{
    const canonical=await f.lookupCapture(captureId);
    return {schema:TRUTH_SCHEMA,source:canonical.source,
      proofMethod:'independently-reviewed-original',records:refs(captureId,feature)};
  };
  const interpret=async({captureId,feature})=>{
    const canonical=await f.lookupCapture(captureId);
    return {source:canonical.source,records:refs(captureId,feature)};
  };
  return {f,replay,trusted,interpret};
}
test('independent synthetic semantic fixture validates both roles but cannot activate a profile',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const result=await evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:interpret,fixtureMode:true});
  assert.equal(result.status,'synthetic-semantic-preview');
  assert.equal(result.counts.cases,4);
  assert.equal(result.counts.truePositive,4);
  assert.equal(result.semanticReadValidated,true);
  assert.equal(result.productionActivationAuthorized,false);
  assert.equal(result.goalFulfilled,false);
});
test('synthetic evidence cannot be silently relabeled real by semantic gate',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:interpret}),code('SYNTHETIC_SEMANTICS_NOT_AUTHORIZED'));
});
test('selector that matches the wrong assistant/native identity fails semantic validation',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const wrong=async(args)=>{const a=await interpret(args);
    if(args.feature==='assistant-turn')a.records[0].nativeId='wrong-reply';
    return a;};
  const result=await evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:wrong,fixtureMode:true});
  assert.equal(result.status,'quarantined');
  assert.equal(result.semanticReadValidated,false);
  assert.ok(result.counts.falseNegative>0);
  assert.ok(result.counts.falsePositive>0);
});
test('same visible message but incorrect author fails',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const wrong=async(args)=>{const a=await interpret(args);
    if(args.feature==='assistant-turn')a.records[0].role='user';
    return a;};
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:wrong,fixtureMode:true}),code('INVALID_SEMANTIC_RECORDS'));
});
test('reference from different immutable DOM capture is rejected',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const forged=async(id,feature)=>{const r=await trusted(id,feature);r.source.domDigest='X'.repeat(64);return r;};
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:forged,interpretCandidate:interpret,fixtureMode:true}),code('SEMANTIC_EVIDENCE_UNBOUND'));
});
test('reference cannot be classified truth without approved original-source proof method',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const fake=async(id,feature)=>({...await trusted(id,feature),proofMethod:'adapter-guessed'});
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:fake,interpretCandidate:interpret,fixtureMode:true}),code('SEMANTIC_EVIDENCE_UNBOUND'));
});
test('duplicate native IDs in predicted output are rejected',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const duplicate=async(args)=>{const r=await interpret(args);r.records.push({...r.records[0]});return r;};
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:duplicate,fixtureMode:true}),code('INVALID_SEMANTIC_RECORDS'));
});
test('unknown scope account or origin is not eligible',async()=>{
  const {f,replay,trusted,interpret}=await scenario();
  const unsafeLookup=async(id)=>({...await f.lookupCapture(id),scope:{...f.scope,account:'other'}});
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:unsafeLookup,
    readIndependentTruth:trusted,interpretCandidate:interpret,fixtureMode:true}),code('UNVERIFIED_SEMANTIC_SOURCE'));
});
test('incomplete shadow replay cannot be upgraded by semantic scorer',async()=>{
  const {f,replay,trusted,interpret}=await scenario();replay.status='quarantined';
  await assert.rejects(evaluateStructuralRead({replay,lookupCapture:f.lookupCapture,
    readIndependentTruth:trusted,interpretCandidate:interpret,fixtureMode:true}),code('INELIGIBLE_DISCOVERY_REPLAY'));
});
