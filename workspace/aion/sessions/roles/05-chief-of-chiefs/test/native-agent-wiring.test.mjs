// Native integration source test only; does not prove Windows/OpenCode invocation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../../');
const source = path => readFileSync(resolve(root, path), 'utf8');

test('Role 05 is a discovered-capable native OpenCode agent', () => {
  const path = '.opencode/agents/aion-chief.md';
  assert.ok(existsSync(resolve(root, path)));
  const agent = source(path);
  assert.match(agent, /^---\n[\s\S]*?\nmode: all\n---\n/);
  assert.match(agent, /AION Chief of Chiefs, Role 05/);
  assert.match(agent, /memory\/Immediate\/README\.md/);
  assert.match(agent, /ONLY when invoked/);
  assert.doesNotMatch(agent, /^model:/m);
});

test('/chief explicitly selects Role 05 in this OpenCode session', () => {
  const path = '.opencode/commands/chief.md';
  assert.ok(existsSync(resolve(root, path)));
  const command = source(path);
  assert.match(command, /^agent: aion-chief$/m);
  assert.match(command, /^subagent: false$/m);
  assert.match(command, /#AION @chief \/sitrep \+\+/);
  assert.match(command, /\$ARGUMENTS/);
});

test('existing memory and skills remain the only Role 05 source of truth', () => {
  const role = 'workspace/aion/sessions/roles/05-chief-of-chiefs/';
  for (const name of ['AGENTS.md', 'BOOTSTRAP.md', 'SITREP.md', 'memory/Immediate/README.md']) {
    assert.ok(existsSync(resolve(root, role + name)), role + name);
  }
  assert.match(source('opencode.jsonc'), /\.\/workspace\/aion\/sessions\/roles\/05-chief-of-chiefs\/skills/);
});
