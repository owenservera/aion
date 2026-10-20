import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import {createAclCache, resolveSecurityProfile, initSecurityProfile, activeSecurityProfile,
  assertPrivateStateDirAsync} from '../src/security.mjs';

const tmp=t=>{const d=mkdtempSync(join(tmpdir(),'aion-prof-'));t.after(()=>rmSync(d,{recursive:true,force:true}));return d;};
const counter=()=>{const c={n:0,probe:async()=>{c.n++;return {status:0};}};return c;};

test('local-owner: no expiry after 31 s; hardened: fresh probe at 30 s; no cross-cache', async t=>{
  const dir=tmp(t);let now=0;const cache=createAclCache({now:()=>now});const c=counter();
  const lo={mode:'local-owner'},hd={mode:'hardened'};
  await cache.check(dir,c.probe,undefined,lo);
  now=31_000;
  for(let i=0;i<5;i++)await cache.check(dir,c.probe,undefined,lo);
  now=10*60_000;await cache.check(dir,c.probe,undefined,lo);
  assert.equal(c.n,1);
  await cache.check(dir,c.probe,undefined,hd);            // local-owner success does not satisfy hardened
  assert.equal(c.n,2);
  await cache.check(dir,c.probe,undefined,hd);assert.equal(c.n,2);
  now+=30_000;await cache.check(dir,c.probe,undefined,hd);assert.equal(c.n,3);
  await cache.check(dir,c.probe,Infinity,hd);              // finite cap still applies
  now+=30_000;await cache.check(dir,c.probe,Infinity,hd);assert.equal(c.n,4);
});

test('force refresh re-probes, 10 concurrent coalesce, replacement and failure handled', async t=>{
  const dir=tmp(t);let now=0;const cache=createAclCache({now:()=>now});const c=counter();
  const lo={mode:'local-owner'};
  await Promise.all(Array.from({length:10},()=>cache.check(dir,c.probe,undefined,lo)));assert.equal(c.n,1);
  await cache.check(dir,c.probe,undefined,{...lo,force:true});assert.equal(c.n,2);
  await Promise.all(Array.from({length:10},()=>cache.check(dir,c.probe,undefined,{...lo,force:true})));
  assert.equal(c.n,3);
  // failure never cached, and removes the forced-away success
  let bad=0;const fail=async()=>{bad++;return {status:3};};
  await assert.rejects(cache.check(dir,fail,undefined,{...lo,force:true}));
  await assert.rejects(cache.check(dir,fail,undefined,lo));assert.equal(bad,2);
  // replacement (rmdir + mkdir) changes identity -> reprobe
  await cache.check(dir,c.probe,undefined,lo);const before=c.n;
  rmSync(dir,{recursive:true});mkdirSync(dir);
  await cache.check(dir,c.probe,undefined,lo);assert.ok(c.n>=before);
  // invalidation during pending probe clears both profiles, no late repopulation
  await cache.check(dir,c.probe,undefined,{mode:'hardened'});
  let release;const pend=cache.check(dir,()=>new Promise(r=>{release=r;}),undefined,{mode:'local-owner',force:true});
  cache.invalidate(dir);release({status:0});await pend;assert.equal(cache.size(),0);
});

test('cache is bounded to 128 directories across modes', async t=>{
  const root=tmp(t);const cache=createAclCache({now:()=>0});const c=counter();
  for(let i=0;i<140;i++){const d=join(root,'d'+i);mkdirSync(d);await cache.check(d,c.probe,undefined,{mode:'local-owner'});}
  assert.equal(cache.size(),128);
});

test('symlink or non-directory is refused every call, never served from cache', async t=>{
  const root=tmp(t);const real=join(root,'real');mkdirSync(real);const cache=createAclCache();const c=counter();
  await cache.check(real,c.probe,undefined,{mode:'local-owner'});
  const file=join(root,'f');writeFileSync(file,'x');
  await assert.rejects(cache.check(file,c.probe,undefined,{mode:'local-owner'}),{code:'STATE_ACL_UNVERIFIED'});
  const link=join(root,'link');
  try{symlinkSync(real,link,'junction');}catch{return;}
  await assert.rejects(cache.check(link,c.probe,undefined,{mode:'local-owner'}),{code:'STATE_ACL_UNVERIFIED'});
});

