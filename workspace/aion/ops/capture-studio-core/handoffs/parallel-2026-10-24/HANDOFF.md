# AION C1 — generic webapp harness core runtime bridge

**Supplier lane:** Core C1, 2026-10-24. **Status:** executable / offline-tested integration candidate; **NOT installed** into Capture Studio, Z.ai's 23 patches, Chrome, Windows, or an authenticated provider.

## Provenance and precise source

- Repository: `owenservera/aion`, base `main` **`fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9`** (GitHub read, 2026-10-24 16:28:45Z). Supplier branch `c1-core-webapp-harness-20261024`, produced as a separate commit with non-force branch update. **Resulting commit SHA:** inspect this branch's final verified GitHub HEAD/associated release receipt; a Git commit cannot contain its own hash. A final commit SHA is included in the external GitHub handoff receipt.
- Worktree path: `workspace/aion/ops/capture-studio-core/handoffs/parallel-2026-10-24/`.
- Exact Git blob SHAs, independent of commit metadata:
  - `core-runtime-bridge.mjs`: `728d28b8d3d7305f014fb7b41e04a1fa6bb9fc06`
  - `core-runtime-bridge.test.mjs`: `83007162f40a2ff1fdda07c04a79eb23c2fda1df`
  - `offline-fixture.mjs`: `1f18776c29aa589194ae3edfa3f356af5727b723`
- File contents contain no cookies, credentials, .env, private transcripts, provider requests or embedded secrets. No browser driver/dependency imports.

## Node 22 entrypoints and schemas

`core-runtime-bridge.mjs` exports:

```js
export const BRIDGE_SCHEMA = 'aion.webapp-harness-core/1';
resolveAttachment({adapter,page,resolved}) -> Attachment;           // pure, throws coded errors on invalid source/scope
capabilityTruth({attachment,feature,staticHint,pageProbe,ownerEffectProof}) -> CapabilityTruth;
effectBoundary({attachment,capability,tool,requestedEffect,preflight,lease,journal,owner}) -> AdvisoryBoundary;
reconcileLifecycle({run,stepKey,journal,binding,baseline,origin,attachment,
                   reconcileUncertainStep,capture,acceptance,goal}) -> Lifecycle;
```

All objects are plain JSON-serializable projections. The `page` and all evidence/journal objects MUST be produced/verified **inside existing Capture Studio**; this package is not a producer, decoder, authenticity checker, or trust boundary for arbitrary HTTP caller input. `adapter.kind = 'seed' | 'learned-read-only'`; `page` carries exact `targetId`, `siteId`, `surface`, canonical HTTPS `origin`, URL, capture ref, monotonic sequence and observed timestamp. `resolved.{conversation,task,branch,generation}` slots must carry native opaque ID + explicitly qualified source; missing/unproven slots are `unverified`. `browserAttachment` is never the conversation ID. ChatGPT `/c/<uuid>` remains a registered provider-native specialization, not a fallback for other webapps.

`capabilityTruth` differentiates `static-hint`, `page-observed`, `verified-action` with `supported`, `unavailable`, `unverified`. Neither selector nor capability projection sets `sendAuthorized`. `effectBoundary` returns `deny`, `read-only-consumer`, or **`defer-to-studio` only**; every decision has `dispatch:false` and `retryAuthorized:false`. `defer-to-studio` indicates advisory predicates but **does not authorize** a send. All dispatch/admission/replay/recovery stay under the canonical Studio runtime, lease, browser actor, journal and run store.

`reconcileLifecycle` emits **six independent statuses**: delivery, replyAttribution, networkTerminal, captureFinalized, acceptedEvidence, userGoal; plus the Round 7 effect verdict. Unknown unresolved effects remain fenced. Explicit baseline source identities and exact `run/step/tool/argsDigest -> trusted-pre-effect intent binding -> journal turn/thread/payloadDigest` are required before marking fresh delivery or attributed reply. Duplicate historical assistant ID, stale sequence, wrong origin/thread/target/payload, conflicting effect proof all abstain. `acceptedEvidence` additionally requires all G1–G7 from verified existing acceptance producer and non-synthetic evidence class; goal is **never implied** by acceptance. The presence of a `source`/`integrity` string is not cryptographic proof; only invoke with already-verified internal snapshots.

`offline-fixture.mjs` exports `scenario(siteId='unknown-lab', registered=false)` and `exercise(...)`; as a CLI, emits two JSON cases with `SYNTHETIC_TEST` and `liveAcceptance:false`. It deliberately demonstrates synthetic delivery/reply/capture stages while keeping accepted evidence and user goal **unknown**, not falsely accepted.

## Tested commands, actual results

```sh
node --version                     # v22.16.0
node --check core-runtime-bridge.mjs
node --check offline-fixture.mjs
node --check core-runtime-bridge.test.mjs
node --test core-runtime-bridge.test.mjs  # 29 pass / 0 fail / 0 skipped / 0 TODO
node offline-fixture.mjs                 # JSON: unknown + registered, both liveAcceptance=false
```

Execution environment: isolated Linux container, offline, no browser/Windows/Chrome. Source code passes Node 22 syntax and 29 adversarial assertions. This does NOT retest Z.ai's proposed 23 patches, the product suite, or authenticated providers; no real G1–G7 accepted capture is claimed.

## Integration into existing Studio: exact destination seams

