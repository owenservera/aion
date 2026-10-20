// AION P4 — the binding authority of the watch CLI.
//
// HERMETIC BY CONSTRUCTION: every Bus state file used here is FABRICATED in a
// private TEMP directory. The real machine state is never read, never written
// and never repaired.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {
  readBinding,createBindingAuthority,readRoleCatalog,resolveRole,
  defaultBusStatePath,BUS_STATE_KEY,BINDING_CODES,
} from '../src/conversation/binding.mjs';
import {validateConversationBinding} from '../../extension/src/lib/conversation-contract.js';

const ROLE_05='05';
const CANONICAL={
  provider:'chatgpt.com',
  account_key:'acct-hermetic-1',
  conversation_id:'c-hermetic-0001',
  ref:'https://chatgpt.com/c/hermetic-0001',
  revision:3,
};

function agent({status='bound',binding=null,role_id=ROLE_05,revision=3}={}){
  return {
    agent_id:'role-05',parent_agent_id:'owen',name:'05 Chief of Chiefs',kind:'conversation',
    role_id,status,binding,ops:['send','status'],revision,
    created_utc:'2026-10-20T00:00:00.000Z',updated_utc:'2026-10-20T00:00:00.000Z',
  };
}

function busFile(dir,agents){
  const state={
    schema:'aion.bus/1',version:1,created_utc:'2026-10-20T00:00:00.000Z',
    updated_utc:'2026-10-20T00:00:00.000Z',seq:1,
    config:{},kill:{engaged:false,at:null,reason:null},
    commander:{agent_id:null,baseline_sig:null,baseline_utc:null,last_seen_sig:null},
    agents,grants:{},commands:{},nonces:{},observations:{},rate:[],events:[],
  };
  const file=join(dir,'bus.json');
  writeFileSync(file,JSON.stringify({[BUS_STATE_KEY]:state},null,1));
  return file;
}

test('the role catalog resolves the "chief" alias to role 05',()=>{
  const catalog=readRoleCatalog();
  const resolved=resolveRole('chief',catalog);
  assert.equal(resolved.ok,true);
  assert.equal(resolved.role.id,'05');
  const unknown=resolveRole('no-such-role',catalog);
  assert.equal(unknown.ok,false);
  assert.equal(unknown.code,BINDING_CODES.ROLE_UNKNOWN);
});

test('a bound role with complete metadata projects the canonical P1 binding',async()=>{
  const dir=privateStateDir('aion-p4-binding-');
  const file=busFile(dir,{
    owen:{...agent({status:'unbound',binding:null,role_id:null}),agent_id:'owen',kind:'owner'},
    'role-05':agent({binding:{
      adapter:'chatgpt.com',ref:CANONICAL.ref,label:'AION - 05 CHIEF OF CHIEFS',
      bound_utc:'2026-10-20T00:00:00.000Z',confirmed_by:'explicit-local-operator-connect',
      provider:CANONICAL.provider,account_key:CANONICAL.account_key,conversation_id:CANONICAL.conversation_id,
    }}),
  });
  const before=readFileSync(file,'utf8');
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,true);
  assert.equal(result.agent_id,'role-05');
  assert.equal(result.role.id,'05');
  assert.equal(result.binding.provider,CANONICAL.provider);
  assert.equal(result.binding.account_key,CANONICAL.account_key);
  assert.equal(result.binding.conversation_id,CANONICAL.conversation_id);
  assert.equal(result.binding.ref,CANONICAL.ref);
  assert.equal(result.binding.revision,3);
  assert.equal(validateConversationBinding(result.binding),true);
  // READ ONLY: the file is byte-identical afterwards.
  assert.equal(readFileSync(file,'utf8'),before);
});

test('a nested conversation record is projected just as well',async()=>{
  const dir=privateStateDir('aion-p4-binding-nested-');
  const file=busFile(dir,{
    'role-05':agent({binding:{
      adapter:'chatgpt.com',ref:CANONICAL.ref,label:null,
      bound_utc:'2026-10-20T00:00:00.000Z',confirmed_by:'owner',
      conversation:{provider:CANONICAL.provider,account_key:CANONICAL.account_key,
        conversation_id:CANONICAL.conversation_id,ref:CANONICAL.ref,revision:3},
    }}),
  });
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,true);
  assert.equal(result.binding.account_key,CANONICAL.account_key);
  assert.equal(result.binding.conversation_id,CANONICAL.conversation_id);
});

