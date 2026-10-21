// Bounded project context from the EXISTING 001.PROJECTS.PM registry and pulse
// report. Strictly read-only and strictly bounded:
//
//   * reads exactly three fixed relative paths under the PM root
//     (config/projects.json, config/sources.json, optional out/current.json),
//   * performs NO directory scans, NO collection, NO network access, NO writes,
//   * projects ONLY allowlisted registry/status fields,
//   * never emits observations, messages, raw summaries, local filesystem paths
//     or tokens,
//   * degrades missing evidence to explicit "unknown" labels instead of
//     throwing or inventing health.
//
// The caller (CLI integration) owns any later send; this module only produces
// a context object plus an explicitly disclosed, provenance-carrying excerpt
// that fits the existing 2,000-character Bus send envelope.

import {readFileSync, realpathSync, statSync} from 'node:fs';
import {resolve, relative, isAbsolute, sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {composeAgentPrompt} from './agents-context.mjs';

export const PROJECT_CONTEXT_SCHEMA = 'aion.project-context/1';
export const DEFAULT_PM_ROOT = fileURLToPath(new URL('../../../../../../../001.PROJECTS.PM/', import.meta.url));
export const MAX_INPUT_BYTES = 1024 * 1024;
export const MAX_SEND_CHARS = 2000;

/** The ONLY files this module is allowed to touch. */
export const PROJECT_CONTEXT_FILES = Object.freeze({
  registry: 'config/projects.json',
  sources: 'config/sources.json',
  report: 'out/current.json'
});

const PROJECT_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const UNKNOWN = 'unknown';
const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_THRESHOLD_H = 48;

const failure = code => Object.assign(new Error(code), {code});

/* ------------------------------------------------------------------ */
/* privacy scrubbing                                                    */
/* ------------------------------------------------------------------ */

// A drive-letter path is a letter + ':' + separator that is NOT part of a URL
// scheme (the lookbehind keeps "https://..." intact).
const DRIVE_PATH = /(?<![A-Za-z0-9+.-])[A-Za-z]:[\\/][^\s"']*/g;
const UNC_PATH = /\\\\[^\s"']+/g;
const TOKEN_LIKE = /\b(github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]{8,}|sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,})\b/g;

/** Strip machine-local paths and token-shaped strings from emitted text. */
function scrub(text) {
  if (typeof text !== 'string') return {value: null, changed: false};
  let value = text;
  value = value.replace(DRIVE_PATH, '[redacted-local-path]');
  value = value.replace(UNC_PATH, '[redacted-local-path]');
  value = value.replace(TOKEN_LIKE, '[redacted-token]');
  return {value, changed: value !== text};
}

function cleanString(value, limit = 400) {
  if (typeof value !== 'string') return {value: null, changed: false};
  const trimmed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (trimmed.length > limit) throw failure('PM_FIELD_TOO_LARGE');
  const scrubbed = scrub(trimmed);
  return {value: scrubbed.value === '' ? null : scrubbed.value, changed: scrubbed.changed || trimmed !== value};
}

function cleanNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function cleanObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function stripUrlCredentials(url) {
  if (typeof url !== 'string') return {value: null, changed: false};
  if (url.length > 400) throw failure('PM_FIELD_TOO_LARGE');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.port ||
        !['github.com', 'gitlab.com', 'bitbucket.org'].includes(parsed.hostname) ||
        !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(parsed.pathname) ||
        scrub(decodeURIComponent(parsed.pathname)).changed) return {value: null, changed: true};
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return {value: parsed.toString(), changed: parsed.toString() !== url};
  } catch {
    return {value: null, changed: true};
  }
}

/* ------------------------------------------------------------------ */
/* containment + bounded reads                                          */
/* ------------------------------------------------------------------ */

function contained(base, target) {
  const delta = relative(base, target);
  return !(delta === '..' || delta.startsWith('..' + sep) || isAbsolute(delta));
}

function resolveRoot(pmRoot) {
  if (typeof pmRoot !== 'string' || !pmRoot.trim()) throw failure('PM_ROOT_INVALID');
  let base;
  try {
    base = realpathSync(resolve(pmRoot));
  } catch {
    throw failure('PM_ROOT_MISSING');
  }
  try {
    if (!statSync(base).isDirectory()) throw failure('PM_ROOT_INVALID');
  } catch (err) {
    if (err?.code === 'PM_ROOT_INVALID') throw err;
    throw failure('PM_ROOT_INVALID');
  }
  return base;
}

