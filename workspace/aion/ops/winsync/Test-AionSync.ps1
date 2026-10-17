#Requires -Version 7.0
<#
.SYNOPSIS
    Verification suite for the AION Windows auto-sync system.

.DESCRIPTION
    13 test cases, each independent, each with its own disposable fixture under
    $env:TEMP\aionsync-tests\<guid>\ (bare remote + two clones). Every fixture is
    removed in a finally block.

    The real repository C:\0-BlackBoxProject-0\AION is only ever READ (T01, T02);
    nothing destructive is ever run against it. No network is required: every
    behavioural fixture uses a local bare repository as its remote.

    Exit code 0 when all tests pass, 1 otherwise.

.EXAMPLE
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\Test-AionSync.ps1

.EXAMPLE
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\Test-AionSync.ps1 -Only T07,T08
#>
[CmdletBinding()]
param(
    # Comma-separated test ids to run, e.g. -Only T03,T07. Default: all.
    [string[]]$Only
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# -File passes -Only T03,T05 as a single string, so normalise before filtering.
$script:OnlyIds = @()
if ($null -ne $Only) {
    $script:OnlyIds = @($Only | ForEach-Object { [string]$_ -split ',' } |
        ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })
}

# ---------------------------------------------------------------------------
# Harness setup
# ---------------------------------------------------------------------------

$script:EnginePath = Join-Path $PSScriptRoot 'aion-sync.ps1'
$script:ProdConfigPath = Join-Path $PSScriptRoot 'config.json'

if (-not (Test-Path -LiteralPath $script:EnginePath)) {
    Write-Host "ERROR: engine not found: $script:EnginePath" -ForegroundColor Red
    exit 40
}
if (-not (Test-Path -LiteralPath $script:ProdConfigPath)) {
    Write-Host "ERROR: config not found: $script:ProdConfigPath" -ForegroundColor Red
    exit 40
}

# Dot-source for Redact-Sensitive / Invoke-External reuse. The engine guards its
# main dispatch with a dot-source check, so no cycle runs as a side effect.
. $script:EnginePath
$ErrorActionPreference = 'Stop'

$script:ProdConfig = Get-Content -LiteralPath $script:ProdConfigPath -Raw | ConvertFrom-Json -AsHashtable
$script:RealRepo = [string]$script:ProdConfig['RepoPath']
$script:PwshExe = (Get-Command pwsh -ErrorAction Stop).Source
$script:TestRoot = Join-Path $env:TEMP ('aionsync-tests\{0}' -f ([guid]::NewGuid().ToString('N').Substring(0, 12)))
$script:Results = [System.Collections.Generic.List[object]]::new()

New-Item -ItemType Directory -Force -Path $script:TestRoot | Out-Null

# ---------------------------------------------------------------------------
# Assertions / helpers
# ---------------------------------------------------------------------------

function Assert-True {
    param(
        [Parameter(Mandatory)][AllowNull()]$Condition,
        [Parameter(Mandatory)][string]$Message
    )
    if (-not $Condition) { throw "assertion failed: $Message" }
}

function Assert-Equal {
    param(
        [Parameter(Mandatory)][AllowNull()]$Expected,
        [Parameter(Mandatory)][AllowNull()]$Actual,
        [Parameter(Mandatory)][string]$Message
    )
    $e = if ($null -eq $Expected) { '<null>' } else { [string]$Expected }
    $a = if ($null -eq $Actual) { '<null>' } else { [string]$Actual }
    if ($e -ne $a) { throw "assertion failed: $Message (expected '$e', got '$a')" }
}

function Invoke-FixtureGit {
    <#
    .SYNOPSIS
        Runs git in a fixture repository and returns the raw result object.
    #>
    param(
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][string[]]$Arguments,
        [int]$TimeoutSeconds = 120
    )
    return Invoke-External -FilePath 'git' -Arguments $Arguments -TimeoutSeconds $TimeoutSeconds -WorkingDirectory $Repo
}

