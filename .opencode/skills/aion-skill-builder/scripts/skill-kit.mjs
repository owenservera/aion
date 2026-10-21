#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const homes = {
  '01-dashboard-tracking': 'workspace/aion/sessions/roles/01-dashboard-tracking',
  '02-long-term-planning-alignment': 'workspace/aion/sessions/roles/02-long-term-planning-alignment',
  '03-chief-of-staff-operations': 'workspace/aion/sessions/roles/03-chief-of-staff-operations',
  '04-opencode-output-efficiency': 'workspace/aion/sessions/roles/04-opencode-output-efficiency',
  '05-chief-of-chiefs': 'workspace/aion/sessions/roles/05-chief-of-chiefs',
  '06-tooling-integration-engineer': 'workspace/aion/sessions/roles/06-tooling-integration-engineer',
  '07-proposal-intake-commons': 'workspace/aion/sessions/roles/07-proposal-intake-commons',
  '08-zai-sandbox-strategist': 'workspace/aion/sessions/roles/08-zai-sandbox-strategist',
  '09-global-research': 'workspace/aion/sessions/roles/09-global-research',
  '10-development': 'workspace/aion/ops/chrome-relay/workers/development',
  '11-integration-manager': 'workspace/aion/ops/chrome-relay/harvest/external/workers/integration-manager',
  '12-harvest-acceleration': 'workspace/aion/ops/chrome-relay/harvest/external/workers/nine-repo',
};
const isSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 64;
const skillRoots = Object.values(homes).map(p => path.join(root, p, 'skills'));
const rootSkill = path.join(root, '.opencode', 'skills');

function findSkills(folder, depth = 0) {
  if (!fs.existsSync(folder) || depth > 6) return [];
  if (fs.existsSync(path.join(folder, 'SKILL.md'))) return [path.join(folder, 'SKILL.md')];
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  const flat = depth === 0 ? entries.filter(x => x.isFile() && x.name.endsWith('.md')).map(x => path.join(folder, x.name)) : [];
  return [...flat, ...entries.filter(x => x.isDirectory() && !x.name.startsWith('.') && x.name !== 'node_modules')
    .flatMap(x => findSkills(path.join(folder, x.name), depth + 1))];
}
function inspect(file) {
  const src = fs.readFileSync(file, 'utf8');
  const block = src.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const front = block?.[1] || '';
  const description = front.match(/^description:\s*(.*)$/m)?.[1]?.trim() || '';
  const name = front.match(/^name:\s*(.*)$/m)?.[1]?.trim() || '';
  const flat = path.basename(file) !== 'SKILL.md';
  const id = flat ? path.basename(file, '.md') : path.basename(path.dirname(file));
  const problems = [];
  if (!block) problems.push('missing YAML frontmatter (legacy/not reliably discoverable)');
  if (!description) problems.push('missing description');
  if (!isSlug(id)) problems.push('nonportable skill ID');
  if (flat && id.toLowerCase() === 'readme') problems.push('root README.md is interpreted as a flat skill by OpenCode V2; relocate it thoughtfully');
  if (description.length > 1024) problems.push('description exceeds portable limit');
  return { id, file: path.relative(root, file).replaceAll('\\', '/'), name, description, problems };
}
function inventory() {
  const items = [...skillRoots, rootSkill].flatMap(p => findSkills(p).map(inspect));
  const seen = new Map();
  for (const item of items) {
    if (seen.has(item.id)) {
      item.problems.push('duplicate skill ID (overrides may differ by harness)');
      seen.get(item.id).problems.push('duplicate skill ID');
    } else seen.set(item.id, item);
  }
  return items;
}
const [cmd = 'help', ...args] = process.argv.slice(2);
if (cmd === 'help') {
  console.log('Usage: node skill-kit.mjs audit | catalog | validate <SKILL.md> | new <role-id> <skill-id> "description" | sources');
} else if (cmd === 'sources') {
  console.log(JSON.stringify({ skills: Object.values(homes).map(p => './' + p + '/skills') }, null, 2));
} else if (cmd === 'catalog' || cmd === 'audit') {
  const items = inventory();
  if (cmd === 'catalog') console.log(JSON.stringify(items, null, 2));
  else {
    for (const x of items) console.log((x.problems.length ? 'REVIEW ' : 'READY  ') + x.id + '  ' + x.file + (x.problems.length ? ' :: ' + x.problems.join('; ') : ''));
    console.log('Total ' + items.length + '; ready ' + items.filter(x => !x.problems.length).length + '; attention ' + items.filter(x => x.problems.length).length);
  }
} else if (cmd === 'validate') {
  const target = args[0] && path.resolve(process.cwd(), args[0]);
  if (!target || !fs.existsSync(target) || path.basename(target) !== 'SKILL.md') {
    console.error('Pass an existing SKILL.md path'); process.exitCode = 2;
  } else {
    const x = inspect(target);
    console.log(JSON.stringify(x, null, 2));
    if (x.problems.length) process.exitCode = 1;
  }
} else if (cmd === 'new') {
  const [role, id, ...words] = args;
  const desc = words.join(' ').trim();
  if (!homes[role] || !isSlug(id || '') || !desc || desc.length > 1024 || /[\r\n]/.test(desc)) {
    console.error('Expected known role ID, lowercase kebab-case skill ID, and concise description'); process.exitCode = 2;
  } else if (inventory().some(x => x.id === id)) {
    console.error('Skill ID already exists; reuse or improve the existing skill instead: ' + id); process.exitCode = 2;
  } else {
    const dir = path.join(root, homes[role], 'skills', id);
    if (fs.existsSync(dir)) { console.error('Destination already exists'); process.exitCode = 2; }
    else {
      fs.mkdirSync(dir, { recursive: true });
      const body = ['---', 'name: ' + id, 'description: ' + JSON.stringify(desc), '---', '', '# ' + id, '', '## Use when', 'Describe the specific recurring trigger and when NOT to use it.', '', '## Workflow', '1. Inspect current task, evidence, canonical AION instructions and available tools.', '2. Reuse established procedures; perform the smallest authorized useful operation.', '3. Verify the result, including an important failure or negative case.', '4. Record reusable new learning in this skill when justified.', '', '## Tools and boundaries', 'Name actual OpenCode/ZCode/host tools required. Loading this skill does not grant them.', '', '## Outputs and recovery', 'State what counts as a verified result, how to recover safely, and when to stop.', ''].join('\n');
      fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
      console.log('CREATED ' + path.relative(root, dir).replaceAll('\\', '/') + '/SKILL.md');
    }
  }
} else { console.error('Unknown command; use help'); process.exitCode = 2; }
