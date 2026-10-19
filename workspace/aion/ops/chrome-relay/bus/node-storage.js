// AION Bus — Node file storage with chrome.storage.local's shape.
//
// Used by the Node runner (CLI) and the MCP ingress, which may run as two
// processes against one state file. Guarantees:
//   - writes are atomic (temp file + rename), so a crash leaves the old or the
//     new state, never a torn file;
//   - `withLock(fn)` holds an exclusive lock file for the ledger's whole
//     read-modify-write, so two processes cannot interleave a mutation;
//   - a lock older than `staleMs` (crashed holder) is broken, and that is
//     logged, never silent.
// It stores bus metadata only (no transcripts, no credentials).

import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync, rmSync, statSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createFileStorage(path, { staleMs = 30_000, waitMs = 10_000, log = () => {} } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  let held = 0;

  function readAll() {
    if (!existsSync(path)) return {};
    const text = readFileSync(path, 'utf8');
    if (text.trim() === '') throw new Error('bus_store_corrupt: state file is empty');
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bus_store_corrupt: state file is not an object');
    return parsed;
  }

  async function acquire() {
    const deadline = Date.now() + waitMs;
    for (;;) {
      try {
        const fd = openSync(lockPath, 'wx');
        writeFileSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
        closeSync(fd);
        return;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          if (Date.now() - statSync(lockPath).mtimeMs > staleMs) { log(`breaking stale bus lock ${lockPath}`); rmSync(lockPath, { force: true }); continue; }
        } catch { continue; }
        if (Date.now() > deadline) throw Object.assign(new Error('bus_store_busy: another process holds the bus lock'), { code: 'bus_store_busy' });
        await sleep(25);
      }
    }
  }

  return {
    path,
    async get(key) {
      const all = readAll();
      return Object.hasOwn(all, key) ? { [key]: all[key] } : {};
    },
    async set(values) {
      const all = readAll();
      Object.assign(all, values);
      const tmp = `${path}.${process.pid}.tmp`;
      writeFileSync(tmp, `${JSON.stringify(all, null, 1)}\n`);
      renameSync(tmp, path);
      return true;
    },
    async withLock(fn) {
      if (held > 0) { held += 1; try { return await fn(); } finally { held -= 1; } }
      await acquire();
      held = 1;
      try { return await fn(); } finally { held = 0; rmSync(lockPath, { force: true }); }
    },
  };
}