function Get-FixtureGitText {
    param(
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    $r = Invoke-FixtureGit -Repo $Repo -Arguments $Arguments
    if ($r.ExitCode -ne 0) { return $null }
    if ($null -eq $r.StdOut) { return '' }
    return $r.StdOut.Trim()
}

function Invoke-NetworkGitWithRetry {
    <#
    .SYNOPSIS
        Runs a git command that talks to a real remote, retrying transport faults.
    .DESCRIPTION
        The only tests that touch the network are the read-only checks against
        the real AION remote. Observed on this box: DNS intermittently fails to
        resolve github.com, which surfaces as a non-zero exit and would otherwise
        be reported as a clone-integrity failure when nothing is actually wrong.

        Only transport-shaped errors are retried. An authentication failure or a
        genuine disagreement about a sha is never retried and still fails the
        test, so this changes flakiness without changing the assertion.
    #>
    param(
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][string[]]$Arguments,
        [int]$TimeoutSeconds = 90,
        [int]$Attempts = 3,
        [int]$DelaySeconds = 3
    )

    $transportFault = '(?i)could not resolve host|failed to connect|temporary failure in name resolution|connection (timed out|reset|refused)|operation timed out|early eof|unable to access'
    $last = $null
    for ($i = 1; $i -le $Attempts; $i++) {
        $last = Invoke-FixtureGit -Repo $Repo -Arguments $Arguments -TimeoutSeconds $TimeoutSeconds
        if ($last.ExitCode -eq 0) { return $last }
        $err = [string]$last.StdErr
        if ($err -notmatch $transportFault) { return $last }
        if ($i -lt $Attempts) {
            Write-Verbose ("transport fault on attempt {0}/{1} ({2}); retrying" -f $i, $Attempts, (Redact-Sensitive $err))
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    return $last
}

function Invoke-Engine {
    <#
    .SYNOPSIS
        Runs the engine in a child pwsh and returns @{ ExitCode; Output }.
    .DESCRIPTION
        Bounded with the same Start-Process plus Wait-Process timeout the engine
        uses, so a hung engine fails the test instead of hanging the suite.
    #>
    param(
        [Parameter(Mandatory)][string]$Command,
        [string]$Repo,
        [string]$WorkDir,
        [string]$ConfigPath,
        [int]$TimeoutSeconds = 300
    )

    $argv = @(
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', $script:EnginePath, '-Command', $Command
    )
    if ($Repo) { $argv += @('-Repo', $Repo) }
    if ($WorkDir) { $argv += @('-WorkDir', $WorkDir) }
    if ($ConfigPath) { $argv += @('-ConfigPath', $ConfigPath) }

    $ioDir = Join-Path $script:TestRoot 'io'
    if (-not (Test-Path -LiteralPath $ioDir)) { New-Item -ItemType Directory -Force -Path $ioDir | Out-Null }
    $token = [guid]::NewGuid().ToString('N')
    $outFile = Join-Path $ioDir ("engine-{0}.out" -f $token)
    $errFile = Join-Path $ioDir ("engine-{0}.err" -f $token)

    $line = (@($argv | ForEach-Object { ConvertTo-NativeArgument $_ }) -join ' ')
    $proc = Start-Process -FilePath $script:PwshExe -ArgumentList $line -NoNewWindow -PassThru `
        -WorkingDirectory $script:TestRoot -RedirectStandardOutput $outFile -RedirectStandardError $errFile

    try {
        $timedOut = $false
        $exited = $false
        try {
            Wait-Process -Id $proc.Id -Timeout $TimeoutSeconds -ErrorAction Stop
            $exited = $true
        } catch [System.TimeoutException] {
            $exited = $false
        } catch {
            $exited = $proc.HasExited
        }
        if (-not $exited) {
            $timedOut = $true
            try { $proc.Kill($true) } catch { try { $proc.Kill() } catch { } }
            try { Wait-Process -Id $proc.Id -Timeout 15 -ErrorAction SilentlyContinue } catch { }
        }
        $proc.Refresh()
        $code = -1
        if ($proc.HasExited) {
            $proc.WaitForExit()
            $code = $proc.ExitCode
        }
        $out = (Get-Content -LiteralPath $outFile -Raw -ErrorAction SilentlyContinue)
        $err = (Get-Content -LiteralPath $errFile -Raw -ErrorAction SilentlyContinue)
        return [pscustomobject]@{
            ExitCode = $code
            Output   = ((Redact-Sensitive ("$out`n$err")) -replace "`r", '')
            TimedOut = $timedOut
        }
    } finally {
        Remove-Item -LiteralPath $outFile -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $errFile -Force -ErrorAction SilentlyContinue
    }
}

function New-Fixture {
    <#
    .SYNOPSIS
        Creates a disposable bare remote + two clones and returns their paths.
    .DESCRIPTION
        autocrlf is disabled so content assertions are byte-exact, and a local
        identity is set so commit-creating plumbing (git stash create) never
        depends on the machine's global git identity.
    #>
    param([Parameter(Mandatory)][string]$Label)

    $root = Join-Path $script:TestRoot ('{0}-{1}' -f $Label, ([guid]::NewGuid().ToString('N').Substring(0, 8)))
    New-Item -ItemType Directory -Force -Path $root | Out-Null

    $remote = Join-Path $root 'remote.git'
    $clone1 = Join-Path $root 'clone1'
    $clone2 = Join-Path $root 'clone2'
    $work = Join-Path $root 'winsync'
    $config = Join-Path $root 'config.json'

    $init = Invoke-External -FilePath 'git' -Arguments @('init', '--bare', '--initial-branch=main', $remote) `
        -TimeoutSeconds 60 -WorkingDirectory $root
    Assert-True ($init.ExitCode -eq 0) ("git init --bare failed: " + (Redact-Sensitive $init.StdErr))

    $c1 = Invoke-External -FilePath 'git' -Arguments @('clone', $remote, $clone1) -TimeoutSeconds 120 -WorkingDirectory $root
    Assert-True ($c1.ExitCode -eq 0) ("git clone clone1 failed: " + (Redact-Sensitive $c1.StdErr))

    foreach ($repo in @($clone1)) {
        foreach ($pair in @(@('user.email', 'aionsync-test@example.invalid'), @('user.name', 'aionsync-test'),
                @('core.autocrlf', 'false'), @('commit.gpgsign', 'false'), @('core.hooksPath', 'NUL'))) {
            $null = Invoke-FixtureGit -Repo $repo -Arguments @('config', $pair[0], $pair[1])
        }
    }

    $seed = Join-Path $clone1 'readme.md'
    [System.IO.File]::WriteAllText($seed, "seed`n")
    foreach ($args in @(@('add', '--all'), @('commit', '-m', 'seed'), @('push', '-u', 'origin', 'main'))) {
        $r = Invoke-FixtureGit -Repo $clone1 -Arguments $args
        Assert-True ($r.ExitCode -eq 0) ("fixture seed step $($args[0]) failed: " + (Redact-Sensitive $r.StdErr))
    }

    $c2 = Invoke-External -FilePath 'git' -Arguments @('clone', $remote, $clone2) -TimeoutSeconds 120 -WorkingDirectory $root
    Assert-True ($c2.ExitCode -eq 0) ("git clone clone2 failed: " + (Redact-Sensitive $c2.StdErr))
    foreach ($pair in @(@('user.email', 'aionsync-test@example.invalid'), @('user.name', 'aionsync-test'),
            @('core.autocrlf', 'false'), @('commit.gpgsign', 'false'), @('core.hooksPath', 'NUL'))) {
        $null = Invoke-FixtureGit -Repo $clone2 -Arguments @('config', $pair[0], $pair[1])
    }

    foreach ($d in @((Join-Path $work 'lock'), (Join-Path $work 'logs'), (Join-Path $work 'state'),
            (Join-Path $work 'escalations'), (Join-Path $work 'tmp'))) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
    }

    # The fixture config mirrors production policy but points at the fixture.
    $cfg = [ordered]@{
        RepoPath = $clone1
        Branch = 'main'
        RemoteName = 'origin'
        IntervalMinutes = 5
        LockStaleMinutes = 15
        MaxRunSeconds = 240
        MaxLogFiles = 14
        TaskName = 'AION-Sync'
        DenyPathPatterns = $script:ProdConfig['DenyPathPatterns']
    }
    [System.IO.File]::WriteAllText($config, ($cfg | ConvertTo-Json -Depth 6))

    return [pscustomobject]@{
        Root   = $root
        Remote = $remote
        Clone1 = $clone1
        Clone2 = $clone2
        Work   = $work
        Config = $config
    }
}

function Remove-Fixture {
    param([Parameter(Mandatory)]$Fixture)
    try {
        if ($null -ne $Fixture -and (Test-Path -LiteralPath $Fixture.Root)) {
            Remove-Item -LiteralPath $Fixture.Root -Recurse -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Cleanup problems must not fail an otherwise passing test.
    }
}

function Get-EngineAuditText {
    param([Parameter(Mandatory)][string]$WorkDir)
    $f = Join-Path $WorkDir 'logs\audit.ndjson'
    if (-not (Test-Path -LiteralPath $f)) { return '' }
    return [System.IO.File]::ReadAllText($f)
}

function Get-EngineLogText {
    param([Parameter(Mandatory)][string]$WorkDir)
    $f = Join-Path $WorkDir 'logs\sync.log'
    if (-not (Test-Path -LiteralPath $f)) { return '' }
    return [System.IO.File]::ReadAllText($f)
}

function Get-DeadPid {
    <#
    .SYNOPSIS
        A PID that is guaranteed not to be running.
    #>
    $p = Start-Process -FilePath $env:ComSpec -ArgumentList '/c exit 0' -NoNewWindow -PassThru -Wait
    $pidValue = $p.Id
    try { $p.Dispose() } catch { }
    Start-Sleep -Milliseconds 200
    return $pidValue
}

function Write-LockJson {
    param(
        [Parameter(Mandatory)][string]$WorkDir,
        [Parameter(Mandatory)][int]$LockPid,
        [Parameter(Mandatory)][string]$StartedUtc
    )
    $dir = Join-Path $WorkDir 'lock'
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $path = Join-Path $dir 'sync.lock'
    $payload = [ordered]@{
        pid = $LockPid
        startedUtc = $StartedUtc
        host = 'fixture'
        repo = (Split-Path -Leaf $WorkDir)
    } | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($path, $payload)
    return $path
}

function Test-RepoHealthy {
    <#
    .SYNOPSIS
        Asserts git fsck reports no error-level output for a repository.
    #>
    param(
        [Parameter(Mandatory)][string]$Repo,
        [Parameter(Mandatory)][string]$Label
    )
    $r = Invoke-FixtureGit -Repo $Repo -Arguments @('fsck', '--no-progress') -TimeoutSeconds 300
    $text = (Redact-Sensitive ("$($r.StdOut)`n$($r.StdErr)"))
    $bad = @(Split-GitLines -Text $text | Where-Object { $_ -match '(?i)\b(error|fatal|corrupt|missing)\b' })
    Assert-True ($bad.Count -eq 0) ("$Label : git fsck reported problems: " + ($bad -join ' | '))
}

function Get-CountedHeads {
    param([Parameter(Mandatory)][string]$Repo)
    $r = Invoke-NetworkGitWithRetry -Repo $Repo -Arguments @('ls-remote', '--heads', 'origin') -TimeoutSeconds 60
    if ($r.ExitCode -ne 0) { return -1 }
    return @(Split-GitLines -Text $r.StdOut).Count
}

function Update-FixtureClone {
    <#
    .SYNOPSIS
        Brings a fixture clone up to date with its remote before editing.
    .DESCRIPTION
        A clone that is behind origin/main cannot push, so the upstream side of a
        test must fast-forward itself first. This is fixture plumbing, not engine
        behaviour: the engine never runs rebase or reset.
    #>
    param([Parameter(Mandatory)][string]$Repo)

    foreach ($args in @(@('fetch', 'origin'), @('merge', '--ff-only', 'origin/main'))) {
        $r = Invoke-FixtureGit -Repo $Repo -Arguments $args
        $why = "clone update step '{0}' failed: {1}" -f $args[0], (Redact-Sensitive $r.StdErr)
        Assert-True ($r.ExitCode -eq 0) $why
    }
}

# ---------------------------------------------------------------------------
# T01 clone-integrity (read-only against the real repository)
# ---------------------------------------------------------------------------
function Test-T01 {
    $repo = $script:RealRepo
    Assert-True (Test-Path -LiteralPath $repo) "real repository not found at $repo"

    $r = Invoke-FixtureGit -Repo $repo -Arguments @('remote', 'get-url', 'origin')
    Assert-True ($r.ExitCode -eq 0) 'git remote get-url origin failed'
    $url = $r.StdOut.Trim()
    # Never print the URL itself; only assert its shape.
    Assert-True ($url -match '^https://github\.com/[^/]+/[^/]+\.git$') ("unexpected remote URL shape: " + (Redact-Sensitive $url))

    $branch = Get-FixtureGitText -Repo $repo -Arguments @('rev-parse', '--abbrev-ref', 'HEAD')
    Assert-Equal 'main' $branch 'branch is not main'

    $head = Get-FixtureGitText -Repo $repo -Arguments @('rev-parse', 'HEAD')
    Assert-True ($head -match '^[0-9a-f]{40}$') 'local HEAD is not a full sha'

    $ls = Invoke-NetworkGitWithRetry -Repo $repo -Arguments @('ls-remote', 'origin', 'refs/heads/main')
    Assert-True ($ls.ExitCode -eq 0) ("git ls-remote origin refs/heads/main failed: " + (Redact-Sensitive $ls.StdErr))
    $remoteSha = @(Split-GitLines -Text $ls.StdOut)[0].Split("`t")[0]
    Assert-Equal $remoteSha $head 'local HEAD does not match origin/main'

    Test-RepoHealthy -Repo $repo -Label 'real repository'

    return "branch=main head=$($head.Substring(0,7)) matches origin/main, fsck clean"
}

# ---------------------------------------------------------------------------
# T02 auth-remote-access (read-only against the real repository)
# ---------------------------------------------------------------------------
function Test-T02 {
    $repo = $script:RealRepo
    $r = Invoke-NetworkGitWithRetry -Repo $repo -Arguments @('ls-remote', '--heads', 'origin') -TimeoutSeconds 90
    Assert-True ($r.ExitCode -eq 0) ("git ls-remote --heads origin failed (credential or network): " + (Redact-Sensitive $r.StdErr))
    $count = @(Split-GitLines -Text $r.StdOut).Count
    Assert-True ($count -ge 1) "no heads returned (count=$count)"

    # The helper chain is asserted, never a resolved credential.
    $helper = Get-FixtureGitText -Repo $repo -Arguments @('config', '--get', 'credential.https://github.com.helper')
    Assert-True (-not [string]::IsNullOrWhiteSpace($helper)) 'no github credential helper configured'
    Assert-True ($helper -notmatch 'gh[pousr]_[A-Za-z0-9]+') 'credential helper contains a token literal'

    return "authenticated read of origin succeeded, $count head(s) reachable, no URL printed"
}

# ---------------------------------------------------------------------------
# T03 local-to-remote
# ---------------------------------------------------------------------------
function Test-T03 {
    $fx = $null
    try {
        $fx = New-Fixture 'T03'
        $before = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')

        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'local-only.txt'), "written by the test`n")
        $null = Invoke-FixtureGit -Repo $fx.Clone1 -Arguments @('add', '--all')

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 0 $r.ExitCode ("engine run did not succeed (exit $($r.ExitCode)): " + $r.Output)

        $after = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-True ($after -ne $before) 'local HEAD did not move'

        $remoteHead = Get-FixtureGitText -Repo $fx.Remote -Arguments @('rev-parse', 'refs/heads/main')
        Assert-Equal $after $remoteHead 'bare remote main does not point at the new commit'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'PUSHED') 'audit log contains no PUSHED record'

        return "local commit $($after.Substring(0,7)) reached the bare remote"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T04 remote-to-local (fast-forward)
# ---------------------------------------------------------------------------
function Test-T04 {
    $fx = $null
    try {
        $fx = New-Fixture 'T04'
        $before = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')

        [System.IO.File]::WriteAllText((Join-Path $fx.Clone2 'remote-only.txt'), "written by clone2`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'remote change'), @('push', 'origin', 'HEAD:main'))) {
            $rr = Invoke-FixtureGit -Repo $fx.Clone2 -Arguments $args
            Assert-True ($rr.ExitCode -eq 0) ("clone2 step $($args[0]) failed: " + (Redact-Sensitive $rr.StdErr))
        }
        $remoteHead = Get-FixtureGitText -Repo $fx.Remote -Arguments @('rev-parse', 'refs/heads/main')

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 0 $r.ExitCode ("engine run did not succeed (exit $($r.ExitCode)): " + $r.Output)

        $after = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-Equal $remoteHead $after 'clone1 did not fast-forward to origin/main'
        Assert-True ($after -ne $before) 'clone1 HEAD did not move'
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Clone1 'remote-only.txt')) 'upstream file missing after fast-forward'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'FAST_FORWARD') 'audit log contains no FAST_FORWARD record'

        return "fast-forwarded $($before.Substring(0,7)) -> $($after.Substring(0,7))"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T05 concurrent-prevention
