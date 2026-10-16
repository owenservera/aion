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
