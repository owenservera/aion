import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = path.join(path.dirname(fileURLToPath(import.meta.url)), 'skill-kit.mjs');
function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aion-skill-kit-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const script = path.join(root, '.opencode', 'skills', 'aion-skill-builder', 'scripts', 'skill-kit.mjs');
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.copyFileSync(source, script);
  return { root, script, run: (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' }) };
}

test('V2 sources include twelve role directories', t => {
  const { run } = makeSandbox(t);
  const r = run('sources');
  assert.equal(r.status, 0);
  const cfg = JSON.parse(r.stdout);
  assert.equal(cfg.skills.length, 12);
  assert.ok(cfg.skills.some(p => p.includes('workers/development/skills')));
});

test('new creates a valid, discoverable SKILL.md; duplicate creation is rejected', t => {
  const { root, run } = makeSandbox(t);
  let r = run('new', '10-development', 'session-watch', 'Observe a bounded session safely');
  assert.equal(r.status, 0, r.stderr);
  const dest = path.join(root, 'workspace/aion/ops/chrome-relay/workers/development/skills/session-watch/SKILL.md');
  assert.match(fs.readFileSync(dest, 'utf8'), /description:/);
  r = run('validate', dest);
  assert.equal(r.status, 0, r.stdout);
  r = run('new', '10-development', 'session-watch', 'Duplicate');
  assert.equal(r.status, 2);
});

test('audit identifies root README flat skills and missing metadata', t => {
  const { root, run } = makeSandbox(t);
  const folder = path.join(root, 'workspace/aion/sessions/roles/01-dashboard-tracking/skills');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'README.md'), '# Existing role notes\n');
  const r = run('audit');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /REVIEW README/);
  assert.match(r.stdout, /root README\.md is interpreted/);
});
