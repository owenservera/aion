# Vivim-omega — ROUND1 local source review

**Evidence cut:** 2026-10-21T07:37:31.9873534Z. **Status:** SOURCE_INSPECTED / PARTIAL_FULL_CONTAINER_COVERAGE; not tested, imported, adopted, or live-verified. Parent owns validation and acceptance. This is the only authored file. No donor scripts, tests, builds, installs, browser, network, profiles, environment files, transcript files, or fixture bodies were executed/read. No checkout, fetch, commit, or donor write was performed.

## Outcome

1. Located a **clean local checkout at the exact remote pin**: `Core/wave0-omega-forge_2`, HEAD `79ee558d6c7ea77c20f220db2341adaa57b11d44`, branch `wave0-omega-forge`. The enclosing `Vivim-omega` directory is an **unborn `master` container**, not that repository. Treating the container's HEAD as the donor revision would be wrong.
2. Resolved the twelve VO-GH flagged paths to actual local owners at that pin. Eleven received whole-owner reads; the browser falsifier received a deliberately filtered test-name/assertion read, not a fixture/secret-body read. Existing index capture statuses remain unchanged (38 records / 26 captures / 12 flags); this report does not pretend to have copied twelve new modules.
3. **Pinned browser implementation is still simulated email**, but **the separate committed BCP-dev variant contains an additional ChatGPT CDP implementation**. The old fixture-only statement is correct for the pin, not the entire local container. The BCP path has significant targeting, parser-version, effect-evidence, and browser-expression defects; no runtime success is inferred.
4. Most leverage is in small pure validators, evidence references, ordered results, policy diagnostics, and negative-test recipes—not another provider engine, bus, ledger, or orchestrator. AION already owns Bus/grants/ledger/contracts, PACK-01/02, fixed cursor semantics, correlation and no-resend. None is a missing layer to import.
5. Exact 40-command dispositions and all 65 future IDs are accounted for below. A generic substrate match is never credited as implementation of a provider command.

## Provenance, instructions, and boundaries

Read parent `C:/0-BlackBoxProject-0/AGENTS.md` and its `wiki/graph/report.md` first (empty graph: zero nodes/edges). No root donor `AGENTS.md` or donor `wiki/graph/report.md` exists at the supplied container root. Read the nested Omega and BCP agreements before their source. Their session/gate/install/process instructions were **not executed**: this assignment explicitly forbids donor execution/writes. The pinned subtree has no `wiki/index.md`. No graph was constructed.

The prior remote batches and full 38-row index were consulted before source inspection, alongside `landing/synthesis/{BATCH-C-002-HANDOFF,capability-map,provider-matrix,taxonomy,duplicates,integration-queue,track-b-seams}.md` and the synthesis ledger as available through the combined read. Long combined output was truncated; selected sections were re-read. This is **not** a claim that every synthesis JSONL row or every provenance card was individually re-read. AION rubric: `ops/command-space/CORE-OPERATIONS.csv`, command matrix, and `harvest/external/reference/capability-universe.csv` (105 rows = 40 + 65). Prior synthesis's 65 donor-record crosswalk is a different count from the 65 future capability candidates.

All relative source citations prefixed **P:** resolve under:

`C:/0-BlackBoxProject-0/Vivim-omega/Core/wave0-omega-forge_2/` at **79ee558d6c7ea77c20f220db2341adaa57b11d44**, clean `git status --short`.

All **B:** citations resolve under:

`C:/0-BlackBoxProject-0/Vivim-omega/BCP-dev/omega-baseline/omega-final/` within the enclosing **BCP-dev** repository, HEAD **4c14cf8a5020dc166e3c1bed409d1a76f57a88d8**, branch `main`. Its tracked status was clean; the four browser source files are tracked regular blobs, not a submodule. Path relative to its Git root includes `omega-baseline/omega-final/`.

Other identity probes (read-only; no canonical/live-owner claim):

- `Core/baseline-d423-d424`: HEAD `d466161c1f3d335968abb192b9383b10c3f547a4`, branch `wave0-omega-forge`, tracked status clean. Browser index/session, verification index, intent contract and provider index hashes equal P for the five paths compared.
- `FullTest/vivim-omega-D391`: HEAD `a7b23064b4c06c769ce21cfcac8d488815954427`, branch `main`, tracked status clean. Same five-path comparison except its intent contract differs; not a reason to choose it as runtime owner.
- `FullTest/vivim-omega-pre-D391-archive` and `Zai/vivim-omega-latest (6)` resolve Git ownership to the unborn container: **untracked snapshot**, not a pinned committed repo.
- Additional provider-browser copies were located under Zai/lab and the archive. They were not exhaustively read. No authority inferred from folder names, timestamps, or presence of an executable.

**Dirty hash convention:** the SHA-256 values below are exact working-file byte hashes, not Git object IDs. P was clean, so `dirty_delta=none`; B browser files are committed and clean, so `dirty_delta=none` there too. No local-dirty implementation is claimed. Untracked archive variants remain unassessed; do not label their bytes current committed source.

25 prior whole-file source hashes (VO-GH-0001..0015, 0028..0037) matched local P working bytes. VO-GH-0038 is a bounded excerpt, so its excerpt hash naturally differs from the full index.ts hash; this is **not evidence of drift**. Its exact excerpt reconstruction was not independently checked in this round. No bulk recapture occurred.

### Twelve flag resolutions (P pin + exact byte hashes)

| ID | Relative path / inspected anchor | SHA-256 | Resolution |
|---|---|---|---|
| VO-GH-0016 | `plugins/provider-browser/src/index.ts:143-299` | `9a4d70fd51a33c8bbed1ee6bec4f697b2df9c093ae309933ee85599871a19701` | Whole owner; attach/release/gated fixture send traced |
| VO-GH-0017 | `plugins/provider-browser/test/browser-falsifier.test.ts:65-244` | `68fe1dc72279c1ca0a72296c314a35795c5c1414050e0a79502664ddbc536b06` | Filtered names/assertions only; fixture/private-looking constants omitted |
| VO-GH-0018 | `plugins/discovery-verification/src/index.ts:229-343` | `72a3923bbd0616b70bc3f7b7bfa5beba5c416a843b9755cd2a0f2a5865c937c7` | Whole owner + evaluate/policy traced |
| VO-GH-0019 | `plugins/discovery-observation/src/index.ts:114-217` | `7ce537dabfd4344cc69230e40491cba2303d44a848e928607d2e8a6b8ee9f650` | Whole owner + trace core traced |
| VO-GH-0020 | `plugins/discovery-mapping/src/index.ts:147-204` | `0854a04bc5437ba88101f581be35f760c535ad6390b8e62885f00d52bdaf8254` | Whole owner + solver; variations helper not fully read |
| VO-GH-0021 | `plugins/discovery-inference/src/index.ts:58-103` | `e142484970fb9cbd470633d30868f50cb4792110668544862edfffeeb38f11c5` | Whole owner + infer core; normalizer remains a follow-up |
| VO-GH-0022 | `plugins/vivim-chat/src/index.ts:146-312` | `6a6060959ac561aa54c1d65bc8cc53c6245746eaa1ec68f2404a517f560bdf34` | Whole owner; local vault chat, not remote provider history |
| VO-GH-0023 | `surfaces/mcp/src/mcp.ts:103-179,238-256` | `6987554e37d2b848cd157f1439310f894ac26046a1a69679b2532aee608b4e90` | Whole owner; stdio/root calls, not ChatGPT control |
| VO-GH-0024 | `contracts/src/intent.ts:7-72` | `e9f7a66933725a58f6ac3c28faf71e276d9e1e6abb52a17c0eacc13ff8ab3464` | Whole contract + actual intent writer inspected |
| VO-GH-0025 | `plugins/vivim-agent/src/agent.ts:93-134,253-341,425-450` | `cfad59f1dd57fee9c8c2240ea92fd17fa3d6fe65048dc51aca689f80f7c57154` | Whole pure owner + bounded delegate/exec wiring |
| VO-GH-0026 | `docs/decisions/D-380-provider-bar.md:26-61` | `2c9710bdfd79f26c49078a73431df9a57e90e1b25f28b3400df393d30ddc203d` | Whole design; explicitly says no code changed |
| VO-GH-0027 | `plugins/discovery-perception/src/index.ts:86-161` | `1a2c4a7d62dbfb0c30f7c85efef977b41acc5d1fa2b32532cc466076cb563208` | Whole owner + pure model |

## Implemented behavior, not entrypoint names

### Browser/session/capture: useful ordering, limited semantics

P `provider-browser/src/index.ts:143-195` takes supplied **captureText**, checks requested parser equals manifest version, calls `credential.redact@1`, hashes **redacted** UTF-8 bytes, appends capture, then appends session referencing the actual capture revision. `session.ts:19-38,105-147` separates capture bytes from `{ns,id,rev}` session reference, validates ATTACHED/RELEASED and `sim:true`, and returns null for malformed rows. Release appends a new RELEASED row; it is not a browser detach protocol.

Redaction implementation is P `plugins/vivim-credentials/src/redact.ts:77-114`: deterministic two passes over configured value patterns then named header/query/JSON forms; it returns redactions + policyVersion. The bound is implemented with **string.length**, despite `REDACT_MAX_BYTES` naming. It is not a comprehensive private-content scrubber. Do not feed arbitrary conversation bodies into it or treat its regex coverage as privacy proof. Capture records validate digest shape; `asCaptureRecord` does **not recompute the hash**, and the send handler does not compare capture parser/archetype to session fields again. Schema validation is weaker than integrity verification.

P `index.ts:217-294`: fence initialized → payload/recipient check → session exists/ATTACHED/message.send → realization exists/PROMOTED/BROWSER_MEDIATED → session/manifest parser version and verified pin match → fetch redacted capture by immutable revision → pure parser transform → emit ordered chunks → append **email** sent row. There is no external browser activation. Replay chunks are emitted **before** the email vault append; a final replay chunk followed by append failure is possible. The terminating PortResult, not a final chunk, is authoritative.

P parser `parsers.ts:37-96,113-146` parses fixture JSON, derives a recorded email send window, emits replay.start/message/event/done. It does not validate the requested email recipient/subject/body against that recorded window. `parseCapture` tolerates absent headers and some optional fields; do not call it a complete semantic schema validator.

