#Requires -Version 7.0
<#
.SYNOPSIS
    Unattended Windows Git auto-sync engine for the AION repository.

.DESCRIPTION
    Single entry point, selected with -Command <verb>:

      status       read-only report; always exits 0 unless the repo is unreadable
      run          one full sync cycle (the internal entry point of the scheduled task)
      sync-now     same cycle as `run`, with the full step table printed to stdout
      pause        create state/paused; `run` then no-ops with exit code 30
      resume       delete state/paused
      diagnose     versions, credential-helper resolution, reachability, capacity
      uninstall    remove the scheduled task; keeps logs, snapshots and state

    Invariants that this file must never violate (mirrored in README.md):

      * never force-push, never `reset --hard`, never `clean`, never `rebase`,
        never `stash push`/`stash pop`, never `checkout --`
      * never modify the working tree except through an explicit, audited git step
      * never write a credential to a log, an audit record or a commit message
      * a concurrent editor, merge or agent always wins over the sync

.OUTPUTS
    Exit codes are defined in $script:ExitCodes and returned, never thrown.
#>
[CmdletBinding()]
param(
    [ValidateSet('status', 'sync-now', 'pause', 'resume', 'diagnose', 'uninstall', 'run')]
    [string]$Command = 'status',

    # Repo override. The scheduled task passes it explicitly so that the engine
    # never has to guess which checkout it is operating on.
    [string]$Repo,

    # Runtime state root (lock/, logs/, state/, escalations/, tmp/).
    # Defaults to this script's own directory; the test suite redirects it to a
    # disposable fixture so test runs never touch production state.
    [string]$WorkDir,

    # Config override. Defaults to config.json next to this script.
    [string]$ConfigPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

$script:ExitCodes = [ordered]@{
    OK                    = 0
    SKIP_CONCURRENT       = 10
    SKIP_BUSY             = 11
    SKIP_DIRTY_INTEGRATE  = 12
    ESCALATED_CONFLICT    = 20
    ESCALATION            = 21
    PAUSED                = 30
    ERROR                 = 40
    TIMEOUT               = 50
}

# Env var that turns every interactive credential prompt into an immediate
# failure. Without it a scheduled, non-interactive run can hang forever on a
# username prompt; the Git credential manager still supplies the real credential.
$env:GIT_TERMINAL_PROMPT = '0'

$script:Config          = $null
$script:RepoRoot        = $null
$script:GitDir          = $null
$script:WorkRoot        = $null
$script:LockDir         = $null
$script:LogDir          = $null
$script:StateDir        = $null
$script:EscalationDir   = $null
$script:TempDir         = $null
$script:AuditFile       = $null
$script:TextLog         = $null
$script:RunId           = ([guid]::NewGuid().ToString('N'))
$script:LockStream      = $null
$script:Stopwatch       = $null
$script:Quiet           = $false
$script:LogDate         = $null

# PIDs of git.exe children this process started. The busy scan must not treat
# our own child as a foreign editor.
$script:OwnChildPids = [System.Collections.Generic.HashSet[int]]::new()

# `Start-Process -RedirectStandardInput` only exists on PowerShell 7.4+.
# Where it is missing we fall back to per-path git calls with identical results.
$script:HasStdinRedirect = (
    (Get-Command Start-Process).Parameters.ContainsKey('RedirectStandardInput')
)

# ---------------------------------------------------------------------------
# Redaction / logging / audit
# ---------------------------------------------------------------------------

function Redact-Sensitive {
    <#
    .SYNOPSIS
        Scrubs credential-shaped substrings out of any text before it is persisted.
    .DESCRIPTION
        Applied to every line that reaches a log file, an audit record, an
        escalation capture or a commit message. Git credentials resolve through
        `gh auth git-credential` here, so a token should never appear at all -
        this is the last line of defence if some future output ever prints one.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Text
    )

    if ([string]::IsNullOrEmpty($Text)) { return $Text }

    $t = $Text
    # GitHub CLI / classic token shapes.
    $t = [regex]::Replace($t, 'gh[pousr]_[A-Za-z0-9]+', '***REDACTED***')
    # Any userinfo section inside a URL (https://user:tok@host/...).
    $t = [regex]::Replace($t, 'https?://[^/\s@''"]+@', 'https://***REDACTED***@')
    # Query / form parameters that carry secrets.
    $t = [regex]::Replace(
        $t,
        '(?i)\b(token|access_token|password|passwd|pwd|secret|api[_-]?key)=[^\s&"''<>]+',
        '$1=***REDACTED***'
    )
    return $t
}

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SKIP', 'OK', 'ESCALATION')]
        [string]$Level = 'INFO'
    )

    $safe = Redact-Sensitive $Message
    $line = '{0} [{1,-10}] {2}' -f (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'), $Level, $safe

    try {
        Invoke-LogRotation
        Add-Content -LiteralPath $script:TextLog -Value $line -Encoding utf8
    } catch {
        # A logging failure must never abort a sync cycle, but it must be visible.
        Write-Warning ("aionsync: could not write sync.log ({0})" -f $_.Exception.Message)
    }

    if (-not $script:Quiet) {
        switch ($Level) {
            'ERROR' { Write-Host $line -ForegroundColor Red }
            'WARN' { Write-Host $line -ForegroundColor Yellow }
            'SKIP' { Write-Host $line -ForegroundColor DarkYellow }
            'ESCALATION' { Write-Host $line -ForegroundColor Magenta }
            default { Write-Host $line }
        }
    }
}

function Write-Audit {
    <#
    .SYNOPSIS
        Appends one NDJSON record per step to logs/audit.ndjson.
    .DESCRIPTION
        Newline-delimited JSON so a run can be reconstructed line by line even
        if the process is killed mid-write. Redaction runs on the serialised
        line, which catches values that were only partially escaped.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Step,
        [Parameter(Mandatory)][string]$Status,
        [Parameter()][AllowNull()][AllowEmptyString()][string]$Detail = '',
        [Parameter()][hashtable]$Extra
    )

    $record = [ordered]@{
        ts    = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        runId = $script:RunId
        pid   = $PID
        step  = $Step
        status = $Status
        detail = $Detail
    }
    if ($null -ne $Extra) {
        foreach ($k in $Extra.Keys) { $record[$k] = $Extra[$k] }
    }

    try {
        $json = $record | ConvertTo-Json -Compress -Depth 6
        $json = Redact-Sensitive $json
        [System.IO.File]::AppendAllText($script:AuditFile, $json + [Environment]::NewLine)
    } catch {
        Write-Warning ("aionsync: could not write audit record ({0})" -f $_.Exception.Message)
    }
}

function Invoke-LogRotation {
    <#
    .SYNOPSIS
        Keeps the human log daily-rotated and bounded by MaxLogFiles.
    .DESCRIPTION
        The active file is always logs/sync.log. When its last write lands on an
        older UTC day it is renamed to logs/sync-YYYYMMDD.log, and only the newest
        MaxLogFiles rotated files are kept.
    #>
    if (-not (Test-Path -LiteralPath $script:TextLog)) { return }

    $today = (Get-Date).ToUniversalTime().ToString('yyyyMMdd')
    if ($script:LogDate -eq $today) { return }

    $lastWrite = (Get-Item -LiteralPath $script:TextLog).LastWriteTimeUtc.ToString('yyyyMMdd')
    $script:LogDate = $today
    if ($lastWrite -eq $today) { return }

    $archived = Join-Path $script:LogDir ("sync-{0}.log" -f $lastWrite)
    Move-Item -LiteralPath $script:TextLog -Destination $archived -Force

    $keep = [int](Config-Get 'MaxLogFiles' 14)
    $files = @(Get-ChildItem -LiteralPath $script:LogDir -Filter 'sync-*.log' -File -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending)
    if ($files.Count -gt $keep) {
        foreach ($old in $files[$keep..($files.Count - 1)]) {
            Remove-Item -LiteralPath $old.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

function Config-Get {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Key,
        [Parameter()][AllowNull()]$Default = $null
    )

    if ($null -eq $script:Config) { return $Default }
    # ContainsKey rather than direct indexing: under Set-StrictMode a missing key
    # must degrade to the documented default, never throw.
    if ($script:Config.ContainsKey($Key) -and $null -ne $script:Config[$Key]) {
        return $script:Config[$Key]
    }
    return $Default
}

function Load-Config {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "config file not found: $Path"
    }
    $raw = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "config file is empty: $Path"
    }

    # -AsHashtable gives a real hashtable, so Config-Get can probe keys safely.
    $cfg = $raw | ConvertFrom-Json -AsHashtable
    if ($cfg -isnot [System.Collections.IDictionary]) {
        throw "config file is not a JSON object: $Path"
    }
    return $cfg
}

# ---------------------------------------------------------------------------
# Process / command execution
# ---------------------------------------------------------------------------

