# Crosswalk taxonomy — seed batch C-001
Status: PROVISIONAL SYNTHESIS, revised C-002 with remote captures, 2026-10-20. Not an AION specification, implementation, acceptance, or test result.

## Evidence basis and rules
- Input: [16 original reconnaissance findings](../../FINDINGS.md), FINAL-01..08 and OMEGA-01..08. Donor source revisions are UNKNOWN; all original anchors in FINDINGS.md are checkout-local and unverified against immutable donor commits. At initial C-001, Worker A/B capture was not on the base branch; see C-002 remote branch evidence below.
- AION reference: [current CENV-01..14](../../../ARCHITECTURE.md), [observation envelope DATA-01..06](../../../ENVELOPE-CONTRACT.md), and [dual-track command-plane proposal](../../../DUAL-TRACK-COMMAND-PLANE-2026-10-19.md).
- Status labels: source-reported concept, source-observed excerpt, proposed mapping, AION target specification, offline-tested implementation, and live-verified behavior are **different claims**. Do not count researcher report as direct code verification, or an authored donor design as running code.
- These categories organize findings; they do not establish donor authority or recommend adoption. Preserve donor term and meaning before any canonical alias is proposed.

## Multi-axis classification (do not collapse dimensions)
| Axis | Meaning | Original terms / leads | Proposed crosswalk, not replacement |
|---|---|---|---|
| Provider family/type | What kind of provider is addressed (e.g. conversational AI webapp versus bespoke product webapp) | provider realization [OMEGA-04], provider plugin [OMEGA-06], capabilities registry [FINAL-05] | Classification metadata independent of execution |
| Surface | Where an affordance is observed (conversation, composer, UI control, host API) | UI state and binding slot [FINAL-02; OMEGA-03], interactive shape [OMEGA-05] | Exact bound conversation/composer in CENV-01/03 |
| Runtime/executor | Which agent/process performs work; not the vendor identity | Work/Attempt [OMEGA-07], command context [OMEGA-06] | Existing Bus/adapter, or separate ACP executor; not interchangeable |
| Transport/observation method | How commands/events/evidence travel or are observed | stream events [FINAL-01], observation tap [FINAL-07], harness [OMEGA-08] | Existing page/worker/native transport and explicitly attributed observation method |
| Provider realization / adapter | Concrete provider-specific implementation of a semantic action | provider realization [OMEGA-04], ChatGPT adapter [FINAL-08], plugin [OMEGA-06] | Existing AION ChatGPT adapter seam; no imported selectors, cookies, backend API, or CDP path |
| Semantic capability | Provider-neutral meaning of an operation | send/read/regenerate [FINAL-05], command/action distinction [OMEGA-06], unified intent [FINAL-04] | Typed action vocabulary; no second command registry |
| Contextual resolution | Whether this action is usable *here and now* | ResolvedCapability, availability, binding confidence [FINAL-02; OMEGA-03] | CENV-03 tri-state per-action observation; distinct from grant |
| State | Current page vs durable operation vs session/stream lifecycle | stream statuses [FINAL-01], session transitions [FINAL-06; OMEGA-01], Attempt [OMEGA-07] | CENV-01 snapshot, CENV-02 immutable operation, CENV-03 per-action availability |
| Authority | Whether this principal is allowed to perform this exact effect | confirmation token [FINAL-04], destructive flag / when(ctx) [OMEGA-06] | Existing Bus grants and exact binding; not inferred from catalog, visibility or command interpretation |
| Evidence/provenance | What observation at what time supports what fact | trace/event identity [FINAL-01], Attempt/Evidence [OMEGA-07], StageTiming [OMEGA-08] | CENV-07/08/10/12/13; DATA-01..05 |
| Failure/recovery | What failed, and whether an effect may already exist | send resilience [FINAL-03], UNKNOWN_EFFECT/reconcile [OMEGA-02], idempotency [OMEGA-08] | CENV-11, immutable locks, no automatic replay of possibly-submitted actions |
| UX affordance | Control presented to a user; not proof of semantic capability | SendButton and taxonomy [FINAL-05], shape registry [FINAL-07; OMEGA-05] | Observed present/visible/enabled/unique/context_ready are independent tri-state properties |

