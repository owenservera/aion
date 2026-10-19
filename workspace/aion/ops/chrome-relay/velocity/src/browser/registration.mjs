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
export function verifyOwnedRegistration(plan,{run,expectedId,read=readFileSync}={}){
  const current=queryDevRegistration(plan,{run});
  if(!current.exists)return {exists:false,owned:false};
  if(resolve(current.path)!==resolve(plan.hostManifest))
    throw refusal('FOREIGN_DEV_REGISTRATION');
  let manifest;
  try{manifest=JSON.parse(read(plan.hostManifest,'utf8'));}
  catch{throw refusal('DEV_MANIFEST_UNREADABLE');}
  if(manifest?.name!=='com.aion.relay.dev'||manifest?.type!=='stdio'
    ||resolve(manifest.path??'')!==resolve(plan.launcher)
    ||!Array.isArray(manifest.allowed_origins)
    ||manifest.allowed_origins.length!==1
    ||manifest.allowed_origins[0]!==`chrome-extension://${expectedId}/`)
    throw refusal('FOREIGN_DEV_REGISTRATION');
  return {exists:true,owned:true};
}
