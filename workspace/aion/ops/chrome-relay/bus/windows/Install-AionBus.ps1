#requires -Version 7.0
<#
.SYNOPSIS
    AION Bus V1/V2 - single install / verify / rollback path for the OWNER WINDOWS MASTER.
.DESCRIPTION
    -Mode Verify (default)  Read-only. Preflight, extension-ID pin check, offline suites,
                            offline bus demo, HKCU native-host health, read-only native PING.
                            Writes a sanitized receipt. Changes nothing.
    -Mode Install           Verify, plus registers the pinned native host ONLY if missing, by
                            calling the existing aion-mcp/windows/Complete-AionBus.ps1 (one
                            registration path, not two). Persistent but reversible (HKCU).
    -Mode LiveChecklist     Prints the owner-gated live test (SYNC-0, one ChatGPT agent, negative
                            tests, one OpenCode prompt). Performs NONE of it.
    -Mode Rollback          Removes the HKCU native-host key and its manifest ONLY if they are the
                            ones this tooling writes (pinned name/origin, under %LOCALAPPDATA%\AION).
                            Never touches Chrome profiles, the extension, ChatGPT, or git.

    Never: drives a browser, sends a ChatGPT message, starts OpenCode, opens a tunnel,
    installs software, pulls/resets git, or reads cookies/tokens/transcripts.
.EXAMPLE
    pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1
    pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1 -Mode Install
    pwsh -NoProfile -File workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1 -Mode Rollback
