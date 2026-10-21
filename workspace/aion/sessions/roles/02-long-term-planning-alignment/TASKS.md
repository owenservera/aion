# Planning — Central AION Task & Dependency List

**Accountable owner of this AION roll-up:** Role 02 Planning · **Current scope:** owner's Windows machine; Grok Bot/BFF parked · **As of:** 2026-10-21 · **Observed remote checkpoint:** `b7f0d44` before Planning edits; source evidence may advance independently.

This is the **one central strategic task view for AION**: the smallest set of actual product outcomes and cross-role actions Planning needs to see. It is **not** a duplicate GitHub issue queue, per-worker checklist, Harvest NEED/OFFER register or GPM cross-portfolio board. Each row references the owning source where details and proof live. Existing tasks may be represented by one *roll-up* row, not rewritten as numerous invented sub-tasks.

Read [AGENT-MATRIX.md](AGENT-MATRIX.md) for who handles what, [SITREP.md](SITREP.md) for north stars and strategic Harvest order, [Development desk](../../../ops/chrome-relay/workers/development/DELIVERABLES.md) for execution detail and [Harvest exchange](../../../ops/chrome-relay/harvest/EXCHANGE.jsonl) for raw supply/demand. The [shared living agent-comms model](../../../shared/agent-communications/LIVING-OPERATING-MODEL.md) applies before interacting with those notes.

## Meaning of tracking states (minimal)

- **OPEN:** next result not proven. An owner in the table is *responsibility*, **not** a dispatched/acknowledged live agent.
- **BLOCKED (observed):** a concrete observed defect prevents the result; reference the actual evidence.
- **STAGED:** code/research exists, but no AION runtime integration or necessary acceptance is proven.
- **SOURCE_MERGED:** committed integration proven on GitHub; local build/live capability is a separate question.
- **PARKED:** noncritical until owner direction or a real development need changes.
- **DONE:** a stated, bounded deliverable has an actual readback/receipt. Do not treat this as automatic completion of any wider milestone.

No SLA, due date, status-change ceremony or mandatory all-agent update. If an actual worker is assigned or acknowledges, link the operator/issue/response and say so; do not use an ungrounded `IN_PROGRESS`.

## One screen — current top priorities