/**
 * Read one fixed relative path inside the PM root.
 * Returns null when the file is absent (evidence degradation) and throws for
 * containment, symlink-escape and size violations.
 */
function readBounded(base, relPath, {required = false} = {}) {
  if (typeof relPath !== 'string' || !relPath || isAbsolute(relPath) || relPath.includes('\\') ||
      relPath.split('/').some(part => part === '..' || part === '')) {
    throw failure('PM_PATH_INVALID');
  }
  const target = resolve(base, relPath);
  if (!contained(base, target)) throw failure('PM_PATH_INVALID');

  let actual;
  try {
    actual = realpathSync(target);
  } catch {
    if (required) throw failure('PM_REGISTRY_MISSING');
    return null;
  }
  // A symlink (or junction) that leaves the PM root is refused, not followed.
  if (!contained(base, actual)) throw failure('PM_PATH_ESCAPE');

  let stats;
  try {
    stats = statSync(actual);
  } catch {
    if (required) throw failure('PM_REGISTRY_MISSING');
    return null;
  }
  if (!stats.isFile()) throw failure('PM_PATH_INVALID');
  if (stats.size > MAX_INPUT_BYTES) throw failure('PM_INPUT_TOO_LARGE');

  let raw;
  try {
    raw = readFileSync(actual, 'utf8');
  } catch {
    throw failure('PM_FILE_UNREADABLE');
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw failure('PM_JSON_INVALID');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw failure('PM_JSON_INVALID');
  return {
    data: parsed,
    provenance: {
      path: relPath,
      sha256: createHash('sha256').update(raw).digest('hex'),
      bytes: stats.size,
      mtime: stats.mtime.toISOString()
    }
  };
}

/* ------------------------------------------------------------------ */
/* time + freshness                                                     */
/* ------------------------------------------------------------------ */

function toDate(now) {
  if (now === undefined || now === null) return new Date();
  const date = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (!Number.isFinite(date.getTime())) throw failure('PM_TIME_INVALID');
  return date;
}

function parseDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function ageHours(from, to) {
  return Math.max(0, (to.getTime() - from.getTime()) / HOUR_MS);
}

function freshnessLabel(ageH, thresholdH) {
  if (ageH === null || !Number.isFinite(ageH)) return UNKNOWN;
  if (!Number.isFinite(thresholdH)) return UNKNOWN;
  return ageH <= thresholdH ? 'fresh' : 'stale';
}

/* ------------------------------------------------------------------ */
/* public API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Load a bounded, privacy-filtered project context from an existing PM.
 *
 * @param {object} options
 * @param {string} options.pmRoot   absolute path of the 001.PROJECTS.PM root
 * @param {string} options.projectId project id as registered in config/projects.json
 * @param {Date|string|number} [options.now] reference time for freshness labels
 * @returns {object} project context (schema aion.project-context/1)
 */
export function loadProjectContext({pmRoot, projectId, now} = {}) {
  if (typeof projectId !== 'string' || !PROJECT_ID.test(projectId)) throw failure('PM_PROJECT_ID_INVALID');
  const base = resolveRoot(pmRoot);
  const reference = toDate(now);

  const registryFile = readBounded(base, PROJECT_CONTEXT_FILES.registry, {required: true});
  const sourcesFile = readBounded(base, PROJECT_CONTEXT_FILES.sources);
  const reportFile = readBounded(base, PROJECT_CONTEXT_FILES.report);

  const projects = Array.isArray(registryFile.data.projects) ? registryFile.data.projects : [];
  const matches = projects.filter(p => p?.project_id === projectId);
  if (matches.length === 0) throw failure('PM_PROJECT_UNKNOWN');
  if (matches.length > 1) throw failure('PM_PROJECT_AMBIGUOUS');
  const project = matches[0];

  const sourceRegistry = Array.isArray(sourcesFile?.data?.sources) ? sourcesFile.data.sources : [];
  const reportProjects = Array.isArray(reportFile?.data?.projects) ? reportFile.data.projects : [];
  const reportProject = reportProjects.find(p => p?.project_id === projectId) ?? null;
  const globalHealth = Array.isArray(reportFile?.data?.source_health) ? reportFile.data.source_health : [];

  /* ---- registry projection (allowlist) ---- */
  const registry = {
    project_id: projectId,
    name: cleanString(project.name)?.value ?? null,
    kind: cleanString(project.kind)?.value ?? null,
    owner_domain: cleanString(project.owner_domain)?.value ?? null,
    repo_url: stripUrlCredentials(project.repo_url).value,
    priority_class: cleanString(project.priority_class)?.value ?? null,
    lifecycle: cleanString(project.lifecycle)?.value ?? null,
    discovery_state: cleanString(project.discovery_state)?.value ?? null,
    source_ids: Array.isArray(project.source_ids)
      ? project.source_ids.filter(id => typeof id === 'string').map(id => cleanString(id)?.value).filter(Boolean)
      : []
  };

  /* ---- source union: registry ids + sources.json rows for this project ---- */
  const sourceIds = new Set(Array.isArray(project.source_ids)
    ? project.source_ids.filter(id => typeof id === 'string') : []);
  for (const row of sourceRegistry) {
    if (row?.project_id === projectId && typeof row.source_id === 'string') sourceIds.add(row.source_id);
  }
  const sourceRows = [...sourceIds].map(id => {
    const reg = sourceRegistry.find(r => r?.source_id === id && r?.project_id === projectId) ?? null;
    return {
      raw_source_id: id,
      source_id: cleanString(id).value ?? UNKNOWN,
      type: cleanString(reg?.type)?.value ?? null,
      priority: cleanNumber(reg?.priority),
      threshold_hours: cleanNumber(reg?.freshness_threshold_hours)
    };
  });
  sourceRows.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) ||
    a.source_id.localeCompare(b.source_id));

  const projectHealth = Array.isArray(reportProject?.source_health) ? reportProject.source_health : [];

  const sources = sourceRows.map(row => {
    const health = projectHealth.find(h => h?.source_id === row.raw_source_id) ??
      globalHealth.find(h => h?.source_id === row.raw_source_id && h?.project_id === projectId) ?? null;
    const threshold = row.threshold_hours ?? cleanNumber(health?.freshness_threshold_h) ?? null;
    const reported = parseDate(health?.reported_date);
    const age = reported ? ageHours(reported, reference) : null;
    return {
      source_id: row.source_id,
      type: row.type ?? cleanString(health?.type)?.value ?? null,
      status: cleanString(health?.status)?.value ?? UNKNOWN,
      reached: typeof health?.reached === 'boolean' ? health.reached : null,
      evidence: cleanString(health?.evidence)?.value ?? UNKNOWN,
      reported_date: reported ? reported.toISOString() : null,
      threshold_hours: threshold,
      freshness_hours: age === null ? null : Math.round(age * 10) / 10,
      freshness: freshnessLabel(age, threshold)
    };
  });

  const fresh = sources.filter(s => s.freshness === 'fresh').length;
  const stale = sources.filter(s => s.freshness === 'stale').length;
  const unknownSources = sources.filter(s => s.freshness === UNKNOWN).length;
  const label = stale > 0 ? 'stale' : (sources.length === 0 || unknownSources > 0 ? UNKNOWN : 'fresh');

  /* ---- report level facts ---- */
  const generated = parseDate(reportFile?.data?.generated_at);
  const reportThreshold = sourceRows.length
    ? Math.max(...sourceRows.map(r => r.threshold_hours ?? DEFAULT_THRESHOLD_H))
    : DEFAULT_THRESHOLD_H;
  const reportAge = generated ? ageHours(generated, reference) : null;
  const report = reportFile
    ? {
      present: true,
      schema: cleanString(reportFile.data.schema)?.value ?? null,
      schema_version: cleanNumber(reportFile.data.schema_version),
      generated_at: generated ? generated.toISOString() : null,
      age_hours: reportAge === null ? null : Math.round(reportAge * 10) / 10,
      freshness_threshold_hours: reportThreshold,
      freshness: freshnessLabel(reportAge, reportThreshold)
    }
    : {
      present: false,
      schema: null,
      schema_version: null,
      generated_at: null,
      age_hours: null,
      freshness_threshold_hours: reportThreshold,
      freshness: UNKNOWN
    };

  const reachability = cleanObject(reportProject?.source_reachability);
  const coverage = cleanObject(reportProject?.evidence_coverage);
  const newest = cleanObject(reportProject?.newest_evidence);

  const status = {
    evidence_state: cleanString(reportProject?.evidence_state)?.value ?? UNKNOWN,
    delivery_verification: cleanString(reportProject?.delivery_verification)?.value ?? UNKNOWN,
    source_reachability: reachability
      ? {
        registered: cleanNumber(reachability.registered),
        reached: cleanNumber(reachability.reached),
        failed: cleanNumber(reachability.failed),
        not_collected: cleanNumber(reachability.not_collected)
      }
      : null,
    evidence_coverage: coverage
      ? {
        registered: cleanNumber(coverage.registered),
        with_evidence: cleanNumber(coverage.with_evidence),
        fraction: cleanNumber(coverage.fraction)
      }
      : null,
    newest_evidence: newest
      ? {
        date: parseDate(cleanString(newest.date)?.value)?.toISOString() ?? null,
        source_id: cleanString(newest.source_id)?.value ?? null
      }
      : null,
    observed_activity_h: cleanNumber(reportProject?.observed_activity_h),
    freshness: {
      label,
      sources_fresh: fresh,
      sources_stale: stale,
      sources_unknown: unknownSources
    },
    report
  };

  const files = [registryFile.provenance];
  if (sourcesFile) files.push(sourcesFile.provenance);
  if (reportFile) files.push(reportFile.provenance);

  return {
    schema: PROJECT_CONTEXT_SCHEMA,
    project_id: projectId,
    assembled_at: reference.toISOString(),
    registry,
    status,
    sources,
    provenance: {
      // Paths are reported relative to the PM root on purpose: the absolute
      // machine path of the PM is never emitted.
      files,
      pm_registry_version: cleanNumber(registryFile.data.version),
      pm_sources_version: cleanNumber(sourcesFile?.data?.version)
    }
  };
}

