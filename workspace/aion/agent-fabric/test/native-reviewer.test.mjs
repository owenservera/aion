import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const path=new URL('../fixtures/opencode-v2-aion-reviewer.expected.md',import.meta.url);
const doc=readFileSync(path,'utf8');
test('golden V2 reviewer has subagent mode, bounded steps and no legacy V1 fields',()=>{
 const match=doc.match(/^---\n([\s\S]*?)\n---\n/);
 assert.ok(match,'expected YAML frontmatter');
 const yaml=match[1];
 assert.match(yaml,/^mode:\s+subagent$/m);
 assert.match(yaml,/^steps:\s+12$/m);
 for(const key of ['permission','prompt','maxSteps','tools','disable','bash','task'])
   assert.doesNotMatch(yaml,new RegExp('^'+key+':','m'));
});
test('V2 reviewer deny-all precedes read-only allow exceptions',()=>{
 const deny=doc.indexOf('action: "*"'),read=doc.indexOf('action: read'),
   glob=doc.indexOf('action: glob'),grep=doc.indexOf('action: grep');
 assert.ok(deny>=0&&deny<read&&read<glob&&glob<grep);
 assert.equal((doc.match(/effect: deny/g)||[]).length,1);
 assert.equal((doc.match(/effect: allow/g)||[]).length,3);
 for(const forbidden of ['action: shell','action: edit','action: external_directory','action: subagent'])
  assert.equal(doc.includes(forbidden),false,'broad deny handles '+forbidden);
});
test('golden file is fixture only; it is not a live .opencode agent',()=>{
 assert.match(path.pathname,/\/fixtures\//);
 assert.match(doc,/UNKNOWN/);
});
