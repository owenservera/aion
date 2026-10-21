import test from 'node:test';
import assert from 'node:assert/strict';
import {NONCE,REASON} from '../../extension/src/bus/contracts.js';
import {parseBlock} from '../../extension/src/bus/grammar.js';

test('prototype-key nonce cannot escape the durable replay index',()=>{
 for(const bad of ['__proto__','constructor','prototype']){
   assert.equal(NONCE.test(bad),false);
   const command=parseBlock('op: send\nto: role-05\ntext: hello\nnonce: '+bad);
   assert.equal(command.ok,false);
   assert.equal(command.reason,REASON.BAD_VALUE);
 }
});
test('ordinary operator nonces remain permitted',()=>{
 for(const good of ['nonce_123456','cli-20261019-a','AION_NONCE_TEST']){
   assert.equal(NONCE.test(good),true);
 }
});
