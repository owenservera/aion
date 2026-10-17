#Requires -Version 7.0
<#
.SYNOPSIS
    Registers (or removes) the AION-Sync scheduled task.

.DESCRIPTION
    Registers a repeating 5-minute task that runs
    `pwsh -NoProfile -NonInteractive -ExecutionPolicy Bypass -File <script>\aion-sync.ps1 -Command run -Repo <repo>`
    as the interactive user, so the existing git credential manager is available.
    RunLevel Limited: no administrator rights are required.

    The script never claims success on its own. After Register-ScheduledTask it
    reads the task back with Get-ScheduledTask and prints the ACTUAL state. A
    failed read-back, or a state other than Ready, exits non-zero.

.PARAMETER RepoPath
    Repository to sync. Defaults to RepoPath in config.json.

.PARAMETER TaskName
    Scheduled task name. Defaults to TaskName in config.json.

.PARAMETER IntervalMinutes
    Repetition interval. Defaults to IntervalMinutes in config.json.

.PARAMETER DryRun
    Print the full task definition that would be registered, register nothing.

.PARAMETER Uninstall
    Unregister the task and print the rollback confirmation. Does not delete
    logs, state or snapshot refs.

.EXAMPLE
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1 -DryRun

.EXAMPLE
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1

.EXAMPLE
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1 -Uninstall
#>
[CmdletBinding()]
param(
    [string]$RepoPath,
    [string]$TaskName,
    [int]$IntervalMinutes,
    [string]$ConfigPath,
    [switch]$DryRun,
    [switch]$Uninstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Setting {
    param([System.Collections.IDictionary]$Config, [string]$Key, $Default)
    if ($null -ne $Config -and $Config.Contains($Key) -and $null -ne $Config[$Key]) { return $Config[$Key] }
    return $Default
}

function Write-Section {
    param([string]$Title)
    Write-Host ''
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ('-' * 70)
}

function Get-TriggerSummary {
    <#
    .SYNOPSIS
        One-line, StrictMode-safe description of a trigger.
    .DESCRIPTION
        A logon trigger has no Repetition property at all, so every field is
        probed before it is formatted.
    #>
    param($Trigger)

    $type = 'unknown'
    if ($null -ne $Trigger.CimClass) { $type = $Trigger.CimClass.CimClassName }
    $enabled = 'n/a'
    if ($null -ne $Trigger.Enabled) { $enabled = $Trigger.Enabled }
    $start = 'n/a'
    if ($null -ne $Trigger.StartBoundary) { $start = $Trigger.StartBoundary }

    $interval = '-'
    $duration = '-'
    $rep = $null
    if ($null -ne $Trigger.PSObject.Properties['Repetition']) { $rep = $Trigger.Repetition }
    if ($null -ne $rep) {
        if ($null -ne $rep.Interval) { $interval = $rep.Interval }
        if ($null -ne $rep.Duration) { $duration = $rep.Duration }
    }
    return ('type={0} enabled={1} start={2} interval={3} duration={4}' -f $type, $enabled, $start, $interval, $duration)
}

$enginePath = Join-Path $PSScriptRoot 'aion-sync.ps1'
if (-not (Test-Path -LiteralPath $enginePath)) {
    Write-Host "ERROR: engine not found next to this script: $enginePath" -ForegroundColor Red
    exit 40
}

if ([string]::IsNullOrWhiteSpace($ConfigPath)) { $ConfigPath = Join-Path $PSScriptRoot 'config.json' }
if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-Host "ERROR: config not found: $ConfigPath" -ForegroundColor Red
    exit 40
}
$config = (Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json -AsHashtable)

if ([string]::IsNullOrWhiteSpace($RepoPath)) { $RepoPath = [string](Get-Setting $config 'RepoPath' '.') }
if ([string]::IsNullOrWhiteSpace($TaskName)) { $TaskName = [string](Get-Setting $config 'TaskName' 'AION-Sync') }
if ($IntervalMinutes -le 0) { $IntervalMinutes = [int](Get-Setting $config 'IntervalMinutes' 5) }

