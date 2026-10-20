// Round 11 — the ACL probe must never starve the event loop.
//
// Root cause this file locks down: the Windows state-ACL verification shells
// out to PowerShell. Run synchronously it BLOCKS the Node event loop for
// seconds, which aborted the in-flight OpenCode health probe and published a
// raw DOMException code (20) as the failure reason.
//
// The rules proved here:
//   1. the async twin does not block the loop (no starvation)
//   2. the synchronous variant is kept for compatibility and still blocks
//   3. a timeout, a failed start and a non-private ACL all FAIL CLOSED
//   4. the verdict is never cached: every call re-reads the ACL
//   5. the engine reports a MEANINGFUL timeout code, never a bare number
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtempSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assertPrivateStateDir,assertPrivateStateDirAsync,SECURITY_TIMEOUT_MS}
  from '../src/security.mjs';
import {createOpenCodeConnector,engineFailureReason} from '../src/engines/connection.mjs';
import {createOpenCodeHttpClient} from '../../extension/src/bus/adapters/opencode-v2.js';
import {main} from '../bin/aion-local.mjs';

function scratch(t){
  const dir=mkdtempSync(join(tmpdir(),'aion-acl-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  return dir;
}
/** A child-process stand-in whose exit can be timed. */
function fakeChild({delay=10,exitCode=0,error=null,hang=false}={}){
  const handlers={};
  const child={
    killed:false,stdinInput:null,
    stdin:{end(v){child.stdinInput=v;}},
    kill(){child.killed=true;},
    on(ev,fn){(handlers[ev]??=[]).push(fn);return child;},
    emit(ev,...args){for(const fn of handlers[ev]??[])fn(...args);},
  };
  if(error)setTimeout(()=>{child.emit('error',error);child.emit('close',null);},delay);
  else if(!hang)setTimeout(()=>child.emit('close',exitCode),delay);
  return child;
}

// ------------------------------------------------------- starvation avoidance

test('the async ACL probe never blocks the event loop',async t=>{
  const dir=scratch(t);
  let fired=false;
  const timer=setTimeout(()=>{fired=true;},10);
  await assertPrivateStateDirAsync(join(dir,'bus.json'),{platform:'win32',
    spawnFn:()=>fakeChild({delay:80}),timeoutMs:5000});
  clearTimeout(timer);
  assert.equal(fired,true,'a timer scheduled during the ACL probe must run before it resolves');
});
test('the synchronous ACL probe still blocks the loop (that is why the twin exists)',t=>{
  const dir=scratch(t);
  let fired=false;
  setTimeout(()=>{fired=true;},10);
  assertPrivateStateDir(join(dir,'bus.json'),{platform:'win32',run:()=>{
    const end=Date.now()+80;while(Date.now()<end){/* deliberate block */}
    return {status:0};
  },timeoutMs:5000});
  assert.equal(fired,false,'the synchronous probe starves the loop');
  assert.equal(SECURITY_TIMEOUT_MS,30000,'the bound is 30 s: realistic for a cold PowerShell start');
});
test('the async probe inspects the requested directory with pwsh',async t=>{
  const dir=scratch(t);
  let seen=null,input=null;
  await assertPrivateStateDirAsync(join(dir,'bus.json'),{platform:'win32',
    spawnFn:(cmd,args)=>{seen={cmd,args};return fakeChild({delay:5});},timeoutMs:5000});
  assert.equal(seen.cmd,'pwsh');
  assert.ok(seen.args.includes('-EncodedCommand'));
  assert.ok(seen.args.includes('-NoProfile'));
});

// ------------------------------------------------------------ fail-closed rules

test('a timed-out ACL probe fails closed and kills the child',async t=>{
  const dir=scratch(t);
  const child=fakeChild({hang:true});
  await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),
    {platform:'win32',spawnFn:()=>child,timeoutMs:60}),{code:'STATE_ACL_UNVERIFIED'});
  assert.equal(child.killed,true,'a hung probe must be killed');
});
test('an ACL probe that cannot start fails closed',async t=>{
  const dir=scratch(t);
  await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),{platform:'win32',
    spawnFn:()=>{throw Object.assign(new Error('spawn failed'),{code:'ENOENT'});},timeoutMs:5000}),
    {code:'STATE_ACL_UNVERIFIED'});
  await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),{platform:'win32',
    spawnFn:()=>fakeChild({delay:5,error:new Error('pwsh not found')}),timeoutMs:5000}),
    {code:'STATE_ACL_UNVERIFIED'});
});
test('a non-private ACL is refused (exit 3) in both variants',async t=>{
  const dir=scratch(t);
  await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),{platform:'win32',
    spawnFn:()=>fakeChild({delay:5,exitCode:3}),timeoutMs:5000}),{code:'STATE_ACL_UNVERIFIED'});
  assert.throws(()=>assertPrivateStateDir(join(dir,'bus.json'),{platform:'win32',
    run:()=>({status:3}),timeoutMs:5000}),{code:'STATE_ACL_UNVERIFIED'});
});
test('an ACL probe stdin failure fails closed without an unhandled EPIPE',async t=>{
  const child=fakeChild({hang:true});
  child.stdin=new EventEmitter();
  child.stdin.end=()=>setImmediate(()=>child.stdin.emit('error',Object.assign(new Error('closed stdin'),{code:'EPIPE'})));
  await assert.rejects(assertPrivateStateDirAsync(join(scratch(t),'bus.json'),
    {platform:'win32',spawnFn:()=>child,timeoutMs:5000}),{code:'STATE_ACL_UNVERIFIED'});
  assert.equal(child.killed,true);
});
test('a REAL non-private directory is still refused on this machine',async t=>{
  const dir=scratch(t);
  if(process.platform==='win32'){
    // A fresh temp directory inherits an ACL that grants other identities.
    await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),{timeoutMs:30000}),
      {code:'STATE_ACL_UNVERIFIED'});
  }else{
    chmodSync(dir,0o755);
    await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json')),{code:'STATE_ACL_UNVERIFIED'});
  }
});
test('the verdict is never cached: every call re-reads the ACL',async t=>{
  const dir=scratch(t);
  let calls=0;
  const spawnFn=()=>{calls++;return fakeChild({delay:5,exitCode:calls===1?0:3});};
  assert.equal(await assertPrivateStateDirAsync(join(dir,'bus.json'),
    {platform:'win32',spawnFn,timeoutMs:5000}),dir);
  await assert.rejects(assertPrivateStateDirAsync(join(dir,'bus.json'),
    {platform:'win32',spawnFn,timeoutMs:5000}),{code:'STATE_ACL_UNVERIFIED'});
  assert.equal(calls,2,'the second call must re-verify, not reuse the first verdict');
  let runs=0;
  const run=()=>{runs++;return {status:runs===1?0:3};};
  assert.equal(assertPrivateStateDir(join(dir,'bus.json'),{platform:'win32',run,timeoutMs:5000}),dir);
  assert.throws(()=>assertPrivateStateDir(join(dir,'bus.json'),{platform:'win32',run,timeoutMs:5000}),
    {code:'STATE_ACL_UNVERIFIED'});
  assert.equal(runs,2);
});

