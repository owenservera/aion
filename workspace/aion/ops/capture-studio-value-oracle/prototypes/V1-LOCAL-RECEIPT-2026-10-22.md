# Value Oracle V1 — local verification receipt (2026-10-22)

**Scope:** local, offline verification of the V1 Outcome Packet on this Windows checkout. Synthetic fixture only (`prototypes/fixtures/demo.json`). No network calls, no provider sends, no Chrome, no browser automation, no Playwright/Puppeteer. V2–V5 not started. No source files edited; this receipt is the only file written.

**Important:** This receipt does **not** establish Windows user usefulness. `USER_USED` = NOT established. `INDEPENDENTLY_ACCEPTED` = NOT established. Owner time/steps saved = unmeasured.

## Environment

| Item | Value |
|---|---|
| Git HEAD (`git rev-parse --short HEAD`) | `bc00fb7a` |
| Node (`node --version`) | `v24.11.1` (V1-RECEIPT.md used v22.16.0; handoff requires Node >=22) |
| Bun (`bun --version`) | `1.4.2` |
| OS | Windows (win32) |

Note: V1-RECEIPT.md cites initial `main` at `06e9810948c23dad3a6599b62b591b7d3a470ee7`. Current HEAD is `bc00fb7a`. Not investigated further; the exact baseline commit was not re-verified against the receipt.

## Tests

**Bun first:** `bun test prototypes/outcome-packet.test.mjs` ran (Bun 1.4.2). Result: **11 pass, 2 fail (13 total)**.

**Fallback:** The file uses `node:test`, which Bun does not run natively. Bun did execute the file and report results, so fallback was not strictly required. For comparison I also ran the native runner named in the handoff: `node --test prototypes/outcome-packet.test.mjs` → **11 pass, 2 fail (13 total)**. Both runners agree.

Failing tests (same cause in both runners):
- `one command emits both packets and QA-compatible receipt, no send`
- `CLI missing input fails without emitting a false success packet`

**Root cause (test-harness bug, Windows only):** `prototypes/outcome-packet.test.mjs` line 12 is
`const local = path.resolve(new URL('./outcome-packet.mjs', import.meta.url).pathname);`
On Windows, `URL.pathname` yields `/C:/...`, so `path.resolve` produces `C:\C:\...` and the child process cannot find the module. The generator itself is not implicated: the demo run below succeeds. Suggested fix for the owner of this file: use `fileURLToPath(new URL(...))`. Not edited here (out of write scope).

Expected per V1-RECEIPT.md: 13 pass / 0 fail on Linux Node 22.16. Observed on Windows: 11 pass / 2 fail. **Discrepancy.**

## Demo

Command: `node prototypes/outcome-packet.mjs --demo --out "C:\Users\VIVIM.inc\AppData\Local\Temp\opencode\sitrep-2026-10-22\v1-demo"`

- Exit code: 0. Printed status: PASS, `evidence_verified: 6`, `delivery: not-attempted`.
- Files present: `outcome-packet.md`, `outcome-packet.json`, `qa-v1/round-L4/{run.json, steps.jsonl, metrics.json, failures.jsonl, summary.md}`.

Printed summary was not trusted; the generated JSON and Markdown were read directly and the refs were recomputed (below).

## Packet content (checked against JSON/Markdown)

- Answer (assistant-stated summary): 1
- Decision (assistant-stated, `not-user-confirmed`): 1
- Proposed actions (`proposed-not-executed`, assignee/destination null): 2
- Unresolved question: 1
- Source-stated unknown: 1
- `delivery.state`: `not-attempted`; `measurement.used_by_owner`: false; `independently_accepted`: false
- `unknowns`: `evidence-integrity-and-capture-acceptance-not-independently-verified`

## Six evidence refs

Verification method: recomputed SHA-256 of the parent text (`turns[1].text` in `fixtures/demo.json`, pointer `#/turns/1/text`), compared to the packet's `text_sha256`; checked `lines[line-1] === quote`; checked `source_file` exists; checked that every summary/decision/action/question/unknown `source_refs` entry resolves to an evidence id.

Parent SHA-256 (recomputed): `7d7c83a86fb798f1a7facfb5c219105046f3a64fe65979c9274fc5df13c15e9c` — matches all six.

| # | Ref | Source line | Quote (abridged) | Status |
|---|---|---|---|---|
| 1 | `ev-9014727f24098f71` | 1 | Summary: The local handoff should show a verified, evidence-linked packet… | VERIFIED |
| 2 | `ev-d457ed6c582223bd` | 2 | Decision: Use existing transcript JSON as the initial input format. | VERIFIED |
| 3 | `ev-1df8e2020824f1d5` | 3 | Next action: Run the standalone packet generator against the saved fixture. | VERIFIED |
| 4 | `ev-89b94d6460de51ed` | 4 | Next action: Inspect the exact source lines before approving any project task. | VERIFIED |
| 5 | `ev-84899ac0fc61c350` | 5 | Question: Does the Windows checkout preserve the same transcript JSON shape? | VERIFIED |
| 6 | `ev-efd87b277eed15ac` | 6 | Unknown: Real Windows owner time savings have not been measured. | VERIFIED |

All six point to `prototypes/fixtures/demo.json`, `#/turns/1/text`, lines 1–6 respectively, and all are referenced by the packet's claims.

## Discrepancies from V1-RECEIPT.md

1. **Test result:** 11 pass / 2 fail on Windows vs. 13 pass / 0 fail claimed on Linux Node 22.16. Cause: Windows path bug in the test file (line 12), not the generator.
2. **Runtime:** Node v24.11.1 instead of v22.16.0 (handoff accepts Node >=22).
3. **HEAD:** `bc00fb7a` vs. baseline `06e9810…` cited in the receipt; not reconciled.

No discrepancy found in demo outputs, the six refs, the packet's claims, or the no-delivery / not-approved / not-executed boundaries.

## Outcome

- Tests: 11 pass / 2 fail (Bun and Node runners agree; failures are the Windows path bug).
- Demo: PASS, exit 0, 6 refs verified by independent recomputation.
- `SOURCE_DELIVERED`: yes (the existing code and fixture, unchanged in this run).
- `EXECUTED_TESTED`: partial — the offline generator ran; 2 of 13 tests fail on Windows.
- `USER_USED`: NOT established.
- `INDEPENDENTLY_ACCEPTED`: NOT established.
- Windows user usefulness: **NOT established.**

Proposed next move (not executed): owner of the test file fixes line 12 with `fileURLToPath`, then re-runs both runners; no change to the generator is indicated by this run.
