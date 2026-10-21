// CLI-facing *intent* protocol. It carries no grant ID or assumed binding.
// Authorization remains exclusively inside the existing AION Bus.
import {isPlain, NONCE, DEFAULT_CONFIG} from '../../extension/src/bus/contracts.js';
export const CONTROL_SCHEMA='aion.control/1';
const METHODS=new Set(['doctor','status','capabilities','send','observe','stop']);
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/;
const ALIAS=/^[a-z0-9][a-z0-9._-]{0,63}$/;
const exact=(obj,keys)=>Object.keys(obj).length===keys.length && keys.every(k=>Object.hasOwn(obj,k));
export function validateControlRequest(req) {
 const deny=code=>({ok:false,code});
 if(!isPlain(req)||!exact(req,['schema','request_id','source','channel','method','params']))
   return deny('BAD_ENVELOPE');
 if(req.schema!==CONTROL_SCHEMA||req.source!=='cli'||req.channel!=='dev'
   ||typeof req.request_id!=='string'||!ID.test(req.request_id)
   ||!METHODS.has(req.method)||!isPlain(req.params)) return deny('BAD_ENVELOPE');
 const p=req.params;
 if(['doctor','status','capabilities'].includes(req.method) && !exact(p,[])) return deny('BAD_PARAMS');
 if(req.method==='send' && (!exact(p,['alias','text','nonce'])
   ||typeof p.alias!=='string'||!ALIAS.test(p.alias)
   ||typeof p.text!=='string'||!p.text.trim()||p.text.length>DEFAULT_CONFIG.max_text_chars
   ||typeof p.nonce!=='string'||!NONCE.test(p.nonce))) return deny('BAD_PARAMS');
 if(req.method==='observe' && (!exact(p,['operation_id'])
   ||typeof p.operation_id!=='string'||!ID.test(p.operation_id))) return deny('BAD_PARAMS');
 if(req.method==='stop' && (!exact(p,['reason'])
   ||typeof p.reason!=='string'||!p.reason.trim()||p.reason.length>160)) return deny('BAD_PARAMS');
 return {ok:true,request:req};
}
export function makeControlRequest({request_id,method,params={}}){
 const req={schema:CONTROL_SCHEMA,request_id,source:'cli',channel:'dev',method,params};
 const check=validateControlRequest(req);
 if(!check.ok)throw Object.assign(new TypeError(check.code),{code:check.code});
 return req;
}
