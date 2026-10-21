// Apply accepted profile rules to decoded events -> structured records (datasets).
import { templateUrl } from './infer.mjs';

// Minimal JSONPath: $.a.b, $.a[*].b, $["weird key"], $[0]
export function select(value, path) {
  if (!path || path === '$') return [value];
  const tokens = [];
  const re = /\.([A-Za-z_$][\w$]*)|\[\*\]|\[(\d+)\]|\["((?:[^"\\]|\\.)*)"\]/g;
  let m, rest = path.replace(/^\$/, '');
  while ((m = re.exec(rest))) tokens.push(m[1] !== undefined ? { key: m[1] } : m[2] !== undefined ? { index: Number(m[2]) } : m[3] !== undefined ? { key: JSON.parse(`"${m[3]}"`) } : { star: true });
  let cur = [value];
  for (const t of tokens) {
    const next = [];
    for (const v of cur) {
      if (v === null || v === undefined) continue;
      if (t.star) { if (Array.isArray(v)) next.push(...v); else if (typeof v === 'object') next.push(...Object.values(v)); }
      else if (t.index !== undefined) { if (Array.isArray(v) && v[t.index] !== undefined) next.push(v[t.index]); }
      else if (typeof v === 'object' && t.key in v) next.push(v[t.key]);
    }
    cur = next;
  }
  return cur;
}

export function ruleMatchesEvent(rule, ev, stream) {
  if (rule.source !== 'event' || ev.json === undefined) return false;
  if (rule.endpoint && !new RegExp(rule.endpoint).test(templateUrl(stream?.url ?? ''))) return false;
  const disc = (d) => !d.discriminatorPath || (d.discriminatorPath === 'event' ? ev.event : select(ev.json, d.discriminatorPath)[0]) === d.discriminator;
  if (rule.anyOf) return rule.anyOf.some(disc);
  return disc(rule);
}

export function extractRecords(rule, ev, stream) {
  const items = select(ev.json, rule.itemsPath ?? '$');
  return items.filter((x) => x && typeof x === 'object' && (!rule.itemFilter || select(x, rule.itemFilter.path)[0] === rule.itemFilter.equals)).map((item) => {
    const rec = { _rule: rule.name, _sid: ev.sid, _seq: ev.seq, _t: ev.t };
    for (const [name, spec] of Object.entries(rule.fields ?? {})) {
      const f = typeof spec === 'string' ? { path: spec } : spec;
      if (f.exclude) continue;
      const v = select(item, f.path);
      rec[f.as ?? name] = coerce(v.length <= 1 ? v[0] : v, f.type);
    }
    if (rule.key) rec._key = select(item, rule.key)[0];
    return rec;
  });
}

// For "assembled" rules: records from the final assembled document of a delta stream.
export function extractFromAssembled(rule, doc, stream) {
  if (rule.source !== 'assembled' || !doc) return [];
  if (rule.endpoint && !new RegExp(rule.endpoint).test(templateUrl(stream?.url ?? ''))) return [];
  return extractRecords({ ...rule, source: 'event' }, { json: doc, sid: stream.sid, seq: null, t: stream.endT }, stream);
}

// Field types chosen in the model editor are applied on output; the raw value stays on disk.
export function coerce(v, type) {
  if (v === undefined || v === null || !type || type === 'auto') return v;
  try {
    if (type === 'number') { const n = typeof v === 'number' ? v : Number(v); return Number.isNaN(n) ? v : n; }
    if (type === 'string' || type === 'text') return typeof v === 'string' ? v : JSON.stringify(v);
    if (type === 'boolean') return typeof v === 'boolean' ? v : ['true', '1', 'yes'].includes(String(v).toLowerCase());
    if (type === 'time') { const d = typeof v === 'number' ? new Date(v < 1e12 ? v * 1000 : v) : new Date(v); return Number.isNaN(d.getTime()) ? v : d.toISOString(); }
    if (type === 'json') return typeof v === 'string' ? JSON.parse(v) : v;
  } catch { return v; }
  return v;
}
