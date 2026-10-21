// Session storage, modelled on Apify's storage triad:
//   raw/       append-only source of truth (RawLog)          ~ request/response stream archive
//   datasets/  append-only structured records (JSONL)         ~ Apify Dataset
//   kv/        named JSON/blob values (INPUT, STATE, ...)     ~ Apify Key-Value Store
// plus session.json with run metadata, status and stats.
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, appendFileSync, renameSync, createReadStream, statSync, rmSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import readline from 'node:readline';
import path from 'node:path';
import { RawLog } from './raw-log.mjs';

export class KeyValueStore {
  constructor(dir) { this.dir = dir; mkdirSync(dir, { recursive: true }); }
  _p(key) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(key)) throw new Error(`invalid key: ${key}`);
    return path.join(this.dir, key.includes('.') ? key : `${key}.json`);
  }
  set(key, value) {
    const p = this._p(key);
    const data = typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2);
    writeFileSync(p + '.tmp', data); renameSync(p + '.tmp', p);
  }
  get(key, fallback = undefined) {
    const p = this._p(key);
    if (!existsSync(p)) return fallback;
    const raw = readFileSync(p, 'utf8');
    return p.endsWith('.json') ? JSON.parse(raw) : raw;
  }
  keys() { return readdirSync(this.dir).filter((f) => !f.endsWith('.tmp')); }
}

export class Dataset {
  constructor(file) { this.file = file; mkdirSync(path.dirname(file), { recursive: true }); this.count = 0; }
  push(items) {
    const arr = Array.isArray(items) ? items : [items];
    if (!arr.length) return;
    appendFileSync(this.file, arr.map((i) => JSON.stringify(i)).join('\n') + '\n');
    this.count += arr.length;
  }
  reset() { if (existsSync(this.file)) rmSync(this.file); this.count = 0; }
  async *iterate() {
    if (!existsSync(this.file)) return;
    const rl = readline.createInterface({ input: createReadStream(this.file), crlfDelay: Infinity });
    for await (const line of rl) if (line.trim()) yield JSON.parse(line);
  }
  async toArray(limit = Infinity) { const out = []; for await (const i of this.iterate()) { out.push(i); if (out.length >= limit) break; } return out; }
}

export function newSessionId(site = 'site') {
  const d = new Date();
  const ts = d.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const slug = String(site).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'site';
  return `${ts}-${slug}-${randomBytes(3).toString('hex')}`;
}

export class Session {
  static create(sessionsDir, { site, meta = {}, rawOptions = {} } = {}) {
    const id = newSessionId(site);
    const dir = path.join(sessionsDir, id);
    mkdirSync(dir, { recursive: true });
    const s = new Session(dir);
    s.meta = { id, site, createdAt: new Date().toISOString(), status: 'recording', ...meta };
    s.saveMeta();
    s.raw = new RawLog(path.join(dir, 'raw'), rawOptions);
    return s;
  }

  static open(sessionsDir, idOrPrefix) {
    const dir = resolveSessionDir(sessionsDir, idOrPrefix);
    return new Session(dir);
  }

  constructor(dir) {
    this.dir = dir;
    this.kv = new KeyValueStore(path.join(dir, 'kv'));
    const mp = path.join(dir, 'session.json');
    this.meta = existsSync(mp) ? JSON.parse(readFileSync(mp, 'utf8')) : { id: path.basename(dir) };
  }

  get id() { return this.meta.id; }
  dataset(name) { return new Dataset(path.join(this.dir, 'datasets', `${name}.jsonl`)); }
  saveMeta() { const p = path.join(this.dir, 'session.json'); writeFileSync(p + '.tmp', JSON.stringify(this.meta, null, 2)); renameSync(p + '.tmp', p); }

