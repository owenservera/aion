# AION — Execute the work

**Highest-priority repository instruction for all AION agents, local OpenCode sessions, role specialists and subagents. The owner's latest instruction takes precedence over stale plans, role workflows, memory rituals and historical restrictions.**

## Working rule

**Do the smartest, fastest useful engineering action yourself, right now, using the application and tools that actually exist.** Inspect actual state, fix the next observed blocker in the canonical code, test it, run the app, observe the result, and repeat. Keep working toward the owner's requested outcome instead of producing process.

- No gratuitous agents, subagents, fixers, orchestrators, reviewers, approval ceremonies, prompts, queues, dashboards, skills, bootstrap stages, task matrices, docs, handoff packages, extra branches or check-ins. Do not delegate work you can execute. Do not wait for another agent if independent useful work remains. An actually necessary specialist or handoff is an exception, not the default.
- A `SITREP` is a brief refresh of relevant current code, runtime, Git state and actual results—not an excuse to reread all memory tiers, agent rosters, communications folders or bootstrap kits. Access extra context only if it materially helps the task.
- Run the smallest focused reproduction and regression for a defect, then the relevant full suite once the fix is ready. Do **not** make comprehensive suites, synthetic fixtures, review reports or ceremonial signoffs substitutes for a live application test.
- Use available tools and models, checking availability before dispatch. A failed/unavailable model is a routing issue: use an available route. Do not keep launching agents with a known unavailable model.
- A GitHub issue or commit never launches a local agent. Actually execute with the supported local tools; source publication does not mean an action happened on the Windows host.
- Prefer direct changes in the existing authoritative source and `main` when safe. Short-lived isolation is for real concurrent edits or risky work, not default bureaucracy. Preserve user-local changes, avoid blind merges, resets and force pushes; commit/push verified changes without seeking extra authorization.
- Report **only** what was actually changed, run, proved and still broken. Be concise. Never describe planned or dispatched work as done.

## Current product priority: real Capture Studio multi-turn

The live product is the existing Capture Studio app at `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio`. **Make three genuinely fresh, context-dependent turns work via AION's own harness and UI in the same provider-native conversation.** Start with real ChatGPT; then Claude; then Gemini. **One proven provider at a time.**

Use the full existing loop: attach → identity/readiness → AION send → observed fresh reply and stream → capture/derive → UI → persistent conversation and recovery → useful outcome/learning as applicable. When blocked, change code and rerun the failed actual journey rather than creating more plans. Do not call two separate captures or manual provider-site sends a successful AION multi-turn test.

**Known live blocker to fix, not study indefinitely:** deferred first-turn capture plus stale readiness: `src/capture/conversation-service.mjs` skips preflight when `sessionId` is absent; `src/studio/ui/chat.mjs` rejects the deferred initial send unless capture is already recording. Also confirm the real `BINDING_CHANGED` cause rather than assuming it. Then remove the genuine one-message-per-Studio-conversation restriction by implementing safe successive turns, not by bypassing the harness. The 2026-10-24 Windows test produced **zero actual provider sends**; a startup or HTTP 200 is not acceptance. See the existing Windows receipt under `workspace/aion/agents/windows-master/CAPTURE-STUDIO-FIRST-TURN-2026-10-24.md`.

## Non-negotiable operational correctness

- The owner's Windows PC is local-master. Do not damage existing sessions, private data, processes, Git changes or browser tabs. Reuse a **verified existing backup**; make a backup/restore check when a real data risk exists, not for every harmless edit.
- Use the **existing single browser-effect owner**. No Playwright or Puppeteer; no second browser controller. Use only owner-authorized provider sessions and innocuous bounded test prompts. Never bypass account access controls.
- Do not blindly resend an uncertain browser effect. Inspect the original journal and reconcile first. Preserve exact thread/account binding, idempotency, source provenance and freshness.
- Keep credentials, cookies, private raw captures and private transcripts outside GitHub. Do not invent acceptance from mocks, page text, old replies, unsupported native IDs or tests that never ran.
- GitHub `main` is the shared integration record; the owner's local machine is authoritative for live execution. A remote edit does not prove the machine is updated.

**Do the work. Do not add work about the work.**
