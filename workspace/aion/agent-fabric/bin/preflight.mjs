#!/usr/bin/env node
// Read-only local AION Agent Fabric design preflight. Does not run providers.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const ROOT=fileURLToPath(new URL('../../../../',import.meta.url));
const REPORT_SCHEMA='aion.agent-fabric.preflight/1';
const read=(p)=>JSON.parse(readFileSync(join(ROOT,p),'utf8'));
const probeCommand=(command,args)=>{
 const r=spawnSync(command,args,{cwd:ROOT,encoding:'utf8',timeout:6000,shell:false,windowsHide:true});
 return r.error?{state:'UNAVAILABLE',reason:r.error.code??'SPAWN_ERROR'}:
   r.status===0?{state:'PRESENT_NOT_AUTHENTICATED',reported_version:r.stdout?.trim().slice(0,160)??''}:
   {state:'UNAVAILABLE',reason:'EXIT_'+r.status};
};
export function inspectRoles({catalog,dirs}){
 if(!Array.isArray(catalog?.roles))throw new Error('INVALID_ROLE_CATALOG');
 const registered=new Map,aliases=new Map;
 for(const role of catalog.roles){
   const id=role.id;
   if(registered.has(id))throw new Error('DUPLICATE_ROLE_ID');
   registered.set(id,role);
   for(const alias of role.aliases??[]){
     if(aliases.has(alias))throw new Error('DUPLICATE_ROLE_ALIAS');
     aliases.set(alias,id);
   }
 }
 const designed=[...new Set(dirs.map(s=>s.match(/^([0-9]{2})-/)?.[1]).filter(Boolean))].sort();
 const roles=designed.map(id=>({
   id,kind:'STANDING_ROLE',
   state:registered.has(id)?'IN_LAUNCHER':'DESIGNED_UNREGISTERED',
   binding:'NOT_CHECKED_BY_DESIGN_PREFLIGHT',
   live_session:'UNKNOWN'
 }));
 for(const id of registered.keys())if(!designed.includes(id))
   roles.push({id,kind:'STANDING_ROLE',state:'LAUNCHER_WITHOUT_ROLE_FOLDER',
     binding:'NOT_CHECKED_BY_DESIGN_PREFLIGHT',live_session:'UNKNOWN'});
 return {roles:roles.sort((a,b)=>a.id.localeCompare(b.id)),launcher_count:catalog.roles.length,
   designed_count:designed.length,discrepancies:roles.filter(x=>x.state!=='IN_LAUNCHER')};
}
export function buildPreflight({catalog,roleDirs,toolProbe=probeCommand,gitProbe=probeCommand}){
 const roster=inspectRoles({catalog,dirs:roleDirs});
 return {schema:REPORT_SCHEMA,execution:'LOCAL_READ_ONLY',
  node:process.version,
  git:gitProbe('git',['rev-parse','HEAD']),
  engines:{opencode:toolProbe('opencode',['--version']),zcode:toolProbe('zcode',['--version'])},
  roster,
  integration:'DESIGN_CONTRACTS_ONLY',
  runtime_broker:'NOT_PROBED',
  localhost_connected:'UNKNOWN',
  verified_live_send:false,
  next_action:'Run the dedicated AION Agent Fabric M1/M2 handoff from the Track B implementation worktree'};
}
export function main({print=s=>process.stdout.write(s+'\n')}={}){
 const catalog=read('workspace/aion/ops/chrome-relay/role-launcher/ROLES.json');
 const root=resolve(ROOT,'workspace/aion/sessions/roles');
 const roleDirs=readdirSync(root).filter(n=>{
   try{return statSync(join(root,n)).isDirectory()}catch{return false}
 });
 const report=buildPreflight({catalog,roleDirs});
 print(JSON.stringify(report,null,2));
 return report.roster.discrepancies.length?0:0; // drift is reported, not failure
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 process.exitCode=main();
