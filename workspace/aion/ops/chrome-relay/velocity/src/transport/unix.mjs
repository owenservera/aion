// Real Linux/macOS *development* IPC. Windows intentionally fails closed until
// a logon-SID DACL named-pipe helper is implemented and independently audited.
// Private 0700 parent directory + 0600 socket; no public TCP listener.
import net from 'node:net';
import {lstatSync,chmodSync,existsSync,unlinkSync} from 'node:fs';
import {dirname,isAbsolute} from 'node:path';
import {createFrameDecoder,encodeFrame} from './framing.mjs';

export function validatePrivateSocketPath(socketPath){
 if(process.platform==='win32') throw Object.assign(new Error('Windows secure IPC not implemented'),{code:'WINDOWS_IPC_UNVERIFIED'});
 if(typeof socketPath!=='string'||!isAbsolute(socketPath)) throw new TypeError('absolute socket path required');
 const parent=lstatSync(dirname(socketPath));
 if(!parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077)!==0)
   throw Object.assign(new Error('socket parent not private'),{code:'UNSAFE_SOCKET_DIRECTORY'});
 if(typeof process.getuid==='function' && parent.uid!==process.getuid())
   throw Object.assign(new Error('socket parent belongs to another owner'),{code:'WRONG_OWNER'});
 if(existsSync(socketPath)) throw Object.assign(new Error('socket already exists'),{code:'SOCKET_EXISTS'});
}

export async function startUnixBroker({socketPath,channel}){
 if(!channel?.receive)throw new TypeError('RPC channel required');
 validatePrivateSocketPath(socketPath);
 const clients=new Set();
 const server=net.createServer(socket=>{
   clients.add(socket);
   socket.on('close',()=>clients.delete(socket));
   let chain=Promise.resolve();
   const decoder=createFrameDecoder({onMessage:request=>{
     chain=chain.then(async()=>{
       const answer=await channel.receive(request,{verified:true,channel:'dev',source:'cli'});
       if(!socket.destroyed) socket.write(encodeFrame(answer));
     }).catch(()=>socket.destroy());
   }});
   socket.on('data',data=>{try{decoder.push(data);}catch{socket.destroy();}});
   socket.on('error',()=>{});
 });
 server.on('error',()=>{});
 try {
   await new Promise((resolve,reject)=>{
     server.once('error',reject);
     server.listen(socketPath,()=>{server.off('error',reject);resolve();});
   });
   chmodSync(socketPath,0o600);
 }catch(error){try{server.close();}catch{} throw error;}
 const stat=lstatSync(socketPath);
 return Object.freeze({
   socketPath,
   async close(){
     for(const s of clients)s.destroy();
     await new Promise(resolve=>server.close(()=>resolve()));
     try{
       const current=lstatSync(socketPath);
       if(current.ino===stat.ino && current.dev===stat.dev)unlinkSync(socketPath);
     }catch(error){if(error.code!=='ENOENT')throw error;}
   }
 });
}

export async function requestUnix({socketPath,request,timeoutMs=5000}){
 if(process.platform==='win32')throw Object.assign(new Error('Windows secure IPC not yet verified'),{code:'WINDOWS_IPC_UNVERIFIED'});
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)throw new RangeError('timeoutMs');
 // Never resend after a timeout. Caller cannot infer no-send from lost ACK.
 return new Promise((resolve,reject)=>{
   let finished=false;
   const socket=net.createConnection({path:socketPath});
   const done=(error,value)=>{
     if(finished)return;finished=true;socket.destroy();
     if(error)reject(error);else resolve(value);
   };
   const timer=setTimeout(()=>done(Object.assign(new Error('RPC outcome unknown'),{
     code:'RPC_TIMEOUT_OUTCOME_UNKNOWN'})),timeoutMs);
   const finish=(error,value)=>{clearTimeout(timer);done(error,value);};
   const decoder=createFrameDecoder({onMessage:value=>finish(null,value)});
   socket.once('connect',()=>{try{socket.write(encodeFrame(request));}catch(error){finish(error);}});
   socket.on('data',bytes=>{try{decoder.push(bytes);}catch(error){finish(error);}});
   socket.once('error',error=>finish(error));
   socket.once('end',()=>finish(Object.assign(new Error('connection ended without reply'),{
     code:'RPC_DISCONNECTED_OUTCOME_UNKNOWN'})));
 });
}
