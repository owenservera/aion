# AION — authoritative branch and harvest layout

## Authority

- **`main`** is the sole integrated AION baseline. The nine external donor source **snapshots** are under [`harvest/external/landing/donors/`](external/landing/donors/). Donor application code is reference material, not executable AION runtime.
- **`track-b/implementation-rounds-20261019`** is the existing Track B implementation lane; **`track-b/platform-local-candidate-20261020`** is its current candidate, [PR #46](https://github.com/owenservera/aion/pull/46). It remains draft and is **not** accepted as production by virtue of existing.
- **Harvest research** stays in separate, source-pinned lanes until validated. A research capture, registry row or evidence card is not runtime authority.

## Current source of truth

1. Integrated, reviewed runtime: [`main`](https://github.com/owenservera/aion/tree/main).
2. Track B candidate and validation gates: [PR #46](https://github.com/owenservera/aion/pull/46).
3. External donor snapshots: [nine source directories](external/landing/donors/), imported by [PR #54](https://github.com/owenservera/aion/pull/54) and trimmed by [PR #55](https://github.com/owenservera/aion/pull/55).
4. External donor research scaffold: [PR #52](https://github.com/owenservera/aion/pull/52); custody receipts: [PR #53](https://github.com/owenservera/aion/pull/53).
5. Crosswalk evidence: [PR #41](https://github.com/owenservera/aion/pull/41) (merged into Track B implementation, not main); source capture branches: [PR #37](https://github.com/owenservera/aion/pull/37), [PR #40](https://github.com/owenservera/aion/pull/40), [PR #42](https://github.com/owenservera/aion/pull/42). These remain distinct research until adoption.

## Simplification rule

Integrate only the latest accepted source **snapshot** and essential working docs into `main`. Do **not** bulk-merge historical harvest branches into `main`, flatten Track B into unvalidated runtime, or rewrite Git history to recover space. Keep original upstream hashes and histories available via Git refs rather than storing redundant vendor history in AION. Temporary branches may be deleted **only after** their unique work has been integrated or explicitly retired.

No Playwright or Puppeteer in AION project work.
