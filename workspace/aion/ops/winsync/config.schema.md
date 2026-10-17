# config.json schema

`config.json` sits next to `aion-sync.ps1` and is read on every invocation.
Keys are case-sensitive in practice; keep the spelling below. Every key has a
built-in fallback in the engine, so a missing key degrades to the default rather
than failing the run. See `README.md` for the operational procedure.

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `RepoPath` | string | *(none — required)* | Absolute path to the repository to sync. The scheduled task passes `-Repo` explicitly, which overrides this. Must be a Git work tree; the engine calls `rev-parse --absolute-git-dir` at startup and errors out with exit 40 if it is not one. |
| `Branch` | string | `main` | Local branch that is pushed and fast-forwarded. Used as the left side of `git push <remote> HEAD:<Branch>`. |
| `RemoteName` | string | `origin` | Git remote that is fetched (`fetch --prune`) and pushed to. An unknown name is a configuration error and exits 40 without touching the working tree. |
| `IntervalMinutes` | number | `5` | Repetition interval used by `Install-AionSyncTask.ps1` when building the repeating trigger. The engine itself does not read this. |
| `LockStaleMinutes` | number | `15` | Age at which an un-releasable `lock/sync.lock` is considered abandoned. A lock is reclaimed early if its recorded PID is no longer running; otherwise it is reclaimed once it is older than this. Exceeding it is the only way a second process takes the lock from a live one. |
| `MaxRunSeconds` | number | `240` | Wall-clock budget for one `run` / `sync-now` cycle. Checked between steps; on overrun the cycle aborts with `TIMEOUT` (exit 50). Every individual git call additionally carries its own timeout. Keep this below the task's `ExecutionTimeLimit` (4 minutes by default) so the engine stops cleanly before Task Scheduler kills it. |
| `MaxLogFiles` | number | `14` | Number of rotated `logs/sync-*.log` archives to keep. At the default 5-minute interval this is roughly 70 minutes of human-readable history; `logs/audit.ndjson` is the durable machine record and is not rotated away by this. |
| `TaskName` | string | `AION-Sync` | Name of the Windows scheduled task. Read by `status`, `diagnose` and `uninstall`, and used as the default `-TaskName` by `Install-AionSyncTask.ps1`. |
| `DenyPathPatterns` | array of string | see below | .NET regular expressions matched case-insensitively against every **staged** path after `git add --all`. A matching path is unstaged with `git restore --staged` and recorded as `STAGED_DENIED`; it is never deleted from disk. This is the last line of defence behind `.gitignore` — it exists so that a secret that *is* allowlisted still cannot reach a commit. Keep every pattern valid .NET regex: an invalid pattern fails that run with exit 40. |

Defaults shipped in `DenyPathPatterns`:

```
(?i)\.env          (?i)\.pem$          (?i)\.key$          (?i)\.p12$
(?i)\.pfx$         (?i)\.crt$          (?i)id_rsa          (?i)id_ed25519
(?i)credentials    (?i)\.secrets       (?i)\.npmrc         (?i)\.netrc
(?i)node_modules/  (?i)\.log$          (?i)\.sqlite        (?i)\.db$
(?i)\.lock$        (?i)secrets?\.json  (?i)service-account.*\.json$
(?i)token[s]?\.json$
```

Notes:

- The trailing `$` in `(?i)\.pem$` matters — it anchors to the end of the
  relative path so `docs/keyboard.pem.md` is not collateral. Patterns without an
  anchor intentionally match anywhere in the path.
- Paths are matched as **repository-relative** POSIX paths, as reported by
  `git diff --cached --name-only`.
- `(?i)\.lock$` covers Git lock files and editor lock files. It does not cover
  `lock/sync.lock` under this directory, because that directory is already
  excluded by `.gitignore` in this folder.
- Adding a pattern takes effect on the next cycle; no reinstall is needed.

Engine parameters that override configuration at runtime:

| Parameter | Applies to | Effect |
| --- | --- | --- |
| `-Command <verb>` | `aion-sync.ps1` | Selects the verb: `status`, `run`, `sync-now`, `pause`, `resume`, `diagnose`, `uninstall`. Default `status`. |
| `-Repo <path>` | `aion-sync.ps1` | Overrides `RepoPath`. Set by the scheduled task so the engine never guesses which checkout it owns. |
| `-WorkDir <path>` | `aion-sync.ps1` | Relocates the runtime state root (`lock/`, `logs/`, `state/`, `escalations/`, `tmp/`). Defaults to this directory. Used by the test suite to keep fixture runs out of production state. |
| `-ConfigPath <path>` | `aion-sync.ps1` | Loads a different config file. |
| `-RepoPath`, `-TaskName`, `-IntervalMinutes` | `Install-AionSyncTask.ps1` | Override the corresponding config keys for registration only. |
| `-DryRun`, `-Uninstall` | `Install-AionSyncTask.ps1` | Print the definition without registering / unregister instead. |
| `-Only T03,T07` | `Test-AionSync.ps1` | Run a subset of the suite. |
