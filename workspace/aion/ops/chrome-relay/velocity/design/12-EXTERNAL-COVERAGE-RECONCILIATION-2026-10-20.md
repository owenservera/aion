# External implementation coverage — reconciliation with the principal-architect review

**Date:** 2026-10-20. **Inputs:** PR #51 coverage audit (`EXTERNAL-IMPLEMENTATIONS-COVERAGE.csv`, commit `6822b077`, five projects × 40 operations) and review doc 11 (PR #50). Companion data: `12-EXTERNAL-COVERAGE-RECONCILIATION-2026-10-20.csv` = the PR #51 CSV plus one column set (`DB_*`) for `DrA1ex/chatgpt-bridge@0ffdae9` (MIT). Static inspection only; no live testing. PR #51 is unmodified.

## 1. What the PR #51 audit adds
- It is the right shape: per-operation, per-project, evidence-typed (I/R/P/·), with "not established" kept distinct from "absent". Adopt its vocabulary as the matrix standard.
- Agreed: no donor establishes `chat.rename`, `message.edit`, `response.regenerate`, `steer`, `thinking.level.set`. These need targeted provider research, not donors.

## 2. What it misses (my findings)
1. **`chatgpt-bridge` is absent.** It is the only candidate with a receive plane (epoch:seq event stream with gap/reset), an observation-based send correlation, and a durable no-resend ledger. Inspected: `send` I, `observe` I, `stream` I; `reply.read`, `recover` R; `file.attach`, `session.bind` P; the rest not established. ChatGPT only.
2. **Coverage counts do not measure AION fit.** AION's gate is not "has Send" but "activates Send exactly once, never resends, binds exactly". Multi-AI Chat's `send` is `I`, but its send confirmation is *heuristic* (retry + Enter fallback) for ChatGPT and Claude; only Gemini's single-activation mode is acceptable. Credit it as a **selector/DOM donor, not a send-safety donor**.
3. **Council's 5/19 P0 is README-only (`R`).** It must not rank beside Multi-AI Chat's inspected code; treat as unverified.
4. **Receive-plane semantics are not a row.** Add three: `receive.cursor` (resumable cursor + gap), `receive.identity` (provider id vs positional), `send.correlation` (baseline-then-match vs token echo). These decide the CLI design and no 40-op row captures them.
5. **Provider breadth.** The audit lists Chinese providers only via Parallel AI (send scripts; no response reading). No Chinese provider has any `observe`/`reply.read` donor. Treat as `NOT_RESEARCHED`, with login (phone/QR) and region reachability as go/no-go checks.
6. **Dedup needed:** `agent.*`, `context.inject`, `tool.toggle` rows marked `R` for Multi-AI Chat are workflow features, not provider-conversation commands; do not count them toward conversation coverage.

## 3. Revised donor roles
| Need | Donor | Why |
|---|---|---|
| ChatGPT send/receive/recovery | `chatgpt-bridge` (sidecar, retry disabled) | Only receive plane + idempotency ledger |
| Gemini/Claude/Grok selectors | Multi-AI Chat | Provider adapters; **not** its heuristic send |
| Broader provider list, attachments, temp chats | Parallel AI | Breadth; iframe/undocumented endpoints need scrutiny |
| Live-update pattern | Council | Small, README-only so far |
| Everything else (rename/edit/regenerate/steer/thinking) | none | Targeted provider research |

## 4. Matrix rules to adopt
Cell values `U / R / I / P` from PR #51 plus tiers `FIXTURE / GUEST_LIVE / OWNER_LIVE` for AION's own tests; a row graduates only after the shared conformance fixture (two turns, no resend, rerender gap, reconnect). Chinese providers enter last, behind a per-provider reachability check.

## 5. Open
Windows support of `chatgpt-bridge` unverified; its live claims are self-reported; provider message-id stability needs the P2 spike in doc 11.
