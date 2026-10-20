# Track B donor intelligence — prioritized decision and integration queue C-003
**2026-10-20 / Worker C.** RECOMMENDATIONS ONLY: no architecture/spec/code adoption, no Windows gate, no tests or live effects. Source inventory 27 VF + 38 VO-GH records. Keep main Chrome Track B repair moving while considering these as later additive improvements.

## Priority rubric
- **NOW / P0** = protect already mandatory AION invariants or expose latent unsafe migrations; no donor code import.
- **NEXT / P1** = high leverage, low implementation intrusion and clear current AION seam.
- **FOLLOW / P2** = useful expansion after current single-provider vertical slice.
- **HOLD / P3** = needs additional owning-source evidence or a second concrete provider.
- **REJECT** = unsafe literal transfer, not rejected research insight.

## Ordered, bounded queue
| Order / class | Candidate decision or slice | Donor source IDs | Existing AION destination / prerequisite | Reviewable acceptance evidence |
|---|---|---|---|---|
| 01 P0 | **Block fail-open capability rule defaults for any future evaluator**; record hazards, do not import donor rule engine | VF-0026, VF-0007, VO-GH-0031 | CENV-03/04/12; existing AION capability/action guards. Current AION code not shown to share the bug | Unit negative case: malformed rule, unknown risk or unknown context never authorizes/send; explicit reason preserved |
| 02 P0 | **Reject all uncertain external-effect retries and resend-as-recovery** | VF-0016, VF-0024, OMEGA-02 (original design lead) | Current immutable Bus ledger, locks, reconciliation CENV-11 | Transport loss after potential dispatch generates no second Send even across reconnect/surface/adapter |
| 03 P0 | **Preserve exactly-one target; no ranked ambiguous-control activation** | VF-0003/0004/0022, VO-GH-0030/0033 | CENV-03/06, current page observer | Hidden duplicates, ambiguous Send candidates and stale selectors yield UNKNOWN/BLOCKED, zero activation |
| 04 P1 | **Layer provider taxonomy, not one-time replacement:** application family, provider identity, realization class, surface/runtime/transport, semantics, readiness and authority as independent metadata | VF-0001..0005, VF-0010, VF-0019/0021/0025, VO-GH-0001/0003/0007 | Existing ChatGPT adapter/Bus registry + proposed capability snapshot; initially design only | Two static vendor manifests + two app shapes map losslessly, with UNKNOWN live readiness and no new grants |
| 05 P1 | **Add scoped provenance/reason vocabulary to existing operation output (only missing fields)** | VF-0014/0017/0027; VO-GH-0002/0004/0006/0032 | CENV-10/13, DATA-04/05; page -> worker -> journal -> CLI | A pre-activation error retains its precise stage/reason; stale/contradictory evidence does not become false or succeeded |
| 06 P1 | **Make discovery introspection a read-only projection of the existing canonical Bus registry** | VF-0005/0008/0009, VO-GH-0005/0009/0015/0035 | Existing Bus command/adapter surface and CLI ping/readiness | Command advertised across surfaces without enabling execution, bypassing grants or creating a second registry |
| 07 P1 | **Differentiate session/stream/conversation/message/operation identity** | VF-0012/0013/0015/0017/0023/0027, VO-GH-0010/0036/0037 | CENV-01/02/07/08 and existing correlator | Session idle, stream complete or message stored alone never advance original operation to submission/reply checked |
| 08 P2 | **Add narrowly-scoped app-shape metadata for bespoke UI providers** | VF-0003/0004, VF-0019, VO-GH-0030/0033 | Future second provider adapter, NOT current Send repair prerequisite | Demonstrate 1 real AI chat provider and 1 genuinely different bespoke provider with different capabilities before generalizing |
| 09 P2 | **Discover historical proof/promotion and freshness separately** | VF-0006/0007/0020/0021, VO-GH-0002/0007/0028/0029 | Existing real-time CENV-03/12 and provider metadata | PROMOTED historical provider with disabled/ambiguous current Send remains unavailable |
| 10 P3 | **Resolve competing Final provider interfaces and remote/local Omega ancestry** | VF-0010/0025, older OMEGA-01..08 vs VO-GH remote, VO-GH-0016..0027 flagged | Read active callers/registry before any migration or code adaptation | Immutable module owner/actual import graph, same-revision tests and canonical destination |
| 11 P3 | **Study discovery verification internals and fixture preflight** | VO-GH-0018..0021, 0026/0027 flagged, 0028..0034/0038 | Evidence-research only; no browser controller import | Bounded owning-module read, declared limitations, no secrets copied, no assumption of live Chrome |
| 12 REJECT | **Direct donor code transplant for CDP/credential scraping/auto-resend/generic selector ranking/dynamic code injection** | VF-0010/0016/0020/0023/0024/0026; VO-GH-0030/0031/0038 | No admissible Track B runtime seam | These transfers stay explicitly rejected without user-approved separate design/security decision |

## Decision graph and strategy
A. **Default posture: incremental extension, no one-time taxonomy migration.** No captured evidence yet proves a migration necessary to solve current CENV repair; one migration risks conflating axes and breaking source identity. Preserve previous records; version additive metadata.
B. **Short-term:** CENV existing 3-axis model (conversation snapshot, operation lifecycle, Send/Stop availability) remains. Tie semantic capabilities and provider class to read-only descriptions; do not replace the runtime state machines.
C. **Expansion trigger:** after current ChatGPT command-to-checked-reply slice passes its own targeted acceptance, use a *second distinct real* provider to pressure-test family/realization classification and adapter seam, before promoting general abstractions.
D. **Explicitly separate:** source evidence/confidence, historic promotion, live freshness, current action readiness, owner authority and observed remote effect.
E. **Promotion ladder:** harvested -> crosswalked -> development owner disposition -> branch implementation -> offline negative tests -> separately authorized live verification. No promotion from GitHub docs alone.

