// Replay workbench: exercises the EXISTING Agent 14 Round 8 compiler and Round 9
// independent held-out gate, never writes a live profile or touches a browser.
import { assertIndependentPartitions } from './evidence-receipts.mjs';
import { synthesizeWebappAdapter, shadowEvaluateAdapter } from '../../../sessions/roles/14-webapp-native-harness/implementations/round8/adaptive-adapter-factory.mjs';
import { assertIndependentAdapterHoldout } from '../../../sessions/roles/14-webapp-native-harness/implementations/round9/adapter-holdout-gate.mjs';

export const WORKBENCH_SCHEMA = 'aion.discovery.read-workbench/1';
const READ_FEATURES = new Set(['user-turn','assistant-turn','thread-route','citation','artifact','task-progress','stream-component']);
function fail(code) { const e=new Error(code);e.code=code;throw e; }
function sameScope(a,b) { return a?.origin===b?.origin && a?.account===b?.account && a?.surface===b?.surface; }
function observations(captures, siteId, scope) {
  return captures.flatMap(c => {
    if (!sameScope(c.receipt?.scope,scope) || !Array.isArray(c.probes)) fail('PROBE_SCOPE_MISMATCH');
    return c.probes.map(p => ({ ...p, siteId, origin:scope.origin, surface:scope.surface,
      captureId:c.receipt.source.captureId, evidenceClass:c.receipt.evidenceClass }));
  });
}

// Strict completeness wrapper around Round8 shadowEvaluate: its recommendation is a
// candidate preview, not proof that all heldout sessions exercised each selected rule.
function completeHeldoutCoverage(candidate, heldout, heldoutIds, requiredFeatures, fixtureOnly) {
  const misses=[];
  for (const feature of requiredFeatures) {
    const selected=candidate.features?.[feature]?.selected;
    if (!READ_FEATURES.has(feature) || !selected || (fixtureOnly
      ? !['provisional','shadow-ready'].includes(selected.status)
      : selected.status!=='shadow-ready')) {
      misses.push({feature,reason:'NOT_SHADOW_READY'}); continue;
    }
    for (const captureId of heldoutIds) {
      const matching=heldout.filter(x=>x.captureId===captureId && x.feature===feature
        && x.candidate===selected.candidate);
      if (matching.length!==1 || matching[0].outcome!=='present') {
        misses.push({feature,captureId,reason:'MISSING_OR_CONTRADICTED_HELDOUT_RULE'});
      }
    }
  }
  return misses;
}

export async function runDiscoveryReadReplay({ siteId, scope, training, heldout,
  lookupCapture, allowSynthetic=false, requiredFeatures=['user-turn','assistant-turn'] }={}) {
  if (typeof siteId!=='string' || !Array.isArray(training) || !Array.isArray(heldout)) fail('INVALID_REPLAY_INPUT');
  if (!Array.isArray(requiredFeatures) || !requiredFeatures.length
    || requiredFeatures.some(x=>!READ_FEATURES.has(x))) fail('INVALID_REQUIRED_FEATURES');
  // Fail BEFORE any candidate inference if immutable original source cannot be proven.
  const partition=await assertIndependentPartitions({ training:training.map(c=>c.receipt),
    heldout:heldout.map(c=>c.receipt), lookupCapture, allowSynthetic });
  if (!sameScope(partition.scope,scope)) fail('REPLAY_SCOPE_MISMATCH');
  const trainingProbes=observations(training,siteId,scope);
  const heldoutProbes=observations(heldout,siteId,scope);
  const candidate=synthesizeWebappAdapter({siteId, origin:scope.origin,surface:scope.surface,
    observations:trainingProbes});
  // Shared Round 9 gate is necessary, while our source-lineage gate is stronger.
  const round9=assertIndependentAdapterHoldout(candidate,partition.heldoutIds);
  const shadow=shadowEvaluateAdapter(candidate,heldoutProbes);
  const misses=completeHeldoutCoverage(candidate,heldoutProbes,partition.heldoutIds,requiredFeatures,partition.fixtureOnly);
  // Pure synthetic fixtures can exercise the workflow, but Round8 intentionally
  // keeps them provisional. Their preview status is never eligible for production.
  const readQualified=shadow.contradicted===0 && misses.length===0
    && (partition.fixtureOnly || shadow.recommendation==='candidate-read-only-preview');
  return { schema:WORKBENCH_SCHEMA, siteId,scope:{...scope}, partition,round9,
    candidate,shadow,requiredFeatures,misses,
    status:!readQualified?'quarantined':partition.fixtureOnly?'fixture-only-preview':'read-only-preview-eligible',
    // This is not the canonical Studio store owner or production acceptance gate.
    // Even read-only preview eligibility is not an active profile promotion.
    productionActivated:false,sendPermission:false,dispatch:false };
}
