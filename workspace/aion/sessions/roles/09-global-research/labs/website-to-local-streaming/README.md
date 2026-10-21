# Research Lab — Website → Local PC Streaming

**Owner:** AION Global Research 09 · **First pass:** 2026-10-21 · **Priority website:** `https://chatgpt.com/` · **State:** RESEARCH_LAB_ESTABLISHED / SOURCE_INSPECTED / LIVE_WINDOWS_UNVERIFIED.

## Question this lab exists to answer

**How can a person observe an existing signed-in website session on their own Windows PC as a timely, correctly scoped, recoverable local stream?** First prove this for **the same chatgpt.com web conversation** that the person sees in Chrome; only then study reuse across other websites. A live UI update is not by itself proof of reliable delivery, full chat history or permission to Send.

This is **Role 09 research and test methodology**, not a second AION product, service, implementation branch, task tracker, proposal commons or Chrome extension. **Development/Windows** owns real integration and acceptance, **Toolsmith** owns relevant host/registration diagnostics, and **Planning** owns milestone prioritization. Findings enter [one Research issue #30](https://github.com/owenservera/aion/issues/30), and concrete Development needs use the existing [Harvest/Research exchange](../../../../ops/chrome-relay/harvest/EXCHANGE.md) or native issue; no fresh dispatch authority is created here.

## Current AION baseline (verified source, NOT current installed behavior)

The [2026-10-21 merged source PR #62](https://github.com/owenservera/aion/pull/62) supplies a read-only receive path:

```text
signed-in chatgpt.com, exact bound tab and conversation
  -> passive DOM observer (MutationObserver, bounded revisions)
  -> page receive port (data-only cursor hint; no text in hint)
  -> extension service worker / receive router (validation)
  -> Chrome Native Messaging dev host (guarded origin)
  -> authenticated local IPC / Windows named pipe
  -> aion CLI read/replay/watch inbox (message text only on authorized pull)
```

**What the code explicitly does:** The initial page sample is a **silent baseline**; further samples are rate-limited to **at most four per second** (250 ms minimum spacing) with a bounded **100-message DOM sample**. The page hint carries a binding, epoch and cursor **but no message text**. The CLI view retains at most 200 messages and labels uncertain coverage. An account is explicitly registered once in its Chrome lane; **manual account switching inside the same lane is not detected by per-sample account checking** and requires re-registration. These are code-observed properties, **not promises about the live ChatGPT site**.

**Most recent native blocker found in owner records:** `REGISTRATION_FAILED` from an earlier `aion account register chief` attempt. Current loaded Chrome/native-host revision, registration failure seam, exact-thread I1 live receive, I2 Send and I3 recovery are **UNKNOWN** from this remote research review. A previous 2026-10-19 Windows UI Automation positive reply receipt is a different path and does not prove extension I1.

## Lab artifacts

- [Methods and evidence](METHODS.md): ranked capture/transport alternatives, official browser/platform sources, current source-file crosswalk, falsifiable limitations.
- [Field experiments](EXPERIMENTS.md): smallest Windows proof path, negative tests, useful metrics and receipts. **Planning/Development acceptance remains canonical elsewhere**; this is a research protocol to shorten it.
- [Role memory/Immediate](../../memory/Immediate/README.md), [shared Research intelligence](../../../../shared/agent-communications/intelligence/agents/09-global-research/README.md) and [Research issue #30](https://github.com/owenservera/aion/issues/30): resumption and discovery, not duplicated status archives.

## First lab question and stopping rule

Can the existing **watch-only path** deliver one independently generated new assistant message from the **exact, authorized chatgpt.com conversation** to the Windows CLI, followed by an edit/revision, without wrong-thread leakage or unbounded replay?

If **yes** with a dated native receipt: document observed end-to-end delay and next source deficiency; do not automatically build another tool. If **no**: distinguish account registration, loaded version mismatch, DOM observation, port/router, native host and local IPC before suggesting CDP/UIA alternatives. Never assume a local trial ran merely because the research is committed.

## Continuing role behavior

On the next Research SITREP, check whether Development has a new live I1 receipt, browser-origin change, source API/permission change, specific regression or result of these experiments. Refresh the lab **only on material new evidence**. Extend to other websites only after exact-origin identity, allowed data scope and local-receipt semantics can be stated without copying ChatGPT-specific selectors or assuming a portable login method. No Playwright, Puppeteer, credential capture, unsupported ChatGPT private endpoints, mass page scraping, private transcript commits or redundant daemon.
