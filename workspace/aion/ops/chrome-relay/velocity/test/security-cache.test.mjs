import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAclCache} from '../src/security.mjs';
test('ACL success is shared and bounded; failure and invalidated in-flight success are not cached', async t => {
  const dir=mkdtempSync(join(tmpdir(),'aion-acl-')); t.after(()=>rmSync(dir,{recursive:true,force:true}));
  let now=0, calls=0; const cache=createAclCache({now:()=>now});
  const probe=async()=>{calls++;return {status:0};};
  await Promise.all(Array.from({length:10},()=>cache.check(dir,probe))); assert.equal(calls,1);
  await cache.check(dir,probe); assert.equal(calls,1);
  now=30000; await cache.check(dir,probe); assert.equal(calls,2);
  cache.invalidate(dir); let failures=0; const bad=async()=>{failures++;return {status:3};};
  await assert.rejects(cache.check(dir,bad)); await assert.rejects(cache.check(dir,bad)); assert.equal(failures,2);
  let release; const pending=cache.check(dir,()=>new Promise(resolve=>{release=resolve;}));
  cache.invalidate(dir); release({status:0}); await pending; assert.equal(cache.size(),0);
});
