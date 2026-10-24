# Discovery-to-Read V1 — Implementation contract

## Source reality (24 October 2026)
- Generic site/profile selection already exists in `capture-studio/src/profiles/profiles.mjs`; its generic profile is useful for capture and discovery.
- The separate **writable site driver** lookup in `capture-studio/src/profiles/sites/index.mjs` enumerates known IDs. Learned read rules must not be loaded as writable drivers.
- `capture-studio/src/intel/discover.mjs` already discovers schemas/relations without provider assumptions.
- Agent14 Round8 already exports `synthesizeWebappAdapter` and `shadowEvaluateAdapter`; Round9 supplies `assertIndependentAdapterHoldout`.
- `capture-studio/src/capture/acceptance.mjs` binds rawDigest, domDigest and G1-G7. G1–G3 require conversation context; its verdict is not interchangeable with independent structural-read validation.
- `capture-studio/src/store/versioned.mjs` persists version snapshots and CURRENT, but does NOT implement cross-process atomic compare-and-swap.
- Z.ai's four-lane integration remains separate PR #77; source imports in this workbench target the already-existing Round8/9 files on main.

## Target read-only pipeline
1. Existing Studio produces original persisted capture (network, DOM, a11y if available), source identity, scope and integrity.
2. Studio-owned `lookupCapture(captureId)` reconstructs canonical immutable source binding from original server-side records: exact scope, raw/DOM digests, sequence range, family and lineage. Neither client JSON nor synthetic artifacts can attest to real original captures.
3. `qualifyObservation` compares the candidate source receipt to the original. It does **not** claim the capture is G1–G7 accepted.
4. `assertIndependentPartitions` rejects reused IDs, immutable capture lineage, acquisition families, raw/DOM copies and cross-account/origin contamination. Independent heldout is selected before candidate generation, from previously reserved source collections.
5. Existing `synthesizeWebappAdapter` compiles data-only candidate structure from qualified observations; `shadowEvaluateAdapter` and Round9 evaluate unseen captures. The extra workbench gate requires each requested read feature to be positively observed in every heldout capture.
6. Candidate stays preview-only until canonical Studio has a server-owned, persistent compare-and-save profile owner and a separate real-evidence production eligibility decision. A local synthetic result stays `fixture-only-preview` even when structurally correct.
7. Runtime reads try eligible learned rule only when a fresh current-page probe proves correct scope and identity; otherwise use seed. Write capabilities remain exclusively in existing Studio driver and journal.
8. Native events map to {scope, turnId,blockId,eventId,sequence,revision,op,kind,text,payload, evidence:{sid,seq}}. No text-based ID synthesis; preserve unknown kinds/native payloads and source revisions.
9. Drift produces a new proposal, not an implicit selector switch. Stable repeated real evidence, independent holdout and atomic profile CAS precede activation; maintain last-known-good rollback.
10. Accepted goal outcomes remain independent of network terminal, capture completion, UI projection or read validation.

## Three evidence distinctions
- ORIGINAL OBSERVATION: verified source binding; sufficient to discover structure and create candidates, not a passed conversation gate.
- VALIDATED READ: independent heldout source plus semantic correctness against trusted source-native truth; qualifies a **read-only** activation proposal under a new reviewed contract.
- ACCEPTED CONVERSATION + GOAL: existing G1-G7 evaluation and separately proven goal; never inferred from read coverage.

Do not weaken G1-G7 to bootstrap an unknown site. Define a separate structural read verdict with its own audited proof.

## Native object graph proposal
Conversation {origin, account, conversationId}; Turn {native id, role, parent/branch/generation when verified}; Block {native block id, type, revisions, stream events, opaque provider payload}; Citation {target, span, source}; Artifact {identity, version history}; ToolTask {invocation, progress, result}; Outcome {declared goal, evidence, independent result}. Unknown optional native fields stay opaque; no unauthorized HTML rendering.

## Integration contracts still missing
1. Trusted `lookupCapture` behind the existing Core acceptance/session producer. In production it must verify actual file integrity, lineage, scope and account/partition provenance, not honor a boolean.
2. Independently asserted semantic role truth from original accepted/proven provider traces; repeated selector presence does not by itself demonstrate that assistant/user attribution is correct.
3. New Studio-owned read-only CAS adapter persister with exclusive cross-process authority and versioned rollback.
4. Learned-read resolution in existing `profiles/sites/index.mjs` without altering its write/drive path.
5. Native-event producer with actual SID/seq IDs from saved streams and immutable turn identity, wired to U1 /chat.
6. Real live browser unknown-site replay and UI redesign acceptance, separate from this synthetic demo.

## Safety and ownership
No Playwright, Puppeteer, second actor, unverified send authorization, hidden automatic browser commands, network scraping bypass or secret-bearing fixture. No changes to main or the Z.ai integration branch without explicit coordination.

## Acceptance suite
Test 1: synthetic unknown site with 3 distinct train + 2 distinct heldout captures; candidate + preview. Test 2: trust failure, forgeries, copies and account-crossing refuse. Test 3: heldout missing/contradicted refuses. Test 4: native append/replace/close, opaque artifact and exact identity. Test 5: interface drift emits candidate with no profile activation. Production release only after original-source attestation, real-window replay and QA.
