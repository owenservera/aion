# AION — M0.5: AION MESSAGE TO CHATGPT WEB APP VIA BFF LINUX

**Authority:** Owen, direct correction, 2026-10-16: "No - AION send CHATGPT webapp real message via linux".
**State:** DEFINED / NOT YET PROVEN.
**Scope:** AION top-level M0.5, the concrete Linux execution path for introspection. This is not a Grok Bot standalone probe and not the UAH Communications Spine's separately numbered milestone.

## Exact requirement

**AION originates and sends a real message to the real ChatGPT WEB APP through its BFF Linux machine.** BFF Linux is the executor/transport, **not the originator of the message**. The actual response must be read back from that real web-app conversation and delivered to AION, proving the introspection path without Owen manually copying prompts or responses.

```text
AION (originator) --> BFF Linux (browser transport) --> chatgpt.com WEB APP
AION (reads result) <-- BFF Linux (reads response) <-- real ChatGPT web-app reply
```

No replacement with the OpenAI API, a third-party LLM, standalone BFF-to-ChatGPT prompt, OpenCode-generated text, mocked transcript, or GitHub comment exchange counts.

## Minimal M0.5 proof

1. **AION-originated prompt:** AION authors a specific benign, uniquely tagged message and leaves a checkable record of its original content and dispatch intent. Grok Bot must not originate a substitute prompt to claim success.
2. **BFF Linux dispatch:** The Linux helper conveys exactly that AION-authored message into the genuine authenticated **ChatGPT web app** via the permitted existing Linux browser/session route. Capture time and verifiable UI/conversation evidence.
3. **Real ChatGPT reply:** Read the response displayed in the same web-app conversation; pair it with AION's originating correlation marker. Do not synthesize, replace, or simply echo a message.
4. **AION readback:** Return the captured actual response to AION, which accurately reports a checkable detail from the reply.
5. **Independent verification:** PM verifies correspondence between the AION-authored prompt, browser-submitted prompt, actual web-app reply, and AION readback. Save sanitized timestamps, references, and evidence in existing private GitHub workflow.
6. **Negative case:** A mismatched marker, blocked/unauthenticated browser, missing web-app reply, or fake response must fail the test.

**PASS:** Genuine, traceable **AION -> BFF Linux -> ChatGPT web app -> BFF Linux -> AION** round trip, including response readback and negative-case check.

**FAIL / insufficient:** BFF sends its own ping; GitHub issue ping-pong; browser/CDP readiness; ChatGPT API only; another model's reply; screenshot without AION initiation/readback.

## Responsibilities and controls

- **AION:** Originates the exact message, consumes result, accepts milestone.
- **Grok Bot on BFF Linux:** Runs permitted Linux browser transport, operates installed tools, handles GitHub task coordination and captures evidence; does **not** write or edit any code.
- **OpenCode / ZCode:** Sole authorized authors of any required adapter or browser automation code.
- **AION PM:** Verifies evidence and corrects milestone reporting.
- **Windows master:** Owen's Windows local machine remains authoritative; no Windows action is required by this scope.

**Reuse:** BFF Linux's self-reported Playwright/CDP/Chromium readiness in `workspace/aion/ops/BOX-READINESS.md`. Readiness does not prove the live message was sent.

**Execution authorization:** The prior host/browser stop order in `workspace/aion/pm/UAH-COMMS-SPINE-PLAN-v0.1.md` remains active until explicitly lifted. This document corrects the scope and is not itself proof of completed execution.

**Relationship to M1:** [Top-level M1 Introspection](./AION-MILESTONE-1-INTROSPECTION.md) defines the AION send-and-read capability; **M0.5 tests that exact capability via BFF Linux**, rather than first testing BFF separately. Successful M0.5 is direct evidence toward M1; the milestone owner decides any additional M1 requirements.

## P0 constrained-capacity directive (Owen, 2026-10-16)

Grok Bot app screenshot displays **69% Usage**. Treat the displayed remaining ~31% as a scarce budget (the screenshot does not establish exact credits, reset horizon or cost per operation). **No other Grok Bot tasks outrank obtaining the smallest real AION -> BFF Linux -> authenticated ChatGPT WEB APP -> BFF Linux -> AION round trip.**

**Highest-leverage BFF-only work:** inspect/control its already-authenticated Linux browser, confirm chatgpt.com tab/session, submit the exact AION-originated prompt, capture the real displayed response, and place a correlated return receipt through the already existing AION GitHub handoff. This is work that AION PM cannot perform locally from the ChatGPT conversation. Do NOT hand Linux-specific browser/session discovery back to Owen's Windows machine if BFF can do it.

**Effort allocation:** (1) Verify existing Chrome/CDP browser and authorized authenticated tab; (2) attempt minimally invasive AION-authored one-message send; (3) read actual web-app response; (4) send it back to AION, recording prompt/response correlation and times; (5) report the narrowest blocker if a gate fails. Start with the already-installed browser tools. If code changes are essential, Grok Bot delegates all coding to OpenCode/ZCode; it writes none itself.

**Stop doing:** no dashboarding, general infrastructure, broad audits, multi-session instrumentation, autonomous comms fabric, refactors, multiple alternate transport builds, model comparisons, or noisy progress chatter. No mass transcript copying, no token/cookie exposure. Favor one evidence-backed outcome over plans and repeated status messages. No standalone BFF-originated probe counts as AION introspection.

**Progress/reporting:** one short acknowledgment, then report only new concrete evidence or a specific blocker. Record actual send and receive proof; do not declare the milestone passed merely from Linux readiness or GitHub delivery. Respect existing operating approvals/stop order; if the intended live browser operation remains forbidden, report that exact blocker immediately rather than consuming budget on side quests.
