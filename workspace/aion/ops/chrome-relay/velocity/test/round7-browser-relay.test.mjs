// Round 7: CLI -> dev host -> worker relay. Real sockets, real native framing,
// fake worker. No Chrome, no ChatGPT, no Windows claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PassThrough} from 'node:stream';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {startHostEndpoint,connectHost,SESSION_FILE} from '../src/transport/local-ipc.mjs';
import {runDevHost,PING} from '../src/native-host/relay.mjs';
import {createRemoteCall} from '../src/browser/remote-call.mjs';
import {createDevLink} from '../extension-dev/dev-link.js';
import {encodeNativeFrame,createNativeFrameDecoder} from '../../bridge/src/framing.js';

const DEV_ID='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
// The IPC endpoint holds a bearer token, so the state directory must be
// owner-private in the PRODUCTION sense (Windows: native private DACL).
const privateDir=()=>privateStateDir('aion-b7-');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// A fake Chrome+worker: reads host stdout frames, answers via host stdin.
function fakeWorker({answer}){
  const stdin=new PassThrough(),stdout=new PassThrough();
  const seen=[];
  const dec=createNativeFrameDecoder({onMessage:async msg=>{
    seen.push(msg);
    if(msg.type==='aion.b.call'){
      const result=await answer(msg);
      if(result!==undefined)stdin.write(encodeNativeFrame({type:'aion.b.reply',id:msg.id,result}));
    }
  }});
  stdout.on('data',c=>dec.push(c));
  return {stdin,stdout,seen,hello:()=>stdin.write(encodeNativeFrame({type:'aion.b.hello'})),close:()=>stdin.end()};
}
async function startHost(answer,t){
  const stateDir=privateDir();
  const w=fakeWorker({answer});
  const host=await runDevHost({argv:[`chrome-extension://${DEV_ID}/`],stdin:w.stdin,stdout:w.stdout,
    stateDir,expectedExtensionId:DEV_ID});
  assert.equal(host.ok,true);
  // Never leave the endpoint listening: a failed assertion must not hang the
  // whole suite (a live pipe server keeps the event loop alive forever).
  const stop=async()=>{try{await host.endpoint?.close();}catch{}
    try{w.close();}catch{} try{await host.shutdown('test');}catch{}};
  t?.after(()=>{void stop();});
  w.hello();
  // The endpoint opens only after the private-state ACL check passed. On
  // Windows that check starts PowerShell, so allow a slow host to get there.
  for(let i=0;i<12000&&!host.endpoint;i++)await sleep(10);
  assert.ok(host.endpoint,'endpoint opened after worker hello');
  return {stateDir,w,host,stop};
}

test('IPC: authenticated request, wrong token refused, missing host is pre-write',async t=>{
  const dir=privateDir();
  await assert.rejects(connectHost({stateDir:dir}),{code:'HOST_NOT_RUNNING'});
  const ep=await startHostEndpoint({stateDir:dir,onRequest:async m=>({echo:m.call_type})});
  // A live pipe server keeps the event loop alive: always close it, even when
  // an assertion below fails.
  t.after(()=>{void ep.close();});
  const s=JSON.parse(readFileSync(join(dir,SESSION_FILE),'utf8'));
  assert.equal(s.ipc_auth,'SESSION_TOKEN');
  const link=await connectHost({stateDir:dir});
  assert.deepEqual(await link.request('x',{}),{echo:'x'});
  link.close();
  writeFileSync(join(dir,SESSION_FILE),JSON.stringify({...s,token:'0'.repeat(64)}));
  await assert.rejects(connectHost({stateDir:dir}),{code:'HOST_AUTH_REFUSED'});
  writeFileSync(join(dir,SESSION_FILE),JSON.stringify(s));
  await ep.close();
  assert.equal(existsSync(join(dir,SESSION_FILE)),false,'own session file removed');
});

test('IPC: timeout after write reports written=true (outcome unknown)',async t=>{
  const dir=privateDir();
  const ep=await startHostEndpoint({stateDir:dir,onRequest:()=>new Promise(()=>{})});
  t.after(()=>{void ep.close();});
  const link=await connectHost({stateDir:dir});
  await assert.rejects(link.request('x',{},{timeoutMs:50}),e=>e.code==='HOST_TIMEOUT_OUTCOME_UNKNOWN'&&e.written===true);
  link.close();await ep.close();
});

test('host refuses Track A or mismatched origin before opening anything',async()=>{
  const w=fakeWorker({answer:()=>({})});
  const r=await runDevHost({argv:['chrome-extension://cccccccccccccccccccccccccccccccc/'],stdin:w.stdin,stdout:w.stdout,
    stateDir:privateDir(),expectedExtensionId:DEV_ID});
  assert.deepEqual(r,{ok:false,code:'EXTENSION_ID_MISMATCH'});
  await assert.rejects(runDevHost({argv:[],stdin:w.stdin,stdout:w.stdout,stateDir:privateDir(),
    expectedExtensionId:'kgjfielmhcdlggjppmliabpiljnonhki'}),/Track A/);
});