function ConvertTo-NativeArgument {
    <#
    .SYNOPSIS
        Quotes one argument for the Windows command line Start-Process builds.
    .DESCRIPTION
        Start-Process joins -ArgumentList with spaces without quoting elements
        that contain spaces, so a repository path such as C:\My Repos\AION would
        arrive as two arguments. Building the whole command line ourselves with
        CommandLineToArgvW rules is the only reliable option.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Value)

    if ($Value -notmatch '[\s"]') { return $Value }

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.Append('"')
    $pendingBackslashes = 0
    foreach ($ch in $Value.ToCharArray()) {
        if ($ch -eq '\') {
            $pendingBackslashes++
            continue
        }
        if ($ch -eq '"') {
            [void]$sb.Append(('\' * ($pendingBackslashes * 2 + 1)))
            [void]$sb.Append('"')
            $pendingBackslashes = 0
            continue
        }
        if ($pendingBackslashes -gt 0) {
            [void]$sb.Append(('\' * $pendingBackslashes))
            $pendingBackslashes = 0
        }
        [void]$sb.Append($ch)
    }
    [void]$sb.Append(('\' * ($pendingBackslashes * 2)))
    [void]$sb.Append('"')
    return $sb.ToString()
}

function Invoke-External {
    <#
    .SYNOPSIS
        Runs an external command with a hard timeout and captured stdout/stderr.
    .DESCRIPTION
        Every external call in this engine is bounded. An unattended scheduled run
        must never block forever on a network fetch or a credential prompt, so the
        child is started detached, waited on with an explicit timeout and killed if
        it overruns. Output goes to redirected temp files to avoid both pipe
        deadlocks and console encoding surprises.
    #>
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter()][AllowNull()][string[]]$Arguments = @(),
        [Parameter()][int]$TimeoutSeconds = 60,
        [Parameter()][string]$WorkingDirectory,
        [Parameter()][string]$StdinFilePath
    )

    $token = [guid]::NewGuid().ToString('N')
    $ioDir = if ([string]::IsNullOrWhiteSpace($script:TempDir)) { $env:TEMP } else { $script:TempDir }
    $outFile = Join-Path $ioDir ("io-{0}.out" -f $token)
    $errFile = Join-Path $ioDir ("io-{0}.err" -f $token)

    $argLine = ''
    if ($null -ne $Arguments -and $Arguments.Count -gt 0) {
        $argLine = (@($Arguments | ForEach-Object { ConvertTo-NativeArgument $_ }) -join ' ')
    }

    $startParams = @{
        FilePath               = $FilePath
        NoNewWindow             = $true
        PassThru                = $true
        RedirectStandardOutput = $outFile
        RedirectStandardError  = $errFile
    }
    if ($argLine) { $startParams['ArgumentList'] = $argLine }
    if ($WorkingDirectory) { $startParams['WorkingDirectory'] = $WorkingDirectory }
    if ($StdinFilePath -and $script:HasStdinRedirect) { $startParams['RedirectStandardInput'] = $StdinFilePath }

    $proc = $null
    $timedOut = $false
    try {
        $proc = Start-Process @startParams
        $proc.EnableRaisingEvents = $true
        $script:OwnChildPids.Add($proc.Id) | Out-Null

        $exited = $false
        try {
            Wait-Process -Id $proc.Id -Timeout $TimeoutSeconds -ErrorAction Stop
            $exited = $true
        } catch [System.TimeoutException] {
            $exited = $false
        } catch {
            # Wait-Process reports a fast-exiting child as "not found"; that is a
            # successful exit, not a failure. Anything else is treated as a timeout.
            $exited = $proc.HasExited
        }

        if (-not $exited) {
            $timedOut = $true
            try { $proc.Kill($true) } catch { try { $proc.Kill() } catch { } }
            try { Wait-Process -Id $proc.Id -Timeout 15 -ErrorAction SilentlyContinue } catch { }
        }

        $proc.Refresh()
        $exitCode = 99
        if ($proc.HasExited) {
            # WaitForExit() on the object guarantees ExitCode is populated even
            # when we never observed the process through Wait-Process.
            $proc.WaitForExit()
            $exitCode = $proc.ExitCode
        }

        return [pscustomobject]@{
            FilePath  = $FilePath
            Arguments = $Arguments
            ExitCode  = $exitCode
            StdOut    = (Get-Content -LiteralPath $outFile -Raw -ErrorAction SilentlyContinue)
            StdErr    = (Get-Content -LiteralPath $errFile -Raw -ErrorAction SilentlyContinue)
            TimedOut  = $timedOut
        }
    } finally {
        if ($null -ne $proc) { $script:OwnChildPids.Remove($proc.Id) | Out-Null }
        Remove-Item -LiteralPath $outFile -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $errFile -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-Git {
    <#
    .SYNOPSIS
        Runs git inside the repository and returns ExitCode / StdOut / StdErr.
    #>
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter()][int]$TimeoutSeconds = 60,
        [Parameter()][switch]$NoRepo
    )

    $cwd = if ($NoRepo) { $script:WorkRoot } else { $script:RepoRoot }
    return Invoke-External -FilePath 'git' -Arguments $Arguments -TimeoutSeconds $TimeoutSeconds -WorkingDirectory $cwd
}

function Get-GitOutput {
    <#
    .SYNOPSIS
        Convenience wrapper for read-only git calls whose value is the stdout text.
    .DESCRIPTION
        Returns $null when the call fails or times out; callers decide whether a
        missing value is fatal or merely informational.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter()][int]$TimeoutSeconds = 30,
        [Parameter()][switch]$NoRepo
    )

    $r = Invoke-Git -Arguments $Arguments -TimeoutSeconds $TimeoutSeconds -NoRepo:$NoRepo
    if ($r.TimedOut -or $r.ExitCode -ne 0) { return $null }
    if ($null -eq $r.StdOut) { return '' }
    return $r.StdOut.Trim()
}

function Split-GitLines {
    [CmdletBinding()]
    [OutputType([string[]])]
    param([AllowNull()][AllowEmptyString()][string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) { return @() }
    return @($Text -split "\r?\n" | Where-Object { $_.Length -gt 0 })
}

# ---------------------------------------------------------------------------
# Workspace / repo resolution
# ---------------------------------------------------------------------------

function Initialize-Workspace {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$RepositoryPath,
        [Parameter(Mandatory)][string]$StateRoot
    )

    if (-not (Test-Path -LiteralPath $RepositoryPath)) {
        throw "repository path not found: $RepositoryPath"
    }
    $resolved = (Resolve-Path -LiteralPath $RepositoryPath).ProviderPath
    $script:RepoRoot = $resolved.TrimEnd('\', '/')

    # The runtime directories must exist before the first git call: Invoke-External
    # redirects child output into $script:TempDir.
    $script:WorkRoot = $StateRoot.TrimEnd('\', '/')
    $script:LockDir = Join-Path $script:WorkRoot 'lock'
    $script:LogDir = Join-Path $script:WorkRoot 'logs'
    $script:StateDir = Join-Path $script:WorkRoot 'state'
    $script:EscalationDir = Join-Path $script:WorkRoot 'escalations'
    $script:TempDir = Join-Path $script:WorkRoot 'tmp'

    foreach ($d in @($script:LockDir, $script:LogDir, $script:StateDir, $script:EscalationDir, $script:TempDir)) {
        if (-not (Test-Path -LiteralPath $d)) {
            New-Item -ItemType Directory -Path $d -Force | Out-Null
        }
    }

    $gitDirOut = Get-GitOutput -Arguments @('rev-parse', '--absolute-git-dir') -TimeoutSeconds 30
    if ([string]::IsNullOrWhiteSpace($gitDirOut)) {
        throw "not a git repository (or git is unavailable): $script:RepoRoot"
    }
    $script:GitDir = $gitDirOut.Trim()

    $script:AuditFile = Join-Path $script:LogDir 'audit.ndjson'
    $script:TextLog = Join-Path $script:LogDir 'sync.log'
    $script:LogDate = (Get-Date).ToUniversalTime().ToString('yyyyMMdd')
}

function Get-ExitCodeName {
    [CmdletBinding()]
    [OutputType([string])]
    param([Parameter(Mandatory)][int]$Code)

    foreach ($kv in $script:ExitCodes.GetEnumerator()) {
        if ($kv.Value -eq $Code) { return [string]$kv.Key }
    }
    return 'UNKNOWN'
}

function Get-Branch {
    [CmdletBinding()]
    [OutputType([string])]
    param()

    $b = Get-GitOutput -Arguments @('rev-parse', '--abbrev-ref', 'HEAD')
    if ([string]::IsNullOrWhiteSpace($b) -or $b -eq 'HEAD') {
        return [string](Config-Get 'Branch' 'main')
    }
    return $b
}

# ---------------------------------------------------------------------------
# A. Locking
# ---------------------------------------------------------------------------

function Get-LockPath {
    [CmdletBinding()]
    [OutputType([string])]
    param()
    return (Join-Path $script:LockDir 'sync.lock')
}

function Read-LockRecord {
    <#
    .SYNOPSIS
        Best-effort read of the lock JSON written by the owning process.
    .DESCRIPTION
        Returns $null when the file is missing, unreadable or malformed. A live
        holder opens the file with FileShare::None, so the read fails with a
        sharing violation while the lock is genuinely held - that failure is
        itself the answer, and the caller treats $null as "held, contents unknown".
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param()

    $path = Get-LockPath
    if (-not (Test-Path -LiteralPath $path)) { return $null }

    try {
        $fs = [System.IO.File]::Open(
            $path,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            [System.IO.FileShare]::ReadWrite)
        try {
            $reader = [System.IO.StreamReader]::new($fs)
            try { $text = $reader.ReadToEnd() } finally { $reader.Dispose() }
        } finally {
            $fs.Dispose()
        }
    } catch {
        return $null
    }

    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    try {
        $obj = $text | ConvertFrom-Json -AsHashtable
        if ($obj -is [System.Collections.IDictionary]) { return $obj }
    } catch {
        return $null
    }
    return $null
}

function Test-LockHeld {
    <#
    .SYNOPSIS
        True when another process currently holds the exclusive lock handle.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    $path = Get-LockPath
    try {
        $probe = [System.IO.File]::Open(
            $path,
            [System.IO.FileMode]::OpenOrCreate,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None)
        $probe.Dispose()
        return $false
    } catch [System.IO.IOException] {
        return $true
    } catch [System.UnauthorizedAccessException] {
        return $true
    }
}

function Test-LockRecordStale {
    <#
    .SYNOPSIS
        Decides whether an existing (handle-free) lock record may be reclaimed.
    .DESCRIPTION
        A record is stale when its PID is no longer running, or when it is older
        than LockStaleMinutes. The age branch is a backstop for a PID that was
        recycled by Windows; in practice a live holder also blocks the exclusive
        open below, and MaxRunSeconds (240s) is deliberately far below
        LockStaleMinutes (900s) so a legitimate run can never be aged out.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][AllowNull()]$Record,
        # -ref rather than [ref[T]]: the reason is reported back to the caller,
        # which needs the variable itself, not just its value.
        [Parameter(Mandatory)][ref]$Reason
    )

    $Reason.Value = 'fresh'
    if ($null -eq $Record) {
        $Reason.Value = 'unreadable-or-absent'
        return $false
    }

    $pidValue = 0
    if ($Record.ContainsKey('pid')) { [void][int]::TryParse([string]$Record['pid'], [ref]$pidValue) }

    $ageMinutes = $null
    if ($Record.ContainsKey('startedUtc')) {
        $parsed = [datetime]::MinValue
        $ok = [datetime]::TryParse(
            [string]$Record['startedUtc'],
            [System.Globalization.CultureInfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal,
            [ref]$parsed)
        if ($ok) { $ageMinutes = [math]::Round(((Get-Date).ToUniversalTime() - $parsed.ToUniversalTime()).TotalMinutes, 1) }
    }

    $staleMinutes = [double](Config-Get 'LockStaleMinutes' 15)

    if ($pidValue -gt 0 -and -not (Test-PidAlive -ProcessId $pidValue)) {
        $Reason.Value = 'pid-not-running'
        return $true
    }
    if ($null -ne $ageMinutes -and $ageMinutes -gt $staleMinutes) {
        $Reason.Value = 'age-exceeded'
        return $true
    }
    $Reason.Value = 'fresh'
    return $false
}

function Test-PidAlive {
    [CmdletBinding()]
    [OutputType([bool])]
    param([Parameter(Mandatory)][int]$ProcessId)

    if ($ProcessId -eq $PID) { return $true }
    try {
        $p = Get-Process -Id $ProcessId -ErrorAction Stop
        return ($null -ne $p)
    } catch {
        return $false
    }
}

function Enter-SyncLock {
    <#
    .SYNOPSIS
        Acquires the exclusive repository lock or returns a SKIP_CONCURRENT code.
    .DESCRIPTION
        Two guards, in this order:
          1. Inspect any existing lock record. Stale (dead PID / over-age) is
             reclaimed with a LOCK_STALE_RECOVERED audit entry naming the prior PID
             and age; a fresh record means another live run owns the repo.
          2. Take the exclusive handle itself. This is the authoritative
             mutual-exclusion check: a second process genuinely fails here.
        The lock file is never deleted - removing it would race with a waiter that
        is about to open it. The handle close in Exit-SyncLock is the release.
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param()

    $path = Get-LockPath
    $staleMinutes = [double](Config-Get 'LockStaleMinutes' 15)

    $existing = Read-LockRecord
    if ($null -ne $existing) {
        $reason = 'fresh'
        if (Test-LockRecordStale -Record $existing -Reason ([ref]$reason)) {
            $priorPid = if ($existing.ContainsKey('pid')) { [string]$existing['pid'] } else { '?' }
            $priorUtc = if ($existing.ContainsKey('startedUtc')) { [string]$existing['startedUtc'] } else { '?' }
            $ageMin = 'unknown'
            $probe = [datetime]::MinValue
            $ok = [datetime]::TryParse(
                $priorUtc,
                [System.Globalization.CultureInfo]::InvariantCulture,
                [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal,
                [ref]$probe)
            if ($ok) { $ageMin = '{0}min' -f [math]::Round(((Get-Date).ToUniversalTime() - $probe.ToUniversalTime()).TotalMinutes, 1) }

            Write-Log -Level WARN -Message ("LOCK_STALE_RECOVERED priorPid={0} priorStartedUtc={1} age={2} reason={3} staleAfter={4}min" -f $priorPid, $priorUtc, $ageMin, $reason, $staleMinutes)
            Write-Audit -Step 'lock' -Status 'LOCK_STALE_RECOVERED' `
                -Detail ("priorPid={0} priorStartedUtc={1} age={2} reason={3}" -f $priorPid, $priorUtc, $ageMin, $reason)
        } else {
            $heldPid = '?'
            if ($existing.ContainsKey('pid')) { $heldPid = [string]$existing['pid'] }
            $heldUtc = '?'
            if ($existing.ContainsKey('startedUtc')) { $heldUtc = [string]$existing['startedUtc'] }
            Write-Log -Level SKIP -Message ("SKIP_CONCURRENT lock held by pid={0} since {1}" -f $heldPid, $heldUtc)
            Write-Audit -Step 'lock' -Status 'SKIP_CONCURRENT' -Detail 'another run holds a live lock record'
            return [hashtable]@{ Acquired = $false; Code = [int]$script:ExitCodes['SKIP_CONCURRENT'] }
        }
    }

    try {
        $stream = [System.IO.File]::Open(
            $path,
            [System.IO.FileMode]::OpenOrCreate,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None)
    } catch [System.IO.IOException] {
        Write-Log -Level SKIP -Message 'SKIP_CONCURRENT another process holds the exclusive lock handle'
        Write-Audit -Step 'lock' -Status 'SKIP_CONCURRENT' -Detail 'exclusive handle held by another process'
        return [hashtable]@{ Acquired = $false; Code = [int]$script:ExitCodes['SKIP_CONCURRENT'] }
    } catch [System.UnauthorizedAccessException] {
        Write-Log -Level ERROR -Message 'ERROR cannot open lock file (access denied)'
        Write-Audit -Step 'lock' -Status 'ERROR' -Detail 'lock file access denied'
        return [hashtable]@{ Acquired = $false; Code = [int]$script:ExitCodes['ERROR'] }
    }

    $payload = [ordered]@{
        pid        = $PID
        startedUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        host       = [System.Environment]::MachineName
        repo       = $script:RepoRoot
    } | ConvertTo-Json -Compress

    $stream.SetLength(0)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload + [Environment]::NewLine)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush($true)

    $script:LockStream = $stream
    Write-Log -Level INFO -Message ("lock acquired pid={0} path={1}" -f $PID, $path)
    return [hashtable]@{ Acquired = $true; Code = [int]$script:ExitCodes['OK'] }
}

function Exit-SyncLock {
    [CmdletBinding()]
    param()

    if ($null -eq $script:LockStream) { return }
    try {
        $script:LockStream.Dispose()
    } catch {
        # Nothing actionable: the OS reclaims the handle when the process exits.
    } finally {
        $script:LockStream = $null
    }
}

# ---------------------------------------------------------------------------
# B. Busy / concurrency detection
# ---------------------------------------------------------------------------

function Test-BusyInterference {
    <#
    .SYNOPSIS
        Detects anything that means "an agent is working in this repo right now".
    .DESCRIPTION
        The sync never wins a race against a human or another agent. Detection
        covers an in-progress git operation on disk, a git.exe whose command line
        references this repository, and a merge in progress. Returns the list of
        reasons found (empty means it is safe to proceed).
    #>
    [CmdletBinding()]
    [OutputType([string[]])]
    param()

    $reasons = [System.Collections.Generic.List[string]]::new()

    foreach ($rel in @('index.lock', 'rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD')) {
        $p = Join-Path $script:GitDir $rel
        if (Test-Path -LiteralPath $p) { $reasons.Add("git-state:$rel") }
    }

    # Cross-check via git itself: catches a state whose git dir differs from the
    # .git we resolved (linked worktrees, GIT_DIR overrides).
    $mergeHead = Invoke-Git -Arguments @('rev-parse', '-q', '--verify', 'MERGE_HEAD') -TimeoutSeconds 20
    if (-not $mergeHead.TimedOut -and $mergeHead.ExitCode -eq 0) {
        if (-not $reasons.Contains('git-state:MERGE_HEAD')) { $reasons.Add('git-verify:MERGE_HEAD') }
    }

    $exclude = [System.Collections.Generic.HashSet[int]]::new()
    [void]$exclude.Add($PID)
    foreach ($p in $script:OwnChildPids) { [void]$exclude.Add($p) }

    try {
        $procs = @(Get-CimInstance -ClassName Win32_Process -Filter "Name='git.exe'" -ErrorAction Stop)
        foreach ($proc in $procs) {
            $procId = 0
            if (-not [int]::TryParse([string]$proc.ProcessId, [ref]$procId)) { continue }
            if ($exclude.Contains($procId)) { continue }
            $cmd = [string]$proc.CommandLine
            if ([string]::IsNullOrWhiteSpace($cmd)) { continue }
            if ($cmd.IndexOf($script:RepoRoot, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                $reasons.Add("git-pid:$procId")
            }
        }
    } catch {
        # The scan is a safety net, not the primary guard. If CIM is unavailable we
        # must not block sync forever, so we record the degradation and continue
        # with the on-disk checks, which are the ones that catch real damage.
        Write-Log -Level WARN -Message ("git process scan unavailable: {0}" -f $_.Exception.Message)
        Write-Audit -Step 'busy-detect' -Status 'WARN' -Detail 'Get-CimInstance Win32_Process failed; on-disk checks only'
    }

    return $reasons.ToArray()
}

# ---------------------------------------------------------------------------
# C. Recoverable snapshots
# ---------------------------------------------------------------------------

function New-SnapshotAnchor {
    <#
    .SYNOPSIS
        Creates a recoverable rollback point without touching the working tree.
    .DESCRIPTION
        `git stash create` builds a commit describing index plus working tree
        without applying it, so nothing on disk moves. That commit is recorded as
        snapshotStash and additionally parked under refs/aionsync/stash/<utc> so
        garbage collection cannot drop it. refs/aionsync/snapshots/<utc> points at
        HEAD as a stable anchor. Both namespaces are pruned to the newest 20.
        No stash is ever pushed or popped.
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param([Parameter()][switch]$RequireDirty)

    $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $result = [ordered]@{
        utc          = $stamp
        snapshotStash = $null
        snapshotRef  = $null
        stashRef     = $null
        dirty        = $false
    }

    $status = Invoke-Git -Arguments @('status', '--porcelain=v1') -TimeoutSeconds 60
    $dirty = $false
    if ($status.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($status.StdOut)) {
        $dirty = $true
    }
    $result['dirty'] = $dirty

    if ($RequireDirty -and -not $dirty) {
        return $result
    }

    $stash = Invoke-Git -Arguments @('stash', 'create', ("aionsync-snapshot {0}" -f $stamp)) -TimeoutSeconds 120
    if ($stash.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($stash.StdOut)) {
        $result['snapshotStash'] = $stash.StdOut.Trim().Split("`n")[0].Trim()
    }

    $snapRef = "refs/aionsync/snapshots/$stamp"
    $upd = Invoke-Git -Arguments @('update-ref', $snapRef, 'HEAD') -TimeoutSeconds 30
    if ($upd.ExitCode -eq 0) {
        $result['snapshotRef'] = $snapRef
    } else {
        Write-Log -Level WARN -Message ("snapshot ref could not be created: {0}" -f (Redact-Sensitive $upd.StdErr))
    }

    if ($null -ne $result['snapshotStash']) {
        $stashRef = "refs/aionsync/stash/$stamp"
        $upd2 = Invoke-Git -Arguments @('update-ref', $stashRef, [string]$result['snapshotStash']) -TimeoutSeconds 30
        if ($upd2.ExitCode -eq 0) {
            $result['stashRef'] = $stashRef
        } else {
            Write-Log -Level WARN -Message ("stash ref could not be created: {0}" -f (Redact-Sensitive $upd2.StdErr))
        }
    }

    Remove-SnapshotRefs -KeepNewest 20

    Write-Log -Level INFO -Message ("snapshot utc={0} ref={1} stash={2} dirty={3}" -f `
            $stamp, ([string]$result['snapshotRef']), ([string]$result['snapshotStash']), $dirty)
    return $result
}

function Remove-SnapshotRefs {
    [CmdletBinding()]
    param([Parameter(Mandatory)][int]$KeepNewest)

    foreach ($ns in @('refs/aionsync/snapshots', 'refs/aionsync/stash')) {
        $listing = Get-GitOutput -Arguments @('for-each-ref', "--format=%(refname)", $ns) -TimeoutSeconds 30
        if ($null -eq $listing) { continue }
        $refs = @(Split-GitLines -Text $listing)
        if ($refs.Count -le $KeepNewest) { continue }

        # Names embed a UTC timestamp, so a descending name sort is a true
        # newest-first order and needs no separate date parsing.
        $sorted = @($refs | Sort-Object -Descending)
        foreach ($old in $sorted[$KeepNewest..($sorted.Count - 1)]) {
            [void](Invoke-Git -Arguments @('update-ref', '-d', $old) -TimeoutSeconds 20)
        }
        Write-Log -Level INFO -Message ("pruned {0} snapshot refs under {1} (kept newest {2})" -f `
                ($sorted.Count - $KeepNewest), $ns, $KeepNewest)
    }
}

# ---------------------------------------------------------------------------
# F. Bounded execution
# ---------------------------------------------------------------------------

function Assert-TimeBudget {
    <#
    .SYNOPSIS
        Aborts the cycle with TIMEOUT once MaxRunSeconds is exceeded.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Step)

    if ($null -eq $script:Stopwatch) { return }
    $max = [double](Config-Get 'MaxRunSeconds' 240)
    if ($script:Stopwatch.Elapsed.TotalSeconds -le $max) { return }

    $msg = "TIMEOUT step={0} elapsed={1:N1}s limit={2}s" -f $Step, $script:Stopwatch.Elapsed.TotalSeconds, $max
    Write-Log -Level ERROR -Message $msg
    Write-Audit -Step $Step -Status 'TIMEOUT' -Detail $msg
    throw [System.TimeoutException]::new($msg)
}

# ---------------------------------------------------------------------------
# D. The sync cycle
# ---------------------------------------------------------------------------

function Get-AheadBehind {
    <#
    .SYNOPSIS
        Returns @{ Ahead; Behind; HasUpstream } from rev-list --left-right --count.
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param()

    $upstream = Get-GitOutput -Arguments @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
    if ([string]::IsNullOrWhiteSpace($upstream) -or $upstream -eq '@{u}') {
        Write-Log -Level WARN -Message 'no upstream tracking branch configured; treating as 0/0'
        return @{ Ahead = 0; Behind = 0; HasUpstream = $false; Upstream = '' }
    }

    $raw = Get-GitOutput -Arguments @('rev-list', '--left-right', '--count', 'HEAD...@{u}') -TimeoutSeconds 60
    if ($null -eq $raw) {
        throw 'git rev-list --left-right --count failed'
    }
    $parts = @($raw -split '\s+' | Where-Object { $_ -match '^\d+$' })
    if ($parts.Count -lt 2) {
        throw "unparsable rev-list output: $raw"
    }
    return @{ Ahead = [int]$parts[0]; Behind = [int]$parts[1]; HasUpstream = $true; Upstream = $upstream }
}

function Test-RepoDirty {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    $s = Invoke-Git -Arguments @('status', '--porcelain=v1') -TimeoutSeconds 60
    if ($s.ExitCode -ne 0) { return $false }
    return (-not [string]::IsNullOrWhiteSpace($s.StdOut))
}

function Test-MergeInProgress {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    $m = Invoke-Git -Arguments @('rev-parse', '-q', '--verify', 'MERGE_HEAD') -TimeoutSeconds 20
    return ($m.ExitCode -eq 0 -and -not $m.TimedOut)
}

function Invoke-ConflictCapture {
    <#
    .SYNOPSIS
        Saves the conflicted path list and merge stderr under escalations/.
    .DESCRIPTION
        The engine never resolves a conflict. The evidence a human needs to
        resolve it is captured verbatim (redacted) so the escalation is actionable
        after the fact.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)][string]$Kind,
        [Parameter()][AllowNull()][AllowEmptyString()][string]$Detail = ''
    )

    $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $file = Join-Path $script:EscalationDir ("{0}-{1}.txt" -f $Kind, $stamp)

    $conflicts = Get-GitOutput -Arguments @('diff', '--name-only', '--diff-filter=U') -TimeoutSeconds 30
    $body = [System.Text.StringBuilder]::new()
    [void]$body.AppendLine("utc      : $(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')")
    [void]$body.AppendLine("runId    : $($script:RunId)")
    [void]$body.AppendLine("kind     : $Kind")
    [void]$body.AppendLine("repo     : $($script:RepoRoot)")
    [void]$body.AppendLine("head     : $(Get-Date).ToUniversalTime().ToString('o')")
    [void]$body.AppendLine("conflicted paths (git diff --name-only --diff-filter=U):")
    if ([string]::IsNullOrWhiteSpace($conflicts)) { [void]$body.AppendLine('  (none reported)') }
    else { foreach ($c in (Split-GitLines -Text $conflicts)) { [void]$body.AppendLine("  $c") } }
    [void]$body.AppendLine('detail   :')
    if ([string]::IsNullOrWhiteSpace($Detail)) { [void]$body.AppendLine('  (none)') }
    else { [void]$body.AppendLine((Redact-Sensitive $Detail)) }
    [void]$body.AppendLine('resolution: NOT resolved by aionsync - pick a side manually.')

    [System.IO.File]::WriteAllText($file, (Redact-Sensitive $body.ToString()))
    return $file
}

