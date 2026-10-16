---
name: incident-recovery
description: Restore broken AION toolchains, extension transports and worker queues using reversible bounded diagnostics, fallback and proof.
---
# Incident Recovery

## Trigger
Tool missing, ACP unavailable, GitHub sync fails, Chrome service worker restarts, native bridge exits, stuck OpenCode/ZCode job, corrupt outbox or drifted environment.

## Recovery ladder
1. Preserve owner machine stability and existing accepted jobs. Record timestamp and exact observable symptoms, impact, last known good checkpoint, machine and task IDs.
2. Classify failure: UI only; transport; host process; ACP handshake; executor; file/DB; GitHub remote; auth/security.
3. Probe least-privileged read-only health: process/version/status/log and last confirmed receipt. No credentials in logs.
4. Apply only already-authorized non-destructive recovery. A transport reconnect may replay deduplicated deliveries; it must NEVER rerun a mutating job until exact existing job status is reconciled.
5. Use fallback modes in FALLBACK-AND-ACCEPTANCE.md; do not bypass missing authorization by choosing a weaker route.
6. Verify positive recovery plus negative duplicate/expired grant cases. Confirm no loss/corruption in local SQLite or GitHub receipts.
7. Record cause, concrete fix, rollback, elapsed downtime, new regression test; update tool runbook and status.

## Hard stops
Unexpected privileged access, Windows boot/input/network/storage danger, exposed secrets, unauthorized scope expansion, conflicting git writes, unverifiable background jobs.
