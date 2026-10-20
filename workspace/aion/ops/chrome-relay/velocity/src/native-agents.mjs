// Native roster — READ-ONLY discovery of agents that ALREADY exist on this
// machine.
//
// Round 10 rules enforced by this module:
//   * No new registry, no config write, no install, no service start, no send
//     and no dispatch. Every step here is a READ.
//   * Never emit credentials, tokens, transcripts, prompts or private
//     messages. Only ids, names, refs, counts and statuses leave this module.
//   * Every source is independent: one unavailable source degrades only its
//     own section, never the whole roster.
//   * Definition, connection and authorization are three DIFFERENT facts and
//     are reported as three different fields. A definition alone is DEFINED,
//     never READY.
//   * READY needs EVERY fact: a definition, a live connection, an exactly
//     bound and granted Bus mapping AND a verified permission state. A grant
//     alone is never enough, and a native source can declare permissions but
//     never prove that they are enforced, so a native agent is never READY.
//   * Native permission state is never claimed. A declared permission set is
//     reported as DECLARED_UNVERIFIED, never as enforced.
//   * A definition file is read only inside its known root: the real path must
//     stay inside the real root and a symlink is never followed. A file that
//     fails that check is not read and is not listed.
//   * The Bus state file is never read here. The caller passes the registry
//     and grants it already read; when it could not be read the caller says
//     so and every authorization answer becomes UNKNOWN.
import {openSync,readSync,closeSync,readdirSync,statSync,lstatSync,realpathSync} from 'node:fs';
import {join,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {discoverOpenCodeService} from '../../bus/opencode-service.js';
import {createOpenCodeHttpClient} from '../../extension/src/bus/adapters/opencode-v2.js';
import {selectGrant} from '../../extension/src/bus/grants.js';
import {probeAcpBinary} from './engines/acp.mjs';

export const NATIVE_SCHEMA='aion.native-agents/1';
export const REPO_ROOT=fileURLToPath(new URL('../../../../../../',import.meta.url));

const LOOPBACK=/^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d{1,5})?$/;
// Bounded reads: a definition file is never read whole and never followed
// outside the folder it was found in.
const MAX_DEF_BYTES=8192;
const MAX_CONFIG_BYTES=64*1024;
const MAX_DIR_ENTRIES=128;
const MAX_TEXT=160;
const ROLE_DIR=/^(\d{2})-(.+)$/;

// ---------------------------------------------------------------- utilities

function reasonOf(error,fallback='UNAVAILABLE'){
  if(!error)return fallback;
  if(error.name==='AbortError')return 'HEALTH_CHECK_TIMEOUT';
  if(typeof error.code==='string'&&error.code)return error.code;
  if(typeof error.cause?.code==='string'&&error.cause.code)return error.cause.code;
  return fallback;
}
function clamp(value){
  return String(value??'').replace(/\s+/g,' ').trim().slice(0,MAX_TEXT);
}
function listDir(dir,max=MAX_DIR_ENTRIES){
  try{return readdirSync(dir,{withFileTypes:true}).slice(0,max);}
  catch{return [];}
}
function isFile(path){
  // lstat, not stat: a symlink is never followed to a definition file.
  try{return lstatSync(path).isFile();}catch{return false;}
}
function isInside(root,target){
  if(typeof root!=='string'||typeof target!=='string'||!root||!target)return false;
  const rel=relative(root,target);
  return rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel);
}
function isDir(path){
  try{return statSync(path).isDirectory();}catch{return false;}
}
/**
 * Read at most `max` bytes of a file. Never throws, never reads a whole file,
 * never follows a symlink, and never reads outside `root` when a root is
 * given: the resolved real path must stay inside the resolved real root.
 */
