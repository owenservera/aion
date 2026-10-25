# PRODUCT AGENT — self-governed product intelligence and decisions

**Owner:** PRODUCT-TO-MARKET / Role 15. **Canonical folder:** `workspace/aion/sessions/roles/15-product-to-market/`.

This folder is the single home for **product strategy, V1 experience, cross-repo candidate assessments, integration prioritization, release decisions and research-to-product dispositions**. It does **not** take ownership of runtime engineering or global external research archives.

## Ownership map
- **Product authority here:** `README.md`, `BOOTSTRAP.md`, `LAUNCH.md`, `V1-PRODUCT-INDEX.md`, `research/Poppy-V1-DECISION-2026-10-25.md`, portfolio audits. Any new PRODUCT AGENT planning/decision document belongs here, even when implementing another product.
- **Engineering authority:** [VIVIM Harness](https://github.com/owenservera/vivim-harness), including its root `ARCHITECTURE.md`, source, tests, product-facing API implementation contracts and [Z.ai first-pass execution instructions](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-ZAI-INTEGRATION-PASS-1.md). Product requirements may be *linked* in code repos; avoid duplicated independent product decisions.
- **Research authority:** [AION Research 09 Poppy archive](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/09-global-research/research/poppy), with evidence/intake in [issue #30](https://github.com/owenservera/aion/issues/30). Product Agent records a **decision**, not another research copy.
- **Agent-to-agent communication:** [Research ↔ Product collaboration](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/agent-communications/research--vivim-v1/README.md), [Harness Poppy recipient issue #2](https://github.com/owenservera/vivim-harness/issues/2). GitHub posts do not awaken other chats or prove receipt.

## Current V1
**VIVIM = one persistent user-owned AI workspace**; governed access to real provider webapps through one Harness browser-effect owner; conversations with verifiable source/identity, project organization, knowledge continuity, explicit Work/effect receipts and user-controlled export.

The [full integrated V1 design](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) was committed before this folder separation. It currently remains a product design **reference at that exact path** so existing Z.ai links do not break. This role owns its product direction and future revisions; product-only next versions should be authored here, with the engineering repo holding links/derived implementation interfaces as needed.

## Read order per PRODUCT AGENT session
1. `README.md`, `V1-PRODUCT-INDEX.md`, `LAUNCH.md`.
2. Refresh product-relevant current source/acceptance from Harness issue/commits and pertinent donor repos.
3. Read only material external research handoffs (e.g. Research issue #30 and Harness #2 for Poppy).
4. Record substantive ADOPT/DEFER/REJECT decisions under this folder with dates/source/evidence confidence; keep execution in native repo.
5. On SITREP check relevant agent communications and incoming results; distinguish request sent vs acknowledged vs implemented vs independently verified.

## Poppy decision (2026-10-25)
[Read product disposition](research/Poppy-V1-DECISION-2026-10-25.md): **WATCH / NOT A V1 integration dependency.** Research 09 confirms sourced draft 0.3 breaks 0.2 assumptions and no deployed compatible provider has been established. Next change requires a real company endpoint + compatible SDK/conformance + a task that beats existing UI/MCP/CDP.

**No additional scheduler, service, secret-sharing pipeline, browser actor, or duplicate issue tracker.**

## Current integration architecture, saved decisions and allocation (2026-10-25)
- [Original V1 milestone map](V1-MILESTONE-MAP-2026-10-25.md) — preserved earlier M1–M5 analysis.
- [Deep integration assessment](V1-INTEGRATION-DEEP-ASSESSMENT-2026-10-25.md) — R1 source review, already implemented Harness primitives, source/identity ownership, donor WHAT-vs-HOW, ranked risks, exit gates and precise Z.ai round packages.
- [Z.ai execution policy](ZAI-EXECUTION-POLICY.md) — stable integrated VIVIM before introducing interactive Chrome.
- [PRODUCT AGENT rules](README.md#product-response-publication-and-model-effort-policy--owner-directive-2026-10-25) — save each substantive agent response to this self-governed folder; Z.ai **LOW/MED/HIGH**; Product Agent or owner's local models **MAX**; decide WHAT without automatically importing legacy HOW.

**Near-term decision:** Z.ai R1 supplied an attached patch/bundle but GitHub branch `zai/v1-pass1-shell` was not found in the remote branch search. Do not call it merged. Next product-facing milestone: minimum durable VIVIM conversation+native rich content+evidence view that survives process restart; no new Chrome integration before the coherent app stabilization gate.
