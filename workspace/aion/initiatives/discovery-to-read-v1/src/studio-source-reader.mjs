// Read-only adapter to the canonical Capture Studio saved Session and acceptance APIs.
// The browser, sender, effect journal and profile store remain owned by Studio.
//
// SECURITY: resolveTrustedIdentity MUST be supplied by an internal Studio run/journal
// reader, never by user/client-provided JSON. This module cannot infer account,
// acquisition family or immutable lineage from arbitrary raw DOM by itself.
import path from 'node:path';
import { realpathSync } from 'node:fs';
import { Session } from '../../../sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/session.mjs';
import { rawDigest, domDigest, readAcceptance } from '../../../sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/capture/acceptance.mjs';
import { RECEIPT_SCHEMA } from './evidence-receipts.mjs';

export const READER_SCHEMA = 'aion.discovery.studio-source-reader/1';
const ID_RE = /^[a-z0-9][a-z0-9_-]{0,127}$/i;
const CLASS = new Set(['SAVED_REAL_CAPTURE','WINDOWS_LIVE_ACCEPTED','SYNTHETIC_TEST']);
function fail(code) { const e = new Error(code); e.code = code; throw e; }
function str(x) { return typeof x === 'string' && x.length > 0 && x.length <= 512; }
function stableScope(s) {
  if (!s || !str(s.origin) || !str(s.account) || !str(s.surface)) return false;
  try { const u = new URL(s.origin); return u.protocol === 'https:' && u.origin === s.origin; }
  catch { return false; }
}
function snapshotRoot(dir,sessionsDir,id) {
  // Never accept an ambiguous Session.open() prefix or a traversal/linked directory.
  const root=path.resolve(sessionsDir),wanted=path.resolve(root,id);
  try { return path.resolve(dir)===wanted && realpathSync(dir)===realpathSync(wanted) &&
    realpathSync(path.dirname(dir))===realpathSync(root); }
  catch { return false; }
}

/**
 * Creates a trusted, source-bound read-only lookup for the initiative.
 * resolveTrustedIdentity(session) must return {
 *   bindingSessionId: session.id,
 *   targetId: session.meta.target.id,
 *   scope: {origin: https origin from captured target, account: canonical account, surface:'chat'},
 *   lineageRoot: immutable acquisition root,
 *   familyId: independent acquisition family,
 *   evidenceClass: SAVED_REAL_CAPTURE|WINDOWS_LIVE_ACCEPTED|SYNTHETIC_TEST
 * }.
 *
 * This verifies the *saved capture*, not the independent provenance of the
 * resolver itself: that remains the responsibility of the existing Studio owner.
 */
