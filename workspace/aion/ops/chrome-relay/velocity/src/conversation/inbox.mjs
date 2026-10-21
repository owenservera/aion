// AION P4 — the PURE, memory-only inbox of the watch REPL.
//
// WHAT THIS FILE IS
//   A reducer over canonical P1 data (`aion.conversation.event/1` and
//   `aion.conversation.snapshot/1`). It owns NO transport, NO file, NO socket
//   and NO authority: it is given validated data and produces a bounded,
//   ordered view of it.
//
// THE RULES IT ENFORCES
//   - IDENTITY: a provider DOM id is the message identity and is stable across
//     reconnects; a provisional page position is an identity ONLY inside one
//     page epoch, so it never merges with anything outside that epoch.
//   - REVISION: a message is updated only by a STRICTLY higher revision. The
//     revision is visible in the view, so an edited message is never silently
//     presented as the original.
//   - COVERAGE: the initial authorized snapshot is a BASELINE. Unless the
//     source proves complete history, coverage stays explicitly unproven.
//   - BOUNDS: at most `maxMessages` (200) messages are retained; older ones
//     are dropped and the drop is counted, so the view never over-claims.
//   - TEXT SAFETY: untrusted page text is escaped so it can never drive the
//     terminal. Incoming text is DATA: it is never a command.
import {
  validateConversationEvent,validateConversationSnapshot,validateObservationCursor,
} from '../../../extension/src/lib/conversation-contract.js';

/** Hard bounds of the inbox. */
export const INBOX_LIMITS=Object.freeze({messages:200,textChars:16384});
/** The fixed coverage labels the REPL shows. */
export const COVERAGE_LABEL=Object.freeze({
  BASELINE_UNPROVEN:'baseline_history_coverage_unproven',
  COMPLETE:'complete_history_proven',
  UNCERTAIN:'coverage_uncertain',
});

const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

/**
 * Escape untrusted text for a terminal.
 *
 * ESC and every other control character (including the C1 range and the bidi
 * overrides) becomes a visible `\xNN` sequence, so an observed page can never
 * move the cursor, clear the screen, switch the charset or hide text.
 */
export function escapeForTerminal(value){
  const text=typeof value==='string'?value:'';
  let out='';
  for(const char of text){
    const code=char.codePointAt(0);
    if(code<0x20||code===0x7f||(code>=0x80&&code<=0x9f)
      ||(code>=0x202a&&code<=0x202e)||(code>=0x2066&&code<=0x2069)){
      out+=`\\x${code.toString(16).padStart(2,'0')}`;
      continue;
    }
    out+=char;
  }
  return out;
}

/** The identity of one message inside the inbox. */
export function identityKey(message,pageEpoch){
  if(!isPlain(message))return '';
  if(message.identity==='provider_dom_id')return `s:${message.key}`;
  // A provisional page position is meaningful ONLY inside its page epoch.
  return `p:${String(pageEpoch??'')}:${message.key}`;
}

