# Capability coverage and gaps — seed batch C-001
Status: PROVISIONAL, no implementation priority assigned. Evidence: [FINDINGS](../../FINDINGS.md), [taxonomy](taxonomy.md), [provider matrix](provider-matrix.md), [CENV](../../../ARCHITECTURE.md), [DATA](../../../ENVELOPE-CONTRACT.md).

## Evidence and coverage notation
- F = first-pass finding or reported candidate; O = source excerpt directly observed in original FINDINGS (only where explicitly identified); D = donor design proposal; A = existing AION **target specification** (not installed/implemented proof); P = A/B captured immutable landing record; T = recorded offline test; L = current authorized live observation.
- A category having F or O does **not** mean AION provides it, nor that a donor implementation works. At C-001 donor revisions and A/B P records were not yet visible; C-002 below adds pinned remote captures. No Crosswalk-run tests were performed. Do not assign numeric scores that hide these distinctions.
- Scope is relevant concepts across donors, not a claim to have exhaustively inspected either repo. High-value gaps are collection requests, not build priorities.

| Capability / question | Vivim-final seed(s) | Vivim-omega seed(s) | Existing AION target/seam | Evidence currently held | Gaps/uncertainties |
|---|---|---|---|---|---|
| Provider family/type + concrete provider realization | FINAL-02/05/08 | OMEGA-04/06 | Existing ChatGPT-bound adapter; future provider classification not in bounded CENV repair | F; donor design for OMEGA-04; A | Actual provider classes, tested provider instances, canonical source owner, bespoke-webapp families UNKNOWN |
| Generic semantic actions (send/read/regenerate) | FINAL-04/05 | OMEGA-06 | Existing Bus command meanings; extension ChatGPT path | F; A | Semantic names vs vendor implementation; command definition/registry ownership; supported native actions UNKNOWN |
| Exact browser surface + active composer | FINAL-05/07/08 | OMEGA-05 | CENV-01/03/04/05/06 | F; A | Live control identity, unique target validation, ambiguity, changing editor identity; no donor current-browser verification |
| Contextual availability / binding confidence | FINAL-02/06 | OMEGA-03 | CENV-03/12, DATA-01..03 | F; original OMEGA-03 excerpt observed; A | Full rule evaluator, instantiated seeds, freshness, conflict/unknown handling |
| Independent Send and Stop observations | FINAL-05/08 | OMEGA-03/05 | CENV-03/14 | F; A | Specific donor Stop control binding unknown; no claim Stop can act; per-action method/reason missing |
| Conversation snapshot vs durable operation vs session status | FINAL-01/06 | OMEGA-01/07 | CENV-01/02, immutable guard | FINAL-01 O; OMEGA-01 excerpt O; A | Verify complete lifecycle module; no complete source turn machine; transitions are not translatable 1:1 |
| Stream events / generation start-end / reply settling | FINAL-01/08 | OMEGA-08 | CENV-07/08, current strict correlator | FINAL-01 O; F; A | Task-bound paired start/end in live DOM, stable candidate, flicker, late events; source stream UI status alone not sufficient |
| Observation method + raw-to-semantic projection | FINAL-07 | OMEGA-05 | CENV-01/03, DATA-01..04 | F; A | Owning observation implementation, required signals, ambiguity behavior; avoid copying collectors or selectors |
| Intent, command context, confirmation, grants | FINAL-04 | OMEGA-06/07 | Existing Bus reservation/grant/operation IDs | F; A | Real token resume/when(ctx) semantics, live authorization, execution-to-result ownership |
| Evidence identity and correlation | FINAL-01/04/08 | OMEGA-07/08 | DATA OperationEvidence, existing correlator and durable store | FINAL-01 O; F; A | Identity derivation, exact effect boundary, temporal ordering, schema migration; copied hash collision/mismatch |
| Stage timing, deadlines and telemetry | FINAL-01/03 | OMEGA-08 | CENV-09/10/12/13; DATA timing contract | F; A | Separate prep/submission/response budgets, monotonic age, actual observed performance and failed-stage preservation |
| Failure classification and unknown effect | FINAL-03 | OMEGA-02/08 | CENV-10/11, DATA-04/05 | FINAL-03 O; OMEGA-02 D/O; A | Distinguish pre-dispatch definite no-send from post-dispatch uncertain; avoid claim that generic retry classifications authorize resend |
| Retry, reconciliation and duplicate suppression | FINAL-03 | OMEGA-02/08 | Existing immutable tombstones/locks, read-only reconcile | FINAL-03 O showing hazardous resend; OMEGA-02 D/O | Not transferable: auto resend, last-message replay, content-hash/window dedup, unlock by reconnect |
| Cancellation, stop, drain, force-stop | FINAL-08 | OMEGA-06 (only generic flag/context) | CENV-14 read-only Stop availability; independently authorized Stop future action | F; A | Real provider Stop semantics vs local cancellation unknown; no implicit RPC extension |
| Plugin/adapter contract and extension points | FINAL-02/05/08 | OMEGA-04/06 | Existing AION adapter boundaries; no parallel architecture | F; A | Implementation ownership, compatibility, provider version/feature negotiation, security model |
| Test fixtures, negative cases and evidence provenance | FINAL-03 (test file unread) / 05 | OMEGA-08 (contract only) | AC-CENV-01..10 in [acceptance](../../../FALLBACK-AND-ACCEPTANCE.md) | F; A | Donor test code/commands/results not read; no crosswalk tests run; real browser proof separate |

