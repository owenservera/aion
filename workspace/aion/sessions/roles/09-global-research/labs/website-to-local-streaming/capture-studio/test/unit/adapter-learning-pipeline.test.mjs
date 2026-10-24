// Four-lane integration: guarded I1 adapter-improvement pipeline over REAL Studio owners.
// Sessions are real on-disk Session stores; acceptance documents are written through the
// canonical writeAcceptance producer with digests recomputed from the saved bytes, so the
// trusted manifest provider verifies them the same way it verifies production evidence.
// Synthetic evidence can only ever yield test-only-preview and is refused at promotion.
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Session } from '../../src/store/session.mjs';
import { VersionedStore } from '../../src/store/versioned.mjs';
import { writeAcceptance, rawDigest, domDigest } from '../../src/capture/acceptance.mjs';
import { createCasVersionedStore, createStudioLearningPipeline } from '../../src/studio/adapter-learning-pipeline.mjs';

const ORIGIN = 'https://webapp-x.test';
const SCOPE = { siteId: 'webapp-x', origin: ORIGIN, surface: 'chat', accountRef: 'acct-1' };

function rig() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'aion-fourlane-'));
  const sessionsDir = path.join(root, 'sessions');
  const store = new VersionedStore(path.join(root, 'learned-adapters'), { kind: 'learned adapter' });
  const pipeline = createStudioLearningPipeline({ sessionsDir, store, lockDir: path.join(root, 'locks') });
  return { root, sessionsDir, store, pipeline };
}

