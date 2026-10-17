// AION Relay Bridge — wire codecs.
//
// Three formats meet in this bridge and NONE of them are interchangeable
// (BRIDGE-DESIGN.md section 1):
//
//   1. Chrome <-> native host : 4-byte little-endian length prefix + UTF-8 JSON
//   2. native host <-> ACP    : newline-delimited JSON-RPC 2.0, stdin/stdout
//   3. AION semantics         : the 19-field relay envelope (see envelope-map.js)
//
// This module owns 1 and 2 and nothing else. It deliberately knows nothing
// about envelopes, ACP methods or task state, so the three formats cannot be
// conflated by accident through a shared helper.
//
// WHY the ACP-10 guard lives here: the ACP child's stdout is a protocol channel.
// Anything else written to it corrupts the JSON-RPC stream, so `writeJsonRpcLine`
// is the ONLY sanctioned writer on that side and it validates the shape before
// writing. Logs go to stderr (ACP-10), never here.

/** Chrome's length prefix is a 32-bit little-endian byte count. */
export const LENGTH_PREFIX_BYTES = 4;

/** Defensive ceiling on one Chrome message. Chrome's own send ceiling is 1 MiB. */
export const DEFAULT_MAX_FRAME_BYTES = 8 * 1024 * 1024;

/** Defensive ceiling on one ACP line. */
export const DEFAULT_MAX_LINE_BYTES = 8 * 1024 * 1024;

const MAX_UINT32 = 0xffffffff;

/** Stable error codes. Callers branch on `code`, never on message text. */
export const FRAME_ERROR = Object.freeze({
  NOT_SERIALISABLE: 'not_serialisable',
  FRAME_TOO_LARGE: 'frame_too_large',
  PREFIX_TOO_LARGE: 'length_prefix_too_large',
  PREFIX_MISMATCH: 'length_prefix_mismatch',
  TRUNCATED_FRAME: 'truncated_frame',
  NOT_JSON: 'payload_not_json',
  NOT_OBJECT: 'payload_not_object',
  TRAILING_BYTES: 'trailing_bytes',
  LINE_TOO_LONG: 'line_too_long',
  LINE_NOT_JSON: 'line_not_json',
  JSONRPC_SHAPE: 'jsonrpc_shape_invalid',
  JSONRPC_VERSION: 'jsonrpc_version_invalid',
});

export class FramingError extends Error {
  constructor(code, message, detail = undefined) {
    super(message);
    this.name = 'FramingError';
    this.code = code;
    if (detail !== undefined) this.detail = detail;
  }
}

/* ============================================================ 1. Chrome framing */

/**
 * Encode one value as a Chrome native message.
 *
 * @param {unknown} value   any JSON-serialisable value
 * @param {{ maxFrameBytes?: number }} [opts]
 * @returns {Buffer} 4-byte LE length + UTF-8 JSON bytes
 */
export function encodeNativeFrame(value, opts = {}) {
  const maxFrameBytes = positiveInt(opts.maxFrameBytes, DEFAULT_MAX_FRAME_BYTES);
  let json;
  try {
    json = JSON.stringify(value);
  } catch (err) {
    // One error type out of this module: a caller that handles FramingError
    // must not also need to guess whether JSON.stringify threw underneath.
    throw new FramingError(
      FRAME_ERROR.NOT_SERIALISABLE,
      `value is not JSON-serialisable (${err && err.message})`,
    );
  }
  if (json === undefined) {
    throw new FramingError(FRAME_ERROR.NOT_SERIALISABLE, 'value is not JSON-serialisable');
  }
  const bytes = Buffer.from(json, 'utf8');
  if (bytes.length > MAX_UINT32) {
    throw new FramingError(FRAME_ERROR.PREFIX_TOO_LARGE, `payload of ${bytes.length} bytes cannot be length-prefixed`);
  }
  if (bytes.length > maxFrameBytes) {
    throw new FramingError(FRAME_ERROR.FRAME_TOO_LARGE, `frame of ${bytes.length} bytes exceeds the ${maxFrameBytes} byte limit`);
  }
  const frame = Buffer.allocUnsafe(LENGTH_PREFIX_BYTES + bytes.length);
  frame.writeUInt32LE(bytes.length, 0);
  bytes.copy(frame, LENGTH_PREFIX_BYTES);
  return frame;
}

