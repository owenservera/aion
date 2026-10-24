// Synthetic demonstration of unknown-site read candidate, no production activation.
import { makeUnknownSiteFixture } from './fixtures/unknown-site.mjs';
import { runDiscoveryReadReplay } from './src/workbench.mjs';
import { projectNativeEvents } from './src/native-projection.mjs';

const f=makeUnknownSiteFixture();
const result=await runDiscoveryReadReplay({...f,allowSynthetic:true});
const native=projectNativeEvents(f.nativeEvents,{scope:f.nativeScope});
console.log(JSON.stringify({
  fixture:'SYNTHETIC_TEST / fictional .invalid origin',
  siteId:f.siteId,training:result.partition.trainingCount,heldout:result.partition.heldoutCount,
  independence:result.partition.sourceIndependent,round9:result.round9.independent,
  adapterStatus:result.status,shadow:result.shadow.recommendation,
  userTurnRule:result.candidate.features['user-turn'].selected?.candidate ?? null,
  assistantTurnRule:result.candidate.features['assistant-turn'].selected?.candidate ?? null,
  nativeTurns:native.turns.length,nativeBlocks:native.turns.reduce((n,t)=>n+t.blocks.length,0),
  lastAssistantText:native.turns.find(t=>t.role==='assistant')?.blocks.find(b=>b.kind==='answer')?.text,
  promoted:result.productionActivated,sendAuthorized:result.sendPermission
},null,2));
