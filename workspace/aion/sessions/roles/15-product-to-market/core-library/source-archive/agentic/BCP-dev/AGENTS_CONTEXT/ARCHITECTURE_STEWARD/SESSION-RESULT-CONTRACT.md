# Session Result Contract

> Version: 1.2
> Date: 2026-09-28
> Status: ACTIVE
> Authority: process contract only; not Ω law or semantic authority.
> Amendment: additive-only M1 extension over v1.1. All v1.1 receipts remain
>   valid without rewrite; every M1 key below is OPTIONAL. Absent M1 keys mean
>   pre-M1/unspecified, never failed. Lineage: CFA-02 data specification
>   (`SUBAGENTS/DATA-MODEL-STEWARD/RESULTS/CFA02-M0M1-DATA-20260928.md`), CFA-09
>   compat envelope (`SUBAGENTS/EVOLUTION-COMPATIBILITY-SELF-MAINTENANCE/RESULTS/CFA09-M0M1-EVOLUTION-20260928.md`),
>   CFA-04 authority preconditions (`SUBAGENTS/AUTHORITY-GOVERNANCE/RESULTS/CFA04-M0M1-AUTHORITY-20260928.md`),
>   CFA-10 enforcement ledger (`SUBAGENTS/RUNTIME-CONSTITUTION-CORE-SUBSTRATE/RESULTS/CFA10-M0M1-RUNTIME-20260928.md`).

## Purpose

Every substantive ChatGPT agent session must leave a durable, machine-discoverable completion receipt in its own agent home before it is allowed to stop.

This makes the repository the durable result bus between independent ChatGPT sessions and the Architecture Steward.

## Mandatory location

Create:

`<AGENT-HOME>/RESULTS/<SESSION_ID>.md`

The `RESULTS/` directory may be created by the session when first needed.

## Required contents

```text
SESSION_STATUS:
SESSION_ID:
CFA / AGENT:
IDENTITY:
AGENT_ID:
TARGET_REF:
BASE_MAIN_SHA:
TASK:
EXECUTION_STRATEGY:
STRATEGY_RATIONALE:
RESULT:
FILES_CHANGED:
COMMIT_SHA:
PREDECESSOR_VERIFIED:
OWNER_ALIGNMENT:
LESSONS_UPDATED:
COMMONS:
UNRESOLVED:
BLOCKERS:
BOUNDARIES_ACTIVATED:
OMEGA_LAW_CHANGED:
IMPLEMENTATION_STARTED:
NEXT_REQUIRED_STEP:
```

Use the same factual result reported in chat. Do not invent identifiers or claim completion before repository verification.

## M1 optional execution-proof metadata (v1.2, additive)

MODE = DELIBERATE | EXECUTION. SURFACE = LOCAL | CHATGPT-WEBAPP |
OTHER-GOVERNED-SURFACE. A surface does not own a mode. DELIBERATE receipts may
legitimately close INVESTIGATED or FALSIFIED with no implementation evidence.
EXECUTION receipts claiming IMPLEMENTED require implementation evidence.

The following keys are OPTIONAL metadata on the existing receipt. Key spelling
follows v1.1 `UPPER_SNAKE` style. Values are citations/identifiers carried
opaquely; their meaning is owned by the Steward envelope (mode, work/attempt),
CFA-08 (surface), CFA-05 (work lifecycle), and Commons (handoff/session).

```text
MODE:
SURFACE:
WORK_ID:
goal_id:
attempt_id:
REQUESTED_AGENT:
ALLOWED_PATHS:
REQUIRED_TESTS:
TEST_RESULTS:
```

Permitted aliases/views only (MUST equal their canonical source; a mismatch is
a validation failure, not a second opinion):

- `RESOLVED_AGENT` ≡ the `CFA / AGENT` + `AGENT_ID` + `IDENTITY` triple.
- `ACTUAL_CHANGED_PATHS` ≡ `FILES_CHANGED`.
- `handoff_id` ≡ pointer into `COMMONS`.

The following MUST NOT be receipt-authored canonical data:

- `ENFORCEMENT_LEVEL` — enforcement capability is CFA-04/CFA-10 runtime
  semantics. A receipt asserting it would turn a durable citation into a live
  permission decision. A validator may *emit* it as a derived view; the receipt
  must not *assert* it.
- standalone `commands` log — fold into `REQUIRED_TESTS`/evidence references.
- `RESULT_CLASS` closed enum — DEFERRED. `RESULT` free text + `SESSION_STATUS`
  carry verdicts until a Steward amendment adopts an enum.

EXECUTION-only keys (`REQUESTED_AGENT`, `ALLOWED_PATHS`, `REQUIRED_TESTS`,
`TEST_RESULTS`) are absent, not empty, on DELIBERATE receipts. Validators must
not demand them unless an IMPLEMENTED claim is made. A surface switch
(LOCAL ⇄ CHATGPT-WEBAPP) writes one continuing receipt chain (same `WORK_ID` /
`goal_id`, new `SESSION_ID` / `attempt_id` / source SHA) — never a forked task.

