// Round 7 end-to-end, offline: `aion connect chief` + `aion send chief "..."`
//   CLI main() -> real Bus file ledger -> token IPC -> SPAWNED dev host process
//   -> Chrome native framing on its stdio -> fake worker emulating the driver.
// Proves the Track B wiring and no-resend mapping. NOT Chrome, NOT ChatGPT, NOT Windows.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,chmodSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {main} from '../bin/aion-local.mjs';
import {encodeNativeFrame,createNativeFrameDecoder} from '../../bridge/src/framing.js';

const HOST=fileURLToPath(new URL('../bin/aion-host-dev.mjs',import.meta.url));
const DEV_ID='dddddddddddddddddddddddddddddddd';
const CONV='https://chatgpt.com/c/0f0e-test-conversation';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function setup(){
  const root=mkdtempSync(join(tmpdir(),'aion-b7e2e-'));
  const stateDir=join(root,'track-b');
  return {root,stateDir,statePath:join(stateDir,'bus.json')};
}
// Fake driver behind the worker's runChatGPTCommand.
function driver({mode='reply'}={}){
  const calls=[];
  return {calls,async handle(type,p){
    calls.push({type,p});
    if(type==='aion.b.ping')return {ok:true,pong:true,extension_id:DEV_ID};
    if(type==='aion/chatgpt-tabs')return {ok:true,tabs:[{tab_id:7,url:CONV}]};
    if(type==='aion/chatgpt-submit'){
      this.last=p;
      if(mode==='uncertain')return {ok:false,code:'content_timeout',submitted:true,uncertain:true};
      return {ok:false,code:'submit_pending',submitted:true,observer:{submission_observed:true}};
    }
    if(type==='aion/chatgpt-observe'){
      if(mode==='uncertain')return {ok:false,code:'observation_pending',read_only:true};
      const s=this.last;
      return {ok:true,captured:true,tab:{tab_id:7},observer:{submission_observed:true,generation_complete:true},
        envelope:{payload:{reply_text:`${s.correlation_id}\nAcknowledged: the plan is approved.\n${s.expected_reply_token}`}}};
    }
    return {ok:false,code:'unknown_action'};
  }};
}
async function spawnHost(stateDir,drv){
  const cfg=join(dirname(stateDir),'host-dev.config.json');
  writeFileSync(cfg,JSON.stringify({schema:'aion.b.host-config/1',extension_id:DEV_ID,state_dir:stateDir}));
  const child=spawn(process.execPath,[HOST,'--config',cfg,`chrome-extension://${DEV_ID}/`],{stdio:['pipe','pipe','pipe']});
  let ready=null;
  const dec=createNativeFrameDecoder({onMessage:async m=>{
    if(m.type==='aion.b.ready'){ready=m;return;}
    if(m.type==='aion.b.call'){
      const result=await drv.handle(m.call_type,m.payload);
      child.stdin.write(encodeNativeFrame({type:'aion.b.reply',id:m.id,result}));
    }
  }});
  child.stdout.on('data',c=>dec.push(c));
  child.stdin.write(encodeNativeFrame({type:'aion.b.hello'}));
  for(let i=0;i<300&&!ready;i++)await sleep(10);
  assert.ok(ready?.session_id,'host reported ready');
  return {child,async stop(){child.stdin.end();await new Promise(r=>child.once('exit',r));}};
}
async function run(argv){
  const lines=[];const code=await main(argv,{print:l=>lines.push(l),pause:()=>sleep(5)});
  return {code,out:JSON.parse(lines.at(-1))};
}

test('connect chief + send chief: one submit, correlated reply, durable result',async t=>{
  const {stateDir,statePath}=setup();
  process.env.AION_DEV_STATE=statePath;
  t.after(()=>{delete process.env.AION_DEV_STATE;});
  // Without a host: truthful refusal, nothing admitted.
  chmodSync(dirname(stateDir),0o700);
  let r=await run(['send','chief','hello']);
  assert.equal(r.out.code,'BROWSER_CONNECTOR_NOT_CONNECTED');
  r=await run(['connections']);
  assert.equal(r.out.chrome.state,'NOT_CONNECTED');

  const drv=driver();
  const host=await spawnHost(stateDir,drv);
  t.after(()=>host.stop());
  r=await run(['connections']);
  assert.equal(r.out.chrome.state,'CONNECTED');
  assert.equal(r.out.chrome.extension_id,DEV_ID);
  assert.equal(r.out.chrome.ipc_auth,'SESSION_TOKEN');

  // Unbound role refuses before admission.
  r=await run(['send','chief','hello']);
  assert.equal(r.code,3);assert.match(r.out.code,/ROLE_UNBOUND|OWNER_BINDING_OR_GRANT_REQUIRED/);
  assert.equal(drv.calls.filter(c=>c.type==='aion/chatgpt-submit').length,0);

  // Conversation not open -> refuse binding.
  r=await run(['connect','chief','--conversation','https://chatgpt.com/c/not-open']);
  assert.equal(r.out.code,'CONVERSATION_NOT_OPEN');
  r=await run(['connect','chief','--conversation',CONV,'--max','3','--hours','1']);
  assert.equal(r.code,0,JSON.stringify(r.out));
  assert.equal(r.out.code,'ROLE_BOUND_AND_GRANTED');assert.equal(r.out.agent_id,'role-05');

  r=await run(['send','chief','Approve the plan?','--wait-ms','10000']);
  assert.equal(r.code,0,JSON.stringify(r.out));
  assert.equal(r.out.code,'RESULT_OBSERVED');
  assert.equal(r.out.result.status,'REPLY_OBSERVED');
  assert.equal(r.out.result.to,'role-05');
  assert.match(r.out.result.reply_excerpt??'',/plan is approved/);
  const submits=drv.calls.filter(c=>c.type==='aion/chatgpt-submit');
  assert.equal(submits.length,1,'exactly one activation');
  assert.equal(submits[0].p.user_gesture,true);
  assert.match(submits[0].p.approved_scope_ref,/^bus:grant-/);
  assert.match(submits[0].p.text,/Approve the plan\?/);

  // Read-only re-observe never resends.
  r=await run(['observe',r.out.operation_id]);
  assert.equal(r.out.result.status,'REPLY_OBSERVED');
  assert.equal(drv.calls.filter(c=>c.type==='aion/chatgpt-submit').length,1);
});

test('uncertain submit stays UNKNOWN, blocks the target, and is never retried',async t=>{
  const {stateDir,statePath}=setup();
  process.env.AION_DEV_STATE=statePath;
  t.after(()=>{delete process.env.AION_DEV_STATE;});
  const drv=driver({mode:'uncertain'});
  const host=await spawnHost(stateDir,drv);
  t.after(()=>host.stop());
  let r=await run(['connect','chief','--conversation',CONV]);
  assert.equal(r.out.code,'ROLE_BOUND_AND_GRANTED');
  r=await run(['send','chief','first','--wait-ms','1000']);
  assert.equal(r.code,3);
  assert.notEqual(r.out.result?.status??r.out.last_result?.status,'REFUSED');
  const delivery=r.out.delivery??r.out.result?.delivery??r.out.last_result?.delivery;
  assert.notEqual(delivery,'NOT_SENT','an attempted send is never reported as not sent');
  r=await run(['send','chief','second']);
  assert.equal(r.out.code,'TARGET_BUSY','unresolved operation blocks further sends');
  assert.equal(drv.calls.filter(c=>c.type==='aion/chatgpt-submit').length,1);
});
