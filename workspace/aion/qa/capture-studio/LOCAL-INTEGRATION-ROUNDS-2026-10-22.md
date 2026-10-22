# Capture Studio — Windows Local Integration Rounds & Development Feedback Contract
**Prepared:** 2026-10-22. **Steering source pin:** `a18407def4e3065c4a43206f597758633a23f66a` (recheck and record actual local git SHA at execution). **Owner machine:** Windows local checkout only. **This is a staged local integration runbook, not proof any round ran.**

## Decision
**One short remote handoff pass, then local testing.** Avoid full-feature freezes/enterprise signoffs. The team has delivered local-raw/tokenless/one-click Drive/bulk typing/no default capture size/cooldown/source-side NSP. Outstanding Core multi-turn and integration acceptance are still real features, but they should not block learning from an initial **single-turn** local integration round. Native Chief/OpenCode merge #66 may affect coordination, not proof Studio works on Windows. Value Oracle V1 outcome prototype is independent and can proceed in parallel.

**Hard split:** source shipped vs runnable on machine vs observed end-to-end vs independently accepted. Do not assume repo commit runs on the Windows host. No Playwright/Puppeteer. Do not fabricate AI provider availability, Chrome tabs or success.

## Minimal remote tasks before round 1
1. **Core:** expose or document actual start/doctor/CLI arguments and data directory; explicitly document one-turn limitation and unknown-send retry policy. Finish only active Sprint 1/NSP source already in flight; park multi-turn build until local single-turn evidence unless already underway. Attach current native Node test and code SHA receipts where available; do not add security ceremonies.
2. **UI:** ensure Chat/Drive entry, exact saved-session link, local-tokenless access and incomplete/uncertain status are understandable with no extra confirmation; finish existing Evidence Explorer work only where near-done. Supply UI recovery micro-fixtures.
3. **Knowledge & Learning:** provide 4 small synthetic fixtures for as-of truth, cross-session join exclusion, corrected learner version, and missing/failed acceptance; label expected output. Do not require live model improvement to begin Round 1.
4. **Systems:** translate findings into an observation map: critical timestamps, queue/overflow/gaps, truncated/missed bytes, resource usage, CDP reconnect, local target ownership; no standalone observability product.
5. **Value Oracle:** ship one offline Outcome Packet from synthetic saved evidence; include source locators, decisions, proposed tasks, unknowns and output usefulness; no GitHub task dispatch yet.
6. **QA:** own this plan, evidence intake, fault ownership and after-round rebaseline. QA should not gate normal construction.

## Local rounds — sequence and purpose

| Round | Test scope / exact goal | Safe test mode | Evidence to preserve | Decision to advance |
|---|---|---|---|---|
| **L0 Environment + boot** | local branch/dirty tree/Node/Chrome/CDP; `doctor`, `help`; launch Studio loopback local mode, UI/API; inspect saved sessions; no browser send | Read-only, isolated local data dir if appropriate | versions, resolved paths, stderr, process/port, HTTP status, time-to-first-view, failure stack, screenshots *locally only*, SHA | One reproducible start with usable UI/API, or exact blocker. Never destroy owner's Chrome profile/worktree |
| **L1 Synthetic complete pipeline** | run built-in generated fixture site and `scripts/live-e2e.mjs` or equivalent; capture → stop/verify → derive → session link → replay/graph; compare saved raw/derived counts | Disposable local fixture; no logged-in external account | step-level PASS/FAIL/SKIP, synthetic session ID, raw/derived file paths, integrity, gaps, stdout/stderr; fixture can be shared | Proven local engine integration or failure pinpointed before real provider send |
| **L2 One controlled real conversation** | attach one chosen already-authenticated site/tab; inspect composer/draft; one explicit user-intended Send; observe reply; finish recorder; open saved evidence; do not auto-retry if HTTP effect uncertain | One site, one prompt, no automatic retry, owner-local only | expected vs observed send count, tab binding, reply evidence source, completion state, stop outcome, integrity, session ID, sanitized failure trace, replay coverage; prompts/replies stay local | Single-turn E2E acceptance evidence. Unknown/partial is a valid diagnostic outcome; no unsupported success claim |
| **L3 Failure + recovery** | synthetic target disappearance, blocked composer, stale selection, stop failure, cancelled Drive, ambiguous send, orphan lease / state; attempt user recovery without data loss | Mock or disposable fixtures first; avoid repeated live sends | transition list, lease state/owner evidence, original vs later actions, unconfirmed effects and actual recovery, no lost raw bytes | Recoverability without destructive reset, duplicate side effect or misleading completed state |
| **L4 Intelligence + usability** | run two saved same-origin sessions with different account/key cases, time-travel comparison, graph, correction rollback, output packet; measure steps from evidence → usable artifact | Prior saved or synthetic data, no new live sends needed | observed vs inferred vs accepted distinctions, provenance/source IDs, false merges, exact revision/time, artifact accuracy and manual steps/time | Which L4/L5/Value Oracle features are genuinely useful; named next build tasks |
| **L5 Integration/scale (conditional)** | long outputs, stream resource/CPU/memory, multiple targets/extension→Studio client contract, cancellation, cross-process lease | Expand only after L0–L3; local controlled workloads | p50/p95 latency, raw throughput, memory/disk, gaps, process/target ownership, reproducible load config | Engineering bottleneck list and safe scale limit; not an unbounded stress campaign |

