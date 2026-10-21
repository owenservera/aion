import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCommand} from '../src/commands.mjs';
import {main} from '../bin/aion-local.mjs';
import {main as brokerMain} from '../bin/aion.mjs';
import {createBus} from '../../extension/src/bus/bus.js';
import {createOpenCodeV2Adapter} from '../../extension/src/bus/adapters/opencode-v2.js';
import {memoryStorage} from '../../extension/tests/fixtures/bus-memory.js';

test('dispose requires explicit owner observation and rejects unrelated flags',()=>{
  assert.deepEqual(parseCommand(['dispose','operation123','--saw','abandoned']),
    {command:'dispose',operation_id:'operation123',json:false,disposition:'owner_abandoned'});
  for(const args of [['dispose','operation123'],['dispose','operation123','--saw','unknown'],
    ['dispose','operation123','--saw','delivered','--saw','abandoned'],
    ['send','opencode','hello','--saw','delivered'],['dispose','operation123','--saw','delivered','--follow']])
    assert.throws(()=>parseCommand(args));
});
test('owner disposal uses existing Bus, releases local lock without retry or native interrupt',async()=>{
  for(const saw of ['delivered','not-delivered','abandoned']){
    let prompts=0,interrupts=0,closed=0;
    const adapter=createOpenCodeV2Adapter({client:{createSession:async()=>({data:{id:'ses_native'}}),
      prompt:async()=>{prompts++;throw new Error('fixture dropped response');},interrupt:async()=>{interrupts++;}}});
    const bus=createBus({storage:memoryStorage(),adapters:[adapter],initialConfig:{report_back:false}});
    await bus.bind('opencode',{adapter:'opencode-v2',ref:'opencode',confirmed_by:'fixture-owner'});
    await bus.grant({grant_id:'dispose-fixture',ref:'fixture-owner',agents:['opencode'],ops:['send'],cwd:'C:/fixture',
      max_count:4,rate_per_hour:10,expires_utc:'2099-01-01T00:00:00.000Z'});
    const admitted=await bus.ingestStructured({op:'send',to:'opencode',text:'no resend',nonce:'dispose-fixture-001'});
    await bus.dispatch(admitted.command_id);
    const output=[];
    const exit=await main(['dispose',admitted.command_id,'--saw',saw],{
      open:async()=>({bus,close:async()=>{closed++;}}),print:x=>output.push(JSON.parse(x))});
    assert.equal(exit,0);assert.equal(output[0].code,'OPERATION_DISPOSED');assert.equal(closed,1);
    const command=await bus.readCommand(admitted.command_id);
    assert.equal(command.state,'HALTED');assert.equal(command.text,null);
    assert.equal(command.attempted,saw!=='not-delivered');
    await bus.dispatch(admitted.command_id);assert.equal(prompts,1);assert.equal(interrupts,0);
    const next=await bus.ingestStructured({op:'send',to:'opencode',text:'new explicit command',nonce:'dispose-fixture-002'});
    assert.equal(next.accepted,true,'owner disposition releases local target lock');
  }
});
test('unloaded non-native disposal adapter and broker disposal fail closed',async()=>{
  let disposals=0,transport=0;const output=[];
  const exit=await main(['dispose','operation123','--saw','abandoned'],{
    open:async()=>({bus:{readCommand:async()=>({adapter:'chatgpt.com'}),adapters:{},dispose:async()=>{disposals++;}},close:async()=>{}}),
    print:x=>output.push(JSON.parse(x))});
  assert.equal(exit,3);assert.equal(disposals,0);assert.equal(output[0].code,'DISPOSAL_ADAPTER_UNAVAILABLE');
  const brokerOutput=[];
  assert.equal(await brokerMain(['dispose','operation123','--saw','abandoned'],{
    socketPath:'fixture',write:x=>brokerOutput.push(JSON.parse(x)),transport:async()=>{transport++;}}),2);
  assert.equal(transport,0);assert.equal(brokerOutput[0].code,'DISPOSE_REQUIRES_DIRECT_LOCAL_BUS');
});
