import test from 'node:test';
import assert from 'node:assert/strict';
import {projectResult} from '../src/result.mjs';
const base={command_id:'abcdefghijkl',to:'role-05',adapter:'chatgpt',state:'RESERVED',
 attempted:false,reason:null,created_utc:'2026-10-19T19:00:00.000Z',
 updated_utc:'2026-10-19T19:00:00.100Z',reply:null};
test('reserved is merely admitted, never sent',()=>{
 const r=projectResult(base);assert.equal(r.status,'ADMITTED');assert.equal(r.delivery,'PREPARED');
 assert.equal(r.duration_ms,100);assert.equal(r.terminal,false);
});
test('uncertain attempt NEVER becomes NOT_SENT or success',()=>{
 const r=projectResult({...base,state:'HALTED',attempted:true});
 assert.equal(r.status,'UNKNOWN');assert.equal(r.delivery,'OUTCOME_UNKNOWN');
 assert.equal(r.terminal,false);
});
test('only real correlated readback results in success; excerpts private',()=>{
 const reply={chars:14,sig:'hash',observed_utc:base.updated_utc,excerpt:'secret result'};
 const r=projectResult({...base,state:'REPORTED',attempted:true,reply});
 assert.equal(r.status,'SUCCEEDED');assert.equal(r.delivery,'CONSUMED');
 assert.equal(r.reply_excerpt,undefined);assert.equal(r.evidence.reply_sig,'hash');
 assert.equal(projectResult({...base,state:'REPORTED',attempted:true,reply},
   {includeExcerpt:true}).reply_excerpt,'secret result');
});
