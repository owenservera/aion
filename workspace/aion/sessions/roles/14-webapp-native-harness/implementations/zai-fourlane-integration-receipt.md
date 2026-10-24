# Z.ai Four-Lane Integration Receipt — PR #77 bundle → Capture Studio

**Date:** 2026-10-24 · **Integrator:** Z.ai Capture Studio session · **Evidence class:** OFFLINE-SUITE + STATIC-ANALYSIS (no Windows, no Chrome, no live provider in this sandbox)

## Source pins (verified before integration)

| Item | SHA | Verification |
| --- | --- | --- |
| Bundle branch `integration/agent14-four-lane-20261024` | `0986207e5262be55347a9b8519782a5a8e546a54` | fetched, checked out, read back |
| Base main | `fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9` | matches SOURCE-LEDGER `baseMain` |
| Supplier head core `c1-core-webapp-harness-20261024` | `3bbe8d9b…` | HEAD match |
| Supplier head ui `supplier/ui-u1-2026-10-24` | `d403e350…` | HEAD match |
| Supplier head intelligence `supplier/intelligence-i1-20261024` | `661a4e7e…` | HEAD match |
| Supplier head systems `systems/s1-2026-10-24-source-backed` | `0a6ecca…` | HEAD match |
| SHA-256 manifest | 28/28 digests recomputed, all match | OFFLINE-SUITE |
| SOURCE-LEDGER git blobs | 22/22 blob SHAs match supplier branches | OFFLINE-SUITE |
| Integration base (23-patch export head) | `23185932abc7615a25207111f07328ebfb2a0074` (= local `studio/short-writer-lease`) | reconciled: these ARE the "outstanding 23 patches"; Rounds 6–9 already integrated there |

## What was integrated (destination = canonical Studio)

- **C1 Core** `src/studio/core-runtime-bridge.mjs` (+32 ported tests, fixture in `test/unit/fixtures/offline-fixture.mjs`); `reconcileLifecycle` wired into the existing harness reconcile query (`harness-api.mjs` `reconcileStep` → `{ reconciliation, lifecycle }`), `reconcileUncertainStep` injected verbatim; unprovable provenance passed as `null` so the six stages report honest unknowns. `src/capture/thread-identity.mjs` adds provider-specific identity resolution (ChatGPT strict `/c/<uuid>` native-route) with fail-closed slots for unknown providers (+3 tests).
- **U1 UI** `src/studio/ui/universal-chat.mjs` (+43 ported tests), mounted ONCE inside the existing `/chat` shell under `#detailsBody` via a CSP-safe dynamic import (chat.mjs stays statically import-free so the vm-based offline UI tests keep compiling); inputs conservative: verified snapshot + open tab list only; every intelligence feed passes `[]` until its Core producer is verified; `onInspect` revalidates id against `S.snap?.id` before the existing read-only `reconcile()`; `/ui/universal-chat.mjs` served by the existing static branch.
- **I1 Intelligence** `adapter-capture-to-signals.mjs`, `adapter-evidence-intake.mjs`, `adapter-improvement-pipeline.mjs`, `adapter-studio-bridge.mjs` (imports relocated to PRODUCT Round 8 factory — byte-identical to supplier blob — and new product Round 9 gate) (+26 ported tests); NEW glue `src/studio/adapter-learning-pipeline.mjs`: trusted manifest provider (real `Session.open` + `readAcceptance` + recomputed raw/DOM digests; lineage minted from immutable content digests only), expected-version CAS wrapper over the SAME learned-adapter `VersionedStore` (single registry; exclusive cross-process lock file, stale locks fail closed), and a server-minted proposal ledger — HTTP promotion requires a digest minted in-process (`PROPOSAL_NOT_SERVER_MINTED` otherwise, verified live).
- **S1 Systems** `src/studio/systems-probes.mjs` (+32 ported tests); `qualifyHoldout`/`assessDrift` execute inside `createGuardedStudioLearner` (`four-lane-gates.mjs`) on every production propose.
- **Cross-lane gates** `four-lane-gates.mjs` (+8 ported tests) + `qualifyIndependentEvidence` executed before every guarded propose.
- **Round 9 store upgrade** `src/studio/intent-bindings.mjs` replaced with the checksummed, replay-safe Round 9 store (+12 guardrail tests). Migration: pre-Round-9 records lack the `integrity` digest and are therefore unreadable under the strict loader — they remain on disk untouched and reconciliation honestly classifies them `still_unknown` (fail-safe; no silent conversion). This upgrade also FIXES a real latent bug: harness step replay used to hit `INTENT_BINDING_EXISTS`; same-key same-intent replay is now read-only idempotent.
- **Routes** (hub, behind existing auth): `POST /adapters/intelligence/propose` (pure, mints proposal), `POST /adapters/intelligence/promote` (server-minted digest only), `POST /adapters/intelligence/rollback` (CAS), `GET /adapters/intelligence/proposals`, `POST /adapters/intelligence/read-selection` (diagnostic; registry stays the executable source of truth).