let sessionNonce = 0;
// One real session whose raw bytes, DOM snapshot and acceptance document all agree.
// Every session carries DISTINCT bytes: identical captures would (correctly) be rejected
// as the same evidence lineage re-exported under new session ids.
async function verifiedSession(sessionsDir, { reject = false, noAcceptance = false } = {}) {
  const n = ++sessionNonce;
  const s = Session.create(sessionsDir, { site: SCOPE.siteId, meta: { target: { url: `${ORIGIN}/chat` } } });
  s.raw.append({ kind: 'network', url: `${ORIGIN}/chat`, nonce: n });
  s.raw.append({ kind: 'network', url: `${ORIGIN}/reply`, nonce: n });
  await s.raw.close();
  const turns = [{ role: 'user', text: `hello ${n}` }, { role: 'assistant', text: `hi ${n}` }];
  await s.kv.set('DOM_TURNS', turns);
  const rd = rawDigest(s);
  const dd = domDigest(s);
  if (!noAcceptance) {
    writeAcceptance(s, {
      schema: 'capture-studio.acceptance/1', evaluator: { version: '1.1.0' }, evaluatedAt: new Date().toISOString(),
      binding: { rawDigest: rd.digest, domDigest: dd, seqRange: [1, 2], recipe: { id: 'clean-data-gate', version: 1 } },
      gates: Object.fromEntries(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'].map((g) => [g, { value: reject ? 'failed' : 'passed', reason: 'four-lane integration fixture', evidence: {} }])),
      verdict: reject ? 'capture_rejected' : 'capture_accepted', reasons: [],
    });
  }
  return { session: s, id: s.id, rawDigest: rd.digest, domDigest: dd, evidenceRef: `${s.id}:dom` };
}

function evidenceEvent(bundle, { role = 'user', attr = 'data-role' } = {}) {
  const feature = role === 'assistant' ? 'assistant-turn' : 'user-turn';
  const obs = (f, r) => ({
    feature: f, attributes: { [attr]: r }, outcome: 'present',
    identityVerdict: 'verified', identityRef: `${r}-${bundle.id}`, identityRole: r,
    evidenceRef: bundle.evidenceRef,
  });
  return {
    scope: { ...SCOPE },
    source: {
      captureId: bundle.id, sessionId: bundle.id, sequence: 1, rawDigest: bundle.rawDigest,
      origin: SCOPE.origin, accountRef: SCOPE.accountRef, evidenceClass: 'SAVED_REAL_CAPTURE',
      carrier: 'dom', coverage: 'complete', evidenceRef: bundle.evidenceRef,
    },
    // each session carries both identity-linked read roles, like a real chat page would
    observations: [obs('user-turn', 'user'), obs('assistant-turn', 'assistant')],
    __roleFeature: feature,
  };
}

function syntheticEvent(n) {
  return {
    scope: { ...SCOPE },
    source: {
      captureId: `syn-${n}`, sessionId: `syn-${n}`, sequence: 0, rawDigest: ('a'.repeat(63) + (n % 16).toString(16)),
      origin: SCOPE.origin, accountRef: SCOPE.accountRef, evidenceClass: 'SYNTHETIC_TEST',
      carrier: 'dom', coverage: 'complete', evidenceRef: `syn-${n}:dom`,
    },
    observations: [{
      feature: 'assistant-turn', attributes: { 'data-role': 'assistant' }, outcome: 'present',
      identityVerdict: 'verified', identityRef: `assistant-syn-${n}`, identityRole: 'assistant',
      evidenceRef: `syn-${n}:dom`,
    }],
  };
}

test('end-to-end: verified saved sessions propose, mint, promote read-only, resolve and roll back', async () => {
  const { root, store, pipeline } = rig();
  try {
    const t1 = await verifiedSession(root + '/sessions');
    const t2 = await verifiedSession(root + '/sessions');
    const t3 = await verifiedSession(root + '/sessions');
    const h1 = await verifiedSession(root + '/sessions');
    const h2 = await verifiedSession(root + '/sessions');
    const proposal = await pipeline.propose({
      scope: SCOPE, trigger: 'new-evidence',
      training: [evidenceEvent(t1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    });
    assert.equal(proposal.schema, 'aion.adapter-improvement-proposal/1');
    assert.equal(proposal.evidenceClass, 'SAVED_REAL_CAPTURE');
    assert.equal(proposal.authority.sendPermission, false);
    assert.ok(proposal.independent?.independent === true, 'Round 9 holdout gate must pass');
    assert.ok(['ready-for-read-only-promotion', 'no-improvement'].includes(proposal.status), `unexpected status ${proposal.status}`);
    assert.ok(Array.isArray(proposal.eligibleFeatures) && proposal.eligibleFeatures.length > 0, 'read features must be eligible');

    const promoted = await pipeline.promote(proposal.proposalDigest);
    assert.equal(promoted.sendPermission, false);
    assert.equal(promoted.version, 1);
    // the record is visible through the SAME VersionedStore the factory registry reads,
    // under the deterministic safe name derived from the scope key
    const safeName = 'i1-' + createHash('sha256').update(proposal.scopeKey).digest('hex').slice(0, 40);
    const rec = store.load(safeName, 1);
    assert.equal(rec.sendPermission, false);
    assert.equal(rec.schema, 'aion.learned-read-adapter/1');

    const read = await pipeline.resolveRead(SCOPE, { id: 'seed' });
    assert.equal(read.source, 'learned');
    assert.equal(read.sendPermission, false);
    // rule selection without fresh current-page proof falls back to the seed (fail-closed)
    const rule = await pipeline.selectReadRule(SCOPE, 'assistant-turn', '[data-role="assistant"]');
    assert.equal(rule.source, 'seed-fallback');
    assert.equal(rule.reason, 'FRESH_PAGE_PROOF_MISSING');

    // re-propose with fresh evidence -> second version; rollback to v1 under CAS
    const h3 = await verifiedSession(root + '/sessions');
    const p2 = await pipeline.propose({
      scope: SCOPE, trigger: 'new-evidence',
      training: [evidenceEvent(t1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h3)],
    });
    if (p2.status === 'ready-for-read-only-promotion') {
      await pipeline.promote(p2.proposalDigest);
      const rb = await pipeline.rollback(SCOPE, 1, 2);
      assert.equal(rb.rolledBack, true);
      assert.equal(rb.fromVersion, 2);
      const read2 = await pipeline.resolveRead(SCOPE, null);
      assert.equal(read2.source, 'learned'); // v1 pointer restored, still read-only
    } else {
      const proposals = pipeline.listProposals();
      assert.ok(proposals.length >= 1);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('promotion authority is server-minted only: forged digests and synthetic evidence cannot promote', async () => {
  const { root, pipeline } = rig();
  try {
    await assert.rejects(() => pipeline.promote('f'.repeat(64)), (e) => e.code === 'PROPOSAL_NOT_SERVER_MINTED');
    // synthetic (non-testOnly) evidence never reaches synthesis: the guarded door demands
    // core-accepted manifests first and refuses unverified sessions
    await assert.rejects(() => pipeline.propose({
      scope: SCOPE, training: [syntheticEvent(1), syntheticEvent(2), syntheticEvent(3)],
      heldout: [syntheticEvent(4), syntheticEvent(5)],
    }), (e) => e.code === 'MANIFEST_SESSION_NOT_VERIFIED');
    // testOnly synthetic proposals stay preview-only and can never promote
    const preview = await pipeline.propose({
      scope: SCOPE, testOnly: true,
      training: [syntheticEvent(1), syntheticEvent(2), syntheticEvent(3)],
      heldout: [syntheticEvent(4), syntheticEvent(5)],
    });
    assert.equal(preview.status, 'test-only-preview');
    await assert.rejects(() => pipeline.promote(preview.proposalDigest), (e) => e.code === 'PROMOTION_NOT_ELIGIBLE');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('evidence verification fails closed on missing acceptance, rejected gates and digest mismatch', async () => {
  const { root, pipeline } = rig();
  try {
    const t1 = await verifiedSession(root + '/sessions', { noAcceptance: true });
    const t2 = await verifiedSession(root + '/sessions');
    const t3 = await verifiedSession(root + '/sessions');
    const h1 = await verifiedSession(root + '/sessions');
    const h2 = await verifiedSession(root + '/sessions');
    await assert.rejects(() => pipeline.propose({
      scope: SCOPE,
      training: [evidenceEvent(t1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    }), (e) => e.code === 'MANIFEST_SESSION_NOT_VERIFIED');

    const r1 = await verifiedSession(root + '/sessions', { reject: true });
    await assert.rejects(() => pipeline.propose({
      scope: SCOPE,
      training: [evidenceEvent(r1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    }), (e) => e.code === 'MANIFEST_SESSION_NOT_VERIFIED');

    const forged = evidenceEvent(t2);
    forged.source.rawDigest = 'f'.repeat(64);
    await assert.rejects(() => pipeline.propose({
      scope: SCOPE,
      training: [evidenceEvent(t2), forged, evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    }), (e) => ['CAPTURE_NOT_CORE_VERIFIED', 'EVENT_MANIFEST_MISMATCH'].includes(e.code));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('drift trigger requires independent consecutive-window evidence before proposing', async () => {
  const { root, pipeline } = rig();
  try {
    const driftEvidence = [{
      scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's1', lineage: 'l1', window: 0, outcome: 'present',
      candidate: '[data-new]', sourceQualified: true, coreAccepted: true, coverage: 'complete',
    }];
    const t1 = await verifiedSession(root + '/sessions');
    const t2 = await verifiedSession(root + '/sessions');
    const t3 = await verifiedSession(root + '/sessions');
    const h1 = await verifiedSession(root + '/sessions');
    const h2 = await verifiedSession(root + '/sessions');
    await assert.rejects(() => pipeline.propose({
      scope: SCOPE, trigger: 'drift', incumbent: '[data-old]', newSelector: '[data-new]',
      driftEvidence,
      training: [evidenceEvent(t1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    }), (e) => e.code === 'MORE_INDEPENDENT_EVIDENCE_REQUIRED');
    // sufficient drift evidence passes the gate and the pipeline continues to synthesis
    const strong = [
      { scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's1', lineage: 'l1', window: 0, outcome: 'present', candidate: '[data-new]', sourceQualified: true, coreAccepted: true, coverage: 'complete' },
      { scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's2', lineage: 'l2', window: 1, outcome: 'present', candidate: '[data-new]', sourceQualified: true, coreAccepted: true, coverage: 'complete' },
      { scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's3', lineage: 'l3', window: 1, outcome: 'present', candidate: '[data-new]', sourceQualified: true, coreAccepted: true, coverage: 'complete' },
      { scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's4', lineage: 'l4', window: 0, outcome: 'absent', candidate: '[data-old]', sourceQualified: true, coreAccepted: true, coverage: 'complete' },
      { scope: { ...SCOPE, account: SCOPE.accountRef }, session: 's5', lineage: 'l5', window: 1, outcome: 'absent', candidate: '[data-old]', sourceQualified: true, coreAccepted: true, coverage: 'complete' },
    ];
    const proposal = await pipeline.propose({
      scope: SCOPE, trigger: 'drift', incumbent: '[data-old]', newSelector: '[data-new]',
      driftEvidence: strong,
      training: [evidenceEvent(t1), evidenceEvent(t2), evidenceEvent(t3)],
      heldout: [evidenceEvent(h1), evidenceEvent(h2)],
    });
    assert.equal(proposal.schema, 'aion.adapter-improvement-proposal/1');
    assert.ok(proposal.proposalDigest);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CAS store: expected-version conflicts and live locks fail closed without writes', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'aion-fourlane-cas-'));
  try {
    const store = new VersionedStore(path.join(root, 'learned-adapters'), { kind: 'learned adapter' });
    const cas = createCasVersionedStore({ store, lockDir: path.join(root, 'locks') });
    const first = await cas.promote('k', { schema: 'aion.learned-read-adapter/1', adapter: { a: 1 }, sendPermission: false, readFeatures: ['assistant-turn'] }, 0);
    assert.equal(first.version, 1);
    await assert.rejects(() => cas.promote('k', { schema: 'aion.learned-read-adapter/1', adapter: { a: 2 }, sendPermission: false, readFeatures: [] }, 0), (e) => e.code === 'CAS_VERSION_CONFLICT');
    const cur = await cas.current('k');
    assert.equal(cur.version, 1);
    assert.equal(cur.sendPermission, false);
    assert.deepEqual(cur.readFeatures, ['assistant-turn']);
    // a live lock file (crashed holder) blocks mutation instead of stealing it
    const { openSync, closeSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const lockName = path.join(root, 'locks', `.cas-${createHash('sha256').update('k').digest('hex')}.lock`);
    const fd = openSync(lockName, 'wx'); closeSync(fd);
    await assert.rejects(() => cas.promote('k', { schema: 'x', adapter: {}, sendPermission: false, readFeatures: [] }, 1), (e) => e.code === 'CAS_LOCKED');
    await assert.rejects(() => cas.rollback('k', 1, 1), (e) => e.code === 'CAS_LOCKED');
    existsSync(lockName) && rmSync(lockName);
    const rb = await cas.rollback('k', 1, 1);
    assert.equal(rb.rolledBack, true);
    // payload without explicit read-only permission is refused outright
    await assert.rejects(() => cas.promote('k2', { schema: 'x', adapter: {} }, 0), (e) => e.code === 'CAS_PAYLOAD_MUST_BE_READ_ONLY');
    const kName = 'i1-' + createHash('sha256').update('k').digest('hex').slice(0, 40);
    assert.ok(readFileSync(path.join(root, 'learned-adapters', kName, 'CURRENT'), 'utf8').trim() === '1');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
