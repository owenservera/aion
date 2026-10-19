# AION Track B — velocity command-plane staging

**State:** GitHub source-only development scaffold; Windows/local executor is paused. Not installed, registered, connected, activated, or live-tested.

**Branch:** `track-b/velocity-command-plane-20261019`  
**Issue:** [#32](https://github.com/owenservera/aion/issues/32)  
**Baseline:** `e5819a36a84ac27405d3d4a6a5e8c37d655c4cc5`  
**Stable frozen Track A:** `fd347f22dba24e9282e8a39b01ed5f0c760bee14`; do not replace existing Profile 3.

The proposed `aion.rpc/1` request validator lives in `src/rpc.mjs`. It validates envelopes only: it neither authenticates callers nor grants authority, connects IPC, allocates operation IDs, or dispatches work. Tests are staged, but no successful runner result is claimed.\n\nThis folder is **not** a second bus. It is a small command-client and capability-projection staging area. It intentionally cannot send or activate anything. The existing `extension/src/bus/` is the only bus contract. Future Windows AIOND must become the sole durable mutation authority, with the existing bus core imported rather than copied. Its Chrome/native-host transport will be adapted once local execution resumes and can be independently verified.

## Offline tests (Node >=22)

```powershell
cd workspace/aion/ops/chrome-relay/velocity
node --test
node bin/aion-velocity.mjs doctor --json
node bin/aion-velocity.mjs send chief "test"
```

The third command **must refuse** with `RUNTIME_NOT_CONNECTED` and no operation ID. Do not add `--live` magic to this prototype. The final `aion send ...` command belongs behind a verified per-user IPC connection and the existing Bus grants/ledger.

## Incremental integration gates

- **B0 — branch and contract:** Isolated source, readiness rules, CLI grammar, executable tests, and immutable Track A baseline.
- **B1 — local authority:** per-user Windows AIOND, *actual* current-user ACL on Named Pipe, single-writer bus ledger, read-only doctor and real capability producers. One authoritative state source.
- **B2 — Chrome adapter:** vetted native host `com.aion.relay.dev`, explicit dev Chrome identity/profile, existing content port, verified live session binding; no duplicate send route.
- **B3 — command:** `aion send chief "..." ` goes to same durable bus/grants/observer, exactly once; logs operation ID/receipt, negative no-send case.
- **B4 — Windows/OpenCode:** UIA and ACP/HTTP readiness, deliberate fallback sharing operation identity, permissions and no-resend proof.
- **B5 — unified pane/release:** side panel reads local projections, activation and rollback, latency evidence, independent Track A acceptance and selective promotion.

## Never on paused local master

No native-host registration, Chrome extension/profile changes, Task Scheduler, daemon autostart, Git local checkout/pull, shell/UIA action, provider login, Send invocation or claimed M1 verification. No Playwright, Puppeteer, or Orca.

## Runtime reconnect prerequisite

Local authorized executor must inspect exact Windows branch/worktree, Chrome profiles/extension IDs, native host path, running services and interactive desktop before choosing installation locations. Prepare separate dev extension key/ID and `com.aion.relay.dev` registration **only in its dev namespace**; collect before/after receipts and rollback. Do not overwrite the stable `com.aion.relay` registration.

See also [DUAL-TRACK-COMMAND-PLANE-2026-10-19.md](../DUAL-TRACK-COMMAND-PLANE-2026-10-19.md).

## Local verification only

GitHub Actions were removed from both Track B branches. Local Node 22 test execution is the only supported verification path: run node --test from velocity and the parent Bus/extension/bridge directories. The full bundled local selftest runner, direct OpenCode path and Windows launchers are developed in draft PR #34; bootstrap PR #33 does not include them until reviewed/merged. No remote test runner or GitHub wake-up dependency is permitted.
