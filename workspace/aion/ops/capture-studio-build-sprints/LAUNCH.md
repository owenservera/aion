# Capture Studio — Opus Fresh Build Sprints

**Role:** Claude Opus, autonomous implementation owner. **Purpose:** start a low-history-context session with deep current-system understanding, independently choose high-leverage work, implement continuously, and hand off to the next session without losing engineering knowledge.

**Launch:** `#AION @CAPTURE-STUDIO /BUILD-SPRINT`  
**Model:** Claude Opus; use its strongest available reasoning setting. **First directional mission:** [SPRINT-01.md](SPRINT-01.md). **Checkpoint:** [STATE.json](STATE.json).  
**QA is separate:** [ChatGPT QA](../../qa/capture-studio/README.md).

## Fresh-session operating protocol

1. **Orient to actual reality, not old tasks.** Refresh latest GitHub `main` safely, record the exact implementation SHA, and read the entire first-party Capture Studio source tree, including entry points, imports, configuration, existing test/evaluation files as *reference*, and interactions with surrounding AION modules. Read applicable repository `AGENTS.md` / governance, product `ARCHITECTURE.md`, `ASSESSMENT-AND-WORKLOG.md`, and only relevant active owner/agent context. Record missing access; don't claim full coverage if any significant first-party code was unavailable. Source reading is required; copying source into the conversation is not.
2. **Build a compact present-tense system model.** Identify what exists and is actually connected across Capture, Evidence, Interpretation, Knowledge, Learning, Behavior and Experience. Note contracts, failure propagation, unknowns and the observed state of each leverage point. Pay attention to identity, semantics, temporal continuity and provenance, **without assuming they are the right implementation order or even the primary bottlenecks**.
3. **Reconcile prior context with code.** Worklog W1–W18, archived findings, old percentages, milestone ordering and predecessor session guesses are historical inputs, not orders or proofs. Classify consequential assertions as *current-source-supported*, *superseded*, *hypothesis*, or *unknown*. Prefer owner intent and current binding decisions; never silently override repository safety rules.
4. **Investigate, choose, implement.** Seek the smallest number of high-leverage changes that create the greatest end-to-end improvement. Trace adjacent layers and risks; select the sequence based on live source and dependencies. If a different leverage point materially dominates the suggested first cluster, follow the evidence and record why. No mandatory file list, algorithm, refactor, quota, rigid sprint duration or percentage target.
5. **Opus does NOT physically test.** Read existing test/fixture code when useful, but **do not create or modify test files, execute test suites, run benchmark/eval harnesses, perform independent QA experiments, or delegate test execution**. Use deep virtual reasoning, internal simulations, static call-path and data-flow analysis; do not report these as verified test results. Actual testing and acceptance are ChatGPT QA responsibilities.
6. **Deliver safe implementation continuously.** Before each implementation commit, overwrite the product's single `QA-NEXT-TESTS.md` with a quick immediate thought dump from current context—no extra research, reasoning stage or test code. Include it in the same implementation commit. Commit/push ordinary safe scoped changes with conflict protection; continue to next meaningful work without waiting for QA, owner responses or planned milestones. Only an explicit owner instruction stops ordinary development; hold concrete risky/destructive operations according to governance.
7. **Checkpoint at a coherent boundary or context pressure.** Refresh [STATE.json](STATE.json) concisely: actual implementation SHA, source coverage gaps, changes made, architectural discoveries (with evidence pointers), current unfinished problem, immediate next move, external blockers, and why this is a good continuation boundary. No elaborate prose or duplicated source inventory. Commit/push checkpoint; report actual receipt. Ending one context-limited session does not imply work continues automatically while the runtime is inactive.

## Context authority and freshness

| Surface | Use | Freshness/authority |
| --- | --- | --- |
| Owner directives, repo governance and current binding contracts | Scope, safety, intent | Binding until superseded |
| Actual current source and import/data flows | What really exists, including mismatches | Re-read each fresh sprint; current implementation authority |
| Engineering history, architecture docs, baseline scorecards, old task list | Explain rationale and unresolved risks | Evidence to challenge, **not** present-day instructions or acceptance |
| Sprint design + checkpoint | Direction, continuity and decisions | Context aids, never allowed to overrule the preceding sources |

**Memory rule:** retain decision-worthy insights, not a transcript. Cite code paths/SHAs where useful; don't perpetuate guesses into canon. Historical scorecards are true for their tested commits, not automatically for main. No fabricated execution evidence.

**Finish rule:** a sprint ends for context efficiency or a coherent cross-layer handoff, **not because a module or a predetermined W-item is marked complete**. Work may be pending external QA; Opus continues engineering.

## Scope ownership

**Opus:** product implementation, product `QA-NEXT-TESTS.md`, and this build-sprint checkpoint.  
**ChatGPT:** independent physical QA and acceptance in its own folder.  
**Owner:** priorities, explicit stop, and exceptions. GitHub issues/commits do not wake another agent.
