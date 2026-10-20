#!/usr/bin/env python3
"""Regenerate AION command-space SQLite from its Git-reviewed CSV source."""
import argparse
import csv
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "aion_command_matrix.csv"
OUTPUT = HERE / "aion_command_space.sqlite"
FIELDS = (
    "provider", "vendor", "surface", "command", "cli_verb", "native_path",
    "transport", "native_support", "native_entitlement", "aion_status",
    "runtime_status", "fidelity", "verification_status", "confidence",
    "priority", "documentation_url", "notes",
)
SCHEMA = """
CREATE TABLE command_matrix (
 provider TEXT NOT NULL, vendor TEXT NOT NULL, surface TEXT NOT NULL,
 command TEXT NOT NULL, cli_verb TEXT, native_path TEXT NOT NULL,
 transport TEXT NOT NULL, native_support TEXT, native_entitlement TEXT,
 aion_status TEXT, runtime_status TEXT, fidelity TEXT,
 verification_status TEXT, confidence TEXT, priority TEXT,
 documentation_url TEXT, notes TEXT,
 PRIMARY KEY (provider, surface, native_path, transport, command)
);
CREATE INDEX idx_command ON command_matrix(command, provider);
CREATE INDEX idx_pending ON command_matrix(aion_status, priority);
CREATE VIEW providers AS
 SELECT DISTINCT provider, vendor FROM command_matrix;
CREATE VIEW commands AS
 SELECT DISTINCT command, cli_verb FROM command_matrix;
CREATE VIEW routes AS
 SELECT DISTINCT provider, surface, native_path, transport, documentation_url
 FROM command_matrix;
CREATE VIEW missing_aion_paths AS
 SELECT * FROM command_matrix
 WHERE aion_status IN ('PENDING', 'PLANNED');
"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate input + existing SQLite; do not write")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    with SOURCE.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != FIELDS:
            raise SystemExit(f"Incorrect CSV columns: {reader.fieldnames}")
        rows = list(reader)
    if not rows or any(None in row or any(value is None for value in row.values()) for row in rows):
        raise SystemExit("Empty/malformed CSV")
    keys = [(r["provider"], r["surface"], r["native_path"], r["transport"], r["command"]) for r in rows]
    if len(keys) != len(set(keys)):
        raise SystemExit("Duplicate provider-route-command mapping")
    if args.check:
        if not args.output.exists():
            raise SystemExit("SQLite not yet built; run without --check first")
        db = sqlite3.connect(f"file:{args.output.resolve()}?mode=ro", uri=True)
        result = db.execute("PRAGMA integrity_check").fetchone()[0]
        actual = db.execute("SELECT COUNT(*) FROM command_matrix").fetchone()[0]
        db.close()
        if result != "ok" or actual != len(rows):
            raise SystemExit(f"DB check failed: {result}; {actual}/{len(rows)} rows")
        print(f"PASS: {actual} mappings, SQLite integrity ok")
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists():
        args.output.unlink()
    db = sqlite3.connect(args.output)
    try:
        db.executescript(SCHEMA)
        cols = ", ".join(FIELDS)
        params = ", ".join("?" for _ in FIELDS)
        db.executemany(f"INSERT INTO command_matrix ({cols}) VALUES ({params})",
                       [tuple(row[f] for f in FIELDS) for row in rows])
        db.commit()
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        print(f"Built {args.output} with {len(rows)} mappings")
    finally:
        db.close()

if __name__ == "__main__":
    main()