## M1 per-class evidence rule (summary; CFA-09 envelope authoritative)

Validator checks C1–C9: (C1) receipt structurally valid · (C2)
requested_agent == resolved_agent when explicitly requested · (C3) source SHA
valid · (C4) referenced commit exists when implementation claimed · (C5) actual
changed paths ⊆ allowed paths when an envelope applies · (C6) required tests
present and successful for IMPLEMENTED · (C7) required STATE update
present/current · (C8) final delivery ref contains the receipt · (C9) claimed
completion class matches the evidence. A failure must be explicit; never
silently downgrade failures to warnings.

| Completion class | v1.2 fields | Checks |
|---|---|---|
| INVESTIGATED / FALSIFIED | OPTIONAL (MODE/SURFACE recommended) | C1 + C8 |
| IMPLEMENTED with MODE=EXECUTION | REQUIRED — full execution-proof set | ALL of C1–C9 |
| IMPLEMENTED with MODE=DELIBERATE (bounded repo work) | OPTIONAL, RECOMMENDED | v1.1 checks only |
| BLOCKED / PARTIAL | OPTIONAL — REQUIRED only if EXECUTION was attempted | C1 + C8 |
| SUPERSEDED / PARKED | OPTIONAL | C1 + C8 |
| REPORTED-UNVERIFIED | N/A — validator verdict, not a claimable class | Must not advance any downstream gate |

Mechanical reference: `tools/Validate-Receipt.ps1` (procedural gate with
fail-closed semantics; exact-agent and allowlist checks are PROCEDURAL per the
CFA-10 ledger until a name-scoped permission mechanism is verified and wired —
never described as unbypassable enforcement). Prompt-only checking is never
labeled enforcement.

## Completion rule

A substantive task is not `DONE` until all of these exist:

1. required durable changes, if any;
2. an exact commit/ref that contains those changes;
3. the local `RESULTS/<SESSION_ID>.md` receipt;
4. the persistent `TASKS.md` entry updated to `DONE` (or `BLOCKED` / `SUPERSEDED` when justified).

The receipt is evidence of what the session concluded; it is not semantic authority. The Architecture Steward independently verifies it against the repository.

For the mandatory final verification and the distinction between DONE, PARTIAL, BLOCKED, and REPORTED-UNVERIFIED, also follow AGENTS_CONTEXT/ARCHITECTURE_STEWARD/DURABLE-COMPLETION-GATE-2026-09-28.md.

## Commons convergence and repository attribution

The intended convergence is: a session completion receipt corresponds to a Commons `HANDOFF` that has reached `REPORTED`, while `<AGENT-HOME>/RESULTS/<SESSION_ID>.md` is the durable repository projection/compatibility surface that preserves the handoff lineage. Until Commons is the operational transport, the repository receipt remains the live completion surface.

`COMMIT_SHA` establishes repository lineage only. It does not establish agent identity, semantic authority, or truth. Unless cryptographic agent attribution is separately verified, treat repository artifact authorship as an unattributed claim and verify it against repository evidence. Signed commit or equivalent attribution is a future hardening path, not current proof.


## Final verification gate

Before the final chat report, the agent MUST re-read the current delivery ref (normally main) and verify that both the canonical receipt and the updated TASKS.md state are present there. A write response, local file, or branch-only result is not enough.

If the final verification cannot be performed, report PARTIAL, BLOCKED, or REPORTED-UNVERIFIED; never DONE / COMPLETE.

## No chat-only completion

A final ChatGPT message is not the durable result. Returning the report in chat is required for human visibility, but it never substitutes for the repository receipt.

## Failure handling

If the session cannot persist the receipt because repository write capability is unavailable, it must report the task as `BLOCKED` or `PARTIAL` rather than silently stopping as complete.

## History

Do not overwrite prior session receipts. Use a new `<SESSION_ID>.md` file for every substantive session.


## Changelog

- 1.2 — 2026-09-28: additive M1 extension (optional MODE/SURFACE/WORK_ID/goal_id/attempt_id/REQUESTED_AGENT/ALLOWED_PATHS/REQUIRED_TESTS/TEST_RESULTS metadata; alias discipline; ENFORCEMENT_LEVEL + commands rejections; per-class C1–C9 rule; validator reference). v1.1 receipts valid without rewrite. Corridor: M0M1-CORRIDOR-01.
- 1.1 — 2026-09-27: expanded and normalized the canonical receipt schema with IDENTITY, AGENT_ID, EXECUTION_STRATEGY, and STRATEGY_RATIONALE, and removed the duplicate/non-canonical CORE_AGENT field.
- 2026-09-28 clarification — durable completion now requires final re-read of the delivery ref; chat-only completion is classified as REPORTED-UNVERIFIED until receipt + task-state closure are verified.
