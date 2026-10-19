import test from 'node:test';
import assert from 'node:assert/strict';
import { projectReadiness } from '../src/readiness.mjs';
const t = Date.parse('2026-10-19T18:00:00.000Z');
const probe = (patch = {}) => ({
  target: 'chatgpt:chief', endpoint: 'chrome:dev:verified',
  observed_utc: new Date(t - 200).toISOString(), health: 'CONNECTED',
  identity_verified: true, authority: 'GRANTED', submit_actuation_verified: true,
  actions: { inspect: 'READY', compose: 'READY', submit: 'READY', observe_reply: 'READY' },
  ...patch
});
test('no observer cannot imply live browser', () => {
  const r = projectReadiness(null, {now: t});
  assert.equal(r.actions.submit, 'UNKNOWN');
  assert.equal(r.state, 'UNKNOWN');
});
test('fresh probe can report explicitly proven capability', () => {
  const r = projectReadiness(probe(), {now: t});
  assert.equal(r.actions.submit, 'READY');
  assert.equal(r.age_ms, 200);
});
test('stale probe expires fail closed', () => {
  const r = projectReadiness(probe({observed_utc: new Date(t-5000).toISOString()}), {now: t});
  assert.equal(r.actions.submit, 'STALE');
});
test('unverified Send actuation is not READY', () => {
  assert.equal(projectReadiness(probe({submit_actuation_verified: false}), {now: t}).actions.submit, 'UNVERIFIED');
});
test('no grant blocks mutation but not inspection', () => {
  const r = projectReadiness(probe({authority:'GRANT_REQUIRED'}), {now: t});
  assert.equal(r.actions.submit, 'BLOCKED');
  assert.equal(r.actions.inspect, 'READY');
});
test('no verified conversation identity prevents READY', () => {
  assert.equal(projectReadiness(probe({identity_verified:false}), {now: t}).actions.submit, 'UNVERIFIED');
});
test('bad time and disconnected observer are not READY', () => {
  assert.equal(projectReadiness(probe({observed_utc:'fake'}), {now: t}).actions.submit, 'UNKNOWN');
  assert.equal(projectReadiness(probe({health:'DISCONNECTED'}), {now: t}).actions.submit, 'UNKNOWN');
});
