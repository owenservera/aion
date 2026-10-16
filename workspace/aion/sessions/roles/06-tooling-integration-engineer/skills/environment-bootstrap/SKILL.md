---
name: environment-bootstrap
description: Set up and reproduce authorized Windows and Linux AION toolchain environments with minimal permissions, documented testing and rollback.
---
# Environment Bootstrap

## Trigger
OpenCode/ZCode/runtime absent or broken, machine migration, repeatable Linux lane, task requires a new local dependency.

## Procedure
1. Resolve Windows local-master vs BFF Linux target and exact task. Use existing software HQ/config inventory; never duplicate a whole PC just because it is available.
2. Read-only preflight: OS/architecture, package manager, disk space, tool versions, existing services, ports, registry/paths, git status, pending changes.
3. Determine minimum supported version and least required privilege. Prefer portable/user-scope installs and pinned dependencies.
4. Write explicit install, test, rollback and backup steps; identify changes that require host approval. No installation follows merely from reading the skill.
5. Chief of Staff obtains executor acknowledgment and approval; OpenCode/ZCode authors scripts/implementation; Grok may operate own Linux host without code edits.
6. Perform one controlled change at a time through authorized host route; capture commands, output, exact versions, hashes and environment deltas.
7. Run smoke test, failure case, restart/recovery test if durable, verify repo commits and cleanup plan.
8. Hand capability evidence to TOOL-REGISTRY and queue next integration dependency.

## Stop conditions
Unexpected admin/elevation prompt, repo drift, low disk, modified security boundary, secret exposure, source mismatch, broken boot/input/network, absent rollback.
Stop affected change; never silently override Windows local authority.

## Completion
INSTALL_VERIFIED requires evidence of installed executable + task-level smoke + independent proof, not a setup guide.
