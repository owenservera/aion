# AION — Windows-local Z.ai Four-Lane Integration Runbook

**Date:** 2026-10-24. **Owner/executor:** Windows local master. **Remote responsibility:** guidance, branch receipts and QA evidence routing only. **Status:** issued; not yet applied on owner Windows PC.

This document is the execution authority for incorporating the **latest user-provided Z.ai export** without allowing its unrelated Next.js wrapper, temporary sandbox Git repository, or old artifacts to overwrite the canonical AION project. Integration into the actual local AION checkout belongs to the owner. No agent claims Windows installation or a production/live-browser pass until explicit local evidence is returned.

## 1. Precisely what is incoming

Source supplied in the user's latest uploaded archive, `workspace-752735ef-5333-4dc9-b423-d81f416352a3 (6).tar` (gzip content despite .tar suffix). The extracted archive contains a **separate Next.js workspace** and its `.git`; do **not** copy that `.git` into AION. The AION implementation is contained in Git bundles and patch series under the archive's `artifacts/` directory.

| Artifact | Branch head / prerequisite | SHA-256, independently checked against the archive |
| --- | --- | --- |
| `artifacts/round8/aion-round8-integration.bundle` | prerequisite `e652a705e4dffe543a0c4ebcf402a6eed3e1d2bc` → `23185932abc7615a25207111f07328ebfb2a0074` | `5a94dd3ae13816117dd19789fe90255d16f7609f99e58664271f3839bcbad085` |
| `artifacts/aion-fourlane-integration.bundle` | prerequisite `23185932abc7615a25207111f07328ebfb2a0074` → `5ef062581e9ef887b512f6e6ef65703bc72e3337` | `afa93c24706b2a9733af40379ddf842d5053b9730642837fb139a2abfb61a74a` |

**Bundle order is mandatory:** import the 23-commit Round 6–9 bundle first, the **four** follow-up integration commits second. Do **not** also apply the corresponding 23+4 patch files after successfully importing the two Git bundles: that would duplicate history. The 27 patches are an **alternative/recovery** representation. Both artifact sets' SHA256SUMS manifests were checked against the user archive and all matched.

Canonical remote repository: `owenservera/aion`. At this review `main` = `fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9`. This commit descends from the Round8 prerequisite `e652a70...` but contains additional independent commits. **The incoming Z.ai head is not on remote main**. Merging main with incoming code can require manual conflict resolution; no blind `ours`/`theirs` selection. The local owner-master may have further unpushed changes.

