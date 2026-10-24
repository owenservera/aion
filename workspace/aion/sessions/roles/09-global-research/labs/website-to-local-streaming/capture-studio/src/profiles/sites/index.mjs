// Site adapter registry.
//
// Adapters live next to this file as `./<id>.mjs` and default-export a plain object (see
// src/capture/actions.mjs for the consumer). They are written by other lanes in parallel, so a
// missing or throwing adapter file is normal: it is skipped, never fatal.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const adaptersDir = path.dirname(fileURLToPath(import.meta.url));

// The sites this build knows how to drive. An adapter file may be absent at any time.
export const ADAPTER_IDS = ['chatgpt', 'claude', 'gemini', 'deepseek', 'zai', 'qwen', 'lmarena', 'minimax', 'kimi', 'duck-ai'];

const cache = new Map(); // id -> adapter object | null

function normalize(id, mod) {
  const a = mod?.default;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  if (!a.id) a.id = id;
  if (!Array.isArray(a.hosts)) a.hosts = [];
  return a;
}

export async function loadAdapter(id) {
  if (cache.has(id)) return cache.get(id);
  let adapter = null;
  try {
    const mod = await import(`./${id}.mjs`);
    adapter = normalize(id, mod);
  } catch {
    adapter = null; // missing file, syntax error or a throwing module: not our failure
  }
  cache.set(id, adapter);
  return adapter;
}

// Summaries of the adapters that actually loaded, in ADAPTER_IDS order.
export async function listAdapters() {
  const loaded = await Promise.all(ADAPTER_IDS.map((id) => loadAdapter(id)));
  return loaded.filter(Boolean).map((a) => ({
    id: a.id,
    label: a.label ?? a.id,
    hosts: a.hosts ?? [],
    url: a.url ?? null,
    hasComposer: Array.isArray(a.composer?.selectors) && a.composer.selectors.length > 0,
    sendStrategy: a.send?.strategy ?? 'both',
    requiresAuth: a.preflight?.requiresAuth ?? false,
  }));
}

function bareHost(value) {
  let v = String(value ?? '').trim().toLowerCase();
  if (!v) return '';
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
  v = v.split('/')[0].split('?')[0].split('#')[0]; // path/query/fragment
  v = v.split('@').pop(); // credentials
  v = v.replace(/:\d+$/, ''); // port
  return v.replace(/^www\./, '');
}

// Accepts an adapter id ('claude'), a host ('claude.ai', 'www.claude.ai'), or a full URL.
export async function getAdapter(idOrHost) {
  const raw = String(idOrHost ?? '').trim().toLowerCase();
  if (!raw) return null;

  if (ADAPTER_IDS.includes(raw)) {
    const direct = await loadAdapter(raw);
    if (direct) return direct;
  }

  const host = bareHost(raw);
  if (!host) return null;

  for (const id of ADAPTER_IDS) {
    const a = await loadAdapter(id);
    if (!a) continue;
    const hosts = [a.id, ...(a.hosts ?? [])].map(bareHost).filter(Boolean);
    if (hosts.some((h) => h === host || host.endsWith(`.${h}`))) return a;
    if (a.url && bareHost(a.url) === host) return a;
  }
  return null;
}
