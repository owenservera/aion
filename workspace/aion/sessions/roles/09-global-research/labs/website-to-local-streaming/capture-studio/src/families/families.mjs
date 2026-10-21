// Provider families: shared data models that many sites map into (ai-chat, data-table, ...).
// A family is DATA (entities, fields, hints, detection signals); nothing here names a specific
// website, endpoint or selector. Sites join a family through their profile's familyMappings.
import path from 'node:path';
import { TOOL_ROOT } from '../config.mjs';
import { VersionedStore } from '../store/versioned.mjs';
import { select } from '../shapes/extract.mjs';
import { templateUrl } from '../shapes/infer.mjs';

export class FamilyStore extends VersionedStore {
  constructor(dir) { super(dir, { builtinDir: path.join(TOOL_ROOT, 'families'), kind: 'family', normalize: (f) => ({ members: [], detect: [], entities: {}, ...f }) }); }

  addMember(name, profileName) {
    const f = this.load(name);
    if (f.members.includes(profileName)) return f;
    return this.save(name, { ...f, members: [...f.members, profileName] }, `member added: ${profileName}`);
  }

  // Register a brand-new family from accepted record rules (user-defined shared model).
  register(name, { description = '', entities = {}, fromProfile } = {}) {
    if (this.has(name)) throw new Error(`Family "${name}" already exists.`);
    return this.save(name, { name, description, members: fromProfile ? [fromProfile] : [], detect: [], entities }, `registered${fromProfile ? ` from ${fromProfile}` : ''}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Evidence: everything the detectors may look at, gathered once from a reducer (+ optional DOM).
// ---------------------------------------------------------------------------------------------
const ROLEISH = /(^|\.)(role|sender|from|speaker|author)$/i;

function leafWalk(v, p, out, depth = 0) {
  if (depth > 9) return;
  if (v === null || typeof v !== 'object') { (out[p] ??= []).length < 50 && out[p].push(v); return; }
  if (Array.isArray(v)) { for (const x of v.slice(0, 30)) leafWalk(x, `${p}[*]`, out, depth + 1); return; }
  for (const [k, x] of Object.entries(v)) leafWalk(x, `${p}.${k}`, out, depth + 1);
}

export function gatherEvidence(reducer, { domInspect = null, domTurns = null } = {}) {
  const summary = reducer.summary();
  const leaves = {};
  const assembled = [];
  for (const s of reducer.streams.values()) {
    for (const e of s._events ?? []) if (e.json !== undefined) leafWalk(e.json, '$', leaves);
    if (s._delta?.revisions > 0 && s._delta.doc && typeof s._delta.doc === 'object') {
      leafWalk(s._delta.doc, '$', leaves);
      const texts = s._delta.texts(1);
      assembled.push({ sid: s.sid, endpoint: `${s.method ?? 'GET'} ${templateUrl(s.url)}`, url: s.url, doc: s._delta.doc, revisions: s._delta.revisions, longest: texts[0]?.text?.length ?? 0, status: s.status, startedT: s.startedT });
    }
  }
  const roleValues = new Set();
  for (const [p, vals] of Object.entries(leaves)) if (ROLEISH.test(p)) for (const v of vals) if (typeof v === 'string' && v.length < 24) roleValues.add(v.toLowerCase());
  for (const t of domTurns ?? []) if (t.role) roleValues.add(String(t.role).toLowerCase());
  const fieldNames = new Set(Object.keys(leaves).map((p) => p.split('.').pop().replace(/\[\*\]$/, '')));
  // Numeric fields that change across observations (dashboards, tickers).
  const numericChanging = Object.entries(leaves).filter(([, vals]) => vals.length >= 3 && vals.every((v) => typeof v === 'number') && new Set(vals).size > 1).map(([p]) => p);
  return { summary, leaves, assembled, roleValues, fieldNames, numericChanging, actions: reducer.actions ?? [], domInspect, domTurns: domTurns ?? [], streams: summary.streams };
}

const SIGNALS = {
  role_pair: (ev, s) => { const hit = s.pairs.find(([a, b]) => ev.roleValues.has(a) && ev.roleValues.has(b)); return hit ? `roles ${hit.join(' and ')}` : null; },
  streaming_text: (ev, s) => { const a = ev.assembled.find((x) => x.revisions >= (s.minRevisions ?? 5) && x.longest >= (s.minChars ?? 20)); return a ? `${a.endpoint}: ${a.revisions} revisions building ${a.longest} chars` : null; },
  field_name: (ev, s) => { const n = s.names.find((x) => ev.fieldNames.has(x)); return n ? `field "${n}"` : null; },
  input_then_stream: (ev) => {
    for (const a of ev.actions) {
      if (!['enter', 'click', 'submit'].includes(a.kind)) continue;
      const st = ev.streams.find((x) => x.startedT >= a.t && x.startedT <= a.t + 3000 && ['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET'].includes(x.transport));
      if (st) return `${a.kind}${a.target?.label ? ` “${a.target.label.slice(0, 30)}”` : ''} started ${st.transport.toLowerCase()}`;
    }
    return null;
  },
  dom_role_turns: (ev) => { const roles = new Set(ev.domTurns.map((t) => t.role)); return roles.size >= 2 ? `${ev.domTurns.length} turns with roles ${[...roles].join(', ')}` : null; },
  dom_table_or_grid: (ev) => { const p = ev.domInspect?.proposals ?? []; const t = p.find((x) => x.kind === 'table' && x.rows >= 2); const g = (ev.domInspect?.a11y?.roles ?? {}); return t ? `table ${t.rows}×${t.columns}` : (g.grid || g.table) ? 'grid role in accessibility tree' : null; },
  numeric_updates: (ev) => (ev.numericChanging.length ? `${ev.numericChanging.length} changing numeric field(s), e.g. ${ev.numericChanging[0].replace(/^\$\./, '')}` : null),
  collection: (ev, s) => {
    const arr = Object.keys(ev.leaves).filter((p) => /\[\*\]\.[^.[\]]+$/.test(p));
    const groups = new Map();
    for (const p of arr) { const base = p.slice(0, p.lastIndexOf('[*]')); groups.set(base, (groups.get(base) ?? 0) + 1); }
    const best = [...groups].find(([b, n]) => n >= 2 && (ev.leaves[`${b}[*].${Object.keys(ev.leaves).find((x) => x.startsWith(b + '[*].'))?.split('.').pop()}`]?.length ?? 0) >= (s.minItems ?? 3));
    const dom = (ev.domInspect?.proposals ?? []).find((x) => x.kind === 'collection' && x.count >= (s.minItems ?? 3));
    return best ? `records at ${best[0].replace(/^\$\.?/, '') || 'root'}` : dom ? `page list of ${dom.count} items` : null;
  },
  collection_with: (ev, s) => {
    const names = [...ev.fieldNames].map((x) => x.toLowerCase());
    const ok = s.fields.every((alts) => alts.split('|').some((a) => names.some((n) => n === a || n.endsWith('_' + a))));
    return ok ? `fields ${s.fields.map((f) => f.split('|')[0]).join(', ')}` : null;
  },
  pagination: (ev) => {
    const by = new Map();
    for (const s of ev.streams) {
      try { const u = new URL(s.url); const k = `${u.host}${u.pathname}`; const pv = ['page', 'p', 'offset', 'cursor', 'after', 'start', 'skip', 'before'].map((n) => u.searchParams.get(n)).find((x) => x !== null); if (pv !== undefined) { if (!by.has(k)) by.set(k, new Set()); by.get(k).add(pv); } } catch { /* */ }
    }
    const hit = [...by].find(([, set]) => set.size >= 2);
    return hit ? `${hit[0]} fetched with ${hit[1].size} different page values` : null;
  },
  scroll_then_fetch: (ev) => {
    const sc = ev.actions.filter((a) => a.kind === 'scroll');
    const hit = sc.find((a) => ev.streams.some((x) => x.startedT >= a.t - 300 && x.startedT <= a.t + 2500 && x.policy === 'body'));
    return hit ? 'a request followed scrolling' : null;
  },
  form_steps: (ev) => { const steps = ev.actions.filter((a) => ['click', 'submit'].includes(a.kind) && /next|continue|submit|confirm|finish|done|step|send/i.test(a.target?.label ?? '')); return steps.length >= 2 ? `${steps.length} step actions (${[...new Set(steps.map((a) => a.target.label.slice(0, 16)))].join(', ')})` : null; },
  submit_then_request: (ev) => { const a = ev.actions.find((x) => (x.kind === 'submit' || (x.kind === 'click' && /submit|next|continue|send|save/i.test(x.target?.label ?? ''))) && ev.streams.some((s) => s.startedT >= x.t && s.startedT <= x.t + 2000 && s.method === 'POST')); return a ? `“${a.target?.label ?? a.kind}” sent a POST` : null; },
  dom_inputs: (ev, s) => { const i = (ev.domInspect?.proposals ?? []).find((x) => x.kind === 'inputs'); return i && i.count >= (s.minInputs ?? 3) ? `${i.count} inputs` : null; },
  headings_outline: (ev, s) => { const h = (ev.domInspect?.proposals ?? []).find((x) => x.kind === 'headings'); return h && h.count >= (s.minHeadings ?? 2) ? `${h.count} headings` : null; },
  media: (ev) => { const m = (ev.domInspect?.proposals ?? []).find((x) => x.kind === 'media'); return m && m.count ? `${m.count} media item(s)` : null; },
  static_long_text: (ev) => { const streaming = ev.streams.some((x) => ['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET'].includes(x.transport)); const len = ev.domInspect?.textLength ?? 0; return !streaming && len > 800 ? `${len} chars of page text, no streaming` : null; },
};

export function detectFamilies(families, evidence) {
  const out = [];
  for (const f of families) {
    const hits = [];
    let score = 0;
    for (const s of f.detect ?? []) {
      const fn = SIGNALS[s.signal];
      if (!fn) continue;
      const why = fn(evidence, s);
      if (why) { score += s.weight; hits.push({ signal: s.signal, label: s.label, why, weight: s.weight }); }
    }
    const max = (f.detect ?? []).reduce((a, s) => a + s.weight, 0) || 1;
    out.push({ family: f.name, score: +Math.min(1, score).toFixed(2), coverage: +(score / max).toFixed(2), evidence: hits });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------------------------
// Mapping proposals: rank observed JSON paths for each canonical field of an entity.
// ---------------------------------------------------------------------------------------------
const UUIDISH = /^[0-9a-f]{8}-[0-9a-f]{4}-|^[A-Za-z0-9_-]{10,}$/i;
const typeScore = (spec, vals) => {
  const v = vals.filter((x) => x !== null && x !== undefined);
  if (!v.length) return 0;
  const strs = v.filter((x) => typeof x === 'string');
  switch (spec.type) {
    case 'id': return strs.length === v.length && strs.every((x) => UUIDISH.test(x)) ? 1 : (v.every((x) => typeof x === 'number') ? 0.6 : 0.3);
    case 'enum': return strs.length === v.length ? (spec.valueHints?.some((h) => strs.map((s) => s.toLowerCase()).includes(h)) ? 1 : 0.3) : 0;
    case 'text': return strs.length ? Math.min(1, 0.3 + (strs.reduce((a, s) => a + s.length, 0) / strs.length) / 60) : 0;
    case 'string': return strs.length === v.length ? 0.8 : 0.2;
    case 'number': return v.every((x) => typeof x === 'number') ? 1 : 0;
    case 'time': return v.every((x) => (typeof x === 'number' && ((x > 1e9 && x < 4.2e9) || (x > 1e12 && x < 4.2e12))) || (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x))) ? 1 : 0;
    case 'url': return strs.length === v.length && strs.every((x) => /^(https?:)?\/\//.test(x) || x.startsWith('/')) ? 1 : 0;
    default: return 0.3;
  }
};
const nameScore = (spec, p, fieldName) => {
  const clean = p.replace(/^\$\.?/, '').replace(/\[\*\]/g, '');
  const last = clean.split('.').pop();
  const names = spec.names ?? [fieldName];
  let best = 0;
  for (const n of names) {
    if (clean === n || clean.endsWith('.' + n)) best = Math.max(best, n.includes('.') ? 1 : 0.9);
    else if (last === n) best = Math.max(best, 0.85);
    else if (last.toLowerCase() === n.toLowerCase().replace(/_/g, '')) best = Math.max(best, 0.7);
    else if (last.toLowerCase().includes(n.toLowerCase())) best = Math.max(best, 0.4);
  }
  return best;
};

export function proposeMapping(entitySpec, samples) {
  const leaves = {};
  for (const s of samples) leafWalk(s, '$', leaves);
  const fields = {};
  for (const [name, spec] of Object.entries(entitySpec.fields ?? {})) {
    if (spec.type === 'blocks') continue;
    const cands = [];
    for (const [p, vals] of Object.entries(leaves)) {
      const ns = nameScore(spec, p, name);
      if (ns === 0 && spec.type !== 'text') continue;
      const ts = typeScore(spec, vals);
      if (ts === 0) continue;
      let score = ns * 0.6 + ts * 0.4;
      if (spec.prefer === 'longest' && spec.type === 'text') score += Math.min(0.3, (vals.filter((v) => typeof v === 'string').reduce((a, v) => a + v.length, 0) / Math.max(1, samples.length)) / 2000);
      if (ns === 0) score *= 0.5;
      cands.push({ path: p, score: +score.toFixed(2), example: typeof vals[0] === 'string' ? vals[0].slice(0, 60) : vals[0] });
    }
    cands.sort((a, b) => b.score - a.score);
    if (cands.length) fields[name] = { path: cands[0].path, score: cands[0].score, example: cands[0].example, alternatives: cands.slice(1, 5), ...(spec.join !== undefined || cands[0].path.includes('[*]') ? { join: spec.join ?? '' } : {}), ...(spec.normalize ? { normalize: spec.normalize } : {}) };
  }
  const required = Object.entries(entitySpec.fields ?? {}).filter(([, s]) => s.required).map(([n]) => n);
  const confidence = required.length ? required.reduce((a, n) => a + (fields[n]?.score ?? 0), 0) / required.length : Object.values(fields).reduce((a, f) => a + f.score, 0) / Math.max(1, Object.keys(fields).length);
  const missing = required.filter((n) => !fields[n]);
  return { fields, confidence: +confidence.toFixed(2), missing };
}

// Apply a mapping to one source object -> canonical record (with provenance added by caller).
export function applyMapping(mapping, obj) {
  const rec = {};
  for (const [name, m] of Object.entries(mapping.fields ?? {})) {
    if (!m || m.exclude) continue;
    let vals = select(obj, m.path);
    if (m.normalize) vals = vals.map((v) => (typeof v === 'string' ? (m.normalize[v.toLowerCase()] ?? v.toLowerCase()) : v));
    let v = vals.length <= 1 ? vals[0] : (m.join !== undefined && vals.every((x) => typeof x === 'string') ? vals.join(m.join) : vals);
    if (m.type === 'number' && typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) v = Number(v);
    rec[m.as ?? name] = v;
  }
  return rec;
}

// Choose which assembled docs / samples feed a family entity, and propose the mapping.
export function proposeFamilyLink(family, evidence) {
  const proposals = [];
  if (family.name === 'ai-chat' || family.entities.message) {
    const spec = family.entities.message;
    if (spec) {
      const byEndpoint = new Map();
      for (const a of evidence.assembled) { if (a.longest < 1) continue; if (!byEndpoint.has(a.endpoint)) byEndpoint.set(a.endpoint, []); byEndpoint.get(a.endpoint).push(a.doc); }
      for (const [endpoint, docs] of byEndpoint) {
        const m = proposeMapping(spec, docs);
        if (m.fields.text && m.confidence >= 0.4) proposals.push({ entity: 'message', source: { kind: 'assembled', endpoint: endpointPattern(endpoint) }, endpointLabel: endpoint, samples: docs.length, ...m });
      }
      if (evidence.domTurns.length) proposals.push({ entity: 'message', source: { kind: 'dom-turns' }, endpointLabel: 'rendered page turns', samples: evidence.domTurns.length, fields: { role: { path: '$.role', score: 0.9 }, text: { path: '$.text', score: 0.9 }, id: { path: '$.id', score: 0.6 }, blocks: { path: '$.blocks', score: 0.9 } }, confidence: 0.85, missing: [] });
    }
  }
  return proposals.sort((a, b) => b.confidence - a.confidence);
}

export function endpointPattern(endpoint) {
  const p = endpoint.replace(/^[A-Z]+ /, '');
  return p.split('{id}').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/?#]+');
}

// Produce canonical family records from a reducer using the profile's accepted familyMappings.
export function extractFamilyRecords(profile, reducer, { session, domTurns = [] } = {}) {
  const out = {};
  if (!profile?.family) return out;
  const push = (entity, rec) => { (out[`family-${profile.family}-${entity}`] ??= []).push(rec); };
  for (const fm of profile.familyMappings ?? []) {
    if (fm.source.kind === 'assembled') {
      const re = new RegExp(fm.source.endpoint);
      for (const s of reducer.streams.values()) {
        if (!s._delta?.revisions || !re.test(templateUrl(s.url))) continue;
        const rec = applyMapping(fm, s._delta.doc);
        if (rec.text === undefined && rec.id === undefined) continue;
        push(fm.entity, { ...rec, _family: profile.family, _entity: fm.entity, _provenance: { site: profile.name, session: session?.id, source: 'network', sid: s.sid, revisions: s._delta.revisions, final: s.status === 'complete', status: s.status, t: s.endT ?? s.lastChunkT } });
      }
    } else if (fm.source.kind === 'dom-turns') {
      for (const t of domTurns) push(fm.entity, { ...applyMapping(fm, t), _family: profile.family, _entity: fm.entity, _provenance: { site: profile.name, session: session?.id, source: 'dom', domId: t.id } });
    } else if (fm.source.kind === 'event') {
      for (const s of reducer.streams.values()) for (const e of s._events ?? []) {
        if (e.json === undefined || (fm.source.endpoint && !new RegExp(fm.source.endpoint).test(templateUrl(s.url)))) continue;
        for (const item of select(e.json, fm.source.itemsPath ?? '$')) if (item && typeof item === 'object') push(fm.entity, { ...applyMapping(fm, item), _family: profile.family, _entity: fm.entity, _provenance: { site: profile.name, session: session?.id, source: 'network', sid: s.sid, seq: e.seq, t: e.t } });
      }
    }
  }
  // Link network messages to the rendered turns that show them (evidence correlation).
  const msgs = out[`family-${profile.family}-message`] ?? [];
  const net = msgs.filter((m) => m._provenance.source === 'network'), dom = msgs.filter((m) => m._provenance.source === 'dom');
  const norm = (t) => String(t ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (const n of net) {
    const probe = norm(n.text).slice(0, 80);
    if (probe.length < 10) continue;
    const d = dom.find((x) => norm(x.text).includes(probe));
    if (d) { n._provenance.renderedAs = d._provenance.domId; d._provenance.receivedIn = n._provenance.sid; }
  }
  return out;
}
