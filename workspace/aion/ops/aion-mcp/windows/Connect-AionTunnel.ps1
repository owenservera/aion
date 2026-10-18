#requires -Version 7.0
<#
.SYNOPSIS
  Configure and run the official OpenAI Secure MCP Tunnel for the AION read-only server.
.DESCRIPTION
  This requires an owner-created tunnel_id and an eligible ChatGPT workspace.
  This script never records a key in Git, CLI arguments, files or logs. The key
  stays in the current process environment while tunnel-client runs.
.EXAMPLE
  pwsh -NoProfile -File workspace/aion/ops/aion-mcp/windows/Connect-AionTunnel.ps1 -TunnelId tunnel_0123456789abcdef0123456789abcdef
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$TunnelId,
  [ValidatePattern('^[a-zA-Z0-9_-]{2,80}$')][string]$Profile='aion-windows',
  [switch]$OnlyDoctor
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
if(-not $IsWindows){throw 'Run this script on the Windows master'}
if($TunnelId -notmatch '^tunnel_[A-Za-z0-9_-]{12,100}$'){throw 'Provide the real Platform tunnel_id; do not put an API key here'}
$tool=Get-Command 'tunnel-client' -ErrorAction SilentlyContinue
if($null -eq $tool){throw 'Official tunnel-client is not installed. Download it from Platform tunnel settings; never install an unverified binary.'}
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
$server=(Resolve-Path (Join-Path $root 'workspace/aion/ops/aion-mcp/src/server.mjs')).Path
if($null -eq (Get-Command node -ErrorAction SilentlyContinue)){throw 'Node 22+ missing'}
$oldKey=$env:CONTROL_PLANE_API_KEY
$secure=$null
$bstr=[IntPtr]::Zero
try {
  if([string]::IsNullOrWhiteSpace($env:CONTROL_PLANE_API_KEY)){
    $secure=Read-Host 'Enter the restricted Platform tunnel runtime key (hidden input; never paste in chat)' -AsSecureString
    $bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:CONTROL_PLANE_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  if([string]::IsNullOrWhiteSpace($env:CONTROL_PLANE_API_KEY)){throw 'Runtime key unavailable'}
  # The profile only contains the tunnel ID and command path; no runtime key.
  $mcpCommand='"' + (Get-Command node).Source + '" "' + $server + '"'
  & $tool.Source init --sample sample_mcp_stdio_local --profile $Profile --tunnel-id $TunnelId --mcp-command $mcpCommand
  if($LASTEXITCODE -ne 0){throw 'Tunnel profile initialization failed; inspect current tunnel-client help quickstart'}
  & $tool.Source doctor --profile $Profile --explain
  if($LASTEXITCODE -ne 0){throw 'Tunnel doctor failed; check workspace association, account permissions and outbound HTTPS'}
  Write-Host 'Tunnel doctor passed. A private ChatGPT plugin must still be created from ChatGPT Plugins if your workspace supports it.'
  if(-not $OnlyDoctor){
    Write-Host 'Starting foreground tunnel. Keep this process running for ChatGPT tool calls; Ctrl+C stops it.'
    & $tool.Source run --profile $Profile
    if($LASTEXITCODE -ne 0){throw ('Tunnel exited with code '+$LASTEXITCODE)}
  }
} finally {
  if($bstr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)}
  $env:CONTROL_PLANE_API_KEY=$oldKey
  if($null -ne $secure){$secure.Dispose()}
}
