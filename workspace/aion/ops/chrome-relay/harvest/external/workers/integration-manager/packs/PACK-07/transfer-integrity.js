/**
 * PACK-07 - artifact identity, transfer integrity, verify-before-apply.
 *
 * Adapted from chatgpt-bridge at upstream 0ffdae90239988f253058c05253226152acd55d2 (MIT):
 *   tools/chrome-bridge-extension/shared/transferIntegrity.js
 *   src/bridge/transferIntegrity.js (TransferAccumulator)
 *   tools/codex-chat-ui/ui-core.js artifactIdentity (lines 163-182)
 *
 * Download/transfer side only. file.attach (upload into a composer) is not here.
 * SHA-256 detects corruption and mixing. It does not authenticate the producer.
 */

const MAX_RAW_SIZE = 128 * 1024 * 1024;
const MAX_ENCODED_SIZE = Math.ceil(MAX_RAW_SIZE / 3) * 4;
const MAX_CHUNKS = 4096;
const SHA256_RE = /^[a-f0-9]{64}$/;
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const METADATA_FIELDS = ['transferId', 'size', 'encodedSize', 'totalChunks', 'encoding', 'sha256'];

export function integrityError(message) {
  return Object.assign(new Error(`Transfer integrity: ${message}`), {
    code: 'TRANSFER_INTEGRITY_INVALID',
  });
}

function fail(message) {
  throw integrityError(message);
}

/** Metadata gate. Does not look at bytes. */
export function validateTransferMetadata(metadata) {
  if (!metadata || typeof metadata.transferId !== 'string' || !metadata.transferId || metadata.transferId.length > 200) {
    fail('invalid transfer ID');
  }
  for (const [key, max] of [['size', MAX_RAW_SIZE], ['encodedSize', MAX_ENCODED_SIZE], ['totalChunks', MAX_CHUNKS]]) {
    if (!Number.isSafeInteger(metadata[key]) || metadata[key] < 0 || metadata[key] > max) fail(`invalid ${key}`);
  }
  if (metadata.totalChunks < 1 || !SHA256_RE.test(metadata.sha256 || '')) fail('missing chunk count or SHA-256');
  if (!['base64', 'utf8', 'binary'].includes(metadata.encoding)) fail('invalid encoding');
  if (metadata.encoding === 'binary' && metadata.encodedSize !== metadata.size) fail('binary size mismatch');
  return metadata;
}

export async function sha256Hex(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', view);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decode(content, encoding) {
  if (encoding === 'base64') {
    if (content.length % 4 !== 0 || !BASE64_RE.test(content)) fail('invalid base64');
    let binary;
    try {
      binary = atob(content);
    } catch {
      fail('invalid base64');
    }
    if (btoa(binary) !== content) fail('invalid base64');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
  if (encoding === 'utf8') return new TextEncoder().encode(content);
  const bytes = new Uint8Array(content.length);
  for (let index = 0; index < content.length; index += 1) bytes[index] = content.charCodeAt(index) & 0xff;
  return bytes;
}

/**
 * Bounded accumulator. Chunks must arrive in order, with unchanged metadata,
 * contiguous indexes and offsets. `finish` hashes the reconstructed bytes and
 * returns them only when every check passes. There is no partial-apply result.
 */
export class TransferAccumulator {
  constructor(metadata, encoding) {
    validateTransferMetadata(metadata);
    if (metadata.encoding !== encoding) fail('unexpected encoding');
    this.metadata = Object.fromEntries(METADATA_FIELDS.map((key) => [key, metadata[key]]));
    this.chunks = [];
    this.length = 0;
    this.settled = false;
  }

  check(metadata) {
    if (this.settled) fail('transfer already settled');
    if (METADATA_FIELDS.some((key) => metadata?.[key] !== this.metadata[key])) fail('transfer metadata changed');
  }

  append(metadata, content) {
    this.check(metadata);
    if (!Number.isSafeInteger(metadata.index) || metadata.index !== this.chunks.length
      || metadata.index >= this.metadata.totalChunks) {
      fail('missing, duplicate or reordered chunk');
    }
    if (metadata.offset !== this.length || typeof content !== 'string') fail('invalid chunk offset or content');
    if (this.length + content.length > this.metadata.encodedSize) fail('encoded payload too large');
    this.chunks.push(content);
    this.length += content.length;
  }

  async finish(metadata) {
    this.check(metadata);
    if (this.chunks.length !== this.metadata.totalChunks || this.length !== this.metadata.encodedSize) {
      fail('incomplete payload');
    }
    const content = this.chunks.join('');
    const bytes = decode(content, this.metadata.encoding);
    if (bytes.length !== this.metadata.size) fail('raw size mismatch');
    if (await sha256Hex(bytes) !== this.metadata.sha256) fail('SHA-256 mismatch');
    this.settled = true;
    return { verified: true, bytes, content };
  }
}

/**
 * The only legal input to an apply step. Anything else is a refusal.
 * Upload into a composer is not an apply step this pack knows how to perform.
 */
export function assertReadyToApply(verification) {
  if (!verification || verification.verified !== true || !(verification.bytes instanceof Uint8Array)) {
    fail('refusing to apply an unverified payload');
  }
  return verification.bytes;
}

/**
 * Stable artifact identity. Estuary content id, then SHA-256, then id, then source URL.
 * An empty string means "no identity" — callers must not treat that as a match.
 */
export function artifactIdentity(artifact = {}) {
  const source = String(artifact.downloadUrl || artifact.url || artifact.src || '').trim();
  for (const alias of [artifact.url, artifact.src, artifact.downloadUrl]) {
    if (!alias) continue;
    try {
      const parsed = new URL(alias, 'https://chatgpt.com/');
      if (/\/backend-api\/estuary\/content(?:\/|$)/i.test(parsed.pathname)) {
        const contentId = parsed.searchParams.get('id')
          || parsed.searchParams.get('file_id')
          || parsed.pathname.match(/\/content\/([^/?#]+)/i)?.[1]
          || '';
        if (contentId) return `estuary:${contentId}`;
      }
    } catch {
      // not a URL; try the next alias
    }
  }
  const sha256 = String(artifact.sha256 || '').toLowerCase();
  if (SHA256_RE.test(sha256)) return `sha256:${sha256}`;
  const id = String(artifact.id || artifact.artifactId || '').trim();
  return id ? `id:${id}` : source ? `source:${source}` : '';
}
