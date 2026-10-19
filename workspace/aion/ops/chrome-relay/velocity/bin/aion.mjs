#!/usr/bin/env node
// Thin Track B CLI: ONE send + read-only observations, not repeated sends.
// No browser automation or credential access. Windows IPC still intentionally
// unavailable until an independently verified owner-SID secured helper exists.
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseCommand,DEFAULT_WAIT_MS} from '../src/commands.mjs';
import {makeControlRequest} from '../src/control.mjs';
import {requestUnix} from '../src/transport/unix.mjs';

const nextId=()=>('req_'+randomBytes(12).toString('hex'));
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
function present(write,data,json){write(JSON.stringify(data,null,json?0:2));}

// Polling is temporary for the dev CLI. Every poll is OBSERVE only, never SEND.
// A future event subscription should replace it without changing Bus semantics.
export async function followOperation({
  operationId,socketPath,waitMs=DEFAULT_WAIT_MS,
  transport=requestUnix,clock=()=>Date.now(),pause=sleep
}={}){
  if(typeof operationId!=='string'||!operationId)throw new TypeError('operationId');
  const started=clock();
  let last=null;
  do{
    const req=makeControlRequest({request_id:nextId(),method:'observe',
      params:{operation_id:operationId}});
    const response=await transport({socketPath,request:req,timeoutMs:Math.min(10_000,waitMs)});
    if(!response?.ok||response.result?.ok===false){
      return {ok:false,code:response?.code??response?.result?.code??'OBSERVATION_FAILED',
        operation_id:operationId,last_result:last};
    }
    const result=response.result?.result;
    if(!result||result.operation_id!==operationId)
      return {ok:false,code:'CORRELATION_MISMATCH',operation_id:operationId,last_result:last};
    last=result;
    if(result.status==='SUCCEEDED'||result.status==='REPLY_OBSERVED')
      return {ok:true,code:'RESULT_OBSERVED',operation_id:operationId,result};
    if(result.terminal)
      return {ok:false,code:result.status,operation_id:operationId,result};
    const remaining=waitMs-(clock()-started);
    if(remaining<=0)break;
    await pause(Math.min(750,remaining));
  }while(clock()-started<waitMs);
  return {ok:false,code:'WAIT_TIMEOUT',operation_id:operationId,
    last_result:last,delivery:last?.delivery??'UNKNOWN',
    message:'No second send attempted; run aion observe <id> to inspect later'};
}

export async function main(argv,{
  socketPath=process.env.AION_DEV_SOCKET,write=line=>process.stdout.write(line+'\n'),
  transport=requestUnix
}={}){
  let parsed;
  try{parsed=parseCommand(argv);}catch(error){
    present(write,{ok:false,code:'BAD_COMMAND',reason:error.message},true);return 2;
  }
  if(!socketPath){
    present(write,{ok:false,code:'RUNTIME_NOT_CONNECTED',delivery:'NOT_SENT',
      message:'AION_DEV_SOCKET not set; no request or send attempted'},parsed.json);return 3;
  }
  const method=parsed.command;
  const params=method==='send'?{alias:parsed.alias,text:parsed.text,
    nonce:'nonce_'+randomBytes(12).toString('hex')}:
    method==='observe'?{operation_id:parsed.operation_id}:
    method==='stop'?{reason:'operator CLI stop'}:{};
  try{
    if(method==='observe'&&parsed.follow){
      const out=await followOperation({operationId:parsed.operation_id,socketPath,
        waitMs:parsed.wait_ms??DEFAULT_WAIT_MS,transport});
      present(write,out,parsed.json);return out.ok?0:3;
    }
    const request=makeControlRequest({request_id:nextId(),method,params});
    const out=await transport({socketPath,request,timeoutMs:10_000});
    if(!out?.ok||out.result?.ok===false){
      present(write,out,parsed.json);return 3;
    }
    if(method==='send'&&!parsed.detach){
      const id=out.result?.operation_id;
      if(typeof id!=='string'||!id){
        present(write,{ok:false,code:'ADMISSION_ID_MISSING',detail:'Cannot observe without durable operation ID'},parsed.json);
        return 3;
      }
      const finished=await followOperation({operationId:id,socketPath,
        waitMs:parsed.wait_ms??DEFAULT_WAIT_MS,transport});
      present(write,finished,parsed.json);return finished.ok?0:3;
    }
    present(write,out,parsed.json);
    return 0;
  }catch(error){
    const uncertain=['RPC_TIMEOUT_OUTCOME_UNKNOWN','RPC_DISCONNECTED_OUTCOME_UNKNOWN']
      .includes(error?.code);
    const knownNoSend=['ENOENT','ECONNREFUSED'].includes(error?.code);
    present(write,{ok:false,
      code:uncertain?'OUTCOME_UNKNOWN':'RUNTIME_NOT_CONNECTED',
      delivery:knownNoSend?'NOT_SENT':'OUTCOME_UNKNOWN',
      reason:error.code??error.message,
      message:'No automatic retry was attempted'},parsed.json);
    return 3;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2)).then(code=>{process.exitCode=code;});
