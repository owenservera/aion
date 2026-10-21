import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VERSION = JSON.parse(readFileSync(path.join(TOOL_ROOT, 'package.json'), 'utf8')).version;

// Captured data is private and lives OUTSIDE the repository by default.
export function defaultDataDir(env = process.env, platform = process.platform) {
  if (env.CAPTURE_STUDIO_HOME) return env.CAPTURE_STUDIO_HOME;
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'AION', 'capture-studio');
  if (platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'AION', 'capture-studio');
  return path.join(env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'aion-capture-studio');
}

export function dataPaths(dataDir = defaultDataDir()) {
  return {
    root: dataDir,
    sessions: path.join(dataDir, 'sessions'),
    profiles: path.join(dataDir, 'profiles'),
    families: path.join(dataDir, 'families'),
    chromeProfile: path.join(dataDir, 'chrome-profile'),
  };
}

// Content hash of the collector source, recorded in every session as provenance.
let cachedSha;
export function collectorSourceSha() {
  if (cachedSha) return cachedSha;
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(mjs|js|html|json)$/.test(name)) { h.update(path.relative(TOOL_ROOT, p).replaceAll('\\', '/')); h.update(readFileSync(p)); }
    }
  };
  walk(path.join(TOOL_ROOT, 'src'));
  cachedSha = h.digest('hex').slice(0, 16);
  return cachedSha;
}
