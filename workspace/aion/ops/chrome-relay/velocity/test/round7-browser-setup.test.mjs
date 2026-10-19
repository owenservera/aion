// Round 7: `aion setup browser`. Writes into temp dirs only; no Chrome, no registry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {extensionIdFromSpki,planBrowserSetup,applyBrowserSetup,uninstallBrowserSetup,REGISTRY_KEY} from '../src/browser/setup.mjs';
import {PINNED_EXTENSION_ID} from '../../bridge/bin/aion-relay-host.mjs';
import {main} from '../bin/aion-local.mjs';
import {encodeNativeFrame,createNativeFrameDecoder} from '../../bridge/src/framing.js';

const STABLE_MANIFEST=resolve(dirname(fileURLToPath(import.meta.url)),'..','..','extension','manifest.json');
const tmp=()=>mkdtempSync(join(tmpdir(),'aion-b7setup-'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const okRun=calls=>(cmd,args)=>{calls.push([cmd,...args]);return {status:0};};

test('ID algorithm reproduces the pinned Track A ID from its own manifest key',()=>{
  const key=JSON.parse(readFileSync(STABLE_MANIFEST,'utf8')).key;
  assert.equal(extensionIdFromSpki(Buffer.from(key,'base64')),PINNED_EXTENSION_ID);
});

test('setup browser dry run writes nothing',async t=>{
  const root=tmp();process.env.AION_DEV_STATE=join(root,'b','bus.json');
  t.after(()=>{delete process.env.AION_DEV_STATE;});
  const lines=[];const code=await main(['setup','browser'],{print:l=>lines.push(l)});
  const out=JSON.parse(lines[0]);
  assert.equal(code,0);assert.equal(out.code,'PLAN_ONLY_NO_WRITES');
  assert.deepEqual(readdirSync(root),[]);
});

test('apply builds an isolated dev extension + host; Track A untouched; uninstall is B-only',async()=>{
  const before=sha(STABLE_MANIFEST);
  const stateDir=join(tmp(),'track-b');const userHostDir=join(tmp(),'NativeMessagingHosts');
  const plan=planBrowserSetup({stateDir,platform:'linux',userHostDir});
  const receipt=applyBrowserSetup(plan);
  const built=JSON.parse(readFileSync(join(plan.extensionDir,'manifest.json'),'utf8'));
  const id=extensionIdFromSpki(Buffer.from(built.key,'base64'));
  assert.equal(receipt.extension_id,id);assert.notEqual(id,PINNED_EXTENSION_ID);
  assert.equal(built.background.service_worker,'src/dev/dev-worker.js');
  assert.ok(existsSync(join(plan.extensionDir,'src','background','service-worker.js')));
  const host=JSON.parse(readFileSync(plan.registration.path,'utf8'));
  assert.equal(host.name,'com.aion.relay.dev');
  assert.deepEqual(host.allowed_origins,[`chrome-extension://${id}/`]);
  assert.equal(JSON.parse(readFileSync(plan.configPath,'utf8')).extension_id,id);
  assert.equal(sha(STABLE_MANIFEST),before,'Track A manifest unchanged');
  // Re-apply keeps the same identity (key persisted).
  assert.equal(applyBrowserSetup(plan).extension_id,id);
  const u=uninstallBrowserSetup(plan);
  assert.equal(existsSync(plan.registration.path),false);
  assert.equal(existsSync(plan.extensionDir),false);
  assert.equal(existsSync(plan.keyPath),true,'dev key kept so the ID stays stable');
  assert.equal(u.track_a_touched,false);
});

test('Windows plan registers exactly the dev host key under HKCU, then removes only that key',()=>{
  const calls=[],stateDir=join(tmp(),'track-b');
  const plan=planBrowserSetup({stateDir,platform:'win32',nodeExe:'C:\\Program Files\\nodejs\\node.exe'});
  assert.equal(plan.registration.key,'HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.aion.relay.dev');
  const reg=new Map();
  const run=(cmd,args)=>{
    calls.push([cmd,...args]);
    if(cmd!=='reg')throw Error('unexpected process');
    if(args[0]==='query'){
      if(!reg.has(args[1]))return {status:1,stdout:'',stderr:'not found'};
      return {status:0,stdout:'    (Default)    REG_SZ    '+reg.get(args[1])};
    }
    if(args[0]==='add'){reg.set(args[1],args[args.indexOf('/d')+1]);return {status:0};}
    if(args[0]==='delete'){reg.delete(args[1]);return {status:0};}
    throw Error('unexpected reg command');
  };
  const receipt=applyBrowserSetup(plan,{run});
  assert.equal(receipt.host,'com.aion.relay.dev');
  assert.ok(calls.some(c=>c[1]==='add'&&c[2]===REGISTRY_KEY));
  assert.ok(!calls.some(c=>c.some(a=>a==='HKCU\\\\Software\\\\Google\\\\Chrome\\\\NativeMessagingHosts\\\\com.aion.relay')),'never Track A');
  const cmd=readFileSync(plan.launcher,'utf8');
  assert.ok(cmd.includes('aion-host-dev.mjs" --config "'),'native launcher must pass the config');
  uninstallBrowserSetup(plan,{run});
  assert.equal(reg.has(REGISTRY_KEY),false);
  assert.ok(calls.some(c=>c[1]==='delete'&&c[2]===REGISTRY_KEY));
});

test('built dev worker module graph loads and opens the dev port with a hello',async()=>{
  const stateDir=join(tmp(),'track-b');
  const plan=planBrowserSetup({stateDir,platform:'linux',userHostDir:join(tmp(),'nm')});
  applyBrowserSetup(plan);
  const posted=[];const ev=()=>({addListener(){}});
  globalThis.chrome={runtime:{id:'x',connectNative(name){posted.push({name});
    return {postMessage:m=>posted.push(m),onMessage:ev(),onDisconnect:ev()};},
    onMessage:ev(),onStartup:ev(),onInstalled:ev(),getManifest:()=>({version:'0'})}};
  try{await import(pathToFileURL(join(plan.extensionDir,'src','dev','dev-worker.js')).href);}
  finally{delete globalThis.chrome;}
  assert.deepEqual(posted.slice(0,2),[{name:'com.aion.relay.dev'},{type:'aion.b.hello'}]);
});

test('generated launcher starts the host exactly as Chrome would and refuses a foreign origin',async()=>{
  const stateDir=join(tmp(),'track-b');
  const plan=planBrowserSetup({stateDir,platform:'linux',userHostDir:join(tmp(),'nm')});
  const {extension_id}=applyBrowserSetup(plan);
  const launch=origin=>spawn(plan.launcher,[`chrome-extension://${origin}/`],{stdio:['pipe','pipe','pipe']});
  const good=launch(extension_id);let ready=null;
  const dec=createNativeFrameDecoder({onMessage:m=>{if(m.type==='aion.b.ready')ready=m;}});
  good.stdout.on('data',c=>dec.push(c));
  good.stdin.write(encodeNativeFrame({type:'aion.b.hello'}));
  for(let i=0;i<300&&!ready;i++)await new Promise(r=>setTimeout(r,10));
  assert.ok(ready?.session_id,'host ready via generated launcher');
  good.stdin.end();assert.equal(await new Promise(r=>good.once('exit',r)),0);
  const bad=launch('cccccccccccccccccccccccccccccccc');
  bad.stdin.end();
  assert.equal(await new Promise(r=>bad.once('exit',r)),1,'foreign origin refused');
});