## Provisional provider taxonomy
1. AI conversation webapp: shared *semantic* candidates (compose, send, read reply, possibly stop or regenerate) but concrete page controls, subscriptions, account/model access and response evidence remain per-provider and per-surface. Seed: FINAL-05, OMEGA-04, OMEGA-06.
2. Bespoke provider webapp: product-specific interaction flows and entities; candidate class only. No item in the 16 findings establishes a tested concrete bespoke provider taxonomy or adapter. Mark UNKNOWN, ask Worker A/B for owning code/seed schema.
3. Native/local runtime provider: an executor/service such as OpenCode over ACP/HTTP is not itself an AI chat webpage. Covered in AION's command-plane proposal, not verified by the donors' 16 findings.
4. Transport family is orthogonal: Chrome page observer, native messaging and ACP are different layers and must not become synonyms for a provider family.
5. Provider/account/model/conversation/session/stream/turn/operation: independent identities with explicit linking rules, not a single overloaded provider ID. OMEGA-04 and OMEGA-08 suggest useful distinctions; definitive schemas depend on Worker A/B source captures.

## Conflicts and irreducible distinctions
| Tempting equivalence | Why it is wrong | Source vs governing AION behavior |
|---|---|---|
| stream complete = reply checked | Stream status is presentation metadata, not task-bound turn proof | FINAL-01 vs CENV-02/08 |
| session idle = chat operation complete | Session health/transition has no positive matching-turn or response evidence | OMEGA-01; FINAL-06 vs CENV-01/02 |
| capability listed = action ready = authorized | Catalog, fresh UI observation and permission are different dimensions | FINAL-02/05; OMEGA-03/06 vs CENV-03/04 |
| high-ranked control = unique actionable control | A guessed selector winner violates exactly-one-target and ambiguous-control blocking | OMEGA-05; FINAL-07 vs CENV-03/06 |
| transport reconnect = safe resend | Send may have taken effect without acknowledgement | FINAL-03 vs OMEGA-02; CENV-11 forbids automatic reactivation |
| content hash / time dedup = durable operation guard | Same text may be a new authorized operation; different texts may race same lock | OMEGA-08 vs CENV-02/11 and existing tombstones |
| cancel/drain/force-stop = browser Stop | Donor operations are not verified to be the current ChatGPT Stop affordance | FINAL-08 vs CENV-14 |
| confirmation token = permission | Dialogue confirmation and Bus authority are separate | FINAL-04 vs CENV-04 |

## Required additions when A/B publish
- Each proposed alias must link at least one landing item ID (VF-/VO-...), its exact immutable source revision, owning path, actual line range, capture status, and whether evidence is design/code/test/observation.
- Keep competing original terms side-by-side; use alias, subclass, shared ancestry, fork or genuine disagreement rather than destructive normalization.
- Record unknown/effect/authority at every mapping boundary. Do not infer live capability or broad provider support from these initial 16 seeds.

