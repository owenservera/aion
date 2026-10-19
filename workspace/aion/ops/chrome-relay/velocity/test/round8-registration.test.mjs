import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
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
