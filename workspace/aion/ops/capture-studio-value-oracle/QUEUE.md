> **2026-10-22 LOCAL-PC DESecuritization SWEEP — SOURCE DELIVERED, NOT WINDOWS VERIFIED:** [Full first-party friction audit](LOCAL-FIRST-SWEEP-2026-10-22.md). Direct localhost mode, local-raw fidelity, one-click Drive, long prompts, loopback integrations and local testing URLs shipped via multiple active lanes. The workspace's actual user-value prototype remains **0 shipped / 0 used**, so **V1 Outcome Packet is still the next highest-leverage product task**. Do not grow a new hardening or permissions program; preserve one-dispatch correctness and raw provenance. Windows smoke/local CLI real run still required.

# @VALUE-ORACLE — Outcome Delivery Queue
**Origin:** 2026-10-22 value audit. **This is the single local product-value queue**, not a new PM/agent-dispatch system. **Status:** Agent workspace bootstrapped; execution not started. Product source is under the existing Global Research 09 Capture Studio project.

## Governing target: automation of usefulness

**Target user journey:** A captured result *automatically becomes* a correct, traceable, ready-to-use output in the user's next workspace, without manual hunting/transcribing/reformatting and without unsafe external action. Priorities below are hypotheses until actual user trials.

| Sprint | User-facing proof, not a feature list | Already available / smallest build | Exit: demonstrably useful | Owner / blockers |
| --- | --- | --- | --- | --- |
| **V1 — First outcome (ACTIVE NEXT)** | "Take this saved AI answer and give me a ready-to-use packet." | Existing transcript, entities, session API, export → standalone read-only Outcome Packet generator + synthetic fixture | Correct Markdown/JSON packet with sources, decisions, proposed tasks, unknowns; zero external side effects; real manual-vs-new workflow measurement when available | Value-Oracle owns independent prototype; no Core editing; synthetic only initially |
| **V2 — Project landing** | "Give this result to the relevant AION project without copying." | Existing GitHub issue/file capabilities; read-only project mapping and dedup | Correct destination suggested; user-approved draft, idempotent delivery with readback link; no duplicate or secret leakage; no unverified task status | Value-Oracle consumer; 03 owns dispatch, 02 ownership map, GitHub write permission per action |
| **V3 — What's changed?** | "What changed in this topic or project since last session?" | Existing continuity/graph/history/search; L5 temporal contract | Two-session evidence-linked change brief; missing/untrusted entity joins explicitly abstain, including different-account same-origin | Value-Oracle brief; Core/L4 temporal and provenance confidence, QA negatives |
| **V4 — Automatic useful after Finish** | "I finish recording, and the next useful artifact is already available." | Existing derived artifacts and `/api/v1` tool manifest; local event feed/hooks | Saved capture -> accepted eligibility assessed -> offline packet generation -> local outcome notification and repeat-safe delivery; no browser sends | Core capture acceptance gate and bounded job lifecycle; agent does NOT create parallel server |
| **V5 — Friction and value hardening** | "It saves time and I trust it." | Existing UI integration and QA test paths | Real user-owned before/after task walkthrough, fewer manual actions, honest failures, no extra mandatory settings or parallel dashboards | UI owns buttons/navigation, QA independent acceptance; local Windows proof |

## Immediate actionable tasks — strict order, no massive speculative backlog

**V1.1 [NEXT, unblocked]** Pin the selected saved-session transcript/record structure using GitHub source and one synthetic offline fixture. Produce one realistic example of source-grounded extractable **decision** and **proposed task**. Determine which fields exist versus must abstain.

**V1.2 [NEXT]** Build `prototypes/outcome-packet.mjs` (or equivalent, only in this agent-owned directory): pure, bounded, source-preserving transformation from a **sanitized** synthetic session representation into a local Markdown+JSON output. Avoid external LLM dependence as a required runtime path; optional semantic enrichment can be evaluated separately.

**V1.3 [NEXT]** Write Node 22 positive and negative regression fixtures: missing session, incomplete derivation, anonymous/unknown identity, credential-shaped content redaction, untrusted inferred decisions, duplicate actions, oversized outputs, malformed evidence reference. Source links must never be fabricated.

**V1.4 [NEXT]** Demonstrate a one-command read-only result against a test fixture. Measure actual developer-run steps and error counts; don't pretend to have measured owner baseline until the owner uses it.

**V1.5 [DEFERRED]** Map it to the existing Studio UI/API as an owner-requested minimal interface once Core/UI ownership and privacy/acceptance gates are stable. Submit one issue for the precise integration instead of editing another lane's files.

## Opportunity admission rules

A new request goes into `VALUE-MAP.md` first only if it names a user job, a recipient and a sensible observable output. Promote it here when no active higher-impact user job competes, owner requested it, source evidence enables it and a permission-safe proof exists. Keep **one active vertical slice**, **at most five live work items**, and use existing GitHub issue/PR for cross-agent execution, not a custom bus. A prototype is allowed to be intentionally simple; never silently introduce a new permanent service.

## Cross-agent integration seam (not a wakeup or assignment)

| Needed result | Proposed recipient | What Value-Oracle supplies |
| --- | --- | --- |
| Post-Finish offline outcome handoff | Core | Declarative read-only artifact contract, bounded fixture, explicit incomplete/accepted behavior; Core implements lifecycle |
| One-click "Make useful" and "Review/send" | UI | Copy, states, source-link model, user-journey evidence; UI owns implementation |
| Source-backed uncertainty and model history | Knowledge–Learning | Concrete question, expected abstention, evidence, negative cross-account cases |
| Product safety and acceptance | QA | Fixture with success/failure, privacy/delivery boundary, proof to accept or reject |
| Project destination and task deduplication | Planning 02 / CoS 03 | Candidate issue/title/acceptance, no phantom assignment; established GitHub issue channel |
| Correct reusable claims/sources | Research 09 / Intake 07 | Minimal source-linked packet and explicit relevance to target repo |

## Success accounting (must be measured)

```text
job and actual consumer:
source and authorization:
manual baseline: owner_steps=?, elapsed=?, repeated_copy_pastes=? (UNKNOWN unless tested)
new workflow: owner_steps=?, elapsed=?, repeated_copy_pastes=?
produced artifact: verified local path + SHA + source references
correctness: checked fields / false or unsupported claims / missing data
delivery: draft | requested | permissioned | confirmed-readback
user-used: yes | no | unknown (default unknown)
rework: additional corrections/operations
decision: promote | revise | reject, with why
```

The agent cannot declare V1 "useful" solely because tests pass; `BUILT`, `TESTED`, `USER_USED`, and `ACCEPTED` are different. After each sprint update [STATE.json](STATE.json) and report a plain-language result to the user.
