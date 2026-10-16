# OpenCode coding assignment — AION-TTP-001 (bounded)

**Do not interpret publication of this file or an issue as authorization to execute.** Chief of Staff checks verified OpenCode route, running session, stop orders and a clean, appropriately authorized repo working copy first.

## Instructions to pass verbatim to the selected OpenCode session

Implement the v0.1 **AION task-to-proof manifest validator**, restricted to `workspace/aion/ops/task-to-proof/`, using the contract files and `pilot-001.task.json` in this folder. Use Node.js built-ins only. Do **not** create GitHub Actions triggers, webhooks, automatic execution of issue comments, services or privileged host changes. No Grok Bot coding.

Required files (proposed):
- `workspace/aion/ops/task-to-proof/verify.mjs` — offline CLI with JSON input; validate schema fields, correlation, SHA-256 syntax and **actual** source-file hashes when a trusted local checkout is supplied; enforce allowed path prefix; refuse source under a symlink escaping root; reject unsupported or unknown keys (see JSON Schema).
- `workspace/aion/ops/task-to-proof/verify.test.mjs` — `node --test` covering valid **EXECUTED, pending independent verifier**, plus negative wrong correlation, malformed SHA, missing artifact, failed positive case, no negative case, unsafe path, fake VERIFIED state, mismatch of file hash, unexpected fields and missing source ref.
- `workspace/aion/ops/task-to-proof/README.md` — exact usage and explicit trust boundaries.
- `workspace/aion/ops/task-to-proof/receipts/AION-TTP-001.proof.json` — ONLY when populated from real execution and real source SHA. Do not fabricate a receipt.

Recommended interface: `node verify.mjs --task PATH --proof PATH --repo-root PATH` prints a machine-readable JSON verdict and exits nonzero on rejection; `--help` describes args. Do not include executable hooks in JSON.

Use the actual OpenCode installed version and real model/session IDs. Capture `opencode session list --format json` and sanitized `opencode export SESSION_ID --sanitize` where supported. Do not publish raw/private sessions or native share URLs by default. A session listed does not prove it ran this task.

If a normal commit to `main` can be produced safely within approved repo scope, commit/push without force. Otherwise return a patch and a reason; never run a risky push. Coordinate with CoS to avoid root shared-checkout autopush races.

## Independent acceptance by AION

Fetch the exact GitHub commit and changed files, recompute file SHA-256, run `node --test` independently, inspect all negative tests, and record an explicit VERIFIED/REJECTED judgment with correlation `AION-TTP-001-20261016`. Do not accept the implementer's self-report as independent proof.

### Failure/stop conditions

No confirmed OpenCode executor route, unapproved host scope, source drift, security stop order, checkout conflict, missing test receipts, or artifact path outside `workspace/aion/ops/task-to-proof/` → **BLOCKED/REJECTED with exact failing gate**, not implicit authorization or optimistic PASS.

### Target small pilot

The implementer delivers one reusable code validator + tests. A second independent reviewer checks those tests and output. No generalized scheduler until *this* pilot passes.
