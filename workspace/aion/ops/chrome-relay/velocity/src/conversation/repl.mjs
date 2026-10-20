// AION P4 — the WATCH-ONLY REPL of the Track B CLI.
//
// WHAT THIS FILE IS
//   The long-lived local process that observes ONE exactly bound conversation.
//
// THE RULES IT ENFORCES
//   - WATCH ONLY: the only calls it ever makes are `conversation.*`. There is
//     no Send implementation here and no path to one.
//   - SUBSCRIBE, THEN READ: it subscribes first and then reads the initial
//     authorized snapshot, so it never shows an unsubscribed window.
//   - HINTS ARE HINTS: a push only says "the conversation moved". The REPL
//     then PULLS the authoritative pages, in ascending order, until the source
//     says there is no more.
//   - GAP OR EPOCH MISMATCH: the cursor is not trusted any more. The REPL
//     reads a fresh snapshot and says so explicitly.
//   - RECONNECT ALWAYS RE-SUBSCRIBES AND RE-READS: a new link never inherits
//     the old subscription.
//   - AUTHORITY IS RE-CHECKED: before data is processed and periodically. A
//     revoked binding stops the REPL, drops the inbox and exits.
//   - FIXED INPUT COMMANDS ONLY: `/quit`, `/status`, `/resnapshot`. Every
//     other line is rejected. Incoming page text is DATA and is never a
//     command.
import {createReceiveCall,createReceiveEventStream} from '../browser/remote-call.mjs';
import {createInbox,escapeForTerminal,COVERAGE_LABEL} from './inbox.mjs';

/** The bounded budgets of the watch loop. */
export const WATCH_LIMITS=Object.freeze({
  replayPages:100,
  replayEvents:150,
  pageLimit:100,
  reconnectAttempts:3,
  reconnectDelayMs:1000,
  authorityIntervalMs:30000,
});

const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const sameBinding=(a,b)=>isPlain(a)&&isPlain(b)
  &&['provider','account_key','conversation_id','ref','revision'].every(f=>a[f]===b[f]);

/**
 * The watch REPL.
 *
 * `connect` returns a host link (`request`/`onEvent`/`onDisconnect`).
 * `authority` answers whether the owner's binding still authorizes this
 * watch. Both are injected so the loop can be driven hermetically.
 */