function readBounded(path,max=MAX_DEF_BYTES,root=null){
  try{if(!lstatSync(path).isFile())return null;}catch{return null;}
  if(root){
    let realRoot,realFile;
    try{realRoot=realpathSync(root);realFile=realpathSync(path);}catch{return null;}
    if(!isInside(realRoot,realFile))return null;
  }
  let fd;
  try{fd=openSync(path,'r');}catch{return null;}
  try{
    const buf=Buffer.alloc(max);
    const n=readSync(fd,buf,0,max,0);
    return buf.toString('utf8',0,n);
  }catch{return null;}
  finally{try{closeSync(fd);}catch{/* already closed */}}
}
/** Leading `---` YAML front matter, parsed as flat key/value pairs only. */
function parseFrontmatter(text){
  if(typeof text!=='string')return null;
  const m=/^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if(!m)return null;
  const out={};
  for(const line of m[1].split(/\r?\n/)){
    const kv=/^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if(!kv)continue;
    let v=kv[2].trim();
    if(/^".*"$/.test(v)||/^'.*'$/.test(v))v=v.slice(1,-1);
    out[kv[1]]=v;
  }
  return out;
}
/** The `interface:` block of a ZCode skill agent descriptor. */
function parseInterface(text){
  const out={};
  let inside=false;
  for(const line of String(text??'').split(/\r?\n/)){
    if(/^interface:\s*$/.test(line)){inside=true;continue;}
    if(inside){
      if(/^\S/.test(line)){inside=false;continue;}
      const kv=/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
      if(kv){
        let v=kv[2].trim();
        if(/^".*"$/.test(v))v=v.slice(1,-1);
        out[kv[1]]=v;
      }
    }
  }
  return out;
}
/** Loopback GET with a bounded timeout. Credentials stay in the headers. */
async function nativeGet(base,path,headers,{timeoutMs=5000,fetchImpl=globalThis.fetch}={}){
  if(!LOOPBACK.test(String(base??'')))throw Object.assign(new Error('not loopback'),{code:'REMOTE_ENDPOINT_FORBIDDEN'});
  if(typeof fetchImpl!=='function')throw Object.assign(new Error('fetch unavailable'),{code:'FETCH_UNAVAILABLE'});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetchImpl(`${base}${path}`,{method:'GET',signal:controller.signal,
      headers:{accept:'application/json',...(headers??{})}});
    const text=await res.text();
    let json=null;try{json=text?JSON.parse(text):null;}catch{json=null;}
    if(!res.ok)throw Object.assign(new Error(`http_${res.status}`),{code:`HTTP_${res.status}`});
    return json;
  }finally{clearTimeout(timer);}
}

// ------------------------------------------------------------ authorisation

/**
 * The Bus registry and its existing grants are the ONLY authority for
 * authorisation. Nothing here can widen a grant.
 *
 * A native agent is AUTHORIZED only when EVERY one of these holds:
 *   * the Bus registry maps EXACTLY ONE agent to this native id
 *   * that agent is `bound` (not unbound, not paused) and carries a binding
 *   * the binding adapter and ref match THIS native source exactly
 *   * the agent carries a valid binding revision
 *   * a live `send` grant covers it
 * Anything else is NOT_AUTHORIZED (with the exact reason), UNREGISTERED (no
 * such Bus agent) or UNKNOWN (the registry could not be read at all).
 */
