import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';

const server = resolve(import.meta.dirname, '../src/server.mjs');
function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'aion-mcp-'));
  const p = join(root, 'workspace','aion');
  mkdirSync(join(p,'sessions','01-escape-hatch','adapter'), {recursive:true});
  writeFileSync(join(p,'STATE.json'),JSON.stringify({updated_utc:'2026-10-18T12:00:00Z',m1_verified:false,current_phase:'PRELIVE',secret:'do-not-leak',chrome_relay_mvp:{status:'TEST',live_test_status:'no real turn',api_key:'private'}}));
  writeFileSync(join(p,'sessions','01-escape-hatch','adapter','receipt-test.json'), JSON.stringify({correlation:'abc',matched:false,reply_text:'private transcript must never leak',api_key:'private',status:'MOCK_ONLY'}));
  return root;
}
async function withServer(callback) {
  const root = createFixture();
  const child = spawn(process.execPath,[server],{env:{...process.env,AION_REPO_ROOT:root},stdio:['pipe','pipe','pipe']});
  const lines = createInterface({input:child.stdout});
  const pending = new Map();
  const errors=[];
  child.stderr.on('data', x=>errors.push(String(x)));
  lines.on('line',l=>{let msg=JSON.parse(l); if(pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}});
  let seq=0;
  const call=(method,params)=> new Promise((resolve,reject)=>{
    const id=++seq;
    const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('timeout '+method+' stderr='+errors.join('')))},1500);
    pending.set(id,msg=>{clearTimeout(timeout);resolve(msg)});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,...(params===undefined?{}:{params})})+'\n');
  });
  try { await callback(call,child,root); }
  finally { child.kill(); rmSync(root,{recursive:true,force:true}); }
}

test('handshake exposes exactly three read-only tools',async()=>withServer(async call=>{
  const init=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'0'}});
  assert.equal(init.result.serverInfo.name,'aion-mcp');
  const list=await call('tools/list');
  assert.deepEqual(list.result.tools.map(x=>x.name),['aion_state','aion_receipts','aion_verify_challenge']);
  assert.ok(list.result.tools.every(x=>x.annotations.readOnlyHint));
  const ping=await call('ping'); assert.deepEqual(ping.result,{});
}));

test('state returns snapshot with no private fields',async()=>withServer(async call=>{
  const r=await call('tools/call',{name:'aion_state',arguments:{}});
  assert.equal(r.result.structuredContent.m1_verified,false);
  assert.equal(r.result.structuredContent.snapshot,true);
  assert.equal(r.result.structuredContent.chrome_relay.status,'TEST');
  assert.doesNotMatch(JSON.stringify(r),/do-not-leak|api_key/);
}));

test('receipts list, read bounded metadata, refuse traversal and private text',async()=>withServer(async call=>{
  const ls=await call('tools/call',{name:'aion_receipts',arguments:{}});
  assert.deepEqual(ls.result.structuredContent.receipt_ids,['receipt-test.json']);
  const r=await call('tools/call',{name:'aion_receipts',arguments:{receipt_id:'receipt-test.json'}});
  assert.equal(r.result.structuredContent.matched,false);
  assert.doesNotMatch(JSON.stringify(r),/private transcript|api_key/);
  const denied=await call('tools/call',{name:'aion_receipts',arguments:{receipt_id:'../../STATE.json'}});
  assert.equal(denied.result.isError,true);
  const denied2=await call('tools/call',{name:'aion_receipts',arguments:{receipt_id:'receipt-evil.json',path:'C:\\secrets'}});
  assert.equal(denied2.result.isError,true);
}));

test('public challenge deterministic and rejects non-hex',async()=>withServer(async call=>{
  const nonce='2405b7fdc3e426a9';
  const out=await call('tools/call',{name:'aion_verify_challenge',arguments:{nonce}});
  const wanted=createHash('sha256').update(nonce).digest('hex');
  assert.equal(out.result.structuredContent.sha256,wanted);
  assert.equal(out.result.structuredContent.prefix12,wanted.slice(0,12));
  const denied=await call('tools/call',{name:'aion_verify_challenge',arguments:{nonce:'SECRET:password'}});
  assert.equal(denied.result.isError,true);
}));

test('unknown tool and MCP method fail closed',async()=>withServer(async call=>{
  const denied=await call('tools/call',{name:'aion_execute',arguments:{command:'rm -rf /'}});
  assert.equal(denied.result.isError,true);
  const method=await call('agent/run');
  assert.equal(method.error.code,-32601);
}));


test('malformed JSON cannot leak parser snippets or private text', async()=>withServer(async(call,child,root)=>{
  const badPath=join(root,'workspace','aion','sessions','01-escape-hatch','adapter','receipt-malformed.json');
  writeFileSync(badPath,'{\"secret\":\"PRIVATE_DATA_DO_NOT_LEAK\", invalid}');
  const r=await call('tools/call',{name:'aion_receipts',arguments:{receipt_id:'receipt-malformed.json'}});
  assert.equal(r.result.isError,true);
  assert.equal(r.result.content[0].text,'{\"ok\":false,\"error\":\"tool_failed\"}');
  assert.doesNotMatch(JSON.stringify(r),/PRIVATE_DATA_DO_NOT_LEAK|secret/);
}));
