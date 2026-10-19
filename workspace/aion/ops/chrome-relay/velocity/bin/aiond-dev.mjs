#!/usr/bin/env node
// B development broker. Explicit Linux/macOS private UNIX socket only.
// NOT a Windows service, Chrome host, installer or live ChatGPT executor.
import {readFileSync,mkdirSync,lstatSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBus} from '../../extension/src/bus/bus.js';
import {createFileStorage} from '../../bus/node-storage.js';
import {createEventStream} from '../src/broker/events.mjs';
import {createCapabilityIndex} from '../src/broker/capabilities.mjs';
import {createCommandPlane} from '../src/broker/core.mjs';
import {createRpcChannel} from '../src/transport/channel.mjs';
import {startUnixBroker} from '../src/transport/unix.mjs';

export async function serve({socketPath=process.env.AION_DEV_SOCKET,
  statePath=process.env.AION_DEV_STATE}={}){
 if(process.platform==='win32')throw Object.assign(new Error('Windows SID-ACL IPC not yet verified'),{code:'WINDOWS_IPC_UNVERIFIED'});
 if(!socketPath||!statePath)throw new Error('AION_DEV_SOCKET and AION_DEV_STATE must both be explicit');
 const state=resolve(statePath);
 if(state===resolve(process.env.HOME??'', '.aion','bus','state.json'))
   throw new Error('stable bus state path forbidden');
 mkdirSync(dirname(state),{recursive:true,mode:0o700});
 const parent=lstatSync(dirname(state));
 if(!parent.isDirectory()||parent.isSymbolicLink()||(parent.mode&0o077)!==0
    ||(typeof process.getuid==='function'&&parent.uid!==process.getuid())){
   throw Object.assign(new Error('dev ledger directory must be private and owned by caller'),
     {code:'UNSAFE_LEDGER_DIRECTORY'});
 }
 const storage=createFileStorage(state);
 const bus=createBus({storage,adapters:[]});
 const events=createEventStream();
 const capabilities=createCapabilityIndex({publish:(type,data)=>events.publish(type,data)});
 const rolesPath=fileURLToPath(new URL('../../role-launcher/ROLES.json',import.meta.url));
 const roleCatalog=JSON.parse(readFileSync(rolesPath,'utf8'));
 const plane=createCommandPlane({bus,roleCatalog,capabilities,events});
 const channel=createRpcChannel({verifyPeer:peer=>peer?.verified===true
   && peer?.source==='cli' && peer?.channel==='dev',handle:plane.handle});
 const server=await startUnixBroker({socketPath,channel});
 events.publish('runtime.started');
 return {server,plane,bus,events,capabilities,
   async close(){events.publish('runtime.stopped');await server.close();}};
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
 serve().then(service=>{
   process.stdout.write(JSON.stringify({schema:'aion.dev.started/1',socket:service.server.socketPath,
     browser:'NOT_CONNECTED',windows:'NOT_CONNECTED'})+'\n');
   let closing=false;
   for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
     if(closing)return;closing=true;
     service.close().then(()=>{process.exitCode=0;}).catch(()=>{process.exitCode=1;});
   });
 }).catch(error=>{
   process.stderr.write(JSON.stringify({ok:false,code:error.code??'STARTUP_FAILED',reason:error.message})+'\n');
   process.exitCode=1;
 });
}
