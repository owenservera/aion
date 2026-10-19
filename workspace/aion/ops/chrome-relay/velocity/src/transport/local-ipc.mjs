// Track B host<->CLI IPC. One session per Chrome-launched dev host.
//
// Authentication is a 256-bit per-session token stored in a session file
// inside the SAME owner-private state directory as the Track B ledger
// (assertPrivateStateDir: POSIX 0700 or verified Windows ACL). The endpoint is
// a random POSIX socket in that directory or a random Windows named pipe.
//
// Honest boundary: the Windows pipe keeps Node's DEFAULT DACL. Access control
// is the token, not the pipe ACL. Status reports ipc_auth=SESSION_TOKEN and
// pipe_dacl=DEFAULT_UNVERIFIED; nothing here claims a SID-restricted pipe.
//
// Every request tracks whether its frame was WRITTEN. A failure before the
// write is a positive no-send; after the write the outcome is unknown.
import net from 'node:net';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,rmSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {createFrameDecoder,encodeFrame} from './framing.mjs';
import {assertPrivateStateDir} from '../security.mjs';

export const SESSION_FILE='host-session.json';
export const SESSION_SCHEMA='aion.b.host-session/1';
export const HELLO_SCHEMA='aion.b.hello/1';
const TOKEN=/^[0-9a-f]{64}$/;
const SESSION_ID=/^[0-9a-f]{24}$/;
const err=(code,message=code)=>Object.assign(new Error(message),{code});

export function endpointFor({stateDir,platform=process.platform,id}){
  return platform==='win32'?`\\\\.\\pipe\\aion-b-dev-${id}`:join(stateDir,`host-${id}.sock`);
}
export function readSession(stateDir){
  let s;
  try{s=JSON.parse(readFileSync(join(stateDir,SESSION_FILE),'utf8'));}
  catch(e){throw err(e.code==='ENOENT'?'HOST_NOT_RUNNING':'HOST_SESSION_UNREADABLE');}
  if(s?.schema!==SESSION_SCHEMA||!TOKEN.test(s.token??'')||!SESSION_ID.test(s.session_id??'')
     ||typeof s.endpoint!=='string'||!s.endpoint
     ||s.endpoint!==endpointFor({stateDir,id:s.session_id}))
    throw err('HOST_SESSION_INVALID');
  return s;
}
function writeSessionAtomic(stateDir,session){
  const path=join(stateDir,SESSION_FILE),tmp=`${path}.${session.session_id}.tmp`;
  writeFileSync(tmp,JSON.stringify(session),{mode:0o600});
  try{chmodSync(tmp,0o600);}catch{}
  renameSync(tmp,path);
}
function tokenOk(expected,given){
  if(typeof given!=='string'||!TOKEN.test(given))return false;
  return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(given,'hex'));
}

/**
 * Start the host endpoint. `onRequest(msg)` receives {call_type,payload} from an
 * authenticated client and resolves to a plain result object.
 */
export async function startHostEndpoint({stateDir,onRequest,platform=process.platform,meta={}}){
  if(typeof onRequest!=='function')throw new TypeError('onRequest required');
  assertPrivateStateDir(join(stateDir,'bus.json')); // never place a bearer token in a public folder
  const session_id=randomBytes(12).toString('hex');
  const token=randomBytes(32).toString('hex');
  const endpoint=endpointFor({stateDir,platform,id:session_id});
  const clients=new Set();
  const server=net.createServer(socket=>{
    clients.add(socket);socket.on('close',()=>clients.delete(socket));socket.on('error',()=>{});
    let authed=false;
    const decoder=createFrameDecoder({onMessage:msg=>{
      if(!authed){
        if(msg.schema!==HELLO_SCHEMA||!tokenOk(token,msg.token)){socket.destroy();return;}
        authed=true;socket.write(encodeFrame({schema:HELLO_SCHEMA,ok:true,session_id,...meta}));return;
      }
      const id=msg.id;
      if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id)){socket.destroy();return;}
      Promise.resolve().then(()=>onRequest({call_type:msg.call_type,payload:msg.payload}))
        .then(result=>({id,result}),e=>({id,error:{code:e?.code??'HOST_ERROR'}}))
        .then(reply=>{if(!socket.destroyed)socket.write(encodeFrame(reply));})
        .catch(()=>socket.destroy());
    }});
    socket.on('data',b=>{try{decoder.push(b);}catch{socket.destroy();}});
  });
  server.on('error',()=>{});
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(endpoint,()=>{server.off('error',reject);resolve();});
  });
  if(platform!=='win32')chmodSync(endpoint,0o600);
  writeSessionAtomic(stateDir,{schema:SESSION_SCHEMA,session_id,token,endpoint,pid:process.pid,
    started_utc:new Date().toISOString(),ipc_auth:'SESSION_TOKEN',
    pipe_dacl:platform==='win32'?'DEFAULT_UNVERIFIED':'POSIX_0600_IN_PRIVATE_DIR',...meta});
  let closed=false;
  return Object.freeze({session_id,endpoint,
    async close(){
      if(closed)return;closed=true;
      for(const s of clients)s.destroy();
      await new Promise(r=>server.close(()=>r()));
      // Only remove the rendezvous if it is still ours (a newer host may have replaced it).
      try{if(readSession(stateDir).session_id===session_id)rmSync(join(stateDir,SESSION_FILE),{force:true});}catch{}
      if(platform!=='win32')rmSync(endpoint,{force:true});
    }});
}