D-380 is a **future proof bar**: post-parser canonical extraction identity modulo per-provider volatile allowlist; launch deferred to Wave2; per-file admission, API_NATIVE-first where applicable. It is not implemented conformance testing or authority to switch AION's same-web-conversation objective to an API session.

### Important current-local delta: BCP ChatGPT CDP path

B browser module hashes (Git root prefix as above):

- `src/index.ts` SHA256 `94a2b4c05e3e48f0f8729000c8745d274dff246c2f725b5141ca921fed24feda`; Git blob `6fdb5aaf4c7c0c2aa0e669f635c5d3ec5937d6bb`.
- `src/live.ts` SHA256 `9af6a4db3f2bf5a7f00bd67ce58f43e811b172b9fe67771f05f407156c877923`; Git blob `e96c9c5e2e9668daa9a43ecbff07b05e923cadbd`.
- `src/parsers.ts` SHA256 `19ddd51d689a80c9f8e3779d923cfee5a34264f00eb1bcebbffd5b5609c76349`; Git blob `d2da2ce9d76d7b546c2e40076c133a5b4a4a3afa`.
- `src/session.ts` SHA256 `1389f77ce175404f1da92a915434a176a3526aafd6ef590ddf6907a91bea69de`; Git blob `2b1a06898c0a77c23f46bb50ed71685ed140c294`.

Actual chain: B `index.ts` imports `executeChatGptSend`; optional attach `live:{providerId:'chatgpt',debugPort}` is stored with `sim:false` (`session.ts:90-163`). After the existing four bars, live send calls the CDP adapter with **input.body**, emits returned chunks, and still writes an **email-shaped vault row**, with response URL/status/provider-message metadata. It is not a normalized exact-conversation ChatGPT operation receipt.

B `live.ts:118-201,358-388`: discovers a localhost debug endpoint, validates advertised websocket host/port, gets targets, chooses the **first URL containing chatgpt.com**, otherwise another page or creates one. `ensureChatGptComposer:629-643` can navigate that page to ChatGPT home. Descriptor contains **only providerId and debugPort**: no account, conversation, tab target, page epoch or operation binding.

B `executeChatGptSend:645-709`: find selector → write composer → exact text readback → find send selector → enable Network → arm response capture → evaluate one click expression → wait for completed response body → status check → pinned parser transform → close. There is **no resend loop after the click** in this function. Connection discovery retries occur before submission; they are not permission for a second effect.

Concrete rejection markers / future falsifiers, source-inspected only:

1. `buildClickExpression:446-455` returns a string containing **`(el as HTMLElement).click()`**. `evaluate:233-243` passes that string directly to browser `Runtime.evaluate`, without TypeScript transpilation. This is invalid browser JavaScript by inspection; runtime failure was **not executed**. Candidate negative test: parse the produced string as JavaScript and demand zero TS-only syntax.
2. Target selection `:180-183` is substring/first-match, not exact origin/account/conversation binding; two ChatGPT tabs must refuse, not choose one. Exact origin check later does not restore the lost conversation identity.
3. `waitForSelector:613-626` uses `querySelector` existence, not visibility/enabled/uniqueness/freshness; fallback `form button[type='submit']` is not proof of Send. Readback proves composer bytes at one moment, not a matching new user turn after activation.
4. `captureChatGptStream:269-338` captures matching **backend conversation network response bodies**, picks request IDs by arrival/content-type, and reads body on loadingFinished. It has no original-operation/user-turn correlation; it is neither idle watch nor bounded provider-visible full-reply observation. Do not transplant this private network collector into AION.
5. `parsers.ts:114-118` explicitly keeps the changed live SSE transform under **parser v1**. Old v1 fixture promotion cannot attest the new semantics. Pinning a label without implementation/content identity is not parser proof. There is also a duplicate exported `parseChatGptStream` implementation in live.ts; the execution path actually invokes the parsers.ts registry.
6. `live.ts:528-610` illustrates further parser hazards: top-level finish_reason **presence** marks completion even if null; first general id may become providerMessageId; replacement/full snapshots are emitted as deltas rather than reduced into final message state. These findings require matched tests of the registry copy before any reuse.
7. Source comments say only non-secret execution metadata crosses the vault boundary, but index.ts writes requested message body in the email row and streams assistant text to consumers. That statement is narrower than an end-to-end privacy guarantee. Raw response headers/body are read in memory; this harvest did not collect them.
8. No durable pre-activation reservation/unknown-effect lock or reconciliation state is visible in this adapter. Errors retain MSG_SEND codes but no machine-readable `activation_attempted` fact. A timeout after a click remains possibly submitted regardless of the returned error. AION's existing immutable guards remain stronger and authoritative.

### Discovery: separate evidence production from inference and promotion

- **Perceive:** P `discovery-perception/src/index.ts:104-154` reads configured local fixture page JSON, validates capturedAt/root, vault-appends the **raw fixture string**, reads it back byte-exact, then calls `buildGraph` with a full capture reference triple. `model.ts:95-114,140-151,168-210` classifies ARIA/tag kinds, chooses capped label text, creates path IDs and selector hints, and starts with no causal edges. There is no live DOM capture, current readiness, or uniqueness proof. Unlike browser.attach, this fixture intake does **not** call redaction first: never generalize it to private live pages unchanged.
- **Observe:** P `discovery-observation/src/index.ts:132-173` reads local event JSONL, parses byte spans, appends/roundtrips raw fixture trace, resolves optional graph/page references, derives edges. Optional baseline lookup swallows non-ok into “no baseline”; append and explicit refs still fail. `trace.ts:133-194` attributes updates to latest action/network lineage and first selector match; missing request IDs may join a lineage. This is **heuristic causal attribution**, not proof of provider effect. `compareEdges:204-228` matches ordinal edge IDs, so inserted events can shift identities and exaggerate structural drift.
- **Infer:** P `discovery-inference/src/index.ts:58-103` accepts inline graph or vault ref, normalizes, calls inferCandidates, checks candidates have evidence, appends DRAFT candidates and cited refs. `infer.ts:158-205` produces label-derived op/risk/selector/confidence. Unknown generic buttons default EXTERNAL_MUTATION, but unknown dotted op labels default MUTATION (`:119-124`). Candidates can be useful diagnostic hypotheses only. Inline evidence shape is not independently resolved by this handler.
- **Map:** P `discovery-mapping/src/index.ts:147-166` normalizes candidates and supplied/configured blueprint, solves, appends report with selected candidate refs. `solve.ts:61-109` filters op/risk/nonempty selector then **ranks** confidence/evidence/id, retaining alternatives. `satisfied` means no blueprint gaps, **not unique observed control**. A malformed-ref filter can discard evidence rather than report it individually. Preserve explicit gap taxonomy, reject ranked effect targeting. Blueprint missing risk defaults READ (prior VO-GH-0031); no inferred external mutation may inherit this default in AION.
- **Verify:** P `discovery-verification/src/index.ts:229-343` validates governed parser pins before writes, resolves each probe evidence ref via vault.get, evaluates, appends promotion event, optionally appends realization rows. Untested bindings get no row; failed probes yield REQUIRES_REDISCOVERY; incomplete passing proof yields TESTING; qualifying rows PROMOTED. Event and realization writes are sequential, not one atomic multi-record transaction; a late failure can leave partial durable output.
- **Proof limitation:** `evaluate.ts:88-154` uses caller-supplied passed booleans + count/score + resolvable nonempty refs, never candidate confidence. It does **not independently evaluate preState/postState**, ensure distinct probes, bind evidence bytes to each claimed postcondition, or require global mapping.satisfied to promote a binding. `policy.ts:31-60` validates threshold/probe/evidenceRequired types; false evidenceRequired is allowed policy data. Existence of references is not independent truth. AION acceptance must not become a generic score.
- **Parser governance:** P `contracts/src/parser.ts:47-76,84-103` validates pin identity and exactly-one-final chunk envelopes. Policy registry keys are exact provider/archetype/version; absent registry blocks pinned verification. Those are reusable mechanics, not attestation of today's page or effect authorization.

### Chat, intent, agent: actual owners and misleading names

P `vivim-chat/src/index.ts:146-167` **creates** a local vault conversation called `chat.open`; it does not open a remote conversation. `chat.append:169-213` serializes per conversation, appends local message then index; those are separate writes, not transactional remote send. History `:216-252` reads that local store, skips unreadable messages, and optionally fences a caller-supplied principal; absence retains a trusted-reader path. It cannot assert complete provider history or account-bound authorization. `chat.resolve:255-312` is exact-match classification or shared director fallback, with ledgered INFERRED provenance; it never executes the resolved action.

P intent contract is a vocabulary, not a completed execution engine. Actual writer `plugins/vivim-intent/src/index.ts:107-165` writes source principal from metadata, payload hash and initial pending step; constraints/idempotencyKey are stored, not a demonstrated duplicate-execution guard. `intent.resolve:170-226` **returns** planned steps without persisting them into the intent row. `intent.step.execute:232-253` reads stored step and returns **executing + grantEvidence**; it explicitly defers actual law attenuation and makes **no target call**. `intent.cancel:263-272` returns cancelling and writes compensation-request evidence, not a provider Stop or a persisted skip sweep. `intent.status:277-284` returns row data; its claimed per-principal authorization isn't implemented in that handler. Do not adopt its success labels as effect receipts. `isStepDone` in the contract includes failed/skipped—“done” means terminal, not success.

P `vivim-agent/src/agent.ts:93-134` uses scope subset/attenuation; malformed scope throws, ungranted/overbroad requests refuse; `:136-160` births staged identity with pinned behavior provenance. Delegate wiring `index.ts:231-275` checks parent/contract, narrows scope, sets forbidden actions, appends child and handoff. This is structured vault bookkeeping, **not launching an LLM worker/session**. Envelope deadline/evidenceRequirements/outputs are fields, not verified execution enforcement in this slice.

Actual `agent.exec` wiring `index.ts:509-677` loads identity/head behavior, checks version/state, derives **vault.*-only** scope, checks subset and optional PROMOTED realization, law-prechecks agent principal, calls target once through plugin port, then appends attempt receipt with quarantinedMidFlight annotation. It is not a generic browser tool executor. Admission permits non-terminal staged identity under active matching contract; don't equate staged birth with proof that all calls remain impossible. Ledger is mostly written **after** the call, best-effort on transport failure: no AION-equivalent durable pre-send reservation is established. Snapshot `:195-220` scans capped exec rows before agent filtering and chooses “latest” by object revision, not global event order; it is not a reliable receive cursor.

