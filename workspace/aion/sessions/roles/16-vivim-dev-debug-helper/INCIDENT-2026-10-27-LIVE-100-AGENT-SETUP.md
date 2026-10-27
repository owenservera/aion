# Incident: 2026-10-27 live-100 agent setup regression

## Evidence
User-supplied OpenCode export session ses_e81491e06ffe9UOkMpS2U8H5Yn, 19:54–20:26 local. The file itself is private and MUST NOT be committed.

Observed sequence:
- Agent repeatedly asked owner for information already discoverable from repo and misinterpreted 'real browser dry run'.
- Tried shell syntax unsuited to PowerShell (`ls -la`), producing tool errors; attempted a malformed execute tool call.
- Found native `live-100` and its no-resend journal, yet reverted to delegating per-prompt `studio chat --execute` calls.
- Dispatched 5 parallel subagent lanes for provider live effects; cancellations and redispatches followed.
- Rewrote `docs/dry-rub-tracking.md` and `docs/dry-rub-findings.md` with 'RESET' headings before establishing durable campaign ownership.
- Final subagent prompt proposed moving to the next task even after an uncertain effect, rather than a safe stop/reconciliation.

## Classification
CONFIRMED agent-procedure regression and unsafe delegation pattern; no proof that any final provider send succeeded, or that local profile was actually damaged. Do not claim runtime browser failures from this export alone.

## Canonical fixes committed in vivim-harness main
- `AGENTS.md`: native campaign route, explicit preview vs browser observation vs live send boundaries, prohibit parallel effect lanes, preserve receipts.
- `.opencode/agents/local-opencode.md`: same local agent contract plus Windows PowerShell command guidance.
- `bin/commands/chat.mjs`: second explicit `--accept-sends` acknowledgement required for live chat sends; offline preview remains available.
- `test/unit/chat-send-consent.test.mjs`: coverage of refusal without second acknowledgement and zero-effect preview.

## Still unresolved / next hardening
These changes DO NOT mechanically prevent two separately authorized CLI processes from attempting overlapping browser effects. Cross-process effect-owner arbitration must be implemented/verified at the shared browser runtime/Chrome profile boundary (not merely in one command). Do not assume this risk closed.
Remote commits have been published and readback is required. No owner's PC execution, no real-browser verification, no complete suite yet. Preserve current local worktree; sync carefully before testing. Run focused test and existing gates, inspect for older tests invoking `runChat` with `execute:true` alone and update those expectations as needed.