export function authorizationFor(nativeId,{registry=null,nowIso=null,busAgentId=null,expected=null}={}){
  if(!registry||registry.status!=='AVAILABLE')return {status:'UNKNOWN',reason:'REGISTRY_UNAVAILABLE'};
  const agents=registry.agents??{};
  const grants=registry.grants??{};
  const candidates=busAgentId
    ?(agents[busAgentId]?[agents[busAgentId]]:[])
    :Object.values(agents).filter(a=>a&&(a.agent_id===nativeId||a.binding?.ref===nativeId||a.native_id===nativeId));
  if(candidates.length===0)return {status:'UNREGISTERED',reason:'NO_BUS_AGENT_FOR_THIS_NATIVE_ID'};
  if(candidates.length>1)return {status:'NOT_AUTHORIZED',reason:'AMBIGUOUS_BUS_MAPPING'};
  const agent=candidates[0];
  const why=[];
  if(agent.status!=='bound')why.push('AGENT_NOT_BOUND');
  if(!agent.binding)why.push('NO_BINDING');
  else{
    if(!expected?.adapter)why.push('NO_NATIVE_ADAPTER_MAPPING');
    else if(agent.binding.adapter!==expected.adapter)why.push('ADAPTER_MISMATCH');
    if(expected?.ref!=null&&agent.binding.ref!==expected.ref)why.push('REF_MISMATCH');
  }
  if(!Number.isSafeInteger(agent.revision)||agent.revision<1)why.push('BINDING_REVISION_INVALID');
  if(why.length)return {status:'NOT_AUTHORIZED',reason:why.join('+')};
  const g=selectGrant({grants},agent.agent_id,'send',nowIso??new Date().toISOString());
  if(!g.ok)return {status:'NOT_AUTHORIZED',reason:'NO_LIVE_SEND_GRANT'};
  return {status:'AUTHORIZED',reason:null,grant_id:g.grant.grant_id,binding_revision:agent.revision};
}
/** Authorization for one native id, in the shape a roster entry needs. */
function authFor(nativeId,ctx,mapping={}){
  const a=authorizationFor(nativeId,{registry:ctx.registry,nowIso:ctx.nowIso,...mapping});
  return {authorization:a.status,authorization_reason:a.reason};
}

// -------------------------------------------------------------- entry shape

function nativeEntry({source,kind,nativeId,name,definition,connection,authorization,permission,
  status,ref=null,reason=null,authorization_reason=null,extra=null}){
  return {id:`${source}:${nativeId}`,native_id:nativeId,source,kind,name:clamp(name||nativeId),
    definition,connection,authorization,authorization_reason,permission,status,ref,reason,
    ...(extra??{})};
}
/**
 * READY is the only claim of usability, so it needs every fact: a definition,
 * a live connection, an exactly bound and granted Bus mapping AND a permission
 * state that was actually verified. A native source can DECLARE permissions
 * but never prove that they are enforced, so a native agent stays DEFINED.
 */
function statusFor({kind,definition,connection,authorization,permission}){
  if(kind==='executable')return connection==='BINARY_PRESENT'?'BINARY_PRESENT':'UNAVAILABLE';
  if(kind==='role')return 'CONFIGURED_NOT_REGISTERED';
  if(definition!=='DEFINED')return 'UNKNOWN';
  if(connection!=='CONNECTED')return 'DEFINED';
  if(authorization!=='AUTHORIZED')return 'DEFINED';
  if(permission!=='VERIFIED')return 'DEFINED';
  return 'READY';
}

// ------------------------------------------------------------ opencode source

/** Verified shape: GET /agent -> Agent[] (service envelope {data:[...]}). */
function extractServiceAgents(body){
  const list=Array.isArray(body)?body:(Array.isArray(body?.data)?body.data:null);
  if(!list)return null;
  const out=[];
  for(const item of list){
    if(!item||typeof item!=='object')continue;
    const id=typeof item.id==='string'&&item.id?item.id:(typeof item.name==='string'&&item.name?item.name:null);
    if(!id)continue;
    out.push({id,name:typeof item.name==='string'?item.name:id,
      model:typeof item.model?.id==='string'?item.model.id:null,
      provider:typeof item.model?.providerID==='string'?item.model.providerID:null,
      permissions:Array.isArray(item.permissions)?item.permissions.length:null});
  }
  return out;
}
/** Verified shape: config documents -> agent definition ids. */
function extractConfigAgentIds(body){
  const ids=new Set();
  const add=(map)=>{
    if(!map||typeof map!=='object')return;
    for(const key of Object.keys(map)){
      if(typeof key==='string'&&key)ids.add(key);
    }
  };
  const docs=Array.isArray(body)?body:[body];
  for(const doc of docs){
    if(!doc||typeof doc!=='object')continue;
    add(doc.agents);add(doc.agent);
    if(doc.info&&typeof doc.info==='object'){add(doc.info.agents);add(doc.info.agent);}
  }
  return [...ids];
}
/** Local config files: definition only, never a connection. */
function localConfigAgentIds(configHome){
  const ids=new Set();
  for(const name of ['opencode.json','opencode.jsonc']){
    const text=readBounded(join(configHome,name),MAX_CONFIG_BYTES,configHome);
    if(!text)continue;
    let doc=null;
    try{doc=JSON.parse(text);}catch{continue;}
    for(const map of [doc?.agents,doc?.agent]){
      if(!map||typeof map!=='object')continue;
      for(const key of Object.keys(map))if(key)ids.add(key);
    }
  }
  return [...ids];
}

