#!/usr/bin/env node
// One local operator command; GitHub is never a runtime dependency.
import {randomBytes} from 'node:crypto';
import {statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCommand} from '../src/commands.mjs';
import {parseEngineSetup,parseRoleConnect} from '../src/setup-args.mjs';
import {openLocal,engineProbe,browserProbe,publicBrowser} from '../src/local-runtime.mjs';
import {resolveRole} from '../src/broker/roles.mjs';
import {projectResult} from '../src/result.mjs';
import {CHATGPT_ADAPTER,canonicalChatGPTConversation} from '../../extension/src/bus/adapters/chatgpt.js';
import {canonicalConversation} from '../../extension/src/lib/chatgpt-tasks.js';
import {probeAcpBinary,verifyAcpCwd} from '../src/engines/acp.mjs';
import {runLocalSelftest} from '../src/selftest.mjs';
import {planBrowserSetup,applyBrowserSetup,uninstallBrowserSetup} from '../src/browser/setup.mjs';
import {runBrowserPreflight} from '../src/browser/preflight.mjs';
import {listAgents,loadAgentContext,composeAgentPrompt} from '../src/agents-context.mjs';
import {readRoleCatalog} from '../src/local-runtime.mjs';
import {localStatePath} from '../src/local-runtime.mjs';
import {assertPrivateStateDir} from '../src/security.mjs';
import {dirname} from 'node:path';

const token=prefix=>prefix+randomBytes(12).toString('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const safe=engine=>({engine:engine?.engine??'opencode-v2',state:engine?.status??'UNAVAILABLE',
  endpoint:engine?.ok?engine.endpoint:null,reason:engine?.reason??null});
const done=(print,r,exit)=>{print(JSON.stringify(r));return exit;};

