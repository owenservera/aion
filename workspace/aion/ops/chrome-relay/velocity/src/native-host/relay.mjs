// Track B dev native host core (com.aion.relay.dev). Chrome launches it from
// the B dev extension; it never runs for Track A (different host name, pinned
// different extension ID, see guard.mjs).
//
//   CLI --(token IPC)--> host --(Chrome native messaging)--> worker
//                                   aion.b.call  { id, call_type, payload }
//                                   aion.b.reply { id, result }
//
//   worker --> host:  aion.b.event { event: { type:'aion.conversation.hint',
//                                               binding, page_epoch, cursor } }
//   host    --> CLI:  aion.b.event { event: <same hint> }   (per socket only)
//
// THE RECEIVE PLANE (P3)
//   The host holds NO ledger, grant or retry logic. It forwards only allowlisted
//   call types, one reply per id, and fails every pending call as UNCERTAIN when
//   Chrome closes the port. It opens the CLI endpoint only after the worker has
//   said hello, so a session file means a live worker answered at least once.
//
//   A receive call is READ ONLY and DATA ONLY:
//     - the client binding is a CLAIM; the host checks it against the OWNER's
//       binding record (the `readBinding` seam) and refuses when that seam is
//       absent. The host never trusts the client's binding alone.
//     - only validated P1 snapshots/events are forwarded to the CLI.
//     - a hint is pushed ONLY to the sockets subscribed to that EXACT binding.
//       There is no broadcast of conversation data.
//     - errors carry a FIXED code. No exception text and no page text ever
//       leaves this file.
import {encodeNativeFrame,createNativeFrameDecoder} from '../../../bridge/src/framing.js';
import {CHROME_MAX_HOST_MESSAGE_BYTES} from '../../../bridge/bin/aion-relay-host.mjs';
import {verifyDevNativeOrigin} from './guard.mjs';
import {startHostEndpoint,EVENT_FRAME_TYPE} from '../transport/local-ipc.mjs';
import {REMOTE_CALLS} from '../browser/remote-call.mjs';
import {
  validateConversationBinding,validateConversationSnapshot,validateConversationEvent,
  validateObservationCursor,
} from '../../../extension/src/lib/conversation-contract.js';
import {canonicalizeEmail} from '../../../extension/src/providers/chatgpt/account-registration.js';

export const PING='aion.b.ping';
/** The four authenticated receive call types. Nothing else is a receive call. */
export const CONVERSATION_CALLS=Object.freeze([
  'conversation.subscribe','conversation.read','conversation.replay','conversation.unsubscribe',
]);
/** Data-only hint. Carries a binding and a cursor - NEVER message text. */
export const RECEIVE_HINT_TYPE='aion.conversation.hint';
/** The push frame on BOTH the native plane and the local IPC plane. */
export const RECEIVE_EVENT_FRAME=EVENT_FRAME_TYPE;
/**
 * Codes the worker is allowed to answer with. Mirrors the worker's own fixed
 * code set (extension-dev/receive-router.js); the focused test asserts the two
 * lists agree. Anything else becomes WORKER_ERROR, so a rogue or older worker
 * cannot inject free-form codes into the CLI.
 */