1. On the integrator's **reconciled** source branch, copy only `core-runtime-bridge.mjs` to the existing product path `src/studio/core-runtime-bridge.mjs`; copy the test to `test/unit/core-runtime-bridge.test.mjs`, updating the test's relative import `./core-runtime-bridge.mjs` to `../../src/studio/core-runtime-bridge.mjs` (and fixture path accordingly, or keep the three supplier files co-located under tests). The easiest reproducible first pass is to run this entire supplier directory as-is without copying.
2. In `src/capture/conversation-runtime.mjs`, consume `resolveAttachment` only where the existing selected site adapter has **genuinely resolved** an identity and Studio observed exact target+origin; do not make generic pages/unknown task routes appear bound. Keep `createConversationBrowserAdapter`, `acquireDriveLease`, `parseThread` and the original actor intact. `src/capture/conversation-thread.mjs` currently understands ChatGPT only: add provider-specific identity resolution behind existing `src/profiles/sites/index.mjs` selected adapter, keeping ChatGPT strict `/c/<uuid>` logic and unknown providers unverified.
3. In `src/studio/conversation-tools.mjs` and `conversation-api.mjs`, preserve registration, validation and the existing one runtime owner. Use `capabilityTruth` only for a **read-only** truth view. `effectBoundary` may be consulted as additional fail-closed diagnostics immediately before existing Studio-owned dispatch; do not branch on `decision:'defer-to-studio'` as permission, and do not create a new route, lease, CDP actor or effect executor. Existing `src/studio/integration-hub.mjs` remains the single producer/consumer surface.
4. Once Z.ai's 23 unmerged patches have been reviewed and safely integrated, connect C1's `reconcileLifecycle` as a read-only projection after effect/journal operations. Inject the actual Round 7 `reconcileUncertainStep` function (no copy/rewrite needed), the existing Round 6 `runs.get(runId)` snapshot (including `steps[].key/tool/argsDigest/status`) and **Round 9** `intentBindings.find({runId,stepKey})` output, verified with `intentBindings.verify(...)` and the journal owner's verified snapshot. The Round 9 store must be migrated cautiously (checksummed files; backup required); Z.ai integration owns the pre-effect binding lifecycle, not C1. Round 8 learned candidates only supply **data/read hints**; gate any shadow promotion through Round 9 holdout isolation.
5. Fetch observed pre-submit assistant identity baseline from the **existing** browser adapter before dispatch. Pass `baseline = {origin,targetId,captureRef,sequence,conversationRef,assistantIdentities}` with `captureRef/sequence` equal to the journal pre-send boundary. From the owning recorder/verifier only, pass `capture = {source:'studio-recorder',state:'finalized',sessionId,origin,reference}`, optional `acceptance = {source:'studio-acceptance-verifier',integrity:'verified',evidenceClass:'SAVED_REAL_CAPTURE'|'WINDOWS_LIVE_ACCEPTED',sessionId,origin,gates:{G1..G7:{state:'accepted',reference}}}`, and separately verified `goal`. Do not allow an API body to synthesize these fields. If no provenance or key is available, pass `null` and return unknown.
6. Confirm the narrow tests and full Studio unit/Chrome synthetic suites on the reconciled tree; then on owner's Windows local master test real NTFS lock/crash recovery and current Chrome target/identity. Real ChatGPT/Claude multi-turn reply/source attribution and independently accepted G1–G7 remain the final gate. Never bypass unknown effects with a new key.

## Deltas over Agent 14 Round 6–9 / collision decisions

- **Round 6** still solely owns run step admission, idempotency, in-flight locks and crash fencing. C1 is a pure consumer of the persisted run snapshot; it does not change run store or retry.
- **Round 7** is injected verbatim as the pre-effect-to-journal uncertain-step verdict; C1 projects fresh reply, network terminal, capture/acceptance/goal separately. Does not treat `executed` as final response.
- **Round 8** remains owner of synthesis/shadow candidate ranking; C1 interprets data-only learned adapters as read-only, never sends from a learned selector or invents a new adapter registry.
- **Round 9** remains owner of durable same-key intent bindings and independent holdout rejection. C1 requires exact binding fields and abstains on wrong/missing; it does not rewrite or auto-migrate the checksum-backed store.
- **Potential collision:** Z.ai's proposed `harness-api.mjs` and provider registry are still absent on observed GitHub main base. No blind patching of these unmerged files. Binding source producer, baseline reader and accepted-verifier snapshot adapters need work in Z.ai's reconciled product; C1 is the isolated pure compatibility layer.

## Failure matrix / rollback

| Negative case | Offline result | Owner consequence |
| --- | --- | --- |
| Unknown site, missing native ID/title-only | `unverified` | Read-only; no inferred target for effect |
| Wrong site/origin/target or stale capability probe | fail-closed / `unverified` | No dispatch |
| Learned selector, unknown tool, missing lease/journal/preflight | `deny`, `dispatch:false` | Existing actor remains unique |
| Missing or changed pre-effect binding, wrong thread/payload | lifecycle `unknown` | Keep run/journal fence; no resend |
| Old/duplicated/stale assistant reply identity | `replyAttribution:unknown` | Do not claim fresh response |
| Missing network terminal, capture or G1–G7 | independent `unknown` stages | Do not promote acceptance/goal |
| Synthetic G1–G7 and goal receipts | `unknown` acceptance/goal | Synthetic fixture never becomes live proof |

Rollback: remove `src/studio/core-runtime-bridge.mjs` and its optional pure call sites/tests only. The supplier modifies **no data directories or existing state**. If Round 9 persistence replacement is installed separately, backup and follow its own explicit migration/rollback plan first. No silent conversion of existing journal files.

**Handoff for Z.ai:** import these four files only after verifying supplier branch SHA and reconciling main, then wire pure projections behind the existing owner and execute the negative matrix. Report exact result commit, patched files, test counts and real-provider gaps; this supplier branch is not a merge request for the 23 outstanding patches.
