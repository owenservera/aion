import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,chmodSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertPrivateStateDir } from '../src/security.mjs';
test('Linux private directory allowed, public one refused',{skip:process.platform==='win32'},()=>{
 const dir=mkdtempSync(join(tmpdir(),'aion-security-')); const file=join(dir,'bus.json');
 try{
  chmodSync(dir,0o700);assert.equal(assertPrivateStateDir(file),dir);
  chmodSync(dir,0o777);assert.throws(()=>assertPrivateStateDir(file),{code:'STATE_ACL_UNVERIFIED'});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Windows ACL check refuses unverified result',()=>{
 const dir=mkdtempSync(join(tmpdir(),'aion-security-'));const file=join(dir,'bus.json');
 try{
  assert.throws(()=>assertPrivateStateDir(file,{platform:'win32',run:()=>({status:3})}),{code:'STATE_ACL_UNVERIFIED'});
  assert.equal(assertPrivateStateDir(file,{platform:'win32',run:()=>({status:0})}),dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
