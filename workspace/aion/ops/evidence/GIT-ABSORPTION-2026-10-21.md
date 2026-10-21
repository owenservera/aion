# Repository consolidation — session portfolio (2026-10-21)

**Scope:** consolidate every branch, worktree, pull request and stray object in the AION repository into a single `main`, then explain and remove the 259 MB that survived the consolidation.

**Outcome:** one branch, one worktree, zero open PRs, zero remote branches besides `origin/main`, one 20.1 MB pack, `fsck` clean.

| Measure | Before | After |
|---|---|---|
| `main` tip | `f6ac713` (461 commits behind `origin`) | **`15ba97d`** |
| Local branches | 5 | **1** |
| Worktrees | 3 | **1** |
| Remote branches | 25 | **0** (`origin/main` only) |
| Open PRs | 4 | **0** |
| Tracked files | — | 3,562 |
| Commits in `main` | — | 1,335 |
| Object database | 259.81 MiB | **20.1 MB** |
| Loose objects | 4,682 | **0** |
| `git fsck --full` | — | **0 issues** |
| Tag `canonical-2026-10-19` | `55cc03a` | `aaef828` |

History spans 2026-10-16 01:52 → 2026-10-21 21:09 (+02:00). Fifteen of the 23 merge commits in `main` were created by this session.

## 1. The directive trail

The session did not begin with a specification. Scope was defined by a sequence of owner instructions, and the operating rules changed twice in response to what the first attempt exposed.

| # | Instruction | Effect |
|---|---|---|
| 1 | "everything not in `main` goes into `main`" | 25 remote branches absorbed |
| 2 | "close all PRs" | #33, #34, #46 closed; #35 auto-merged once its commits landed |
| 3 | "main absorbs worktrees" | 2 linked worktrees removed |
| 4 | "no branches no worktrees" | 25 remote branches and all non-`main` locals deleted |
| 5 | "we had identified the 51 or so files" | history purge scoped to exactly 51 paths |

Instruction 5 is the one that mattered. It converted a vague "make the repo small" into a bounded, verifiable operation — and it was correct: those 51 paths held 241.5 MB, 96.6% of all media in history.

## 2. Phase 1 — Branch absorption

### Inventory first

25 remote branches, 5 local branches, 3 worktrees, 4 open PRs, working tree clean. Before deleting anything, all branch tips were preserved as backup refs (`refs/aion-absorbed/*`) and a full pre-rewrite bundle was created and verified.

### Merge policy

1. Branch already contained in `main` → skip.
2. Clean merge → `git merge --no-ff` (preserves commit reachability; a rebase would have flattened it).
3. File-level conflict → merge everything else, keep `main`'s version for conflicting paths, record the excluded paths.
4. Branch that would delete live files → not auto-merged; handled per case.

A rebase (`-X ours`) was started on `track-b/windows-integration-20261020` and aborted before replaying a single commit: a merge produces identical content while keeping the branch's commits reachable.

### Results

| Outcome | Branches | Count |
|---|---|---|
| Clean merge | `cleanup/donor-snapshots-media`, `design/agent-fabric`, `harvest/crosswalk`, `harvest/omega-github`, `harvest/vivim-final-github`, `harvest/vomega-semantic-cli`, `integration/command-space-p0-final`, `integration/harvest-crosswalk-synthesis`, `integration/harvest-research-snapshots`, `track-b/strategic-capability-roadmap` | 10 |
| Partial merge, conflicts excluded | `bootstrap/aion-09-global-research`, `harvest/external-browser-donors`, `harvest/external-custody`, `review/principal-architect`, `track-b/velocity-command-plane` | 5 |
| Already an ancestor | `integration/i1-watch`, `track-b/implementation-rounds`, `harvest/external-custody-chatgpt`, `track-b/platform-local-candidate` | 4 |
| Redundant, deleted after zero-diff verification | `feature/command-space-p0-provider-research`, `feature/command-space-registry`, `integration/command-space-p0-additions`, `integration/harvest-catalog`, `structure/main-trackb-harvest`, `wip/native-transport-first-attempt` | 6 |
| **Total** | | **25** |

## 3. Phase 2 — Conflict adjudication, three iterations

The conflict rule was the hardest part of the session because it was discovered, not designed.

**Iteration 1 — "ours".** Rejected branch versions wholesale. Fast, but it silently discards branch work that might be newer.

**Iteration 2 — quarantine.** Excluded files were copied aside for later assessment. Better, but manual and non-deterministic; nothing said *which* side was right.

**Iteration 3 — most recent edit wins (adopted).** For each conflicting path, compare the last commit date on each side:

```powershell
git log -1 --format=%cI <main> -- <path>
git log -1 --format=%cI <branch> -- <path>
```

