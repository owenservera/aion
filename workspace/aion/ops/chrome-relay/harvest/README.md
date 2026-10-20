# AION — Harvest reference and research layout

**Repository-wide governing policy:** [REPOSITORY-GOVERNANCE.md](../../../../../REPOSITORY-GOVERNANCE.md). This page is a source/evidence guide, not a separate branch policy.


## Development ⇄ Harvest / Research delivery

**[Shared contract](EXCHANGE.md) · [Live NEED/OFFER/GAP/DECISION exchange](EXCHANGE.jsonl)** — both Development and Harvest publish the same fields and `topic` IDs on `main`. Harvest lanes keep detailed internal cards and offer one concise, evidence-linked decision to Development; Development exposes present and future needs with acceptance checks. No new parallel dev branches, registries or issue-per-card system.

- Omega/VIVIM: [existing synthesis and prioritized recommendations](landing/synthesis/integration-queue.md).
- VOMEGA: [semantic CLI retention assessment](landing/sources/vomega/RETENTION-ASSESSMENT.md).
- Nine external repos: [lane-owned triage and delivery](external/DELIVERY.md) (**code-level triage pending**).
- Internal research/command paths: [AION Command Space](../../command-space/) and current `velocity/research/`.

**Development target and priorities:** [master map](../DEVELOPMENT-MASTER.md) + [structured joins](../DEVELOPMENT-INDEX.json). The index points at source/evidence and exchange IDs, not a parallel queue. New present/future NEEDs AX-0007–AX-0015 are in the same exchange file.

## Authority

- **`main`** is the sole integrated AION baseline. The nine external donor source **snapshots** are under [`harvest/external/landing/donors/`](external/landing/donors/). Donor application code is reference material, not executable AION runtime.
- **Track B is the only continuing Development workstream on `main`.** Historical branches `track-b/implementation-rounds-20261019` and `track-b/platform-local-candidate-20261020` contain the outstanding draft [PR #46](https://github.com/owenservera/aion/pull/46), not a second permanent development line. Track A is deprecated.
- **Track B is the active build path.** Both harvest components inform its capability model and implementation; neither is a separate product or a prerequisite to finish all research before building.
- **Omega / VIVIM harvest** is the established capability-research corpus already informing Track B: source cards, the 65-record crosswalk and capability-register inputs. Keep using this work; do not restart it or confuse it with the nine-repo capture.
- **Nine-repo external harvest** has completed phase-one source capture and custody. The snapshots are already on `main`; deeper capability triage and adoption are not established by cloning. Do not re-clone or re-import them as a consolidation step.
- Research maturity and runtime acceptance are separate: a research capture, registry row or evidence card is not execution authority.

## Current source of truth

1. Integrated, reviewed runtime: [`main`](https://github.com/owenservera/aion/tree/main).
2. Track B candidate and validation gates: [PR #46](https://github.com/owenservera/aion/pull/46).
3. External donor snapshots: [nine source directories](external/landing/donors/), imported by [PR #54](https://github.com/owenservera/aion/pull/54) and trimmed by [PR #55](https://github.com/owenservera/aion/pull/55).
4. External donor canonical catalog: [source manifest](external/sources.json), [reference tables](external/reference/), [triage guide](external/02-REPO-PRIORITIZATION.md) and [evidence protocol](external/03-EVIDENCE-AND-PROMOTION.md), integrated via [PR #57](https://github.com/owenservera/aion/pull/57). Old scaffold [PR #52](https://github.com/owenservera/aion/pull/52) closed as superseded; custody receipts [PR #53](https://github.com/owenservera/aion/pull/53) merged in the external harvest branch.
5. **Harvest research on main:** [Omega, VIVIM Final, VOMEGA source snapshots](landing/sources/) merged via [PR #58](https://github.com/owenservera/aion/pull/58); [65-record crosswalk synthesis](landing/synthesis/) merged via [PR #61](https://github.com/owenservera/aion/pull/61). Old capture PRs #37/#40/#42 are closed as superseded; historical branches preserved. These are research, not adopted runtime code.
6. **Command Space supporting catalog on main:** [universal command space](../../command-space/) from PRs #47, #59, #60. P0 draft #51 is superseded after all nine files were SHA-verified on main.

## Working order (owner direction, 2026-10-20)

1. **Continue Development (formerly Track B) on `main`**, referencing the current accepted architecture and draft candidate #46 for unique, still-unvalidated work. Do not treat the historical Track B branch as the ongoing default or imply live acceptance.
2. **Use the established Omega / VIVIM corpus now** through `harvest/landing/synthesis/` on `main` and Track B. Disposition useful capabilities into the build rather than opening another parallel registry or restarting research.
3. **Treat the complete P0 Command Space catalog on `main` (PRs #47, #59 and #60) as supporting research**, not a competing development lane or a runtime capability gate.
4. **Advance the nine-repo harvest only for concrete build needs.** Reuse the snapshots and canonical manifest/reference tables on `main`, with custody records from #53. The superseded clone-first scaffold PR #52 is closed.
5. **Consolidate accepted changes into `main`, then retire superseded PRs/branches after checking unique work.** Do not merge every stacked PR merely to reduce the open count. Keep local tracking refs synchronized with remote; preserve local-only work until accounted for.

Manage this through ordinary prompts, existing PRs and this guide: no new board, registry, automation or planning-document set.

## Simplification rule

Integrate only the latest accepted source **snapshot** and essential working docs into `main`. Do **not** bulk-merge historical harvest branches into `main`, flatten Track B into unvalidated runtime, or rewrite Git history to recover space. Keep original upstream hashes and histories available via Git refs rather than storing redundant vendor history in AION. Temporary branches may be deleted **only after** their unique work has been integrated or explicitly retired.

No Playwright or Puppeteer in AION project work.
