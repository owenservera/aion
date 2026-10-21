// Adaptive learning layer.
//
//   RoleModel       multinomial naive Bayes over structural field features (small, fast,
//                   incremental, interpretable; works with very few labels)
//   ScopedLearner   instance > page > site > family > global, with explicit promotion so a
//                   local correction never silently changes unrelated sites
//   Calibrator      histogram binning (Laplace smoothed) mapping raw confidence -> observed
//                   acceptance rate, per suggestion kind; reports ECE
//   activeQuestions which single clarification would reduce the most uncertainty
//
// All state is plain JSON so learned behaviour is versionable, inspectable and reversible.
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { ROLES, PRIOR_FIELDS, PRIOR_ROLES } from './priors.mjs';
import { tokens } from './schema.mjs';

export { ROLES };

const bucket = (x, edges, labels) => { for (let i = 0; i < edges.length; i++) if (x <= edges[i]) return labels[i]; return labels[labels.length - 1]; };

// Features of one field from its induced schema description (or a compact prior tuple).
export function fieldFeatures(name, d = {}, ctx = {}) {
  const f = [];
  const toks = tokens(name);
  for (const t of toks) f.push(`tok:${t}`);
  if (toks.length) f.push(`last:${toks[toks.length - 1]}`);
  if (toks.length > 1) f.push('compound');
  const kind = d.type === 'integer' ? 'integer' : d.type;
  f.push(`kind:${kind ?? 'unknown'}`);
  if (d.string) {
    for (const fm of Object.keys(d.string.formats ?? {})) f.push(`fmt:${fm}`);
    f.push(`len:${bucket(d.string.avgLen ?? 0, [3, 12, 40, 120], ['tiny', 'short', 'medium', 'long', 'verylong'])}`);
    f.push(`uniq:${bucket(d.string.uniqueness ?? 0, [0.15, 0.6, 0.95], ['low', 'mid', 'high', 'unique'])}`);
    if (d.string.enum) f.push('enum');
  }
  if (d.number) {
    if (d.number.format) f.push(`fmt:${d.number.format}`);
    f.push(`uniq:${bucket(d.number.uniqueness ?? 0, [0.15, 0.6, 0.95], ['low', 'mid', 'high', 'unique'])}`);
    f.push(`vol:${bucket(d.number.changeRate ?? 0, [0.1, 0.5], ['static', 'some', 'volatile'])}`);
    if (Number.isInteger(d.number.min) && Number.isInteger(d.number.max)) f.push('ints');
    if (d.number.min >= 0 && d.number.max <= 1) f.push('range:unit');
  }
  if (d.boolean) f.push('kind:boolean');
  if (d.presence !== undefined) f.push(`pres:${bucket(d.presence, [0.5, 0.99], ['sparse', 'mostly', 'always'])}`);
  if (ctx.depth !== undefined) f.push(`depth:${Math.min(ctx.depth, 3)}`);
  if (ctx.inArray) f.push('in_array');
  if (ctx.isKeyCandidate) f.push('keycand');
  return f;
}

// Turn a prior tuple into a pseudo schema description so priors and live data share features.
export function priorDescription([name, kind, format, avgLen, uniq, extra = {}]) {
  const d = { type: kind };
  if (kind === 'string') d.string = { formats: format ? { [format]: 1 } : {}, avgLen: avgLen ?? 10, uniqueness: uniq ?? 0.5, ...(extra.enum ? { enum: [{}] } : {}) };
  if (kind === 'integer' || kind === 'number') d.number = { format: format ?? undefined, uniqueness: uniq ?? 0.5, changeRate: extra.volatile ? 0.8 : 0.05, min: 0, max: kind === 'integer' ? 100 : 99.5 };
  if (kind === 'boolean') d.boolean = { trueShare: 0.5 };
  return d;
}