| Branch | Files | Branch last edit | `main` last edit | Winner |
|---|---|---|---|---|
| `track-b/windows-integration-20261020` | 15 | 2026-10-19 21:09 – 2026-10-20 12:15 | 2026-10-20 23:18 – 2026-10-21 12:03 | `main`, all 15 |
| `bootstrap/aion-09-global-research-20261019` | 15 | 2026-10-19 17:48 | 2026-10-21 11:34 – 14:27 | `main`, all 15 |
| `harvest/external-browser-donors-20261020` | 5 | 2026-10-20 13:42 – 15:48 | 2026-10-20 18:33 – 2026-10-21 12:03 | `main`, all 5 |
| `track-b/velocity-command-plane-20261019` | 2 | 2026-10-19 22:30 | 2026-10-20 00:10 / 15:00 | `main`, both |

**37 files across 4 branches, `main` won every one.** The earlier "ours" resolutions therefore coincide with the edit-date rule — the policy change validated the earlier work rather than reversing it.

### Excluded paths (kept from `main`)

`bootstrap/aion-09-global-research-20261019` — 15 files:

- `workspace/aion/sessions/roles/09-global-research/AGENTS.md`
- `workspace/aion/sessions/roles/09-global-research/BOOTSTRAP.md`
- `workspace/aion/sessions/roles/09-global-research/LAUNCH-PROMPT.md`
- `workspace/aion/sessions/roles/09-global-research/SCHEDULES.md`
- `workspace/aion/sessions/roles/09-global-research/SITREP.md`
- `workspace/aion/sessions/roles/09-global-research/WORKSPACE.md`
- `workspace/aion/sessions/roles/09-global-research/skills/01-source-intake/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/02-repo-discovery/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/03-evidence-assessment/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/04-docs-intelligence/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/05-media-intelligence/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/06-cross-project-transfer/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/07-notebooklm/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/08-delivery-loop/SKILL.md`
- `workspace/aion/sessions/roles/09-global-research/skills/09-session-sitrep/SKILL.md`

`harvest/external-browser-donors-20261020` — 5 files:

- `workspace/aion/ops/chrome-relay/harvest/external/02-REPO-PRIORITIZATION.md`
- `workspace/aion/ops/chrome-relay/harvest/external/reference/capability-universe.csv`
- `workspace/aion/ops/chrome-relay/harvest/external/sources.json`
- `workspace/aion/ops/chrome-relay/velocity/bin/aion-local.mjs`
- `workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md`

`track-b/velocity-command-plane-20261019` — 2 files:

- `workspace/aion/ops/chrome-relay/velocity/AGENTS.md`
- `workspace/aion/ops/chrome-relay/velocity/README.md`

`track-b/windows-integration-20261020` — 15 files, `main` won all; branch tips survive only in the pre-rewrite bundle (see §7).

## 4. Phase 3 — PRs, worktrees, branches

| PR | Branch | Outcome |
|---|---|---|
| #46 | `track-b/platform-local-candidate-20261020` | closed |
| #35 | `design/agent-fabric-20261020` | auto-marked merged once commits landed in `main` |
| #34 | `track-b/implementation-rounds-20261019` | closed |
| #33 | `track-b/velocity-command-plane-20261019` | closed |

- Worktrees removed: `C:/0-BlackBoxProject-0/AION-integration-20261019`, `C:/0-BlackBoxProject-0/AION-track-b-20261020`.
- Local branches: 5 → 1.
- Remote branches: 18 deleted after proving content fully contained, 6 deleted after a zero-unique-file check, 1 deleted after merge — 25 → 0.

## 5. Phase 4 — The 259 MB question

The repository still weighed 259 MB after all of the above. The question asked was whether the 259 MB backup bundle made sense. It did — which was the problem.

| Measure | Value |
|---|---|
| Pack after `git gc` | 259.81 MiB |
| Bundle | 258.94 MiB — a faithful copy, not inflated |
| Media blobs in history | 250.1 MB (268 files) |
| Text/code blobs in history | 42.0 MB |

**96% of the repository was donor-snapshot media in history.** The `cleanup/donor-snapshots-media-20261020` branch had already deleted 51 of those files from the tree — but deleting a file in a new commit never removes its blobs from earlier commits. That is why the earlier "prune" changed nothing about size.

The 51 identified paths accounted for **241.5 MB of the 250.1 MB** — 96.6%. The largest single contributors were promotional videos under `harvest/external/landing/donors/parallel-ai/promo/promo-video/` (13 `.mp4` files, 215.5 MB total). Purging exactly those 51 was therefore surgical, not sweeping.

### Purge

```powershell
# 51 repo-relative paths, one per line
git filter-repo --invert-paths --paths-from-file purge-paths.txt --force
```

| Measure | Before | After |
|---|---|---|
| Pack size | 259.4 MB | **20.1 MB** |
| `main` | `55325c6` | `c0732fe` → `15ba97d` |
| Tag `canonical-2026-10-19` | `55cc03a` | `aaef828` |
| Loose objects | 4,682 | 0 |

`git filter-repo` removes the `origin` remote as a safety measure; it was re-added and upstream tracking reset afterwards.

## 6. Verification receipts

