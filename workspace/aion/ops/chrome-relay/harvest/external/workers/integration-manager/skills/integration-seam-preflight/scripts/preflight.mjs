#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const PACK_HOME = 'workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager/packs';
const help = 'Usage: node preflight.mjs pack PACK-06 [--seam repo/relative/file] [--root repo/root] | links repo/relative/file.md [--root repo/root]';

function under(parent, target) {
  const delta = path.relative(parent, target);
  return delta !== '..' && !delta.startsWith('..' + path.sep) && !path.isAbsolute(delta);
}
function rootPath(raw) {
  const full = path.resolve(raw || process.cwd());
  if (!fs.existsSync(path.join(full, 'AGENTS.md'))) throw Error('Expected AION repo root containing AGENTS.md');
  return fs.realpathSync(full);
}
function safePath(root, relative, mustExist = false) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').includes('..') || relative.split('/').includes('.')) {
    throw Error('Unsafe repository-relative path');
  }
  const full = path.resolve(root, relative);
  if (!under(root, full)) throw Error('Path escapes repository');
  let current = full;
  while (!fs.existsSync(current) && under(root, current)) current = path.dirname(current);
  if (!under(root, fs.realpathSync(current))) throw Error('Symlink escapes repository');
  if (mustExist && !fs.existsSync(full)) throw Error('Missing file: ' + relative);
  return full;
}
function links(root, file) {
  const full = safePath(root, file, true);
  if (!fs.statSync(full).isFile()) throw Error('Expected Markdown file');
  const text = fs.readFileSync(full, 'utf8');
  const issues = [];
  let checked = 0;
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    let link = match[1].trim().replace(/^<|>$/g, '');
    if (!link || /^(?:https?:|mailto:|#|data:)/i.test(link)) continue;
    link = decodeURIComponent(link.split('#')[0].split('?')[0]);
    if (!link) continue;
    checked++;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), link));
    try {
      const dest = safePath(root, resolved, true);
      if (!fs.existsSync(dest)) issues.push({ link, reason: 'missing' });
    } catch (e) { issues.push({ link, reason: e.message }); }
  }
  return { file, checked, issues };
}
function pack(root, name, seam) {
  if (!/^PACK-\d{2}$/.test(name || '')) throw Error('Pack identifier must match PACK-00 through PACK-99');
  const relative = PACK_HOME + '/' + name;
  const dir = safePath(root, relative, true);
  if (!fs.statSync(dir).isDirectory()) throw Error('Pack is not a directory');
  const files = fs.readdirSync(dir).filter(f => fs.statSync(safePath(root, relative + '/' + f, true)).isFile()).sort();
  const readme = files.includes('README.md');
  const implementation = files.filter(f => /\.(?:js|mjs|cjs|ts|csv)$/.test(f) && !/\.test\./.test(f));
  const licenses = files.filter(f => /^LICENSE(?:[-.]|$)/i.test(f));
  const docs = readme ? links(root, relative + '/README.md') : { file: relative + '/README.md', checked: 0, issues: [{ reason: 'missing README' }] };
  let seamResult = null;
  if (seam !== undefined) {
    const target = safePath(root, seam);
    seamResult = { path: seam, exists: fs.existsSync(target), note: 'Existence only; does not prove wiring or adoption' };
  }
  return { pack: name, source_state: 'FILES_PRESENT_ONLY', files, implementation, licenses, readme, markdown_links: docs, seam: seamResult,
    issues: [...(!implementation.length ? ['no non-test source or data'] : []), ...(!readme ? ['missing README.md'] : []), ...docs.issues.map(x => 'README link: ' + x.link + ': ' + x.reason)],
    boundary: 'Do not infer Development selection, integration, tests, local installation or live acceptance from static files.' };
}
function main(argv) {
  const args = [...argv];
  let root = process.cwd();
  const ix = args.indexOf('--root');
  if (ix >= 0) { if (!args[ix+1]) throw Error('--root requires directory'); root = args[ix+1]; args.splice(ix,2); }
  const repo = rootPath(root);
  const command = args.shift();
  let result;
  if (command === 'pack') {
    const name = args.shift(); let seam;
    if (args[0] === '--seam') { if (!args[1]) throw Error('--seam requires path'); seam = args[1]; args.splice(0,2); }
    if (args.length) throw Error('Unexpected arguments');
    result = pack(repo, name, seam);
  } else if (command === 'links') {
    const file = args.shift(); if (args.length || !file) throw Error('Expected one Markdown path');
    result = links(repo, file);
  } else throw Error(help);
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length) process.exitCode = 1;
}
try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 2; }
