import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {listAgents,loadAgentContext,composeAgentPrompt} from '../src/agents-context.mjs';
import {parseCommand} from '../src/commands.mjs';
const catalog={roles:[{id:'05',code:'COC',purpose:'Chief of Chiefs',
 aliases:['05','chief','coc'],bootstrap_path:'roles/05/BOOTSTRAP.md',
 sitrep_path:'roles/05/SITREP.md'}]};
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'aion-b9-'));
 const dir=join(root,'roles','05');mkdirSync(dir,{recursive:true});
 writeFileSync(join(dir,'BOOTSTRAP.md'),'# Mission\nOwn executive priorities and communicate status.\n');
 writeFileSync(join(dir,'SITREP.md'),'# Current status\n'+('Task queue and evidence. '.repeat(120)));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 return root;
}
test('agents are projected from existing catalogue, not a new registry',()=>{
 const a=listAgents(catalog,{'role-05':{agent_id:'role-05',kind:'conversation',
   role_id:'05',status:'bound',binding:{adapter:'chatgpt'}}});
 assert.equal(a.length,1);assert.equal(a[0].alias,'chief');assert.equal(a[0].status,'BOUND');
 assert.equal(listAgents(catalog,{} )[0].status,'UNBOUND');
});
test('context has exact file provenance and never changes source text',t=>{
 const c=loadAgentContext(catalog,'chief',{root:fixture(t)});
 assert.equal(c.files.length,2);assert.equal(c.files[0].kind,'bootstrap');
 assert.match(c.files[0].text,/Own executive priorities/);
 assert.match(c.files[0].sha256,/^[a-f0-9]{64}$/);
});
test('brief context is explicit, bounded, with omission and provenance disclosed',t=>{
 const c=loadAgentContext(catalog,'chief',{root:fixture(t),scope:'brief'});
 assert.equal(c.files.length,2);
 assert.equal(c.files.every(f=>f.excerpt===true),true);
 assert.equal(c.files[1].omitted_chars>0,true);
 const msg=composeAgentPrompt('Give a status report',c);
 assert.match(msg,/EXCERPT \(not full document\)/);
 assert.match(msg,/USER REQUEST:/);
 assert.equal(msg.length<=2000,true);
});
test('full documents never silently truncate to fit send',t=>{
 const c=loadAgentContext(catalog,'chief',{root:fixture(t),scope:'both'});
 assert.throws(()=>composeAgentPrompt('Hello',c),{code:'CONTEXT_EXCEEDS_SEND_LIMIT'});
});
test('unknown roles and directory traversal refuse before read',t=>{
 const root=fixture(t);
 assert.throws(()=>loadAgentContext(catalog,'unknown',{root}),{code:'AGENT_UNKNOWN'});
 const malicious={roles:[{...catalog.roles[0],bootstrap_path:'../secret.md'}]};
 assert.throws(()=>loadAgentContext(malicious,'chief',{root,scope:'bootstrap'}),{code:'CONTEXT_PATH_INVALID'});
});
test('explicit --context grammar and default never attach',()=>{
 assert.equal(parseCommand(['send','chief','hello']).context,undefined);
 assert.equal(parseCommand(['send','chief','hello','--context','brief']).context,'brief');
 assert.equal(parseCommand(['send','chief','hello','--context','bootstrap']).context,'bootstrap');
 assert.throws(()=>parseCommand(['status','--context','brief']));
 assert.throws(()=>parseCommand(['send','chief','hello','--context','bogus']));
});
