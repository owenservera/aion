// Generic model discovery for a website never seen before.
//
// Input: an observation corpus — samples { value, source: { kind, group, endpoint, sid, seq, t, domId } }.
// Output: a candidate data model — record types (schema, key, field roles), relationships
// (composition, references, dangling references), merged types, family alignments — every item
// with confidence and the evidence it rests on. Nothing here knows any specific website.
import { createHash } from 'node:crypto';
import { SchemaNode, schemaSimilarity, alignFields, nameSimilarity, tokens } from './schema.mjs';
import { ScopedLearner, argmax } from './learn.mjs';

const h = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const VAL_CAP = 5000;

// ---------------------------------------------------------------------------------------------
// 1. Locate record-bearing positions and gather instances (objects) with provenance.
//    Positions: group roots, array items, dynamic-map values. Paths use [*] for both.
// ---------------------------------------------------------------------------------------------
function looksDynamicKeys(o) {
  const ks = Object.keys(o);
  return ks.length >= 3 && ks.filter((k) => /^\d+(\.\d+)*$/.test(k) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k) || /^[0-9a-f]{16,}$/i.test(k) || (/^[A-Za-z0-9_-]{16,}$/.test(k) && /\d/.test(k))).length / ks.length >= 0.8;
}

function collectInstances(value, path, out, prov, depth = 0) {
  if (depth > 12) return;
  if (Array.isArray(value)) { value.slice(0, 500).forEach((x, i) => collectInstances(x, `${path}[*]`, out, { ...prov, index: i }, depth + 1)); return; }
  if (!isObj(value)) return;
  if (looksDynamicKeys(value)) { for (const [k, x] of Object.entries(value).slice(0, 500)) collectInstances(x, `${path}[*]`, out, { ...prov, mapKey: k }, depth + 1); return; }
  const list = out.get(path) ?? [];
  if (list.length < VAL_CAP) list.push({ obj: value, prov });
  out.set(path, list);
  for (const [k, v] of Object.entries(value)) if (v && typeof v === 'object') collectInstances(v, `${path}.${k}`, out, prov, depth + 1);
}

// Envelope: a small wrapper whose meaning is "there is a payload inside" (type + data, v, o/p).
function isEnvelope(schema) {
  const f = schema.fields ?? {};
  const names = Object.keys(f);
  if (names.length > 4) return false;
  const objectChildren = names.filter((n) => f[n].type === 'object' || f[n].type === 'map' || f[n].type === 'array');
  const scalars = names.filter((n) => !objectChildren.includes(n));
  return objectChildren.length === 1 && scalars.every((n) => f[n].string?.enum || f[n].type === 'integer' || /^(type|event|kind|op|o|p|v|seq|id|version|channel|topic)$/.test(n));
}

// ---------------------------------------------------------------------------------------------
// 2. Discovery
// ---------------------------------------------------------------------------------------------
export function discoverModel(corpus, { learner = new ScopedLearner(), ctx = {}, families = [], patchGroups = new Set() } = {}) {
  const t0 = Date.now();
  const groups = new Map();
  for (const s of corpus) { const g = s.source.group; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(s); }

  const candidates = [];
  for (const [group, samples] of groups) {
    if (patchGroups.has(group)) continue; // patch streams are protocol; their assembled docs are the data
    const positions = new Map();
    for (const s of samples) collectInstances(s.value, '$', positions, s.source);
    for (const [p, inst] of positions) {
      const schemaNode = new SchemaNode();
      for (const i of inst) schemaNode.observe(i.obj);
      const schema = schemaNode.describe(p);
      if (schema.type !== 'object') continue;
      const nFields = Object.keys(schema.fields).length;
      if (nFields < 2 || inst.length < 2) continue;
      if (isEnvelope(schema) && p === '$') continue;
      candidates.push({ group, path: p, schema, instances: inst, source: samples[0].source });
    }
  }

  // Field roles + key inference per candidate.
  const types = candidates.map((c) => buildType(c, learner, ctx));
  // Drop candidates that are just a projection of a parent type's single nested object
  // (e.g. "$.author" with 2 fields inside a message) unless they repeat (arrays/maps) or carry a key.
  const kept = types.filter((t) => t.path.endsWith('[*]') || t.path === '$' || t.key || t.fields.length >= 4);

  // 3. Merge the same entity type observed in several groups/positions.
  const merged = mergeTypes(kept);

  // 4. Relationships.
  const relationships = [...composition(merged), ...references(merged)];

  // 5. Family priors as soft semantic labels.
  for (const t of merged) t.familyMatches = familyMatches(t, families);

  // 6. Unknown/opaque groups surface explicitly instead of disappearing.
  const modelled = new Set(merged.flatMap((t) => t.groups));
  const unmodelled = [...groups.keys()].filter((g) => !modelled.has(g) && !patchGroups.has(g)).map((g) => ({ group: g, samples: groups.get(g).length, reason: 'no repeated multi-field object found (scalar, opaque or single-shot payload)' }));

  return { types: merged, relationships, unmodelled, patchGroups: [...patchGroups], stats: { samples: corpus.length, groups: groups.size, candidates: candidates.length, types: merged.length, ms: Date.now() - t0 } };
}

