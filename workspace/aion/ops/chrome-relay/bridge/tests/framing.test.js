// Framing tests — the two wire codecs.
//
// Format under test (BRIDGE-DESIGN.md section 1):
//   Chrome <-> native host : 4-byte little-endian length prefix + UTF-8 JSON
//   native host <-> ACP    : newline-delimited JSON-RPC 2.0

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_MAX_FRAME_BYTES,
  FRAME_ERROR,
  FramingError,
  JSONRPC_VERSION,
  classifyJsonRpcMessage,
  createNativeFrameDecoder,
  createNdjsonDecoder,
  decodeNativeFrame,
  encodeJsonRpcLine,
  encodeNativeFrame,
  parseJsonRpcLine,
  trySliceNativeFrame,
  utf8ByteLength,
} from '../src/framing.js';

/* ------------------------------------------------------------- Chrome framing */

test('framing: encode/decode round-trips a nested envelope-shaped value', () => {
  const value = {
    type: 'relay.event',
    envelope: { event_type: 'task.progress', sequence: 7, payload: { text: 'ok' } },
  };
  const frame = encodeNativeFrame(value);

  assert.equal(frame.readUInt32LE(0), frame.length - 4, 'prefix must be the payload byte count');
  assert.deepEqual(decodeNativeFrame(frame).value, value);
});

test('framing: the prefix counts UTF-8 BYTES, not characters', () => {
  const value = { text: 'héllo 世界 🌍' };
  const frame = encodeNativeFrame(value);
  const json = JSON.stringify(value);

  assert.equal(frame.readUInt32LE(0), utf8ByteLength(json));
  assert.notEqual(frame.readUInt32LE(0), json.length, 'multi-byte text must make the byte count differ');
  assert.deepEqual(decodeNativeFrame(frame).value, value);
});

test('framing: multi-byte UTF-8 survives a round-trip byte for byte', () => {
  const texts = [
    'plain ascii',
    'ünïcödé',
    '日本語のテキスト',
    'emoji 🌍🧪 and ZWJ 👩‍💻',
    'control \u0000\u0007\u001b chars',
    'quotes " \' and backslash \\',
  ];
  for (const text of texts) {
    const frame = encodeNativeFrame({ text });
    const decoded = decodeNativeFrame(frame).value;
    assert.equal(decoded.text, text, `round-trip failed for ${JSON.stringify(text)}`);
    assert.equal(
      frame.subarray(4).toString('utf8'),
      JSON.stringify({ text }),
      'payload bytes must be exactly the UTF-8 JSON encoding',
    );
  }
});

test('framing: a wrong length prefix is rejected, not guessed at', () => {
  const good = encodeNativeFrame({ alpha: 'bravo', delta: 1 });
  const correctLength = good.readUInt32LE(0);

  // A prefix that under-counts slices the JSON mid-token.
  const wrong = Buffer.from(good);
  wrong.writeUInt32LE(correctLength - 5, 0);
  assert.throws(() => decodeNativeFrame(wrong), (err) => {
    assert.ok(err instanceof FramingError);
    assert.equal(err.code, FRAME_ERROR.NOT_JSON);
    return true;
  });

  // The streaming decoder must reject it too, not emit a truncated object.
  const errors = [];
  const messages = [];
  const decoder = createNativeFrameDecoder({ onMessage: (m) => messages.push(m), onError: (e) => errors.push(e) });
  decoder.push(wrong);
  assert.equal(messages.length, 0, 'no message may be emitted from a misframed payload');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, FRAME_ERROR.NOT_JSON);
  assert.ok(decoder.error(), 'the decoder must latch the failure');
});

test('framing: a prefix that over-counts produces a truncated frame error', () => {
  const good = encodeNativeFrame({ alpha: 'bravo' });
  const wrong = Buffer.from(good);
  wrong.writeUInt32LE(good.readUInt32LE(0) + 9, 0);

  assert.throws(() => decodeNativeFrame(wrong), (err) => {
    assert.ok(err instanceof FramingError);
    assert.equal(err.code, FRAME_ERROR.TRUNCATED_FRAME);
    assert.match(err.message, /truncated frame/);
    return true;
  });
});

test('framing: trailing bytes after a complete frame are a framing violation', () => {
  const frame = Buffer.concat([encodeNativeFrame({ a: 1 }), Buffer.from([0x7b, 0x7d])]);
  assert.throws(() => decodeNativeFrame(frame), (err) => {
    assert.equal(err.code, FRAME_ERROR.TRAILING_BYTES);
    return true;
  });
});

