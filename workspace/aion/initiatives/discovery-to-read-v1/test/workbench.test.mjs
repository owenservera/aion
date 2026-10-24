import test from 'node:test';
import assert from 'node:assert/strict';
import { makeUnknownSiteFixture } from '../fixtures/unknown-site.mjs';
import { runDiscoveryReadReplay } from '../src/workbench.mjs';
import { qualifyObservation, assertIndependentPartitions } from '../src/evidence-receipts.mjs';
import { projectNativeEvents } from '../src/native-projection.mjs';
import { synthesizeWebappAdapter } from '../../../sessions/roles/14-webapp-native-harness/implementations/round8/adaptive-adapter-factory.mjs';

const make=()=>makeUnknownSiteFixture();
const run=(f,extras={})=>runDiscoveryReadReplay({...f,allowSynthetic:true,...extras});
const code=expected=>err=>err?.code===expected;
const canonicalLookup=captures=>{
  const m=new Map(captures.map(c=>[c.receipt.source.captureId,{
    verifiedOriginal:true,scope:structuredClone(c.receipt.scope),
    evidenceClass:c.receipt.evidenceClass,source:structuredClone(c.receipt.source)}]));
  return async id=>structuredClone(m.get(id)??null);
};

test('unknown-site synthetic replay uses existing Round8 and Round9 without activating anything',async()=>{
  const result=await run(make());
  assert.equal(result.status,'fixture-only-preview');
  assert.equal(result.partition.sourceIndependent,true);
  assert.equal(result.partition.trainingCount,3);
  assert.equal(result.partition.heldoutCount,2);
  assert.equal(result.partition.fixtureOnly,true);
  assert.equal(result.round9.independent,true);
  assert.equal(result.candidate.features['assistant-turn'].selected.status,'provisional');
  assert.equal(result.shadow.contradicted,0);
  assert.deepEqual(result.misses,[]);
  assert.equal(result.productionActivated,false);
  assert.equal(result.sendPermission,false);
  assert.equal(result.dispatch,false);
});

test('production-class receipt simulation remains proposal-only (mock lookup, not live proof)',async()=>{
  const f=make();
  for (const c of f.captures)c.receipt.evidenceClass='SAVED_REAL_CAPTURE';
  f.lookupCapture=canonicalLookup(f.captures);
  const result=await runDiscoveryReadReplay(f);
  assert.equal(result.status,'read-only-preview-eligible');
  assert.equal(result.partition.fixtureOnly,false);
  assert.equal(result.candidate.features['user-turn'].selected.status,'shadow-ready');
  assert.equal(result.shadow.recommendation,'candidate-read-only-preview');
  assert.equal(result.productionActivated,false);
  assert.equal(result.dispatch,false);
});

test('client-asserted accepted:true cannot upgrade original observation into G1-G7 proof',async()=>{
  const f=make();
  const receipt={...f.training[0].receipt,accepted:true,sendAuthorized:true,
    verifiedOriginal:true,acceptedConversation:true};
  const out=await qualifyObservation(receipt,{lookupCapture:f.lookupCapture,allowSynthetic:true});
  assert.equal(out.acceptedConversation,false);
  assert.equal(out.promotionAuthorized,false);
  assert.equal(out.sendAuthorized,false);
});

test('no original lookup means no evidence qualification',async()=>{
  const f=make();
  await assert.rejects(qualifyObservation(f.training[0].receipt),code('TRUSTED_LOOKUP_REQUIRED'));
});

test('synthetic evidence blocked by default',async()=>{
  const f=make();
  await assert.rejects(qualifyObservation(f.training[0].receipt,{lookupCapture:f.lookupCapture}),
    code('SYNTHETIC_REQUIRES_FIXTURE_MODE'));
});

test('forged capture digest is rejected against original source',async()=>{
  const f=make();
  const bad=structuredClone(f.training[0].receipt);
  bad.source.rawDigest='forged';
  await assert.rejects(qualifyObservation(bad,{lookupCapture:f.lookupCapture,allowSynthetic:true}),
    code('SOURCE_BINDING_MISMATCH'));
});

test('same original capture in training and heldout cannot be relabeled as independent',async()=>{
  const f=make();f.heldout[0]=structuredClone(f.training[0]);
  await assert.rejects(run(f),code('NONINDEPENDENT_CAPTUREID'));
});

test('different IDs with same immutable lineage cannot be train and heldout',async()=>{
  const f=make();f.heldout[0].receipt.source.lineageRoot=f.training[0].receipt.source.lineageRoot;
  f.lookupCapture=canonicalLookup(f.captures);
  await assert.rejects(run(f),code('NONINDEPENDENT_LINEAGEROOT'));
});

test('different IDs and lineage with identical raw source bytes still fail independence',async()=>{
  const f=make();f.heldout[0].receipt.source.rawDigest=f.training[0].receipt.source.rawDigest;
  f.lookupCapture=canonicalLookup(f.captures);
  await assert.rejects(run(f),code('NONINDEPENDENT_RAWDIGEST'));
});