export class RoleModel {
  constructor(state) {
    this.alpha = 0.5;
    this.classCounts = state?.classCounts ?? Object.fromEntries(ROLES.map((r) => [r, 0]));
    this.featCounts = state?.featCounts ?? Object.fromEntries(ROLES.map((r) => [r, {}]));
    this.featTotals = state?.featTotals ?? Object.fromEntries(ROLES.map((r) => [r, 0]));
    this.vocab = new Set(state?.vocab ?? []);
    this.examples = state?.examples ?? 0;
  }
  train(features, role, weight = 1) {
    if (!ROLES.includes(role)) throw new Error(`unknown role ${role}`);
    this.classCounts[role] += weight;
    for (const f of features) { this.featCounts[role][f] = (this.featCounts[role][f] ?? 0) + weight; this.featTotals[role] += weight; this.vocab.add(f); }
    this.examples += weight;
  }
  // Log-likelihood contributions (unnormalised) so several scoped models can be combined.
  logScores(features) {
    const V = Math.max(1, this.vocab.size), total = Object.values(this.classCounts).reduce((a, b) => a + b, 0);
    const out = {};
    for (const r of ROLES) {
      let s = Math.log((this.classCounts[r] + this.alpha) / (total + this.alpha * ROLES.length));
      for (const f of features) s += Math.log(((this.featCounts[r][f] ?? 0) + this.alpha) / (this.featTotals[r] + this.alpha * V));
      out[r] = s;
    }
    return out;
  }
  predict(features) { return softmax(this.logScores(features)); }
  toJSON() { return { classCounts: this.classCounts, featCounts: this.featCounts, featTotals: this.featTotals, vocab: [...this.vocab], examples: this.examples }; }
}

export function softmax(scores) {
  const m = Math.max(...Object.values(scores));
  const e = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.exp(v - m)]));
  const z = Object.values(e).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v / z]));
}

export const entropy = (dist) => -Object.values(dist).reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0);
export const argmax = (dist) => Object.entries(dist).sort((a, b) => b[1] - a[1])[0];

export function priorModel() {
  const m = new RoleModel();
  PRIOR_FIELDS.forEach((t, i) => m.train(fieldFeatures(t[0], priorDescription(t)), PRIOR_ROLES[i], 1));
  return m;
}

// Deterministic level-1 rules (no learning). Used as a baseline and for explanation.
export function heuristicRole(name, d = {}) {
  const t = tokens(name), last = t[t.length - 1] ?? '';
  const fm = d.string?.formats ?? {};
  if (d.boolean || d.type === 'boolean') return 'flag';
  if (d.number?.format || fm.iso_time || /^(created|updated|modified|timestamp|time|date|ts|at)$/.test(last)) return 'timestamp';
  if (fm.url || /^(url|href|link|src|uri)$/.test(last)) return 'url';
  if (last === 'id' && t.length > 1) return 'reference';
  if (/^(id|uuid|guid|key|slug)$/.test(last) || ((fm.uuid || fm.hex_id || fm.token_id) && (d.string?.uniqueness ?? 0) > 0.9)) return 'id';
  if (fm.uuid || fm.token_id) return 'reference';
  if (d.string?.enum) return 'category';
  if ((d.string?.avgLen ?? 0) > 60 || fm.markdown) return 'text';
  if (d.string) return 'title';
  if (d.number) return (d.number.changeRate ?? 0) > 0.3 || !Number.isInteger(d.number.max) ? 'measure' : 'count';
  return 'metadata';
}

// --------------------------------------------------------------------------------------------
// Scopes and persistence
// --------------------------------------------------------------------------------------------
export const SCOPES = ['instance', 'page', 'site', 'family', 'global'];
const SCOPE_WEIGHT = { global: 1, family: 2, site: 3, page: 4 };

export class ScopedLearner {
  constructor(dir = null) {
    this.dir = dir;
    this.global = priorModel();
    this.models = {};          // `${scope}:${name}` -> RoleModel (corrections only)
    this.overrides = {};       // instance scope: `${site}|${typeKey}|${field}` -> role (hard)
    this.corrections = [];     // provenance log of every learning signal
    this.calibrator = new Calibrator();
    if (dir) this._load();
  }