test('framing: a payload that is not JSON is rejected', () => {
  const garbage = Buffer.from([3, 0, 0, 0, 0x7b, 0x7b, 0x7b]); // three '{'
  assert.throws(() => decodeNativeFrame(garbage), (err) => err.code === FRAME_ERROR.NOT_JSON);

  const binary = Buffer.from([3, 0, 0, 0, 0xff, 0xfe, 0xfd]);
  assert.throws(() => decodeNativeFrame(binary), (err) => err.code === FRAME_ERROR.NOT_JSON);
});

test('framing: an impossible declared length is refused before allocation', () => {
  const hostile = Buffer.alloc(4);
  hostile.writeUInt32LE(0xfffffff0, 0);
  const result = trySliceNativeFrame(hostile);
  assert.equal(result.ok, false);
  assert.equal(result.reason, FRAME_ERROR.FRAME_TOO_LARGE);

  // The same guard applies under an explicitly lowered ceiling.
  const small = encodeNativeFrame({ a: 'x'.repeat(200) });
  assert.throws(
    () => decodeNativeFrame(small, { maxFrameBytes: 64 }),
    (err) => err.code === FRAME_ERROR.FRAME_TOO_LARGE,
  );
});

test('framing: encoding refuses a value that is not serialisable', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => encodeNativeFrame(cyclic), (err) => err.code === FRAME_ERROR.NOT_SERIALISABLE);
  assert.throws(() => encodeNativeFrame({ a: 1n }), (err) => err.code === FRAME_ERROR.NOT_SERIALISABLE);
});

test('framing: the streaming decoder reassembles across arbitrary chunk splits', async () => {
  const messages = [];
  const decoder = createNativeFrameDecoder({ onMessage: (m) => messages.push(m) });
  const a = encodeNativeFrame({ type: 'relay.ping', id: 1 });
  const b = encodeNativeFrame({ type: 'relay.send', id: 2, envelope: { text: '🌍' } });
  const c = encodeNativeFrame({ type: 'relay.reply', id: 1, ok: true });
  const whole = Buffer.concat([a, b, c]);

  // One byte at a time: the worst case a pipe can produce.
  for (const byte of whole) decoder.push(Buffer.from([byte]));
  assert.equal(messages.length, 3, 'three frames must come out of a byte-at-a-time feed');
  assert.equal(messages[0].id, 1);
  assert.equal(messages[1].envelope.text, '🌍');
  assert.equal(messages[2].ok, true);
  assert.equal(decoder.buffered(), 0);
  assert.equal(decoder.error(), null);
  assert.ok(DEFAULT_MAX_FRAME_BYTES > 0);
});

test('framing: several frames in one chunk are all delivered', () => {
  const messages = [];
  const decoder = createNativeFrameDecoder({ onMessage: (m) => messages.push(m) });
  decoder.push(Buffer.concat([
    encodeNativeFrame('chrome-extension://id/'),
    encodeNativeFrame({ type: 'relay.ping' }),
  ]));
  assert.deepEqual(messages, ['chrome-extension://id/', { type: 'relay.ping' }]);
});

test('framing: end() reports a dangling partial frame instead of dropping it', () => {
  const errors = [];
  const decoder = createNativeFrameDecoder({ onError: (e) => errors.push(e) });
  const full = encodeNativeFrame({ type: 'relay.ping' });
  decoder.push(full.subarray(0, full.length - 3));
  assert.equal(errors.length, 0, 'a partial frame mid-stream is normal, not an error');
  decoder.end();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, FRAME_ERROR.TRUNCATED_FRAME);
});

/* ------------------------------------------------- newline-delimited JSON-RPC */

test('framing: JSON-RPC round-trips through one line', () => {
  const message = { jsonrpc: JSONRPC_VERSION, id: 3, method: 'session/new', params: { cwd: 'C:/repo' } };
  const line = encodeJsonRpcLine(message);

  assert.ok(line.endsWith('\n'));
  assert.equal(line.split('\n').length, 2, 'exactly one newline, so exactly one message');
  assert.deepEqual(parseJsonRpcLine(line.slice(0, -1), { expect: 'request' }), message);
  assert.equal(classifyJsonRpcMessage(message), 'request');
});