### Protocols, surfaces, command authority, recovery and results

P `contracts/src/port.ts:17-32,50-78`: typed REFUSED/REVOKED/SCOPE/BUDGET/DEGRADED, structured refusal attribution, advisory contiguous 1-based chunks beside authoritative terminating result. These do not expose UNKNOWN_EFFECT; adapter-specific errors need explicit effect-stage preservation in AION.

P `host/src/ports.ts:197-213,279-313,328-340,437-452` verifies compartment tokens/scope, resolves target then gates declared-risk ops, queues/delivers with remaining deadline, exposes root calls without token checks while still applying declared-risk law gating. A deadline resolves BUDGET without aborting delivered target work: **timeout is not evidence of no effect**. Missing risk is absent from opRisk and bypasses this law leg. Multi-offeror fallback can choose the last offeror (`:167-184`); do not import ambiguous routing policy. Best-effort journal `:455-458` is not a durable at-most-once operation ledger.

P `surfaces/mcp/src/mcp.ts`: hand-written newline JSON-RPC stdio, protocol version 2025-06-18, `tools/list` from booted router ops; shared `surfaceOpMeta` gives owner/risk. `tools/call:142-156` passes raw object arguments to `router.callAsRoot` with 10s deadline and returns JSON PortResult in text content. It has generic schemas, no per-tool argument contract generation. `notifications/cancelled` is ignored; tool cancel is not provider Stop. Tool names replace dots/@ with underscores without a collision check, so name bijection is not proven. FIFO pump `:184-208` serializes requests; EOF shuts down even if queued work is pending. This is an exposure/reference implementation, not a new AION ingress security design.

P `surfaces/cli/src/cli.ts:294-386`: plugins/status project router state; generic call optionally grants consent then calls root; msg sugar selects message.* and is **email-oriented**. Root model/consent ceremony is not AION Bus permission. P `contracts/src/surface.ts:25-43` is a small pure shared derivation; capabilityNamesFromRouted sorts/dedupes router ops. Listing means routed, not entitled/currently-ready/effect-proven.

P `host/src/recovery.ts:22-74` verifies signed recipe/root/invariants/entries, pins incoming, boots, else tries pinned configuration. This is **configuration recovery**, not resumption of an uncertain provider operation. It must never reset a conversation lock, operation identity or cursor. Pin-before-boot also means a verified but unbootable incoming recipe is not automatically equivalent to preserving the last running composition; no stronger rollback claim made here.

Artifact/results scope: intent's `declareArtifacts:92-96` merely maps names; no provider artifact creation/download/listing is implemented by that helper. Local JSON PortResult, capture refs, promotion events, chat message records and agent ledger rows are genuinely implemented **internal results**, not provider-native artifact retrieval/export. Keep output payload, receipt, partial stream, final status and provider artifact identity separate.

## Exact 40-command disposition ledger

**Scope:** same bound provider web conversation, per AION rubric; P and B separately named above. `PARTIAL` means an inspected technique/counterexample, **not provider support**. `UNKNOWN` means not established by the read source, not repo-wide absence. No row is MATCH for full AION provider semantics. `NOT_APPLICABLE` is reserved for donor-only semantics and appears in explanation rather than concealing the target gap. 29 CORE rows + 11 REGISTRY rows.

| ID | Rubric | Disposition | Exact scope / source-grounded reason |
|---|---|---|---|
| send | CORE P0 | PARTIAL | P fixture email, not target; B executeChatGptSend has one click path but wrong-target/JS/correlation defects; no accepted effect proof |
| observe | CORE P0 | PARTIAL | P discovery observation replays fixture traces, not current operation/inbox; B capture is request-scoped during send only |
| reply.read | CORE P0 | PARTIAL | B SSE parser produces text chunks after full capture, not bounded visible reply tied to target; P chat.history is local |
| stream | CORE P0 | PARTIAL | P ordered advisory chunks/envelopes useful; B buffers network body until loadingFinished, not independent incremental watch |
| history.read | CORE P0 | PARTIAL | P local chat index/filter/sibling isolation; not remote web conversation history |
| session.bind | CORE P0 | PARTIAL | P captureRef/ATTACHED validator; B debugPort-only descriptor does not bind exact account/chat/tab/epoch |
| recover | CORE P0 | PARTIAL | P recipe recovery only; B no-resend comment/control flow useful negative boundary, no durable operation reconcile |
| sessions.list | CORE P0 | UNKNOWN | Provider registry is realizations, not provider conversations; no inspected exact-chat enumerator |
| model.list | CORE P0 | UNKNOWN | Routed ops/provider realizations are not account-entitled selectable models |
| model.select | CORE P0 | UNKNOWN | No inspected effective model picker/control confirmation |
| file.attach | CORE P0 | UNKNOWN | No inspected file-to-bound-composer attachment implementation |
| chat.create | CORE P0 | PARTIAL | P chat.open creates local vault row; B target creation/home navigation does not prove persisted new provider chat |
| chat.open | CORE P0 | UNKNOWN | P chat.open is local creation, NOT_APPLICABLE to opening exact existing provider chat; B first-tab selection insufficient |
| chat.rename | CORE P0 | UNKNOWN | No inspected provider title mutation and readback |
| generation.stop | CORE P0 | UNKNOWN | Intent cancel/host terminate/MCP notification are NOT_APPLICABLE to exact generation Stop |
| thinking.level.set | CORE P0 | UNKNOWN | No inspected model-dependent effective effort control |
| steer | CORE P0 | UNKNOWN | No inspected mid-turn steering/queue distinction implemented |
| message.edit | CORE P0 | UNKNOWN | Local append is not prior provider-message edit/regeneration |
| response.regenerate | CORE P0 | UNKNOWN | No inspected parent-turn-bound regeneration; no blind resend credit |
| chat.search | CORE P1 | UNKNOWN | Email/message label heuristics and vault query are not provider-wide chat search |
| chat.archive | CORE P1 | UNKNOWN | Inferred email move/archive candidate is not implemented provider archive |
| chat.delete | CORE P1 | UNKNOWN | Delete-word risk inference is not exact-chat destructive mutation |
| chat.share | CORE P1 | UNKNOWN | No inspected privacy/visibility-aware provider share implementation |
| branch.create | CORE P1 | UNKNOWN | Intent dependency graph/local conversation creation not turn fork |
| message.copy | CORE P1 | UNKNOWN | Local text/content schema does not implement provider-message copy/fidelity |
| tool.toggle | CORE P1 | UNKNOWN | Composition grants/tool exposure not provider tool enablement |
| project.select | CORE P1 | UNKNOWN | No inspected provider project selector |
| chat.export | CORE P1 | UNKNOWN | Local vault records/refs not complete provider chat export |
| mode.select | CORE P1 | UNKNOWN | No inspected effective provider mode control |
| agent.delegate | REGISTRY | PARTIAL | P agent.delegate narrows scope and journals staged child; not LLM/process launch or provider-native delegation |
| agent.status | REGISTRY | PARTIAL | P agent.snapshot returns identity/contract/capped ledger summary, not provider task progress; cursor caveat above |
| cancel | REGISTRY | PARTIAL | P intent.cancel returns cancelling + compensation-request record, not actual remote cancellation/rollback |
| context.inject | REGISTRY | UNKNOWN | Delegate task/intent fields and input mapping scaffolds not provider context injection |
| discover | REGISTRY | PARTIAL | P perceive→infer→map→verify implemented fixture pipeline; no live readiness/authority inferred |
| grant.manage | REGISTRY | PARTIAL | P root consent calls + token/scope law are reference/counterexample only; AION grants already exist |
| health | REGISTRY | PARTIAL | P router status/liveness independent of provider/chat/observer health; not a complete provider health probe |
| receipt.read | REGISTRY | PARTIAL | P vault reference + agent attempt ledger/machine result patterns; no AION receipt schema adoption |
| result.export | REGISTRY | PARTIAL | CLI/MCP JSON result projection is internal serialization, not provider artifact export |
| tool.call | REGISTRY | PARTIAL | MCP maps tool→root op; agent.exec limited vault scope; not provider tool invocation authority |
| ui.panel | REGISTRY | UNKNOWN | Web surface paths inventoried, not deeply inspected; no panel behavior credit |

## Future 65 candidates — all 21 families

These remain **unapproved candidates**. Every ID below is included once. Family `UNASSESSED` means no operation-specific owner traced here, not no donor code anywhere. `PARTIAL` is source technique only. A generic contract never satisfies the provider action.

