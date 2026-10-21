# PHASES — launch prompts, model and thinking per phase

Copy the block for the phase you are running into a fresh session. Set the model and thinking level shown **before** sending. Append `USAGE=NN%` to the first line when you want the budget gates in [LAUNCH.md](LAUNCH.md) applied.

Order for Sprint 1: RECON → DECIDE → BUILD (repeat per session) → MECHANICAL → REVIEW (optional).

---

## Phase 0 — RECON

**Set:** Haiku or Sonnet · thinking off or Low · fresh session

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT RECON
Read LAUNCH.md and SPRINT-01.md in workspace/aion/ops/capture-studio-build-sprints/. Read-only on product source.
Refresh main, record the exact SHA. Read the full first-party Capture Studio source tree once.
For each of the seven layers (Capture, Evidence, Interpretation, Knowledge, Learning, Behavior, Experience) list what currently exists for: identity, semantics, temporal continuity, provenance.
Row format: layer → mechanism → file:symbol → status (solid | partial | absent) → one-line note.
Add: (a) top 5 high-blast-radius weaknesses with file:symbol, (b) contradictions between code and SPRINT-01.md / worklog W1-W18, classified current-source-supported | superseded | hypothesis | unknown, (c) any significant first-party code you could not read.
Hard cap 2000 tokens. No opinions on what to build; that is DECIDE's job.
Write to workspace/aion/ops/capture-studio-build-sprints/RECON.md. Update STATE.json (phase.completed=RECON, phase.next=DECIDE, record SHA). Commit, push, report the remote hash. Stop.
```

---

## Phase 1 — DECIDE

**Set:** **Opus · High** · fresh session

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT DECIDE
Read LAUNCH.md, SPRINT-01.md, RECON.md, STATE.json. Check main's SHA against RECON.md; if product source changed materially since, say so and stop (RECON must refresh).
Read ONLY the source files RECON.md flags as weak, absent, or contradictory, plus their direct callers. Do not re-read the whole tree. Do not read the old worklog beyond what RECON cites.
Decide independently: the smallest set of changes with the greatest cross-layer improvement to Trustworthy Continuity (identity, semantics, temporal continuity, provenance). You may overrule the suggested cluster if the evidence says another leverage point dominates; record why.
Write DECISION.md (≤1 page): chosen interventions, rejected alternatives with one-line reason, how the four mechanisms reinforce each other, risks, reversibility.
Write SPEC.md: ordered chunks. Each chunk = files to change, exact contracts/types/signatures, behavior in plain terms, invariants that must not break (source evidence, history and provenance preserved), and the order dependencies. Specific enough that a Sonnet Medium session can implement it without re-deriving the design.
Do NOT edit product source. Do NOT create or run tests.
Update STATE.json (phase.completed=DECIDE, phase.next=BUILD, chunk index 0). Commit, push, report the remote hash. Stop.
```

---

## Phase 2 — BUILD

**Set:** Sonnet · thinking Medium (switch to High only for a chunk marked stuck) · fresh session per context window

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT BUILD
Read LAUNCH.md, STATE.json, DECISION.md, SPEC.md. Verify main's SHA matches STATE.json (or only moved in files unrelated to SPEC.md); if the spec's target files changed, stop and record it in STATE.json blockers.
Implement SPEC.md chunk by chunk starting at STATE.json chunk index. Read only files named in the current chunk and their direct imports.
Do not change the design. If a chunk is wrong, infeasible, or contradicts current code, write the exact contradiction into STATE.json blockers, stop, and say it needs a DECIDE re-run.
No physical tests: do not create/modify test files or run suites, benchmarks, or evals.
Before EACH implementation commit: overwrite QA-NEXT-TESTS.md with a quick thought dump (no research, no test code) and include it in that same commit. Fetch before push; no force-push. One commit per chunk; update STATE.json chunk index in the same commit.
Stop at context pressure or a coherent chunk boundary. Report remote hashes and which chunk is next.
```

---

## Phase 3 — MECHANICAL

**Set:** Haiku or Sonnet · thinking Low · fresh session

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT MECHANICAL
Read LAUNCH.md and STATE.json only, plus `git log` since the last checkpoint.
Refresh STATE.json: actual implementation SHA, chunks done, source coverage gaps, architectural discoveries with file:symbol pointers, the current unfinished problem, immediate next move, blockers, PENDING INDEPENDENT QA status, and why this is a good handoff boundary.
Fix only mechanical items already identified: docs, renames, type errors from the build, changelog entry. No design changes, no new features, no tests.
Commit, push, report the remote hash. Stop.
```

---

## Phase 4 — REVIEW (optional)

**Set:** Opus · Medium · fresh session · run only if USAGE < 85

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT REVIEW
Read SPRINT-01.md, DECISION.md, SPEC.md, STATE.json, then ONLY the diff since the DECIDE commit (git diff <decide-sha>..HEAD). No tree-wide reading.
Check: (1) does the diff implement SPEC.md without scope drift, (2) are source evidence, history and provenance preserved, (3) any cross-layer contract broken or a failure path that propagates, (4) any risky or irreversible effect to hold.
Write REVIEW.md (≤400 words): findings ranked by severity with file:symbol, each marked fix-now | next-sprint | note. Do not fix them yourself.
Update STATE.json (phase.completed=REVIEW, phase.next from findings). Commit, push, report the remote hash. Stop.
```
