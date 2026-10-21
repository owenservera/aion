import test from 'node:test';
import assert from 'node:assert/strict';
import { assess } from './check-receipt.mjs';

const base = { milestone: 'I1', claim: 'source', source_ref: 'commit:123' };
test('source claim is review-ready but never accepted', () => {
  const result = assess(base);
  assert.equal(result.status, 'REVIEW_READY');
  assert.match(result.note, /Never auto-accept/);
});
test('source-only packet cannot claim live acceptance', () => {
  const result = assess({ ...base, claim: 'live-accepted' });
  assert.equal(result.status, 'INSUFFICIENT');
  assert.ok(result.errors.includes('missing loaded_revision'));
  assert.ok(result.errors.includes('independent_review not demonstrated'));
});
test('no acceptance without negative or independent review', () => {
  const result = assess({ ...base, claim: 'live-accepted', receipt_ref: 'receipt', loaded_revision: 'build', observed_utc: '2026-10-21T12:00:00Z', exact_target_verified: true, positive_case: true });
  assert.deepEqual(result.errors, ['negative_case not demonstrated', 'independent_review not demonstrated']);
});
test('complete asserted packet remains review-only', () => {
  const result = assess({ ...base, claim: 'live-accepted', receipt_ref: 'receipt', loaded_revision: 'build', observed_utc: '2026-10-21T12:00:00Z', exact_target_verified: true, positive_case: true, negative_case: true, independent_review: true });
  assert.equal(result.status, 'REVIEW_READY');
});
test('invalid timestamp and invalid claim fail closed', () => {
  assert.ok(assess({ ...base, claim: 'live-observed', observed_utc: '2026-10-21T14:00:00+02:00' }).errors.some(s => s.includes('UTC')));
  assert.equal(assess({ ...base, claim: 'passed' }).status, 'INSUFFICIENT');
  assert.equal(assess(null).status, 'INVALID');
});
