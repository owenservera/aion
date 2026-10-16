# AION-BFF-002 Task 4 — M1 ChatGPT Roundtrip Design (DESIGN ONLY, NO IMPLEMENTATION)

- Task: AION-BFF-002 task 4
- Status: **M1 is NOT passed.** This file is a design proposal only. No round trip has been demonstrated.
- Scope constraint: design only. No implementation, no browser automation, no auth changes, no session-token handling.
- Authority: `canon/AION-MILESTONE-1-INTROSPECTION.md` — M1 = "AION CAN SEND A MESSAGE TO CHATGPT AND READ THE RESPONSE", gate DEFINED / NOT VERIFIED.

## 1. Problem statement

BFF is a Linux box agent. Goal: BFF sends a real message to an **existing** ChatGPT conversation (the AION SITREP conversation) and **independently reads the reply**, without Owen relaying (no copy-paste of prompt or answer by the owner).

M1 acceptance (from canon file) requires ALL of:

1. Outbound: AION-originated benign unique correlation ID + probe question.
2. Real service: sanctioned adapter or pre-authenticated browser submits the prompt to ChatGPT; capture actual destination conversation/message reference or reproducible UI evidence.
3. Inbound: adapter reads the actual ChatGPT assistant reply, links it to the outbound correlation ID, makes it available for AION to read without manual owner relay.
4. AION introspection: AION consumes the reply, reports a checkable detail, independently checks recorded outbound/inbound evidence; minimized/redacted receipts only in GitHub.
5. Negative case: mismatched correlation / non-ChatGPT reply / unauthenticated session / disconnected adapter is rejected, not reported as success.

PASS additionally requires UTC event times, source refs, observed UI/API response, AION readback, and verifier acknowledgment.

Current evidence proves the negative: `ops/BOX-READINESS.md` (18/18 checks, CDP present, 03:40 CEST 2026-10-16) does NOT prove a ChatGPT send-and-read cycle. No correlated M1 receipt exists.

## 2. Hard limitation: GitHub issue #14 does NOT inject into ChatGPT

