/**
 * PACK-07 offline fixtures. No browser, no network, no file input, no composer.
 * Run: node --test packs/PACK-07/
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TransferAccumulator,
  artifactIdentity,
  assertReadyToApply,
  integrityError,
  sha256Hex,
  validateTransferMetadata,
} from './transfer-integrity.js';

const TEXT = new TextEncoder();

async function metadataFor(bytes, { encoding = 'utf8', content, chunks = 1, ...overrides } = {}) {
  const encoded = content ?? new TextDecoder().decode(bytes);
  return {
    transferId: 'transfer-1',
    size: bytes.length,
    encodedSize: encoded.length,
    totalChunks: chunks,
    encoding,
    sha256: await sha256Hex(bytes),
    ...overrides,
  };
}

function rejectsIntegrity(fn, message) {
  return assert.rejects(fn, (error) => {
    assert.equal(error.code, 'TRANSFER_INTEGRITY_INVALID');
    assert.match(error.message, message);
    return true;
  });
}

test('metadata rejects a missing id, a bad hash, a zero chunk count and an unknown encoding', () => {
  const base = {
    transferId: 't',
    size: 1,
    encodedSize: 1,
    totalChunks: 1,
    encoding: 'utf8',
    sha256: 'a'.repeat(64),
  };
  assert.throws(() => validateTransferMetadata({ ...base, transferId: '' }), /invalid transfer ID/);
  assert.throws(() => validateTransferMetadata({ ...base, sha256: 'abc' }), /SHA-256/);
  assert.throws(() => validateTransferMetadata({ ...base, totalChunks: 0 }), /chunk count/);
  assert.throws(() => validateTransferMetadata({ ...base, encoding: 'hex' }), /encoding/);
  assert.throws(() => validateTransferMetadata({ ...base, encoding: 'binary', encodedSize: 2 }), /binary size/);
  assert.equal(validateTransferMetadata(base), base);
});

test('a complete utf8 transfer verifies and is applicable', async () => {
  const bytes = TEXT.encode('hello');
  const content = 'hello';
  const metadata = await metadataFor(bytes, { content });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  transfer.append({ ...metadata, index: 0, offset: 0 }, content);
  const verified = await transfer.finish(metadata);
  assert.equal(verified.verified, true);
  assert.deepEqual(assertReadyToApply(verified), bytes);
});

test('two ordered chunks reconstruct before the hash is checked', async () => {
  const content = 'abcdef';
  const bytes = TEXT.encode(content);
  const metadata = await metadataFor(bytes, { content, chunks: 2 });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  transfer.append({ ...metadata, index: 0, offset: 0 }, 'abc');
  transfer.append({ ...metadata, index: 1, offset: 3 }, 'def');
  const verified = await transfer.finish(metadata);
  assert.equal(verified.content, content);
});

test('a gap, a duplicate and a reorder are the same refusal', async () => {
  const bytes = TEXT.encode('abcd');
  const metadata = await metadataFor(bytes, { content: 'abcd', chunks: 2 });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  await rejectsIntegrity(
    async () => transfer.append({ ...metadata, index: 1, offset: 0 }, 'ab'),
    /missing, duplicate or reordered/,
  );
});

test('changed metadata, a bad offset and an oversize chunk are refused', async () => {
  const bytes = TEXT.encode('abcd');
  const metadata = await metadataFor(bytes, { content: 'abcd', chunks: 2 });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  await rejectsIntegrity(
    async () => transfer.append({ ...metadata, sha256: 'b'.repeat(64), index: 0, offset: 0 }, 'ab'),
    /metadata changed/,
  );
  await rejectsIntegrity(
    async () => transfer.append({ ...metadata, index: 0, offset: 1 }, 'ab'),
    /offset/,
  );
  await rejectsIntegrity(
    async () => transfer.append({ ...metadata, index: 0, offset: 0 }, 'abcde'),
    /too large/,
  );
});

test('an incomplete transfer cannot finish and cannot be applied', async () => {
  const bytes = TEXT.encode('abcd');
  const metadata = await metadataFor(bytes, { content: 'abcd', chunks: 2 });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  transfer.append({ ...metadata, index: 0, offset: 0 }, 'ab');
  await rejectsIntegrity(async () => transfer.finish(metadata), /incomplete/);
  assert.throws(() => assertReadyToApply(undefined), /unverified/);
  assert.throws(() => assertReadyToApply({ verified: false, bytes }), /unverified/);
  assert.equal(integrityError('x').code, 'TRANSFER_INTEGRITY_INVALID');
});

test('a corrupted payload fails the hash and returns nothing', async () => {
  const bytes = TEXT.encode('hello');
  const metadata = await metadataFor(bytes, { content: 'hello' });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  transfer.append({ ...metadata, index: 0, offset: 0 }, 'hellp');
  // encoded size was for 'hello' (5). 'hellp' is also 5, so length matches and the hash fails.
  await rejectsIntegrity(async () => transfer.finish(metadata), /SHA-256/);
});

test('canonical base64 is required', async () => {
  const bytes = new Uint8Array([104, 105]); // "hi"
  const content = btoa('hi');
  const metadata = await metadataFor(bytes, { encoding: 'base64', content });
  const transfer = new TransferAccumulator(metadata, 'base64');
  transfer.append({ ...metadata, index: 0, offset: 0 }, content);
  const verified = await transfer.finish(metadata);
  assert.deepEqual(verified.bytes, bytes);
});

test('non-canonical base64 is refused when the declared encoded size matches', async () => {
  const bytes = new Uint8Array([104]);
  const canonical = btoa('h'); // "aA=="
  const metadata = await metadataFor(bytes, { encoding: 'base64', content: canonical });
  const sloppy = 'aA'; // same bytes if a decoder is lenient, but not canonical and shorter
  assert.notEqual(sloppy.length, canonical.length);
  const paddedWrong = `${canonical.slice(0, -1)}A`;
  assert.equal(paddedWrong.length, canonical.length);
  const transfer = new TransferAccumulator(
    { ...metadata, sha256: metadata.sha256 },
    'base64',
  );
  transfer.append({ ...metadata, index: 0, offset: 0 }, paddedWrong);
  await rejectsIntegrity(async () => transfer.finish(metadata), /base64|SHA-256|raw size/);
});

test('a finished transfer cannot accept another chunk', async () => {
  const bytes = TEXT.encode('z');
  const metadata = await metadataFor(bytes, { content: 'z' });
  const transfer = new TransferAccumulator(metadata, 'utf8');
  transfer.append({ ...metadata, index: 0, offset: 0 }, 'z');
  await transfer.finish(metadata);
  await rejectsIntegrity(
    async () => transfer.append({ ...metadata, index: 0, offset: 0 }, 'z'),
    /settled/,
  );
});

test('artifact identity prefers estuary, then hash, then id, then source', () => {
  const hash = 'ab'.repeat(32);
  assert.equal(
    artifactIdentity({
      sha256: hash,
      id: 'local',
      url: 'https://chatgpt.com/backend-api/estuary/content?id=file-9',
    }),
    'estuary:file-9',
  );
  assert.equal(artifactIdentity({ sha256: hash.toUpperCase(), id: 'local' }), `sha256:${hash}`);
  assert.equal(artifactIdentity({ id: 'local', url: 'https://example.com/a' }), 'id:local');
  assert.equal(artifactIdentity({ artifactId: 'other' }), 'id:other');
  assert.equal(artifactIdentity({ url: 'https://example.com/a' }), 'source:https://example.com/a');
  assert.equal(artifactIdentity({}), '');
  assert.equal(artifactIdentity({ sha256: 'not-a-hash', id: 'local' }), 'id:local');
});

test('estuary file_id and path ids are accepted; a bad url is skipped', () => {
  assert.equal(
    artifactIdentity({ src: 'https://chatgpt.com/backend-api/estuary/content?file_id=abc' }),
    'estuary:abc',
  );
  assert.equal(
    artifactIdentity({ downloadUrl: 'https://chatgpt.com/backend-api/estuary/content/path-id' }),
    'estuary:path-id',
  );
  assert.equal(artifactIdentity({ url: 'not a url', id: 'kept' }), 'id:kept');
});