# ---------------------------------------------------------------------------
function Test-T05 {
    $fx = $null
    $held = $null
    try {
        $fx = New-Fixture 'T05'
        $before = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'should-not-be-committed.txt'), "x`n")

        $lockPath = Join-Path $fx.Work 'lock\sync.lock'
        # FileShare::None: the engine's own exclusive open must genuinely fail.
        $held = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate,
            [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 10 $r.ExitCode "expected exit 10 (SKIP_CONCURRENT), got $($r.ExitCode): $($r.Output)"

        $after = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-Equal $before $after 'HEAD moved despite the held lock'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.git\index.lock'))) 'index.lock leaked'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'SKIP_CONCURRENT') 'audit log contains no SKIP_CONCURRENT record'
        $committed = @(Split-GitLines -Text ([string](Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('show', '--pretty=format:', '--name-only', 'HEAD'))))
        Assert-True (-not ($committed -contains 'should-not-be-committed.txt')) 'work was committed while another process held the lock'

        return 'held lock produced exit 10 and left the repository untouched'
    } finally {
        if ($null -ne $held) { try { $held.Dispose() } catch { } }
        Remove-Fixture $fx
    }
}

# ---------------------------------------------------------------------------
# T06 stale-lock-recovery
# ---------------------------------------------------------------------------
function Test-T06 {
    $fx = $null
    try {
        $fx = New-Fixture 'T06'
        $deadPid = Get-DeadPid
        $oldUtc = (Get-Date).ToUniversalTime().AddHours(-6).ToString('yyyy-MM-ddTHH:mm:ssZ')
        $null = Write-LockJson -WorkDir $fx.Work -LockPid $deadPid -StartedUtc $oldUtc

        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'after-stale.txt'), "y`n")

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 0 $r.ExitCode ("expected exit 0 after stale-lock recovery, got $($r.ExitCode): " + $r.Output)

        $combined = (Get-EngineLogText -WorkDir $fx.Work) + "`n" + (Get-EngineAuditText -WorkDir $fx.Work)
        Assert-True ($combined -match 'LOCK_STALE_RECOVERED') 'no LOCK_STALE_RECOVERED record found'
        Assert-True ($combined -match ([regex]::Escape([string]$deadPid))) ("LOCK_STALE_RECOVERED does not name the prior PID $deadPid")

        return "dead pid $deadPid + 6h-old lock reclaimed, cycle completed with exit 0"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T07 uncommitted-preservation
