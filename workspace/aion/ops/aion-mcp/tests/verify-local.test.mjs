import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {probe} from '../bin/verify-local.mjs';

function fixture(){
  const root=mkdtempSync(join(tmpdir(),'aion-smoke-'));
  const base=join(root,'workspace/aion');
  mkdirSync(join(base,'sessions/01-escape-hatch/adapter'),{recursive:true});
  writeFileSync(join(base,'STATE.json'),JSON.stringify({m1_verified:false,current_phase:'MOCK',top_secret:'NOT_FOR_TOOL_OUTPUT'}));
  return root;
}
test('live MCP subprocess smoke verifies 6 independent checks without secrets or writes',async()=>{
  const root=fixture();
  try {
    const out=await probe({root,server:resolve(import.meta.dirname,'../src/server.mjs')});
    assert.equal(out.result,'PASS');assert.equal(out.checked_count,6);
    assert.deepEqual(Object.values(out.checks),Array(6).fill(true));
    assert.doesNotMatch(JSON.stringify(out),/NOT_FOR_TOOL_OUTPUT|top_secret/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
