# Capture Studio — Phased Build Sprints (credit-aware)

**Purpose:** advance Capture Studio autonomously while spending expensive reasoning only where it changes the outcome. Each fresh session has ONE phase role, reads current source, does that phase, commits, and stops.

**Launch:** `#AION @CAPTURE-STUDIO /BUILD-SPRINT <PHASE>` where `<PHASE>` is `RECON`, `DECIDE`, `BUILD`, `MECHANICAL`, `REVIEW` or `CONTINUE`. `CONTINUE` reads [STATE.json](STATE.json) `phase.next`, checks the model is right for it (otherwise says which to switch to), and runs it.
**Prompts per phase, model and thinking level, and the CONTINUE prompt:** [PHASES.md](PHASES.md). Every phase ends with a NEXT STEP section naming the model/thinking to switch to and the next prompt, so no outside guide is needed. **Mission:** [SPRINT-01.md](SPRINT-01.md). **Checkpoint:** [STATE.json](STATE.json).
**QA is separate:** [ChatGPT QA](../../qa/capture-studio/README.md).

## Phase map (the human flips model/thinking manually)

| Phase | Model / thinking | Job | Output | Stop when |
| --- | --- | --- | --- | --- |
| RECON | Haiku or Sonnet, off/low | Map seven layers to files; status of identity, semantics, time, provenance | `RECON.md` (≤2k tokens) | committed |
| DECIDE | **Opus, High** | Choose first improvements and how the four mechanisms reinforce; write file-level spec | `DECISION.md`, `SPEC.md` | committed. **Does not implement** |
| BUILD | Sonnet, Medium (High only when stuck) | Execute SPEC.md in chunks, one commit per chunk | commits + `QA-NEXT-TESTS.md` | context limit or coherent boundary |
| MECHANICAL | Haiku or Sonnet, Low | STATE.json, docs, renames, type fixes, changelog | checkpoint commit | committed |
| REVIEW (optional) | Opus, Medium, diff only | Check diff vs mission and boundaries | `REVIEW.md` (short) | budget gate allows |

## Operating rules (all phases)

1. **Current code outranks history.** Refresh `main`, record the exact SHA. Worklog W1–W18, scorecards and old percentages are evidence to challenge, not orders. Classify consequential claims as *current-source-supported*, *superseded*, *hypothesis* or *unknown*.
2. **Read narrowly.** RECON reads the full first-party tree once and compresses it. Later phases read `RECON.md` plus only the files it or `SPEC.md` flags. Do not re-read the whole tree in DECIDE, BUILD or REVIEW unless a flagged file contradicts the digest.
3. **No physical tests by any phase.** Do not create or modify test files, run suites, benchmarks or eval harnesses. Reason statically; never report reasoning as verified results. ChatGPT QA owns testing and acceptance.
4. **Opus decides and specifies; Sonnet implements.** DECIDE never edits product source. BUILD never changes the decision; if SPEC.md is wrong or blocked, record it in STATE.json `blockers` and stop rather than improvising a new direction.
5. **BUILD commit rule.** Before each implementation commit, overwrite the product's single `QA-NEXT-TESTS.md` with a quick thought dump (no extra research, no test code) and include it in that commit. Commit and push ordinary safe scoped changes with conflict checks (see root `AGENTS.md`: standing commit/push authorization; fetch before push; no force-push).
6. **Hold risky operations.** Destructive, irreversible or uncertain-effect changes are paused and explained per root governance. Real safety risks are handled immediately regardless of phase.
7. **Every phase ends with a STATE.json update and a NEXT STEP handoff** (model, thinking, next prompt, `handoff_next` in STATE.json). Every phase also (set `phase.completed`, `phase.next`, SHA, blockers, one-line handoff) committed in that phase's final commit. Report the actual remote commit hash, not an assumption.
8. **Git attribution.** Commit messages end with the standard co-author trailer for the model that wrote them.

## Budget gates (owner applies; agent honors when told the % in the launch line)

Launch lines may carry `USAGE=NN%`. Behavior:

| USAGE | Behavior |
| --- | --- |
| < 85 | normal phase work |
| 85–89 | skip REVIEW; finish current chunk only |
| 90–94 | BUILD drops to Low thinking; finish current chunk, then MECHANICAL checkpoint |
| ≥ 95 | write only the STATE.json checkpoint, then stop |

Never spend Opus on file exploration, formatting, commit messages or re-reading historical research.

## Context authority

| Surface | Use | Authority |
| --- | --- | --- |
| Owner directives, repo governance, binding contracts | Scope, safety, intent | Binding until superseded |
| Actual current source and data flows | What really exists | Re-read per RECON; implementation authority |
| `RECON.md`, `DECISION.md`, `SPEC.md` | Compressed present-tense model and chosen direction | Valid only for the SHA they record; if `main` moved materially, refresh RECON first |
| Worklog, architecture docs, scorecards | Rationale and unresolved risks | Evidence to challenge, not instructions |

**Memory rule:** retain decision-worthy insights, not transcripts. Cite file:symbol and SHAs. No fabricated execution evidence.

## Scope ownership

**RECON/DECIDE/BUILD/MECHANICAL/REVIEW agents:** only files in this folder plus, for BUILD, product source and `QA-NEXT-TESTS.md` as SPEC.md directs.
**ChatGPT:** independent QA and acceptance in its own folder.
**Owner:** priorities, model/thinking switches, explicit stop. GitHub commits do not wake another agent.
