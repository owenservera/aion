import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const sha256=(x)=>createHash('sha256').update(x).digest('hex');
export function request(id='M1C08_SOURCE_001',now=new Date()){
 return {schema:'aion.m1.mock.v1',target:'MOCK_ONLY',origin:'AION_SIMULATED',grant:'TEST_ONLY',id,correlation:'M1C08_CORR_001',created:now.toISOString(),expires:new Date(now.getTime()+60000).toISOString(),text:'SYNTHETIC ONLY'};
}
export function validate(x,now=Date.now()){
 if(!x || typeof x!=='object'||Array.isArray(x))return 'MALFORMED';
 if(x.schema!=='aion.m1.mock.v1'||x.target!=='MOCK_ONLY')return 'WRONG_TARGET';
 if(x.origin!=='AION_SIMULATED'||x.grant!=='TEST_ONLY')return 'NOT_AUTHORIZED';
 if(typeof x.id!=='string'||!/^[-_A-Za-z0-9]{8,80}$/.test(x.id)||typeof x.correlation!=='string'||x.correlation.length<8)return 'BAD_ID';
 if(!Number.isFinite(Date.parse(x.created))||!Number.isFinite(Date.parse(x.expires))||Date.parse(x.expires)<=now||Date.parse(x.created)>now+60000)return 'EXPIRED';
 if(typeof x.text!=='string'||!x.text.trim()||x.text.length>2000)return 'EMPTY_OR_LARGE';
 return null;
}
export function mockServer(journal){
 const seen=new Set();
 if(fs.existsSync(journal))for(const line of fs.readFileSync(journal,'utf8').split('\n').filter(Boolean)){const r=JSON.parse(line);if(!r.id||!r.digest)throw Error('INVALID_JOURNAL');seen.add(r.id);}
 return createServer(async(req,res)=>{
  const reply=(status,body)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body));};
  if(req.method!=='POST'||req.url!=='/mock/send')return reply(404,{error:'NOT_FOUND'});
  let raw='';try{for await(const b of req){raw+=b;if(raw.length>8192)throw Error('SIZE');}}catch{return reply(413,{error:'TOO_LARGE'});}
  let x;try{x=JSON.parse(raw);}catch{return reply(400,{error:'BAD_JSON'});}
  const err=validate(x);if(err)return reply(400,{error:err});
  if(seen.has(x.id))return reply(409,{error:'DUPLICATE'});
  try{fs.mkdirSync(path.dirname(journal),{recursive:true});fs.appendFileSync(journal,JSON.stringify({id:x.id,correlation:x.correlation,digest:sha256(x.text)})+'\n',{mode:0o600});}catch{return reply(503,{error:'STORE_FAILED'});}
  seen.add(x.id);
  reply(200,{mode:'MOCK_ONLY',m1_verified:false,ack:'PERSISTED_NOT_EXECUTION',source:'LOCAL_FIXTURE',id:x.id,correlation:x.correlation,mock_reply:'MOCK_REPLY:'+x.correlation,utc:new Date().toISOString()});
 });
}
export async function start(journal){const server=mockServer(journal);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:'http://127.0.0.1:'+server.address().port};}
export async function close(server){await new Promise(resolve=>server.close(resolve));}
export function check(x,r){return !!(x&&r&&r.mode==='MOCK_ONLY'&&r.m1_verified===false&&r.source==='LOCAL_FIXTURE'&&r.ack==='PERSISTED_NOT_EXECUTION'&&r.id===x.id&&r.correlation===x.correlation&&r.mock_reply==='MOCK_REPLY:'+x.correlation);}
export async function demo(dest){const state=fs.mkdtempSync(path.join(os.tmpdir(),'aion-zforge-'));const journal=path.join(state,'ledger.jsonl'),x=request();const one=await start(journal);let r;try{const h=await fetch(one.url+'/mock/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});r=await h.json();if(h.status!==200||!check(x,r))throw Error('MOCK_NOT_VERIFIED');}finally{await close(one.server);}
 const two=await start(journal);let retry;try{const h=await fetch(two.url+'/mock/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});retry={code:h.status,...await h.json()};if(retry.code!==409||retry.error!=='DUPLICATE')throw Error('RECOVERY_FAILED');}finally{await close(two.server);}
 const data={simulation_only:true,m1_verified:false,request_digest:sha256(JSON.stringify(x)),reply:r,simulated_readback:r.mock_reply,replay:retry,utc:new Date().toISOString()};fs.mkdirSync(dest,{recursive:true});const evidence=path.join(dest,'mock.json');fs.writeFileSync(evidence,JSON.stringify(data,null,2)+'\n');const b=fs.readFileSync(evidence);fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({sha256:sha256(b),bytes:b.length,m1_verified:false},null,2)+'\n');return data;}
export function verify(dest){const b=fs.readFileSync(path.join(dest,'mock.json')),m=JSON.parse(fs.readFileSync(path.join(dest,'manifest.json'),'utf8'));if(sha256(b)!==m.sha256||b.length!==m.bytes)throw Error('HASH_INVALID');const d=JSON.parse(b);if(d.m1_verified!==false||d.simulation_only!==true||d.reply?.mode!=='MOCK_ONLY'||d.replay?.code!==409)throw Error('FAKE_LIVE');return true;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.resolve(process.argv[3]||'out');try{if(process.argv[2]==='demo')console.log(JSON.stringify({state:'MOCK_ONLY',data:await demo(dir)}));else if(process.argv[2]==='verify')console.log(JSON.stringify({mock_export_verified:verify(dir)}));else throw Error('usage: node mock.mjs demo|verify [output_directory]');}catch(e){console.error(e.message);process.exitCode=1;}
}