- **protocol (3), PARTIAL:** `receive.cursor`, `receive.identity`, `send.correlation`. P port.ts ordered seq and chat.ts provider/realization/conversation/message separation support vocabulary only; seq is call-local, not epoch cursor. B response request matching fails exact operation correlation. AION cursor/PACK fixes already owned; no replacement journal.
- **receive (3), PARTIAL:** `conversation.watch_idle`, `reply.read_full`, `response.complete.verify`. P fixture replay/final-chunk semantics and B send-time stream capture/parser are references/counterexamples; no independent idle watch, explicit full-reply coverage or correlated completion verification. AION observer owns these.
- **model (2), UNASSESSED:** `model.capabilities.read`, `thinking.level.read`. Provider realization registry not current model feature/effort state.
- **conversation (6), UNASSESSED:** `conversation.fork`, `chat.pin`, `chat.move`, `chat.duplicate`, `chat.share.revoke`, `chat.labels.manage`. Local chat rows are not these provider mutations.
- **message (5), UNASSESSED:** `message.branch`, `message.reaction`, `message.citation.read`, `message.citation.open`, `message.format.read`. B text-block parser drops structural distinctions and is not a citations/format extractor; no operation-specific implementation credit.
- **generation (4), UNASSESSED:** `message.queue`, `message.interrupt_and_send`, `message.submit_schedule`, `response.compare`. Intent dependency/queue vocabulary must not be relabeled mid-turn effects or native scheduler support.
- **export (1), UNASSESSED:** `response.export`. Internal JSON serialization does not establish structured provider response export.
- **artifacts (4), UNASSESSED:** `artifact.create`, `artifact.list`, `artifact.download`, `artifact.edit`. P declareArtifacts merely maps names; session capture refs are evidence, not generated artifact enumeration.
- **files (3), UNASSESSED:** `file.list`, `file.detach`, `file.search`. No provider-native owner traced.
- **tools (3), PARTIAL:** `tool.list`, `tool.invoke`, `tool.permission.manage`. P surface.ts + MCP tools/list/call + host risk gate implement internal tools and root routing. Useful single catalog projection; generic schemas/root authority/default READ cannot be transplanted as provider permission management.
- **integrations (3), UNASSESSED:** `connector.list`, `connector.connect`, `connector.disconnect`. Composition plugins are not owner-account OAuth/provider connectors.
- **identity (2), PARTIAL:** `provider.account.select`, `provider.profile.list`. P provider registry is realization/liveness with unknown-class coercion; B descriptor has no account/profile. Negative seam: unknown remains unknown, no first-tab/implicit-account selection.
- **browser (2), PARTIAL:** `browser.tab.bind`, `browser.readiness.probe`. P reference-only sessions/null validation + B descriptor expose what is missing; neither implements exact tab/page epoch or fresh tri-state composer/Send/Stop readiness.
- **multimodal (8), UNASSESSED:** `voice.session.start`, `voice.session.stop`, `audio.transcribe`, `image.generate`, `image.edit`, `video.generate`, `screen.share.start`, `browser.computer_use`. B direct CDP execution is not provider-approved computer-use tool support.
- **memory (2), UNASSESSED:** `memory.read`, `memory.update`. A vault is not provider-visible personalization memory.
- **settings (2), UNASSESSED:** `custom.instructions.read`, `custom.instructions.update`.
- **workspace (2), UNASSESSED:** `project.create`, `project.members.manage`.
- **automation (3), UNASSESSED:** `automation.create`, `automation.list`, `automation.cancel`. Intent stubs are not provider-native schedules.
- **account (3), UNASSESSED:** `usage.read`, `provider.plan.read`, `model.rate_limits.read`. No account secrets inspected; no entitlement/billing/limit claims.
- **evidence (1), PARTIAL:** `audit.export`. P redact→hash→captureRef, epistemic statuses and typed result evidence are useful method; no complete export operation audited. Must minimize receipts, not export payloads/secrets.
- **agents (3), PARTIAL:** `agent.run`, `agent.progress.watch`, `agent.artifacts.list`. P delegation/exec ledger + intent artifacts expose internal scaffolding; vault-only exec and non-executing intent step are not provider-native agent tasks/progress/artifacts.

## Smallest reusable foundations (pending owner disposition)

**License gate for every candidate:** P root package is private and declares no license; no tracked LICENSE appeared in the inspected tree listing. Do not infer MIT from VOMEGA lineage or ownership. Default reuse form is **concept/spec/test recipe**, not copied production code, until owner/license/provenance decision. Pure helpers use TypeScript and standard runtime APIs as named; workspace contracts/shim/host dependencies must not be dragged into AION merely to obtain a few functions.

| Leverage / smallest owner | Dependencies / proposed reuse form | Existing AION seam, hazard and assertion |
|---|---|---|
| Capture reference validators: P `provider-browser/src/session.ts:105-147` (VO-GH-0008 exact hash in index) | Standalone TS/shape checks; adapt concepts, not vault | Existing observation evidence: released/malformed/ref.rev<1 rejects. Add null/array/nonfinite tests; separately recompute content integrity if required |
| Redact-before-hash ordering: P browser index.ts:160-186 + credentials/redact.ts:77-114 | Crypto + policy/redactor port for original; reproduce ordering with AION minimization, not credential engine | Evidence receipt seam: raw text never persisted/hashed; policy version and hash redacted bytes. Test Unicode bound and unrecognized sensitive formats; regex ≠ privacy guarantee |
| Parser pin + final-chunk envelope: P `contracts/src/parser.ts:47-103` | Local port/provider contract types; tiny schema/envelope adaptation | Existing observer/parser metadata: reject unknown version, early/multiple final, empty parse, gaps. B unchanged v1 after semantic change is a negative fixture |
| Pure proof evaluator: P discovery-verification/evaluate.ts:88-154 + policy.ts:31-119 | Policy types + resolved-ref set; test recipe rather than promotion subsystem | Existing acceptance/evidence intake: confidence 0.99 cannot promote failed probe; missing ref/pin blocks. Also test repeated same probe, unrelated evidence and caller-forged passed=true; history promotion never authorizes Send |
| Diagnostic gap solver: P discovery-mapping/solve.ts:75-144 | Blueprint type/helper only; extract gap-report vocabulary, **not pickBest** | Existing read-only capability diagnostics: missing/risk-mismatch/empty/ambiguous distinct. Two valid Send targets must block, not rank |
| Observation projection core: P perception/model.ts:95-210 and observation/trace.ts:54-228 | Pure TS, Buffer UTF-8, graph/ref types; controlled synthetic-test method | Existing page snapshot: preserve typed refs/spans and drift without arbitrary collectors. Missing requestId/duplicate selector/insertion must not fabricate effect attribution |
| One canonical command projection: P surface.ts:25-43 | contracts manifest helpers; re-express over AION registry | Existing command/MCP/CLI introspection: catalog listed but denied remains denied. Reject missing risk; test op-name normalization collisions |
| Terminal result vs stream: P port.ts:17-78 + browser index.ts:271-294 | Types + small sequence check; schema/test reference | Existing Bus/result contract: final advisory chunk then persistence failure must not become success; emit-after-final/gaps reject; timeout preserves uncertain effect |
| Separate interpretation/artifact/effect: P intent.ts + vivim-intent/index.ts:232-253 | Types/pure status vocabulary; mostly **counterexample** | Existing operation ledger: “executing” return without target call cannot create effect receipt; submitted payload hash/idempotency field is not reservation |
| Attenuated handoff/version admission: P vivim-agent/agent.ts:93-134,299-341 plus wiring | scope algebra + Outcome + vault/law for original; contract/test reference only | Existing agent/Bus authority: child scope ⊆ parent, old behavior version refuses new work, admitted work remains accounted for. No second grant/agent store |
| Verify-before-use configuration: P host/recovery.ts:22-74 | recipe/signature/root/content verification + filesystem; architectural reference only | Existing setup/config provenance: corrupt incoming/pinned refuse or explicit fallback; never reuse as unknown-effect unlock/replay |
| B live send negative corpus: B live.ts:180-183,446-455,645-709 | CDP/WebSocket/fetch/page eval/network collector; **DO NOT PORT** | Existing exactly-bound page adapter: wrong target, TypeScript in JS string, stale pin, response mismatch, post-click loss must fail safely with no second send |

Additional owner hashes for reproducible citations (P clean / dirty_delta none):

```text
contracts/src/parser.ts 958c2b5768a19f7529df824d1551ea265cd185b9325d421991dd5b1018f62c06
host/src/ports.ts 6de996b056fc49ef17025b4720354d9f11f7b14a5fa682320bf5c32592522dfd
host/src/recovery.ts 49eb4b9da7b830c347e820c76313356987ee601447d7f792a9fd9303504981b6
plugins/discovery-perception/src/model.ts ef14eb324b58dabadd2fcea6bac5a45aee40545c780e3557558c8cd2cf47dbeb
plugins/vivim-agent/src/index.ts a240a97ff1a4220b4f1dda6d751c0744c1baf53fda4367674f9beb6f525c0b5a
plugins/vivim-intent/src/index.ts bf41de5cfdf8b2ab5804c716f67d2d7335fc7790ec3675b0a5acdf3d3a9430bd
plugins/vivim-credentials/src/redact.ts f98eada143f2cf0fad42bf6ed860cd2dcc478a319213632f69cc0288e5914186
surfaces/cli/src/cli.ts 267c2abbce744f56c58a02cb325c4e65be5879681304146289482c45f64e927f
```

P previously captured helper hashes/paths remain in index.jsonl and were rehashed as described; those exact full hashes apply to evaluate/policy/solve/trace/infer/registry/port/surface/parsers citations here. P source lines can differ by one trailing empty line from prior exported captures; symbol+pin+whole-byte hash is the stable identity.

## Failure/test recipes read — NOT RUN

P browser-falsifier test assertions inspected: `:79-96` redaction absent from stored bytes, reference-only session, digest of redacted bytes; `:102-123` durable forbidden entries and law consent refusal before handler bars; `:126-158` perceive→infer evidence survives, mapping + verification produces pinned realization; `:161-184` unpinned realization refuses bar4; `:193-205` pack-schema email result; `:208-223` stream ID/contiguous seq/exactly one final; `:226-244` unknown/released session refusal and chain/secret exclusion. These are source assertions on a fixture composition, not passing tests in this round and not live browser proof.

Additional source-derived AION falsifiers (proposal only):

- Undeclared risk cannot become READ; unknown class cannot become SIMULATOR; historical PROMOTED cannot become fresh action-ready.
- An unresolved evidence ref, stale parser content identity, false global mapping satisfaction or repeated caller probes cannot create acceptance.
- Lost ack after activation keeps original immutable lock; reconnect/recipe recovery/cancel does not create a second Send.
- Local chat append, staged delegate, intent executing label and a final stream chunk cannot claim remote submission/completion.
- B double tabs/foreign account/wrong target/selector duplicates block before write; malformed JavaScript expression fails before activation; post-activation network/parse failure remains uncertain and non-replayable.
- SSE replace-vs-append, finish_reason:null, wrong request stream, missing native message ID and empty final text must not count as fully read correlated reply.

## Duplication, ownership and unread scope

VOMEGA and Omega share lineage, including known identical `contracts/src/{port,surface}.ts` blobs. Prior VOMEGA pointers are **not independent corroboration**. The matching P/baseline/FullTest browser files compared here are copies of the same owner semantics, not three implementations/tests. B is a materially changed fork in browser index/session/parser/live owner; its source is additional behavior evidence, not independent live acceptance. The B live path must not overwrite the immutable pin's fixture-only description.

Inspected: all twelve flagged file identities; whole entrypoint/source reads except intentionally filtered falsifier; P session/parsers/perception model/inference core/trace/evaluate/policy/solver/provider registry; host ports/recovery; bounded CLI handlers; whole intent writer; bounded agent wiring; B live.ts/session.ts, full index delta and parser region. Root package metadata and tracked path inventory were inspected, not dependency internals.