async function opencodeSource(ctx){
  const source={id:'opencode',status:'UNAVAILABLE',reason:null,endpoint:null,version:null,
    service_ref:null,config_ref:null,agent_count:0,definition_count:0};
  const agents=[];
  let details=null;
  try{details=ctx.discoverService({});}
  catch(error){source.reason=reasonOf(error,'SERVICE_NOT_FOUND');return {source,agents};}
  if(!details||typeof details.url!=='string'||!LOOPBACK.test(details.url)){
    source.reason='REMOTE_ENDPOINT_FORBIDDEN';return {source,agents};}
  source.endpoint=details.url;
  source.service_ref=`${details.url}/api/agent`;
  // Health through the EXISTING client (verified GET /api/info shape).
  try{
    const client=ctx.createClient({baseUrl:details.url,headers:details.headers??{},timeoutMs:ctx.timeoutMs});
    const info=await client.info();
    if(!info||typeof info!=='object')throw Object.assign(new Error('bad health'),{code:'BAD_HEALTH_RESPONSE'});
    source.version=typeof info.version==='string'?info.version:null;
    source.status='AVAILABLE';
  }catch(error){
    source.reason=reasonOf(error,'HEALTH_CHECK_FAILED');
    source.status='UNAVAILABLE';
  }
  // Agents confirmed by the live service.
  const serviceIds=new Set();
  if(source.status==='AVAILABLE'){
    let body=null;
    try{body=await nativeGet(details.url,'/api/agent',details.headers??{},
      {timeoutMs:ctx.timeoutMs,fetchImpl:ctx.fetchImpl});}
    catch(error){source.reason=reasonOf(error,'AGENT_LIST_UNAVAILABLE');}
    const list=body===null?null:extractServiceAgents(body);
    if(list===null&&source.reason===null)source.reason='UNRECOGNISED_API_SHAPE';
    for(const item of list??[]){
      serviceIds.add(item.id);
      const {authorization,authorization_reason}=authFor(item.id,ctx);
      const permission=item.permissions?'DECLARED_UNVERIFIED':'UNKNOWN';
      agents.push(nativeEntry({source:'opencode',kind:'agent',nativeId:item.id,name:item.name,
        definition:'DEFINED',connection:'CONNECTED',authorization,authorization_reason,permission,
        status:statusFor({kind:'agent',definition:'DEFINED',connection:'CONNECTED',authorization,permission}),
        ref:`opencode://agent/${item.id}`,
        extra:{model:item.model??null,provider:item.provider??null,
          definition_source:'opencode-service'}}));
    }
  }
  // Config definitions: a definition is DEFINED, never READY.
  const configIds=new Set();
  if(source.status==='AVAILABLE'){
    try{
      const body=await nativeGet(details.url,'/api/config',details.headers??{},
        {timeoutMs:ctx.timeoutMs,fetchImpl:ctx.fetchImpl});
      for(const id of extractConfigAgentIds(body))configIds.add(id);
    }catch{/* a missing config listing only reduces definitions, never the roster */}
  }
  for(const id of localConfigAgentIds(ctx.configHome))configIds.add(id);
  for(const id of configIds){
    if(serviceIds.has(id))continue;
    const {authorization,authorization_reason}=authFor(id,ctx);
    const permission='UNKNOWN';
    agents.push(nativeEntry({source:'opencode',kind:'agent',nativeId:id,name:id,
      definition:'DEFINED',connection:'NOT_CONNECTED',authorization,authorization_reason,permission,
      status:statusFor({kind:'agent',definition:'DEFINED',connection:'NOT_CONNECTED',authorization,permission}),
      ref:`opencode://config/agent/${id}`,
      reason:'configuration definition only; no live connection was confirmed',
      extra:{definition_source:'config'}}));
  }
  // The executor the Bus binds: definition, connection and authorisation are
  // three separate answers for it.
  const {authorization:executorAuthorization,authorization_reason:executorReason}=authFor('opencode',ctx,
    {busAgentId:'opencode',expected:{adapter:'opencode-v2',ref:'opencode'}});
  const executorConnection=source.status==='AVAILABLE'?'CONNECTED':'NOT_CONNECTED';
  agents.push(nativeEntry({source:'opencode',kind:'executor',nativeId:'opencode',name:'OpenCode executor',
    definition:'DEFINED',connection:executorConnection,
    authorization:executorAuthorization,authorization_reason:executorReason,permission:'UNKNOWN',
    status:statusFor({kind:'agent',definition:'DEFINED',
      connection:executorConnection,authorization:executorAuthorization,permission:'UNKNOWN'}),
    ref:source.service_ref,
    reason:source.status==='AVAILABLE'?null:'native service did not answer',
    extra:{version:source.version,endpoint:source.endpoint}}));
  source.agent_count=agents.length;
  source.definition_count=agents.length;
  return {source,agents};
}

