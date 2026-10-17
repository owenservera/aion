# AION Windows dev plane — architecture proposal v0.2

Status: **OPTIONAL FUTURE ARCHITECTURE, not installed or a prerequisite for M1.** Start with direct local Windows agents + existing ACPX/Chrome and GitHub. Add this multi-plane design only when observed workload justifies it. Written 2026-10-17 as a companion to [the decision record](./DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md). It builds on, and does not replace, the [Chrome Relay design](../ops/chrome-relay/ARCHITECTURE.md), the [relay envelope](../ops/chrome-relay/ENVELOPE-CONTRACT.md) and the [Windows M1 architecture](./AION-M1-WINDOWS-MASTER-EXECUTION.md).

## 1. Goal

Let local agents on the owner's Windows machine write and run code, while ChatGPT (AION) and Claude collaborate through the repo, with every claim backed by a receipt that someone other than the producer can check.

## 2. Five planes

```text
            Owner (authority, scoped grants)
                         |
 +-----------------------v------------------------------+
 | POLICY plane   grants (data), approvals, disk guard  |
 +-----------------------+------------------------------+
                         |
 +-----------------------v------------------------------+
 | HOST plane     aiond: one local daemon (Bun/TS)      |
 |   job queue + leases, git integrator, receipt writer |
 +------+------------------+--------------------+-------+
        |                  |                    |
 +------v------+   +-------v--------+   +-------v-------+
 | AGENT plane |   | EDGE plane     |   | LEDGER plane  |
 | ACP workers |   | MV3 extension  |   | SQLite (WAL)  |
 | in worktrees|   | + native host  |   | + GitHub anchor|
 +-------------+   +----------------+   +---------------+
```

- **Host plane (OPTIONAL):** `aiond` may later coordinate longer-running work. For current M1, local agents can invoke existing tools directly; no centralized daemon hop is required.
- **Agent plane:** ZCode, OpenCode, Codex and Claude Code run as workers behind ACP. The daemon is the ACP client, as the relay design already says.
- **Edge plane:** the Chrome extension (reuse ACPX if review passes) talks to the daemon over native messaging. It cannot grant itself permissions.
- **Ledger plane:** an append-only local SQLite log is the source of truth for jobs and receipts. GitHub holds the shared audit copy and anchors.
- **Policy plane (OPTIONAL):** structured grants are useful for unattended privileged operations, not mandatory for regular development or a clearly scoped owner-authorized live session.

## 3. Architectural suggestions

### 3.1 Make the stop order enforceable
For unattended privileged operations, an explicit machine-readable grant can be valuable. For owner-supervised work, an explicit owner instruction and a recorded result are sufficient. Do not require creating a daemon or signing a template before development. The existing stop order still applies to live signed-in browser/account operations until explicitly lifted for that scope.

### 3.2 One envelope for browser and agent traffic
Reuse the relay envelope v0.1 for local agent jobs as well, so there is a single schema and a single pair of state machines (task and delivery). Add a `lease_expires_at` and a heartbeat to the task machine so a crashed agent's job becomes reclaimable. If your existing lease-based build control plane already models this, adopt its semantics rather than inventing another queue.

### 3.3 One git integrator
Blind global `git add -A` autopush is risky for concurrent agents. Begin with ordinary guarded Git operations; add a single integrator only if conflicts persist. Optional scaled pattern:
- An agent **may** use its own local git worktree when tasks overlap.
- An agent may submit a finished change via normal Git; a daemon handoff is optional.
- Verify relevant tests and non-fast-forward status, then push to `main` normally. A daemon-only pusher is optional if concurrency demands it.
This keeps "one public branch" while removing races with other writers, including the cloud-side assistants that commit through GitHub.

### 3.4 Isolate agents; the ACP hole is real
The repo already records that native ACP tool behavior is not fully governed by the host approval layer. On Windows, prefer defense in depth:
- Use the normal Windows development account for routine work. Consider a low-privilege Windows user or Windows Sandbox only for untrusted/high-risk programs; WSL2 is optional and not assumed.
- Apply Job Object limits only if actual runaway-process/resource issues occur.
- Use existing Windows filesystem permissions. Introduce worktree ACL restrictions only if a concrete isolation need emerges.
- Keep GitHub tokens and provider keys in Windows Credential Manager or DPAPI, never in worktrees or the extension.

