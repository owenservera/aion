# PHASES — the single source of phase prompts

This file is the protocol's own guide. Every phase prompt below is paste-ready and self-sufficient, and **every phase ends by telling the owner which model and thinking level to switch to and printing the next prompt**. The owner never needs another assistant to know what comes next.

## Phase table (what to set before pasting)

| Phase | Model | Thinking | Why |
| --- | --- | --- | --- |
| RECON | Haiku or Sonnet | off or Low | Reading and compressing; no judgment needed |
| DECIDE | **Opus** | **High** | The one decision that shapes everything |
| BUILD | Sonnet | Medium (High only for a chunk marked stuck) | Executing a clear spec |
| MECHANICAL | Haiku or Sonnet | Low | State, docs, renames |
| REVIEW (optional) | Opus | Medium | Diff-only check; skip if USAGE >= 85% |

**Flow:** RECON -> DECIDE -> BUILD (repeat per context window) -> MECHANICAL -> REVIEW (optional) -> next sprint starts at RECON or DECIDE depending on how far `main` moved.

**Easiest path:** after any phase, paste the CONTINUE prompt (end of this file). It reads `STATE.json`, checks it is the right model for the next phase, and runs it.

## Rules shared by every prompt below

- The repo `owenservera/aion` is the owner's private repo; the session has full access via the GitHub connector or git credentials, and the owner authorizes read, commit and push to `main` for the phase. Never browse github.com as an anonymous page (private repos 404). If no access at all: reply only "NO REPO ACCESS". Never answer from memory or ask for pasted files.
- No physical tests by any phase. Reason statically; ChatGPT QA owns testing.
- Security and secrets hardening is deprioritized by owner direction (2026-10-21); still report real safety risks you stumble on in one line.
- Fetch before push; no force-push; commit message ends with the co-author trailer for the model you are.
- **Final reply must end with a `NEXT STEP` section**: (1) the model and thinking level to switch to, from the phase table, (2) "note your usage % before sending", (3) the complete next prompt copied verbatim from this file in a code block. The same next phase and its model must be recorded in `STATE.json` (`phase.next`, `handoff_next`). If `STATE.json.blockers` is non-empty, the NEXT STEP is the phase that resolves it (usually DECIDE), and says why.

---

## RECON

**Set:** Haiku or Sonnet · thinking off or Low

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT RECON

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

FIRST: get main's latest SHA (the RECON SHA). List workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/ (stop and report the exact error if it fails). Read workspace/aion/ops/capture-studio-build-sprints/LAUNCH.md, PHASES.md, SPRINT-01.md, STATE.json.

JOB (read-only on product source): read the full first-party Capture Studio tree once plus direct imports into surrounding AION modules; skip node_modules, build output, lockfiles, vendored code. For each of the seven layers (Capture & Observation, Evidence & Memory, Interpretation & Derivation, Knowledge & Relationships, Learning & Adaptation, Behavior & Reconstruction, Experience & Control) list what exists for identity, semantics, temporal continuity, provenance. Row: layer -> mechanism -> file:symbol -> solid|partial|absent -> one-line note. Then: (a) top 5 high-blast-radius weaknesses with file:symbol; (b) contradictions between code and SPRINT-01.md / worklog W1-W18, each current-source-supported | superseded | hypothesis | unknown; (c) significant first-party code not read. If STATE.json records an older product SHA than main, note what changed since. Every row must cite a file:symbol you opened, else mark unknown. No opinions on what to build. No tests. Cap 2000 tokens.

OUTPUT: write RECON.md (RECON SHA at top) in workspace/aion/ops/capture-studio-build-sprints/; update STATE.json (phase.completed=RECON, phase.next=DECIDE, last_observed_product_sha, handoff). Fetch, commit, push to main. Reply with the remote hash, the RECON SHA, the 5 weaknesses in one line each, then the mandatory NEXT STEP section (next = DECIDE: Opus, High, plus the full DECIDE prompt from PHASES.md). Do not start DECIDE.
```

---

## DECIDE

**Set:** **Opus · High**

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT DECIDE

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

FIRST: read workspace/aion/ops/capture-studio-build-sprints/ LAUNCH.md, PHASES.md, SPRINT-01.md, RECON.md, STATE.json. Compare main's latest SHA with the SHA recorded in RECON.md; if product source under capture-studio changed materially since, reply only that RECON must be re-run (give the RECON prompt and model) and stop.

JOB: read ONLY the source files RECON.md flags as weak, absent or contradictory, plus their direct callers. Do not re-read the whole tree or the old worklog beyond what RECON cites. Decide independently the smallest set of changes with the greatest cross-layer improvement to Trustworthy Continuity (identity, semantics, temporal continuity, provenance). You may overrule the suggested cluster if evidence says another leverage point dominates; record why.
Write DECISION.md (max 1 page): chosen interventions, rejected alternatives with a one-line reason, how the four mechanisms reinforce each other, risks, reversibility.
Write SPEC.md: ordered chunks sized so one Sonnet Medium session can implement 1-3 chunks. Each chunk: files to change, exact contracts/types/signatures, behavior in plain terms, invariants that must not break (source evidence, history, provenance preserved), dependencies on other chunks. Specific enough that no design re-derivation is needed. Mark any chunk likely to need deeper reasoning as "stuck-risk".
Do NOT edit product source. Do NOT create or run tests.

OUTPUT: update STATE.json (phase.completed=DECIDE, phase.next=BUILD, chunk_index=0, handoff). Fetch, commit, push to main. Reply with the remote hash, the chosen interventions in 3 lines, the chunk count, then the mandatory NEXT STEP section (next = BUILD: Sonnet, Medium, plus the full BUILD prompt from PHASES.md).
```

