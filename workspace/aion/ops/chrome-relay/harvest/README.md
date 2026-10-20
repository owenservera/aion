# AION — authoritative branch and harvest layout

## Authority

- **`main`** is the sole integrated AION baseline. The nine external donor source **snapshots** are under [`harvest/external/landing/donors/`](external/landing/donors/). Donor application code is reference material, not executable AION runtime.
- **`track-b/implementation-rounds-20261019`** is the existing Track B implementation lane; **`track-b/platform-local-candidate-20261020`** is its current candidate, [PR #46](https://github.com/owenservera/aion/pull/46). It remains draft and is **not** accepted as production by virtue of existing.
- **Track B is the active build path.** Both harvest components inform its capability model and implementation; neither is a separate product or a prerequisite to finish all research before building.
- **Omega / VIVIM harvest** is the established capability-research corpus already informing Track B: source cards, the 65-record crosswalk and capability-register inputs. Keep using this work; do not restart it or confuse it with the nine-repo capture.
- **Nine-repo external harvest** has completed phase-one source capture and custody. The snapshots are already on `main`; deeper capability triage and adoption are not established by cloning. Do not re-clone or re-import them as a consolidation step.
- Research maturity and runtime acceptance are separate: a research capture, registry row or evidence card is not execution authority.

## Current source of truth

1. Integrated, reviewed runtime: [`main`](https://github.com/owenservera/aion/tree/main).
2. Track B candidate and validation gates: [PR #46](https://github.com/owenservera/aion/pull/46).
3. External donor snapshots: [nine source directories](external/landing/donors/), imported by [PR #54](https://github.com/owenservera/aion/pull/54) and trimmed by [PR #55](https://github.com/owenservera/aion/pull/55).
4. External donor canonical catalog: [source manifest](external/sources.json), [reference tables](external/reference/), [triage guide](external/02-REPO-PRIORITIZATION.md) and [evidence protocol](external/03-EVIDENCE-AND-PROMOTION.md), integrated via [PR #57](https://github.com/owenservera/aion/pull/57). Old scaffold [PR #52](https://github.com/owenservera/aion/pull/52) closed as superseded; custody receipts [PR #53](https://github.com/owenservera/aion/pull/53) merged in the external harvest branch.
5. Crosswalk evidence: [PR #41](https://github.com/owenservera/aion/pull/41) (merged into Track B implementation, not main); source capture branches: [PR #37](https://github.com/owenservera/aion/pull/37), [PR #40](https://github.com/owenservera/aion/pull/40), [PR #42](https://github.com/owenservera/aion/pull/42). These remain distinct research until adoption.

## Working order (owner direction, 2026-10-20)

1. **Build on Track B candidate #46**, using its existing `velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md` for current build order. Keep `main` as the integrated baseline; development priority does not imply live acceptance.
2. **Use the established Omega / VIVIM corpus now** through `harvest/landing/synthesis/` on Track B. Disposition useful capabilities into the build rather than opening another parallel registry or restarting research.
3. **Treat the Command Space registry from merged PR #47 and draft expansion #51 as supporting catalog work**, not a competing development lane or a gate ahead of Track B.
4. **Advance the nine-repo harvest only for concrete build needs.** Reuse the snapshots and canonical manifest/reference tables on `main`, with custody records from #53. The superseded clone-first scaffold PR #52 is closed.
5. **Consolidate accepted changes into `main`, then retire superseded PRs/branches after checking unique work.** Do not merge every stacked PR merely to reduce the open count. Keep local tracking refs synchronized with remote; preserve local-only work until accounted for.

Manage this through ordinary prompts, existing PRs and this guide: no new board, registry, automation or planning-document set.

## Simplification rule

Integrate only the latest accepted source **snapshot** and essential working docs into `main`. Do **not** bulk-merge historical harvest branches into `main`, flatten Track B into unvalidated runtime, or rewrite Git history to recover space. Keep original upstream hashes and histories available via Git refs rather than storing redundant vendor history in AION. Temporary branches may be deleted **only after** their unique work has been integrated or explicitly retired.

No Playwright or Puppeteer in AION project work.
