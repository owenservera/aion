// StreamReducer: turns raw L1 records into stream state + decoded L2 events.
// Used identically by the live recorder and by offline replay/derive, so the live view and
// a later reconstruction from disk cannot disagree.
import { pickDecoder, decodeWsPayload, classifyMime } from '../decode/decoders.mjs';
import { DeltaAssembler } from '../decode/delta.mjs';

export function transportOf(stream) {
  if (stream.kind === 'ws') return 'WEBSOCKET';
  if (stream.esMessages > 0) return 'EVENT_SOURCE';
  if (stream.decoder === 'sse') return 'HTTP_SSE';
  if (stream.decoder === 'ndjson') return 'HTTP_NDJSON';
  if (stream.chunks > 1) return 'HTTP_STREAMED';
  return 'HTTP';
}

export class StreamReducer {
  constructor({ deltaDialect = 'auto', keepEvents = true, maxEventsPerStream = Infinity } = {}) {
    this.maxEventsPerStream = maxEventsPerStream; // live view is bounded; disk keeps everything
    this.streams = new Map();
    this.deltaDialect = deltaDialect;
    this.keepEvents = keepEvents;
    this.gaps = [];
    this.nav = [];
    this.actions = [];
    this.dom = { batches: 0, mutations: 0, blocks: new Map() };
    this.lifecycle = [];
    this.run = {};
  }

  _stream(sid, init = {}) {
    let s = this.streams.get(sid);
    if (!s) {
      s = { sid, kind: 'http', chunks: 0, bytes: 0, preBytes: 0, events: 0, esMessages: 0, frames: 0, status: 'open', coverage: 'observed_from_request_start', redactions: 0, gaps: 0, ...init };
      Object.defineProperty(s, '_dec', { value: null, writable: true, enumerable: false });
      Object.defineProperty(s, '_delta', { value: new DeltaAssembler(this.deltaDialect), writable: true, enumerable: false });
      Object.defineProperty(s, '_events', { value: [], writable: true, enumerable: false });
      this.streams.set(sid, s);
    }
    return s;
  }

  _emitEvents(s, evs, rec, out) {
    for (const ev of evs) {
      const e = { sid: s.sid, seq: rec.seq, t: rec.t, layer: 'L2', ...ev };
      if (ev.json !== undefined) {
        if (s._delta.apply(ev.json)) e.revision = s._delta.revisions;
      }
      s.events++;
      if (this.keepEvents) {
        s._events.push(e);
        if (s._events.length > this.maxEventsPerStream) { s._events.shift(); s.eventsOnlyOnDisk = (s.eventsOnlyOnDisk ?? 0) + 1; }
      }
      out.push(e);
    }
  }

  _ensureDecoder(s, firstBytes) {
    if (!s._dec) { s._dec = pickDecoder(s.mime, firstBytes, s.forcedDecoder); s.decoder = s._dec.kind; }
    return s._dec;
  }

