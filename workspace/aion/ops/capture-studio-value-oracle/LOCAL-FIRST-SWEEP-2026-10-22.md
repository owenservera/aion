# AION Capture Studio — Full Local-PC Friction / Desecuritization Sweep

**Date:** 2026-10-22. **Agent perspective:** VALUE-ORACLE (user-outcome and automation). **Scope scanned:** first-party Capture Studio server, CLI, UI, capture privacy/network, replay/learning, integrations, Core/UI/QA worklogs; AION velocity local-host security profile and global runtime governance. Third-party harvest/donor files are out of scope. **Baseline main:** `bbbcd47a6d2b81cb72bea3a1d0de70ae0be478bf`; concurrent source-authoring by other AION lanes continued during this pass. Re-fetch current main before making additional changes.

## Owner direction and implementation stance

**One human; one Windows-local development machine; no security ceremonies that obstruct useful development.** Treat localhost as the primary product execution environment. Remove duplicate human confirmations, artificial size/feature caps and login rituals **when they add no value to the local user**. Distinguish three things that must not be mixed:

1. **Friction/security theater:** extra local login, repeated checkbox on top of an explicit action, mandatory ACL inspection on every local developer request, duplicated QA paperwork, arbitrary prompt length.
2. **Operational correctness:** exact target selection, never double-send when previous outcome unknown, maintain evidence provenance, avoid overwriting a second writer's state, prevent corrupted version rollback, preserve capture fidelity and honest unknowns. These are necessary for *utility*, not enterprise security.
3. **Network/data boundary:** capture data in local %LOCALAPPDATA% by default, but website/provider prompts necessarily traverse the provider network; GitHub pushes publish source and any accidentally committed content. `local-raw` stores authentication headers/tokens if captured; never describe that as credential-free. Local webhook and mirror ports expose content to processes on the same PC.

**No zero-egress claim.** The desired private-local default is a local-data and local-service design, not proof that no bytes leave Windows.

## Source-verified changes already committed during the concurrent sweep

