// AION Track B dev build ONLY. The READ-ONLY receive router of the dev
// service worker.
//
// WHAT THIS FILE IS
//   It connects to the P2 page-side receive port (`aion-conversation-receive`)
//   of ONE exact bound conversation and moves DATA between that page and the
//   dev host. It never composes, submits, clicks, types, stops or sends
//   anything, and it never calls the worker's command runner.
//
// THE ACCOUNT
//   The account is a LOCAL REGISTRATION: the owner registered it once, in
//   this profile's lane, and the router reuses that registration. There is
//   NO account polling, NO repeated identity challenge and NO per-sample
//   account lookup. The registered address is an identifier, not a proof that
//   a particular person is signed in right now: a manual account switch
//   inside a lane is deliberately NOT detected.
//
// WHAT IT REFUSES TO DO
//   - It NEVER reaches `runChatGPTCommand`: receive text is not a command and
//     no page-supplied value is ever interpreted as an action name.
//   - It NEVER lists tabs to a caller. `chrome.tabs.query` is used internally
//     ONLY to find the ONE tab that matches the binding exactly; no tab id,
//     url or list ever leaves this file.
//   - It NEVER asserts an account it did not read from its own storage, and
//     it NEVER registers implicitly: only the explicit `account.register`
//     request reads the page's registration email, and only once.
//   - It NEVER forwards unvalidated data. Every snapshot, page and hint is
//     checked with the P1 canonical validators before it moves.
//
// SELF-CONTAINED ON PURPOSE
//   This file is copied into the dev extension (extension/src/dev/), where
//   the relative path to the extension's own lib/ differs from the one in
//   this repository. The P1 validators and the address canonicalisation are
//   therefore INJECTED by the entry point (dev-worker.js) instead of
//   imported here, and the router fails closed when they are missing.
export const RECEIVE_PORT_NAME='aion-conversation-receive';
export const RECEIVE_HINT_TYPE='aion.conversation.hint';
/** The explicit registration action of the page port. */
export const REGISTER_ACTION='register-account';

/** Every machine-readable outcome of this file. Fixed strings, never prose. */
export const ROUTER_CODES=Object.freeze({
  INVALID_BINDING:'INVALID_BINDING',
  BINDING_TARGET_MISSING:'BINDING_TARGET_MISSING',
  BINDING_AMBIGUOUS:'BINDING_AMBIGUOUS',
  BINDING_CONFLICT:'BINDING_CONFLICT',
  ACCOUNT_IDENTITY_UNPROVEN:'ACCOUNT_IDENTITY_UNPROVEN',
  ACCOUNT_MISMATCH:'ACCOUNT_MISMATCH',
  ACCOUNT_DRIFT:'ACCOUNT_DRIFT',
  PORT_UNAVAILABLE:'PORT_UNAVAILABLE',
  RECEIVE_TIMEOUT:'RECEIVE_TIMEOUT',
  RECEIVE_PAYLOAD_TOO_LARGE:'RECEIVE_PAYLOAD_TOO_LARGE',
  INVALID_SNAPSHOT:'INVALID_SNAPSHOT',
  INVALID_PAGE:'INVALID_PAGE',
  SUBSCRIPTION_REQUIRED:'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_LIMIT:'SUBSCRIPTION_LIMIT',
  RECEIVE_NOT_AVAILABLE:'RECEIVE_NOT_AVAILABLE',
  RECEIVE_ERROR:'RECEIVE_ERROR',
});

