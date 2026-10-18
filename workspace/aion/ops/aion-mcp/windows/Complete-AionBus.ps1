#requires -Version 7.0
<#
.SYNOPSIS
    One-pass AION bus readiness on the OWNER WINDOWS MASTER.
.DESCRIPTION
    Executes local code suites, registers ONLY the missing pinned Chrome native host,
    exercises the local read-only MCP server, and writes a sanitized readiness receipt.
    Does not touch ChatGPT's authenticated session, dispatch a model prompt, upload
    data, install software, change Git branches, or create an OpenAI tunnel.
.EXAMPLE
    pwsh -NoProfile -File workspace/aion/ops/aion-mcp/windows/Complete-AionBus.ps1
#>
[CmdletBinding()]
param(
    [switch]$ReadOnly,
    [switch]$SkipTests
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$repo=(Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
$mcp=Join-Path $repo 'workspace/aion/ops/aion-mcp'
$extension=Join-Path $repo 'workspace/aion/ops/chrome-relay/extension'
$bridge=Join-Path $repo 'workspace/aion/ops/chrome-relay/bridge'
$adapter=Join-Path $repo 'workspace/aion/sessions/01-escape-hatch/adapter'
$receiptDir=Join-Path $env:LOCALAPPDATA 'AION/bus/readiness'
$record=[ordered]@{
    schema='aion.bus.windows-readiness.v1'
    observed_utc=[DateTime]::UtcNow.ToString('o')
    host='OWNER_WINDOWS_MASTER'
    git_head=$null
    dirty_tree=$null
    node_version=$null
    opencode_version=$null
    free_c_gb=$null
    suites=[ordered]@{}
    native_host='UNKNOWN'
    mcp_protocol='UNKNOWN'
    chrome_extension_browser='NOT_TESTED_BY_THIS_SCRIPT'
    chatgpt_roundtrip='NOT_TESTED_BY_THIS_SCRIPT'
    tunnel='NOT_CONFIGURED_BY_THIS_SCRIPT'
    m1_verified=$false
    errors=@()
}
function Note([string]$label,[string]$message){Write-Host ("[{0}] {1}" -f $label,$message)}
function Need([bool]$condition,[string]$message){if(-not $condition){throw $message}}
function CheckSuite([string]$name,[string]$folder,[string]$exe,[string[]]$argv){
    Need (Test-Path -LiteralPath $folder) ("Missing suite directory: " + $name)
    Push-Location $folder
    try {
        $output=& $exe @argv 2>&1 | Out-String
        $exitCode=$LASTEXITCODE
        $record.suites[$name]=[ordered]@{exit_code=$exitCode;passed=($exitCode -eq 0)}
        if($exitCode -ne 0){
            # Sanitized indicator only: don't print potentially sensitive fixture/error output.
            throw ("Suite {0} exited {1}; run the suite locally for full diagnostics" -f $name,$exitCode)
        }
        Note 'PASS' $name
    } finally {Pop-Location}
}
function CheckNativeHost {
    $manifest=Get-Content -LiteralPath (Join-Path $extension 'manifest.json') -Raw | ConvertFrom-Json
    $id='kgjfielmhcdlggjppmliabpiljnonhki'
    $origin="chrome-extension://$id/"
    Need ($manifest.name -eq 'AION Chrome Relay Station') 'Wrong extension manifest'
    Need ($manifest.permissions -contains 'nativeMessaging') 'Extension missing nativeMessaging permission'
    Need ($manifest.web_accessible_resources[0].use_dynamic_url -eq $false) 'Content loader dynamic URL defect is still present'
    $template=(Get-Content -LiteralPath (Join-Path $bridge 'native-host/manifest.template.json') -Raw | ConvertFrom-Json)
    Need ($template.name -eq 'com.aion.relay') 'Unexpected native host name'
    Need ($template.allowed_origins.Count -eq 1 -and $template.allowed_origins[0] -ceq $origin) 'Native host origin pin mismatch'
    $launcher=(Resolve-Path (Join-Path $bridge 'native-host/aion-relay-host.cmd')).Path
    $regKey='HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay'
    $manifestPath=Join-Path $env:LOCALAPPDATA 'AION/relay/manifest.json'
    if(-not (Test-Path -LiteralPath $regKey)) {
        if($ReadOnly) {throw 'Native host is not registered; ReadOnly mode will not repair it'}
        New-Item -ItemType Directory -Path (Split-Path $manifestPath) -Force | Out-Null
        if(Test-Path -LiteralPath $manifestPath){throw 'Unregistered host has a pre-existing manifest; refusing to overwrite it'}
        $data=[ordered]@{name='com.aion.relay';description='AION local Chrome ACP bridge';path=$launcher;type='stdio';allowed_origins=@($origin)}
        [System.IO.File]::WriteAllText($manifestPath,($data | ConvertTo-Json -Depth 4),[Text.UTF8Encoding]::new($false))
        New-Item -Path $regKey -Force | Out-Null
        Set-Item -Path $regKey -Value $manifestPath
        Note 'REGISTERED' 'Native host registered in HKCU (reversible)'
    }
    $actualPath=(Get-Item -LiteralPath $regKey).GetValue('')
    Need (-not [string]::IsNullOrWhiteSpace($actualPath)) 'Native host registry default value is empty'
    Need (Test-Path -LiteralPath $actualPath) 'Native host manifest pointed to by registry does not exist'
    $hostManifest=Get-Content -LiteralPath $actualPath -Raw | ConvertFrom-Json
    Need ($hostManifest.name -eq 'com.aion.relay') 'Registered native host has wrong name'
    Need ($hostManifest.allowed_origins.Count -eq 1 -and $hostManifest.allowed_origins[0] -ceq $origin) 'Registered native host origin pin is wrong'
    Need (Test-Path -LiteralPath $hostManifest.path) 'Registered native host launcher is missing'
    $record.native_host='REGISTERED_AND_VALIDATED_OFFLINE'
    Note 'PASS' 'Pinned native messaging host registry and launcher'
}
try {
    Need ($IsWindows) 'Run this only on Windows PowerShell 7'
    Need (Test-Path -LiteralPath (Join-Path $repo '.git')) 'Not an AION Git working tree'
    $record.git_head=(& git -C $repo rev-parse HEAD).Trim()
    Need ($LASTEXITCODE -eq 0) 'git rev-parse failed'
    $record.dirty_tree=([bool]((& git -C $repo status --porcelain) | Select-Object -First 1))
    # Local master rule: never automatically pull, reset or discard changes.
    Need ($null -ne (Get-Command node -ErrorAction SilentlyContinue)) 'Node 22+ is required'
    $record.node_version=(& node --version).Trim()
    Need ($LASTEXITCODE -eq 0) 'node version command failed'
    $major=[int]($record.node_version -replace '^v(\d+).*','$1')
    Need ($major -ge 22) 'Node >=22 required'
    if(Get-Command opencode -ErrorAction SilentlyContinue){$record.opencode_version=(& opencode --version | Out-String).Trim()}
    $disk=Get-PSDrive -Name C -ErrorAction SilentlyContinue
    if($null -ne $disk){$record.free_c_gb=[math]::Round(($disk.Free / 1GB),2)}
    Need ($null -ne (Get-Command npm.cmd -ErrorAction SilentlyContinue)) 'npm.cmd not found'
    if(-not $SkipTests){
        CheckSuite 'extension' $extension 'npm.cmd' @('test')
        CheckSuite 'bridge' $bridge 'npm.cmd' @('test')
        CheckSuite 'adapter' $adapter 'node' @('--test','send-m05.test.js')
        CheckSuite 'mcp' $mcp 'npm.cmd' @('test')
    }
    CheckNativeHost
    Push-Location $mcp
    try {
        $smoke=& node 'bin/verify-local.mjs' 2>&1 | Out-String
        Need ($LASTEXITCODE -eq 0) 'Live-local MCP handshake/reading failed'
        $proof=$smoke | ConvertFrom-Json
        Need ($proof.result -eq 'PASS' -and $proof.checked_count -eq 6) 'MCP smoke did not prove all six checks'
        $record.mcp_protocol='LOCAL_STDIO_6_OF_6_PASS'
        Note 'PASS' 'Local AION MCP process and six protocol checks'
    } finally {Pop-Location}
} catch {
    $record.errors=@(('READINESS_FAILED: ' + $_.Exception.Message).Substring(0,[math]::Min(220,('READINESS_FAILED: ' + $_.Exception.Message).Length)))
    Note 'BLOCKED' $record.errors[0]
} finally {
    New-Item -ItemType Directory -Path $receiptDir -Force | Out-Null
    $report=Join-Path $receiptDir ('readiness-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ') + '.json')
    [System.IO.File]::WriteAllText($report,($record | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
    Note 'REPORT' $report
    if($record.errors.Count -gt 0){exit 1}
    Note 'READY' 'Local code and native-host preflight passed; Chrome live turn and ChatGPT tunnel still require separate observed evidence.'
}