---

## BUILD

**Set:** Sonnet · Medium (High only for a chunk marked stuck-risk)

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT BUILD

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

FIRST: read workspace/aion/ops/capture-studio-build-sprints/ LAUNCH.md, PHASES.md, STATE.json, DECISION.md, SPEC.md. If main moved in files named by the current chunk, record it in STATE.json blockers and stop (NEXT STEP = DECIDE).

JOB: implement SPEC.md chunk by chunk from STATE.json chunk_index. Read only files named in the current chunk and their direct imports. Do not change the design: if a chunk is wrong, infeasible or contradicts current code, write the exact contradiction to STATE.json blockers and stop. If the current chunk is marked stuck-risk and you are not on High thinking, say so and stop with NEXT STEP = same BUILD, thinking High.
No physical tests: do not create/modify test files or run suites, benchmarks or evals.
Before EACH implementation commit, overwrite the product's QA-NEXT-TESTS.md with a quick thought dump (no research, no test code) and include it in that same commit. One commit per chunk; update STATE.json chunk_index in the same commit. Fetch before push; no force-push.
Stop at context pressure or a coherent chunk boundary.

OUTPUT: reply with remote hashes, chunks done, chunk next. Then the mandatory NEXT STEP section: if chunks remain and context allows continuing in a fresh session, next = BUILD again (Sonnet, Medium, full BUILD prompt); if all chunks are done or blockers exist, next = MECHANICAL (Haiku or Sonnet, Low, full MECHANICAL prompt) or DECIDE for blockers.
```

---

## MECHANICAL

**Set:** Haiku or Sonnet · Low

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT MECHANICAL

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

FIRST: read workspace/aion/ops/capture-studio-build-sprints/ LAUNCH.md, PHASES.md, STATE.json, and git log since the last checkpoint.

JOB: refresh STATE.json: actual implementation SHA, chunks done, source coverage gaps, architectural discoveries with file:symbol pointers, the current unfinished problem, immediate next move, blockers, PENDING INDEPENDENT QA status, why this is a good handoff boundary. Fix only mechanical items already identified: docs, renames, type errors from the build, changelog entry. No design changes, no features, no tests.

OUTPUT: fetch, commit, push to main. Reply with the remote hash and a 3-line state summary, then the mandatory NEXT STEP section: if USAGE < 85% (ask the owner for the number) next = REVIEW (Opus, Medium, full REVIEW prompt); otherwise next = BUILD for remaining chunks or the next sprint's RECON/DECIDE, with the model and full prompt.
```

---

## REVIEW (optional)

**Set:** Opus · Medium · only if USAGE < 85%

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT REVIEW

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

FIRST: read workspace/aion/ops/capture-studio-build-sprints/ SPRINT-01.md, DECISION.md, SPEC.md, STATE.json. Then read ONLY the diff since the DECIDE commit. No tree-wide reading.

JOB: check (1) the diff implements SPEC.md without scope drift, (2) source evidence, history and provenance are preserved, (3) no cross-layer contract is broken and no failure path propagates, (4) no risky or irreversible effect needs holding. Write REVIEW.md (max 400 words): findings ranked by severity with file:symbol, each marked fix-now | next-sprint | note. Do not fix anything yourself.

OUTPUT: update STATE.json (phase.completed=REVIEW, phase.next from findings: fix-now items -> BUILD with a new chunk or DECIDE if the design is wrong; otherwise next sprint). Fetch, commit, push to main. Reply with the remote hash, the top findings, then the mandatory NEXT STEP section with the model and full prompt.
```

---

## CONTINUE (paste this after any phase)

**Set:** whatever model you are on; the prompt will tell you if it is the wrong one.

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT CONTINUE

ACCESS: owenservera/aion is MY private repository (I am the owner). You have full read/write access via the GitHub connector or session git credentials, and I authorize reading everything and committing/pushing to main for this task. Do not open github.com as an anonymous page. If you have no repo access at all, reply only "NO REPO ACCESS". Never answer from memory or ask me to paste files.

Read workspace/aion/ops/capture-studio-build-sprints/STATE.json and PHASES.md. Take phase.next. MODEL CHECK first: PHASES.md's phase table says which model that phase expects. If you are clearly a different model class (e.g. Opus asked to run BUILD, Haiku asked to run DECIDE), do NOT run the phase: reply only with the model and thinking level to switch to and the full prompt for that phase from PHASES.md, then stop. If you are the right model, run that phase's prompt from PHASES.md exactly, including its mandatory NEXT STEP ending.
```