### 3.5 Treat disk space as a gating precondition
The last reported figure was 6.3 GB free with high churn. Add a preflight in the daemon: refuse to create a worktree or start a build below a configured free-space floor, and cap total worktree size. A separate **Dev Drive (ReFS)** for worktrees and package caches is worth considering.

### 3.6 Transport choices on Windows
- **Extension to daemon:** native messaging (`com.aion.relay`, fixed extension ID, host manifest registered under HKCU). It gives caller identity that a localhost port does not.
- **Daemon to agents:** stdio for ACP, or a named pipe (`\\.\pipe\aion-<boot-id>`) with an ACL limited to the daemon and agent users.
- **If a loopback port is unavoidable** (ACPX uses a Bun loopback bridge): bind 127.0.0.1 only, require a per-boot random token, pin `Origin`, and rate-limit. Review this before reuse.
- **Phone and remote access:** keep the Tailscale route separate from this plane; do not expose the daemon on the tailnet by default.

### 3.7 Tamper-evident receipts with an external anchor
Hash-chain each receipt in SQLite (the existing recorder already does this) and have the daemon periodically **commit the chain head hash to GitHub**. A separate verifier process, ideally run by a different agent identity, recomputes the chain. This closes the known suffix-truncation gap.

### 3.8 Port, don't rebuild, the ChatGPT DOM logic
The in-page functions `fallbackTurnsEvaluate` and `pairFallbackReply`, plus `fixture-live-2026-10-16.html`, encode what the real ChatGPT page looked like on 2026-10-16 and do not depend on Playwright. Move them into a shared `chatgpt-dom` module used by the extension content script and by tests. Treat selectors as a versioned adapter with a self-test, since the UI will drift.

### 3.9 Conformance suite shared by all agents
Create a `conformance/` suite that any agent's change must pass: envelope schema validation, state-machine transition tests, grant enforcement, secret scan, path-scope tests. It replaces more mock cycles. Mocks stay as fixtures inside it.

### 3.10 Parameterize the adapter
Replace the hardcoded correlation ID and reply with per-attempt values (`AION-M1-<UTC>-<rand6>`) and a **computed challenge** (for example, a hash prefix of a nonce) rather than a fixed echo string. Keep fake-handle test paths out of production code.

## 4. Suggested build order (smallest useful slices)

1. **S0 — Direct Windows inventory:** confirm Chrome session availability, ACPX kit, local tools and existing adapter/tests. No new infrastructure.
2. **S1 — Reuse existing components:** run relevant tests, inspect ACPX, and implement only missing browser/bridge functions.
3. **S2 — Prepare shortest live-path test:** ordinary Git commit and evidence, avoid concurrent blind pushes; no git-integrator service required.
4. **S3 — Confirm adapter transport:** use working ACPX Bun loopback/native messaging capabilities; native-host build only if genuinely needed.
5. **S4 — Explicit owner go-ahead:** perform one signed-in Windows Chrome M1 live roundtrip and one negative case; record the response and AION readback.
6. **S5 — Expand only after the result:** integrate UAH/SQLite, long-running agent coordination, recovery or ChatGPT-side receipt reading based on measured need.

Each slice ends with receipts, independent verification and a `STATE.json` update.

## 5. Risks and open questions

- **ACPX unreviewed:** bytes are not in GitHub; reuse is a hypothesis until a code review happens.
- **Browser automation terms:** driving the ChatGPT web UI may conflict with the provider's terms or trigger protections (already noted in the roundtrip design). Decide whether the API route is acceptable for M1a-style use cases, and record it.
- **Playwright rule:** the "no Playwright/Puppeteer" rule has no stated rationale. Record why, or narrow it.
- **Who is "AION"?** Resolve via the M1a/M1b split.
- **Agent identity:** each local agent needs a stable identity string for receipts so builder, runner and verifier can be told apart.
- **Docs sprawl:** keep new design material in this file and the decision record; archive superseded Linux and mock docs under a `history/` folder rather than adding new files.