export function createInbox({maxMessages=INBOX_LIMITS.messages}={}){
  const limit=Number.isSafeInteger(maxMessages)&&maxMessages>0?Math.min(maxMessages,INBOX_LIMITS.messages):INBOX_LIMITS.messages;
  /** identity key -> entry */
  const entries=new Map();
  /** insertion order of identity keys */
  const order=[];
  const reasons=new Set();
  let epoch=null;
  let cursor=null;
  let baseline=false;
  let completeHistory=false;
  let dropped=0;
  let gap=false;

  function coverageLabel(){
    if(completeHistory)return COVERAGE_LABEL.COMPLETE;
    if(gap)return COVERAGE_LABEL.UNCERTAIN;
    return baseline?COVERAGE_LABEL.BASELINE_UNPROVEN:COVERAGE_LABEL.UNCERTAIN;
  }

  function reset(){
    entries.clear();
    order.length=0;
    dropped=0;
  }

  function rememberCoverage(coverage){
    if(!isPlain(coverage))return;
    if(typeof coverage.reason==='string'&&coverage.reason)reasons.add(coverage.reason.slice(0,160));
    if(coverage.complete_history===true)completeHistory=true;
    else completeHistory=false;
  }

  function upsert(message,meta){
    const id=identityKey(message,meta.pageEpoch);
    if(!id)return {applied:false,reason:'invalid_message_identity'};
    const existing=entries.get(id);
    if(existing){
      if(!Number.isSafeInteger(message.revision)||message.revision<=existing.revision)
        return {applied:false,reason:'stale_or_duplicate_revision',id};
      existing.revision=message.revision;
      existing.text=typeof message.text==='string'?message.text:'';
      existing.text_truncated=message.text_truncated===true;
      existing.incomplete=message.incomplete===true;
      existing.completion=message.completion;
      existing.sequence=meta.sequence;
      existing.epoch=meta.pageEpoch;
      existing.revised=true;
      return {applied:true,change:'revised',id,entry:existing};
    }
    const entry={
      id,
      key:message.key,
      role:message.role,
      revision:message.revision,
      identity:message.identity,
      text:typeof message.text==='string'?message.text:'',
      text_truncated:message.text_truncated===true,
      incomplete:message.incomplete===true,
      completion:message.completion,
      epoch:meta.pageEpoch,
      sequence:meta.sequence,
      revised:false,
    };
    entries.set(id,entry);
    order.push(id);
    while(order.length>limit){
      const oldest=order.shift();
      entries.delete(oldest);
      dropped+=1;
    }
    return {applied:true,change:'first_seen',id,entry};
  }

  return Object.freeze({
    /** The page epoch the inbox currently holds. */
    epoch:()=>epoch,
    /** The last canonical cursor the inbox accepted. */
    cursor:()=>cursor,
    /**
     * Apply an authorized snapshot. `mode:'reset'` drops everything first
     * (a gap, an epoch change or an explicit resnapshot); `mode:'merge'` keeps
     * what is already known and only adds what is new.
     */
    applySnapshot(snapshot,{mode='merge'}={}){
      if(!validateConversationSnapshot(snapshot))return {applied:0,reason:'invalid_snapshot'};
      const changedEpoch=epoch!==null&&snapshot.page_epoch!==epoch;
      if(mode==='reset'||changedEpoch)reset();
      epoch=snapshot.page_epoch;
      baseline=true;
      gap=false;
      completeHistory=snapshot.coverage?.complete_history===true;
      if(snapshot.coverage?.reason)reasons.add(String(snapshot.coverage.reason).slice(0,160));
      let applied=0;
      const changed=[];
      for(const message of snapshot.messages){
        const result=upsert(message,{pageEpoch:snapshot.page_epoch,sequence:snapshot.cursor?.sequence??0});
        if(result.applied){applied+=1;changed.push(result.entry);}
      }
      cursor=snapshot.cursor;
      return {applied,entries:changed,mode:changedEpoch?'reset':mode,epoch_changed:changedEpoch};
    },
    /** Apply ONE canonical event. */
    applyEvent(event){
      if(!validateConversationEvent(event))return {applied:false,reason:'invalid_event'};
      const result=upsert(event.message,{pageEpoch:event.page_epoch,sequence:event.cursor?.sequence??0});
      if(!result.applied)return result;
      rememberCoverage(event.coverage);
      if(event.coverage?.complete_history!==true)completeHistory=false;
      if(validateObservationCursor(event.cursor))cursor=event.cursor;
      return result;
    },
    /**
     * Apply ONE replay page. A page that is not `ok` (gap / reset) is never
     * applied: the caller must re-read a snapshot instead.
     *
     * THE PAGE SHAPE is the canonical one of the bounded receive journal:
     * `status`, `items`, `nextCursor` and `hasMore` (camelCase). The P3
     * host/router put the SAME fields on the wire in snake_case, so both
     * spellings are read; camelCase is the canonical one.
     */
    applyPage(page){
      if(!isPlain(page)||!Array.isArray(page.items))return {applied:0,reason:'invalid_page'};
      if(page.status!=='ok'){
        gap=true;
        completeHistory=false;
        return {applied:0,status:page.status,reason:page.reason??'page_not_ok',gap:true};
      }
      const items=page.items.slice().sort((a,b)=>(a.sequence??0)-(b.sequence??0));
      let applied=0;
      const changed=[];
      for(const item of items){
        const result=this.applyEvent(item.event);
        if(result.applied){applied+=1;changed.push(result.entry);}
      }
      // The cursor of a page is the STREAM cursor. It is NEVER rebuilt from
      // the page epoch: the page epoch and the stream epoch are different
      // identities and mixing them would fake a resume.
      const next=isPlain(page.nextCursor)?page.nextCursor:(isPlain(page.next_cursor)?page.next_cursor:null);
      if(next&&validateObservationCursor(next))cursor=next;
      const hasMore=page.hasMore===true||page.has_more===true;
      if(page.complete_history===true)completeHistory=true;
      else completeHistory=false;
      return {
        applied,entries:changed,status:'ok',
        hasMore,has_more:hasMore,
        nextCursor:next,next_cursor:next,
        cursor_missing:next===null,
      };
    },
    /** The bounded, ordered view. */
    messages:()=>order.map(id=>entries.get(id)).filter(Boolean),
    /** The view, ready to print: untrusted text is escaped. */
    view:()=>order.map(id=>entries.get(id)).filter(Boolean).map(entry=>({
      role:entry.role,
      revision:entry.revision,
      identity:entry.identity,
      text:escapeForTerminal(entry.text),
      truncated:entry.text_truncated,
      incomplete:entry.incomplete,
      completion:entry.completion,
      revised:entry.revised,
      key:entry.key,
    })),
    status:()=>({
      count:entries.size,
      dropped,
      epoch,
      cursor,
      baseline_captured:baseline,
      coverage:{
        complete_history:completeHistory,
        label:coverageLabel(),
        reasons:[...reasons],
      },
      gap,
    }),
    /** Drop every retained text. Used when the read scope is revoked. */
    clear(){
      reset();
      epoch=null;
      cursor=null;
      baseline=false;
      completeHistory=false;
      gap=false;
      reasons.clear();
    },
  });
}
