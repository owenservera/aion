#!/usr/bin/env node
// Track B dev native host entry. Launched BY CHROME for the pinned B dev
// extension only (com.aion.relay.dev). stdout carries native frames only.
// Usage (written by `aion setup browser`): node aion-host-dev.mjs --config <file> <chrome origin args>
//
// THE AUTHORITY WIRING
//   The host owns TWO local sources of truth, both inside the owner-private
//   state directory and both READ ONLY unless the owner explicitly registers:
//     1. the Bus state file (bus.json) - the owner's existing role bindings;
//     2. the account registration (account-registration.json) - which account
//        this LANE registered, and which lane that is.
//   The read scope of a receive call needs BOTH: the exact role/conversation
//   binding AND the registration of the connected lane. A claim alone is
//   never authority, and with no registration the host serves nothing.
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runDevHost} from '../src/native-host/relay.mjs';
import {initSecurityProfile} from '../src/security.mjs';
import {readBoundRole,createBindingAuthority} from '../src/conversation/binding.mjs';
import {readAccountRegistration,writeAccountRegistration} from '../src/conversation/registration.mjs';

export function loadDevHostConfig(argv){
  const i=argv.indexOf('--config');
  if(i<0||!argv[i+1])throw Object.assign(new Error('--config required'),{code:'CONFIG_MISSING'});
  const c=JSON.parse(readFileSync(argv[i+1],'utf8'));
  if(c?.schema!=='aion.b.host-config/1'||typeof c.extension_id!=='string'||typeof c.state_dir!=='string')
    throw Object.assign(new Error('bad host config'),{code:'CONFIG_INVALID'});
  return c;
}

/** The owner's Bus state file: it lives in the SAME private state dir. */
export function busStateFile(stateDir){
  return join(resolve(stateDir),'bus.json');
}

/**
 * The seams the host needs, bound to ONE state directory.
 *
 * `readRegistration` is re-read on every receive request: that is a bounded
 * LOCAL read of a small file, never an account poll and never a network call.
 */
export function createHostAuthority({stateDir}={}){
  const stateFile=busStateFile(stateDir);
  const readRegistration=()=>readAccountRegistration({stateDir});
  return {
    stateFile,
    readRegistration,
    readRoleBinding:(alias)=>readBoundRole({stateFile,alias}),
    readBinding:createBindingAuthority({
      stateFile,
      // The account key of a binding that has none comes from the LOCAL
      // REGISTRATION, never from the caller's payload.
      registration:async()=>{
        const result=await readRegistration();
        return result.ok?result.registration:null;
      },
    }),
    writeRegistration:({extension_id,lane_id,email})=>
      writeAccountRegistration({stateDir,extension_id,lane_id,email}),
  };
}

async function main(argv=process.argv.slice(2)){
  const log=e=>process.stderr.write(JSON.stringify({host:'com.aion.relay.dev',...e})+'\n');
  let config;
  // startHostEndpoint owns the startup ACL gate; do not launch it twice.
  try{config=loadDevHostConfig(argv);initSecurityProfile({config});}
  catch(e){log({event:'startup_refused',code:e.code??'CONFIG_INVALID'});process.exitCode=1;return;}
  const authority=createHostAuthority({stateDir:config.state_dir});
  const r=await runDevHost({argv,stdin:process.stdin,stdout:process.stdout,stateDir:config.state_dir,
    expectedExtensionId:config.extension_id,log,
    readBinding:authority.readBinding,
    readRoleBinding:authority.readRoleBinding,
    readRegistration:authority.readRegistration,
    writeRegistration:authority.writeRegistration});
  if(!r.ok){process.exitCode=1;return;}
  for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>{void r.shutdown(s);});
  await r.finished;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
