/**
 * Native-host entry point + origin gate.
 *
 * Covers the defect that would have broken every real Chrome connection: the
 * host originally expected the first framed stdin message to be the extension
 * origin, but Chrome passes the origin as a command-line ARGUMENT. Without
 * argv handling the host refused every genuine connection as `origin_missing`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import {
  extractExtensionId,
  loadHostConfig,
  CHROME_MAX_HOST_MESSAGE_BYTES,
  PINNED_EXTENSION_ID,
} from '../bin/aion-relay-host.mjs';
import { createHost, createRedactingLogger, HOST_ERROR } from '../src/host.js';
import { createConfig } from '../src/config.js';
import { encodeNativeFrame, createNativeFrameDecoder } from '../src/framing.js';

const ID = 'kgjfielmhcdlggjppmliabpiljnonhki';
const ORIGIN = `chrome-extension://${ID}/`;

function harness(overrides = {}) {
  const input = new PassThrough();
  const output = new PassThrough();
  const out = [];
  // createNativeFrameDecoder delivers messages via onMessage callbacks; push()
  // only returns how many frames completed.
  const decoder = createNativeFrameDecoder({ onMessage: (m) => out.push(m) });
  output.on('data', (b) => { decoder.push(b); });
  const logs = [];
  const logger = createRedactingLogger({ level: 'error', sink: (l) => logs.push(l) });
  const config = createConfig({
    expectedExtensionId: ID,
    // no agent spawn in these tests
    agentPath: '',
    sessionCwd: path.resolve('C:/tmp'),
    ...(overrides.config ?? {}),
  });
  const host = createHost({
    config,
    logger,
    input,
    output,
    ...(overrides.host ?? {}),
  });
  return { host, state: host.state, out, logs, config };
}

const errorsIn = (msgs) => msgs.filter((m) => m && m.type === 'relay.error');
const settle = () => new Promise((r) => setImmediate(r));

/* ------------------------------------------------------------ argv parsing */

test('argv: Chrome origin is normalised to the bare extension id', () => {
  assert.equal(extractExtensionId([ORIGIN]), ID);
  assert.equal(extractExtensionId([ORIGIN, '--parent-window=4242']), ID);
  assert.equal(extractExtensionId([`--origin=${ORIGIN}`]), ID);
});

test('argv: no origin yields empty, so the host refuses rather than guessing', () => {
  assert.equal(extractExtensionId([]), '');
  assert.equal(extractExtensionId(['--parent-window=1']), '');
  // a wrong-length or wrong-alphabet id is not silently truncated
  assert.equal(extractExtensionId(['chrome-extension://tooshort/']), '');
  assert.equal(extractExtensionId(['chrome-extension://' + 'Z'.repeat(32) + '/']), '');
});

/* ---------------------------------------------------------- the 1 MB cap */

test('config: outbound frames are capped at Chrome 1 MB', () => {
  const config = loadHostConfig(path.resolve('C:/nowhere'), {});
  assert.equal(config.maxFrameBytes, CHROME_MAX_HOST_MESSAGE_BYTES);
  assert.ok(config.maxFrameBytes <= 1024 * 1024, 'must not exceed the Chrome host->extension limit');
});

test('config: a larger configured cap is clamped down, not honoured', () => {
  const config = loadHostConfig(path.resolve('C:/nowhere'), { maxFrameBytes: 8 * 1024 * 1024 });
  assert.equal(config.maxFrameBytes, CHROME_MAX_HOST_MESSAGE_BYTES);
});

test('config: the pinned extension id is present and bare', () => {
  const config = loadHostConfig(path.resolve('C:/nowhere'), {});
  assert.equal(config.expectedExtensionId, PINNED_EXTENSION_ID);
  assert.match(PINNED_EXTENSION_ID, /^[a-p]{32}$/);
});

/* ------------------------------------------------------- origin from argv */

test('ORIGIN ACCEPTED: argv origin seeds the gate, so real commands are not refused as missing', async () => {
  const h = harness({ host: { initialOrigin: ID } });
  assert.equal(h.state.refused, false);
  assert.equal(h.state.origin, ID);
  h.host.stop();
});

test('ORIGIN REJECTED: a wrong origin refuses the connection', async () => {
  const h = harness({ host: { initialOrigin: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } });
  assert.equal(h.state.refused, true);
  assert.match(h.logs.join('\n'), /not the configured extension id/);
  h.host.stop();
});

test('ORIGIN MISSING: no origin at all refuses the connection', async () => {
  const h = harness({ host: { initialOrigin: '' } });
  assert.equal(h.state.refused, true);
  assert.equal(h.state.origin, '');
  assert.match(h.logs.join('\n'), /origin missing/);
  h.host.stop();
});

test('ORIGIN MISSING: an undefined origin falls back to the first-message path', async () => {
  const h = harness(); // no initialOrigin
  assert.equal(h.state.refused, false);
  assert.equal(h.state.origin, null);
  h.host.receive((ORIGIN));
  await settle();
  assert.equal(h.state.origin, ORIGIN);
  assert.equal(h.state.refused, true, 'a full chrome-extension:// origin is not the bare id');
  h.host.stop();
});

test('REFUSED CONNECTION EXECUTES NOTHING: every later frame is refused, nothing is dispatched', async () => {
  const h = harness({ host: { initialOrigin: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } });
  // A command that WOULD dispatch work if the gate were open.
  h.host.receive(({ type: 'relay.command', id: 'c1', command: 'agent.initialize' }));
  await settle();
  await settle();

  assert.equal(h.state.refused, true);
  assert.equal(h.state.dispatched, 0, 'nothing may be dispatched after a refused origin');
  assert.ok(h.state.refusedMessages >= 1);

  const errs = errorsIn(h.out);
  assert.ok(errs.length >= 1);
  for (const e of errs) assert.equal(e.code, HOST_ERROR.ORIGIN_NOT_ALLOWED);
  h.host.stop();
});

test('a refused connection refuses repeatedly and never becomes permissive', async () => {
  const h = harness({ host: { initialOrigin: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } });
  for (let i = 0; i < 3; i += 1) {
    h.host.receive(({ type: 'relay.command', id: `c${i}`, command: 'agent.initialize' }));
  }
  await settle();
  await settle();
  assert.equal(h.state.dispatched, 0);
  assert.equal(h.state.refused, true);
  h.host.stop();
});

test('an unset expectedExtensionId refuses rather than accepting anything', async () => {
  const h = harness({
    config: { expectedExtensionId: '' },
    host: { initialOrigin: ID },
  });
  assert.equal(h.state.refused, true, 'an unset expected id must not be a wildcard');
  h.host.stop();
});
