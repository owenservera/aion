# AION Agent 14 — Round 7 pure uncertain-step reconciler

**Status:** Tested candidate, source-only. Not integrated into Capture Studio; never controls a browser and never authorizes a resend.

## Why this exists
Z.ai Round 6 hardened `harness-runs.mjs` reserves an in-flight step and fences unknown effects. Its `step` record persists `key`, `tool`, `argsDigest`, `status`, but not the argument body. The actual thread-turn journal v2 stores a separate `key`, `payloadDigest`, exact canonical `threadKey`, phase, delivery and pre-effect audit. Therefore **a joined effect cannot be proved by run/conversation ID and time alone**. An external, durable **pre-effect** intent binding is required. No retroactive guess is acceptable.

## Files
- `uncertain-step-reconciler.mjs` — pure `reconcileUncertainStep({run,stepKey,journal,intentBinding})`
- `uncertain-step-reconciler.test.mjs` — fixture-driven negative and positive cases.

## Contract
The caller is responsible for reading and validating store/journal snapshots through their *existing* owners. `intentBinding` must have been recorded *before* dispatch by the existing effect owner and its provenance must be independently verified. Fields: `{source:'trusted-pre-effect',runId,stepKey,stepTool,argsDigest,conversationId,threadKey,journalTurnKey,journalPayloadDigest}`. Do not store any raw prompt or cookies. **The current Round 6 store does not yet persist a verified binding; absence MUST produce `still_unknown`.**

Output `{schema,verdict,reason,evidence,operatorAction,mutates:false,retryAuthorized:false}`; verdict `executed` only for a correctly correlated journal-positive delivery (`network:outgoing-request` or `page:new-user-turn`, strictly post-boundary); `not_executed` only for a matching `actuator-audit:pre-effect-blocked` proof of both typing and dispatch not executing; all other cases `still_unknown`.

`executed` means observed delivery, **not** reply completion, capture acceptance, or goal fulfillment. `not_executed` is **not** a new send permit: existing journal owner must reconcile independently before any later action. No function here updates a run status or clears a lock; Z.ai owns those integration decisions and tests.

## Runnable offline
`node --test uncertain-step-reconciler.test.mjs` (Node >=22)

## Z.ai integration requirements
1. First establish the smallest durable effect-owner binding **before** invoking `submit_conversation_turn`. Run-step key is not necessarily equal to journal turn key; do not try to infer it.
2. Validate the saved binding's provenance and associate it with the exact run, step, tool, digest, conversation, canonical thread and journal payload digest. Never expose raw arguments. Use current existing journal read API; don't parse in a competing runtime.
3. Wire a **read-only** reconcile query; no retry, no new effect, no force-unlock on heuristic evidence. Return `still_unknown` for missing/incomplete/mismatched bindings.
4. Add product-level real journal fixture tests and prove no effect for any classifier response. QA to test across interrupted process and Windows filesystem behavior.
5. Do not promote `executed` into `capture_accepted`. G1-G7 are separate gates.

Evidence class: source-inspected journal/runtime contracts + independently executed synthetic tests. Real-site/Windows acceptance pending.