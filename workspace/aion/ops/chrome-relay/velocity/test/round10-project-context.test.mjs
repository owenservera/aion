// Round 10 — bounded project context from the existing 001.PROJECTS.PM.
// Fixtures mirror the real PM formats (config/projects.json, config/sources.json,
// out/current.json) and prove: allowlist-only projection, privacy and
// cross-project exclusion, stale/absent evidence degradation, containment
// refusals, and an explicitly disclosed, provenance-carrying excerpt.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readdirSync, statSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {
  loadProjectContext,
  composeProjectContext,
  describeProjectContextInterface,
  PROJECT_CONTEXT_SCHEMA,
  MAX_INPUT_BYTES
} from '../src/project-context.mjs';

const NOW = new Date('2026-10-20T12:00:00.000Z');

const PROJECTS_JSON = {
  comment: 'Canonical project registry. Local absolute paths are intentionally excluded.',
  version: 1,
  projects: [
    {
      project_id: 'hq',
      name: 'HP PC HQ',
      kind: 'domain',
      owner_domain: 'HP PC HQ',
      repo_url: 'https://github.com/owenservera/hq.git',
      priority_class: 'high',
      source_ids: ['gh:hq', 'localgit:hq'],
      lifecycle: 'active',
      discovery_state: 'local+github'
    },
    {
      project_id: 'vomega',
      name: 'VOMEGA',
      kind: 'product',
      owner_domain: 'VOMEGA',
      repo_url: 'https://github.com/owenservera/VOMEGA.git',
      priority_class: 'high',
      source_ids: ['gh:vomega', 'file:vomega-sitrep'],
      lifecycle: 'active',
      discovery_state: 'local+github'
    },
    {
      project_id: 'global-pm',
      name: 'Global PM (this system)',
      kind: 'pm-system',
      owner_domain: 'Global PM',
      repo_url: null,
      priority_class: 'medium',
      source_ids: ['self'],
      lifecycle: 'active',
      discovery_state: 'self'
    }
  ]
};

const SOURCES_JSON = {
  comment: 'Evidence source registry.',
  version: 1,
  sources: [
    {
      source_id: 'gh:hq',
      type: 'github',
      project_id: 'hq',
      target: 'owenservera/hq',
      what: 'Remote repository metadata + latest commit',
      freshness_threshold_hours: 48,
      priority: 1,
      readonly: true
    },
    {
      source_id: 'localgit:hq',
      type: 'localgit',
      project_id: 'hq',
      target: 'PC_HQ',
      what: 'Local git tip + dirty state + origin URL',
      freshness_threshold_hours: 48,
      priority: 2,
      readonly: true
    },
    {
      source_id: 'gh:vomega',
      type: 'github',
      project_id: 'vomega',
      target: 'owenservera/VOMEGA',
      what: 'Remote repository metadata + latest commit',
      freshness_threshold_hours: 48,
      priority: 1,
      readonly: true
    },
    {
      source_id: 'file:vomega-sitrep',
      type: 'file',
      project_id: 'vomega',
      target: 'VOMEGA/.project/SITREP.md',
      what: 'VOMEGA status document',
      freshness_threshold_hours: 72,
      priority: 3,
      readonly: true
    }
  ]
};

