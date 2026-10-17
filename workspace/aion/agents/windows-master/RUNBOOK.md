# Windows Master — Daily Runbook

Commands an agent or the owner runs on `OWNER_WINDOWS_MASTER`. All paths are absolute; nothing here
assumes a particular working directory.

## Repository

```powershell
$repo = 'C:\0-BlackBoxProject-0\AION'
git -C $repo status -sb
git -C $repo log --oneline -5
```

## Sync system

The engine, installer and full reference live in
[`ops/winsync/README.md`](../ops/winsync/README.md). Quick commands:

```powershell
$s = 'C:\0-BlackBoxProject-0\AION\workspace\aion\ops\winsync\aion-sync.ps1'

# What state is the repo in right now?
pwsh -File $s -Command status

# Run one cycle now instead of waiting for the timer
pwsh -File $s -Command sync-now

# Stop / start scheduled syncing (does not touch the working tree)
pwsh -File $s -Command pause
pwsh -File $s -Command resume

# Versions, credential-helper resolution, remote reachability, task state, disk
pwsh -File $s -Command diagnose
```

### Verify the scheduled task independently

Do not trust the installer's own report — read the task back from Windows:

```powershell
Get-ScheduledTask -TaskName 'AION-Sync' |
  Select-Object TaskName, State
Get-ScheduledTaskInfo -TaskName 'AION-Sync' |
  Select-Object LastRunTime, LastTaskResult, NextRunTime
```

Healthy expectation: `State = Ready`, `LastTaskResult = 0`, and `NextRunTime` about 5 minutes after
`LastRunTime`. If `LastTaskResult` is non-zero, read the audit log next.

### Exit codes

| Code | Meaning | Operator response |
|---|---|---|
| `0` | OK | nothing |
| `10` | SKIP_CONCURRENT | another sync holds the lock; expected under overlap, investigate only if constant |
| `11` | SKIP_BUSY | an agent or Git operation is mid-edit; **this is the safety feature working** |
| `12` | SKIP_DIRTY_INTEGRATE | tree was dirty, so upstream was not merged; local commit/push still proceeded |
| `20` | ESCALATED_CONFLICT | **human decision required.** Merge was aborted, nothing lost |
| `21` | ESCALATION (push rejected) | **human decision required.** Never force-push |
| `30` | PAUSED | `resume` when ready |
| `40` | ERROR | read `logs/audit.ndjson` |
| `50` | TIMEOUT | run exceeded `MaxRunSeconds`; check disk space (see `BLOCKERS.md` B2) |

### Logs and state

| Path | Contents |
|---|---|
| `ops/winsync/logs/audit.ndjson` | one JSON object per step per run — the audit record |
| `ops/winsync/logs/sync.log` | human-readable log |
| `ops/winsync/state/` | `last-success.json`, `paused` flag |
| `ops/winsync/escalations/` | conflict detail when a decision is needed |
| `ops/winsync/lock/sync.lock` | active-run lock (PID + start time) |
| `refs/aionsync/snapshots/*` | in-repo rollback anchors, newest 20 kept |

Read the last few audit entries:

```powershell
Get-Content 'C:\0-BlackBoxProject-0\AION\workspace\aion\ops\winsync\logs\audit.ndjson' -Tail 20
```

## Recovery

**Sync stopped making progress / task shows an error.**
1. `pwsh -File $s -Command diagnose` — this is safe to run even mid-sync.
2. Read the tail of `logs/audit.ndjson` and find the failing step.
3. If a stale lock is suspect, the engine reclaims it automatically after `LockStaleMinutes`.
   To force it, confirm no sync process is alive, then delete `ops/winsync/lock/sync.lock`.

**Undo a bad automated commit.** Snapshots exist for exactly this. The engine never rewrites history,
so recovery is a normal, non-destructive reset to a snapshot ref:

```powershell
git -C $repo log --oneline refs/aionsync/snapshots/
# choose the commit you want to return to, then:
git -C $repo revert <bad-commit>     # preferred: keeps history, publishes the undo
```

Prefer `revert` over `reset`. Never force-push the shared remote.

**A conflicted sync escalated (exit 20).** Nothing was lost. Both versions are preserved in
`ops/winsync/escalations/`. Resolve deliberately, commit, push. Do not pick a side reflexively —
another agent's edits are in there.

## Uninstall / rollback

```powershell
# via the engine (keeps logs and snapshots for post-mortem)
pwsh -File $s -Command uninstall

# or via the installer
pwsh -File 'C:\0-BlackBoxProject-0\AION\workspace\aion\ops\winsync\Install-AionSyncTask.ps1' -Uninstall

# independent confirmation that it is gone
Get-ScheduledTask -TaskName 'AION-Sync' -ErrorAction SilentlyContinue
```

Uninstall removes the scheduled task only. It does **not** delete logs, snapshots, or any repository
content. Removing those is a separate, manual decision.

## Running the test suites

```powershell
# sync system — 13 cases against disposable fixtures, never touches AION destructively
pwsh -File 'C:\0-BlackBoxProject-0\AION\workspace\aion\ops\winsync\Test-AionSync.ps1'

# AION browser adapter — no browser needed
cd 'C:\0-BlackBoxProject-0\AION\workspace\aion\sessions\01-escape-hatch\adapter'
node --test send-m05.test.js          # expect 35/35

# zcode driver — 4 known Windows-permission failures, see BLOCKERS.md B1
cd 'C:\0-BlackBoxProject-0\AION\workspace\aion\bff\zcode'
bun test
```

The adapter's `--live`, `--read-last` and `--inspect-dom` modes drive a real browser. **Do not run
them** without an explicit current owner authorization (see `BLOCKERS.md` B3).