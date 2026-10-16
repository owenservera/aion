#!/usr/bin/env python3
"""AION flight recorder: append-only SQLite event store with hash chain.
Usage: recorder.py [--db PATH] append SOURCE SOURCE_ID KIND JSON [--corr ID]
       recorder.py [--db PATH] verify | list"""
import sqlite3, json, hashlib, re, sys, os, datetime, argparse
DEFAULT_DB = os.path.expanduser("~/.aion/recorder.db")  # live DB kept OUT of git
GENESIS = "0"*64
SECRET_KEYS = re.compile(r"(token|secret|password|passwd|authorization|cookie|api[_-]?key|bearer)", re.I)
SECRET_VALS = [re.compile(p) for p in [r"gh[pousr]_[A-Za-z0-9]{20,}", r"github_pat_[A-Za-z0-9_]{20,}",
  r"(?i)bearer\s+[A-Za-z0-9._\-]+", r"sk-[A-Za-z0-9]{20,}", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
  r"\+?\d[\d\s\-]{8,}\d", r"\b(?:\d{1,3}\.){3}\d{1,3}\b"]]
SCHEMA = """CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL,
 source TEXT NOT NULL, source_id TEXT NOT NULL, correlation_id TEXT, kind TEXT NOT NULL,
 payload_redacted TEXT NOT NULL, prev_hash TEXT NOT NULL, hash TEXT NOT NULL UNIQUE,
 UNIQUE(source, source_id, kind));
CREATE TRIGGER IF NOT EXISTS no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append-only'); END;
CREATE TRIGGER IF NOT EXISTS no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append-only'); END;"""
def redact(o):
    if isinstance(o, dict): return {k: ("[REDACTED]" if SECRET_KEYS.search(k) else redact(v)) for k, v in o.items()}
    if isinstance(o, list): return [redact(v) for v in o]
    if isinstance(o, str):
        for p in SECRET_VALS: o = p.sub("[REDACTED]", o)
    return o
def connect(db):
    os.makedirs(os.path.dirname(os.path.abspath(db)), exist_ok=True)
    c = sqlite3.connect(db, isolation_level=None, timeout=30); c.execute("PRAGMA journal_mode=WAL"); c.executescript(SCHEMA); return c
def digest(prev, ts, source, sid, corr, kind, payload):
    return hashlib.sha256(json.dumps([prev, ts, source, sid, corr, kind, payload], separators=(",", ":")).encode()).hexdigest()
def append(c, source, sid, kind, payload, corr=None, ts=None):
    ts = ts or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    p = json.dumps(redact(payload), sort_keys=True)
    c.execute("BEGIN IMMEDIATE")
    try:
        if c.execute("SELECT 1 FROM events WHERE source=? AND source_id=? AND kind=?", (source, sid, kind)).fetchone():
            c.execute("ROLLBACK"); return None  # idempotent
        r = c.execute("SELECT hash FROM events ORDER BY id DESC LIMIT 1").fetchone(); prev = r[0] if r else GENESIS
        h = digest(prev, ts, source, sid, corr, kind, p)
        c.execute("INSERT INTO events(ts,source,source_id,correlation_id,kind,payload_redacted,prev_hash,hash) VALUES(?,?,?,?,?,?,?,?)", (ts, source, sid, corr, kind, p, prev, h))
        c.execute("COMMIT"); return h
    except Exception: c.execute("ROLLBACK"); raise
def verify(c):
    prev, n = GENESIS, 0
    for id_, ts, s, sid, corr, k, p, ph, h in c.execute("SELECT id,ts,source,source_id,correlation_id,kind,payload_redacted,prev_hash,hash FROM events ORDER BY id"):
        if ph != prev: return False, f"event {id_}: prev_hash mismatch"
        if digest(ph, ts, s, sid, corr, k, p) != h: return False, f"event {id_}: hash mismatch (tampered)"
        prev, n = h, n + 1
    return True, f"OK {n} events, head={prev}"
if __name__ == "__main__":
    a = argparse.ArgumentParser(); a.add_argument("--db", default=DEFAULT_DB); a.add_argument("cmd"); a.add_argument("args", nargs="*"); a.add_argument("--corr")
    x = a.parse_args(); c = connect(x.db)
    if x.cmd == "append": print(append(c, x.args[0], x.args[1], x.args[2], json.loads(x.args[3]), x.corr) or "DUPLICATE (ignored)")
    elif x.cmd == "verify": ok, m = verify(c); print(m); print("integrity_check:", c.execute("PRAGMA integrity_check").fetchone()[0]); sys.exit(0 if ok else 1)
    elif x.cmd == "list":
        for r in c.execute("SELECT id,ts,source,source_id,correlation_id,kind,payload_redacted,hash FROM events ORDER BY id"): print(json.dumps(r))
