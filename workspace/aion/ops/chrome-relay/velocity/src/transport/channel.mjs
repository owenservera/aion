// Source identity comes from the verified *transport*, never from untrusted JSON.
// No request can self-declare privilege by writing source='native_host'.
import {validateRequest} from '../rpc.mjs';
export function createRpcChannel({handle,verifyPeer}={}) {
  if(typeof handle!=='function' || typeof verifyPeer!=='function') throw new TypeError('channel callbacks');
  return Object.freeze({
    async receive(message,peer){
      const id=typeof message?.request_id==='string' && message.request_id.length<=128
        ? message.request_id : null;
      const failure=(code)=>({schema:'aion.rpc.response/1',request_id:id,ok:false,code});
      if(!verifyPeer(peer)) return failure('PEER_UNVERIFIED');
      const checked=validateRequest(message);
      if(!checked.ok) return failure(checked.code);
      if(peer.channel!=='dev' || peer.source!==message.source) return failure('SOURCE_MISMATCH');
      try {
        const result=await handle(message.method,message.params,{peer,request_id:id});
        return {schema:'aion.rpc.response/1',request_id:id,ok:true,result:result??null};
      }catch(error){
        const publicCodes=new Set(['TARGET_UNAVAILABLE','TARGET_UNBOUND','UNAUTHORIZED',
          'NOT_SENT','OUTCOME_UNKNOWN','RUNTIME_UNAVAILABLE','UNSUPPORTED','BAD_PARAMS']);
        return failure(publicCodes.has(error?.code)?error.code:'HANDLER_FAILED');
      }
    }
  });
}