// ---------------------------------------------------------------- zcode source

function zcodeSource(ctx){
  const source={id:'zcode',status:'UNAVAILABLE',reason:null,binary_ref:null,
    definition_root:join(ctx.zcodeRoot,'.agents','skills'),agent_count:0};
  const agents=[];
  const skillsRoot=join(ctx.zcodeRoot,'.agents','skills');
  if(!isDir(skillsRoot)){source.reason='DEFINITION_ROOT_MISSING';return {source,agents};}
  // Native local health: the ZCode bundle is a FILE on disk, never a session.
  const bundle=ctx.zcodeBinaries.find(p=>p&&isFile(p));
  source.binary_ref=bundle??null;
  const connection=bundle?'BINARY_PRESENT':'NOT_RUNNING';
  for(const entry of listDir(skillsRoot)){
    if(!entry.isDirectory())continue;
    const file=join(skillsRoot,entry.name,'agents','openai.yaml');
    if(!isFile(file))continue;
    const text=readBounded(file,MAX_DEF_BYTES,ctx.zcodeRoot);
    if(text===null)continue; // outside the known root, or not a regular file
    const meta=parseInterface(text);
    const nativeId=entry.name;
    const {authorization,authorization_reason}=authFor(nativeId,ctx);
    const permission='UNKNOWN';
    agents.push(nativeEntry({source:'zcode',kind:'agent',nativeId,
      name:meta.display_name||nativeId,
      definition:'DEFINED',connection,authorization,authorization_reason,permission,
      status:statusFor({kind:'agent',definition:'DEFINED',connection,authorization,permission}),
      ref:file,reason:bundle?null:'zcode bundle not found; definition only',
      extra:{description:clamp(meta.short_description??''),definition_source:'local-file'}}));
  }
  source.status=agents.length?'AVAILABLE':'UNAVAILABLE';
  source.reason=agents.length?null:'NO_DEFINITIONS_FOUND';
  source.agent_count=agents.length;
  return {source,agents};
}

// ---------------------------------------------------------------- zbots source