  // Returns derived L2 events produced by this raw record.
  ingest(rec) {
    const out = [];
    switch (rec.k) {
      case 'run.start': this.run = { ...rec }; break;
      case 'run.end': this.run.end = rec; for (const s of this.streams.values()) if (s.status === 'open') { s.status = 'incomplete_at_stop'; this._finish(s, rec, out); } break;
      case 'req': {
        const s = this._stream(rec.sid, { url: rec.url, method: rec.method, resourceType: rec.type, startedT: rec.t, frameId: rec.frameId, initiator: rec.initiator, target: rec.target });
        s.url = rec.url; s.method = rec.method; s.resourceType = rec.type;
        if (rec.policy) s.policy = rec.policy;
        break;
      }
      case 'res': {
        const s = this._stream(rec.sid);
        Object.assign(s, { status_code: rec.status, mime: rec.mime, protocol: rec.protocol, firstResponseT: rec.t, fromServiceWorker: rec.fromServiceWorker, fromCache: rec.fromCache });
        s.mimeClass = classifyMime(rec.mime);
        break;
      }
      case 'stream.armed': { const s = this._stream(rec.sid); s.armed = rec.mode; s.armedT = rec.t; break; }
      case 'stream.arm_failed': { const s = this._stream(rec.sid); s.armError = rec.error; break; }
      case 'chunk':
      case 'body': {
        const s = this._stream(rec.sid);
        const buf = Buffer.from(rec.b64 ?? '', 'base64');
        s.chunks++; s.bytes += buf.length;
        if (rec.pre) s.preBytes += buf.length;
        if (rec.k === 'body') s.retrospective = true;
        if (rec.redactions?.length) s.redactions += rec.redactions.length;
        if (!s.firstChunkT) s.firstChunkT = rec.t;
        s.lastChunkT = rec.t;
        this._emitEvents(s, this._ensureDecoder(s, buf).push(buf), rec, out);
        break;
      }
      case 'done': { const s = this._stream(rec.sid); s.status = 'complete'; s.encodedDataLength = rec.encodedDataLength; s.endT = rec.t; this._finish(s, rec, out); break; }
      case 'fail': { const s = this._stream(rec.sid); s.status = rec.canceled ? 'canceled' : 'failed'; s.error = rec.errorText; s.endT = rec.t; this._finish(s, rec, out); break; }
      case 'body.excluded': { const s = this._stream(rec.sid); s.bodyExcluded = rec.reason; break; }
      case 'es.msg': {
        const s = this._stream(rec.sid);
        s.esMessages++;
        let json; try { json = JSON.parse(rec.data); } catch { /* not json */ }
        this._emitEvents(s, [{ type: 'eventsource', event: rec.eventName || 'message', id: rec.eventId || undefined, data: rec.data, ...(json !== undefined ? { json } : {}), browserParsed: true }], rec, out);
        break;
      }
      case 'ws.open': { this._stream(rec.sid, { kind: 'ws', url: rec.url, startedT: rec.t, target: rec.target }); break; }
      case 'ws.handshake': { const s = this._stream(rec.sid, { kind: 'ws' }); s.status_code = rec.status; break; }
      case 'ws.frame': {
        const s = this._stream(rec.sid, { kind: 'ws' });
        s.frames++;
        const size = rec.opcode === 2 ? Buffer.from(rec.payload ?? '', 'base64').length : Buffer.byteLength(rec.payload ?? '');
        s.bytes += size;
        if (!s.firstChunkT) s.firstChunkT = rec.t;
        s.lastChunkT = rec.t;
        this._emitEvents(s, [{ ...decodeWsPayload(rec), dir: rec.dir, opcode: rec.opcode, size }], rec, out);
        break;
      }
      case 'ws.close': { const s = this._stream(rec.sid, { kind: 'ws' }); s.status = 'closed'; s.endT = rec.t; break; }
      case 'gap': {
        this.gaps.push(rec);
        for (const sid of rec.sids ?? []) { const s = this.streams.get(sid); if (s) { s.gaps++; s.coverage = 'gap_in_stream'; } }
        break;
      }
      case 'nav': this.nav.push(rec); break;
      case 'action': this.actions.push(rec); break;
      case 'dom.batch': {
        this.dom.batches++;
        for (const m of rec.items ?? []) {
          this.dom.mutations++;
          const b = this.dom.blocks.get(m.id) ?? { id: m.id, sig: m.sig, firstT: rec.t, revisions: 0 };
          b.revisions++; b.lastT = rec.t; b.text = m.text ?? b.text; b.tag = m.tag ?? b.tag; b.removed = m.op === 'removed';
          this.dom.blocks.set(m.id, b);
        }
        break;
      }
      case 'lifecycle': this.lifecycle.push(rec); break;
      default: break;
    }
    return out;
  }

  _finish(s, rec, out) {
    if (s._dec) this._emitEvents(s, s._dec.end(), rec, out);
    s.transport = transportOf(s);
  }

  // Summary for UI / receipts (no payload content).
  summary() {
    const streams = [...this.streams.values()].map((s) => ({ ...s, transport: s.transport ?? transportOf(s), deltaRevisions: s._delta.revisions, deltaDialects: [...s._delta.detected] }));
    const counts = {};
    for (const s of streams) counts[s.transport] = (counts[s.transport] ?? 0) + 1;
    return { streams, transportCounts: counts, gaps: this.gaps.length, navs: this.nav.length, actions: this.actions.length, domBatches: this.dom.batches, domBlocks: this.dom.blocks.size };
  }

  eventsOf(sid) { return this.streams.get(sid)?._events ?? []; }
  assembled(sid) { const s = this.streams.get(sid); return s ? { doc: s._delta.doc, revisions: s._delta.revisions, texts: s._delta.texts(1).slice(0, 20) } : null; }
  rawBytesOf() { return null; } // raw bytes are read back from disk on demand (see replay/reader.mjs)
}
