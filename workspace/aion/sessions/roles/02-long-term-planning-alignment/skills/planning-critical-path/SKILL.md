---
name: planning-critical-path
description: Extract AION Planning's canonical critical path and integrity-check task IDs, evidence references and status labels without mistaking GitHub source for Windows/live proof. Use on Planning SITREP, priority/owner changes or before a milestone claim.
---

# Planning Critical Path

## Trigger and boundary
Use when asked "what actually matters now?", when a Development/Windows receipt changes a blocker, or during a scoped Planning SITREP. **Do not** use for Development test acceptance, operational worker dispatch, GPM portfolio tracking, or a replacement AION task registry.

## Execute (read only)
1. Read repository root `AGENTS.md`, Planning's `memory/Immediate/README.md`, `TASKS.md`, `AGENT-MATRIX.md`, shared agent intelligence and relevant recent Development/Windows communications.
2. From AION repository root run `node workspace/aion/sessions/roles/02-long-term-planning-alignment/skills/planning-critical-path/scripts/critical-path.mjs --check`. Use `--json` for an exact machine-readable summary. When working in another harness/CWD, supply `--file <absolute-path-to-TASKS.md>` or invoke the script by its absolute path.
3. Inspect any integrity warnings before editing TASKS. The helper validates format and **local source-link existence only**, not the truth of linked claims; HTTP URLs are reported, not fetched.
4. Compare the source/installed/live/independently-accepted evidence ladder against actual latest Development and Windows receipts. Explicitly separate P05 (loaded build), P01 (registration), P02 (exact I1 receive), P03 (I2 exchange), P04 (parallel independent NS1), P06 (later I3). This order is **current context**, not a hardcoded script policy.
5. Return the smallest decision-relevant result: changed priority or blocker, responsible agent, evidence URL/receipt and next observable test. Update **existing** TASKS/MATRIX/SITREP and Immediate memory only if material. Never fabricate dispatch or milestone proof.

## Test and recover
Run `node --test workspace/aion/sessions/roles/02-long-term-planning-alignment/skills/planning-critical-path/scripts/critical-path.test.mjs`. Tests use temporary synthetic fixtures and no network, credentials or product effects. If TASKS layout changes, fix the parser + tests rather than guessing. A passing parser is not an I1/I2 acceptance receipt.

## Tools and reuse
Requires Node.js with ESM support, filesystem read permission and repo files. No dependencies, no Git modification, no browser or provider automation. For acceptance/proof use Toolsmith's `verification-proof` skill; for research credibility use Research's evidence-assessment capability. OpenCode V2 skill source configuration may advertise this definition; ZCode import and live Windows execution require independent verification.
