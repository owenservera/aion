import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,unlinkSync,symlinkSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PAIRS,probe} from './probe.mjs';

function fixture(t){
  const home=mkdtempSync(join(tmpdir(),'aion-drift-'));
  t.after(()=>{import('node:fs').then(({rmSync})=>rmSync(home,{recursive:true,force:true}));});
  const repoRoot=join(home,'aion'),extensionDir=join(home,'unpacked');
  for(const [source,built] of PAIRS){
    const a=join(repoRoot,source),b=join(extensionDir,built);
    mkdirSync(dirname(a),{recursive:true});mkdirSync(dirname(b),{recursive:true});
    writeFileSync(a,`export const id=${JSON.stringify(source)};\n`);copyFileSync(a,b);
  }
  return {repoRoot,extensionDir,home};
}
const cli=fileURLToPath(new URL('./probe.mjs',import.meta.url));

test('all six copied artifacts match, but never assert Chrome-loaded state',t=>{
  const p=fixture(t),result=probe(p);
  assert.equal(result.status,'MATCH');assert.equal(result.files.length,6);
  assert.ok(result.files.every(x=>x.status==='MATCH'));
  assert.equal(result.loaded_in_chrome,'UNVERIFIED');
  assert.equal(result.native_host_running_revision,'UNVERIFIED');
  assert.equal(JSON.stringify(result).includes('export const'),false);
});
test('detects single stale receive-router build independently',t=>{
  const p=fixture(t),built=join(p.extensionDir,'src/dev/receive-router.js');
  writeFileSync(built,'// stale');
  const r=probe(p);assert.equal(r.status,'DRIFT');
  assert.equal(r.files.find(x=>x.built==='src/dev/receive-router.js').status,'DRIFT');
  assert.equal(r.files.filter(x=>x.status==='MATCH').length,5);
});
test('missing artifact yields fail-closed incomplete result',t=>{
  const p=fixture(t);unlinkSync(join(p.extensionDir,'src/dev/dev-worker.js'));
  assert.equal(probe(p).status,'INCOMPLETE');
  assert.equal(probe(p).files.find(x=>x.built==='src/dev/dev-worker.js').status,'BUILT_FILE_MISSING');
});
test('symlinked generated file rejected without following target',t=>{
  const p=fixture(t);const built=join(p.extensionDir,'src/dev/dev-link.js');
  unlinkSync(built);symlinkSync(join(p.repoRoot,PAIRS[0][0]),built);
  assert.equal(probe(p).files[0].status,'BUILT_SYMLINK_REFUSED');
});
test('CLI accepts setup receipt without printing private receipt fields',t=>{
  const p=fixture(t);const receipt=join(p.home,'receipt.json');
  writeFileSync(receipt,JSON.stringify({schema:'aion.b.setup-receipt/1',extension_dir:p.extensionDir,token:'SHOULD_NEVER_APPEAR'}));
  const run=spawnSync(process.execPath,[cli,'--repo-root',p.repoRoot,'--setup-receipt',receipt],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);assert.equal(JSON.parse(run.stdout).status,'MATCH');
  assert.equal(run.stdout.includes('SHOULD_NEVER_APPEAR'),false);
  assert.equal(run.stdout.includes(p.extensionDir),false);
});
test('invalid arguments and receipt fail without accidental disk scan',t=>{
  const bad=spawnSync(process.execPath,[cli,'--setup-receipt','/nonexistent/receipt.json'],{encoding:'utf8'});
  assert.equal(bad.status,2);assert.equal(bad.stdout,'');assert.match(bad.stderr,/SETUP_RECEIPT_UNVERIFIED/);
  const bad2=spawnSync(process.execPath,[cli,'--extension-dir','/tmp/x','--setup-receipt','/tmp/y'],{encoding:'utf8'});
  assert.equal(bad2.status,2);assert.equal(bad2.stdout,'');
});