## C-002 — remote donor captures incorporated (2026-10-20)
**Supersedes C-001 no-capture assumption above.** Read actual copied excerpts/modules and the published A/B indexes on their isolated remote GitHub branches. FINAL remote: owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7, VF-0001..0008 (8 COPIED_EXCERPT). Omega remote: owenservera/vivim-omega@79ee558d6c7ea77c20f220db2341adaa57b11d44, VO-GH-0001..0027 (15 COPIED_MODULE, 12 FLAGGED). No local Windows checkout was consulted; dirty state unknown/not observable remotely. Neither worker ran tests or a live browser. [A published index](https://github.com/owenservera/aion/blob/harvest/vivim-final-github-20261020/workspace/aion/ops/chrome-relay/harvest/landing/sources/vivim-final/index.jsonl); [B published index](https://github.com/owenservera/aion/blob/harvest/omega-github-20261020/workspace/aion/ops/chrome-relay/harvest/landing/sources/vivim-omega/index.jsonl).

### Critical new classification distinction (do not call these synonyms)
| Dimension | Source-owned vocabulary and evidence | Crosswalk classification |
|---|---|---|
| Concrete webapp/provider manifest | VF-0001 ChatGPT, VF-0002 Claude at final@8a798f91d52574cb3d7db579da516bc1c4aee7b7: category=ai, provider_type=llm, auth_type=browser, declared actions/model/profile/endpoints | **AI chat webapp** family; two distinct provider manifests, not two independently tested browser adapters |
| Generic interactive app archetype | VF-0003 CapabilityShape id=chat_app, expected required send_message/receive_message, optional typing/file/model | **UI archetype/shape**, reusable concept, not a verified current provider instance |
| Bespoke application archetype | VF-0004 CapabilityShape id=coding_ide, required send_message/receive_message/code_execution, extended file_operations/terminal; source excerpt also begins search_engine shape | **Bespoke coding IDE application shape** documented. Not proof a named IDE is integrated/live; selector hints remain historical |
| Source-specific implementation mode | VO-GH-0001 ProviderClass = SIMULATOR / API_NATIVE / BROWSER_MEDIATED, at omega@79ee558d6c7ea77c20f220db2341adaa57b11d44 | **Realization/transport class**, orthogonal to AI-chat vs bespoke family. A ChatGPT or bespoke webapp could conceptually be browser-mediated, but current support is unproven |
| Manifest/routed op risk | VO-GH-0001 RiskClass EXTERNAL_MUTATION/MUTATION/READ; contribution kind, operation version, runtime tier worker-thread/process/wasm (wasm forward-declared) | **Operation/risk and runtime contract**, not app type or current live readiness |
| Provider realization lifecycle | VO-GH-0002/0003/0007: DRAFT, TESTING, PROMOTED, DEGRADED, REQUIRES_REDISCOVERY; ProviderRealization and evidence refs | Historical Omega verification/provenance axis, **not** AION grant, current browser Send enablement or effect |
| Cross-surface action catalog | VF-0005/0008: capabilities with CLI/UI/workflow/MCP/API slots; VO-GH-0005/0009/0015: derive names from composition routed ops for MCP/CLI/chat | Two different catalog designs with conceptual overlap. Neither creates a second AION registry or makes surface listing actuation-ready |
| Negative/ambiguous resolution | VO-GH-0006: UNKNOWN, UNSUPPORTED, AMBIGUOUS, CONTRADICTORY, REFUSED, VERIFICATION_FAILED, EVALUATION_FAILED | Typed **outcome** vocabulary; UNKNOWN means missing concept while CENV UNKNOWN can mean insufficient page observation. Preserve reason and domain rather than equating enum strings |
| Simulated browser/fixture | VO-GH-0008/0012/0013/0014: captured fixture session with redaction and email message.send; CDP leg future/owner-machine-only | **Browser-mediated email fixture**, not live ChatGPT Send nor bespoke coding IDE adapter |

### Provider-family relationship model (revised)
Generic action semantics [VF-0005] and UI archetype [VF-0003/0004] may be shared across webapps. Concrete provider manifests [VF-0001/0002] specify expected operations; a provider-specific realization and runtime transport are separate [VO-GH-0001/0003/0007]. Dynamic capability filtering [VF-0006/0007] uses plan tier, existential rules, dependency bindings and context; it is not a current Send/Stop observation. Availability freshness and Bus authorization must still be obtained separately from AION CENV-03/04/12.

**Genuine disagreement to preserve:** VF-0007's filter drops unsatisfied capabilities from a UI result, while CENV-03 requires tri-state per-action diagnostic observation and explicit failure reason at a bound composer. Omega's PROMOTED status [VO-GH-0002] is a provider realization state, while AION's submission_observed and REPLY_CHECKED are specific operation facts. Do not flatten them into one status. VO-GH-0007 reportedly coerces unrecognized providerClass to SIMULATOR during realization validation; do not borrow that fallback for AION's provider-type classification (unknown should remain unknown).

All new mappings are copied-source observations or conceptual reuse only; no AION implementation/change is implied.
