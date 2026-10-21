import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditPingPackage } from './verify-pings.mjs';

const evidence = 'https://github.com/owenservera/aion/issues/17#issuecomment-example';
const fresh = () => ({
  sent: Array.from({ length: 10 }, (_, i) => ({ correlation_id: 'case-' + i, utc: '2026-10-21T12:00:00.000Z', evidence_ref: evidence })),
  visible: Array.from({ length: 10 }, (_, i) => ({ correlation_id: 'case-' + i, utc: '2026-10-21T12:00:01.450Z', evidence_ref: evidence, device: i % 2 ? 'android' : 'desktop' })),
  checks: Object.fromEntries(['authorization','reconnect_replay','duplicate_handling','failure_case'].map(k => [k,{ passed:true, evidence_ref:evidence }]))
});
test('complete fixtures are review-ready but never live verified', () => {
  const r = auditPingPackage(fresh()); assert.equal(r.package_complete, true); assert.equal(r.live_verified, false); assert.equal(r.stats.highestLatencyMs,1450);
});
test('rejects absent event', () => { const p=fresh(); p.visible.pop(); assert.equal(auditPingPackage(p).package_complete,false); });
test('rejects duplicated visible receipt', () => { const p=fresh(); p.visible.push(p.visible[0]); assert.match(auditPingPackage(p).errors.join(' '),/Duplicate visible/); });
test('rejects clock reversal', () => { const p=fresh(); p.visible[0].utc='2026-10-21T11:59:59.000Z'; assert.equal(auditPingPackage(p).package_complete,false); });
test('rejects >=5s latency', () => { const p=fresh(); p.visible[0].utc='2026-10-21T12:00:05.000Z'; assert.equal(auditPingPackage(p).package_complete,false); });
test('requires explicit evidence in negative cases', () => { const p=fresh(); delete p.checks.authorization.evidence_ref; assert.equal(auditPingPackage(p).package_complete,false); });
test('requires observations from both devices', () => { const p=fresh(); for(const v of p.visible)v.device='desktop'; assert.equal(auditPingPackage(p).package_complete,false); });
test('requires ten pings', () => { const p=fresh(); p.sent=p.sent.slice(0,9); p.visible=p.visible.slice(0,9); assert.equal(auditPingPackage(p).package_complete,false); });
test('rejects unknown originating correlation', () => { const p=fresh(); p.visible[0].correlation_id='fake'; assert.match(auditPingPackage(p).errors.join(' '),/No originating/); });
test('rejects invalid timestamp', () => { const p=fresh(); p.visible[0].utc='today'; assert.equal(auditPingPackage(p).package_complete,false); });
test('rejects missing source citation', () => { const p=fresh(); p.sent[0].evidence_ref=''; assert.equal(auditPingPackage(p).package_complete,false); });
test('rejects malformed input without throw', () => { assert.equal(auditPingPackage(null).package_complete,false); });