export function createStudioSourceReader({sessionsDir, resolveTrustedIdentity,
  openSession=(id)=>Session.open(sessionsDir,id),
  digestRaw=rawDigest,digestDom=domDigest,
  readStoredAcceptance=readAcceptance,
  allowSynthetic=false}={}) {
  if (!str(sessionsDir) || typeof resolveTrustedIdentity !== 'function')
    fail('STUDIO_SOURCE_AUTHORITY_REQUIRED');
  if (![openSession,digestRaw,digestDom,readStoredAcceptance].every(x=>typeof x==='function'))
    fail('INVALID_STUDIO_READER_DEPENDENCIES');

  async function lookupCapture(captureId) {
    if (!ID_RE.test(captureId ?? '')) fail('INVALID_CAPTURE_ID');
    // NO raw path input, prefix matching, caller-supplied session object or UI evidence.
    const session=await openSession(captureId);
    if (!session || session.id !== captureId || !snapshotRoot(session.dir,sessionsDir,captureId))
      fail('SESSION_IDENTITY_MISMATCH');
    if (session.meta?.status !== 'complete') fail('SESSION_NOT_FINAL');
    const target=session.meta?.target;
    if (!target || !str(target.url) || !str(target.id)) fail('MISSING_CAPTURE_TARGET');
    let origin;
    try { const url=new URL(target.url); if (url.protocol!=='https:') fail('UNSUPPORTED_CAPTURE_ORIGIN');origin=url.origin; }
    catch { fail('UNSUPPORTED_CAPTURE_ORIGIN'); }

    const before=String(digestRaw(session)?.digest ?? '');
    const beforeDom=digestDom(session);
    if (!/^[a-f0-9]{64}$/i.test(before) || !/^[a-f0-9]{64}$/i.test(beforeDom))
      fail('INVALID_SOURCE_DIGEST');

    const report=await session.verify();
    if (!report?.ok || !Number.isSafeInteger(report.records) || report.records===0
      || report.unexplainedSeqGaps!==0 || report.gapRecords!==0
      || report.droppedRecords!==0 || !Array.isArray(report.segments)
      || report.segments.length===0
      || !report.segments.every(s=>s.inManifest===true && s.shaMatches===true && s.torn===false))
      fail('RAW_INTEGRITY_UNVERIFIED');

    let seqStart=null,seqEnd=null,scanned=0;
    for await (const rec of session.records()) {
      if (!Number.isSafeInteger(rec.seq) || rec.seq < 0 ||
          !Number.isSafeInteger(rec.seqTo ?? rec.seq) || (rec.seqTo ?? rec.seq)<rec.seq)
        fail('INVALID_RAW_SEQUENCE');
      if (['corrupt','gap','body.excluded','body.truncated'].includes(rec.k))
        fail('RAW_COVERAGE_INCOMPLETE');
      seqStart??=rec.seq;seqEnd=rec.seqTo??rec.seq;scanned++;
    }
    if (!scanned || scanned!==report.records) fail('SOURCE_SCAN_MISMATCH');

    const identity=await resolveTrustedIdentity(session);
    if (!identity || identity.bindingSessionId!==captureId || identity.targetId!==target.id
      || !stableScope(identity.scope) || identity.scope.origin!==origin
      || !str(identity.lineageRoot) || !str(identity.familyId) ||
      !CLASS.has(identity.evidenceClass))
      fail('TRUSTED_IDENTITY_UNAVAILABLE');
    if (session.meta?.synthetic === true && identity.evidenceClass !== 'SYNTHETIC_TEST')
      fail('SYNTHETIC_REAL_MISCLASSIFIED');
    if (identity.evidenceClass==='SYNTHETIC_TEST' && !allowSynthetic)
      fail('SYNTHETIC_READER_DISABLED');

    const acceptance=readStoredAcceptance(session);
    // ReadAcceptance checks stored raw + DOM bindings; it does NOT independently
    // validate conversational context/G1–G3. Keep it as separately named evidence.
    const conversationAccepted=acceptance?.verdict==='capture_accepted'
      && ['G1','G2','G3','G4','G5','G6','G7'].every(k=>acceptance?.gates?.[k]?.value==='passed')
      && acceptance?.binding?.rawDigest===before
      && acceptance?.binding?.domDigest===beforeDom
      && acceptance?.binding?.seqRange?.[0]===seqStart
      && acceptance?.binding?.seqRange?.[1]===seqEnd;

    const after=String(digestRaw(session)?.digest ?? ''),afterDom=digestDom(session);
    if (after!==before || afterDom!==beforeDom) fail('SOURCE_CHANGED_DURING_READ');
    return Object.freeze({
      schema:READER_SCHEMA,verifiedOriginal:true,
      scope:Object.freeze({origin,account:identity.scope.account,surface:identity.scope.surface}),
      evidenceClass:identity.evidenceClass,
      source:Object.freeze({captureId,lineageRoot:identity.lineageRoot,familyId:identity.familyId,
        rawDigest:before,domDigest:beforeDom,seqStart,seqEnd}),
      acceptance:Object.freeze({verdict:acceptance?.verdict ?? 'unassessed',
        conversationAccepted,sourceBound:conversationAccepted}),
      // These are always false: the receipt never admits effects, profile
      // promotion, or goals on its own.
      productionActivationAuthorized:false,sendAuthorized:false,
    });
  }

  async function mintReceipt(captureId) {
    const original=await lookupCapture(captureId);
    return {schema:RECEIPT_SCHEMA,scope:{...original.scope},
      evidenceClass:original.evidenceClass,source:{...original.source}};
  }
  return Object.freeze({lookupCapture,mintReceipt});
}