# ---------------------------------------------------------------------------
function Test-T07 {
    $fx = $null
    try {
        $fx = New-Fixture 'T07'
        $conflictFile = Join-Path $fx.Clone1 'shared.txt'
        [System.IO.File]::WriteAllText($conflictFile, "base`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'add shared'), @('push', 'origin', 'HEAD:main'))) {
            $rr = Invoke-FixtureGit -Repo $fx.Clone1 -Arguments $args
            Assert-True ($rr.ExitCode -eq 0) ("clone1 seed step $($args[0]) failed")
        }

        # Local uncommitted work.
        $dirtyText = "LOCAL DIRTY LINE`nsecond local line`n"
        [System.IO.File]::WriteAllText($conflictFile, $dirtyText)
        $dirtyBytes = [System.IO.File]::ReadAllBytes($conflictFile)

        # Upstream change to the same file.
        Update-FixtureClone -Repo $fx.Clone2
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone2 'shared.txt'), "REMOTE CHANGE`nsecond remote line`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'remote change'), @('push', 'origin', 'HEAD:main'))) {
            $rr = Invoke-FixtureGit -Repo $fx.Clone2 -Arguments $args
            Assert-True ($rr.ExitCode -eq 0) ("clone2 step $($args[0]) failed")
        }

        $headBefore = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'

        # The dirty content must be on disk byte-for-byte, whatever happened upstream.
        $afterBytes = [System.IO.File]::ReadAllBytes($conflictFile)
        Assert-Equal $dirtyBytes.Length $afterBytes.Length 'dirty file length changed'
        Assert-True ([System.Linq.Enumerable]::SequenceEqual([byte[]]$dirtyBytes, [byte[]]$afterBytes)) `
            'dirty working-tree content changed byte-for-byte'
        Assert-Equal $dirtyText ([System.IO.File]::ReadAllText($conflictFile)) 'dirty working-tree text changed'

        $snaps = @(Split-GitLines -Text ([string](Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('for-each-ref', '--format=%(refname)', 'refs/aionsync/snapshots'))))
        Assert-True ($snaps.Count -ge 1) 'no recoverable snapshot ref was created'

        Assert-True ($r.ExitCode -in @(12, 21)) ("expected exit 12 (skip integrate) or 21 (push rejected), got $($r.ExitCode): " + $r.Output)

        Test-RepoHealthy -Repo $fx.Clone1 -Label 'clone1 after dirty-preservation run'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'SKIP_DIRTY_INTEGRATE') 'audit log contains no SKIP_DIRTY_INTEGRATE record'

        $headAfter = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-True ($headAfter -ne $headBefore) 'HEAD did not move at all (local work should have been committed)'

        return "dirty bytes preserved, snapshot $($snaps[0].Split('/')[-1]) recorded, exit $($r.ExitCode)"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T08 divergent-conflict-preservation
# ---------------------------------------------------------------------------
function Test-T08 {
    $fx = $null
    try {
        $fx = New-Fixture 'T08'
        $line = Join-Path $fx.Clone1 'line.txt'
        [System.IO.File]::WriteAllText($line, "original`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'add line'), @('push', 'origin', 'HEAD:main'))) {
            $null = Invoke-FixtureGit -Repo $fx.Clone1 -Arguments $args
        }

        # Local commit on clone1.
        [System.IO.File]::WriteAllText($line, "LOCAL VERSION`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'local version'))) {
            $rr = Invoke-FixtureGit -Repo $fx.Clone1 -Arguments $args
            Assert-True ($rr.ExitCode -eq 0) ("local commit step $($args[0]) failed")
        }
        $localSha = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')

        # Remote commit editing the same line.
        Update-FixtureClone -Repo $fx.Clone2
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone2 'line.txt'), "REMOTE VERSION`n")
        foreach ($args in @(@('add', '--all'), @('commit', '-m', 'remote version'), @('push', 'origin', 'HEAD:main'))) {
            $rr = Invoke-FixtureGit -Repo $fx.Clone2 -Arguments $args
            Assert-True ($rr.ExitCode -eq 0) ("remote commit step $($args[0]) failed")
        }
        $remoteSha = Get-FixtureGitText -Repo $fx.Remote -Arguments @('rev-parse', 'refs/heads/main')

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 20 $r.ExitCode ("expected exit 20 (ESCALATED_CONFLICT), got $($r.ExitCode): " + $r.Output)

        # Neither side was chosen.
        Assert-Equal "LOCAL VERSION`n" ([System.IO.File]::ReadAllText($line)) 'working tree does not hold the local version'
        Assert-Equal $localSha (Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')) 'HEAD moved; the merge was not aborted'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.git\MERGE_HEAD'))) 'MERGE_HEAD left behind; merge was not aborted'

        # No force push: the remote still holds the remote commit.
        $remoteAfter = Get-FixtureGitText -Repo $fx.Remote -Arguments @('rev-parse', 'refs/heads/main')
        Assert-Equal $remoteSha $remoteAfter 'remote ref moved - a force push must never happen'

        $esc = @(Get-ChildItem -LiteralPath (Join-Path $fx.Work 'escalations') -File -ErrorAction SilentlyContinue)
        Assert-True ($esc.Count -ge 1) 'no escalation file was written under escalations/'
        $escText = [System.IO.File]::ReadAllText($esc[0].FullName)
        Assert-True ($escText -match 'line\.txt') 'escalation file does not name the conflicted path'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'ESCALATED_CONFLICT') 'audit log contains no ESCALATED_CONFLICT record'

        Test-RepoHealthy -Repo $fx.Clone1 -Label 'clone1 after aborted conflict'

        return "conflict escalated, merge aborted, local+remote versions both intact (local $($localSha.Substring(0,7)), remote $($remoteSha.Substring(0,7)))"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T09 interrupted-run-recovery
