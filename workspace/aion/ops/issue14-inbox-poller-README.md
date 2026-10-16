# issue14-inbox-poller

AION-BFF-002 / Task 1. Read-only poller for GitHub issue `owenservera/aion#14` comments.

> **OBSERVATION MODE: comment bodies are never executed, evaluated, or acted upon.**
> Bodies are only flattened to one line, truncated to 120 chars, and printed/written as text.

## Run once

```bash
/workspace/aion/ops/issue14-inbox-poller.sh
```

Requires `gh` (authenticated) and `jq` on PATH.

## Paths

| What | Path |
| --- | --- |
| State dir | `/workspace/aion-bff-state` |
| Cursor file | `/workspace/aion-bff-state/issue14-poller-cursor` (integer comment id; missing/empty = 0) |
| Evidence dir | `/workspace/aion/ops/evidence` |
| Receipt | `/workspace/aion/ops/evidence/AION-BFF-002-POLLER-<YYYYMMDDTHHMMSS+ZZZZ>-receipt.md` |

Each run emits one receipt markdown file with cursor before/after, new comment count, and an
id / author / created_at / preview table. The cursor advances to the max comment id seen
(it never moves backwards). Deletes it to replay from scratch.