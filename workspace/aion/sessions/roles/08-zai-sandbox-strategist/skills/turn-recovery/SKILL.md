---
name: turn-recovery
description: Make heavy Z.ai development turns restartable after sandbox resets, network loss or export failures using compact snapshots and existing AION GitHub state.
---
# Turn Recovery & Context Capsule
**Trigger:** Web session interrupted, sandbox reset, model changes, prompt limit, artifact export failures or partial test progress.

1. Never assume sandbox filesystem persists. Track last exported files, exact model, input SHA, command/test outputs, unresolved error and permissions.
2. Build one concise capsule: objective, source commit, completed artifacts+hashes, currently working command, blocker, negative case and one next action.
3. Save capsule as AION repo evidence (not raw credentials or private file contents); validate its readback before launching another costly turn.
4. On next new session, first test whether sandbox marker persists; if not, restore from exported source/patch at pinned SHA.
5. Do not rerun mutating external operations without checking prior receipt and idempotency.
6. Record recovery time and whether repeatability improved.
**Pass:** resumed work faithfully reconstructs prior verified source, not merely repeats high-level intentions.
