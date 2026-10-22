# Value Oracle V1 — Windows + QA handoff (2026-10-22)

**Purpose:** an independent offline read-only consumer of the actual Capture Studio `export transcript --format json` representation: `{meta,timeline,streams,turns}`. Only synthetic fixture is committed. One user/local Windows PC, Node.js >=22, no npm packages, Chrome, browser action, server, database, provider or GitHub write at runtime.

## One command — from repository root (PowerShell)

```powershell
node workspace/aion/ops/capture-studio-value-oracle/prototypes/outcome-packet.mjs --demo
```

For an existing **local** saved transcript export, instead run:

```powershell
node workspace/aion/ops/capture-studio-value-oracle/prototypes/outcome-packet.mjs --input "C:\local\saved-transcript.json"
```

Optional `--out "C:\local\outcomes"` and `--source-sha <actual-checkout-sha>`. The existing Studio CLI can export a transcript: from its project directory, `node bin/studio.mjs export transcript <session-id> --format json --out <local-path>`; verify the actual local CLI syntax before using. The Oracle **does not** initiate derive/capture/send.

Default Windows output: `%LOCALAPPDATA%\AION\capture-studio\outcome-packets\synthetic-session-001\` for demo (other session IDs get their own folder).

## Expected synthetic demonstration

Fixture: `fixtures/demo.json`, session `synthetic-session-001`, existing Studio transcript shape. Expected: **one explicit summary, one assistant-stated (NOT user-approved) decision, two proposed/unexecuted actions, one unresolved question, one source-stated unknown; six exact verified evidence refs**. No assigned task, external delivery, approval or completion claim.

Output files (under selected output directory):

```text
outcome-packet.md
outcome-packet.json
qa-v1/round-L4/run.json
qa-v1/round-L4/steps.jsonl
qa-v1/round-L4/metrics.json
qa-v1/round-L4/failures.jsonl
qa-v1/round-L4/summary.md
```

A generator PASS is only an isolated self-test; it is **NOT** an L0/L1 Windows run, provider L2, accepted evidence, owner use or independent QA acceptance. The QA receipt marks self-test only, captures generator step statuses/durations/counts and keeps unmeasured user/UI times null.

## Source-to-outcome verification (QA L4)

1. Record local `git rev-parse HEAD`, `git status --short`, `node --version`, fixture ID, command/arguments and local output location. Keep the source JSON unchanged and private.
2. In `outcome-packet.json`, examine each `evidence` locator: its `source_file`, `json_pointer`, 1-based `line`, complete parent-text `sha256`, and exact quoted source line. Recompute parent UTF-8 SHA-256; assert quoted line is identical. Generator internally calls `verifyPacket` before materializing successful output.
3. Check that every summary, decision, proposed action and question is grounded by that packet's `source_refs`. Assistant-stated decisions are not user-approved. Actions remain `proposed-not-executed`, with null assignee/destination, and `delivery.state=not-attempted`.
4. Check `unknowns`, including `evidence-integrity-and-capture-acceptance-not-independently-verified`. Even `meta.status=complete` is NOT verified fidelity or user approval.
5. Reproduce negative cases. Tamper source after packet creation => verifier must reject; remove all source => abstain; set incomplete status => completeness unknown; include credential-shaped labelled content => withhold line and report limitation. Never invent links, decisions, completion or assignments.
6. Preserve `qa-v1/round-L4/*` as a local evidence subreceipt. Reference `run_id/round-L4/step_id` from QA's actual integration run. Share **only deliberately reviewed synthetic/sanitized** data, never raw private captures.

## Focused native regression

```powershell
node --test workspace/aion/ops/capture-studio-value-oracle/prototypes/outcome-packet.test.mjs
```

Native Node 22 test suite covers positive outcome, tampered evidence, unlabelled abstention, assembled-stream fallback (unattributed), DOM-first dedup, credential withholding, duplicate actions with multiple refs, interrupted capture, empty input, invalid/malformed/oversized input, claimed bogus source locators, CLI QA receipt, and missing input CLI failure.

Failure contract: missing/invalid JSON exits nonzero with JSON error to stderr (not false PASS); malformed Studio shape `INVALID_TRANSCRIPT`, unsafe/missing session ID `INVALID_SESSION`, input >2 MiB `OVERSIZE_INPUT`, selected text >200K chars `OVERSIZE_TEXT`, bad source line/hash `EVIDENCE_MISMATCH`. Absence of eligible labelled content produces an honest abstention, not a fabricated semantic summary. This deterministic rule-based extractor intentionally **does not** understand arbitrary unlabelled prose.

**Reject** any QA output that calls an assistant decision user-approved, says a proposed task is assigned/done/created, shows a fabricated evidence URL, treats complete transcript as accepted capture, or generates unsupported answer for absent evidence.

## Next integration boundary — after local proof, NOT V2

Ask UI for a single read-only **Make useful** consumer of a selected saved-session transcript (exact local source pointer). Core retains session/acceptance APIs; UI retains button/navigation; L4/L5 owns semantic confidence/revisions; QA independently accepts. Request a specific hook only after Windows demonstrates that six synthetic refs resolve and observes the user outcome. No new service, second store, automatic external task, background service or private capture upload.

**Unmeasured:** user's actual time/steps saved, real transcript coverage, arbitrary-language summary quality, Windows path/permissions, independent L4 acceptance. No real Windows/browser tests executed here.
