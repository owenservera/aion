import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCommand} from '../src/commands.mjs';
import {main} from '../bin/aion-local.mjs';
import {main as brokerMain} from '../bin/aion.mjs';
import {createBus} from '../../extension/src/bus/bus.js';
import {createOpenCodeV2Adapter} from '../../extension/src/bus/adapters/opencode-v2.js';
import {memoryStorage} from '../../extension/tests/fixtures/bus-memory.js';
import {createCommandPlane} from '../src/broker/core.mjs';

test('CLI native options parse exactly, repeat files, and retain default send shape',()=>{
  assert.deepEqual(parseCommand(['send','opencode','hello']),{command:'send',alias:'opencode',text:'hello',json:false});
  assert.deepEqual(parseCommand(['send','opencode','hello','--agent','builder','--model','test/model',
    '--variant','high','--file','a.txt','--file','file:///C:/work/b.txt','--parent','ses_parent']).send_options,
    {agent:'builder',model:'test/model',variant:'high',files:['a.txt','file:///C:/work/b.txt'],parent:'ses_parent'});
  for(const args of [['--agent'],['--agent','x','--agent','y'],['--variant','high'],['--model','bare'],
    ['--session','ses_x','--parent','ses_y'],['--session','ses_x','--model','test/model']]){
    assert.throws(()=>parseCommand(['send','opencode','hello',...args]));
  }
  assert.throws(()=>parseCommand(['status','--agent','builder']));
});
test('Chrome native options refuse before opening local state or dispatching',async()=>{
  const output=[];let opened=0;
  const exit=await main(['send','chief','hello','--agent','builder'],{print:x=>output.push(JSON.parse(x)),open:async()=>{opened++;throw new Error('must not open');}});
  assert.equal(exit,2);assert.equal(opened,0);assert.equal(output[0].delivery,'NOT_SENT');
});
test('direct native send forwards options to the existing plane',async()=>{
  let sent;const output=[];
  const rt={engine:{ok:true},refresh:async()=>true,close:async()=>{},plane:{
    sendAlias:async params=>{sent=params;return {ok:false,code:'FIXTURE_NO_SEND'};}
  }};
  await main(['send','opencode','hello','--model','test/model','--variant','high'],{print:x=>output.push(JSON.parse(x)),open:async()=>rt});
  assert.deepEqual(sent.send_options,{model:'test/model',variant:'high'});assert.equal(sent.text,'hello');
  assert.equal(output[0].code,'FIXTURE_NO_SEND');
});
test('broker route explicitly refuses options instead of silently sending text alone',async()=>{
  let calls=0;const output=[];
  const exit=await brokerMain(['send','opencode','hello','--agent','builder'],{
    socketPath:'fixture',write:x=>output.push(JSON.parse(x)),transport:async()=>{calls++;}
  });
  assert.equal(exit,2);assert.equal(calls,0);assert.equal(output[0].delivery,'NOT_SENT');
});
test('CLI through actual plane and durable Bus preserves native options on one unknown attempt',async()=>{
  let prompts=0;let creation;
  const adapter=createOpenCodeV2Adapter({client:{
    agents:async()=>({data:[{id:'builder',mode:'primary'}]}),
    createSession:async args=>{creation=args;return {data:{id:'ses_fixture',agent:args.agent}};},
    prompt:async()=>{prompts++;throw new Error('fixture connection lost after admission');},
    messages:async()=>({data:[]})
  }});
  const bus=createBus({storage:memoryStorage(),adapters:[adapter],initialConfig:{report_back:false}});
  await bus.bind('opencode',{adapter:'opencode-v2',ref:'opencode',confirmed_by:'fixture-owner'});
  await bus.grant({grant_id:'native-fixture',ref:'fixture-owner',agents:['opencode'],ops:['send'],
    cwd:'C:/fixture',max_count:2,rate_per_hour:10,expires_utc:'2099-01-01T00:00:00.000Z'});
  const plane=createCommandPlane({bus,roleCatalog:{roles:[]},
    capabilities:{get:()=>({actions:{submit:'READY'}})},events:{publish:()=>{}}});
  assert.deepEqual(await plane.handle('send',{to:'opencode',text:'must not send',send_options:{agent:'builder'}}),
    {ok:false,code:'NATIVE_OPTIONS_UNSUPPORTED_OVER_IPC',delivery:'NOT_SENT'});
  assert.equal(Object.keys((await bus.store.read()).commands).length,0);
  const output=[];let clock=0;
  const rt={bus,plane,engine:{ok:true},refresh:async()=>true,close:async()=>{}};
  await main(['send','opencode','hello','--agent','builder','--wait-ms','1000'],{
    print:x=>output.push(JSON.parse(x)),open:async()=>rt,now:()=>clock,pause:async()=>{clock+=1000;}
  });
  const state=await bus.store.read();const command=Object.values(state.commands)[0];
  assert.deepEqual(command.send_options,{agent:'builder'});assert.equal(command.text,null);
  assert.equal(command.state,'UNRESOLVED');assert.equal(creation.agent,'builder');assert.equal(prompts,1);
  assert.deepEqual((await plane.handle('observe',{operation_id:command.command_id})).result.executor_selection,
    {agent:'builder',providerID:null,id:null,variant:null});
  await bus.dispatch(command.command_id);assert.equal(prompts,1);
  assert.equal(output[0].code,'WAIT_TIMEOUT');
});
