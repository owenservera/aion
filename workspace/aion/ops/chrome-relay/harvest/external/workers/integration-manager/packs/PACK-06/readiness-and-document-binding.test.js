/**
 * PACK-06 offline fixtures. No browser, no chrome.* API, no timers, no network.
 * Run: node --test packs/PACK-06/
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  captureTopFrameDocumentId,
  decideLoginStatus,
  evaluateSenderBinding,
  verifyBoundDocument,
} from './readiness-and-document-binding.js';

const signal = (overrides = {}) => ({
  ready: true,
  explicitlyLoggedOut: false,
  now: 10_000,
  lossDelayMs: 5_000,
  ...overrides,
});

// --- readiness tri-state ---------------------------------------------------

test('a mounted composer reports ready immediately', () => {
  const decision = decideLoginStatus({}, signal());
  assert.deepEqual(decision.state, { reported: true });
  assert.equal(decision.report, true);
  assert.equal(decision.retryInMs, undefined);
});

test('an unchanged ready state is not re-reported', () => {
  const decision = decideLoginStatus({ reported: true }, signal());
  assert.equal(decision.report, undefined);
});

test('an explicit login surface reports logged out immediately', () => {
  const decision = decideLoginStatus({ reported: true }, signal({ ready: false, explicitlyLoggedOut: true }));
  assert.deepEqual(decision.state, { reported: false });
  assert.equal(decision.report, false);
});

test('repeated explicit logout is not re-reported', () => {
  const decision = decideLoginStatus({ reported: false }, signal({ ready: false, explicitlyLoggedOut: true }));
  assert.equal(decision.report, undefined);
});

test('unknown readiness reports checking, never logged out', () => {
  const decision = decideLoginStatus({ reported: true }, signal({ ready: null }));
  assert.deepEqual(decision.state, { reported: null });
  assert.equal(decision.report, null);
  assert.notEqual(decision.report, false);
});

test('an already-checking state is not re-reported', () => {
  const decision = decideLoginStatus({ reported: null }, signal({ ready: null }));
  assert.equal(decision.report, undefined);
});

test('a missing composer inside the loss delay defers with a retry hint', () => {
  const decision = decideLoginStatus({}, signal({ ready: false }));
  assert.equal(decision.report, undefined);
  assert.equal(decision.retryInMs, 5_000);
  assert.deepEqual(decision.state, { missingSince: 10_000 });
});

test('the retry hint shrinks as the loss delay elapses', () => {
  const decision = decideLoginStatus(
    { missingSince: 9_000 },
    signal({ ready: false }),
  );
  assert.equal(decision.retryInMs, 4_000);
  assert.equal(decision.report, undefined);
});

test('a composer missing beyond the loss delay reports logged out', () => {
  const decision = decideLoginStatus(
    { missingSince: 4_000 },
    signal({ ready: false }),
  );
  assert.deepEqual(decision.state, { reported: false });
  assert.equal(decision.report, false);
  assert.equal(decision.retryInMs, undefined);
});

test('an existing logged-out report is sticky', () => {
  const previous = { reported: false };
  const decision = decideLoginStatus(previous, signal({ ready: false }));
  assert.equal(decision.state, previous);
  assert.equal(decision.report, undefined);
});

test('a zero loss delay reports immediately, and a negative delay is clamped', () => {
  assert.equal(decideLoginStatus({}, signal({ ready: false, lossDelayMs: 0 })).report, false);
  assert.equal(decideLoginStatus({}, signal({ ready: false, lossDelayMs: -1 })).report, false);
});

test('an explicit logout wins over an otherwise ready composer', () => {
  const decision = decideLoginStatus({}, signal({ ready: true, explicitlyLoggedOut: true }));
  assert.equal(decision.report, false);
});

// --- document identity -----------------------------------------------------

test('a single top-frame result yields the document id', () => {
  assert.equal(captureTopFrameDocumentId([{ frameId: 0, documentId: 'doc-1' }]), 'doc-1');
});

test('multiple injection results cannot prove one document', () => {
  assert.equal(
    captureTopFrameDocumentId([
      { frameId: 0, documentId: 'doc-1' },
      { frameId: 0, documentId: 'doc-2' },
    ]),
    undefined,
  );
});

test('a non-top frame result is refused', () => {
  assert.equal(captureTopFrameDocumentId([{ frameId: 3, documentId: 'doc-1' }]), undefined);
});

test('a result without a document id is refused', () => {
  assert.equal(captureTopFrameDocumentId([{ frameId: 0 }]), undefined);
  assert.equal(captureTopFrameDocumentId([{ frameId: 0, documentId: '' }]), undefined);
});

test('a non-array injection result is refused', () => {
  assert.equal(captureTopFrameDocumentId(undefined), undefined);
  assert.equal(captureTopFrameDocumentId({ frameId: 0, documentId: 'doc-1' }), undefined);
});

// --- sender binding --------------------------------------------------------

test('a request without a bound document cannot accept a message', () => {
  assert.deepEqual(evaluateSenderBinding({ frameId: 0, documentId: 'doc-1' }, {}), {
    accepted: false,
    reason: 'binding_required',
  });
});

test('a message from a subframe is refused', () => {
  assert.deepEqual(
    evaluateSenderBinding({ frameId: 2, documentId: 'doc-1' }, { documentId: 'doc-1' }),
    { accepted: false, reason: 'frame_not_top' },
  );
});

test('a message without a document id is refused', () => {
  assert.deepEqual(
    evaluateSenderBinding({ frameId: 0 }, { documentId: 'doc-1' }),
    { accepted: false, reason: 'document_id_missing' },
  );
});

test('a message from a different document is refused as stale', () => {
  assert.deepEqual(
    evaluateSenderBinding({ frameId: 0, documentId: 'doc-2' }, { documentId: 'doc-1' }),
    { accepted: false, reason: 'document_changed' },
  );
});

test('the exact top-frame document is accepted', () => {
  assert.deepEqual(
    evaluateSenderBinding({ frameId: 0, documentId: 'doc-1' }, { documentId: 'doc-1' }),
    { accepted: true, reason: 'bound' },
  );
});

// --- reconnect / reload ----------------------------------------------------

test('an unbound waiter is not kept on reconnect', () => {
  assert.deepEqual(verifyBoundDocument(undefined, 'doc-1'), { keep: false, reason: 'unbound' });
  assert.deepEqual(verifyBoundDocument('', 'doc-1'), { keep: false, reason: 'unbound' });
});

test('an unreadable current document fails closed', () => {
  assert.deepEqual(verifyBoundDocument('doc-1', undefined), {
    keep: false,
    reason: 'current_document_unknown',
  });
});

test('a replaced document invalidates the waiter', () => {
  assert.deepEqual(verifyBoundDocument('doc-1', 'doc-2'), {
    keep: false,
    reason: 'document_changed',
  });
});

test('the original document keeps the waiter', () => {
  assert.deepEqual(verifyBoundDocument('doc-1', 'doc-1'), { keep: true, reason: 'bound' });
});