const CURRENT_JSON = {
  schema: 'global-pm.pulse.v1',
  schema_version: 1,
  generated_at: '2026-10-20T09:00:00.000Z',
  collection_scope: {started_at: '2026-10-20T08:59:00.000Z', finished_at: '2026-10-20T09:00:00.000Z', sources_requested: 4, sources_ok: 4},
  coverage: {sources_registered: 4, sources_reached: 4, sources_with_evidence: 4, sources_fresh: 3, sources_stale: 1, sources_unknown: 0, projects_with_evidence: 2, projects_fully_unknown: 1},
  source_health: [
    {source_id: 'gh:hq', type: 'github', project_id: 'hq', status: 'ok', reached: true, evidence: 'observed', freshness: 'fresh', freshness_h: 3.0},
    {source_id: 'localgit:hq', type: 'localgit', project_id: 'hq', status: 'ok', reached: true, evidence: 'observed', freshness: 'fresh', freshness_h: 2.5}
  ],
  projects: [
    {
      project_id: 'hq',
      name: 'HP PC HQ',
      kind: 'domain',
      owner_domain: 'HP PC HQ',
      repo_url: 'https://github.com/owenservera/hq.git',
      priority_class: 'high',
      lifecycle: 'active',
      lifecycle_source: 'registry',
      discovery_state: 'local+github',
      evidence_state: 'observed',
      source_reachability: {registered: 2, reached: 2, failed: 0, not_collected: 0},
      evidence_coverage: {registered: 2, with_evidence: 2, fraction: 1},
      delivery_verification: 'not-asserted',
      newest_evidence: {date: '2026-10-20T08:00:00.000Z', source_id: 'gh:hq'},
      observed_activity_h: 3,
      source_health: [
        {source_id: 'gh:hq', type: 'github', status: 'ok', reached: true, evidence: 'observed', freshness: 'fresh', freshness_h: 3, freshness_threshold_h: 48, reported_date: '2026-10-20T09:00:00.000Z'},
        {source_id: 'localgit:hq', type: 'localgit', status: 'ok', reached: true, evidence: 'observed', freshness: 'fresh', freshness_h: 2.5, freshness_threshold_h: 48, reported_date: '2026-10-20T09:30:00.000Z'}
      ],
      observations: [
        {source_id: 'gh:hq', type: 'github', observed_at: '2026-10-20T09:00:00.000Z', cache_hit: false, summary: {title: 'secret commit title', mtime: '2026-10-20T08:00:00.000Z', reported_date: '2026-10-20T08:00:00.000Z', size: 42, notice: 'PRIVATE OBSERVATION BODY'}}
      ],
      divergences: [],
      contradictions: [],
      concern: {level: 'watch', code: 'stale-evidence', message: '1 source(s) stale: file:vomega-sitrep'}
    },
    {
      project_id: 'vomega',
      name: 'VOMEGA',
      kind: 'product',
      owner_domain: 'VOMEGA',
      repo_url: 'https://github.com/owenservera/VOMEGA.git',
      priority_class: 'high',
      lifecycle: 'active',
      lifecycle_source: 'registry',
      discovery_state: 'local+github',
      evidence_state: 'stale',
      source_reachability: {registered: 2, reached: 2, failed: 0, not_collected: 0},
      evidence_coverage: {registered: 2, with_evidence: 2, fraction: 1},
      delivery_verification: 'not-asserted',
      newest_evidence: {date: '2026-10-14T17:07:25.000Z', source_id: 'gh:vomega'},
      observed_activity_h: 140,
      source_health: [
        {source_id: 'gh:vomega', type: 'github', status: 'ok', reached: true, evidence: 'observed', freshness: 'fresh', freshness_h: 11.2, freshness_threshold_h: 48, reported_date: '2026-10-20T08:00:00.000Z'},
        {source_id: 'file:vomega-sitrep', type: 'file', status: 'ok', reached: true, evidence: 'observed', freshness: 'stale', freshness_h: 78.8, freshness_threshold_h: 72, reported_date: '2026-10-17T06:00:00.000Z'}
      ],
      observations: [
        {source_id: 'file:vomega-sitrep', type: 'file', observed_at: '2026-10-20T08:59:00.000Z', cache_hit: false, summary: {title: null, mtime: '2026-10-17T06:00:00.000Z', reported_date: null, size: 4960, notice: 'RAW SITREP CONTENT'}}
      ],
      divergences: [{project_id: 'vomega', code: 'remote-local-offset', kind: 'ahead', severity: 'info', message: 'local ahead of remote', remote_sha: '12c853259f60', local_sha: '1fcaada90620'}],
      contradictions: [{code: 'local-uncommitted-changes', severity: 'info', message: 'working tree has uncommitted changes'}],
      concern: {level: 'watch', code: 'stale-evidence', message: '1 source(s) stale: file:vomega-sitrep'}
    },
    {
      project_id: 'global-pm',
      name: 'Global PM (this system)',
      kind: 'pm-system',
      owner_domain: 'Global PM',
      repo_url: null,
      priority_class: 'medium',
      lifecycle: 'active',
      lifecycle_source: 'registry',
      discovery_state: 'self',
      evidence_state: 'unknown',
      source_reachability: {registered: 0, reached: 0, failed: 0, not_collected: 0},
      evidence_coverage: {registered: 0, with_evidence: 0, fraction: 0},
      delivery_verification: 'not-asserted',
      newest_evidence: null,
      observed_activity_h: null,
      source_health: [],
      observations: [],
      divergences: [],
      contradictions: []
    }
  ],
  watches: [{project_id: 'vomega', level: 'watch', code: 'stale-evidence', message: '1 source(s) stale'}],
  exceptions: []
};

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/** Fixture PM root that mirrors the real 001.PROJECTS.PM layout. */
function pmFixture(t, {withReport = true, withSources = true} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'aion-pm-'));
  mkdirSync(join(root, 'config'), {recursive: true});
  mkdirSync(join(root, 'out'), {recursive: true});
  writeJson(join(root, 'config', 'projects.json'), PROJECTS_JSON);
  if (withSources) writeJson(join(root, 'config', 'sources.json'), SOURCES_JSON);
  if (withReport) writeJson(join(root, 'out', 'current.json'), CURRENT_JSON);
  // Machine-local file that must never be read or leaked.
  writeJson(join(root, 'config', 'local.json'), {
    root: 'C:\\0-BlackBoxProject-0',
    paths: {'localgit:hq': 'PC_HQ'},
    token: 'ghp_ABCDEFGHIJKLMNOP'
  });
  t.after(() => rmSync(root, {recursive: true, force: true}));
  return root;
}

function allStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => allStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => allStrings(v, out));
  return out;
}

test('project context is read from the existing PM registry and report', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.equal(ctx.schema, PROJECT_CONTEXT_SCHEMA);
  assert.equal(ctx.project_id, 'hq');
  assert.equal(ctx.registry.name, 'HP PC HQ');
  assert.equal(ctx.registry.kind, 'domain');
  assert.equal(ctx.registry.lifecycle, 'active');
  assert.equal(ctx.registry.priority_class, 'high');
  assert.equal(ctx.registry.discovery_state, 'local+github');
  // Remote repo URLs are registry data, not machine-local paths: they survive.
  assert.equal(ctx.registry.repo_url, 'https://github.com/owenservera/hq.git');
  assert.equal(ctx.status.evidence_state, 'observed');
  assert.equal(ctx.status.delivery_verification, 'not-asserted');
  assert.equal(ctx.status.evidence_coverage.fraction, 1);
  assert.equal(ctx.status.newest_evidence.source_id, 'gh:hq');
  assert.deepEqual(ctx.status.source_reachability, {registered: 2, reached: 2, failed: 0, not_collected: 0});
  assert.equal(ctx.sources.length, 2);
  assert.deepEqual(ctx.sources.map(s => s.source_id), ['gh:hq', 'localgit:hq']);
});

test('provenance keeps original path, hash and mtime of every read file', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  const paths = ctx.provenance.files.map(f => f.path);
  assert.deepEqual(paths, ['config/projects.json', 'config/sources.json', 'out/current.json']);
  for (const file of ctx.provenance.files) {
    const raw = readFileSync(join(root, ...file.path.split('/')), 'utf8');
    assert.equal(file.sha256, createHash('sha256').update(raw).digest('hex'));
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.equal(file.bytes, Buffer.byteLength(raw));
    assert.match(file.mtime, /^\d{4}-\d{2}-\d{2}T/);
  }
  assert.equal(ctx.provenance.pm_registry_version, 1);
  assert.equal(ctx.provenance.pm_sources_version, 1);
});

test('project context never leaks observations, messages, summaries, local paths or tokens', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  const serialized = JSON.stringify(ctx);
  for (const forbidden of ['PRIVATE OBSERVATION BODY', 'secret commit title', 'observations', 'summary',
    'notice', 'message', 'concern', 'divergences', 'contradictions', 'local_sha', 'remote_sha']) {
    assert.equal(serialized.includes(forbidden), false, `leaked: ${forbidden}`);
  }
  for (const s of allStrings(ctx)) {
    assert.equal(/(?<![A-Za-z0-9+.-])[A-Za-z]:[\\/]/.test(s), false, `local path leaked: ${s}`);
    assert.equal(s.includes('PC_HQ'), false, 'local source target leaked');
    assert.equal(/gh[pousr]_/.test(s), false, 'token leaked');
  }
  // The gitignored machine-local config is never read.
  assert.equal(serialized.includes('0-BlackBoxProject-0'), false);
});

