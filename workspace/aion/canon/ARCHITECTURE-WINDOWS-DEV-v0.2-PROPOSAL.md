# AION Windows dev plane — architecture proposal v0.2

Status: **PROPOSAL, not installed, nothing here is verified on a Windows machine.** Written 2026-10-17 as a companion to [the decision record](./DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md). It builds on, and does not replace, the [Chrome Relay design](../ops/chrome-relay/ARCHITECTURE.md), the [relay envelope](../ops/chrome-relay/ENVELOPE-CONTRACT.md) and the [Windows M1 architecture](./AION-M1-WINDOWS-MASTER-EXECUTION.md).

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

- **Host plane:** `aiond` is the single owner of state changes on the machine. Everything else asks it.
- **Agent plane:** ZCode, OpenCode, Codex and Claude Code run as workers behind ACP. The daemon is the ACP client, as the relay design already says.
- **Edge plane:** the Chrome extension (reuse ACPX if review passes) talks to the daemon over native messaging. It cannot grant itself permissions.
- **Ledger plane:** an append-only local SQLite log is the source of truth for jobs and receipts. GitHub holds the shared audit copy and anchors.
- **Policy plane:** authorizations are data the daemon enforces, not prose it is trusted to remember.

## 3. Architectural suggestions

### 3.1 Make the stop order enforceable
Today the stop order is a sentence in a Markdown file. Turn it into a signed or owner-written **grant file** (the `AION_AUTHORIZATION_V1` fields in the decision record). The daemon refuses any browser or install action without a valid, unexpired grant whose scope matches. This also gives verifiers an artifact to check.

### 3.2 One envelope for browser and agent traffic
Reuse the relay envelope v0.1 for local agent jobs as well, so there is a single schema and a single pair of state machines (task and delivery). Add a `lease_expires_at` and a heartbeat to the task machine so a crashed agent's job becomes reclaimable. If your existing lease-based build control plane already models this, adopt its semantics rather than inventing another queue.

### 3.3 One git integrator
The autopush loop (root, every 60 s, `git add -A`, no gate) is the wrong pattern for multiple agents. Instead:
- Each agent works in its own **local git worktree** on a local-only branch.
- Agents submit a finished change to the daemon as a job result (commit hash plus test output).
- The daemon runs the gate (tests, secret scan, size check), rebases onto `main`, fast-forwards and pushes. It is the only pusher.
This keeps "one public branch" while removing races with other writers, including the cloud-side assistants that commit through GitHub.

### 3.4 Isolate agents; the ACP hole is real
The repo already records that native ACP tool behavior is not fully governed by the host approval layer. On Windows, prefer defense in depth:
- Run agents under a **dedicated low-privilege Windows user**, or in WSL2 / Windows Sandbox for risky tasks.
- Put each agent process in a **Job Object** with CPU, memory and process-count limits and kill-on-close.
- Restrict agent file access to its worktree path with ACLs; give the daemon a separate, protected state directory.
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

1. **S0 — Skeleton, no accounts touched.** `aiond` with SQLite ledger, envelope validation, job lease, grant parser, disk preflight. Passes the conformance suite with a fake agent.
2. **S1 — One real local agent over ACP.** Run one task in a worktree, produce a receipt, verify it from another process.
3. **S2 — Git integrator.** Gate and push `main` from the daemon; retire autopush for this machine.
4. **S3 — Native messaging hello.** Extension and host handshake, restart recovery, read-only status. Still no ChatGPT interaction.
5. **S4 — Authorization.** Owner issues a scoped grant; M1a live test (one message, one reply, one negative case).
6. **S5 — M1b and role expansion.** ChatGPT-side reads receipts; add Claude and additional agents.

Each slice ends with receipts, independent verification and a `STATE.json` update.

## 5. Risks and open questions

- **ACPX unreviewed:** bytes are not in GitHub; reuse is a hypothesis until a code review happens.
- **Browser automation terms:** driving the ChatGPT web UI may conflict with the provider's terms or trigger protections (already noted in the roundtrip design). Decide whether the API route is acceptable for M1a-style use cases, and record it.
- **Playwright rule:** the "no Playwright/Puppeteer" rule has no stated rationale. Record why, or narrow it.
- **Who is "AION"?** Resolve via the M1a/M1b split.
- **Agent identity:** each local agent needs a stable identity string for receipts so builder, runner and verifier can be told apart.
- **Docs sprawl:** keep new design material in this file and the decision record; archive superseded Linux and mock docs under a `history/` folder rather than adding new files.
