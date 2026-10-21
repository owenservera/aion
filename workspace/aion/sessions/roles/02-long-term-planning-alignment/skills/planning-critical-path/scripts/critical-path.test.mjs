import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'critical-path.mjs');
const make = (rows) => `# Planning TASKS\n\n## One screen — current top priorities\n\n| ID | Rank | North star | Outcome | Responsible actor(s) | Requires | Truthful current state / source |\n| --- | --- | --- | --- | --- | --- | --- | \n${rows.join('\n')}\n\n## Harvest integration\n`;
const row = (id, status, ref='[receipt](proof.md)') => `| **${id}** | **P0** | NS2 | Test outcome | Development | registration | **${status}** — ${ref} |`;
function run(rows, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aion-planning-'));
  try {
    fs.writeFileSync(path.join(dir, 'TASKS.md'), make(rows));
    fs.writeFileSync(path.join(dir, 'proof.md'), 'Fixture, not live proof.\n');
    const result = spawnSync(process.execPath, [script, '--file', path.join(dir, 'TASKS.md'), '--json', '--check', ...extra], { encoding:'utf8' });
    return { code: result.status, payload: JSON.parse(result.stdout) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('valid rows preserve source-level limitations and parse evidence links', () => {
  const r = run([row('AION-P01', 'BLOCKED'), row('AION-P02', 'SOURCE_MERGED / live I1 unverified')]);
  assert.equal(r.code, 0);
  assert.equal(r.payload.tasks.length, 2);
  assert.equal(r.payload.tasks[1].state, 'SOURCE_MERGED');
  assert.deepEqual(r.payload.errors, []);
});
test('duplicate task IDs fail rather than silently collapsing', () => {
  const r = run([row('AION-P01', 'OPEN'), row('AION-P01', 'OPEN')]);
  assert.equal(r.code, 1);
  assert.match(r.payload.errors.join(' '), /Duplicate task ID/);
});
test('missing link and missing file are reported, not certified', () => {
  const r = run([row('AION-P01', 'OPEN', 'no source'), row('AION-P02', 'OPEN', '[missing](missing.md)')]);
  assert.equal(r.code, 1);
  assert.match(r.payload.errors.join(' '), /missing evidence\/source link/);
  assert.match(r.payload.errors.join(' '), /broken local source/);
});
test('bad structure and ambiguous evidence status fail safely', () => {
  const r = run([row('AION-P01', 'READY TO LAUNCH'), '| **AION-P03** | incomplete |']);
  assert.equal(r.code, 1);
  assert.match(r.payload.errors.join(' '), /unknown evidence state/);
  assert.match(r.payload.errors.join(' '), /Expected 7 columns/);
});