test('framing: a message carrying both method and result is refused', () => {
  const conflated = { jsonrpc: '2.0', id: 1, method: 'session/prompt', result: { stopReason: 'end_turn' } };
  assert.equal(classifyJsonRpcMessage(conflated), 'invalid');
  assert.throws(() => encodeJsonRpcLine(conflated), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
  assert.throws(() => parseJsonRpcLine(JSON.stringify(conflated)), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
});

test('framing: a log line can never be written to the ACP stream', () => {
  // ACP-10: stdout is a protocol channel. A bare string is not a JSON-RPC
  // message and must be refused at the only sanctioned writer.
  assert.throws(() => encodeJsonRpcLine('initializing opencode acp'), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
  assert.throws(() => encodeJsonRpcLine({ level: 'info', msg: 'hello' }), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
  assert.throws(() => encodeJsonRpcLine({ jsonrpc: '1.0', id: 1, result: {} }), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
  assert.throws(() => encodeJsonRpcLine([{ jsonrpc: '2.0', id: 1, result: {} }]), (err) => err.code === FRAME_ERROR.JSONRPC_SHAPE);
});

test('framing: notifications, responses and error responses classify correctly', () => {
  assert.equal(classifyJsonRpcMessage({ jsonrpc: '2.0', method: 'session/cancel', params: {} }), 'notification');
  assert.equal(classifyJsonRpcMessage({ jsonrpc: '2.0', id: 1, result: {} }), 'response');
  assert.equal(classifyJsonRpcMessage({ jsonrpc: '2.0', id: 1, error: { code: -1, message: 'x' } }), 'response');
  assert.equal(classifyJsonRpcMessage({ jsonrpc: '2.0', id: 1, result: {}, error: { code: -1, message: 'x' } }), 'invalid');
  assert.equal(classifyJsonRpcMessage({ jsonrpc: '2.0', id: 1 }), 'invalid');
  assert.equal(classifyJsonRpcMessage(null), 'invalid');
  assert.equal(classifyJsonRpcMessage([]), 'invalid');
});

test('framing: the NDJSON decoder buffers partial lines and handles CRLF', () => {
  const messages = [];
  const decoder = createNdjsonDecoder({ onMessage: (m) => messages.push(m) });
  const line = encodeJsonRpcLine({ jsonrpc: '2.0', id: 1, result: { stopReason: 'end_turn' } });

  decoder.push(line.slice(0, 10));
  assert.equal(messages.length, 0, 'an unterminated line must wait');
  decoder.push(`${line.slice(10).replace(/\n$/, '')}\r\n`);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].result, { stopReason: 'end_turn' });

  decoder.push(`${encodeJsonRpcLine({ jsonrpc: '2.0', method: 'session/update', params: {} })}\n${encodeJsonRpcLine({ jsonrpc: '2.0', id: 2, result: {} })}`);
  assert.equal(messages.length, 3, 'a final line without a newline is still delivered');
});

test('framing: a malformed ACP line is fatal for the stream, not resynchronised', () => {
  const messages = [];
  const errors = [];
  const decoder = createNdjsonDecoder({ onMessage: (m) => messages.push(m), onError: (e) => errors.push(e) });

  decoder.push('{"jsonrpc":"2.0","id":1,"result":{}}\n');
  decoder.push('this is not json\n');
  decoder.push('{"jsonrpc":"2.0","id":2,"result":{}}\n');

  assert.equal(messages.length, 1, 'nothing after a corrupt line may be trusted');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, FRAME_ERROR.LINE_NOT_JSON);
  assert.ok(decoder.error());
});

test('framing: an over-long ACP line is refused instead of buffered forever', () => {
  const errors = [];
  const decoder = createNdjsonDecoder({ maxLineBytes: 64, onError: (e) => errors.push(e) });
  decoder.push(`{"jsonrpc":"2.0","id":1,"result":{"pad":"${'x'.repeat(500)}`);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, FRAME_ERROR.LINE_TOO_LONG);
  assert.equal(decoder.buffered(), 0);
});

test('framing: a string with an embedded newline stays one message', () => {
  const message = { jsonrpc: '2.0', id: 1, result: { text: 'line one\nline two' } };
  const line = encodeJsonRpcLine(message);
  const messages = [];
  const decoder = createNdjsonDecoder({ onMessage: (m) => messages.push(m) });
  decoder.push(line);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].result.text, 'line one\nline two');
});