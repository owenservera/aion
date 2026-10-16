# AION Role 04 — Research: near-always-active concurrent ChatGPT roles
Date: 2026-10-16 (Europe/Madrid)
Status: RESEARCH VERIFIED AGAINST OFFICIAL SOURCES / DESIGN ONLY; NO LIVE SCHEDULES, API AGENTS, OR CHAT CONTINUATION INSTALLED
Scope: four standing ChatGPT role conversations + Chief of Chiefs, durable GitHub handoffs, existing OpenCode/ZCode execution. Keep Grok Bot reserved for M0.5. No Slack, new GitHub repo/branch, hidden web-app automation or duplicate communication bus.

## Executive finding

A conventional chatgpt.com conversation is not an always-running daemon. Multiple open browser tabs are not a documented way to keep a model working after its response ends. Distinguish: a durable **thread of context**; a **cloud task that finishes asynchronously**; a **recurring/event-triggered job**; and a **persistent API agent session**. Keeping four tabs open does not convert them into four continually executing employees. For productive near-24/7 operations, keep role context/ownership in GitHub and provide independently scheduled/triggered workers. Work must be checkpointed and verified, not claimed merely because a tab or job exists.

## Verified current platform choices (official OpenAI docs)

### A. ChatGPT Scheduled Tasks (first-stage pragmatic option)
- One-time, recurring, monitoring and supported app event-triggered tasks. Eligible paid plans can schedule recurring tasks **as often as hourly**, not continuously. Plus currently documents up to **five active tasks**; this is across the account, not five tasks per role. Actual free slots must be checked; avoid assuming there are five.
- Event-triggered tasks run in ChatGPT Work for eligible Plus/Pro/Business/Enterprise/Edu; up to **30 runs per hour and 720 per day across event-triggered tasks**, with coalescing possible. GitHub events documented concern **supported pull request activity**, not arbitrary pushes to `main` or Issue #14 comments. AION's main-only GitHub issue/commit flow therefore cannot assume it fires native GitHub tasks.
- Tasks with linked apps can read appropriate GitHub information subject to permissions; actions may pause for user confirmation. A task created in a ChatGPT Project cannot access files uploaded/stored *in that Project*; use authorized GitHub refs or connected files explicitly.
- Scheduled tasks have their own lifecycle and associated chat; they cannot be assumed to wake the exact original 4 independent chats. They may pause when inactive or when approvals/connections are needed. Notifications are possible through supported mobile/web settings but not a universal webhook-injection interface.
Source: https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt

### B. ChatGPT Work Cloud (first-stage execution)
- Work tasks can continue after the user leaves, closes the browser or turns off the computer, and can act via cloud tools/apps/browser where supported. Work pauses on necessary sign-in, confirmation or required user decision. Work Cloud chats sync across web/mobile/desktop and can use a Project's context.
- Give each role a bounded outcome-oriented task (e.g. verify latest code receipt, prepare report, perform approved GitHub reconciliation), with explicit GitHub evidence/acceptance. Work is NOT proof a conventional chat stays running indefinitely; task execution terminates or pauses, and available concurrency and plan usage must be checked empirically.
Sources: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex ; https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt

### C. Dots (best native long-lived concept, not assumed available here)
- Dots are designed as always-on agents with their own cloud computers, proactive research and scheduled runs between conversations. On the 2026-10-16 published eligibility: consumer **Pro** only outside EEA/CH/UK, Business Premium available in supported regions, Enterprise beta admin-enabled. Personal Plus isn't listed, and Spain is inside the EEA; do NOT base this solution on a personal dot being available or advise buying Pro under this eligibility condition. A dot also has usage allowances and approval controls.
Sources: https://help.openai.com/en/articles/20001530-getting-started-with-your-dot ; https://help.openai.com/en/articles/6825453-chatgpt-release-notes

### D. OpenAI Agents API (strongest programmatic continuous-role architecture)
- Beta Agents API supports durable session IDs, saved conversation/work, asynchronous turns, ability to add input to an idle session (starts work) or steer an active turn, and signed lifecycle webhooks (`created`, `in_progress`, `idle`, `action_required`, `failed`). An app can wake/continue a session on authorized GitHub/queue events, use idempotency keys on retries, inspect actual outcomes, and feed safe evidence to AION GitHub.
- A session can survive a self-hosted executor disconnect; external infrastructure can reconnect on demand. Avoid always burning compute while idle: persist session/context and trigger upon meaningful tasks.
- These are API sessions, **NOT** existing chatgpt.com conversation IDs; there is no documented action here to inject messages into a preexisting ordinary ChatGPT web-app thread. Requires independent API entitlement/billing, authorized secrets, hosted/self-hosted execution, signed webhooks and operational testing.
Sources: https://developers.openai.com/api/docs/guides/agents-api/sessions ; https://developers.openai.com/api/docs/guides/agents-api/sessions/webhooks ; https://developers.openai.com/api/docs/guides/agents-api/overview

