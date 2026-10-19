// AIOND prospective RPC contract. Pure validation only; no IPC, I/O or execution.
// The Bus V1/V2 contracts remain the authority for identity, grants and transitions.
import { isPlain, isAgentId, NONCE, DEFAULT_CONFIG } from '../../extension/src/bus/contracts.js';

export const RPC_SCHEMA = 'aion.rpc/1';
const METHODS = new Set(['doctor','status','capabilities','send','observe','stop']);
const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/;
const SOURCE = new Set(['cli','panel','native_host']);
const keysExact = (obj, keys) => Object.keys(obj).length === keys.length
  && keys.every(key => Object.hasOwn(obj,key));

export function validateRequest(request) {
  const fail = (code) => ({ok:false, code});
  if (!isPlain(request) || !keysExact(request,['schema','request_id','source','channel','method','params'])) {
    return fail('BAD_ENVELOPE');
  }
  if (request.schema !== RPC_SCHEMA || request.channel !== 'dev'
      || !REQUEST_ID.test(request.request_id) || !SOURCE.has(request.source)
      || !METHODS.has(request.method) || !isPlain(request.params)) {
    return fail('BAD_ENVELOPE');
  }
  const p = request.params;
  if (['status','doctor','capabilities'].includes(request.method)) {
    if (!keysExact(p,[])) return fail('BAD_PARAMS');
  } else if (request.method === 'send') {
    if (!keysExact(p,['to','text','nonce','grant_ref'])
      || !isAgentId(p.to) || typeof p.text !== 'string'
      || !p.text.trim() || p.text.length > DEFAULT_CONFIG.max_text_chars
      || typeof p.nonce !== 'string' || !NONCE.test(p.nonce)
      || typeof p.grant_ref !== 'string' || !p.grant_ref.trim() || p.grant_ref.length > 128) {
      return fail('BAD_PARAMS');
    }
  } else if (request.method === 'observe') {
    if (!keysExact(p,['operation_id']) || typeof p.operation_id !== 'string'
      || !REQUEST_ID.test(p.operation_id)) return fail('BAD_PARAMS');
  } else if (request.method === 'stop') {
    if (!keysExact(p,['reason']) || typeof p.reason !== 'string'
      || !p.reason.trim() || p.reason.length > 200) return fail('BAD_PARAMS');
  }
  return {ok:true, request};
}

// Construct explicit request data, not implied authorization. Local transport
// verifies user SID + caller identity; the existing Bus validates grant_ref.
export function makeRequest({request_id, source = 'cli', method, params = {}}) {
  const candidate = {schema:RPC_SCHEMA,request_id,source,channel:'dev',method,params};
  const result = validateRequest(candidate);
  if (!result.ok) throw new TypeError(result.code);
  return candidate;
}
