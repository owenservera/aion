---
name: reconcile-recover
description: Repair partial publication, concurrent INDEX writes, source gaps and score/index divergence without losing raw proposals or duplicating issues.
---
# Pool Reconciliation / Safe Recovery

## Trigger
API write failure, incomplete proposal, missing GitHub issue, concurrent index changes, source mismatch, revoked permissions or interrupted interaction.

## Recovery
1. Read actual repository paths/commits and issue comments; never trust an in-memory list after a write error.
2. Identify the last confirmed state: RAW captured? META valid? derived layer? GitHub issue? INDEX item? Comments? Rankings?
3. Preserve immutable RAW and original hash. If invalid, mark integrity issue; never rewrite source to fit current schema.
4. Refetch latest INDEX SHA; merge by stable proposal ID and latest real issue proof. Retry only idempotent/safe writes. Avoid duplicate issues after uncertain API outcomes by searching for proposal ID first.
5. Validate issue links, review comment identity and derived scoreboard. Rebuild derived index/rankings from authoritative source and issue evidence only.
6. Record recovery action, time, evidence, what remains blocked, and one next step. Escalate only genuine permission/source limitations.

## Completion
No lost accepted RAW, no duplicate proposal issue, honest statuses, working source links, score reproducible from real comments.