### E. Responses API background + persistent Conversations (alternative)
- `background:true` supports async response processing/polling and completion webhooks; Conversations API provides durable conversation objects to carry state. Both create API-managed conversations **separate from native ChatGPT web-app chats**, and both incur API charges subject to chosen usage. Good fallback if Agents API beta unavailable, not first pick for agent lifecycle.
Sources: https://developers.openai.com/api/docs/guides/background ; https://developers.openai.com/api/docs/guides/conversation-state ; https://developers.openai.com/api/docs/guides/webhooks

## Decision matrix
| Approach | Awakens exact existing ChatGPT role chat without a user turn? | Continues after user leaves? | Event wake frequency | Implementation burden | Recommendation |
|---|---|---|---|---|---|
| Keep tabs open / browser tab refreshing | No verified support | No guaranteed autonomous turn | None | Medium/high risk | Reject as execution strategy |
| Scheduled Tasks | Not assured; scheduled-task lifecycle is distinct | Yes | Hourly recurring; supported event triggers | Low | Pilot immediately if available |
| Work Cloud | Does not guarantee reentering old ordinary chat | Yes, for a bounded delegated task | When delegated / scheduled | Low-medium | Use for actual deliverables |
| Dots | Separate always-on agent identity, not old chats | Yes | Native proactive / scheduled | Low | Eligibility-dependent future |
| Agents API persistent sessions | No, distinct API sessions | Yes, with infrastructure | Event-driven application controlled | Medium | Phase 2 if <1h wake required |
| Responses background + Conversations | No, distinct API conversations | Yes for active job | External triggers | Medium | API fallback |

## Recommended minimal AION operating plan

**Stage 1 — Native, one pilot, no new services.**
1. Preserve each existing ChatGPT role chat for discussion, but treat `owenservera/aion` `main` as durable cross-role task/evidence ledger. Give one selected role (Role 04) an eligible Work Cloud task: inspect specific `WPM-001` GitHub artifacts, check whether real `workspace/aion/telemetry/bff/opencode/current.json` exists and contains properly sourced WPM data; advance authorized next actions and write a GitHub receipt, or report precise blocker without inventing data.
2. Create one hourly Scheduled Task if available (not in this research chat automatically) to repeat the same scoped check through authorized GitHub plugin. Require a unique run ID, `started_at`/`ended_at` UTC, exact GitHub paths, evidence URLs, current status, and no-change suppression. Check plan active-task capacity and whether the task has the permissions to write to GitHub. Do not exceed actions approved by owner/host execution policy.
3. Prove real unattended execution with UI closed: two successful runs (or one actual event trigger if available), genuine GitHub readback of run receipts, observed time-to-start and a negative case. Until then status is DESIGN / NOT OPERATIONAL.
4. Expand gradually to Chief of Staff coordination and then other roles. Five existing role identities do NOT mean five scheduling slots are actually free. Use a shared hourly reconciliation if only one task is free; specialist roles work on demand via Work.

**Stage 2 — Near-real-time agent queue only when needed.**
5. Use the existing AION main ledger and an authorized event reader (OpenCode/ZCode can implement; no Grok involvement). Choose Agents API persistent sessions only if native hourly cadence fails the team's response-time requirement. Map one API session ID to each logical role; these are *new* API workers, not clones or continuations of chatgpt.com chats.
6. One controller consumes authorized GitHub state changes, verifies actor and bounded task envelope, enforces per-role concurrency and budgets, submits idempotent agent input, listens to signed lifecycle webhooks, archives safe results and task-specific evidence to GitHub main. Keep secrets and raw session payloads out of GitHub. Verify failures/replay/timeout/duplicate tasks.
7. Operator goal: **queue-to-worker-start** and **outcome-to-receipt**, not the misleading percentage of time a model is generating tokens. Idle availability is desirable, not failure. Protect per-role budgets, kill switches and independent outcome verification.