export function createWatchRepl({
  binding,
  role=null,
  connect,
  receiveFor=(link)=>createReceiveCall({link}),
  streamFor=(link)=>createReceiveEventStream({link}),
  authority,
  output=()=>{},
  inbox=createInbox(),
  limits=WATCH_LIMITS,
  delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms)),
  setTimer=(fn,ms)=>setInterval(fn,ms),
  clearTimer=(handle)=>clearInterval(handle),
  onStop=()=>{},
}={}){
  if(!isPlain(binding))throw new TypeError('canonical binding required');
  if(typeof connect!=='function')throw new TypeError('connect required');

  let link=null;
  let receive=null;
  let stream=null;
  let unsubscribeHint=()=>{};
  let unsubscribeDisconnect=()=>{};
  let timer=null;
  let running=false;
  let sweeping=false;
  let pendingSweep=false;
  let stopping=false;
  let reconnecting=false;

  /** Detach the listeners of the CURRENT link. Always safe to call. */
  function detach(){
    try{unsubscribeHint();}catch{}
    try{unsubscribeDisconnect();}catch{}
    unsubscribeHint=()=>{};
    unsubscribeDisconnect=()=>{};
  }
  /** Attach the listeners of the CURRENT link. */
  function attach(){
    unsubscribeHint=stream.onHint(onHint);
    unsubscribeDisconnect=stream.onDisconnect(()=>{void onDisconnect();});
  }

  /** The ONLY calls this REPL may make. */
  function call(type,payload){
    if(typeof type!=='string'||!type.startsWith('conversation.'))
      throw Object.assign(new Error('watch-only call refused'),{code:'CALL_NOT_ALLOWED'});
    return receive(type,payload);
  }

  async function checkAuthority(){
    if(typeof authority!=='function')return {authorized:false,code:'BINDING_AUTHORITY_UNAVAILABLE'};
    try{
      const verdict=await authority();
      if(!verdict||verdict.authorized!==true)
        return {authorized:false,code:verdict?.code??'BINDING_REVOKED'};
      return {authorized:true};
    }catch{
      return {authorized:false,code:'BINDING_AUTHORITY_UNAVAILABLE'};
    }
  }

  /** The read scope is gone: stop, drop the inbox, exit. */
  async function revoke(code='BINDING_REVOKED'){
    if(stopping)return;
    output(`! read scope revoked (${code}) — stopping`);
    await stop(code);
    onStop({reason:'revoked',code});
  }

  function printMessages(entries,kind){
    for(const entry of entries??[]){
      const revised=entry.revised?' (revised)':'';
      const truncated=entry.text_truncated?' (truncated)':'';
      const text=escapeForTerminal(entry.text);
      output(`[${entry.role}] rev${entry.revision}${revised}${truncated}: ${text}`);
    }
    if(kind==='baseline'){
      const status=inbox.status();
      output(`· baseline snapshot: ${status.count} message(s) — coverage: ${status.coverage.label}`);
    }
  }

  /** Read the authoritative snapshot and install it as the current view. */
  async function readSnapshot({mode='reset',label='snapshot'}={}){
    const verdict=await checkAuthority();
    if(!verdict.authorized){await revoke(verdict.code);return {ok:false,code:verdict.code};}
    const reply=await call('conversation.read',{binding});
    if(!reply||reply.ok!==true){
      const code=reply?.code??'READ_FAILED';
      if(code==='BINDING_NOT_AUTHORIZED'){await revoke(code);return {ok:false,code};}
      output(`! ${label} failed: ${code}`);
      return {ok:false,code};
    }
    const snapshot=reply.snapshot;
    if(!snapshot){output(`! ${label} failed: NO_SNAPSHOT`);return {ok:false,code:'NO_SNAPSHOT'};}
    const applied=inbox.applySnapshot(snapshot,{mode});
    printMessages(applied.entries,'baseline');
    return {ok:true,applied};
  }

  /** Pull the pages that follow the cursor, in ascending order. */
  async function sweep(){
    if(sweeping){pendingSweep=true;return;}
    sweeping=true;
    try{
      let pages=0;
      let events=0;
      let cursor=inbox.cursor();
      while(pages<limits.replayPages){
        const verdict=await checkAuthority();
        if(!verdict.authorized){await revoke(verdict.code);return;}
        const payload={binding};
        if(cursor)payload.cursor=cursor;
        payload.limit=limits.pageLimit;
        const reply=await call('conversation.replay',payload);
        if(!reply||reply.ok!==true){
          const code=reply?.code??'REPLAY_FAILED';
          if(code==='BINDING_NOT_AUTHORIZED'){await revoke(code);return;}
          output(`! replay stopped: ${code}`);
          return;
        }
        const page=reply.page;
        if(!isPlain(page)||page.status!=='ok'){
          output(`! ${page?.status==='gap'?'gap':'cursor reset'}: ${page?.reason??'cursor_not_usable'} — reading a fresh snapshot`);
          await readSnapshot({mode:'reset',label:'resnapshot'});
          return;
        }
        const applied=inbox.applyPage(page);
        printMessages(applied.entries);
        events+=applied.applied;
        pages+=1;
        // The canonical page of the bounded receive journal: `status`,
        // `items`, `nextCursor`, `hasMore`.
        const hasMore=applied.hasMore===true;
        if(!hasMore)break;
        const next=applied.nextCursor??null;
        if(!isPlain(next)){
          // A page without a cursor cannot be continued: say so and re-read.
          output('! page without a cursor — reading a fresh snapshot');
          await readSnapshot({mode:'reset',label:'resnapshot'});
          return;
        }
        if(cursor&&next.epoch&&cursor.epoch&&next.epoch!==cursor.epoch){
          output('! cursor epoch mismatch — reading a fresh snapshot');
          await readSnapshot({mode:'reset',label:'resnapshot'});
          return;
        }
        cursor=next;
        if(events>=limits.replayEvents){
          if(hasMore){
            // The budget ran out with pages still pending. That is NOT a
            // silent stop: the coverage is unproven, so a fresh snapshot is
            // read and the gap is stated.
            output('! replay budget exhausted with pages still pending — reading a fresh snapshot');
            await readSnapshot({mode:'reset',label:'resnapshot'});
            return;
          }
          output('! replay budget exhausted — coverage of this sweep is unproven');
          break;
        }
      }
    }finally{
      sweeping=false;
      if(pendingSweep){pendingSweep=false;await sweep();}
    }
  }

  function onHint(hint){
    if(!running)return;
    if(!isPlain(hint)||!sameBinding(hint.binding,binding))return;
    if(typeof hint.page_epoch==='string'&&hint.page_epoch
      &&inbox.epoch()&&hint.page_epoch!==inbox.epoch()){
      output('! page epoch changed — reading a fresh snapshot');
      void readSnapshot({mode:'reset',label:'resnapshot'});
      return;
    }
    void sweep();
  }

  async function onDisconnect(){
    if(!running||stopping)return;
    // ONE reconnect loop: a second disconnect while the loop runs must not
    // start a second one.
    if(reconnecting)return;
    reconnecting=true;
    try{
      output('! host link lost — reconnecting (read-only)');
      for(let attempt=1;attempt<=limits.reconnectAttempts;attempt+=1){
        if(stopping)return;
        await delay(limits.reconnectDelayMs);
        try{
          // The PREVIOUS listeners go first: the dead link must never be
          // able to drive the loop again.
          detach();
          if(link){try{link.close();}catch{}}
          link=await connect();
          receive=receiveFor(link);
          stream=streamFor(link);
          const subscribed=await call('conversation.subscribe',{binding});
          if(!subscribed||subscribed.ok!==true){
            const code=subscribed?.code??'SUBSCRIBE_FAILED';
            if(code==='BINDING_NOT_AUTHORIZED'){await revoke(code);return;}
            output(`! reconnect subscribe failed: ${code}`);
            continue;
          }
          // The new listeners are attached only AFTER a successful,
          // authorized snapshot: the watch is only "reconnected" when it can
          // actually show the authoritative state again.
          const read=await readSnapshot({mode:'merge',label:'resnapshot'});
          if(!read.ok){
            output('! reconnect read failed — not reconnected');
            continue;
          }
          attach();
          output('· reconnected and re-read');
          return;
        }catch{
          output(`! reconnect attempt ${attempt} failed`);
        }
      }
      output('! host link lost — no reconnect left');
      await stop('LINK_LOST');
      onStop({reason:'link_lost',code:'LINK_LOST'});
    }finally{
      reconnecting=false;
    }
  }

  async function stop(reason='STOPPED'){
    if(stopping)return;
    stopping=true;
    running=false;
    if(timer){clearTimer(timer);timer=null;}
    detach();
    if(receive){
      try{await call('conversation.unsubscribe',{binding});}catch{}
    }
    inbox.clear();
    if(link){try{link.close();}catch{}}
    link=null;
    output(`· watch stopped (${reason})`);
  }

  return Object.freeze({
    /** Subscribe, then read the initial authorized snapshot. */
    async start(){
      const verdict=await checkAuthority();
      if(!verdict.authorized){
        await revoke(verdict.code);
        return {ok:false,code:verdict.code};
      }
      try{
        link=await connect();
        receive=receiveFor(link);
        stream=streamFor(link);
      }catch(error){
        return {ok:false,code:error?.code??'HOST_UNREACHABLE'};
      }
      const subscribed=await call('conversation.subscribe',{binding});
      if(!subscribed||subscribed.ok!==true){
        const code=subscribed?.code??'SUBSCRIBE_FAILED';
        if(code==='BINDING_NOT_AUTHORIZED'){await revoke(code);return {ok:false,code};}
        await stop('SUBSCRIBE_FAILED');
        return {ok:false,code};
      }
      running=true;
      attach();
      const read=await readSnapshot({mode:'merge',label:'initial snapshot'});
      if(!read.ok){await stop('READ_FAILED');return {ok:false,code:read.code};}
      if(typeof authority==='function'&&limits.authorityIntervalMs>0){
        timer=setTimer(()=>{
          void (async()=>{
            const check=await checkAuthority();
            if(!check.authorized)await revoke(check.code);
          })();
        },limits.authorityIntervalMs);
        if(timer&&typeof timer.unref==='function')timer.unref();
      }
      return {ok:true};
    },
    /** The fixed input commands. Everything else is rejected. */
    async handleLine(line){
      const trimmed=typeof line==='string'?line.trim():'';
      if(trimmed==='')return {ok:true,code:'IGNORED'};
      if(trimmed==='/quit'){
        await stop('QUIT');
        onStop({reason:'quit',code:'QUIT'});
        return {ok:true,code:'QUIT'};
      }
      if(trimmed==='/status'){
        const status=inbox.status();
        output(`· status: ${status.count} message(s), coverage ${status.coverage.label}`
          +`${status.gap?', gap detected':''}${status.dropped?`, ${status.dropped} dropped`:''}`);
        return {ok:true,code:'STATUS'};
      }
      if(trimmed==='/resnapshot'){
        const read=await readSnapshot({mode:'reset',label:'resnapshot'});
        return {ok:true,code:'RESNAPSHOT',ok_read:read.ok};
      }
      output('watch-only: input is not sent. Send is not implemented; only /quit, /status and /resnapshot are accepted.');
      return {ok:false,code:'INPUT_REJECTED'};
    },
    /** The inbox view (escaped text). */
    view:()=>inbox.view(),
    status:()=>inbox.status(),
    stop,
    isRunning:()=>running,
    coverageLabels:COVERAGE_LABEL,
  });
}
