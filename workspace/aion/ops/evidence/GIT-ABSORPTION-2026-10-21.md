# Git absorption — remote branch consolidation (2026-10-21)

Owner directive: everything not in `main` goes into `main`; conflicting files are excluded and assessed later. All open PRs closed.

## Result

| Item | Value |
|---|---|
| `main` before | `f1039bd` |
| `main` after | `1ec415b` |
| Remote branches | 25 → 0 (`origin/main` only) |
| Local branches | 1 (`main`) |
| Worktrees | 1 (`C:/0-BlackBoxProject-0/AION`) |
| Open PRs | 0 |

## Merge rules applied

1. Branch already contained in `main` → skip.
2. Clean merge → merge commit (`--no-ff`).
3. File-level conflict → merge everything else, keep `main`'s version for conflicting paths, and record the excluded paths below.
4. Branch that would delete live files → not auto-merged; handled per case.

## Branches merged, with conflicting files kept from `main`

### `bootstrap/aion-09-global-research-20261019` — 15 files excluded
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

### `harvest/external-browser-donors-20261020` — 5 files excluded
- `workspace/aion/ops/chrome-relay/harvest/external/02-REPO-PRIORITIZATION.md`
- `workspace/aion/ops/chrome-relay/harvest/external/reference/capability-universe.csv`
- `workspace/aion/ops/chrome-relay/harvest/external/sources.json`
- `workspace/aion/ops/chrome-relay/velocity/bin/aion-local.mjs`
- `workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md`

### `track-b/velocity-command-plane-20261019` — 2 files excluded
- `workspace/aion/ops/chrome-relay/velocity/AGENTS.md`
- `workspace/aion/ops/chrome-relay/velocity/README.md`

### Merged with no conflicts
`cleanup/donor-snapshots-media-20261020`, `design/agent-fabric-20261020`, `harvest/crosswalk-20261020`,
`harvest/omega-github-20261020`, `harvest/vivim-final-github-20261020`, `harvest/vomega-semantic-cli-20261020`,
`integration/command-space-p0-final-20261020`, `integration/harvest-crosswalk-synthesis-20261020`,
`integration/harvest-research-snapshots-20261020`, `track-b/strategic-capability-roadmap-20261020`,
`harvest/external-custody-20261020`, `review/principal-architect-20261020`.

### Already contained in `main` (branch was an ancestor)
`integration/i1-watch-20261020`, `track-b/implementation-rounds-20261019`,
`harvest/external-custody-20261020-chatgpt`, `track-b/platform-local-candidate-20261020`.

### Redundant content, deleted after verification
`feature/command-space-p0-provider-research-20261020`, `feature/command-space-registry-20261020`,
`integration/command-space-p0-additions-20261020`, `integration/harvest-catalog-20261020`,
`structure/main-trackb-harvest-20261020`, `wip/native-transport-first-attempt`
— zero files absent from `main` at merge time.

## PRs closed

| PR | Branch | Outcome |
|---|---|---|
| #46 | `track-b/platform-local-candidate-20261020` | closed |
| #35 | `design/agent-fabric-20261020` | auto-marked merged once commits landed in `main` |
| #34 | `track-b/implementation-rounds-20261019` | closed |
| #33 | `track-b/velocity-command-plane-20261019` | closed |

## Conflict rule: most recent edit wins (verified)

Owner rule: on conflict, the most recently edited version governs. Method: `git log -1 --format=%cI <ref> -- <path>` for `main` vs the absorbed branch ref.

| Group | Files | Branch last edit | `main` last edit | Winner |
|---|---|---|---|---|
| `track-b/windows-integration-20261020` | 15 | 2026-10-19 21:09 – 2026-10-20 12:15 | 2026-10-20 23:18 – 2026-10-21 12:03 | `main`, all 15 |
| `bootstrap/aion-09-global-research-20261019` | 15 | 2026-10-19 17:48 | 2026-10-21 11:34 – 14:27 | `main`, all 15 |
| `harvest/external-browser-donors-20261020` | 5 | 2026-10-20 13:42 – 15:48 | 2026-10-20 18:33 – 2026-10-21 12:03 | `main`, all 5 |
| `track-b/velocity-command-plane-20261019` | 2 | 2026-10-19 22:30 | 2026-10-20 00:10 / 15:00 | `main`, both |

Result: every excluded file already carried the more recent version in `main`; no file needed to be restored from a branch. Earlier `--ours` resolutions coincide with the edit-date rule.

## Open assessment items

1. The excluded files above keep `main`'s version. Branch versions remain recoverable only from `refs/aion-absorbed/` (see below) and the remote reflog — the remote branches themselves were deleted.
2. `harvest/external-custody*` and `harvest/external-browser-donors` carried ~20-23 files that did not exist in `main` under the same paths before absorption; confirm after the fact that these landed through the merged branch content rather than being superseded renames.

## History purge — donor media (2026-10-21)

The `cleanup/donor-snapshots-media-20261020` branch had deleted 51 donor media files in the tree, but their blobs remained in every earlier commit and held 241.5 MB of the object database.

Command:

```powershell
git filter-repo --invert-paths --paths-from-file purge-paths.txt --force
```

| Measure | Before | After |
|---|---|---|
| Pack size | 259.4 MB | **20.1 MB** |
| Commits parsed | 1,353 | 1,353 (rewritten) |
| `main` SHA | `55325c6` | `c0732fe` |
| Tag `canonical-2026-10-19` | `55cc03a` | `aaef828` |

Verification: `git fsck --full` clean, 3,562 tracked files, local `main` == `origin/main` after force-push. Everything except the 51 media paths is byte-identical.

## Recovery

- Pre-rewrite archive (full history, all original SHAs): `C:/0-BlackBoxProject-0/_git-archive/aion-pre-cleanup-2026-10-21.bundle` (258.94 MB, `git bundle verify` = okay).
- Clone from it with `git clone aion-pre-cleanup-2026-10-21.bundle <dir>` to recover any object from before the rewrite.
- Post-rewrite refs are the live ones; no `refs/aion-absorbed` refs remain.