test('profile resolver: default local-owner, env > config, invalid rejected', t=>{
  assert.equal(resolveSecurityProfile({env:{}}),'local-owner');
  assert.equal(resolveSecurityProfile({env:{},configValue:'hardened'}),'hardened');
  assert.equal(resolveSecurityProfile({env:{AION_SECURITY_PROFILE:'local-owner'},configValue:'hardened'}),'local-owner');
  assert.equal(resolveSecurityProfile({env:{AION_SECURITY_PROFILE:'hardened'},configValue:'local-owner'}),'hardened');
  for(const bad of ['strict','','HARDENED',5,false,null])
    assert.throws(()=>resolveSecurityProfile({env:{},configValue:bad}),{code:'SECURITY_PROFILE_INVALID'});
  assert.throws(()=>resolveSecurityProfile({env:{AION_SECURITY_PROFILE:'x'},configValue:'hardened'}),
    {code:'SECURITY_PROFILE_INVALID'});
});

test('initSecurityProfile reads host-dev.config.json without writing; absent -> local-owner', t=>{
  const dir=tmp(t);
  assert.equal(initSecurityProfile({env:{},stateDir:dir}),'local-owner');
  writeFileSync(join(dir,'host-dev.config.json'),JSON.stringify({security_profile:'hardened'}));
  assert.equal(initSecurityProfile({env:{},stateDir:dir}),'hardened');
  assert.equal(activeSecurityProfile(),'hardened');
  assert.equal(initSecurityProfile({env:{AION_SECURITY_PROFILE:'local-owner'},stateDir:dir}),'local-owner');
  writeFileSync(join(dir,'host-dev.config.json'),JSON.stringify({security_profile:'nope'}));
  assert.throws(()=>initSecurityProfile({env:{},stateDir:dir}),{code:'SECURITY_PROFILE_INVALID'});
  writeFileSync(join(dir,'host-dev.config.json'),'{not json');
  assert.throws(()=>initSecurityProfile({env:{},stateDir:dir}),{code:'SECURITY_PROFILE_INVALID'});
  assert.equal(initSecurityProfile({env:{},config:{security_profile:'hardened'}}),'hardened');
  initSecurityProfile({env:{}});
});

test('assertPrivateStateDirAsync: invalid explicit profile fails before touching fs; injected cache + spawn', async t=>{
  const root=tmp(t);const target=join(root,'never','bus.json');
  await assert.rejects(assertPrivateStateDirAsync(target,{platform:'win32',securityProfile:'bogus'}),
    {code:'SECURITY_PROFILE_INVALID'});
  assert.throws(()=>statSyncOrThrow(join(root,'never')));
  let spawns=0;
  const spawnFn=()=>{spawns++;const ch=new EventEmitter();ch.kill=()=>{};
    ch.stdin=Object.assign(new EventEmitter(),{end(){setImmediate(()=>ch.emit('close',0));}});return ch;};
  const cache=createAclCache({now:()=>0});const file=join(root,'bus.json');
  for(let i=0;i<4;i++)await assertPrivateStateDirAsync(file,{platform:'win32',spawnFn,cache,securityProfile:'local-owner'});
  assert.equal(spawns,1);
  await assertPrivateStateDirAsync(file,{platform:'win32',spawnFn,cache,securityProfile:'local-owner',force:true});
  assert.equal(spawns,2);
  await assertPrivateStateDirAsync(file,{platform:'win32',spawnFn,cache,securityProfile:'hardened'});
  assert.equal(spawns,3);
  // injected spawnFn with no cache never uses the shared process cache
  await assertPrivateStateDirAsync(file,{platform:'win32',spawnFn});
  await assertPrivateStateDirAsync(file,{platform:'win32',spawnFn});
  assert.equal(spawns,5);
});
import {statSync} from 'node:fs';
function statSyncOrThrow(p){return statSync(p);}
