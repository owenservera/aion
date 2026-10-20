# Crosswalk taxonomy — seed batch C-001
Status: PROVISIONAL SYNTHESIS, 2026-10-20. Not an AION specification, implementation, acceptance, or test result.

## Evidence basis and rules
- Input: [16 original reconnaissance findings](../../FINDINGS.md), FINAL-01..08 and OMEGA-01..08. Donor source revisions are UNKNOWN; all original anchors in FINDINGS.md are checkout-local and unverified against immutable donor commits. Worker A/B capture not yet published on the inspected landing branch.
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
