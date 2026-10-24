// One-shot server-side discovery-to-read orchestration from saved capture IDs.
// This binds trusted original session receipts, Round8/9 replay and independent
// native semantic evaluation. It never activates a profile or sends a browser effect.
import { RECEIPT_SCHEMA } from './evidence-receipts.mjs';
import { runDiscoveryReadReplay } from './workbench.mjs';
import { evaluateStructuralRead } from './structural-read-verdict.mjs';

export const INTAKE_SCHEMA = 'aion.discovery.read-intake/1';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function sameScope(a,b){return a?.origin===b?.origin&&a?.account===b?.account&&a?.surface===b?.surface;}
function validRef(x){return typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(x);}

/**
 * Dependencies are internal Studio-owned, not HTTP/client caller callbacks:
 * sourceReader.lookupCapture + mintReceipt from studio-source-reader;
 * extractProbes({captureId,original}) -> {
 *   source:{captureId,rawDigest,domDigest}, probes: structural Round8 records
 * };
 * readIndependentTruth and interpretCandidate from distinct source-native
 * reader / candidate evaluator. Neither may invent raw/original identity.
 */
export function createDiscoveryIntake({sourceReader,extractProbes,
  readIndependentTruth,interpretCandidate,fixtureMode=false}={}) {
  if(typeof sourceReader?.lookupCapture!=='function' || typeof sourceReader?.mintReceipt!=='function'
    || [extractProbes,readIndependentTruth,interpretCandidate].some(x=>typeof x!=='function'))
    fail('TRUSTED_INTAKE_DEPENDENCIES_REQUIRED');

  async function evaluate({siteId,trainingIds,heldoutIds,requiredFeatures=['user-turn','assistant-turn']}={}) {
    if(typeof siteId!=='string'||!siteId||
      !Array.isArray(trainingIds)||trainingIds.length<3||
      !Array.isArray(heldoutIds)||heldoutIds.length<2 ||
      ![...trainingIds,...heldoutIds].every(validRef) ||
      new Set([...trainingIds,...heldoutIds]).size!==trainingIds.length+heldoutIds.length)
      fail('INVALID_INTAKE_PARTITIONS');
    const captureIds=[...trainingIds,...heldoutIds];
    let scope=null;
    const captures=[];
    for(const captureId of captureIds) {
      const original=await sourceReader.lookupCapture(captureId);
      if(!original?.verifiedOriginal || original.source?.captureId!==captureId)
        fail('UNVERIFIED_INTAKE_SOURCE');
      if(scope===null)scope={...original.scope};
      if(!sameScope(original.scope,scope))fail('INTAKE_SCOPE_CHANGED');
      if(original.evidenceClass==='SYNTHETIC_TEST'&&!fixtureMode)
        fail('SYNTHETIC_INTAKE_DISABLED');
      const receipt=await sourceReader.mintReceipt(captureId);
      if(receipt?.schema!==RECEIPT_SCHEMA || !sameScope(receipt.scope,original.scope) ||
        receipt.evidenceClass!==original.evidenceClass ||
        !['captureId','lineageRoot','familyId','rawDigest','domDigest','seqStart','seqEnd']
          .every(k=>receipt.source?.[k]===original.source[k]))
        fail('INCONSISTENT_SOURCE_RECEIPT');
      const extracted=await extractProbes({captureId,original});
      if(!extracted || extracted.source?.captureId!==captureId ||
        extracted.source?.rawDigest!==original.source.rawDigest ||
        extracted.source?.domDigest!==original.source.domDigest ||
        !Array.isArray(extracted.probes))fail('UNBOUND_STRUCTURAL_PROBES');
      // Probe source IDs and ordering must come from this capture, not from a
      // neighboring thread or a stale page.
      if(extracted.probes.some(p=>!Number.isSafeInteger(p.sequence) ||
        p.sequence<original.source.seqStart || p.sequence>original.source.seqEnd ||
        (p.captureId!==undefined && p.captureId!==captureId)))
        fail('STRUCTURAL_PROBE_OUTSIDE_ORIGINAL');
      captures.push({receipt,probes:extracted.probes});
    }
    const training=captures.slice(0,trainingIds.length);
    const heldout=captures.slice(trainingIds.length);
    const replay=await runDiscoveryReadReplay({siteId,scope,training,heldout,
      lookupCapture:sourceReader.lookupCapture,allowSynthetic:fixtureMode,requiredFeatures});
    if(!['fixture-only-preview','read-only-preview-eligible'].includes(replay.status))
      return {schema:INTAKE_SCHEMA,status:'quarantined',phase:'structural-shadow',
        replay,semantic:null,productionActivated:false,sendPermission:false};
    const semantic=await evaluateStructuralRead({replay,
      lookupCapture:sourceReader.lookupCapture,readIndependentTruth,
      interpretCandidate,fixtureMode});
    const qualified=semantic.semanticReadValidated===true;
    return {schema:INTAKE_SCHEMA,
      status:!qualified?'quarantined':replay.partition.fixtureOnly?
        'fixture-only-semantic-preview':'read-only-candidate-qualified',
      phase:'semantic-evaluated',replay,semantic,
      // The integration owner must separately prove current-page read identity,
      // a safe compare-and-save owner, and fresh real evidence before activation.
      productionActivated:false,promotionAuthorized:false,
      sendPermission:false,dispatch:false};
  }
  return Object.freeze({evaluate});
}