export const WORKER_RECEIVE_CODES=Object.freeze([
  'INVALID_BINDING','BINDING_TARGET_MISSING','BINDING_AMBIGUOUS','BINDING_CONFLICT',
  'ACCOUNT_IDENTITY_UNPROVEN','ACCOUNT_DRIFT','ACCOUNT_MISMATCH','PORT_UNAVAILABLE','RECEIVE_TIMEOUT',
  'RECEIVE_PAYLOAD_TOO_LARGE','INVALID_SNAPSHOT','INVALID_PAGE','SUBSCRIPTION_REQUIRED',
  'SUBSCRIPTION_LIMIT','RECEIVE_NOT_AVAILABLE','RECEIVE_ERROR',
]);
/** Codes the host itself raises. */
export const HOST_RECEIVE_CODES=Object.freeze([
  'BAD_PAYLOAD','INVALID_BINDING','INVALID_CURSOR','INVALID_LIMIT','BINDING_AUTHORITY_UNAVAILABLE',
  'BINDING_NOT_AUTHORIZED','SUBSCRIPTION_REQUIRED','SUBSCRIPTION_LIMIT','INVALID_SNAPSHOT',
  'INVALID_PAGE','WORKER_ERROR',
]);
/** Codes of the EXPLICIT account registration path. */
export const REGISTRATION_CODES=Object.freeze({
  REGISTRATION_MISSING:'REGISTRATION_MISSING',
  REGISTRATION_LANE_MISMATCH:'REGISTRATION_LANE_MISMATCH',
  REGISTRATION_INVALID_EMAIL:'REGISTRATION_INVALID_EMAIL',
  REGISTRATION_URL_MISMATCH:'REGISTRATION_URL_MISMATCH',
  REGISTRATION_WRITE_FAILED:'REGISTRATION_WRITE_FAILED',
  REGISTRATION_FAILED:'REGISTRATION_FAILED',
});
/** The explicit registration call type. Never called implicitly. */
export const ACCOUNT_REGISTER_CALL='account.register';
const CONVERSATION_SET=new Set(CONVERSATION_CALLS);
const KNOWN_WORKER_CODES=new Set(WORKER_RECEIVE_CODES);
const KNOWN_REGISTRATION_CODES=new Set(Object.values(REGISTRATION_CODES));
const BINDING_FIELDS=Object.freeze(['provider','account_key','conversation_id','ref','revision']);
const PAGE_STATUSES=new Set(['ok','gap','reset']);
const RECEIVE_STATUSES=new Set(['observing','degraded','revoked','idle','not_started']);
const MAX_SUBSCRIPTIONS_PER_PEER=8;
const MAX_REPLAY_LIMIT=200;
const MAX_ID_CHARS=512;
/** A lane id is an opaque random token, never a role, a path or an address. */
const LANE_ID=/^[A-Za-z0-9_-]{16,128}$/;
const ALLOWED=new Set([...Object.keys(REMOTE_CALLS),PING]);
const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const err=code=>Object.assign(new Error(code),{code});
const MAX_INFLIGHT=32;

