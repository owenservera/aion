// Guard the ONLY global installation side effect for AION Track B:
// the per-user com.aion.relay.dev Chrome native-host registration.
// Never overwrite another product/user's registration and never remove one
// merely because it has the same registry key.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const refusal=code=>Object.assign(new Error(code),{code});

export function parseRegistryValue(stdout){
  if(typeof stdout!=='string')throw refusal('REGISTRY_QUERY_UNREADABLE');
  const rows=stdout.split(/\r?\n/).filter(s=>/\bREG_\w+\b/.test(s));
  if(rows.length!==1)throw refusal('REGISTRY_QUERY_UNREADABLE');
  const line=rows[0].match(/\b(REG_\w+)\s+(.+)\s*$/);
  if(!line||line[1]!=='REG_SZ'||!line[2].trim())
    throw refusal('REGISTRY_QUERY_UNREADABLE');
  return line[2].trim();
}
export function queryDevRegistration(plan,{run}={}){
  if(plan?.registration?.kind==='registry'){
    if(typeof run!=='function')throw new TypeError('registry runner required');
    const result=run('reg',['query',plan.registration.key,'/ve'],
      {encoding:'utf8',shell:false,windowsHide:true,timeout:10000});
    if(result?.error)throw refusal('REGISTRY_QUERY_FAILED');
    // reg.exe exit 1 can mean missing registration or an access error.
    // Check absence via a second query of the key; never overwrite on ambiguity.
    if(result?.status!==0){
      const check=run('reg',['query',plan.registration.key],
        {encoding:'utf8',shell:false,windowsHide:true,timeout:10000});
      if(check?.error||check?.status===0||check?.status!==1)
        throw refusal('REGISTRY_QUERY_FAILED');
      return {exists:false,path:null};
    }
    return {exists:true,path:parseRegistryValue(result.stdout)};
  }
  const file=plan?.registration?.path;
  if(typeof file!=='string'||!file)throw refusal('REGISTRATION_PLAN_INVALID');
  return existsSync(file)?{exists:true,path:file}:{exists:false,path:null};
}
const DEV_HOST_NAME='com.aion.relay.dev';
function readManifest(read,path){
  let manifest;
  try{manifest=JSON.parse(read(path,'utf8'));}
  catch{throw refusal('DEV_MANIFEST_UNREADABLE');}
  return manifest;
}
/** The dev host manifest contract: OUR launcher, OUR extension id, one origin. */
function assertOwnedDevManifest(manifest,{expectedId,launcher}){
  if(manifest?.name!==DEV_HOST_NAME||manifest?.type!=='stdio'
    ||resolve(manifest.path??'')!==resolve(launcher)
    ||!Array.isArray(manifest.allowed_origins)
    ||manifest.allowed_origins.length!==1
    ||manifest.allowed_origins[0]!==`chrome-extension://${expectedId}/`)
    throw refusal('FOREIGN_DEV_REGISTRATION');
}
export function verifyOwnedRegistration(plan,{run,expectedId,read=readFileSync}={}){
  const current=queryDevRegistration(plan,{run});
  if(!current.exists)return {exists:false,owned:false};
  const registry=plan?.registration?.kind==='registry';
  // (1) WHERE the registration points. It must be exactly the artifact this
  //     plan owns: for a registry the HKCU value names the owned state-dir
  //     manifest; for a file registration it is the owned copy installed in the
  //     user's host-manifest directory (NOT the state-dir source, which is a
  //     separate file).
  const registeredPath=registry?plan.hostManifest:plan.registration?.path;
  if(typeof registeredPath!=='string'||!registeredPath)
    throw refusal('REGISTRATION_PLAN_INVALID');
  if(resolve(current.path)!==resolve(registeredPath))
    throw refusal('FOREIGN_DEV_REGISTRATION');
  // (2) WHAT the registered artifact contains - the copy Chrome would read.
  assertOwnedDevManifest(readManifest(read,current.path),{expectedId,launcher:plan.launcher});
  // (3) WHAT the owned source contains - the state-dir manifest this plan owns.
  //     A file registration installs a COPY, so the registered copy and the
  //     owned source are two different files: BOTH must be exactly our dev
  //     manifest, and the owned receipt (src/browser/setup.mjs) pins the same
  //     extension id, host name and manifest path.
  if(resolve(current.path)!==resolve(plan.hostManifest))
    assertOwnedDevManifest(readManifest(read,plan.hostManifest),{expectedId,launcher:plan.launcher});
  return {exists:true,owned:true};
}
