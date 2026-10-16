# AION — M0.5: INTROSPECTION VIA BFF LINUX

**Authority:** Owen, direct instruction, 2026-10-16: "M0.5 IS INTROSPECTION VIA BFF LINUX".
**Gate:** DEFINED / NOT VERIFIED.
**Sequence:** Top-level AION M0.5 precedes [M1 — AION Introspection](./AION-MILESTONE-1-INTROSPECTION.md). The UAH Communications Spine's separately numbered milestones are a different workstream.

## Mission

Prove that the **existing AION BFF Linux machine** can submit a real prompt to the real ChatGPT service using a permitted authenticated path, retrieve the actual answer on the BFF Linux machine, and correlate it with the sent prompt. No copy/paste by Owen, no fabricated answer, and no GitHub-comment-to-GitHub-comment simulation.

## Minimal test and PASS gate

1. **Check path:** Grok Bot inventories the existing signed-in ChatGPT session / approved adapter on its own BFF Linux machine. Identify available supported access without extracting or publishing session cookies or tokens.
2. **Send:** BFF Linux submits a benign, unique correlation marker in an actual ChatGPT conversation. Record UTC timestamp and the available verifiable conversation/message/UI reference.
3. **Read:** BFF Linux reads the real assistant response from the same authenticated service; link it to the originating marker and capture a checkable response detail.
4. **Proof:** Report sender, transport, sent prompt hash or sanitized excerpt, actual observed response excerpt, UTC times, source/response references or reproducible UI evidence, and result to AION via the existing GitHub PM evidence path.
5. **Negative case:** A stale page, missing response, mismatched marker, unauthenticated request, or simulated LLM output must not be counted as success.
6. **Verification:** AION PM independently inspects receipts; AION accepts/rejects the gate.

**PASS:** One genuine BFF Linux -> ChatGPT -> BFF Linux correlated, evidenced send/read roundtrip plus failure/rejection check.
**Not PASS:** Linux readiness only, Playwright smoke to an unrelated site, OpenCode model output, synthetic transcript, GH ping-pong, or an unverified claim of success.

## Owners and boundaries

- **Accountable:** AION.
- **Linux operator / orchestration:** Grok Bot (BFF).
- **Code author/implementer:** OpenCode or ZCode **only**. Grok Bot must not write or edit code; it can install/configure/run authorized tools, inspect results, and file receipts.
- **Independent evidence check:** AION PM.
- **Master environment:** Owen's Windows machine remains authoritative; M0.5 does not require Windows execution.

**Reuse first:** Existing BFF Linux browser/CDP/Playwright stack and permitted authenticated connections; do not build another bus, add a repo, or introduce a credential store unless a concrete blocker demands it.

**Known readiness, not completion:** `workspace/aion/ops/BOX-READINESS.md` self-reports Playwright/Chromium and CDP readiness; it has **not** supplied evidence of an actual ChatGPT send/read.

**Execution control:** Existing AION host/browser execution stop order in `workspace/aion/pm/UAH-COMMS-SPINE-PLAN-v0.1.md` is not lifted by milestone definition alone. GitHub coordination and planning can proceed; live execution needs explicit authorization.

**M1 handoff:** Only after M0.5 proof, adapt that confirmed BFF Linux route so **AION itself** can originate the prompt and consume the real response. M0.5 does not satisfy M1 by proxy.
