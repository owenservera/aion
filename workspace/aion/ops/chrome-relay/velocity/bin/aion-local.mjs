#!/usr/bin/env node
// AION Track B - the local CLI entry point.
//
// WHAT THIS COMMAND IS
//   `aion chat <role> --watch` - ONE long-lived, READ-ONLY observation of
//   ONE exactly bound conversation.
//   `aion account register <role>` - the EXPLICIT, one-shot registration of
//   the account of that role's EXISTING bound conversation.
//
// WHAT IT REFUSES
//   - it never sends anything: the parser has no send option and the watch
//     loop only ever calls `conversation.*`;
//   - it never selects, binds or repairs a conversation: the OWNER's local
//     Bus state decides, and a missing account key is a hard refusal;
//   - it never registers implicitly: only `aion account register` registers,
//     and it prints a fixed status, never the address;
//   - it never prints the Bus, a token, a grant, the account address or the
//     lane id.
//
// EXIT CODES
//   0  the owner left the watch (/quit), asked for help, or the registration
//      succeeded
//   2  the command line is not understood
//   3  fail closed: no binding, no authority, no registration, unreadable
//      state, revoked scope
//   4  the local Track B host is not running
import {createInterface} from 'node:readline';
import {dirname} from 'node:path';
import {parseCommand,USAGE} from '../src/commands.mjs';
import {
  readBinding,readBoundRole,createBindingAuthority,readRoleCatalog,defaultBusStatePath,
} from '../src/conversation/binding.mjs';
import {readAccountRegistration} from '../src/conversation/registration.mjs';
import {createAccountRegisterCall} from '../src/browser/remote-call.mjs';
import {createWatchRepl} from '../src/conversation/repl.mjs';
import {connectHost} from '../src/transport/local-ipc.mjs';
import {initSecurityProfile} from '../src/security.mjs';

export async function main(argv=process.argv.slice(2),{
  print=line=>process.stdout.write(line+'\n'),
  connectHostImpl=connectHost,
  catalogImpl=readRoleCatalog,
  bindingImpl=readBinding,
  boundRoleImpl=readBoundRole,
  authorityImpl=createBindingAuthority,
  replImpl=createWatchRepl,
  registrationImpl=readAccountRegistration,
  accountRegisterImpl=createAccountRegisterCall,
  env=process.env,
  stdin=process.stdin,
  exit=(code=0)=>{process.exitCode=code;},
}={}){
  const parsed=parseCommand(argv);
  if(!parsed.ok){
    if(parsed.code==='WATCH_ONLY')print(parsed.reason);
    else print(parsed.usage);
    exit(2);
    return 2;
  }
  if(parsed.command==='help'){
    print(USAGE);
    exit(0);
    return 0;
  }

  const stateFile=parsed.stateFile?parsed.stateFile:defaultBusStatePath(env);
  const stateDir=dirname(stateFile);
  try{initSecurityProfile({env,stateDir});}
  catch(error){
    print(JSON.stringify({ok:false,code:error?.code??'SECURITY_PROFILE_INVALID'}));
    exit(3);
    return 3;
  }
  let catalog;
  try{catalog=catalogImpl();}
  catch(error){
    print(JSON.stringify({ok:false,code:error?.code??'ROLE_CATALOG_UNAVAILABLE'}));
    exit(3);
    return 3;
  }

  const connect=()=>connectHostImpl({stateDir});
  /** The owner's LOCAL registration, re-read when it is asked for. */
  const currentRegistration=async()=>{
    try{
      const result=await registrationImpl({stateDir});
      return result?.ok?result.registration:null;
    }catch{return null;}
  };

  if(parsed.command==='account'){
    // The role's EXISTING bound conversation, read from the Bus metadata.
    // No auto-select, no rebind, no guess, no tab search here.
    const role=await boundRoleImpl({stateFile,alias:parsed.role,catalog});
    if(!role.ok){
      print(JSON.stringify({ok:false,code:role.code,role:parsed.role}));
      exit(3);
      return 3;
    }
    let link;
    try{link=await connect();}
    catch(error){
      print(JSON.stringify({ok:false,code:error?.code??'HOST_NOT_RUNNING'}));
      exit(4);
      return 4;
    }
    let result;
    try{result=await accountRegisterImpl({link})({alias:parsed.role,url:role.ref});}
    finally{try{link.close();}catch{}}
    if(!result||result.ok!==true){
      print(JSON.stringify({ok:false,code:result?.code??'REGISTRATION_FAILED',role:parsed.role}));
      exit(3);
      return 3;
    }
    // A fixed status and the alias. The ADDRESS is never printed.
    print(JSON.stringify({
      ok:true,
      code:'ACCOUNT_REGISTERED',
      role:parsed.role,
      role_code:role.role?.code??null,
      provider:role.provider,
      conversation_id:role.conversation_id,
    }));
    exit(0);
    return 0;
  }

  // The OWNER's binding decides. No auto-select, no rebind, no guess.
  const binding=await bindingImpl({stateFile,alias:parsed.role,catalog,registration:currentRegistration});
  if(!binding.ok){
    print(JSON.stringify({ok:false,code:binding.code,role:parsed.role}));
    exit(3);
    return 3;
  }

  let link;
  try{link=await connect();}
  catch(error){
    print(JSON.stringify({ok:false,code:error?.code??'HOST_NOT_RUNNING'}));
    exit(4);
    return 4;
  }

  const authority=authorityImpl({stateFile,alias:parsed.role,catalog,registration:currentRegistration});
  let stopping=false;
  let rl=null;
  const repl=replImpl({
    binding:binding.binding,
    role:binding.role,
    connect:async()=>{link.close();link=await connect();return link;},
    authority:()=>authority(binding.binding),
    output:line=>print(line),
    onStop:({reason,code})=>{
      if(stopping)return;
      stopping=true;
      print(JSON.stringify({ok:false,code:reason==='revoked'?(code??'BINDING_REVOKED'):'WATCH_STOPPED',reason}));
      if(rl)rl.close();
      exit(reason==='quit'?0:3);
    },
  });

  print(`· watching ${binding.role.code??binding.role.id} - provider ${binding.binding.provider},`
    +` conversation ${binding.binding.conversation_id} (binding revision ${binding.binding.revision})`);

  const started=await repl.start();
  if(!started.ok){
    print(JSON.stringify({ok:false,code:started.code}));
    exit(3);
    return 3;
  }

  rl=createInterface({input:stdin,terminal:false});
  let chain=Promise.resolve();
  rl.on('line',line=>{
    chain=chain.then(()=>repl.handleLine(line)).catch(()=>{});
  });
  rl.on('close',()=>{
    chain=chain.then(()=>repl.stop('EOF')).catch(()=>{});
  });
  for(const signal of ['SIGINT','SIGTERM']){
    process.once(signal,()=>{
      chain=chain.then(()=>repl.stop(signal)).catch(()=>{});
    });
  }
  await chain;
  return process.exitCode??0;
}

if(process.argv[1]&&process.argv[1].replace(/\\/g,'/').endsWith('/aion-local.mjs'))
  await main();