## Explicitly missing coverage, not asserted absence
1. Complete schema/call graph for category > provider family/type > provider instance > account/model > surface > current action. The first 16 findings are not a source-wide inventory.
2. Bespoke webapp provider implementations and their divergence from shared AI conversational patterns. Worker A/B should preserve examples instead of forcing every provider into ChatGPT-like semantics.
3. Provider realization lifecycle: configuration source, rule engine and seed values, live feature detection/negotiation, account availability and stale overrides.
4. Real prepare -> activate -> matching submission -> observed generation start/end -> checked reply owner code and tests in both donors, with proven distinction between internal labels and effects.
5. Exact-copy/fork relationships of Omega Core, BCP-dev, FullTest and experiments, including whether the top-level final repo shares ancestry; see [duplicates](duplicates.md).
6. Safe read-only observation methods and bounded data retention. Avoid private transcripts, arbitrary DOM/network/console collection, cookies, credentials and undocumented provider APIs.
7. Concrete offline test receipts, revision-pinned modules and source line anchors from the current A/B workers. Old file paths may have been migrated/deprecated.

## Per-finding disposition ledger (all 16 seed IDs accounted for)
| ID | Concept to carry forward | Evidence caution / rejected mapping |
|---|---|---|
| FINAL-01 | stream event identity, timestamp, order | O on 110-line frontend shared module; stream complete != operation reply checked |
| FINAL-02 | capability + rule/binding contract | partial researcher report; evaluator/seed unknown |
| FINAL-03 | typed failures, failure stage | O on resilience module; **reject resend and replay-last-message** |
| FINAL-04 | interpreted command, confirmation, trace | report only; tokens not authority |
| FINAL-05 | semantic affordance taxonomy and registry | reported code; SendButton hotkey not proof of action |
| FINAL-06 | session state transitions, binding ladder | owner partial read; session != turn |
| FINAL-07 | raw observation projection | shape read partial; avoid broad collectors/selectors |
| FINAL-08 | terminal/cancel distinctions | adapter reported complete but unvalidated; Stop not proven |
| OMEGA-01 | legal session transitions with evidence | O on first 125 lines, not complete 649-line module |
| OMEGA-02 | UNKNOWN_EFFECT/reconcile as design | O on 28-line design, not execution |
| OMEGA-03 | contextual availability/binding | O excerpt only, full rule engine unread |
| OMEGA-04 | semantics -> realization -> context -> evidence model | donor design reported, parent unvalidated |
| OMEGA-05 | required/optional UI projection | partial/identified-only ranges; no priority winner |
| OMEGA-06 | command spec and runtime prerequisites | researcher report only; when(ctx) not permission |
| OMEGA-07 | Work/Plan/Attempt/Evidence model | design reported; don't create second object store |
| OMEGA-08 | message identity, stages, dedup | partial owner reads; hash dedup not durable tombstones |