**Per-round stop rule:** only stop on a real technical blocker or unexpected irreversible browser side effect. A failure should generate a minimal reproduction plus an alternate independent scenario, not terminate the entire investigation or demand a new approval form. Allow retry of clearly non-dispatched synthetic actions; uncertain real sends must be reconciled before any new send.

## Evidence output contract (one JSON + one readable summary per round)

Save to **LOCAL PC**, outside Git capture-data paths, e.g. `<capture-home>/integration-runs/<run_id>/round-LN/`:
- `run.json` — run_id, round, start/end ISO8601, machine label (non-PII), git exact SHA/dirty summary, Node/Chrome versions, test command/args *with secrets removed*, component versions, profile/mode, input fixture ID, status PASS|FAIL|PARTIAL|BLOCKED|SKIP, failure class, owning lane, environmental constraints.
- `steps.jsonl` — `{step_id, action, started_at, ended_at, result, evidence_ref, effect_class, known/unknown}`; explicit CLI exit, HTTP status and correlation key; do not store secret payload in shareable metadata.
- `metrics.json` — actual totals and denominators: send attempts vs proven sends, replies detected vs complete, recording status, bytes raw, gaps/truncated/unknown coverage, verify/derive status, process CPU/memory/disk peak where measured, latency where measured, UI steps/time, results opened/used.
- `failures.jsonl` — reproducible `{signature, component, expected, observed, minimal_repro, suspected_owner, confidence, source_sha, evidence_refs}`; retain stack and environment locally, redact when sharing.
- `summary.md` — <=1 page: what user could actually do, what broke, which next source change would unlock more use, and explicit not-tested boundaries.
- `private/` — optional raw recordings, screenshots and full transcript **local only**, never pushed/shared automatically.
- `shareable/` — optional sanitized small packet (run.json, findings, metrics, synthetic fixture only); review before GitHub issue/commit.

**Evidence IDs:** `run_id/round/step`; every source change request cites that ID and originating SHA. Never aggregate “pass 50 tests” without environment and actual runner output. One owned failure = one targeted task; deduplicate by `signature + component + source_sha`. Do not create five hundred GitHub tickets.

## Round review / feedback to remote agents

1. QA receives **only shareable packet** (the full private run remains on owner PC), checks completeness, correlates recurring failures and pins test+source version.
2. Prioritize **P0** unrepeatable user action loss / false-success / data loss / startup impossible; **P1** critical feature blocked or incorrect evidence; **P2** workflow friction, intermittent/poor fidelity; **P3** optional enhancements.
3. Route to **Core** CDP/CLI/server/lease/recorder/persistence/derive; **UI** navigation/recovery/local-state; **L4/L5** model time, identity, learning quality; **Systems** source gap analysis; **Value Oracle** outcome usefulness; **Development/Track B** extension/transport consuming Studio.
4. Each task has `expected → actual → reproducer → impacted user job → owner → source pin → sanitized evidence links`; implement source change, run relevant focused tests, commit SHA; local team **replays same fixture** and attaches before/after metrics.
5. QA updates `STATE.json` and sprint queue with actual outcome, accepted or unresolved; repeat only failing cases and **one adjacent regression**. Successful stable rounds do not need full reruns after unrelated changes.

## Ready-to-run initial commands (Windows PowerShell, from Capture Studio directory)

```powershell
git rev-parse HEAD
git status --short
node --version
node bin/studio.mjs help
node bin/studio.mjs doctor --json
node scripts/live-e2e.mjs --no-browser   # inspect behavior; may SKIP browser-dependent steps
```

**Important:** `scripts/live-e2e.mjs` starts its own synthetic local fixture/browser when run normally, and writes `live-e2e-result.json` under the configured data directory; read script prerequisites and existing Chrome/CDP ownership before running the full fixture. No unreviewed commands should close an active owner's Chrome/tab/profile. L2 real send only after L0/L1 evidence is understood.

## Pre-handoff call

**Proceed with L0+L1 once the runner has this contract and an exact checkout; do not wait for Core one-turn removal or Value Oracle full integration.** If the local team cannot instrument the run.json/steps/metrics/failures as written, begin with existing CLI JSON and `live-e2e-result.json`, manually classify failures and add machine-readable aggregation in the next local iteration. Never mislabel a planned round as executed.
