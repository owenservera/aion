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
// No verdict is cached: every call re-reads the ACL, so a directory that
// changes after a check is re-checked on the next call.
import { mkdirSync, lstatSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
  timeoutMs=SECURITY_TIMEOUT_MS}={}){
  const dir=dirname(resolve(filePath));
  mkdirSync(dir,{recursive:true,mode:0o700});
  if(platform!=='win32'){posixPrivate(dir);return dir;}
  const result=await runAclProbe(spawnFn,dir,timeoutMs);
  if(result.error||result.status!==0)throw aclFail();
  return dir;
}

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