/* ------------------------------------------------------------------ */
/* excerpt composition (for the existing 2,000-char send gate)          */
/* ------------------------------------------------------------------ */

function renderBlocks(context) {
  const r = context.registry;
  const s = context.status;
  const blocks = [];
  blocks.push({
    id: 'identity',
    text: `Project ${context.project_id}: ${r.name ?? 'unknown'}`
  });
  blocks.push({
    id: 'registry',
    text: `Registry: kind=${r.kind ?? UNKNOWN} · owner=${r.owner_domain ?? UNKNOWN} · ` +
      `lifecycle=${r.lifecycle ?? UNKNOWN} · priority=${r.priority_class ?? UNKNOWN} · ` +
      `discovery=${r.discovery_state ?? UNKNOWN}${r.repo_url ? ` · repo=${r.repo_url}` : ''}`
  });
  blocks.push({
    id: 'evidence',
    text: `Evidence: state=${s.evidence_state} · freshness=${s.freshness.label} · ` +
      `sources=${s.freshness.sources_fresh} fresh/${s.freshness.sources_stale} stale/` +
      `${s.freshness.sources_unknown} unknown · delivery=${s.delivery_verification} · ` +
      `report=${s.report.present ? `generated ${s.report.generated_at ?? UNKNOWN}` : 'absent'}`
  });
  if (context.sources.length) {
    const lines = context.sources.map(src =>
      `- ${src.source_id} (${src.type ?? UNKNOWN}) ${src.freshness}` +
      `${src.freshness_hours === null ? '' : ` ${src.freshness_hours}h/${src.threshold_hours ?? UNKNOWN}h`}`);
    blocks.push({id: 'sources', text: `Sources:\n${lines.join('\n')}`});
  }
  return blocks;
}

