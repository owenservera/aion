# AION Track B — velocity command-plane staging

**State:** Track B development source and tests committed (Rounds 1–6). Windows local master remains paused. **Not** installed, registered, connected to a real browser, activated, or live-tested. GitHub Actions has returned startup_failure before jobs, so the Node suite is still UNVERIFIED.

**Branch:** `track-b/velocity-command-plane-20261019`  
**Issue:** [#32](https://github.com/owenservera/aion/issues/32)  
**Baseline:** `e5819a36a84ac27405d3d4a6a5e8c37d655c4cc5`  
**Stable frozen Track A:** `fd347f22dba24e9282e8a39b01ed5f0c760bee14`; do not replace existing Profile 3.

The proposed `aion.rpc/1` request validator lives in `src/rpc.mjs`. It validates envelopes only: it neither authenticates callers nor grants authority, connects IPC, allocates operation IDs, or dispatches work. Tests are staged, but no successful runner result is claimed.

This folder is **not** a second bus. It is a small command-client and capability-projection staging area. It intentionally cannot send or activate anything. The existing `extension/src/bus/` is the only bus contract. Future Windows AIOND must become the sole durable mutation authority, with the existing bus core imported rather than copied. Its Chrome/native-host transport will be adapted once local execution resumes and can be independently verified.

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

## CI verification at bootstrap

A GitHub Actions workflow is committed at `.github/workflows/aion-track-b-velocity.yml`, but its initial runs returned `startup_failure` with no jobs. Treat CI as **NOT VERIFIED**, not as passing or a source failure. Investigate Actions availability/permissions/billing or use an authorized independent Node 22 runner; keep the draft PR unmerged until reproducible tests pass.

## Round 6: executable path (not a live Chrome claim)

New source now includes:
- `bin/aion.mjs`: one-command intent, `--detach`, `observe --follow`, bounded `--wait-ms`, and no retry after uncertain delivery.
- `bin/aiond-dev.mjs`: dev-only broker using the **existing** AION Bus, a private Unix domain socket and a single file ledger; Windows is deliberately refused until an audited owner-SID named-pipe helper exists.
- `src/broker/core.mjs`: checked role binding, current grant, readiness, atomic binding-revision guard, and one broker-owned dispatch per admission.
- The existing Bus is extended **on this isolated B branch** with a restrictive target guard at reservation plus a before-dispatch binding check. A changed recipient halts, never retargets.
- `src/result.mjs`: derived Bus `aion.result/1`; no duplicate state machine.
- Real Bus/IPC fixture integration tests under `test/round6-*.test.mjs`. These are **not** live browser tests.

### Safe test commands (Node.js 22+)

```bash
cd workspace/aion/ops/chrome-relay/velocity
npm test
npm run test:bus
npm run test:ipc
```

The IPC suite intentionally skips on Windows. Linux/macOS dev-only smoke uses a private temp directory and an explicitly fake adapter. Tests run on an ordinary Node installation; no Playwright, Puppeteer or Orca is used.

### Local experimental operator behavior

```text
aion status --json
aion send chief "Review the latest integration" --wait-ms 120000
aion send chief "Review the latest integration" --detach
aion observe <operation_id> --follow
```

These commands only work after the authorized **B-only** broker, exact target binding, owner grant and real capability producer are configured. Without a broker, the CLI refuses. The new daemon currently loads **zero real adapters by default** and cannot send to Chrome. Do not mistake test adapter injection for browser integration. Never point it at the Track A ledger or stable Chrome extension.

### Evidence truth as of Round 6

Exact committed Bus/controller/CLI code was evaluated with V8 source-level fixture tests in this chat: once-only dispatch, prompt removal, nonce replay refusal, target-busy, readback, restart no-resend, binding drift and one-command follow all passed. This is **not** the Node 22 `node --test` suite, not Windows secure IPC, and not an actual Chrome Send. Those verification gates remain open. GitHub Issues #31/#32 and draft PRs #33/#34 record scope and pending acceptance.