| Experience or control | Current main behavior / commit evidence | User benefit and qualification |
| --- | --- | --- |
| Studio UI token login | `src/studio/server.mjs` default localhost access; explicit token/\`CAPTURE_STUDIO_ACCESS_MODE=token\` retains strict behavior. Initial commits `135b7842\`, `499ae71d\`; follow-up source fix `eb45360f\`. | **Removed:** paste token URL/open a special login link every time. Still binds 127.0.0.1 and checks request Host/Origin. |
| Capture fidelity | `src/capture/privacy.mjs` has `local-raw` default and `filtered` opt-in; `network.mjs` and `recorder.mjs` reuse `capturePrivacy`; `0ed25231\`, `6f835d80\`, `f9ec4e8a\`. | **Removed:** silent loss of some local captured content caused by default credential masking/exclusion; **tradeoff:** raw local captures can now contain credentials. |
| Chat/Drive prompt length | Multiple `feat(capture-studio)` commits lifted default artificial 2k prompt ceiling to documented 250,000 characters, subject to transport/request constraints. | Supports actual long-context work instead of requiring splitting prompts or files. |
| Live Drive user action | `ui/drive.mjs` now passes `confirm:true` when user clicks Run; redundant checkbox removed in UI commits `4a52641b\`/`f40da5d0\`. | One meaningful click instead of click plus ceremony; Core's one-dispatch certainty remains. |
| Loopback integrations | `webhooks.mjs` no longer requires redundant `confirm:true` or a hardcoded 16-subscription cap (`e17fc725\`). API schema/metadata reconciled in `4489e2d7\`. | Makes local automation consumers easier; registration POST is still an explicit operation, destination remains literal loopback. |
| Local test URLs | Drive accepts local HTTP fixture targets after `69f039e4\`. | Avoids forcing HTTPS/made-up external domains for PC-local fixture development. |
| QA/steering | QA and Core notes were rebaselined during the sweep; source-only work remains distinct from independent Windows acceptance. | No mandatory stop-and-wait for ordinary code sprints; avoid falsely calling untested builds accepted. |

*Do not infer that this table is a completed Windows installation or runtime test.* The commits reflect source-delivered changes. The exact current schema/source can change while other agents are writing.

## Remaining first-party friction audit (ranked)

| Area | Mechanism / effect | Value-Oracle decision | Owner / next smallest proof |
| --- | --- | --- | --- |
| **P0 — Local browser reuse** | Dedicated Chrome profile can require re-login and duplicate tabs; Chrome DevTools port setup is manual. | **Simplify next:** detect/reuse existing authorized local target/session and make startup `studio start` one gesture; do not weaken source/target identity. | Core/browser-runtime + UI; measure actual startup steps on Windows |
| **P0 — Real local usability acceptance** | Unit/V8/source checks alone cannot prove login-free Studio works on user's PC with Chrome and actual local account. | **Measure now:** one exact Windows checkout and real `start` → capture → usable output path; record steps/time and any failure. | Windows master + QA; not exercised here |
| **P0 — Post-capture usefulness** | Capture/search/graph/export outputs still require the user to decide what to do; the new VALUE-ORACLE agent owns the missing last mile. | **Build:** synthetic source-linked Outcome Packet, then local-after-Finish automation when acceptance/data contracts are ready. | VALUE-ORACLE V1; no extra agent runtime created |
| **P1 — Velocity Windows ACL probes** | `velocity/src/security.mjs` `local-owner` defaults to an initial Windows PowerShell ACL probe (cold startup reportedly seconds), caches success per process; `hardened` rechecks. | **Assess with real host timing:** allow a distinct trusted single-user developer profile or remove repetitive probe from local UX while preserving state-directory path correctness; do not blindly rewrite a concurrently active host. | Development/Velocity, status `NOT_CHANGED_IN_THIS_SWEEP` |
| **P1 — Historical selected-context and correction ceremony** | Time travel, corrections and derived result acceptance are separate views/steps. | Automate read-only interpretation/packing; allow batch proposals and clear reversible approval rather than repeated per-field dialogs. | Knowledge–Learning + VALUE-ORACLE, not invented auto-approval |
| **P1 — Inconsistent contract/copy** | Older UI comments, Studio docs and integration descriptions may still imply token-only access or a 16-webhook maximum after defaults changed. | Reconcile source docs and tool manifest; prefer plain-language "local Studio" states. | UI/Core documentation follow-up; integration hub schema corrected |
| **P2 — Programmatic direct-drive envelope** | Drive API still requires `dryRun:false, confirm:true`; Chat API still requires `confirm:true, expectedRevision, key`. | Keep idempotency/revision and single explicit **send** action; make UX/CLI prepare fields, never require two user clicks for a single choice. | UI/CLI only if current one-click test still shows friction |
| **P2 — Local webhook signatures and mirror caps** | HMAC signing and mirror cap remain even for literal 127.0.0.1. | Keep signed metadata available and bounded worker resource use; measure whether any actual developer workflow is blocked before simplifying further. | Integration owner / benchmark |
| **P2 — Evidence versioning and local-only retention** | Snapshot retention, recovery locks and quotas may increase manual maintenance; defaults already `maxSessionBytes=0` and `maxStreamBytes=0`. | Automate repair/explanations rather than deleting history/limits indiscriminately. | L5 and Core |
| **Out of local-scope defaults** | External URL/CDP binding, websites' own login/anti-abuse restrictions, browser-initiated sends to AI providers, GitHub publishing or deployments. | Never claim "nothing leaves PC" while those are used. Keep external effects explicit and observable. | Original owning runtime / user authorization |

## Verified in this turn vs not verified

- **Confirmed via GitHub:** source and current commit changes above, direct localhost default and strict token compatibility; the newly authored `test/unit/studio-local-access.test.mjs` (five native Node tests) was committed and read back.
- **Executed in isolated JS tool runtime:** full modified `server.mjs` compiled successfully after removing ESM import declarations and replacing import.meta in a syntax-only check; 13/13 source/policy structural assertions passed. These are **NOT native HTTP integration tests**.
- **Not executed:** `node --test` against a full GitHub checkout, Windows Chrome/CDP local startup, live sending, credential capture in default `local-raw`, user task savings. No installation completed on user's Windows PC in this turn.
- **Tool limitation:** a requested extra edit to one existing authentication fixture and an optional CLI `--token-auth` flag were blocked by the connected repository tool. Explicit token injection retains backward compatibility; `CAPTURE_STUDIO_ACCESS_MODE=token` is the supported opt-in path, so neither blocked edit is required for local default use.
- **Concurrency:** other agents actively changed Studio files while this sweep ran. Refresh main and keep source SHA compare on all next writes; no force push, no peer wake-ups.

## Manual smoke commands for the actual Windows owner master

```powershell
# Default localhost, no tokenized URL:
Remove-Item Env:CAPTURE_STUDIO_ACCESS_MODE -ErrorAction SilentlyContinue
node bin/studio.mjs start
# Should open http://127.0.0.1:7878/ directly (unless port configured otherwise).

# Optional token-only mode for a multi-user/shareable workstation:
$env:CAPTURE_STUDIO_ACCESS_MODE = 'token'
node bin/studio.mjs serve

# Capture fidelity:
$env:CAPTURE_STUDIO_CAPTURE_MODE = 'local-raw'  # documented local default
# or: $env:CAPTURE_STUDIO_CAPTURE_MODE = 'filtered'
```

Run from the Capture Studio root; the browser/account still needs its own valid login. The test must compare outputs on current `main` with actual local data directory safely outside Git. Avoid automatic reruns of uncertain external provider sends.

## Decision

**Keep the single-PC local default; do not add new authentication/permissions paperwork to ordinary development.** Focus the remaining improvement effort on single-click browser reuse, working capture with useful outputs, real Windows acceptance and performance. Avoid expanding “security cleanup” indefinitely after the user workflow is fast and functional. Maintain exact observed-vs-accepted evidence and no-double-send semantics because they make the product useful.

**Status:** scoped first-party security/usability audit complete; several source relaxations shipped concurrently; broader executable Windows proof and other-host cleanup pending. Not an independent QA receipt.
