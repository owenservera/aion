// Track B dev native host core (com.aion.relay.dev). Chrome launches it from
// the B dev extension; it never runs for Track A (different host name, pinned
// different extension ID, see guard.mjs).
//
//   CLI --(token IPC)--> host --(Chrome native messaging)--> worker
//                                   aion.b.call  { id, call_type, payload }
//                                   aion.b.reply { id, result }
//
// The host holds NO ledger, grant or retry logic. It forwards only allowlisted
// call types, one reply per id, and fails every pending call as UNCERTAIN when
// Chrome closes the port. It opens the CLI endpoint only after the worker has
// said hello, so a session file means a live worker answered at least once.
import {encodeNativeFrame,createNativeFrameDecoder} from '../../../bridge/src/framing.js';
import {CHROME_MAX_HOST_MESSAGE_BYTES} from '../../../bridge/bin/aion-relay-host.mjs';
import {verifyDevNativeOrigin} from './guard.mjs';
import {startHostEndpoint} from '../transport/local-ipc.mjs';
import {REMOTE_CALLS} from '../browser/remote-call.mjs';

export const PING='aion.b.ping';
const ALLOWED=new Set([...Object.keys(REMOTE_CALLS),PING]);
const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const err=code=>Object.assign(new Error(code),{code});
const MAX_INFLIGHT=32;

export async function runDevHost({argv,stdin,stdout,stateDir,expectedExtensionId,
  startEndpoint=startHostEndpoint,log=()=>{},forwardTimeoutMs=130_000}){
  if(!Number.isSafeInteger(forwardTimeoutMs)||forwardTimeoutMs<1||forwardTimeoutMs>300_000)
    throw new RangeError('invalid forward timeout');
  const origin=verifyDevNativeOrigin(argv,{expectedExtensionId});
  if(!origin.ok){log({event:'origin_refused',reason:origin.reason});return {ok:false,code:origin.reason};}
  const pending=new Map();let seq=0,endpoint=null,closed=false,workerHello=null;
  const send=msg=>stdout.write(encodeNativeFrame(msg,{maxFrameBytes:CHROME_MAX_HOST_MESSAGE_BYTES}));
  const failAll=code=>{
    for(const p of pending.values()){clearTimeout(p.timer);p.reject(err(code));}
    pending.clear();
  };

  async function forward({call_type,payload}){
    if(closed)throw err('HOST_CLOSING');
    if(!ALLOWED.has(call_type))throw err('CALL_NOT_ALLOWED');
    if(payload!==undefined&&!isPlain(payload))throw err('BAD_PAYLOAD');
    if(pending.size>=MAX_INFLIGHT)throw err('HOST_BUSY');
    const id=`c${++seq}`;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        pending.delete(id);
        reject(err('WORKER_REPLY_TIMEOUT')); // a send may have happened: never retry
      },forwardTimeoutMs);
      pending.set(id,{resolve,reject,timer});
      try{send({type:'aion.b.call',id,call_type,payload:payload??{}});}
      catch(e){clearTimeout(timer);pending.delete(id);reject(err('FRAME_TOO_LARGE'));}
    });
  }

  let done;const finished=new Promise(r=>{done=r;});
  async function shutdown(code){
    if(closed)return;closed=true;
    failAll('HOST_LINK_LOST');
    try{await endpoint?.close();}catch{}
    log({event:'stopped',code});done({ok:true,code});
  }

  const decoder=createNativeFrameDecoder({maxFrameBytes:CHROME_MAX_HOST_MESSAGE_BYTES,
    onError:()=>{void shutdown('NATIVE_FRAMING_ERROR');}});
  decoder.onMessage(msg=>{
    if(!isPlain(msg))return;
    if(msg.type==='aion.b.hello'){
      if(workerHello){send({type:'aion.b.ready',session_id:endpoint?.session_id??null});return;}
      workerHello={at:new Date().toISOString()};
      startEndpoint({stateDir,onRequest:forward,meta:{extension_id:origin.extension_id,channel:'dev'}})
        .then(ep=>{
          if(closed){void ep.close();return;}
          endpoint=ep;send({type:'aion.b.ready',session_id:ep.session_id});log({event:'ready'});
        })
        .catch(e=>{send({type:'aion.b.ready',error:e.code??'ENDPOINT_FAILED'});void shutdown('ENDPOINT_FAILED');});
      return;
    }
    if(msg.type==='aion.b.reply'&&typeof msg.id==='string'){
      const p=pending.get(msg.id);if(!p)return;
      pending.delete(msg.id);clearTimeout(p.timer);
      isPlain(msg.result)?p.resolve(msg.result):p.reject(err('BAD_WORKER_REPLY'));
    }
  });
  stdin.on('data',chunk=>decoder.push(chunk));
  stdin.on('end',()=>{decoder.end();void shutdown('CHROME_PORT_CLOSED');});
  stdin.on('error',()=>{void shutdown('STDIN_ERROR');});
  return {ok:true,finished,shutdown,get endpoint(){return endpoint;}};
}
