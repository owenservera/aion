#AION @WINDOWS-LOCAL-INTEGRATOR +/EXECUTE — Z.ai four-lane owner handoff

**Thinking effort: HIGH.** This is an instruction to the owner's locally connected agent/executor, not a claim that any remote ChatGPT session can control the owner's Windows machine.

## Mission

Integrate the latest Z.ai four-lane Capture Studio build into the **existing locally authoritative AION Git checkout**, preserve all local edits and original data, run real Windows offline verification, and publish a source- and evidence-identified owner integration PR only after tests pass. Act autonomously on this job; pause only on a genuine destructive/conflicting decision that cannot be resolved without sacrificing the owner's local authority.

## Mandatory reading (in order)

1. This folder's `RUNBOOK.md` and `SOURCE-LEDGER.json`; verify exact incoming archive and both bundle checksums.
2. `RESULT-RECEIPT.md` and [QA issue #72](https://github.com/owenservera/aion/issues/72) with its L0–L5 gates.
3. PR #77's consolidated four-lane source/handoffs and the Z.ai `zai-fourlane-integration-receipt.md` inside the incoming four-lane commit.
4. Git `status --short`, unpushed history, all local owner patches and conflicting files, **before** any merge.
5. Existing Capture Studio single-actor/lease/journal and learned-read effect boundaries.

## Execute

Import first the `round8` bundle with head `23185932abc7615a25207111f07328ebfb2a0074`, then the four-lane bundle head `5ef062581e9ef887b512f6e6ef65703bc72e3337`; verify SHA-256 and heads. No duplication through `git am` after importing bundles.

Create a separate worktree from the **local human-master committed base**, merge Z.ai's head without forcing conflict resolution, and run the actual Capture Studio test suite on Windows. Reconcile any conflicts against exact source and existing root contracts; the QA evidence cannot originate solely from fixtures. Preserve G1–G7 abstention, single browser actor, uncertain-effect journal fences, old binding records, original profile store, original `/chat`, and clear learned-read vs writable-driver separation.

After offline evidence is green, push **only** the reviewed owner integration branch and open an owner PR. Do not directly merge remote main or modify live running Studio; no fresh authenticated provider sends unless explicitly authorized separately. PR #78's independently developed CAS is not ready to graft onto Z.ai's already implemented CAS owner without reconciliation.

## Required output

- Commit SHA and both exact imported source SHAs, diff/conflict resolution ledger.
- Actual local Node/PowerShell/Windows versions and unit counts; tests not run must be marked NOT RUN.
- L0–L4 receipts with an explicit L5 authorization state; `still_unknown` must remain honest for unresolved legacy journal data.
- Sanitized copy of `RESULT-RECEIPT.md` posted to issue #72.
- Clear GO / NO-GO for local activation, source gaps, future remote supplier assignments.
- No secrets, cookies, raw captures, personal transcripts or sensitive paths in GitHub reports.
