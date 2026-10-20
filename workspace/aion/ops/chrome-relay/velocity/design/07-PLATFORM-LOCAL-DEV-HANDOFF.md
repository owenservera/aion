# AION Platform / Track B — integrated local-development candidate

**Date:** 2026-10-20. **Status:** CODE COMMITTED / ISOLATED NODE TESTS PASS / FULL REPO + WINDOWS + LIVE CHROME NOT YET VERIFIED.

**Scope:** The existing Chrome Extension Track B workstream, including AION Platform semantics, CLI/read-only interfaces, donor evidence, native OpenCode/ACP adapters and future capability design. This is a test candidate, **not** a release or M1 acceptance.

**Source branch:** track-b/platform-local-candidate-20261020 in owenservera/aion. Descends from track-b/strategic-capability-roadmap-20261020 and the active track-b/implementation-rounds-20261019. The Harvest changes were overlaid into this isolated candidate branch, not merged into the Harvest PR bases: PR #37 Omega (55 changed files), PR #40 Final (57), PR #41 Crosswalk (8), with no path overlaps. The complete corpus is under harvest/landing/. Actual checkout HEAD must be recorded, never guessed.

## Packaged implementation

1. src/platform/semantics.mjs — strict **design-only** semantic seed and directive validation; read-only provider/family/realization/capability projections from the **existing AION Bus adapter manifests**. No new registry, binding or execution authority.
2. src/platform/inspect.mjs — new local read-only commands: aion platform inspect, aion platform validate, aion platform harvest. They do not launch the Bus, engine, browser or native host.
3. src/platform/harvest.mjs — audit the 65-record crosswalk ledger and verify **reported landing-copy SHA256** for each of the 53 copied records. This does NOT independently validate donor runtime functionality or original checkout dirty state.
4. bin/aion-local.mjs, bin/aion.mjs, src/broker/core.mjs — preserve existing commands and add read-only platform introspection. Existing aion capabilities output retains its fields and includes optional additive platform description from currently loaded adapters.
5. Tests: platform-semantics.test.mjs (14), platform-harvest.test.mjs (7), platform-cli.integration.test.mjs (5). Only the first 21 were executed in isolated Node 22 staging before push; the last 5 and the full current repository suite require checkout testing.
6. Full Harvest C-004 evidence: 27 Final copied records, 26 Omega copied records, 12 Omega flagged-only records, plus 65-row crosswalk ledger and prioritized integration queue. Earlier 16 reconnaissance findings overlap; do not add them to the count.

**Migration choice for this candidate:** compatible **metadata overlay only**, no persisted Bus/Chrome/agent identity migration and no second authoritative taxonomy. The existing aion.bus/1 ledger/grants/registry, immutable operation IDs, browser journal, CENV Send/Stop evidence requirements and aion.result/1 stay authoritative. Application family and provider realization mode remain independent axes. Reject fail-open rules, post-dispatch automatic resend and selector-ranked ambiguous control activation.

## Local master worktree launch (PowerShell 7, Windows)

Run from the **existing AION repository root** after inspecting/saving any changes. The new detached worktree does not switch or overwrite the human-master checkout. If the destination exists, choose an unused empty sibling folder—never delete another worktree blindly.

~~~powershell
git status --short
git fetch origin track-b/platform-local-candidate-20261020
git worktree add --detach ..\aion-trackb-local-candidate origin/track-b/platform-local-candidate-20261020
Set-Location ..\aion-trackb-local-candidate
git rev-parse HEAD
git status --short

$Aion = '.\workspace\aion\ops\chrome-relay\velocity\bin\aion.ps1'
pwsh -NoProfile -File $Aion platform validate
pwsh -NoProfile -File $Aion platform inspect --json
pwsh -NoProfile -File $Aion platform harvest --json

node --test .\workspace\aion\ops\chrome-relay\velocity\test\platform-semantics.test.mjs .\workspace\aion\ops\chrome-relay\velocity\test\platform-harvest.test.mjs .\workspace\aion\ops\chrome-relay\velocity\test\platform-cli.integration.test.mjs
pwsh -NoProfile -File $Aion selftest
pwsh -NoProfile -File $Aion connections
pwsh -NoProfile -File $Aion preflight browser
~~~