- Current fallback path: BFF writes to `owenservera/aion#14`; AION reads it **only when invoked** (owner invokes / pastes / AION pulls on next turn). Status: **PENDING_AION_READ**.
- Evidence: `ops/evidence/AION-BFF-002-POLLER-20261016T043126+0200-receipt.md` shows 5 comments observed read-only (cursor 0 → 6206669419), including comment 6206669419 ("Vercel prompt submission architecture" directive) and comment 6206592845 (BFF ACK). The poller is observation-only by design (`issue14-inbox-poller.sh`: GET only, bodies truncated to 120 chars, never eval'd).
- The Vercel dashboard directive limitation: writing a prompt to GitHub issue #14, or to any Vercel dashboard / deployment log / comment surface, **does NOT wake the ChatGPT conversation, does NOT inject a message into it, and does NOT cause AION (the ChatGPT-side agent) to act**. There is no push path from GitHub/Vercel into an existing ChatGPT conversation. AION sees issue #14 content only if Owen or an explicit invocation brings it into context.
- Consequence: any "round trip" that is only BFF → issue #14 → (hopefully) AION reads it later is **not M1**. It is at best a one-way dead drop with human-in-the-loop polling, failing criteria 2–4 above.

## 3. Options comparison

### Option A — OpenAI API / Responses API (separate assistant)

- What it is: BFF calls `api.openai.com` (Chat Completions / Responses API) with an API key and gets a model reply.
- Why it fails M1: the API creates a **SEPARATE assistant interaction**, not a message in the **existing ChatGPT conversation**. It cannot inject into, append to, or read from the AION SITREP ChatGPT thread. A distinct `response.id` / API transcript is not a ChatGPT conversation message reference and AION-in-ChatGPT never sees it.
- Additional gaps: requires API key provisioning/billing (auth change — out of scope for this task); proves only that BFF can call an LLM, which canon explicitly lists as "not sufficient" ("an LLM call that never returns to AION").
- Verdict: **REJECTED for M1.** Useful only as a negative control or for BFF-side drafting, never as the roundtrip path.

### Option B — ChatGPT connectors / GitHub pull model (current fallback, PENDING_AION_READ)

- What it is: AION (when invoked) uses a GitHub connector, or Owen pastes issue content, to read `owenservera/aion#14`. BFF writes correlated prompts there; the existing read-only poller (`ops/issue14-inbox-poller.sh` + receipts in `ops/evidence/`) tracks what BFF wrote.
- What it proves: GitHub coordination works; BFF can write; when AION is invoked it can demonstrate readback (cf. AION-BFF-001 precedent: AION independently read ACK comment #6206592845).
- Why it fails M1 alone:
  1. Direction is wrong for the critical leg: it is BFF → GitHub, not BFF → ChatGPT conversation.
  2. Read is pull-only and owner-invoked; no wake/inject (see §2).
  3. No ChatGPT destination message reference or assistant reply is produced by this path.
- Status: **PENDING_AION_READ** — BFF-side writes exist; AION-side read of any new M1 probe has not been verified in this design task.
- Verdict: **KEEP as coordination/evidence channel only.** Necessary but not sufficient. Every M1 attempt should still log its correlation ID here, but success cannot be claimed from this channel.

### Option C — Scoped, owner-authorized browser control of an already-authenticated ChatGPT session

- What it is: on the BFF Linux box, under explicit owner authorization, a browser automation client attaches to (not exfiltrates) an already-authenticated ChatGPT session and performs the minimal send + readback: focus the existing AION conversation, type the correlated probe, submit, wait for the assistant reply, capture it.
- Why it is the only candidate that could satisfy M1: it targets the actual existing conversation and reads the actual reply, matching criteria 2–3.
- Constraints and risks (must all hold; none are waived by this design):
  - **Explicit owner authorization required** — conversation target, time window, and最小 scope, in writing (e.g., a GitHub issue #14 directive comment), before any action. The standing execution stop order (`pm/UAH-COMMS-SPINE-PLAN-v0.1.md` control note, echoed in canon file) currently withholds this.
  - **No new login, no credential handling, no session-token copying.** Never copy cookies/tokens/session storage off the box, never print secrets, never commit them. Operate only within the already-authenticated local session context.
  - **ToS / safety risk:** automating the ChatGPT web UI may violate applicable terms or trigger anti-automation defenses, CAPTCHAs, or account flags. This must be disclosed to and accepted by the owner; prefer any official supported path if one becomes available. Keep automation minimal (one message, bounded wait, read-only capture thereafter).
  - **Fragility:** DOM selectors change; streaming replies need settled-completion detection; concurrent human use of the same session can interleave messages and invalidate correlation.
  - **Evidence hygiene:** store only minimized/redacted receipts (correlation ID, timestamps, message references, reply excerpt needed for readback proof); never full session dumps.
- Current state: box reports the tooling present (Playwright 1.64.1 + Chromium, CDP libs, desktop Chrome CDP on :9244 per `ops/BOX-READINESS.md`) but **no permitted authenticated ChatGPT session has been verified** and **no automation has been run** under this task. Tooling presence ≠ session availability ≠ authorization.
- Verdict: **ONLY VIABLE M1 PATH, but BLOCKED pending (i) explicit owner authorization, (ii) verified already-authenticated session, (iii) lifted/scoped execution approval.** This design proposes nothing to execute.

### Option D — ChatGPT scheduled tasks / other official features

- Claim under evaluation: whether an official ChatGPT feature (scheduled tasks, reminders, GPTs/actions, connectors, operator-style delegation, or API-to-ChatGPT bridging) could let BFF inject a message or schedule AION to poll GitHub autonomously.
- Status: **UNVERIFIED.** At design time, no official feature has been demonstrated that lets an external Linux agent inject a message into a specific pre-existing ChatGPT conversation, or lets a ChatGPT conversation autonomously poll GitHub issue #14 on a schedule and reply in-conversation, without owner invocation.
  - Scheduled tasks / reminders in ChatGPT: **UNVERIFIED** whether available on this account/plan, whether they can target the AION conversation, whether they can fetch GitHub, and whether output returns in-conversation without owner action.
  - Connectors / GitHub integration reading issue #14 from inside ChatGPT: **UNVERIFIED** whether enabled here; even if enabled, known behavior is pull-when-invoked, not push/wake (same limitation as Option B).
  - Any API-to-ChatGPT conversation injection endpoint: **UNVERIFIED** — no such supported endpoint is assumed to exist; the Responses API (Option A) explicitly does not do this.
- Verdict: **DO NOT RELY ON.** Research allowed (docs only); adoption requires a verified, owner-approved official path with observed in-conversation effect. Until then, mark all such claims UNVERIFIED.

## 4. Recommended design (when authorized; not executed here)

1. Owner posts explicit scoped authorization to issue #14 (target conversation identifier as displayed in UI — do not invent platform IDs — plus time window and probe-text approval).
2. BFF prepares probe text containing a fresh correlation ID, e.g. `AION-M1-<YYYYMMDDTHHMMSSZ>-<rand6>`, and a constrained instruction: "Reply with this correlation ID and the word QUOKKA."
3. BFF logs intended outbound (correlation ID, UTC time, target reference, probe text hash — not secrets) to `ops/evidence/` and issue #14.
4. Authorized adapter (Option C only) sends exactly one message to the existing conversation and captures: send UTC timestamp, destination conversation reference as observed, reply UTC timestamp(s), reply reference as observed, full reply text for local comparison.
5. BFF writes inbound receipt (correlation ID, reply excerpt, references, UTC times) to `ops/evidence/` + issue #14 comment.
6. AION introspection leg: on next invocation, AION reads the receipt/issue, then **independently** demonstrates readback inside the ChatGPT conversation by quoting the correlation ID + checkable detail (e.g., QUOKKA), which the adapter (or owner-observed transcript) confirms.
7. Negative case (same session, separate run): submit mismatched correlation / disconnect adapter / unauthenticated-profile check; confirm it is recorded as REJECTED, not as success.

## 5. Verification protocol (correlation IDs, independent readback)

- Correlation ID format: `AION-M1-<UTC YYYYMMDDTHHMMSSZ>-<6-char alnum>`; fresh per attempt; never reused.
- Outbound receipt must contain: correlation ID, sender (BFF box id), send UTC, target conversation reference (as observed, or `UNVERIFIED` if none), probe text or its hash, authorization reference (issue #14 comment id authorizing this attempt).
- Inbound receipt must contain: correlation ID echoed from the actual ChatGPT reply, reply UTC (first-token + settled), reply reference as observed (or `UNVERIFIED`), verdict (MATCH / MISMATCH / NO_REPLY / TIMEOUT), full reply excerpt sufficient to check.
- Independent readback: AION must, inside the ChatGPT conversation, reproduce the correlation ID and the probe's checkable detail **without Owen pasting it**, and a verifier (owner or second channel) acknowledges the match against the stored receipts. GitHub ACKs alone do not count.
- Clock discipline: all times UTC ISO-8601; box clock vs. GitHub `created_at` skew noted if > 60 s.
- Failure bar: any of (a) reply lacks the correlation ID, (b) reply came from the API/another model rather than the ChatGPT conversation, (c) session was unauthenticated, (d) adapter was disconnected — must be recorded as M1 FAIL for that attempt.
- Storage: sanitized receipts only under `ops/evidence/AION-BFF-002-M1-<correlation>-*.md` plus a linking issue #14 comment. No tokens, cookies, or full session dumps.

## 6. Explicit non-pass statement

**M1 is NOT passed.** This file presents evidence-grounded reasoning and a future verification protocol. It contains zero new runtime evidence: no message was sent to ChatGPT, no reply was read, no browser was driven, no auth was touched. The standing execution stop order remains unlifted by this document.

## 7. Evidence index (inputs, not proofs of M1)

- `canon/AION-MILESTONE-1-INTROSPECTION.md` — M1 definition, acceptance protocol, stop order.
- `ops/BOX-READINESS.md` — 18/18 readiness (tooling present; not a roundtrip).
- `ops/issue14-inbox-poller.sh` + `ops/issue14-inbox-poller-README.md` — read-only GitHub observation design.
- `ops/evidence/AION-BFF-002-POLLER-20261016T043126+0200-receipt.md` — 5 comments observed, cursor 0 → 6206669419; latest relevant directive comment 6206669419.
