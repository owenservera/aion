/**
 * PACK-05 generator. Reads the pinned Bridge command manifest and emits the
 * facet table. Run from this folder: node build-facets.mjs
 *
 * The donor side is parsed, never hand-copied. The AION side is a *proposal*
 * recorded here so every core operation has an explicit retry / reconcile /
 * reload value instead of an unstated default.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(
  here,
  '../../../../landing/donors/chatgpt-bridge/tools/chrome-bridge-extension/shared/commandManifest.js',
);

const source = readFileSync(manifestPath, 'utf8');
const pattern =
  /^\s*'([^']+)':\s*define\(CommandScope\.(\w+),\s*CommandMode\.(\w+),\s*CommandOperation\.(\w+),\s*'([^']+)',\s*'([^']+)',[^,]+,\s*recovery\(CommandReloadRecovery\.(\w+)(,\s*\{\s*allowDuringLease:\s*true\s*\})?\)\)/gm;

const donor = new Map();
for (const match of source.matchAll(pattern)) {
  donor.set(match[1], {
    scope: match[2],
    mode: match[3],
    operation: match[4],
    retry: match[5],
    reconcile: match[6],
    reload: match[7],
    allowDuringLease: Boolean(match[8]),
  });
}
if (donor.size !== 29) {
  throw new Error(`expected 29 Bridge definitions, parsed ${donor.size}`);
}

// AION semantic id -> [donor command, evidence note]. Missing key = NOT_LOCATED.
const mapping = {
  send: ['prompt.send', 'direct'],
  observe: ['request.resume', 'adjacent: request projection, not conversation inbox'],
  'reply.read': ['response.recover.latest', 'adjacent: current-turn read, not full reply'],
  stream: ['response.snapshot.request', 'partial: snapshot request, no delta stream'],
  'history.read': ['response.recover.list', 'partial: bounded visible turns only'],
  recover: ['request.resume', 'adjacent: resume projection; effect evidence via request.effect.reconcile'],
  'sessions.list': ['sessions.list', 'direct'],
  'model.list': ['models.list', 'direct'],
  'model.select': ['intelligence.apply', 'direct command, but donor apply is fail-open'],
  'chat.create': ['sessions.new', 'direct but may return a blank session before persistence'],
  'chat.open': ['sessions.select', 'direct with exact-route readiness gate'],
  'generation.stop': ['prompt.cancel', 'direct with active-request identity check'],
  'thinking.level.set': ['intelligence.apply', 'same command, effort axis; fail-open'],
  steer: ['prompt.steer', 'direct, active-request scoped'],
  'chat.delete': ['sessions.delete', 'direct with target assertions and observed absence'],
};

// Donor commands with no AION core operation in this 29-op contract.
const donorOnlyDisposition = {
  'request.release': 'lease cleanup; AION Bus owns release, no public command',
  'request.effect.reconcile': 'effect evidence read; overlaps recover',
  'command.cancel': 'cancels a Bridge command, not a provider generation',
  'passive.prompt.submit': 'passive observation of a user submit; overlaps observe',
  'browser.tab.open': 'browser surface control, not a conversation operation',
  'browser.tab.close': 'browser surface control',
  'browser.tab.close-owned': 'browser surface control',
  'browser.tab.reload': 'browser surface control',
  'browser.tab.identify': 'visual tab indicator, not session.bind',
  'debug.layout.capture': 'diagnostic capture',
  'extension.reload': 'extension maintenance',
  'artifact.image.read': 'artifact read; download side of file tools',
  'artifact.fetch': 'artifact download/write; no AION core op in this set',
  'efforts.list': 'read side of thinking.level.set',
  'composer.attachments.clear': 'inverse of file.attach, not attach itself',
};

// Proposed AION facets. Every one of the 29 core ops has an explicit row.
// reads: always/SAFE_REPEAT. mutations: never or if_unconfirmed, never "always".
const proposals = {
  send: ['never', 'submitted_turn', 'BROWSER_EFFECT', 'at-most-one attempt per grant; submission evidence only'],
  observe: ['always', 'request_projection', 'SAFE_REPEAT', 'read-only projection'],
  'reply.read': ['always', 'read_scope', 'SAFE_REPEAT', 'read-only; partial must be labelled'],
  stream: ['always', 'request_projection', 'SAFE_REPEAT', 'read-only; gap must be explicit'],
  'history.read': ['always', 'read_scope', 'SAFE_REPEAT', 'read-only; visible subset is not history'],
  'session.bind': ['if_unconfirmed', 'binding_identity', 'READ_PROBE', 'local binding; re-read identity before retry'],
  recover: ['always', 'request_projection', 'SAFE_REPEAT', 'never resend; observation only'],
  'sessions.list': ['always', 'none', 'SAFE_REPEAT', 'read-only'],
  'model.list': ['always', 'none', 'SAFE_REPEAT', 'read-only'],
  'model.select': ['never', 'current_selection', 'READ_PROBE', 'fail closed if selection is unconfirmed'],
  'file.attach': ['never', 'composer_attachments', 'READ_PROBE', 'probe chips/busy/error; timeout is unconfirmed'],
  'chat.create': ['never', 'conversation_identity', 'TYPED_UNCERTAINTY', 'requires durable id before success'],
  'chat.open': ['if_unconfirmed', 'conversation_identity', 'OBSERVATION', 'exact route + stable readiness'],
  'chat.rename': ['never', 'conversation_title', 'READ_PROBE', 'verify title after write'],
  'generation.stop': ['if_unconfirmed', 'generation_state', 'BROWSER_EFFECT', 'identity must match the generation'],
  'thinking.level.set': ['never', 'current_selection', 'READ_PROBE', 'fail closed if effort is unconfirmed'],
  steer: ['never', 'submitted_turn', 'BROWSER_EFFECT', 'mid-turn only; queued follow-up is a different op'],
  'message.edit': ['never', 'edited_turn_identity', 'READ_PROBE', 'exact message; regeneration semantics explicit'],
  'response.regenerate': ['never', 'assistant_turn_identity', 'BROWSER_EFFECT', 'exact assistant turn, not blind resend'],
  'chat.search': ['always', 'none', 'SAFE_REPEAT', 'read-only; scope must be stated'],
  'chat.archive': ['if_unconfirmed', 'archive_state', 'READ_PROBE', 'reversible; observe state'],
  'chat.delete': ['never', 'session_absence', 'TYPED_UNCERTAINTY', 'strong confirm; no silent destructive retry'],
  'chat.share': ['never', 'share_state', 'READ_PROBE', 'visibility must be observed'],
  'branch.create': ['never', 'conversation_identity', 'TYPED_UNCERTAINTY', 'fork is not an empty chat'],
  'message.copy': ['always', 'none', 'SAFE_REPEAT', 'read-only; fidelity is the risk'],
  'tool.toggle': ['if_unconfirmed', 'effective_tool_list', 'READ_PROBE', 'availability is not enabled'],
  'project.select': ['if_unconfirmed', 'project_binding', 'READ_PROBE', 'select is not move'],
  'chat.export': ['always', 'read_scope', 'SAFE_REPEAT', 'read-only; completeness must be stated'],
  'mode.select': ['if_unconfirmed', 'current_mode', 'READ_PROBE', 'mode is not model or effort'],
};

const core = [
  ['send', 'P0'], ['observe', 'P0'], ['reply.read', 'P0'], ['stream', 'P0'],
  ['history.read', 'P0'], ['session.bind', 'P0'], ['recover', 'P0'],
  ['sessions.list', 'P0'], ['model.list', 'P0'], ['model.select', 'P0'],
  ['file.attach', 'P0'], ['chat.create', 'P0'], ['chat.open', 'P0'],
  ['chat.rename', 'P0'], ['generation.stop', 'P0'], ['thinking.level.set', 'P0'],
  ['steer', 'P0'], ['message.edit', 'P0'], ['response.regenerate', 'P0'],
  ['chat.search', 'P1'], ['chat.archive', 'P1'], ['chat.delete', 'P1'],
  ['chat.share', 'P1'], ['branch.create', 'P1'], ['message.copy', 'P1'],
  ['tool.toggle', 'P1'], ['project.select', 'P1'], ['chat.export', 'P1'],
  ['mode.select', 'P1'],
];

const header = [
  'aion_semantic_id', 'core_priority', 'donor_command', 'donor_scope', 'donor_mode',
  'donor_operation', 'donor_retry', 'donor_reconcile_target', 'donor_reload_recovery',
  'allow_during_lease', 'evidence', 'proposed_aion_retry', 'proposed_aion_reconcile',
  'proposed_aion_reload', 'rule',
];

const rows = [header];
const usedDonor = new Set();

for (const [id, priority] of core) {
  const proposal = proposals[id];
  if (!proposal) throw new Error(`missing AION proposal for ${id}`);
  const [retry, reconcile, reload, rule] = proposal;
  const hit = mapping[id];
  if (hit) {
    const [command, note] = hit;
    const definition = donor.get(command);
    if (!definition) throw new Error(`mapped donor command not found: ${command}`);
    usedDonor.add(command);
    rows.push([
      id, priority, command, definition.scope, definition.mode, definition.operation,
      definition.retry, definition.reconcile, definition.reload,
      String(definition.allowDuringLease), `BRIDGE_${note.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
      retry, reconcile, reload, rule,
    ]);
  } else {
    rows.push([
      id, priority, '', '', '', '', '', '', '', '', 'NOT_LOCATED',
      retry, reconcile, reload, rule,
    ]);
  }
}

for (const [command, definition] of donor) {
  if (usedDonor.has(command)) continue;
  rows.push([
    '', '', command, definition.scope, definition.mode, definition.operation,
    definition.retry, definition.reconcile, definition.reload,
    String(definition.allowDuringLease), 'DONOR_ONLY',
    '', '', '', donorOnlyDisposition[command] ?? '',
  ]);
}

const escape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csv = `${rows.map((row) => row.map(escape).join(',')).join('\n')}\n`;
writeFileSync(resolve(here, 'command-facets.csv'), csv, 'utf8');

const mapped = rows.filter((row) => row[10]?.startsWith('BRIDGE_')).length;
const unmapped = rows.filter((row) => row[10] === 'NOT_LOCATED').length;
const donorOnly = rows.filter((row) => row[10] === 'DONOR_ONLY').length;
console.log(`donor definitions=${donor.size} core_ops=${core.length} mapped=${mapped} not_located=${unmapped} donor_only=${donorOnly}`);
