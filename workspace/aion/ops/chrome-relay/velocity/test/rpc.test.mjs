import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest, makeRequest } from '../src/rpc.mjs';

const request = (method, params = {}) => ({
  schema:'aion.rpc/1',request_id:'REQ_20261019_000001',
  source:'cli',channel:'dev',method,params
});

test('pure RPC contract validates read-only doctor', () => {
  assert.equal(validateRequest(request('doctor')).ok,true);
  assert.equal(makeRequest({request_id:'REQ_20261019_000001',method:'status'}).channel,'dev');
});
test('send carries refs but cannot bypass existing bus grant checks', () => {
  const p = {to:'chief',text:'hello',nonce:'nonce_123456',grant_ref:'owner-confirmed-ref'};
  assert.equal(validateRequest(request('send',p)).ok,true);
  assert.equal(validateRequest(request('send',{...p,text:''})).code,'BAD_PARAMS');
  assert.equal(validateRequest(request('send',{...p,nonce:'x'})).code,'BAD_PARAMS');
});
test('rejects untrusted sources, alternate channels and unknown methods', () => {
  assert.equal(validateRequest({...request('status'),source:'web_page'}).ok,false);
  assert.equal(validateRequest({...request('status'),channel:'stable'}).ok,false);
  assert.equal(validateRequest(request('run-shell')).ok,false);
});
test('rejects implicit operation identity and extra fields', () => {
  const p={to:'chief',text:'hello',nonce:'nonce_123456',grant_ref:'ref',operation_id:'pretend'};
  assert.equal(validateRequest(request('send',p)).code,'BAD_PARAMS');
  assert.equal(validateRequest({...request('status'),extra:'x'}).code,'BAD_ENVELOPE');
});
test('stop stays a bounded explicit emergency action', () => {
  assert.equal(validateRequest(request('stop',{reason:'owner stop'})).ok,true);
  assert.equal(validateRequest(request('stop',{})).code,'BAD_PARAMS');
});
