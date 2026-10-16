// Build: bundles ../ledger.json + ../RISKS.md + ../DECISIONS.md into dist/ (no deps).
import fs from 'fs';
const pm = new URL('..', import.meta.url).pathname;
const snap = fs.existsSync(pm + 'ledger.json') ? null : JSON.parse(fs.readFileSync('pm-snapshot.json', 'utf8'));
const rd = f => snap ? snap[f] : fs.readFileSync(pm + f, 'utf8');
const L = JSON.parse(rd('ledger.json'));
const risks = rd('RISKS.md').split('\n')
  .filter(l => /^\|R\d+\|/.test(l)).map(l => { const c = l.split('|').slice(1, -1); return { id: c[0], type: c[1], risk: c[2], evidence: c[3] }; })
  .sort((a, b) => +a.id.slice(1) - +b.id.slice(1));
const decisions = rd('DECISIONS.md').split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2));
const build = { builtAt: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA || (snap ? 'snapshot ' + snap.sha : 'local'), commitMsg: process.env.VERCEL_GIT_COMMIT_MESSAGE || (snap ? '(box snapshot ' + snap.at + ')' : '') };
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/data.json', JSON.stringify({ ledger: L, risks, decisions, build }));
fs.copyFileSync('src/index.html', 'dist/index.html');
console.log('built', L.items.length, 'items,', risks.length, 'risks');
