import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeFrame,createFrameDecoder,FrameError} from '../src/transport/framing.mjs';
import {createRpcChannel} from '../src/transport/channel.mjs';
const okReq=()=>({schema:'aion.rpc/1',request_id:'REQ_20261019_000001',
  channel:'dev',source:'cli',method:'status',params:{}});
test('two fragmented frames decode exactly once each',()=>{
  const got=[];const decoder=createFrameDecoder({onMessage:x=>got.push(x)});
  const data=Buffer.concat([encodeFrame(okReq()),encodeFrame({...okReq(),request_id:'REQ_20261019_000002'})]);
  for(let i=0;i<data.length;i+=3) decoder.push(data.subarray(i,i+3));
  assert.equal(got.length,2);assert.equal(got[1].request_id,'REQ_20261019_000002');
  assert.equal(decoder.pending,false);
});
test('oversized and malformed frames fail closed',()=>{
  assert.throws(()=>encodeFrame({long:'x'.repeat(300000)}),FrameError);
  const got=[];const decoder=createFrameDecoder({onMessage:x=>got.push(x)});
  const huge=Buffer.alloc(4);huge.writeUInt32LE(300000);
  assert.throws(()=>decoder.push(huge),FrameError);
  assert.equal(decoder.failed,true);assert.equal(got.length,0);
  const bad=createFrameDecoder({onMessage:()=>assert.fail('no valid message')});
  const payload=Buffer.from('not json');const frame=Buffer.alloc(4+payload.length);
  frame.writeUInt32LE(payload.length);payload.copy(frame,4);
  assert.throws(()=>bad.push(frame),/BAD_JSON/);
});
test('rpc channel refuses forged or unverified caller before handler',async()=>{
  let invoked=0;
  const channel=createRpcChannel({verifyPeer:p=>p?.verified===true,handle:async()=>{invoked++;return {ok:true};}});
  assert.equal((await channel.receive(okReq(),{source:'cli',channel:'dev'})).code,'PEER_UNVERIFIED');
  assert.equal((await channel.receive({...okReq(),source:'native_host'}, {verified:true,source:'cli',channel:'dev'})).code,'SOURCE_MISMATCH');
  assert.equal(invoked,0);
  assert.equal((await channel.receive(okReq(),{verified:true,source:'cli',channel:'dev'})).ok,true);
  assert.equal(invoked,1);
});
