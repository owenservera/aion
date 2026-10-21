# Planning — Agent Responsibility & Dependency Matrix

**Owner:** AION core agent 02 Planning · **Current scope:** Windows-local AION prototype · **Substantive role review:** 2026-10-21 (13-core-agent team; remote repository evidence, not a Windows observation).

Use this page to answer **"Who owns this, whom do I engage, what does it depend on?"** It is a compact role map, **not** a new agent registry or proof that any separate chat is currently running. The canonical role definitions remain in [standing sessions](../../README.md), each role's `BOOTSTRAP.md`, and actual project/worker source files. The central Planning [TASKS.md](TASKS.md) links current cross-agent work.

## Authority and engagement

- **Owner (human):** ultimate product direction, priorities, real-machine authority and any exceptional risk/policy decisions.
- **02 Planning (this role):** owns north stars NS1–NS4; priority of time-to-working-prototype; Harvest integration *strategic ordering*; this responsibility/dependency matrix; the central **AION-level** task list and cross-role alignment. Planning can ask/coordinate, not impersonate another role's execution or approval.
- **05 Chief of Chiefs:** resolves cross-role executive conflicts and independent major acceptance/priority questions; not routine day-to-day dispatcher.
- **03 Chief of Staff:** owns real operational dispatch, evidence chasing and follow-up. Planning communicates priorities to 03/05 but does not claim GitHub notes wake workers.
- **10 Development and local Windows executor:** own code choice, integration, offline/live tests and execution receipts. **11 Integration Manager** owns selected source adaptation; **12 Harvest/Acceleration** owns discovery and source leverage. All three are now core AION agents, not subordinate roles. Their actual runtime/worker acknowledgments require separate proof. Neither Harvest packaging nor a Planning row proves runtime acceptance.
- **GPM:** still owns *portfolio-wide* work management. This AION view is a scoped roll-up; it does not replicate GPM's cross-project authority or the [Harvest EXCHANGE](../../../ops/chrome-relay/harvest/EXCHANGE.jsonl).

**Engagement mechanism:** read the relevant agent's latest role SITREP, actual source/PR/issue and [the living communications rules](../../../shared/agent-communications/LIVING-OPERATING-MODEL.md) before leaving an optional GitHub note. The live ChatGPT conversation must receive a real owner or operator dispatch to be considered engaged; commit/issue/note alone is not delivery or acknowledgment. Actual working local OpenCode/subagent assignments are tracked by their operator's receipts, not inferred from an agent folder.

## Who to engage and when

