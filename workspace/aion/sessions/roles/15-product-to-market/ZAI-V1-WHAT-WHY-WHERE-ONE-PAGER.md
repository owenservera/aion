# VIVIM V1 — WHAT / WHY / WHERE for Z.ai
**PRODUCT AGENT → Z.ai | 2026-10-25 | One-page donor map, not an implementation prescription**

**Goal:** Integrate ONE compelling, persistent, user-owned VIVIM experience using the canonical `owenservera/vivim-harness` application. We supply **WHAT capability**, **WHY it matters to the person using it**, and **WHERE prior code/design may offer evidence**. **Z.ai decides HOW**, including whether to reuse, simplify, reimplement, use a good dependency, or skip a donor entirely.

## Engineering principle — better, faster, less garbage
AION Capture Studio's low-dependency approach is a useful baseline, **NOT a dependency-free mandate**. For any dependency, abstraction, framework or homegrown implementation ask: *Can we deliver better functionality, sooner, with less total code, integration friction, security risk, maintenance and operational burden?* Prefer measured simplicity; no dogmatic zero-dependency rule and no dependency sprawl for convenience. This is a reusable DevOps/engineering quality principle for **all owner AI-coded work**, not just Harness.

## Capability discovery map

| WHAT | WHY (visible personal value) | WHERE to examine (candidate evidence, not mandatory transplant) |
|---|---|---|
| One approachable app, onboarding, navigation and provider states | A person can understand what is connected, available and saved without learning the harness | R1 `vivim-harness/src/studio/ui/chat.{html,mjs}`; `vivim-final/frontend/src/features/guided-landing.tsx`; `frontend/src/app/page.tsx` |
| Native, rich conversations including citations, tools, artifacts, unknown parts | Preserve what actual AI webapps produced, beyond plain text | Harness `src/studio/ui/universal-chat.mjs`, `chat.mjs`; `vivim-final/src/schema/{streaming,content}.ts`, `src/render/` |
| Durable personal conversation library and identity | Reopen, browse and own prior work after app restart without confusing provider thread/account/capture records | Harness `src/capture/conversation-{service,runtime}.mjs`, `src/store/`, `src/replay/`; donor `vivim-platform/pwa/src/types/conversation.ts` |
| Workspaces, projects and saved artifacts | Turn isolated chats into organized reusable work | `vivim-final/frontend/src/app/page.tsx`; `vivim-platform/pwa/`; Harness existing Studio UI and session APIs |
| Search, grounded knowledge and selective memory | Find answers, relationships and artifacts with clear origin and editable personal interpretation | Harness `src/intel/{search,corpus,graph,continuity}.mjs`; `vivim-platform/acu/src/`; `edge-pwa/backend/src/registry/acu.rs`; `vivim-final/src/engines/memory-engine.ts` |
| User-controlled export/import and source lineage | Genuine portability, recovery and selective sharing of *chosen* content | Harness `src/export/` and `src/store/`; `edge-pwa/extension/src/native-messaging/protocol.ts` (provenance ideas only; never copy credential handling) |
| Deliberate intent, capability and Work/evidence continuity | Understand what the AI is proposing versus what actually happened; support safe later automation | Harness `src/studio/capabilities.mjs`, `src/mcp/`, `bin/`; `vivim-omega-os/{PRODUCT-ANCHOR,INVARIANTS,BUILD-FOCUS}.md`; `vivim-sdk/src/mcp/` |
| Later external webapp interactivity | Connect the stable personal VIVIM app to real provider experiences | Harness `src/cdp/`, `src/capture/`, `src/profiles/sites/` (defer *new* interactive Chrome work until app is internally stable) |

## Delivery expectations / boundaries
- **Sequence:** cohesive internally functioning VIVIM → durability/stability → new interactive Chrome/CDP, as explicitly chosen by owner. No need for logged-in ChatGPT access to complete internal integration.
- **Single source/effect authority:** do not accidentally create an independent competing browser sender, source-evidence store or unexplained duplicate state system; Z.ai chooses technical approach within that product invariant.
- **Donor code is a clue, not a contract:** extract behavior/value; choose the best current implementation. No automatic React/Rust/Zod rejection if a dependency genuinely reduces total work and stays compatible with the product; no whole-platform imports without a demonstrated payoff.
- **Ownership:** product mapping and strategic MAX judgments stay in `aion/workspace/aion/sessions/roles/15-product-to-market/`; Z.ai owns LOW/MED/HIGH engineering design and execution in `vivim-harness`.
- **Round output:** running integrated behavior, test evidence, changes/commit, what donors were or weren't useful and *why*. Z.ai determines subagents, sequencing within the stable-app stage, dependencies and code layout. Do not spend rounds on checklists as a substitute for implementation.

**Key question to Z.ai:** *Given the capabilities and sources above, what is the smallest clean integration path to a useful, durable VIVIM experience? Demonstrate it in code, not by preserving old AI-generated architecture.*
