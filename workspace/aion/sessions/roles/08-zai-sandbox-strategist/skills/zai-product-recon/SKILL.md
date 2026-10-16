---
name: zai-product-recon
description: Separate observed Z.ai WEB Full-Stack Agent functions from ZCode desktop, GLM API, and AutoClaw; verify account-specific tools safely.
---
# Z.ai Web Product Recon
**Trigger:** Unknown web UI mode, 'GLM supports X' claim, unverified sandbox capability, changed model/plan UI.

1. Read current CAPABILITY-LEDGER.md and ZFR-01/ZFR-03/ZFR-05. Identify the exact claim being investigated.
2. Look at official `chat.z.ai/?mode=agent` public interface, then the actual account UI only if expressly provided by user or approved access. Record date/time, mode, model menu, attachments, preview/output controls.
3. Label every observation `OWNER_REPORTED`, `OFFICIAL_PUBLIC`, `DIRECT_WEBAPP_OBSERVED`, `UNKNOWN`. ZCode desktop documentation is `OFFICIAL_OTHER_PRODUCT` not web proof.
4. Prefer screenshot or plain UI observation to an entire costly spin-up if possible; design one tiny disposable microtest for invisible capabilities.
5. Record a contradiction if official docs and observed UI disagree; never silently reword owner's observation.
6. Produce a table: feature, confirmed mode, required approval, evidence URL, tested date, confidence, implications for next mission.

**Gate:** do not promise sandbox fan-out, persistent computer, unlimited turn length, repo push, Chrome extension install or a quota from another product's docs.
