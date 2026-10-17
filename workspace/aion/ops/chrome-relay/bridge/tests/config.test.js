// Config tests — the safety properties that live in configuration.
//
// cwd admission is a safety property (BRIDGE-DESIGN.md section 6): the host
// fixes it, and an extension may only ever ask for a root the owner approved.
// The agent path rules exist because of two verified facts about this host:
// `opencode` on PATH is a `.ps1` shim, and a backslash Windows path written in a
// JS string literal silently loses characters at every `\n`, `\t`, `\b`, `\v`.

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACP_HOST_NAME,
  ACP_PROTOCOL_VERSION,
  AGENT_ARGS,
  AGENT_PATH,
  CONFIG_ERROR,
  assertCwdAllowed,
  assertValidConfig,
  createConfig,
  cwdKey,
  hasTraversalSegment,
  isAbsolutePath,
  validateConfig,
} from '../src/config.js';

test('config: the agent path is absolute, forward-slashed and an .exe', () => {
  assert.ok(!AGENT_PATH.includes('\\'), 'a backslash path silently loses characters in a JS string literal');
  assert.ok(isAbsolutePath(AGENT_PATH), 'the agent must be spawned by absolute path');
  assert.ok(AGENT_PATH.endsWith('opencode.exe'), 'the PATH entry is a .ps1 shim; only the .exe is spawnable');
  assert.deepEqual([...AGENT_ARGS], ['acp']);
  assert.equal(ACP_PROTOCOL_VERSION, 1);
  assert.equal(ACP_HOST_NAME, 'com.aion.relay');
});

test('config: an unset extension id refuses every message instead of allowing all', () => {
  const config = createConfig({});
  assert.equal(config.expectedExtensionId, '');
  const check = validateConfig(config);
  assert.equal(check.valid, false);
  assert.ok(check.errors.some((e) => e.startsWith(CONFIG_ERROR.MISSING_EXTENSION_ID)));
  assert.throws(() => assertValidConfig(config), /expectedExtensionId is required/);
});

test('config: a backslash agent path is rejected with the escape-hazard reason', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), agentPath: 'C:\\Users\\me\\opencode.exe' });
  const check = validateConfig(config);
  assert.equal(check.valid, false);
  const error = check.errors.find((e) => e.startsWith(CONFIG_ERROR.AGENT_PATH_BACKSLASH));
  assert.ok(error, `expected a backslash error, got: ${check.errors.join(' | ')}`);
  assert.match(error, /forward slashes/);
});

test('config: a relative agent path is rejected', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), agentPath: 'opencode' });
  const check = validateConfig(config);
  assert.ok(check.errors.some((e) => e.startsWith(CONFIG_ERROR.AGENT_PATH_NOT_ABSOLUTE)));
  assert.match(check.errors.join(' '), /\.ps1 shim/);
});

test('config: a complete configuration validates', () => {
  const config = createConfig({ expectedExtensionId: 'abcdefghijklmnopabcdefghijklmnop' });
  const check = validateConfig(config);
  assert.deepEqual(check.errors, []);
  assert.equal(check.valid, true);
  assert.equal(config.protocolVersion, 1);
  assert.equal(config.nodeId, 'native-host:com.aion.relay');
});

test('config: the cwd allowlist is an exact match, never a prefix', () => {
  const config = createConfig({
    expectedExtensionId: 'x'.repeat(32),
    sessionCwd: 'C:/0-BlackBoxProject-0/AION',
    allowedCwds: ['C:/0-BlackBoxProject-0/AION-worktree'],
  });

  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0/AION').allowed, true);
  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0/AION-worktree').allowed, true);
  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0/AION/').allowed, true, 'a trailing separator is the same root');
  assert.equal(assertCwdAllowed(config, 'c:/0-blackboxproject-0/aion').allowed, true, 'Windows paths are case-insensitive');

  // The prefix trap: an allowlisted root must not admit its neighbours.
  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0/AION-evil').allowed, false);
  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0').allowed, false);
  assert.equal(assertCwdAllowed(config, 'C:/0-BlackBoxProject-0/AION/../AION').allowed, false);
  assert.equal(assertCwdAllowed(config, 'C:/Somewhere/Else').allowed, false);
});

test('config: relative, traversal and empty cwds are refused', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), sessionCwd: 'C:/repo' });
  for (const bad of ['', 'repo', './repo', '../repo', 'C:/repo/../other', '\\\\server\\share', null, undefined, 42]) {
    assert.equal(assertCwdAllowed(config, bad).allowed, false, `${JSON.stringify(bad)} must not be allowed`);
  }
  assert.ok(hasTraversalSegment('C:/a/../b'));
  assert.equal(hasTraversalSegment('C:/a/b'), false);
});

test('config: with no allowlist entries, only the session root is permitted', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), sessionCwd: 'C:/repo' });
  assert.deepEqual(config.allowedCwds, []);
  assert.equal(assertCwdAllowed(config, 'C:/repo').allowed, true);
  assert.equal(assertCwdAllowed(config, 'C:/').allowed, false);
});

test('config: a bad allowlist entry fails validation', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), allowedCwds: ['relative/path'] });
  const check = validateConfig(config);
  assert.ok(check.errors.some((e) => e.startsWith(CONFIG_ERROR.BAD_ALLOWED_CWD)));
});

test('config: a wrong protocol version is refused rather than negotiated blindly', () => {
  const config = createConfig({ expectedExtensionId: 'x'.repeat(32), protocolVersion: 2 });
  const check = validateConfig(config);
  assert.ok(check.errors.some((e) => e.startsWith(CONFIG_ERROR.BAD_PROTOCOL_VERSION)));
});

test('config: cwdKey compares case-insensitively and normalises separators', () => {
  assert.equal(cwdKey('C:\\Repo\\'), cwdKey('c:/repo'));
  assert.equal(cwdKey('C:/repo'), 'c:/repo');
  assert.equal(cwdKey(''), null);
});