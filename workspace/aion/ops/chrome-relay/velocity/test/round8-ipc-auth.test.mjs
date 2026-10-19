import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {mkdtempSync,chmodSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readSession,endpointFor,connectHost,SESSION_FILE,SESSION_SCHEMA,HELLO_SCHEMA}
  from '../src/transport/local-ipc.mjs';
import {createFrameDecoder,encodeFrame} from '../src/transport/framing.mjs';

const session_id='a'.repeat(24), token='b'.repeat(64), extension_id='c'.repeat(32);
const ownDir=()=>{const dir=mkdtempSync(join(tmpdir(),'aion-b8-auth-'));chmodSync(dir,0o700);return dir;};
function fixture(dir,changes={}){
 const s={schema:SESSION_SCHEMA,session_id,token,extension_id,
   endpoint:endpointFor({stateDir:dir,id:session_id}),...changes};
 writeFileSync(join(dir,SESSION_FILE),JSON.stringify(s),{mode:0o600});
 return s;
}
test('host session cannot redirect CLI to an arbitrary endpoint',()=>{
 const dir=ownDir();
 try{
   fixture(dir,{endpoint:join(dir,'foreign.sock')});
   assert.throws(()=>readSession(dir),{code:'HOST_SESSION_INVALID'});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
async function rogueReply(t,reply){
 const dir=ownDir(),s=fixture(dir);
 const server=net.createServer(socket=>{
   const decoder=createFrameDecoder({onMessage:msg=>{
     if(msg.schema===HELLO_SCHEMA)socket.write(encodeFrame(reply(s)));
   }});
   socket.on('data',b=>decoder.push(b));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(s.endpoint,resolve);});
 t.after(async()=>{
   await new Promise(resolve=>server.close(resolve));
   rmSync(dir,{recursive:true,force:true});
 });
 await assert.rejects(connectHost({stateDir:dir,timeoutMs:1000}),{code:'HOST_AUTH_REFUSED'});
}
test('fake host with valid-looking OK but wrong session id is refused',async t=>{
 await rogueReply(t,s=>({schema:HELLO_SCHEMA,ok:true,session_id:'d'.repeat(24),extension_id:s.extension_id}));
});
test('fake host with wrong extension id is refused',async t=>{
 await rogueReply(t,s=>({schema:HELLO_SCHEMA,ok:true,session_id:s.session_id,extension_id:'e'.repeat(32)}));
});
test('fake host with no protocol schema is refused',async t=>{
 await rogueReply(t,s=>({ok:true,session_id:s.session_id,extension_id:s.extension_id}));
});
