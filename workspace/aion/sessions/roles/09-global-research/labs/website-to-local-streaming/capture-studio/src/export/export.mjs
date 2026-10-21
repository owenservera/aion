// Dataset export (Apify-style formats): json, jsonl, csv, md. Plus a Markdown session transcript.
import { createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length <= 30) flatten(v, key, out);
    else out[key] = Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : v;
  }
  return out;
}
const csvCell = (v) => { if (v === undefined || v === null) return ''; const s = String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function exportDataset(session, name, format, outFile) {
  const ds = session.dataset(name);
  if (!existsSync(ds.file)) throw new Error(`Dataset "${name}" not found. Run "studio derive" first.`);
  const out = createWriteStream(outFile);
  const write = (s) => new Promise((r) => (out.write(s) ? r() : out.once('drain', r)));
  let n = 0;
  if (format === 'jsonl') { for await (const i of ds.iterate()) { await write(JSON.stringify(i) + '\n'); n++; } }
  else if (format === 'json') { await write('['); for await (const i of ds.iterate()) { await write((n ? ',\n' : '\n') + JSON.stringify(i)); n++; } await write('\n]\n'); }
  else if (format === 'csv') {
    const cols = new Set();
    for await (const i of ds.iterate()) for (const k of Object.keys(flatten(i))) { cols.add(k); if (cols.size > 200) break; }
    const header = [...cols];
    await write(header.map(csvCell).join(',') + '\n');
    for await (const i of ds.iterate()) { const f = flatten(i); await write(header.map((c) => csvCell(f[c])).join(',') + '\n'); n++; }
  } else if (format === 'md') {
    const rows = await ds.toArray(5000);
    const header = [...new Set(rows.flatMap((r) => Object.keys(flatten(r))))].slice(0, 12);
    await write(`| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n`);
    for (const r of rows) { const f = flatten(r); await write(`| ${header.map((c) => String(f[c] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200)).join(' | ')} |\n`); n++; }
  } else throw new Error(`Unknown format ${format} (json|jsonl|csv|md)`);
  await new Promise((r) => out.end(r));
  return { file: path.resolve(outFile), rows: n };
}

export async function exportTranscript(session, outFile) {
  const out = [];
  const m = session.meta;
  out.push(`# Capture session ${m.id}`, '', `- Target: ${m.target?.title ?? ''} (${m.target?.url ?? ''})`, `- Browser: ${m.browser}`, `- Profile: ${m.profile?.name}@v${m.profile?.version}`, `- Status: ${m.status} (${m.endReason ?? ''})`, '');
  const assembled = session.kv.get('ASSEMBLED', {}) ?? {};
  const timeline = await session.dataset('timeline').toArray(20000);
  const t0 = timeline[0]?.t ?? 0;
  out.push('## Timeline', '');
  for (const e of timeline) out.push(`- +${((e.t - t0) / 1000).toFixed(2)}s · ${e.k}${e.kind ? `:${e.kind}` : ''}${e.label ? ` “${e.label}”` : ''}${e.sid ? ` [${e.sid}]` : ''}${e.reason ? ` (${e.reason})` : ''}${e.error ? ` ERROR ${e.error}` : ''}`);
  out.push('', '## Assembled stream content', '');
  for (const [sid, a] of Object.entries(assembled)) {
    out.push(`### ${a.endpoint} [${sid}] — ${a.revisions} revisions (${a.dialects.join(', ') || 'snapshots'})`, '');
    const texts = [];
    const walk = (n, p) => { if (typeof n === 'string' && n.length >= 20) texts.push([p, n]); else if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) walk(v, `${p}/${k}`); };
    walk(a.doc, '');
    for (const [p, t] of texts.sort((x, y) => y[1].length - x[1].length).slice(0, 5)) out.push(`\`${p}\``, '', t, '');
  }
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outFile, out.join('\n'));
  return { file: path.resolve(outFile) };
}
