#!/usr/bin/env node
// Track B dev native host entry. Launched BY CHROME for the pinned B dev
// extension only (com.aion.relay.dev). stdout carries native frames only.
// Usage (written by `aion setup browser`): node aion-host-dev.mjs --config <file> <chrome origin args>
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runDevHost} from '../src/native-host/relay.mjs';
import {assertPrivateStateDirAsync} from '../src/security.mjs';

export function loadDevHostConfig(argv){
  const i=argv.indexOf('--config');
  if(i<0||!argv[i+1])throw Object.assign(new Error('--config required'),{code:'CONFIG_MISSING'});
  const c=JSON.parse(readFileSync(argv[i+1],'utf8'));
  if(c?.schema!=='aion.b.host-config/1'||typeof c.extension_id!=='string'||typeof c.state_dir!=='string')
    throw Object.assign(new Error('bad host config'),{code:'CONFIG_INVALID'});
  return c;
}
async function main(argv=process.argv.slice(2)){
  const log=e=>process.stderr.write(JSON.stringify({host:'com.aion.relay.dev',...e})+'\n');
  let config;
  try{config=loadDevHostConfig(argv);await assertPrivateStateDirAsync(join(config.state_dir,'bus.json'));}
  catch(e){log({event:'startup_refused',code:e.code??'CONFIG_INVALID'});process.exitCode=1;return;}
  const r=await runDevHost({argv,stdin:process.stdin,stdout:process.stdout,stateDir:config.state_dir,
    expectedExtensionId:config.extension_id,log});
  if(!r.ok){process.exitCode=1;return;}
  for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>{void r.shutdown(s);});
  await r.finished;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
