import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCommand} from '../src/commands.mjs';
import {main as brokerMain} from '../bin/aion.mjs';
import {main} from '../bin/aion-local.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {REPO_ROOT,loadAgentContext} from '../src/agents-context.mjs';
import {loadProjectContext,composeProjectAgentPrompt} from '../src/project-context.mjs';
import {CHATGPT_ADAPTER} from '../../extension/src/bus/adapters/chatgpt.js';

test('project grammar is explicit, separate from native options, and optional',()=>{
  const parsed=parseCommand(['send','chief','review','--context','brief','--project','aion',
    '--pm-root','C:/Projects PM']);
  assert.deepEqual(parsed,{command:'send',alias:'chief',text:'review',json:false,
    context:'brief',project:'aion',pm_root:'C:/Projects PM'});
  assert.equal(Object.hasOwn(parsed,'send_options'),false);
  assert.deepEqual(parseCommand(['send','chief','review']),{command:'send',alias:'chief',text:'review',json:false});
  assert.equal(parseCommand(['send','chief','review','--context','brief','--project','aion']).project,'aion');
});
test('project options never apply without context, to executors or to other commands',()=>{
  for(const argv of [
    ['send','chief','review','--project','aion'],
    ['send','chief','review','--pm-root','C:/PM'],
    ['send','chief','review','--context','brief','--pm-root','C:/PM'],
    ['send','opencode','review','--context','brief','--project','aion'],
    ['send','chief','review','--context','brief','--project','aion','--agent','builder'],
    ['send','chief','review','--context','both','--project','aion'],
    ['status','--context','brief','--project','aion'],
    ['send','chief','review','--context','brief','--project','../escape'],
    ['send','chief','review','--context','brief','--project','aion','--project','other'],
    ['send','chief','review','--context','brief','--project','aion','--pm-root','C:/PM','--pm-root','D:/PM'],
    ['send','chief','review','--context','brief','--project'],
    ['send','chief','review','--context','brief','--project','aion','--pm-root','bad\npath']
  ]) assert.throws(()=>parseCommand(argv),JSON.stringify(argv));
});
test('broker context/project route refuses before transport rather than dropping context',async()=>{
  let calls=0;const output=[];
  const exit=await brokerMain(['send','chief','review','--context','brief','--project','aion'],{
    socketPath:'fixture',write:x=>output.push(JSON.parse(x)),transport:async()=>{calls++;}
  });
  assert.equal(exit,2);assert.equal(calls,0);assert.equal(output[0].delivery,'NOT_SENT');
  assert.equal(output[0].code,'CONTEXT_REQUIRES_DIRECT_LOCAL_BUS');
});
test('explicit browser project send uses the shared composer; oversize/missing project never dispatch',async t=>{
  const root=mkdtempSync(join(REPO_ROOT,'.aion-context-test-'));
  const pm=mkdtempSync(join(tmpdir(),'aion-project-send-'));
  t.after(()=>{rmSync(root,{recursive:true,force:true});rmSync(pm,{recursive:true,force:true});});
  writeFileSync(join(root,'b.md'),'# Mission\nKeep evidence.');
  writeFileSync(join(root,'s.md'),'# Status\nReady.');
  mkdirSync(join(pm,'config'));
  writeFileSync(join(pm,'config','projects.json'),JSON.stringify({projects:[{project_id:'hq',name:'HQ'}]}));
  const path=p=>relative(REPO_ROOT,join(root,p)).replaceAll('\\','/');
  const roleCatalog={roles:[{id:'05',code:'COC',aliases:['chief'],bootstrap_path:path('b.md'),sitrep_path:path('s.md')}]};
  const agents={'role-05':{agent_id:'role-05',role_id:'05',kind:'conversation',status:'bound',revision:1,
    binding:{adapter:CHATGPT_ADAPTER,ref:'https://chatgpt.com/c/fixture',confirmed_by:'fixture'}}};
  let sends=0,sent,closed=0;const output=[];
  const rt={roleCatalog,browser:{ok:true},readyFor:async()=>true,close:async()=>{closed++;},
    bus:{store:{read:async()=>({agents})}},plane:{sendAlias:async p=>{sends++;sent=p;return {ok:false,code:'FIXTURE_CAPTURED'};}}};
  const invoke=(text='review',project='hq')=>main(['send','chief',text,'--context','brief','--project',project,'--pm-root',pm],
    {open:async()=>rt,print:x=>output.push(JSON.parse(x))});
  const context={...loadAgentContext(roleCatalog,'chief',{scope:'brief'}),project:loadProjectContext({pmRoot:pm,projectId:'hq'})};
  const expected=composeProjectAgentPrompt('review',context);
  await invoke();
  assert.equal(sends,1,JSON.stringify(output));assert.equal(sent.text,expected);assert.equal(sent.text.length<=2000,true);
  assert.match(sent.text,/project hq/);assert.equal(output.at(-1).code,'FIXTURE_CAPTURED');
  await invoke('x'.repeat(1900));
  assert.equal(sends,1);assert.equal(output.at(-1).code,'CONTEXT_EXCEEDS_SEND_LIMIT');assert.equal(output.at(-1).delivery,'NOT_SENT');
  await invoke('review','missing');
  assert.equal(sends,1);assert.equal(output.at(-1).delivery,'NOT_SENT');assert.equal(closed,3);
});