/** Connect and authenticate. Rejects with HOST_NOT_RUNNING / HOST_UNREACHABLE before any request. */
export async function connectHost({stateDir,timeoutMs=3000,readSessionImpl=readSession}){
  assertPrivateStateDir(join(stateDir,'bus.json'));
  const s=readSessionImpl(stateDir);
  const socket=net.createConnection(s.endpoint);
  socket.on('error',()=>{});
  const pending=new Map();let seq=0,hello=null,dead=null;
  const fail=e=>{
    if(dead)return;dead=e;
    for(const p of pending.values()){clearTimeout(p.timer);p.reject(Object.assign(err(e.code??'HOST_LINK_LOST'),{written:p.written}));}
    pending.clear();socket.destroy();
  };
  const decoder=createFrameDecoder({onMessage:msg=>{
    if(!hello){
      // The file pins a random session and endpoint. A frame from an unrelated
      // process is NOT a host acknowledgement, even if it says ok:true.
      if(msg?.schema!==HELLO_SCHEMA||msg.ok!==true
        ||msg.session_id!==s.session_id
        ||(s.extension_id && msg.extension_id!==s.extension_id)){
        fail(err('HOST_AUTH_REFUSED'));
        return;
      }
      hello=msg;return;
    }
    const p=pending.get(msg.id);if(!p)return;
    pending.delete(msg.id);clearTimeout(p.timer);
    if(msg.error)p.reject(Object.assign(err(msg.error.code??'HOST_ERROR'),{written:true,remote:true}));
    else p.resolve(msg.result);
  }});
  await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{socket.destroy();reject(err('HOST_UNREACHABLE'));},timeoutMs);
    socket.once('error',()=>{clearTimeout(t);reject(err('HOST_UNREACHABLE'));});
    socket.once('connect',()=>socket.write(encodeFrame({schema:HELLO_SCHEMA,token:s.token})));
    socket.on('data',b=>{
      try{decoder.push(b);}catch{clearTimeout(t);fail(err('HOST_PROTOCOL'));reject(err('HOST_PROTOCOL'));return;}
      if(hello){clearTimeout(t);resolve();}
      else if(dead){clearTimeout(t);reject(dead);}
    });
    socket.once('close',()=>{clearTimeout(t);if(!hello)reject(err('HOST_AUTH_REFUSED'));});
  });
  socket.on('close',()=>fail(err('HOST_LINK_LOST')));
  return Object.freeze({
    session:{session_id:s.session_id,ipc_auth:s.ipc_auth??'SESSION_TOKEN',pipe_dacl:s.pipe_dacl??null,
      extension_id:hello.extension_id??s.extension_id??null},
    request(call_type,payload,{timeoutMs:limit=60000}={}){
      return new Promise((resolve,reject)=>{
        if(dead)return reject(Object.assign(err('HOST_LINK_LOST'),{written:false}));
        const id=`r${++seq}`;
        const entry={resolve,reject,written:false,timer:setTimeout(()=>{
          pending.delete(id);reject(Object.assign(err('HOST_TIMEOUT_OUTCOME_UNKNOWN'),{written:entry.written}));
        },limit)};
        pending.set(id,entry);
        // Once queued on the socket the bytes may reach the host: count as written.
        let frame;
        try{frame=encodeFrame({id,call_type,payload});}
        catch{pending.delete(id);clearTimeout(entry.timer);return reject(Object.assign(err('HOST_FRAME_REFUSED'),{written:false}));}
        try{socket.write(frame);entry.written=true;}
        catch{pending.delete(id);clearTimeout(entry.timer);reject(Object.assign(err('HOST_FRAME_REFUSED'),{written:false}));}
      });
    },
    close(){fail(err('CLOSED'));}
  });
}