## Coverage update protocol
When A/B publish, add immutable VF-/VO- capture IDs beside each seed, with source_revision, source_path, line_ranges, coverage, copied_paths and hashes. Move evidence level to P only for actual captured scopes; move to T or L only with exact command/run/UTC or authorized observation. Preserve each donor's original concept even if Track B does not adopt it. No auto-prioritization or product readiness promotion follows this table.

## C-002 — actual remote capture coverage (supersedes seed P=0)
Source revisions: final@8a798f91d52574cb3d7db579da516bc1c4aee7b7 and omega@79ee558d6c7ea77c20f220db2341adaa57b11d44. Worker A published 8 excerpt-copied records; Worker B published 15 complete small modules/documents and 12 flagged search-hit candidates, all without live tests. The original 16 FINDINGS IDs remain *local reconnaissance leads*, not equivalent to these pinned remote files. This source capture coverage does not imply that AION implements, grants or currently supports the capabilities.

### Capture ID -> coverage map (all 35 IDs)
| Remote landing IDs | Kind / observed domain | C-002 evidence | AION topic without adoption |
|---|---|---|---|
| VF-0001; VF-0002 | ChatGPT and Claude static manifests (final seeds/providers/manifests.ts) | 2 copied excerpts, final@8a798f91d52574cb3d7db579da516bc1c4aee7b7 | Named AI-chat provider instances; capabilities declared, no actual Send state |
| VF-0003; VF-0004 | Generic chat_app and bespoke coding_ide shape examples | 2 copied excerpts, same final shape owner | UI archetype and projection; selectors are hints, not proof |
| VF-0005 | Semantic capability catalog | copied excerpt, final capability-taxonomy.ts | semantic operation vs UI affordance |
| VF-0006 | Resolved capability type/availability-gating contract | copied excerpt, final capability-resolution.ts | per-action resolution and metadata; not current availability |
| VF-0007 | Plan tier / existential rule / dependencies active-binding filter | copied excerpt, same final resolution owner | context rule filtering, separate from action observation and Bus permission |
| VF-0008 | Unified capability surface/handler contract | copied excerpt, final unified-registry.ts | semantic catalog projection across surfaces |
| VO-GH-0001 | Plugin manifest, RiskClass, ProviderClass and runtimes | copied complete module, omega contracts/src/manifest.ts | Provider realization mode, independently of app family |
| VO-GH-0002 | RealizationStatus, EpistemicStatus, provenance | copied complete module, vocabulary.ts | provenance confidence vs freshness/current control |
| VO-GH-0003 | ProviderRealization and consolidated contract facade | copied complete module, provider.ts | realization identity and evidence references |
| VO-GH-0004 | PortResult, StreamChunk, stream sequence | copied complete module, port.ts | ordered stream evidence, not response completion proof |
| VO-GH-0005 | shared routed-op surface metadata | copied complete module, surface.ts | single derivation for listed capabilities |
| VO-GH-0006 | OutcomeStatus UNKNOWN/UNSUPPORTED/AMBIGUOUS/CONTRADICTORY/REFUSED | copied complete module, outcome.ts | preserve negative result distinctions |
| VO-GH-0007 | realization-driven provider registry + activity | copied complete module, providers registry.ts | liveness independent of current UI readiness |
| VO-GH-0008 | browser fixture SessionRecord/CaptureRecord | copied complete module, provider-browser session.ts | separate session/evidence from live ChatGPT operation |
| VO-GH-0009 | deterministic-first command resolution | copied complete module, vivim-chat resolve.ts | interpretation distinct from permission/effect |
| VO-GH-0010 | conversation, message, stream identity | copied complete module, chat.ts | scoped lineage vs matching external submission |
| VO-GH-0011 | resolve / routed-capability unit tests | copied complete **test source**, not run | future test pattern only; no OFFLINE_TESTED credit |
| VO-GH-0012 | browser plugin manifest, fixture email send | copied complete manifest; no live execution | example realization, **not ChatGPT transport** |
| VO-GH-0013; VO-GH-0014 | Browser mediation and four pre-send fixture bars decisions | 2 complete design documents; not rerun | fail-closed preflight concepts, but no design authority |
| VO-GH-0015 | MCP/CLI surface-routing design | copied complete documentation; no running evidence | capability listing independent of action availability |
| VO-GH-0016; VO-GH-0017 | Browser fixture handler; falsifier test | **FLAGGED**, no excerpt copied | implementation boundaries/test evidence pending |
| VO-GH-0018; VO-GH-0019; VO-GH-0020; VO-GH-0021 | discovery verify/observe/map/infer owner modules | **FLAGGED**, no excerpt copied | verify fresh observation/promotion/ambiguous candidates |
| VO-GH-0022; VO-GH-0023 | chat handler and MCP listing | **FLAGGED**, no excerpt copied | command dispatch/visible tool surface boundaries |
| VO-GH-0024; VO-GH-0025 | intent and agent delegation | **FLAGGED**, no excerpt copied | potential over-architecture; current Bus is authoritative |
| VO-GH-0026; VO-GH-0027 | provider proof-bar decision; perception | **FLAGGED**, no excerpt copied | provenance method and readiness evidence pending |

