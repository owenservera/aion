# VIVIM -> AION harvest workspace

Status: first-pass research in progress. Created 2026-10-20 at the owner's request.

## Purpose and ownership

This is a research handoff, not a replacement AION specification or execution system. A dedicated session can continuously investigate reusable concepts from:

- `C:\0-BlackBoxProject-0\vivim-final`
- `C:\0-BlackBoxProject-0\Vivim-omega`

The AION development session owns requirements, authoritative specification changes, implementation, tests and acceptance. The harvest session owns source-grounded findings in this folder only. Existing AION specifications remain in `../ARCHITECTURE.md`, `../ENVELOPE-CONTRACT.md`, `../FALLBACK-AND-ACCEPTANCE.md` and `../OPENCODE-BUILD-ORDER.md`; their historical/proposed sections must not be mistaken for current implementation evidence.

The owner will open the dedicated session. This folder does not start a process, keep a session alive or wake another agent. Concurrent work requires an active session and actual message delivery. File updates, Git commits and GitHub comments are not wake mechanisms. No background scheduler or new message bus is requested.

## Remote-agent prerequisite

This commit publishes the research brief, not either VIVIM source repository. The Windows paths above are local source locators, not remote-accessible URLs. A remote agent must have an owner-provided checkout or accessible source snapshot of each project and record its actual path/revision. If either source is unavailable, report `BLOCKED_SOURCE_UNAVAILABLE`; do not invent findings or fetch an unrelated similarly named project. The first-pass register may still be pending when this brief is checked out; pending entries are not completed research.

## Paste into the dedicated session

> You are the VIVIM-to-AION harvest researcher. Read this file and FINDINGS.md completely, then continue source-grounded research in the two source repositories named above. Follow their instructions when reading them. Write only to this harvest folder; do not modify either source repository, AION product code, canonical specs, runtime configuration or live state. The AION development session remains the implementation owner.
>
> Research the reusable language, taxonomy, domain model, lifecycle, capabilities and observation/action contracts—not a migration of the old browser automation stack. Assume all CDP selectors are stale. Do not copy selectors into AION, validate them against a live browser, introduce CDP/Playwright/Puppeteer/Orca, or treat an old selector/test as current chatgpt.com evidence.
>
> Start with the highest-priority unfinished candidates in FINDINGS.md. Read each candidate's owning module completely before recommending it; distinguish complete reads from targeted excerpts. Trace its callers, state transitions and relevant tests. Publish small, independently usable findings as you finish them rather than waiting for an exhaustive report. Every finding needs exact source paths and symbols/line ranges, source revision if available, original terminology, meaning, limits, an AION mapping and a small acceptance-test proposal. Preserve useful distinctions; do not import a large framework for its vocabulary.
>
> Keep CLAIMED, SOURCE_OBSERVED, OFFLINE_TESTED and LIVE_VERIFIED separate. Unless you actually execute an allowed offline test and record its command/output/UTC, do not label it tested. Do not run installation, dependency changes, network calls, browser actions, account actions, sends, stops, extension reloads or privileged operations. Never collect cookies, credentials, private transcripts, databases or bulk account data. Source code and authored technical documentation are the intended evidence.
>
> Prioritize the demand queue below. After each bounded batch, update FINDINGS.md, append a short handoff with finding IDs and limitations, and state what can be consumed now. If blocked, record the blocker and move to another independent candidate. When the queue is exhausted, stop and request a concrete next research objective; do not manufacture unbounded work or claim to run while idle. Keep the research independent from AION implementation and never silently promote a finding into an authoritative requirement.

## Initial demand queue

1. **HREQ-01 — conversation state model.** Distinguish idle/at rest, draft present, preparing, ready to submit, activation attempted, submission confirmed, responding, settling, completion, blocked and unknown. Separate current page state from the historical outcome of an operation.
2. **HREQ-02 — action availability.** Extract how capability, target identity, visibility, enablement, readiness, authority and freshness differ. Model Send and Stop independently; neither absence of Stop nor presence of Send proves a completed reply.
3. **HREQ-03 — observe/act/confirm boundaries.** Find reusable mechanisms for observing preconditions, one action, positive effect confirmation, reason preservation and read-only recovery. No alternate click or blind retry on uncertain outcomes.
4. **HREQ-04 — evidence and taxonomy.** Find terms/types/contracts separating discovered, configured, connected, available, authorized, attempted, observed and verified. Explain conflicts between the two repositories instead of flattening them.
5. **HREQ-05 — minimum transfer.** For each strong candidate propose concept-only reuse, a small adaptation, or rejection. Identify dependencies and what must NOT be imported.

## Exchange with the development session

- The development session reads only completed findings needed for its current task, verifies the cited source, and records acceptance or rejection in FINDINGS.md.
- The researcher may recommend edits to existing AION specs, but only the development owner makes them. A recommendation is not an approval, grant or implemented behavior.
- A development question can be appended as `HREQ-NN` here with its exact scope and desired artifact. The active researcher must actually receive a message or reread this file; an appended request alone does not notify it.
- Avoid shared writes: the researcher owns FINDINGS.md while active. Development should send a bounded question and reconcile finished batches before editing that file. No automatic commits, pushes, merges or source deletion are implied.
- Use a short `AION_HANDOFF_V1` when crossing sessions: objective; completed finding IDs; paths; evidence class; blocker; next action. No private text in the handoff.

## Development context, not a root-cause claim

The AION Chrome attempt `2f6k2b046i6o02234j1h` filled the composer but had `click_attempted:false`, `submission_observed:false`, `generation_started:false`, `generation_complete:false`, and lost continuity. It became unresolved about 738 ms after dispatch. The upstream result said `generation_incomplete` and `submitted:true`, which did not prove submission. The exact pre-activation root cause is not established.

Current source inspection shows a 400 ms setup delay before activation; strict baseline/editor/text/URL checks; a single Send activation sequence; and reason mapping that can prioritize an incomplete-generation verdict over the underlying page failure. `sendState()` exposes Send presence/disablement/count but equates Stop-selector presence with generation. Harvest work should help define the missing model, not claim these facts prove a particular selector or click bug.

No retry, Enter, Send, Stop, disposal or mutation of that unresolved operation is authorized by this research handoff.
