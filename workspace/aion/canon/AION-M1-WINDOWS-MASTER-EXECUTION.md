# AION M1 — Windows master execution architecture
Date: 2026-10-17
Status: CURRENT TARGET / NOT INSTALLED OR LIVE VERIFIED
Decision: Owner shifted M1 transport target from BFF Linux to the official Windows machine. This document supersedes **Linux-as-primary-host** in earlier M0.5 planning; historical evidence remains intact. The M1 acceptance requirement has **not** changed.

## Authoritative M1 goal
AION independently originates a uniquely correlated prompt; authorized transport submits it into the **actual authenticated ChatGPT web app** on the Windows master machine; the real web-app reply is captured and returned; AION consumes it without owner copy/paste. An independent reviewer verifies origin, destination, response/readback, timestamps, and a rejected false/mismatched response. Mock pages, GitHub comments, API-only LLM requests, Linux readiness checks or BFF-authored probes do not qualify.

## Target architecture (desired, not an installed-system claim)
```text
AION originator / authorized agent runtime
             | correlated request/receipt
             v
Windows master: local AION bridge / minimum authorized UAH interface
             | authenticated local routing + scoped permission
             v
ACPX Chrome MV3 extension + Bun loopback bridge (REUSE CANDIDATE)
 OR minimal compliant Chrome/browser adapter (ONLY if needed)
             | exact AION-authored message
             v
Windows Chrome authenticated chatgpt.com web app
             | actual UI answer, matching conversation
             v
Browser adapter -> local bridge -> AION response consumer
             |                             |
             +--> local SQLite/IANG (later) +--> GitHub/GPM minimized evidence
```

Windows is **the authoritative human/master host**. BFF Linux is now an optional remote executor/testbed, not the required M1 browser location. Z.ai is mock-only sandbox/testing; neither has authority to override Windows. GitHub is the cross-machine task/evidence ledger, not automatic ChatGPT message transport. UAH is intended routing/identity; do not block the first live test on finishing generalized UAH/IANG architecture.

## Current implementation decision
1. Inventory locally: actual Windows Chrome signed-in state, allowed browser-control surface, installed Bun/ZCode/OpenCode, ACPX kit and local bridge. No assumption that these are installed or working simply because Linux readiness was green.
2. **Inspect existing ACPX source first**, pin manifest extension ID/origin, per-agent write grants, recipient tab targeting, completion semantics, replay, privacy, loopback restrictions and actual ACP compatibility. Compare against VOMEGA browser adapter and Chrome Relay plans; select reuse / wrap / replace per component. ACPX issue #25 describes the owner-uploaded code but **ZIP bytes are not committed to GitHub**. Do not assume GitHub workers can read them.
3. No Playwright or Puppeteer in implementation or tests. Use permitted browser-native/DevTools/manual techniques and Node/Bun deterministic tests. Do not carry across the prohibited ACPX `examples/e2e.mjs` Playwright runner.
4. OpenCode/ZCode writes code; TOOLSMITH 06 reviews source and contracts; CoS 03 obtains real execution handoff/ACK; Chief 05 verifies acceptance. GitHub assignments do not wake independent ChatGPT role chats.
5. After **explicit scoped Windows host/browser authorization**, perform the smallest live test; only then expand into UAH, SQLite/IANG, recovery, Chrome Relay UI and more provider adapters.

## Live acceptance receipt (required, not yet present)
- AION-originated prompt text/hash, correlation ID, source reference and UTC send timestamp.
- Authoritatively observed authenticated **Windows Chrome ChatGPT web-app** submission and same-conversation answer (no session tokens/cookies exported).
- Adapter capture of exact real answer and secured return to AION; AION actively consumes and reports a checkable detail; separate transport ACK, response completion and consumption.
- Independent negative proof rejecting wrong correlation/fake reply/disconnected or unauthenticated browser.
- Code revision/adapter version, tests, source/environment references, minimized sanitized GitHub evidence and independent reviewer acceptance.
- **M1_VERIFIED remains false** until all criteria are met.

## Controls / authorization
The standing host/browser execution stop order in `workspace/aion/pm/UAH-COMMS-SPINE-PLAN-v0.1.md` remains recorded. **This documentation update is not authorization to install an extension, drive Chrome, access a signed-in account, or dispatch host commands.** Request a scoped restart authorization describing the Windows host target and rollback. Do not log credentials, browser cookies, full private transcripts or tokens.

## Evidence / canonical navigation
- Canonical unchanged M1 acceptance: [AION-MILESTONE-1-INTROSPECTION.md](./AION-MILESTONE-1-INTROSPECTION.md).
- Previous Linux route (historical): [AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md](./AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md).
- Experiments, reusable candidates and hashes: [AION-M1-EXPERIMENTS-AND-METHODS.md](./AION-M1-EXPERIMENTS-AND-METHODS.md).
- Chrome Relay proposal: [../ops/chrome-relay/ARCHITECTURE.md](../ops/chrome-relay/ARCHITECTURE.md).
- ACPX review: https://github.com/owenservera/aion/issues/25 .
- M1-002 verified mock receipt: https://github.com/owenservera/aion/issues/26#issuecomment-6227479323 .