# ---------------------------------------------------------------------------
function Test-T09 {
    $fx = $null
    try {
        $fx = New-Fixture 'T09'
        $headBefore = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        $treeBefore = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD^{tree}')
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'interrupted.txt'), "untouched`n")

        # State left behind by a run that died mid-merge, plus its stale lock.
        $null = Write-LockJson -WorkDir $fx.Work -LockPid (Get-DeadPid) `
            -StartedUtc (Get-Date).ToUniversalTime().AddHours(-9).ToString('yyyy-MM-ddTHH:mm:ssZ')
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 '.git\MERGE_HEAD'), "$headBefore`n")

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 11 $r.ExitCode ("expected exit 11 (SKIP_BUSY), got $($r.ExitCode): " + $r.Output)

        $combined = (Get-EngineAuditText -WorkDir $fx.Work) + "`n" + (Get-EngineLogText -WorkDir $fx.Work)
        Assert-True ($combined -match 'SKIP_BUSY') 'no SKIP_BUSY record found'
        Assert-True ($combined -match 'MERGE_HEAD') 'the busy detection did not name MERGE_HEAD'
        Assert-True ($combined -match 'LOCK_STALE_RECOVERED') 'the stale lock was not reported as recovered'

        # Nothing was corrupted.
        Assert-Equal $headBefore (Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')) 'HEAD changed'
        Assert-Equal $treeBefore (Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD^{tree}')) 'the committed tree changed'
        Assert-Equal "untouched`n" ([System.IO.File]::ReadAllText((Join-Path $fx.Clone1 'interrupted.txt'))) 'working tree content changed'
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.git\MERGE_HEAD')) 'the pre-existing MERGE_HEAD was destroyed by the engine'
        Test-RepoHealthy -Repo $fx.Clone1 -Label 'clone1 after interrupted-run detection'

        return 'stale lock + dangling MERGE_HEAD detected and skipped, repository bit-for-bit intact'
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T10 pause-resume
# ---------------------------------------------------------------------------
function Test-T10 {
    $fx = $null
    try {
        $fx = New-Fixture 'T10'
        $headBefore = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')

        $p = Invoke-Engine -Command 'pause' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-Equal 0 $p.ExitCode "pause failed (exit $($p.ExitCode)): $($p.Output)"
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Work 'state\paused')) 'state/paused was not created'

        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'while-paused.txt'), "z`n")
        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 30 $r.ExitCode "expected exit 30 (PAUSED), got $($r.ExitCode): $($r.Output)"
        Assert-Equal $headBefore (Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')) 'a paused run created a commit'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'PAUSED') 'audit log contains no PAUSED record'

        $u = Invoke-Engine -Command 'resume' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-Equal 0 $u.ExitCode "resume failed (exit $($u.ExitCode)): $($u.Output)"
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fx.Work 'state\paused'))) 'state/paused was not removed'

        $r2 = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r2.TimedOut) 'engine run timed out'
        Assert-Equal 0 $r2.ExitCode "expected exit 0 after resume, got $($r2.ExitCode): $($r2.Output)"
        $headAfter = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-True ($headAfter -ne $headBefore) 'the post-resume run did not commit the pending file'
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Work 'state\last-success.json')) 'last-success.json was not written'

        return 'pause -> 30 with no commit, resume -> 0 with the pending file committed'
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T11 log-redaction
# ---------------------------------------------------------------------------
function Test-T11 {
    $token = 'ghp_0123456789abcdef0123456789abcdef0123'
    $urlCred = 'https://user:tok@github.com/x'
    $query = 'https://example.invalid/cb?token=abc123&state=1'

    $out1 = Redact-Sensitive "remote: $token"
    Assert-True ($out1 -notmatch 'gh[pousr]_[A-Za-z0-9]+') 'a GitHub token survived Redact-Sensitive'
    Assert-True ($out1 -match '\*\*\*REDACTED\*\*\*') 'no redaction marker was substituted'

    $out2 = Redact-Sensitive "fetching $urlCred"
    Assert-True ($out2 -notmatch 'user:tok@') 'URL userinfo survived Redact-Sensitive'
    Assert-True ($out2 -match 'REDACTED') 'no redaction marker was substituted for URL userinfo'

    $out3 = Redact-Sensitive "callback $query"
    Assert-True ($out3 -notmatch 'abc123') 'a token= query parameter value survived Redact-Sensitive'
    Assert-True ($out3 -match 'token=\*\*\*REDACTED\*\*\*') 'token= was not redacted in place'

    $out4 = Redact-Sensitive "git config user.password=hunter2 done"
    Assert-True ($out4 -notmatch 'hunter2') 'a password= parameter value survived Redact-Sensitive'

    $fx = $null
    try {
        $fx = New-Fixture 'T11'

        # Real path: make git itself emit a credential-shaped string. A remote URL
        # whose PATH contains a token makes `git fetch` echo that token in its
        # fatal error, so the engine's redaction has to scrub it before the text
        # reaches a log file. (A credential in the userinfo part is not usable
        # here: git strips it from its own error message before printing.)
        $credPath = Join-Path $fx.Root ('{0}/missing.git' -f $token)
        $setUrl = Invoke-FixtureGit -Repo $fx.Clone1 -Arguments @('remote', 'set-url', 'origin', $credPath)
        Assert-True ($setUrl.ExitCode -eq 0) 'could not set the credential-bearing remote URL'

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config -TimeoutSeconds 180
        Assert-Equal 40 $r.ExitCode "expected exit 40 for an unreachable remote, got $($r.ExitCode)"

        $produced = (Get-EngineLogText -WorkDir $fx.Work) + "`n" + (Get-EngineAuditText -WorkDir $fx.Work)
        Assert-True ($produced -notmatch 'ghp_[A-Za-z0-9]+') 'a real git stderr credential reached the logs unredacted'
        Assert-True ($produced -match '\*\*\*REDACTED\*\*\*') 'the redaction marker is absent, so the credential was never produced or never scrubbed'

        # No log produced by this system may contain a credential shape.
        $logDirs = [System.Collections.Generic.List[string]]::new()
        $logDirs.Add((Join-Path (Split-Path -Parent $script:ProdConfigPath) 'logs'))
        foreach ($d in (Get-ChildItem -LiteralPath $script:TestRoot -Directory -ErrorAction SilentlyContinue)) {
            $p = Join-Path $d.FullName 'winsync\logs'
            if (Test-Path -LiteralPath $p) { $logDirs.Add($p) }
        }

        $checked = 0
        foreach ($dir in $logDirs) {
            if (-not (Test-Path -LiteralPath $dir)) { continue }
            foreach ($f in (Get-ChildItem -LiteralPath $dir -File -Recurse -ErrorAction SilentlyContinue)) {
                $checked++
                $content = [System.IO.File]::ReadAllText($f.FullName)
                Assert-True ($content -notmatch 'gh[pousr]_') ("credential pattern found in " + $f.FullName)
                Assert-True ($content -notmatch 'https?://[^/\s@]+@') ("URL userinfo found in " + $f.FullName)
            }
        }
        Assert-True ($checked -ge 2) "only $checked log file(s) were scanned; the scan was effectively empty"

        return "3 redaction cases scrubbed, a real credential in git stderr was redacted, $checked log file(s) scanned clean"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T12 deny-pattern-staging
# ---------------------------------------------------------------------------
function Test-T12 {
    $fx = $null
    try {
        $fx = New-Fixture 'T12'
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'safe.txt'), "ordinary content`n")
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'secret.pem'), "-----BEGIN PRIVATE KEY-----`nnot-a-real-key`n")
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 '.env'), "API_KEY=supersecretvalue`n")

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 0 $r.ExitCode ("engine run did not succeed (exit $($r.ExitCode)): " + $r.Output)

        $head = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        $names = @(Split-GitLines -Text ([string](Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('show', '--pretty=format:', '--name-only', $head))))

        Assert-True ($names -contains 'safe.txt') 'the ordinary file was not committed'
        Assert-True (-not ($names -contains 'secret.pem')) 'secret.pem was committed'
        Assert-True (-not ($names -contains '.env')) '.env was committed'

        # The withheld files must still be on disk: the filter unstages, never deletes.
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Clone1 'secret.pem')) 'secret.pem was deleted from the working tree'
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.env')) '.env was deleted from the working tree'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match 'STAGED_DENIED') 'audit log contains no STAGED_DENIED record'
        Assert-True ($audit -match 'secret\.pem') 'STAGED_DENIED does not name secret.pem'

        return "commit contains only safe.txt; secret.pem and .env unstaged and still on disk"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# T13 recovery-from-failure
