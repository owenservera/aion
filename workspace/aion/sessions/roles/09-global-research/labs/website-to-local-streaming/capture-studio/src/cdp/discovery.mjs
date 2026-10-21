// DevTools HTTP discovery on loopback only.
import { assertLoopbackUrl } from './client.mjs';

export function endpointBase({ host = '127.0.0.1', port = 9222 } = {}) {
  const base = `http://${host}:${port}`;
  assertLoopbackUrl(base);
  return base;
}

async function getJson(url, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function browserVersion(opts) {
  return getJson(`${endpointBase(opts)}/json/version`);
}

export async function listTargets(opts) {
  const all = await getJson(`${endpointBase(opts)}/json/list`);
  return all.filter((t) => t.type === 'page');
}

export async function isReachable(opts) {
  try { await browserVersion(opts); return true; } catch { return false; }
}

// Resolve a user-supplied target selector: exact id, id prefix, index, or URL/title substring.
export function pickTarget(targets, selector) {
  if (selector === undefined || selector === null || selector === '') {
    if (targets.length === 1) return targets[0];
    throw new Error(`Several tabs are open; choose one with --target (run "studio targets").`);
  }
  const s = String(selector);
  const exact = targets.find((t) => t.id === s);
  if (exact) return exact;
  if (/^\d+$/.test(s) && Number(s) < targets.length) return targets[Number(s)];
  const prefix = targets.filter((t) => t.id.startsWith(s));
  if (prefix.length === 1) return prefix[0];
  const sub = targets.filter((t) => t.url.includes(s) || (t.title ?? '').toLowerCase().includes(s.toLowerCase()));
  if (sub.length === 1) return sub[0];
  if (sub.length > 1) throw new Error(`"${s}" matches ${sub.length} tabs; be more specific.`);
  throw new Error(`No tab matches "${s}".`);
}
