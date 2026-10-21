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

/**
 * Every content-script entry the loader dynamic-imports.
 *
 * Both entries load in the same isolated world, so both closures have to be
 * web-accessible. The list is kept EXACT: an extra resource is exposure, and a
 * missing one means the module never loads in the browser.
 */
const CONTENT_ENTRIES = ['src/chatgpt/content.js', 'src/chatgpt/receive.js'];

function entryClosure() {
  const files = new Set();
  for (const entry of CONTENT_ENTRIES) {
    for (const file of closure(resolve(root, entry))) files.add(file);
  }
  return [...files].map((f) => relative(root, f).split('\\').join('/'));
}

test('every file the content-script entries import (transitively) is web-accessible', () => {
  const patterns = manifest.web_accessible_resources.flatMap((entry) => entry.resources).map(patternToRegExp);
  const files = entryClosure();
  assert.ok(files.length > 2, 'expected the content entries to pull in lib and provider modules');
  for (const file of files) {
    assert.ok(patterns.some((re) => re.test(file)), `${file} is imported by a content entry but not web-accessible`);
  }
});

// REGRESSION (real Chrome, authorized run): with `use_dynamic_url: true` Chrome serves
// web-accessible resources under a per-session rotating `chrome-extension://<uuid>/...` URL and REJECTS
// the stable one. loader.js dynamic-imports a fixed `chrome.runtime.getURL('src/chatgpt/content.js')`,
// so that fetch 404s, content.js never runs, and the tab reports `FAILED / port_closed` even while the
// composer is visible and the user is signed in (site access was granted, so host_permissions were never
// the problem). Dynamic URLs are for RANDOMIZING which resource URL a web page can see; they are mutually
// exclusive with a script that resolves its own module by a fixed extension URL. Keep this absent or false.
test('web-accessible resources are NOT served under dynamic rotating URLs', () => {
  for (const entry of manifest.web_accessible_resources ?? []) {
    assert.notEqual(
      entry.use_dynamic_url,
      true,
      'use_dynamic_url:true rotates resource URLs per session, so the fixed chrome.runtime.getURL() path '
        + 'that loader.js dynamic-imports no longer resolves and the content module never loads',
    );
  }
});

// Guards the other half of the contract: while the fixed-URL fetch semantics above are required,
// loader.js must keep resolving content.js through chrome.runtime.getURL() and not through a dynamic URL.
test('loader.js resolves content.js through the fixed chrome.runtime.getURL path', () => {
  const loader = readFileSync(resolve(root, 'src/chatgpt/loader.js'), 'utf8');
  assert.match(
    loader,
    /import\(\s*chrome\.runtime\.getURL\(\s*['"]src\/chatgpt\/content\.js['"]\s*\)\s*\)/,
    'loader.js must dynamic-import content.js by its fixed chrome.runtime.getURL path',
  );
});

// Least exposure: use_dynamic_url is false (required above), so any chatgpt.com page can fetch these files
// and fingerprint the extension. Expose exactly what content.js needs, nothing else. In particular the
// native-messaging transport and the store must never become page-reachable through a `src/lib/*.js` glob.
test('web-accessible resources are exactly the content-entry import closure (no globs)', () => {
  const declared = manifest.web_accessible_resources.flatMap((entry) => entry.resources).sort();
  assert.ok(declared.every((r) => !r.includes('*')), 'no wildcard patterns in web_accessible_resources');
  const needed = entryClosure().sort();
  assert.deepEqual(declared, needed);
});
