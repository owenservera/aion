# Transcript Intake V1 — delivery receipt (2026-10-27)

Canonical production implementation:
- https://github.com/owenservera/vivim-harness/blob/main/scripts/transcript-intake.mjs
- https://github.com/owenservera/vivim-harness/blob/main/test/unit/transcript-intake.test.mjs

## Scope
Dependency-free, read-only Node >=22 CLI for OpenCode markdown exports. CLI options:
`node scripts/transcript-intake.mjs <private-export.md>`
`node scripts/transcript-intake.mjs <private-export.md> --json <private-output.json> --md <private-output.md>`

Emits SHA256, session time/id, tool counts, safe Git SHA/port observations, redacted event codes with transcript line numbers, and deduplicated top-three handoffs. No raw transcript commands, private prompts, content, credential values or paths are emitted by design; still review output before publication and keep generated JSON/MD private. Avoid writing generated outputs inside Git-tracked paths.

## Test evidence
Local offline prototype was tested with Node 22.16.0: 3 unit tests passed. The attached 8,641-line OpenCode export processed: 120 tool calls, 17 failure markers and primary BINDING_CHANGED diagnosis; final resolution unknown. After prototype test, the GitHub sources were published through repository APIs. **These GitHub-committed files have not yet been executed as fetched from remote main**, so the measured prototype tests are not claimed to validate that exact remote commit. No tests were run on owner's Windows machine. No live provider/browser sends.

## Follow-up
Local agent should run:
`node --test test/unit/transcript-intake.test.mjs`
`node scripts/transcript-intake.mjs <export.md>`
`npm run gate:fast`
and report exact HEAD, output redaction inspection and pass/fail. Review repeated events against final chronological transcript before labeling a confirmed defect. Current V1 deliberately does NOT assert automatic resolution and does NOT implement background monitoring, cross-session correlation or export integration.