## Executed measurements (this sandbox, Node v24.21.0, Linux)

| Suite | Result |
| --- | --- |
| Compiled four-lane bundle suite (CONSOLIDATED, first-ever cross-lane run) | **141 pass / 0 fail** |
| Full Studio suite BEFORE integration (baseline `2318593`) | 1326 tests / 1325 pass / 0 fail / 1 todo |
| Full Studio suite AFTER integration | **1490 tests / 1489 pass / 0 fail / 1 pre-existing todo** |
| New integration tests (pipeline e2e, lifecycle projection, thread identity) | 11 pass / 0 fail |
| Server smoke (real `startStudio`): proposals/read-selection routes, forged promote refusal, U1 static module | verified live |
| `npm run fixture`, `npm run bench` (bundle) | executed; bench p50 7.59 ms / p95 8.78 ms for 20k-update bounded projection workload |

**Not executed (still outstanding):** Windows NTFS/crash-recovery acceptance, real Chrome two-turn attribution, live provider capture, G1–G7 on real captures (sandbox has no Chrome; I-gates remain owner-side). Everything above is OFFLINE-SUITE evidence.

## Remaining gaps (honest ledger)

1. **Attachment/baseline producers** — reconcileLifecycle's delivery/reply/acceptance stages stay unknown until the Studio records the pre-send assistant-identity baseline and recorder capture reference at dispatch time (module + seam delivered; producer wiring is the next increment).
2. **Account-scope corroboration** — saved sessions do not yet record account identity, so manifest `scope.account` is caller-asserted at the server route (same trust tier as existing `/adapters/learned/*` routes); per-account promotion gates stay abstained until sessions carry account provenance.
3. **Read-selection activation** — `resolveRead`/`selectReadRule` are exposed as diagnostics; wiring them into `getReadAdapter`'s learned precedence requires per-field provenance mapping (documented, not done).
4. **U1 intelligence feeds** — native block events, account index, adapter candidate view pass `[]` until their Core/Intelligence producers ship (per supplier HANDOFF).
5. **Live acceptance** — nothing here claims Windows/browser/provider acceptance; L5 remains owner-executed.

## Rollback

- Revert the integration commits on `studio/four-lane-integration` (each layer is a separate commit: supplier modules / Round 9 store / glue / receipt).
- U1: remove the dynamic-import block + `universalRender` call in `chat.mjs` and the `/ui/universal-chat.mjs` static branch (no migrations, no server state).
- Intelligence routes: remove the `if (learningPipeline)` block in the hub and the `createStudioLearningPipeline` construction in `server.mjs`; the learned-adapter store keeps only factory records.
- Round 9 store: restoring the previous `intent-bindings.mjs` is safe — Round 9 files are supersets on disk; old code ignores the `integrity` field. Never delete existing binding records; unresolved fences stay fenced.
- Raw evidence, journal, harness runs, learned adapters and all owner data are untouched by rollback.
