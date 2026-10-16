# M0.5 — Low-token Grok Bot wiring handoff (prepared by AION)

## Do not spend Grok capacity writing software

Grok Bot's unique job is authenticated **Linux browser access**, not coding, dashboard, infrastructure, model comparisons or analysis. AION has already authored the exact message in [AION-OUTBOUND-M05-001.md](./AION-OUTBOUND-M05-001.md). The existing BFF host readiness report states Playwright and Chromium, `puppeteer-core`, `chrome-remote-interface` and a running Chrome CDP endpoint at `localhost:9244`; treat these as *reported*, verify with one targeted test before relying on them.

### Only permitted sequence (after existing stop order is explicitly lifted)

1. Open the outbound file from the existing AION repo. Use its exact prompt and ID. Preserve human author attribution to AION.
2. Use Chrome/CDP (already present) to inspect whether an **authenticated, authorized** `chatgpt.com` web-app tab exists. Do not read/export credentials, cookies or arbitrary private conversation text. Do not replace this with an API call.
3. If a browser adapter is missing, ask the **OpenCode CLI on this Linux host** (preferred free model) or ZCode to author *only the smallest browser send/read script*. Grok Bot must not hand-code. Existing repo + one worktree; no new repo/service/framework.
4. Submit exact AION-originated message to that real web-app tab, read the corresponding actual assistant response. Do not interpret readiness as success.
5. Put one minimized receipt in [AION/BFF GitHub issue #14](https://github.com/owenservera/aion/issues/14) with prompt correlation, actual response text, evidence of the web app (permitted URL / UI screenshot reference), UTC sent/read times, tool/version and precise blocker or PASS candidate. No cookies/tokens and no unrelated transcripts.
6. AION independently reads the GitHub receipt and verifies checkable response detail. Only then accept M0.5.

### If OpenCode must generate an adapter

**Give OpenCode this prompt, not an open-ended build assignment:**

> Implement the smallest one-shot Node/Playwright CDP script for the existing BFF Linux environment. Attach to the preexisting local Chrome CDP endpoint (default 9244), locate only an authenticated chatgpt.com WEB APP tab, and exit clearly if missing. Accept the exact AION-owned message from `AION-OUTBOUND-M05-001.md`; never fabricate or modify it. Locate an editable ChatGPT composer defensively, submit once, wait for a new assistant reply and capture visible response text from that very conversation. Fail if login needed, ambiguous UI, no response or mismatch. Use installed Playwright/Chrome libraries; do not create profiles, log cookies, bypass login, navigate unrelated tabs, print secrets or send multiple retries. Record a short sanitized JSON receipt (correlation, timestamps, actual response, matching tab URL if safe) and exit. Include dry-run tab-detection mode and tests for missing tab, missing composer, mismatched response. Commit source to this folder on main and test in safe dry-run; human-authorized live send only after explicit confirmation. Do not claim this script works until tested against the real site.

### Proof contract

AION -> known GitHub-authored outbound message -> BFF Chrome web app actual submit -> ChatGPT actual assistant reply -> BFF GitHub evidence -> AION independent readback. **Any narrower result is pending, not complete.**

### Spend discipline

One attempt, one blocker description if failed. No new architecture. No publishing of private secrets. Five-minute routines, dashboard, session sharing and broad telemetry are out of scope.

**Current gate:** Prepared handoff only. Existing execution stop order remains.