async function zbotsSource(ctx){
  const source={id:'zbots',status:'UNAVAILABLE',reason:null,definition_root:join(ctx.zbotsRoot,'.zcode','agents'),
    health_ref:null,health_status:'UNKNOWN',agent_count:0};
  const agents=[];
  const defsRoot=join(ctx.zbotsRoot,'.zcode','agents');
  if(!isDir(defsRoot)){source.reason='DEFINITION_ROOT_MISSING';return {source,agents};}
  // Provenance from the generated playbook, when it is present.
  const hashes=new Map();
  const playbook=readBounded(join(ctx.zbotsRoot,'.zcode','playbook.json'),MAX_CONFIG_BYTES,ctx.zbotsRoot);
  if(playbook){
    try{
      for(const unit of JSON.parse(playbook)?.units?.agents??[]){
        if(typeof unit?.name==='string'&&typeof unit?.sha256==='string')hashes.set(unit.name,unit.sha256);
      }
    }catch{/* a damaged playbook only costs provenance, never the roster */}
  }
  // Native local health: the toolkit proxy answers /health on loopback.
  const port=Number(ctx.env.PROXY_PORT??6446);
  const healthUrl=Number.isInteger(port)&&port>0&&port<65536?`http://127.0.0.1:${port}/health`:null;
  source.health_ref=healthUrl;
  let connection='UNKNOWN';
  if(healthUrl){
    try{
      await nativeGet(healthUrl.replace(/\/health$/,''),'/health',{},{timeoutMs:ctx.healthTimeoutMs,fetchImpl:ctx.fetchImpl});
      connection='CONNECTED';
      source.health_status='CONNECTED';
    }catch(error){
      connection='NOT_RUNNING';
      source.health_status='NOT_RUNNING';
      source.reason=reasonOf(error,'HEALTH_UNAVAILABLE');
    }
  }
  for(const entry of listDir(defsRoot)){
    if(!entry.isFile()||!entry.name.endsWith('.md'))continue;
    const file=join(defsRoot,entry.name);
    const text=readBounded(file,MAX_DEF_BYTES,ctx.zbotsRoot);
    if(text===null)continue; // outside the known root, or not a regular file
    const meta=parseFrontmatter(text);
    const nativeId=meta?.name&&meta.name?meta.name:entry.name.replace(/\.md$/,'');
    const {authorization,authorization_reason}=authFor(nativeId,ctx);
    const permission='UNKNOWN';
    agents.push(nativeEntry({source:'zbots',kind:'agent',nativeId,
      name:nativeId,
      definition:'DEFINED',connection,authorization,authorization_reason,permission,
      status:statusFor({kind:'agent',definition:'DEFINED',connection,authorization,permission}),
      ref:file,
      reason:connection==='CONNECTED'?null:'no local health endpoint answered; definition only',
      extra:{description:clamp(meta?.description??''),model:clamp(meta?.model??''),
        sha256:hashes.get(nativeId)??null,definition_source:'local-file'}}));
  }
  source.status=agents.length?'AVAILABLE':'UNAVAILABLE';
  if(!agents.length&&!source.reason)source.reason='NO_DEFINITIONS_FOUND';
  source.agent_count=agents.length;
  return {source,agents};
}

// ------------------------------------------------------------------ acp source

async function acpSource(ctx){
  const source={id:'acp',status:'UNAVAILABLE',reason:null,binary_ref:null,agent_count:0};
  const agents=[];
  let probe=null;
  try{probe=ctx.acpProbe();}
  catch(error){source.reason=reasonOf(error,'ACP_BINARY_UNAVAILABLE');}
  const present=probe?.status==='BINARY_PRESENT';
  source.status=present?'AVAILABLE':'UNAVAILABLE';
  source.reason=present?null:reasonOf(probe,'ACP_BINARY_UNAVAILABLE');
  source.binary_ref=present?(probe.endpoint??'in-process-acp'):null;
  const {authorization,authorization_reason}=authFor('acp',ctx,
    {busAgentId:'opencode',expected:{adapter:'acp',ref:'opencode'}});
  const permission='UNKNOWN';
  agents.push(nativeEntry({source:'acp',kind:'executable',nativeId:'acp',name:'ACP executor',
    definition:present?'DEFINED':'UNKNOWN',connection:present?'BINARY_PRESENT':'NOT_RUNNING',
    authorization,authorization_reason,permission,
    status:present?'BINARY_PRESENT':'UNAVAILABLE',
    ref:source.binary_ref,
    reason:present?'executable present; no ACP session was started or claimed':source.reason,
    extra:{session:null,live_verified:false}}));
  source.agent_count=agents.length;
  return {source,agents};
}

// -------------------------------------------------------- aion session roles

