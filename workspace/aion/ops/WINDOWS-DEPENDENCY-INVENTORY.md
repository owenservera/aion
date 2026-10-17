# Windows Master — Repository & Dependency Inventory

Generated: 2026-10-17 (UTC dates below are the observation date)
Host: `OWNER_WINDOWS_MASTER`
Observed by: Windows Master Setup Agent, direct `git` queries on the owner machine.
Scope rule: **read-only inventory**. No repository other than `aion` was cloned, fetched, committed or modified by this bootstrap.

## Why AION alone is not the whole dependency surface

`aion` has **no `.gitmodules`** and **no declared git dependency on any sibling repository**. Its only
`package.json` (`workspace/aion/bff/zcode/package.json`) declares external npm packages (`ws`,
`socks-proxy-agent`). Sibling repositories are therefore **operational/coordination dependencies
referenced in prose and GitHub issues**, not build-time code dependencies. Cloning `aion` alone gives
you the AION canon, sessions, evidence and adapter — it does **not** give you the ACP, ZCode runtime,
PM inbox tooling, or the Chrome transport source.

This is why "AION cloned" must never be read as "AION fully bootstrapped".

## Inventory — all repositories are already cloned locally

Every repository below already exists as a local Git checkout on the owner machine. None required cloning.

| # | Repository | Remote | Local path | Branch | HEAD (short) | Working tree |
|---|---|---|---|---|---|---|
| 1 | `aion` | `owenservera/aion` (private) | `C:\0-BlackBoxProject-0\AION` | `main` | `62758cd` | 3 changed files (this bootstrap) |
| 2 | `001.PROJECTS.PM` | `owenservera/001.PROJECTS.PM` (private) | `C:\0-BlackBoxProject-0\001.PROJECTS.PM` | `main` | `22b1c38` | clean |
| 3 | `ACP` | `owenservera/ACP` (private) | `C:\0-BlackBoxProject-0\002.ACP` | `main` | `1adf989` | clean |
| 4 | `Product_Hub` | `owenservera/Product_Hub` (private) | `C:\0-BlackBoxProject-0\Product_Hub` | `main` | `6311cfd` | clean |
| 5 | `SOFTWARE_HQ` | `owenservera/SOFTWARE_HQ` (private) | `C:\0-BlackBoxProject-0\SOFTWARE_HQ` | `main` | `914aa3e` | 10 changed |
| 6 | `hq` | `owenservera/hq` (private) | `C:\0-BlackBoxProject-0\PC_HQ` | `setup/net-egress-w0` | `2e5d70d` | 6 changed |
| 7 | `machine-steward` | `owenservera/machine-steward` (private) | `C:\0-BlackBoxProject-0\pc\machine-steward` | `setup/net-egress-w0` | `d7b17d6` | 1 changed |
| 8 | `hermes-company-os` | `owenservera/hermes-company-os` (private) | `C:\0-BlackBoxProject-0\VTEAM\hermes-company-os` | `main` | `b3c2155` | 1 changed |
| 9 | `grokbot-telemetry` | `owenservera/grokbot-telemetry` (public) | `C:\0-BlackBoxProject-0\pc\grokbot-research\_repos\grokbot-telemetry` | `main` | `56510d0` | clean |
| 10 | `zcode-bots` | `owenservera/zcode-bots` (private) | `C:\0-BlackBoxProject-0\zcode-bots` | `main` | `4b6b0c6` | 17 changed |
| 11 | `zcode-pocket` | `owenservera/zcode-pocket` (public) | `C:\0-BlackBoxProject-0\zcode-pocket` | `main` | `7994686` | clean |
| 12 | `zcode-setup` | `owenservera/zcode-setup` (private) | `C:\0-BlackBoxProject-0\zcode-setup` | `main` | `ad4fb47` | 1 changed |
| 13 | `VOMEGA` | `owenservera/VOMEGA` (public) | `C:\0-BlackBoxProject-0\VOMEGA` | `main` | `dded272` | 23 changed |
| 14 | `ZCode` (upstream, 3rd party) | `zai-org/ZCode` (public) | `C:\0-BlackBoxProject-0\ZCode` | `main` | `29628c9` | clean |

## Sync coverage

**Covered by the new 5-minute scheduler: `aion` only.**

The other 13 repositories are **NOT covered** by automated sync. Reasons, stated rather than assumed:

- Several have **uncommitted local changes** (`SOFTWARE_HQ` 10, `hq` 6, `VOMEGA` 23, `zcode-bots` 17).
  Auto-committing those on a timer would publish another actor's in-progress work without review.
- `hq` and `machine-steward` are checked out on **`setup/net-egress-w0`**, not `main`. A scheduler
  pushing `main` assumptions would be wrong for them.
- `VOMEGA`, `hq` and `machine-steward` also exist as linked **git worktrees**; a naive sync of the
  parent path can collide with worktree state.
- Independent histories are deliberately kept intact. Nothing is vendored into `aion`.

Recommendation: extend coverage to a sibling repo only after that repo's own working tree is clean,
its branch is settled, and its owner accepts automated commits. That is a per-repo decision, not a
bootstrap default.

## Missing / inaccessible

| Name | Status |
|---|---|
| `owenservera/ACPX` | **404 — does not exist on GitHub.** ACPX source is a ZIP, never committed. |
| `owenservera/UAH`, `owenservera/IANG` | **404 — do not exist as repositories.** UAH coordination runs through PM issues. |
| `owenservera/ZCode` | **404.** The real ZCode is `zai-org/ZCode` (upstream vendor repo). |
| `acpx-kit.zip` | **Not present on disk.** Searched the workspace, `Downloads` and `%TEMP%`. STATE block `ACPX_SOURCE` stays `NOT_SHARED_IN_REPO`. |

All 13 inventory repositories are reachable with the current `gh` credential (`owenservera`, scopes
`gist, read:org, repo, workflow`). No private-without-access failures.

## Pre-existing sync system (not touched)

`C:\0-BlackBoxProject-0\.gpm-sync\` is an older, separate system. It mirrors **only** `001.PROJECTS.PM`
as a bare repo and runs under scheduled task `GPM-Sync-Detect`. It is **unrelated to `aion`** and was
left untouched, per the instruction not to create a competing Git integration service. Its last
observed remote head for `001.PROJECTS.PM` was `9bd0082` while the local checkout is at `22b1c38`,
so that mirror is stale — but repairing it is out of scope for this bootstrap.