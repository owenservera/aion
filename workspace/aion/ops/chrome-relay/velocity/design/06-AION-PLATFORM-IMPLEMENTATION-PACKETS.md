# AION Platform — predesigned implementation packets (design v0.1)

**Status:** PROPOSED, NOT DISPATCHED, NOT ACCEPTED_FOR_BUILD. 2026-10-20. This is **one Track B** strategy initiative. Governing design: [semantic master and command protocol](05-AION-PLATFORM-SEMANTIC-GOVERNANCE.md); machine seed [JSON](platform-semantic-seed.json); actual current repair [CENV work order](../../OPENCODE-BUILD-ORDER.md). Parent #32; strategic decision #38; PR #39. C-003 source crosswalk head `7fcd334a` and queue 01–12 in [Harvest PR #41](https://github.com/owenservera/aion/pull/41).

These packets prepare independent implementation choices without overriding current AION code, Windows local master, A/B isolation, exact grants or live browser requirements. The implementation owner may accept, postpone or reject each only after checking actual current branch/head and file ownership. **Do not auto-run** from GitHub documents.

## Packet AP-001 — Provider/family/realization metadata

**Objective.** Make it possible to describe a provider as multiple orthogonal axes (family, concrete provider, app shape, runtime/surface, realization/adapter, semantic capability, live status) **without** rewriting the authoritative Bus registry or attributing fake availability.

**Source anchors.** C-003 queue #04/#08/#09/#10; VF-0001..0005, VF-0010, VF-0019, VF-0021/0025; VO-GH-0001/0003/0007/0030/0033. Donor Final plugin interfaces conflict; unresolved canonical owner means neither interface can be adopted wholesale.

**Existing Track B owners to inspect at implementation head.**
- `extension/src/bus/adapters/chatgpt.js`: `createChatGPTAdapter` manifest and exact canonical conversation ref.
- `extension/src/bus/adapters/opencode-v2.js`: existing native adapter manifest and options.
- `extension/src/bus/contracts.js`: `ADAPTER_MANIFEST_SCHEMA`, Bus agent kinds, permissions.
- `velocity/src/readiness.mjs`: `aion.capability/1` read-only readiness projection.
- `velocity/src/commands.mjs`: current actual CLI commands; do NOT add new operator verbs here as part of metadata.
- `velocity/design/platform-semantic-seed.json`: **design** source, not runtime-loaded capability catalog.

**Proposed minimal outcome.** One read-only, versioned *description/projection* of each **already configured** adapter. A provider can carry `family=ai_chat_webapp` with `realization=browser_mediated` OR `family=native_agent_runtime` with `realization=api_native`; unknown stays UNKNOWN. A feature that is merely specified in a donor manifest is NOT advertised as callable. Bind semantic names by alias to the existing current names (e.g. `conversation.send` → Bus `send`/ChatGPT submit), with no runtime identity rewrite. No generic provider loader or activation based on manifest.

**Negative acceptance.** Static Claude profile has `adapter=null`, `READY` is impossible without real observed binding and grant; missing/invalid family or realization cannot default to SIMULATOR or API_NATIVE; a provider advertises a semantic it does not implement → explicit UNSUPPORTED; same provider can be represented with different app shapes without changing Bus binding identity; current CLI/Bus tests remain unchanged. No new store.

**Rollout/rollback.** Before any implementation, record exact current code owner and tests; make metadata additive; read-only output can be removed without altering grant/ledger/browser journal. Never migrate old operation records for this packet. **Gate:** after P0 real Chrome critical path no longer at risk, or isolated read-only source additions with separate review.

**Status:** READY_FOR_OWNER_DECISION (design only). This packet must not be confused with a second live provider adapter.

## Packet AP-002 — Evidence/availability truth and fail-closed checks

**Objective.** Preserve precise reason/causation and independently observed Send/Stop availability through existing page → worker → journal → adapter → CLI path, preventing misleading `submitted:true` or `generation_incomplete` projection from burying pre-activation truth.

**Source anchors.** C-003 queue #01/#02/#03/#05/#07/#09/#12; VF-0014/0016/0017/0024/0026/0027, VO-GH-0031/0032. Reject actual donor auto-resend and fail-open evaluation logic; source of hazard is NOT evidence current AION has the same bug.

**Existing Track B owners to inspect at implementation head.**
- `extension/src/chatgpt/content.js`: `sendState`, prepare/activate/submit and page observation.
- `extension/src/background/chatgpt-port.js`: handler, first receipt, sanitizer, durable reason path.
- `extension/src/lib/chatgpt-tasks.js`: no-resend tombstones, locks, observer identity.
- `extension/src/bus/adapters/chatgpt.js`: `mapDriverResult`.
- `extension/src/chatgpt/correlate.js`: unchanged evidence requirements.
- `velocity/src/result.mjs` and `velocity/src/readiness.mjs`: existing Bus-derived projections.
- Current CENV-01..14, DATA-01..06 and AC-CENV-01..10; **reuse their active implementation plan, don't fork it**.

**Proposed minimal outcome.** Extend **only missing** bounded stage/reason/target/freshness fields, preserve `true/false/null` as different evidence claims and keep snapshot/operation/action-availability axes orthogonal. Negative diagnostic states remain usable without releasing locks or resending. Provide read-only reasons; avoid original donor selectors, automatic retry, arbitrary code evaluators, or a new state machine.

