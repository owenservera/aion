#!/usr/bin/env node
// Read-only summary and integrity check of Planning's canonical AION TASKS.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(here, '../../../TASKS.md');
const args = process.argv.slice(2);
const option = name => args.includes(name);
const value = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const input = value('--file') || defaultFile;
const file = path.resolve(input);
const json = option('--json');
const check = option('--check');
const errors = [];
let tasks = [];

function plain(s) { return s.replace(/\*\*/g, '').replace(/`/g, '').trim(); }
function parse(content) {
  const section = content.match(/## One screen[^\n]*\n([\s\S]*?)(?=\n## |$)/);
  if (!section) { errors.push('Missing current priorities section'); return []; }
  const lines = section[1].split(/\r?\n/).filter(x => /^\|\s*AION-/.test(x) || /^\|\s*\*\*AION-/.test(x));
  if (!lines.length) { errors.push('No AION task rows in current priorities section'); return []; }
  const seen = new Set();
  return lines.map(line => {
    const cols = line.split('|').slice(1, -1).map(plain);
    if (cols.length !== 7) { errors.push(`Expected 7 columns, found ${cols.length}: ${line.slice(0, 90)}`); return null; }
    const [id, rank, northStar, outcome, owner, requires, status] = cols;
    if (!/^AION-[A-Z][0-9]{2}$/.test(id)) errors.push(`Invalid task ID: ${id}`);
    if (seen.has(id)) errors.push(`Duplicate task ID: ${id}`);
    seen.add(id);
    if (!owner) errors.push(`${id}: missing responsible owner`);
    if (!status) errors.push(`${id}: missing status`);
    const links = [...status.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1]);
    if (!links.length) errors.push(`${id}: missing evidence/source link`);
    for (const target of links) {
      if (/^(?:https?:|#)/.test(target)) continue;
      const local = path.resolve(path.dirname(file), decodeURI(target.split('#')[0]));
      if (!fs.existsSync(local)) errors.push(`${id}: broken local source: ${target}`);
    }
    const state = /\b(SOURCE_MERGED|BLOCKED|STAGED|OPEN|PARKED|DONE|UNVERIFIED)\b/i.exec(status)?.[1]?.toUpperCase() || 'UNCLASSIFIED';
    if (state === 'UNCLASSIFIED') errors.push(`${id}: unknown evidence state; review manually`);
    return { id, rank, northStar, outcome, owner, requires, state, status, links };
  }).filter(Boolean);
}

try { tasks = parse(fs.readFileSync(file, 'utf8')); }
catch (e) { errors.push(`Cannot read ${file}: ${e.code || e.message}`); }

if (json) console.log(JSON.stringify({ source: file, tasks, errors }, null, 2));
else {
  console.log('AION Planning critical path — document-derived, NOT Windows/live proof');
  for (const t of tasks) console.log(`${t.id} ${t.rank} [${t.state}] ${t.outcome} | ${t.owner}`);
  if (errors.length) console.error('Review:\n' + errors.map(x => `- ${x}`).join('\n'));
  else console.log('Source links & task-row structure checked; acceptance NOT verified.');
}
if (check && errors.length) process.exitCode = 1;