Unread/partial: donor root is a large collection, **not fully source-exhausted**. Core legacy enhanced tree, BCP destination/conformance/migration documents, FullTest divergent intent execution, Zai/lab/archive implementations, packs/provider-llm live implementation, healing/director tick/run queues, daemon/web/SDK transports, vault CAS/compaction/roundtrip internals, full shim enforcement, and operation-specific UI/provider adapters outside the traced pipeline remain targeted ROUND2 work. Original OMEGA-01..08 legacy leads are not automatically resolved by closing the twelve remote flags. No generated build status, archives/bundles/binaries, raw capture bodies, node_modules, or .git internals were used as implementation proof.

## ROUND2 concrete targets and parent validation handoff

1. **Which local branch is destination-authoritative for browser source?** Read BCP `docs/CURRENT-CONTEXT.md`, destination responsibility matrix and P1-08 acceptance/triage records; connect B's live.ts commit to its actual composition/grants and tests. Do not execute its source. Exact target: B provider-browser `plugin.json`, its parser contribution/version and live tests. Need source-only answer whether any conformance test parses the generated click string as JavaScript and verifies exact target identity.
2. **Can a v1 fixture pin cover changed live parser bytes?** Trace B parser `PARSERS` registration and sign/content recipe inputs, compare P→B parser contract/manifest hashes. Demand a semantic/content-version invalidation test; do not promote fixture proof.
3. **Resolve legacy OMEGA-01..08 separately:** read `Core/vivim-final-enhanced/AGENTS.md` first, then the actual session-lifecycle/capability-resolution/command-plugin/shape/provider-data-model and unknown-effect owners cited by the old findings. Obtain that nested Git HEAD/status before attribution; avoid mixing Final lineage with Omega runtime.
4. **Transport/effect failure:** inspect P shim stream enforcement and host worker delivery, daemon-client retry/cache and web events. Determine cancellation/EOF/late-result/timeout behavior and whether any retry can redispatch an effect. Existing AION no-resend/cursor laws are not reopened.
5. **Evidence strength:** trace inference model normalizeEvidence, verification probe tests and vault provenance/CAS validation. Does caller evidence actually correspond to claimed postconditions, are duplicate probes rejected anywhere, and can partial realization writes be reconciled? Keep source validation distinct from acceptance.
6. **Artifact results:** inspect provider-llm live/parser/result contracts plus intent-phase3/4 consumers and tests. Identify real implementation vs declaration; do not grant artifact.list/download support from names.
7. **License/reuse approval:** establish explicit license/owner reuse decision for the exact clean source pin and BCP modifications before any copying. Prefer tiny AION-native adaptations/test counterexamples.

**Parent validation request:** verify exact 40 unique command IDs against CORE/matrix and 65 future IDs against capability-universe; verify 12 flag/hash identities, P clean pin, B enclosing Git root + tracked browser blobs, and documentary-only diff. The child has performed static read/hash/Git identity inspection only. No code test or live result is offered for acceptance. No change to existing index/capture statuses, AION source, grants, ledger, cursor, or contracts is requested.

**Child documentary check:** a read-only PowerShell comparison against `capability-universe.csv` found 40 command-table rows / 40 unique IDs, no catalog ID difference, and all 65 future IDs present in the future-family section (missing=0). This is document coverage validation, not a donor test. Git reports this single authored deliverable as untracked; it is intentionally not committed by this lane. Parent should recompute the final file hash after review.

---

# ROUND2 — transport, immutable evidence, provider execution and strategic reuse

**Source recheck:** 2026-10-21T07:45:31.0572800Z; hash receipt cut **2026-10-21T07:50:42.9893181Z** (tool-observed UTC, not inferred document modification time). P HEAD remains `79ee558d6c7ea77c20f220db2341adaa57b11d44`; BCP HEAD remains `4c14cf8a5020dc166e3c1bed409d1a76f57a88d8`. Both tracked-file status checks returned no changes. Parent independently confirmed those HEADs and the P browser-index/B live hashes. **Custody correction:** tracked-clean does not mean fully clean checkout: parent reports an untracked `omega-baseline/omega-final/bunfig.toml` in BCP. This lane did not create, alter, read or execute that file and does not infer its author. No blanket fully-clean BCP claim survives this correction.

This append supersedes first-round generalizations where stated below; the 40-command table and 65-family accounting remain the scope. No provider command is newly promoted to MATCH. Reads included ordinary synthetic test bodies; referenced fixture capture bodies and planted-secret values stayed excluded. All tests discussed below were **read, not run**. Only this memo was edited.

## R2.1 Corrections and architectural conclusion