function Stop-MergeIfRunning {
    <#
    .SYNOPSIS
        Aborts a merge this script started; never aborts somebody else's merge.
    .DESCRIPTION
        MERGE_HEAD is only cleared when it exists. `git merge --abort` restores the
        pre-merge index and working tree exactly, which is what keeps local work
        intact after an escalated conflict.
    #>
    [CmdletBinding()]
    param()

    if (-not (Test-MergeInProgress)) { return $false }
    $a = Invoke-Git -Arguments @('merge', '--abort') -TimeoutSeconds 120
    if ($a.ExitCode -ne 0) {
        Write-Log -Level ERROR -Message ("git merge --abort failed: {0}" -f (Redact-Sensitive $a.StdErr))
        return $false
    }
    return $true
}

function Get-StagedPaths {
    <#
    .SYNOPSIS
        Staged path list, one per line, literal (unquoted) names.
    #>
    [CmdletBinding()]
    [OutputType([string[]])]
    param()

    $out = Get-GitOutput -Arguments @('-c', 'core.quotepath=false', 'diff', '--cached', '--name-only', '--diff-filter=ACMR') -TimeoutSeconds 60
    if ($null -eq $out) { return @() }
    return (Split-GitLines -Text $out)
}

function Select-DeniedPaths {
    <#
    .SYNOPSIS
        Filters staged paths against DenyPathPatterns and the repository .gitignore.
    .DESCRIPTION
        Two independent gates:
          * DenyPathPatterns - a hardcoded list of credential and build-artifact
            shapes. A match is unstaged even if the repository allows the path.
          * git check-ignore - the repository's own deny-by-default rules. Only
            paths git itself reports as ignored (i.e. untracked-but-ignored) are
            unstaged; a path that is both tracked and matching an ignore rule is
            left alone, because the owner committed it deliberately.
    #>
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$StagedPaths,
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$DenyPatterns
    )

    $denied = [System.Collections.Generic.List[string]]::new()
    $ignored = [System.Collections.Generic.List[string]]::new()

    foreach ($path in $StagedPaths) {
        foreach ($pattern in $DenyPatterns) {
            if ([string]::IsNullOrWhiteSpace($pattern)) { continue }
            if ($path -match $pattern) {
                $denied.Add($path)
                break
            }
        }
    }

    if ($StagedPaths.Count -gt 0) {
        if ($script:HasStdinRedirect) {
            $listFile = Join-Path $script:TempDir ('ignored-{0}.txt' -f [guid]::NewGuid().ToString('N'))
            [System.IO.File]::WriteAllLines($listFile, $StagedPaths)
            try {
                $r = Invoke-External -FilePath 'git' -Arguments @('check-ignore', '--stdin') `
                    -TimeoutSeconds 60 -WorkingDirectory $script:RepoRoot -StdinFilePath $listFile
                if ($r.ExitCode -eq 0 -or $r.ExitCode -eq 1) {
                    foreach ($line in (Split-GitLines -Text $r.StdOut)) { $ignored.Add($line) }
                }
            } finally {
                Remove-Item -LiteralPath $listFile -Force -ErrorAction SilentlyContinue
            }
        } else {
            foreach ($path in $StagedPaths) {
                $r = Invoke-Git -Arguments @('check-ignore', '-q', '--', $path) -TimeoutSeconds 30
                if ($r.ExitCode -eq 0) { $ignored.Add($path) }
            }
        }
    }

    return [pscustomobject]@{
        Denied  = $denied.ToArray()
        Ignored = $ignored.ToArray()
    }
}

function Invoke-StagedCommit {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param()

    $denyPatterns = @(Config-Get 'DenyPathPatterns' @())
    if ($null -eq $denyPatterns) { $denyPatterns = @() }

    $add = Invoke-Git -Arguments @('add', '--all', '--', '.') -TimeoutSeconds 180
    if ($add.ExitCode -ne 0) {
        throw ("git add failed: {0}" -f (Redact-Sensitive $add.StdErr))
    }

    $staged = @(Get-StagedPaths)
    $filtered = Select-DeniedPaths -StagedPaths $staged -DenyPatterns $denyPatterns

    # The whole concatenation is parenthesised so the sort applies to both sets,
    # not just to the second one (pipeline binds tighter than +).
    $denied = @(@($filtered.Denied) + @($filtered.Ignored) | Sort-Object -Unique)
    foreach ($path in $denied) {
        # `git restore --staged` drops the path from the index only. The file on
        # disk is untouched, so nothing is ever lost by the filter.
        $u = Invoke-Git -Arguments @('restore', '--staged', '--', $path) -TimeoutSeconds 60
        if ($u.ExitCode -ne 0) {
            Write-Log -Level WARN -Message ("could not unstage {0}: {1}" -f $path, (Redact-Sensitive $u.StdErr))
        }
    }

    if ($denied.Count -gt 0) {
        Write-Log -Level WARN -Message ("STAGED_DENIED unstaged {0} path(s): {1}" -f $denied.Count, ($denied -join ', '))
        Write-Audit -Step 'commit' -Status 'STAGED_DENIED' -Detail ($denied -join '; ')
    }

    $final = @(Get-StagedPaths)
    if ($final.Count -eq 0) {
        Write-Audit -Step 'commit' -Status 'NO_CHANGES' -Detail 'nothing staged after deny filtering'
        return [pscustomobject]@{ Committed = $false; Path = $null; Count = 0; Denied = $denied }
    }

    $utc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    $subject = "aionsync: {0} file(s) changed on Windows master {1}" -f $final.Count, $utc
    $shown = @($final | Select-Object -First 10)
    $bodyLines = [System.Collections.Generic.List[string]]::new()
    $bodyLines.Add('changed paths:')
    foreach ($p in $shown) { $bodyLines.Add(" - $p") }
    if ($final.Count -gt $shown.Count) {
        $bodyLines.Add(" - ... and {0} more" -f ($final.Count - $shown.Count))
    }
    if ($denied.Count -gt 0) {
        $bodyLines.Add('')
        $bodyLines.Add('withheld by deny rules (still on disk, not committed):')
        foreach ($p in (@($denied) | Select-Object -First 10)) { $bodyLines.Add(" - $p") }
    }
    $body = ($bodyLines -join [Environment]::NewLine)

    # The message goes through a file: a multi-line -m argument does not survive
    # Windows command-line quoting intact.
    $msgFile = Join-Path $script:TempDir ('commit-{0}.txt' -f [guid]::NewGuid().ToString('N'))
    [System.IO.File]::WriteAllText($msgFile, ((Redact-Sensitive $subject) + [Environment]::NewLine + [Environment]::NewLine + $body))
    try {
        $c = Invoke-Git -Arguments @('commit', '-F', $msgFile) -TimeoutSeconds 180
    } finally {
        Remove-Item -LiteralPath $msgFile -Force -ErrorAction SilentlyContinue
    }

    if ($c.ExitCode -ne 0) {
        throw ("git commit failed: {0}" -f (Redact-Sensitive "$($c.StdOut) $($c.StdErr)"))
    }

    $newHead = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30
    Write-Log -Level OK -Message ("COMMITTED {0} file(s) -> {1}" -f $final.Count, $newHead)
    Write-Audit -Step 'commit' -Status 'COMMITTED' -Detail ("{0} file(s); head={1}" -f $final.Count, $newHead)
    return [pscustomobject]@{ Committed = $true; Path = $newHead; Count = $final.Count; Denied = $denied }
}

function Invoke-Push {
    <#
    .SYNOPSIS
        Pushes HEAD to the configured branch, never forcefully.
    .DESCRIPTION
        A non-fast-forward rejection triggers exactly one recovery attempt:
        fetch, non-forced merge of the upstream, retry the push. A second failure
        is escalated for a human. Force is never an option; if the branches cannot
        be reconciled non-destructively, that is a decision for the owner.
    #>
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param()

    $remote = [string](Config-Get 'RemoteName' 'origin')
    $branch = [string](Config-Get 'Branch' 'main')

    # HEAD:<branch> rather than a named local ref, so the push always targets the
    # branch this run actually validated.
    $args = @('push', $remote, ("HEAD:{0}" -f $branch))
    $p = Invoke-Git -Arguments $args -TimeoutSeconds 300
    if ($p.ExitCode -eq 0) {
        Write-Log -Level OK -Message ("PUSHED {0}" -f (Redact-Sensitive $p.StdErr))
        Write-Audit -Step 'push' -Status 'PUSHED' -Detail ("{0} {1}" -f $remote, $branch)
        return [pscustomobject]@{ Pushed = $true; Escalated = $false; Stderr = '' }
    }

    $errText = Redact-Sensitive ("{0}`n{1}" -f $p.StdOut, $p.StdErr)
    $nonFastForward = ($errText -match 'non-fast-forward') -or
        ($errText -match '\[\s*rejected\]') -or
        ($errText -match 'fetch first') -or
        ($errText -match 'Updates were rejected') -or
        ($errText -match 'tip of your current branch is behind')

    Write-Log -Level WARN -Message ("push rejected (nonFastForward={0})" -f $nonFastForward)
    Write-Audit -Step 'push' -Status 'REJECTED' -Detail ("nonFastForward={0}" -f $nonFastForward)

    if ($nonFastForward) {
        Write-Log -Level INFO -Message 'push recovery: fetch + non-forced merge of upstream (one attempt)'
        [void](Invoke-Git -Arguments @('fetch', '--prune', $remote) -TimeoutSeconds 300)

        $m = Invoke-Git -Arguments @('merge', '--no-edit', '@{u}') -TimeoutSeconds 180
        if ($m.ExitCode -eq 0) {
            Write-Log -Level INFO -Message 'recovery merge succeeded; retrying push once'
            Write-Audit -Step 'push' -Status 'RECOVERY_MERGE_OK' -Detail 'merged @{u} then retried push'
            $retry = Invoke-Git -Arguments $args -TimeoutSeconds 300
            if ($retry.ExitCode -eq 0) {
                Write-Log -Level OK -Message 'PUSHED after recovery merge'
                Write-Audit -Step 'push' -Status 'PUSHED' -Detail 'push succeeded after recovery merge'
                return [pscustomobject]@{ Pushed = $true; Escalated = $false; Stderr = '' }
            }
            $errText = Redact-Sensitive ("{0}`n{1}" -f $retry.StdOut, $retry.StdErr)
        } else {
            # Never leave a half-finished merge behind.
            [void](Stop-MergeIfRunning)
            $errText = Redact-Sensitive ("{0}`n{1}`n{2}" -f $m.StdOut, $m.StdErr, $errText)
        }
    }

    $file = Invoke-ConflictCapture -Kind 'PUSH_REJECTED' -Detail $errText
    Write-Log -Level ESCALATION -Message ("ESCALATION PUSH_REJECTED evidence={0} - manual resolution required, no force push attempted" -f $file)
    Write-Audit -Step 'push' -Status 'ESCALATION' -Detail ("PUSH_REJECTED evidence={0}" -f $file) `
        -Extra @{ escalation = 'PUSH_REJECTED' }
    return [pscustomobject]@{ Pushed = $false; Escalated = $true; Stderr = $errText }
}

function Save-LastSuccess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Head,
        [Parameter(Mandatory)][int]$DurationMs
    )

    $payload = [ordered]@{
        utc        = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        head       = $Head
        runId      = $script:RunId
        durationMs = $DurationMs
    } | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText((Join-Path $script:StateDir 'last-success.json'), (Redact-Sensitive $payload))
}

function Get-LastSuccess {
    [CmdletBinding()]
    param()

    $f = Join-Path $script:StateDir 'last-success.json'
    if (-not (Test-Path -LiteralPath $f)) { return $null }
    try {
        return (Get-Content -LiteralPath $f -Raw | ConvertFrom-Json -AsHashtable)
    } catch {
        return $null
    }
}

function Test-Paused {
    [CmdletBinding()]
    [OutputType([bool])]
    param()
    return (Test-Path -LiteralPath (Join-Path $script:StateDir 'paused'))
}

function Invoke-SyncCycle {
    <#
    .SYNOPSIS
        One complete, audited, bounded sync cycle.
    .DESCRIPTION
        Order of operations, in order:
          1  Write-Start audit record (utc, pid, branch, preHead, trackedBranch)
          2  busy detection           -> SKIP_BUSY
          3  snapshot anchor
          4  fetch --prune
          5  ahead/behind relationship
          6  behind && !dirty        -> merge --ff-only @{u}
          7  ahead && behind && !dirty-> ONE merge --no-edit --no-ff @{u},
                                        aborted on failure -> ESCALATED_CONFLICT
          8  behind && dirty          -> SKIP_DIRTY_INTEGRATE, still commit+push
          9  commit phase with deny filtering
         10  push phase, never forced, one recovery attempt
         11  Write-End audit record
        Step 8 is evaluated before steps 6 and 7 because it is a precondition:
        git refuses to merge over local modifications anyway, so gating here turns
        a hard failure into a logged, non-destructive skip.
    #>
    [CmdletBinding()]
    [OutputType([int])]
    param()

    $script:Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $result = [int]$script:ExitCodes['OK']
    $changed = $false
    $branch = Get-Branch
    $preHead = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30
    $tracked = Get-GitOutput -Arguments @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}') -TimeoutSeconds 30
    $snapshot = $null

    Write-Audit -Step 'Write-Start' -Status 'START' `
        -Detail ("branch={0} preHead={1} tracked={2}" -f $branch, $preHead, $tracked) `
        -Extra @{ repo = $script:RepoRoot }
    Write-Log -Level INFO -Message ("run start repo={0} branch={1} preHead={2}" -f $script:RepoRoot, $branch, $preHead)

    try {
        # --- 2. busy detection -------------------------------------------------
        Assert-TimeBudget -Step 'busy-detect'
        # Wrapped in @() : an empty reasons array would otherwise unroll to $null
        # and .Count would fail under StrictMode.
        $busy = @(Test-BusyInterference)
        if ($busy.Count -gt 0) {
            $why = ($busy -join ', ')
            Write-Log -Level SKIP -Message ("SKIP_BUSY {0}" -f $why)
            Write-Audit -Step 'busy-detect' -Status 'SKIP_BUSY' -Detail $why
            return [int]$script:ExitCodes['SKIP_BUSY']
        }
        Write-Audit -Step 'busy-detect' -Status 'CLEAR' -Detail 'no git state, no foreign git.exe, no merge in progress'

        # --- 3. snapshot anchor ----------------------------------------------
        Assert-TimeBudget -Step 'snapshot'
        $snapshot = New-SnapshotAnchor
        Write-Audit -Step 'snapshot' -Status 'SNAPSHOT' `
            -Detail ("ref={0} stash={1}" -f ([string]$snapshot.snapshotRef), ([string]$snapshot.snapshotStash))

        # --- 4. fetch ---------------------------------------------------------
        Assert-TimeBudget -Step 'fetch'
        $remote = [string](Config-Get 'RemoteName' 'origin')
        $f = Invoke-Git -Arguments @('fetch', '--prune', $remote) -TimeoutSeconds 300
        if ($f.TimedOut) {
            $msg = 'TIMEOUT during git fetch'
            Write-Audit -Step 'fetch' -Status 'TIMEOUT' -Detail $msg
            throw [System.TimeoutException]::new($msg)
        }
        if ($f.ExitCode -ne 0) {
            # A bad remote name or an unreachable host is an operational error,
            # not a conflict. The working tree has not been touched at this point.
            $err = Redact-Sensitive ("{0}`n{1}" -f $f.StdOut, $f.StdErr)
            Write-Log -Level ERROR -Message ("ERROR fetch failed for remote '{0}': {1}" -f $remote, $err)
            Write-Audit -Step 'fetch' -Status 'ERROR' -Detail ("fetch failed for remote '{0}'" -f $remote)
            throw ("git fetch --prune {0} failed: {1}" -f $remote, $err)
        }
        Write-Audit -Step 'fetch' -Status 'OK' -Detail ("fetched --prune {0}" -f $remote)

        # --- 5. relationship --------------------------------------------------
        Assert-TimeBudget -Step 'relationship'
        $rel = Get-AheadBehind
        Write-Audit -Step 'relationship' -Status 'INFO' `
            -Detail ("upstream={0} ahead={1} behind={2}" -f $rel.Upstream, $rel.Ahead, $rel.Behind)
        Write-Log -Level INFO -Message ("relationship upstream={0} ahead={1} behind={2}" -f $rel.Upstream, $rel.Ahead, $rel.Behind)

        $dirty = Test-RepoDirty
        Write-Audit -Step 'dirty-check' -Status 'INFO' -Detail ("dirty={0}" -f $dirty)

        # --- 6/7/8. integrate --------------------------------------------------
        Assert-TimeBudget -Step 'integrate'
        if ($rel.Behind -gt 0 -and $dirty) {
            # Step 8: local work is never blocked by upstream. We still commit and
            # push below; the push phase reconciles non-destructively if needed.
            Write-Log -Level SKIP -Message ("SKIP_DIRTY_INTEGRATE behind={0} with a dirty working tree" -f $rel.Behind)
            Write-Audit -Step 'integrate' -Status 'SKIP_DIRTY_INTEGRATE' `
                -Detail ("behind={0} and working tree is dirty; integration deferred" -f $rel.Behind)
            $result = [int]$script:ExitCodes['SKIP_DIRTY_INTEGRATE']
        }
        elseif ($rel.Behind -gt 0 -and $rel.Ahead -eq 0) {
            $m = Invoke-Git -Arguments @('merge', '--ff-only', '@{u}') -TimeoutSeconds 180
            if ($m.ExitCode -eq 0) {
                $changed = $true
                $newHead = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30
                Write-Log -Level OK -Message ("FAST_FORWARDED {0} -> {1}" -f $preHead, $newHead)
                Write-Audit -Step 'integrate' -Status 'FAST_FORWARD' -Detail ("{0} -> {1}" -f $preHead, $newHead)
            } else {
                $err = Redact-Sensitive ("{0}`n{1}" -f $m.StdOut, $m.StdErr)
                [void](Stop-MergeIfRunning)
                $file = Invoke-ConflictCapture -Kind 'FF_FAILED' -Detail $err
                Write-Log -Level ERROR -Message ("ERROR ff-only merge failed; evidence={0}" -f $file)
                Write-Audit -Step 'integrate' -Status 'ERROR' -Detail ("ff-only merge failed; evidence={0}" -f $file)
                throw ("fast-forward merge failed: {0}" -f $err)
            }
        }
        elseif ($rel.Behind -gt 0 -and $rel.Ahead -gt 0) {
            Write-Log -Level WARN -Message ("DIVERGED ahead={0} behind={1}; attempting one non-destructive merge" -f $rel.Ahead, $rel.Behind)
            $m = Invoke-Git -Arguments @('merge', '--no-edit', '--no-ff', '@{u}') -TimeoutSeconds 300
            if ($m.ExitCode -eq 0) {
                $changed = $true
                $newHead = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30
                Write-Log -Level OK -Message ("MERGED upstream {0} -> {1}" -f $preHead, $newHead)
                Write-Audit -Step 'integrate' -Status 'MERGED' -Detail ("{0} -> {1}" -f $preHead, $newHead)
            } else {
                $err = Redact-Sensitive ("{0}`n{1}" -f $m.StdOut, $m.StdErr)
                $conflicted = @(Get-GitOutput -Arguments @('diff', '--name-only', '--diff-filter=U') -TimeoutSeconds 30)
                [void](Stop-MergeIfRunning)
                $file = Invoke-ConflictCapture -Kind 'MERGE_CONFLICT' -Detail $err
                $names = if ($null -eq $conflicted) { '(unreadable)' } else { ($conflicted -join ', ') }
                Write-Log -Level ESCALATION -Message ("ESCALATED_CONFLICT conflicts=[{0}] evidence={1} - merge aborted, nothing resolved" -f $names, $file)
                Write-Audit -Step 'integrate' -Status 'ESCALATED_CONFLICT' `
                    -Detail ("conflicts=[{0}] evidence={1}; merge aborted, side not chosen" -f $names, $file) `
                    -Extra @{ escalation = 'MERGE_CONFLICT' }

                # Stop here. Pushing a half-reconciled branch after an unresolved
                # conflict would either fail noisily or need force, and neither is
                # acceptable. The pre-merge state is intact and the snapshot ref
                # plus the escalation file are the recovery points.
                return [int]$script:ExitCodes['ESCALATED_CONFLICT']
            }
        }
        else {
            Write-Audit -Step 'integrate' -Status 'UP_TO_DATE' -Detail 'no integration required'
        }

        # --- 9. commit --------------------------------------------------------
        Assert-TimeBudget -Step 'commit'
        $commit = Invoke-StagedCommit
        if ($commit.Committed) { $changed = $true; $result = [int]$script:ExitCodes['OK'] }

        # --- 10. push ---------------------------------------------------------
        Assert-TimeBudget -Step 'push'
        $push = Invoke-Push
        if ($push.Pushed) {
            $changed = $true
            $result = [int]$script:ExitCodes['OK']
        }
        elseif ($push.Escalated) {
            return [int]$script:ExitCodes['ESCALATION']
        }

        return $result
    }
    catch [System.TimeoutException] {
        Write-Log -Level ERROR -Message ("TIMEOUT cycle aborted after {0:N1}s" -f $script:Stopwatch.Elapsed.TotalSeconds)
        return [int]$script:ExitCodes['TIMEOUT']
    }
    catch {
        $msg = Redact-Sensitive $_.Exception.Message
        Write-Log -Level ERROR -Message ("ERROR {0}" -f $msg)
        Write-Audit -Step 'Write-End' -Status 'ERROR' -Detail $msg
        return [int]$script:ExitCodes['ERROR']
    }
    finally {
        $script:Stopwatch.Stop()
        $durationMs = [int]$script:Stopwatch.ElapsedMilliseconds
        $finalHead = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30 -ErrorAction SilentlyContinue
        if ($null -eq $finalHead) { $finalHead = $preHead }

        # The cycle can fail before the snapshot is taken, so every snapshot field
        # is probed: a property access on $null would replace the real exit code.
        $snapStash = ''
        $snapRef = ''
        if ($null -ne $snapshot) {
            $snapStash = [string]$snapshot['snapshotStash']
            $snapRef = [string]$snapshot['snapshotRef']
        }

        Write-Audit -Step 'Write-End' -Status 'END' `
            -Detail ("durationMs={0} changed={1} code={2}" -f $durationMs, $changed, $result) `
            -Extra @{
                durationMs = $durationMs
                changed    = $changed
                code       = $result
                finalHead  = $finalHead
                preHead    = $preHead
                snapshotStash = $snapStash
                snapshotRef   = $snapRef
            }
        Write-Log -Level INFO -Message ("run end durationMs={0} changed={1} code={2} head={3}" -f $durationMs, $changed, $result, $finalHead)

        if ($result -eq [int]$script:ExitCodes['OK'] -or $result -eq [int]$script:ExitCodes['SKIP_DIRTY_INTEGRATE']) {
            try { Save-LastSuccess -Head $finalHead -DurationMs $durationMs } catch { }
        }
    }
}