Related source/coordination: [supplier bundle PR #77](https://github.com/owenservera/aion/pull/77), [Discovery-to-Read initiative PR #78](https://github.com/owenservera/aion/pull/78), [QA issue #72](https://github.com/owenservera/aion/issues/72).

## 2. Owner-local PowerShell 7 preflight (edit paths)

**Only run in your own Windows PowerShell.** Set `$Repo` to the **canonical AION Git clone**, NOT the Z.ai webapp wrapper. Keep the original owner worktree exactly as it is; no `git reset --hard`, `git clean -fd`, forced push, automatic stash, or copying exported files over active production.

```powershell
$Repo      = 'C:\Projects\aion'                         # EDIT: your actual AION repo
$Archive   = 'C:\Downloads\workspace-752735ef-5333-4dc9-b423-d81f416352a3 (6).tar' # EDIT
$Stage     = 'C:\Projects\aion-zai-export-20261024'     # EDIT: separate directory, not inside $Repo
$Worktree  = 'C:\Projects\aion-zai-fourlane-review'     # EDIT: new sibling directory
$BaseRef   = 'main'                                        # your local authoritative committed branch

# Record before touching the clone. An uncommitted edit stays in its original
# worktree and is NOT silently included in the separate integration worktree.
git -C $Repo rev-parse --show-toplevel
git -C $Repo status --short
git -C $Repo branch --show-current
git -C $Repo log -1 --oneline $BaseRef
git -C $Repo remote -v

# Unpack only to an isolated staging folder. Do not use its embedded .git.
New-Item -ItemType Directory -Force -Path $Stage | Out-Null
tar -xf $Archive -C $Stage
if ($LASTEXITCODE -ne 0) { throw 'Archive extraction failed; stop.' }
$Round8   = Join-Path $Stage 'artifacts\round8\aion-round8-integration.bundle'
$FourLane = Join-Path $Stage 'artifacts\aion-fourlane-integration.bundle'
$expected8 = '5a94dd3ae13816117dd19789fe90255d16f7609f99e58664271f3839bcbad085'
$expected4 = 'afa93c24706b2a9733af40379ddf842d5053b9730642837fb139a2abfb61a74a'
if ((Get-FileHash $Round8 -Algorithm SHA256).Hash -ne $expected8) { throw 'Round8 bundle digest mismatch; stop.' }
if ((Get-FileHash $FourLane -Algorithm SHA256).Hash -ne $expected4) { throw 'Four-lane bundle digest mismatch; stop.' }

# Ensure the specific source ancestor is present in YOUR local clone.
git -C $Repo cat-file -e 'e652a705e4dffe543a0c4ebcf402a6eed3e1d2bc^{commit}'
if ($LASTEXITCODE -ne 0) {
  throw 'Prerequisite e652a70 missing. Inspect local refs and fetch/reconcile normally; do not apply blindly.'
}
```

If your local `main` carries uncommitted work required for this integration, make a deliberate **owner-created checkpoint commit** on a suitable branch first; the separate integration worktree otherwise deliberately excludes those dirty edits. No destructive snapshot command is supplied here.

## 3. Verify and import BOTH bundles, then merge in an isolated worktree

```powershell
git -C $Repo bundle verify $Round8
if ($LASTEXITCODE -ne 0) { throw 'Round8 bundle verification failed; stop.' }
git -C $Repo fetch $Round8 'refs/heads/studio/short-writer-lease:refs/heads/import/zai-round8-20261024'
if ($LASTEXITCODE -ne 0) { throw 'Round8 bundle import failed; stop.' }
if ((git -C $Repo rev-parse 'refs/heads/import/zai-round8-20261024').Trim() -ne '23185932abc7615a25207111f07328ebfb2a0074') { throw 'Unexpected Round8 head; stop.' }

git -C $Repo bundle verify $FourLane
if ($LASTEXITCODE -ne 0) { throw 'Four-lane bundle verification failed; stop.' }
git -C $Repo fetch $FourLane 'refs/heads/studio/four-lane-integration:refs/heads/import/zai-fourlane-20261024'
if ($LASTEXITCODE -ne 0) { throw 'Four-lane bundle import failed; stop.' }
if ((git -C $Repo rev-parse 'refs/heads/import/zai-fourlane-20261024').Trim() -ne '5ef062581e9ef887b512f6e6ef65703bc72e3337') { throw 'Unexpected four-lane head; stop.' }

git -C $Repo log -1 --format='%H %s' 'import/zai-fourlane-20261024'
git -C $Repo diff --stat $BaseRef 'import/zai-fourlane-20261024'

# Fresh worktree from LOCAL owner-master committed base. Its contents are
# independent of your original working directory.
git -C $Repo worktree add -b 'integration/zai-fourlane-owner-20261024' $Worktree $BaseRef
if ($LASTEXITCODE -ne 0) { throw 'Cannot create review worktree; stop and inspect existing paths/branches.' }
git -C $Worktree merge --no-ff --no-commit 'import/zai-fourlane-20261024'
if ($LASTEXITCODE -ne 0) {
  git -C $Worktree status --short
  throw 'STOP: unresolved merge conflicts. Review exact files; do not choose ours/theirs or auto-resolve.'
}
git -C $Worktree diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Whitespace/conflict marker check failed; stop.' }
```

If you hit a conflict, preserve its `git status`, conflict paths and the two heads; post only sanitized paths/diagnostics to QA issue #72. Do not overwrite the local owner source. `git merge --abort` **only inside the isolated worktree** returns that trial to its pre-merge state.

## 4. Offline acceptance before committing / pushing

Run tests from the actual canonical Studio directory in the **integration worktree**:

```powershell
$Studio = Join-Path $Worktree 'workspace\aion\sessions\roles\09-global-research\labs\website-to-local-streaming\capture-studio'
node --version
npm --version
Push-Location $Studio
try {
  npm test
  if ($LASTEXITCODE -ne 0) { throw 'Capture Studio unit suite failed; stop.' }
} finally { Pop-Location }

# Four-lane supplier checks are already inside product tests; optional separate
# replay of PR #77 consolidated supplier suite (if checked out) does not replace
# the above product suite.
git -C $Worktree status --short
git -C $Worktree diff --cached --stat
```

Z.ai's Linux/Node v24.21.0 receipts from the export (not Windows validation): compiled four-lane `141/141`; full Studio at Z.ai head `1490 total / 1489 passed / 0 failed / 1 pre-existing TODO`; smoke covered proposals, read-selection, forged promotion refusal and U1 static module. Owner Windows results can differ by OS, Node version, local merge base and dependencies. Record **actual** counts and exact SHA.

If the suite is green and conflict resolution is independently reviewed:

```powershell
git -C $Worktree commit -m 'integrate: Z.ai four-lane Capture Studio on Windows master'
if ($LASTEXITCODE -ne 0) { throw 'Integration commit not created; stop.' }
git -C $Worktree log -1 --format='%H %s'
git -C $Worktree status --short
# Owner-controlled next action only, after reviewing staged state:
git -C $Worktree push -u origin 'integration/zai-fourlane-owner-20261024'
```

**Do not directly push or merge into `main`** on the basis of offline suite counts. Open the owner integration PR and link it in issue #72 for QA. The Windows local master is the authority; remote receipt is a record, not evidence that anything ran on Windows unless a real run log exists.

## 5. Targeted functional acceptance (without uncontrolled live site tests)

- **L0 – host sanity:** Node version, clean worktree, CLI/doctor start, existing profile directory, loopback health. No Chrome tab displacement, no secrets on GitHub.
- **L1 – offline evidence chain:** saved source→raw/DOM integrity→derive→G1–G7 evaluator→knowledge→Outcome Packet; withheld/unknown claims stay withheld.
- **L2 – read-only regression:** existing saved captures, honest account/lineage abstention; native message IDs and provenance not synthesized.
- **L3 – side-effect safety:** unresolved send remains journal-fenced, restart/uncertain delivery never blind-resends, role/account origin mismatch abstains, old Round9 intent-binding records classified `still_unknown` without deletion.
- **L4 – adapter lifecycle:** synthetic unknown-site and drift fixture; learned-read identity, no effect authorization; promotion requires server-minted digest, verified training/heldout and same VersionedStore owner; failure rollback preserves evidence.
- **L5 – owner-authorized live site:** only after explicit authorization for fresh site interactions. Real Chrome/provider two-turn, original fresh-reply attribution, capture evidence G1–G7 and goal are separate observations. The existence of this checklist is NOT authorization to send prompts.

**Stop immediately and report** if any test shows wrong origin/account attribution, duplicate send/retry, stale message counted fresh, captured private content leaving local machine, corrupted profile/journal, a learned read selector giving write authority, missing trust receipts, or data loss.

Do NOT install or runtime-merge the independent Discovery-to-Read PR #78 yet. That initiative includes a **separate prototype CAS owner** and semantic read contract; reconcile it against Z.ai's new `adapter-learning-pipeline.mjs` and single live profile writer **after** the local four-lane baseline is validated, to avoid duplicate locks/registries.

## 6. Owner-local receipt to return to GitHub

Keep raw logs, private captures, user text, account identifiers and secrets on Windows. Post only sanitized summaries to [issue #72](https://github.com/owenservera/aion/issues/72) and/or the owner integration PR using `RESULT-RECEIPT.md` in this folder.

Minimum fields: base SHA and dirty-worktree status; two verified bundle SHA256 values and imported refs; integration commit SHA; number of conflicts with file paths and their resolution; local Node/npm/OS; **actual** test totals (pass/fail/todo); L0–L4 per-round evidence verdicts; whether L5 was expressly authorized and executed; all pending blockers. Never call a GitHub push, Z.ai's synthetic pass, or a server start a Windows/live acceptance receipt.

## 7. Follow-on engineering (remote team can prepare, NOT merge locally yet)

Z.ai's precise remaining gaps after `5ef06258`:

1. Mint trusted pre-send assistant baseline / captured session ref at effect admission so `reconcileLifecycle` can prove delivery, reply, capture and acceptance instead of `unknown`.
2. Record per-account provenance into original saved sessions; reject caller-provided account labels as sole promotion evidence.
3. Wire validated learned-read precedence into existing read-only `getReadAdapter`; leave writable `getAdapter` unchanged.
4. Feed U1 with actual native blocks, account history, evidence links and adapter drift/proposals from authoritative producers; currently conservative `[]` placeholders.
5. Run owner-specific NTFS crash/lock/rollback, real Chrome and provider acceptance before making cross-provider claims.

The remote team can deliver code/docs on isolated branches, but the owner chooses merge windows and performs actual Windows installation.
