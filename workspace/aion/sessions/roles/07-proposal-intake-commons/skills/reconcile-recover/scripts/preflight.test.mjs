import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { checkPackage } from './preflight.mjs';

const setup = () => {
  const root = mkdtempSync(join(tmpdir(), 'aion-intake-'));
  const id = 'ATP-20261021-0001', dir = join(root, id);
  mkdirSync(dir);
  const raw = Buffer.from('Example with non-ASCII: café\n');
  const meta = {
    schema_version: 'aion.proposal/0.1', proposal_id: id, title: 'Example',
    source_kind: 'paste', source_locator: 'https://example.test/source', submitted_by: 'fixture',
    received_at_utc: '2026-10-21T10:00:00Z', captured_at_utc: '2026-10-21T10:01:00Z',
    raw_sha256: createHash('sha256').update(raw).digest('hex'), raw_bytes: raw.length,
    raw_preservation: 'EXACT_CAPTURED_TEXT', intake_status: 'DECOMPOSED', related_ids: [], claims_verified: false,
  };
  writeFileSync(join(dir, 'RAW.md'), raw);
  writeFileSync(join(dir, 'META.json'), JSON.stringify(meta));
  writeFileSync(join(dir, 'DECOMPOSITION.md'), '# Derived, not verified\n');
  const close = () => rmSync(root, { recursive: true, force: true });
  return { root, dir, id, meta, close };
};
const withFixture = (name, run) => test(name, () => { const f = setup(); try { run(f); } finally { f.close(); } });

withFixture('accepts valid source bytes and metadata', f => assert.equal(checkPackage(f.dir).ok, true));
withFixture('detects changed original content', f => {
  writeFileSync(join(f.dir, 'RAW.md'), 'changed');
  const result = checkPackage(f.dir);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.code === 'HASH_MISMATCH'));
});
withFixture('detects wrong byte count even with unchanged hash', f => {
  f.meta.raw_bytes--;
  writeFileSync(join(f.dir, 'META.json'), JSON.stringify(f.meta));
  assert.ok(checkPackage(f.dir).errors.some(x => x.code === 'BYTE_MISMATCH'));
});
withFixture('does not accept incomplete source as verified complete capture', f => {
  f.meta.intake_status = 'SOURCE_MISSING';
  writeFileSync(join(f.dir, 'META.json'), JSON.stringify(f.meta));
  assert.ok(checkPackage(f.dir).errors.some(x => x.code === 'STATUS'));
});
withFixture('refuses symlinked RAW', f => {
  rmSync(join(f.dir, 'RAW.md'));
  symlinkSync(join(f.root, 'foreign-raw'), join(f.dir, 'RAW.md'));
  assert.ok(checkPackage(f.dir).errors.some(x => x.code === 'FILE'));
});
withFixture('flags missing index entry and accepts matching index', f => {
  const idx = join(f.root, 'INDEX.json');
  writeFileSync(idx, JSON.stringify({ schema_version: 'aion.proposal-index/0.1', items: [] }));
  assert.ok(checkPackage(f.dir, idx).errors.some(x => x.code === 'INDEX_MISSING'));
  writeFileSync(idx, JSON.stringify({ schema_version: 'aion.proposal-index/0.1', items: [{proposal_id: f.id}] }));
  assert.equal(checkPackage(f.dir, idx).ok, true);
});
withFixture('flags non-original claims verified', f => {
  f.meta.claims_verified = true;
  writeFileSync(join(f.dir, 'META.json'), JSON.stringify(f.meta));
  assert.ok(checkPackage(f.dir).errors.some(x => x.code === 'CLAIMS'));
});