# ---------------------------------------------------------------------------
# Reporting verbs
# ---------------------------------------------------------------------------

function Get-TaskState {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$TaskName)

    $info = [ordered]@{
        Exists   = $false
        State    = 'unknown'
        LastRun  = $null
        NextRun  = $null
        Error    = $null
    }
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        $info['Exists'] = $true
        $info['State'] = [string]$task.State
    } catch {
        $info['Error'] = Redact-Sensitive $_.Exception.Message
        return $info
    }
    try {
        $ti = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop
        $info['LastRun'] = [string]$ti.LastRunTime
        $info['NextRun'] = [string]$ti.NextRunTime
    } catch {
        $info['Error'] = Redact-Sensitive $_.Exception.Message
    }
    return $info
}

function Format-AuditTail {
    [CmdletBinding()]
    param([Parameter()][int]$Count = 5)

    if (-not (Test-Path -LiteralPath $script:AuditFile)) { return @() }
    $lines = @(Get-Content -LiteralPath $script:AuditFile -Tail ($Count * 4) -ErrorAction SilentlyContinue |
        Where-Object { $_.Trim().Length -gt 0 })
    $out = [System.Collections.Generic.List[object]]::new()
    foreach ($l in $lines) {
        if ($out.Count -ge $Count) { break }
        try {
            $out.Add(($l | ConvertFrom-Json -AsHashtable))
        } catch {
            $out.Add(@{ ts = '?'; step = 'unparsable'; status = 'unparsable'; detail = (Redact-Sensitive $l) })
        }
    }
    return $out.ToArray()
}