#>
[CmdletBinding()]
param(
    [ValidateSet('Verify', 'Install', 'LiveChecklist', 'Rollback')]
    [string]$Mode = 'Verify',
    [string]$ChromeProfile = 'Profile 3',
    [switch]$SkipTests
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$PinnedId = 'kgjfielmhcdlggjppmliabpiljnonhki'
$Origin = "chrome-extension://$PinnedId/"
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../../..')).Path
$relay = Join-Path $repo 'workspace/aion/ops/chrome-relay'
$extension = Join-Path $relay 'extension'
$bridge = Join-Path $relay 'bridge'
$bus = Join-Path $relay 'bus'
$mcp = Join-Path $repo 'workspace/aion/ops/aion-mcp'
$adapter = Join-Path $repo 'workspace/aion/sessions/01-escape-hatch/adapter'
$regKey = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay'
$ourManifest = Join-Path $env:LOCALAPPDATA 'AION/relay/manifest.json'
$receiptDir = Join-Path $env:LOCALAPPDATA 'AION/bus/install'

$record = [ordered]@{
    schema = 'aion.bus.windows-install.v1'; mode = $Mode; observed_utc = [DateTime]::UtcNow.ToString('o')
    host = 'OWNER_WINDOWS_MASTER'; git_head = $null; dirty_tree = $null; node_version = $null
    extension_id_from_key = $null; extension_in_profile = 'UNKNOWN'; suites = [ordered]@{}; demo = 'NOT_RUN'
    native_host = 'UNKNOWN'; native_ping = 'NOT_RUN'
    extension_reload = 'MANUAL_PENDING'; sync0 = 'OWNER_PENDING'; chatgpt_live = 'CHATGPT_LIVE_PENDING'
    opencode_live = 'WINDOWS_PENDING'; plugin_write = 'PLUGIN_ENTITLEMENT_UNKNOWN'; m1_verified = $false; errors = @()
}
function Note([string]$l, [string]$m) { Write-Host ('[{0}] {1}' -f $l, $m) }
function Need([bool]$c, [string]$m) { if (-not $c) { throw $m } }

function Get-ExtensionIdFromKey([string]$base64) {
    $sha = [System.Security.Cryptography.SHA256]::HashData([Convert]::FromBase64String($base64))
    $hex = -join ($sha[0..15] | ForEach-Object { $_.ToString('x2') })
    -join ($hex.ToCharArray() | ForEach-Object { [char]([int][char]'a' + [Convert]::ToInt32([string]$_, 16)) })
}

function Invoke-Suite([string]$name, [string]$folder, [string[]]$argv) {
    Need (Test-Path -LiteralPath $folder) "missing suite directory: $name"
    Push-Location $folder
    try {
        $null = & node @argv 2>&1 | Out-String
        $code = $LASTEXITCODE
        $record.suites[$name] = [ordered]@{ exit_code = $code; passed = ($code -eq 0) }
        Need ($code -eq 0) "suite $name exited $code; run it locally for diagnostics"
        Note 'PASS' $name
    } finally { Pop-Location }
}

function Test-Preflight {
    Need $IsWindows 'run on Windows PowerShell 7'
    Need (Test-Path -LiteralPath (Join-Path $repo '.git')) 'not an AION git working tree'
    $record.git_head = (& git -C $repo rev-parse HEAD).Trim()
    $record.dirty_tree = [bool]((& git -C $repo status --porcelain) | Select-Object -First 1)
    Need ($null -ne (Get-Command node -ErrorAction SilentlyContinue)) 'Node 22+ is required'
    $record.node_version = (& node --version).Trim()
    Need ([int]($record.node_version -replace '^v(\d+).*', '$1') -ge 22) 'Node >= 22 required'
    $manifest = Get-Content -LiteralPath (Join-Path $extension 'manifest.json') -Raw | ConvertFrom-Json
    $record.extension_id_from_key = Get-ExtensionIdFromKey $manifest.key
    Need ($record.extension_id_from_key -ceq $PinnedId) "manifest key yields $($record.extension_id_from_key), not the pinned $PinnedId; the installed extension identity would change"
    Note 'PASS' "extension identity preserved ($PinnedId)"
    $prefs = Join-Path $env:LOCALAPPDATA "Google/Chrome/User Data/$ChromeProfile/Secure Preferences"
    if (Test-Path -LiteralPath $prefs) {
        # Read-only metadata check: is the pinned id present in this profile's extension settings?
        $json = Get-Content -LiteralPath $prefs -Raw | ConvertFrom-Json -AsHashtable
        $present = $json.ContainsKey('extensions') -and $json.extensions.ContainsKey('settings') -and $json.extensions.settings.ContainsKey($PinnedId)
        $record.extension_in_profile = if ($present) { 'PRESENT' } else { 'ABSENT' }
        Note ($(if ($present) { 'PASS' } else { 'WARN' })) "extension in Chrome '$ChromeProfile': $($record.extension_in_profile)"
    } else { $record.extension_in_profile = 'PROFILE_NOT_FOUND'; Note 'WARN' "Chrome profile '$ChromeProfile' not found" }
}

function Test-NativeHost {
    if (-not (Test-Path -LiteralPath $regKey)) { $record.native_host = 'NOT_REGISTERED'; throw 'native host is not registered; run -Mode Install' }
    $path = (Get-Item -LiteralPath $regKey).GetValue('')
    Need (-not [string]::IsNullOrWhiteSpace($path) -and (Test-Path -LiteralPath $path)) 'registry points to a missing host manifest'
    $m = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    Need ($m.name -eq 'com.aion.relay') 'registered host has the wrong name'
    Need ($m.allowed_origins.Count -eq 1 -and $m.allowed_origins[0] -ceq $Origin) 'registered host origin pin is wrong'
    Need (Test-Path -LiteralPath $m.path) 'registered host launcher is missing'
    $record.native_host = 'REGISTERED_AND_VALIDATED'
    Note 'PASS' 'HKCU native host registration'
    $ping = & node (Join-Path $bus 'bin/native-ping.mjs') $m.path | Out-String
    $result = $ping | ConvertFrom-Json
    $record.native_ping = if ($result.result -eq 'PASS') { "PASS host=$($result.host) agent=$($result.agent_status) session_created=$($result.session_created)" } else { "FAIL $($result.error)" }
    Need ($result.result -eq 'PASS') "native PING failed: $($result.error)"
    Note 'PASS' "read-only native PING ($($record.native_ping))"
}

function Invoke-Verify {
    Test-Preflight
    if (-not $SkipTests) {
        Invoke-Suite 'extension' $extension @('--test', '--test-timeout=60000')
        Invoke-Suite 'bridge' $bridge @('--test')
        Invoke-Suite 'bus-runner' $bus @('--test')
        Invoke-Suite 'mcp' $mcp @('--test', 'tests/server.test.mjs', 'tests/bus-tools.test.mjs')
        Invoke-Suite 'adapter' $adapter @('--test', 'send-m05.test.js')
    }
    Push-Location $bus
    try {
        $demo = & node 'bin/aion-bus.mjs' 'demo' 2>&1 | Out-String
        $record.demo = if ($LASTEXITCODE -eq 0) { 'OFFLINE_PASS_3_OF_3' } else { 'FAIL' }
        Need ($LASTEXITCODE -eq 0) 'offline bus demo failed'
        Note 'PASS' 'offline bus demo D1-D3 (fakes only)'
    } finally { Pop-Location }
    Test-NativeHost
    Note 'NEXT' 'Reload the extension: chrome://extensions -> AION Chrome Relay Station -> reload. Then open the side panel -> Bus. Status must list adapters "chatgpt.com, acp", kill off, watching off.'
}

function Invoke-Rollback {
    if (Test-Path -LiteralPath $regKey) {
        $path = (Get-Item -LiteralPath $regKey).GetValue('')
        $resolvedOurs = [IO.Path]::GetFullPath($ourManifest)
        if ($path -and ([IO.Path]::GetFullPath($path) -ieq $resolvedOurs)) {
            $m = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
            Need ($m.name -eq 'com.aion.relay' -and $m.allowed_origins[0] -ceq $Origin) 'host manifest is not the pinned AION one; refusing to remove'
            Remove-Item -LiteralPath $regKey -Force
            Remove-Item -LiteralPath $path -Force
            Note 'ROLLBACK' 'removed HKCU com.aion.relay key and the AION host manifest'
        } else { throw "com.aion.relay points to $path, which this tooling did not write; remove it by hand if intended" }
    } else { Note 'ROLLBACK' 'native host not registered; nothing to remove' }
    Note 'ROLLBACK' 'Bus code is inert until you bind, grant and arm. To remove it entirely: git revert the bus commits, reload the extension. Bus state lives in chrome.storage key aion.relay.bus.v1 (extension) and %USERPROFILE%\.aion\bus\state.json (runner); delete those to reset.'
}

function Show-LiveChecklist {
    @"
OWNER-GATED LIVE TEST (nothing below is performed by this script)
Prerequisite: a fresh, explicit owner grant naming the agents, sends, rate and expiry (AGENTS.md; STATE.json live_execution_authorized stays false until you say otherwise).

0  SYNC-0 (no send). Open the commander conversation in Chrome (one tab). Bus view: bind 'aion' to it, 'Make this agent the commander'.
   SYNC-0 -> Start. From the PHONE send one ordinary message to that conversation. Touch nothing on the PC. Wait 2 min, Sample, Finish.
   Verdict PHONE_TURN_VISIBLE_WITHOUT_RELOAD => Option A viable. Otherwise: reload the tab by hand, 'I reloaded', Finish again; record the verdict.
1  Bind ONE agent (e.g. role-06) to its own chatgpt.com/c/<id> conversation, open in exactly one tab.
2  Grant: agents 'aion,role-06', max 2 (one send + one report), 1 hour.
3  From the PHONE, in the commander: first line 'AION> ...'; ask the commander to emit exactly one AION_CMD_V1 block: op: send / to: role-06 / text: <benign text> / nonce: <fresh>.
4  Bus view -> Scan commander now (or enable the watcher). Expect: one submit into role-06, its reply, one AION_REPORT_V1 in the commander. Status: CONSUMED.
5  Negative tests (must produce NO send): (a) same block again in an UNARMED turn; (b) a block naming an unbound agent; (c) re-scan; (d) Stop the bus, then an armed command -> kill_switch_engaged.
6  Evidence: copy the Bus status text and command ids into the receipt; never copy transcripts.
7  V2 (separate grant): node workspace/aion/ops/chrome-relay/bus/bin/aion-bus.mjs bind opencode --adapter acp --ref opencode --confirmed-by "<ref>"
   ... grant --id g-oc --agents opencode --ops send --max 1 --hours 1 --cwd <allowlisted absolute path> --ref "<ref>"
   ... send --to opencode --text "<benign prompt>" --live      (uses bridge host.config.json; expect stop_reason in the reply)
Only after 4-7 have receipts may Bus V1/V2 be called LIVE VERIFIED. None of this promotes M1.
"@ | Write-Host
}

try {
    switch ($Mode) {
        'Verify' { Invoke-Verify }
        'Install' {
            Test-Preflight
            if (-not (Test-Path -LiteralPath $regKey)) {
                & pwsh -NoProfile -File (Join-Path $mcp 'windows/Complete-AionBus.ps1') -SkipTests
                Need ($LASTEXITCODE -eq 0) 'native host registration (Complete-AionBus.ps1) failed'
            }
            Invoke-Verify
        }
        'LiveChecklist' { Show-LiveChecklist }
        'Rollback' { Invoke-Rollback }
    }
} catch {
    $msg = 'BUS_INSTALL_FAILED: ' + $_.Exception.Message
    $record.errors = @($msg.Substring(0, [math]::Min(240, $msg.Length)))
    Note 'BLOCKED' $record.errors[0]
} finally {
    if ($Mode -ne 'LiveChecklist') {
        New-Item -ItemType Directory -Path $receiptDir -Force | Out-Null
        $file = Join-Path $receiptDir ("bus-$($Mode.ToLower())-" + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ') + '.json')
        [IO.File]::WriteAllText($file, ($record | ConvertTo-Json -Depth 6), [Text.UTF8Encoding]::new($false))
        Note 'RECEIPT' $file
    }
    if ($record.errors.Count -gt 0) { exit 1 }
}
