import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm,truncate,rename,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createBus} from '../src/bus/bus.js';
import {createOpenCodeV2Adapter,createOpenCodeHttpClient,normalizeSendOptions,HttpError,sameSessionDirectory} from '../src/bus/adapters/opencode-v2.js';
import {REASON} from '../src/bus/contracts.js';
import {memoryStorage} from './fixtures/bus-memory.js';
import {createExampleChat} from './fixtures/bus-example-chat.js';

async function setup(t) {
  const cwd=await mkdtemp(join(tmpdir(),'aion-native-options-'));
  t.after(()=>rm(cwd,{recursive:true,force:true}));
  const calls=[];
  const sessions=new Map([['ses_existing',{id:'ses_existing',location:{directory:cwd}}]]);
  let messages=[],unknown=false,onCreate=null;
  const client={
    agents:async()=>({data:[{id:'builder',mode:'primary'}]}),
    models:async()=>({data:[{providerID:'test',id:'model',enabled:true,variants:[{id:'high'}],capabilities:{input:['text','image']}}]}),
    session:async({sessionID})=>{calls.push(['get',sessionID]);return {data:sessions.get(sessionID)};},
    createSession:async args=>{calls.push(['create',args]);await onCreate?.();return {data:{id:'ses_new',location:{directory:cwd},
      ...(args.agent?{agent:args.agent}:{}),...(args.model?{model:args.model}:{}),...(args.parentID?{parentID:args.parentID}:{})}};},
    prompt:async args=>{calls.push(['prompt',args]);if(unknown)throw new Error('dropped');return {data:{id:'inbox_1',sessionID:args.sessionID,type:'user'}};},
    messages:async()=>({data:messages})
  };
  const storage=memoryStorage();let n=0;
  const make=()=>createBus({storage,adapters:[createExampleChat(),createOpenCodeV2Adapter({client})],
    initialConfig:{report_back:false},randomId:()=>`opt${String(++n).padStart(12,'0')}`});
  const bus=make();
  await bus.bind('opencode',{adapter:'opencode-v2',ref:'opencode',confirmed_by:'owner:test'});
  await bus.bind('aion',{adapter:'example-chat',ref:'example://room/commander',confirmed_by:'owner:test'});
  await bus.grant({grant_id:'native-options',ref:'owner:test',agents:['opencode','aion'],ops:['send','cancel'],max_count:100,
    rate_per_hour:100,expires_utc:'2099-01-01T00:00:00.000Z',cwd});
  return {bus,make,cwd,calls,client,sessions,setMessages:x=>{messages=x;},setUnknown:()=>{unknown=true;},setOnCreate:f=>{onCreate=f;}};
}
async function admit(w,options,nonce='native-options-001',to='opencode') {
  return w.bus.ingestStructured({op:'send',to,text:'hello',nonce,send_options:options});
}
test('nullable native model preserves default selection for fresh and reused sessions',async t=>{
  for(const reuse of [false,true]){
    const w=await setup(t);
    if(reuse)w.sessions.get('ses_existing').model=null;
    else w.client.createSession=async()=>({data:{id:'ses_new',model:null,location:{directory:w.cwd}}});
    const a=await admit(w,reuse?{session:'ses_existing'}:{});
    assert.equal((await w.bus.dispatch(a.command_id)).state,'SUBMISSION_OBSERVED');
    assert.equal(w.calls.filter(c=>c[0]==='prompt').length,1);
    assert.equal((await w.bus.readCommand(a.command_id)).executor_selection.id,null);
  }
});
test('native HTTP create/catalog/get/prompt contracts omit permission overrides',async()=>{
  const calls=[];
  const client=createOpenCodeHttpClient({baseUrl:'http://127.0.0.1:4096',fetch:async(url,init)=>{
    calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});
    return {ok:true,text:async()=>'{}'};
  }});
  await client.agents({directory:'C:/work space'});await client.models({directory:'C:/work space'});
  await client.session({sessionID:'ses_x'});
  await client.createSession({directory:'C:/work',title:'x',agent:'builder',model:{providerID:'p',id:'m',variant:'high'},parentID:'ses_parent'});
  await client.prompt({sessionID:'ses_x',text:'hello',files:[{uri:'file:///C:/work/a.txt',name:'a.txt'}]});
  assert.match(calls[0].url,/location\[directory\]=C%3A%2Fwork%20space/);
  assert.match(calls[1].url,/\/api\/model\?/);assert.match(calls[2].url,/\/api\/session\/ses_x$/);
  assert.deepEqual(calls[3].body,{location:{directory:'C:/work'},title:'x',agent:'builder',model:{providerID:'p',id:'m',variant:'high'},parentID:'ses_parent'});
  assert.deepEqual(calls[4].body,{text:'hello',files:[{uri:'file:///C:/work/a.txt',name:'a.txt'}]});
});
test('same durable command snapshots options and unknown never resends after restart',async t=>{
  const w=await setup(t);w.setUnknown();
  const options={agent:'builder',model:'test/model',variant:'high',parent:'ses_existing'};
  const a=await admit(w,options);assert.equal(a.accepted,true,JSON.stringify(a));
  options.agent='evil';
  assert.equal((await w.bus.readCommand(a.command_id)).send_options.agent,'builder');
  assert.equal((await w.bus.dispatch(a.command_id)).state,'UNRESOLVED');
  const create=w.calls.find(c=>c[0]==='create')[1];
  assert.equal(create.agent,'builder');assert.equal(create.parentID,'ses_existing');
  assert.deepEqual(create.model,{providerID:'test',id:'model',variant:'high'});
  const restarted=w.make();await restarted.dispatch(a.command_id);await restarted.reconcile();
  assert.equal(w.calls.filter(c=>c[0]==='prompt').length,1);
  assert.equal((await admit(w,{agent:'builder'})).accepted,false);
});
test('invalid model, variant, agent and session mismatch fail before create/prompt',async t=>{
  for(const options of [{agent:'missing'},{model:'test/missing'},{model:'test/model',variant:'missing'},
    {session:'ses_missing'},{parent:'ses_missing'}]){
    const w=await setup(t);const a=await admit(w,options);assert.equal(a.accepted,true);
    assert.equal((await w.bus.dispatch(a.command_id)).state,'REJECTED');
    assert.equal(w.calls.some(c=>['create','prompt'].includes(c[0])),false);
  }
  const w=await setup(t);w.sessions.get('ses_existing').location.directory=w.cwd+'/other';
  const a=await admit(w,{session:'ses_existing'});await w.bus.dispatch(a.command_id);
  assert.equal(w.calls.some(c=>['create','prompt'].includes(c[0])),false);
});
test('reuse exact session, no mutations or fallback, old and foreign replies do not settle',async t=>{
  const w=await setup(t);const a=await admit(w,{session:'ses_existing'});await w.bus.dispatch(a.command_id);
  assert.equal((await w.bus.readCommand(a.command_id)).executor_prompt_id,'inbox_1');
  assert.deepEqual(w.calls.map(c=>c[0]),['get','prompt']);
  const idle={type:'idle',outcome:'completed',time:{created:3}};
  const user={id:'inbox_1',type:'user',text:'old',time:{created:1}};
  w.setMessages([idle,{type:'assistant',text:'old answer',time:{created:2}},user]);
  assert.equal((await w.bus.observe(a.command_id)).state,'SUBMISSION_OBSERVED');
  user.text=w.calls.find(c=>c[0]==='prompt')[1].text;
  user.id='foreign-copy-of-text';
  assert.equal((await w.bus.observe(a.command_id)).state,'SUBMISSION_OBSERVED','text alone is insufficient');
  user.id='inbox_1';
  w.setMessages([idle,{id:'foreign',type:'user',text:'foreign concurrent input',time:{created:1.5}},user]);
  assert.equal((await w.bus.observe(a.command_id)).state,'SUBMISSION_OBSERVED');
  w.setMessages([idle,{type:'assistant',text:'new answer',time:{created:2}},user]);
  assert.equal((await w.make().observe(a.command_id)).state,'REPLY_CHECKED','returned inbox ID survives runner restart');
});
test('reused readback selects exact inbox boundary even with a later unrelated completed turn',async t=>{
  const w=await setup(t);const a=await admit(w,{session:'ses_existing'});await w.bus.dispatch(a.command_id);
  const text=w.calls.find(c=>c[0]==='prompt')[1].text;
  w.setMessages([
    {type:'idle',outcome:'completed',time:{created:6}},
    {type:'assistant',text:'UNRELATED ANSWER',time:{created:5}},
    {id:'foreign',type:'user',text:'other request',time:{created:4}},
    {type:'idle',outcome:'completed',time:{created:3}},
    {type:'assistant',text:'OWN ANSWER',time:{created:2}},
    {id:'inbox_1',type:'user',text,time:{created:1}}
  ]);
  assert.equal((await w.bus.observe(a.command_id)).state,'REPLY_CHECKED');
  const command=await w.bus.readCommand(a.command_id);
  assert.match(command.reply.excerpt,/OWN ANSWER/);assert.doesNotMatch(command.reply.excerpt,/UNRELATED/);
});
test('active reused session refuses before prompt; dropped response cannot borrow another reply',async t=>{
  const active=await setup(t);active.setMessages([{id:'prior',type:'user',text:'still active',time:{created:1}}]);
  const a=await admit(active,{session:'ses_existing'});
  assert.equal((await active.bus.dispatch(a.command_id)).state,'REJECTED');
  assert.equal(active.calls.some(c=>c[0]==='prompt'),false);
  const w=await setup(t);w.setUnknown();const b=await admit(w,{session:'ses_existing'});await w.bus.dispatch(b.command_id);
  const text=w.calls.find(c=>c[0]==='prompt')[1].text;
  w.setMessages([{type:'idle',time:{created:3}},{type:'assistant',text:'not attributable',time:{created:2}},
    {id:'unknown',type:'user',text,time:{created:1}}]);
  assert.equal((await w.make().observe(b.command_id)).state,'UNRESOLVED');
  await w.bus.dispatch(b.command_id);assert.equal(w.calls.filter(c=>c[0]==='prompt').length,1);
});
test('structured-only options reject other adapters and reject malformed controls',async t=>{
  const w=await setup(t);assert.equal((await admit(w,{agent:'builder'},'native-other-target','aion')).accepted,false);
  for(const options of [{session:'ses_existing',parent:'ses_existing'},{session:'ses_existing',agent:'builder'},
    {variant:'high'},{permissions:{}},{files:['https://example/a.txt']}, {files:'a.txt'}]){
    if(options.files?.[0]?.startsWith?.('https:'))continue;
    assert.throws(()=>normalizeSendOptions(options));
  }
  assert.equal(w.calls.length,0);
});
test('binding revision race halts before options or text reach adapter',async t=>{
  const w=await setup(t);const a=await admit(w,{agent:'builder'});
  await w.bus.store.mutate(d=>{d.agents.opencode.revision++;});
  assert.equal((await w.bus.dispatch(a.command_id)).state,'HALTED');assert.equal(w.calls.length,0);
});
test('bounded canonical file URI forwards; secret, unsupported, outside and oversized files refuse',async t=>{
  const w=await setup(t);await writeFile(join(w.cwd,'notes.txt'),'safe');
  const a=await admit(w,{files:['notes.txt']});await w.bus.dispatch(a.command_id);
  assert.deepEqual(w.calls.find(c=>c[0]==='prompt')[1].files,[{uri:pathToFileURL(join(w.cwd,'notes.txt')).href,name:'notes.txt'}]);
  for(const name of ['.env','secret.key','blob.exe','big.txt']){
    const x=await setup(t);await writeFile(join(x.cwd,name),'x');
    if(name==='big.txt')await truncate(join(x.cwd,name),20*1024*1024+1);
    const b=await admit(x,{files:[name]});await x.bus.dispatch(b.command_id);
    assert.equal(x.calls.some(c=>c[0]==='prompt'),false,name);
  }
  for(const file of ['../outside.txt','https://example/a.txt','missing.txt']){
    const x=await setup(t);const b=await admit(x,{files:[file]});await x.bus.dispatch(b.command_id);
    assert.equal(x.calls.some(c=>c[0]==='prompt'),false,file);
  }
});
test('path replacement between validation and session create refuses before prompt',async t=>{
  const w=await setup(t);await writeFile(join(w.cwd,'a.txt'),'x');
  w.setOnCreate(async()=>{await rename(join(w.cwd,'a.txt'),join(w.cwd,'old.txt'));await mkdir(join(w.cwd,'a.txt'));});
  const a=await admit(w,{files:['a.txt']});await w.bus.dispatch(a.command_id);
  assert.equal(w.calls.some(c=>c[0]==='prompt'),false);
});
test('existing outside files and grant-local junction escapes are refused',async t=>{
  const w=await setup(t),outside=await setup(t);
  await writeFile(join(outside.cwd,'a.txt'),'outside');
  await symlink(outside.cwd,join(w.cwd,'linked'),'junction');
  for(const [i,file] of [join(outside.cwd,'a.txt'),join(w.cwd,'linked','a.txt')].entries()){
    const a=await admit(w,{files:[file]},`outside-native-${i}`);
    assert.equal((await w.bus.dispatch(a.command_id)).state,'REJECTED');
  }
  assert.equal(w.calls.length,0);
});
test('native images require a catalog-confirmed explicit image-capable model',async t=>{
  for(const [i,options] of [{files:['a.png']},{files:['a.png'],model:'test/model'}].entries()){
    const w=await setup(t);await writeFile(join(w.cwd,'a.png'),'fixture image');
    const a=await admit(w,options);
    assert.equal((await w.bus.dispatch(a.command_id)).state,i?'SUBMISSION_OBSERVED':'REJECTED');
  }
  const w=await setup(t);await writeFile(join(w.cwd,'a.png'),'fixture image');
  w.client.models=async()=>({data:[{providerID:'test',id:'model',variants:[],capabilities:{input:['text']}}]});
  const a=await admit(w,{files:['a.png'],model:'test/model'});await w.bus.dispatch(a.command_id);
  assert.equal(w.calls.some(c=>c[0]==='prompt'),false);
});
test('parent location race is checked again on returned child before prompting',async t=>{
  const w=await setup(t);
  w.client.createSession=async()=>({data:{id:'ses_child',location:{directory:w.cwd+'/moved'}}});
  const a=await admit(w,{parent:'ses_existing'});
  assert.equal((await w.bus.dispatch(a.command_id)).state,'REJECTED');
  assert.equal(w.calls.some(c=>c[0]==='prompt'),false);
});
test('cancel never interrupts an externally reused session, but fresh-session cancellation remains available',async t=>{
  for(const reused of [true,false]){
    const w=await setup(t);let interrupts=0;w.client.interrupt=async()=>{interrupts++;};
    await w.bus.setConfig({ops_enabled:['send','cancel']});
    const a=await admit(w,reused?{session:'ses_existing'}:{});await w.bus.dispatch(a.command_id);
    const cancel=await w.bus.ingestStructured({op:'cancel',to:'opencode',nonce:'cancel-native-001'});
    assert.equal(cancel.accepted,true,JSON.stringify(cancel));
    await w.bus.dispatch(cancel.command_id);
    assert.equal(interrupts,reused?0:1);
    assert.equal((await w.bus.readCommand(cancel.command_id)).reason,reused?REASON.OP_NOT_SUPPORTED:null);
  }
});
test('explicit created agent/model/variant/parent are checked, never silently substituted',async t=>{
  const options={agent:'builder',model:'test/model',variant:'high',parent:'ses_existing'};
  for(const mutation of [s=>{s.agent='other';},s=>{s.model.id='other';},s=>{s.model.providerID='other';},
    s=>{s.model.variant='low';},s=>{s.parentID='ses_other';}]){
    const w=await setup(t);let gets=0;
    w.client.createSession=async()=>{const actual={id:'ses_new',agent:'builder',model:{providerID:'test',id:'model',variant:'high'},parentID:'ses_existing',location:{directory:w.cwd}};mutation(actual);return {data:actual};};
    const get=w.client.session;w.client.session=async args=>{gets++;return get(args);};
    const a=await admit(w,options);assert.equal((await w.bus.dispatch(a.command_id)).state,'REJECTED');
    assert.equal(w.calls.some(c=>c[0]==='prompt'),false);assert.equal(gets,1,'only parent preflight GET; mismatch must not be hidden');
  }
});
test('incomplete create response requires exact GET confirmation, missing or mismatched confirmation refuses',async t=>{
  for(const verdict of ['match','missing','mismatch']){
    const w=await setup(t);w.client.createSession=async()=>({data:{id:'ses_new'}});
    w.client.session=async()=>({data:{id:'ses_new',...(verdict==='missing'?{}:{agent:verdict==='match'?'builder':'other'})}});
    const a=await admit(w,{agent:'builder'});const result=await w.bus.dispatch(a.command_id);
    assert.equal(result.state,verdict==='match'?'SUBMISSION_OBSERVED':'REJECTED');
    assert.equal(w.calls.some(c=>c[0]==='prompt'),verdict==='match');
  }
});
test('native agent mode must be primary/all, unknown/subagent never becomes a root or speculative child',async t=>{
  for(const mode of ['primary','all','subagent','mystery',null,undefined]){
    for(const parent of [undefined,'ses_existing']){
      const w=await setup(t);w.client.agents=async()=>({data:[{id:'builder',mode}]});
      const a=await admit(w,{agent:'builder',...(parent?{parent}:{})});await w.bus.dispatch(a.command_id);
      assert.equal(w.calls.some(c=>c[0]==='prompt'),['primary','all'].includes(mode),`${mode}/${parent}`);
    }
  }
});
test('pre-prompt service failures distinguish HTTP refusals, abort timeouts, transport loss and bad input',async t=>{
  for(const [method,options] of [['agents',{agent:'builder'}],['models',{model:'test/model'}],
    ['session',{session:'ses_existing'}],['messages',{session:'ses_existing'}],['createSession',{}]]){
    for(const [error,reason] of [[new HttpError(401,{}),REASON.TARGET_REFUSED],
      [Object.assign(new Error('timeout'),{name:'AbortError'}),REASON.TIMEOUT],
      [new TypeError('fetch failed'),REASON.TRANSPORT_LOST]]){
      const w=await setup(t);w.client[method]=async()=>{throw error;};
      const a=await admit(w,options);await w.bus.dispatch(a.command_id);
      assert.equal((await w.bus.readCommand(a.command_id)).reason,reason,`${method}/${error.name}`);
      assert.equal(w.calls.some(c=>c[0]==='prompt'),false);
    }
  }
  const w=await setup(t);w.client.agents=async()=>({data:{id:'builder'}});
  const a=await admit(w,{agent:'builder'});await w.bus.dispatch(a.command_id);
  assert.equal((await w.bus.readCommand(a.command_id)).reason,REASON.BAD_VALUE);
});
test('Windows cwd matching is case/slash/trailing-separator normalized and remains exact',async t=>{
  assert.equal(sameSessionDirectory('C:\\Work\\AION\\','c:/work/aion/'),true);
  assert.equal(sameSessionDirectory('C:\\Work\\temp\\..\\AION','c:/work/./aion/'),true);
  assert.equal(sameSessionDirectory('\\\\HOST\\Share\\AION','//host/share/aion/'),true);
  assert.equal(sameSessionDirectory('C:/work/aion-other','c:/work/aion'),false);
  assert.equal(sameSessionDirectory('/Work/AION','/work/aion'),false);
  const client={session:async({sessionID})=>({data:{id:sessionID,location:{directory:'c:/work/aion/'}}}),
    createSession:async()=>({data:{id:'ses_child',parentID:'ses_parent',location:{directory:'c:/WORK/AION/'}}}),
    messages:async()=>({data:[]}),prompt:async()=>({data:{id:'inbox_1',sessionID:'ses_child',type:'user'}})};
  const adapter=createOpenCodeV2Adapter({client});
  assert.equal((await adapter.deliver({grant:{cwd:'C:\\Work\\AION'},send_options:{parent:'ses_parent'},text:'hello'})).outcome,'sent');
});
test('reused session preserves and reports actual native selection without configuration mutation',async t=>{
  const w=await setup(t);w.sessions.get('ses_existing').agent='native-existing';
  w.sessions.get('ses_existing').model={providerID:'native',id:'existing',variant:'high'};
  const a=await admit(w,{session:'ses_existing'});await w.bus.dispatch(a.command_id);
  assert.deepEqual((await w.bus.readCommand(a.command_id)).executor_selection,{agent:'native-existing',providerID:'native',id:'existing',variant:'high'});
  assert.deepEqual(w.calls.map(c=>c[0]),['get','prompt']);
});
