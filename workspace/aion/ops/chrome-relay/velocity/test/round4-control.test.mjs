import test from 'node:test';
import assert from 'node:assert/strict';
import {validateControlRequest,makeControlRequest} from '../src/control.mjs';
const req=(method,params={})=>({schema:'aion.control/1',request_id:'REQ_20261019_ABC123',
  source:'cli',channel:'dev',method,params});
test('CLI request carries alias and nonce, no caller supplied grant',()=>{
 const p={alias:'chief',text:'hello',nonce:'nonce_123456'};
 assert.equal(validateControlRequest(req('send',p)).ok,true);
 assert.equal(validateControlRequest(req('send',{...p,grant_ref:'forged'})).ok,false);
 assert.equal(makeControlRequest({request_id:'REQ_20261019_ABC123',method:'status'}).schema,'aion.control/1');
});
test('reject unsupported fields, channels, sources and text',()=>{
 const p={alias:'chief',text:'hello',nonce:'nonce_123456'};
 assert.equal(validateControlRequest(req('send',{...p,text:''})).code,'BAD_PARAMS');
 assert.equal(validateControlRequest({...req('send',p),source:'native_host'}).code,'BAD_ENVELOPE');
 assert.equal(validateControlRequest({...req('send',p),channel:'stable'}).code,'BAD_ENVELOPE');
 assert.equal(validateControlRequest(req('admin',{})).code,'BAD_ENVELOPE');
});
