// Verify the local state directory before writing prompt reservations.
import { mkdirSync, lstatSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
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
export function assertPrivateStateDir(filePath,{platform=process.platform,run=spawnSync}={}){
 const dir=dirname(resolve(filePath));
 mkdirSync(dir,{recursive:true,mode:0o700});
 if(platform==='win32'){
   // PowerShell is part of the owner's existing toolchain; READ-ONLY ACL inspection.
   const encoded=Buffer.from(WINDOWS_CHECK,'utf16le').toString('base64');
   const result=run('pwsh',['-NoProfile','-NonInteractive','-EncodedCommand',encoded],{
     input:dir,encoding:'utf8',timeout:8000,windowsHide:true,shell:false});
   if(result.error||result.status!==0)throw Object.assign(new Error('Windows state ACL not verified'),{code:'STATE_ACL_UNVERIFIED'});
 }else{
   const st=lstatSync(dir);
   if(st.isSymbolicLink()||!st.isDirectory()||((st.mode&0o077)!==0)||
      (typeof process.getuid==='function' && st.uid!==process.getuid())){
     throw Object.assign(new Error('State directory must be owner-private'),{code:'STATE_ACL_UNVERIFIED'});
   }
 }
 return dir;
}
