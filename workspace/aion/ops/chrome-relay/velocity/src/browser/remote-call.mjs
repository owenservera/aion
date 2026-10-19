// `call(type,payload)` for the EXISTING createChatGPTAdapter, tunnelled through
// the Track B dev host to the extension worker's own runChatGPTCommand.
// No DOM code and no new send path: the worker's gates, durable task store and
// page observer do the work. This file only maps transport failures truthfully:
//   not written          -> positive no-send (submit) / not found (tabs)
//   written, no answer   -> submit UNCERTAIN, observe read-only UNCERTAIN
import {createChatGPTAdapter} from '../../../extension/src/bus/adapters/chatgpt.js';

export const REMOTE_CALLS=Object.freeze({
  'aion/chatgpt-tabs':{kind:'read',timeoutMs:60_000},
  'aion/chatgpt-observe':{kind:'read',timeoutMs:60_000},
  'aion/chatgpt-submit':{kind:'send',timeoutMs:120_000},
  'aion/chatgpt-dispose':{kind:'storage',timeoutMs:60_000},
});

export function createRemoteCall({link}){
  if(typeof link?.request!=='function')throw new TypeError('host link required');
  return async function call(type,payload){
    const spec=REMOTE_CALLS[type];
    if(!spec)return {ok:false,code:'unknown_action',submitted:false};
    try{
      const result=await link.request(type,payload,{timeoutMs:spec.timeoutMs});
      return result&&typeof result==='object'?result:{ok:false,code:'bad_host_reply',uncertain:spec.kind==='send',submitted:spec.kind==='send'};
    }catch(e){
      const written=e?.written!==false;
      const code=e?.code??'host_error';
      if(!written)return {ok:false,code,error:'request never left the CLI',submitted:false};
      if(spec.kind==='send')return {ok:false,code,error:code,submitted:true,uncertain:true};
      return {ok:false,code,error:code,read_only:true,uncertain:true};
    }
  };
}

export function createRemoteChatGPTAdapter({link,submitTimeoutMs}={}){
  return createChatGPTAdapter({call:createRemoteCall({link}),liveVerified:false,submitTimeoutMs});
}

/** Adapter for bind/status when no host is reachable: canonicalises refs, refuses delivery. */
export function createOfflineChatGPTAdapter(){
  return createChatGPTAdapter({call:async()=>({ok:false,code:'host_not_running',submitted:false})});
}