## Dependency chains
- P0 (01-03) are **review constraints**, not instructions to modify current Track B product as part of harvest.
- P1 04 precedes P2 08/09; P1 05/07 can advance independently within current AION evidence contract only after owner chooses to implement.
- P1 06 depends on existing Bus operation/routed-op catalog being canonical, not on Omega's root-principal grant system.
- P3 10/11 should not block the existing Chrome Send repair.
- No item enables Playwright, Puppeteer, CDP, broad page collection or fixture-based fake Send receipts.

## Review owners / handoff
Track B development owner decides D1 additive vs migration, D2 exact fields/compatibility, D3 current-repair sequencing. Workers A/B own further donor source capture. Worker C owns mapping updates and duplicate relationships. All three branches may be integrated after conflict checks; crosswalk does not require Windows.


## C-004 — strategic choice matrix and execution-ready acceptance handoff
The decision below is *Crosswalk recommendation*, not an adopted AION migration or a change to the CENV command environment. It reflects the final 65-item harvest; no runtime tests/changes were performed.

| Alternative | Scope | Benefit | Cost/risk | Crosswalk disposition |
|---|---|---|---|---|
| **A. Keep canonical Track B, add versioned taxonomy metadata (recommended)** | One provider-family axis plus realization-class axis and explicit evidence references; project as optional data through existing registry/adapter | Reversible, supports future bespoke apps and doesn't block the current Send/observe repair | Does not immediately generalize runtime provider execution | **RECOMMEND** for a separately reviewed slice |
| B. One-time global taxonomy migration | Replace current records/registries/schemas in one pass | Uniform model after migration | High compatibility, provenance-loss and authority-conflation risk; donor canonical owner unresolved | **DEFER**; no evidence of necessity |
| C. Long-lived dual taxonomy runtime | Maintain two authoritative registries and bidirectional sync | Migration flexibility | Split-brain names, stale readiness, duplicate action ownership | **REJECT as default**; use temporary offline mapping for a narrow compatibility migration only if later justified |
| D. Transplant donor provider engines | Import full provider/discovery/retry/shape components | Rapid donor feature breadth on paper | Unsafe resend, risk-class defaults, fail-open rules, guessed selectors, private API/CDP paths | **REJECT** without new evidence and separate security architecture decision |

### Owner disposition packet (specific implementation entrypoints and falsifiers)
1. **Current priority stays the existing CENV vertical slice:** existing `extension/src/chatgpt/content.js`, `extension/src/background/chatgpt-port.js`, `extension/src/lib/chatgpt-tasks.js`, `extension/src/chatgpt/correlate.js`, and `extension/src/bus/adapters/chatgpt.js`. Existing CENV specs—not harvested files—govern verification. Harvest creates **no Windows test gate** and no reason to delay ongoing repair.
2. **Optional P1 metadata slice, after owner acceptance:** add read-only semantic classification with `application_family` (e.g. `ai_conversation_webapp`, `bespoke_coding_ide`, `unknown`) and `realization_mode` (e.g. `browser_mediated`, `api_native`, `simulator`, `unknown`) as **two independent versioned fields**. Current provider, account, conversation binding, transport, runtime, supported action and freshness remain separate. This shape is **PROPOSED**, not canonical; do not force every app into one class. Sources VF-0001..0004, VO-GH-0001/0003.
3. **Optional P1 read-only capability projection:** existing AION command/adapter registry maps semantic action to provider realization; expose which capabilities are catalogued vs observed fresh vs Bus-authorized vs effect-proven. Do **not** create a new execution route. Sources VF-0005..0009, VO-GH-0005/0009/0015; existing CENV-03 and DATA-01..05.
4. **Negative acceptance falsifiers if any slice is implemented:** (N1) malformed existential rule cannot permit Send [VF-0026]; (N2) missing risk never downgrades external mutation to READ [VO-GH-0031]; (N3) multiple eligible Send candidates block instead of ranked actuation [VO-GH-0030]; (N4) ambiguous/transport-lost dispatch never triggers a second Send [VF-0016/0024]; (N5) provider PROMOTED with stale UI state remains not ready [VO-GH-0028/0029]; (N6) simulated email fixture Send never yields REAL_CHATGPT_SENT or M1 [VO-GH-0038].
5. **Migration criteria, not timeboxes:** change option A only if verified second real provider shows unrepresentable semantics in the existing adapter; immutable old records can be read under a schema-version compatibility path; positive and negative tests prove no original effect/authority fact was reclassified; rollback doesn't discard tombstones/grants.

### Crosswalk machine-readable release input
[crosswalk-ledger.jsonl](crosswalk-ledger.jsonl) contains one row per captured/flagged donor candidate, exactly 65, pinned provenance, primary seam, observed capture status, unsafe behavior flags and `aion_integration_approved=false`. It is **research metadata**, not a runtime registry. Full source SHA validation remains a worker-reported property, with only two samples independently checked by Crosswalk.

**Reviewer action:** disposition A vs B vs C vs D and the optional P1 slice is a development-owner decision. No acceptance is implied by opening or merging this PR.