test('context is restricted to the selected project (cross-project exclusion)', t => {
  const root = pmFixture(t);
  const hq = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  const serialized = JSON.stringify(hq);
  assert.equal(serialized.includes('VOMEGA'), false);
  assert.equal(serialized.includes('vomega'), false);
  assert.equal(serialized.includes('gh:vomega'), false);
  assert.deepEqual(hq.sources.map(s => s.source_id), ['gh:hq', 'localgit:hq']);

  const vomega = loadProjectContext({pmRoot: root, projectId: 'vomega', now: NOW});
  const other = JSON.stringify(vomega);
  assert.equal(other.includes('HP PC HQ'), false);
  assert.equal(other.includes('gh:hq'), false);
  assert.deepEqual(vomega.sources.map(s => s.source_id), ['gh:vomega', 'file:vomega-sitrep']);
});

test('freshness labels are computed against now and degrade to unknown', t => {
  const root = pmFixture(t);
  const hq = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.equal(hq.status.freshness.label, 'fresh');
  assert.equal(hq.status.freshness.sources_fresh, 2);
  assert.equal(hq.status.freshness.sources_stale, 0);
  assert.equal(hq.status.freshness.sources_unknown, 0);

  const vomega = loadProjectContext({pmRoot: root, projectId: 'vomega', now: NOW});
  assert.equal(vomega.status.freshness.label, 'stale');
  assert.equal(vomega.status.freshness.sources_stale, 1);
  const sitrep = vomega.sources.find(s => s.source_id === 'file:vomega-sitrep');
  assert.equal(sitrep.freshness, 'stale');
  assert.equal(sitrep.threshold_hours, 72);
  assert.ok(sitrep.freshness_hours > 72);
});

test('absent report degrades every evidence field to unknown', t => {
  const root = pmFixture(t, {withReport: false});
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.equal(ctx.status.evidence_state, 'unknown');
  assert.equal(ctx.status.delivery_verification, 'unknown');
  assert.equal(ctx.status.freshness.label, 'unknown');
  assert.equal(ctx.status.freshness.sources_unknown, 2);
  assert.equal(ctx.status.newest_evidence, null);
  assert.equal(ctx.status.report.present, false);
  assert.equal(ctx.status.report.freshness, 'unknown');
  assert.equal(ctx.registry.name, 'HP PC HQ'); // registry still authoritative
  assert.equal(ctx.provenance.files.length, 2);
});

test('missing sources registry keeps registry source ids and degrades registry types', t => {
  const root = pmFixture(t, {withSources: false});
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.equal(ctx.sources.length, 2);
  assert.deepEqual(ctx.sources.map(s => s.source_id), ['gh:hq', 'localgit:hq']);
  // The registry file is gone: registry-declared type/priority are unknown and
  // only the report's own per-source record remains.
  assert.equal(ctx.sources.every(s => s.type === 'github' || s.type === 'localgit'), true);
  assert.equal(ctx.status.freshness.label, 'fresh');
  assert.equal(ctx.sources.every(s => s.freshness === 'fresh'), true);
});

test('unknown ids, traversal and bad roots are refused before any read', t => {
  const root = pmFixture(t);
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'nope', now: NOW}), {code: 'PM_PROJECT_UNKNOWN'});
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: '../../etc/passwd', now: NOW}), {code: 'PM_PROJECT_ID_INVALID'});
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'a\\b', now: NOW}), {code: 'PM_PROJECT_ID_INVALID'});
  assert.throws(() => loadProjectContext({pmRoot: join(root, 'missing'), projectId: 'hq'}), {code: 'PM_ROOT_MISSING'});
  assert.throws(() => loadProjectContext({pmRoot: '', projectId: 'hq'}), {code: 'PM_ROOT_INVALID'});
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'hq', now: 'not-a-date'}), {code: 'PM_TIME_INVALID'});
});

test('a symlinked config escaping the PM root is refused, not followed', t => {
  const root = pmFixture(t);
  const outside = mkdtempSync(join(tmpdir(), 'aion-outside-'));
  t.after(() => rmSync(outside, {recursive: true, force: true}));
  const outsideFile = join(outside, 'projects.json');
  writeJson(outsideFile, PROJECTS_JSON);
  rmSync(join(root, 'config', 'projects.json'));
  try {
    symlinkSync(outsideFile, join(root, 'config', 'projects.json'), 'file');
  } catch (err) {
    t.skip(`symlink creation not permitted on this host (${err.code ?? err.message})`);
    return;
  }
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW}), {code: 'PM_PATH_ESCAPE'});
});

