// Four-lane integration glue (Z.ai): binds the I1 adapter-improvement pipeline to the
// EXISTING Studio owners — real acceptance producer, real session store, real VersionedStore.
// No second registry, no second browser actor, no new effect authority:
//   - verifyCapture          -> independently re-reads acceptance (G1-G7) + recomputes raw/DOM
//                               digests from the saved session; a client boolean is never trusted.
//   - getTrustedManifests    -> mints server-side session manifests; `lineage` derives ONLY from
//                               immutable capture provenance (rawDigest|domDigest|seqRange), so
//                               re-exports/remounts with new session ids cannot forge independence.
//   - store                  -> expected-version CAS wrapper over the existing VersionedStore
//                               (thin adapter: the SHARED VersionedStore owns the per-name lock,
//                               validation and strict compare-and-save; stale locks fail closed).
// Promotion runs only from SERVER-MINTED proposals (in-memory ledger); an HTTP client can
// submit a digest, never the proposal object. Synthetic evidence can only ever yield
// `test-only-preview` — the pipeline refuses synthetic production promotion by construction.
import { createHash } from 'node:crypto';
import { Session } from '../store/session.mjs';
import { readAcceptance, rawDigest, domDigest } from '../capture/acceptance.mjs';
import { createGuardedStudioLearner } from './four-lane-gates.mjs';
import { createStudioAdapterLearner } from './adapter-studio-bridge.mjs';
import chatgptSeed from '../profiles/sites/chatgpt.mjs';
import claudeSeed from '../profiles/sites/claude.mjs';
import geminiSeed from '../profiles/sites/gemini.mjs';
const KNOWN_SEEDS=Object.freeze({chatgpt:chatgptSeed,claude:claudeSeed,gemini:geminiSeed});
// Canonical existing profiles only: never let a client supply a weak baseline for promotion.
export function trustedReadSeed(scope) {
  const seed=KNOWN_SEEDS[scope?.siteId];
  if(!seed)return null;
  let host;try{host=new URL(scope.origin).hostname;}catch{return null;}
  return seed.hosts.includes(host)?seed:null;
}

const sha256hex = (x) => createHash('sha256').update(x).digest('hex');
const coded = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });

/** Thin I1 adapter over the SHARED persistence owner (VersionedStore, issue #81 P0).
 * All locking, name/version validation, atomic writes and expected-version compare-and-save
 * live in src/store/versioned.mjs; this wrapper only maps an I1 scope key onto a store name
 * (`i1-` + sha256(scopeKey)[0..40]) and enforces the read-only payload rule. It has no lock,
 * no file descriptor and no second CAS implementation, so the factory and I1 cannot diverge.
 *  - promote(name, payload, expectedVersion): null = first write (must not exist), integer =
 *    must equal CURRENT; undefined/0/strings/NaN are rejected (CAS_EXPECTED_VERSION_INVALID).
 *  - rollback(name, targetVersion, expectedVersion): integer expectedVersion only; APPENDS a
 *    new version restoring the target (CURRENT only moves forward, so stale bases stay stale).
 * Locks are never auto-cleared (CAS_LOCKED until an operator uses inspectLock/releaseStaleLock). */
