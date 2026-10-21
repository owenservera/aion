import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRoles, buildPreflight } from '../bin/preflight.mjs';

const role=id=>({id,aliases:[id,'role-'+id]});
test('9 designed role folders vs 8 launcher entries reports role 09 absent, never live',()=>{
 const catalog={roles:Array.from({length:8},(_,i)=>role(String(i+1).padStart(2,'0')))};
 const dirs=Array.from({length:9},(_,i)=>String(i+1).padStart(2,'0')+'-work');
 const result=inspectRoles({catalog,dirs});
 assert.equal(result.launcher_count,8);
 assert.equal(result.designed_count,9);
 assert.deepEqual(result.discrepancies.map(x=>[x.id,x.state]),[['09','DESIGNED_UNREGISTERED']]);
 assert.ok(result.roles.every(x=>x.live_session==='UNKNOWN'));
});
test('wrong/missing folders do not create a phantom runtime session',()=>{
 const result=inspectRoles({catalog:{roles:[role('01'),role('02')]},dirs:['01-existing']});
 assert.deepEqual(result.discrepancies.map(x=>[x.id,x.state]),[['02','LAUNCHER_WITHOUT_ROLE_FOLDER']]);
 assert.ok(result.discrepancies.every(x=>x.binding==='NOT_CHECKED_BY_DESIGN_PREFLIGHT'));
});
test('duplicate alias and duplicate role ID fail before any routing',()=>{
 assert.throws(()=>inspectRoles({catalog:{roles:[role('01'),{id:'02',aliases:['role-01']}]},dirs:[]}),/DUPLICATE_ROLE_ALIAS/);
 assert.throws(()=>inspectRoles({catalog:{roles:[role('01'),role('01')]},dirs:[]}),/DUPLICATE_ROLE_ID/);
});
test('preflight does not pretend binary presence means model/auth readiness',()=>{
 const report=buildPreflight({catalog:{roles:[role('01')]},roleDirs:['01-existing'],
   toolProbe:()=>({state:'PRESENT_NOT_AUTHENTICATED',reported_version:'2.0.32'}),
   gitProbe:()=>({state:'PRESENT_NOT_AUTHENTICATED',reported_version:'fakehash'})});
 assert.equal(report.engines.opencode.state,'PRESENT_NOT_AUTHENTICATED');
 assert.equal(report.localhost_connected,'UNKNOWN');
 assert.equal(report.verified_live_send,false);
 assert.equal(report.execution,'LOCAL_READ_ONLY');
});
