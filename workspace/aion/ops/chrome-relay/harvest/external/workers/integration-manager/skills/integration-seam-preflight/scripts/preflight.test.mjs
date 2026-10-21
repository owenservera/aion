import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cmd = fileURLToPath(new URL('./preflight.mjs', import.meta.url));
const packFolder = 'workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/packs/PACK-06';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aion-seam-preflight-'));
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));
  const write = (rel, value) => {const p=path.join(root,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);};
  write('AGENTS.md','# repo\n');
  write(packFolder+'/README.md','# Source\n[module](module.js) and [license](LICENSE-X.txt) and [web](https://example.org)\n');
  write(packFolder+'/module.js','export const x = 1;\n');
  write(packFolder+'/LICENSE-X.txt','MIT example');
  write('extension/src/provider.js','export const noop = true;\n');
  const run = (...args) => spawnSync(process.execPath,[cmd,...args,'--root',root],{cwd:root,encoding:'utf8'});
  return {root,write,run};
}

test('pack shows filesystem facts and refuses to invent adoption', t => {
  const {run}=fixture(t);
  const out=run('pack','PACK-06','--seam','extension/src/provider.js');
  assert.equal(out.status,0,out.stderr);
  const data=JSON.parse(out.stdout);
  assert.equal(data.source_state,'FILES_PRESENT_ONLY');
  assert.deepEqual(data.implementation,['module.js']);
  assert.deepEqual(data.licenses,['LICENSE-X.txt']);
  assert.equal(data.seam.exists,true);
  assert.match(data.boundary,/Do not infer/);
});
test('missing proposed seam is observable but is not a broken package',t=>{
  const {run}=fixture(t),out=run('pack','PACK-06','--seam','extension/does-not-exist.js');
  assert.equal(out.status,0,out.stderr);assert.equal(JSON.parse(out.stdout).seam.exists,false);
});
test('broken repo-local Markdown links are detected',t=>{
  const {run,write}=fixture(t);write('doc.md','[bad](nope.md) [good](extension/src/provider.js) [offsite](https://example.com)');
  const out=run('links','doc.md');assert.equal(out.status,1,out.stderr);
  const obj=JSON.parse(out.stdout);assert.equal(obj.checked,2);assert.equal(obj.issues.length,1);
});
test('reject path traversal and invalid pack name',t=>{
  const {run}=fixture(t);
  assert.equal(run('links','../secrets.md').status,2);
  assert.equal(run('pack','../../PACK-06').status,2);
});
test('reject out-of-root symlink used as a seam',t=>{
  const {run,root}=fixture(t);
  const outside=fs.mkdtempSync(path.join(os.tmpdir(),'aion-outside-'));
  t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
  fs.symlinkSync(outside,path.join(root,'external'));
  const result=run('pack','PACK-06','--seam','external/missing.js');
  assert.equal(result.status,2);
  assert.match(result.stderr,/Symlink escapes repository/);
});
test('no non-test implementation yields actionable failure',t=>{
  const {run,root}=fixture(t);fs.unlinkSync(path.join(root,packFolder,'module.js'));
  const out=run('pack','PACK-06');assert.equal(out.status,1);
  assert.ok(JSON.parse(out.stdout).issues.some(s=>s.includes('no non-test source')));
});
