# Harvest — start here (2026-10-21)

Single entry point for the donor and own-repo harvest. Read this, then follow one link. Source-inspected only: no donor test was run and nothing here is an acceptance receipt.

## 1. What to read, in order

| # | Document | Use it for |
|---|---|---|
| 1 | [triage/LEVERAGE-STRATEGY-2026-10-21.md](external/landing/triage/LEVERAGE-STRATEGY-2026-10-21.md) | Ranked reuse bundles, next adaptation batches, open owner decisions, stopping criteria |
| 2 | [triage/FIRST-PASS-DEV-HANDOFF.md](external/landing/triage/FIRST-PASS-DEV-HANDOFF.md) | Development handoff and corrections to earlier claims |
| 3 | [EXCHANGE.md](EXCHANGE.md) / [EXCHANGE.jsonl](EXCHANGE.jsonl) | The only NEED/OFFER/GAP queue (AX-0001..AX-0021). Update existing topics; do not mint IDs for vocabulary alone |
| 4 | [workers/integration-manager/DELIVERABLES.md](external/workers/integration-manager/DELIVERABLES.md) | Staged packs and their status (PACK-01..07 staged; PACK-03 reserved for send correlation; PACK-08 unstaged) |
| 5 | [../DEVELOPMENT-MASTER.md](../DEVELOPMENT-MASTER.md) | Gates P1–P8 / I0–I3 — acceptance lives here, not in harvest |

## 2. Where the evidence lives

| Question | Location |
|---|---|
| The 105-row capability universe (29 core + 11 existing + 65 future) | [external/reference/capability-universe.csv](external/reference/capability-universe.csv) |
| 40 commands × 1000 mapping rows | [external/reference/command-matrix-1000.csv](external/reference/command-matrix-1000.csv) |
| Donor roles, pins, licences | [triage/REPO-ROLES.csv](external/landing/triage/REPO-ROLES.csv) |
| Nine external donors (round 1–2, exact-40 each) | `external/landing/donors/`, coverage in `../../command-space/EXTERNAL-IMPLEMENTATIONS-COVERAGE.*` |
| Own-repo first pass (captures, `items/`, `index.jsonl`) | `landing/sources/{vomega,vivim-omega,vivim-final}/` |
| Own-repo step 2 (exact-40 dispositions + memo) | `landing/sources/<repo>/STEP2-DISPOSITIONS-2026-10-21.json` and `STEP2-HARVEST-2026-10-21.md` |
| Cross-source synthesis | `landing/synthesis/` |

Step-2 checks done: each JSON has exactly 40 rows matching `aion_command_matrix.csv`; all cited line numbers exist; 15 of 15 sampled sha256 values match. Two citations are loose (VOMEGA glob `worlds/W0-W5.json`, bare `src/index.ts`).

## 3. Facts that are easy to get wrong

- MAC = **multi-ai-chat** (pin `cdcf6a7f…`). The Bridge manifest has **29** definitions at lines 151–180 (an earlier "30" and "31" were both wrong).
- `session.bind` is not `browser.tab.identify`; `file.attach` (upload) is not `artifact.fetch` (download).
- A correlation mismatch is not a completion state: no `event/1` enum change.
- AION already has Bus grants/ledger/no-resend, `event/1` + `snapshot/1` with cursor/coverage, and PACK-01/02. Never claim it lacks them.
- Vocabulary reuse is not a missing feature: no new stores, registries, daemons or schema changes.
- Own-repo hashes: Vivim-omega captured copies match their recorded sha256 only after CRLF→LF normalisation. vivim-final's local checkout has uncommitted changes, so its new hashes are not tied to a commit.

## 4. Rejected defaults (do not import)

Undeclared risk → READ (VO-GH-0031); unparseable rule → true (VF-0026); unknown providerClass → SIMULATOR (VO-GH-0007); resend after reconnect (VF-0016/0024); allow-all law plugin (`plugins/law-stub`); `allow_always` permission option and failure-type auto-retry in vivim-final; donor Enter/click auto-submit fallbacks.

## 5. State and open items

- Staged: PACK-01, 02, 04, 05, 06, 07. Offline fixtures pass for PACK-04 (13), PACK-06 (26), PACK-07 (12); PACK-05 is a generated table. Nothing is wired into the runtime.
- Not started: PACK-08 negative-fixture corpus (decision D1 in the leverage memo).
- Blocked: I1 live acceptance; VOMEGA gate tests need `experimental/ratchet/src/gate.ts` and `ratchet.lock.json` besides the three located gate files, and unfinished gates run as `test.failing`.
- Owner decisions: diagnostic disk-write legality, trace text policy, breaker ledger schema, `documentId` Chrome version, MIT attribution format.
- Known stale wording to fix: 40 existing rows in `capability-universe.csv` still say `not_assessed_this_pass`.
