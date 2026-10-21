#!/usr/bin/env node
// AION Harvest: read-only AX source and identity inspection. Never edits the exchange.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_EXCHANGE = 'workspace/aion/ops/chrome-relay/harvest/EXCHANGE.jsonl';
const REQUIRED = ['id', 'kind', 'topic', 'status', 'readiness', 'evidence'];
const KINDS = new Set(['NEED', 'OFFER', 'GAP', 'DECISION']);
const PRIORITY = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function inspectExchange({ repoRoot, exchange = DEFAULT_EXCHANGE, topic = null } = {}) {
  if (!repoRoot) throw new Error('repoRoot is required');
  const root = path.resolve(repoRoot);
  const absExchange = path.resolve(root, exchange);
  if (absExchange !== root && !absExchange.startsWith(root + path.sep)) {
    throw new Error('Exchange path escapes repo root');
  }
  const lines = fs.readFileSync(absExchange, 'utf8').split(/\r?\n/);
  // AX records may use a donor-relative shorthand; resolve only named pinned donors.
  const catalog = path.join(root, 'workspace/aion/ops/chrome-relay/harvest/external/sources.json');
  const donors = new Map();
  if (fs.existsSync(catalog)) {
    const data = JSON.parse(fs.readFileSync(catalog, 'utf8'));
    for (const item of (Array.isArray(data.donors) ? data.donors : [])) {
      if (typeof item.id === 'string' && typeof item.aion_source_root === 'string') {
        donors.set(item.id, item.aion_source_root);
      }
    }
  }
  const records = [];
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const checked = new Set();
  let sourceRefs = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    let rec;
    try { rec = JSON.parse(lines[i]); }
    catch (err) { errors.push(`line ${i + 1}: invalid JSON (${err.message})`); continue; }
    if (!rec || Array.isArray(rec) || typeof rec !== 'object') {
      errors.push(`line ${i + 1}: expected JSON object`); continue;
    }
    for (const k of REQUIRED) if (typeof rec[k] !== 'string' || !rec[k].trim()) {
      errors.push(`line ${i + 1}: missing/invalid ${k}`);
    }
    if (typeof rec.id === 'string') {
      if (!/^AX-\d{4,}$/.test(rec.id)) errors.push(`line ${i + 1}: invalid id ${rec.id}`);
      if (ids.has(rec.id)) errors.push(`line ${i + 1}: duplicate id ${rec.id}`);
      ids.add(rec.id);
    }
    if (rec.kind && !KINDS.has(rec.kind)) errors.push(`line ${i + 1}: unknown kind ${rec.kind}`);
    if (rec.source_refs !== undefined && !Array.isArray(rec.source_refs)) {
      errors.push(`line ${i + 1}: source_refs must be an array`);
    }
    records.push(rec);
    const groups = [rec.source_refs, rec.implementation_refs,
      ...(Array.isArray(rec.candidate_approaches) ? rec.candidate_approaches.map(a => a?.source_refs) : [])];
    for (const refs of groups) {
      if (refs === undefined || refs === null) continue;
      if (!Array.isArray(refs)) { errors.push(`line ${i + 1}: source reference group is not an array`); continue; }
      for (const ref of refs) {
        sourceRefs++;
        if (typeof ref !== 'string' || !ref.trim()) {
          errors.push(`line ${i + 1}: empty/non-string source reference`); continue;
        }
        if (/^https:\/\//i.test(ref)) continue; // Citation, not a local file. No network request.
        if (/^[a-z]+:\/\//i.test(ref) || path.isAbsolute(ref) || /^[a-z]:[\\/]/i.test(ref)) {
          errors.push(`line ${i + 1}: unsafe reference ${ref}`); continue;
        }
        const [alias, ...rest] = ref.split('/');
        const mapped = donors.has(alias) ? path.posix.join(donors.get(alias), ...rest) : ref;
        const full = path.resolve(root, mapped);
        if (!full.startsWith(root + path.sep) || !ref.includes('/')) {
          errors.push(`line ${i + 1}: non-repository or escaping reference ${ref}`); continue;
        }
        if (checked.has(full)) continue;
        checked.add(full);
        if (!fs.existsSync(full)) warnings.push(`missing local source: ${ref}${mapped === ref ? '' : ' (resolved: ' + mapped + ')'}`);
      }
    }
  }
  // Links are cross-record AX topics; incomplete history is a warning, not adoption evidence.
  for (const rec of records) for (const id of (Array.isArray(rec.links) ? rec.links : [])) {
    if (typeof id === 'string' && /^AX-\d{4,}$/.test(id) && !ids.has(id)) {
      warnings.push(`${rec.id}: linked record ${id} not present in this exchange`);
    }
  }
  const matching = records.filter(r => !topic || r.topic === topic);
  const summary = Object.fromEntries([...KINDS].map(kind => [kind, records.filter(r => r.kind === kind).length]));
  const offers = matching.filter(r => r.kind === 'OFFER').sort((a, b) =>
    (PRIORITY[a.priority] ?? 9) - (PRIORITY[b.priority] ?? 9) || a.id.localeCompare(b.id));
  return {
    exchange, topic, count: records.length, matching: matching.length, byKind: summary,
    sourcesReferenced: sourceRefs, distinctLocalSources: checked.size,
    offers: offers.map(r => ({ id: r.id, topic: r.topic, title: r.title,
      priority: r.priority || 'unknown', evidence: r.evidence, readiness: r.readiness,
      adoption_status: r.adoption_status || 'NOT_RECORDED', next_action: r.next_action || '' })),
    errors, warnings: [...new Set(warnings)]
  };
}

function main(args) {
  const opts = { repoRoot: process.cwd(), exchange: DEFAULT_EXCHANGE, topic: null };
  let json = false, strictRefs = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--repo' || a === '--topic' || a === '--exchange') {
      if (!args[i + 1]) throw new Error(`${a} requires a value`);
      opts[{ '--repo': 'repoRoot', '--topic': 'topic', '--exchange': 'exchange' }[a]] = args[++i];
    } else if (a === '--json') json = true;
    else if (a === '--strict-refs') strictRefs = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  const report = inspectExchange(opts);
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`AX ${report.count} records; ${report.matching} matching; ${report.offers.length} offers; ${report.errors.length} errors; ${report.warnings.length} warnings`);
    for (const x of report.offers) console.log(`${x.id} [${x.priority}/${x.evidence}/${x.adoption_status}] ${x.topic}: ${x.title}`);
    for (const x of report.errors) console.error('ERROR ' + x);
    for (const x of report.warnings) console.error('WARN ' + x);
  }
  if (report.errors.length || (strictRefs && report.warnings.length)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (err) { console.error(`ERROR ${err.message}`); process.exitCode = 2; }
}
