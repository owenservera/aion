#!/usr/bin/env node
// Pure metadata validator. No network access, publication, credential discovery or writes.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASIS = new Set(['SOURCE_CLAIM', 'REPO_OBSERVED', 'OFFLINE_TEST', 'LIVE_VERIFIED', 'INFERENCE', 'PROPOSAL']);
const CONFIDENCE = new Set(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']);
const STATUS = new Set(['DRAFT', 'PUBLISHED', 'ACKNOWLEDGED', 'ADOPTED', 'IMPLEMENTED', 'VERIFIED', 'REJECTED', 'DEFERRED']);
const STATUS_RECEIPT = {
  PUBLISHED: 'publication_receipt', ACKNOWLEDGED: 'ack_receipt', ADOPTED: 'decision_receipt',
  IMPLEMENTED: 'implementation_receipt', VERIFIED: 'verification_receipt',
};
const SENSITIVE_FIELD = /^(?:password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|cookies|private[_-]?transcript)$/i;
const SENSITIVE_QUERY = /^(?:password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|token|key)$/i;
const text = x => typeof x === 'string' && x.trim().length > 0;

function isLocator(s) {
  if (!text(s)) return false;
  if (/^doi:10\.\d{4,9}\/.+$/i.test(s)) return true;
  try {
    const u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') && Boolean(u.hostname)
      && ![...u.searchParams.keys()].some(k => SENSITIVE_QUERY.test(k));
  } catch { return false; }
}
function containsSensitiveField(o) {
  if (!o || typeof o !== 'object') return false;
  return Object.entries(o).some(([k, v]) => SENSITIVE_FIELD.test(k) || containsSensitiveField(v));
}
const isUtc = s => text(s) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s) && !Number.isNaN(Date.parse(s));

export function validatePacket(p) {
  const errors = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return ['packet must be a JSON object'];
  if (containsSensitiveField(p)) errors.push('sensitive credential/transcript field present; remove private payloads');
  if (!isLocator(p.source_url)) errors.push('source_url must be an HTTP(S) permalink or doi: identifier without credential query fields');
  if (!text(p.claim)) errors.push('claim must be a concise nonempty statement');
  if (!BASIS.has(p.basis)) errors.push('basis must name SOURCE_CLAIM / REPO_OBSERVED / OFFLINE_TEST / LIVE_VERIFIED / INFERENCE / PROPOSAL');
  if (!CONFIDENCE.has(p.confidence)) errors.push('confidence must be HIGH / MEDIUM / LOW / UNKNOWN');
  if (!STATUS.has(p.status)) errors.push('status is not a recognized research-delivery state');
  if (p.observed_utc !== undefined && !isUtc(p.observed_utc)) errors.push('observed_utc must be a valid UTC ISO timestamp');
  if (['DRAFT', 'PUBLISHED'].includes(p.status) && !text(p.next_action)) errors.push('next_action is required for active draft/published research');
  const receipt = STATUS_RECEIPT[p.status];
  if (receipt && !isLocator(p[receipt])) errors.push(receipt + ' required as an independently checkable permalink for status ' + p.status);
  const evidenceReceipt = { REPO_OBSERVED: 'repo_receipt', OFFLINE_TEST: 'test_receipt', LIVE_VERIFIED: 'live_receipt' }[p.basis];
  if (evidenceReceipt && !isLocator(p[evidenceReceipt])) errors.push(evidenceReceipt + ' required for basis ' + p.basis);
  if (p.basis === 'LIVE_VERIFIED' && !isUtc(p.observed_utc)) errors.push('LIVE_VERIFIED requires observed_utc with valid UTC timestamp');
  return errors;
}

function main(args) {
  if (args[0] !== 'check' || !text(args[1]) || args.length !== 2) {
    console.error('Usage: node check-packet.mjs check path/to/research-packet.json');
    process.exitCode = 2; return;
  }
  try {
    const raw = fs.readFileSync(args[1], 'utf8');
    if (raw.length > 65536) throw new Error('packet exceeds 64 KiB metadata limit');
    const errors = validatePacket(JSON.parse(raw));
    if (errors.length) {
      console.error('FAIL: metadata/evidence-consistency check (' + errors.length + ' issue(s))');
      errors.forEach(s => console.error('- ' + s));
      process.exitCode = 1;
    } else console.log('PASS: research packet metadata and receipt structure; external claims and live evidence NOT independently verified');
  } catch (e) {
    console.error(e instanceof SyntaxError ? 'FAIL: malformed JSON' : 'FAIL: cannot read a valid metadata-only packet');
    process.exitCode = 2;
  }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main(process.argv.slice(2));