/**
 * Try to take one complete frame off the front of `buffer`.
 *
 * Never throws for "not enough bytes yet": an incomplete frame is a normal
 * stream state, not an error, and a decoder that threw on it would turn every
 * fragmented write into a protocol failure.
 *
 * @returns {{ ok: true, value: unknown, size: number }
 *          | { ok: false, reason: 'incomplete' }
 *          | { ok: false, reason: string, message: string }}
 */
export function trySliceNativeFrame(buffer, opts = {}) {
  const maxFrameBytes = positiveInt(opts.maxFrameBytes, DEFAULT_MAX_FRAME_BYTES);

  if (!Buffer.isBuffer(buffer)) throw new TypeError('trySliceNativeFrame requires a Buffer');
  if (buffer.length < LENGTH_PREFIX_BYTES) return { ok: false, reason: 'incomplete' };

  const declared = buffer.readUInt32LE(0);

  // Refuse an impossible declared length BEFORE allocating anything, so a
  // hostile frame cannot make this process reserve gigabytes.
  if (declared > maxFrameBytes) {
    return {
      ok: false,
      reason: FRAME_ERROR.FRAME_TOO_LARGE,
      message: `declared length ${declared} exceeds the ${maxFrameBytes} byte limit`,
    };
  }

  const available = buffer.length - LENGTH_PREFIX_BYTES;
  if (available < declared) return { ok: false, reason: 'incomplete' };

  const payload = buffer.subarray(LENGTH_PREFIX_BYTES, LENGTH_PREFIX_BYTES + declared);
  let value;
  try {
    value = JSON.parse(payload.toString('utf8'));
  } catch (err) {
    // A length prefix that does not match the JSON it claims to frame lands
    // here (cut mid-token, or a prefix that is not a length at all).
    return {
      ok: false,
      reason: FRAME_ERROR.NOT_JSON,
      message: `payload is not valid JSON (${err && err.message})`,
    };
  }

  return { ok: true, value, size: LENGTH_PREFIX_BYTES + declared };
}

/**
 * Decode exactly one frame from a buffer that contains nothing else.
 *
 * Strict by design: trailing bytes mean the length prefix disagrees with the
 * data, which is a framing violation, not a stream to be resynchronised.
 *
 * @returns {{ value: unknown, size: number }}
 */
export function decodeNativeFrame(buffer, opts = {}) {
  const maxFrameBytes = positiveInt(opts.maxFrameBytes, DEFAULT_MAX_FRAME_BYTES);
  const result = trySliceNativeFrame(buffer, { maxFrameBytes });

  if (!result.ok && result.reason === 'incomplete') {
    const declared = Buffer.isBuffer(buffer) && buffer.length >= LENGTH_PREFIX_BYTES ? buffer.readUInt32LE(0) : null;
    throw new FramingError(
      FRAME_ERROR.TRUNCATED_FRAME,
      `truncated frame: only ${Math.max(0, buffer.length - LENGTH_PREFIX_BYTES)} of ${declared ?? '?'} declared bytes are present`,
    );
  }
  if (!result.ok) {
    throw new FramingError(result.reason, result.message);
  }
  if (result.size !== buffer.length) {
    throw new FramingError(
      FRAME_ERROR.TRAILING_BYTES,
      `length prefix declares ${result.size - LENGTH_PREFIX_BYTES} payload bytes but ${buffer.length - LENGTH_PREFIX_BYTES} are present`,
    );
  }
  return { value: result.value, size: result.size };
}

/**
 * Streaming Chrome frame decoder.
 *
 * Feeding a 3-byte chunk must not lose data, feeding two messages in one chunk
 * must emit two, and a fatal framing error must stop the decoder instead of
 * trying to resynchronise inside a stream that has no resync point.
 *
 * @param {{ maxFrameBytes?: number, onMessage?: (value: unknown) => void, onError?: (err: FramingError) => void }} [opts]
 */
