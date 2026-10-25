# Launch focus — initial 2026-10-25 snapshot

## Current choice: Capture Studio private-beta feasibility (PROVISIONAL)
Why: already developed into an integrated user-facing experience, source-linked intelligence and adapter pipeline. Needs first-time visitor UX and trustworthy independent app acceptance before any beta claim.

### Verified from current repository reads
- AION root AGENTS.md says the specific live goal is three genuinely fresh context-dependent turns in the same provider-native conversation, first ChatGPT, then Claude, then Gemini; its documented 2026-10-24 Windows test had zero actual provider sends.
- AION root AGENTS.md identifies preflight/deferred capture and readiness as specific blockers; this is repository-reported and requires current code/runtime revalidation before treating it as today's blocker.
- vivim-harness README says: 'Canonical standalone application for AION Capture Studio. Migration in progress.' No live independently accessible beta has been verified.
- The project inventory at workspace/aion/ops/repos-inventory.md is dated 2026-10-16 and not proof of current repository health.

### Beta product hypothesis
'A private, friendly workspace that helps you keep and reuse your conversations and outputs across AI web apps.' This is hypothesis, not confirmed functionality or positioning.

### Hard release gates
1. **Independence:** external tester can run it with an authorized account of their own, not borrowing owner PC/profile/session.
2. **Value:** tester can finish one useful real journey (capture → inspect → revisit/export/reuse); add send/reply only if verified.
3. **Integrity:** correct provider/thread/account attribution and capture source provenance; no wrong-thread writes or private leaks.
4. **Reliability:** errors surfaced; restart/recovery; basic safe rollback.
5. **Distribution:** reachable installation/URL instructions; compatible with target OS/browser; privacy summary; feedback route.

### Initial candidate table (NOT a scored technical audit)
| Candidate | User promise | Evidence grade | Decision |
|---|---|---|---|
| Capture Studio / VIVIM Harness | Capture, understand and reuse native AI conversation artifacts | Repository-confirmed active development; beta unknown | Lead audit |
| OpenScroll / Vita | Knowledge ownership and visual workspace | Historical portfolio context only | Discovery |
| ZCode Pocket / phone AI gateway | Mobile control of own AI environment | Historical portfolio context only | Discovery |

### Immediate next actions
1. Inspect actual VIVIM Harness entrypoints/installability and AION active send/capture issues; determine easiest honest 'friend can use it' route.
2. Inventory other promising user-facing products for faster-to-beta alternatives.
3. Produce one 7-day launch slice with exact launch gate, named owner, and evidence of success; do not set arbitrary timelines before technical feasibility.

## Operating decision
Do not consolidate all project code into one platform before releasing first user value. Build a product shell through proven reusable interfaces, and postpone speculative consolidation.