## Explicit blockers / outstanding experiments
- No documented support for GitHub **Issue #14 comments** or commits to main to wake the exact existing chatgpt.com conversation. Event-triggered Work GitHub feature describes PR activity; converting AION main-only operations into fake PR triggers solely to game the event system is not recommended.
- ChatGPT Work and task availability depend on plan, region, app and account permissions; no account-level task capacity was read for this research.
- No OpenAI API key/budget/Agents beta capability was probed or provisioned; no agent session created.
- BFF host/browser stop order and Windows local-master authorization remain in force; this research is not execution authorization.
- The existing OpenCode WPM sampler is a separate concrete deliverable: local prototype exists but actual BFF feed remains unverified. Do not call the present research a deployment.
- User explicitly rejects Slack; do not recommend it as a workaround.
- Native tasks can pause for approvals, lack context from project-stored uploads, and do not guarantee ChatGPT web-app session liveness.

## Acceptance criteria for 'near-always operational' pilot
- Role can start meaningful authorized work with ChatGPT web/mobile closed.
- At least two observed scheduled/event-triggered resumptions, complete evidence/receipts, no duplicates, and task results are correct.
- Capture worker identity distinct from original ChatGPT chat identity, idle vs active, step transitions, GitHub source SHA, freshness and lag.
- A failed tool or missing approval becomes an explicit BLOCKED state with next owner/action; not a falsely green heartbeat.
- The system can resume after interruption without losing task provenance, and can be disabled on request.

**Owner-level framing:** `nearly always active` should mean **continuously reachable + automatically resumed + accountable until verified acceptance**, not permanent generation or browser tab keep-alive.

## 2026-10-16 addendum — third-party browser keep-alive proposal reviewed

**Decision:** Browser keep-alive is an optional UI reliability experiment only; REJECT as the foundational AION autonomous execution strategy. Three different readiness states must never be confused: (1) browser/authentication session responsive; (2) AI model actively processing an instructed turn; (3) a durable worker automatically taking the next approved task and verifying completion. Auto-pings may help (1), never by themselves prove (2) or (3).

**Named source checks:**
- [xcanwin/KeepChatGPT](https://github.com/xcanwin/KeepChatGPT): real multi-feature userscript advertising keepalive, auto-refresh, cloning, tracking interception and other intrusive changes. Claims originate from developer, not independently measured in our ChatGPT workspaces.
- [adamlui/chatgpt-auto-refresh](https://gitlab.com/adamlui/chatgpt-auto-refresh), with Codeberg upstream: real project; claims to eliminate network/Cloudflare issues are developer assertions, not OpenAI commitments.
- [PulseGPT Chrome extension](https://chromewebstore.google.com/detail/pulsegpt/jccblmejeebkiblnonfndhnaopmaclgf): real extension, but retrieved store page showed 11 users, providing little external testing confidence.
- [OpenAI Temporary Chats](https://help.openai.com/en/articles/8914046): no universal ten-minute inactivity deadline corroborated in current official documentation.
- [OpenAI GPT-6 limits](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt): unlimited everyday text specifically documented for Free/Go, with abuse controls and other model/feature-specific caps; don't claim unrestricted 4–5 simultaneous agent turns on any plan.
- [OpenAI Terms (EEA)](https://openai.com/es-ES/policies/terms-of-use/): prohibit circumventing rate limits/protective measures and automated/programmatic extraction of output. Do not deploy a keep-alive for the purpose of bypassing platform protections or automate conversation scraping.

**No deployment recommendation:** AION's private GitHub/ZCode/ACP/browser conversations are high-value. Do not install a third-party script with full chat-page access into the production authenticated browser without explicit approved source-code/permission/security review and isolated testing. Never claim prevention of Cloudflare challenges, timeouts, session expiry or context resets. In particular, do not run automatic Cloudflare-bypass or synthetic message loops to keep models busy.

**Practical lowest-overhead path:** retain the five browser chats for human continuity, use browser-native tab keep-open/sleep settings only when actually useful, use Work Cloud for real bounded tasks, Scheduled Tasks to initiate supported recurring/event monitoring (on Plus up to five active and hourly cadence, subject to account/approval), and a GitHub-backed authorized external worker only if sub-hour action is a real requirement. Supported GitHub event triggers cover certain PR activity; do not assume Issue #14 comments or changes on main wake the exact existing chat. Dots are a separate product and current personal Pro rollout excludes the EEA, including Spain. Use durable GitHub evidence, idempotent claims and verification, not browser-tab heartbeat counts.

**Acceptance experiment:** compare a control ChatGPT tab and, only with explicit approval, an isolated vetted script-equipped tab for UI stability over a normal work period; measure actual access failures/recovery and operational safety, not purported autonomy. Separately prove a legitimate unattended Work/Scheduled task created a meaningful GitHub readback receipt while its browser is closed. Keep two experiments distinct.

**Operational status:** assessment complete; browser keep-alive NOT installed; no native scheduled or API worker provisioned; WPM-001 and always-active operational acceptance remain OPEN.