export function createCasVersionedStore({ store, lockDir } = {}) { // lockDir is accepted for compatibility and ignored
  void lockDir;
  if (!store || typeof store.compareAndSave !== 'function' || typeof store.compareAndRollback !== 'function' || typeof store.load !== 'function' ||
      typeof store.current !== 'function' || typeof store.versions !== 'function')
    throw new TypeError('VERSIONED_STORE_REQUIRED');
  // Scope keys are JSON strings (pipeline contract); store names must be filesystem-safe.
  // The mapping is deterministic and injective in practice: sha256(scopeKey).
  const storeName = (name) => 'i1-' + sha256hex(String(name)).slice(0, 40);
  return {
    async current(name) {
      // Read view only: any unreadable/corrupt/unselectable head is "not selectable" (never guessed).
      // Mutations do NOT use this: the store compares the raw CURRENT integer, so such a head can never look absent.
      try {
        const sn = storeName(name);
        if (store.current(sn) === null) return null;
        const rec = store.load(sn);
        if (rec?.sendPermission !== false || !rec?.adapter) return null; // only read-only records are selectable
        return { version: rec.version, adapter: rec.adapter, status: 'active',
          sendPermission: false, readFeatures: Array.isArray(rec.readFeatures) ? rec.readFeatures : [] };
      } catch { return null; }
    },
    async promote(name, payload, expectedVersion) {
      if (!payload || payload.sendPermission !== false) throw coded('CAS_PAYLOAD_MUST_BE_READ_ONLY');
      const rec = store.compareAndSave(storeName(name), payload, { expectedVersion, changeNote: payload.changeNote || 'I1 read-only adapter promotion' });
      return { version: rec.version, name: rec.name, schema: payload.schema, sendPermission: false };
    },
    async rollback(name, targetVersion, expectedVersion) {
      if (!Number.isSafeInteger(targetVersion) || targetVersion < 1) throw coded('INVALID_ROLLBACK_VERSION');
      const rec = store.compareAndRollback(storeName(name), targetVersion, { expectedVersion });
      return { name: rec.name, version: rec.version, restoredFrom: rec.restoredFrom, fromVersion: expectedVersion, rolledBack: true };
    },
  };
}
/** Server-side evidence verifier + trusted manifest provider over the REAL session store. */
export function createTrustedManifestProvider({ sessionsDir } = {}) {
  if (typeof sessionsDir !== 'string' || !sessionsDir) throw new TypeError('SESSIONS_DIR_REQUIRED');
  const verifySession = (sessionId) => {
    if (typeof sessionId !== 'string' || !sessionId) return null;
    let session;
    try { session = Session.open(sessionsDir, sessionId); } catch { return null; }
    if (!session || session.id !== sessionId) return null; // prefix or remount ambiguity fails closed
    const doc = readAcceptance(session);
    if (!doc || doc.verdict !== 'capture_accepted' || !doc.binding?.rawDigest || !doc.binding?.domDigest) return null;
    for (const g of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']) {
      if (doc.gates?.[g]?.value !== 'passed') return null;
    }
    const rd = rawDigest(session); // independent re-verification against the saved bytes
    if (!rd || rd.digest !== doc.binding.rawDigest || !rd.files) return null;
    const dd = domDigest(session);
    if (!dd || dd !== doc.binding.domDigest) return null;
    return { session, acceptance: doc, rawDigest: rd.digest, domDigest: dd, seqRange: doc.binding.seqRange ?? null };
  };
  async function verifyCapture({ scope, source } = {}) {
    if (!source || typeof source.sessionId !== 'string') return false;
    const v = verifySession(source.sessionId);
    if (!v) return false;
    if (v.rawDigest !== source.rawDigest) return false;
    // Corroborate origin when the session recorded its target; fail on mismatch, never invent.
    const url = v.session.meta?.target?.url;
    if (typeof url === 'string' && url) {
      try { if (new URL(url).origin !== scope?.origin) return false; } catch { return false; }
    }
    return true;
  }
  async function getTrustedManifests({ scope, training, heldout } = {}) {
    const idOf = (e) => (typeof e === 'string' ? e : e?.source?.sessionId ?? null);
    const mint = (sessionId) => {
      const v = verifySession(sessionId);
      if (!v) throw coded('MANIFEST_SESSION_NOT_VERIFIED', { sessionId });
      const seq = v.seqRange;
      // Lineage from immutable content provenance only (digests + sequence range), never
      // filenames, client ids or timestamps: same bytes => same lineage => reuse detected.
      const lineage = sha256hex(JSON.stringify([v.rawDigest, v.domDigest, Array.isArray(seq) ? seq : null]));
      return { id: sessionId, lineage,
        scope: { siteId: scope?.siteId ?? null, origin: scope?.origin ?? null,
          account: scope?.accountRef ?? null, surface: scope?.surface ?? null },
        sourceDigest: v.rawDigest, coverage: 'complete', coreAccepted: true, sourceQualified: true };
    };
    if (!Array.isArray(training) || !Array.isArray(heldout)) throw coded('MANIFEST_SETS_REQUIRED');
    // One manifest per distinct session (events of the same session share one source).
    return { training: [...new Set(training.map(idOf))].map(mint), heldout: [...new Set(heldout.map(idOf))].map(mint) };
  }
  return { verifyCapture, getTrustedManifests, verifySession };
}

