# M1C-08 — Z-FORGE assembly receipt
AION_ZFORGE_M1_COMPONENT_V1
component_id: M1C-08
role_id: 08
state: DELIVERED
source_refs: [workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md,workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md,workspace/aion/ops/chrome-relay/ARCHITECTURE.md,workspace/aion/ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md,workspace/aion/ops/zai-sandbox-lab/m1-council-prep/components/ACCEPTANCE-GATES.md]
deliverable_url: https://github.com/owenservera/aion/tree/main/workspace/aion/ops/zai-sandbox-lab/m1-council-prep/
claims: SOURCE_DOCUMENTED for existing canon; OBSERVED for fetched GitHub files; UNVERIFIED for Z.ai runtime and live ChatGPT access
dependencies: M1C-01,M1C-02,M1C-03,M1C-04,M1C-05,M1C-06,M1C-07
hard_blockers: six employee role reports not received; Z.ai access not verified; owner authenticated ChatGPT unavailable in Z.ai
next_action: owner-authorized Z.ai sandbox executes prompts/ZAI-TURN-1.md using frozen source or self-contained source capsule
END_AION_ZFORGE_M1_COMPONENT_V1

## Authentic contribution state at assembly
- M1C-05: delivered actual ACCEPTANCE-GATES.md, NOT sandbox-tested.
- M1C-01,02,03,04,06,07: NO ACTUAL CONTRIBUTION FOUND in issue #24 or components directory at read time. These are source-documented FALLBACKs, not authored reports.
- M1C-08: this integration package is actually authored by Z-FORGE role in this session; no Z.ai sandbox run has occurred.

## Source-based fallback reconciliation
- M1C-01 (OBSERVABILITY): derive staged events from chrome-relay/ENVELOPE-CONTRACT.md; do not infer transport ACK means reply or verification.
- M1C-02 (CRITICAL PATH): use canon/AION-MILESTONE-1-INTROSPECTION.md and M0.5 canon. Genuine authenticated web-app roundtrip is live-only.
- M1C-03 (HANDOFF): use CLONE-AND-ASSEMBLY.md and MISSION-TEMPLATE.md; export and separate review required.
- M1C-04 (ECONOMICS): choose one complete first turn and conditional second turn, not empirical costs; model/turn cost UNKNOWN until seen.
- M1C-06 (BROWSER/ACP): use chrome-relay/ARCHITECTURE.md and ENVELOPE-CONTRACT.md; relay is not ACP wire format; test mock adapter, do not assume installed Chrome adapter.
- M1C-07 (SOURCES): use canon and URLs already listed, original full transcripts and alternatives UNKNOWN rather than reconstructed verbatim.

## Interface decisions
One normalized envelope with schema_version, message_id, correlation_id, causation_id, idempotency_key, producer_node, target_node, event_type, created_at, expires_at, payload_hash and approved_scope_ref. Task state is separate from delivery state. A mock result requires MOCK provenance; a real-service proof requires origin and independently observed return. Unknown is not healthy.
Do not send arbitrary host commands, inspect private browser profiles, or claim ACP capability until native version negotiation. No Playwright/Puppeteer.

## Package stages
DOCUMENTED → READY_FOR_ZAI (inputs/prompts pinned) → SANDBOX_TESTED (actual logs) → EXPORTED (actual bytes/hashes) → INDEPENDENTLY_VERIFIED (separate reviewer) → LIVE_READY (owner permission) → M1_VERIFIED (real authenticated test only). No stage inferred from another.