function buildType(c, learner, ctx) {
  const { schema, instances } = c;
  const typeKey = `${c.group}|${c.path}`;
  const fields = Object.entries(schema.fields).map(([name, d]) => {
    const pr = learner.predict(name, d, { ...ctx, typeKey, inArray: c.path.endsWith('[*]') });
    return { name, path: `$.${name}`, type: d.type, nullable: d.nullable, presence: d.presence, formats: Object.keys(d.string?.formats ?? {}).concat(d.number?.format ? [d.number.format] : []), enum: d.string?.enum?.map((e) => e.value), role: pr.role, roleConfidence: +pr.confidence.toFixed(3), roleEntropy: +pr.entropy.toFixed(3), roleSource: pr.source, dist: pr.dist, schema: d };
  });
  const key = inferKey(fields, instances);
  for (const f of fields) if (key && f.name === key.field && f.role !== 'id') { f.roleNote = `chosen as identity (role model said ${f.role})`; }
  const name = suggestName(c, fields);
  const support = instances.length;
  const consistency = fields.reduce((a, f) => a + (f.presence ?? 1), 0) / Math.max(1, fields.length);
  const roleCertainty = fields.reduce((a, f) => a + f.roleConfidence, 0) / Math.max(1, fields.length);
  const confidence = +(0.3 * Math.min(1, Math.log2(1 + support) / 5) + 0.25 * (key ? key.score : 0.3) + 0.25 * consistency + 0.2 * roleCertainty).toFixed(3);
  return {
    id: `type-${h(typeKey)}`, name, groups: [c.group], paths: [{ group: c.group, path: c.path }], path: c.path, source: c.source, schema, fields, key, support,
    confidence, confidenceBasis: { support, keyScore: key?.score ?? null, consistency: +consistency.toFixed(3), roleCertainty: +roleCertainty.toFixed(3) },
    tagged: schema.tagged ?? null, instances,
  };
}

// Identity: a field that names the thing, is (nearly) unique per distinct state, and stays stable
// while other fields change across revisions.
function inferKey(fields, instances) {
  const distinctStates = new Set(instances.map((i) => JSON.stringify(i.obj))).size;
  let best = null;
  for (const f of fields) {
    if (!['string', 'integer', 'number'].includes(f.type)) continue;
    const vals = instances.map((i) => i.obj[f.name]).filter((v) => v !== undefined && v !== null);
    if (vals.length < Math.max(2, instances.length * 0.9)) continue;
    const distinct = new Set(vals.map(String));
    const perState = distinct.size / Math.max(1, Math.min(distinctStates, vals.length));
    // Revision stability: values that repeat while the rest of the object changes.
    const byVal = new Map();
    for (const i of instances) { const v = i.obj[f.name]; if (v === undefined) continue; const k = String(v); if (!byVal.has(k)) byVal.set(k, new Set()); byVal.get(k).add(JSON.stringify(i.obj)); }
    const repeatedWithChange = [...byVal.values()].filter((s) => s.size > 1).length;
    const stability = byVal.size ? repeatedWithChange / byVal.size : 0;
    const roleP = f.dist?.id ?? 0;
    const looksId = f.formats.some((x) => ['uuid', 'hex_id', 'token_id'].includes(x)) ? 1 : 0;
    const uniqueness = Math.min(1, distinct.size / vals.length + stability * (1 - distinct.size / vals.length));
    if (distinct.size < 2 && instances.length > 2) continue;
    const enumPenalty = f.enum ? 0.5 : 0;
    const score = +(0.35 * roleP + 0.3 * uniqueness + 0.15 * looksId + 0.1 * Math.min(1, perState) + 0.1 * (f.presence ?? 1) - enumPenalty).toFixed(3);
    if (!best || score > best.score) best = { field: f.name, score, basis: { roleP: +roleP.toFixed(3), uniqueness: +uniqueness.toFixed(3), idFormat: !!looksId, revisionStability: +stability.toFixed(3), distinct: distinct.size, observations: vals.length } };
  }
  return best && best.score >= 0.45 ? best : (best ? { ...best, weak: true } : null);
}

function singular(w) { return w.replace(/ies$/, 'y').replace(/(ss|us)$/, '$1').replace(/([^s])s$/, '$1'); }

