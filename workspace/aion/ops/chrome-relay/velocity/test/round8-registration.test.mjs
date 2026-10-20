import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseRegistryValue,queryDevRegistration,verifyOwnedRegistration} from '../src/browser/registration.mjs';
import {planBrowserSetup,applyBrowserSetup,uninstallBrowserSetup,REGISTRY_KEY} from '../src/browser/setup.mjs';

const DEV='b'.repeat(32);
const tmp=()=>mkdtempSync(join(tmpdir(),'aion-reg8-'));
function nativeRun({initial=null}={}){
  let current=initial;const calls=[];
  const run=(program,args)=>{
    assert.equal(program,'reg');
    calls.push(args.slice());
    if(args[0]==='query')return current===null?{status:1,stdout:''}:
      {status:0,stdout:'    (Default)    REG_SZ    '+current};
    if(args[0]==='add'){current=args[args.indexOf('/d')+1];return {status:0};}
    if(args[0]==='delete'){current=null;return {status:0};}
    throw Error('unexpected registry action');
  };
  return {run,calls,get current(){return current},set current(x){current=x}};
}
test('registry parsing refuses ambiguous, malformed and expandable values',()=>{
 assert.equal(parseRegistryValue('    (Default)    REG_SZ    C:\\AION\\dev.json'), 'C:\\AION\\dev.json');
 for(const s of ['','no values','REG_EXPAND_SZ C:\\unsafe','REG_SZ good\nREG_SZ duplicate']){
   assert.throws(()=>parseRegistryValue(s),{code:'REGISTRY_QUERY_UNREADABLE'});
 }
});
test('a foreign per-user dev-host registration is NEVER overwritten',()=>{
 const plan=planBrowserSetup({stateDir:join(tmp(),'owner'),platform:'win32'});
 const reg=nativeRun({initial:'C:\\Unrelated\\native-host.json'});
 assert.throws(()=>applyBrowserSetup(plan,{run:reg.run}),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.equal(reg.current,'C:\\Unrelated\\native-host.json');
 assert.equal(reg.calls.some(c=>c[0]==='add'),false);
 assert.equal(REGISTRY_KEY.endsWith('com.aion.relay.dev'),true);
});
test('owned Windows registration may be re-applied and uninstalled; key persists',()=>{
 const plan=planBrowserSetup({stateDir:join(tmp(),'owner'),platform:'win32'});
 const reg=nativeRun();
 const first=applyBrowserSetup(plan,{run:reg.run});
 assert.equal(reg.current,plan.hostManifest);
 assert.equal(verifyOwnedRegistration(plan,{run:reg.run,expectedId:first.extension_id}).owned,true);
 assert.equal(applyBrowserSetup(plan,{run:reg.run}).extension_id,first.extension_id);
 const removed=uninstallBrowserSetup(plan,{run:reg.run});
 assert.equal(reg.current,null);
 assert.equal(removed.track_a_touched,false);
 assert.equal(existsSync(plan.keyPath),true);
});
test('tampered registered manifest is never overwritten or uninstalled',()=>{
 const plan=planBrowserSetup({stateDir:join(tmp(),'owner'),platform:'win32'});
 const reg=nativeRun();
 applyBrowserSetup(plan,{run:reg.run});
 const bad=JSON.parse(readFileSync(plan.hostManifest,'utf8'));
 bad.allowed_origins=['chrome-extension://'+('c'.repeat(32))+'/'];
 writeFileSync(plan.hostManifest,JSON.stringify(bad));
 const calls=reg.calls.length;
 assert.throws(()=>applyBrowserSetup(plan,{run:reg.run}),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.throws(()=>uninstallBrowserSetup(plan,{run:reg.run}),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.equal(reg.calls.slice(calls).some(c=>c[0]==='delete'||c[0]==='add'),false);
 assert.equal(reg.current,plan.hostManifest);
});
test('missing ownership receipt cannot remove installed native host',()=>{
 const plan=planBrowserSetup({stateDir:join(tmp(),'owner'),platform:'win32'});
 const reg=nativeRun();
 applyBrowserSetup(plan,{run:reg.run});
 writeFileSync(plan.receipt,'{}');
 assert.throws(()=>uninstallBrowserSetup(plan,{run:reg.run}),{code:'OWNERSHIP_RECEIPT_MISMATCH'});
 assert.equal(reg.current,plan.hostManifest);
});
test('unrecognized registration query is an error, not a safe overwrite',()=>{
 const plan=planBrowserSetup({stateDir:join(tmp(),'owner'),platform:'win32'});
 const run=(_program,args)=>args.includes('/ve')?{status:0,stdout:'unrecognized value'}:{status:0};
 assert.throws(()=>queryDevRegistration(plan,{run}),{code:'REGISTRY_QUERY_UNREADABLE'});
});

// --- file registration (Linux/macOS): the registered artifact is a COPY of
// the owned source manifest, so BOTH files must be exactly our dev manifest.
function filePlan(){
 const root=tmp();
 return planBrowserSetup({stateDir:join(root,'owner'),platform:'linux',
   userHostDir:join(root,'NativeMessagingHosts')});
}
test('an owned file registration may be re-applied and uninstalled',()=>{
 const plan=filePlan();
 const first=applyBrowserSetup(plan);
 assert.equal(verifyOwnedRegistration(plan,{expectedId:first.extension_id}).owned,true);
 assert.equal(applyBrowserSetup(plan).extension_id,first.extension_id,'re-apply keeps the identity');
 const registered=JSON.parse(readFileSync(plan.registration.path,'utf8'));
 const source=JSON.parse(readFileSync(plan.hostManifest,'utf8'));
 assert.deepEqual(registered,source,'the installed copy is the owned source manifest');
 const removed=uninstallBrowserSetup(plan);
 assert.equal(existsSync(plan.registration.path),false);
 assert.equal(removed.track_a_touched,false);
 assert.equal(existsSync(plan.keyPath),true,'dev key kept so the ID stays stable');
});
test('a foreign file registration is never overwritten',()=>{
 const plan=filePlan();
 mkdirSync(join(plan.registration.path,'..'),{recursive:true});
 const foreign={name:'com.aion.relay.dev',type:'stdio',path:'/opt/somebody-else/host',
   allowed_origins:['chrome-extension://'+('d'.repeat(32))+'/']};
 writeFileSync(plan.registration.path,JSON.stringify(foreign));
 assert.throws(()=>applyBrowserSetup(plan),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.deepEqual(JSON.parse(readFileSync(plan.registration.path,'utf8')),foreign,'foreign file untouched');
 assert.equal(existsSync(plan.hostManifest),false,'no owned manifest was written');
 assert.equal(existsSync(plan.extensionDir),false,'nothing was installed');
});
test('a tampered registered copy is refused even when the owned source is intact',()=>{
 const plan=filePlan();
 const first=applyBrowserSetup(plan);
 const registered=JSON.parse(readFileSync(plan.registration.path,'utf8'));
 registered.allowed_origins=['chrome-extension://'+('c'.repeat(32))+'/'];
 writeFileSync(plan.registration.path,JSON.stringify(registered));
 assert.throws(()=>verifyOwnedRegistration(plan,{expectedId:first.extension_id}),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.throws(()=>applyBrowserSetup(plan),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.throws(()=>uninstallBrowserSetup(plan),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.deepEqual(JSON.parse(readFileSync(plan.registration.path,'utf8')),registered,'forged copy not rewritten');
});
test('a tampered owned source manifest is refused even when the registered copy is intact',()=>{
 const plan=filePlan();
 const first=applyBrowserSetup(plan);
 const source=JSON.parse(readFileSync(plan.hostManifest,'utf8'));
 source.allowed_origins=['chrome-extension://'+('e'.repeat(32))+'/'];
 writeFileSync(plan.hostManifest,JSON.stringify(source));
 assert.throws(()=>verifyOwnedRegistration(plan,{expectedId:first.extension_id}),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.throws(()=>applyBrowserSetup(plan),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.throws(()=>uninstallBrowserSetup(plan),{code:'FOREIGN_DEV_REGISTRATION'});
 assert.equal(JSON.parse(readFileSync(plan.registration.path,'utf8')).allowed_origins[0],
   `chrome-extension://${first.extension_id}/`,'registered copy untouched');
});