### Changed gap interpretation
- **Partially filled:** concrete static provider examples (ChatGPT + Claude) and UI archetype contrasts (chat_app vs coding_ide) are now documented with immutable remote final revision [VF-0001..0004]. This is NOT real provider execution evidence.
- **Partially filled:** Omega's provider realization/risk/outcome/capability-surface terminology is now pinned [VO-GH-0001..0015]; the remote repository is a different module layout than the local Core/BCP-dev/FullTest source cited in OMEGA-01..08.
- **Still open:** current browser observation/readiness for two distinct providers, a named live bespoke IDE adapter, live Send/Stop semantics, exact cross-repo ancestry, full owner implementations for VO-GH-0016..0027, actual negative test receipts, and donor-to-AION status compatibility.
- **Source coverage is not usage coverage:** exact file captures, schema implementation and true remote effect must be tracked on different axes. Source status COPIED_MODULE never implies test passed.

Separate source inventories remain on the independent branches: [VF index](https://github.com/owenservera/aion/blob/harvest/vivim-final-github-20261020/workspace/aion/ops/chrome-relay/harvest/landing/sources/vivim-final/index.jsonl) and [VO index](https://github.com/owenservera/aion/blob/harvest/omega-github-20261020/workspace/aion/ops/chrome-relay/harvest/landing/sources/vivim-omega/index.jsonl).

## C-003 — exhaustive final index delta and coverage
Final: `owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7`, capture branch head `4454f9b913b4e3e5baeb8671daab127ca36030b3`, 27/27 `VF-0001..0027` COPIED_EXCERPT. Omega: `owenservera/vivim-omega@79ee558d6c7ea77c20f220db2341adaa57b11d44`, capture branch head `556aaaace61b3321c68c56bed1a8f7f96d697b8c`, 38 `VO-GH-0001..0038`, 26 copied, 12 flagged. No donor runtime tests or current-browser verification.

**Final second-batch copied IDs (19):** VF-0009 unified registry execution; VF-0010 legacy provider plugin; VF-0011 command context/preconditions; VF-0012 conversation/artifact normalization; VF-0013 session transitions; VF-0014 observation tap; VF-0015 message identity; VF-0016 unsafe send retry; VF-0017 stream observation; VF-0018 NL confirmation; VF-0019 messaging app families; VF-0020 live-capability versioning; VF-0021 Claude feature declaration; VF-0022 SendButton presentation; VF-0023 ChatGPT message DAG; VF-0024 unsafe retry regression test (read, not run); VF-0025 alternative provider interface; VF-0026 malformed existential rule fail-open; VF-0027 state transition audit.

**Omega second-batch copied IDs (11):** VO-GH-0028 verification evaluator; 0029 promotion policy; 0030 candidate solver; 0031 blueprint/risk default; 0032 causal trace; 0033 UI inference; 0034 fixture parser; 0035 computation resolve; 0036 chat store; 0037 provider read handlers (sessions deferred); 0038 fixture browser Send excerpt. The remaining **12 flagged** records VO-GH-0016..0027 do not become COPIED by virtue of these partial helper/owner captures.

### Updated coverage / gaps
| Domain | New source IDs | Coverage now / remaining unknown |
|---|---|---|
| Provider family, interface and specialized features | VF-0010/0019/0021/0025 | Captured declarations; competing interface versions, active production owners and current model support UNKNOWN |
| Live capability filtering | VF-0020/0026; VO-GH-0028/0029 | Captured rules/proof policy with fail-open risk; AION present-page truth unproven |
| Command interpretation and surfaces | VF-0009/0011/0018; VO-GH-0035 | Source code/schema available; distinct authorization/execution still required |
| Observation/event and causal trace | VF-0014/0017/0027; VO-GH-0032 | Bounded source excerpts/helpers; no current-provider positive submission and reply-completion proof |
| Conversation and message identity | VF-0012/0015/0023; VO-GH-0036/0037 | Donor normalization/store; no exact browser conversation binding |
| Unknown-effect / retries | VF-0016/0024; VO-GH-0038 | One **unsafe** retry implementation/test and one **simulated email** send. Neither can be adopted as AION Send path |
| UI discovery and conflict resolution | VF-0022; VO-GH-0030/0031/0033 | Candidate selection and source UI presentation, not exactly-one real Send control |
| Browser fixture and parser tests | VO-GH-0034/0038 | Fixture-only, no live browser evidence |
| Additional source owners | VO-GH-0016..0027 | 12 flagged; the captured second-batch helpers do not prove full entrypoint behavior |

**Total indexed donor candidate coverage C-003: 65 IDs = 27 Final captured excerpts + 26 Omega copied records + 12 Omega flagged-only.** The original 16 FINDINGS research leads remain a separate, overlapping earlier inventory; they are not 16 more unique validated components. No donor tests executed by Crosswalk.


## C-004 — literal-ID coverage correction and machine-readable lineage
The C-003 prose used ranges and family shorthand. A literal-ID audit identified four Omega IDs that were only implicit. Their individual meanings, from the pinned Omega index, are:
- **VO-GH-0029:** copied complete `plugins/discovery-verification/src/policy.ts` — versioned verification/promotion policy and parser registry; historical policy is not current browser readiness.
- **VO-GH-0031:** copied complete `plugins/discovery-mapping/src/blueprint.ts` — normalization defaults missing declared risk to READ, which must not be applied to inferred browser mutations.
- **VO-GH-0033:** copied complete `plugins/discovery-inference/src/infer.ts` — UI-affordance heuristics, not a unique/authorized Send.
- **VO-GH-0037:** copied complete `plugins/vivim-providers/src/index.ts` — read handlers and explicitly deferred session-start bookkeeping; not real browser attachment.

**Full crosswalk:** [crosswalk-ledger.jsonl](crosswalk-ledger.jsonl) contains exactly **65 independently named rows** (27 VF + 38 VO), each with immutable donor revision, owning path/line ranges, declared capture status, coverage, source/copy hashes **as reported by the donor worker**, capture branch commit, primary AION seam and proposed transfer warning. Its six primary-seam groups total 17 provider taxonomy, 15 semantic capabilities, 11 contextual capability resolution, 11 observations, 8 state/identity, and 3 effect/recovery records. No double counting by group.

**Read/verification distinctions:** A/B indexed and captured 53 records (28 excerpt copies and 25 complete module/document copies), plus 12 Omega flags without captured source. Crosswalk directly inspected selected excerpts/modules and independently recomputed the published copy SHA-256 for **VF-0026 and VO-GH-0030 only**, both matched. Remaining hash entries are worker-reported, not independently rehashed by C. No local checkout, donor tests or live provider checks. A full 53-file independent checksum sweep was attempted but not completed due to the connected-tool call limit; no claim of such verification is made.

This ledger is a research index, not an accepted AION provider schema. `aion_integration_approved=false` for every row.