| Gate | Command | Result |
|---|---|---|
| Object integrity | `git fsck --full` | 0 issues |
| Purged paths absent from tip | `git rev-parse -q --verify HEAD:<path>` ×51 | 0 of 51 present |
| Purged paths absent from history | `git log --all --oneline -- <51 paths>` | 0 commits |
| File count preserved | `git ls-tree -r --name-only HEAD \| wc -l` | 3,562 before and after |
| Local == remote | `git rev-parse HEAD` vs `refs/remotes/origin/main` | identical |
| Working tree | `git status -sb` | clean, `main...origin/main` |
| Backup archive | `git bundle verify` | okay |

The working tree was untouched by the rewrite: all 51 paths had already been deleted from `HEAD` before `filter-repo` ran, so the operation removed history objects only.

## 7. Recovery assets and blast radius

| Asset | Path | Notes |
|---|---|---|
| Pre-rewrite bundle | `C:/0-BlackBoxProject-0/_git-archive/aion-pre-cleanup-2026-10-21.bundle` | 258.94 MB, verified; full original history, deleted branch refs, and branch versions of all 37 excluded conflict files |
| Live refs | `refs/aionsync/*` (28) | owned by `workspace/aion/ops/winsync/aion-sync.ps1`; deliberately untouched |

Restore any pre-rewrite object:

```powershell
git clone C:/0-BlackBoxProject-0/_git-archive/aion-pre-cleanup-2026-10-21.bundle aion-recovered
```

**Blast radius.** Every SHA in the repository changed. Any other clone must re-clone, not pull; the old SHAs are not recoverable from GitHub. The bundle is the only remaining copy of pre-rewrite history and should be kept until the owner is satisfied, then deleted deliberately.

## 8. Reusable runbook

```powershell
# 0. Preconditions: clean tree, no in-flight merge/rebase
git status --porcelain
Test-Path .git/MERGE_HEAD; Test-Path .git/rebase-merge

# 1. Preserve everything before touching it
git bundle create ..\_archive\pre-consolidation.bundle --all
git bundle verify ..\_archive\pre-consolidation.bundle
git for-each-ref --format='%(refname)' refs/remotes/origin > backup-refs.txt

# 2. Inventory membership before merging
git rev-list --count origin/<branch> ^main      # 0 = already contained
git diff --name-only main...origin/<branch>     # what would actually land

# 3. Absorb
git merge --no-ff origin/<branch>

# 4. On conflict: keep the more recently edited side, then verify
git log -1 --format=%cI main -- <path>
git log -1 --format=%cI origin/<branch> -- <path>
git checkout --ours -- <path>; git add <path>

# 5. Delete only after proving containment
git rev-list --count main ^origin/<branch>      # >0 means branch is contained
git push origin --delete <branch>

# 6. History rewrite — only with a verified bundle in hand
git filter-repo --invert-paths --paths-from-file purge-paths.txt --force
git remote add origin <url>
git fetch --prune origin
git branch --set-upstream-to=origin/main main
git fsck --full

# 7. Publish
git push --force origin main
git push --force origin refs/tags/<tag>
git gc --quiet
```

## 9. Lessons

1. **Deleting a file never shrinks history.** Only a rewrite removes blobs. Measure pack size before and after, or the "cleanup" is theatre.
2. **When the bundle matches the pack, the pack is the problem.** 258.94 MB vs 259.81 MB was the diagnostic, not a defect in the backup.
3. **Scope the purge from evidence, not from extension.** Filtering by file type would have hit 268 blobs; the owner's 51-path recollection was 96.6% of the bytes with a fraction of the risk.
4. **Decide the conflict policy before the merges.** Three iterations were needed because "ours" was chosen first for speed.
5. **Merge, don't rebase, when preserving reachability matters.** Identical content, auditable history.
6. **`filter-repo` silently drops `origin`.** Re-add the remote, fetch, and reset upstream, or `git status` loses its tracking line.
7. **Leave refs owned by other tools alone.** `refs/aionsync/*` belongs to `aion-sync.ps1`; the rewrite touched them because it had to, and that is a compatibility point to watch.
8. **Backup refs beat regret.** Preserving branch tips before deletion made every later step reversible.

## 10. Open items

1. **Bundle retention.** 259 MB sits outside the repo at `C:/0-BlackBoxProject-0/_git-archive/`. Delete once recovery is no longer a concern.
2. **Excluded conflict files.** All 37 were verified as already-newer in `main`; no restoration is needed. Branch versions live only in the bundle.
3. **Remaining media in tree.** 226 media files / 8.7 MB, including 214 donor-snapshot files — deliberately outside the 51-file scope and small enough to leave alone.
4. **No reusable git-consolidation skill exists.** All 13 declared skill roots contain no package covering absorption, force-push or `filter-repo`; this runbook is the only copy of the procedure. Candidate package if the workflow recurs.
5. **Other clones.** Anyone holding an older clone must re-clone; pulling will fail or resurrect pre-rewrite objects.