function renderProvenance(context) {
  const parts = context.provenance.files.map(f =>
    `${f.path} sha256:${f.sha256.slice(0, 16)} mtime:${f.mtime}`);
  return `Provenance: ${parts.join(' · ')}`;
}

/**
 * Compose a bounded, explicitly disclosed excerpt of a project context.
 *
 * The result carries provenance and an explicit omission disclosure, and is
 * never silently truncated: if the assembled text would exceed `limit` the
 * call fails with CONTEXT_EXCEEDS_SEND_LIMIT so the caller can decide.
 *
 * @param {object} context result of loadProjectContext
 * @param {object} [options]
 * @param {number} [options.limit] character ceiling (default 2000)
 * @returns {{text:string, chars:number, limit:number, within_limit:boolean,
 *            excerpt:boolean, omitted_sections:number, omitted_chars:number,
 *            provenance:string}}
 */
export function composeProjectContext(context, {limit = MAX_SEND_CHARS} = {}) {
  if (!context || context.schema !== PROJECT_CONTEXT_SCHEMA) throw failure('PROJECT_CONTEXT_INVALID');
  if (!Number.isFinite(limit) || limit <= 0) throw failure('PROJECT_CONTEXT_INVALID');

  const header = `[AION PROJECT CONTEXT EXCERPT (not the full PM record) · project ${context.project_id}]`;
  const provenance = renderProvenance(context);
  const blocks = renderBlocks(context);
  const fullChars = blocks.reduce((sum, b) => sum + b.text.length + 2, 0);

  const selected = [];
  const omitted = [];
  let used = header.length + provenance.length + 4;
  let overflow = false;
  for (const block of blocks) {
    const cost = block.text.length + 2;
    const projected = used + cost + 80;
    if (!overflow && (selected.length === 0 || projected <= limit)) {
      selected.push(block);
      used += cost;
    } else {
      overflow = true;
      omitted.push(block);
    }
  }

  const omittedChars = omitted.reduce((sum, b) => sum + b.text.length + 2, 0);
  const disclosure = omitted.length
    ? `[Excerpt only; ${omitted.length} of ${blocks.length} sections omitted, ${omittedChars} source characters not shown]`
    : `[Excerpt only; all ${blocks.length} sections shown, ${fullChars} section characters]`;

  const text = [
    header,
    ...selected.map(b => b.text),
    disclosure,
    provenance
  ].join('\n');

  if (text.length > limit) {
    throw Object.assign(failure('CONTEXT_EXCEEDS_SEND_LIMIT'), {
      required_chars: text.length,
      limit,
      reason: 'Project context excerpt exceeds the send envelope; no silent truncation'
    });
  }

  return {
    text,
    chars: text.length,
    limit,
    within_limit: true,
    excerpt: true,
    omitted_sections: omitted.length,
    omitted_chars: omittedChars,
    provenance
  };
}