function Show-Status {
    [CmdletBinding()]
    param()

    $branch = Get-Branch
    $head = Get-GitOutput -Arguments @('rev-parse', 'HEAD') -TimeoutSeconds 30
    $shortHead = Get-GitOutput -Arguments @('rev-parse', '--short', 'HEAD') -TimeoutSeconds 30
    $tracked = Get-GitOutput -Arguments @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}') -TimeoutSeconds 30
    if ([string]::IsNullOrWhiteSpace($tracked)) { $tracked = '(none)' }

    $ahead = '?'; $behind = '?'
    try {
        $rel = Get-AheadBehind
        if ($rel.HasUpstream) { $ahead = $rel.Ahead; $behind = $rel.Behind }
        else { $ahead = 0; $behind = 0 }
    } catch {
        $ahead = '?'; $behind = '?'
    }

    $dirtyCount = 0
    $statusRaw = Invoke-Git -Arguments @('status', '--porcelain=v1') -TimeoutSeconds 60
    if ($statusRaw.ExitCode -eq 0) { $dirtyCount = @(Split-GitLines -Text $statusRaw.StdOut).Count }

    $last = Get-LastSuccess
    $task = Get-TaskState -TaskName ([string](Config-Get 'TaskName' 'AION-Sync'))

    Write-Host ''
    Write-Host 'AION sync status' -ForegroundColor Cyan
    Write-Host ('  repo              : {0}' -f $script:RepoRoot)
    Write-Host ('  git dir           : {0}' -f $script:GitDir)
    Write-Host ('  branch            : {0}' -f $branch)
    Write-Host ('  HEAD              : {0} ({1})' -f $head, $shortHead)
    Write-Host ('  tracking          : {0}' -f $tracked)
    Write-Host ('  ahead / behind    : {0} / {1}' -f $ahead, $behind)
    Write-Host ('  dirty entries     : {0}' -f $dirtyCount)
    Write-Host ('  paused            : {0}' -f (Test-Paused))
    Write-Host ('  last success      : {0}' -f $(if ($null -eq $last) { '(never)' } else { [string]$last['utc'] }))
    Write-Host ('  lock held         : {0}' -f (Test-LockHeld))
    Write-Host ('  scheduled task    : {0} [{1}]' -f (Config-Get 'TaskName' 'AION-Sync'), $task.State)
    Write-Host ('    last run        : {0}' -f $task.LastRun)
    Write-Host ('    next run        : {0}' -f $task.NextRun)
    if ($null -ne $task.Error) { Write-Host ('    task read error : {0}' -f $task.Error) }
    Write-Host ('  work dir          : {0}' -f $script:WorkRoot)
    Write-Host ('  audit log         : {0}' -f $script:AuditFile)
    Write-Host ''

    Write-Host '  last audit entries:'
    $tail = @(Format-AuditTail -Count 5)
    if ($tail.Count -eq 0) {
        Write-Host '    (none yet)'
    } else {
        foreach ($e in $tail) {
            $detail = if ($e.ContainsKey('detail')) { [string]$e['detail'] } else { '' }
            if ($detail.Length -gt 90) { $detail = $detail.Substring(0, 90) + '...' }
            Write-Host ('    {0}  {1,-16} {2,-20} {3}' -f $e['ts'], $e['step'], $e['status'], $detail)
        }
    }
    Write-Host ''
    return 0
}