/** Full integrated learner. `propose` runs the guarded pipeline (manifest qualification ->
 * intake verification -> Round 8 synthesis -> Round 9 holdout independence -> shadow evaluation);
 * successful proposals are minted server-side into a digest ledger, which is the ONLY path to
 * `promote`. The ledger is intentionally in-memory: a restarted process re-proposes from
 * evidence instead of resurrecting authority. */
export function createStudioLearningPipeline({ sessionsDir, store, lockDir } = {}) {
  const provider = createTrustedManifestProvider({ sessionsDir });
  const casStore = createCasVersionedStore({ store, lockDir });
  // Two proposals doors into the SAME Round 8/9 machinery and the SAME CAS store:
  //  - guarded: manifest qualification + drift gate FIRST (the only production door);
  //  - raw: used ONLY for all-synthetic testOnly previews, which by design cannot pass
  //    core-acceptance manifests and can never be promoted (PROMOTION_NOT_ELIGIBLE).
  const rawLearner = createStudioAdapterLearner({ verifyCapture: provider.verifyCapture, store: casStore });
  const pipeline = createGuardedStudioLearner({
    verifyCapture: provider.verifyCapture, store: casStore, getTrustedManifests: provider.getTrustedManifests,
  });
  const ledger = new Map(); // proposalDigest -> { proposal, promoted }
  const allSynthetic = (events) => Array.isArray(events) && events.length > 0 &&
    events.every((e) => e?.source?.evidenceClass === 'SYNTHETIC_TEST');
  async function propose(args = {}) {
      const qualifiedArgs={...args,seed:trustedReadSeed(args.scope)};
      const proposal = (args?.testOnly === true && allSynthetic(args.training) && allSynthetic(args.heldout))
        ? await rawLearner.propose(qualifiedArgs)
        : await pipeline.propose(qualifiedArgs);
      if (proposal?.proposalDigest) ledger.set(proposal.proposalDigest, { proposal, promoted: false });
      return proposal;
  }
  // The hub's /adapters/intelligence/propose accepts saved session IDs, not arbitrary
  // probe objects. Convert through the SAME accepted-session reader; raw client IDs are
  // never a manifest or identity attestation. Unsupported DOM shapes abstain.
  function eventsFromSessions(ids,scope) {
    if(!Array.isArray(ids)||ids.length<1||ids.length>2000||ids.some(x=>typeof x!=='string'||!x))
      throw coded('SESSION_IDS_REQUIRED');
    const acceptedAttributes=new Set(['data-testid','data-message-author-role','data-actor','data-role','aria-label']);
    return ids.map(sessionId=>{
      const v=provider.verifySession(sessionId);
      if(!v)throw coded('MANIFEST_SESSION_NOT_VERIFIED',{sessionId});
      if(v.session.meta?.site!==scope.siteId)throw coded('SESSION_SITE_MISMATCH',{sessionId});
      let origin=null;
      try{origin=new URL(v.session.meta?.target?.url).origin;}catch{}
      if(origin!==scope.origin)throw coded('SESSION_ORIGIN_MISMATCH',{sessionId});
      // The account source remains at the existing caller-scoped trust tier until
      // Core emits accepted account provenance; never infer it from page content.
      const evidenceRef=sessionId+':dom:'+v.domDigest.slice(0,12);
      const turns=v.session.kv.get('DOM_TURNS')??[];
      const observations=(Array.isArray(turns)?turns:[]).flatMap(turn=>{
        if(!['user','assistant'].includes(turn?.role)||!acceptedAttributes.has(turn.roleAttribute)||
          turn.roleMatch==='suffix'||turn.identityVerdict!=='verified'||
          typeof turn.identityRef!=='string'||!turn.identityRef)return [];
        return [{feature:turn.role==='user'?'user-turn':'assistant-turn',
          attributes:{[turn.roleAttribute]:turn.roleValue??turn.role},outcome:'present',
          identityRole:turn.role,identityVerdict:'verified',identityRef:turn.identityRef,evidenceRef}];
      });
      if(!observations.length)throw coded('NO_VERIFIED_READ_SIGNALS',{sessionId});
      return {scope:{...scope},source:{captureId:sessionId,sessionId,
        sequence:1,rawDigest:v.rawDigest,origin,accountRef:scope.accountRef,
        carrier:'dom',coverage:'complete',evidenceClass:'SAVED_REAL_CAPTURE',evidenceRef},
        observations};
    });
  }
  async function proposeFromSessions(args={}) {
    const scope=args.scope;
    const training=eventsFromSessions(args.training,scope);
    const heldout=eventsFromSessions(args.heldout,scope);
    return propose({...args,training,heldout});
  }
  async function evolveFromSessions(args={}) {
    if(args.testOnly===true)throw coded('AUTONOMOUS_PRODUCTION_ONLY');
    const training=eventsFromSessions(args.training,args.scope);
    const heldout=eventsFromSessions(args.heldout,args.scope);
    return evolve({...args,training,heldout});
  }
  async function promote(proposalDigest) {
      const entry = typeof proposalDigest === 'string' ? ledger.get(proposalDigest) : null;
      if (!entry) throw coded('PROPOSAL_NOT_SERVER_MINTED');
      if (entry.promoted) throw coded('PROPOSAL_ALREADY_PROMOTED');
      let out;
      try { out = await pipeline.promote(entry.proposal); }
      catch (e) {
        // A durable commit whose lock release was unverified MUST NOT be retried as a new promotion.
        if (e?.committed === true) { entry.promoted = true; entry.result = { committed: true, committedVersion: e.committedVersion ?? null }; }
        throw e;
      }
      entry.promoted = true;
      entry.result = out;
      return out;
  }
  // Called only for incoming Core-qualified evidence, never by polling. The existing
  // independent-holdout gate, server-minted ledger and VersionedStore CAS own authority.
  async function evolve(args = {}) {
    if(args.testOnly===true)throw coded('AUTONOMOUS_PRODUCTION_ONLY');
    const proposal=await propose({...args,testOnly:false});
    if(proposal.status!=='ready-for-read-only-promotion')
      return {status:'abstained',reason:proposal.status,proposalDigest:proposal.proposalDigest,
        metrics:proposal.metrics,drift:proposal.drift,sendPermission:false};
    const saved=await promote(proposal.proposalDigest);
    return {status:'promoted',proposalDigest:proposal.proposalDigest,version:saved.version,
      metrics:proposal.metrics,drift:proposal.drift,sendPermission:false};
  }
  return {
    propose,proposeFromSessions,promote,evolve,evolveFromSessions,
    rollback: (scope, targetVersion, expectedVersion) => pipeline.rollback(scope, targetVersion, expectedVersion),
    resolveRead: (scope, seed, opts) => pipeline.resolveRead(scope, seed, opts),
    selectReadRule: (scope, feature, seedRule, opts) => pipeline.selectReadRule(scope, feature, seedRule, opts),
    listProposals: () => [...ledger.entries()].map(([digest, e]) => ({
      proposalDigest: digest, status: e.proposal.status, scopeKey: e.proposal.scopeKey,
      evidenceClass: e.proposal.evidenceClass, baseVersion: e.proposal.baseVersion, promoted: e.promoted,
    })),
    getProposal: (digest) => (typeof digest === 'string' ? ledger.get(digest)?.proposal ?? null : null),
  };
}