First three platform commands read checked-in data only. Platform harvest computes hashes of captured files but NEVER executes donor code. The Node/selftest commands run offline tests. Connections and preflight are read-only diagnostics. These commands do **not** install anything, grant execution, send a prompt, modify Track A or claim M1.

A detached worktree should get a unique local task branch before changing source and committing. The Windows local human master remains authoritative; no hard reset, forced update or automatic conflict resolution.

## Verification gates

| Gate | Operator work | Required receipt |
| --- | --- | --- |
| L0 — Source and state | Record current HEAD, Windows/Node/Chrome/OpenCode versions, worktree status, exact Track B host/extension identity | SHA + sanitized UTC state |
| L1 — Platform integrity | Run platform validate/inspect/harvest and focused new tests | Seed inert; 65 ledger records; 53 hash checks; 26 platform tests with exact pass/fail |
| L2 — Full offline | Run full current-head aion selftest | All suites and pass/fail/skip counts; do not reuse old 1,082-test receipts |
| L3 — Native runtime | Read-only connections; actual OpenCode actions only after scoped owner admission | Correlated native readback or UNRUN/BLOCKED |
| L4 — Chrome read-only | Run preflight browser, confirm B-only dev profile, exact binding, grant and unresolved operations | READY or exact BLOCKED/UNKNOWN; no modification |
| L5 — Real Chrome vertical slice | After explicit owner admission and reconciliation of old uncertainty, execute AC-CENV-01..10 | One observed Send, correlated actual reply, durable CLI result and zero duplicates/wrong-target |
| L6 — Release | Independent source, security/rollback, Track A isolation and receipt review | Explicit acceptance or held/blocked |

**Critical safety boundary:** operation 2f6k2b046i6o02234j1h had a filled composer without recorded activation. The candidate does NOT reconcile/dispose it, press Enter or Stop, switch to an alternate driver, reload extension or authorize a new attempt. Current Chrome repair tasks are still in chrome-relay/OPENCODE-BUILD-ORDER.md, with CENV contracts in ARCHITECTURE.md and ENVELOPE-CONTRACT.md. No Playwright, Puppeteer, Orca, CDP or UIA fallback for uncertain Send.

## Workplan and release order

**Done in this package:** S0 integration of all three pinned donor branches into isolated candidate; S1 design semantic master and design directive governance; S2 additive read-only runtime semantic projection and negative unit tests; S3 local checkout/test plan and evidence receipt template.

**Next:** Execute L0–L2 on local Windows; fix genuine current-head regressions before installing/touching Chrome. Continue existing CENV Tasks 1–5: preserve diagnostic reason, exact current action observations, guarded readiness and one activation, independent response budget, then real authorized browser acceptance. Independent provider-family experiments and protocol/migration compatibility reviews may proceed in other chats/branches without editing hot-path files.

**Future:** after one real successful ChatGPT command-to-result proof, test a genuinely distinct webapp/provider realization before broad UI abstraction. A one-time taxonomy migration stays deferred unless a measured cross-provider limitation makes additive metadata insufficient and explicit rollback/old-record compatibility is proven.

## Local agent return receipt

~~~text
AION_TRACK_B_PLATFORM_LOCAL_V1
branch: track-b/platform-local-candidate-20261020
head_sha: <exact SHA>
working_tree: CLEAN|DIRTY
versions: <Windows, Node, Chrome, OpenCode>
platform_validate: PASS|FAIL|UNRUN
platform_harvest: records=<n> copied=<n> matching=<n> missing=<n> mismatched=<n>
focused_tests: pass=<n> fail=<n> skipped=<n> command=<...>
full_selftest: pass=<n> fail=<n> skipped=<n> command=<...>
native_opencode: VERIFIED|BLOCKED|UNRUN + receipt
chrome_preflight: READY|BLOCKED|UNKNOWN|UNRUN + reason
old_unresolved_operation: PRESERVED|RECONCILED_BY_POSITIVE_EVIDENCE|UNKNOWN
chrome_send_reply: VERIFIED|BLOCKED|UNRUN + receipt
track_a_unchanged: VERIFIED|UNKNOWN
new_commits: <SHA(s) or NONE>
remaining_failures: <bounded findings>
END
~~~

**Honest status:** GitHub PR/commit proves source published, not that Windows tests or signed-in browser actions happened. No GitHub Actions, background wake assumptions, secret data in GitHub or Slack.
