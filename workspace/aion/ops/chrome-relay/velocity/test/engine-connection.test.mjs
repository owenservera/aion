import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenCodeConnector} from '../src/engines/connection.mjs';
const connector=(probe)=>createOpenCodeConnector({discover:()=>({url:'http://127.0.0.1:4096',headers:{authorization:'secret'}}),
 createClient:({baseUrl,headers})=>{assert.equal(baseUrl,'http://127.0.0.1:4096');assert.ok(headers.authorization);return{info:probe};},
 createAdapter:()=>({manifest:{name:'opencode-v2'}}),now:()=>1000});
test('real info response required before reporting engine connected',async()=>{
 const result=await connector(async()=>({data:{version:'v2'}})).connect();
 assert.equal(result.ok,true);assert.equal(result.adapter.manifest.name,'opencode-v2');
 assert.equal(JSON.stringify({...result,adapter:null}).includes('secret'),false);
});
test('failed health makes engine unavailable, never READY',async()=>{
 const result=await connector(async()=>{throw new Error('offline')}).connect();
 assert.equal(result.status,'UNAVAILABLE');assert.equal(result.adapter,null);
});
test('no remote engine pairing or arbitrary remote URL',async()=>{
 const result=await connector(async()=>({})).connect({url:'http://192.168.0.1:4096'});
 assert.equal(result.reason,'REMOTE_ENDPOINT_FORBIDDEN');
});
