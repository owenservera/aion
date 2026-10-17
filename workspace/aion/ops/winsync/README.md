# AION Windows auto-sync (`winsync`)

Unattended Git auto-sync for the AION repository on the Windows master machine.
A scheduled task runs the engine every 5 minutes: it integrates upstream when it
can do so safely, commits local work, and pushes.

The engine is built to lose nothing. It never force-pushes, never runs a
destructive Git command, never resolves a conflict on its own, and steps aside
whenever it detects a human or another agent is in the middle of something.

## Files

| File | Role |
| --- | --- |
| `aion-sync.ps1` | The engine. One script, verb selected with `-Command`. |
| `Install-AionSyncTask.ps1` | Registers / removes the `AION-Sync` scheduled task. |
| `Test-AionSync.ps1` | 13-case verification suite using disposable fixtures. |
| `config.json` | Runtime configuration. |
| `config.schema.md` | Every config key, type, default and meaning. |
| `.gitignore` | Excludes the engine's own runtime state from its own commits. |

## Install

From this directory:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1 -DryRun
```

Read the printed definition. Then register for real:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1
```

The installer registers a repeating trigger plus a logon trigger, runs as the
interactive user at `RunLevel Limited` (no administrator rights), and sets
`MultipleInstances IgnoreNew` so a slow run can never overlap the next one.

It is idempotent: if `AION-Sync` already exists it is unregistered and
re-registered. Parameters `-RepoPath`, `-TaskName` and `-IntervalMinutes` override
the matching `config.json` keys for the registration.

The installer does not report success on its own word. After `Register-ScheduledTask`
it reads the task back with `Get-ScheduledTask` and prints the state it actually
observed. A failed read-back, or any state other than `Ready`, exits non-zero. If
you do not see `INSTALLED: task "AION-Sync" is registered and reports state
"Ready"`, the task is not installed.

### Confirm the registration yourself

```powershell
Get-ScheduledTask -TaskName "AION-Sync" | Select-Object TaskName,State
```

```powershell
Get-ScheduledTaskInfo -TaskName "AION-Sync" | Select-Object LastRunTime,NextRunTime,LastTaskResult
```

## Verify

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\Test-AionSync.ps1
```

Exits 0 only when all 13 cases pass. Run a subset with `-Only T07,T08`.

The suite builds a bare repository and two clones under
`%TEMP%\aionsync-tests\<guid>\` for every behavioural case and deletes each
fixture in a `finally` block. It reads the real AION repository but never writes
to it. Only T01 and T02 touch the network; everything else runs on local paths.

## Uninstall

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\Install-AionSyncTask.ps1 -Uninstall
```

