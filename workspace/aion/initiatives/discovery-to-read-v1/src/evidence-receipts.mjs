// Discovery-to-Read V1: trust nothing carried by the candidate itself.
// The supplied lookupCapture callback MUST read authoritative original Capture Studio
// session/raw/DOM records inside the trusted server. This pure module is not an authenticator.
export const RECEIPT_SCHEMA = 'aion.discovery.observation-receipt/1';
export const PARTITION_SCHEMA = 'aion.discovery.independent-partitions/1';
const CLASSES = new Set(['SAVED_REAL_CAPTURE', 'WINDOWS_LIVE_ACCEPTED', 'SYNTHETIC_TEST']);
const FIELDS = ['captureId', 'lineageRoot', 'familyId', 'rawDigest', 'domDigest', 'seqStart', 'seqEnd'];
const SCOPE = ['origin', 'account', 'surface'];

function reject(code) { const e = new Error(code); e.code = code; throw e; }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function nonempty(s) { return typeof s === 'string' && s.length > 0 && s.length <= 512; }
function validOrigin(s) { try { const u = new URL(s); return u.protocol === 'https:' && u.origin === s; } catch { return false; } }
function sameScope(a, b) { return SCOPE.every(k => a?.[k] === b?.[k]); }
function unique(values) { return new Set(values).size === values.length; }

export async function qualifyObservation(receipt, { lookupCapture, allowSynthetic = false } = {}) {
  if (typeof lookupCapture !== 'function') reject('TRUSTED_LOOKUP_REQUIRED');
  if (!receipt || receipt.schema !== RECEIPT_SCHEMA || !receipt.scope || !receipt.source) reject('INVALID_RECEIPT');
  if (!validOrigin(receipt.scope.origin) || !nonempty(receipt.scope.account) || !nonempty(receipt.scope.surface)) reject('INVALID_SCOPE');
  if (!CLASSES.has(receipt.evidenceClass)) reject('INVALID_EVIDENCE_CLASS');
  for (const f of FIELDS) {
    if (['seqStart', 'seqEnd'].includes(f)) {
      if (!Number.isSafeInteger(receipt.source[f]) || receipt.source[f] < 0) reject('INVALID_SEQUENCE');
    } else if (!nonempty(receipt.source[f])) reject('MISSING_SOURCE_BINDING');
  }
  if (receipt.source.seqEnd < receipt.source.seqStart) reject('INVALID_SEQUENCE');
  // Look up from the original capture ID. Never trust caller-asserted verified/accepted booleans.
  const canonical = await lookupCapture(receipt.source.captureId);
  if (!canonical || canonical.verifiedOriginal !== true || !sameScope(canonical.scope, receipt.scope)
    || canonical.evidenceClass !== receipt.evidenceClass) reject('UNVERIFIED_OR_MISMATCHED_SOURCE');
  if (!FIELDS.every(k => same(canonical.source?.[k], receipt.source[k]))) reject('SOURCE_BINDING_MISMATCH');
  if (receipt.evidenceClass === 'SYNTHETIC_TEST' && !allowSynthetic) reject('SYNTHETIC_REQUIRES_FIXTURE_MODE');
  // A verified observation can train read inference, but it is NOT G1-G7 acceptance
  // and cannot authorize activation, dispatch, completion or goal outcome.
  return Object.freeze({ schema: RECEIPT_SCHEMA, scope: Object.freeze({ ...receipt.scope }),
    source: Object.freeze({ ...receipt.source }), evidenceClass: receipt.evidenceClass,
    originalQualified: true, acceptedConversation: false, promotionAuthorized: false,
    sendAuthorized: false });
}

export async function assertIndependentPartitions({ training, heldout, lookupCapture,
  allowSynthetic = false, minTraining = 3, minHeldout = 2 } = {}) {
  if (!Array.isArray(training) || !Array.isArray(heldout)
    || training.length < minTraining || heldout.length < minHeldout) reject('INSUFFICIENT_INDEPENDENT_CAPTURES');
  const a = await Promise.all(training.map(x => qualifyObservation(x, { lookupCapture, allowSynthetic })));
  const b = await Promise.all(heldout.map(x => qualifyObservation(x, { lookupCapture, allowSynthetic })));
  const all = [...a, ...b];
  if (!all.every(x => sameScope(x.scope, all[0].scope))) reject('CROSS_SCOPE_CONTAMINATION');
  const classes = [...new Set(all.map(x => x.evidenceClass))];
  if (classes.includes('SYNTHETIC_TEST') && classes.length > 1) reject('SYNTHETIC_REAL_MIX');
  // Distinct capture IDs alone are insufficient: detect renamed copies, linked raw
  // sources, capture families and repeated immutable source bytes in either partition.
  for (const key of ['captureId', 'lineageRoot', 'familyId', 'rawDigest', 'domDigest']) {
    if (!unique(all.map(x => x.source[key]))) reject('NONINDEPENDENT_' + key.toUpperCase());
  }
  const trainingIds = a.map(x => x.source.captureId);
  const heldoutIds = b.map(x => x.source.captureId);
  return Object.freeze({ schema: PARTITION_SCHEMA, scope: Object.freeze({ ...all[0].scope }),
    trainingIds: Object.freeze(trainingIds), heldoutIds: Object.freeze(heldoutIds),
    trainingCount: a.length, heldoutCount: b.length,
    evidenceClass: classes[0], fixtureOnly: classes[0] === 'SYNTHETIC_TEST',
    sourceIndependent: true, readProposalEligible: true,
    // Independently qualified originals are necessary but not sufficient for
    // shadow accuracy, safe profile selection, atomic persistence or active promotion.
    productionActivationAuthorized: false, effectAuthorization: false });
}
