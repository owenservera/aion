# LP-06 / Build 1 — Repeatable OpenCode task → proof (pilot v0.1)

**Owner request:** "Build 1" (the highest-ranked leapfrog: repeatable OpenCode task-to-proof primitive).  
**Delivery home:** existing AION repo `main`. This folder contains the **machine-readable contract, bounded pilot request, and execution acceptance**, not a claim the runner has already executed. No new repo, GitHub bot, branch, worktree, daemon or dispatch channel.

## Exact narrow goal

Turn a scoped AION intention into **one genuine OpenCode session → output and unit tests → committed artifact → independent source readback → verdict**, using existing GitHub as the durable record.

This is deliberately **not** M0.5 ChatGPT web-app introspection, not Windows remote control, not an arbitrary command dispatcher, and not an autonomous recurring process. GitHub comment publication never authorizes privileged host actions or wakes a ChatGPT session.

## Current product state

- `task.v1.schema.json` / `proof.v1.schema.json`: **PUBLISHED CONTRACTS**, not yet runtime-enforced.
- `pilot-001.task.json`: **PUBLISHED TASK INPUT**, *not* observed by OpenCode.
- `OPENCODE-IMPLEMENTATION-WORK-ORDER.md`: exact bounded implementation assignment for CoS to route to a real OpenCode coding session.
- Real builder, real OpenCode session ID, actual tests and independently verified GitHub output: **PENDING**.
- Existing [GitHub/OpenCode source receipt](https://github.com/owenservera/aion/issues/14#issuecomment-6206619114) is a prior demonstration, not proof of this new pilot.

## Five-state gate

1. `PUBLISHED`: request exists with immutable commit ref and correlation; not delivered.
2. `RECEIVED`: CoS records *real* executor/session acknowledgment; not executed.
3. `EXECUTED`: code + tests run, actual model/session and source commit recorded; still self-reported.
4. `VERIFIED`: **independent** verifier fetches committed files, compares SHA-256 and reruns tests, checks negative examples, then signs off.
5. `REJECTED`: any failed authority, provenance, test or digest gate prevents promotion.

A standalone `proof.v1` manifest with `verification.status=accepted` is **not self-authenticating**. Only independent GitHub/test evidence can justify `VERIFIED`. No manufactured session IDs, hashes or timestamps.

## Minimal architecture

```
Owner ask → Role 02 scoped task.v1 (GitHub main)
                 ↓
Role 03 CoS authenticates work order and selects authorized OpenCode session
                 ↓ (operator dispatch by verified existing route, not an issue trigger)
OpenCode reads pinned task input, edits only scoped paths, tests locally
                 ↓
Git commit + tests + proof.v1 with source SHA and genuine session/model
                 ↓
Independent ChatGPT verifier fetches remote commit/artifacts,
checks hashes and reruns safe Node tests → VERIFIED or REJECTED
```

## Rules for first implementation

- Build under `workspace/aion/ops/task-to-proof/` **only**, reusing this folder's specs from role 02.
- One read-only, offline `node --test` suite; node built-ins only. Do not implement a service, agent scheduler, watcher, GitHub Actions issue trigger or broad filesystem executor.
- Scope artifact path allowlist; refuse out-of-scope and unresolved SHA references.
- Use an existing free OpenCode model where actually available. Check host's installed CLI for flags; official docs: https://docs.opencode.ai/docs/cli/ and https://docs.opencode.ai/docs/server/.
- CoS must validate a genuine running session acknowledgment. Avoid new BFF/Grok Bot tasks: Grok Bot's remaining budget is reserved for M0.5.
- Shared AION checkout is documented as `/` on BFF Linux, with AION content under `/workspace/aion`; don't assume a standalone checkout or alter host auto-push. Keep risky autopush hardening separate and approved.
- Do not write raw private transcript/session exports to Git; use redacted proof manifests and separately protected raw logs.
- Respect documented host/browser stop order and `bridge:dispatch` freeze. A normal planning issue comment is NOT an execution queue.

## Acceptance tests

A. Correct `task.v1` and `proof.v1` formats validated against the published contracts; malformed input rejected.  
B. Wrong correlation ID, missing artifact, failed test, absent deny-case test, bad/missing SHA, and unsafe file path all rejected.  
C. An executor may claim `EXECUTED` but cannot unilaterally mark `VERIFIED`.  
D. A different verifier independently reads GitHub commit and re-runs tests against the same files.  
E. No new privilege or external service required; evidence stays within existing GitHub and current roles.

**Owner of coding:** OpenCode/ZCode. **Daily dispatch/ack:** CoS (role 03). **Acceptance:** independent verifier / AION. **Strategic gate ownership:** role 02.
