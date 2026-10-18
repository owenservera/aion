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
 * id and the Chrome message cap. An on-disk file may set expectedExtensionId
 * explicitly, but never silently - it must parse and validate.
 */
export function loadHostConfig(baseDir = BRIDGE_ROOT, fileOverrides = {}) {
  let fromDisk = {};
  const configPath = path.join(baseDir, 'host.config.json');
  if (fs.existsSync(configPath)) {
    fromDisk = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return createConfig({
    expectedExtensionId: PINNED_EXTENSION_ID,
    ...fromDisk,
    ...fileOverrides,
    maxFrameBytes: Math.min(
      fileOverrides.maxFrameBytes ?? fromDisk.maxFrameBytes ?? CHROME_MAX_HOST_MESSAGE_BYTES,
      CHROME_MAX_HOST_MESSAGE_BYTES,
    ),
  });
}

function main() {
  const logger = createRedactingLogger({ level: process.env.AION_HOST_LOG_LEVEL ?? 'info' });

  let config;
  try {
    config = loadHostConfig();
    assertValidConfig(config);
  } catch (err) {
    logger.error(`invalid host configuration: ${err && err.message}`);
    process.stderr.write(`aion-relay-host: invalid configuration (${err && err.message})\n`);
    process.exit(3);
  }

  const extensionId = extractExtensionId(process.argv.slice(2));
  if (extensionId === '') {
    // Refuse loudly and exit non-zero: a host that cannot identify its caller
    // must never appear to have started successfully.
    logger.error('no chrome-extension:// origin on the command line; refusing to serve');
    process.stderr.write('aion-relay-host: expected Chrome to pass the extension origin as argv[1]\n');
    process.exit(2);
  }

  const host = createHost({
    config,
    logger,
    input: process.stdin,
    output: process.stdout,
    initialOrigin: extensionId,
  });

  const shutdown = (signal) => {
    logger.info(`received ${signal}; shutting down`);
    try { host.close(); } catch { /* already closed */ }
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info(`aion-relay-host ready for extension ${extensionId}`);
}

// Only serve when executed directly. Importing this module (the host tests do,
// to reach extractExtensionId / loadHostConfig) must not start a host or exit
// the process - main() calls process.exit() when no origin is present.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();