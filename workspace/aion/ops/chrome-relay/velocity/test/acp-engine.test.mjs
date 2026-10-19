import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcpProbe} from '../src/engines/acp.mjs';
test('ACP executable existence is not a confirmed live handshake',()=>{
 const probe=createAcpProbe({loadConfig:()=>({agentPath:'/fixture/executable'}),
  validateConfig:()=>{},stat:()=>({isFile:()=>true}),now:()=>1000});
 const r=probe();assert.equal(r.status,'BINARY_PRESENT');
 assert.equal(r.live_verified,false);
});
test('missing ACP engine never gets a connected result',()=>{
 const probe=createAcpProbe({loadConfig:()=>({agentPath:'/missing'}),
  validateConfig:()=>{},stat:()=>{throw Object.assign(new Error('missing'),{code:'ENOENT'});}});
 assert.equal(probe().status,'UNAVAILABLE');
});