**Negative acceptance.** Malformed existential/risk rule cannot make external mutation READY; hidden duplicate Send or ambiguous observer blocks activation; Send visible but disabled does not become READY; Stop presence does not establish generation history; click_attempted=false and submission_observed=false never become positive Send solely from adapter `submitted:true`; timer/transport failures retain original failure_stage and failure_reason; lost ACK and process reset result in **zero second sends**; explicit UNKNOWN is preserved when proof is missing.

**Rollout/rollback.** Must integrate through **current CENV owner**, not parallel modifications to the Chrome hot path. Focused offline failures first; current-head `aion selftest` and separately permitted local live verification afterward; preserve browser journal compatibility and never delete unresolved operations. **Gate:** current CENV tasks and active implementation owner coordinate this packet as acceptance criteria, not separate contributor writes.

**Status:** ALIGNED_WITH_ACTIVE_REPAIR / no independent execution authorization.

## Packet AP-003 — Unified semantic command projections

**Objective.** Give CLI, future pane and MCP consumers a common **read-only description** of what the existing canonical Bus and adapters understand, while future design directives can refer to stable semantic IDs. Do not invent a second parser, registry or authorization system.

**Source anchors.** C-003 queue #06 and #07; VF-0005/0008/0009/0011/0018; VO-GH-0005/0006/0009/0015/0035.

**Existing Track B owners to inspect at implementation head.**
- `velocity/src/commands.mjs` `parseCommand`: actual operator syntax (`send`, `observe`, `status`, `capabilities`, `stop`, `resume`, `dispose`, etc.).
- `extension/src/bus/contracts.js`: `OPS=['send','status','cancel']`, typed Bus states/reasons.
- `extension/src/bus/registry.js`: single canonical agent registry and immutable bindings.
- `velocity/src/rpc.mjs`: `aion.rpc/1` pure validator only; proposed `aion.control/1` not already implemented by writing a spec.
- `velocity/src/readiness.mjs` and `velocity/src/result.mjs`: existing read models.
- `extension/src/bus/adapters/chatgpt.js` and `adapters/opencode-v2.js`: distinct effect semantics.

**Proposed minimal outcome.** A bounded, read-only projection (could be exposed via existing `aion capabilities`) of `semantic_id, existing_actual_operation, adapter, supported, current observed readiness, evidence_source/age, authority_independent`. Unrecognized semantic ID is UNKNOWN/UNSUPPORTED; do not dynamically execute arbitrary names. Preserve native-specific OpenCode options without silently passing them to Chrome. Expose `aion.platform.directive/0.1` **only in design documents**, not through the CLI.

**Negative acceptance.** A catalog entry or command-description slot does not confer grant; a design directive pretending to be a Bus `send` cannot dispatch; `inspect/status/observe` cause zero external effects; `cancel`, `stop`, `dispose` are not synonyms; routing `conversation.send` to an executor prompt or another provider without explicit selection is rejected; unsupported native flags on Chrome refuse, not drop; same operation identity used across views.

**Rollout/rollback.** Implement only when the existing discovery command can consume read-only metadata without a schema or command grammar break. Keep alias mappings additive, test source drift and remove projections cleanly if complexity exceeds value. **Gate:** after AP-001 semantic mapping decision; independent of second provider live support.

**Status:** READY_FOR_OWNER_DECISION / not accepted for build.

## Future packet queue (design in parallel, implement after evidence)

- **AP-004 — Second webapp realization:** must demonstrate genuinely distinct provider-specific UI and observed effect; Claude donor manifest alone is insufficient. Test semantic sameness *and* mismatched capabilities.
- **AP-005 — Bespoke provider app shapes:** include coding IDE and non-conversational workflows; requires one actual second distinct app and reasoned unique-target evidence, not a top-ranked generic selector.
- **AP-006 — Versioning and controlled migration:** compare alias-vs-hybrid-vs-one-time taxonomy migration on actual code/old-store snapshot, compute collision/consumer counts and reversible migration; none authorized now.
- **AP-007 — Capability proof/lifecycle:** historical SOURCE_OBSERVED/OFFLINE_TESTED/LIVE_VERIFIED and volatile current readiness cannot share one status field; test expiry and provider drift independently.

## Dependency sequence and ownership

```text
Harvest source records + C-003 ──┬── AP-001 (provider taxonomy)
                                 ├── AP-002 (CENV evidence repair; current critical path)
                                 └── AP-003 (command semantics; read-only)
AP-001 + AP-003 ──> AP-004/005 (second-provider proof)
All evidence + compatibility study ──> AP-006 (migration decision only)
AP-002 evidence semantics ──> AP-007 (proof/availability extension)
```

**Design parallelism:** AP-001 and AP-003 may be prepared in parallel with active AP-002/CENV execution; they must not mutate shared hot-path source until their separate adoption gates. Harvest workers continue to own source intelligence; platform strategist owns design/decisions; existing Track B code owner owns execution and tests.

**Acceptance of these packets:** approved exact current-head owner-file list, reviewed crosswalk, minimum code diff, failure-mode matrix, compatibility + rollback, actual test command/receipt and (where required) authorized live verification. **No automatic developer kickoff from this document.**
