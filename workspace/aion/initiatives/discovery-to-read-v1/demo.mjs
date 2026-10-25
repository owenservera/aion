// Node 22 demonstration: entirely synthetic, fictional website.
// This runs the full callable intake, existing Agent14 Round8/9 shadow and
// independent native semantic gate, WITHOUT browser, accounts or profile writes.
import { makeUnknownSiteFixture } from './fixtures/unknown-site.mjs';
import { createDiscoveryIntake } from './src/discovery-intake.mjs';
import { TRUTH_SCHEMA } from './src/structural-read-verdict.mjs';
import { projectNativeEvents } from './src/native-projection.mjs';

const f=makeUnknownSiteFixture();
const captures=new Map(f.captures.map(c=>[c.receipt.source.captureId,c]));
const sourceReader={
  lookupCapture:f.lookupCapture,
  mintReceipt:async(id)=>structuredClone(captures.get(id).receipt),
};
const extractProbes=async({captureId,original})=>({
  source:{captureId,rawDigest:original.source.rawDigest,domDigest:original.source.domDigest},
  probes:structuredClone(captures.get(captureId).probes)
});
// Both callbacks below are explicitly fictional, independent fixture oracles.
// REAL acceptance requires independently verified original provider-native truth.
const reference=async(captureId,feature)=>{
  const source=(await sourceReader.lookupCapture(captureId)).source;
  return {schema:TRUTH_SCHEMA,source,proofMethod:'independently-reviewed-original',
    records:[{nativeId:captureId+'/'+feature,role:feature==='user-turn'?'user':'assistant',
      kind:'message',sequence:source.seqStart+1}]};
};
const interpret=async({captureId,feature})=>{
  const v=await reference(captureId,feature);
  return {source:v.source,records:v.records};
};
const result=await createDiscoveryIntake({
  sourceReader,extractProbes,readIndependentTruth:reference,
  interpretCandidate:interpret,fixtureMode:true
}).evaluate({siteId:f.siteId,
  trainingIds:f.training.map(c=>c.receipt.source.captureId),
  heldoutIds:f.heldout.map(c=>c.receipt.source.captureId)});
const native=projectNativeEvents(f.nativeEvents,{scope:f.nativeScope});
console.log(JSON.stringify({
  classification:'FICTIONAL SYNTHETIC_TEST — mock original-source and native-truth callbacks',
  siteId:f.siteId,train:result.replay.partition.trainingCount,
  heldout:result.replay.partition.heldoutCount,
  independent:result.replay.partition.sourceIndependent,
  shadow:result.replay.shadow.recommendation,
  semanticCases:result.semantic?.counts.cases,
  semanticFalsePositive:result.semantic?.counts.falsePositive,
  status:result.status,nativeTurns:native.turns.length,
  nativeBlocks:native.turns.reduce((n,t)=>n+t.blocks.length,0),
  finalAssistantText:native.turns.find(t=>t.role==='assistant')?.blocks[0].text,
  productionActivated:result.productionActivated,promotionAuthorized:result.promotionAuthorized,
  sendPermission:result.sendPermission
},null,2));