| Actor | Owns / answer sought | Depends on / feeds | Engage when | Active-path classification |
| --- | --- | --- | --- | --- |
| **Owner** | Product outcomes, constraints, high-impact choices | Evidence and focused choices from 02/03/05 | Real unresolved owner decision; changing the north stars | ACTIVE authority |
| **01 Dashboard / Tracking** | Visual status, deployed UI, truthful project metrics | Evidence from Dev/03/04/02; serves owner | There is verified data that a dashboard should show | SUPPORT / non-blocking to prototype |
| **02 Planning** | North stars, strategic dependency map, task overview, Harvest integration ranking | Dev receipts, 03 dispatch reality, 05 priorities, 09 intelligence | A priority, owner, dependency, milestone or workstream assumption changes | ACTIVE |
| **03 Chief of Staff / Operations** | Dispatch/follow-up, operational blockers, real acknowledgments and receipts | Planning priorities + Developer/operator state; feeds 05/02 | A task needs an actual worker engaged or chased | ACTIVE coordination when called |
| **04 OpenCode Output / Efficiency** | Local agent throughput, measured delivery, session bottlenecks | Actual OpenCode/local receipts; informs 02/03/05 | Local execution capacity or wasted cycles affect prototype speed | SUPPORT / actual telemetry required |
| **05 Chief of Chiefs** | Executive oversight, cross-role arbitration, independent acceptance | Planning map + real execution evidence | Two owners conflict or a major milestone requires independent review | ACTIVE executive authority |
| **06 Toolsmith** | Tool readiness, Windows/Chrome/IPC/ACP integration, environment recovery | Actual Windows tool state; supports Development/03 | A concrete setup/tooling defect (e.g. account registration/native-host) needs specialized help | **Dedicated role chat reports launched** in [2026-10-21 Toolsmith SITREP](../06-tooling-integration-engineer/SITREP.md); exact Windows access/live diagnosis still unverified |
| **07 Proposal Intake** | Unmodified raw technical proposals, neutral source custody | Input from workers/research; feeds 09/02/Development | A new external technical proposal needs preservation, **not** priority approval | ON DEMAND; not a product gate |
| **08 Z-FORGE / Z.ai sandbox** | Web-agent sandbox experiments and bounded research | Owner-directed sandbox availability; informs 06/04 | Owner explicitly activates a Z.ai experiment | PARKED from Windows-only critical path |
| **09 AION Research** | Global research intake, evidence quality, cross-project implications; [website-to-local Capture Studio lab](https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming) | Original sources and experimental capture code; feeds Planning/Development/Toolsmith | Source-backed streaming experiments or external technology change product choices | ACTIVE independent research track; Chromium synthetic proof, not live ChatGPT/Windows acceptance |
| **13 Semantics / Semantic Engine Architect** | VOMEGA-faithful AION command meaning, ambiguity, typed intent/IR and authority separation | Semantic contract informs Planning and Development, without exercising Bus effects | Command-language interpretation, intent binding, approval semantics or scope resolution changes | ACTIVE source-level architecture; no automatic runtime proof — [semantic contract](../13-semantic-engine/SEMANTIC-CONTRACT.md) |
| **10 Development (former Track B)** | Actual AION CLI/Bus/Chrome receive and Send implementation, source integration, tests and gates I0–I3 | Owns technical choices; consumes selected Harvest; collaborates with local executor | Any AION code change, I1/I2/I3 failure, compatibility or runtime acceptance issue | ACTIVE build owner |
| **Local Windows/OpenCode agent(s)** | Execute real Windows builds, setup, browser tests and local proof | Current Windows checkout and owner scope; reports to Development/03 | A task needs machine inspection, installation, actual Chrome account/session or live acceptance | ACTIVE environment; specific agent task state must be evidenced |
| **12 Harvest / Acceleration (Nine-Repo Discovery)** | Source-backed donor approaches, limitations and comparative raw findings | Development needs; feeds Integration Manager / Planning | A bounded high-return engineering shortcut needs locating, not general cloning | ON DEMAND, no assumed current ACK |
| **11 Integration Manager (Harvest integration)** | Adapt selected source into small AION-compatible staged modules, license/provenance preserved | **Development selects the seam**; feeds Development code integration | A chosen donor primitive demonstrably saves prototype time | ON DEMAND, no automatic packaging |
| **Grok Bot / BFF Linux** | Historical escape-hatch program | None for current local prototype | **Only** if owner explicitly reactivates | PARKED; do not dispatch |
| **GPM / SOFTWARE_HQ (external programs)** | Portfolio PM authority / canonical platform documentation | Cross-project evidence, not alternative AION executors | Cross-repo ownership or actual docs reuse warrants it | REFERENCE, not critical path |

## Critical dependencies, without invented ceremony

```text
OWNER outcome: working local two-way prototype (NS2)
  └─ Development + local Windows/OpenCode
       ├─ actual local repo/build + account-registration readiness
       ├─ exact-thread watch-only incoming message (I1)
       └─ single-authorized Send + observed real response (I2)
            └─ restart/unknown-effect recovery (I3 -> NS3)

NS1 introspection progresses alongside NS2; accepted independent evidence is
tracked separately. No automatic NS2 blockade due to a documentation gate.

Planning -> prioritizes source reuse -> Development chooses -> (if useful)
Nine-Repo Discovery -> Integration Manager -> Development tests & integrates.
Research supplies evidence when needed. CoS handles real cross-role dispatch.
Dashboard/Efficiency/Toolsmith contribute only when they unblock the above.
```

## Operating rule for Planning

On `SITREP` or a meaningful source change: consult this matrix + [TASKS.md](TASKS.md), owner instructions, current repo/Windows receipts and **relevant** agent comms. Note changed ownership or dependencies only; do not force acknowledgments, extra committees, duplicate systems, all-role check-ins or speculative blockers. Where instructions differ, latest explicit owner direction supersedes older role bootstrap wording; genuine safety/effect boundaries remain.

**Known uncertainty:** Toolsmith's 2026-10-21 role SITREP reports its dedicated conversation received the owner's launch and is responding. This is a **self-reported role-chat launch**, not Windows tool access or a completed operational assignment. Other folders and commits alone still do not establish live chat acknowledgment, and remote source does not prove a local Windows test.