test('relay: CLI call reaches worker once and returns its result; disallowed call never forwarded',async t=>{
  const {stateDir,w,host}=await startHost(async m=>m.call_type===PING?{ok:true,pong:true}:{ok:true,tabs:[],got:m.payload},t);
  const link=await connectHost({stateDir});
  assert.equal(link.session.extension_id,DEV_ID);
  assert.deepEqual(await link.request(PING,{}),{ok:true,pong:true});
  const r=await link.request('aion/chatgpt-tabs',{a:1});
  assert.deepEqual(r.got,{a:1});
  await assert.rejects(link.request('aion/chatgpt-run',{}),{code:'CALL_NOT_ALLOWED'});
  assert.equal(w.seen.filter(m=>m.call_type==='aion/chatgpt-run').length,0);
  assert.equal(w.seen.filter(m=>m.call_type==='aion/chatgpt-tabs').length,1);
  link.close();w.close();await host.finished;
  assert.equal(existsSync(join(stateDir,SESSION_FILE)),false);
});

test('relay: Chrome closes mid-submit -> submit UNCERTAIN, never a no-send claim',async t=>{
  const {stateDir,w,host}=await startHost(async()=>undefined,t); // worker never answers
  const call=createRemoteCall({link:await connectHost({stateDir})});
  const pending=call('aion/chatgpt-submit',{tab_id:1,text:'x'});
  await sleep(30);w.close();
  const r=await pending;
  assert.equal(r.submitted,true);assert.equal(r.uncertain,true);
  await host.finished;
});

test('remote call: unreachable host before write is a positive no-send; reads stay read-only',async()=>{
  const failing=written=>({request:async()=>{throw Object.assign(new Error('x'),{code:'HOST_LINK_LOST',written});}});
  const pre=await createRemoteCall({link:failing(false)})('aion/chatgpt-submit',{});
  assert.equal(pre.submitted,false);assert.notEqual(pre.uncertain,true);
  const post=await createRemoteCall({link:failing(true)})('aion/chatgpt-submit',{});
  assert.equal(post.uncertain,true);assert.equal(post.submitted,true);
  const obs=await createRemoteCall({link:failing(true)})('aion/chatgpt-observe',{});
  assert.equal(obs.read_only,true);assert.notEqual(obs.submitted,true);
  const bad=await createRemoteCall({link:failing(true)})('aion/chatgpt-run',{});
  assert.equal(bad.code,'unknown_action');
});

function fakeChrome(){
  const posted=[];let onMsg,onDisc,connects=0;
  return {posted,get connects(){return connects;},deliver:m=>onMsg(m),disconnect:()=>onDisc(),
    runtime:{id:DEV_ID,lastError:undefined,connectNative(){connects++;return {
      postMessage:m=>posted.push(m),
      onMessage:{addListener:f=>{onMsg=f;}},onDisconnect:{addListener:f=>{onDisc=f;}}};}}};
}
test('dev-link: hello on connect, allowlist enforced, worker errors mapped truthfully',async()=>{
  const chrome=fakeChrome();const runs=[];
  const link=createDevLink({chrome,run:async m=>{runs.push(m);if(m.type==='aion/chatgpt-submit')throw new Error('boom');return {ok:true};},
    schedule:()=>{}});
  link.connect();
  assert.deepEqual(chrome.posted[0],{type:'aion.b.hello'});
  chrome.deliver({type:'aion.b.ready',session_id:'s'});
  assert.equal(link.status().state,'VERIFIED');
  chrome.deliver({type:'aion.b.call',id:'1',call_type:'aion/chatgpt-run',payload:{}});
  chrome.deliver({type:'aion.b.call',id:'2',call_type:'aion/chatgpt-submit',payload:{type:'aion/chatgpt-tabs',text:'x'}});
  chrome.deliver({type:'aion.b.call',id:'3',call_type:'aion.b.ping'});
  await sleep(10);
  const reply=id=>chrome.posted.find(m=>m.id===id).result;
  assert.equal(reply('1').code,'call_not_allowed');
  assert.equal(reply('2').uncertain,true);assert.equal(reply('2').submitted,true);
  assert.equal(runs[0].type,'aion/chatgpt-submit','payload cannot override call type');
  assert.equal(reply('3').extension_id,DEV_ID);
  assert.equal(runs.length,1,'ping and disallowed calls never reach the runner');
});

test('dev-link: bounded reconnect then UNAVAILABLE',()=>{
  const chrome=fakeChrome();const timers=[];
  const link=createDevLink({chrome,run:async()=>({}),maxReconnects:2,schedule:f=>timers.push(f)});
  link.connect();
  for(let i=0;i<3;i++){chrome.disconnect();timers.shift()?.();}
  assert.equal(link.status().state,'UNAVAILABLE');
  assert.equal(chrome.connects,3);
});