/**
 * Compose an explicitly requested role + project attachment in one envelope.
 * `context` is the additive preview shape: {...loadAgentContext(...), project:
 * loadProjectContext(...)}. The caller must require explicit --context before
 * invoking this helper for egress. This function never dispatches or reads files.
 * Retain every projected project section; the final existing role composer
 * refuses an oversized aggregate rather than dropping project or role evidence.
 */
export function composeProjectAgentPrompt(text, context, {limit = MAX_SEND_CHARS} = {}) {
  if (context?.project?.schema !== PROJECT_CONTEXT_SCHEMA ||
      !Number.isSafeInteger(limit) || limit <= 0 || limit > MAX_SEND_CHARS)
    throw failure('PROJECT_CONTEXT_INVALID');
  // Do not spend the send budget by selectively omitting project sections.
  // Render the full allowlisted projection, then gate the ONE final message.
  const projectText = [...renderBlocks(context.project).map(block => block.text),
    renderProvenance(context.project)].join('\n');
  if (!context.files?.length) throw failure('CONTEXT_UNAVAILABLE');
  const file = {
    kind: 'project', path: `project ${context.project.project_id}`,
    sha256: createHash('sha256').update(projectText).digest('hex'),
    text: projectText, excerpt: true, omitted_chars: 0
  };
  return composeAgentPrompt(text, {...context, files: [...context.files, file]}, {limit});
}

/**
 * Describe the module interface (useful for CLI help / self-description).
 * @returns {object} stable description of the exported surface
 */
export function describeProjectContextInterface() {
  return {
    schema: PROJECT_CONTEXT_SCHEMA,
    reads: Object.values(PROJECT_CONTEXT_FILES),
    max_input_bytes: MAX_INPUT_BYTES,
    max_send_chars: MAX_SEND_CHARS,
    exports: [
      'loadProjectContext({pmRoot, projectId, now})',
      'composeProjectContext(context, {limit})',
      'describeProjectContextInterface()'
    ],
    prompt_composer: 'composeProjectAgentPrompt(text, context, {limit})',
    guarantees: [
      'read-only: three fixed relative paths, no directory scans, no network, no writes',
      'allowlisted registry and status fields only',
      'no observations, messages, raw summaries, local paths or tokens',
      'missing evidence degrades to unknown labels',
      'unknown ids, traversal, symlink escape and oversized inputs are refused'
    ]
  };
}
