import test from 'node:test';
import assert from 'node:assert/strict';
import { runLocalSelftest } from '../src/selftest.mjs';
const suites=[{name:'A',cwd:'/tmp',argv:['--test','a.test.mjs']},{name:'B',cwd:'/tmp',argv:['--test']}];
test('runs every suite without shell, no Actions or external network',()=>{
 let calls=0;
 const result=runLocalSelftest({suites,executor:(node,argv,opts)=>{calls++; assert.equal(opts.shell,false);assert.equal(opts.env.AION_OFFLINE_TEST,'1');return{status:0};}});
 assert.equal(calls,2);assert.equal(result.all_pass,true);assert.equal(result.tests_executed,true);
});
test('false result stays red even if subsequent suite passed',()=>{
 let calls=0;
 const result=runLocalSelftest({suites,executor:()=>({status:calls++===0?1:0})});
 assert.equal(result.all_pass,false);assert.equal(result.suites[0].state,'FAIL');
});
test('spawn failure is recorded, not mislabeled as passing',()=>{
 const result=runLocalSelftest({suites:suites.slice(0,1),executor:()=>{throw Object.assign(new Error('ENOENT'),{code:'ENOENT'});}});
 assert.equal(result.suites[0].error_code,'ENOENT');assert.equal(result.all_pass,false);
});
