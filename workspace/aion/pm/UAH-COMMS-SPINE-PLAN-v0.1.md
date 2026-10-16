# UAH Communications Spine — Execution Plan v0.1

**Decision owner:** AION (Digital CEO)  
**Program home:** ACP / Universal Agent Hub (UAH), consumed by GPM/AION and ZCode.  
**Source-of-truth policy:** Owen's Windows repositories and GitHub remotes; AION PM canonical ledger at `workspace/aion/pm/ledger.json`.  
**Status:** Planning and GitHub assignments authorized by Owen; execution remains paused under stop order pending explicit restart authorization.  
**Priority:** P0 (system multiplier).  
**Scope:** Cross-agent identity, addressing, durable message delivery and receipts, without requiring agents to share one ChatGPT conversation.

## 1. Existing seeds to reuse, before writing any transport

1. **UAH / ACP:** Agent sessions, integration contracts, policy/admission ownership.
2. **`zcode-setup/playbook/toolkit/pocket-link/`:** Existing authenticated HTTP API and `POST /api/sessions/send`, with `accepted` distinct from executed; use its adapter where applicable, not another hub.
3. **`001.PROJECTS.PM/governance/bun-github-zcode-auto-trigger-v1.md`:** Durable request envelope, local permission checks, correlation ID, deduplication and receipt states; existing GitHub transport is a bootstrap/fallback, not default live bus.
4. **IANG / IAM:** Integration relationships and provenance; don't create a second competing integration topology.
5. **GPM Cognitive OS:** Flight recorder, original intents and independent verification; events recorded once with reconciled views.
6. **VOMEGA:** Browser / MCP candidates; inspect real implementation and tests before invoking browser automation.
7. **`aion#3` and `zcode-bots#1`:** Existing ChatGPT-to-ZBot receipt goal and diagnostic-only candidate. Draft code/documentation is not proof of runtime.

**Hard rule:** Every implementation ticket must name an existing planned seed and the exact code/repo being reused. If unclear, stop at source inspection.

## 2. Intended minimal architecture

```text
AION ChatGPT UI ──[supported authenticated connector / adapter; M3]──┐
Grok BFF / PM ──[existing agent/session or HTTP adapter; M1]────────┤
ZCode / OpenCode ──[ACP/SDK/serve adapters; M4]──────────────────────┤
Android Pocket ──[existing pocket-link; later]───────────────────────┤
                                                                     ▼
                    UAH communications spine (logical service)
          trusted principal → policy → address → append → deliver → ack
                   SQLite message/outbox/inbox + cursor
                                                                     │
                  ┌──────────────────────────────────────────────────┤
                  ▼                         ▼                        ▼
             IANG topology            GPM evidence              diagnostics
             (metadata)             (flight recorder)           / receipts
```

Transport preference: reuse current ACP/session semantics; HTTP/SSE where an existing runtime supports it; MCP is the tool interface, not a blanket pub/sub replacement. GitHub stays a documented fallback transport and planning/evidence location. Do not invent a ChatGPT external connector capability or assume API/browser access is available until probed.

**Single-writer rule:** Begin with one small SQLite-backed delivery store colocated with the UAH bridge; don't duplicate IANG's canonical graph DB, and provide a migration path to attach to the agreed canonical SQLite logical model after schema reconciliation. Windows remains Owen's master. No public inbound ports or credential publication.

### Message envelope proposal (`uah.message.v1`)

```json
{
  "version": "uah.message.v1",
  "id": "UUID",
  "from": "authenticated-principal-identity",
  "to": ["logical-agent-id"],
  "channel": "logical-thread-or-project",
  "kind": "message",
  "correlation_id": "UUID",
  "created_at": "ISO-8601 UTC",
  "content_type": "text/plain",
  "body": {"text": "ping"},
  "requires_ack": true,
  "causation_id": null
}
```

`from` is informative, **not trusted** unless bound to verified transport credentials. Treat source payload as untrusted data; no text-to-command interpretation.

**Proposed delivery states:** `CREATED → ACCEPTED → PERSISTED → DELIVERED → ACKNOWLEDGED`; failures include `REJECTED/BLOCKED/EXPIRED/RETRY_PENDING`. Execution uses its separate existing `RECEIVED→ADMITTED→EXECUTED→VERIFIED` workflow, never automatically inferred from a message acknowledgment.

**Minimum data entities:** principals, endpoints, channels, memberships, messages, deliveries, delivery_attempts, consumer_cursors, acknowledgments, attachments_refs, policy_decisions, event_evidence. SQLite WAL, unique message ID/delivery key, stable per-recipient cursor, explicit TTL and storage bounds. Prefer content hashes and references for large artifacts. Preserve source, UTC stamps, sequence, version, correlation and causation for reproducibility.