test('a machine-local path that slips into the registry is redacted', t => {
  const root = pmFixture(t);
  const projects = JSON.parse(readFileSync(join(root, 'config', 'projects.json'), 'utf8'));
  projects.projects[0].name = 'HP PC HQ at C:\\0-BlackBoxProject-0\\PC_HQ';
  writeJson(join(root, 'config', 'projects.json'), projects);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.equal(ctx.registry.name.includes('C:\\'), false);
  assert.match(ctx.registry.name, /\[redacted-local-path\]/);
});

test('a directory junction escaping the PM root is refused, not followed', t => {
  const root = pmFixture(t, {withReport: false});
  const outside = mkdtempSync(join(tmpdir(), 'aion-outside-'));
  t.after(() => rmSync(outside, {recursive: true, force: true}));
  writeJson(join(outside, 'current.json'), CURRENT_JSON);
  rmSync(join(root, 'out'), {recursive: true, force: true});
  try {
    symlinkSync(outside, join(root, 'out'), 'junction');
  } catch (err) {
    t.skip(`junction creation not permitted on this host (${err.code ?? err.message})`);
    return;
  }
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW}), {code: 'PM_PATH_ESCAPE'});
});

test('oversized and malformed inputs are refused', t => {
  const root = pmFixture(t);
  const big = join(root, 'config', 'projects.json');
  writeFileSync(big, '{"projects":[' + '"x",'.repeat(MAX_INPUT_BYTES) + '"y"]}');
  assert.throws(() => loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW}), {code: 'PM_INPUT_TOO_LARGE'});

  const root2 = pmFixture(t);
  writeFileSync(join(root2, 'config', 'projects.json'), '{not json');
  assert.throws(() => loadProjectContext({pmRoot: root2, projectId: 'hq', now: NOW}), {code: 'PM_JSON_INVALID'});
});

test('loading is read-only: no new files, no modified files in the PM', t => {
  const root = pmFixture(t);
  const before = snapshot(root);
  loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  loadProjectContext({pmRoot: root, projectId: 'vomega', now: NOW});
  assert.deepEqual(snapshot(root), before);
});

function snapshot(dir, prefix = dir, acc = {}) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) snapshot(full, prefix, acc);
    else {
      const st = statSync(full);
      acc[full.slice(prefix.length)] = `${st.size}:${st.mtimeMs}`;
    }
  }
  return acc;
}

test('excerpt discloses omission, carries provenance and fits the send envelope', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  const composed = composeProjectContext(ctx);
  assert.equal(composed.excerpt, true);
  assert.ok(composed.chars <= 2000);
  assert.match(composed.text, /AION PROJECT CONTEXT EXCERPT \(not the full PM record\)/);
  assert.match(composed.text, /\[Excerpt only;/);
  assert.match(composed.text, /Provenance: config\/projects\.json sha256:[a-f0-9]{16} mtime:/);
  assert.match(composed.text, /project hq/);
  assert.equal(composed.text.includes('PRIVATE OBSERVATION BODY'), false);
  assert.equal(composed.text.includes('PC_HQ'), false);
});

test('a tight envelope forces omission, and the omission is disclosed', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  const tight = composeProjectContext(ctx, {limit: 600});
  assert.ok(tight.omitted_sections > 0);
  assert.ok(tight.omitted_chars > 0);
  assert.match(tight.text, /sections omitted, \d+ source characters not shown/);
  assert.ok(tight.chars <= 600);
  // The provenance line survives every admitted excerpt.
  assert.match(tight.text, /Provenance: config\/projects\.json sha256:/);
});

test('excerpt never silently truncates: it fails loudly past the limit', t => {
  const root = pmFixture(t);
  const ctx = loadProjectContext({pmRoot: root, projectId: 'hq', now: NOW});
  assert.throws(() => composeProjectContext(ctx, {limit: 60}), {code: 'CONTEXT_EXCEEDS_SEND_LIMIT'});
  assert.throws(() => composeProjectContext(null), {code: 'PROJECT_CONTEXT_INVALID'});
});

test('interface description is stable and self-documenting', () => {
  const described = describeProjectContextInterface();
  assert.equal(described.schema, PROJECT_CONTEXT_SCHEMA);
  assert.deepEqual(described.reads, ['config/projects.json', 'config/sources.json', 'out/current.json']);
  assert.equal(described.max_send_chars, 2000);
  assert.equal(described.exports.length, 3);
});
