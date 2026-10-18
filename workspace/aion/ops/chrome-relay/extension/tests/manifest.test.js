// Keeps manifest.json, the loader, the module import closure and the native host template consistent.
// Node built-ins only; no browser needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
const hostTemplate = JSON.parse(
  readFileSync(resolve(root, '..', 'bridge', 'native-host', 'manifest.template.json'), 'utf8'),
);

/** Pinned by the manifest `key`; the native host's allowed_origins and the bridge's expectedExtensionId use it. */
export const PINNED_EXTENSION_ID = 'kgjfielmhcdlggjppmliabpiljnonhki';

function idFromKey(base64Key) {
  const digest = createHash('sha256').update(Buffer.from(base64Key, 'base64')).digest().subarray(0, 16);
  return [...digest]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/[0-9a-f]/g, (c) => String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16)));
}

test('manifest key pins the documented extension id', () => {
  assert.equal(typeof manifest.key, 'string');
  assert.equal(idFromKey(manifest.key), PINNED_EXTENSION_ID);
});

test('native host template allows exactly the pinned extension origin', () => {
  assert.deepEqual(hostTemplate.allowed_origins, [`chrome-extension://${PINNED_EXTENSION_ID}/`]);
});

test('nativeMessaging is requested and site access stays on chatgpt.com only', () => {
  assert.ok(manifest.permissions.includes('nativeMessaging'));
  assert.deepEqual(manifest.host_permissions, ['https://chatgpt.com/*']);
  for (const cs of manifest.content_scripts) assert.deepEqual(cs.matches, ['https://chatgpt.com/*']);
});

test('the content script entry is a classic script (no static import/export) and exists', () => {
  const entries = manifest.content_scripts.flatMap((cs) => cs.js);
  assert.ok(entries.length > 0);
  for (const file of entries) {
    const path = resolve(root, file);
    assert.ok(existsSync(path), `${file} is missing`);
    assert.doesNotMatch(readFileSync(path, 'utf8'), /^\s*(import|export)\s/m, `${file} must not use static import/export`);
  }
});

function staticImports(file) {
  const text = readFileSync(file, 'utf8');
  const found = [];
  for (const match of text.matchAll(/(?:import|export)\s[^;]*?from\s+['"](\.[^'"]+)['"]/g)) {
    found.push(resolve(dirname(file), match[1]));
  }
  return found;
}

function closure(entry, seen = new Set()) {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  for (const dep of staticImports(entry)) closure(dep, seen);
  return seen;
}

function patternToRegExp(pattern) {
  return new RegExp('^' + pattern.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
}

test('every file content.js imports (transitively) is web-accessible', () => {
  const patterns = manifest.web_accessible_resources.flatMap((entry) => entry.resources).map(patternToRegExp);
  const files = [...closure(resolve(root, 'src/chatgpt/content.js'))].map((f) => relative(root, f).split('\\').join('/'));
  assert.ok(files.length > 2, 'expected content.js to pull in lib and correlate modules');
  for (const file of files) {
    assert.ok(patterns.some((re) => re.test(file)), `${file} is imported by content.js but not web-accessible`);
  }
});
