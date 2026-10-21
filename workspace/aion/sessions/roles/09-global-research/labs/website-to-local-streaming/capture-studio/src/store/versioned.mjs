// Generic versioned JSON store: every save is a new immutable vNNNN.json, CURRENT points at the
// active version, rollback just moves the pointer. Used by site profiles and provider families.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';

const pad = (n) => String(n).padStart(4, '0');

export class VersionedStore {
  constructor(dir, { builtinDir, normalize = (x) => x, kind = 'item' } = {}) {
    this.dir = dir;
    this.normalize = normalize;
    this.kind = kind;
    mkdirSync(dir, { recursive: true });
    if (builtinDir && existsSync(builtinDir)) {
      for (const f of readdirSync(builtinDir).filter((x) => x.endsWith('.json'))) {
        const p = JSON.parse(readFileSync(path.join(builtinDir, f), 'utf8'));
        if (!existsSync(path.join(this.dir, p.name))) this.save(p.name, p, `seeded from built-in ${f}`);
      }
    }
  }

  names() { return readdirSync(this.dir).filter((d) => existsSync(path.join(this.dir, d, 'CURRENT'))).sort(); }

  versions(name) {
    const d = path.join(this.dir, name);
    if (!existsSync(d)) return [];
    return readdirSync(d).filter((f) => /^v\d{4}\.json$/.test(f)).map((f) => {
      const p = JSON.parse(readFileSync(path.join(d, f), 'utf8'));
      return { version: p.version, savedAt: p.savedAt, note: p.changeNote };
    }).sort((a, b) => a.version - b.version);
  }

  current(name) {
    const c = path.join(this.dir, name, 'CURRENT');
    return existsSync(c) ? Number(readFileSync(c, 'utf8').trim()) : null;
  }

  has(name) { return this.current(name) !== null; }

  load(name, version) {
    const v = version ?? this.current(name);
    if (!v) throw new Error(`No ${this.kind} "${name}".`);
    const p = path.join(this.dir, name, `v${pad(v)}.json`);
    if (!existsSync(p)) throw new Error(`${this.kind} ${name} has no version ${v}.`);
    return this.normalize(JSON.parse(readFileSync(p, 'utf8')));
  }

  save(name, value, changeNote = '') {
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name)) throw new Error(`invalid ${this.kind} name: ${name}`);
    const d = path.join(this.dir, name);
    mkdirSync(d, { recursive: true });
    const version = (this.versions(name).at(-1)?.version ?? 0) + 1;
    const rec = { ...this.normalize(value), name, version, savedAt: new Date().toISOString(), changeNote };
    writeFileSync(path.join(d, `v${pad(version)}.json`), JSON.stringify(rec, null, 2));
    const cur = path.join(d, 'CURRENT');
    writeFileSync(cur + '.tmp', String(version)); renameSync(cur + '.tmp', cur);
    return rec;
  }

  rollback(name, version) {
    this.load(name, version);
    writeFileSync(path.join(this.dir, name, 'CURRENT'), String(version));
    return this.load(name);
  }
}