/** The codes of the EXPLICIT registration path. */
export const REGISTRATION_CODES=Object.freeze({
  REGISTRATION_MISSING:'REGISTRATION_MISSING',
  REGISTRATION_LANE_MISMATCH:'REGISTRATION_LANE_MISMATCH',
  REGISTRATION_INVALID_EMAIL:'REGISTRATION_INVALID_EMAIL',
  REGISTRATION_URL_MISMATCH:'REGISTRATION_URL_MISMATCH',
  REGISTRATION_URL_INVALID:'REGISTRATION_URL_INVALID',
  REGISTRATION_TAB_NOT_FOUND:'REGISTRATION_TAB_NOT_FOUND',
  REGISTRATION_TAB_AMBIGUOUS:'REGISTRATION_TAB_AMBIGUOUS',
  REGISTRATION_INCOGNITO_REFUSED:'REGISTRATION_INCOGNITO_REFUSED',
  REGISTRATION_NOT_SIGNED_IN:'REGISTRATION_NOT_SIGNED_IN',
  REGISTRATION_NO_EMAIL:'REGISTRATION_NO_EMAIL',
  REGISTRATION_FAILED:'REGISTRATION_FAILED',
  REGISTRATION_WRITE_FAILED:'REGISTRATION_WRITE_FAILED',
});

/** The page-side (P2) codes, mapped onto this file's fixed codes. */
const PAGE_CODE_MAP=Object.freeze({
  not_started:ROUTER_CODES.SUBSCRIPTION_REQUIRED,
  invalid_binding:ROUTER_CODES.INVALID_BINDING,
  account_identity_unproven:ROUTER_CODES.ACCOUNT_IDENTITY_UNPROVEN,
  account_mismatch:ROUTER_CODES.ACCOUNT_IDENTITY_UNPROVEN,
  account_drift:ROUTER_CODES.ACCOUNT_DRIFT,
  conversation_mismatch:ROUTER_CODES.BINDING_TARGET_MISSING,
  url_drift:ROUTER_CODES.BINDING_TARGET_MISSING,
  logged_out:ROUTER_CODES.ACCOUNT_IDENTITY_UNPROVEN,
  remounted:ROUTER_CODES.RECEIVE_ERROR,
  binding_conflict:ROUTER_CODES.BINDING_CONFLICT,
  unbound:ROUTER_CODES.SUBSCRIPTION_REQUIRED,
  revoked:ROUTER_CODES.SUBSCRIPTION_REQUIRED,
  observer_unavailable:ROUTER_CODES.RECEIVE_ERROR,
  adapter_error:ROUTER_CODES.RECEIVE_ERROR,
});

/** The page's registration codes, mapped onto the registration codes. */
const REGISTRATION_PAGE_CODE_MAP=Object.freeze({
  http_unauthorized:REGISTRATION_CODES.REGISTRATION_NOT_SIGNED_IN,
  email_missing:REGISTRATION_CODES.REGISTRATION_NO_EMAIL,
  email_invalid:REGISTRATION_CODES.REGISTRATION_NO_EMAIL,
  registration_incotognito_refused:REGISTRATION_CODES.REGISTRATION_INCOGNITO_REFUSED,
  registration_incongnito_refused:REGISTRATION_CODES.REGISTRATION_INCOGNITO_REFUSED,
  registration_url_mismatch:REGISTRATION_CODES.REGISTRATION_URL_MISMATCH,
});

const BINDING_FIELDS=Object.freeze(['provider','account_key','conversation_id','ref','revision']);
const MAX_SUBSCRIPTIONS=8;
const MAX_REPLAY_LIMIT=200;
const MAX_ID_CHARS=512;
const DEFAULT_TIMEOUT_MS=15000;
const MAX_FRAME_BYTES=1024*1024;
/** The only origin a bound conversation may live on. */
const ALLOWED_ORIGIN='https://chatgpt.com';
/** The page-side status enum. Anything else is dropped, never forwarded. */
const RECEIVE_STATUSES=new Set(['observing','degraded','revoked','idle','not_started']);
const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=code=>({ok:false,read_only:true,code});

