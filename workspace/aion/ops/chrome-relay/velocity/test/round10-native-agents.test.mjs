// Round 10 — native roster.
//
// The roster reports what ALREADY exists on this machine. It creates no
// registry, writes no config, installs nothing and sends nothing. These tests
// are mocked and hermetic, plus ONE bounded read-only smoke test against the
// real machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {listAgents} from '../src/agents-context.mjs';
import {discoverNativeAgents,authorizationFor} from '../src/native-agents.mjs';
import {main} from '../bin/aion-local.mjs';

const CATALOG={roles:[{id:'05',code:'COC',purpose:'Chief of Chiefs',aliases:['05','chief','coc'],
  bootstrap_path:'roles/05/BOOTSTRAP.md',sitrep_path:'roles/05/SITREP.md'}]};

function temp(t){
  const root=mkdtempSync(join(tmpdir(),'aion-native-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  return root;
}
/** Fake loopback service: only the routes the test declares exist. */
function fakeFetch(routes){
  return async(url)=>{
    for(const [suffix,body] of Object.entries(routes)){
      if(url.endsWith(suffix))
        return {ok:true,status:200,text:async()=>JSON.stringify(body)};
    }
    throw Object.assign(new Error('no route'),{code:'NO_ROUTE'});
  };
}
const fakeService=()=>({url:'http://127.0.0.1:4099',headers:{authorization:'Basic c2VjcmV0'},version:'2.0.32'});
const fakeClient=()=>({info:async()=>({version:'2.0.32',pid:1,urls:['http://127.0.0.1:4099']})});

function nativeTree(t,{roles=['09-global-research'],zcode=['dep-refs'],zbots=['bot-chief']}={}){
  const root=temp(t);
  const roots={};
  if(roles){
    roots.roles=join(root,'roles');
    for(const r of roles)mkdirSync(join(roots.roles,r),{recursive:true});
  }
  if(zcode){
    // The NATIVE global definitions live in <.zcode root>/agents/*.md with
    // name/description/model/thoughtLevel front matter.
    roots.zcode=join(root,'.zcode');
    const dir=join(roots.zcode,'agents');
    mkdirSync(dir,{recursive:true});
    for(const s of zcode)
      writeFileSync(join(dir,`${s}.md`),
        `---\nname: ${s}\ndescription: "native ${s} definition"\nmodel: codex-oauth/gpt-6.1-sol\nthoughtLevel: enabled\n---\n\n# ${s}\n`);
    // A project SKILL descriptor describes a skill, never an agent identity.
    const skillDir=join(roots.zcode,'.agents','skills','skill-only','agents');
    mkdirSync(skillDir,{recursive:true});
    writeFileSync(join(skillDir,'openai.yaml'),
      `interface:\n  display_name: "skill-only agent"\n  short_description: "a skill, not an agent"\n`);
    // Nothing outside a definition file may be read.
    writeFileSync(join(roots.zcode,'zbot.sqlite'),'PRIVATE DATABASE');
    writeFileSync(join(roots.zcode,'session-transcript.md'),'PRIVATE TRANSCRIPT');
  }
  if(zbots){
    roots.zbots=join(root,'zcode-bots');
    const dir=join(roots.zbots,'.zcode','agents');
    mkdirSync(dir,{recursive:true});
    for(const b of zbots)
      writeFileSync(join(dir,`${b}.md`),
        `---\nname: ${b}\ndescription: "does the work"\nmodel: opencode/free-model\n---\n\n# ${b}\n`);
    mkdirSync(join(roots.zbots,'.zcode','bots','inbox'),{recursive:true});
    writeFileSync(join(roots.zbots,'.zcode','bots','inbox','secret.md'),'PRIVATE MESSAGE');
    mkdirSync(join(roots.zbots,'.zbot'),{recursive:true});
    writeFileSync(join(roots.zbots,'.zbot','zbot.sqlite'),'PRIVATE DATABASE');
  }
  roots.opencodeConfig=join(root,'opencode-config');
  mkdirSync(roots.opencodeConfig,{recursive:true});
  return {root,roots};
}

// ------------------------------------------------------------- registry truth

test('catalogue is listed with an explicit UNKNOWN registry when the Bus cannot be read',()=>{
  const rows=listAgents(CATALOG,{},{registryStatus:'UNKNOWN',registryError:'STATE_ACL_UNVERIFIED'});
  assert.equal(rows.length,1);
  assert.equal(rows[0].status,'UNKNOWN');
  assert.equal(rows[0].registry_status,'UNKNOWN');
  assert.equal(rows[0].registry_error,'STATE_ACL_UNVERIFIED');
  assert.equal(rows[0].agent_id,null);
  assert.equal(rows[0].adapter,null);
  // The alias and context paths still resolve exactly as before.
  assert.equal(rows[0].alias,'chief');
  assert.equal(rows[0].bootstrap_path,'roles/05/BOOTSTRAP.md');
});
test('a readable registry keeps the previous bound/unbound projection',()=>{
  const bound=listAgents(CATALOG,{'role-05':{agent_id:'role-05',kind:'conversation',
    role_id:'05',status:'bound',binding:{adapter:'chatgpt'}}});
  assert.equal(bound[0].status,'BOUND');
  assert.equal(bound[0].registry_status,'AVAILABLE');
  assert.equal(bound[0].agent_id,'role-05');
  assert.equal(listAgents(CATALOG,{})[0].status,'UNBOUND');
});
const NOW='2026-10-20T10:00:00.000Z';
const LIVE_GRANT={'grant-1':{grant_id:'grant-1',agents:['opencode'],ops:['send'],max_count:3,used_count:0,
  rate_per_hour:3,expires_utc:'2026-10-21T10:00:00.000Z',revoked:false}};
function busRegistry(agent={}){
  return {status:'AVAILABLE',
    agents:{'opencode':{agent_id:'opencode',kind:'executor',status:'bound',revision:3,
      binding:{adapter:'opencode-v2',ref:'opencode',label:null,bound_utc:NOW,confirmed_by:'owner'},...agent}},
    grants:LIVE_GRANT};
}
test('authorisation needs an exact bound mapping, not a grant alone',()=>{
  const expected={adapter:'opencode-v2',ref:'opencode'};
  const ok=authorizationFor('opencode',{registry:busRegistry(),nowIso:NOW,
    busAgentId:'opencode',expected});
  assert.equal(ok.status,'AUTHORIZED');
  assert.equal(ok.reason,null);
  assert.equal(ok.binding_revision,3);
  // A grant alone is not enough: the agent must be bound.
  for(const status of ['paused','unbound']){
    const r=authorizationFor('opencode',{registry:busRegistry({status}),nowIso:NOW,
      busAgentId:'opencode',expected});
    assert.equal(r.status,'NOT_AUTHORIZED');
    assert.match(r.reason,/AGENT_NOT_BOUND/);
  }
  // The binding adapter must match THIS native source exactly.
  const wrongAdapter=authorizationFor('opencode',{registry:busRegistry(),nowIso:NOW,
    busAgentId:'opencode',expected:{adapter:'acp',ref:'opencode'}});
  assert.equal(wrongAdapter.status,'NOT_AUTHORIZED');
  assert.match(wrongAdapter.reason,/ADAPTER_MISMATCH/);
  // The binding ref must match too.
  const wrongRef=authorizationFor('opencode',{registry:busRegistry(),nowIso:NOW,
    busAgentId:'opencode',expected:{adapter:'opencode-v2',ref:'elsewhere'}});
  assert.equal(wrongRef.status,'NOT_AUTHORIZED');
  assert.match(wrongRef.reason,/REF_MISMATCH/);
  // A missing or invalid binding revision is not authorised.
  for(const revision of [0,'3',null]){
    const r=authorizationFor('opencode',{registry:busRegistry({revision}),nowIso:NOW,
      busAgentId:'opencode',expected});
    assert.equal(r.status,'NOT_AUTHORIZED');
    assert.match(r.reason,/BINDING_REVISION_INVALID/);
  }
  // A source with no adapter mapping can never be authorised.
  const unmapped=authorizationFor('opencode',{registry:busRegistry(),nowIso:NOW,expected:null});
  assert.equal(unmapped.status,'NOT_AUTHORIZED');
  assert.match(unmapped.reason,/NO_NATIVE_ADAPTER_MAPPING/);
  // No grant, no mapping, no registry.
  const expired={status:'AVAILABLE',agents:busRegistry().agents,
    grants:{'grant-1':{...LIVE_GRANT['grant-1'],expires_utc:'2026-10-19T10:00:00.000Z'}}};
  const noGrant=authorizationFor('opencode',{registry:expired,nowIso:NOW,busAgentId:'opencode',expected});
  assert.equal(noGrant.status,'NOT_AUTHORIZED');
  assert.match(noGrant.reason,/NO_LIVE_SEND_GRANT/);
  assert.equal(authorizationFor('nobody',{registry:busRegistry(),nowIso:NOW}).status,'UNREGISTERED');
  assert.equal(authorizationFor('opencode',{registry:null,nowIso:NOW}).status,'UNKNOWN');
});

// ------------------------------------------------------------ native roster

test('a live native service is reported as definition, connection and authorisation apart',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,
    env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,
    fetchImpl:fakeFetch({'/api/agent':{data:[{id:'explorer',name:'explorer',
      model:{id:'m',providerID:'p'},permissions:[{action:'edit'}]}]},
      '/api/config':[{type:'document',path:'opencode.json',info:{agents:{build:{}}}}]}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),
    zcodeBinaries:[],now:()=>Date.parse('2026-10-20T10:00:00.000Z')});
  const agent=roster.agents.find(a=>a.id==='opencode:explorer');
  assert.ok(agent,'service agent is listed');
  assert.equal(agent.native_id,'explorer');
  assert.equal(agent.definition,'DEFINED');
  assert.equal(agent.connection,'CONNECTED');
  assert.equal(agent.authorization,'UNREGISTERED');
  assert.equal(agent.permission,'DECLARED_UNVERIFIED');
  assert.equal(agent.status,'DEFINED');
  assert.notEqual(agent.status,'READY');
});
test('an exactly bound and granted native executor is authorised but still not READY',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:busRegistry(),roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,
    fetchImpl:fakeFetch({'/api/agent':{data:[{id:'a1',name:'a1',permissions:[{action:'edit'}]}]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
  const executor=roster.agents.find(a=>a.id==='opencode:opencode');
  assert.equal(executor.authorization,'AUTHORIZED');
  assert.equal(executor.authorization_reason,null);
  // A grant plus a live service is still not READY: native permission
  // enforcement cannot be verified, so READY is never claimed.
  assert.equal(executor.status,'DEFINED');
  assert.notEqual(executor.status,'READY');
  assert.equal(roster.agents.every(a=>a.status!=='READY'),true);
});
test('a configuration definition is DEFINED, never READY',async t=>{
  const {roots}=nativeTree(t);
  writeFileSync(join(roots.opencodeConfig,'opencode.json'),
    JSON.stringify({agent:{plan:{permission:{edit:'deny'}}}}));
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,
    fetchImpl:fakeFetch({'/api/agent':{data:[]},'/api/config':[]}),
    acpProbe:()=>({ok:false,status:'UNAVAILABLE',reason:'ACP_BINARY_UNAVAILABLE'}),zcodeBinaries:[]});
  const plan=roster.agents.find(a=>a.native_id==='plan');
  assert.ok(plan,'config definition is listed');
  assert.equal(plan.definition,'DEFINED');
  assert.equal(plan.connection,'NOT_CONNECTED');
  assert.equal(plan.status,'DEFINED');
  assert.notEqual(plan.status,'READY');
});
test('one unavailable source never fails the whole roster',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:()=>{throw Object.assign(new Error('no service'),{code:'opencode_service_not_found'});},
    createClient:fakeClient,fetchImpl:async()=>{throw Object.assign(new Error('down'),{code:'ECONNREFUSED'});},
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
  const opencode=roster.sources.find(s=>s.id==='opencode');
  assert.equal(opencode.status,'UNAVAILABLE');
  assert.ok(opencode.reason);
  // The other sources still produced their definitions.
  assert.ok(roster.agents.some(a=>a.source==='zbots'));
  assert.ok(roster.agents.some(a=>a.source==='aion-sessions'));
});
test('native ids and source refs are preserved verbatim',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,
    fetchImpl:fakeFetch({'/api/agent':{data:[{id:'councillor-alpha',name:'councillor-alpha'}]}}),
    acpProbe:()=>({ok:false,status:'UNAVAILABLE'}),zcodeBinaries:[]});
  const alpha=roster.agents.find(a=>a.source==='opencode');
  assert.equal(alpha.native_id,'councillor-alpha');
  assert.equal(alpha.id,'opencode:councillor-alpha');
  assert.equal(alpha.ref,'opencode://agent/councillor-alpha');
  const zbot=roster.agents.find(a=>a.source==='zbots');
  assert.equal(zbot.native_id,'bot-chief');
  assert.ok(zbot.ref.endsWith('.zcode\\agents\\bot-chief.md')||zbot.ref.endsWith('.zcode/agents/bot-chief.md'));
});
// The toolkit proxy answering /health is a DEPENDENCY fact about the free
// model proxy. It is NOT a native bot session and must never be reported as
// one, whatever the proxy reports.
const healthOk=async url=>{
  if(url.endsWith('/health'))return {ok:true,status:200,text:async()=>JSON.stringify({ok:true})};
  throw Object.assign(new Error('no route'),{code:'NO_ROUTE'});
};
const healthRefused=async url=>{
  if(url.endsWith('/health'))throw Object.assign(new Error('connect ECONNREFUSED'),{code:'ECONNREFUSED'});
  throw Object.assign(new Error('no route'),{code:'NO_ROUTE'});
};
function zbotRoster(t,fetchImpl){
  const {roots}=nativeTree(t);
  return discoverNativeAgents({
    catalog:CATALOG.roles,registry:busRegistry(),roots,env:{PROXY_PORT:'6446'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl,
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
}
test('a healthy toolkit proxy is a dependency, never a native bot connection',async t=>{
  const roster=await zbotRoster(t,healthOk);
  const source=roster.sources.find(s=>s.id==='zbots');
  assert.ok(source,'the zbots source is reported');
  assert.equal(source.health_scope,'TOOLKIT_DEPENDENCY_ONLY');
  assert.equal(source.health_status,'CONNECTED','the dependency status is preserved');
  assert.equal(source.health_ref,'http://127.0.0.1:6446/health');
  const bots=roster.agents.filter(a=>a.source==='zbots');
  assert.ok(bots.length>0,'the bot definitions are listed');
  for(const bot of bots){
    assert.equal(bot.connection,'UNKNOWN','a proxy that answers /health is not a bot session');
    assert.equal(bot.status,'DEFINED');
    assert.notEqual(bot.status,'READY');
    assert.match(bot.reason,/definition only/i);
    assert.match(bot.reason,/native bot session/i);
  }
  assert.equal(bots.some(b=>b.connection==='CONNECTED'||b.connection==='NOT_RUNNING'),false,
    'the proxy health is never reported as a bot connection');
});
test('a refused toolkit proxy is still not a native bot connection',async t=>{
  const roster=await zbotRoster(t,healthRefused);
  const source=roster.sources.find(s=>s.id==='zbots');
  assert.ok(source,'the zbots source is reported');
  assert.equal(source.health_scope,'TOOLKIT_DEPENDENCY_ONLY');
  assert.equal(source.health_status,'NOT_RUNNING','the dependency status is preserved');
  const bots=roster.agents.filter(a=>a.source==='zbots');
  assert.ok(bots.length>0,'the bot definitions are listed');
  for(const bot of bots){
    assert.equal(bot.connection,'UNKNOWN');
    assert.equal(bot.status,'DEFINED');
    assert.notEqual(bot.status,'READY');
    assert.match(bot.reason,/definition only/i);
    assert.match(bot.reason,/native bot session/i);
  }
  assert.equal(bots.some(b=>b.connection==='CONNECTED'||b.connection==='NOT_RUNNING'),false,
    'the proxy health is never reported as a bot connection');
});
// The native global definitions are <.zcode root>/agents/*.md. The project
// skill descriptors (.agents/skills/*/agents/openai.yaml) are NOT agents.
test('a native .md definition is listed and a skill descriptor is never an agent',async t=>{
  const {roots}=nativeTree(t,{zcode:['dep-refs','other-agent']});
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:busRegistry(),roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
  const zcode=roster.agents.filter(a=>a.source==='zcode');
  assert.equal(zcode.length,2,'only the native .md definitions are agents');
  assert.deepEqual(zcode.map(a=>a.native_id).sort(),['dep-refs','other-agent']);
  // The project skill descriptor is NOT an agent identity.
  assert.equal(roster.agents.some(a=>a.native_id==='skill-only'),false,
    'an openai.yaml skill descriptor is not a native agent');
  assert.equal(roster.agents.some(a=>String(a.ref??'').endsWith('openai.yaml')),false);
  const dep=zcode.find(a=>a.native_id==='dep-refs');
  assert.ok(dep,'the native definition is listed');
  assert.equal(dep.definition,'DEFINED');
  assert.equal(dep.connection,'NOT_RUNNING');
  assert.notEqual(dep.connection,'CONNECTED','a bundle file is not a live session');
  assert.equal(dep.status,'DEFINED');
  assert.notEqual(dep.status,'READY');
  assert.equal(dep.authorization,'UNREGISTERED');
  assert.notEqual(dep.authorization,'AUTHORIZED','no grant is ever guessed');
  assert.equal(dep.model,'codex-oauth/gpt-6.1-sol');
  assert.equal(dep.thought_level,'enabled');
  assert.equal(dep.description,'native dep-refs definition');
  assert.equal(dep.declared_only,true,'the front matter is declared, never verified');
  assert.ok(dep.ref.endsWith('agents\\dep-refs.md')||dep.ref.endsWith('agents/dep-refs.md'));
  const source=roster.sources.find(s=>s.id==='zcode');
  assert.equal(source.agent_count,2);
  assert.ok(source.definition_root.endsWith('agents'));
});
test('the ZCode bundle presence is BINARY_PRESENT, never a live session',async t=>{
  const {roots}=nativeTree(t,{zcode:['dep-refs']});
  const bundle=join(roots.zcode,'zcode.cjs');
  writeFileSync(bundle,'// zcode bundle fixture');
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:busRegistry(),roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[bundle]});
  const dep=roster.agents.find(a=>a.source==='zcode'&&a.native_id==='dep-refs');
  assert.ok(dep);
  assert.equal(dep.connection,'BINARY_PRESENT');
  assert.notEqual(dep.connection,'CONNECTED','a present bundle is not a live session');
  assert.equal(dep.status,'DEFINED');
  assert.notEqual(dep.status,'READY');
  assert.equal(roster.agents.every(a=>a.status!=='READY'),true);
});
test('the native definition scan never reads a database or a transcript',async t=>{
  const {roots}=nativeTree(t,{zcode:['dep-refs']});
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:busRegistry(),roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
  const text=JSON.stringify(roster);
  assert.equal(text.includes('PRIVATE DATABASE'),false);
  assert.equal(text.includes('PRIVATE TRANSCRIPT'),false);
  assert.equal(/zbot\.sqlite/.test(text),false);
  assert.equal(/session-transcript/.test(text),false);
  assert.equal(roster.agents.filter(a=>a.source==='zcode').length,1);
});
test('the ACP executable is BINARY_PRESENT and never a session',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT',endpoint:'in-process-acp'}),zcodeBinaries:[]});
  const acp=roster.agents.find(a=>a.source==='acp');
  assert.equal(acp.status,'BINARY_PRESENT');
  assert.equal(acp.connection,'BINARY_PRESENT');
  assert.equal(acp.session,null);
  assert.equal(acp.live_verified,false);
  assert.notEqual(acp.status,'READY');
});
test('a role folder that is not in the catalogue is CONFIGURED_NOT_REGISTERED',async t=>{
  const {roots}=nativeTree(t,{roles:['05-chief-of-chiefs','09-global-research']});
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:false,status:'UNAVAILABLE'}),zcodeBinaries:[]});
  const role=roster.agents.find(a=>a.source==='aion-sessions');
  assert.equal(role.native_id,'09-global-research');
  assert.equal(role.status,'CONFIGURED_NOT_REGISTERED');
  assert.equal(role.registered,false);
  assert.equal(role.role_id,'09');
  // A catalogue role is never repeated as an unregistered role.
  assert.equal(roster.agents.filter(a=>a.source==='aion-sessions').length,1);
});
test('local definitions never read the database, the inbox or a report',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:false,status:'UNAVAILABLE'}),zcodeBinaries:[]});
  const text=JSON.stringify(roster);
  assert.equal(text.includes('PRIVATE MESSAGE'),false);
  assert.equal(text.includes('PRIVATE DATABASE'),false);
  assert.equal(/zbot\.sqlite/.test(text),false);
  assert.equal(/bots[\\/]inbox/.test(text),false);
});
test('a definition scan never reads outside its known root',async t=>{
  const {roots}=nativeTree(t,{zbots:[]});
  const outside=join(roots.zbots,'..','outside-definitions');
  mkdirSync(outside,{recursive:true});
  writeFileSync(join(outside,'sneaky.md'),'---\nname: sneaky\ndescription: "escaped"\n---\n');
  t.after(()=>rmSync(outside,{recursive:true,force:true}));
  const link=join(roots.zbots,'.zcode','agents');
  rmSync(link,{recursive:true,force:true});
  try{symlinkSync(outside,link,process.platform==='win32'?'junction':'dir');}
  catch(error){t.skip('cannot create a link on this host: '+error.code);return;}
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,fetchImpl:fakeFetch({'/api/agent':{data:[]}}),
    acpProbe:()=>({ok:false,status:'UNAVAILABLE'}),zcodeBinaries:[]});
  assert.equal(roster.agents.some(a=>a.native_id==='sneaky'),false,
    'a definition whose real path escapes the known root must not be read');
});
test('no credential, token or transcript ever leaves the roster',async t=>{
  const {roots}=nativeTree(t);
  const roster=await discoverNativeAgents({
    catalog:CATALOG.roles,registry:{status:'AVAILABLE',agents:{},grants:{}},roots,env:{PROXY_PORT:'1'},
    discoverService:fakeService,createClient:fakeClient,
    fetchImpl:fakeFetch({'/api/agent':{data:[{id:'a1',name:'a1'}]}}),
    acpProbe:()=>({ok:true,status:'BINARY_PRESENT'}),zcodeBinaries:[]});
  const text=JSON.stringify(roster);
  assert.equal(text.includes('c2VjcmV0'),false);           // the fake Basic credential
  assert.equal(/"authorization"\s*:\s*"Basic/i.test(text),false);
  assert.equal(/password/i.test(text),false);
});

// ------------------------------------------------------------------ the CLI

test('aion agents lists the catalogue even when the Bus ACL is unavailable',async()=>{
  const lines=[];
  const native=async()=>({schema:'aion.native-agents/1',observed_utc:'2026-10-20T10:00:00.000Z',
    registry:{status:'UNKNOWN',error:'STATE_ACL_UNVERIFIED'},count:0,agents:[],sources:[]});
  const exit=await main(['agents'],{
    open:async()=>{throw Object.assign(new Error('acl'),{code:'STATE_ACL_UNVERIFIED'});},
    native,print:x=>lines.push(x)});
  assert.equal(exit,0);
  const out=JSON.parse(lines[0]);
  assert.equal(out.schema,'aion.agents/1');
  assert.equal(out.count,8);
  assert.equal(out.registry.status,'UNKNOWN');
  assert.equal(out.registry.error,'STATE_ACL_UNVERIFIED');
  assert.equal(out.agents.every(a=>a.status==='UNKNOWN'),true);
  assert.equal(out.agents.every(a=>a.registry_error==='STATE_ACL_UNVERIFIED'),true);
  assert.equal(out.agents.some(a=>a.alias==='coc'),true);
  assert.equal(out.native_agents.count,0);
});
test('aion agents keeps the readable registry projection and adds the native roster',async()=>{
  const lines=[];
  const native=async()=>({schema:'aion.native-agents/1',observed_utc:'2026-10-20T10:00:00.000Z',
    registry:{status:'AVAILABLE',error:null},count:1,
    agents:[{id:'opencode:a1',native_id:'a1',source:'opencode',kind:'agent',name:'a1',
      definition:'DEFINED',connection:'CONNECTED',authorization:'UNREGISTERED',
      permission:'UNKNOWN',status:'DEFINED',ref:'opencode://agent/a1',reason:null}],
    sources:[{id:'opencode',status:'AVAILABLE',reason:null,agent_count:1}]});
  const rt={roleCatalog:CATALOG,
    bus:{store:{read:async()=>({agents:{'role-05':{agent_id:'role-05',kind:'conversation',
      role_id:'05',status:'bound',binding:{adapter:'chatgpt'}}},grants:{}})}},close:async()=>{}};
  const exit=await main(['agents'],{open:async()=>rt,native,print:x=>lines.push(x)});
  assert.equal(exit,0);
  const out=JSON.parse(lines[0]);
  assert.equal(out.registry.status,'AVAILABLE');
  assert.equal(out.agents[0].status,'BOUND');
  assert.equal(out.native_agents.count,1);
  assert.equal(out.native_agents.agents[0].native_id,'a1');
});

// --------------------------------------------------- bounded actual smoke

test('actual machine: the native roster is read-only, bounded and free of secrets',async()=>{
  const roster=await discoverNativeAgents({catalog:CATALOG.roles,registry:null,registryError:'STATE_ACL_UNVERIFIED',
    timeoutMs:4000,healthTimeoutMs:1500});
  assert.equal(roster.schema,'aion.native-agents/1');
  assert.equal(roster.registry.status,'UNKNOWN');
  assert.equal(roster.count,roster.agents.length);
  // Every entry separates definition, connection and authorisation.
  for(const a of roster.agents){
    assert.equal(typeof a.native_id,'string');
    assert.ok(a.native_id.length>0);
    assert.ok(['DEFINED','UNKNOWN'].includes(a.definition),a.definition);
    assert.ok(['AUTHORIZED','NOT_AUTHORIZED','UNREGISTERED','UNKNOWN'].includes(a.authorization));
    assert.ok(['READY','DEFINED','CONFIGURED_NOT_REGISTERED','BINARY_PRESENT','UNAVAILABLE','UNKNOWN'].includes(a.status));
    assert.equal(a.permission==='DECLARED_UNVERIFIED'||a.permission==='UNKNOWN',true);
  }
  // A native roster never claims READY: the native permission state is not verifiable.
  assert.equal(roster.agents.every(a=>a.status!=='READY'),true);
  assert.equal(roster.agents.every(a=>a.permission!=='VERIFIED'),true);
  // The sources are reported independently and none of them is a crash.
  const ids=roster.sources.map(s=>s.id);
  assert.ok(ids.includes('opencode'));
  assert.ok(ids.includes('zbots'));
  assert.ok(ids.includes('acp'));
  assert.ok(ids.includes('aion-sessions'));
  for(const s of roster.sources)assert.notEqual(s.status,'CRASHED');
  // No credential, token or private message is emitted.
  const text=JSON.stringify(roster);
  assert.equal(/"authorization"\s*:\s*"Basic/i.test(text),false);
  assert.equal(/password/i.test(text),false);
  assert.equal(text.includes('PRIVATE MESSAGE'),false);
});
test('actual machine: the native global definitions are listed, counted and never READY',async()=>{
  const home=process.env.HOME||process.env.USERPROFILE||'';
  const defsRoot=join(home,'.zcode','agents');
  const onDisk=readdirSync(defsRoot,{withFileTypes:true})
    .filter(e=>e.isFile()&&e.name.endsWith('.md')).length;
  const roster=await discoverNativeAgents({catalog:CATALOG.roles,registry:null,registryError:'STATE_ACL_UNVERIFIED',
    timeoutMs:4000,healthTimeoutMs:1500});
  const source=roster.sources.find(s=>s.id==='zcode');
  assert.ok(source,'the zcode source is reported');
  const zcode=roster.agents.filter(a=>a.source==='zcode');
  console.log(`actual machine native zcode definitions: ${zcode.length} (files on disk: ${onDisk})`);
  assert.equal(zcode.length,onDisk,'every native definition file on disk is listed exactly once');
  assert.equal(source.agent_count,zcode.length);
  for(const a of zcode){
    assert.equal(a.definition,'DEFINED');
    // A bundle file is BINARY_PRESENT, never a live session.
    assert.ok(['BINARY_PRESENT','NOT_RUNNING'].includes(a.connection),a.connection);
    assert.notEqual(a.connection,'CONNECTED');
    assert.equal(a.status,'DEFINED');
    assert.notEqual(a.status,'READY');
    // No grant is guessed: the Bus registry could not be read here.
    assert.ok(['UNKNOWN','UNREGISTERED','NOT_AUTHORIZED'].includes(a.authorization),a.authorization);
    assert.equal(a.permission,'UNKNOWN');
    assert.ok(String(a.ref).startsWith(defsRoot),a.ref);
  }
  // A project skill descriptor is never an agent identity.
  assert.equal(zcode.some(a=>String(a.ref??'').endsWith('openai.yaml')),false);
});
