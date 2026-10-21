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

## Deterministic integrity preflight (Node, read-only)

After receiving all three *actual* per-proposal files, run the bundled helper from the AION repository root:

```sh
node workspace/aion/sessions/roles/07-proposal-intake-commons/skills/reconcile-recover/scripts/preflight.mjs workspace/aion/shared/technical-proposals/proposals/ATP-YYYYMMDD-NNNN
# After the item is really published into INDEX.json:
node workspace/aion/sessions/roles/07-proposal-intake-commons/skills/reconcile-recover/scripts/preflight.mjs workspace/aion/shared/technical-proposals/proposals/ATP-YYYYMMDD-NNNN --index workspace/aion/shared/technical-proposals/INDEX.json
# Offline positive and negative tests:
node --test workspace/aion/sessions/roles/07-proposal-intake-commons/skills/reconcile-recover/scripts/preflight.test.mjs
```

The helper checks **stored RAW SHA-256 and byte size**, required metadata/state and timestamp shape, matching ATP ID, derived file presence, input symlinks, and (optional) index membership, duplicate ID and issue URL coherence. It emits JSON and uses exit `0` for pass, `1` for validation failures, `2` for malformed CLI use. The helper neither rewrites sources nor touches GitHub or grants.

**Do not overclaim:** passing this local package preflight cannot prove an upstream document's bytes, provenance rights, reviewer identity, real GitHub issue existence, or an independently accepted decision. Fetch real GitHub artifacts/issues separately as required above. A partial/quarantined source is *intentionally not a complete-package pass*; do not fabricate or silently repair it. The script requires Node on the executing host and a complete local checkout; remote GitHub authoring is not proof it ran on Windows/OpenCode/ZCode.

Implementation and tests: [scripts/preflight.mjs](scripts/preflight.mjs) · [scripts/preflight.test.mjs](scripts/preflight.test.mjs).