if (-not (Test-Path -LiteralPath $RepoPath)) {
    Write-Host "ERROR: repository path not found: $RepoPath" -ForegroundColor Red
    exit 40
}
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).ProviderPath.TrimEnd('\', '/')

# The scheduler resolves the executable through the user's PATH at run time.
# Pinning the resolved full path removes the dependency on PATH entirely.
$pwshPath = 'pwsh.exe'
$resolvedPwsh = Get-Command pwsh -ErrorAction SilentlyContinue
if ($null -ne $resolvedPwsh -and -not [string]::IsNullOrWhiteSpace($resolvedPwsh.Source)) {
    $pwshPath = $resolvedPwsh.Source
}

# Interactive logon so the credential manager works; Limited so no admin is needed.
$principalId = $env:USERNAME
if (-not [string]::IsNullOrWhiteSpace($env:USERDOMAIN) -and $env:USERDOMAIN -ne 'WORKGROUP') {
    # A bare user name is ambiguous across domains and fails to resolve in Task Scheduler.
    $principalId = "$env:USERDOMAIN\$env:USERNAME"
}

Write-Section 'AION sync task installer'
Write-Host ('  engine      : {0}' -f $enginePath)
Write-Host ('  repository  : {0}' -f $RepoPath)
Write-Host ('  task name   : {0}' -f $TaskName)
Write-Host ('  interval    : {0} minute(s)' -f $IntervalMinutes)
Write-Host ('  pwsh        : {0}' -f $pwshPath)
Write-Host ('  principal   : {0} (LogonType Interactive, RunLevel Limited)' -f $principalId)

# ---------------------------------------------------------------------------
# Uninstall
# ---------------------------------------------------------------------------
if ($Uninstall) {
    Write-Section 'Uninstall'
    $before = $null
    try {
        $before = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
    } catch {
        Write-Host ('  task "{0}" is not registered: {1}' -f $TaskName, $_.Exception.Message)
    }

    if ($null -ne $before) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    # Read-back: only claim removal when the task is genuinely gone.
    $still = $null
    try { $still = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop } catch { $still = $null }

    if ($null -ne $still) {
        Write-Host ('  FAILED: task "{0}" still exists in state {1}' -f $TaskName, $still.State) -ForegroundColor Red
        exit 40
    }

    Write-Host ('  CONFIRMED: no scheduled task named "{0}" remains.' -f $TaskName) -ForegroundColor Green
    Write-Host ''
    Write-Host '  Preserved (not deleted):' -ForegroundColor Cyan
    Write-Host '    logs\         audit.ndjson and daily sync logs'
    Write-Host '    state\        paused flag, last-success.json'
    Write-Host '    escalations\  captured conflict evidence'
    Write-Host '    git refs      refs/aionsync/snapshots/* and refs/aionsync/stash/*'
    Write-Host ''
    Write-Host '  Verify removal:' -ForegroundColor Cyan
    Write-Host ('    Get-ScheduledTask -TaskName "{0}" -ErrorAction SilentlyContinue' -f $TaskName)
    exit 0
}

# ---------------------------------------------------------------------------
# Build the task definition
# ---------------------------------------------------------------------------

$arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -Command run -Repo "{1}"' -f $enginePath, $RepoPath

$action = New-ScheduledTaskAction -Execute $pwshPath -Argument $arguments -WorkingDirectory $RepoPath

# RepetitionDuration must be set explicitly: with only -RepetitionInterval the
# repetition window defaults to a single interval and stops firing.
$repeatTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $principalId

$settings = New-ScheduledTaskSettingsSet `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 4) `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries

$principal = New-ScheduledTaskPrincipal -UserId $principalId -LogonType Interactive -RunLevel Limited

$triggers = @($repeatTrigger, $logonTrigger)

if ($DryRun) {
    Write-Section 'Dry run - nothing was registered'
    Write-Host '  action    :'
    Write-Host ('    execute         : {0}' -f $action.Execute)
    Write-Host ('    arguments       : {0}' -f $action.Arguments)
    Write-Host ('    working dir     : {0}' -f $action.WorkingDirectory)
    Write-Host '  principal :'
    Write-Host ('    userId          : {0}' -f $principal.UserId)
    Write-Host ('    logonType       : {0}' -f $principal.LogonType)
    Write-Host ('    runLevel        : {0}' -f $principal.RunLevel)
    Write-Host '  triggers  :'
    foreach ($t in $triggers) {
        Write-Host ('    ' + (Get-TriggerSummary -Trigger $t))
    }
    Write-Host '  settings  :'
    foreach ($p in @('MultipleInstances', 'ExecutionTimeLimit', 'StartWhenAvailable', 'DisallowStartIfOnBatteries', 'StopIfGoingOnBatteries')) {
        Write-Host ('    {0,-28}: {1}' -f $p, $settings.$p)
    }
    Write-Host ''
    Write-Host ('  Would register task "{0}" with 1 repeating trigger ({1} min) + 1 logon trigger.' -f $TaskName, $IntervalMinutes)
    Write-Host '  Re-run without -DryRun to register it.'
    exit 0
}

# ---------------------------------------------------------------------------
# Register (idempotent: re-register replaces any previous definition)
# ---------------------------------------------------------------------------
Write-Section 'Registering'
$existing = $null
try { $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop } catch { $existing = $null }
if ($null -ne $existing) {
    Write-Host ('  task already exists in state {0}; unregistering first (idempotent re-register).' -f $existing.State)
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers `
        -Settings $settings -Principal $principal -Force -ErrorAction Stop | Out-Null
    Write-Host '  Register-ScheduledTask returned without error.'
} catch {
    Write-Host ('  FAILED to register: {0}' -f $_.Exception.Message) -ForegroundColor Red
    exit 40
}

# ---------------------------------------------------------------------------
# Read-back. Nothing is called "installed" until this succeeds.
# ---------------------------------------------------------------------------
Write-Section 'Read-back (actual state reported by Task Scheduler)'
$task = $null
try {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
} catch {
    Write-Host ('  FAILED: Get-ScheduledTask could not read back "{0}": {1}' -f $TaskName, $_.Exception.Message) -ForegroundColor Red
    exit 40
}

Write-Host ('  taskName      : {0}' -f $task.TaskName)
Write-Host ('  taskPath      : {0}' -f $task.TaskPath)
Write-Host ('  state         : {0}' -f $task.State)
Write-Host ('  execute       : {0}' -f $task.Actions[0].Execute)
Write-Host ('  arguments     : {0}' -f $task.Actions[0].Arguments)
Write-Host ('  working dir   : {0}' -f $task.Actions[0].WorkingDirectory)
Write-Host ('  principal     : {0} / {1} / {2}' -f $task.Principal.UserId, $task.Principal.LogonType, $task.Principal.RunLevel)
Write-Host ('  trigger count : {0}' -f @($task.Triggers).Count)
foreach ($t in $task.Triggers) {
    Write-Host ('    ' + (Get-TriggerSummary -Trigger $t))
}
Write-Host ('  settings      : MultipleInstances={0} ExecutionTimeLimit={1} StartWhenAvailable={2}' -f `
        $task.Settings.MultipleInstances, $task.Settings.ExecutionTimeLimit, $task.Settings.StartWhenAvailable)

$info = $null
try {
    $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop
    Write-Host ('  last run      : {0} (result {1})' -f $info.LastRunTime, $info.LastTaskResult)
    Write-Host ('  next run      : {0}' -f $info.NextRunTime)
} catch {
    Write-Host ('  task info read failed: {0}' -f $_.Exception.Message)
}

Write-Host ''
if ([string]$task.State -ne 'Ready') {
    Write-Host ('  FAILED: read-back state is "{0}", expected "Ready".' -f $task.State) -ForegroundColor Red
    exit 1
}

Write-Host ('  INSTALLED: task "{0}" is registered and reports state "{1}".' -f $task.TaskName, $task.State) -ForegroundColor Green
Write-Host ''
Write-Host '  Owner confirmation command:' -ForegroundColor Cyan
Write-Host ('    Get-ScheduledTask -TaskName "{0}" | Select-Object TaskName,State' -f $TaskName)
Write-Host ('    Get-ScheduledTaskInfo -TaskName "{0}" | Select-Object LastRunTime,NextRunTime,LastTaskResult' -f $TaskName)
Write-Host ''
Write-Host '  Engine self-check:' -ForegroundColor Cyan
Write-Host ('    pwsh -NoProfile -ExecutionPolicy Bypass -File "{0}" -Command status' -f $enginePath)
Write-Host ('    pwsh -NoProfile -ExecutionPolicy Bypass -File "{0}" -Command diagnose' -f $enginePath)
exit 0