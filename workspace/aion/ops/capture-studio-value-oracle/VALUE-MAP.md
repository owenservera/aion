# Value-Oracle — Workspace Audit, User Jobs & Outcome Opportunities
**Assessment:** 2026-10-22, GitHub `main` pinned at starting commit `da6fada50c31fa6a71e31b5a97dec7da9a735ee1`. **Evidence:** read-only inspection of first-party AION workspaces, docs and source surfaces; no new local Windows/browser usability trial. **Ranking:** product hypothesis, not measured customer demand, completion, adoption or ROI.

## Why we are building this

The [16-capability Studio contract](../../sessions/roles/09-global-research/labs/website-to-local-streaming/UNIVERSAL-CAPTURE-STUDIO-CAPABILITIES.md) specifies user-authorized capture, data-shape discovery, corrections, preview, recording, replay/search/export and local ownership. The [Studio architecture](../../sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/ARCHITECTURE.md) translates this into layers. That **enables** trustworthy local intelligence but is not the *final user job*.

**Reframed outcome:** For the user's AI browsing, research and ongoing AION project work, captured information should become **an answer the user can find, a task the system can prepare, a decision it can support, or a reusable artifact it can deliver—without another round of copy/paste and interpretation**. This is an intended product direction, not a claim of adoption or current capability.

## Reality audit: engineering asset -> benefit -> last-mile gap

| Existing asset (source or documented capability) | Already enabled in source | What is NOT proven as an easy user outcome |
| --- | --- | --- |
| `src/capture`, raw segmented sessions, reducer/derive, `Session.verify` | Durable evidence, decoded events, provenance, gap accounting | Automatically receiving a useful work product after Finish; accepted-data trust gates still being hardened |
| `src/intel/{discover,graph,continuity,search,learn,temporal-truth}` | Entities, relationships, cross-session review, search, temporal and corrected interpretations | Actionable task/decision extracted and routed to the **right project**; temporal/time and identity contracts remain incomplete |
| `bin/commands/{export,knowledge,learn}` | Dataset, transcript, report, knowledge, graph, schemas, bundle exports; review and search commands | A purpose-built brief/task/decision deliverable needing no understanding of datasets or command flags |
| `src/studio/integration-hub.mjs` | `/api/v1` sessions, search, replay, graphs, continuity, learning, openapi + MCP-style tool manifest | Stable, owner-visible outcome pipeline that consumes these APIs into tangible next actions |
| `src/studio/capabilities.mjs`, `webhooks.mjs` | Derived artifacts, local SSE and explicitly registered loopback webhook events | Guaranteed useful post-capture processing: webhooks are process-lived, opt-in, delivery receipts not permanent job completion |
| Studio `/chat`, `/drive`, sessions/Knowledge UI | One prompt/capture and evidence navigation with uncertain state controls | End-to-end user task, first useful output and return-to-project workflow; known local real ChatGPT readiness issues |
| [Research 09 workspace](../../sessions/roles/09-global-research/WORKSPACE.md) and [Intake 07](../../sessions/roles/07-proposal-intake-commons/WORKSPACE.md) | Research prioritization, provenance-linked finding packets, proposal custody | Automatic **safe** intake from a local captured answer to those existing workflows |
| [Planning 02](../../sessions/roles/02-long-term-planning-alignment/STRATEGY-AND-FIRST-DELIVERABLES-v0.1.md), [Chief 05](../../sessions/roles/05-chief-of-chiefs/BOOTSTRAP.md), CoS 03, GitHub coordination | Goal, priorities, operational dispatch and receipts | Automatic creation of **high-quality proposed** tasks/decisions from captured evidence; no parallel PM/dispatch bus desired |
| [QA integration roadmap](../../qa/capture-studio/INTEGRATION-ROADMAP.md) and [Core plan](../capture-studio-core/FIVE-SPRINT-PLAN-2026-10-22.md) | Studio as canonical browser engine; source acceptance safety priorities | Reliable `accepted` evidence gate for machine-driven downstream action; model inference must not infer authorization |
| [Systems assessment](../capture-studio-systems/ASSESSMENT-01.md) | Good evidence-first journey and UI status-clarity recommendations | Proving user effort shrinks instead of adding an impressive expert-oriented exploration UI |

**Conclusion:** Studio has a substantial **observation-to-structured-information** stack. Source inspection does **not** demonstrate a closed loop **structured information -> user outcome -> measured adoption/effort saved**. We should prototype a single read-only outcome consumer rather than build an agent framework or another storage layer first.

## Ranked candidate user jobs (proposed until tested with real user)

