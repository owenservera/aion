// OpenCode 2.0 local service discovery for the Node runner (read-only).
//
// Observed on a real 2.0.32 install: `opencode service start` writes a state
// file with { id, version, url, pid, password }; the API requires HTTP Basic
// `opencode:<password>`. This reads that file and returns { url, headers }.
// It never starts the service (that is `opencode service start`, an owner
// action), never prints the password, and accepts only loopback URLs.
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function candidateStateFiles(env = process.env) {
  const home = env.HOME || env.USERPROFILE || homedir();
  const list = [];
  if (env.XDG_STATE_HOME) list.push(join(env.XDG_STATE_HOME, 'opencode', 'service.json'));
  list.push(join(home, '.local', 'state', 'opencode', 'service.json'));
  // Windows location is UNVERIFIED (no Windows host): these are guesses tried in order.
  if (env.LOCALAPPDATA) list.push(join(env.LOCALAPPDATA, 'opencode', 'service.json'), join(env.LOCALAPPDATA, 'opencode', 'state', 'service.json'));
  return list;
}

export function discoverOpenCodeService({ stateFile, env = process.env } = {}) {
  const files = stateFile ? [stateFile] : candidateStateFiles(env);
  const found = files.find((f) => existsSync(f));
  if (!found) {
    const e = new Error(`opencode_service_not_found: no service state file (looked in: ${files.join(', ')}). Start it with \`opencode service start\` or pass --opencode-state <file>.`);
    e.code = 'opencode_service_not_found';
    throw e;
  }
  const svc = JSON.parse(readFileSync(found, 'utf8'));
  if (typeof svc.url !== 'string' || !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$/.test(svc.url)) {
    throw Object.assign(new Error('opencode_service_not_loopback: refusing a non-loopback service URL'), { code: 'opencode_service_not_loopback' });
  }
  const headers = typeof svc.password === 'string' && svc.password
    ? { authorization: `Basic ${Buffer.from(`opencode:${svc.password}`).toString('base64')}` } : {};
  return { url: svc.url, headers, version: typeof svc.version === 'string' ? svc.version : null, pid: Number.isInteger(svc.pid) ? svc.pid : null, state_file: found };
}