function suggestName(c, fields) {
  const segs = c.path.split(/[.[\]*]+/).filter(Boolean).filter((s) => s !== '$');
  const last = segs.pop();
  if (last && !/^(data|items|results|nodes|edges|node|list|value|v|payload|body|content|response)$/i.test(last)) return singular(tokens(last).join('_') || last);
  if (last && /^(results|items|nodes|edges|list)$/i.test(last)) {
    const parent = segs.pop();
    if (parent && !/^(data|payload|response|body)$/i.test(parent)) return singular(tokens(parent).join('_'));
  }
  const disc = String(c.group).split(' :: ')[1];
  if (disc && !/^\(|^\[/.test(disc) && disc !== 'message') return singular(tokens(disc).join('_') || disc);
  const ep = String(c.group).split(' :: ')[0].replace(/^[A-Z]+ /, '').split('/').filter((x) => x && x !== '{id}' && !x.includes('.') && !/^(api|v\d+|backend|graphql)$/i.test(x));
  if (ep.length) return singular(tokens(ep[ep.length - 1]).join('_'));
  const t = fields.find((f) => f.role === 'category' && f.enum?.length === 1);
  return t ? String(t.enum[0]) : 'record';
}

// ---------------------------------------------------------------------------------------------
// Merge types that are the same entity seen in different places (e.g. list endpoint + detail
// endpoint, page 1 + page 2, history + live stream).
// ---------------------------------------------------------------------------------------------
function keyValues(t) { if (!t.key) return new Set(); return new Set(t.instances.map((i) => i.obj[t.key.field]).filter((v) => v !== undefined && v !== null).map(String)); }

function mergeTypes(types) {
  const out = [];
  for (const t of types) {
    let target = null, why = null;
    for (const o of out) {
      const sim = schemaSimilarity(o.schema, t.schema);
      const kv = keyValues(o), tv = keyValues(t);
      let overlap = 0; for (const v of tv) if (kv.has(v)) overlap++;
      const keyOverlap = tv.size ? overlap / tv.size : 0;
      const sameKeyName = o.key && t.key && nameSimilarity(o.key.field, t.key.field) > 0.8;
      if ((sim >= 0.8 && (sameKeyName || (!o.key && !t.key))) || (sim >= 0.55 && keyOverlap >= 0.3)) { target = o; why = { schemaSimilarity: sim, keyOverlap: +keyOverlap.toFixed(3) }; break; }
    }
    if (!target) { out.push({ ...t, mergedFrom: [] }); continue; }
    target.groups = [...new Set([...target.groups, ...t.groups])];
    target.paths.push(...t.paths);
    target.instances = target.instances.concat(t.instances).slice(0, VAL_CAP);
    target.support += t.support;
    target.mergedFrom.push({ id: t.id, group: t.group ?? t.groups[0], path: t.path, ...why });
    // Union of fields (keep the richer description per name).
    const have = new Set(target.fields.map((f) => f.name));
    for (const f of t.fields) if (!have.has(f.name)) target.fields.push({ ...f, presence: (f.presence ?? 1) * t.support / target.support });
    target.confidence = +Math.min(1, target.confidence + 0.05).toFixed(3);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------------------------
function composition(types) {
  const rels = [];
  for (const child of types) for (const parent of types) {
    if (child === parent) continue;
    for (const cp of child.paths) for (const pp of parent.paths) {
      if (cp.group !== pp.group || !cp.path.startsWith(pp.path + '.') && !cp.path.startsWith(pp.path + '[')) continue;
      const rest = cp.path.slice(pp.path.length);
      if ((rest.match(/\[\*\]/g) ?? []).length > 1) continue;
      rels.push({ id: `rel-${h(parent.id + child.id + 'contains')}`, kind: 'contains', from: parent.id, to: child.id, via: rest, cardinality: rest.includes('[*]') ? 'many' : 'one', confidence: 0.9, evidence: { group: cp.group, parentPath: pp.path, childPath: cp.path }, status: 'hypothesis' });
    }
  }
  return dedupeRels(rels);
}

// Inclusion dependencies: A.f values contained in B.key values => A.f references B.
function references(types) {
  const rels = [];
  const keyed = types.filter((t) => t.key && !t.key.weak).map((t) => ({ t, vals: keyValues(t) })).filter((x) => x.vals.size >= 1);
  for (const a of types) {
    for (const f of a.fields) {
      if (a.key && f.name === a.key.field) continue;
      if (!['string', 'integer', 'number'].includes(f.type)) continue;
      const vals = new Set(a.instances.map((i) => i.obj[f.name]).filter((v) => v !== undefined && v !== null && v !== '').map(String));
      if (!vals.size) continue;
      let matched = false;
      for (const b of keyed) {
        if (b.t === a && f.role !== 'reference') continue;
        let inter = 0; for (const v of vals) if (b.vals.has(v)) inter++;
        const containment = inter / vals.size;
        if (containment < 0.8 || inter < 1) continue;
        const nameHint = tokens(f.name).some((tk) => tokens(b.t.name).includes(tk) || nameSimilarity(tk, b.t.name) > 0.8) ? 0.15 : 0;
        const idLike = (f.dist?.reference ?? 0) + (f.dist?.id ?? 0);
        const support = Math.min(1, Math.log2(1 + inter) / 4);
        const confidence = +Math.min(1, 0.45 * containment + 0.2 * support + 0.2 * idLike + nameHint).toFixed(3);
        if (confidence < 0.5) continue;
        matched = true;
        rels.push({ id: `rel-${h(a.id + f.name + b.t.id)}`, kind: 'references', from: a.id, field: f.name, to: b.t.id, toField: b.t.key.field, cardinality: 'many-to-one', confidence, evidence: { containment: +containment.toFixed(3), sharedValues: inter, distinctValues: vals.size, nameHint: !!nameHint }, status: 'hypothesis' });
      }
      if (!matched && (f.role === 'reference' || /(_id|Id|_uuid)$/.test(f.name)) && f.roleConfidence > 0.4) {
        rels.push({ id: `rel-${h(a.id + f.name + 'dangling')}`, kind: 'references_unobserved', from: a.id, field: f.name, to: null, confidence: +(0.5 * f.roleConfidence).toFixed(3), evidence: { distinctValues: vals.size, reason: 'identifier-like field with no observed target entity' }, status: 'hypothesis' });
      }
    }
  }
  return dedupeRels(rels);
}

function dedupeRels(rels) { const m = new Map(); for (const r of rels) if (!m.has(r.id) || m.get(r.id).confidence < r.confidence) m.set(r.id, r); return [...m.values()]; }

// Family entities as soft priors: how well does a discovered type align with each family entity?
function familyMatches(t, families) {
  const out = [];
  for (const fam of families) for (const [ename, espec] of Object.entries(fam.entities ?? {})) {
    const pseudo = { fields: Object.fromEntries(Object.entries(espec.fields ?? {}).map(([fname, fs]) => [fname, pseudoField(fs)])) };
    if (!Object.keys(pseudo.fields).length) continue;
    // Align on flattened leaf names too (message.author.role -> role), using family name hints.
    const flat = flatLeaves(t);
    const al = alignFields(pseudo, { fields: flat }, { minScore: 0.5 });
    const req = Object.entries(espec.fields ?? {}).filter(([, fs]) => fs.required).map(([n]) => n);
    const hit = new Set(al.pairs.map((p) => p.a));
    const reqCover = req.length ? req.filter((r) => hit.has(r)).length / req.length : 0.5;
    const score = +(0.6 * reqCover + 0.4 * (al.pairs.reduce((a, p) => a + p.score, 0) / Math.max(1, Object.keys(pseudo.fields).length))).toFixed(3);
    if (score >= 0.35) out.push({ family: fam.name, entity: ename, score, mapping: Object.fromEntries(al.pairs.map((p) => [p.a, p.b])) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}

function flatLeaves(t) {
  const out = {};
  const walk = (d, prefix, depth) => {
    for (const [k, f] of Object.entries(d.fields ?? {})) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (f.type === 'object' && depth < 3) walk(f, p, depth + 1);
      else if (f.type === 'array' && f.array?.items?.type === 'string') out[p] = { ...f.array.items, type: 'string' };
      else if (f.type === 'map' && f.map?.values?.type === 'object' && depth < 3) walk(f.map.values, `${p}[*]`, depth + 1);
      else out[p] = f;
    }
  };
  walk(t.schema, '', 0);
  return out;
}

function pseudoField(fs) {
  const d = { type: fs.type === 'id' || fs.type === 'enum' || fs.type === 'text' || fs.type === 'url' || fs.type === 'time' ? 'string' : fs.type === 'number' ? 'number' : 'string' };
  d.string = { formats: fs.type === 'id' ? { uuid: 1 } : fs.type === 'url' ? { url: 1 } : fs.type === 'time' ? { iso_time: 1 } : {}, avgLen: fs.type === 'text' ? 200 : 12, uniqueness: fs.type === 'id' ? 1 : 0.5, ...(fs.type === 'enum' ? { enum: [{}] } : {}) };
  return d;
}

// Compact view for UI/API (drops instances).
export function modelSummary(m) {
  return { ...m, types: m.types.map(({ instances, schema, ...t }) => ({ ...t, fields: t.fields.map(({ schema: _s, dist, ...f }) => ({ ...f, alternatives: Object.entries(dist ?? {}).sort((a, b) => b[1] - a[1]).slice(1, 3).map(([r, p]) => ({ role: r, p: +p.toFixed(3) })) })), sampleKeys: t.key ? [...new Set(instances.map((i) => i.obj[t.key.field]))].slice(0, 5) : [] })) };
}
