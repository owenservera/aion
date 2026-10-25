import test from 'node:test';
import assert from 'node:assert/strict';
import { makeUnknownSiteFixture } from '../fixtures/unknown-site.mjs';
import { RECEIPT_SCHEMA } from '../src/evidence-receipts.mjs';
import { createDiscoveryIntake } from '../src/discovery-intake.mjs';
import { TRUTH_SCHEMA } from '../src/structural-read-verdict.mjs';

const code=c=>e=>e?.code===c;
function lab(){
  const f=makeUnknownSiteFixture();
  const m=new Map(f.captures.map(c=>[c.receipt.source.captureId,c]));
  const sourceReader={
    async lookupCapture(id){const o=await f.lookupCapture(id);return o??null;},
    async mintReceipt(id){return structuredClone(m.get(id)?.receipt??null);}
  };
  const extractProbes=async({captureId,original})=>{
    const c=m.get(captureId);
    return {source:{captureId,rawDigest:original.source.rawDigest,
      domDigest:original.source.domDigest},probes:structuredClone(c?.probes??[])};
  };
  const nativeTruth=async(captureId,feature)=>{
    const original=await sourceReader.lookupCapture(captureId);
    return {schema:TRUTH_SCHEMA,source:original.source,
      proofMethod:'independently-reviewed-original',
      records:[{nativeId:'native-'+captureId+'-'+feature,
        role:feature==='user-turn'?'user':'assistant',
        kind:'message',sequence:original.source.seqStart+1}]};
  };
  const interpretCandidate=async({captureId,feature})=>{
    const x=await nativeTruth(captureId,feature);
    return {source:x.source,records:x.records};
  };
  const deps={sourceReader,extractProbes,
    readIndependentTruth:nativeTruth,interpretCandidate,fixtureMode:true};
  const params={siteId:f.siteId,trainingIds:f.training.map(x=>x.receipt.source.captureId),
    heldoutIds:f.heldout.map(x=>x.receipt.source.captureId)};
  return {f,deps,params,m};
}
test('one-call unknown-site intake finishes shadow + independent semantic stage, never activates',async()=>{
  const x=lab();const v=await createDiscoveryIntake(x.deps).evaluate(x.params);
  assert.equal(v.status,'fixture-only-semantic-preview');
  assert.equal(v.replay.partition.trainingCount,3);
  assert.equal(v.replay.partition.heldoutCount,2);
  assert.equal(v.semantic.counts.cases,4);
  assert.equal(v.productionActivated,false);
  assert.equal(v.promotionAuthorized,false);
  assert.equal(v.sendPermission,false);
  assert.equal(v.dispatch,false);
});
test('does not accept synthetic source when not in explicit lab mode',async()=>{
  const x=lab();x.deps.fixtureMode=false;
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('SYNTHETIC_INTAKE_DISABLED'));
});
test('cross-account captures refused before adapter synthesis',async()=>{
  const x=lab();const c=x.m.get(x.params.heldoutIds[0]);c.receipt.scope.account='other';
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('INCONSISTENT_SOURCE_RECEIPT'));
});
test('malicious probe from another source sequence cannot contaminate training',async()=>{
  const x=lab();const original=x.deps.extractProbes;
  x.deps.extractProbes=async args=>{
    const v=await original(args);if(args.captureId===x.params.trainingIds[0])v.probes[0].sequence=100000;return v;};
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('STRUCTURAL_PROBE_OUTSIDE_ORIGINAL'));
});
test('mismatched raw digest attached to inferred selector refuses intake',async()=>{
  const x=lab();const original=x.deps.extractProbes;
  x.deps.extractProbes=async args=>({...await original(args),
    source:{captureId:args.captureId,rawDigest:'forged',domDigest:args.original.source.domDigest}});
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('UNBOUND_STRUCTURAL_PROBES'));
});
test('missing heldout role quarantines before semantic evaluation',async()=>{
  const x=lab();x.m.get(x.params.heldoutIds[0]).probes=
    x.m.get(x.params.heldoutIds[0]).probes.filter(p=>p.feature!=='assistant-turn');
  const v=await createDiscoveryIntake(x.deps).evaluate(x.params);
  assert.equal(v.status,'quarantined');assert.equal(v.phase,'structural-shadow');
  assert.equal(v.semantic,null);
});
test('matching selector but wrong native reply quarantines after semantic check',async()=>{
  const x=lab(),original=x.deps.interpretCandidate;
  x.deps.interpretCandidate=async args=>{
    const v=await original(args);if(args.feature==='assistant-turn')v.records[0].nativeId='incorrect';
    return v;};
  const v=await createDiscoveryIntake(x.deps).evaluate(x.params);
  assert.equal(v.status,'quarantined');assert.equal(v.phase,'semantic-evaluated');
  assert.ok(v.semantic.counts.falsePositive>0);
});
test('duplicate or overlapping capture IDs rejected without reading originals',async()=>{
  const x=lab();x.params.heldoutIds=[x.params.trainingIds[0],x.params.heldoutIds[1]];
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('INVALID_INTAKE_PARTITIONS'));
});
test('intake requires all four trusted dependencies',()=>{
  assert.throws(()=>createDiscoveryIntake({}),code('TRUSTED_INTAKE_DEPENDENCIES_REQUIRED'));
});
test('an unbound fixture read receipt is not silently accepted',async()=>{
  const x=lab();const old=x.deps.sourceReader.mintReceipt;
  x.deps.sourceReader.mintReceipt=async id=>{
    const v=await old(id);v.source.domDigest='a'.repeat(64);return v;};
  await assert.rejects(createDiscoveryIntake(x.deps).evaluate(x.params),code('INCONSISTENT_SOURCE_RECEIPT'));
});