function roleSource(ctx){
  const source={id:'aion-sessions',status:'UNAVAILABLE',reason:null,definition_root:ctx.rolesRoot,agent_count:0};
  const agents=[];
  if(!isDir(ctx.rolesRoot)){source.reason='DEFINITION_ROOT_MISSING';return {source,agents};}
  const known=new Set((ctx.catalog??[]).map(r=>String(r?.id??'')));
  for(const entry of listDir(ctx.rolesRoot)){
    if(!entry.isDirectory())continue;
    const m=ROLE_DIR.exec(entry.name);
    if(!m)continue;
    const roleId=m[1];
    if(known.has(roleId))continue; // already in the role catalogue
    const {authorization,authorization_reason}=authFor(roleId,ctx);
    const permission='UNKNOWN';
    agents.push(nativeEntry({source:'aion-sessions',kind:'role',nativeId:entry.name,name:entry.name,
      definition:'DEFINED',connection:'NOT_CONFIGURED',authorization,authorization_reason,permission,
      status:'CONFIGURED_NOT_REGISTERED',
      ref:`workspace/aion/sessions/roles/${entry.name}`,
      reason:'role folder exists on disk but has no ROLES.json entry and no Bus record',
      extra:{role_id:roleId,registered:false}}));
  }
  source.status=agents.length?'AVAILABLE':'UNAVAILABLE';
  source.reason=agents.length?null:'NO_UNREGISTERED_ROLES';
  source.agent_count=agents.length;
  return {source,agents};
}

// ------------------------------------------------------------------ roster

/**
 * Build the native roster. Never throws for a missing or broken source: the
 * roster is always returned, with the failed source reported honestly.
 */
export async function discoverNativeAgents({
  catalog=[],
  registry=null,
  registryError=null,
  env=process.env,
  now=()=>Date.now(),
  fetchImpl=globalThis.fetch,
  repoRoot=REPO_ROOT,
  projectRoot=dirname(REPO_ROOT),
  roots=null,
  discoverService=discoverOpenCodeService,
  createClient=createOpenCodeHttpClient,
  acpProbe=probeAcpBinary,
  zcodeBinaries=null,
  timeoutMs=5000,
  healthTimeoutMs=2500,
}={}){
  const home=env.HOME||env.USERPROFILE||'';
  const ctx={
    env,fetchImpl,registry,registryError,catalog,
    nowIso:new Date(now()).toISOString(),
    repoRoot,projectRoot,
    zcodeRoot:roots?.zcode??join(projectRoot,'ZCode'),
    zbotsRoot:roots?.zbots??join(projectRoot,'zcode-bots'),
    rolesRoot:roots?.roles??join(repoRoot,'workspace','aion','sessions','roles'),
    configHome:roots?.opencodeConfig??join(env.XDG_CONFIG_HOME||join(home,'.config'),'opencode'),
    discoverService,createClient,acpProbe,timeoutMs,healthTimeoutMs,
    zcodeBinaries:zcodeBinaries??['C:\\Program Files\\ZCode\\resources\\glm\\zcode.cjs',
      join(env.LOCALAPPDATA??'','Programs','ZCode','resources','glm','zcode.cjs')],
  };
  const results=[];
  const sources=[];
  // Each source is collected on its own: a crashed source is reported, and the
  // remaining sources still produce their roster.
  const collect=async(id,fn)=>{
    try{const r=await fn();results.push(...r.agents);sources.push(r.source);}
    catch(error){sources.push({id,status:'UNAVAILABLE',reason:reasonOf(error),agent_count:0});}
  };
  await collect('opencode',()=>opencodeSource(ctx));
  await collect('zcode',()=>zcodeSource(ctx));
  await collect('zbots',()=>zbotsSource(ctx));
  await collect('acp',()=>acpSource(ctx));
  await collect('aion-sessions',()=>roleSource(ctx));
  return {
    schema:NATIVE_SCHEMA,
    observed_utc:ctx.nowIso,
    registry:{status:registry?.status==='AVAILABLE'?'AVAILABLE':'UNKNOWN',error:registryError??null},
    count:results.length,
    agents:results,
    sources,
  };
}
