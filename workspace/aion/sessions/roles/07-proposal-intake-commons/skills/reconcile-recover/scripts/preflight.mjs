#!/usr/bin/env node
// Read-only AION Intake proposal package integrity check. Does not contact GitHub.
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, join, basename, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ID = /^ATP-\d{8}-\d{4}$/;
const SHA = /^[0-9a-f]{64}$/;
const kinds = new Set(['paste', 'file', 'url', 'authorized_connector', 'agent_submission']);
const fidelity = new Set(['EXACT_SOURCE_BYTES', 'EXACT_CAPTURED_TEXT']);
const states = new Set(['SOURCE_CAPTURED', 'DECOMPOSED', 'PUBLISHED', 'REVIEW_OPEN']);
const stamp = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s) && !Number.isNaN(Date.parse(s));

export function checkPackage(directory, indexFile) {
  const errors = [];
  const fail = (code, reason) => errors.push({ code, reason });
  const dir = resolve(directory);
  const id = basename(dir);
  if (!ID.test(id)) fail('ID', 'Proposal directory must be ATP-YYYYMMDD-NNNN');
  let root;
  try { root = realpathSync(dir); if (!lstatSync(dir).isDirectory()) fail('PATH', 'Not a directory'); }
  catch { fail('PATH', 'Proposal directory does not exist'); return { ok: false, id, errors }; }
  function local(name) {
    const candidate = join(dir, name);
    try {
      if (lstatSync(candidate).isSymbolicLink()) throw Error('symlink not allowed');
      const real = realpathSync(candidate);
      if (!real.startsWith(root + sep)) throw Error('path escapes proposal directory');
      if (!lstatSync(candidate).isFile()) throw Error('not a regular file');
      return readFileSync(candidate);
    } catch (e) { fail('FILE', name + ': ' + e.message); return null; }
  }
  const raw = local('RAW.md');
  const metaBytes = local('META.json');
  const decomposition = local('DECOMPOSITION.md');
  let meta;
  if (metaBytes) {
    try { meta = JSON.parse(metaBytes.toString('utf8')); }
    catch { fail('META', 'Invalid JSON'); }
  }
  if (decomposition && decomposition.length === 0) fail('DECOMPOSITION', 'Empty derived layer');
  if (meta) {
    for (const [key, type] of [['proposal_id','string'], ['title','string'], ['source_locator','string'], ['submitted_by','string']]) {
      if (typeof meta[key] !== type || !meta[key].trim()) fail('META_FIELD', key + ' is missing');
    }
    if (meta.schema_version !== 'aion.proposal/0.1') fail('SCHEMA', 'Unexpected META schema');
    if (meta.proposal_id !== id) fail('ID_MISMATCH', 'META ID differs from directory');
    if (!kinds.has(meta.source_kind)) fail('SOURCE_KIND', 'Unsupported source kind');
    if (!states.has(meta.intake_status)) fail('STATUS', 'This command validates complete captures, not partial/quarantined ones');
    if (!fidelity.has(meta.raw_preservation)) fail('FIDELITY', 'Complete RAW must have qualified exact preservation flag');
    if (!stamp(meta.received_at_utc) || !stamp(meta.captured_at_utc)) fail('TIMESTAMP', 'Expected explicit UTC ISO-8601 timestamps');
    if (!SHA.test(meta.raw_sha256 ?? '')) fail('HASH_FIELD', 'Missing/invalid SHA-256');
    if (!Number.isSafeInteger(meta.raw_bytes) || meta.raw_bytes < 0) fail('BYTE_FIELD', 'Invalid raw_bytes');
    if (meta.claims_verified !== false) fail('CLAIMS', 'Intake metadata must not endorse unreviewed source claims');
    if (!Array.isArray(meta.related_ids)) fail('RELATED', 'related_ids must be an array');
    if (raw) {
      const actualHash = createHash('sha256').update(raw).digest('hex');
      if (meta.raw_sha256 !== actualHash) fail('HASH_MISMATCH', 'Stored RAW SHA-256 differs');
      if (meta.raw_bytes !== raw.length) fail('BYTE_MISMATCH', 'Stored RAW byte count differs');
    }
  }
  if (indexFile) {
    try {
      const index = JSON.parse(readFileSync(resolve(indexFile), 'utf8'));
      if (index.schema_version !== 'aion.proposal-index/0.1' || !Array.isArray(index.items)) throw Error('Unsupported index schema');
      const ids = index.items.map(x => x.proposal_id ?? x.id);
      if (ids.filter(x => x === id).length > 1) fail('DUPLICATE_INDEX', 'Multiple entries for proposal ID');
      const entry = index.items.find(x => (x.proposal_id ?? x.id) === id);
      if (!entry) fail('INDEX_MISSING', 'Proposal not found in provided index');
      else if (meta?.issue_url && entry.issue_url && meta.issue_url !== entry.issue_url) fail('ISSUE_MISMATCH', 'INDEX issue URL disagrees with META');
    } catch (e) { fail('INDEX', e.message); }
  }
  return { ok: errors.length === 0, id, errors, checked: ['RAW.md', 'META.json', 'DECOMPOSITION.md', ...(indexFile ? ['INDEX.json'] : [])] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const position = args.indexOf('--index');
  const indexFile = position >= 0 ? args[position + 1] : null;
  if (position >= 0 && (!indexFile || args.length !== 3 || position !== 1)) {
    console.error('Usage: node preflight.mjs <proposal-dir> [--index <index.json>]');
    process.exitCode = 2;
  } else if (!args[0] || (position < 0 && args.length !== 1)) {
    console.error('Usage: node preflight.mjs <proposal-dir> [--index <index.json>]');
    process.exitCode = 2;
  } else {
    const result = checkPackage(args[0], indexFile);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  }
}