export function createNativeFrameDecoder(opts = {}) {
  const maxFrameBytes = positiveInt(opts.maxFrameBytes, DEFAULT_MAX_FRAME_BYTES);
  const listeners = new Set();
  const errorListeners = new Set();
  let buffer = Buffer.alloc(0);
  let fatal = null;

  if (typeof opts.onMessage === 'function') listeners.add(opts.onMessage);
  if (typeof opts.onError === 'function') errorListeners.add(opts.onError);

  function fail(err) {
    // First failure wins: a corrupt stream is dead, and continuing would let
    // a smuggled payload be read as a fresh message after the garbage.
    if (!fatal) fatal = err;
    for (const fn of errorListeners) fn(err);
  }

  return {
    /** Bytes received so far that have not yet formed a complete frame. */
    buffered() {
      return buffer.length;
    },
    /** The first fatal error, if any. */
    error() {
      return fatal;
    },
    /**
     * Feed a chunk. Returns the number of complete frames emitted.
     *
     * @returns {number}
     */
    push(chunk) {
      if (fatal) return 0;
      buffer = buffer.length === 0
        ? Buffer.from(chunk)
        : Buffer.concat([buffer, chunk]);

      let emitted = 0;
      for (;;) {
        const result = trySliceNativeFrame(buffer, { maxFrameBytes });
        if (!result.ok) {
          if (result.reason !== 'incomplete') {
            fail(new FramingError(result.reason, result.message));
          }
          break;
        }
        buffer = buffer.subarray(result.size);
        for (const fn of listeners) fn(result.value);
        emitted += 1;
      }
      // Release the consumed prefix so a long-lived stream does not grow the
      // buffer forever.
      buffer = Buffer.from(buffer);
      return emitted;
    },
    /**
     * Signal end of input. A non-empty remainder is a truncated frame and is
     * reported as a fatal error rather than silently dropped.
     */
    end() {
      if (!fatal && buffer.length > 0) {
        fail(new FramingError(
          FRAME_ERROR.TRUNCATED_FRAME,
          `stream ended with ${buffer.length} buffered bytes that never formed a complete frame`,
        ));
      }
      buffer = Buffer.alloc(0);
    },
    onMessage(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    onError(fn) {
      errorListeners.add(fn);
      return () => errorListeners.delete(fn);
    },
  };
}

/* ==================================================== 2. newline JSON-RPC (ACP) */

/** The only JSON-RPC version ACP v1 speaks. */
export const JSONRPC_VERSION = '2.0';

/** Standard JSON-RPC error codes the bridge uses. */
export const JSONRPC_ERROR = Object.freeze({
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // ACP-flavoured application codes.
  PROMPT_IN_FLIGHT: -32001,
  CWD_MISMATCH: -32002,
  SESSION_GONE: -32003,
});

/**
 * Classify a JSON-RPC message.
 *
 * The point of this function is the guard against conflation: a message that
 * carries BOTH `method` and `result` is not a valid JSON-RPC message, and
 * silently "fixing" it is how a relay envelope ends up being treated as an
 * ACP response (or the reverse).
 *
 * @returns {'request'|'notification'|'response'|'error'|'invalid'}
 */
export function classifyJsonRpcMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return 'invalid';
  if (message.jsonrpc !== JSONRPC_VERSION) return 'invalid';

  const hasMethod = typeof message.method === 'string';
  const hasResult = Object.prototype.hasOwnProperty.call(message, 'result');
  const hasError = Object.prototype.hasOwnProperty.call(message, 'error');
  const hasId = Object.prototype.hasOwnProperty.call(message, 'id');

  // Exactly one of (method) or (result/error) must be present.
  if (hasMethod && (hasResult || hasError)) return 'invalid';
  if (!hasMethod && !hasResult && !hasError) return 'invalid';
  if (hasError && hasResult) return 'invalid';
  // An error response without an id is a server error report, not a reply.
  if (hasError && !hasId && message.error === null) return 'invalid';

  if (hasMethod) return hasId ? 'request' : 'notification';
  if (hasError) return 'response';
  return hasId ? 'response' : 'invalid';
}

/**
 * Serialise one JSON-RPC message as a single ACP line (trailing `\n`).
 *
 * Rejects anything that is not a well-formed JSON-RPC message, so a stray
 * `console.log` string can never reach the agent's stdin.
 *
 * @returns {string}
 */
export function encodeJsonRpcLine(message) {
  const kind = classifyJsonRpcMessage(message);
  if (kind === 'invalid') {
    throw new FramingError(
      FRAME_ERROR.JSONRPC_SHAPE,
      `refusing to write a non-JSON-RPC message to the ACP stream (classification: ${kind})`,
    );
  }
  const line = JSON.stringify(message);
  // JSON.stringify escapes control characters inside strings, so the serialised
  // message can never contain a raw newline. Assert it anyway: a raw newline
  // here would split one message into two broken ones on the wire.
  if (/[\r\n]/.test(line)) {
    throw new FramingError(FRAME_ERROR.JSONRPC_SHAPE, 'serialised JSON-RPC message contains a raw newline');
  }
  return `${line}\n`;
}

