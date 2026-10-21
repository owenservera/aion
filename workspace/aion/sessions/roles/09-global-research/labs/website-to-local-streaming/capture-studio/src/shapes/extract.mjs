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
  if (rule.discriminatorPath) {
    const v = rule.discriminatorPath === 'event' ? ev.event : select(ev.json, rule.discriminatorPath)[0];
    if (v !== rule.discriminator) return false;
  }
  return true;
}

export function extractRecords(rule, ev, stream) {
  const items = select(ev.json, rule.itemsPath ?? '$');
  return items.filter((x) => x && typeof x === 'object').map((item) => {
    const rec = { _rule: rule.name, _sid: ev.sid, _seq: ev.seq, _t: ev.t };
    for (const [name, p] of Object.entries(rule.fields ?? {})) { const v = select(item, p); rec[name] = v.length <= 1 ? v[0] : v; }
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
