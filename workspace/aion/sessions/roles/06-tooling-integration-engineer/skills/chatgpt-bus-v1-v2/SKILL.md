---
name: chatgpt-bus-v1-v2
description: Build and test a reusable AION ChatGPT multi-agent commander bus (V1) and local executor adapters (V2), with VOM/VOMEGA as configurable pilot, using existing MV3/ACP/MCP/OpenCode infrastructure.
---
# ChatGPT General Bus V1/V2 — implementation skill

Trigger: ChatGPT web commander control, role chat messaging/genealogy, Chrome extension bus, VOM pilot integration, OpenCode executor fan-out, MCP plugin ingress, or end-to-end offline release.

## Sources
- [Research pack](../../research/CHATGPT-GENERAL-BUS-V1-V2-SOURCE-PACK-2026-10-19.md).
- [Opus 5.5 full build instructions](../../research/OPUS-5.5-V1-V2-BUILD-BRIEF.md).
- [AION existing Bus design](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/BUS-V1-V2-DESIGN.md).

## Recipe
1. Read current repo HEAD, installed/declared adapter capabilities and VOM pilot's actual command contract. Do not conflate VOM with generic core.
2. Reuse AION's existing Chrome MV3 extension, no-resend state store, native host/ACP client and MCP read-only server; only fill gaps.
3. Implement versioned command ingress, registry + genealogy, validation and routing in DOM-free modules. V1: ChatGPT→ChatGPT web sessions. V2: same API→OpenCode/ACP and other local executors.
4. Package distinct adapters for ChatGPT DOM/Chrome, ACP, optional OpenCode V2 client, and conditional MCP ingress; don't equate protocol ACK with generated answer or AION readback.
5. Supply VOM/VOMEGA pilot integration *and* a second generic fixture proving portability.
6. Test all portable contracts and failures off-host; ship one Windows verification/install path. No Playwright/Puppeteer/Orca.
7. Report CODE_COMPLETE separately from WINDOWS_LIVE_VERIFIED; no simulated M1 acceptance claims.

Output: source diffs, protocol specs, conformance suite, fixtures, Windows runbook/rollback, commits, precise remaining host/browser account test instructions.

No mandatory daemon, new repo, duplicate Chrome extension or parallel MCP bus.
