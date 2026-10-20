import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {planBrowserSetup,applyBrowserSetup,inspectBrowserSetup,uninstallBrowserSetup}
  from '../src/browser/setup.mjs';
const fresh=t=>{
 const root=mkdtempSync(join(tmpdir(),'aion-b8-preflight-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 return planBrowserSetup({stateDir:join(root,'track-b'),platform:'linux',
   userHostDir:join(root,'NativeMessagingHosts')});
};
test('read-only setup inspection refuses absence without generating files',t=>{
 const plan=fresh(t);
 const status=inspectBrowserSetup(plan);
 assert.equal(status.ok,false);
 assert.equal(status.code,'SETUP_NOT_APPLIED');
 assert.equal(existsSync(plan.keyPath),false);
 assert.equal(existsSync(plan.registration.path),false);
});
test('inspector verifies actual generated B extension identity and host registration',t=>{
 const plan=fresh(t);
 const receipt=applyBrowserSetup(plan);
 const check=inspectBrowserSetup(plan);
 assert.equal(check.ok,true);
 assert.equal(check.extension_id,receipt.extension_id);
 assert.equal(check.code,'DEV_SETUP_VERIFIED');
 assert.equal(uninstallBrowserSetup(plan).track_a_touched,false);
 assert.equal(inspectBrowserSetup(plan).ok,false);
});
test('tampered B extension manifest is refused rather than reported as ready',t=>{
 const plan=fresh(t);applyBrowserSetup(plan);
 const path=join(plan.extensionDir,'manifest.json');
 const manifest=JSON.parse(readFileSync(path,'utf8'));
 manifest.key='untrusted';
 writeFileSync(path,JSON.stringify(manifest));
 const check=inspectBrowserSetup(plan);
 assert.equal(check.ok,false);
 assert.equal(check.code,'DEV_SETUP_INTEGRITY_FAILED');
});
