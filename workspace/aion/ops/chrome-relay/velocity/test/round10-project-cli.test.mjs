import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {main} from '../bin/aion-local.mjs';
import {loadAgentContext} from '../src/agents-context.mjs';
import {readRoleCatalog} from '../src/local-runtime.mjs';
import * as project from '../src/project-context.mjs';

const NOW='2026-10-20T12:00:00Z';
function fixture(t,{repo='https://github.com/example/hq',source='gh:hq',extra=[],name='HQ'}={}){
  const root=mkdtempSync(join(tmpdir(),'aion-project-cli-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(join(root,'config'));mkdirSync(join(root,'out'));
  const write=(path,data)=>writeFileSync(join(root,path),JSON.stringify(data));
  write('config/projects.json',{projects:[{project_id:'hq',name,repo_url:repo,source_ids:[source,...extra]}]});
  write('config/sources.json',{sources:[{project_id:'hq',source_id:source,freshness_threshold_hours:48}]});
  write('out/current.json',{generated_at:NOW,projects:[{project_id:'hq',newest_evidence:{source_id:source,date:NOW},source_health:[{source_id:source,reported_date:NOW}]}]});
  return {root,write};
}
async function invoke(args){
  const lines=[];
  const exit=await main(['context',...args],{print:s=>lines.push(s),open:()=>{throw Error('preview must not open Bus');}});
  assert.equal(lines.length,1);
  return {exit,out:JSON.parse(lines[0])};
}

test('project preview accepts explicit flags in either order without opening Bus',async t=>{
  const {root}=fixture(t);
  for(const flags of [['--project','hq','--pm-root',root,'--scope','brief'],['--scope','brief','--pm-root',root,'--project','hq']]){
    const {exit,out}=await invoke(['chief',...flags]);
    assert.equal(exit,0);assert.equal(out.schema,'aion.agent-context/1');
    const {project:pm,...role}=out;
    assert.deepEqual(role,loadAgentContext(readRoleCatalog(),'chief',{scope:'brief'}));
    assert.equal(pm.schema,'aion.project-context/1');assert.equal(pm.project_id,'hq');
    assert.equal(pm.registry.name,'HQ');
  }
});
test('project preview refuses unknown projects and unknown agent aliases',async t=>{
  const {root}=fixture(t);
  assert.deepEqual(await invoke(['chief','--project','nope','--pm-root',root]),{exit:3,out:{ok:false,code:'PM_PROJECT_UNKNOWN'}});
  assert.notEqual((await invoke(['not-a-role','--project','hq','--pm-root',root])).exit,0);
});
test('context rejects malformed, duplicate and unrelated flags',async t=>{
  const {root}=fixture(t);
  for(const args of [[],['chief','--project'],['chief','--project',''],['chief','--project','--scope','brief'],
    ['chief','--project','hq','--project','hq'],['chief','--scope','brief','--scope','brief'],
    ['chief','--project','hq','--pm-root',root,'--pm-root',root],['chief','--pm-root',root],
    ['chief','--wat','hq'],['chief','--project','hq','extra'],['chief','--scope','invalid'],
    ['chief','--project','hq','--scope','both'],['chief','--project','hq','--pm-root']]){
    const {exit,out}=await invoke(args);assert.equal(exit,2,JSON.stringify(args));assert.equal(out.code,'BAD_COMMAND');
  }
});
test('ordinary context defaults and explicit brief are unchanged',async()=>{
  for(const scope of [undefined,'brief','bootstrap','sitrep','both']){
    const {exit,out}=await invoke(['chief',...(scope?['--scope',scope]:[])]);
    assert.equal(exit,0);assert.deepEqual(out,loadAgentContext(readRoleCatalog(),'chief',{scope:scope??'both'}));
  }
});
test('default PM root is a repository sibling independent of cwd',async t=>{
  const expected=fileURLToPath(new URL('../../../../../../../001.PROJECTS.PM/',import.meta.url));
  assert.equal(resolve(project.DEFAULT_PM_ROOT),resolve(expected));
  const {root}=fixture(t);const before=process.cwd();
  try{
    process.chdir(root);
    let code;
    try{project.loadProjectContext({pmRoot:expected,projectId:'unregistered-cli-fixture'});}catch(error){code=error.code;}
    const {exit,out}=await invoke(['chief','--project','unregistered-cli-fixture']);
    assert.equal(exit,3);assert.equal(out.code,code);
  }finally{process.chdir(before);}
});
test('source registry union and newest evidence redact paths and github_pat tokens',t=>{
  const token='github_pat_'+ 'A'.repeat(32);const source='C:\\private\\'+token;
  const {root,write}=fixture(t,{source:'gh:hq'});
  write('config/sources.json',{sources:[{project_id:'hq',source_id:source}]});
  write('out/current.json',{projects:[{project_id:'hq',newest_evidence:{source_id:source,date:'C:\\private\\date'},source_health:[]}]});
  const ctx=project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW});
  assert.doesNotMatch(JSON.stringify(ctx),/C:\\\\private|github_pat_/);
  assert.ok(ctx.sources.some(row=>/redacted/.test(row.source_id)));
  assert.equal(ctx.status.newest_evidence.date,null);
});
test('repository URLs emit only clean allowlisted HTTPS repository references',t=>{
  for(const [repo,expected] of [
    ['https://user:password@github.com/example/hq?token=secret#private','https://github.com/example/hq'],
    ['https://gitlab.com/example/hq.git','https://gitlab.com/example/hq.git'],
    ['file:///C:/private/hq',null],['http://github.com/example/hq',null],['not a URL',null],
    ['https://localhost/example/hq',null],['https://127.0.0.1/example/hq',null],
    ['https://evil.example/example/hq',null],['https://github.com/example/hq/issues/1',null],
    ['https://github.com/example/github_pat_'+ 'A'.repeat(32),null]
  ]){
    const {root}=fixture(t,{repo});
    assert.equal(project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW}).registry.repo_url,expected);
  }
});
test('standalone github_pat source identifiers are scrubbed without losing health lookup',t=>{
  const source='github_pat_'+ 'Z'.repeat(32);
  const {root}=fixture(t,{source});
  const ctx=project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW});
  assert.doesNotMatch(JSON.stringify(ctx),/github_pat_/);
  assert.deepEqual(ctx.registry.source_ids,['[redacted-token]']);
  assert.equal(ctx.sources[0].source_id,'[redacted-token]');
  assert.equal(ctx.sources[0].freshness,'fresh');
  assert.equal(ctx.status.newest_evidence.source_id,'[redacted-token]');
});
test('oversized fields refuse rather than silently clipping',t=>{
  for(const fields of [{name:'x'.repeat(401)},{source:'x'.repeat(401)},{repo:'https://github.com/example/'+'x'.repeat(401)}]){
    const {root}=fixture(t,fields);
    assert.throws(()=>project.loadProjectContext({pmRoot:root,projectId:'hq'}),{code:'PM_FIELD_TOO_LARGE'});
  }
});
test('fresh plus unknown sources never reports fully fresh',t=>{
  const {root}=fixture(t,{extra:['missing:hq']});
  const ctx=project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW});
  assert.equal(ctx.status.freshness.sources_fresh,1);assert.equal(ctx.status.freshness.sources_unknown,1);
  assert.equal(ctx.status.freshness.label,'unknown');
});
test('combined project preview defaults to explicit role excerpts with stale and unknown provenance',async t=>{
  const {root,write}=fixture(t,{extra:['unknown:hq']});
  write('out/current.json',{generated_at:'2020-01-01T00:00:00Z',projects:[{project_id:'hq',
    source_health:[{source_id:'gh:hq',reported_date:'2020-01-01T00:00:00Z'}]}]});
  const {exit,out}=await invoke(['chief','--project','hq','--pm-root',root]);
  assert.equal(exit,0);
  const {project:pm,...role}=out;
   assert.deepEqual(role,loadAgentContext(readRoleCatalog(),'chief',{scope:'brief'}));
   assert.ok(role.files.every(f=>f.excerpt===true&&f.omitted_chars>0));
  assert.equal(pm.status.freshness.label,'stale');
  assert.equal(pm.status.freshness.sources_unknown,1);
  assert.equal(pm.provenance.files.length,3);
  assert.ok(pm.provenance.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256)));
});
test('combined send helper preserves role, stale/unknown evidence and both provenances',t=>{
  const {root,write}=fixture(t,{extra:['unknown:hq']});
  write('out/current.json',{projects:[{project_id:'hq',source_health:[
    {source_id:'gh:hq',reported_date:'2020-01-01T00:00:00Z'}]}]});
  const pm=project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW});
  const role={files:[{kind:'bootstrap',path:'role/BOOTSTRAP.md',sha256:'a'.repeat(64),text:'Role mission'}]};
  const prompt=project.composeProjectAgentPrompt('Check status',{...role,project:pm});
  assert.ok(prompt.length<=2000);
  for(const expected of ['Role mission','freshness=stale','1 stale/1 unknown','unknown:hq',
    'role/BOOTSTRAP.md','sha256:'+'a'.repeat(64),'Provenance: config/projects.json sha256:',
    pm.provenance.files[0].sha256.slice(0,16),'USER REQUEST:\nCheck status']){
    assert.ok(prompt.includes(expected),expected);
  }
});
test('combined send helper refuses the final aggregate budget without shortening either source',t=>{
  const {root}=fixture(t);
  const pm=project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW});
  const context={...loadAgentContext(readRoleCatalog(),'chief',{scope:'brief'}),project:pm};
  const before=JSON.stringify(context);
  assert.throws(()=>project.composeProjectAgentPrompt('x'.repeat(2000),context),{code:'CONTEXT_EXCEEDS_SEND_LIMIT'});
  assert.equal(JSON.stringify(context),before);
  assert.throws(()=>project.composeProjectAgentPrompt('check',context,{limit:2001}),{code:'PROJECT_CONTEXT_INVALID'});
  assert.throws(()=>project.composeProjectAgentPrompt('check',{files:context.files}),{code:'PROJECT_CONTEXT_INVALID'});
  const compact={files:[{kind:'bootstrap',path:'role.md',sha256:'b'.repeat(64),text:'Role'}],project:pm};
  const base=project.composeProjectAgentPrompt('x',compact);
  const request='x'.repeat(2000-base.length+1);
  assert.equal(project.composeProjectAgentPrompt(request,compact).length,2000);
  assert.throws(()=>project.composeProjectAgentPrompt(request+'x',compact),{code:'CONTEXT_EXCEEDS_SEND_LIMIT'});
});
test('actual Chief brief plus fixture PM fits a short request without nested project banners',t=>{
  const {root}=fixture(t);
  const context={...loadAgentContext(readRoleCatalog(),'chief',{scope:'brief'}),
    project:project.loadProjectContext({pmRoot:root,projectId:'hq',now:NOW})};
  const before=JSON.stringify(context);
  const prompt=project.composeProjectAgentPrompt('Give me a status report',context);
  assert.ok(prompt.length<=2000);
  for(const file of context.files){assert.ok(prompt.includes(file.text.trim()));assert.ok(prompt.includes(file.sha256));}
  assert.match(prompt,/AION PROJECT EXCERPT \(not full document\)/);
  assert.doesNotMatch(prompt,/AION PROJECT CONTEXT EXCERPT|all \d+ sections shown/);
  assert.match(prompt,/Registry:/);assert.match(prompt,/Evidence:/);assert.match(prompt,/Sources:/);
  assert.match(prompt,/report=generated/);assert.match(prompt,/Provenance:/);
  assert.equal(JSON.stringify(context),before);
});
test('actual local Chief and PM hq preview fits a short request without egress',t=>{
  if(!existsSync(project.DEFAULT_PM_ROOT)){t.skip('local PM checkout absent');return;}
  const context={...loadAgentContext(readRoleCatalog(),'chief',{scope:'brief'}),
    project:project.loadProjectContext({pmRoot:project.DEFAULT_PM_ROOT,projectId:'hq'})};
  const before=JSON.stringify(context);
  const prompt=project.composeProjectAgentPrompt('Give me a status report',context);
  assert.ok(prompt.length<=2000);
  for(const file of context.files)assert.ok(prompt.includes(file.text.trim()));
  for(const source of context.project.sources)assert.ok(prompt.includes(source.source_id));
  for(const file of context.project.provenance.files){
    assert.ok(prompt.includes(file.path));assert.ok(prompt.includes(file.sha256.slice(0,16)));assert.ok(prompt.includes(file.mtime));
  }
  assert.equal(JSON.stringify(context),before);
});
