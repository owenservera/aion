# Discovery-to-Read V1 — integration handoff (NOT an integration instruction to run concurrently)

## What exists now
- Independent source-qualified observation receipt and hard train/heldout lineage gate (`src/evidence-receipts.mjs`).
- Exact native source-event, revision and opaque artifact read model (`src/native-projection.mjs`).
- Executable replay caller of **existing** Agent14 Round8 and Round9 (`src/workbench.mjs`).
- Fictional unknown-site five-capture fixture and Node22 tests. A positive synthetic fixture returns `fixture-only-preview`, never an active provider adapter.
- GitHub-source V8 contract smoke runner: 21/21 tests passed in a non-Node shim on 2026-10-24. **Node22 suite, production source, browser and Windows have not been run.**

## Required runtime dependencies — deliberate blockers
1. **Trusted original source:** implement `lookupCapture(captureId)` on the canonical Studio server only. Reload original saved session; use source-integrity verification, immutable raw/DOM digests, sequence range, account/origin and acquisition lineage. Return `{verifiedOriginal:true,scope,source,evidenceClass}` only on genuine proof. Never accept caller-supplied `verifiedOriginal` at face value.
2. **Ground truth:** derive role/citation/artifact semantics from independently accepted native evidence. A candidate selector repeated in heldout observations is not automatically evidence of correct interpretation.
3. **Store authority:** existing VersionedStore lacks cross-process CAS. Build one Studio-owned serialized version publisher. Learned read proposals may not bypass it.
4. **Runtime activation:** use the existing read path and preserve site-specific writable adapter lookup and Core actor. A fresh on-page scope/identity probe is required for read selection.
5. **Native feed:** the producer must mint and verify exact turn/block/event IDs and SID/sequence from original source, not from matching text or browser tab names.
6. **UI:** pass only verified event projections to the existing `/chat` U1 mount, and present versions/drift as read-only visibility.
7. **Real proof:** run a genuinely unknown provider observation and a simulated update; archive original captures and accepted evidence. G1–G7 acceptance and goal fulfillment remain separate.

## Exact offline instructions
- Checkout initiative branch or this folder from an eventual merged PR.
- Run Node >=22 `npm test` and `npm run demo` from `workspace/aion/initiatives/discovery-to-read-v1`.
- Run broader Agent14 Round8/9 and consolidated four-lane tests after Z.ai reconciles its 23 patches.
- Do not install the fixture or provisional adapter into Studio; its origin is explicitly `https://novel-chat.invalid`.

## Non-overlap / sequencing
Current Z.ai integration PR #77 owns production merge and local reconciliation. This is a separate additive branch; it should be reviewed as an independent data-only initiative, not cherry-picked into an unverified Z.ai patchset. Prefer landing the workbench independently, then wiring its two missing production seams only after the one-owner Studio baseline is verified.

## Acceptance state
- Pure contract replay: V8-shim 21 passed / 0 failed (not Node22; reproducible test suite committed).
- Real original-capture attestation: NOT IMPLEMENTED.
- Native real-website capture: NOT RUN.
- Production profile CAS/read activation: NOT IMPLEMENTED.
- Windows/Chrome unknown-site demonstration: NOT RUN.
- G1–G7 accepted reply and verified goal: NOT CLAIMED.


## Second-pass handoff — buildable seams

### Concrete entry points
- `createStudioSourceReader({sessionsDir,resolveTrustedIdentity})` — bound exact real saved session; returns `lookupCapture,mintReceipt`. Provide resolver from **existing trusted Studio run and account binding only**.
- `createDiscoveryIntake({sourceReader,extractProbes,readIndependentTruth,interpretCandidate})` — `evaluate({siteId,trainingIds,heldoutIds,requiredFeatures})` is the new one-call fixture/replay entrypoint. `extractProbes` must return `{source:{captureId,rawDigest,domDigest},probes}`. `readIndependentTruth` must never consume or echo the candidate selector under evaluation.
- `createProfileCasOwner({store:existingVersionedStore})` — proposeSave(name,dataOnlyPayload,expectedVersion), rollback(name,targetVersion,expectedVersion); **requires migration of all writers** to shared lock protocol first.
- `projectNativeEvents` — original source-grounded U1 read model; not a permission or verified G1–G7 claim.

### Tests
The repo provides `npm test` (now 62 `node:test` cases) and `npm run demo`. GitHub-source V8 shims passed 62/62; **neither Node22 actual execution nor Windows/NTFS/browser verification was run**. The CAS 10 cases used an in-memory FS shim and do not prove real filesystem locking/crash behavior. Keep this PR draft.

### Non-negotiable production blockers
1. Trusted original source/account/acquisition lineage reader (currently source adapter demands it, but does not create it).
2. Truly independent original-native semantic reference producer.
3. Retarget every live profile write/rollback path to a common single-owner CAS protocol; perform crash/restart/NTFS durability tests.
4. Z.ai's verified production reconciled baseline and QA for unknown-site capture, learned-read fallback, identity and fresh reply.