// ------------------------------------------------------- meaningful timeout code

test('the engine reports a meaningful timeout code, never a bare number',async()=>{
  assert.equal(engineFailureReason({name:'AbortError',code:20}),'HEALTH_CHECK_TIMEOUT');
  assert.equal(engineFailureReason(new Error('boom'),'HEALTH_CHECK_FAILED'),'HEALTH_CHECK_FAILED');
  assert.equal(engineFailureReason({code:'ECONNREFUSED'},'HEALTH_CHECK_FAILED'),'ECONNREFUSED');
  const connector=createOpenCodeConnector({discover:()=>({url:'http://127.0.0.1:4099',headers:{}}),
    createClient:()=>({info:async()=>{throw Object.assign(new Error('aborted'),{name:'AbortError',code:20});}}),
    createAdapter:()=>({})});
  const result=await connector.connect({});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'HEALTH_CHECK_TIMEOUT');
  assert.equal(typeof result.reason,'string');
});
test('the real HTTP client timeout is published as HEALTH_CHECK_TIMEOUT',async()=>{
  const connector=createOpenCodeConnector({
    discover:()=>({url:'http://127.0.0.1:4099',headers:{}}),
    createClient:({baseUrl,headers,timeoutMs})=>createOpenCodeHttpClient({baseUrl,headers,timeoutMs,
      fetch:(_url,opts)=>new Promise((_resolve,reject)=>{
        // A hanging peer that still honours the abort signal, exactly like undici.
        opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})));
      })}),
    createAdapter:()=>({})});
  const result=await connector.connect({});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'HEALTH_CHECK_TIMEOUT');
  assert.notEqual(result.reason,20);
});
test('a live engine probe never publishes the DOMException number',async()=>{
  const {engineProbe}=await import('../src/local-runtime.mjs');
  const result=await engineProbe();
  if(result.ok)assert.equal(result.status,'CONNECTED');
  else{
    assert.equal(typeof result.reason,'string');
    assert.notEqual(result.reason,20);
    assert.notEqual(result.reason,'20');
  }
});

// --------------------------------------------------------------- the CLI branch

test('the connections branch runs the HTTP probes outside the ACL check',async()=>{
  const order=[];const lines=[];
  const exit=await main(['connections'],{
    probe:async()=>{order.push('probe');return {ok:true,status:'CONNECTED',endpoint:'http://127.0.0.1:4099'};},
    acpProbe:()=>{order.push('acp');return {ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'};},
    chromeProbe:async()=>{order.push('chrome');return {ok:false,state:'NOT_CONNECTED',reason:'HOST_NOT_RUNNING'};},
    print:x=>lines.push(x)});
  assert.equal(exit,0);
  assert.deepEqual(order,['probe','acp','chrome'],'the HTTP probes must run before the ACL-bound chrome leg');
  const out=JSON.parse(lines[0]);
  assert.equal(out.opencode_v2.state,'CONNECTED');
  assert.equal(out.chrome.state,'NOT_CONNECTED');
});
test('a failing chrome leg never hides the engine result',async()=>{
  const lines=[];
  const exit=await main(['connections'],{
    probe:async()=>({ok:true,status:'CONNECTED',endpoint:'http://127.0.0.1:4099'}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT'}),
    chromeProbe:async()=>{throw Object.assign(new Error('acl'),{code:'STATE_ACL_UNVERIFIED'});},
    print:x=>lines.push(x)});
  assert.equal(exit,0);
  const out=JSON.parse(lines[0]);
  assert.equal(out.opencode_v2.state,'CONNECTED');
  assert.equal(out.chrome.state,'NOT_CONNECTED');
});
