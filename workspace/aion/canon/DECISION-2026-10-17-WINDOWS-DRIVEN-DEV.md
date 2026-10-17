# DECISION 2026-10-17 — Windows-driven development with local agents

Status: **DIRECTION ADOPTED (owner instruction, 2026-10-17)**. Items marked **PROPOSED** are suggestions awaiting owner confirmation.
Authority: Owen, direct instruction in the AION repo review conversation: "we are going to switch to Windows driven dev with my local agents running the code and working with you and ChatGPT."
Supersedes: Linux-first and cloud-sandbox-first execution assumptions in earlier docs (kept as history, not deleted).
Does **not** change: the M1 acceptance contract, the evidence rules, or the host/browser stop order (see section 5).

## 1. What changed

| Before | Now |
|---|---|
| BFF Linux (Grok Bot) was the planned executor, then "optional" | **Owner's Windows machine is where code is developed, run and tested** |
| Z.ai sandbox and mock fixtures drove progress | Mocks are retained as regression fixtures; **no new mock-only cycles** |
| Code written under a "Grok Bot never writes code" rule | Local Windows agents write and run code; the Grok rule stays for Grok only |
| ChatGPT-side AION was the center of coordination | ChatGPT (AION role) and Claude are **collaborators and reviewers** working with the local agents through the repo |
| GitHub was both ledger and a hoped-for transport | GitHub is the durable ledger and review surface only |

## 2. Roles (initial split — PROPOSED, edit freely)

| Actor | Role | Can do | Cannot do |
|---|---|---|---|
| **Owen** | Sole authority | Scoped authorizations, credentials, subjective acceptance | n/a |
| **Local Windows agents** (ZCode, OpenCode, Codex, Claude Code, others the owner installs) | Execution | Author code, run tests and builds, operate the browser **once authorized**, write receipts | Act outside an authorization grant; self-verify their own proof |
| **ChatGPT — AION role** | Executive and verifier | Decisions, architecture, independent readback, review of receipts via repo/connectors | Act without an invocation; claim execution on any machine |
| **Claude** | Architecture review, patches and docs, independent receipt checks | Read/clone repo, run tests in its own sandbox, propose changes via commit | Touch the Windows host directly; claim live results |
| **BFF Linux / Grok Bot** | Optional secondary executor | Linux-side tests and evidence | Override Windows authority; author code |
| **Z.ai** | Disposable sandbox | Mock-only experiments | Anything live |

Verification principle: same agent may build, test and report routine work; independent verification is reserved for actual M1 acceptance, security-critical boundary changes and contested evidence. Do not manufacture three identities for each change.

## 3. Working agreement

1. **Windows first.** Anything that matters is proven on the Windows machine. Cloud or Linux results are supporting evidence only.
2. **Simple Git first:** target `main` and use ordinary pull/commit/push with non-fast-forward/conflict checks. Local worktrees are useful for genuine concurrent work but optional. A single integrator daemon may be added only if measured push races justify it; it is not required now.
3. **Proof before status.** Unchanged from `STATE-PROTOCOL.md`.
4. **Agents read `AGENTS.md` at the repo root first**, then `STATE.json`.
5. **Handoff when needed:** a short `AION_HANDOFF_V1` is useful for unfinished work or a cross-agent transfer, not a mandatory ritual after every local change.

## 4. M1 split (PROPOSED — needs owner confirmation)

The M1 contract asks a ChatGPT-hosted AION to "originate" a message and read the reply "without owner relay". A ChatGPT conversation cannot act without a user turn, and nothing pushes into an existing conversation (see `ops/proposals/AION-BFF-002-M1-chatgpt-roundtrip-design.md`, sections 2 and 5). Proposal:

- **M1a (local, fully automatable):** a Windows-local runtime originates a uniquely correlated prompt, the browser adapter submits it into the authenticated ChatGPT web app, the real reply is captured, and the same runtime consumes it. Negative case and independent verification as in the existing contract.
- **M1b (ChatGPT-side reads):** the ChatGPT-side AION reads the receipt through a connector or scheduled task and reports a checkable detail. This requires an invocation and is stated as such.

Until the owner confirms, `AION-MILESTONE-1-INTROSPECTION.md` remains the canonical contract and `m1_verified` stays `false`.

## 5. Authorization (stop order unchanged)

Windows-driven development authorizes routine local coding, testing, building and non-destructive diagnostics under the user's normal machine/tool permissions. It does **not** itself lift the earlier stop order on controlling the signed-in ChatGPT browser or privileged account/host operations. A clear owner instruction in chat or an issue specifying the browser target and action is sufficient when that live step is approved—no separate policy plane, expiry field or authorization file is mandatory. `live_execution_authorized` remains `false` pending such an instruction. Optional example for auditable sessions:

```text
AION_AUTHORIZATION_V1
granted_by: Owen
granted_utc: <time>
expires_utc: <time, short window>
host: OWNER_WINDOWS_MASTER
agents_allowed: <e.g. zcode, opencode>
actions_allowed: <e.g. read Chrome tab list; send ONE message to the chatgpt.com tab titled "...">
paths_allowed: <e.g. D:\aion\work\*>
forbidden: cookies/tokens export, new logins, other tabs, installs outside the above
rollback: <how to undo>
END_AION_AUTHORIZATION_V1
```

Local code work (editing, running unit tests, building, mock fixtures on loopback) does not touch an authenticated account and can proceed under the agents' normal approval prompts. Anything that drives the signed-in browser or installs an extension needs the grant above.

## 6. Immediate next steps

1. Owner confirms or edits sections 2 and 4.
2. Build the Windows dev plane skeleton from `ARCHITECTURE-WINDOWS-DEV-v0.2-PROPOSAL.md` (daemon, ledger, envelope validation, one fake agent) — no account access needed.
3. Check free disk space on the Windows machine before any heavy work (last reported 6.3 GB free; current value unknown).
4. Obtain the ACPX source into the repo or a shared location so it can be reviewed (STATE block `ACPX_SOURCE`).
5. Owner explicitly authorizes the first signed-in browser test in ordinary language; record the instruction and observed execution proof.
