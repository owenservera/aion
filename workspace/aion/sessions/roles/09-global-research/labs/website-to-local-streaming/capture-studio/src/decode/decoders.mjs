// Incremental L2 decoders. Each consumes raw L1 bytes for one stream, in order, and yields
// protocol envelopes WITHOUT dropping unknown fields. Every event carries the byte span it was
// decoded from, so the studio can link raw bytes <-> parsed events.

const NL = 0x0a, CR = 0x0d;

function tryJson(text) {
  if (typeof text !== 'string') return undefined;
  const t = text.trim();
  if (!t || (t[0] !== '{' && t[0] !== '[' && t[0] !== '"')) return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
}

// Byte-level line splitter honoring \n, \r\n and \r (as the SSE spec requires).
class LineSplitter {
  constructor() { this.buf = Buffer.alloc(0); this.offset = 0; this.pendingCR = false; }
  push(chunk) {
    const lines = [];
    let data = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    let base = this.offset;
    let start = 0;
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      if (this.pendingCR) { this.pendingCR = false; if (b === NL && i === start) { start = i + 1; continue; } }
      if (b === NL || b === CR) {
        lines.push({ line: data.subarray(start, i), start: base + start, end: base + i + 1 });
        if (b === CR) { if (i + 1 < data.length) { if (data[i + 1] === NL) { i++; lines[lines.length - 1].end++; } } else this.pendingCR = true; }
        start = i + 1;
      }
    }
    this.buf = Buffer.from(data.subarray(start));
    this.offset = base + start;
    return lines;
  }
  rest() { return this.buf.length ? { line: this.buf, start: this.offset, end: this.offset + this.buf.length } : null; }
}

export class SseDecoder {
  constructor() { this.kind = 'sse'; this.lines = new LineSplitter(); this._reset(); this.count = 0; }
  _reset() { this.cur = { data: [], event: undefined, id: undefined, retry: undefined, comments: [], unknown: {}, start: null }; }
  _dispatch(end) {
    const c = this.cur;
    const hasContent = c.data.length || c.event !== undefined || c.id !== undefined || c.retry !== undefined || c.comments.length || Object.keys(c.unknown).length;
    this._reset();
    if (!hasContent) return null;
    const data = c.data.join('\n');
    const ev = { type: 'sse', event: c.event ?? 'message', data, span: [c.start, end], index: this.count++ };
    if (c.id !== undefined) ev.id = c.id;
    if (c.retry !== undefined) ev.retry = c.retry;
    if (c.comments.length) ev.comments = c.comments;
    if (Object.keys(c.unknown).length) ev.unknownFields = c.unknown;
    const j = tryJson(data);
    if (j !== undefined) ev.json = j;
    if (data.trim() === '[DONE]') ev.terminal = true;
    if (!c.data.length && !c.event && c.comments.length) ev.type = 'sse.comment';
    return ev;
  }
  push(chunk) {
    const out = [];
    for (const { line, start, end } of this.lines.push(chunk)) {
      if (this.cur.start === null) this.cur.start = start;
      if (line.length === 0) { const e = this._dispatch(end); if (e) out.push(e); continue; }
      const s = line.toString('utf8');
      if (s[0] === ':') { this.cur.comments.push(s.slice(1).replace(/^ /, '')); continue; }
      const colon = s.indexOf(':');
      const field = colon === -1 ? s : s.slice(0, colon);
      const value = colon === -1 ? '' : s.slice(colon + 1).replace(/^ /, '');
      if (field === 'data') this.cur.data.push(value);
      else if (field === 'event') this.cur.event = value;
      else if (field === 'id') this.cur.id = value;
      else if (field === 'retry') this.cur.retry = /^\d+$/.test(value) ? Number(value) : value;
      else (this.cur.unknown[field] ??= []).push(value);
    }
    return out;
  }
  end() {
    const out = [];
    const r = this.lines.rest();
    if (r) out.push(...this.push(Buffer.from('\n')));
    if (this.cur.start !== null) {
      const e = this._dispatch(this.lines.offset);
      if (e) { e.incomplete = true; out.push(e); }
    }
    return out;
  }
}

