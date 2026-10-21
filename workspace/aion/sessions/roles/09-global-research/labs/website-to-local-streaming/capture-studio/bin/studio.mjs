#!/usr/bin/env node
// Capture Studio command line. Every command is a thin layer over the same engine the UI uses.
import { mkdirSync, accessSync, constants, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { dataPaths, defaultDataDir, VERSION, collectorSourceSha } from '../src/config.mjs';
import { ProfileStore, profileDiff } from '../src/profiles/profiles.mjs';
import { FamilyStore } from '../src/families/families.mjs';
import { listTargets, browserVersion, isReachable } from '../src/cdp/discovery.mjs';
import { launchChrome, findChrome } from '../src/chrome/launch.mjs';
import { Recorder } from '../src/capture/recorder.mjs';
import { Session, listSessions, resolveSessionDir } from '../src/store/session.mjs';
import { derive, search } from '../src/replay/derive.mjs';
import { exportDataset, exportTranscript } from '../src/export/export.mjs';
import { applySuggestion } from '../src/profiles/apply.mjs';
import { startStudio } from '../src/studio/server.mjs';
import { ScopedLearner } from '../src/intel/learn.mjs';
import { buildSiteContinuity, siteFromSession } from '../src/intel/continuity.mjs';

const HELP = `Capture Studio ${VERSION} — local, read-only website capture

Usage: studio <command> [options]

Start here
  start                    Open the capture browser and the studio UI (first-run friendly)
  doctor                   Check Node, Chrome, DevTools port and data folder

Browser and recording
  launch [--url URL]       Open the dedicated capture browser (loopback DevTools only)
  targets                  List tabs you can record
  record [--target T] [--profile P] [--label L] [--duration S] [--max-mb N] [--all-bodies]
                           Record one tab from the terminal; Ctrl+C stops and saves
  serve [--studio-port N] [--no-open]
                           Run the studio UI only

Sessions
  sessions                 List saved recordings
  derive <id|latest>       Rebuild datasets, shapes and the receipt from raw
  verify <id|latest>       Integrity check (hashes, sequence accounting, declared gaps)
  receipt <id|latest>      Print the metadata-only lab receipt
  shapes <id|latest>       Print suggestions
  model <id|latest>        Print the discovered data model, entity counts and relationships
  continuity <id|latest> [--eid ID] [--at ISO] [--limit N]
                           Join safely keyed entities across recorded sessions of the same site
  export <id|latest> --dataset NAME [--format jsonl|json|csv|md] [--out FILE]
  transcript <id|latest> [--out FILE]
  search <text> [--session ID]
  delete <id> --yes        Permanently delete a saved session

Profiles and families
  profile list | show <name> [--version N] | versions <name> | diff <name> <a> <b>
  profile rollback <name> <version>
  profile apply <name> --session <id> --suggestion <suggestion-id> [--reject]
  profile export <name> [--out FILE] | import <file>
  family list | show <name> | records <name> [--entity message]   (records span all sites and sessions)

Global options
  --data-dir DIR           Where sessions/profiles live (default ${defaultDataDir()})
  --port N                 Chrome DevTools port (default 9222)
`;

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

const fmtB = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

function openUrl(url) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch { /* print only */ }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const paths = dataPaths(args['data-dir'] ? path.resolve(args['data-dir']) : defaultDataDir());
  for (const d of [paths.root, paths.sessions, paths.profiles, paths.families]) mkdirSync(d, { recursive: true });
  const port = Number(args.port ?? 9222);
  const profiles = () => new ProfileStore(paths.profiles);
  const families = () => new FamilyStore(paths.families);
  const learner = () => new ScopedLearner(paths.learner);
  const sessionArg = (i = 1) => Session.open(paths.sessions, args._[i] ?? 'latest');

  switch (cmd) {
    case undefined: case 'help': case '--help': case '-h': console.log(HELP); return;
    case 'version': case '--version': console.log(VERSION, collectorSourceSha()); return;

    case 'doctor': {
      const checks = [];
      const major = Number(process.versions.node.split('.')[0]);
      checks.push([major >= 22, `Node ${process.version}`, major >= 22 ? '' : 'Install Node 22 or newer (built-in WebSocket is required).']);
      let chrome = null; try { chrome = findChrome(); } catch (e) { /* */ }
      checks.push([!!chrome, `Chrome: ${chrome ?? 'not found'}`, chrome ? '' : 'Install Google Chrome or set CHROME_PATH.']);
      const up = await isReachable({ port });
      checks.push([true, `DevTools on 127.0.0.1:${port}: ${up ? (await browserVersion({ port })).Browser : 'not running (run "studio launch")'}`, '']);
      let writable = true; try { accessSync(paths.root, constants.W_OK); } catch { writable = false; }
      checks.push([writable, `Data folder: ${paths.root}`, writable ? '' : 'Choose a writable --data-dir.']);
      for (const [ok, msg, fix] of checks) console.log(`${ok ? 'ok  ' : 'FIX '} ${msg}${fix ? `\n     ${fix}` : ''}`);
      process.exitCode = checks.every((c) => c[0]) ? 0 : 1;
      return;
    }

    case 'launch': {
      const r = await launchChrome({ profileDir: paths.chromeProfile, port, url: args.url ?? 'about:blank', headless: !!args.headless });
      console.log(r.alreadyRunning ? `Capture browser already running (${r.browser}).` : `Capture browser opened (${r.browser}). Sign in to the sites you want to capture in this window.`);
      return;
    }

    case 'targets': {
      const ts = await listTargets({ port });
      if (!ts.length) { console.log('No tabs open.'); return; }
      ts.forEach((t, i) => console.log(`${String(i).padStart(2)}  ${t.id.slice(0, 8)}  ${t.title}\n      ${t.url}`));
      return;
    }

    case 'record': {
      const rec = new Recorder({ sessionsDir: paths.sessions, profileStore: profiles(), familyStore: families(), port, allBodies: !!args['all-bodies'], maxSessionBytes: Number(args['max-mb'] ?? 0) * 1048576, learner: learner() });
      rec.on('warn', (e) => console.error(`warning: ${e.message ?? e}`));
      const s = await rec.start({ target: args.target, profile: args.profile, label: args.label });
      console.log(`Recording ${s.meta.target.title} -> session ${s.id}\nProfile ${s.meta.profile.name}@v${s.meta.profile.version}. Press Ctrl+C to stop and save.`);
      const tick = setInterval(() => {
        const st = rec.status(); if (st.state !== 'recording') return;
        const n = st.stats.network;
        process.stdout.write(`\r${n.requests} requests, ${n.streamed} streamed, ${fmtB(n.bytes)} received, ${st.openStreams} open, ${st.stats.dom.mutations} page changes, ${st.stats.raw.gaps} gaps   `);
      }, 1000);
      const finish = async (reason) => {
        clearInterval(tick);
        const r = await rec.stop({ reason });
        if (!r) return;
        const sess = Session.open(paths.sessions, r.id);
        const d = await derive(sess, profiles().load(sess.meta.profile.name), { families: families(), learner: learner() });
        console.log(`\n\nSaved ${r.id} (${r.reason}); integrity ${r.verify.ok ? 'verified' : 'WARNINGS'}.`);
        console.log(`Verdict ${d.receipt.verdict}: ${d.receipt.actual_response_transport}, ${d.receipt.raw_chunks_received} chunks, ${fmtB(d.receipt.raw_bytes_received)}, ${d.receipt.replay_and_gap_diagnostics.gap_records} gaps.`);
        console.log(`${d.report.suggestions.length} suggestions. Review them with "studio serve" or "studio shapes ${r.id}".`);
        process.exit(0);
      };
      rec.on('stopped', (r) => { if (r.reason !== 'user_stop' && r.reason !== 'duration') console.log(`\nRecording ended: ${r.reason}`); });
      process.on('SIGINT', () => finish('user_stop'));
      if (args.duration) setTimeout(() => finish('duration'), Number(args.duration) * 1000);
      rec.on('stopped', (r) => { if (!['user_stop', 'duration'].includes(r.reason)) finish(r.reason); });
      return;
    }

    case 'start':
    case 'serve': {
      if (cmd === 'start' && !(await isReachable({ port }))) {
        const r = await launchChrome({ profileDir: paths.chromeProfile, port, url: args.url ?? 'about:blank' });
        console.log(`Capture browser opened (${r.browser}).`);
      }
      const st = await startStudio({ paths, profileStore: profiles(), familyStore: families(), cdpPort: port, port: Number(args['studio-port'] ?? 7878) });
      console.log(`Capture Studio is running at\n  ${st.url}\nKeep this window open. Press Ctrl+C to stop (an active recording is saved first).`);
      if (!args['no-open']) openUrl(st.url);
      process.on('SIGINT', async () => { await st.close(); process.exit(0); });
      return;
    }

    case 'sessions': {
      const list = listSessions(paths.sessions);
      if (!list.length) { console.log('No sessions yet.'); return; }
      for (const s of list) console.log(`${s.id}  ${String(s.status).padEnd(24)} ${fmtB(s.rawBytes).padStart(9)}  ${s.target?.title ?? ''}`);
      return;
    }
    case 'derive': {
      const s = sessionArg();
      const d = await derive(s, profiles().load(s.meta.profile?.name ?? 'generic'), { families: families(), learner: learner(), onProgress: (n) => process.stdout.write(`\r${n} records`) });
      console.log(`\nDerived ${s.id}: ${d.records} raw records, ${d.summary.streams.length} streams, ${d.report.suggestions.length} suggestions.`);
      for (const [k, v] of Object.entries(d.recordCounts)) console.log(`  records-${k}: ${v}`);
      for (const [k, v] of Object.entries(d.familyCounts ?? {})) console.log(`  ${k}: ${v}`);
      return;
    }
    case 'verify': {
      const v = await sessionArg().verify();
      console.log(JSON.stringify(v, null, 2));
      process.exitCode = v.ok ? 0 : 2;
      return;
    }
    case 'receipt': {
      const s = sessionArg();
      let r = s.kv.get('RECEIPT');
      if (!r) r = (await derive(s, profiles().load(s.meta.profile?.name ?? 'generic'), { families: families(), learner: learner() })).receipt;
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    case 'shapes': {
      const s = sessionArg();
      let rep = s.kv.get('SHAPES');
      if (!rep) rep = (await derive(s, profiles().load(s.meta.profile?.name ?? 'generic'), { families: families(), learner: learner() })).report;
      for (const g of rep.suggestions) console.log(`${String(Math.round(g.confidence * 100)).padStart(3)}%  ${g.id.padEnd(28)} ${g.title}\n      ${g.detail}`);
      return;
    }
    case 'model': {
      const s = sessionArg();
      let m = s.kv.get('MODEL');
      if (!m) { await derive(s, profiles().load(s.meta.profile?.name ?? 'generic'), { families: families(), learner: learner() }); m = s.kv.get('MODEL'); }
      if (!m || m.error) { console.log(`No model for ${s.id}: ${m?.error ?? 'unavailable'}${m?.stage ? ` (failed at stage ${m.stage})` : ''}`); process.exitCode = m?.error ? 2 : 0; return; }
      const ents = {};
      for await (const e of s.dataset('entities').iterate()) ents[e.type] = (ents[e.type] ?? 0) + 1;
      console.log(`Model for ${s.id}: ${m.types.length} type(s), ${m.relationships.length} relationship(s)`);
      for (const t of m.types) console.log(`  ${String(t.name).padEnd(28)} key ${t.key ? `${t.key.field}${t.key.weak ? ' (weak)' : ''}` : '(keyless)'}  support ${t.support}  confidence ${t.confidence}  entities ${ents[t.id] ?? 0}`);
      const byKind = {}; for (const r of m.relationships) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
      if (Object.keys(byKind).length) console.log(`  relationships: ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      if (m.unmodelled?.length) console.log(`  unmodelled groups: ${m.unmodelled.length}`);
      const dropped = Object.values(m.corpus?.dropped ?? {}).reduce((a, b) => a + b, 0);
      if (dropped) console.log(`  corpus thinning: ${dropped} observation(s) not used for discovery (raw and events keep them)`);
      return;
    }
    case 'continuity': {
      const s = sessionArg();
      const site = siteFromSession(s.meta);
      if (!site) { console.error('This session has no verified target site; cross-session continuity is unavailable.'); process.exitCode = 2; return; }
      const view = await buildSiteContinuity(paths.sessions, {
        site, eid: args.eid ?? null, asOf: args.at ?? null, limit: args.limit ?? 20, includeHistory: !!args.eid,
      });
      console.log('Continuity for ' + site + ': ' + view.stats.sessionsWithDerivedKnowledge +
        '/' + view.stats.sessionsDiscovered + ' derived sessions, ' + view.stats.joinedEntities +
        ' keyed entities spanning multiple sessions, ' + view.stats.entitiesTotal + ' visible entities.');
      if (view.stats.sessionsWithoutKnowledge.length || view.stats.sessionsWithDerivationError.length)
        console.log('  Unavailable knowledge: ' + view.stats.sessionsWithoutKnowledge.length +
          ' not derived, ' + view.stats.sessionsWithDerivationError.length + ' derivation errors.');
      if (args.eid) { console.log(JSON.stringify(view.entities, null, 2)); return; }
      for (const e of view.entities) console.log('  ' + e.id + '  ' + e.typeName +
        '  sessions ' + e.sessionCount + '  revisions ' + e.revisions + '  ' + e.identityBasis);
      if (view.stats.truncated) console.log('  ' + view.stats.truncated + ' more entities (use --limit or --eid).');
      if (view.stats.typeDriftHintsTotal) {
        console.log('  Possible type drift: ' + view.stats.typeDriftHintsTotal +
          ' unconfirmed structural candidate(s), NOT merged.');
        for (const h of view.typeDriftHints.slice(0, 10)) {
          console.log('    ' + h.origin + ' key ' + h.keyField + '=' + h.key +
            '  types ' + h.candidates.map((c) => c.typeName ?? c.type).join(' / ') +
            '  field overlap ' + h.structuralFieldOverlap);
        }
        const unseen = view.stats.typeDriftHintsTotal - Math.min(view.typeDriftHints.length, 10);
        if (unseen) console.log('    ' + unseen + ' further candidate(s) not printed.');
      }
      if (view.stats.typeDriftVariantsOmitted)
        console.log('  Drift analysis bounded: ' + view.stats.typeDriftVariantsOmitted + ' type variant(s) not compared.');
      console.log('  Note: only same-origin, exact-key identities join. Type-drift hints do not join; missing observations are not deletions.');
      return;
    }
    case 'export': {
      const s = sessionArg();
      if (!args.dataset) throw new Error('--dataset is required (e.g. events, streams, timeline, records-<name>, family-<name>-<entity>)');
      const fmt = args.format ?? 'jsonl';
      const out = args.out ?? `${s.id}-${args.dataset}.${fmt}`;
      const r = await exportDataset(s, args.dataset, fmt, out);
      console.log(`Wrote ${r.rows} rows to ${r.file}`);
      return;
    }
    case 'transcript': {
      const s = sessionArg();
      const r = await exportTranscript(s, args.out ?? `${s.id}.md`);
      console.log(`Wrote ${r.file}`);
      return;
    }
    case 'search': {
      const q = args._.slice(1).join(' ');
      const ids = args.session ? [args.session] : listSessions(paths.sessions).slice(0, 20).map((x) => x.id);
      const hits = await search(ids.map((i) => Session.open(paths.sessions, i)), q);
      for (const h of hits) console.log(`${h.session.slice(0, 22)} ${h.layer} ${h.sid ?? '#' + h.domId}: ${h.snippet.replace(/\s+/g, ' ')}`);
      if (!hits.length) console.log('No matches.');
      return;
    }
    case 'delete': {
      const dir = resolveSessionDir(paths.sessions, args._[1]);
      if (!args.yes) { console.log(`This permanently deletes ${dir}. Re-run with --yes to confirm.`); return; }
      rmSync(dir, { recursive: true, force: true });
      console.log(`Deleted ${path.basename(dir)}.`);
      return;
    }

    case 'profile': {
      const store = profiles();
      const sub = args._[1], name = args._[2];
      if (sub === 'list' || !sub) { for (const n of store.names()) console.log(`${n.padEnd(20)} v${store.current(n)} (${store.versions(n).length} versions)  ${store.load(n).family ? `family ${store.load(n).family}` : ''}`); return; }
      if (sub === 'show') { console.log(JSON.stringify(store.load(name, args.version ? Number(args.version) : undefined), null, 2)); return; }
      if (sub === 'versions') { for (const v of store.versions(name)) console.log(`v${v.version}${v.version === store.current(name) ? ' *' : '  '} ${v.savedAt}  ${v.note ?? ''}`); return; }
      if (sub === 'diff') { for (const d of profileDiff(store.load(name, Number(args._[3])), store.load(name, Number(args._[4])))) console.log(`${d.path}: ${JSON.stringify(d.from)} => ${JSON.stringify(d.to)}`); return; }
      if (sub === 'rollback') { const p = store.rollback(name, Number(args._[3])); console.log(`${name} now uses v${p.version}.`); return; }
      if (sub === 'apply') {
        const s = Session.open(paths.sessions, args.session ?? 'latest');
        const rep = s.kv.get('SHAPES') ?? (await derive(s, store.load(name), { families: families(), learner: learner() })).report;
        const g = rep.suggestions.find((x) => x.id === args.suggestion);
        if (!g) throw new Error(`No suggestion ${args.suggestion} in ${s.id}.`);
        const { profile, note } = applySuggestion(store.load(name), g, { action: args.reject ? 'reject' : 'accept' });
        const saved = store.save(name, profile, note);
        if (saved.family && families().has(saved.family)) families().addMember(saved.family, name);
        if (g.kind && Number.isFinite(Number(g.confidence))) { const L = learner(); L.calibrator.observe(`suggestion:${g.kind}`, Number(g.confidence), !args.reject); L.save(); }
        console.log(`${note} -> ${name}@v${saved.version}`);
        return;
      }
      if (sub === 'export') { const p = store.load(name); const out = args.out ?? `${name}.profile.json`; writeFileSync(out, JSON.stringify(p, null, 2)); console.log(`Wrote ${path.resolve(out)}`); return; }
      if (sub === 'import') { const p = JSON.parse(readFileSync(args._[2], 'utf8')); const saved = store.save(p.name, p, `imported from ${path.basename(args._[2])}`); console.log(`Imported ${saved.name}@v${saved.version}`); return; }
      throw new Error(`Unknown profile command "${sub}".`);
    }
    case 'family': {
      const store = families();
      const sub = args._[1];
      if (sub === 'list' || !sub) { for (const n of store.names()) { const f = store.load(n); console.log(`${n.padEnd(14)} v${f.version}  ${Object.keys(f.entities).join(', ')}  members: ${(f.members ?? []).join(', ') || '-'}`); } return; }
      if (sub === 'show') { console.log(JSON.stringify(store.load(args._[2]), null, 2)); return; }
      if (sub === 'records') {
        const ds = `family-${args._[2]}-${args.entity ?? 'message'}`;
        let n = 0;
        for (const meta of listSessions(paths.sessions)) {
          const sess = Session.open(paths.sessions, meta.id);
          if (!existsSync(sess.dataset(ds).file)) continue;
          for await (const r of sess.dataset(ds).iterate()) { console.log(JSON.stringify(r)); n++; }
        }
        if (!n) console.error(`No ${ds} records yet. Link a profile to the family and derive a session.`);
        return;
      }
      throw new Error(`Unknown family command "${sub}".`);
    }
    default:
      console.error(`Unknown command "${cmd}".\n`); console.log(HELP); process.exitCode = 1;
  }
}

main().catch((e) => { console.error(`error: ${e.message ?? e}`); process.exit(1); });
