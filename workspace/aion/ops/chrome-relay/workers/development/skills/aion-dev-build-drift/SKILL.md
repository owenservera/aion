---
name: aion-dev-build-drift
description: Detect source-versus-unpacked-build drift in AION's Track B Chrome extension before diagnosing account registration, receive errors or claiming a freshly loaded runtime.
---

# Development — Track B generated-source drift

## Trigger

Use on failed `aion account register chief`, missing I1 watch-only receive, post-build changes to the Chrome dev router/observer, or suspected stale unpacked extension files. **Do not** use this to verify a live Chrome session, authenticate an account, read conversations, or replace Toolsmith's environment/transport recovery skill.

The existing AION [setup.mjs](../../../../src/browser/setup.mjs) copies the JS files from the Velocity dev-worker and base extension into the unpacked extension. This skill checks **only six concrete copy seams**. Reuse the existing `aion setup browser` / `inspectBrowserSetup` commands for setup/registration integrity; this script neither installs nor overwrites anything.

## Execute (from AION repository root)

With the *actual owner-local Track B* `setup-receipt.json` path (do not use Track A):

```powershell
node workspace/aion/ops/chrome-relay/workers/development/skills/aion-dev-build-drift/scripts/probe.mjs --setup-receipt "<path-to-Track-B-setup-receipt.json>"
```

Or provide the unpacked **Track B dev** extension directory explicitly:

```powershell
node workspace/aion/ops/chrome-relay/workers/development/skills/aion-dev-build-drift/scripts/probe.mjs --extension-dir "<path-to-Track-B-unpacked-extension>"
```

Optional `--repo-root <AION-checkout>` when launched outside the repository root. The script is read-only and never enumerates Chrome profiles, probes accounts, starts processes, performs a Send, modifies files, prints receipt contents or logs conversation data. Exit codes: `0` all six disk copies match, `1` drift or incomplete copies, `2` invalid input/receipt. It emits one bounded JSON result with per-file `MATCH`, `DRIFT`, `BUILT_FILE_MISSING`, `SOURCE_FILE_MISSING`, `*_SYMLINK_REFUSED`, etc. SHA-256 digests appear only for mismatched **code files**.

## Decide what to do

1. Inspect `scope=disk-files-only`. `MATCH` verifies **bytes on disk only**; `loaded_in_chrome` and `native_host_running_revision` explicitly remain `UNVERIFIED`. Compare the actual running extension/worker and native-host executable through Toolsmith's existing [readiness diagnostics](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/agent-communications/intelligence/agents/06-tooling-integration-engineer/README.md) before deciding a loaded-version mismatch exists.
2. `DRIFT` or `INCOMPLETE` points to specific copied JS. Rebuild/reload **only with an authorized local executor**, after reviewing owner-local dirty work, Track B setup ownership and rollback. Never apply setup directly to another path just because a skill says to. Compare again afterward.
3. For a matching disk copy with failed registration, collect a **single** allow-listed `code` and `diagnostic` from explicit `aion account register chief`; isolate CLI → host → worker → page reader. Missing diagnostics alone are **not** proof of stale Chrome code. Fix the demonstrated seam with focused negatives; separately prove an **independently originated exact-thread watch-only** receive for I1. Successful hash matching or IPC ping is not I1 acceptance.
4. After real source changes, run the existing targeted and package suites and record commit/runtime, actual pass/fail/skip. Never infer latest-tip green tests from a prior checkpoint.

## Verify the skill itself

```powershell
node --test workspace/aion/ops/chrome-relay/workers/development/skills/aion-dev-build-drift/scripts/probe.test.mjs
node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs validate workspace/aion/ops/chrome-relay/workers/development/skills/aion-dev-build-drift/SKILL.md
node .opencode/skills/aion-skill-builder/scripts/skill-kit.mjs audit
```

This source folder is included in [AION's OpenCode V2 `opencode.jsonc`](https://github.com/owenservera/aion/blob/main/opencode.jsonc), **when launched at the appropriate root with that effective config**. ZCode needs its separate supported import/enable path; local loading/activation has not been proven by a GitHub commit.

**Owner:** Development maintains this diagnostic/script; Toolsmith maintains broader host/environment diagnostics. Shared [Master Skills Builder](https://github.com/owenservera/aion/blob/main/.opencode/skills/aion-skill-builder/SKILL.md), [Development intelligence](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/agent-communications/intelligence/agents/10-development/README.md), and executable setup code remain authoritative. Update the skill only when its actual copy seam or real failures change.
