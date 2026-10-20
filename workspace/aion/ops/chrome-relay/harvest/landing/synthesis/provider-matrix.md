# Provider / surface / capability crosswalk — seed batch C-001
Status: PROVISIONAL, source revisions UNKNOWN. This is a typed *evidence matrix*, not a list of supported AION providers. Refer to [FINDINGS](../../FINDINGS.md), [taxonomy](taxonomy.md), [CENV](../../../ARCHITECTURE.md) and [DATA](../../../ENVELOPE-CONTRACT.md).

## Axes and reading key
Family/type -> surface -> runtime -> transport/observer -> concrete adapter -> semantic capability -> contextual availability -> authority/effect evidence. Each column is independent. **UNKNOWN** is intentional, never silently mapped to false or unsupported.

| Subject / evidence | Provider family/type | Surface | Runtime and transport | Concrete realization / adapter | Semantic capability | Resolution, authority, effect |
|---|---|---|---|---|---|---|
| AION current target (CENV-01..14; AION source revision 231926a, as cited by ARCHITECTURE) | AI chat webapp, specifically ChatGPT | Exactly bound conversation, composer, Send/Stop controls | Chrome extension page -> worker -> existing Bus; local transport separately | AION extension/src/chatgpt/content.js, background/chatgpt-port.js, bus/adapters/chatgpt.js | Current scoped Send, snapshot, observe/check reply; Stop read-only observation | CENV-03 tri-state, grants distinct, positive matching submission/reply evidence required. **Target contract**, not proof this repair is implemented |
| Generic donor chat semantics [FINAL-05; OMEGA-04; OMEGA-06] | Candidate shared AI conversational webapp semantics | Catalog-level action/control/slot; actual page UNKNOWN | Donor engine or plugin naming; live runtime/transport UNKNOWN | FINAL taxonomy/registry, OMEGA provider-data-model and plugin/command types; provider instances UNKNOWN | send/read/regenerate; command/action/surface distinction | Listing does not establish authenticated access, working interaction, active control, permission or live Send. Revisions UNKNOWN |
| Donor ChatGPT realization [FINAL-08] | AI chat webapp / ChatGPT-specific | Candidate conversation/message operations | Donor adapter; actual live transport UNKNOWN; design mentions backend/cookie/CDP paths that must **not** be copied | src/engines/adapters/chatgpt-adapter.ts (researcher-reported full read, not independently validated) | send/terminal outcome/cancel/drain/force-stop terms | No matching live Send/Stop/response verification; Stop semantic mapping UNKNOWN; no backend-API or private-data path to AION. Revision UNKNOWN |
| Donor resolved capabilities [FINAL-02; OMEGA-03] | Provider-agnostic abstract contract; not provider support | uiStates, visibility/existence rules, binding slot | Resolver engines; execution and transport UNKNOWN | src/engines/capability-resolution.ts and Core/.../capability-resolution.ts | contextual availability and binding confidence | Rule evaluator/seed data only partly inspected; grant and effect separate; source revisions UNKNOWN |
| Donor affordance/projector [FINAL-07; OMEGA-05] | Provider-agnostic shape semantics | UI controls, required/optional signals, discovery hints | Observation-tap and shape-registry; method supported in live AION UNKNOWN | capability-shape-registry.ts, observation-tap.ts | project raw observations into semantic state | Do not infer unique action from ranked hints. No selectors copied; revisions UNKNOWN |
| Donor conversation/session/evidence [FINAL-01; FINAL-06; OMEGA-01; OMEGA-07/08] | Not a provider class | stream/session/message/attempt observations | Event/session/harness concepts; transport applicability UNKNOWN | stream/lifecycle/identity/harness modules and conceptual model | observe state, identify attempt, correlate evidence | Stream/session phases cannot advance CENV operation; identical text not effect identity. Revisions UNKNOWN |
| Bespoke/non-chat webapp candidates | **UNKNOWN** in first-pass evidence | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Do not fabricate implementation. Worker A/B to discover classification owners, actual plugins, category seeds and executable examples |
| Native OpenCode executor (AION DUAL-TRACK proposal only) | Local agent runtime, **not** chat webpage | ACP session/service, not browser composer | ACP/HTTP through authorized local layer | AION local executor adapter contract; donor support UNKNOWN | prompt/status/cancel contingent on negotiated runtime capability | Runtime availability != web ChatGPT availability; separate grant/effect chain. Proposed, not donor corroboration |
| Email send implementation (negative finding) [FINAL-05] | Email/SMTP, **not** AI web chat | Email message | UNKNOWN | donor send-capability.ts reported email-oriented | email send | OUT OF SCOPE for browser Send; must not inflate coverage |

## Provider-specific capture template (A/B can supply)
For each verified provider implementation, record:
- Immutable source repo + commit, landing source item ID, owning file/symbol/lines; distinct classification: generic AI-chat webapp, bespoke provider webapp, native agent/runtime, or **UNRESOLVED**.
- Provider family, concrete provider identity, website/app version when stated, account, model, session and conversation binding. Do not record account secrets/private transcripts.
- Surface (composer, toolbar, conversation state, settings), browser/desktop/API mode and transport, actual adapter implementation, supported method(s) and their tested revision.
- Semantic action, implementation-specific affordance, explicit action observation dimensions, prerequisites/binding confidence, freshness, grant/authorization source, operation effect identity, evidence of invocation, observed result.
- Separate STATIC_CATALOG / SOURCE_IMPLEMENTED / OFFLINE_TESTED / LIVE_OBSERVED. Live confidence is not inherited across provider versions, accounts, surfaces or sessions.

## Pending questions to resolve without guesswork
1. Does either repo implement an explicit family/type classifier with real seeded provider instances, and which subtree is the canonical owner? [OMEGA-04/06; FINAL-02/05]
2. Are shared chat semantics inherited, configured, or copied between provider implementations? What differs for bespoke apps? [FINAL-05; OMEGA-06]
3. Which rule strings are actually evaluated and where, and what context can force UNKNOWN rather than false? [FINAL-02; OMEGA-03]
4. How are Send and Stop independently bound, uniquely identified, and linked to the exact conversation? [FINAL-07/08; OMEGA-05]
5. Which transports/adapters are historical, experimental, backend-only, or live, and what evidence proves each? [FINAL-08; OMEGA-04]
6. Are remote donor revisions and duplicate modules exactly identical or only structurally similar? **Do not infer from filenames.**

Batch C-001 contains **no VF-/VO- source capture IDs** because the landing inventories were not present when seeded. The 16 FINDINGS identifiers are leads, not immutable captures or confirmations.
