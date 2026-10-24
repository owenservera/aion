# AION Agent 14 — Four-lane parallel supplier campaign, 2026-10-24

**Status: PROMPTS PREPARED — FOUR AGENTS NOT LAUNCHED; NOT YET A FINISHED Z.ai BUNDLE.**

**User goal:** Before next Z.ai integration round, run Core, UI, Intelligence and Systems in parallel; then consolidate into one massive updated integration bundle for Z.ai. Use existing GitHub task/collaboration surfaces and current main without parallel competing systems.

## Architecture invariant
One generic AION harness + one Capture Studio Chrome/CDP actor and evidence store + automatically learned/versioned/repaired webapp-specific data adapters. No second browser actor, new permanent registry or provider API substitution.

## Source frontier
At plan creation GitHub main was `197a036f7d0258d2511ff030f5bdc90e25766b2d`. The latest owner-supplied Z.ai TAR was reported as 23 unmerged patches, proposed head `23185932` on `e652a705`; do NOT label these source patches merged until verified. Agent14 ready suppliers: [Round6](../../implementations/round6/README.md), [Round7](../../implementations/round7/README.md), [Round8](../../implementations/round8/README.md), [Round9](../../implementations/round9/README.md). These are separate from canonical integrated runtime.

## Independent launch prompts
- [C1 Core](01-CORE.md): generic runtime/identity/effector/evidence contracts and code.
- [U1 UI](02-UI.md): adapter-aware unified /chat components and native-content rendering.
- [I1 Intelligence](03-INTELLIGENCE.md): automatic evidence-driven adapter creation, held-out validation, drift and versioned repair.
- [S1 Systems](04-SYSTEMS.md): independent benchmark/negative fixture pack, 5 highest-impact bottlenecks and integration map.

## Supplier outputs (fill only after verifying actual commits)
| Lane | Intake GitHub path | Branch/commit | Tests & evidence | Integration status |
| --- | --- | --- | --- | --- |
| C1 | `workspace/aion/ops/capture-studio-core/handoffs/parallel-2026-10-24/` | PENDING | PENDING | Not started |
| U1 | `workspace/aion/ops/capture-studio-ui/handoffs/parallel-2026-10-24/` | PENDING | PENDING | Not started |
| I1 | `workspace/aion/ops/capture-studio-knowledge-learning/handoffs/parallel-2026-10-24/` | PENDING | PENDING | Not started |
| S1 | `workspace/aion/ops/capture-studio-systems/handoffs/parallel-2026-10-24/` | PENDING | PENDING | Not started |

## Consolidation contract — for Agent 14 on a new explicit user request
1. Refresh GitHub main and each supplier branch; inspect actual files, tests, inputs, git parent, changed source and latest Z.ai source bundle available in that turn; no inferred agent acknowledgements.
2. Freeze one source SHA per lane; de-duplicate and reconcile clashes between modules/schemas and Agent14 Round6–9. Reject secret-bearing artifacts and unverified runtime claims.
3. Construct a single reproducible integration bundle (source packages, minimal patches/import map, JSON contracts/fixtures, test manifests, evidence, integration order and migration/rollback). Keep original lane evidence and separate what was actually executed from source claims. Do not create new parallel runtime.
4. Replay integrated synthetic tests offline where tooling/source allow; preserve residual failures/open Windows and authenticated provider gaps. State every not-run check.
5. Publish sanitized bundle and SHA256 manifest to an Agent14 coordination folder in the AION repository, commit and verify GitHub remote readback. Z.ai then pulls it and decides safe product integration. Do not claim automatic agent activation from publication.

## Shared rules
Each agent produces runnable code/tests and one concise HANDOFF.md with SHA, entrypoints, test commands, evidence class, dependencies, changed files, import wiring, pending full-suite/Windows/provider acceptance. Work safely in a distinct lane; avoid concurrent edits to canonical Studio source while Z.ai's 23 patches remain unmerged. No Playwright/Puppeteer/Orca, paid APIs or private transcripts in Git.

This manifest is a **future intake plan**, not the compiled bundle and not a commitment to background execution.