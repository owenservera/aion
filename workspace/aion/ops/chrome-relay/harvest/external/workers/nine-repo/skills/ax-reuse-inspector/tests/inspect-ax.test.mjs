import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectExchange } from '../scripts/inspect-ax.mjs';

const script = fileURLToPath(new URL('../scripts/inspect-ax.mjs', import.meta.url));
function sandbox(t, records) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harvest-ax-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'donor.ts'), '// source\n');
  const exchange = 'EXCHANGE.jsonl';
  fs.writeFileSync(path.join(root, exchange), records.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n') + '\n');
  return { repoRoot: root, root, exchange };
}
const offer = {
  id: 'AX-0099', kind: 'OFFER', topic: 'receive.transport', status: 'DELIVERED',
  readiness: 'SOURCE_OBSERVED', evidence: 'CODE_INSPECTED', priority: 'P0',
  adoption_status: 'RESEARCH_REFERENCE_ONLY', title: 'Reuse cursor method',
  source_refs: ['src/donor.ts'], links: []
};

test('valid record gives a source-observed offer, never claims acceptance', t => {
  const opts = sandbox(t, [offer]);
  const r = inspectExchange(opts);
  assert.equal(r.count, 1);
  assert.equal(r.errors.length, 0);
  assert.equal(r.warnings.length, 0);
  assert.equal(r.offers[0].adoption_status, 'RESEARCH_REFERENCE_ONLY');
  assert.equal(r.offers[0].evidence, 'CODE_INSPECTED');
});

test('topic filtering excludes unrelated offers and reports missing refs as warnings', t => {
  const opts = sandbox(t, [offer, { ...offer, id: 'AX-0100', topic: 'browser.inspection', source_refs: ['src/missing.ts'] }]);
  const r = inspectExchange({ ...opts, topic: 'receive.transport' });
  assert.deepEqual(r.offers.map(x => x.id), ['AX-0099']);
  assert.equal(r.warnings.length, 1);
});

test('duplicate identity, malformed JSON, and traversal cannot pass unnoticed', t => {
  const opts = sandbox(t, [offer, { ...offer, source_refs: ['../../outside.ts'] }, '{bad json']);
  const r = inspectExchange(opts);
  assert.ok(r.errors.some(x => x.includes('duplicate id')));
  assert.ok(r.errors.some(x => x.includes('escaping reference')));
  assert.ok(r.errors.some(x => x.includes('invalid JSON')));
});

test('CLI is read-only, and strict reference checking fails on an absent source', t => {
  const opts = sandbox(t, [{ ...offer, source_refs: ['src/not-present.ts'] }]);
  const before = fs.readFileSync(path.join(opts.root, opts.exchange), 'utf8');
  const run = spawnSync(process.execPath, [script, '--repo', opts.root, '--exchange', opts.exchange, '--strict-refs', '--json'], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.warnings.length, 1);
  assert.equal(fs.readFileSync(path.join(opts.root, opts.exchange), 'utf8'), before);
});

test('CLI exits 2 for bad arguments', t => {
  const run = spawnSync(process.execPath, [script, '--unknown'], { encoding: 'utf8' });
  assert.equal(run.status, 2);
});