  // Iterate raw records in seq order across all segments (including an unclosed one after a crash).
  async *records({ fromSeq = 0 } = {}) {
    const rawDir = path.join(this.dir, 'raw');
    if (!existsSync(rawDir)) return;
    const files = readdirSync(rawDir).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort();
    for (const f of files) {
      const rl = readline.createInterface({ input: createReadStream(path.join(rawDir, f)), crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line) continue;
        let r;
        try { r = JSON.parse(line); } catch { yield { k: 'corrupt', file: f, note: 'unparseable line (likely torn write at crash)' }; continue; }
        if (r.seq > fromSeq) yield r;
      }
    }
  }

  // Integrity check against the manifest: hashes, record counts, seq continuity.
  async verify() {
    const rawDir = path.join(this.dir, 'raw');
    const manifestPath = path.join(rawDir, 'manifest.json');
    const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { segments: [] };
    const bySeg = new Map(manifest.segments.map((s) => [s.file, s]));
    const files = existsSync(rawDir) ? readdirSync(rawDir).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort() : [];
    const report = { segments: [], ok: true, seqGaps: [], gapRecords: 0, droppedRecords: 0, records: 0 };
    let lastSeq = 0;
    for (const f of files) {
      const p = path.join(rawDir, f);
      const buf = readFileSync(p);
      const sha = createHash('sha256').update(buf).digest('hex');
      const m = bySeg.get(f);
      const entry = { file: f, bytes: buf.length, inManifest: !!m, shaMatches: m ? m.sha256 === sha : null, torn: buf.length > 0 && buf[buf.length - 1] !== 0x0a };
      if (m && !entry.shaMatches) report.ok = false;
      if (entry.torn) report.ok = false;
      report.segments.push(entry);
    }
    const ranges = [];
    for await (const r of this.records()) {
      if (r.k === 'corrupt') { report.ok = false; continue; }
      report.records++;
      if (r.seq !== lastSeq + 1) report.seqGaps.push({ from: lastSeq + 1, to: r.seq - 1 });
      lastSeq = r.seq;
      if (r.k === 'gap') { report.gapRecords++; report.droppedRecords += r.droppedRecords ?? 0; ranges.push([r.droppedSeqFrom, r.droppedSeqTo]); }
    }
    // A seq hole is expected only if a gap record declares that dropped range.
    const unexplained = report.seqGaps.filter((g) => !ranges.some(([a, b]) => a <= g.from && g.to <= b));
    report.unexplainedSeqGaps = unexplained.length;
    if (unexplained.length) { report.ok = false; report.unexplained = unexplained.slice(0, 20); }
    return report;
  }
}

export function listSessions(sessionsDir) {
  if (!existsSync(sessionsDir)) return [];
  return readdirSync(sessionsDir)
    .filter((d) => existsSync(path.join(sessionsDir, d, 'session.json')))
    .map((d) => {
      const meta = JSON.parse(readFileSync(path.join(sessionsDir, d, 'session.json'), 'utf8'));
      let bytes = 0;
      const raw = path.join(sessionsDir, d, 'raw');
      if (existsSync(raw)) for (const f of readdirSync(raw)) bytes += statSync(path.join(raw, f)).size;
      return { ...meta, rawBytes: bytes };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function resolveSessionDir(sessionsDir, idOrPrefix) {
  if (!idOrPrefix || idOrPrefix === 'latest') {
    const all = listSessions(sessionsDir);
    if (!all.length) throw new Error('No sessions recorded yet.');
    return path.join(sessionsDir, all[0].id);
  }
  const direct = path.join(sessionsDir, idOrPrefix);
  if (existsSync(path.join(direct, 'session.json'))) return direct;
  const hits = existsSync(sessionsDir) ? readdirSync(sessionsDir).filter((d) => d.startsWith(idOrPrefix) || d.endsWith(idOrPrefix)) : [];
  if (hits.length === 1) return path.join(sessionsDir, hits[0]);
  throw new Error(hits.length ? `"${idOrPrefix}" matches ${hits.length} sessions.` : `No session "${idOrPrefix}".`);
}
