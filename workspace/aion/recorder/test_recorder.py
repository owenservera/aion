import os, tempfile, sqlite3, unittest, threading
import recorder as R
class T(unittest.TestCase):
    def setUp(self): self.db = os.path.join(tempfile.mkdtemp(), "t.db"); self.c = R.connect(self.db)
    def test_chain_verify_and_restart(self):
        for i in range(5): R.append(self.c, "test", str(i), "k", {"i": i})
        self.c.close(); c2 = R.connect(self.db)  # restart persistence
        self.assertTrue(R.verify(c2)[0])
    def test_tamper_detected(self):
        for i in range(3): R.append(self.c, "test", str(i), "k", {"i": i})
        raw = sqlite3.connect(self.db); raw.execute("DROP TRIGGER no_update")
        raw.execute("UPDATE events SET payload_redacted='{\"i\": 99}' WHERE id=2"); raw.commit()
        ok, msg = R.verify(self.c); self.assertFalse(ok); self.assertIn("event 2", msg)
    def test_append_only_triggers(self):
        R.append(self.c, "t", "1", "k", {})
        with self.assertRaises(sqlite3.DatabaseError): self.c.execute("DELETE FROM events")
        with self.assertRaises(sqlite3.DatabaseError): self.c.execute("UPDATE events SET kind='x'")
    def test_idempotent(self):
        self.assertIsNotNone(R.append(self.c, "gh", "x", "k", {}))
        self.assertIsNone(R.append(self.c, "gh", "x", "k", {}))
    def test_redaction(self):
        R.append(self.c, "t", "r", "k", {"Authorization": "Bearer abc", "note": "tok ghp_" + "a"*30 + " mail a@b.com ip 10.0.0.5", "api_key": "zzz"})
        p = self.c.execute("SELECT payload_redacted FROM events").fetchone()[0]
        for bad in ["abc", "ghp_", "a@b.com", "10.0.0.5", "zzz"]: self.assertNotIn(bad, p)
    def test_concurrency(self):
        def w(n):
            c = R.connect(self.db)
            for i in range(20): R.append(c, "w%d" % n, str(i), "k", {})
        ts = [threading.Thread(target=w, args=(n,)) for n in range(4)]; [t.start() for t in ts]; [t.join() for t in ts]
        ok, msg = R.verify(self.c); self.assertTrue(ok, msg); self.assertIn("80 events", msg)
if __name__ == "__main__": unittest.main(verbosity=2)