/**
 * Parse and shape-check one ACP line (without its newline).
 *
 * @returns {object}
 */
export function parseJsonRpcLine(line, opts = {}) {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch (err) {
    throw new FramingError(FRAME_ERROR.LINE_NOT_JSON, `ACP line is not valid JSON (${err && err.message})`);
  }
  if (parsed && parsed.jsonrpc !== undefined && parsed.jsonrpc !== JSONRPC_VERSION) {
    throw new FramingError(
      FRAME_ERROR.JSONRPC_VERSION,
      `unsupported jsonrpc version: ${JSON.stringify(parsed.jsonrpc)}`,
    );
  }
  const kind = classifyJsonRpcMessage(parsed);
  if (kind === 'invalid') {
    throw new FramingError(
      FRAME_ERROR.JSONRPC_SHAPE,
      `ACP line is not a valid JSON-RPC message (classification: ${kind})`,
    );
  }
  if (opts.expect && opts.expect !== kind) {
    throw new FramingError(
      FRAME_ERROR.JSONRPC_SHAPE,
      `expected a JSON-RPC ${opts.expect}, got ${kind}`,
    );
  }
  return parsed;
}

/**
 * Streaming newline-delimited JSON decoder for the ACP child's stdout.
 *
 * ACP-10: this decoder is the ONLY reader of the ACP stdout stream, and the
 * client never writes to it. A malformed line is fatal for the same reason a
 * bad frame is fatal — there is no resync point in a newline protocol.
 *
 * @param {{ maxLineBytes?: number, onMessage?: (message: object) => void, onError?: (err: FramingError) => void }} [opts]
 */
export function createNdjsonDecoder(opts = {}) {
  const maxLineBytes = positiveInt(opts.maxLineBytes, DEFAULT_MAX_LINE_BYTES);
  const listeners = new Set();
  const errorListeners = new Set();
  let buffer = '';
  let fatal = null;

  if (typeof opts.onMessage === 'function') listeners.add(opts.onMessage);
  if (typeof opts.onError === 'function') errorListeners.add(opts.onError);

  function fail(err) {
    if (!fatal) fatal = err;
    for (const fn of errorListeners) fn(err);
  }

  return {
    buffered() {
      return buffer.length;
    },
    error() {
      return fatal;
    },
    push(chunk) {
      if (fatal) return 0;
      const text = buffer + (typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      const lines = text.split('\n');
      // The last element is the partial tail, unless the chunk ended exactly on
      // a newline (then it is the empty string).
      buffer = lines.pop();
      if (Buffer.byteLength(buffer, 'utf8') > maxLineBytes) {
        buffer = '';
        fail(new FramingError(FRAME_ERROR.LINE_TOO_LONG, `ACP line exceeds the ${maxLineBytes} byte limit`));
        return 0;
      }

      let emitted = 0;
      for (const raw of lines) {
        const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
        if (line.trim() === '') continue;
        let message;
        try {
          message = parseJsonRpcLine(line);
        } catch (err) {
          fail(err);
          return emitted;
        }
        for (const fn of listeners) fn(message);
        emitted += 1;
      }
      return emitted;
    },
    end() {
      const tail = buffer.trim();
      buffer = '';
      if (fatal || tail === '') return;
      // Data left after the final newline: a truncated protocol line.
      try {
        parseJsonRpcLine(tail);
        fail(new FramingError(FRAME_ERROR.LINE_NOT_JSON, `ACP stream ended with an unterminated line: ${tail.slice(0, 80)}`));
      } catch (err) {
        fail(err);
      }
    },
    onMessage(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    onError(fn) {
      errorListeners.add(fn);
      return () => errorListeners.delete(fn);
    },
  };
}

/* ============================================================ 3. shared helpers */

/** UTF-8 byte length of a string — the unit Chrome's length prefix counts. */
export function utf8ByteLength(text) {
  return Buffer.byteLength(String(text), 'utf8');
}

function positiveInt(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}