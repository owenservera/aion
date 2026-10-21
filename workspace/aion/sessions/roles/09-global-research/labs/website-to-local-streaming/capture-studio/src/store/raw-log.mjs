// Append-only, segmented raw event log with bounded memory and explicit gap records.
//
// Chrome cannot be slowed down by us, so true backpressure is impossible at the source.
// Instead: records are queued in memory up to `maxQueueBytes`; if the disk falls behind,
// further records are DROPPED and a `gap` record (with counts, bytes and affected stream ids)
// is written as soon as space frees. Nothing is ever silently lost or silently truncated.
import { createHash } from 'node:crypto';
import { mkdirSync, openSync, writeSync, fsyncSync, closeSync, writeFileSync, readFileSync, existsSync, renameSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import path from 'node:path';

const pad = (n) => String(n).padStart(6, '0');

export class RawLog extends EventEmitter {
  constructor(dir, { segmentBytes = 64 * 1024 * 1024, maxQueueBytes = 128 * 1024 * 1024, flushIntervalMs = 50, fsyncIntervalMs = 1000, writeDelayMs = 0 } = {}) {
    super();
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
    this.segmentBytes = segmentBytes;
    this.maxQueueBytes = maxQueueBytes;
    this.writeDelayMs = writeDelayMs; // test hook: simulate a slow disk
    this.seq = 0;
    this.queue = [];
    this.queueBytes = 0;
    this.dropped = null; // { records, bytes, sids:Set, firstSeq, lastSeq, since }
    this.manifest = this._loadManifest();
    this.stats = { records: 0, bytes: 0, droppedRecords: 0, droppedBytes: 0, gaps: 0, maxQueueBytesSeen: 0 };
    this.closed = false;
    this._openSegment(this.manifest.segments.length + 1);
    this.flushTimer = setInterval(() => this.flush(), flushIntervalMs);
    this.fsyncTimer = setInterval(() => this._fsync(), fsyncIntervalMs);
    this.flushTimer.unref?.(); this.fsyncTimer.unref?.();
  }

  _loadManifest() {
    const p = path.join(this.dir, 'manifest.json');
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
    return { format: 'aion-capture-raw/1', segments: [] };
  }

  _saveManifest() {
    const p = path.join(this.dir, 'manifest.json');
    writeFileSync(p + '.tmp', JSON.stringify(this.manifest, null, 2));
    renameSync(p + '.tmp', p);
  }

  _openSegment(n) {
    this.segName = `${pad(n)}.jsonl`;
    this.fd = openSync(path.join(this.dir, this.segName), 'a');
    this.segHash = createHash('sha256');
    this.segBytes = 0;
    this.segRecords = 0;
    this.segFirstSeq = null;
    this.segLastSeq = null;
  }

  _closeSegment(final = false) {
    if (this.fd === undefined) return;
    fsyncSync(this.fd);
    closeSync(this.fd);
    this.fd = undefined;
    if (this.segRecords > 0 || final) {
      this.manifest.segments.push({
        file: this.segName, bytes: this.segBytes, records: this.segRecords,
        firstSeq: this.segFirstSeq, lastSeq: this.segLastSeq, sha256: this.segHash.digest('hex'),
      });
      this._saveManifest();
    }
  }

  // Append a record. Returns the assigned seq, or null if it was dropped (a gap will be recorded).
  append(rec) {
    if (this.closed) return null;
    const seq = ++this.seq;
    const line = JSON.stringify({ seq, t: Date.now(), ...rec }) + '\n';
    const bytes = Buffer.byteLength(line);
    // Hysteresis: once dropping starts, keep dropping until the queue drains to half and the gap
    // record is written, so every gap is one contiguous, fully described seq range.
    if ((this.dropped || this.queueBytes + bytes > this.maxQueueBytes) && rec.k !== 'gap') {
      if (!this.dropped) this.dropped = { records: 0, bytes: 0, sids: new Set(), firstSeq: seq, lastSeq: seq, since: Date.now() };
      this.dropped.records++; this.dropped.bytes += bytes; this.dropped.lastSeq = seq;
      if (rec.sid) this.dropped.sids.add(rec.sid);
      this.stats.droppedRecords++; this.stats.droppedBytes += bytes;
      this.emit('drop', { seq, k: rec.k, sid: rec.sid });
      return null;
    }
    this.queue.push({ seq, line, bytes });
    this.queueBytes += bytes;
    if (this.queueBytes > this.stats.maxQueueBytesSeen) this.stats.maxQueueBytesSeen = this.queueBytes;
    return seq;
  }

  _emitGapIfAny() {
    if (!this.dropped || this.queueBytes > this.maxQueueBytes / 2) return;
    const d = this.dropped;
    this.dropped = null;
    this.stats.gaps++;
    this.append({ k: 'gap', reason: 'local_queue_overflow', droppedRecords: d.records, droppedBytes: d.bytes, droppedSeqFrom: d.firstSeq, droppedSeqTo: d.lastSeq, sids: [...d.sids], since: d.since });
  }

  flush() {
    if (this.writing || this.fd === undefined) return;
    this.writing = true;
    try {
      // Test hook: a "slow disk" writes one small batch per writeDelayMs, so the queue grows.
      if (this.writeDelayMs && !this.closing) {
        if (Date.now() < (this._nextWriteAt ?? 0)) return;
        this._nextWriteAt = Date.now() + this.writeDelayMs;
      }
      const limit = this.writeDelayMs && !this.closing ? 16 * 1024 : 4 * 1024 * 1024;
      // Write a bounded batch per tick so a slow disk shows up as queue growth, not a frozen loop.
      let batch = [], batchBytes = 0;
      while (this.queue.length && batchBytes < limit) { const r = this.queue.shift(); batch.push(r); batchBytes += r.bytes; }
      if (batch.length) {
        const buf = Buffer.from(batch.map((r) => r.line).join(''));
        writeSync(this.fd, buf);
        this.segHash.update(buf);
        this.segBytes += buf.length;
        this.segRecords += batch.length;
        if (this.segFirstSeq === null) this.segFirstSeq = batch[0].seq;
        this.segLastSeq = batch[batch.length - 1].seq;
        this.queueBytes -= batchBytes;
        this.stats.records += batch.length;
        this.stats.bytes += buf.length;
        this.emit('written', { records: batch.length, bytes: buf.length, lastSeq: this.segLastSeq });
        if (this.segBytes >= this.segmentBytes) { this._closeSegment(); this._openSegment(this.manifest.segments.length + 1); }
      }
      this._emitGapIfAny();
    } finally { this.writing = false; }
  }

  _fsync() { if (this.fd !== undefined) { try { fsyncSync(this.fd); } catch { /* ignore */ } } }

  get queueDepth() { return { records: this.queue.length, bytes: this.queueBytes }; }

  async close() {
    if (this.closed) return;
    clearInterval(this.flushTimer); clearInterval(this.fsyncTimer);
    this.closing = true;
    // Drain fully; a pending gap must be persisted before closing.
    while (this.queue.length || this.dropped) {
      if (this.dropped && !this.queue.length) { const d = this.dropped; this.dropped = null; this.stats.gaps++; this.queue.push(this._gapLine(d)); this.queueBytes += this.queue.at(-1).bytes; }
      this.flush();
    }
    this.closed = true;
    this._closeSegment(true);
  }

  _gapLine(d) {
    const seq = ++this.seq;
    const line = JSON.stringify({ seq, t: Date.now(), k: 'gap', reason: 'local_queue_overflow', droppedRecords: d.records, droppedBytes: d.bytes, droppedSeqFrom: d.firstSeq, droppedSeqTo: d.lastSeq, sids: [...d.sids], since: d.since }) + '\n';
    return { seq, line, bytes: Buffer.byteLength(line) };
  }
}
