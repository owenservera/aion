// Semantic read validation, separately from raw source integrity and G1–G7.
// This module does not infer truth from its candidate's own selector outputs.
// Trusted callbacks MUST access independent saved source-native truth and
// interpreter output inside the same Studio owner. No network or effects.
export const STRUCTURAL_VERDICT_SCHEMA = 'aion.discovery.structural-read-verdict/1';
export const TRUTH_SCHEMA = 'aion.discovery.source-native-groundtruth/1';
function fail(code) { const e=new Error(code); e.code=code; throw e; }
const allowed=['user-turn','assistant-turn','thread-route','citation','artifact','task-progress','stream-component'];
const key=r=>JSON.stringify([r.nativeId,r.role,r.kind,r.parentId??null]);
const isString=s=>typeof s==='string'&&s.length>0&&s.length<=512;
const sameScope=(a,b)=>a?.origin===b?.origin&&a?.account===b?.account&&a?.surface===b?.surface;
const sameRecord=(a,b)=>key(a)===key(b);
function validRecords(records,feature) {
  if (!Array.isArray(records) || records.length>10000)return false;
  const keys=[];
  for(const r of records) {
    if(!r || !isString(r.nativeId) || !isString(r.role) || !isString(r.kind) ||
      !Number.isSafeInteger(r.sequence) || r.sequence<0 ||
      (r.parentId!==undefined && r.parentId!==null && !isString(r.parentId))) return false;
    if(feature==='user-turn' && r.role!=='user')return false;
    if(feature==='assistant-turn' && r.role!=='assistant')return false;
    keys.push(key(r));
  }
  return new Set(keys).size===keys.length;
}
function compare(reference,predicted) {
  const truth=new Set(reference.map(key)),seen=new Set(predicted.map(key));
  const tp=[...seen].filter(x=>truth.has(x)).length;
  return {truePositive:tp,falsePositive:seen.size-tp,falseNegative:truth.size-tp,
    precision:seen.size?tp/seen.size:0,recall:truth.size?tp/truth.size:0};
}
/**
 * readIndependentTruth: (captureId,feature) => {
 *   schema:TRUTH_SCHEMA,source:{captureId,rawDigest,domDigest},
 *   proofMethod:'provider-native-correlation'|'independently-reviewed-original',
 *   records:[{nativeId,role,kind,sequence,parentId?}]
 * }
 * The trusted provider of this callback must not derive its ground truth from
 * the adapter candidate under evaluation or echo client assertions.
 *
 * interpretCandidate: ({captureId,feature,rule}) =>
 *  {source:{captureId,rawDigest,domDigest},records:[...]}
 *
 * Both results must be bound to immutable original digest and session ID.
 * No real promotion is performed by a passing result.
 */
export async function evaluateStructuralRead({
  replay,lookupCapture,readIndependentTruth,interpretCandidate,fixtureMode=false
}={}) {
  if(!replay?.partition?.sourceIndependent || !['fixture-only-preview','read-only-preview-eligible'].includes(replay.status))
    fail('INELIGIBLE_DISCOVERY_REPLAY');
  if(typeof lookupCapture!=='function'||typeof readIndependentTruth!=='function'
    ||typeof interpretCandidate!=='function')fail('TRUSTED_READ_CALLBACKS_REQUIRED');
  const ids=replay.partition.heldoutIds, features=replay.requiredFeatures;
  if(!Array.isArray(ids)||ids.length<2||new Set(ids).size!==ids.length ||
    !Array.isArray(features)||!features.length||features.some(f=>!allowed.includes(f)))
    fail('INVALID_EVALUATION_SCOPE');
  if(replay.partition.fixtureOnly&&!fixtureMode)fail('SYNTHETIC_SEMANTICS_NOT_AUTHORIZED');

  const checks=[];let totalTP=0,totalFP=0,totalFN=0;
  for(const captureId of ids) {
    const canonical=await lookupCapture(captureId);
    if(!canonical?.verifiedOriginal || !sameScope(canonical.scope,replay.scope)
      || canonical.source?.captureId!==captureId
      || canonical.evidenceClass!==replay.partition.evidenceClass)
      fail('UNVERIFIED_SEMANTIC_SOURCE');
    for(const feature of features) {
      const rule=replay.candidate?.features?.[feature]?.selected;
      if(!rule || !['shadow-ready','provisional'].includes(rule.status))
        fail('MISSING_TESTED_READ_RULE');
      const reference=await readIndependentTruth(captureId,feature);
      const actual=await interpretCandidate({captureId,feature,rule});
      const src=canonical.source;
      const bindingMatches=(x)=>x?.source?.captureId===captureId &&
        x.source.rawDigest===src.rawDigest && x.source.domDigest===src.domDigest;
      if(reference?.schema!==TRUTH_SCHEMA || !bindingMatches(reference)
        || !['provider-native-correlation','independently-reviewed-original'].includes(reference.proofMethod)
        || !bindingMatches(actual))fail('SEMANTIC_EVIDENCE_UNBOUND');
      if(!validRecords(reference.records,feature) || !reference.records.length
        || !validRecords(actual.records,feature))fail('INVALID_SEMANTIC_RECORDS');
      const scores=compare(reference.records,actual.records);
      totalTP+=scores.truePositive;totalFP+=scores.falsePositive;totalFN+=scores.falseNegative;
      checks.push({captureId,feature,proofMethod:reference.proofMethod,
        ...scores,passed:scores.falsePositive===0&&scores.falseNegative===0});
    }
  }
  const passed=checks.length===ids.length*features.length && checks.every(c=>c.passed);
  return Object.freeze({
    schema:STRUCTURAL_VERDICT_SCHEMA,scope:{...replay.scope},fixtureOnly:replay.partition.fixtureOnly,
    status:passed?(replay.partition.fixtureOnly?'synthetic-semantic-preview':'independent-semantic-read-validated')
      :'quarantined',
    counts:{heldout:ids.length,features:features.length,cases:checks.length,
      truePositive:totalTP,falsePositive:totalFP,falseNegative:totalFN},
    checks,sourceQualified:true,semanticReadValidated:passed,
    productionActivationAuthorized:false,sendAuthorized:false,goalFulfilled:false
  });
}