test('same origin but different account cannot contaminate a proposal',async()=>{
  const f=make();f.heldout[0].receipt.scope.account='other-account';
  f.lookupCapture=canonicalLookup(f.captures);
  await assert.rejects(run(f),code('CROSS_SCOPE_CONTAMINATION'));
});

test('missing heldout record cannot produce an independent-read recommendation',async()=>{
  const f=make();f.heldout=f.heldout.slice(0,1);
  await assert.rejects(run(f),code('INSUFFICIENT_INDEPENDENT_CAPTURES'));
});

test('missing selected rule on heldout capture yields quarantine, not optimistic success',async()=>{
  const f=make();f.heldout[0].probes=f.heldout[0].probes.filter(x=>x.feature!=='assistant-turn');
  const result=await run(f);
  assert.equal(result.status,'quarantined');
  assert.ok(result.misses.some(x=>x.feature==='assistant-turn'));
});

test('heldout contradiction yields quarantine',async()=>{
  const f=make();f.heldout[0].probes.find(x=>x.feature==='assistant-turn').outcome='absent';
  const result=await run(f);
  assert.equal(result.status,'quarantined');
  assert.ok(result.shadow.contradicted>0);
});

test('interface redesign creates a proposed drift replacement without write authority',async()=>{
  const f=make();
  const original=f.training.flatMap(c=>c.probes.map(p=>({
    ...p,siteId:f.siteId,origin:f.scope.origin,surface:f.scope.surface,
    captureId:c.receipt.source.captureId,evidenceClass:c.receipt.evidenceClass,
    candidate:p.feature==='assistant-turn'?'[data-old-assistant]':p.candidate
  })));
  const prior=synthesizeWebappAdapter({siteId:f.siteId,origin:f.scope.origin,
    surface:f.scope.surface,observations:original});
  const result=await run(f,{prior});
  assert.equal(result.status,'fixture-only-preview');
  assert.ok(result.candidate.drift.some(x=>x.feature==='assistant-turn'
    && x.reason==='PROPOSED_REPLACEMENT_REQUIRES_SHADOW_VALIDATION'));
  assert.equal(result.productionActivated,false);
});

test('native event graph preserves original source, streamed revision and opaque artifact',()=>{
  const f=make();
  const out=projectNativeEvents(f.nativeEvents,{scope:f.nativeScope});
  assert.equal(out.turns.length,2);
  assert.equal(out.turns[1].blocks[0].text,'AION demo — revised');
  assert.equal(out.turns[1].blocks[0].revision,2);
  assert.equal(out.turns[1].blocks[0].state,'closed');
  assert.equal(out.turns[1].blocks[0].nativeType,'vendor.response.delta');
  assert.equal(out.turns[1].blocks[1].kind,'artifact');
  assert.equal(out.turns[1].blocks[1].payload.sections[0].title,'Example');
  assert.equal(out.turns[1].blocks[1].evidence[0].sid,'synthetic-sid-7');
  assert.equal(out.userGoal,'unknown');
  assert.equal(out.effectAuthorization,false);
});

test('identical native replay IDs are deduplicated but conflicting IDs fail',()=>{
  const f=make();
  const good=projectNativeEvents([...f.nativeEvents,structuredClone(f.nativeEvents[3])],{scope:f.nativeScope});
  assert.equal(good.replayed,1);
  const bad=structuredClone(f.nativeEvents[3]);bad.text='contradiction';
  assert.throws(()=>projectNativeEvents([...f.nativeEvents,bad],{scope:f.nativeScope}),
    code('CONFLICTING_NATIVE_EVENT_ID'));
});

test('cross-account native events are rejected',()=>{
  const f=make();const e=structuredClone(f.nativeEvents);e[1].scope.account='other-account';
  assert.throws(()=>projectNativeEvents(e,{scope:f.nativeScope}),code('NATIVE_SCOPE_MISMATCH'));
});

test('missing source SID is not allowed to invent evidence links',()=>{
  const f=make();const e=structuredClone(f.nativeEvents);delete e[0].evidence.sid;
  assert.throws(()=>projectNativeEvents(e,{scope:f.nativeScope}),code('NATIVE_EVIDENCE_UNGROUNDED'));
});

test('stale native sequence cannot be inserted into the graph',()=>{
  const f=make(),e=structuredClone(f.nativeEvents);
  e.push({...e[0],eventId:'late-event',sequence:2,turnId:'another-turn',
    blockId:'another-block'});
  assert.throws(()=>projectNativeEvents(e,{scope:f.nativeScope}),code('NONMONOTONIC_NATIVE_SEQUENCE'));
});

test('native revision jumps are rejected',()=>{
  const f=make(),e=structuredClone(f.nativeEvents);e[3].revision=3;
  assert.throws(()=>projectNativeEvents(e,{scope:f.nativeScope}),code('REVISION_GAP_OR_REPLAY'));
});

test('native blocks do not accept appends after source-verified close',()=>{
  const f=make(),e=structuredClone(f.nativeEvents);
  e.push({...e[3],eventId:'late-append',sequence:9,revision:3,text:'unsourced'});
  assert.throws(()=>projectNativeEvents(e,{scope:f.nativeScope}),code('NATIVE_BLOCK_NOT_OPEN'));
});