/** Canonical binding: exactly the five P1 fields, nothing else survives. */
function canonicalBinding(binding){
  if(!isPlain(binding))return null;
  const out={};
  for(const field of BINDING_FIELDS)out[field]=binding[field];
  return validateConversationBinding(out)?out:null;
}
const sameBinding=(a,b)=>isPlain(a)&&isPlain(b)&&BINDING_FIELDS.every(f=>a[f]===b[f]);
/** The comparable route of a URL: origin + path, no query, no fragment. */
function canonicalRoute(value){
  if(typeof value!=='string'||!value||value.length>2048)return '';
  let parsed;
  try{parsed=new URL(value);}catch{return '';}
  if(parsed.protocol!=='https:')return '';
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/,'')}`;
}
const bindingKey=b=>JSON.stringify(BINDING_FIELDS.map(f=>b[f]));
function canonicalCursor(cursor){
  if(!isPlain(cursor))return null;
  const out={epoch:cursor.epoch,sequence:cursor.sequence};
  return validateObservationCursor(out)?out:null;
}
/**
 * The OWNER's binding record decides. Accepts either the canonical binding
 * itself or {authorized:true,binding}. Anything else is "not authorized".
 */
function authorityMatches(authority,binding){
  if(!isPlain(authority))return false;
  const candidate=authority.binding!==undefined?authority.binding:authority;
  const canonical=canonicalBinding(candidate);
  return canonical?sameBinding(canonical,binding):false;
}
/** The worker's answer, reduced to validated canonical data and fixed codes. */
function normalizeReceiveResult(binding,raw){
  if(!isPlain(raw))return {ok:false,read_only:true,code:'WORKER_ERROR'};
  if(raw.ok!==true){
    const code=typeof raw.code==='string'&&KNOWN_WORKER_CODES.has(raw.code)?raw.code:'WORKER_ERROR';
    return {ok:false,read_only:true,code};
  }
  const out={ok:true,read_only:true};
  if(raw.snapshot!==undefined&&raw.snapshot!==null){
    if(!validateConversationSnapshot(raw.snapshot))return {ok:false,read_only:true,code:'INVALID_SNAPSHOT'};
    if(!sameBinding(raw.snapshot.binding,binding))return {ok:false,read_only:true,code:'INVALID_SNAPSHOT'};
    out.snapshot=raw.snapshot;
    out.cursor=raw.snapshot.cursor;
    out.page_epoch=raw.snapshot.page_epoch;
  }
  if(raw.page!==undefined&&raw.page!==null){
    const page=normalizePage(binding,raw.page);
    if(!page)return {ok:false,read_only:true,code:'INVALID_PAGE'};
    out.page=page;
  }
  if(raw.cursor!==undefined&&raw.cursor!==null){
    const cursor=canonicalCursor(raw.cursor);
    if(!cursor)return {ok:false,read_only:true,code:'INVALID_CURSOR'};
    out.cursor=cursor;
  }
  if(typeof raw.page_epoch==='string'&&raw.page_epoch&&raw.page_epoch.length<=MAX_ID_CHARS)
    out.page_epoch=raw.page_epoch;
  if(typeof raw.status==='string'&&RECEIVE_STATUSES.has(raw.status))out.status=raw.status;
  return out;
}
/** A journal page: canonical P1 events only, no free-form strings. */
function normalizePage(binding,page){
  if(!isPlain(page)||!Array.isArray(page.items))return null;
  const items=[];
  for(const item of page.items){
    if(!isPlain(item)||!validateConversationEvent(item.event))return null;
    if(!sameBinding(item.event.binding,binding))return null;
    if(!Number.isSafeInteger(item.sequence)||item.sequence<0)return null;
    const revision=Number.isSafeInteger(item.revision)&&item.revision>0
      ?item.revision:item.event.message.revision;
    items.push({sequence:item.sequence,revision,event:item.event});
  }
  let next_cursor=null;
  const next=page.nextCursor??page.next_cursor??null;
  if(next!==null&&next!==undefined){
    const cursor=canonicalCursor(next);
    if(!cursor)return null;
    next_cursor=cursor;
  }
  return {
    status:PAGE_STATUSES.has(page.status)?page.status:'reset',
    items,
    next_cursor,
    has_more:page.hasMore===true||page.has_more===true,
    complete_history:page.complete_history===true,
  };
}

export async function runDevHost({argv,stdin,stdout,stateDir,expectedExtensionId,
  startEndpoint=startHostEndpoint,log=()=>{},forwardTimeoutMs=130_000,
  readBinding=null,readRoleBinding=null,readRegistration=null,writeRegistration=null}){
  if(!Number.isSafeInteger(forwardTimeoutMs)||forwardTimeoutMs<1||forwardTimeoutMs>300_000)
    throw new RangeError('invalid forward timeout');
  const origin=verifyDevNativeOrigin(argv,{expectedExtensionId});
  if(!origin.ok){log({event:'origin_refused',reason:origin.reason});return {ok:false,code:origin.reason};}
  const pending=new Map();let seq=0,endpoint=null,closed=false,workerHello=null;
  // The lane of the CONNECTED worker. It is presented on the authenticated
  // native link (the origin guard pins the extension id), never by a caller.
  let workerLane=null;
  // peer -> Set<bindingKey>. A subscriber only ever receives ITS OWN binding.
  const subscriptions=new Map();
  const boundBindings=new Map();
  const send=msg=>stdout.write(encodeNativeFrame(msg,{maxFrameBytes:CHROME_MAX_HOST_MESSAGE_BYTES}));
  const failAll=code=>{
    for(const p of pending.values()){clearTimeout(p.timer);p.reject(err(code));}
    pending.clear();
  };

  /** The owner's LOCAL registration, re-read on every request. */
  async function loadRegistration(){
    if(typeof readRegistration!=='function')return {ok:false,code:REGISTRATION_CODES.REGISTRATION_MISSING};
    let result;
    try{result=await readRegistration();}
    catch{return {ok:false,code:REGISTRATION_CODES.REGISTRATION_MISSING};}
    if(!isPlain(result)||result.ok!==true||!isPlain(result.registration))
      return {ok:false,code:REGISTRATION_CODES.REGISTRATION_MISSING};
    const registration=result.registration;
    if(!LANE_ID.test(String(registration.lane_id??'')))
      return {ok:false,code:REGISTRATION_CODES.REGISTRATION_LANE_MISMATCH};
    if(!canonicalizeEmail(registration.email))
      return {ok:false,code:REGISTRATION_CODES.REGISTRATION_INVALID_EMAIL};
    return {ok:true,registration};
  }

  async function forward({call_type,payload}){
    if(closed)throw err('HOST_CLOSING');
    if(!ALLOWED.has(call_type)&&!CONVERSATION_SET.has(call_type)&&call_type!==ACCOUNT_REGISTER_CALL)
      throw err('CALL_NOT_ALLOWED');
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

  /** The receive plane. Every answer is read-only and carries a fixed code. */
  async function handleConversation(call_type,payload,peer){
    if(!isPlain(payload))return {ok:false,read_only:true,code:'BAD_PAYLOAD'};
    const binding=canonicalBinding(payload.binding);
    if(!binding)return {ok:false,read_only:true,code:'INVALID_BINDING'};
    let cursor;
    if(payload.cursor!==undefined){
      cursor=canonicalCursor(payload.cursor);
      if(!cursor)return {ok:false,read_only:true,code:'INVALID_CURSOR'};
    }
    let limit;
    if(payload.limit!==undefined){
      if(!Number.isSafeInteger(payload.limit)||payload.limit<1||payload.limit>MAX_REPLAY_LIMIT)
        return {ok:false,read_only:true,code:'INVALID_LIMIT'};
      limit=payload.limit;
    }
    const key=bindingKey(binding);
    const subs=subscriptions.get(peer)??new Set();

    if(call_type==='conversation.unsubscribe'){
      // Revocation is ALWAYS allowed: it can only ever REMOVE access. The
      // local subscription dies even when the worker cannot be reached.
      subs.delete(key);
      if(subs.size===0)subscriptions.delete(peer);else subscriptions.set(peer,subs);
      // The worker's observation is per BINDING: it only stops when no peer
      // holds that binding any more.
      if(holdersOf(key)===0){
        boundBindings.delete(key);
        try{await forward({call_type,payload:{binding}});}catch{}
      }
      return {ok:true,read_only:true,unsubscribed:true};
    }

    if(call_type!=='conversation.subscribe'&&!subs.has(key))
      return {ok:false,read_only:true,code:'SUBSCRIPTION_REQUIRED'};

    // THE REGISTRATION. The read scope is the owner's REGISTERED LANE, not a
    // claim: the local registration must exist, it must belong to the lane
    // that is connected on the authenticated native link, and the claimed
    // account key must be the registered one.
    const registration=await loadRegistration();
    if(!registration.ok)return {ok:false,read_only:true,code:registration.code};
    if(!workerLane||workerLane.lane_id!==registration.registration.lane_id)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_LANE_MISMATCH};
    if(binding.account_key!==registration.registration.email)
      return {ok:false,read_only:true,code:'BINDING_NOT_AUTHORIZED'};

    // AUTHORITY. The client's binding is a claim; the owner decides. With no
    // seam the host fails closed and serves no receive data at all.
    if(typeof readBinding!=='function')
      return {ok:false,read_only:true,code:'BINDING_AUTHORITY_UNAVAILABLE'};
    let authority=null;
    try{authority=await readBinding(binding);}
    catch{return {ok:false,read_only:true,code:'BINDING_AUTHORITY_UNAVAILABLE'};}
    if(!authorityMatches(authority,binding))
      return {ok:false,read_only:true,code:'BINDING_NOT_AUTHORIZED'};

    if(call_type==='conversation.subscribe'&&!subs.has(key)&&subs.size>=MAX_SUBSCRIPTIONS_PER_PEER)
      return {ok:false,read_only:true,code:'SUBSCRIPTION_LIMIT'};

    const body={binding};
    if(cursor)body.cursor=cursor;
    if(limit!==undefined)body.limit=limit;
    let raw;
    try{raw=await forward({call_type,payload:body});}
    catch(e){return {ok:false,read_only:true,code:e?.code??'WORKER_ERROR'};}
    const result=normalizeReceiveResult(binding,raw);
    if(result.ok===true&&call_type==='conversation.subscribe'){
      subs.add(key);subscriptions.set(peer,subs);boundBindings.set(key,binding);
    }
    return result;
  }

  async function handleRequest(msg,peer){
    const call_type=msg?.call_type;
    attachPeerCleanup(peer);
    if(call_type===ACCOUNT_REGISTER_CALL)return handleAccountRegister(msg?.payload);
    if(CONVERSATION_SET.has(call_type))return handleConversation(call_type,msg?.payload,peer);
    return forward({call_type,payload:msg?.payload});
  }

  /**
   * The EXPLICIT account registration.
   *
   * It is the ONLY path that creates a registration, and it is reached only
   * by an explicit `account.register` request. Nothing in the watch path,
   * the reconnect path or the page calls it implicitly.
   *
   * The URL is the owner's EXISTING bound conversation: the role is resolved
   * through the read-only Bus metadata and the URL must be exactly that
   * bound route. The email is read by the worker, in the page, once.
   */
  async function handleAccountRegister(payload){
    if(!isPlain(payload))return {ok:false,read_only:true,code:'BAD_PAYLOAD'};
    const alias=typeof payload.alias==='string'?payload.alias.trim():'';
    const url=typeof payload.url==='string'?payload.url.trim():'';
    if(!alias||!url)return {ok:false,read_only:true,code:'BAD_PAYLOAD'};
    if(typeof readRoleBinding!=='function')
      return {ok:false,read_only:true,code:'BINDING_AUTHORITY_UNAVAILABLE'};
    let role;
    try{role=await readRoleBinding(alias);}
    catch{return {ok:false,read_only:true,code:'BINDING_AUTHORITY_UNAVAILABLE'};}
    if(!isPlain(role)||role.ok!==true)
      return {ok:false,read_only:true,code:role?.code??'BINDING_NOT_AUTHORIZED'};
    // The requested route must be EXACTLY the bound route of that role.
    if(canonicalRoute(role.ref)!==canonicalRoute(url))
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_URL_MISMATCH};
    if(!workerLane)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_LANE_MISMATCH};

    let raw;
    try{raw=await forward({call_type:ACCOUNT_REGISTER_CALL,payload:{url:role.ref}});}
    catch(e){return {ok:false,read_only:true,code:e?.code??REGISTRATION_CODES.REGISTRATION_FAILED};}
    if(!isPlain(raw)||raw.ok!==true){
      const code=typeof raw?.code==='string'&&KNOWN_REGISTRATION_CODES.has(raw.code)
        ?raw.code:REGISTRATION_CODES.REGISTRATION_FAILED;
      return {ok:false,read_only:true,code};
    }
    // The lane that answers must be the lane that is connected.
    if(String(raw.lane_id??'')!==workerLane.lane_id)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_LANE_MISMATCH};
    const email=canonicalizeEmail(raw.email);
    if(!email)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_INVALID_EMAIL};
    if(typeof writeRegistration!=='function')
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};
    let written;
    try{written=await writeRegistration({extension_id:origin.extension_id,lane_id:raw.lane_id,email});}
    catch{return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};}
    if(!isPlain(written)||written.ok!==true)
      return {ok:false,read_only:true,code:written?.code??REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};
    // The answer never carries the email: the CLI learns THAT it is
    // registered, not WHICH account.
    return {
      ok:true,
      read_only:true,
      registered:true,
      provider:typeof role.provider==='string'?role.provider:null,
      conversation_id:typeof role.conversation_id==='string'?role.conversation_id:null,
      role:isPlain(role.role)&&typeof role.role.code==='string'?role.role.code:null,
    };
  }

  /**
   * A departing subscriber takes its subscriptions with it: the worker is told
   * to stop observing so the page text it holds is dropped, not parked.
   */
  const peersWithCleanup=new WeakSet();
  /** How many peers still hold this exact binding. */
  function holdersOf(key){
    let count=0;
    for(const subs of subscriptions.values())if(subs.has(key))count+=1;
    return count;
  }
  function attachPeerCleanup(peer){
    if(!peer||typeof peer.onClose!=='function'||peersWithCleanup.has(peer))return;
    peersWithCleanup.add(peer);
    peer.onClose(()=>{
      const subs=subscriptions.get(peer);
      subscriptions.delete(peer);
      if(!subs||subs.size===0)return;
      for(const key of subs){
        if(holdersOf(key)!==0)continue;
        const binding=boundBindings.get(key);
        if(!binding)continue;
        boundBindings.delete(key);
        // Tell the worker to stop observing so the page text it holds is
        // dropped, not parked.
        void Promise.resolve()
          .then(()=>forward({call_type:'conversation.unsubscribe',payload:{binding}}))
          .catch(()=>{});
      }
    });
  }

  /** One hint, one exact binding, only the sockets that own that binding. */
  function routeReceiveEvent(event){
    if(!isPlain(event)||event.type!==RECEIVE_HINT_TYPE)return;
    const binding=canonicalBinding(event.binding);
    if(!binding)return;
    if(typeof event.page_epoch!=='string'||!event.page_epoch||event.page_epoch.length>MAX_ID_CHARS)return;
    const cursor=canonicalCursor(event.cursor);
    if(!cursor)return;
    const key=bindingKey(binding);
    const frame={type:RECEIVE_EVENT_FRAME,
      event:{type:RECEIVE_HINT_TYPE,binding,page_epoch:event.page_epoch,cursor}};
    for(const [peer,subs] of [...subscriptions]){
      if(!subs.has(key))continue;
      // A refused publish means the socket is gone or overloaded: drop the
      // subscription instead of pretending the subscriber is still live.
      if(!peer.publish(frame))subs.delete(key);
    }
  }

  let done;const finished=new Promise(r=>{done=r;});
  async function shutdown(code){
    if(closed)return;closed=true;
    failAll('HOST_LINK_LOST');
    subscriptions.clear();boundBindings.clear();
    try{await endpoint?.close();}catch{}
    log({event:'stopped',code});done({ok:true,code});
  }

  const decoder=createNativeFrameDecoder({maxFrameBytes:CHROME_MAX_HOST_MESSAGE_BYTES,
    onError:()=>{void shutdown('NATIVE_FRAMING_ERROR');}});
  decoder.onMessage(msg=>{
    if(!isPlain(msg))return;
    if(msg.type===RECEIVE_EVENT_FRAME){routeReceiveEvent(msg.event);return;}
    if(msg.type==='aion.b.hello'){
      // The lane of the worker that is connected. It is presented on the
      // authenticated native link, so a caller can never name a lane.
      workerLane=LANE_ID.test(String(msg.lane_id??''))?{lane_id:String(msg.lane_id)}:null;
      if(workerHello){send({type:'aion.b.ready',session_id:endpoint?.session_id??null});return;}
      workerHello={at:new Date().toISOString()};
      startEndpoint({stateDir,onRequest:handleRequest,meta:{extension_id:origin.extension_id,channel:'dev'}})
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
