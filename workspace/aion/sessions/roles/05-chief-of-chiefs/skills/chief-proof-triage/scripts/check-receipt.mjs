#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const levels = ['source', 'offline-tested', 'host-loaded', 'live-observed', 'live-accepted'];
const textField = x => typeof x === 'string' && x.trim().length > 0;
const utcField = x => textField(x) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(x) && Number.isFinite(Date.parse(x));

export function assess(packet) {
  const errors = [];
  if (!packet || Array.isArray(packet) || typeof packet !== 'object') return { status: 'INVALID', errors: ['expected JSON object'] };
  if (!textField(packet.milestone)) errors.push('missing milestone');
  const index = levels.indexOf(packet.claim);
  if (index < 0) errors.push('invalid claim level');
  if (index >= 0) {
    if (!textField(packet.source_ref)) errors.push('missing source_ref');
    if (index >= 1 && !textField(packet.receipt_ref)) errors.push('missing receipt_ref');
    if (index >= 2 && !textField(packet.loaded_revision)) errors.push('missing loaded_revision');
    if (index >= 3) {
      if (!utcField(packet.observed_utc)) errors.push('missing/invalid observed_utc (UTC Z required)');
      if (packet.exact_target_verified !== true) errors.push('exact_target_verified not demonstrated');
      if (packet.positive_case !== true) errors.push('positive_case not demonstrated');
    }
    if (index >= 4) {
      if (packet.negative_case !== true) errors.push('negative_case not demonstrated');
      if (packet.independent_review !== true) errors.push('independent_review not demonstrated');
    }
  }
  return { status: errors.length ? 'INSUFFICIENT' : 'REVIEW_READY', claimed_level: packet.claim ?? null, errors, note: 'Declared fields only: verify source and contract independently. Never auto-accept.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filename = process.argv[2];
  if (!filename || process.argv.length !== 3) {
    console.error('Usage: node check-receipt.mjs <sanitized-evidence.json>');
    process.exitCode = 2;
  } else {
    try {
      const packet = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const result = assess(packet);
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== 'REVIEW_READY') process.exitCode = 1;
    } catch (e) {
      console.error('Invalid/unreadable evidence JSON: ' + e.message);
      process.exitCode = 2;
    }
  }
}
