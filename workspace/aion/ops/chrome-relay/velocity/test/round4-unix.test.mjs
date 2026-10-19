import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startUnixBroker,requestUnix,validatePrivateSocketPath} from '../src/transport/unix.mjs';
import {createRpcChannel} from '../src/transport/channel.mjs';
import {makeControlRequest} from '../src/control.mjs';

test('real Unix socket request/response: one connection, source bound', {skip:process.platform==='win32'},async()=>{
 const directory=mkdtempSync(join(tmpdir(),'aion-round4-'));
 chmodSync(directory,0o700);
 const socketPath=join(directory,'dev.sock');
 let calls=0;
 const channel=createRpcChannel({verifyPeer:p=>p.verified===true,handle:async(method)=>{
   calls++;return {method,connected:true};
 }});
 let server;
 try{
   server=await startUnixBroker({socketPath,channel});
   const result=await requestUnix({socketPath,
     request:makeControlRequest({request_id:'REQ_20261019_000111',method:'doctor'})});
   assert.equal(result.ok,true);assert.equal(result.result.connected,true);
   assert.equal(calls,1);
   const forged=makeControlRequest({request_id:'REQ_20261019_000112',method:'status'});
   forged.source='native_host';
   const denied=await requestUnix({socketPath,request:forged});
   assert.equal(denied.ok,false);assert.equal(calls,1);
 }finally{if(server)await server.close();rmSync(directory,{recursive:true,force:true});}
});
test('unsafe parent refuses listener; no automatic chmod or cleanup of unowned directory',
 {skip:process.platform==='win32'},()=>{
 const directory=mkdtempSync(join(tmpdir(),'aion-unsafe-'));
 try{
   chmodSync(directory,0o755);
   assert.throws(()=>validatePrivateSocketPath(join(directory,'bad.sock')),/socket parent not private/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
