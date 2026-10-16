---
name: repo-input-output
description: Move scoped read-only sources into disposable Z.ai web sandboxes and bring back verifiable artifacts without making the remote sandbox authoritative.
---
# Repository & Artifact Handoff
**Trigger:** New Agent turn needs AION context/source, sandbox builds code, need result back in owner repos.

1. Use URL + pinned SHA/commit for reproducible inputs; public disposable fixture first, then private source only via approved least-privilege mechanism.
2. Verify `git rev-parse HEAD`, origin, clean status and allowed scope, **without asking for user cookies, GitHub PAT or browser profile secrets**.
3. Build in sandbox path detached from production; preserve a complete changed-files list and tests.
4. Prefer ZIP/patch/file download in first experiments. GitHub push only to explicitly approved destination/permission, with commit SHA and conflict-safe readback. AION canonical main is not an automatic write target from a remote sandbox.
5. Compute SHA-256 and sizes for exported artifacts; independently recompute after download. No artifact path invented from filename or screenshot.
6. If sandbox disappears or export fails, fallback to diff + manifest + test stdout; mark artifact unverified, do not claim production integration.
7. Route clean result to authorized OpenCode/ZCode reviewer or separate verifier before owner-master promotion.
**Pass:** bytes demonstrably survive sandbox boundary and can reproduce tests.
