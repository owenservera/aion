# AION flight recorder (minimal)
Append-only SQLite (WAL) event log with SHA-256 hash chain. Live DB: `~/.aion/recorder.db` (never committed).
- `python3 recorder.py append SOURCE SOURCE_ID KIND 'JSON' [--corr ID]` (idempotent on source+source_id+kind; payload redacted)
- `python3 recorder.py verify` — recomputes chain, detects tampering, runs PRAGMA integrity_check
- `python3 test_recorder.py` — chain, restart, tamper, append-only triggers, idempotency, redaction, concurrency
`receipts-*.jsonl` = sanitized snapshots. Schema is minimal; AION-02's full schema (actor, stage, verification_level, …) is a TODO migration.
