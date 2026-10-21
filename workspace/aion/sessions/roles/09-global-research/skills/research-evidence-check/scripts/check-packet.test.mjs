import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePacket } from './check-packet.mjs';
const script = fileURLToPath(new URL('./check-packet.mjs', import.meta.url));
const baseline = {
  source_url: 'https://example.org/article', claim: 'A specific claim to investigate', basis: 'SOURCE_CLAIM',
  confidence: 'LOW', status: 'DRAFT', next_action: 'Independently cross-check'
};
const pkt = (props = {}) => ({ ...baseline, ...props });

test('minimal draft does not need a publication receipt', () => assert.deepEqual(validatePacket(pkt()), []));
test('publisher permalink and actual publication reference pass structure check', () => {
  const p = pkt({ status: 'PUBLISHED', publication_receipt: 'https://github.com/org/repo/issues/30#issuecomment-17' });
  assert.deepEqual(validatePacket(p), []);
});
test('publication alone never means recipient ACK', () => {
  const p = pkt({ status: 'ACKNOWLEDGED', publication_receipt: 'https://github.com/org/repo/issues/30' });
  assert.ok(validatePacket(p).some(x => x.includes('ack_receipt')));
});
test('live verified requires actual distinct receipt and UTC time', () => {
  const p = pkt({ basis: 'LIVE_VERIFIED', status: 'VERIFIED', verification_receipt: 'https://github.com/org/repo/issues/43' });
  const e = validatePacket(p);
  assert.ok(e.some(x => x.includes('live_receipt')));
  assert.ok(e.some(x => x.includes('observed_utc')));
  assert.deepEqual(validatePacket({ ...p, live_receipt: 'https://github.com/org/repo/issues/43#issuecomment-11', observed_utc: '2026-10-21T12:00:00Z' }), []);
});
test('offline tests require a test receipt and not just a source URL', () => {
  assert.ok(validatePacket(pkt({ basis: 'OFFLINE_TEST' })).some(x => x.includes('test_receipt')));
});
test('reject credential URLs and sensitive payload fields without echoing values', () => {
  assert.ok(validatePacket(pkt({ source_url: 'https://example.org?q=ok&api_key=private' })).some(x => x.includes('source_url')));
  assert.ok(validatePacket(pkt({ access_token: 'private' })).some(x => x.includes('sensitive')));
});
test('invalid enum and malformed ISO timestamp are caught', () => {
  const e = validatePacket(pkt({ confidence: 'ULTRA', observed_utc: '2026-99-99T25:00:00Z' }));
  assert.ok(e.some(x => x.includes('confidence')));
  assert.ok(e.some(x => x.includes('observed_utc')));
});
test('CLI tests both success and failure without networking', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'research-packet-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'packet.json');
  writeFileSync(file, JSON.stringify(pkt()));
  let r = spawnSync(process.execPath, [script, 'check', file], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /PASS:/);
  writeFileSync(file, JSON.stringify(pkt({ status: 'PUBLISHED' })));
  r = spawnSync(process.execPath, [script, 'check', file], { encoding: 'utf8' });
  assert.equal(r.status, 1); assert.match(r.stderr, /publication_receipt/);
  writeFileSync(file, '{bad json');
  r = spawnSync(process.execPath, [script, 'check', file], { encoding: 'utf8' });
  assert.equal(r.status, 2); assert.match(r.stderr, /malformed JSON/);
});