# ---------------------------------------------------------------------------
function Test-T13 {
    $fx = $null
    try {
        $fx = New-Fixture 'T13'
        $headBefore = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        [System.IO.File]::WriteAllText((Join-Path $fx.Clone1 'pending.txt'), "work in progress`n")

        $brokenConfig = Join-Path $fx.Root 'config-broken.json'
        $broken = Get-Content -LiteralPath $fx.Config -Raw | ConvertFrom-Json -AsHashtable
        $broken['RemoteName'] = 'no-such-remote-aionsync-test'
        [System.IO.File]::WriteAllText($brokenConfig, ($broken | ConvertTo-Json -Depth 6))

        $r = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $brokenConfig
        Assert-True (-not $r.TimedOut) 'engine run timed out'
        Assert-Equal 40 $r.ExitCode ("expected exit 40 (ERROR), got $($r.ExitCode): " + $r.Output)

        # The failed run must not have damaged anything.
        Assert-Equal $headBefore (Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')) 'HEAD moved during a failed run'
        Assert-Equal "work in progress`n" ([System.IO.File]::ReadAllText((Join-Path $fx.Clone1 'pending.txt'))) 'working tree content changed during a failed run'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.git\index.lock'))) 'index.lock left behind by the failed run'
        Assert-True (-not (Test-Path -LiteralPath (Join-Path $fx.Clone1 '.git\MERGE_HEAD'))) 'MERGE_HEAD left behind by the failed run'
        Test-RepoHealthy -Repo $fx.Clone1 -Label 'clone1 after failed run'

        $audit = Get-EngineAuditText -WorkDir $fx.Work
        Assert-True ($audit -match '"status":"ERROR"') 'audit log contains no ERROR record'

        # The next run with a working remote recovers completely.
        $r2 = Invoke-Engine -Command 'run' -Repo $fx.Clone1 -WorkDir $fx.Work -ConfigPath $fx.Config
        Assert-True (-not $r2.TimedOut) 'recovery run timed out'
        Assert-Equal 0 $r2.ExitCode ("expected exit 0 on the recovery run, got $($r2.ExitCode): " + $r2.Output)
        $headAfter = Get-FixtureGitText -Repo $fx.Clone1 -Arguments @('rev-parse', 'HEAD')
        Assert-True ($headAfter -ne $headBefore) 'the recovery run did not commit the pending work'
        $remoteHead = Get-FixtureGitText -Repo $fx.Remote -Arguments @('rev-parse', 'refs/heads/main')
        Assert-Equal $headAfter $remoteHead 'the recovery run did not push'
        Assert-True (Test-Path -LiteralPath (Join-Path $fx.Work 'state\last-success.json')) 'last-success.json was not written after recovery'

        return "bad remote -> exit 40 with an intact repository; next run recovered and pushed $($headAfter.Substring(0,7))"
    } finally { Remove-Fixture $fx }
}

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

$allTests = [ordered]@{
    'T01' = @{ Name = 'clone-integrity'; Body = ${function:Test-T01} }
    'T02' = @{ Name = 'auth-remote-access'; Body = ${function:Test-T02} }
    'T03' = @{ Name = 'local-to-remote'; Body = ${function:Test-T03} }
    'T04' = @{ Name = 'remote-to-local'; Body = ${function:Test-T04} }
    'T05' = @{ Name = 'concurrent-prevention'; Body = ${function:Test-T05} }
    'T06' = @{ Name = 'stale-lock-recovery'; Body = ${function:Test-T06} }
    'T07' = @{ Name = 'uncommitted-preservation'; Body = ${function:Test-T07} }
    'T08' = @{ Name = 'divergent-conflict-preservation'; Body = ${function:Test-T08} }
    'T09' = @{ Name = 'interrupted-run-recovery'; Body = ${function:Test-T09} }
    'T10' = @{ Name = 'pause-resume'; Body = ${function:Test-T10} }
    'T11' = @{ Name = 'log-redaction'; Body = ${function:Test-T11} }
    'T12' = @{ Name = 'deny-pattern-staging'; Body = ${function:Test-T12} }
    'T13' = @{ Name = 'recovery-from-failure'; Body = ${function:Test-T13} }
}

Write-Host ''
Write-Host 'AION sync verification suite' -ForegroundColor Cyan
Write-Host ('  engine : {0}' -f $script:EnginePath)
Write-Host ('  repo   : {0} (read-only)' -f $script:RealRepo)
Write-Host ('  fixtures: {0}' -f $script:TestRoot)
Write-Host ('  pwsh   : {0}' -f $script:PwshExe)
Write-Host ''

$started = [System.Diagnostics.Stopwatch]::StartNew()
$selected = @($allTests.Keys | Where-Object { $script:OnlyIds.Count -eq 0 -or $script:OnlyIds -contains $_ })
if ($selected.Count -eq 0) {
    Write-Host ("ERROR: no tests matched -Only '{0}'. Known ids: {1}" -f ($Only -join ','), ($allTests.Keys -join ',')) -ForegroundColor Red
    exit 1
}
try {
    foreach ($id in $selected) {
        $spec = $allTests[$id]
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $reason = & $spec.Body
            $ms = $sw.ElapsedMilliseconds
            if ([string]::IsNullOrWhiteSpace([string]$reason)) { $reason = 'ok' }
            Write-Host ('PASS {0} {1} ({2} ms) - {3}' -f $id, $spec.Name, $ms, $reason) -ForegroundColor Green
            $script:Results.Add([pscustomobject]@{ Id = $id; Name = $spec.Name; Pass = $true; Reason = [string]$reason; Ms = $ms })
        } catch {
            $ms = $sw.ElapsedMilliseconds
            $why = [string]$_.Exception.Message
            Write-Host ('FAIL {0} {1} ({2} ms) - {3}' -f $id, $spec.Name, $ms, $why) -ForegroundColor Red
            $script:Results.Add([pscustomobject]@{ Id = $id; Name = $spec.Name; Pass = $false; Reason = $why; Ms = $ms })
        }
    }
} finally {
    $started.Stop()
    try {
        if (Test-Path -LiteralPath $script:TestRoot) {
            Remove-Item -LiteralPath $script:TestRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning ("fixture cleanup: {0}" -f $_.Exception.Message)
    }
}

$passed = @($script:Results | Where-Object { $_.Pass }).Count
$failed = @($script:Results | Where-Object { -not $_.Pass }).Count

Write-Host ''
Write-Host 'Summary' -ForegroundColor Cyan
Write-Host ('  total  : {0}' -f $script:Results.Count)
Write-Host ('  passed : {0}' -f $passed) -ForegroundColor Green
Write-Host ('  failed : {0}' -f $failed) -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
Write-Host ('  time   : {0:N1} s' -f $started.Elapsed.TotalSeconds)
if ($failed -gt 0) {
    Write-Host ''
    Write-Host '  failing tests:' -ForegroundColor Red
    foreach ($r in ($script:Results | Where-Object { -not $_.Pass })) {
        Write-Host ('    {0} {1}: {2}' -f $r.Id, $r.Name, $r.Reason) -ForegroundColor Red
    }
}
Write-Host ''

exit $(if ($failed -gt 0) { 1 } else { 0 })