  _file() { return path.join(this.dir, 'learner.json'); }
  _load() {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this._file())) return;
    const s = JSON.parse(readFileSync(this._file(), 'utf8'));
    for (const [k, v] of Object.entries(s.models ?? {})) this.models[k] = new RoleModel(v);
    if (s.globalLearned) for (const c of s.globalLearned) this.global.train(c.features, c.role, c.weight);
    this.overrides = s.overrides ?? {};
    this.corrections = s.corrections ?? [];
    this.calibrator = new Calibrator(s.calibrator);
  }
  save() {
    if (!this.dir) return;
    const data = { version: 1, savedAt: new Date().toISOString(), models: Object.fromEntries(Object.entries(this.models).map(([k, m]) => [k, m.toJSON()])), globalLearned: this.corrections.filter((c) => c.scope === 'global' && !c.reverted).map((c) => ({ features: c.features, role: c.role, weight: c.weight })), overrides: this.overrides, corrections: this.corrections, calibrator: this.calibrator.toJSON() };
    writeFileSync(this._file() + '.tmp', JSON.stringify(data)); renameSync(this._file() + '.tmp', this._file());
  }

  _chain(ctx) {
    const c = [];
    if (ctx.family) c.push(['family', `family:${ctx.family}`]);
    if (ctx.site) c.push(['site', `site:${ctx.site}`]);
    if (ctx.site && ctx.page) c.push(['page', `page:${ctx.site}|${ctx.page}`]);
    return c;
  }

  predict(name, d, ctx = {}) {
    const key = `${ctx.site ?? ''}|${ctx.typeKey ?? ''}|${name}`;
    if (this.overrides[key]) return { dist: { [this.overrides[key]]: 1 }, role: this.overrides[key], confidence: 1, source: 'instance-override' };
    const feats = fieldFeatures(name, d, ctx);
    const total = this.global.logScores(feats);
    let source = 'prior';
    for (const [scope, k] of this._chain(ctx)) {
      const m = this.models[k]; if (!m || !m.examples) continue;
      const ls = m.logScores(feats);
      // Scoped evidence sharpens the prior; weight grows with scope specificity and examples.
      const w = SCOPE_WEIGHT[scope] * Math.min(1, m.examples / 3);
      for (const r of ROLES) total[r] += w * (ls[r] - Math.log(1 / ROLES.length));
      source = scope;
    }
    const dist = softmax(total);
    const [role, p] = argmax(dist);
    return { dist, role, confidence: p, calibrated: this.calibrator.calibrate('field_role', p), entropy: entropy(dist), source, features: feats };
  }

  // A user correction is a labelled example in exactly the scope the user chose.
  learn({ scope, name, d, ctx = {}, role, weight = 5, note }) {
    if (!SCOPES.includes(scope)) throw new Error(`scope must be one of ${SCOPES}`);
    const feats = fieldFeatures(name, d, ctx);
    const entry = { id: `c${this.corrections.length + 1}`, at: new Date().toISOString(), scope, name, role, ctx: { site: ctx.site, family: ctx.family, page: ctx.page, typeKey: ctx.typeKey }, features: feats, weight, note };
    if (scope === 'instance') this.overrides[`${ctx.site ?? ''}|${ctx.typeKey ?? ''}|${name}`] = role;
    else if (scope === 'global') this.global.train(feats, role, weight);
    else {
      const k = scope === 'family' ? `family:${ctx.family}` : scope === 'site' ? `site:${ctx.site}` : `page:${ctx.site}|${ctx.page}`;
      if (scope === 'family' && !ctx.family) throw new Error('family scope needs ctx.family');
      (this.models[k] ??= new RoleModel()).train(feats, role, weight);
    }
    this.corrections.push(entry);
    return entry;
  }

  // Undo one correction by retraining its scope from the remaining log (rollback).
  revert(id) {
    const c = this.corrections.find((x) => x.id === id);
    if (!c || c.reverted) return false;
    c.reverted = true;
    this.global = priorModel();
    this.models = {}; this.overrides = {};
    const log = this.corrections; this.corrections = [];
    for (const x of log) { if (!x.reverted) { const k = x.scope; this._replay(x, k); } this.corrections.push(x); }
    return true;
  }
  _replay(x) {
    if (x.scope === 'instance') this.overrides[`${x.ctx.site ?? ''}|${x.ctx.typeKey ?? ''}|${x.name}`] = x.role;
    else if (x.scope === 'global') this.global.train(x.features, x.role, x.weight);
    else { const k = x.scope === 'family' ? `family:${x.ctx.family}` : x.scope === 'site' ? `site:${x.ctx.site}` : `page:${x.ctx.site}|${x.ctx.page}`; (this.models[k] ??= new RoleModel()).train(x.features, x.role, x.weight); }
  }

  // Promotion candidates: the same (feature-signature, role) corrected on >= minSites sites.
  promotionCandidates(minSites = 2) {
    const by = new Map();
    for (const c of this.corrections) {
      if (c.reverted || !['site', 'page', 'instance'].includes(c.scope)) continue;
      const sig = `${c.role}|${c.features.filter((f) => f.startsWith('last:') || f.startsWith('kind:') || f.startsWith('fmt:')).sort().join(',')}`;
      const e = by.get(sig) ?? { role: c.role, signature: sig, sites: new Set(), families: new Set(), examples: [] };
      e.sites.add(c.ctx.site); if (c.ctx.family) e.families.add(c.ctx.family); e.examples.push(c.id);
      by.set(sig, e);
    }
    return [...by.values()].filter((e) => e.sites.size >= minSites).map((e) => ({ role: e.role, signature: e.signature, sites: [...e.sites], suggestedScope: e.families.size === 1 ? `family:${[...e.families][0]}` : 'global', corrections: e.examples }));
  }
}

