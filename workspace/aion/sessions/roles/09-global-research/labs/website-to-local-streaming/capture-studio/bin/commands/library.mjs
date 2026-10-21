// library build|show|list: consolidate every derived session of one site into a single family
// shape set, persist it through the existing FamilyStore, and inspect what was consolidated.
import { EXIT } from '../../src/config.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound } from '../lib/ui.mjs';
import { buildFamily, writeFamily } from '../../src/families/build.mjs';

const fieldPathCount = (shapes) => new Set((shapes ?? []).flatMap((s) => (s.fields ?? []).map((f) => f.path))).size;

function coveragePairs(built) {
  return [
    ['members', built.family.members.join(', ') || '(none)'],
    ['hosts', built.family.hosts.join(', ') || '(none)'],
    ['transports', built.coverage.transports.join(', ') || '(none)'],
    ['streams', String(built.coverage.streams)],
    ['field paths', String(fieldPathCount(built.shapes))],
    ['signature', built.family.signature],
  ];
}

defineGroup('library', {
  section: 'Knowledge', default: 'build',
  summary: 'Consolidate derived sessions into site families',
  description: 'Merges every derived session of one host/site into ONE normalised family shape set (streams grouped by transport and endpoint path, field paths unioned with occurrence counts), then persists it through the versioned family store.',
});

define({
  name: 'library build', section: 'Knowledge', usage: '<host|site> [--min N]',
  summary: 'Build (and save) the family shape set for a site',
  description: 'Exits 0 on success, 3 when the site has no sessions, 4 when sessions exist but none are derived.',
  flags: { min: { type: 'number', alias: 'n', valueName: 'N', default: 1, desc: 'Warn unless at least N sessions exist' } },
  examples: ['studio library build chatgpt.com', 'studio library build openai --min 3 --json'],
  async run(ctx) {
    const ref = ctx.args[0];
    if (!ref) throw usageError('Give a host or site to build the family from.', 'Example: studio library build chatgpt.com');
    const built = buildFamily({
      sessionsDir: ctx.paths.sessions, host: ref, site: ref,
      profilesDir: ctx.paths.profiles, minSessions: ctx.flags.min ?? 1,
    });

    if (!built.coverage.sessions) throw notFound(`No sessions for "${ref}".`, 'Record one with "studio capture <url>".');

    if (!built.coverage.withDerived) {
      ctx.out.emit({ ref, ...built, written: null }, (o) => {
        o.result(`No derived sessions for ${ref}: ${built.coverage.sessions} session(s), none derived.`);
        o.line('');
        o.line(`  Run "studio derive ${built.family.members[0]} --full" first.`);
      });
      process.exitCode = EXIT.INTEGRITY;
      return;
    }

    const written = writeFamily({ familiesDir: ctx.paths.families, built });
    ctx.out.emit({ ...built, fieldPaths: fieldPathCount(built.shapes), written }, (o) => {
      o.result(`Family ${built.family.id}: ${built.coverage.sessions} session(s), ${built.coverage.withDerived} derived.`);
      o.line('');
      o.kv(coveragePairs(built));
      o.line('');
      o.line(o.c.dim(`saved ${written.store} v${written.version} -> ${written.dir}`));
      if (built.warnings.length) { o.line(''); for (const w of built.warnings) o.line(o.c.dim(`warning: ${w}`)); }
    });
  },
});

define({
  name: 'library show', section: 'Knowledge', usage: '<host|site|id>',
  summary: 'Show a consolidated family',
  examples: ['studio library show chatgpt.com', 'studio library show chatgpt.com --json'],
  async run(ctx) {
    const ref = ctx.args[0];
    if (!ref) throw usageError('Give a family id, host or site.', 'Example: studio library show chatgpt.com');
    const store = ctx.families();
    const want = String(ref).toLowerCase();
    const names = store.names();
    let id = names.find((n) => n.toLowerCase() === want);
    if (!id) {
      id = names.find((n) => {
        if (n.toLowerCase().includes(want)) return true;
        try {
          const f = store.load(n);
          return (f.hosts ?? []).some((h) => String(h).toLowerCase().includes(want)) || String(f.site ?? '').toLowerCase() === want;
        } catch { return false; }
      });
    }
    if (!id) throw notFound(`No family matches "${ref}".`, 'Build one with "studio library build <host|site>".');
    const fam = store.load(id);
    const shapes = fam.shapes ?? [];
    ctx.out.emit({ ...fam, id, fieldPaths: fieldPathCount(shapes) }, (o) => {
      o.result(`Family ${id} (store version ${store.current(id)})`);
      o.line('');
      o.kv([
        ['name', fam.name ?? id],
        ['site', fam.site ?? ''],
        ['hosts', (fam.hosts ?? []).join(', ') || '(none)'],
        ['members', (fam.members ?? []).join(', ') || '(none)'],
        ['transports', (fam.coverage?.transports ?? []).join(', ') || '(none)'],
        ['streams', String(fam.coverage?.streams ?? shapes.length)],
        ['field paths', String(fieldPathCount(shapes))],
        ['signature', fam.signature ?? '(none)'],
      ]);
      if (shapes.length) {
        o.line('');
        o.table(shapes.map((s) => ({ transport: s.transport, endpoint: s.endpoint, fields: (s.fields ?? []).length, deltas: (s.deltas ?? []).join(', ') })), [
          { title: 'TRANSPORT', key: 'transport', max: 18 },
          { title: 'ENDPOINT', key: 'endpoint', max: 60 },
          { title: 'FIELDS', key: 'fields', align: 'right' },
          { title: 'DELTAS', key: 'deltas', max: 30 },
        ]);
      }
      if ((fam.warnings ?? []).length) { o.line(''); for (const w of fam.warnings) o.line(o.c.dim(`warning: ${w}`)); }
    });
  },
});

define({
  name: 'library list', section: 'Knowledge', usage: '',
  summary: 'List consolidated families',
  examples: ['studio library list', 'studio library list --json'],
  async run(ctx) {
    const store = ctx.families();
    const rows = store.names().map((n) => {
      let f = {};
      try { f = store.load(n); } catch { /* unreadable version: list it bare */ }
      return {
        id: n,
        version: store.current(n),
        hosts: (f.hosts ?? []).join(', '),
        members: (f.members ?? []).length,
        sessions: f.coverage?.sessions ?? '',
        derived: f.coverage?.withDerived ?? '',
        streams: f.coverage?.streams ?? (f.shapes ?? []).length,
        signature: f.signature ?? '',
      };
    });
    ctx.out.emit(rows, (o) => {
      o.result(`${rows.length} family/families.`);
      if (rows.length) {
        o.line('');
        o.table(rows, [
          { title: 'FAMILY', key: 'id', max: 30 },
          { title: 'VER', key: 'version', align: 'right' },
          { title: 'HOSTS', key: 'hosts', max: 34 },
          { title: 'MEMBERS', key: 'members', align: 'right' },
          { title: 'SESSIONS', key: 'sessions', align: 'right' },
          { title: 'DERIVED', key: 'derived', align: 'right' },
          { title: 'STREAMS', key: 'streams', align: 'right' },
          { title: 'SIGNATURE', key: 'signature', max: 22 },
        ]);
      }
    });
  },
});
