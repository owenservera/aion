#!/usr/bin/env node
// Thin Track B local command client: one human CLI command, no browser side effects.
// The broker's existing Bus does all durable admission and single dispatch.
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseCommand} from '../src/commands.mjs';
import {makeControlRequest} from '../src/control.mjs';
import {requestUnix} from '../src/transport/unix.mjs';
const nextId=()=>('req_'+randomBytes(12).toString('hex'));
export async function main(argv,{
  socketPath=process.env.AION_DEV_SOCKET,write=line=>process.stdout.write(line+'\n')
}={}){
 let parsed;
 try{parsed=parseCommand(argv);}catch(error){
   write(JSON.stringify({ok:false,code:'BAD_COMMAND',reason:error.message}));return 2;
 }
 if(!socketPath){
   write(JSON.stringify({ok:false,code:'RUNTIME_NOT_CONNECTED',delivery:'NOT_SENT',
     message:'AION_DEV_SOCKET not set; no request or send attempted'}));return 3;
 }
 const method=parsed.command;
 const params=method==='send'?{alias:parsed.alias,text:parsed.text,
   nonce:'nonce_'+randomBytes(12).toString('hex')}:
   method==='observe'?{operation_id:parsed.operation_id}:
   method==='stop'?{reason:'operator CLI stop'}:{};
 try{
   const request=makeControlRequest({request_id:nextId(),method,params});
   const out=await requestUnix({socketPath,request,timeoutMs:10_000});
   write(JSON.stringify(out,null,parsed.json?0:2));
   return !out.ok||out.result?.ok===false?3:0;
 }catch(error){
   const unknown=['RPC_TIMEOUT_OUTCOME_UNKNOWN','RPC_DISCONNECTED_OUTCOME_UNKNOWN']
     .includes(error?.code);
   write(JSON.stringify({ok:false,code:unknown?'OUTCOME_UNKNOWN':'RUNTIME_NOT_CONNECTED',
     delivery:unknown?'OUTCOME_UNKNOWN':'UNKNOWN',reason:error.code??error.message,
     message:'No automatic retry was attempted'}));return 3;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2)).then(code=>{process.exitCode=code;});
