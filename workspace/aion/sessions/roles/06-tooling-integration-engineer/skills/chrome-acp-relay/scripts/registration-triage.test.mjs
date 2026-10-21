import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspect } from './registration-triage.mjs';

const script = fileURLToPath(new URL('./registration-triage.mjs', import.meta.url));
const hostPath = 'workspace/aion/ops/chrome-relay/velocity/src/native-host/relay.mjs';
const workerPath = 'workspace/aion/ops/chrome-relay/velocity/extension-dev/receive-router.js';
function sandbox(t) {
  const root = mkdtempSync(join(tmpdir(), 'aion-triage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [p, data] of [[hostPath,'HOST-REFERENCE\n'],[workerPath,'WORKER-REFERENCE\n']]) {
    mkdirSync(dirname(join(root,p)),{recursive:true}); writeFileSync(join(root,p),data);
  }
  return root;
}
test('read-only classification with matching provided snapshots; never claim loaded runtime',t=>{
  const root=sandbox(t);
  const r=inspect({'--repo':root,'--installed-host':join(root,hostPath),'--installed-worker':join(root,workerPath),'--code':'REGISTRATION_FAILED','--diagnostic':'fetch_rejected'});
  assert.equal(r.source_file_comparison.host.status,'FILE_MATCH');
  assert.equal(r.source_file_comparison.worker.status,'FILE_MATCH');
  assert.equal(r.triage.focus,'page fetch/transport');
  assert.equal(r.live_registration_verified,false);
  assert.equal(r.exact_thread_i1_verified,false);
  assert.equal(r.evidence,'READ_ONLY_FILE_SNAPSHOT_NOT_LOADED_RUNTIME');
});
test('modified worker reports mismatch; no mutations to inspected files',t=>{
  const root=sandbox(t); const candidate=join(root,'worker-copy.js');
  writeFileSync(candidate,'different build\n');
  const r=inspect({'--repo':root,'--installed-worker':candidate});
  assert.equal(r.source_file_comparison.host.status,'NOT_SUPPLIED');
  assert.equal(r.source_file_comparison.worker.status,'FILE_MISMATCH');
  assert.equal(readFileSync(candidate,'utf8'),'different build\n');
});
test('unrecognized diagnostic and unsafe code are not copied into output',t=>{
  const root=sandbox(t);
  const injected='secret@example.com /api/auth/session';
  const r=inspect({'--repo':root,'--code':injected,'--diagnostic':injected});
  assert.equal(r.triage.code,null);
  assert.equal(r.triage.diagnostic,null);
  assert.doesNotMatch(JSON.stringify(r),/secret@example\.com/);
});
test('CLI rejects malformed arguments and missing repo without printing user input',()=>{
  const r=spawnSync(process.execPath,[script,'--rogue','secret@example.com'],{encoding:'utf8'});
  assert.equal(r.status,2);assert.doesNotMatch(r.stderr,/secret@example.com/);
});
test('tab and generic codes produce bounded next steps without inventing root cause',t=>{
  const root=sandbox(t);
  const tab=inspect({'--repo':root,'--code':'REGISTRATION_TAB_NOT_FOUND'});
  assert.match(tab.triage.focus,/tab matching/);
  const generic=inspect({'--repo':root,'--code':'REGISTRATION_FAILED'});
  assert.match(generic.triage.next,/does not prove/);
});
