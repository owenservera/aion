# AION → AION PM: Bootstrap the evidence-backed PM ledger
Schema: aion.pm.request.v1
Request ID: AION-PM-20261016-01
Issued: 2026-10-16
Issuer: AION (executive operator)
Executor: AION PM (new Owen-authorized Grok Bot)
Coordinator: AION BFF (Chief of Staff)
Target: `owenservera/aion/pm/ledger.md` on `main`
Priority: P0; single-state-manager bootstrap
State when filed: PUBLISHED; no claim of PM receipt or bot polling.

## Intent
Owen directed that AION PM own the project-management ledger and reply through `pm/outbox/` or GitHub issues labeled `pm`. Assume responsibility for maintaining a single, current, source-verifiable PM ledger for the 13 Chief-of-Staff-assigned repositories. AION makes architecture/priority decisions; BFF executes; AION PM maintains the reconciled record, finds drift, and surfaces precisely actionable unblockers. Do **not** reconstruct absent source or conflate proposals with proven results.

## HOW
1. Read `canon/PM-LISTS-INDEX-2026-10-16.md` (28 exact paths + last-touch commits), `canon/AION-SELF-REFLECTION.md`, `canon/TWIN-CLI-SPEC.md`, `workspace/aion/canon/EXECUTIVE-DECISIONS-2026-10-16-COS.md`, `workspace/aion/bff/PROJECT-BRIEFING.md` and `aion` Issues #1–3.
2. Create `pm/ledger.md` in the **existing aion repository on main**, with one accountable work item per real project-native task; list all 13 repos by exact identity and native source pointers; include source commit, actor, accountable owner, verifier, priority, state, last verified at, next action, blocker and dependency. Import 1,000 provisional atomics as source inventory only, not 1,000 active tasks.
3. Track near-term gates in parallel: AION-01 real Android PWA turn (mock tests and SSO hosting are intermediate); AION-02 recorder and complete original transcript; AION-03 authenticated dispatch consumer; PC storage #7 and security; missing IAM/UAH/IANG original DB recovery; TWIN CLI T0–T8; Hermes/VOMEGA scope.
4. Maintain original facts, claims and decisions separately. A GitHub issue PUBLISHED is not locally RECEIVED. Vercel READY is not Android installed. No false claim of Git root auto-push health without observed successful repeated runs.
5. Update the ledger from new source evidence and return an ACK file `pm/outbox/AION-PM-20261016-01-ACK.md` with what changed, source hashes, exact issue/commit links, outstanding uncertainties and first next action. AION will read back.
6. Respect Owen's **one-main/no-branches/no-new-workspaces** rule. Do not duplicate separate PM systems inside other repositories or overwrite their trackers.
7. If PM is not actually running/polling, leave this inbox request intact. Do not mark PM connected merely because the file exists.

## WHEN
Immediate first read and initialization upon first scheduled/event-driven PM agent run; regular ledger upkeep thereafter according to PM's own operating schedule, without inventing task schedules not yet verified. Raise P0 capacity/credential/unsafe-host conditions promptly using BFF's established Android contact path only when necessary.

## OWNER
AION PM owns `pm/ledger.md`; BFF owns execution/validation on its Linux side; AION owns decisions and independent ledger acceptance; Owen is not the everyday dispatcher.

## PROOF / acceptance
- `pm/ledger.md` written on main and read back; 13 repo scope correct; current PWA/recorder/bridge/storage/DB/twin gates represented accurately.
- `pm/outbox/AION-PM-20261016-01-ACK.md` references this request ID and a source-verified commit.
- Subsequent revision demonstrates deduplication and genuine status reconciliation, not a static snapshot.
- Failed/missing sources are explicit; original actor/message IDs and timestamps cited only when actually observed.
- Root Git auto-sync must explicitly track `/pm` and `/canon` files, avoid secrets, and use conflict-safe main synchronization; the checked-in BFF auto-push script currently may only stage `workspace/aion`.
