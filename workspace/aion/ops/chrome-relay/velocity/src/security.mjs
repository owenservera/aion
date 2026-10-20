// Verify the local state directory before writing prompt reservations.
//
// TWO variants, ONE verification:
//   * assertPrivateStateDir      — synchronous, kept for compatibility
//   * assertPrivateStateDirAsync — non-blocking twin for runtime probes
//
// The ACL RULE is identical in both and still fails closed: a directory that
// is not owner-only is refused, and a probe that hangs, cannot start or
// returns an unexpected status is refused too. Only the BOUND on the
// PowerShell probe changed (a cold PowerShell start needs seconds, not
// milliseconds), never the rule set and never an authorisation to continue.
//
// Async Windows checks reuse success for the local-owner process lifetime;
// hardened mode caps reuse at 30 s. Failures and sync checks are never cached.
import { mkdirSync, lstatSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

// A cold PowerShell start on this host takes 4-9 s, so an 8 s bound failed
// intermittently and published a false "state ACL not verified". The bound is
// generous ON PURPOSE: it is a bound, not a permission. A probe that exceeds
// it still FAILS CLOSED.
export const SECURITY_TIMEOUT_MS = 30_000;

const WINDOWS_CHECK = `
$ErrorActionPreference='Stop';
$path=[Console]::In.ReadToEnd();
$id=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value;
$acl=Get-Acl -LiteralPath $path;
$allowed=@($id,'S-1-5-18','S-1-5-32-544');
$rights=$acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]);
$bad=@($rights | Where-Object { $_.AccessControlType -eq 'Allow' -and $allowed -notcontains $_.IdentityReference.Value });
if($bad.Count -gt 0){[Console]::Error.Write('ACL_NOT_PRIVATE');exit 3}
exit 0
`;
const aclFail=()=>Object.assign(new Error('Windows state ACL not verified'),{code:'STATE_ACL_UNVERIFIED'});
const windowsArgs=()=>['-NoProfile','-NonInteractive','-EncodedCommand',
  Buffer.from(WINDOWS_CHECK,'utf16le').toString('base64')];
function posixPrivate(dir){
  const st=lstatSync(dir);
  if(st.isSymbolicLink()||!st.isDirectory()||((st.mode&0o077)!==0)||
     (typeof process.getuid==='function' && st.uid!==process.getuid()))
    throw Object.assign(new Error('State directory must be owner-private'),{code:'STATE_ACL_UNVERIFIED'});
}

/**
 * Synchronous verification (compatibility). It BLOCKS the event loop, so it
 * must not run next to a live HTTP probe.
 */
export function assertPrivateStateDir(filePath,{platform=process.platform,run=spawnSync,
  timeoutMs=SECURITY_TIMEOUT_MS}={}){
  const dir=dirname(resolve(filePath));
  mkdirSync(dir,{recursive:true,mode:0o700});
  if(platform==='win32'){
    const result=run('pwsh',windowsArgs(),{input:dir,encoding:'utf8',timeout:timeoutMs,
      windowsHide:true,shell:false});
    if(result.error||result.status!==0)throw aclFail();
  }else{
    posixPrivate(dir);
  }
  return dir;
}

/**
 * Non-blocking twin of the same verification. The ACL probe runs in a child
 * process and the event loop keeps running, so a concurrent HTTP health probe
 * can no longer be starved (a blocked loop used to abort it and publish a raw
 * DOMException code as the failure reason).
 */
export async function assertPrivateStateDirAsync(filePath,{platform=process.platform,spawnFn=spawn,
  timeoutMs=SECURITY_TIMEOUT_MS,cache,cacheMaxAgeMs=ACL_CACHE_MAX_AGE_MS,
  securityProfile,force=false}={}){
  const profile=securityProfile===undefined?activeProfile:parseProfile(securityProfile); // invalid -> before any fs access
  const dir=dirname(resolve(filePath));
  mkdirSync(dir,{recursive:true,mode:0o700});
  if(platform!=='win32'){posixPrivate(dir);return dir;}
  const probe=()=>runAclProbe(spawnFn,dir,timeoutMs);
  // An injected spawnFn never touches the shared process cache.
  const store=cache||(spawnFn===spawn?defaultAclCache:null);
  if(!store){
    const result=await probe();
    if(result.error||result.status!==0)throw aclFail();
    return dir;
  }
  return store.check(dir,probe,cacheMaxAgeMs,{mode:profile,force});
}

// ---- security profile (one resolver, no registry) ------------------------
//   local-owner (DEFAULT): a successful ACL check is reused for the lifetime of
//     the process; connection boundaries may force a refresh.
//   hardened: success is revalidated at least every 30 s.
export const SECURITY_PROFILES=Object.freeze(['local-owner','hardened']);
const profileInvalid=()=>Object.assign(new Error('security profile invalid'),{code:'SECURITY_PROFILE_INVALID'});
function parseProfile(value){
  if(typeof value!=='string'||!SECURITY_PROFILES.includes(value))throw profileInvalid();
  return value;
}
let activeProfile='local-owner';
export const activeSecurityProfile=()=>activeProfile;

/** Env AION_SECURITY_PROFILE beats the config field; absent both -> local-owner. */
export function resolveSecurityProfile({env=process.env,configValue}={}){
  const fromEnv=env?.AION_SECURITY_PROFILE;
  const raw=fromEnv!==undefined?fromEnv:configValue;
  if(raw===undefined)return 'local-owner';
  return parseProfile(raw);
}

/**
 * Entry-point init: resolve (env > config.security_profile > default) and make
 * it the process profile. `config` is an already-loaded host config; otherwise
 * `<stateDir>/host-dev.config.json` is read if it exists (never written).
 * Throws SECURITY_PROFILE_INVALID; the caller must stop before connecting.
 */
export function initSecurityProfile({env=process.env,config,stateDir}={}){
  let configValue=config?.security_profile;
  if(config===undefined&&stateDir){
    let text=null;
    try{text=readFileSync(join(stateDir,'host-dev.config.json'),'utf8');}
    catch(e){if(e?.code!=='ENOENT'&&e?.code!=='ENOTDIR')throw profileInvalid();}
    if(text!==null){
      try{configValue=JSON.parse(text)?.security_profile;}catch{throw profileInvalid();}
    }
  }
  activeProfile=resolveSecurityProfile({env,configValue});
  return activeProfile;
}

// ---- bounded cache of SUCCESSFUL Windows ACL probes ----------------------
// Only success is cached. hardened: at most 30 s (hard cap). local-owner: no
// expiry (process lifetime). Entries are keyed by mode, so a local-owner
// success never satisfies hardened. Directory identity (dev/ino/birthtime) is
// lstat-ed on EVERY call; a symlink, non-directory or replaced directory drops
// the entry. An external ACL change can go unnoticed for up to the max age
// (hardened) or until a forced refresh / restart (local-owner). No tokens or
// text are stored.
export const ACL_CACHE_MAX_AGE_MS = 30_000;
export const ACL_CACHE_MAX_ENTRIES = 128;

export function createAclCache({now=Date.now,maxEntries=ACL_CACHE_MAX_ENTRIES}={}){
  const done=new Map();     // key -> {identity, at, ttl}
  const pending=new Map();  // key -> {identity, promise, cancelled}
  const dirKey=dir=>process.platform==='win32'?dir.toLowerCase():dir;
  const MODES=SECURITY_PROFILES;
  const keyOf=(dir,mode)=>`${mode}\0${dirKey(dir)}`;
  const identityOf=dir=>{
    const st=lstatSync(dir);
    if(st.isSymbolicLink()||!st.isDirectory())throw aclFail();
    return `${st.dev}:${st.ino}:${st.birthtimeMs}`;
  };
  const drop=key=>{
    done.delete(key);
    const p=pending.get(key);
    if(p){p.cancelled=true;pending.delete(key);}
  };
  const dropDir=dir=>{for(const m of MODES)drop(keyOf(dir,m));};
  function prune(){
    const t=now();
    for(const [k,v] of done)if(t-v.at>=v.ttl)done.delete(k);
    while(done.size>maxEntries)done.delete(done.keys().next().value); // oldest inserted
  }
  return {
    async check(dir,probe,maxAgeMs=ACL_CACHE_MAX_AGE_MS,{mode='hardened',force=false}={}){
      if(!MODES.includes(mode))throw profileInvalid();
      const key=keyOf(dir,mode);
      let identity;
      try{identity=identityOf(dir);}catch(error){dropDir(dir);throw error;}
      // hardened is hard-capped at 30 s; local-owner is deliberately unbounded.
      const ttl=mode==='local-owner'?Infinity
        :Math.min(Number.isFinite(maxAgeMs)?maxAgeMs:ACL_CACHE_MAX_AGE_MS,ACL_CACHE_MAX_AGE_MS);
      const hit=done.get(key);
      if(hit){
        if(!force&&hit.identity===identity&&ttl>0&&now()-hit.at<ttl&&now()>=hit.at)return dir;
        done.delete(key);
      }
      let p=pending.get(key);
      if(p&&p.identity!==identity){drop(key);p=undefined;}
      if(!p){
        p={identity,cancelled:false,promise:null};
        const mine=p;
        mine.promise=(async()=>{
          let result;
          try{result=await probe();}
          finally{if(pending.get(key)===mine)pending.delete(key);}
          if(result.error||result.status!==0)throw aclFail();
          if(!mine.cancelled&&ttl>0){
            done.delete(key);
            done.set(key,{identity,at:now(),ttl});
            prune();
          }
        })();
        pending.set(key,mine);
      }
      await p.promise;
      return dir;
    },
    invalidate(dir){
      if(dir===undefined){
        for(const p of pending.values())p.cancelled=true;
        pending.clear();done.clear();return;
      }
      dropDir(resolve(dir));
    },
    size:()=>done.size,
  };
}

const defaultAclCache=createAclCache();

/** Drop one directory (or all when omitted); in-flight probes cannot repopulate. */
export function invalidatePrivateStateDirCache(dir){defaultAclCache.invalidate(dir);}

/** Spawn the ACL probe without blocking; kill it when the bound is exceeded. */
function runAclProbe(spawnFn,dir,timeoutMs){
  return new Promise(resolve=>{
    let child=null,timer=null,settled=false;
    const finish=(status,error)=>{
      if(settled)return;settled=true;
      if(timer)clearTimeout(timer);
      resolve({status,error});
    };
    try{child=spawnFn('pwsh',windowsArgs(),{windowsHide:true,shell:false,stdio:['pipe','ignore','ignore']});}
    catch(error){finish(null,error);return;}
    timer=setTimeout(()=>{
      try{child?.kill();}catch{/* the child is already gone */}
      finish(null,Object.assign(new Error('acl probe timed out'),{code:'ACL_PROBE_TIMEOUT'}));
    },timeoutMs);
     child?.on?.('error',error=>finish(null,error));
     child?.on?.('close',code=>finish(code,null));
     const inputFailed=error=>{
       try{child?.kill();}catch{/* already exited */}
       finish(null,error);
     };
     child?.stdin?.on?.('error',inputFailed);
     try{child.stdin.end(dir);}catch(error){inputFailed(error);}
  });
}
