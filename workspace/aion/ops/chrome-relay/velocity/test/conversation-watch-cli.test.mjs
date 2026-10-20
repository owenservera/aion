// AION P4 — the local CLI surface.
//
// HERMETIC: the CLI is spawned against a FABRICATED Bus state file in a
// private TEMP directory. The real machine state is never read.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {parseCommand,COMMAND_CODES} from '../src/commands.mjs';
import {BUS_STATE_KEY} from '../src/conversation/binding.mjs';

const VELOCITY=join(dirname(fileURLToPath(import.meta.url)),'..');
const CLI=join(VELOCITY,'bin','aion-local.mjs');

function busState({accountKey='acct-hermetic-1',status='bound'}={}){
  const binding=status==='bound'?{
    adapter:'chatgpt.com',ref:'https://chatgpt.com/c/hermetic-1',label:'AION - 05 CHIEF OF CHIEFS',
    bound_utc:'2026-10-20T00:00:00.000Z',confirmed_by:'explicit-local-operator-connect',
    provider:'chatgpt.com',conversation_id:'hermetic-1',
    ...(accountKey?{account_key:accountKey}:{}),
  }:null;
  return {
    schema:'aion.bus/1',version:1,created_utc:'2026-10-20T00:00:00.000Z',
    updated_utc:'2026-10-20T00:00:00.000Z',seq:1,config:{},kill:{engaged:false,at:null,reason:null},
    commander:{agent_id:null,baseline_sig:null,baseline_utc:null,last_seen_sig:null},
    agents:{
      'role-05':{
        agent_id:'role-05',parent_agent_id:'owen',name:'05 Chief of Chiefs',kind:'conversation',
        role_id:'05',status,binding,ops:['send','status'],revision:2,
        created_utc:'2026-10-20T00:00:00.000Z',updated_utc:'2026-10-20T00:00:00.000Z',
      },
    },
    grants:{},commands:{},nonces:{},observations:{},rate:[],events:[],
  };
}
function writeBus(dir,state){
  const file=join(dir,'bus.json');
  writeFileSync(file,JSON.stringify({[BUS_STATE_KEY]:state},null,1));
  return file;
}
function runCli(args,{stateFile}={}){
  return spawnSync(process.execPath,[CLI,...args],{
    cwd:VELOCITY,encoding:'utf8',timeout:60000,windowsHide:true,shell:false,
    env:{...process.env,...(stateFile?{AION_DEV_STATE:stateFile}:{})},
  });
}

test('the parser accepts exactly `aion chat <role> --watch`',()=>{
  const parsed=parseCommand(['chat','chief','--watch']);
  assert.equal(parsed.ok,true);
  assert.equal(parsed.command,'chat');
  assert.equal(parsed.role,'chief');
  assert.equal(parsed.watch,true);
});

test('the parser has no send path at all',()=>{
  assert.equal(parseCommand(['chat','chief']).code,COMMAND_CODES.WATCH_ONLY);
  assert.equal(parseCommand(['chat','chief','--send','hello']).code,COMMAND_CODES.BAD_COMMAND);
  assert.equal(parseCommand(['send','chief']).code,COMMAND_CODES.BAD_COMMAND);
  assert.equal(parseCommand(['chat','--watch']).code,COMMAND_CODES.BAD_COMMAND);
  assert.equal(parseCommand([]).code,COMMAND_CODES.BAD_COMMAND);
  assert.equal(parseCommand(['help']).command,'help');
});

test('`aion chat chief` without --watch refuses and never reaches a transport',()=>{
  const dir=privateStateDir('aion-p4-cli-nowatch-');
  const file=writeBus(dir,busState());
  const result=runCli(['chat','chief'],{stateFile:file});
  assert.equal(result.status,2);
  assert.match(result.stdout,/watch-only/);
});

test('a bound chief WITHOUT an account key fails closed (exit 3)',()=>{
  const dir=privateStateDir('aion-p4-cli-noacct-');
  const file=writeBus(dir,busState({accountKey:null}));
  const result=runCli(['chat','chief','--watch'],{stateFile:file});
  assert.equal(result.status,3);
  const payload=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(payload.ok,false);
  assert.equal(payload.code,'BINDING_ACCOUNT_UNPROVEN');
});

test('an unbound chief fails closed with CHIEF_UNBOUND (exit 3)',()=>{
  const dir=privateStateDir('aion-p4-cli-unbound-');
  const file=writeBus(dir,busState({status:'unbound'}));
  const result=runCli(['chat','chief','--watch'],{stateFile:file});
  assert.equal(result.status,3);
  const payload=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(payload.code,'CHIEF_UNBOUND');
});

test('an unknown role fails closed with ROLE_UNKNOWN (exit 3)',()=>{
  const dir=privateStateDir('aion-p4-cli-unknown-');
  const file=writeBus(dir,busState());
  const result=runCli(['chat','no-such-role','--watch'],{stateFile:file});
  assert.equal(result.status,3);
  const payload=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(payload.code,'ROLE_UNKNOWN');
});

test('a bound chief with a host that is not running fails closed (exit 4)',()=>{
  const dir=privateStateDir('aion-p4-cli-nohost-');
  const file=writeBus(dir,busState());
  const result=runCli(['chat','chief','--watch'],{stateFile:file});
  assert.equal(result.status,4);
  const payload=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(payload.ok,false);
  assert.equal(payload.code,'HOST_NOT_RUNNING');
});

test('the help text is printed without touching any state',()=>{
  const dir=privateStateDir('aion-p4-cli-help-');
  const file=writeBus(dir,busState());
  const result=runCli(['help'],{stateFile:file});
  assert.equal(result.status,0);
  assert.match(result.stdout,/aion chat <role> --watch/);
});
