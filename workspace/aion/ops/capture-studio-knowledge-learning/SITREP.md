# Knowledge & Learning — Fresh-session SITREP

**One-line command:** `#AION @KNOWLEDGE-LEARNING +/SITREP`

Load role, active work, evidence and code: repository `AGENTS.md`, this worker's README, QUEUE, ACCEPTANCE, STATE, latest Core sprint and continuous queue, UI contract changes, Systems assessment, QA roadmap, relevant shared agent-to-agent task communication surfaces, and source in `src/intel`, `src/replay/derive.mjs`, `src/store/session.mjs`. Check newest main and any concurrent Core ownership collisions.

Report compactly: **shipped + commit receipts | current L4/L5 acceptance evidence | top 3 next tasks | dependency/blocker | proposed next move**. Clearly separate observed source, executed tests, and hypotheses. On `!/CAPTURE STUDIO BOOTSTRAP`, start highest-priority unblocked implementation item after SITREP. **High effort** for build/recon; **Medium** for routine SITREP.

## Expanded `+/SITREP` bootstrap checks

- Refresh the default-branch SHA **at the end**, not only the beginning, because Core/UI are actively publishing. Cite a pinned source SHA for every source-status claim; explain anything that changed during the scan.
- Read the shared agent communications living operating model, relevant coordination notes and active team intelligence index. Do not mistake a GitHub note for an autonomous wakeup or execution order.
- Check the specialist's own memory/skills needs against the shared Master Skills Builder; create reusable skills or durable memory only for evidenced repeated needs, not generic scaffolding. The thirteen-core-agent roster does not itself imply this additional specialist has an established intelligence home.
- Reconcile the specialist L4/L5 queue against Core's latest implementation commits before claiming a task. Prefer L5 `learn.mjs` and specialist test work while Core edits shared L4/derive/server seams; send Core API/CLI changes as a concise proposed contract.
- Read implementation and tests separately from runtime receipts. Preserve criterion-level `implemented / locally_tested / independently_verified` separation; untouched QA acceptance counts remain zero until actual signed-off receipts.
- For metrics, apply the existing QA reporting standard; label GitHub-fetched module line counts as a bounded static subset, **not** a product-wide canonical checkout measurement.
- On `+/SITREP`, fill missing bootstrap/queue/state bookkeeping only when it materially improves the next execution. **Do not launch the product build** without an implementation command. A fresh SITREP leaves no background process running.


## 2026-10-22 — Internal rebaseline starting prompt (read-only)

**Paste in this agent's dedicated conversation (recommended ChatGPT thinking effort: High):**

```text
#AION @KNOWLEDGE-LEARNING ∆/SITREP — CAPTURE STUDIO REBASELINE
Read the 2026-10-22 rebaseline section of your current role file and carry it out internally. Produce a source-grounded delta SITREP. Do not launch a build or perform live actions.
```

**Shared rebaseline rules (read-only):** Re-read applicable root `AGENTS.md` and current governance; fetch newest `main` SHA and branch list at start and finish; compare against your own last checkpoint. Check source code, entry points, APIs, tests/receipts and relevant AION agent-to-agent task/communication notes. Read `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/DESIGN-live-drive-studio.md` in full, especially its **later unified-conversation revision and reconciled decisions**, which supersede earlier one-shot-only assumptions. Treat designs as proposals, not shipped features; source and local execution receipts separately. Distinguish **implemented / source-observed / locally demonstrated / independently accepted / proposed / obsolete / blocked**. Inventory source files and physical LOC by layer using `workspace/aion/qa/capture-studio/REPORTING-METRICS.md` and its counter when a checkout is available; otherwise explicitly mark LOC unavailable and avoid estimating it from bytes. Never expose credentials, cookies, private prompts or raw captured transcripts in shared records. **No product edits, test execution, browser actions, live sends, agent wakeups or execution of queues during this rebaseline.** Final answer: short human-readable status table with 🟦/🟪/🟩/🟧/🟥 owner distinctions, delivered vs proposed, top three nonduplicate next actions, dependencies, source SHA and measured/unmeasured metrics.

**Lane-specific assignment:** Reconcile `STATE.json`, `EVIDENCE-SPRINT-01.md`, 14 L4/L5 acceptance criteria, latest `src/intel/{learn,learner-journal,identity,graph,continuity,priors,schema}.mjs` and derived evidence path against the **new live-drive/campaign/conversation lifecycle**. Focus on the boundary between **captured, verified, accepted and learning-eligible** data: campaign word matches do not independently authorize training; rejected, incomplete, corrupt or unverified captures must not silently update priors, entity memory, schema families or learner models. Trace versioned correction lineage, replay/rederive revision pinning, privacy/tenant scoping and which gates are proposed vs implemented. Explain how L4/L5 will consume accepted conversational evidence while Core is paused and what integration hooks must wait for Core. Report per-criterion implemented/tested/QA accepted as separate states; do not self-upgrade 0/7 to accepted. Return next specialist-owned, nonoverlapping tasks; **do not start another L5 build or edit source during this rebaseline**.
