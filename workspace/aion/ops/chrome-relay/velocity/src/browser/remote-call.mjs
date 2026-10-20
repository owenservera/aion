// `call(type,payload)` for the EXISTING createChatGPTAdapter, tunnelled through
// the Track B dev host to the extension worker's own runChatGPTCommand.
// No DOM code and no new send path: the worker's gates, durable task store and
// page observer do the work. This file only maps transport failures truthfully:
//   not written          -> positive no-send (submit) / not found (tabs)
//   written, no answer   -> submit UNCERTAIN, observe read-only UNCERTAIN
//
// THE RECEIVE PLANE (P3)
//   `createReceiveCall` speaks the four read-only `conversation.*` calls of the
//   authenticated local IPC pipe. It is a SEPARATE plane from the command
//   plane above: a receive answer is data, never an action, and its codes are
//   the fixed uppercase set the host and the worker agree on.
import {createChatGPTAdapter} from '../../../extension/src/bus/adapters/chatgpt.js';
import {
  validateConversationBinding,validateObservationCursor,
} from '../../../extension/src/lib/conversation-contract.js';

export const REMOTE_CALLS=Object.freeze({
  'aion/chatgpt-tabs':{kind:'read',timeoutMs:60_000},
  'aion/chatgpt-observe':{kind:'read',timeoutMs:60_000},
  'aion/chatgpt-submit':{kind:'send',timeoutMs:120_000},
  'aion/chatgpt-dispose':{kind:'storage',timeoutMs:60_000},
});

/** The read-only receive calls. Fixed timeouts, no retries, no queue. */
export const RECEIVE_CALLS=Object.freeze({
  'conversation.subscribe':{timeoutMs:60_000},
  'conversation.read':{timeoutMs:60_000},
  'conversation.replay':{timeoutMs:60_000},
  'conversation.unsubscribe':{timeoutMs:30_000},
});
/** The EXPLICIT account registration call. It is never issued implicitly. */
export const ACCOUNT_REGISTER_CALL='account.register';
/** The data-only push frame the host sends to a subscribed socket. */
export const RECEIVE_HINT_TYPE='aion.conversation.hint';
const BINDING_FIELDS=Object.freeze(['provider','account_key','conversation_id','ref','revision']);
const MAX_REPLAY_LIMIT=200;

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

/** Exactly the five canonical binding fields; nothing else survives. */
function canonicalBinding(binding){
  if(binding===null||typeof binding!=='object'||Array.isArray(binding))return null;
  const out={};
  for(const field of BINDING_FIELDS)out[field]=binding[field];
  return validateConversationBinding(out)?out:null;
}

/**
 * The CLI side of the read-only receive plane.
 *
 * Every answer is read-only and carries a FIXED code. A transport failure is
 * reported as a code, never as an exception and never with page text.
 */
export function createReceiveCall({link}={}){
  if(typeof link?.request!=='function')throw new TypeError('host link required');
  return async function receive(type,payload){
    const spec=RECEIVE_CALLS[type];
    if(!spec)return {ok:false,read_only:true,code:'UNKNOWN_ACTION'};
    const binding=canonicalBinding(payload?.binding);
    if(!binding)return {ok:false,read_only:true,code:'INVALID_BINDING'};
    const body={binding};
    if(payload?.cursor!==undefined){
      const cursor={epoch:payload.cursor?.epoch,sequence:payload.cursor?.sequence};
      if(!validateObservationCursor(cursor))return {ok:false,read_only:true,code:'INVALID_CURSOR'};
      body.cursor=cursor;
    }
    if(payload?.limit!==undefined){
      if(!Number.isSafeInteger(payload.limit)||payload.limit<1||payload.limit>MAX_REPLAY_LIMIT)
        return {ok:false,read_only:true,code:'INVALID_LIMIT'};
      body.limit=payload.limit;
    }
    try{
      const result=await link.request(type,body,{timeoutMs:spec.timeoutMs});
      if(!result||typeof result!=='object'||Array.isArray(result))
        return {ok:false,read_only:true,code:'BAD_HOST_REPLY'};
      return {...result,read_only:true};
    }catch(e){
      return {ok:false,read_only:true,code:e?.code??'HOST_ERROR'};
    }
  };
}

/**
 * The DATA-ONLY push stream. A hint says "this binding moved to this cursor";
 * it never carries message text and is never a command.
 */
export function createReceiveEventStream({link}={}){
  if(typeof link?.onEvent!=='function')throw new TypeError('host link required');
  return {
    onHint(handler){
      if(typeof handler!=='function')return ()=>{};
      return link.onEvent(event=>{
        if(!event||typeof event!=='object'||event.type!==RECEIVE_HINT_TYPE)return;
        handler(event);
      });
    },
    onDisconnect(handler){
      if(typeof link?.onDisconnect!=='function'||typeof handler!=='function')return ()=>{};
      return link.onDisconnect(handler);
    },
  };
}

/**
 * The EXPLICIT account registration, from the CLI.
 *
 * The URL is the owner's EXISTING bound conversation, resolved from the local
 * Bus metadata BEFORE the request. The answer carries a fixed status only:
 * the address itself never comes back to the CLI.
 */
export function createAccountRegisterCall({link}={}){
  if(typeof link?.request!=='function')throw new TypeError('host link required');
  return async function register({alias,url}={}){
    const role=typeof alias==='string'?alias.trim():'';
    const route=typeof url==='string'?url.trim():'';
    if(!role||!route)return {ok:false,read_only:true,code:'BAD_PAYLOAD'};
    try{
      const result=await link.request(ACCOUNT_REGISTER_CALL,{alias:role,url:route},{timeoutMs:60_000});
      if(!result||typeof result!=='object'||Array.isArray(result))
        return {ok:false,read_only:true,code:'BAD_HOST_REPLY'};
      return {...result,read_only:true};
    }catch(e){
      return {ok:false,read_only:true,code:e?.code??'HOST_ERROR'};
    }
  };
}