test('a bound role WITHOUT an account key fails closed with BINDING_ACCOUNT_UNPROVEN',async()=>{
  const dir=privateStateDir('aion-p4-binding-noacct-');
  const file=busFile(dir,{
    'role-05':agent({binding:{
      adapter:'chatgpt.com',ref:CANONICAL.ref,label:null,
      bound_utc:'2026-10-20T00:00:00.000Z',confirmed_by:'owner',
      provider:CANONICAL.provider,conversation_id:CANONICAL.conversation_id,
    }}),
  });
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.BINDING_ACCOUNT_UNPROVEN);
  assert.equal(result.binding,undefined);
});

test('an unbound role fails closed with CHIEF_UNBOUND and never binds itself',async()=>{
  const dir=privateStateDir('aion-p4-binding-unbound-');
  const file=busFile(dir,{'role-05':agent({status:'unbound',binding:null})});
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.CHIEF_UNBOUND);
  // The state file was NOT changed: no auto-bind, no auto-select.
  const state=JSON.parse(readFileSync(file,'utf8'))[BUS_STATE_KEY];
  assert.equal(state.agents['role-05'].status,'unbound');
  assert.equal(state.agents['role-05'].binding,null);
});

test('another role that is unbound reports ROLE_UNBOUND, not CHIEF_UNBOUND',async()=>{
  const dir=privateStateDir('aion-p4-binding-other-');
  const file=busFile(dir,{
    'role-05':agent({status:'unbound',binding:null}),
    'role-03':{...agent({status:'unbound',binding:null,role_id:'03'}),agent_id:'role-03'},
  });
  const result=await readBinding({stateFile:file,alias:'cos'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.ROLE_UNBOUND);
});

test('an absent state file fails closed with BINDING_STATE_ABSENT',async()=>{
  const dir=privateStateDir('aion-p4-binding-absent-');
  const result=await readBinding({stateFile:join(dir,'nothing.json'),alias:'chief'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.BINDING_STATE_ABSENT);
});

test('a file that is not a Bus state fails closed with BINDING_STATE_UNREADABLE',async()=>{
  const dir=privateStateDir('aion-p4-binding-garbage-');
  const file=join(dir,'bus.json');
  writeFileSync(file,JSON.stringify({something:'else'}));
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.BINDING_STATE_UNREADABLE);
});

test('the host seam answers with the OWNER binding, never with the claim',async()=>{
  const dir=privateStateDir('aion-p4-authority-');
  const file=busFile(dir,{
    'role-05':agent({binding:{
      adapter:'chatgpt.com',ref:CANONICAL.ref,label:null,
      bound_utc:'2026-10-20T00:00:00.000Z',confirmed_by:'owner',
      provider:CANONICAL.provider,account_key:CANONICAL.account_key,
      conversation_id:CANONICAL.conversation_id,
    }}),
  });
  const authority=createBindingAuthority({stateFile:file,alias:'chief'});
  const granted=await authority(CANONICAL);
  assert.equal(granted.authorized,true);
  assert.equal(granted.binding.account_key,CANONICAL.account_key);
  // A claim for a DIFFERENT conversation is refused: the owner decides.
  const refused=await authority({...CANONICAL,conversation_id:'c-other'});
  assert.equal(refused.authorized,false);
  assert.equal(refused.code,'BINDING_NOT_AUTHORIZED');
});

test('the default Bus state path is the Track B private state file',()=>{
  const path=defaultBusStatePath({LOCALAPPDATA:'C:\\local\\appdata'});
  assert.equal(path.endsWith('bus.json'),true);
  assert.equal(path.includes('track-b'),true);
});

test('a non-private state directory is refused by the private-dir gate',async()=>{
  // A plain TEMP directory inherits a permissive DACL on Windows; the
  // production check must refuse it. On POSIX the mode must not be 0700.
  const dir=mkdtempSync(join(tmpdir(),'aion-p4-public-'));
  const file=busFile(dir,{'role-05':agent({status:'unbound',binding:null})});
  const result=await readBinding({stateFile:file,alias:'chief'});
  assert.equal(result.ok,false);
  assert.equal(result.code,BINDING_CODES.STATE_ACL_UNVERIFIED);
});
