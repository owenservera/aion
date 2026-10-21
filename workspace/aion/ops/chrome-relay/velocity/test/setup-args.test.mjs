import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEngineSetup} from '../src/setup-args.mjs';
test('explicit one-time scoped engine setup',()=>{
 assert.deepEqual(parseEngineSetup(['connect','opencode','--cwd','C:/repo','--max','5','--hours','12']),{engine:'opencode',cwd:'C:/repo',max:5,hours:12});
});
test('cannot create unbounded hidden or unscoped grant',()=>{
 for(const v of [ ['connect','opencode'],['connect','opencode','--cwd','C:/repo','--max','999'],['connect','opencode','--cwd','C:/repo','--hours','0'],['connect','opencode','--cwd','C:/repo','--cwd','C:/other'] ])assert.throws(()=>parseEngineSetup(v));
});

test('explicit ACP selection is not a silent engine fallback',()=>{
 const setup=parseEngineSetup(['connect','acp','--cwd','C:/repo']);
 assert.equal(setup.engine,'acp');
 assert.equal(setup.max,10);
});
