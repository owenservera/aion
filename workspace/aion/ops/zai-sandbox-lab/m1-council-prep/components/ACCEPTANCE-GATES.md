# M1C-05 — Executive acceptance gates for Z-FORGE pre-live package
**Author:** AION Chief of Chiefs, role 05, current initiating conversation. **Status:** DELIVERED_AS_EXECUTIVE_SPEC / NOT SANDBOX_TESTED.
**Source:** workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md; workspace/aion/ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md.

## Scope decision
The experiment's objective is **AION-originated message -> real authenticated ChatGPT WEB APP -> actual same-session reply -> AION receives/reads**. A synthetic adapter, static chrome extension UI, GitHub ping-pong, alternative model API or BFF-authored probe is never M1 PASS. Z.ai Full-Stack Agent **cannot** see the owner's personal authenticated ChatGPT browser context, so all its local browser-target tests must be visually labeled MOCK.

## Gates that may be accepted before live session
- G0 DOCUMENTED: one canonical pinned M1 contract, minimal source scope and explicit authority.
- G1 DESIGN_RECONCILED: 02 critical path, 06 adapter/ACP contract and 01 event schema agree on request/transport ACK/real-response/consumption/proof semantics; contradictions listed, not silently fixed.
- G2 PACKAGED: cloneable source manifest, individual file paths and checksums, explicit dependencies/commands, reproducible fake app, install/rollback, minimal no-Playwright/Puppeteer test sequence.
- G3 SANDBOX_TESTED: real Z.ai execution receipt with selected model as shown, exact test logs, both success and failure injections and source/export hashes. User-transcribed claims alone do not count.
- G4 EXPORTED_AND_INDEPENDENTLY_VERIFIED: actual files recoverable, AION/approved OpenCode-ZCode reviewer reruns specified tests or marks environment-specific checks blocked.
- G5 READY_FOR_AUTHORIZED_LIVE_TEST: meaningful target-machine preflight, installer/scope, consent needs, negative-case proof and safe shutdown prepared. ChatGPT selector/session interactions remain **UNVERIFIED_ON_REAL_TARGET** until separately tested.

## Only possible after a separate authorized owner-controlled live test
- G6 M1_VERIFIED: real AION-authored correlation ID and exact outbound prompt trace, authenticated ChatGPT send into real intended service and conversation, actual real reply, return to AION and independent readback, UTC event references, one mismatched/unauthenticated or fake-response negative case rejected.
- Never promote a staged browser demo or Z.ai completed-turn summary directly to G6.
- Respect existing host/browser execution stop orders. This published spec does not authorize lifting any stop.

## Hard scope cuts / guardrails
- M1 pre-live only: no new bus/platform, broad dashboard build, Chrome native title automation, account credential migration, transcript scraping, ongoing chat monitoring, AGI autonomy features or M2+ milestones.
- No Playwright, no Puppeteer; no credentials, browser session cookies, personal tokens or actual user-account data inside third-party sandbox. Use permitted interfaces and least authority.
- AION GitHub main is the published source; the owner's local source is master. Z.ai sandbox may compile disposable test artifacts; never auto-push into authoritative production without approval.
- Grok Bot remains on separate M0.5 and is not scheduled for unrelated experiments.

## Independent acceptance decision
Role 05 will read actual delivered 01/02/03/04/06/07 artifacts and Z-FORGE run matrix when available. Role 05 is author of this **scope/gates specification only**, not verifier of future unobserved outputs. Chief of Staff (03) owns real acknowledgments and approved execution handoffs; Z-FORGE (08) owns integration of evidence into the cloneable experiment package.

AION_ZFORGE_M1_COMPONENT_V1
component_id: M1C-05
role_id: 05
state: DELIVERED
source_refs: [workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md, workspace/aion/ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md]
deliverable_url: https://github.com/owenservera/aion/blob/main/workspace/aion/ops/zai-sandbox-lab/m1-council-prep/components/ACCEPTANCE-GATES.md
claims: SOURCE_DOCUMENTED, INFERRED
dependencies: [M1C-01, M1C-02, M1C-03, M1C-04, M1C-06, M1C-07, M1C-08]
hard_blockers: no actual Z.ai build/receipt; no live ChatGPT test authorization
next_action: verify incoming component compatibility and Z-FORGE package
END_AION_ZFORGE_M1_COMPONENT_V1