- **Owner-code reuse / license:** ROUND1's “license gate” and “default until owner permission” wording was over-restrictive for the user's own code. Record the actual fact—P private package, no LICENSE discovered in the inspected tracked inventory—and preserve donor authorship/lineage. It is **not a new permission blocker** or a conclusion about copyright ownership. The owner can authorize own-code reuse; third-party-derived units (notably the SSE parser's stated legacy origin) retain their provenance and need ordinary attribution/dependency checking, not invented legal approvals. Architectural non-transplant recommendations below are technical choices, independent of this correction.
- **Byte integrity vs semantic proof:** BCP's signed recipe/content verification really hashes source files. The unchanged browser **parser v1** concern is not a claim that old signed executable bytes silently pass admission. Rather, historical realization records/pins carry provider/archetype/version without the newly admitted implementation digest, so the evidence-to-version relation can be semantically stale **after legitimate recompilation**. Admission, parser protocol compatibility and current-page verification are three separate guarantees.
- **Intent metadata correction:** ROUND1 described intent.submit's intended source-principal derivation from metadata. Actual P shim `PluginContext` has no `meta` member; it passes metadata as the handler's third argument (`shim/src/index.ts:9-18,84-101`). The intent writer reads `ctx.meta?.from/causationId` instead (`vivim-intent/src/index.ts:113-115,152`), not that argument. Under this actual shim path those accesses lack the supplied metadata and fall back to `unknown`; the source comments are not evidence that authenticated provenance reaches the record. This is source reasoning only, not an executed failure.
- **All-container coverage remains partial.** BCP destination documents explicitly treat their 125-row inventory as a corrected research baseline, not completed implementation. Broad source access does not establish that any nested variant is the installed runtime. This lane establishes **source roles and implementation boundaries**, never live ownership.

**Strategic conclusion:** reuse small mechanism contracts and executable-test ideas behind AION's existing owners. The most useful reductions in future implementation effort are: exact immutable-ref retention across replacement; bounded metadata→body retrieval; typed result-layer adapters; and an explicit timeout/disconnect/late-result matrix. A wholesale Omega daemon/store/provider framework would add authority and compatibility work rather than eliminate it.

## R2.2 BCP roles, acceptance, parser content and generated JavaScript

Here **BCP:** paths are relative to `C:/0-BlackBoxProject-0/Vivim-omega/BCP-dev/`; **B:** retains the ROUND1 nested prefix. BCP `docs/CURRENT-CONTEXT.md:3-19` is explicitly **updated 2026-09-25**, calls itself a map not a constitution, puts Ω law under omega-baseline, BCP control under bcp-speed, destination under docs/destination, history under archive. It states the Core-vs-Plugin package added no production runtime code. The responsibility matrix `:34-158` separates admission/transport/token machinery (K0/K1) from semantic provider/account/session/routing/work/evidence plugins. R-004 executable integrity is BLOCKED, R-017 invocation pinning EXPERIMENT-REQUIRED, R-071 work recovery PARTIAL, R-076..079 identity UNDERPROVEN, R-081/R-087 realization IMPLEMENTATION-REQUIRED. Those are documentary classifications, not source-wide verdicts for AION.

BCP `docs/migration/FIRST_VERTICAL_SLICE.md:21-39,82-104` defines MIG-001 as recorded-fixture/static integration with LIVE and regression unverified; the email schema is temporary and chat schema future. `FINAL_DECISION_REPORT.md:3-25,71-79` endorses semantic data-plane harvesting but rejects legacy authority shapes and explicitly defers restart/disconnect/selector/partial-stream/timeout live suites. These reports predate or are narrower than some current source behavior: their “Ω tree untouched” statement cannot negate B's now-present live.ts. Conversely, current source cannot retroactively upgrade their recorded proof claims. Neither document has a reliable current acceptance date in its heading; their **checked source revision**, not an invented date, is the citation.

B `docs/migration/30-TRIAGE/TRIAGE-LEDGER.md:7-24` leaves provider metadata/manifests/SSE/import/browser primitives/ChromeGovernor OPEN, distinguishes mechanics-only harvest from authority, and removes legacy EventBus/module registry/Prisma runtime/singleton registry rather than importing them. Its T-04 OPEN label coexists with an already shipped SSE helper; it is an inventory/disposition tracker, not an authoritative absence test. Exact P1-08 current acceptance record beyond these and `live-send.test.ts` remains a residual target; no guessed acceptance signoff.

B `compositions/browser.json:3,50-98` is the explicit browser source seam: law/vault/email pack/discovery/credentials/browser contributions and grants. message.send is declared EXTERNAL_MUTATION by the email pack; browser holds vault/read/redact/forbidden-set capabilities and exposes attach/release/send. The composition's shippable-v1 note excludes AI API realization; this is **not** proof that the CDP driver is installed, uniquely bound, or accepted. It does show B's intended product direction differs from D-380's historical API_NATIVE-first future bar.

B browser `plugin.json:3-16` keeps plugin version **0.1.0**, parser version **1**, and explicitly describes both fixture JSON and live SSE under the same parser contribution. B `host/src/recipe.ts:101-161` hashes source, signs manifest, hashes the signed manifest into recipe, signs recipe, and verifies manifest signature/hash and source content on use. B `host/src/canon.ts:25-50` hashes sorted relative paths plus file hashes, excluding package/manifest files and rejecting symlinks; manifest is separately bound. This provides **actual admission-content identity**. It does not insert that digest into `ParserPin` or old realization evidence. Small reuse choice: put an existing AION parser-build/content identity beside a protocol version in provenance rather than create another verification registry.

Test bodies now read:

- B `provider-browser/test/parsers.test.ts:28-97,100-128`: manifest/registry version equality, unknown-version refusal, pin triple, deterministic fixture parse, envelope early/empty/final rules and malformed session checks. They do **not** prove live fixture substitution or unchanged semantic extraction after implementation drift.
- B `provider-browser/test/live-send.test.ts:21-46`: asserts selector order and **substring presence** in expression strings (`.click()`, setter/input/change); it never parses/evaluates the generated string. Thus it would not detect the literal TypeScript assertion in `buildClickExpression`; this confirms the missing test boundary, not a runtime result.
- `:72-101` tests the **duplicate live.ts parser**, including late message-ID backfill on patch text. `:103-112` tests the **registry parser actually called** only on a simple OpenAI delta stream. Registry implementation B `parsers.ts:196-254` does not backfill early chunk IDs, unlike live.ts's duplicate; a passing helper test cannot attest the actual parser's patch behavior. Both copies use top-level finish_reason **presence** as completion, but choice finish_reason uses non-null check. Missing/new tests: same corpus through both exports; top-level null; replacement patches; absent native ID; wrong conversation request; two tabs; generated-expression JavaScript validity; parser content change with same version.

No parser/version/conformance tool or test was invoked. Existing `browser-falsifier.test.ts` remains ROUND1's filtered assertion coverage, not a newly executed end-to-end path.

## R2.3 Transport kernel vs authority and effect semantics

### Compartment/shim/host transport

P `shim/src/index.ts:48-64` gives a port-call wrapper that requires a per-op token, generates a callId, installs a response listener and a local timeout. It sends once. **Local timeout only resolves BUDGET; it does not unregister that listener on timeout or cancel downstream work.** Late result clears listener/timer and attempts to resolve an already settled promise. Caller disappearance is not effect rollback.

Delivery `:84-101` passes causationId/deadline/from, generates monotonic per-delivery chunk sequence and throws after final. It does not require that a handler emitted a final chunk before returning, nor provide an abort signal or typed cancellation message. It wraps **every returned value** in `PortResult.ok=true`, even a nested plugin Outcome REFUSED/UNKNOWN. `onInit` failure still sends ready (`:69-72`), so router active transport state is not successful plugin initialization or provider readiness.

P `host/src/worker.ts:70-118` observes worker error/nonzero exit as degraded; graceful terminate sends shutdown, waits 2500ms, then hard-terminate with a capped settle; fast terminate is a separate 500ms bounded path. Bounded waiting does not prove graceful work drain or no external effect. Worker-thread isolation is explicitly not a hard adversarial resource sandbox (`:4-12`); use the transport contract without importing its isolation claims. `checkoutCompartment:148-153` falls back from failed **pool acquisition to cold spawn**, before plugin execution; that is not a resend path.

ROUND1 P host ports source supplies the remaining chain: pending result keyed by causationId; timeout deletes pending and releases capacity; late return/chunks with no pending sink are ignored (`ports.ts:222-231,328-340`); no cancellation is sent. A nested port call defaults to its own 5000ms rather than inheriting a single absolute end-to-end deadline. Releasing concurrency on timeout can let later work overlap a still-running previous handler. AION should preserve its current deadline/effect-lock ownership, not substitute this budget counter for operation fencing.

**Tests read:** P `host/test/runtime.test.ts:27-63,66-99` checks actual router echo/nested call, unknown op, delayed echo BUDGET, degraded target with sibling alive, and fake-attacker token ownership/scope. The BUDGET test checks only returned error; it does not assert that the timed-out handler stopped or that later effects were reconciled. Further source/test targets are named below rather than claimed covered.

### Daemon and CLI: warm transport, no demonstrated automatic effect replay

P `surfaces/daemon-client/src/client.ts:75-121` opens one loopback connection, sends one request, filters response ID, settles once and destroys socket on response. Timeout rejects but does **not** destroy the socket in that timeout branch. Error/close reject; there is no request replay/retry in callDaemon. `ensureDaemon:246-298` retries **discovery/ping/startup**, not prior command payloads. The mkdir/PID lock + null fallback is a reusable single-flight startup pattern; treat stale PID races and Windows process behavior as separate lifecycle concerns, not a new effect authority.

P CLI `tryDaemonBoot:452-498` may cold-fallback only while acquiring/configuring/status-checking the warm transport. Once its returned callAsRoot sends daemon `call`, a transport rejection propagates; no cold resend occurs in that wrapper. Daemon `:235-258,342-354` executes root call and writes a response; socket closure only drops buffer, **does not cancel or re-dispatch running work**. Data-event handlers launch independent async loops; chunks/clients can interleave even though lines within one callback are awaited. Idle timer is request-triggered, not proven in-flight-drain aware. `use` can boot/replace host; it is not an operation-reconcile command.

Reuse the identity handshake (specPath/recipeSha), clean separation of startup readiness from user-command dispatch, and explicit wrapper `{ok,value:{result,serverMs}}`. Preserve both transport `ok` and nested operation `result.ok`; daemon transport success is not operation success. Source staleness `snapshotSources:164-204` is **mtime+size heuristic**, excludes manifests/packages and is not content proof. Compile cache and boot hashes remain separate; no claim of malicious drift resistance from restat.

P `surfaces/daemon/test/daemon.test.ts:58-99,101-170,173-202` bodies cover protocol/auth/root forwarding/status, malformed call, process stop, same/different-spec use, restat changes and idle exit. They do not cover a post-dispatch socket loss/late effect/reconnect replay matrix. Tests spawn/terminate processes in their source, but none ran here.

### Web/MCP: presentation subscription is not durable receive

P `surfaces/web/src/events.ts:39-80` queries sorted metadata IDs, then fetches only bounded body pages (512). `journalHistory` gets last N body records rather than lifetime bodies. `journalTail` retries unchanged seen set if body fetch throws; if getmany returns **found:false**, however, it skips missing body and still marks **all requested IDs seen**. There is no durable checkpoint, explicit coverage gap, page epoch or subscriber acknowledgement. Entire ID inventory is queried each tick and seen grows unbounded; body-read bound is not total-query/memory bound.

`startJournalTail:93-113` prevents overlapping journal ticks and catches transient reads. `startWorldPoll:115-138` skips reads without subscribers, performs lightweight version check before full body. However world polls have **no in-flight guard**, and lastV is assigned before fetching/emitting the full snapshot; a failed full read at that version can suppress retry until a new version. These are useful optimization/test patterns, not an AION inbox/cursor implementation. No present AION fixed cursor/PACK-01/02 behavior is relitigated.

P `surfaces/web/test/d387-perf.test.ts:97-150,153-198,200-235` bodies count zero reads without subscribers, unchanged-version cheap checks, one emit per change, history fetching exactly 60 of 5000 **bodies**, seen suppression and transient **query** failure recovery. Fake getmany does not exercise query-success/body-missing or full-world-fetch failure; it cannot prove gap-free delivery.

P `surfaces/web/src/api.ts:136-244` also reveals the actual execution owner missing from ROUND1's intent-stub discussion: **web execute directly calls the resolved target** after optional intent persistence and law precheck; it does not depend on `intent.step.execute` to actuate. Submit/resolution bookkeeping is best-effort, and resolution EXECUTED can include a failed routed call. Thus the intent engine is stubbed while a separate surface path really invokes ops; do not say “no execution anywhere.” This is internal root execution, not a newly proven provider command.

P MCP source ROUND1 FIFO + EOF shutdown does not await queued work before initiating shutdown; notifications/cancelled is ignored. P `surfaces/mcp/test/mcp.test.ts:199-229` tests invalid method/JSON and **idle** EOF exit after answered ping, not EOF during an in-flight effect. `:233-265` explicitly retries a **definite law-refused** operation after consent; that is not unsafe automatic retry after possible submission. Keep the distinction rather than ban every second call by name.

## R2.4 Vault and discovery: exact guarantees, reusable boundaries

### Actual storage mechanics

P `vivim-vault/src/cas.ts:18-56` computes CID over canonical JSON, validates hex CID before path join, writes unique temp → fsync → rename → best-effort directory fsync, and skips existing final CID. These are useful **immutable artifact-file publication mechanics**, potentially usable around an existing AION evidence file without a second store. casGet **parses but does not hash-check contents**; casPut's exists shortcut does not validate existing bytes. Canonical JSON `canon.ts:21-40` sorts object keys, preserves array order and drops undefined object values. It is not an arbitrary JS object serializer/cross-language canonicalization standard: define allowed values and compatibility tests before changing any existing receipt digest.

P `changelog.ts:57-72` CAS-publishes before `BEGIN IMMEDIATE`, then atomically allocates revision from changelog, inserts object + FTS + chain link in one SQL transaction. Failed SQL may leave an unreferenced blob, not a half-committed database object. P `sql.ts:89-107` queues writes using `tail.then(fn,fn)` and resets tail on both outcomes—one failure does not poison future writes. Reads run synchronously between queued write tasks on one connection; this is not cross-process lock-free reading or a multi-object transaction API. `synchronous=NORMAL` is the actual SQLite policy, not maximum power-loss durability.

Exact `{ns,id,rev}` reads fall back hot→cold (`sql.ts:225-237`); revisions come from history so compaction cannot reuse old revs. `compaction.ts:16-61` protects refs cited by hot objects, moves superseded rows to cold, batches FTS delete, keeps CAS/changelog. That separates **retention/search temperature** from evidence identity—a strong method for AION's current receipt/journal owners, not a new vault dependency.

### What verification does NOT prove

P append validates reference **shape** (`validate.ts:53-64`), not target existence or that referenced data witnesses a claim. Metadata/refs live in an envelope column; **CAS CID and changelog entry hash cover data/CID, not meta/refs** (`canon.ts:38-53`, `changelog.ts:63-66`, `sql.ts:184-201`). Changing those envelopes is outside the current chain hash. `verify.ts:24-95` recomputes chain order/hashes, checks a hot/cold revision exists for every link, and checks each CID path exists. It does not rehash blob bytes, compare row CID to changelog CID as a joined equality check, validate all provenance targets, or independently prove remote effects. Use “chain/link/blob-existence verification,” not blanket tamper-proof evidence.

`roundtrip.ts:21-86` enforces disjoint absolute destination, copies blobs and hot/cold/changelog rows, rebuilds FTS, then verifies the destination. Its comment says source/copy head comparison, but **the function returns the destination verdict/head without comparing a source head**. The **test/caller** performs the comparison (`vault.test.ts:405-417`). Reusable replacement test is therefore explicit source digest → copy/reopen → independently compare, with metadata/ref equality and blob rehash added where required. It is not safe to infer equality just from roundtrip.ok.

**Tests read (actual bodies):** P `vault.test.ts:89-188` canonical ordering/CAS path/idempotence/inert temp, chain-tamper and missing-blob/deleted-row cases; `:192-220` latest vs immutable ref; `:279-327` 50 queued writes, WAL second connection/reopen; `:332-374` protected reference/cold reads/no rev reuse; `:389-429` copy/reopen/head comparison/disjoint target. These are strong **test recipes**. They do not test same-CID-path byte substitution, envelope/ref tamper, duplicate external operation suppression or multi-write promotion crash recovery.

### Discovery normalization/promotion proof boundary

P inference model `:66-89,124-144` filters malformed refs, dedupes exact triples and drops **span/casRef/other epistemic fields** when normalizing evidence. Bad node/edge counts are recorded, but malformed evidence-ref count is not separately reported. AION can reuse a small total ref validator plus explicit diagnostics while preserving its own span/content/observer identity. Do not destructively narrow an existing evidence schema to these three fields.

P verification test **full body** read `verify.test.ts:31-59,66-154,170-218,271-390,413-472`: probes are constructed with authored passed flags/pre/post objects; fake vault returns **data:{}** for any resolvable key. This concretely confirms the validator checks resolution, not postcondition truth. The test explicitly allows `evidenceRequired=false` promotion (`:188-195`) and reuses an evidence pool modulo length. Source imposes no distinct-run witness requirement. It verifies policy-gap diagnostics, rejection events, resolution dedupe and provider status rows, not independent browser proof.

Each promotion append is atomic **as a vault object**, but promotion event then N realization appends are separate calls/transactions. No transaction grouping, replay run-key guard, snapshot-revision compare or partial-run reconciliation is implemented in the inspected handler. Useful incremental AION method: preserve event ID + actual revision/content identity as an immutable evidence reference and a separately derived view; if AION needs multiple-record consistency, use its current transaction/ledger mechanism and explicit incomplete-derived-state markers—not Omega's multi-call sequence as a new commit protocol.

## R2.5 Provider-LLM and artifact/result truth

P `provider-llm/src/index.ts:34-54` has two genuinely different paths. Default validates request then deterministic simulator and line-emits completion; config.live attempts API execution, stays single-shot and **does not use the shipped SSE parser**. `simulator.ts:20-33,45-86,125-181` provides typed role/content/model/usage/finishReason, sim:true and deterministic seed; “tokens” are **words**, seed is non-cryptographic FNV32, not operation identity or token accounting for a real model. This is a compact fake-provider seam for deterministic contract tests, not provider support.

Live `live.ts:34-105` validates baseUrl/model/credentialId, calls credential.use, requires returned secret, HTTP POSTs `/chat/completions`, parses `choices[0].message.content`, normalizes usage and maps every non-length finish reason to stop. This is implemented HTTP code, **not a runtime receipt**. Actual in-tree path blocks at `index.ts:48` unless capabilities contains **`credential.use`**, while shim token lookup uses **`port:credential.use@1`**. A fake test grants the bare name; production capability spelling/compatibility is not established. Even if passed, in-tree credentials return reference-only sim material (documented refusal), not the needed secret. Live credential call also passes numeric `5000` where shim expects an options object; actual shim falls back to its default. No fetch AbortSignal/deadline cancellation is supplied, so a host timeout does not abort HTTP. These are reasons to adapt the small result contract/mock, not borrow the live connector unchanged.

LLM `parsers.ts:49-81,105-142` is a separate pure **recorded SSE framing transform**, registry-pinned as chat.complete/llm@1. It supports event/data/blank boundaries, OpenAI `[DONE]` or Anthropic `message_stop`, emits frame summaries/deltas/final and refuses absent terminal frame. Important compatibility limit: only incomplete **line bytes** survive `feed`; currentData/currentEvent are local per feed, so frames split across feed calls after complete field lines can lose fields. Whole-string fixture transform masks that gap. It is not ready-made incremental transport. `extractDelta:148-165` ignores malformed/non-JSON data instead of refusing it; final sentinel can still terminate with no assistant text. Adopt framing concepts plus partition-at-every-byte tests rather than advertise full reply completeness.

P `provider-llm/test/llm.test.ts:46-139,160-260` covers deterministic simulator/validation/truncation, missing-live-capability and fake-port refusal, composition signing and READ-risk simulation. It does not exercise an actual HTTP success, disconnect/cancel, arbitrary finish reasons or streamed API result. `tooling/harvest/test/harvest.test.ts:39-73` uses recorded fixture manifest/hash/shape/determinism and governed registry shape, not live provider conformance or incremental feed boundaries. No fixture bodies were fetched in this review.

P `contracts/src/intent-phase3.ts:11-29` ArtifactReference has step/name/contentType/size/provenance; Phase4 declares compensation/context. **No provider-native artifact operation follows from those interfaces.** Actual intent writer only defines unused `applyInputMapping/declareArtifacts` helpers; resolve sets an inputMappingsApplied flag, not output materialization. `intent-phase3-4.test.ts:37-49` is explicitly design-claim testing: one object boolean assertion and two empty bodies. It does not test artifact creation/list/download, safe JSON-pointer mapping or compensation effects.

Result compatibility method worth retaining: distinguish **transport result**, **plugin Outcome**, **typed provider completion**, **advisory chunks**, **immutable stored receipt**, and **artifact reference**. In P web/daemon paths these are nested differently. AION already has result contracts; a tiny adapter must reject outer ok=true with nested refused/unknown and cannot map an API finishReason/stream final to matching web conversation REPLY_CHECKED. That avoids a new generic result framework while eliminating recurring boundary-confusion work.

## R2.6 Reuse decision units and incremental work eliminated

All are recommendations for the owner's existing AION seams, not assigned implementation. Code is owner's source as supplied; absent LICENSE is provenance metadata, not a veto. Dependencies list only what the unit actually needs; no new runtime/package install is proposed.

| Unit / smallest useful boundary | Reuse form and dependencies | AION overlap → incremental work eliminated | Alternatives / compatibility / required test |
|---|---|---|---|
| **U1** Metadata-window→bounded body reads (`web/events.ts:39-80`) | Algorithm + counting-test pattern; async read adapter, no Socket.IO required | Existing observer/journal/cursor remain canonical → avoid N+1/full-body scans in a future history/status projection | Prefer existing storage batch API; return explicit found/missing/gap, cap ID scan and memory. Count requested bodies, retry missing body without advancing cursor |
| **U2** Rejection-safe single-writer queue (`vault/sql.ts:95-105`) | 10-line promise-chain idea, no SQLite dependency for queue itself | Existing ledger mutation path → avoid poisoned write-tail after one failed receipt write | Do not add parallel queue authority if AION already serializes; test failed write followed by success, process-crash durability separately |
| **U3** Exact revision retention and temperature-independent lookup (`sql.ts:225-237`, compaction) | Schema/test method; current AION refs/retention API, not donor store | Existing receipt/PACK history → make replacement/archival checks reuse exact IDs instead of inventing content dedup | Keep current cursor IDs; protected/cold ref remains readable, no revision reuse, coverage gap explicit. No complete evidence proof from ref shape |
| **U4** Atomic evidence-file publication (`cas.ts:18-49`) | Temp/fsync/rename pattern + standard fs/crypto + narrow OS-lock retry | Existing evidence artifacts → eliminate ad-hoc half-written-file repair, not a second CAS | Existing atomic writer preferred. Rehash existing and read bytes; define Windows power-loss claims, test orphan temp and same-path corruption |
| **U5** Copy/reopen comparison harness (`roundtrip` + vault test:405-423) | Test recipe only; existing export/restore plus digest/ref comparison | Existing owner data store → reusable replacement proof without adopting vault/FTS schema | Function ok insufficient; caller compares source head/count/refs/content and simulates interruption. Includes records absent from hot search |
| **U6** Call-stage/late-result contract (`shim`, host ports/worker, daemon client) | Protocol matrix + fake transport tests; existing AION envelopes | Existing Bus deadlines/no-resend → eliminate ambiguity between preflight refusal, transmitted-unacknowledged and observed result | No donor timeout releases AION effect lock. Test EOF/disconnect after dispatch, late success, ignored late chunk, nested deadline; no replay |
| **U7** Boot identity handshake separate from dispatch (`cli:452-498`, daemon ping/use) | Small adapter/status metadata, existing local transport | Existing native host/session setup → avoid boot-generation drift diagnostics disguised as provider readiness | Recipe/spec/build identity is not account/chat identity. Cold fallback only before effect dispatch; test old warm host vs expected generation |
| **U8** Corpus pinned to implementation, not name (`B recipe/canon`, browser tests) | Provenance fields + JS-string and parser parity test corpus | Existing parser/version metadata → eliminate stale-v1 proof and tests of wrong duplicate export | Keep protocol version + implementation digest distinct. No eval of donor code here; future isolated test parses generated JS, tests actual registry on same corpus |
| **U9** Deterministic typed fake provider (`llm/simulator.ts`) | Adapt minimal return-shape and deterministic seed for AION tests; no live/API dependency | Existing adapter tests → reusable varied message lengths/truncation/error envelope tests without browser/network | Existing fixture generator preferred if equivalent; sim marker never stripped, word counts never real token claims; seeded fake output not effect identity |
| **U10** Outcome-layer normalization (`outcome.ts`, web/api, daemon call wrapper) | Tiny mapping/negative-test unit over existing AION schema | Existing durable result/receipt contract → eliminate outer-ok/nested-refused and EXECUTED-label false positives | Preserve original code/stage/detail; no enum migration necessary. Table-test every wrapper and artifact-only/partial stream case |

**No transplant:** Socket.IO web server, private CDP network capture, vault SQLite/FTS/CAS runtime, Omega root consent model, daemon process manager and generic intent machine are not prerequisites to AION's current 40 commands. They remain source references. The alternatives above deliberately retain AION's Bus/ledger/grants/contracts/cursor/PACK implementation and isolate incremental work.

## R2.7 Coverage delta across ALL40 + future65

The exact ledger above remains **40 unique command dispositions**, with provider-web scope unchanged. ROUND2 strengthens PARTIAL references for observe/stream/history.read/recover/receipt.read/result.export/health/tool.call/cancel and explains ui.panel's internal web surface, but **no row becomes MATCH**. API chat.complete is not same-web-conversation send; a local journal is not provider history, and local shutdown is not generation.stop. The 19 P0s are still in scope, not replaced by convenient substrate successes.

All 65 future IDs remain in their original family section. The changed evidence is specifically:

- protocol/receive: detailed no-replay transport and best-effort journal mechanisms, **not** durable receive.cursor/watch_idle/read_full/complete.verify implementations;
- evidence/export: atomic per-object storage, reference retention and copy test methodology, **not** audit.export/response.export product implementations;
- tools/agents: direct web-root execution/result wrappers and deterministic fake provider, **not** native tool/agent entitlement;
- artifacts/files: stronger evidence of declaration/stub boundaries, **no new artifact operation credit**;
- remaining conversation/model/identity/browser/multimodal/memory/settings/workspace/integrations/automation/account families retain prior UNASSESSED or PARTIAL labels. No fake row-level source coverage is inferred from family inclusion.

## R2.8 Source custody hashes, inspected tests and residual exact targets

The following are exact working-file SHA256 at the stated P/BCP HEADs, **tracked delta none** for these cited paths. They are documentary provenance, not copied source bodies. B browser index/live/session/parser hashes remain as ROUND1; BCP prefix is the Git root, B prefix includes omega-baseline/omega-final. Dates in document prose are source-authored dates only where quoted; all other identity is commit+path+line/symbol+hash.

```text
P:shim/src/index.ts 27ec168c458b1c55d5b3ad05d3e22bfe4d32b3c06d2d81f7ed8f388a4ca438f1
P:host/src/worker.ts 8690be66ee488e9d376dd96f4bfb9b5829ee8874bf2bf4ca9f94448d4984e3ef
P:host/test/runtime.test.ts 651fd0c74b733ff046d9fd3c31917e57279d232275065844344708887ff8bc3c
P:surfaces/daemon-client/src/client.ts 796521f13d70002daf40a1ff096d65a6052c8ba239d5e2117fa3a4a0f7185ee4
P:surfaces/daemon/src/daemon.ts 580b9efbe9f2e3eb489db3041109d2f8f98591da3f29df664473a67362e5feb9
P:surfaces/daemon/test/daemon.test.ts 985ac051bb3a4c350e17646e8ffbfc39545ad3c0fc20b440af15af8dd6920448
P:surfaces/web/src/events.ts 9a6ef10bac65d9b4e9762bd0d629600bee262b1bacf374857c16c1b0bf7c75e8
P:surfaces/web/src/api.ts 701c9ac9e2f55ac4bdc38731458b841cffbdc698835c325e8b34c12862ddf95a
P:surfaces/web/test/d387-perf.test.ts 0181e2712bc2337c8c9619946c0ba6eabfa8ea7888879d8bdc19f5d868f19b15
P:surfaces/mcp/test/mcp.test.ts 1c38457a52676a2d47fcd5349d601ad8da39cb1bd2ce39e113a1576b8c4fab88
P:plugins/vivim-vault/src/cas.ts ab6f0e5800da5f536c878552b29cc7b2ac2f19452e2c4e121c05ce7cae98ea0d
P:plugins/vivim-vault/src/changelog.ts e74c0f88c36d6919772f7eae3a763a4214d13a5ef7cb085c52efe158776d32e8
P:plugins/vivim-vault/src/canon.ts 57253d93b40c87bc194af13a044ee1ebfb61f0ee94fa3c6617e2959e496748f0
P:plugins/vivim-vault/src/sql.ts 6961b38880a66cd3f7e60699cfb3ab44f5be8808db5b40395d2e1abe7a881055
P:plugins/vivim-vault/src/validate.ts a09b49f87e9a82971b9f6e50562301e13836a06e3b6465943aabee9507e56940
P:plugins/vivim-vault/src/verify.ts 71eaa421ab31631bae30756e8e28bd1aae36c3a2c4dba4cb05eb352f1b962bba
P:plugins/vivim-vault/src/compaction.ts ea61d3e044b2b6e659d492bc0eb0ce3e8b150bca4182a456d6b2e1de285988e8
P:plugins/vivim-vault/src/roundtrip.ts a53ad38937acde6cf780caa4350b89faacef3c2e45a2356f7291633b1dc41567
P:plugins/vivim-vault/src/index.ts 3370dce0061e92ecc86806fd4afd292ac973e09a9c82fa7f096371c4ca774311
P:plugins/vivim-vault/test/vault.test.ts 37d225c640c1f79827683d2aaec1058f5994aca67e3bcd748dea13c92be79fa3
P:plugins/discovery-inference/src/model.ts 22d7daf9db45cac5b4e400b39900fb6fc37ca99eb0a13b31114fb294251c66ea
P:plugins/discovery-verification/test/verify.test.ts 83c295aa816a36ae7f5a7ab21ab8df27984888e8f86c892749a942524e9a4544
P:plugins/provider-llm/src/index.ts 8b96205f1014bf209042a442e4b9c9d53eb647968d9204d3757f5a790f083b49
P:plugins/provider-llm/src/live.ts 26919604801a363c61325f6978a87be13af89c62a680cb7385f6fdca0a634252
P:plugins/provider-llm/src/parsers.ts 8a03d9ba6f4bcac180decb2474b00a5a66768b0e449eb7dd865c92258ebcafc9
P:plugins/provider-llm/src/simulator.ts 15f32f2d2cf7733fe10d6803823feb6aa5880c21ea1adff846961374099b6a06
P:plugins/provider-llm/test/llm.test.ts 712a0f2506983ef187e8361488432cf17118184c1a5fab966dadf8b52f34c1ec
P:contracts/src/intent-phase3.ts d44a46f363b6f2feaf849bd48648d7ed9eead76da21e5e615dd06a93dbc17ef3
P:contracts/src/intent-phase4.ts d379611100766ae47940dfdac3aaf3bded20e83e50fa887108655349b4a54ee5
P:plugins/vivim-intent/test/intent-phase3-4.test.ts 5b310dfe48857ee381367c0786fb3f1e19d7d78be53cfc3de1c01826462b61a0
P:tooling/harvest/test/harvest.test.ts 80e8ffb74ae10702f7b16a1bfc96a5dd22a4e3991e81274b16dd4ae87b7f7ea1
BCP:docs/CURRENT-CONTEXT.md 1ba674ef7940ea179b3d1aeed0a31744bcf1774735372f9cf5b8427d6bc5d845
BCP:docs/destination/core-vs-plugin-boundary/DESTINATION-RESPONSIBILITY-MATRIX.md a2114dbd0b27b72e13eecf3c4d5aaebf9881c274c8d0beb5f42e32a5b4c8a6c2
BCP:docs/migration/FIRST_VERTICAL_SLICE.md fa498e8c5333c3d3fad2aac8f96c53026922c08dee7c354e3771fae12f8a5911
BCP:docs/migration/FINAL_DECISION_REPORT.md cfd84a9e32db72fc58ed4d7bc4dc4bca9af14f727d5045f022f0c2e6c7fbe9cb
B:docs/migration/30-TRIAGE/TRIAGE-LEDGER.md 2a15d2f2775925985080a03b33460861a3bc62859b4be9cf7622cade64183fd0
B:compositions/browser.json 668d5106e5abebaf4ccebe9314950545ec653910234d4ace0d60902015085562
B:plugins/provider-browser/plugin.json f84e38c93c4d2d4c00d0a9f8e9c69ce852c374fc7e002b9b43e6f0e93957f28a
B:plugins/provider-browser/test/live-send.test.ts 2d5f62a4c68a872ed280a67e446359f3540458cfd6dbf1f3835af9cab46a893f
B:host/src/recipe.ts a2491b9765f4cb675eb7f48e0f05f856fa671c295e0e375586cf67df3aa5a8ab
B:host/src/canon.ts 09c1617996d3c73f57fb45082c64c4346bfbd15d6de4d96710d16f6673e17517
```

**Residual exact source/tests, not quietly marked complete:**

1. Legacy OMEGA-01..08: `Core/vivim-final-enhanced/AGENTS.md`, nested Git identity, `src/engines/session-lifecycle-manager.ts`, `capability-resolution.ts`, `capability-shape-registry.ts`, command-language/provider-data-model owners cited by old findings. These remain **unassessed legacy lineage**, not closed by this P/B review.
2. P transport: `surfaces/daemon/src/{cache,pool,poolboot}.ts`, `surfaces/cli/test/cli.test.ts`, `surfaces/web/src/server.ts`, full `surfaces/web/test/web.test.ts`, SDK transport/cancel tests, host streaming fixtures/tests and actual post-dispatch late-result tests. Core worker/client/events owners are now read; not the whole transport universe.
3. P persistence: `plugins/vivim-vault/test/{integration,driver-conformance,d387-perf}.test.ts`, `src/drivers/{conformance,driver,bun-sqlite,node-sqlite}.ts`; proof against blob/envelope/reference tampering and cross-object partial promotion remains absent from inspected tests. No second store proposed.
4. B browser: exact current P1-08/M4 acceptance and D-418/419/420 decision consumers, `test/m13-containment.test.ts`, full boot falsifier body without planted-secret constants, and new actual-registry parser/JS-validity tests. The read tests do not establish live acceptance.
5. P language/import/healing/agent/run: actual provider import parsers, discovery healing and director/run execution queue ownership, including non-browser artifact consumers outside vivim-intent. No claim of full provider model/command implementation coverage.

**Parent review shortlist (10 source anchors):** BCP `docs/CURRENT-CONTEXT.md`; B `plugins/provider-browser/test/live-send.test.ts`; B `host/src/recipe.ts`; P `shim/src/index.ts`; P `surfaces/daemon-client/src/client.ts`; P `surfaces/web/src/events.ts`; P `plugins/vivim-vault/src/changelog.ts`; P `plugins/vivim-vault/src/verify.ts`; P `plugins/discovery-verification/test/verify.test.ts`; P `plugins/provider-llm/src/index.ts` (with live.ts/parsers.ts neighbors). These cover role, version/content proof, expression test gap, metadata lifetime, no-replay transport, receive gap, transaction boundary, verification limit, asserted evidence and real-vs-sim provider paths.