function Get-DirectorySizeBytes {
    [CmdletBinding()]
    [OutputType([long])]
    param([Parameter(Mandatory)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) { return 0L }
    $sum = 0L
    foreach ($f in (Get-ChildItem -LiteralPath $Path -Recurse -File -Force -ErrorAction SilentlyContinue)) {
        $sum += [long]$f.Length
    }
    return $sum
}

function Show-Diagnose {
    [CmdletBinding()]
    param()

    Write-Host ''
    Write-Host 'AION sync diagnose' -ForegroundColor Cyan
    Write-Host ('  work dir          : {0}' -f $script:WorkRoot)
    Write-Host ('  repo              : {0}' -f $script:RepoRoot)

    Write-Host ''
    Write-Host '  versions' -ForegroundColor Cyan
    Write-Host ('    pwsh            : {0}' -f $PSVersionTable.PSVersion.ToString())
    $gitV = Invoke-External -FilePath 'git' -Arguments @('--version') -TimeoutSeconds 20 -WorkingDirectory $script:WorkRoot
    Write-Host ('    git             : {0} (exit {1})' -f `
            $(if ($null -eq $gitV.StdOut) { '(unavailable)' } else { $gitV.StdOut.Trim() }), $gitV.ExitCode)
    $ghFound = $false
    $ghV = Invoke-External -FilePath 'gh' -Arguments @('--version') -TimeoutSeconds 20 -WorkingDirectory $script:WorkRoot
    if ($ghV.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($ghV.StdOut)) {
        $ghFound = $true
        Write-Host ('    gh              : {0}' -f ((Split-GitLines -Text $ghV.StdOut)[0]))
    } else {
        Write-Host '    gh              : (not available on PATH)'
    }

    Write-Host ''
    Write-Host '  credentials' -ForegroundColor Cyan
    $helper = Get-GitOutput -Arguments @('config', '--get', 'credential.https://github.com.helper') -TimeoutSeconds 20
    Write-Host ('    helper          : {0}' -f $(if ([string]::IsNullOrWhiteSpace($helper)) { '(none configured)' } else { $helper }))
    # Only the helper chain is printed - never a resolved credential.
    Write-Host '    note            : credentials are resolved by git itself; never logged.'

    Write-Host ''
    Write-Host '  remote reachability' -ForegroundColor Cyan
    $remote = [string](Config-Get 'RemoteName' 'origin')
    $ls = Invoke-Git -Arguments @('ls-remote', '--heads', $remote) -TimeoutSeconds 60
    if ($ls.TimedOut) {
        Write-Host '    ls-remote       : TIMEOUT after 60s'
    } elseif ($ls.ExitCode -ne 0) {
        Write-Host ('    ls-remote       : FAILED exit {0} - {1}' -f $ls.ExitCode, (Redact-Sensitive $ls.StdErr))
    } else {
        $headCount = @(Split-GitLines -Text $ls.StdOut).Count
        # Deliberately only the count: remote URLs and ref names are not printed.
        Write-Host ('    remote          : {0}' -f $remote)
        Write-Host ('    heads reachable : {0}' -f $headCount)
        Write-Host ('    target branch   : {0}' -f (Config-Get 'Branch' 'main'))
    }

    Write-Host ''
    Write-Host '  scheduled task' -ForegroundColor Cyan
    $task = Get-TaskState -TaskName ([string](Config-Get 'TaskName' 'AION-Sync'))
    Write-Host ('    name            : {0}' -f (Config-Get 'TaskName' 'AION-Sync'))
    Write-Host ('    exists          : {0}' -f $task.Exists)
    Write-Host ('    state           : {0}' -f $task.State)
    Write-Host ('    last run        : {0}' -f $task.LastRun)
    Write-Host ('    next run        : {0}' -f $task.NextRun)
    if ($null -ne $task.Error) { Write-Host ('    read error      : {0}' -f $task.Error) }
    if (-not $task.Exists) {
        Write-Host '    action          : run Install-AionSyncTask.ps1 to register it'
    }

    Write-Host ''
    Write-Host '  lock / state' -ForegroundColor Cyan
    Write-Host ('    lock path       : {0}' -f (Get-LockPath))
    Write-Host ('    lock held       : {0}' -f (Test-LockHeld))
    $lockRec = Read-LockRecord
    if ($null -ne $lockRec) {
        Write-Host ('    last lock pid   : {0}' -f $(if ($lockRec.ContainsKey('pid')) { $lockRec['pid'] } else { '?' }))
        Write-Host ('    last lock utc   : {0}' -f $(if ($lockRec.ContainsKey('startedUtc')) { $lockRec['startedUtc'] } else { '?' }))
    }
    Write-Host ('    paused          : {0}' -f (Test-Paused))
    $last = Get-LastSuccess
    Write-Host ('    last success    : {0}' -f $(if ($null -eq $last) { '(never)' } else { [string]$last['utc'] }))
    $snapRefs = @(Split-GitLines -Text ([string](Get-GitOutput -Arguments @('for-each-ref', '--format=%(refname)', 'refs/aionsync/snapshots') -TimeoutSeconds 30)))
    Write-Host ('    snapshot refs   : {0}' -f $snapRefs.Count)

    Write-Host ''
    Write-Host '  capacity' -ForegroundColor Cyan
    $logBytes = Get-DirectorySizeBytes -Path $script:LogDir
    Write-Host ('    log dir         : {0} ({1:N0} bytes, {2} file(s))' -f $script:LogDir, $logBytes, `
            @(Get-ChildItem -LiteralPath $script:LogDir -File -ErrorAction SilentlyContinue).Count)
    $volume = [System.IO.Path]::GetPathRoot($script:RepoRoot)
    try {
        $drive = [System.IO.DriveInfo]::new($volume)
        Write-Host ('    disk free       : {0} of {1} ({2:N1} GiB free on {3})' -f `
                $drive.AvailableFreeSpace, $drive.TotalSize, ($drive.AvailableFreeSpace / 1GB), $drive.Name)
    } catch {
        Write-Host ('    disk free       : unavailable ({0})' -f $_.Exception.Message)
    }

    Write-Host ''
    Write-Host '  escalations' -ForegroundColor Cyan
    $esc = @(Get-ChildItem -LiteralPath $script:EscalationDir -File -ErrorAction SilentlyContinue)
    if ($esc.Count -eq 0) {
        Write-Host '    (none)'
    } else {
        Write-Host ('    total           : {0}' -f $esc.Count)
        foreach ($f in $esc) {
            $ageH = [math]::Round(((Get-Date) - $f.LastWriteTime).TotalHours, 1)
            $flag = if ($ageH -gt 24) { '  <-- STALE (>24h), review' } else { '' }
            Write-Host ('    {0}  age={1}h{2}' -f $f.Name, $ageH, $flag)
        }
    }
    Write-Host ''
    return 0
}

# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

function Invoke-Main {
    [CmdletBinding()]
    [OutputType([int])]
    param()

    try {
        $cfgPath = if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
            Join-Path $PSScriptRoot 'config.json'
        } else { $ConfigPath }

        $script:Config = Load-Config -Path $cfgPath

        $repoPath = if ([string]::IsNullOrWhiteSpace($Repo)) {
            [string](Config-Get 'RepoPath' '.')
        } else { $Repo }

        $workRoot = if ([string]::IsNullOrWhiteSpace($WorkDir)) {
            $PSScriptRoot
        } else { $WorkDir }

        Initialize-Workspace -RepositoryPath $repoPath -StateRoot $workRoot

        switch ($Command) {
            'status' { return (Show-Status) }

            'diagnose' { return (Show-Diagnose) }

            'pause' {
                $flag = Join-Path $script:StateDir 'paused'
                New-Item -ItemType File -Path $flag -Force | Out-Null
                Write-Log -Level OK -Message 'PAUSED state/paused created; run cycles will no-op with exit 30'
                Write-Audit -Step 'pause' -Status 'PAUSED' -Detail $flag
                Write-Host ("paused: {0}" -f $flag)
                return [int]$script:ExitCodes['OK']
            }

            'resume' {
                $flag = Join-Path $script:StateDir 'paused'
                if (Test-Path -LiteralPath $flag) { Remove-Item -LiteralPath $flag -Force }
                Write-Log -Level OK -Message 'RESUMED state/paused removed'
                Write-Audit -Step 'resume' -Status 'RESUMED' -Detail 'pause flag removed'
                Write-Host 'resumed'
                return [int]$script:ExitCodes['OK']
            }

            'uninstall' {
                $taskName = [string](Config-Get 'TaskName' 'AION-Sync')
                try {
                    $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
                    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
                    Write-Log -Level OK -Message ("UNINSTALL task {0} (was {1}) removed" -f $taskName, $existing.State)
                } catch {
                    Write-Log -Level WARN -Message ("scheduled task '{0}' not removed: {1}" -f $taskName, (Redact-Sensitive $_.Exception.Message))
                }
                Write-Host ''
                Write-Host 'Rollback / cleanup steps:' -ForegroundColor Cyan
                Write-Host ('  1. Confirm the task is gone : Get-ScheduledTask -TaskName "{0}" -ErrorAction SilentlyContinue' -f $taskName)
                Write-Host '  2. Resume the engine if it was paused : pwsh -File aion-sync.ps1 -Command resume'
                Write-Host ('  3. Preserved on purpose (not deleted): {0}, {1}, {2}' -f $script:LogDir, $script:EscalationDir, $script:StateDir)
                Write-Host ('  4. Recoverable rollback points remain as git refs: git -C "{0}" for-each-ref refs/aionsync' -f $script:RepoRoot)
                Write-Host '  5. To delete history too, remove logs/, escalations/, state/ manually and run:'
                Write-Host ('       git -C "{0}" for-each-ref --format="%(refname)" refs/aionsync | ForEach-Object {{ git -C "{0}" update-ref -d $_ }}' -f $script:RepoRoot, $script:RepoRoot)
                Write-Audit -Step 'uninstall' -Status 'UNINSTALLED' -Detail ("task={0}; logs and snapshots preserved" -f $taskName)
                return [int]$script:ExitCodes['OK']
            }

            { $_ -in @('run', 'sync-now') } {
                $script:Quiet = ($Command -eq 'run')

                # Paused is checked before the lock: a paused engine must not make
                # a human wait for a lock just to be told it is off.
                if (Test-Paused) {
                    Write-Log -Level SKIP -Message 'PAUSED state/paused present; no-op'
                    Write-Audit -Step 'Write-Start' -Status 'PAUSED' -Detail 'state/paused present; cycle skipped'
                    return [int]$script:ExitCodes['PAUSED']
                }

                $lock = Enter-SyncLock
                if (-not $lock.Acquired) { return [int]$lock.Code }

                try {
                    $code = Invoke-SyncCycle
                } finally {
                    Exit-SyncLock
                }
                if ($Command -eq 'sync-now') {
                    Write-Host ''
                    Write-Host ('sync-now finished with exit code {0} ({1})' -f $code, (Get-ExitCodeName -Code $code))
                    Write-Host ('  log   : {0}' -f $script:TextLog)
                    Write-Host ('  audit : {0}' -f $script:AuditFile)
                    Write-Host ''
                }
                return [int]$code
            }
        }

        Write-Host "unknown command: $Command"
        return [int]$script:ExitCodes['ERROR']
    }
    catch [System.TimeoutException] {
        Write-Host ("TIMEOUT: {0}" -f (Redact-Sensitive $_.Exception.Message)) -ForegroundColor Red
        return [int]$script:ExitCodes['TIMEOUT']
    }
    catch {
        Write-Host ("ERROR: {0}" -f (Redact-Sensitive $_.Exception.Message)) -ForegroundColor Red
        return [int]$script:ExitCodes['ERROR']
    }
}

# Dot-sourcing must define the functions without executing a cycle: the test
# suite calls Redact-Sensitive directly through a dot-source.
if ($MyInvocation.InvocationName -ne '.') {
    exit (Invoke-Main)
}