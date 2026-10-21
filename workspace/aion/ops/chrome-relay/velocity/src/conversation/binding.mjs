// AION P4 — the BINDING AUTHORITY of the watch-only CLI.
//
// WHAT THIS FILE IS
//   The ONE place that decides WHICH conversation the CLI may observe. It
//   reads the owner's EXISTING local Bus state file READ ONLY. That file has
//   the chrome.storage shape: one wrapper key `aion.relay.bus.v1` holding the
//   Bus V1 state (schema `aion.bus/1`), so the same record the extension sees
//   is the record the CLI reads.
//
// WHAT IT NEVER DOES
//   - it never opens, mutates, bootstraps, repairs or re-binds the Bus;
//   - it never invents an account key, a conversation id, a revision or a ref;
//   - it never picks a role the owner did not name and never falls back to
//     another role;
//   - it never prints the Bus, a token, a grant or a credential;
//   - it never grants read scope by itself: it only REPORTS the owner's
//     existing binding.
//
// FAIL CLOSED CODES (fixed strings, never prose)
//   ROLE_UNKNOWN            the alias matches no role in the role catalog
//   ROLE_AMBIGUOUS          the alias matches more than one role / agent
//   CHIEF_UNBOUND           role 05 (CHIEF OF CHIEFS) has no bound agent
//   ROLE_UNBOUND            any other role has no bound agent
//   BINDING_ACCOUNT_UNPROVEN  the bound agent carries NO account key
//   BINDING_METADATA_INCOMPLETE  provider/conversation/ref/revision missing
//   BINDING_STATE_ABSENT    the Bus state file (or its directory) is absent
//   BINDING_STATE_UNREADABLE  the file is not a readable `aion.bus/1` state
//   STATE_ACL_UNVERIFIED    the state directory is not owner-private
//
// The projection is EXACTLY the five canonical P1 fields. Anything else in the
// record is dropped, and a field that is not actually present is reported as
// missing — never guessed.
import {readFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {assertPrivateStateDirAsync} from '../security.mjs';
import {validateConversationBinding} from '../../../extension/src/lib/conversation-contract.js';
import {canonicalizeEmail} from '../../../extension/src/providers/chatgpt/account-registration.js';

/** The one storage wrapper key the Bus state file uses. */
export const BUS_STATE_KEY='aion.relay.bus.v1';
/** The Bus V1 state schema inside that wrapper. */
export const BUS_SCHEMA='aion.bus/1';
/** The role catalog that ships with the repository. */
export const DEFAULT_CATALOG_PATH=fileURLToPath(new URL('../../../role-launcher/ROLES.json',import.meta.url));

export const BINDING_CODES=Object.freeze({
  ROLE_UNKNOWN:'ROLE_UNKNOWN',
  ROLE_AMBIGUOUS:'ROLE_AMBIGUOUS',
  CHIEF_UNBOUND:'CHIEF_UNBOUND',
  ROLE_UNBOUND:'ROLE_UNBOUND',
  BINDING_ACCOUNT_UNPROVEN:'BINDING_ACCOUNT_UNPROVEN',
  BINDING_METADATA_INCOMPLETE:'BINDING_METADATA_INCOMPLETE',
  BINDING_STATE_ABSENT:'BINDING_STATE_ABSENT',
  BINDING_STATE_UNREADABLE:'BINDING_STATE_UNREADABLE',
  STATE_ACL_UNVERIFIED:'STATE_ACL_UNVERIFIED',
  ROLE_CATALOG_UNAVAILABLE:'ROLE_CATALOG_UNAVAILABLE',
});

const isPlain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.length>0&&v.length<=512;

/**
 * The default local Bus state file: the Track B private state file, exactly
 * where the Track B host session and the browser setup receipt live.
 */
export function defaultBusStatePath(env=process.env){
  const home=env.LOCALAPPDATA||join(env.USERPROFILE||env.HOME||homedir(),'.aion');
  return resolve(env.AION_DEV_STATE||join(home,'AION','track-b','bus.json'));
}

/** The role catalog (ROLES.json). Read only; never rewritten. */
export function readRoleCatalog({catalogPath=DEFAULT_CATALOG_PATH}={}){
  let raw;
  try{raw=JSON.parse(readFileSync(catalogPath,'utf8'));}
  catch{throw Object.assign(new Error('role catalog unreadable'),{code:BINDING_CODES.ROLE_CATALOG_UNAVAILABLE});}
  if(raw?.schema!=='aion.role-launcher/0.1'||!Array.isArray(raw.roles))
    throw Object.assign(new Error('role catalog invalid'),{code:BINDING_CODES.ROLE_CATALOG_UNAVAILABLE});
  return raw;
}

/** The role an alias names. Alias, role id and role code all resolve. */
export function resolveRole(alias,catalog){
  if(typeof alias!=='string'||!alias.trim())
    return {ok:false,code:BINDING_CODES.ROLE_UNKNOWN};
  const wanted=alias.trim().toLowerCase();
  const roles=Array.isArray(catalog?.roles)?catalog.roles:[];
  const matches=roles.filter(role=>{
    if(!role||typeof role.id!=='string')return false;
    if(role.id.toLowerCase()===wanted)return true;
    if(typeof role.code==='string'&&role.code.toLowerCase()===wanted)return true;
    return Array.isArray(role.aliases)&&role.aliases.some(a=>typeof a==='string'&&a.toLowerCase()===wanted);
  });
  if(matches.length===0)return {ok:false,code:BINDING_CODES.ROLE_UNKNOWN};
  if(matches.length>1)return {ok:false,code:BINDING_CODES.ROLE_AMBIGUOUS};
  return {ok:true,role:matches[0]};
}

/** The unbound code of a role: role 05 is the CHIEF, every other role is not. */
function unboundCode(role){
  return String(role?.id)==='05'?BINDING_CODES.CHIEF_UNBOUND:BINDING_CODES.ROLE_UNBOUND;
}

/**
 * The conversation id of a canonical conversation URL, or ''.
 * Only the two ChatGPT web hosts the observer knows are considered.
 */
export function conversationIdFromRef(ref){
  if(!text(ref))return '';
  let url;
  try{url=new URL(ref);}catch{return '';}
  if(url.protocol!=='https:'||!['chatgpt.com','chat.openai.com'].includes(url.hostname))return '';
  const match=/^\/c\/([A-Za-z0-9_-]{8,128})\/?$/.exec(url.pathname);
  return match?match[1]:'';
}

/**
 * READ the owner's Bus state file. Private directory gate first, then one
 * read-only parse. Nothing is written, created or repaired.
 */
export async function readBusState({stateFile}={}){
  const file=resolve(stateFile);
  const dir=dirname(file);
  if(!existsSync(dir))return {ok:false,code:BINDING_CODES.BINDING_STATE_ABSENT};
  try{await assertPrivateStateDirAsync(file);}
  catch{return {ok:false,code:BINDING_CODES.STATE_ACL_UNVERIFIED};}
  if(!existsSync(file))return {ok:false,code:BINDING_CODES.BINDING_STATE_ABSENT};
  let parsed;
  try{parsed=JSON.parse(readFileSync(file,'utf8'));}
  catch{return {ok:false,code:BINDING_CODES.BINDING_STATE_UNREADABLE};}
  if(!isPlain(parsed))return {ok:false,code:BINDING_CODES.BINDING_STATE_UNREADABLE};
  const state=parsed[BUS_STATE_KEY];
  if(!isPlain(state))return {ok:false,code:BINDING_CODES.BINDING_STATE_UNREADABLE};
  if(state.schema!==BUS_SCHEMA)return {ok:false,code:BINDING_CODES.BINDING_STATE_UNREADABLE};
  return {ok:true,state};
}

/** The bound conversation agent of a role, or a fixed code. */
function findAgent(state,role,alias){
  const agents=isPlain(state?.agents)?state.agents:{};
  const byId=isPlain(alias)&&Object.hasOwn(agents,alias)?agents[alias]:null;
  if(byId&&byId.kind==='conversation'){
    if(byId.role_id&&byId.role_id!==role.id)return {ok:false,code:BINDING_CODES.ROLE_AMBIGUOUS};
    return {ok:true,agent:byId};
  }
  const candidates=Object.values(agents).filter(a=>isPlain(a)&&a.kind==='conversation'&&a.role_id===role.id);
  if(candidates.length===0)return {ok:false,code:unboundCode(role)};
  if(candidates.length>1)return {ok:false,code:BINDING_CODES.ROLE_AMBIGUOUS};
  return {ok:true,agent:candidates[0]};
}

/**
 * The metadata of a bound agent, WITHOUT the account key.
 *
 * The account key is NOT part of the Bus record for most roles: it comes from
 * the LOCAL REGISTRATION (the owner's registered lane). The projection never
 * invents one, and a record without a usable ref/provider/conversation id is
 * refused.
 */
export function projectRecord(agent,role){
  if(!isPlain(agent))return {ok:false,code:unboundCode(role)};
  if(agent.status!=='bound'||!isPlain(agent.binding))
    return {ok:false,code:unboundCode(role)};
  const binding=agent.binding;
  const record=isPlain(binding.conversation)?binding.conversation
    :(isPlain(binding.conversation_binding)?binding.conversation_binding:binding);

  const accountKey=text(record.account_key)?record.account_key:(text(binding.account_key)?binding.account_key:'');
  const ref=text(binding.ref)?binding.ref:(text(record.ref)?record.ref:'');
  const provider=text(record.provider)?record.provider:(text(binding.provider)?binding.provider:(text(binding.adapter)?binding.adapter:''));
  const conversationId=text(record.conversation_id)?record.conversation_id
    :(text(binding.conversation_id)?binding.conversation_id:conversationIdFromRef(ref));
  const revision=Number.isSafeInteger(agent.revision)&&agent.revision>0?agent.revision:0;

  if(!ref||!provider||!conversationId||!revision)
    return {ok:false,code:BINDING_CODES.BINDING_METADATA_INCOMPLETE};

  return {ok:true,record:{provider,ref,conversation_id:conversationId,revision,
    account_key:accountKey||null}};
}

/**
 * The canonical P1 binding of a bound agent.
 *
 * The projection uses ONLY actual metadata:
 *   ref          <- the agent's bound ref
 *   revision     <- the registry revision of the agent (an actual counter)
 *   provider     <- an explicit provider field, else the bound adapter name
 *   account_key  <- an explicit account key of the record, else the owner's
 *                   LOCAL REGISTRATION. It is never taken from the caller.
 *   conversation_id <- an explicit field, else the id inside the bound URL
 */
export function projectBinding(agent,role,{accountKey}={}){
  const projected=projectRecord(agent,role);
  if(!projected.ok)return projected;
  const {provider,ref,conversation_id,revision}=projected.record;
  const fromRegistration=accountKey?canonicalizeEmail(accountKey):null;
  const accountKeyFinal=projected.record.account_key||fromRegistration;
  if(!accountKeyFinal)return {ok:false,code:BINDING_CODES.BINDING_ACCOUNT_UNPROVEN};

  const binding={provider,account_key:accountKeyFinal,conversation_id,ref,revision};
  if(!validateConversationBinding(binding))
    return {ok:false,code:BINDING_CODES.BINDING_METADATA_INCOMPLETE};
  return {ok:true,binding};
}

/**
 * The owner's LOCAL REGISTRATION, when there is one.
 *
 * A function is called (the host re-reads the registration on every request,
 * which is a bounded LOCAL read, never an account poll). An object is used
 * as it is. Anything else is "no registration".
 */
export async function resolveRegistration(registration){
  if(typeof registration==='function'){
    try{return await registration();}catch{return null;}
  }
  return isPlain(registration)?registration:null;
}

/**
 * The owner's binding for ONE role.
 *
 *   {ok:true, binding, role, agent_id, revision, state_file}
 *   {ok:false, code, role?}
 *
 * `registration` is the owner's LOCAL account registration (an object, or a
 * function that re-reads it). It supplies the account key for roles whose Bus
 * record has none. It is NEVER taken from the caller's payload.
 */
export async function readBinding({stateFile=defaultBusStatePath(),alias,catalog,registration=null}={}){
  let roleCatalog=catalog;
  if(!roleCatalog){
    try{roleCatalog=readRoleCatalog();}
    catch(error){return {ok:false,code:error.code??BINDING_CODES.ROLE_CATALOG_UNAVAILABLE};}
  }
  const resolved=resolveRole(alias,roleCatalog);
  if(!resolved.ok)return {ok:false,code:resolved.code};
  const role=resolved.role;
  const bus=await readBusState({stateFile});
  if(!bus.ok)return {ok:false,code:bus.code,role};
  const found=findAgent(bus.state,role,alias);
  if(!found.ok)return {ok:false,code:found.code,role};
  const account=await resolveRegistration(registration);
  const projected=projectBinding(found.agent,role,{accountKey:account?.email??null});
  if(!projected.ok)return {ok:false,code:projected.code,role};
  return {
    ok:true,
    binding:projected.binding,
    role:{id:role.id,code:role.code??null,aliases:Array.isArray(role.aliases)?role.aliases.slice():[]},
    agent_id:found.agent.agent_id,
    revision:projected.binding.revision,
    state_file:resolve(stateFile),
  };
}

/**
 * The owner's binding for the role that is bound to a CONVERSATION, WITHOUT
 * the account key.
 *
 * This is what an explicit account registration needs: the exact bound URL of
 * the role the owner named. It never selects a role, never rebinds and never
 * touches the Bus.
 */
export async function readBoundRole({stateFile=defaultBusStatePath(),alias,catalog}={}){
  let roleCatalog=catalog;
  if(!roleCatalog){
    try{roleCatalog=readRoleCatalog();}
    catch(error){return {ok:false,code:error.code??BINDING_CODES.ROLE_CATALOG_UNAVAILABLE};}
  }
  const resolved=resolveRole(alias,roleCatalog);
  if(!resolved.ok)return {ok:false,code:resolved.code};
  const role=resolved.role;
  const bus=await readBusState({stateFile});
  if(!bus.ok)return {ok:false,code:bus.code,role};
  const found=findAgent(bus.state,role,alias);
  if(!found.ok)return {ok:false,code:found.code,role};
  const projected=projectRecord(found.agent,role);
  if(!projected.ok)return {ok:false,code:projected.code,role};
  return {
    ok:true,
    role:{id:role.id,code:role.code??null,aliases:Array.isArray(role.aliases)?role.aliases.slice():[]},
    agent_id:found.agent.agent_id,
    provider:projected.record.provider,
    ref:projected.record.ref,
    conversation_id:projected.record.conversation_id,
    revision:projected.record.revision,
    state_file:resolve(stateFile),
  };
}

/**
 * The owner's binding for a CLAIM, for ANY role.
 *
 * The claim is a claim: the owner's Bus record decides. The role is whatever
 * role the conversation is bound to - the authority is not hard-coded to one
 * role. A claim that matches no bound agent is refused.
 */
export async function readBoundClaim({stateFile=defaultBusStatePath(),claim,registration=null}={}){
  const bus=await readBusState({stateFile});
  if(!bus.ok)return {ok:false,code:bus.code};
  const agents=isPlain(bus.state?.agents)?bus.state.agents:{};
  const account=await resolveRegistration(registration);
  const wanted=isPlain(claim)?claim:{};
  const matches=[];
  for(const agent of Object.values(agents)){
    if(!isPlain(agent)||agent.kind!=='conversation')continue;
    const projected=projectBinding(agent,{id:agent.role_id??''},{accountKey:account?.email??null});
    if(!projected.ok)continue;
    const binding=projected.binding;
    const same=['provider','conversation_id','ref','revision']
      .every(field=>binding[field]===wanted[field]);
    if(!same)continue;
    if(wanted.account_key!==undefined&&wanted.account_key!==binding.account_key)continue;
    matches.push({binding,agent_id:agent.agent_id,role_id:agent.role_id??null});
  }
  if(matches.length===0)return {ok:false,code:'BINDING_NOT_AUTHORIZED'};
  if(matches.length>1)return {ok:false,code:BINDING_CODES.ROLE_AMBIGUOUS};
  const found=matches[0];
  return {
    ok:true,
    binding:found.binding,
    role:{id:found.role_id,code:null,aliases:[]},
    agent_id:found.agent_id,
    revision:found.binding.revision,
    state_file:resolve(stateFile),
  };
}

/**
 * The HOST seam: `readBinding(claim)` — the same shape the Track B host
 * expects from its `readBinding` option. The claim is a CLAIM: the owner's
 * record decides. An owner record that no longer matches the claim answers
 * `authorized:false` and the host refuses the receive call.
 *
 * With `alias` the authority is scoped to that role; without it, ANY role
 * whose bound conversation matches the claim is accepted - the registration
 * authorises the LANE, not one hard-coded role.
 */
export function createBindingAuthority({stateFile=defaultBusStatePath(),alias=null,catalog,registration=null}={}){
  return async function authority(claim){
    const found=alias
      ?await readBinding({stateFile,alias,catalog,registration})
      :await readBoundClaim({stateFile,claim,registration});
    if(!found.ok)return {authorized:false,code:found.code};
    if(isPlain(claim)){
      const same=['provider','account_key','conversation_id','ref','revision']
        .every(field=>claim[field]===found.binding[field]);
      if(!same)return {authorized:false,code:'BINDING_NOT_AUTHORIZED'};
    }
    return {authorized:true,binding:found.binding};
  };
}
