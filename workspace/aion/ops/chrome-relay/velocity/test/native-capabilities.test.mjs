import test from 'node:test';
import assert from 'node:assert/strict';
import {main} from '../bin/aion-local.mjs';

const actions=['send','new_session','reuse_session','parent_link','select_agent','select_model','model_variant','file_attachment'];
async function capabilities({selected='opencode-v2',engine={ok:true,status:'CONNECTED'},browser={ok:false,state:'HOST_NOT_CONNECTED'},authorized=false}={}){
  const output=[];let refreshes=0,reads=0,closes=0;
  const rt={engine,browser,refresh:async()=>{refreshes++;return authorized;},close:async()=>{closes++;},
    bus:{store:{read:async()=>{reads++;return {agents:selected?{opencode:{binding:{adapter:selected}}}:{}};}}}};
  const exit=await main(['capabilities'],{open:async options=>{
    assert.deepEqual(options,{withEngine:true,withBrowser:true});return rt;
  },print:x=>output.push(JSON.parse(x)),probe:async()=>{throw new Error('no extra probe');},
  acpProbe:async()=>{throw new Error('no extra ACP probe');},chromeProbe:async()=>{throw new Error('no extra browser probe');}});
  assert.equal(exit,0,JSON.stringify(output));assert.equal(refreshes,1);assert.equal(reads,1);assert.equal(closes,1);
  assert.equal(output.length,1);return output[0];
}
test('connected native adapter describes implemented flags without asserting authorization or target readiness',async()=>{
  const result=await capabilities();
  assert.equal(result.schema,'aion.capabilities/1');assert.equal(result.engine.state,'CONNECTED');
  assert.equal(result.opencode_submit,'BLOCKED','connected is not authorized');
  assert.equal(result.native_controls.adapter,'opencode-v2');
  assert.equal(result.native_controls.permission,'NATIVE_AND_BUS_GRANTS_REQUIRED');
  assert.deepEqual(Object.keys(result.native_controls.actions),actions);
  for(const action of actions)assert.deepEqual(result.native_controls.actions[action],{support:'IMPLEMENTED',runtime_readiness:'NOT_PROBED'});
  assert.equal(JSON.stringify(result).includes('live_verified'),false);
});
test('existing ready-to-attempt signal remains compatible but does not verify optional native targets',async()=>{
  const result=await capabilities({authorized:true});
  assert.equal(result.opencode_submit,'READY_TO_ATTEMPT');
  for(const action of actions)assert.equal(result.native_controls.actions[action].runtime_readiness,'NOT_PROBED');
});
test('ACP binding never inherits V2 claims, even when healthy or passed V2-looking engine metadata',async()=>{
  for(const engine of [{ok:true,engine:'acp',status:'BINARY_PRESENT'},
    {ok:true,engine:'opencode-v2',status:'CONNECTED',adapter:{manifest:{name:'opencode-v2'}}}]){
    const result=await capabilities({selected:'acp',engine});
    assert.equal(result.native_controls.adapter,'acp');
    assert.equal(result.native_controls.adapter_interface,'TEXT_ONLY');
    for(const action of actions)assert.deepEqual(result.native_controls.actions[action],{support:'UNKNOWN',runtime_readiness:'NOT_PROBED'});
  }
});
test('offline V2 implementation remains implemented, not falsely runtime ready',async()=>{
  const result=await capabilities({engine:{ok:false,status:'UNAVAILABLE',reason:'HEALTH_CHECK_TIMEOUT'}});
  assert.equal(result.engine.state,'UNAVAILABLE');assert.equal(result.opencode_submit,'BLOCKED');
  assert.equal(result.native_controls.actions.file_attachment.support,'IMPLEMENTED');
  assert.equal(result.native_controls.actions.file_attachment.runtime_readiness,'NOT_PROBED');
});
test('unknown adapter does not gain V2 implementation claims through safe engine defaults',async()=>{
  const result=await capabilities({selected:null,engine:null,browser:null});
  assert.equal(result.native_controls.adapter,null);
  for(const action of actions)assert.equal(result.native_controls.actions[action].support,'UNKNOWN');
  assert.deepEqual(result.chrome,{state:'NOT_PROBED'});
});
test('Chrome connection is the existing public projection; richer controls are unsupported even when connected',async()=>{
  for(const browser of [{ok:false,state:'HOST_NOT_CONNECTED',reason:'fixture-offline'},
    {ok:true,state:'CONNECTED',extension_id:'fixture-dev',ipc_auth:'verified',pipe_dacl:'restricted',private_field:'must not expose'}]){
    const result=await capabilities({browser});
    assert.equal(result.chrome.state,browser.state);
    assert.deepEqual(result.chrome_controls.connection,result.chrome);
    assert.equal(result.chrome_controls.connection.private_field,undefined);
    for(const action of ['attachments','model','new_conversation'])
      assert.deepEqual(result.chrome_controls.actions[action],{support:'UNSUPPORTED_BY_ADAPTER',runtime_readiness:'NOT_PROBED'});
    for(const action of ['send','reply'])
      assert.deepEqual(result.chrome_controls.actions[action],{support:'IMPLEMENTED',runtime_readiness:'NOT_PROBED'});
    assert.equal(Object.values(result.chrome_controls.actions).some(a=>a.runtime_readiness.startsWith('READY')),false);
  }
});
