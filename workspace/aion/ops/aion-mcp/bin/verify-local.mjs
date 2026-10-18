#!/usr/bin/env node
/** Safe live-local MCP protocol proof. Read-only, no browser, no network, no secrets. */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.env.AION_REPO_ROOT || resolve(HERE, '../../../../..'));
const SERVER = resolve(HERE, '../src/server.mjs');
const PUBLIC_PROBE = join(ROOT, 'workspace/aion/sessions/roles/06-tooling-integration-engineer/research/cap-probe.json');
const FAIL_TIMEOUT = 5000;

export async function probe({root=ROOT,server=SERVER,nonce='2405b7fdc3e426a9'}={}) {
  const child = spawn(process.execPath, [server], {
    stdio: ['pipe','pipe','pipe'],
    env: {...process.env,AION_REPO_ROOT:root}, windowsHide:true,
  });
  let nextId=0;
  let stderrBytes=0;
  const pending=new Map();
  const evidence={kind:'aion.local-mcp-proof.v1', protocol:'2025-06-18',
    checks:{initialize:false,tools:false,state:false,challenge:false,receipts:false,refusal:false},
    source:'local-process', chatgpt_connected:false};
  const lines=createInterface({input:child.stdout,crlfDelay:Infinity});
  lines.on('line',line=>{
    let answer;
    try {answer=JSON.parse(line);} catch {return;}
    const item=pending.get(answer.id);
    if(item) {pending.delete(answer.id);clearTimeout(item.timer);item.resolve(answer);}
  });
  child.stderr.on('data',b=>{stderrBytes+=b.length;});
  child.on('error',err=>{
    for(const item of pending.values()) {clearTimeout(item.timer);item.reject(new Error('MCP child unavailable: '+err.code));}
    pending.clear();
  });
  const call=(method,params)=>new Promise((resolve,reject)=>{
    const id=++nextId;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('MCP '+method+' timeout'));},FAIL_TIMEOUT);
    pending.set(id,{resolve,reject,timer});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,...(params?{params}:{})})+'\n');
  });
  const check=(condition,why)=>{if(!condition) throw new Error('MCP check failed: '+why);};
  try {
    const init=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'aion-local-verifier',version:'1.0'}});
    check(init.result?.serverInfo?.name==='aion-mcp','initialize'); evidence.checks.initialize=true;
    const listed=await call('tools/list');
    const names=listed.result?.tools?.map(t=>t.name) ?? [];
    check(['aion_state','aion_receipts','aion_verify_challenge'].every(n=>names.includes(n)),'tool discovery');
    check(listed.result.tools.every(t=>t.annotations?.readOnlyHint===true),'only read-only tools');evidence.checks.tools=true;
    const state=await call('tools/call',{name:'aion_state',arguments:{}});
    check(state.result?.structuredContent?.ok===true && state.result?.structuredContent?.snapshot===true,'state snapshot'); evidence.checks.state=true;
    const challenge=await call('tools/call',{name:'aion_verify_challenge',arguments:{nonce}});
    const wanted=createHash('sha256').update(nonce).digest('hex');
    check(challenge.result?.structuredContent?.sha256===wanted,'challenge hash');evidence.checks.challenge=true;
    const receipts=await call('tools/call',{name:'aion_receipts',arguments:{}});
    check(receipts.result?.structuredContent?.ok===true,'receipt index');evidence.checks.receipts=true;
    const denied=await call('tools/call',{name:'aion_run_shell',arguments:{command:'whoami'}});
    check(denied.result?.isError===true,'no execution tool');evidence.checks.refusal=true;
    evidence.result='PASS';evidence.checked_count=Object.keys(evidence.checks).length;
    return evidence;
  } finally {
    child.stdin.end();child.kill();lines.close();
    for(const item of pending.values())clearTimeout(item.timer);
  }
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    // The probe lives in the repo and is fixed input, never a secret.
    const probeFile=JSON.parse(await readFile(PUBLIC_PROBE,'utf8'));
    const evidence=await probe({nonce:probeFile.nonce});
    process.stdout.write(JSON.stringify(evidence,null,2)+'\n');
  } catch(error) {
    process.stderr.write('AION local MCP proof FAILED: '+String(error.message).slice(0,180)+'\n');
    process.exitCode=1;
  }
}