| ID | Rank | North star | Outcome / concrete next evidence | Responsible actor(s) | Requires | Truthful current state / source |
| --- | --- | --- | --- | --- | --- | --- |
| **AION-P01** | **P0** | NS2 | Fix / diagnose local `account register chief` `REGISTRATION_FAILED`; show actual registered account and exact bound thread. | Development + Windows/OpenCode; Toolsmith if a real tooling defect | Current local installed build, exact auth/session | **BLOCKED (observed)** — [Dev desk](../../../ops/chrome-relay/workers/development/DELIVERABLES.md) records failure; no authenticated registration receipt |
| **AION-P02** | **P0** | NS2 | Prove the CLI watch-only receives a new, independently originated message in the exact bound ChatGPT web thread (I1). | Development + Windows/OpenCode | P01; current source/build | **OPEN / live unverified** — [PR #62](https://github.com/owenservera/aion/pull/62) merged code but no I1 live acceptance |
| **AION-P03** | **P0** | NS2 | Usable `aion chat chief` terminal: multiple real text turns, paired responses, original web-thread identity, one effect per Send (I2). | Development + Windows/OpenCode | P02 for full supported route; scoped Send | **OPEN / not proven** — [accepted design #43](https://github.com/owenservera/aion/issues/43) |
| **AION-P04** | **P0 parallel** | NS1 | Preserve/complete independent introspection acceptance of genuine AION-originated ChatGPT request and readback, including relevant independent/negative evidence. | Development + Windows/OpenCode for live evidence; Chief of Chiefs for independent acceptance | Valid actual evidence, not an arbitrary paperwork gate | **OPEN / positive-path-only receipt** — [2026-10-19 live receipt](../../../agents/windows-master/LIVE-INTEGRATION-2026-10-19.md), `m1_verified=false`; **not** a prerequisite for ordinary authorized I1/I2 development |
| **AION-P05** | **P0** | NS2 | Reconcile Windows local `main`, actual Chrome/host dev build and merged PR #62 before current-head proof; preserve local-only changes. | Windows/OpenCode + Development | Inspect local Git/build, protect dirty tree | **OPEN / local state unknown** — [PR #62](https://github.com/owenservera/aion/pull/62) explicitly disclaims Windows sync/live proof |
| **AION-P06** | **P1 after working Send** | NS3 | Real restart/reconnect, cursor gaps, uncertain Send and zero blind resend (I3). | Development + Windows/OpenCode | P03's working path and existing Bus guards | **OPEN / not verified** — [Dev Master](../../../ops/chrome-relay/DEVELOPMENT-MASTER.md) |
| **AION-P07** | **P0 strategic** | ALL | Keep north stars NS1–NS4 and time-to-prototype ordering aligned to actual recent commits and owner direction. | **Planning** | New evidence or owner priority change | **DONE for initial charter / ongoing on material changes** — [Planning SITREP](SITREP.md) |
| **AION-P08** | **P0 strategic** | ALL | Keep a clear single-responsibility/dependency routing view and central cross-agent task roll-up. | **Planning** | Relevant role/source changes | **DONE for initial scaffold / ongoing on material changes** — [AGENT-MATRIX](AGENT-MATRIX.md) and this task file |
| **AION-P09** | **P0 strategic** | NS2 | Remove invented approvals, serial documentation checks and redundant work that delay a usable prototype; retain actual identity, grants, no-resend and truth-in-proof. | **Planning**, with Development/Chief when relevant | Encounter a specific real friction point | **OPEN / continuing strategic duty** — [Planning SITREP](SITREP.md), [repository rules](../../../../../AGENTS.md) |

## Harvest integration and supporting assignments

| ID | Rank | North star | Outcome / decision needed | Responsible actor(s) | Requires | Truthful current state / source |
| --- | --- | --- | --- | --- | --- | --- |
| **AION-H01** | **P0 conditional** | NS2 | For observed I1/readback gaps, choose integrate-or-defer for **PACK-04 serializer** and **PACK-06 readiness/document binding**; rank by actual time saved. | **Planning** owns priority; Development owns source choice/integration; Integration Manager only if selected adaptation needed | Evidence that they solve a real defect | **STAGED, not wired** — [Harvest entry](../../../ops/chrome-relay/harvest/START-HERE.md) |
| **AION-H02** | **P1 at I2** | NS2 | Identify smallest useful **PACK-03** correlation and targeted **PACK-08** negative scenarios; avoid automatic broad test work. | **Planning** priority; Development selection; Integration Manager adapts only on real request | P02 or a proven send-correlation blocker | **OPEN / not dispatched** — PACK-03 reserved, PACK-08 unstarted in [Harvest entry](../../../ops/chrome-relay/harvest/START-HERE.md) |
| **AION-H03** | **P2** | NS4 | Evaluate **PACK-05** 29-facet command map and Omega/VIVIM/VOMEGA source when core interaction is working; don't make 40-command coverage a prototype gate. | Planning + Development; Discovery/Research for evidence | Working two-way path or explicit command need | **STAGED / research, not live** — [Harvest entry](../../../ops/chrome-relay/harvest/START-HERE.md) |
| **AION-H04** | **P3** | NS4 | Decide on **PACK-07** transfer integrity only for a real file/attachment product slice. | Planning + Development | Accepted attachment need | **STAGED / not wired** — [Harvest entry](../../../ops/chrome-relay/harvest/START-HERE.md) |
| **AION-H05** | **P2 conditional** | ALL | Keep reuse alternatives and donor evidence available without redundant clones, duplicate 40×9 scans, or unsolicited packaging. | Planning priority; Nine-Repo Discovery and Role 09 Research evidence; Development selects | Actual Development NEED or breakthrough primitive | **OPEN / trigger-based** — [EXCHANGE](../../../ops/chrome-relay/harvest/EXCHANGE.jsonl), [nine-repo desk](../../../ops/chrome-relay/harvest/external/workers/nine-repo/DELIVERABLES.md) |

## Additional cross-role visibility (non-blocking unless triggered)

| ID | Priority | Task / outcome | Responsible actor | Dependency or trigger | Actual status |
| --- | --- | --- | --- | --- | --- |
| **AION-X01** | When dispatch needed | Dispatch/follow-through and collect genuine local worker acknowledgment/receipts; distinguish plan from execution. | Role 03 Chief of Staff / local operator | Concrete named task from Planning/Development | **OPEN as operating responsibility**, not proof any new worker was dispatched |
| **AION-X02** | If concrete setup issue persists | Troubleshoot Windows extension / native-host / account registration environment, without extra bureaucracy. | Role 06 Toolsmith assisting Development | P01 genuine tooling blocker, real role engagement | **CONDITIONAL / role session not independently confirmed** |
| **AION-X03** | After live sessions generate useful telemetry | Measure local OpenCode throughput, idle/blocked cost and impact on prototype speed. | Role 04 Efficiency | Genuine measured local session data | **OPEN / no fresh current measurement established in this review** |
| **AION-X04** | After meaningful source receipts | Surface truthful prototype/milestone state in existing dashboard without inventing completion. | Role 01 Dashboard | Verified Development/Windows receipts and owner priority | **PARKED from prototype critical path** |
| **AION-X05** | After usable NS2 | Prove recovery robustness and additional provider/native source where the AION model can be reused. | Development / Toolsmith / Research as appropriate | P03/P06; explicit second-provider choice | **PARKED** |
| **AION-X06** | Owner decision if required | Resolve whether diagnostic disk writes are authorized, only when the actual diagnosis requires that effect. | Owner decision; Development provides exact need | Concrete diagnostic need and minimized risk | **OPEN / no permission inferred** — [PR #62](https://github.com/owenservera/aion/pull/62) explicitly excludes the write permission |
| **AION-X07** | No current priority | Grok Bot/BFF Linux, Z.ai sandbox activation, old Track A, speculative agent fabric/long-lived parallel runtimes. | Owner if reactivated | Explicit new direction | **PARKED** |

## Ownership / dependence rule

The **responsible actor** names who would produce the outcome, not who has been contacted, confirmed active, or assigned automatically. Planning owns the roll-up status and priority; the **working source** owns engineering details and acceptance receipts. When a worker reports results, Planning reconciles the appropriate row against the actual commit/SHA, test receipt and session/account binding—not a summary claim alone.

**How this stays current:** On user `SITREP` or material upstream change, scan source state for relevant rows, compare new GitHub notes, move a row only when supported, collapse superseded rows, and flag exactly which other role to engage. Never demand that every role update this file. Avoid creating new workflow tools, schedules, committees or an auxiliary queue.

**Known gap:** the remote repo has no new independent proof of the current local Windows `main`/installed extension state or a successful exact-thread I1 receipt at this checkpoint. Those are uncertainties, not silent failures.