## 3. Milestone gates

| Gate | Output | Must prove | Operational owner |
|---|---|---|---|
| M0 | Seed census + protocol + risk review | Existing code and trust boundaries referenced by SHA; no duplicate gateway | AION PM designs; BFF technical inventory; AION decides |
| M1 | BFF ↔ PM roundtrip | Each independent runtime sends + receives + ACKs; same correlation ID; restart not needed for first probe | BFF; PM verifies |
| M2 | Durable delivery | Offline recipient catch-up, replay, idempotency, duplicate/reordered inputs, restart/crash and denial tests | OpenCode via BFF; PM verifies |
| M3 | AION ↔ bus | Real message originating in this ChatGPT session, authenticated egress, independently read back in ChatGPT | BFF implements adapter; AION verifies |
| M4 | ZCode diagnostics | Explicit scoped owner approval; real Windows ZCode admits one read-only diagnostic, correlates receipt; no privileged expansion | ZCode via BFF; PM verifies; AION accepts |

**Go/no-go:** No migration from one gate to next based only on self-report, screenshot, GitHub issue publication or simulated tests. Require source code revision, command/test output and receiver-side proof. Negatives: forged sender, unauthorized channel, duplicate, replay, missing approval, wrong recipient, stale cursor, disconnected client.

## 4. Governance and safety

- GitHub issues in this program are **planning allocations only**, not executable dispatch. Existing D4 freeze remains.
- Owen's STOP order remains active for host actions and agent work. GitHub planning allocation does not authorize agents to begin installs, browser control, local mutation or pushes.
- Every work package has **one accountable human-readable operational owner**; GitHub assignee usernames remain unset unless independently identified and authorized. Logical agent names are not GitHub accounts.
- PM verifies evidence independently of implementer. AION is executive decision/acceptance.
- Only raise an Owen approval request when a narrowly scoped action genuinely needs it, with exact target, effects and rollback; no passwords/tokens in GitHub.
- Prefer existing Bun/SQLite toolchain, no Slack, no new repo, no mass cloning, no Linux replacement of Windows master.
- Canonical assignment tracking stays in the existing AION 100-task running ledger. These BUS issues are a bounded P0 workstream and crosslink existing AT/PM IDs; they do not reset the 100.
- Reopen pause gate only when Owen says to resume.

## 5. Work-package register / sequencing

| Package | Gate | Owner | Dependencies | Existing work references | Deliverable |
|---|---|---|---|---|---|
| BUS-01 | M0 | AION PM | None | AT-021..030, PM-000, PM-014 | Evidence-backed seed census and ADR |
| BUS-02 | M0 | AION PM | BUS-01 | AT-071..080, IAM/IANG | Envelope, auth, identity, routing and durable-state contracts |
| BUS-03 | M1 | AION BFF | BUS-01, BUS-02 | AT-001..010, PM-000 | Two-agent BFF ↔ PM ping/ack proof |
| BUS-04 | M2 | OpenCode via BFF | BUS-02, BUS-03 | AT-031..040, PM-014 | SQLite outbox/inbox, replay and crash tests |
| BUS-05 | M2 | AION PM | BUS-03, BUS-04 | AT-071..080, PM-014 | Independent security, negative-case and recovery verification |
| BUS-06 | M3 | AION BFF | BUS-02, BUS-04 | AT-021..030, PM-000 | Supported ChatGPT adapter + end-to-end receipt |
| BUS-07 | M4 | ZCode via BFF | BUS-05, BUS-06, explicit scoped owner approval | AT-041..060, PM-000 | Actual Windows ZCode read-only roundtrip |
| BUS-08 | M4 | AION PM | BUS-03..07 | AT-081..100, IANG/GPM | Registry integration, flight-recorder and accepted release evidence |

## 6. First acceptance test

AION BFF sends `PING` with a unique ID to AION PM over an authorized adapter. PM fetches it from **its own independent runtime**, returns `PONG` with the same correlation ID, and independently acknowledges persistence. Disconnect PM, enqueue a second message, reconnect and retrieve exactly once (M2 extension). Publish sanitized evidence references to canonical ledger; the content of GitHub issues is not an action trigger.

## 7. Completion / rollback

An accepted milestone requires a tested reproduction recipe, source hashes, evidence records and negative-case results. Keep compatibility with existing ACP/pocket-link contracts. A removable adapter does not mutate live config by default; runtime install/activation awaits explicit authorization. Retain an operator-documented stop control and backlog export. Never delete or archive an existing ChatGPT room/thread as part of setup.
