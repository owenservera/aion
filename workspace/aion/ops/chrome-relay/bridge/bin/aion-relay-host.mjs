#!/usr/bin/env node
/**
 * AION relay native-messaging host - entry point.
 *
 * Chrome starts this process and passes the calling extension's origin as the
 * FIRST command-line argument, e.g.
 *
 *   node aion-relay-host.mjs "chrome-extension://kgjfielmhcdlggjppmliabpiljnonhki/" --parent-window=12345
 *
 * It then speaks length-prefixed JSON on stdin/stdout. The origin is therefore a
 * command-line fact, not a message: we normalise it to the bare extension id and
 * hand it to the host, which applies the NM-02 check before anything executes.
 *
 * Logs go to stderr only. stdout carries the framed protocol and nothing else.
 */
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createConfig, assertValidConfig, CONFIG_ERROR } from '../src/config.js';
import { createHost, createRedactingLogger } from '../src/host.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_ROOT = path.resolve(HERE, '..');

/**
 * Chrome refuses a single native message larger than 1 MB coming FROM the host
 * ("mainly to protect Chrome from misbehaving native applications"), so outbound
 * frames must stay under that. The same codec caps inbound, which is stricter
 * than Chrome requires (extension->host allows far more) but fails closed.
 */
export const CHROME_MAX_HOST_MESSAGE_BYTES = 1024 * 1024;

/** Extension id pinned by the manifest `key` in ../extension/manifest.json. */
export const PINNED_EXTENSION_ID = 'kgjfielmhcdlggjppmliabpiljnonhki';

/**
 * Extract and normalise the caller's extension id from argv.
 *
 * Chrome passes `chrome-extension://<id>/`; Windows adds `--parent-window=<n>`.
 * Reduce the origin to the bare 32-char id so it compares against
 * config.expectedExtensionId, which is stored bare.
 *
 * @returns {string} the bare extension id, or '' when argv carries no origin
 */
export function extractExtensionId(argv) {
  const candidates = [];
  for (const raw of argv) {
    const arg = String(raw);
    if (arg.startsWith('chrome-extension://')) candidates.push(arg);
    const inline = arg.match(/^--origin=(.+)$/);
    if (inline) candidates.push(inline[1]);
  }
  for (const raw of candidates) {
    const m = raw.match(/^chrome-extension:\/\/([a-p]{32})\/?$/);
    if (m) return m[1];
  }
  return '';
}

/**
 * Build the host config: optional on-disk overrides, then the pinned extension
 * id and the Chrome message cap.
 *
 * THE PIN IS APPLIED AFTER EVERY SPREAD, and an attempt to change it is REJECTED
 * rather than silently ignored. `expectedExtensionId` is the one value that
 * decides whether ANY command executes (NM-02), so a `host.config.json` that
 * could repoint it would turn a local config file into a capability grant. The
 * owner changes the pin in this file, in a diff.
 */
export function loadHostConfig(baseDir = BRIDGE_ROOT, fileOverrides = {}) {
  let fromDisk = {};
  const configPath = path.join(baseDir, 'host.config.json');
  if (fs.existsSync(configPath)) {
    fromDisk = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  for (const [source, bag] of [['host.config.json', fromDisk], ['fileOverrides', fileOverrides]]) {
    const drift = bag && bag.expectedExtensionId;
    if (drift !== undefined && drift !== '' && drift !== PINNED_EXTENSION_ID) {
      throw new Error(
        `${source} may not change expectedExtensionId: ` +
          `the pin is ${PINNED_EXTENSION_ID} and lives in this entry point, not in configuration`,
      );
    }
  }

  return createConfig({
    ...fromDisk,
    ...fileOverrides,
    expectedExtensionId: PINNED_EXTENSION_ID,
    maxFrameBytes: Math.min(
      fileOverrides.maxFrameBytes ?? fromDisk.maxFrameBytes ?? CHROME_MAX_HOST_MESSAGE_BYTES,
      CHROME_MAX_HOST_MESSAGE_BYTES,
    ),
  });
}

/**
 * Write one line to stderr and wait for it to be flushed, with a bound.
 *
 * Exiting straight after a write can truncate the message that explains WHY the
 * process exited non-zero, which is the only output the operator gets. The bound
 * keeps a blocked pipe from turning a clean refusal into a hang.
 */
function writeAndFlush(stream, text, timeoutMs = 1000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
    try {
      stream.write(text, () => {
        clearTimeout(timer);
        done();
      });
    } catch {
      clearTimeout(timer);
      done();
    }
  });
}

async function main() {
  const logger = createRedactingLogger({ level: process.env.AION_HOST_LOG_LEVEL ?? 'info' });

  let config;
  try {
    config = loadHostConfig();
    assertValidConfig(config);
  } catch (err) {
    logger.error(`invalid host configuration: ${err && err.message}`);
    await writeAndFlush(process.stderr, `aion-relay-host: invalid configuration (${err && err.message})\n`);
    process.exit(3);
  }

  const extensionId = extractExtensionId(process.argv.slice(2));
  if (extensionId === '') {
    // Refuse loudly and exit non-zero: a host that cannot identify its caller
    // must never appear to have started successfully.
    logger.error('no chrome-extension:// origin on the command line; refusing to serve');
    await writeAndFlush(process.stderr, 'aion-relay-host: expected Chrome to pass the extension origin as argv[1]\n');
    process.exit(2);
  }

  const host = createHost({
    config,
    logger,
    input: process.stdin,
    output: process.stdout,
    initialOrigin: extensionId,
  });

  // A refused origin EXITS NON-ZERO. It used to log an error and then carry on
  // as a running process that would answer nothing, which reads to any supervisor
  // as "started". The flush is bounded so the reason is not lost on exit.
  if (host.state.refused) {
    logger.error(`refused extension ${extensionId}; this host will execute nothing`);
    await writeAndFlush(process.stderr, `aion-relay-host: origin ${extensionId} is not allowed; refusing to serve\n`);
    process.exit(4);
  }

  logger.info(`aion-relay-host ready for extension ${extensionId}`);

  const shutdown = (signal) => {
    logger.info(`received ${signal}; shutting down`);
    // The host API is stop(), not close().
    try { host.stop(); } catch { /* already stopped */ }
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // EOF on stdin is Chrome closing the connection. Cleanup rather than sitting on
  // an ACP child and an event log for a connection that no longer exists.
  process.stdin.on('end', () => shutdown('stdin end'));
  process.stdin.on('close', () => shutdown('stdin close'));
}

// Only serve when executed directly. Importing this module (the host tests do,
// to reach extractExtensionId / loadHostConfig) must not start a host or exit
// the process - main() calls process.exit() when no origin is present.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  // main() exits the process itself on every refusal path; the catch is here so a
  // thrown failure is also a non-zero exit and a message, never a silent 0.
  main().catch((err) => {
    process.stderr.write(`aion-relay-host: fatal: ${err && err.message}\n`);
    process.exit(5);
  });
}