Equivalent engine verb:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command uninstall
```

Uninstall removes the scheduled task only. It prints the remaining rollback steps
and deliberately leaves `logs/`, `state/`, `escalations/` and the
`refs/aionsync/snapshots/*` refs in place, because those are the evidence you need
if something went wrong. Delete them yourself once you no longer want them.

## Manual operation

All commands run from this directory.

```powershell
# one cycle now, with the full step table printed to stdout
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command sync-now

# what the scheduled task itself runs
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command run

# read-only report: branch, HEAD, ahead/behind, dirty count, lock, task state
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command status

# versions, credential helper, remote reachability, disk space, stale escalations
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command diagnose

# stop / resume automatic syncing without uninstalling
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command pause
pwsh -NoProfile -ExecutionPolicy Bypass -File .\aion-sync.ps1 -Command resume
```

`pause` writes `state/paused`. While that file exists, `run` does nothing and
exits 30. `resume` deletes it.

`status`, `diagnose` and `pause` / `resume` are safe to run while a sync cycle is
in progress. Only `run` and `sync-now` mutate the repository.

## Exit codes

Every verb returns a code from this table. The scheduled task records it as
`LastTaskResult`, so a non-zero value there is the signal to investigate.

| Code | Name | Meaning |
| --- | --- | --- |
| 0 | `OK` | Cycle completed. May have changed nothing, or may have integrated, committed and pushed. |
| 10 | `SKIP_CONCURRENT` | Another sync process holds the lock. The repository was not touched. |
| 11 | `SKIP_BUSY` | A merge, rebase, cherry-pick, Git index lock, or another `git.exe` on this repository is in progress. The repository was not touched. |
| 12 | `SKIP_DIRTY_INTEGRATE` | Upstream is ahead and the working tree is dirty. Integration was deferred; the commit and push phases still ran. |
| 20 | `ESCALATED_CONFLICT` | A divergent merge conflicted. The merge was aborted, both sides are intact, and details are in `escalations/`. Needs a human. |
| 21 | `ESCALATION` | The push was rejected even after one recovery attempt, or a push error could not be classified. Never force-pushed. Needs a human. |
| 30 | `PAUSED` | `state/paused` exists. Nothing was done. |
| 40 | `ERROR` | A step failed unexpectedly: fetch failed, the repo path is not a work tree, the remote name is unknown, the config is invalid. |
| 50 | `TIMEOUT` | The cycle exceeded `MaxRunSeconds`. Aborted between steps. |

Codes 10, 11, 12 and 30 are normal, expected outcomes, not faults. Code 20 and 21
mean the engine deliberately stopped and a human needs to look.

## The cycle

`run` executes these steps in this order, recording each to `logs/audit.ndjson`:

1. **Start record** — UTC, PID, branch, pre-run HEAD, tracking branch.
2. **Busy detection** — skip with `SKIP_BUSY` on `index.lock`, `rebase-merge`,
   `rebase-apply`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, a live `MERGE_HEAD`, or any
   other `git.exe` whose command line references this repository.
3. **Snapshot anchor** — `git stash create` (leaves the working tree untouched)
   plus a durable ref `refs/aionsync/snapshots/<utc>` at the current HEAD.
   Oldest refs are pruned past 20.
4. **Fetch** — `git fetch --prune <remote>` with `GIT_TERMINAL_PROMPT=0` and a
   hard timeout, so an unattended run can never hang on a credential prompt.
5. **Relationship** — `git rev-list --left-right --count HEAD...@{u}`.
6. **Behind, not ahead** — `git merge --ff-only @{u}`.
7. **Diverged** — one `git merge --no-edit --no-ff @{u}`. On conflict:
   `git merge --abort`, save the conflicted paths to `escalations/`, exit 20. It
   never picks a side.
8. **Behind and dirty** — skip integration, record `SKIP_DIRTY_INTEGRATE`, fall
   through to commit and push.
9. **Commit** — `git add --all -- .`, filter the staged set against
   `DenyPathPatterns` and unstage anything denied, then commit with a generated
   message. Skipped if nothing survives the filter.
10. **Push** — `git push <remote> HEAD:<branch>`. On a non-fast-forward
    rejection, exactly one recovery attempt (fetch, merge, retry the push). If
    that still fails: `ESCALATION`, exit 21.
11. **End record** — UTC, duration, final HEAD, per-step status, whether anything
    changed.

## Safety guarantees

**No force push, ever.** Only `git push <remote> HEAD:<branch>`. There is no
`--force` anywhere in the engine.

**No destructive Git.** The engine never runs `reset --hard`, `clean`,
`checkout --`, `rebase`, `stash push`, or `stash pop`. `stash create` is used
because it snapshots without touching the working tree.

**Snapshots before anything risky.** Every cycle anchors to a recoverable point
before integrating upstream or committing a dirty tree. Those refs outlive the
run, so an accidental commit can be inspected and reverted by a human later.

**Conflicts are never auto-resolved.** The engine aborts and escalates. It never
chooses ours or theirs.

**Concurrent work always wins.** If a lock file is held, a merge is in progress,
or any other `git.exe` is operating on this repository, the cycle skips without
touching the tree. A busy box costs a skipped sync, never lost work.

**Credentials never reach disk.** `Redact-Sensitive` scrubs `gh[pousr]_*` tokens,
userinfo in URLs, and `token=` / `password=` style parameters from every line
before it is written to a log, an audit record, an escalation capture or a commit
message. Credentials resolve through `gh auth git-credential` at run time; no
token is ever stored in this directory.

**Bounded execution.** A `Stopwatch` checks `MaxRunSeconds` between steps, and
every individual git call has its own timeout with stdout and stderr captured to
temporary files.

**Secrets stay out of commits.** `.gitignore` in this folder excludes the
engine's own runtime state from the engine's own `git add --all`. Independently,
any staged path matching `DenyPathPatterns` is unstaged and logged as
`STAGED_DENIED`. A denied file is never deleted from disk — only left uncommitted.

## Where things live

All relative to this directory (`workspace/aion/ops/winsync/`):

| Path | Contents |
| --- | --- |
| `lock/sync.lock` | JSON `{pid, startedUtc, host, repo}`. Held open exclusively by the running process. Never deleted on release — only the handle is closed, which avoids a delete/recreate race. Absence of the file is not "locked": a zero-byte leftover is treated as unlocked. |
| `logs/audit.ndjson` | One JSON object per step. The durable machine record: UTC timestamp, `runId`, `step`, `status`, `detail`. |
| `logs/sync.log` | Human-readable line per step. |
| `logs/sync-*.log` | Rotated archives, newest `MaxLogFiles` kept. |
| `state/paused` | Exists while syncing is paused. |
| `state/last-success.json` | UTC of the last cycle that reached `OK`. |
| `escalations/` | Sanitized stderr and conflicted-path lists. `diagnose` flags anything here. |
| `tmp/` | Short-lived stdout/stderr capture files for child git processes. |

Snapshot refs live inside the repository itself, under
`refs/aionsync/snapshots/<utc>`, newest 20 retained. List them with:

```powershell
git for-each-ref --format="%(refname:short) %(objectname:short)" refs/aionsync
```

Delete them individually when you no longer need the rollback points:

```powershell
git update-ref -d refs/aionsync/snapshots/<utc>
```

## Reading a cycle after the fact

```powershell
Get-Content .\logs\sync.log -Tail 40
Get-Content .\logs\audit.ndjson -Tail 20 | ForEach-Object { $_ | ConvertFrom-Json } |
    Format-Table ts, step, status, detail -AutoSize -Wrap
```

## When something needs a human

- **Exit 20 (`ESCALATED_CONFLICT`)** — read the newest file in `escalations/`,
  then resolve by hand in the repository and push.
- **Exit 21 (`ESCALATION`)** — the push was rejected. Run `diagnose` first to
  check reachability and credentials, then re-run `sync-now`.
- **Repeated exit 11 (`SKIP_BUSY`)** — something is holding the repository
  permanently. `diagnose` reports the lock owner; a lock older than
  `LockStaleMinutes` whose PID is gone is reclaimed automatically.
- **Exit 40 (`ERROR`)** — check `config.json`. A wrong `RemoteName` or
  `RepoPath` is the usual cause.
