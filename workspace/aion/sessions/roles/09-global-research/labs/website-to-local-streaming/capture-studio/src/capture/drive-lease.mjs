// Host-local exclusion for all foreground drivers, independent of their chosen data directory.
// A stale/unreadable owner is NOT stolen. Inspect/recover its capture before explicit removal.
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';

export const defaultLeaseRoot = () => path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'AION', 'drive-leases');
const leaseError = (code) => Object.assign(new Error(code), { code, status: 409 });
function ownerState(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return 'unknown';
  try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'ESRCH' ? 'dead' : 'unknown'; }
}
// Explicit local-library recovery only; acquisition never calls this or steals a stale directory.
export function inspectDriveLease({ port = 9222, root = defaultLeaseRoot() } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw leaseError('INVALID_PORT');
  const dir = path.join(root, String(port));
  let raw;
  try { raw = fs.readFileSync(path.join(dir, 'owner.json'), 'utf8'); }
  catch (e) { if (e.code === 'ENOENT' && !fs.existsSync(dir)) return { exists: false, port }; return { exists: true, port, ownerState: 'unknown' }; }
  try {
    const owner = JSON.parse(raw);
    if (owner.version !== 1 || owner.port !== port || typeof owner.token !== 'string' || !owner.token) throw new Error();
    return { exists: true, ...owner, ownerState: ownerState(owner.pid) };
  } catch { return { exists: true, port, ownerState: 'unknown' }; }
}

export function recoverDriveLease({ port = 9222, root = defaultLeaseRoot(), token, pid } = {}) {
  const first = inspectDriveLease({ port, root });
  if (!first.exists || !token || token !== first.token || pid !== first.pid) throw leaseError('LEASE_RECOVERY_OWNER_MISMATCH');
  if (first.ownerState !== 'dead') throw leaseError('LEASE_RECOVERY_OWNER_NOT_PROVEN_DEAD');
  const dir = path.join(root, String(port)), marker = path.join(dir, 'recovering');
  fs.mkdirSync(marker); // Exclusive recovery attempt; never recursively remove owner directories.
  try {
    const current = inspectDriveLease({ port, root });
    if (current.token !== token || current.pid !== pid || current.ownerState !== 'dead') throw leaseError('LEASE_RECOVERY_OWNER_CHANGED');
    fs.unlinkSync(path.join(dir, 'owner.json'));
  } finally { fs.rmdirSync(marker); }
  fs.rmdirSync(dir);
  return { recovered: true, port, pid };
}

export function acquireDriveLease({ port = 9222, holder, root = defaultLeaseRoot() } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Object.assign(new Error('Invalid CDP port'), { status: 400, code: 'INVALID_PORT' });
  const dir = path.join(root, String(port)), file = path.join(dir, 'owner.json');
  fs.mkdirSync(root, { recursive: true });
  try { fs.mkdirSync(dir); }
  catch (e) {
    if (e.code !== 'EEXIST') throw e;
    let owner; try { owner = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    throw Object.assign(new Error('Browser driving lease is held; uncertain owners are never silently replaced'), {
      status: 409, code: 'DRIVE_LEASE_BUSY', holder: owner?.holder ?? { kind: 'unknown', id: null },
    });
  }
  const token = randomUUID(), metadata = { version: 1, token, pid: process.pid, port, holder, createdAt: new Date().toISOString() };
  let fd;
  try {
    fd = fs.openSync(file, 'wx', 0o600); fs.writeFileSync(fd, JSON.stringify(metadata)); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
  } catch (e) {
    if (fd !== undefined) fs.closeSync(fd);
    try { fs.unlinkSync(file); fs.rmdirSync(dir); } catch {}
    throw e;
  }
  let released = false;
  return {
    token, holder, pid: process.pid,
    release() {
      if (released) return;
      let owner;
      try { owner = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw Object.assign(new Error('Lease ownership is unreadable'), { code: 'LEASE_OWNER_UNKNOWN', status: 409 }); }
      if (owner.token !== token || owner.pid !== process.pid) throw Object.assign(new Error('Lease ownership changed'), { code: 'LEASE_OWNER_CHANGED', status: 409 });
      fs.unlinkSync(file); fs.rmdirSync(dir); released = true;
    },
  };
}
