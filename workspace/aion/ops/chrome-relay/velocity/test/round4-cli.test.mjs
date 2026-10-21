import test from 'node:test';
import assert from 'node:assert/strict';
import {main} from '../bin/aion.mjs';
test('client without broker refuses, sends nothing',async()=>{
 const lines=[];
 const code=await main(['send','chief','hello'],{socketPath:null,write:x=>lines.push(x)});
 assert.equal(code,3);
 assert.equal(JSON.parse(lines[0]).code,'RUNTIME_NOT_CONNECTED');
});
test('invalid flags refused before any transport',async()=>{
 const lines=[];const code=await main(['send','chief','hello','--live'],
   {socketPath:'/fake',write:x=>lines.push(x)});
 assert.equal(code,2);assert.equal(JSON.parse(lines[0]).code,'BAD_COMMAND');
});
