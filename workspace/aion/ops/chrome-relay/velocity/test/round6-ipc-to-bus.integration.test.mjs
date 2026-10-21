// Full LOCAL fixture vertical slice: actual Node CLI -> private Unix socket ->
// dev broker -> real Bus durable file ledger -> fake provider -> OBSERVE -> result.
// Intentionally skips Windows; no Chrome, account, credentials or real sends.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,chmodSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {serve} from '../bin/aiond-dev.mjs';
import {main} from '../bin/aion.mjs';
import {ADAPTER_MANIFEST_SCHEMA,AGENT_KIND} from '../../extension/src/bus/contracts.js';

test('single CLI invocation returns a correlated Bus result without a second send',
 {skip:process.platform==='win32',timeout:15000},async()=>{
   const directory=mkdtempSync(join(tmpdir(),'aion-b-cli-e2e-'));
   chmodSync(directory,0o700);
   const socketPath=join(directory,'dev.sock');
   const statePath=join(directory,'dev-state.json');
   let deliveries=0,observations=0;
   const calls=[];
   const adapter={
     manifest:{schema:ADAPTER_MANIFEST_SCHEMA,name:'fixture.chrome',version:'0.1.0',
       kind:AGENT_KIND.CONVERSATION,provider:'fixture.invalid',
       capabilities:{deliver:true,observe:true,cancel:false,report_target:true,
         max_text_chars:2000,concurrency:1,durable_readback:true,live_verified:false}},
     canonicalRef:ref=>{
       if(ref!=='fixture://chief')throw new Error('fixture target mismatch');
       return ref;
     },
     async deliver(req){
       deliveries++;
       calls.push({command_id:req.command_id,ref:req.binding.ref});
       return {outcome:'sent'};
     },
     async observe(req){
       observations++;
       return {outcome:'reply',reply:'AION MOCK RESPONSE (offline fixture only)'};
     }
   };
   let service;
   try{
     service=await serve({socketPath,statePath,adapters:[adapter]});
     await service.bus.bind('role-05',{adapter:'fixture.chrome',
       ref:'fixture://chief',confirmed_by:'fixture-owner-only'});
     await service.bus.grant({grant_id:'fixture-grant',ref:'fixture-owner-grant',
       agents:['role-05'],ops:['send'],max_count:1,
       expires_utc:'2099-01-01T00:00:00.000Z'});
     service.capabilities.record({
       target:'agent:role-05',endpoint:'fixture:local-dev',health:'CONNECTED',
       observed_utc:new Date().toISOString(),identity_verified:true,
       authority:'GRANTED',submit_actuation_verified:true,
       actions:{inspect:'READY',submit:'READY',observe_reply:'READY'}
     });
     const printed=[];
     const exit=await main(['send','chief','hello','--json','--wait-ms','9000'],
       {socketPath,write:line=>printed.push(line)});
     assert.equal(exit,0,printed.join('\n'));
     assert.equal(printed.length,1);
     const result=JSON.parse(printed[0]);
     assert.equal(result.code,'RESULT_OBSERVED');
     assert.equal(result.result.schema,'aion.result/1');
     assert.equal(result.result.status,'REPLY_OBSERVED');
     assert.equal(deliveries,1);
     assert.ok(observations>=1);
     assert.equal(calls[0].ref,'fixture://chief');
     assert.equal(result.operation_id,calls[0].command_id);
     const saved=await service.bus.readCommand(result.operation_id);
     assert.equal(saved.text,null,'Bus removes prompt from attempted operations');
     assert.equal(saved.attempted,true);
     assert.equal((await service.bus.status()).grants[0].used_count,1);
     const disk=readFileSync(statePath,'utf8');
     assert.equal(disk.includes('hello'),false,'no plaintext sent prompt in ledger');
     assert.equal(disk.includes('AION MOCK RESPONSE'),true,'reply excerpt stored by Bus');
     const replay=await service.bus.dispatch(result.operation_id);
     assert.equal(replay.dispatched,false);
     assert.equal(deliveries,1,'no-resend after completion');
   }finally{
     if(service)await service.close();
     rmSync(directory,{recursive:true,force:true});
   }
 });
