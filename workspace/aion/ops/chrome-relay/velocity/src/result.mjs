// Truthful and redacted result read model, derived from the existing Bus state.
// It is a view, not a parallel lifecycle or second persistent ledger.
import {deliveryState} from '../../extension/src/bus/contracts.js';
const TERMINAL=new Set(['REPORTED','REPLY_CHECKED','REJECTED','HALTED']);
const STATUS={
  OBSERVED:'PENDING',VALIDATED:'PENDING',RESERVED:'ADMITTED',
  DISPATCHED:'UNKNOWN',UNRESOLVED:'UNKNOWN',
  SUBMISSION_OBSERVED:'AWAITING_REPLY',
  REPLY_CHECKED:'REPLY_OBSERVED',REPORTED:'SUCCEEDED',
  REJECTED:'REFUSED',HALTED:'HALTED'
};
export function projectResult(command,{includeExcerpt=false}={}){
 if(!command||typeof command!=='object'||typeof command.command_id!=='string')
   throw new TypeError('Bus command required');
 const delivery=deliveryState(command);
 // Attempted rejections/halts MUST NOT claim positive no-send.
 const uncertain=delivery==='OUTCOME_UNKNOWN';
 const started=Date.parse(command.created_utc??'');
 const updated=Date.parse(command.updated_utc??'');
 const elapsed=Number.isFinite(started)&&Number.isFinite(updated)&&updated>=started?
   updated-started:null;
 const c={
   schema:'aion.result/1',operation_id:command.command_id,source:'aion.bus/1',
   to:command.to??null,adapter:command.adapter??null,
   status:uncertain?'UNKNOWN':STATUS[command.state]??'UNKNOWN',
   bus_state:command.state??null,delivery,
   terminal:TERMINAL.has(command.state)&&!uncertain,
   attempted:command.attempted===true,
   reason:command.reason??null,created_utc:command.created_utc??null,
   updated_utc:command.updated_utc??null,duration_ms:elapsed,
   evidence:command.reply?{
     reply_chars:command.reply.chars,reply_sig:command.reply.sig,
     observed_utc:command.reply.observed_utc
   }:null
 };
 if(includeExcerpt&&command.reply?.excerpt) c.reply_excerpt=command.reply.excerpt;
 return c;
}