| Priority | User's job / why valuable | Output (not another dashboard) | Existing reuse | Gating / proof |
| --- | --- | --- | --- | --- |
| **P0/U01** | **I got an important AI response. Turn it into something I can immediately use.** | A local source-linked **Outcome Packet**: answer summary, explicit decisions, actionable proposals, links, uncertainties and copy-ready Markdown/JSON. | Session transcript, decoded structured blocks, `/api/v1` reads, local exports. | **First vertical slice.** Synthetic saved fixture -> packet without network send or private-content upload; user can use it without hand transcription. |
| **P0/U02** | **What changed since last time I captured this subject?** | A source-linked change brief: new/changed/retracted facts, with account/time uncertainty. | Continuity, graph, temporal contract, session history. | Two-session offline fixture; distinguish same-origin different accounts; no future leakage. |
| **P0/U03** | **Which of these answers contains tasks or decisions for my projects?** | Reviewable task and decision proposals with source location, confidence and suggested repo; NO automatic issue creation initially. | U01, Research/Intake, GitHub repo/issue indexing. | Explicit source statement versus inference; existing-task dedup; unknown project -> unassigned. |
| **P1/U04** | **Feed a useful result into my project without copying it manually.** | Confirmed draft-to-GitHub task/doc/PM intake with stable idempotency and readback link. | GitHub existing issue/PR/file endpoints, CoS/Planning coordination. | **Explicit destination + permission + human confirmation** initially; no raw transcript publication or duplicate action. |
| **P1/U05** | **I want an answer with its original supporting material.** | Evidence-first searchable answer / relevant excerpt / jump to original, revealing gaps. | Search, graph, raw locator, provenance, Knowledge. | Manual 3-question evaluation: correct source, correct abstention, fewer operations than browsing datasets. |
| **P1/U06** | **Automatically detect important drift in ongoing AI research.** | New finding or contradiction digest scoped to a topic/project, not an unlimited alert feed. | Multi-session temporal knowledge, Research 09 and Intake 07. | No alert without material change; provenance, freshness, and threshold negative fixtures. |
| **P1/U07** | **Save a reusable answer as a structured artifact.** | A validated project-ready Markdown/JSON/CSV or extracted table, preserving text and structure. | Dataset/Markdown exports, schemas and graph. | Dry-run artifact diff and project path authorization; copied result used once before automating. |
| **P2/U08** | **Bring context into the next AI/provider session without me rebuilding it.** | Explicit, redacted, minimal context packet scoped to task and sources. | Search, transcript, model, provenance; existing ACP/GitHub. | Never inject into external provider without authorization; avoid secrets/other-account bleed. |
| **P2/U09** | **Make correction pay off next time.** | Transparent before/after suggested field/answer and reusable profile update with rollback. | L5 learner, graph revisions, comparison. | Real held-out improvement, negative contamination tests; not mere confidence display. |
| **P2/U10** | **I don't want to manage dozens of sessions and exports.** | One saved-task workbench: search by goal, newest useful result, related decisions/tasks, export once. | Existing UI/session search and export. | User task test before deciding any new UI; likely reuse Studio UI rather than build another app. |

P0 means a *candidate to prove early*, not readiness for automated, permissioned production delivery.

## Reference Outcome Packet contract (first usable output)

A packet is created **locally, read-only**, from selected authorized source session(s). It is downstream material, not a new raw store or new canonical model.

```json
{
  "schema": "capture-studio.outcome-packet/1",
  "job": "turn an AI response into a usable project action",
  "source": [{"session": "fixture-001", "sid": "s1", "seq": 21, "coverage": "recorded-not-accepted"}],
  "answer": {"summary": "...", "basis": "observed-or-inferred", "reviewRequired": true},
  "decisions": [{"statement": "...", "assertedBy": "source|inferred", "sourceRefs": ["..."]}],
  "actions": [{"proposal": "...", "destination": null, "permission": "review-required", "sourceRefs": ["..."]}],
  "artifacts": [{"kind": "markdown", "state": "draft", "localPath": null}],
  "unknowns": ["missing-capture-completeness"],
  "delivery": {"state": "not-attempted"},
  "measurement": {"baselineOwnerSteps": null, "newOwnerSteps": null, "used": false}
}
```

Example strings are illustrative and **not** actual captured user data. An implementation must validate source locators, content provenance, scope, output size, deduplication and authority before introducing semantic assertions or delivery.

## Definition of genuinely useful: independent user-journey test

**Before:** user opens ChatGPT, hunts for the relevant part of a response, copies snippets, rewrites into project work and manually locates a destination. These are *hypothesized* steps to measure, not reported observations.

**After:** user chooses the saved source, selects **Make this useful**, receives a relevant, correct, reusable and appropriately scoped packet, optionally approves a delivery, and can inspect the exact underlying evidence with one action.

Record for each trial: task/job; source IDs and availability; number of human actions and copy/pastes; task time; produced artifact path/format; whether the result was *used*; number of factual corrections or omitted decisions; delivery permissions; and unexpected extra work. An empty/unknown source yields an honest explanation, **not an invented useful summary**.

## What the new agent should refuse

- Counting capture bytes/entities/algorithms as product value.
- Building another generalized dashboard, graph DB or second knowledge bus before proving a task.
- Automatically publishing user-private transcripts into GitHub.
- Routing an inferred action to a project as if the user assigned it.
- Conflating observed, inferred, reviewed, and accepted evidence.
- Starting duplicate browser actions/retrying an uncertain send.
- Claiming “automated” because a UI button or webhook exists but no destination consumed the output.
- Announcing simulated time saved before a user journey or appropriate measured baseline.

**Next:** [QUEUE.md](QUEUE.md). The first proof should happen entirely from synthetic saved evidence and a local output file. Real user data follows only with appropriate on-device access and permission.