// --------------------------------------------------------------------------------------------
// Confidence calibration (histogram binning), per suggestion kind.
// --------------------------------------------------------------------------------------------
export class Calibrator {
  constructor(state) { this.bins = state?.bins ?? {}; this.nBins = 10; }
  _b(p) { return Math.min(this.nBins - 1, Math.floor(p * this.nBins)); }
  observe(kind, p, accepted) {
    const k = (this.bins[kind] ??= Array.from({ length: this.nBins }, () => ({ n: 0, pos: 0, psum: 0 })));
    const b = k[this._b(p)]; b.n++; b.psum += p; if (accepted) b.pos++;
  }
  calibrate(kind, p) {
    const k = this.bins[kind]; if (!k) return p;
    const b = k[this._b(p)]; if (b.n < 3) return p;
    // Laplace-smoothed observed rate, shrunk toward the raw score when evidence is thin.
    const rate = (b.pos + 1) / (b.n + 2), w = Math.min(1, b.n / 20);
    return +(w * rate + (1 - w) * p).toFixed(3);
  }
  ece(kind) {
    const k = this.bins[kind]; if (!k) return null;
    const N = k.reduce((a, b) => a + b.n, 0); if (!N) return null;
    return +k.reduce((a, b) => a + (b.n ? (b.n / N) * Math.abs(b.pos / b.n - b.psum / b.n) : 0), 0).toFixed(4);
  }
  toJSON() { return { bins: this.bins }; }
}

// Static ECE for a list of (confidence, correct) pairs.
export function expectedCalibrationError(pairs, nBins = 10) {
  const bins = Array.from({ length: nBins }, () => ({ n: 0, c: 0, p: 0 }));
  for (const [p, ok] of pairs) { const b = bins[Math.min(nBins - 1, Math.floor(p * nBins))]; b.n++; b.p += p; if (ok) b.c++; }
  const N = pairs.length || 1;
  return +bins.reduce((a, b) => a + (b.n ? (b.n / N) * Math.abs(b.c / b.n - b.p / b.n) : 0), 0).toFixed(4);
}

// --------------------------------------------------------------------------------------------
// Active learning: the questions whose answers reduce the most expected uncertainty.
// items: [{ id, kind, entropy|dist, impact (instances affected), prompt, choices }]
// --------------------------------------------------------------------------------------------
export function activeQuestions(items, n = 5) {
  return items
    .map((it) => { const h = it.entropy ?? (it.dist ? entropy(it.dist) : 0); return { ...it, entropy: +h.toFixed(3), value: +(h * Math.log2(1 + (it.impact ?? 1))).toFixed(3) }; })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}
