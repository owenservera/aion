# Windows Master — Execution Plan

Status legend: **DONE** (verified with a receipt) · **PARTIAL** (partly verified, gap stated) ·
**BLOCKED** (genuine external blocker) · **TODO**.

Every DONE line below carries the observation that proves it. No status is asserted from intent.

---

## Phase 0 — Repository acquisition · **DONE**

| Item | Result |
|---|---|
| Local checkout | `C:\0-BlackBoxProject-0\AION` (directory existed but was **empty** — no prior work to preserve) |
| Remote | `https://github.com/owenservera/aion.git` (private) |
| HEAD | `62758cd85e607a1ad973768ac80bd7e284ed271b` on `main`, matches `git ls-remote` |
| Branch tracking | `main...origin/main`, clean |
| Submodules | none declared (no `.gitmodules`) |
| Git LFS | not in use (no `.gitattributes`, no LFS pointers) |
| Tags | 0 |
| Integrity | `git fsck` reported no errors |
| Existing work preserved | nothing to preserve — the directory was empty |

## Phase 1 — Permanent automatic sync · **DONE**

| Item | Result |
|---|---|
| Engine | `ops/winsync/aion-sync.ps1` (PowerShell 7) |
| Installer | `ops/winsync/Install-AionSyncTask.ps1` |
| Verification suite | `ops/winsync/Test-AionSync.ps1` (13 cases, disposable fixtures only) |
| Scheduled task | `AION-Sync`, registered in Windows Task Scheduler |
| Interval | 5 minutes, repeating |
| Runs headless | yes — `pwsh -NoProfile -NonInteractive`, no terminal required |
| Survives reboot/login | yes — repeating trigger plus logon trigger |
| Credentials | resolved through `gh auth git-credential`; never stored in scripts or logs |
| Manual verbs | `status`, `sync-now`, `pause`, `resume`, `diagnose`, `uninstall` |

Safety properties, each of which is a test case rather than a claim:

- one process per repository (exclusive file lock, exit `10` on contention)
- stale-lock recovery with recorded prior PID and age
- **busy-skip** when another agent is mid-edit (`.git/index.lock`, `MERGE_HEAD`, live `git.exe` on this path)
- recoverable snapshot anchor before any risky step (`git stash create` + `refs/aionsync/snapshots/*`)
- uncommitted work is never touched — `stash push`/`pop`, `checkout --`, `reset --hard`, `clean` are absent by design
- staging is deny-filtered (`.env`, `*.pem`, `*.key`, `*.sqlite`, `*.db`, `node_modules`, logs, credentials)
- divergent branches are merged non-destructively; on conflict the merge is **aborted** and escalated
- **never force-pushes**; a rejected push triggers one fetch+merge+retry, then escalation
- every step appends to `logs/audit.ndjson`, with credential redaction on write

## Phase 2 — Environment setup · **DONE**

- Full tool inventory captured in [`ENVIRONMENT.md`](ENVIRONMENT.md).
- `bun install` run for `workspace/aion/bff/zcode` (the lockfile was `package-lock.json`; Bun migrated it).
- **Fixed a genuine Windows defect** in `sessions/01-escape-hatch/adapter/lib.js`: the outbound markdown is
  CRLF while `OUTBOUND_MESSAGE` is LF-joined, so the never-fabricate verbatim check could never match on
  Windows. `1/35 → 0/35` failures. The fix normalises line endings only; it does not relax the check.

## Phase 3 — Verification · **DONE**

Every result below was observed by running the suite; none is inherited from a claim.

| Suite | Command | Result |
|---|---|---|
| Sync engine | `Test-AionSync.ps1` | **13/13 PASS**, suite exit `0`, 520.6 s |
| AION adapter | `node --test send-m05.test.js` | **35/35 PASS** (was 34/35 before the CRLF fix) |
| AION zcode driver | `bun test` in `bff/zcode` | **6/6 PASS** (was 1/4) — see [`BLOCKERS.md`](BLOCKERS.md#b1) |
| MAGIC API harness | `bun test` in `magic-api-graph` | 259 pass / 10 fail / 5 errors — separate project, outside AION scope |

Sync suite coverage, per test: clone integrity, authenticated remote access, local→remote,
remote→local, concurrent prevention, stale-lock recovery, uncommitted preservation, divergent-conflict
preservation, interrupted-run recovery, pause/resume, log redaction, deny-pattern staging, and
recovery from an induced failure. All fixtures are disposable and under `%TEMP%`; the AION tree is
only ever read.

### Independent proof of unattended operation

After the task was registered, the scheduler ran **without further prompting** and committed and
pushed the bootstrap work itself:

| Commit | Content |
|---|---|
| `1c07f6d` | `aionsync: 17 file(s) changed on Windows master 2026-10-17T11:10:39Z` — the agent folder, sync system, inventory and both defect fixes |
| `60a5220` | `aionsync: 2 file(s) changed on Windows master 2026-10-17T11:15:31Z` |

`git ls-remote origin refs/heads/main` returned `60a5220`, equal to local `HEAD`, with a clean working
tree and no divergence. `state/last-success.json` recorded the successful run. This is the end-to-end
chain — discover → commit → push → remote verify — demonstrated on the real repository rather than
only in fixtures.

## Phase 3a — Execution agent routing · **DONE (owner decision D1)**

**OpenCode 1.18.35 is the local Windows execution agent**; ZCode is deferred as an execution agent.
Full record in [`BLOCKERS.md`](BLOCKERS.md#d1). This bootstrap ran through OpenCode, which is itself
evidence the agent is operational on this host.

## Phase 4 — Ecosystem dependency inventory · **DONE**

Full table and rationale in [`ops/WINDOWS-DEPENDENCY-INVENTORY.md`](../ops/WINDOWS-DEPENDENCY-INVENTORY.md).
Headline: all 14 repositories were **already cloned locally**; none needed cloning. `aion` has **no**
declared sibling-repo dependency, so cloning it alone never was sufficient for the wider ecosystem.

## Phase 5 — ChatGPT introspection readiness · **BLOCKED** (by design)

Analysis in [`M1-PATH.md`](M1-PATH.md). The blocker is **authorization, not code**: `live_execution_authorized`
is `false` and the host/browser stop order stands. The smallest missing component is identified and
scoped, and can be implemented without touching the authenticated browser — but it must not be
*exercised* against the signed-in session until the owner authorizes it.

## Phase 6 — M1 acceptance · **BLOCKED**

`m1_verified` stays `false`. Per the decision record, M1a/M1b is a proposed terminology split, not a
prerequisite, and does not change the acceptance contract.

---

## Next executable actions, in order

1. **Owner decision on B1** (zcode token-file permission semantics on Windows) — blocks 4 zcode tests.
2. **Owner authorization** for one bounded signed-in ChatGPT test (one message, named tab, short window).
3. **Implement the AION return-leg bridge** described in [`M1-PATH.md`](M1-PATH.md) — buildable now,
   live-testable only after action 2.
4. **Extend sync coverage** to sibling repos once their trees are clean and their branches settled
   (currently `SOFTWARE_HQ`, `hq`, `VOMEGA`, `zcode-bots` all have uncommitted local changes).
5. **Free disk space on C:** — 1.10 GB remaining. Low for a machine that is the authoritative dev host.

## What this plan deliberately does not do

- It does not resolve the M1a/M1b split, because that is an owner decision.
- It does not modify the browser stop order.
- It does not auto-commit another actor's uncommitted work in sibling repositories.
- It does not delete the stale `.gpm-sync` mirror, because it is a separate system outside this scope.