/** Canonical URL: origin + path, no query and no fragment. */
export function canonicalUrl(value){
  if(typeof value!=='string'||!value||value.length>2048)return '';
  try{
    const parsed=new URL(value);
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/,'')}`;
  }catch{return '';}
}
/** The conversation id of a canonical conversation route, or ''. */
export function conversationIdFromUrl(value){
  const match=/\/c\/([^/]+)$/.exec(canonicalUrl(value));
  return match?match[1]:'';
}
/** The origin of a URL, or ''. */
function originOf(value){
  try{return new URL(value).origin;}catch{return '';}
}

/**
 * The EXACT match between a binding and a tab.
 *
 * A tab matches only when ALL of these hold:
 *   - it is an HTTPS chatgpt.com page;
 *   - its conversation id is the bound conversation id;
 *   - the bound `ref`, when it is a URL, is that very route.
 *
 * There is no permissive host and no "any chatgpt page" fallback.
 */
export function defaultTabMatch(binding,tab){
  const url=typeof tab?.url==='string'?tab.url:'';
  if(!url)return false;
  if(originOf(url)!==ALLOWED_ORIGIN)return false;
  const id=conversationIdFromUrl(url);
  if(!id||id!==binding?.conversation_id)return false;
  const refUrl=canonicalUrl(binding?.ref);
  if(refUrl&&refUrl!==canonicalUrl(url))return false;
  return true;
}

export function createReceiveRouter({
  chrome,
  publishEvent,
  validators,
  canonicalizeEmail=null,
  getAccountKey=null,
  registrationStore=null,
  matchTab=defaultTabMatch,
  queryTabs=null,
  connectTab=null,
  isIncognito=null,
  timeoutMs=DEFAULT_TIMEOUT_MS,
}={}){
  const validate={
    binding:validators?.validateConversationBinding,
    snapshot:validators?.validateConversationSnapshot,
    event:validators?.validateConversationEvent,
    cursor:validators?.validateObservationCursor,
  };
  const validatorsReady=Boolean(validate.binding&&validate.snapshot&&validate.event&&validate.cursor);
  const tabs=queryTabs??(chrome?.tabs?.query?()=>chrome.tabs.query({}):null);
  const connect=connectTab??(chrome?.tabs?.connect
    ?(tabId)=>chrome.tabs.connect(tabId,{name:RECEIVE_PORT_NAME}):null);
  /** bindingKey -> {port,binding,pending:Map} */
  const subscriptions=new Map();
  let seq=0;

  const bindingKey=b=>JSON.stringify(BINDING_FIELDS.map(f=>b[f]));

  /** Exactly the five canonical fields: nothing else survives. */
  function canonicalBinding(binding){
    if(!isPlain(binding))return null;
    const out={};
    for(const field of BINDING_FIELDS)out[field]=binding[field];
    return validate.binding(out)?out:null;
  }
  function canonicalCursor(cursor){
    if(!isPlain(cursor))return null;
    const out={epoch:cursor.epoch,sequence:cursor.sequence};
    return validate.cursor(out)?out:null;
  }

  /**
   * The REGISTERED account of this lane.
   *
   * It is read from the worker's own registration storage, ONCE per
   * subscription. It is not a promise that a particular account is signed in
   * right now: a manual account switch inside the lane is not detected.
   */
  function readRegisteredAccountKey(){
    if(typeof getAccountKey!=='function')return null;
    try{
      const value=getAccountKey();
      return typeof value==='string'&&value.length>0?value:null;
    }catch{return null;}
  }

  /** The ONE tab that matches the binding exactly. */
  async function resolveTab(binding){
    if(typeof tabs!=='function')return {code:ROUTER_CODES.RECEIVE_NOT_AVAILABLE};
    let list;
    try{list=await tabs();}
    catch{return {code:ROUTER_CODES.BINDING_TARGET_MISSING};}
    if(!Array.isArray(list))return {code:ROUTER_CODES.BINDING_TARGET_MISSING};
    const matches=list.filter(tab=>{
      try{return matchTab(binding,tab)===true;}catch{return false;}
    });
    if(matches.length===0)return {code:ROUTER_CODES.BINDING_TARGET_MISSING};
    if(matches.length>1)return {code:ROUTER_CODES.BINDING_AMBIGUOUS};
    const tab=matches[0];
    const tabId=typeof tab?.id==='number'?tab.id:null;
    if(tabId===null)return {code:ROUTER_CODES.BINDING_TARGET_MISSING};
    return {tabId};
  }

  function sendToPort(entry,message){
    return new Promise(resolve=>{
      const id=`r${++seq}`;
      const timer=setTimeout(()=>{
        entry.pending.delete(id);
        resolve({ok:false,code:ROUTER_CODES.RECEIVE_TIMEOUT});
      },timeoutMs);
      entry.pending.set(id,{resolve,timer});
      try{entry.port.postMessage({...message,id});}
      catch{
        clearTimeout(timer);entry.pending.delete(id);
        resolve({ok:false,code:ROUTER_CODES.PORT_UNAVAILABLE});
      }
    });
  }

  /** A port message is either the answer to one request or a DATA-ONLY hint. */
  function onPortMessage(entry,message){
    if(!isPlain(message))return;
    const id=message.id;
    if(id!==undefined&&entry.pending.has(id)){
      const pending=entry.pending.get(id);
      entry.pending.delete(id);
      clearTimeout(pending.timer);
      pending.resolve(message);
      return;
    }
    if(message.type!==RECEIVE_HINT_TYPE)return;
    const binding=canonicalBinding(message.binding);
    if(!binding||bindingKey(binding)!==entry.key)return;
    if(typeof message.page_epoch!=='string'||!message.page_epoch||message.page_epoch.length>MAX_ID_CHARS)return;
    const cursor=canonicalCursor(message.cursor);
    if(!cursor)return;
    if(typeof publishEvent!=='function')return;
    try{
      publishEvent({type:RECEIVE_HINT_TYPE,binding,page_epoch:message.page_epoch,cursor});
    }catch{/* a broken sink never breaks the observation */}
  }

  function openPort(tabId,key,binding=null){
    if(typeof connect!=='function')return null;
    let port;
    try{port=connect(tabId);}
    catch{return null;}
    if(!port||typeof port.postMessage!=='function')return null;
    const entry={key,binding,port,pending:new Map()};
    try{
      port.onMessage?.addListener?.(message=>onPortMessage(entry,message));
      port.onDisconnect?.addListener?.(()=>{
        for(const pending of entry.pending.values()){clearTimeout(pending.timer);pending.resolve({ok:false,code:ROUTER_CODES.PORT_UNAVAILABLE});}
        entry.pending.clear();
        subscriptions.delete(entry.key);
      });
    }catch{/* a port without listeners still works for one request */}
    subscriptions.set(entry.key,entry);
    return entry;
  }

  function closeEntry(entry){
    if(!entry)return;
    subscriptions.delete(entry.key);
    for(const pending of entry.pending.values()){clearTimeout(pending.timer);pending.resolve({ok:false,code:ROUTER_CODES.PORT_UNAVAILABLE});}
    entry.pending.clear();
    try{entry.port.disconnect?.();}catch{/* already gone */}
  }

  /** The page's answer, reduced to validated canonical data and fixed codes. */
  function mapPageReply(binding,reply){
    if(!isPlain(reply))return {ok:false,read_only:true,code:ROUTER_CODES.RECEIVE_ERROR};
    if(reply.ok!==true){
      const code=typeof reply.code==='string'
        ?(PAGE_CODE_MAP[reply.code]??ROUTER_CODES.RECEIVE_ERROR)
        :ROUTER_CODES.RECEIVE_ERROR;
      return {ok:false,read_only:true,code};
    }
    const out={ok:true,read_only:true};
    if(reply.snapshot!==undefined&&reply.snapshot!==null){
      if(!validate.snapshot(reply.snapshot))return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_SNAPSHOT};
      if(BINDING_FIELDS.some(f=>reply.snapshot.binding[f]!==binding[f]))
        return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_SNAPSHOT};
      out.snapshot=reply.snapshot;
      out.cursor=reply.snapshot.cursor;
      out.page_epoch=reply.snapshot.page_epoch;
    }
    if(reply.page!==undefined&&reply.page!==null){
      if(!isPlain(reply.page)||!Array.isArray(reply.page.items))
        return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_PAGE};
      const items=[];
      for(const item of reply.page.items){
        if(!isPlain(item)||!validate.event(item.event))
          return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_PAGE};
        if(BINDING_FIELDS.some(f=>item.event.binding[f]!==binding[f]))
          return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_PAGE};
        items.push({sequence:item.sequence,revision:item.revision,event:item.event});
      }
      let next_cursor=null;
      const next=reply.page.nextCursor??reply.page.next_cursor??null;
      if(next!==null&&next!==undefined){
        const cursor=canonicalCursor(next);
        if(!cursor)return {ok:false,read_only:true,code:ROUTER_CODES.INVALID_PAGE};
        next_cursor=cursor;
      }
      out.page={status:reply.page.status??'reset',items,next_cursor,
        has_more:reply.page.hasMore===true||reply.page.has_more===true,
        complete_history:reply.page.complete_history===true};
    }
    if(reply.cursor!==undefined&&reply.cursor!==null){
      const cursor=canonicalCursor(reply.cursor);
      if(!cursor)return {ok:false,read_only:true,code:ROUTER_CODES.RECEIVE_ERROR};
      out.cursor=cursor;
    }
    if(typeof reply.page_epoch==='string'&&reply.page_epoch&&reply.page_epoch.length<=MAX_ID_CHARS)
      out.page_epoch=reply.page_epoch;
    // The page's status is a fixed enum, never free-form prose.
    if(typeof reply.status==='string'&&RECEIVE_STATUSES.has(reply.status))out.status=reply.status;
    // A reply that would not fit the transport is refused, never truncated.
    try{
      if(JSON.stringify(out).length>MAX_FRAME_BYTES)
        return {ok:false,read_only:true,code:ROUTER_CODES.RECEIVE_PAYLOAD_TOO_LARGE};
    }catch{return {ok:false,read_only:true,code:ROUTER_CODES.RECEIVE_ERROR};}
    return out;
  }

  async function subscribe(binding){
    const key=bindingKey(binding);
    const existing=subscriptions.get(key);
    if(existing)return {ok:true,read_only:true,status:'observing',already_active:true};
    if(subscriptions.size>=MAX_SUBSCRIPTIONS)
      return {ok:false,read_only:true,code:ROUTER_CODES.SUBSCRIPTION_LIMIT};
    // The REGISTERED account of this lane. No registration, no observation.
    const accountKey=readRegisteredAccountKey();
    if(!accountKey)
      return {ok:false,read_only:true,code:ROUTER_CODES.ACCOUNT_IDENTITY_UNPROVEN};
    if(binding.account_key!==accountKey)
      return {ok:false,read_only:true,code:ROUTER_CODES.ACCOUNT_MISMATCH};
    const resolved=await resolveTab(binding);
    if(resolved.code)return {ok:false,read_only:true,code:resolved.code};
    const entry=openPort(resolved.tabId,key,binding);
    if(!entry)return {ok:false,read_only:true,code:ROUTER_CODES.PORT_UNAVAILABLE};
    // The page is told WHICH registered account this observation belongs to.
    // It is registration CONTEXT, not a promise to verify the current login.
    const reply=await sendToPort(entry,{action:'start',binding,registered_account_key:accountKey});
    const result=mapPageReply(binding,reply);
    if(result.ok!==true){closeEntry(entry);return result;}
    return {...result,status:result.status??'observing'};
  }

  /**
   * The EXPLICIT registration.
   *
   * It resolves the ONE tab that shows the owner's bound conversation, asks
   * the page to read the registration email ONCE and stores the result in
   * this lane's own registration. It is never called implicitly.
   */
  async function registerAccount({url}){
    if(typeof canonicalizeEmail!=='function')
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_FAILED};
    if(typeof registrationStore!=='function')
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_FAILED};
    if(typeof url!=='string'||!url)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_URL_INVALID};
    if(originOf(url)!==ALLOWED_ORIGIN)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_URL_INVALID};
    if(!conversationIdFromUrl(url))
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_URL_INVALID};
    const incognito=typeof isIncognito==='function'?isIncognito():chrome?.extension?.inIncognitoContext===true;
    if(incognito)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_INCOGNITO_REFUSED};
    if(typeof tabs!=='function')
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_NOT_FOUND};
    let list;
    try{list=await tabs();}
    catch{return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_NOT_FOUND};}
    if(!Array.isArray(list))return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_NOT_FOUND};
    const wanted=canonicalUrl(url);
    const matches=list.filter(tab=>{
      try{return canonicalUrl(tab?.url??'')===wanted;}catch{return false;}
    });
    if(matches.length===0)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_NOT_FOUND};
    if(matches.length>1)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_AMBIGUOUS};
    const tabId=typeof matches[0]?.id==='number'?matches[0].id:null;
    if(tabId===null)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_TAB_NOT_FOUND};

    const entry=openPort(tabId,`registration:${tabId}`,null);
    if(!entry)return {ok:false,read_only:true,code:ROUTER_CODES.PORT_UNAVAILABLE};
    let reply;
    try{reply=await sendToPort(entry,{action:REGISTER_ACTION,url});}
    finally{closeEntry(entry);}
    if(!isPlain(reply))
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_FAILED};
    if(reply.ok!==true){
      const mapped=typeof reply.code==='string'?REGISTRATION_PAGE_CODE_MAP[reply.code]:null;
      return {ok:false,read_only:true,code:mapped??REGISTRATION_CODES.REGISTRATION_FAILED};
    }
    const email=canonicalizeEmail(reply.email);
    if(!email)return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_INVALID_EMAIL};
    const stored=await registrationStore(email);
    if(!isPlain(stored)||!stored.lane_id||stored.email!==email)
      return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_WRITE_FAILED};
    return {ok:true,read_only:true,registered:true,email,lane_id:stored.lane_id};
  }

  async function handleCall(call_type,payload){
    if(!validatorsReady)return fail(ROUTER_CODES.RECEIVE_NOT_AVAILABLE);
    if(call_type==='account.register'){
      if(!isPlain(payload))return {ok:false,read_only:true,code:REGISTRATION_CODES.REGISTRATION_URL_INVALID};
      return registerAccount(payload);
    }
    if(!isPlain(payload))return fail(ROUTER_CODES.INVALID_BINDING);
    const binding=canonicalBinding(payload.binding);
    if(!binding)return fail(ROUTER_CODES.INVALID_BINDING);
    const key=bindingKey(binding);
    let cursor;
    if(payload.cursor!==undefined){
      cursor=canonicalCursor(payload.cursor);
      if(!cursor)return fail(ROUTER_CODES.INVALID_BINDING);
    }
    let limit;
    if(payload.limit!==undefined){
      if(!Number.isSafeInteger(payload.limit)||payload.limit<1||payload.limit>MAX_REPLAY_LIMIT)
        return fail(ROUTER_CODES.INVALID_BINDING);
      limit=payload.limit;
    }

    if(call_type==='conversation.subscribe')return subscribe(binding);

    if(call_type==='conversation.unsubscribe'){
      const entry=subscriptions.get(key);
      if(!entry)return {ok:true,read_only:true,status:'revoked'};
      const reply=await sendToPort(entry,{action:'stop',binding});
      closeEntry(entry);
      const result=mapPageReply(binding,reply);
      return result.ok===true?{ok:true,read_only:true,status:'revoked'}:result;
    }

    const entry=subscriptions.get(key);
    if(!entry)return fail(ROUTER_CODES.SUBSCRIPTION_REQUIRED);
    if(call_type==='conversation.read'){
      const reply=await sendToPort(entry,{action:'read',binding});
      return mapPageReply(binding,reply);
    }
    if(call_type==='conversation.replay'){
      const request={action:'replay',binding};
      if(cursor)request.cursor=cursor;
      if(limit!==undefined)request.limit=limit;
      const reply=await sendToPort(entry,request);
      return mapPageReply(binding,reply);
    }
    return fail(ROUTER_CODES.RECEIVE_NOT_AVAILABLE);
  }

  return Object.freeze({
    handleCall,
    status:()=>({ok:true,read_only:true,subscriptions:[...subscriptions.values()].map(e=>e.binding)}),
    /** Drop every subscription and every retained page text. */
    stopAll:()=>{for(const entry of [...subscriptions.values()])closeEntry(entry);},
  });
}