export async function main(argv=process.argv.slice(2),{
  print=line=>process.stdout.write(line+'\n'),open=openLocal,probe=engineProbe,
  tests=runLocalSelftest,acpProbe=probeAcpBinary,delegate=null,pause=sleep,now=()=>Date.now(),
  chromeProbe=async()=>{const b=await browserProbe();b.link?.close();return b;}
}={}){
 const cmd=argv[0]??'status';
 if(cmd==='agents'){
   if(argv.length!==1)return done(print,{ok:false,code:'BAD_COMMAND'},2);
   let rt;
   try{
     rt=await open();
     const state=await rt.bus.store.read();
     const agents=listAgents(rt.roleCatalog,state.agents);
     return done(print,{schema:'aion.agents/1',count:agents.length,agents},0);
   }catch(error){return done(print,{ok:false,code:error.code??'AGENT_LIST_UNAVAILABLE'},3);}
   finally{if(rt)await rt.close();}
 }
 if(cmd==='context'){
   if(argv.length<2||argv.length>4||argv.length===3||
     (argv.length===4&&(argv[2]!=='--scope'||!['bootstrap','sitrep','both'].includes(argv[3]))))
     return done(print,{ok:false,code:'BAD_COMMAND',usage:'aion context <agent> [--scope bootstrap|sitrep|both]'},2);
   try{
     const context=loadAgentContext(readRoleCatalog(),argv[1],{scope:argv[3]??'both'});
     return done(print,context,0);
   }catch(error){return done(print,{ok:false,code:error.code??'CONTEXT_UNAVAILABLE'},3);}
 }
 if(cmd==='selftest'){
   if(argv.length!==1)return done(print,{ok:false,code:'BAD_COMMAND'},2);
   const report=tests();return done(print,report,report.all_pass?0:1);
 }
 if(cmd==='preflight'){
   if(argv.length!==2||argv[1]!=='browser')
     return done(print,{ok:false,code:'BAD_COMMAND',reason:'usage: aion preflight browser'},2);
   try{
     const report=await runBrowserPreflight();
     return done(print,report,report.ok?0:3);
   }catch(error){
     return done(print,{ok:false,code:error?.code??'BROWSER_PREFLIGHT_FAILED',
       live_send_verified:false},3);
   }
 }
 if(cmd==='setup'){
   const mode=argv[2]??'--dry-run';
   if(argv[1]!=='browser'||argv.length>3||!['--dry-run','--apply','--uninstall'].includes(mode))
     return done(print,{ok:false,code:'BAD_COMMAND',reason:'usage: aion setup browser [--dry-run|--apply|--uninstall]'},2);
   const plan=planBrowserSetup({stateDir:dirname(localStatePath())});
   if(mode==='--dry-run')return done(print,{ok:true,code:'PLAN_ONLY_NO_WRITES',plan,apply:'aion setup browser --apply'},0);
   try{
     assertPrivateStateDir(localStatePath());
     const r=mode==='--apply'?applyBrowserSetup(plan):uninstallBrowserSetup(plan);
     return done(print,{ok:true,code:mode==='--apply'?'BROWSER_SETUP_APPLIED':'BROWSER_SETUP_REMOVED',...r},0);
   }catch(error){return done(print,{ok:false,code:error.code??'SETUP_FAILED',reason:String(error.message).slice(0,160)},3);}
 }
 if(cmd==='connections'){
   if(argv.length>1)return done(print,{ok:false,code:'BAD_COMMAND'},2);
   const [engine,acp,chrome]=await Promise.all([probe(),acpProbe(),chromeProbe()]);
   return done(print,{schema:'aion.connections/1',opencode_v2:safe(engine),acp:safe(acp),chrome:publicBrowser(chrome)},0);
 }
 if(process.env.AION_DEV_SOCKET && cmd!=='connect'){
   const invoke=delegate??(await import('./aion.mjs')).main;
   return invoke(argv,{write:print});
 }
 if(cmd==='connect'&&argv[1]&&!['opencode','acp'].includes(argv[1]))return connectRole(argv,{print,open,now});
 if(cmd==='connect'){
   let args;
   try{args=parseEngineSetup(argv);}catch(error){return done(print,{ok:false,code:'BAD_COMMAND',reason:error.message},2);}
   const cwd=resolve(args.cwd);
   try{if(!statSync(cwd).isDirectory())throw new Error('not a directory');}
   catch{return done(print,{ok:false,code:'INVALID_GRANT_CWD',delivery:'NOT_SENT'},2);}
   if(args.engine==='acp'){
     const check=verifyAcpCwd(cwd);
     if(!check.ok)return done(print,{ok:false,code:check.code,delivery:'NOT_SENT'},3);
   }
   const engine=args.engine==='acp'?await acpProbe():await probe();
   if(!engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',opencode:safe(engine)},3);
   let rt;
   try{rt=await open({withEngine:true,engineChoice:args.engine==='acp'?'acp':'opencode-v2'});}
   catch(error){return done(print,{ok:false,code:error.code??'ENGINE_OPEN_FAILED',delivery:'NOT_SENT'},3);}
   try{
     if(!rt.engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',delivery:'NOT_SENT'},3);
     const state=await rt.bus.store.read();
     const existing=state.agents?.opencode;
     if(!existing)return done(print,{ok:false,code:'EXECUTOR_MISSING'},3);
     // An explicit engine choice may replace another binding, but only after
     // checking the target has no pending/uncertain command (below).
     if(Object.values(state.commands??{}).some(c=>c.to==='opencode'&&
       ['RESERVED','DISPATCHED','SUBMISSION_OBSERVED','UNRESOLVED'].includes(c.state)))
       return done(print,{ok:false,code:'TARGET_BUSY',delivery:'NOT_SENT'},3);
     const requiredAdapter=args.engine==='acp'?'acp':'opencode-v2';
     if(existing.binding?.adapter!==requiredAdapter){
       if(existing.binding)await rt.bus.unbind('opencode');
       await rt.bus.bind('opencode',{adapter:requiredAdapter,
         ref:'opencode',confirmed_by:'explicit-local-operator-connect'});
     }
     // Reconnecting replaces older send grants so no task runs in a stale cwd.
     for(const prior of Object.values(state.grants??{})){
       if(!prior.revoked && prior.agents?.includes('opencode') && prior.ops?.includes('send'))
         await rt.bus.revoke(prior.grant_id);
     }
     const grantId=token('grant-');
     await rt.bus.grant({grant_id:grantId,ref:'explicit-local-operator-connect',
       agents:['opencode'],ops:['send'],max_count:args.max,rate_per_hour:Math.min(args.max,100),
       expires_utc:new Date(now()+args.hours*3600000).toISOString(),cwd});
     return done(print,{ok:true,code:'ENGINE_BOUND_AND_GRANTED',engine:requiredAdapter,
       grant_id:grantId,max_sends:args.max,expires_hours:args.hours,local_only:true},0);
   }finally{await rt.close();}
 }
 let parsed;
 try{parsed=parseCommand(argv);}catch(error){return done(print,{ok:false,code:'BAD_COMMAND',reason:error.message},2);}
 if(parsed.command==='send'&&parsed.detach)
   return done(print,{ok:false,code:'DETACH_REQUIRES_BROKER',delivery:'NOT_SENT'},2);
 const browserSend=parsed.command==='send'&&parsed.alias!=='opencode';
 // --context is a deliberate, reviewable attachment for AION conversation
 // agents only. Never quietly attach workspace instructions to an executor.
 if(parsed.command==='send'&&parsed.context&&!browserSend)
   return done(print,{ok:false,code:'CONTEXT_REQUIRES_CONVERSATION_AGENT',delivery:'NOT_SENT'},2);
 const needsEngine=['observe','capabilities'].includes(parsed.command)||(parsed.command==='send'&&!browserSend);
 const needsBrowser=browserSend||['observe','capabilities','doctor'].includes(parsed.command);
 let rt;
 try{rt=await open({withEngine:needsEngine,withBrowser:needsBrowser});}
 catch(error){return done(print,{ok:false,code:error.code??'LOCAL_STATE_UNAVAILABLE',delivery:'NOT_SENT'},3);}
 try{
   if(parsed.command==='doctor'){
     const [engine,acp]=await Promise.all([probe(),acpProbe()]);
     return done(print,{schema:'aion.doctor/1',ok:true,mode:'DIRECT_LOCAL',
       state_path:rt.statePath,engines:[safe(engine),safe(acp)],chrome:publicBrowser(rt.browser),actions:'OWNER_GRANTED_ONLY'},0);
   }
   if(parsed.command==='capabilities'){
     const ready=await rt.refresh();
     return done(print,{schema:'aion.capabilities/1',engine:safe(rt.engine),
       opencode_submit:ready?'READY_TO_ATTEMPT':'BLOCKED',chrome:publicBrowser(rt.browser)},0);
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
   if(parsed.command==='send'&&browserSend){
     if(!rt.browser?.ok)return done(print,{ok:false,code:'BROWSER_CONNECTOR_NOT_CONNECTED',delivery:'NOT_SENT',
       chrome:publicBrowser(rt.browser)},3);
     const state=await rt.bus.store.read();
     const role=resolveRole(parsed.alias,rt.roleCatalog,state.agents);
     if(!role.ok)return done(print,{ok:false,code:role.reason,delivery:'NOT_SENT'},3);
     if(role.adapter!==CHATGPT_ADAPTER)return done(print,{ok:false,code:'ROLE_NOT_A_CHATGPT_BINDING',delivery:'NOT_SENT'},3);
     if(!await rt.readyFor(role.target))return done(print,{ok:false,code:'OWNER_BINDING_OR_GRANT_REQUIRED',delivery:'NOT_SENT',
       hint:`aion connect ${parsed.alias} --conversation https://chatgpt.com/c/<id>`},3);
     let outgoing=parsed.text;
     if(parsed.context){
       try{outgoing=composeAgentPrompt(parsed.text,
         loadAgentContext(rt.roleCatalog,parsed.alias,{scope:parsed.context}));}
       catch(error){return done(print,{ok:false,code:error.code??'CONTEXT_UNAVAILABLE',
         delivery:'NOT_SENT',required_chars:error.required_chars??null,
         limit:error.limit??null,reason:error.reason??null},3);}
     }
     const admit=await rt.plane.sendAlias({alias:parsed.alias,text:outgoing,nonce:token('nonce-')});
     if(!admit.ok)return done(print,admit,3);
     await rt.plane.waitForIdle();
     return await follow(rt,admit.operation_id,parsed.wait_ms??120000,{print,pause,now});
   }
   if(parsed.command==='send'){
     if(!rt.engine?.ok)return done(print,{ok:false,code:'ENGINE_NOT_CONNECTED',delivery:'NOT_SENT',opencode:safe(rt.engine)},3);
     if(!await rt.refresh())return done(print,{ok:false,code:'OWNER_BINDING_OR_GRANT_REQUIRED',delivery:'NOT_SENT'},3);
     const admit=await rt.plane.sendAlias({alias:'opencode',text:parsed.text,nonce:token('nonce-')});
     if(!admit.ok)return done(print,admit,3);
     await rt.plane.waitForIdle();
     return await follow(rt,admit.operation_id,parsed.wait_ms??120000,{print,pause,now});
   }
   if(parsed.command==='observe'){
     if(!parsed.follow){const r=await rt.plane.handle('observe',{operation_id:parsed.operation_id});return done(print,r,r.ok?0:3);}
     return await follow(rt,parsed.operation_id,parsed.wait_ms??120000,{print,pause,now});
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
   if(last?.status==='SUCCEEDED'||last?.status==='REPLY_OBSERVED'){
     // The owner's own terminal: include the stored reply excerpt with the result.
     let full=last;
     try{const c=await rt.bus.readCommand?.(operationId);if(c)full=projectResult(c,{includeExcerpt:true});}catch{}
     return done(print,{ok:true,code:'RESULT_OBSERVED',operation_id:operationId,result:full},0);
   }
   if(last?.terminal)return done(print,{ok:false,code:last.status,operation_id:operationId,result:last},3);
   if(now()-begin>=waitMs)break;
   await pause(Math.min(750,Math.max(0,waitMs-(now()-begin))));
 }while(now()-begin<waitMs);
 return done(print,{ok:false,code:'WAIT_TIMEOUT',operation_id:operationId,last_result:last,
   delivery:last?.delivery??'UNKNOWN',no_automatic_retry:true},3);
}
// `aion connect <role> --conversation URL`: explicit owner binding of ONE open
// ChatGPT conversation to a role, plus a finite scoped send grant. Read-only
// proof first: a live host link and exactly one open tab showing that chat.
export async function connectRole(argv,{print,open,now}){
 let args;
 try{args=parseRoleConnect(argv);}catch(error){return done(print,{ok:false,code:'BAD_COMMAND',reason:error.message},2);}
 let ref;
 try{ref=canonicalChatGPTConversation(args.conversation);}
 catch{return done(print,{ok:false,code:'BAD_CONVERSATION_URL',reason:'use https://chatgpt.com/c/<id>'},2);}
 let rt;
 try{rt=await open({withBrowser:true});}
 catch(error){return done(print,{ok:false,code:error.code??'LOCAL_STATE_UNAVAILABLE'},3);}
 try{
   if(!rt.browser?.ok)return done(print,{ok:false,code:'BROWSER_CONNECTOR_NOT_CONNECTED',chrome:publicBrowser(rt.browser)},3);
   const state=await rt.bus.store.read();
   const roles=(rt.roleCatalog?.roles??[]).filter(r=>Array.isArray(r.aliases)&&r.aliases.includes(args.alias));
   if(roles.length!==1)return done(print,{ok:false,code:roles.length?'ALIAS_AMBIGUOUS':'ALIAS_UNKNOWN'},3);
   const agents=Object.values(state.agents??{}).filter(a=>a?.role_id===roles[0].id&&a.kind==='conversation'&&a.status!=='retired');
   if(agents.length!==1)return done(print,{ok:false,code:agents.length?'ROLE_AMBIGUOUS':'ROLE_AGENT_MISSING'},3);
   const agent=agents[0];
   const tabs=await rt.browser.link.request('aion/chatgpt-tabs',{},{timeoutMs:60000}).catch(()=>null);
   if(tabs?.ok!==true||!Array.isArray(tabs.tabs))return done(print,{ok:false,code:'TAB_LISTING_FAILED'},3);
   const open_=tabs.tabs.filter(t=>{try{return canonicalConversation(t.url)===ref;}catch{return false;}});
   if(open_.length!==1)return done(print,{ok:false,code:open_.length?'CONVERSATION_OPEN_IN_MULTIPLE_TABS':'CONVERSATION_NOT_OPEN',
     hint:'open exactly one tab on that conversation in the Track B dev profile'},3);
   if(Object.values(state.commands??{}).some(c=>c.to===agent.agent_id&&
     ['RESERVED','DISPATCHED','SUBMISSION_OBSERVED','UNRESOLVED'].includes(c.state)))
     return done(print,{ok:false,code:'TARGET_BUSY',delivery:'NOT_SENT'},3);
   if(agent.binding?.adapter!==CHATGPT_ADAPTER||agent.binding?.ref!==ref){
     if(agent.binding)await rt.bus.unbind(agent.agent_id);
     await rt.bus.bind(agent.agent_id,{adapter:CHATGPT_ADAPTER,ref,label:roles[0].display_title??null,
       confirmed_by:'explicit-local-operator-connect'});
   }
   for(const prior of Object.values(state.grants??{})){
     if(!prior.revoked&&prior.agents?.includes(agent.agent_id)&&prior.ops?.includes('send'))await rt.bus.revoke(prior.grant_id);
   }
   const grantId=token('grant-');
   await rt.bus.grant({grant_id:grantId,ref:'explicit-local-operator-connect',agents:[agent.agent_id],ops:['send'],
     max_count:args.max,rate_per_hour:Math.min(args.max,100),expires_utc:new Date(now()+args.hours*3600000).toISOString(),cwd:null});
   return done(print,{ok:true,code:'ROLE_BOUND_AND_GRANTED',role:roles[0].id,agent_id:agent.agent_id,
     conversation:ref,grant_id:grantId,max_sends:args.max,expires_hours:args.hours,local_only:true},0);
 }finally{await rt.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().then(code=>{process.exitCode=code;});
