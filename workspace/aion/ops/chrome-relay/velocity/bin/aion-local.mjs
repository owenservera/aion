#!/usr/bin/env node
// One local operator command; GitHub is never a runtime dependency.
import {randomBytes} from 'node:crypto';
import {statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCommand} from '../src/commands.mjs';
import {parseEngineSetup} from '../src/setup-args.mjs';
import {openLocal,engineProbe} from '../src/local-runtime.mjs';
import {runLocalSelftest} from '../src/selftest.mjs';

const token=prefix=>prefix+randomBytes(12).toString('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const safe=engine=>({engine:'opencode-v2',state:engine?.ok?'CONNECTED':'UNAVAILABLE',
  endpoint:engine?.ok?engine.endpoint:null,reason:engine?.reason??null});
const done=(print,r,exit)=>{print(JSON.stringify(r));return exit;};

export async function main(argv=process.argv.slice(2),{
  print=line=>process.stdout.write(line+'\n'),open=openLocal,probe=engineProbe,
  tests=runLocalSelftest,delegate=null,pause=sleep,now=()=>Date.now()
}={}){
 const cmd=argv[0]??'status';
 if(cmd==='selftest'){
   if(argv.length!==1)return done(print,{ok:false,code:'BAD_COMMAND'},2);
   const report=tests();return done(print,report,report.all_pass?0:1);
 }
 if(cmd==='connections'){
   if(argv.length>1)return done(print,{ok:false,code:'BAD_COMMAND'},2);
   const engine=await probe();
   return done(print,{schema:'aion.connections/1',opencode:safe(engine),chrome:{state:'NOT_CONNECTED'}},0);
 }
 if(process.env.AION_DEV_SOCKET && cmd!=='connect'){
   const invoke=delegate??(await import('./aion.mjs')).main;
   return invoke(argv,{write:print});
 }
 if(cmd==='connect'){
   let args;
   try{args=parseEngineSetup(argv);}catch(error){return done(print,{ok:false,code:'BAD_COMMAND',reason:error.message},2);}
   const cwd=resolve(args.cwd);
   try{if(!statSync(cwd).isDirectory())throw new Error('not a directory');}
   catch{return done(print,{ok:false,code:'INVALID_GRANT_CWD',delivery:'NOT_SENT'},2);}
   const engine=await probe();
   if(!engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',opencode:safe(engine)},3);
   const rt=await open({withEngine:true});
   try{
     if(!rt.engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',delivery:'NOT_SENT'},3);
     const state=await rt.bus.store.read();
     const existing=state.agents?.opencode;
     if(!existing)return done(print,{ok:false,code:'EXECUTOR_MISSING'},3);
     if(existing.binding && (existing.binding.adapter!=='opencode-v2'||existing.binding.ref!=='opencode'))
       return done(print,{ok:false,code:'EXISTING_BINDING_MISMATCH'},3);
     if(Object.values(state.commands??{}).some(c=>c.to==='opencode'&&
       ['RESERVED','DISPATCHED','SUBMISSION_OBSERVED','UNRESOLVED'].includes(c.state)))
       return done(print,{ok:false,code:'TARGET_BUSY',delivery:'NOT_SENT'},3);
     if(!existing.binding){await rt.bus.bind('opencode',{
       adapter:'opencode-v2',ref:'opencode',confirmed_by:'explicit-local-operator-connect'});}
     // Reconnecting replaces older send grants so no task runs in a stale cwd.
     for(const prior of Object.values(state.grants??{})){
       if(!prior.revoked && prior.agents?.includes('opencode') && prior.ops?.includes('send'))
         await rt.bus.revoke(prior.grant_id);
     }
     const grantId=token('grant-');
     await rt.bus.grant({grant_id:grantId,ref:'explicit-local-operator-connect',
       agents:['opencode'],ops:['send'],max_count:args.max,rate_per_hour:Math.min(args.max,100),
       expires_utc:new Date(now()+args.hours*3600000).toISOString(),cwd});
     return done(print,{ok:true,code:'ENGINE_BOUND_AND_GRANTED',engine:'opencode-v2',
       grant_id:grantId,max_sends:args.max,expires_hours:args.hours,local_only:true},0);
   }finally{await rt.close();}
 }
 let parsed;
 try{parsed=parseCommand(argv);}catch(error){return done(print,{ok:false,code:'BAD_COMMAND',reason:error.message},2);}
 if(parsed.command==='send'&&parsed.alias!=='opencode')
   return done(print,{ok:false,code:'BROWSER_CONNECTOR_NOT_CONNECTED',delivery:'NOT_SENT'},3);
 if(parsed.command==='send'&&parsed.detach)
   return done(print,{ok:false,code:'DETACH_REQUIRES_BROKER',delivery:'NOT_SENT'},2);
 const needsEngine=['send','observe','capabilities'].includes(parsed.command);
 const rt=await open({withEngine:needsEngine});
 try{
   if(parsed.command==='doctor'){
     const engine=await probe();
     return done(print,{schema:'aion.doctor/1',ok:true,mode:'DIRECT_LOCAL',
       state_path:rt.statePath,engines:[safe(engine)],chrome:'NOT_CONNECTED',actions:'OWNER_GRANTED_ONLY'},0);
   }
   if(parsed.command==='capabilities'){
     const ready=await rt.refresh();
     return done(print,{schema:'aion.capabilities/1',engine:safe(rt.engine),
       opencode_submit:ready?'READY':'BLOCKED',chrome_submit:'NOT_CONNECTED'},0);
   }
   if(parsed.command==='status'){
     const s=await rt.bus.status();
     return done(print,{schema:'aion.status/1',kill:s.kill,seq:s.seq,
       agents:s.agents.map(a=>({agent_id:a.agent_id,status:a.status,adapter:a.adapter})),
       commands:s.commands.map(c=>({operation_id:c.command_id,to:c.to,state:c.state,delivery:c.delivery}))},0);
   }
   if(parsed.command==='stop'){
     const kill=await rt.bus.kill('explicit local operator stop');
     return done(print,{ok:true,schema:'aion.stop/1',kill},0);
   }
   if(parsed.command==='resume'){
     const result=await rt.bus.resume('explicit local operator resume');
     return done(print,{ok:true,schema:'aion.resume/1',kill:result},0);
   }
   if(parsed.command==='send'){
     if(!rt.engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',delivery:'NOT_SENT',opencode:safe(rt.engine)},3);
     if(!await rt.refresh())return done(print,{ok:false,code:'OWNER_BINDING_OR_GRANT_REQUIRED',delivery:'NOT_SENT'},3);
     const admit=await rt.plane.sendAlias({alias:'opencode',text:parsed.text,nonce:token('nonce-')});
     if(!admit.ok)return done(print,admit,3);
     await rt.plane.waitForIdle();
     return follow(rt,admit.operation_id,parsed.wait_ms??120000,{print,pause,now});
   }
   if(parsed.command==='observe'){
     if(!parsed.follow){const r=await rt.plane.handle('observe',{operation_id:parsed.operation_id});return done(print,r,r.ok?0:3);}
     return follow(rt,parsed.operation_id,parsed.wait_ms??120000,{print,pause,now});
   }
   return done(print,{ok:false,code:'UNSUPPORTED_DIRECT_COMMAND'},2);
 }catch(error){
   return done(print,{ok:false,code:error.code??'LOCAL_ENGINE_ERROR',reason:String(error.message??error).slice(0,160),
     delivery:'UNKNOWN',no_automatic_retry:true},3);
 }finally{await rt.close();}
}
export async function follow(rt,operationId,waitMs,{print,pause,now}){
 const begin=now();let last=null;
 do{
   const r=await rt.plane.handle('observe',{operation_id:operationId});
   if(!r.ok)return done(print,r,3);
   last=r.result;
   if(last?.status==='SUCCEEDED'||last?.status==='REPLY_OBSERVED')
     return done(print,{ok:true,code:'RESULT_OBSERVED',operation_id:operationId,result:last},0);
   if(last?.terminal)return done(print,{ok:false,code:last.status,operation_id:operationId,result:last},3);
   if(now()-begin>=waitMs)break;
   await pause(Math.min(750,Math.max(0,waitMs-(now()-begin))));
 }while(now()-begin<waitMs);
 return done(print,{ok:false,code:'WAIT_TIMEOUT',operation_id:operationId,last_result:last,
   delivery:last?.delivery??'UNKNOWN',no_automatic_retry:true},3);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().then(code=>{process.exitCode=code;});