export class NdjsonDecoder {
  constructor() { this.kind = 'ndjson'; this.lines = new LineSplitter(); this.count = 0; }
  _ev({ line, start, end }, incomplete = false) {
    const text = line.toString('utf8');
    if (!text.trim()) return null;
    const ev = { type: 'ndjson', text, span: [start, end], index: this.count++ };
    const j = tryJson(text);
    if (j !== undefined) ev.json = j; else ev.unparsed = true;
    if (incomplete) ev.incomplete = true;
    return ev;
  }
  push(chunk) { return this.lines.push(chunk).map((l) => this._ev(l)).filter(Boolean); }
  end() { const r = this.lines.rest(); const e = r && this._ev(r, true); return e ? [e] : []; }
}

export class WholeBodyDecoder {
  constructor(kind = 'json') { this.kind = kind; this.parts = []; this.size = 0; }
  push(chunk) { this.parts.push(chunk); this.size += chunk.length; return []; }
  end() {
    const buf = Buffer.concat(this.parts);
    if (!buf.length) return [];
    if (this.kind === 'binary') return [{ type: 'binary', size: buf.length, span: [0, buf.length], index: 0 }];
    const text = buf.toString('utf8');
    const ev = { type: this.kind, span: [0, buf.length], index: 0, size: buf.length };
    const j = tryJson(text);
    if (j !== undefined) ev.json = j;
    else if (this.kind === 'json') ev.unparsed = true;
    if (this.kind === 'html' || this.kind === 'text') ev.text = text;
    return [ev];
  }
}

export function classifyMime(mime = '') {
  const m = mime.toLowerCase();
  if (m.includes('event-stream')) return 'sse';
  if (m.includes('ndjson') || m.includes('jsonl') || m.includes('json-seq') || m.includes('x-json-stream')) return 'ndjson';
  if (m.includes('json')) return 'json';
  if (m.includes('html')) return 'html';
  if (m.startsWith('text/') || m.includes('javascript') || m.includes('xml')) return 'text';
  if (!m) return 'unknown';
  return 'binary';
}

// Choose a decoder from the declared MIME type, overridden by content sniffing of the first bytes
// (sites often serve SSE or NDJSON under a generic type).
export function pickDecoder(mime, firstBytes, forced) {
  const kind = forced || sniff(mime, firstBytes);
  if (kind === 'sse') return new SseDecoder();
  if (kind === 'ndjson') return new NdjsonDecoder();
  if (kind === 'json' || kind === 'html' || kind === 'text') return new WholeBodyDecoder(kind);
  return new WholeBodyDecoder('binary');
}

export function sniff(mime, firstBytes) {
  const declared = classifyMime(mime);
  if (declared === 'sse' || declared === 'ndjson') return declared;
  const head = firstBytes ? firstBytes.subarray(0, 256).toString('utf8') : '';
  if (/^(data|event|id|retry):/m.test(head) && /^(data|event):/.test(head.trimStart())) return 'sse';
  if (declared === 'json' || declared === 'unknown' || declared === 'text') {
    const lines = head.split('\n').filter(Boolean);
    if (lines.length >= 2 && lines.slice(0, -1).every((l) => /^\s*[{[]/.test(l) && tryJson(l) !== undefined)) return 'ndjson';
  }
  if (declared === 'unknown' && /^\s*[{[]/.test(head)) return 'json';
  return declared === 'unknown' ? 'text' : declared;
}

// WebSocket frame payload decoding. Recognises Socket.IO/Engine.IO-style numeric prefixes.
export function decodeWsPayload({ opcode, payload }) {
  if (opcode === 2) return { type: 'ws.binary', size: Buffer.from(payload ?? '', 'base64').length };
  const text = payload ?? '';
  const ev = { type: 'ws.text', text };
  let j = tryJson(text);
  if (j === undefined) {
    const m = /^(\d+)([[{].*)$/s.exec(text);
    if (m) { j = tryJson(m[2]); if (j !== undefined) ev.prefix = m[1]; }
  }
  if (j !== undefined) ev.json = j;
  return ev;
}
