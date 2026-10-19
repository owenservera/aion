// AION Bus — transport-neutral router (Bus V1 commander loop + Bus V2 executors).
//
//   observation ─▶ ingest (C1 armed, C2 one block, C3–C8 validate)
//               ─▶ RESERVED  [nonce + grant unit + command, ONE durable write]
//   dispatch    ─▶ DISPATCHED [text dropped, attempted=true, durable] ─▶ adapter.deliver (ONCE)
//               ─▶ REPLY_CHECKED | SUBMISSION_OBSERVED | UNRESOLVED | REJECTED(positive no-send)
//   observe     ─▶ adapter.observe (read-only, repeatable, never re-sends)
//   report      ─▶ guarded send into the commander at hop+1 ─▶ REPORTED
//
// Provider-neutral: adapters are looked up by the agent's binding, and the
// router reads only their capability manifests. Nothing here knows a DOM, a
// URL scheme, ACP or HTTP.
//
// NO-RESEND INVARIANT: text exists in the ledger only while RESERVED. The write
// that moves a command to DISPATCHED also deletes its text, and it lands
// BEFORE the adapter is called. A crash anywhere after that leaves an attempted
// command with no text: there is nothing any code path could send again.

import {
  AGENT_KIND, ATTEMPTED_STATES, COMMAND_STATE as S, DEFAULT_CONFIG, DISPOSITIONS, MAX_REPORT_ATTEMPTS, ORIGIN, REASON, REPORT_HEADER, REPLY_TOKEN,
  TERMINAL_STATES, BusError, correlationFor, deliveryState, fnv1a, isAgentId, normalizeOutcome, refuse, validateManifest,
} from './contracts.js';
import { isArmed, neutralize, parseCommanderReply } from './grammar.js';
import { addAgent, bindAgent, renderTree, retireAgent, setPaused, unbindAgent } from './registry.js';
import { appendEvent, createBusStore, transition } from './ledger.js';
import { consumeGrant, createGrant, revokeGrant, selectGrant } from './grants.js';
import { validateParsed } from './validate.js';

const ACTIVE = [S.DISPATCHED, S.SUBMISSION_OBSERVED, S.UNRESOLVED];

function defaultRandomId() {
  const bytes = new Uint8Array(10);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
}

export function createBus(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const randomId = options.randomId ?? defaultRandomId;
  const log = options.log ?? (() => {});
  const store = options.store ?? createBusStore({ storage: options.storage, now, initialConfig: options.initialConfig });

  const adapters = {};
  for (const adapter of options.adapters ?? []) {
    const check = validateManifest(adapter?.manifest);
    if (!check.ok) throw new BusError(REASON.NO_ADAPTER, `adapter manifest invalid: ${check.problems.join(', ')}`);
    if (Object.hasOwn(adapters, adapter.manifest.name)) throw new BusError(REASON.NO_ADAPTER, `duplicate adapter ${adapter.manifest.name}`);
    for (const fn of ['deliver', 'observe', 'canonicalRef']) {
      if (typeof adapter[fn] !== 'function') throw new BusError(REASON.NO_ADAPTER, `${adapter.manifest.name} lacks ${fn}()`);
    }
    adapters[adapter.manifest.name] = adapter;
  }

  const newId = () => {
    const id = String(randomId()).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (id.length < 8) throw new BusError(REASON.ADAPTER_ERROR, 'randomId produced too short an id');
    return id.slice(0, 40);
  };

  function blankCommand(fields, at) {
    return {
      command_id: fields.command_id, chain_id: fields.chain_id ?? fields.command_id, hop: fields.hop ?? 0,
      nonce: fields.nonce ?? null, origin_kind: fields.origin_kind, origin_ref: String(fields.origin_ref ?? '').slice(0, 128),
      op: fields.op, to: fields.to ?? null, text: null, text_sig: fields.text ? fnv1a(fields.text) : '',
      text_chars: fields.text ? fields.text.length : 0, grant_id: fields.grant_id ?? null, correlation_id: null,
      reply_token: null, adapter: fields.adapter ?? null, binding_ref: null, state: S.OBSERVED, attempted: false,
      reason: null, detail: null, reply: null, report_of: fields.report_of ?? null, report_command_id: null, executor_ref: null,
      created_utc: at, updated_utc: at, history: [{ state: S.OBSERVED, at, reason: null }],
    };
  }

  /** Reserve inside an open mutation: grant unit, rate slot, correlation, text. */
  function reserveInDraft(draft, command, text, at) {
    const agent = draft.agents[command.to];
    consumeGrant(draft, command.grant_id);
    command.text = text;
    command.text_sig = fnv1a(text);
    command.text_chars = text.length;
    command.correlation_id = correlationFor(command.command_id, at);
    command.reply_token = `ACK-${newId().slice(0, 12)}`;
    if (!REPLY_TOKEN.test(command.reply_token)) refuse(REASON.ADAPTER_ERROR, 'reply token shape');
    command.adapter = agent.binding.adapter;
    command.binding_ref = agent.binding.ref.slice(0, 128);
    transition(command, S.RESERVED, at);
  }

  function statusText(state, focus) {
    const lines = [`AION bus status at ${now()}`, `kill: ${state.kill.engaged ? `ENGAGED (${state.kill.reason ?? ''})` : 'off'}`,
      `commander: ${state.commander.agent_id ?? 'none'}`];
    const open = Object.values(state.commands).filter((c) => !TERMINAL_STATES.includes(c.state) && (!focus || c.to === focus));
    lines.push(`open commands: ${open.length}`);
    for (const c of open.slice(-8)) lines.push(`- ${c.command_id} ${c.op} -> ${c.to ?? '-'}: ${c.state} / ${deliveryState(c)}`);
    if (focus) {
      const a = state.agents[focus];
      lines.push(`agent ${focus}: ${a.kind}/${a.status}${a.binding ? ` bound via ${a.binding.adapter}` : ''}`);
    } else {
      lines.push('registry:', renderTree(state.agents));
    }
    lines.push('Bound conversations answer only when spoken to; idle agents are not working.');
    return lines.join('\n').slice(0, state.config.max_text_chars);
  }

  /* ------------------------------------------------------------- ingest */

  /**
   * One observed commander turn pair.
   *   observation = { source:{adapter, ref}, turn_sig, user_head, assistant_text }
   * `assistant_text` should contain only what the watcher extracted (the
   * fenced blocks); it is parsed and then discarded, never stored.
   */
  async function ingest(observation) {
    const { result } = await store.mutate((draft, { now: at }) => {
      const turnSig = String(observation?.turn_sig ?? '');
      if (!/^[A-Za-z0-9:._-]{4,128}$/.test(turnSig)) refuse(REASON.BAD_VALUE, 'turn_sig shape');
      const commanderId = draft.commander.agent_id;
      const reject = (reason, detail, fields = {}) => {
        appendEvent(draft, at, 'command.rejected', { reason, turn_sig: turnSig, ...fields });
        return { accepted: false, reason, detail };
      };
      if (Object.hasOwn(draft.observations, turnSig)) return { accepted: false, reason: REASON.DUPLICATE_OBSERVATION, detail: 'turn already processed' };
      if (!commanderId) return reject(REASON.NO_COMMANDER, 'no commander designated');
      const binding = draft.agents[commanderId].binding;
      const adapter = binding && adapters[binding.adapter];
      let ref = null;
      try { ref = adapter ? adapter.canonicalRef(observation.source?.ref) : null; } catch { ref = null; }
      if (!binding || observation.source?.adapter !== binding.adapter || ref !== binding.ref) {
        return reject(REASON.NOT_COMMANDER, 'observation is not from the commander conversation');
      }
      // From here on the turn is the commander's and is recorded as seen, so a
      // re-scan of the same turn can never produce a second command.
      draft.observations[turnSig] = 'seen';
      draft.commander.last_seen_sig = turnSig;
      if (!isArmed(observation.user_head, draft.config.arm_token)) {
        // Unarmed turns (including every reply to a bus report) are ignored silently.
        draft.observations[turnSig] = 'unarmed';
        return { accepted: false, reason: REASON.NOT_ARMED, detail: 'preceding user turn is not owner-armed' };
      }
      const parsed = parseCommanderReply(observation.assistant_text, draft.config);
      if (!parsed.ok) return reject(parsed.reason, parsed.detail);
      const cmd = parsed.command;
      const verdict = validateParsed(draft, cmd, { adapters, now: at });
      const command = blankCommand({ command_id: newId(), nonce: cmd.nonce, origin_kind: ORIGIN.OWNER_PHONE,
        origin_ref: turnSig, op: cmd.op, to: cmd.op === 'status' ? draft.commander.agent_id : cmd.to,
        grant_id: verdict.ok ? verdict.grant_id : null }, at);
      if (verdict.reason !== REASON.NONCE_REPLAYED) draft.nonces[cmd.nonce] = command.command_id;
      appendEvent(draft, at, 'command.observed', { command_id: command.command_id, op: cmd.op, to: command.to });
      if (!verdict.ok) {
        transition(command, S.REJECTED, at, { reason: verdict.reason, detail: verdict.detail });
        draft.commands[command.command_id] = command;
        draft.observations[turnSig] = command.command_id;
        return reject(verdict.reason, verdict.detail, { command_id: command.command_id });
      }
      transition(command, S.VALIDATED, at);
      let text = cmd.text;
      if (cmd.op === 'status') text = statusText(draft, cmd.to);
      if (cmd.op === 'cancel') text = 'cancel';
      reserveInDraft(draft, command, text, at);
      draft.commands[command.command_id] = command;
      draft.observations[turnSig] = command.command_id;
      appendEvent(draft, at, 'command.validated', { command_id: command.command_id, grant_id: command.grant_id });
      return { accepted: true, command_id: command.command_id, op: command.op, to: command.to };
    });
    return result;
  }

  /**
   * Transport-neutral ingress for already-structured commands (MCP write tool,
   * CLI). Same validation, same reservation; no arm check because there is no
   * chat turn — the caller must present the owner grant id explicitly.
   */
  async function ingestStructured({ op, to = null, text = null, nonce, origin_kind = ORIGIN.MCP_INGRESS, origin_ref }) {
    const body = [`op: ${op}`, to ? `to: ${to}` : null, text !== null ? `text: <<\n${text}\n>>` : null, `nonce: ${nonce}`].filter(Boolean).join('\n');
    const { result } = await store.mutate((draft, { now: at }) => {
      const parsed = parseCommanderReply(`\`\`\`AION_CMD_V1\n${body}\n\`\`\``, draft.config);
      if (!parsed.ok) return { accepted: false, reason: parsed.reason, detail: parsed.detail };
      const verdict = validateParsed(draft, parsed.command, { adapters, now: at });
      const command = blankCommand({ command_id: newId(), nonce: parsed.command.nonce, origin_kind, origin_ref: origin_ref ?? 'structured',
        op: parsed.command.op, to: parsed.command.op === 'status' ? draft.commander.agent_id : parsed.command.to,
        grant_id: verdict.ok ? verdict.grant_id : null }, at);
      if (verdict.reason !== REASON.NONCE_REPLAYED) draft.nonces[parsed.command.nonce] = command.command_id;
      if (!verdict.ok) {
        transition(command, S.REJECTED, at, { reason: verdict.reason, detail: verdict.detail });
        draft.commands[command.command_id] = command;
        appendEvent(draft, at, 'command.rejected', { command_id: command.command_id, reason: verdict.reason });
        return { accepted: false, reason: verdict.reason, detail: verdict.detail, command_id: command.command_id };
      }
      transition(command, S.VALIDATED, at);
      let t = parsed.command.text;
      if (parsed.command.op === 'status') t = statusText(draft, parsed.command.to);
      if (parsed.command.op === 'cancel') t = 'cancel';
      reserveInDraft(draft, command, t, at);
      draft.commands[command.command_id] = command;
      appendEvent(draft, at, 'command.validated', { command_id: command.command_id, origin: origin_kind });
      return { accepted: true, command_id: command.command_id, op: command.op, to: command.to };
    });
    return result;
  }

  /* ----------------------------------------------------------- dispatch */

  async function applyOutcome(commandId, raw, { observing = false } = {}) {
    const outcome = normalizeOutcome(raw);
    const { result } = await store.mutate((draft, { now: at }) => {
      const c = draft.commands[commandId];
      if (!c) refuse(REASON.STORE_CORRUPT, `command ${commandId} vanished`);
      if (!ACTIVE.includes(c.state)) return { state: c.state, changed: false };
      const from = c.state;
      if (outcome.session_ref && c.executor_ref === null) c.executor_ref = outcome.session_ref;
      switch (outcome.outcome) {
        case 'reply': {
          const max = draft.config.max_report_excerpt_chars;
          c.reply = { chars: outcome.reply.length, sig: fnv1a(outcome.reply), excerpt: outcome.reply.slice(0, max), observed_utc: at };
          transition(c, S.REPLY_CHECKED, at, { reason: outcome.reason, detail: outcome.detail });
          break;
        }
        case 'sent':
          if (from !== S.SUBMISSION_OBSERVED) transition(c, S.SUBMISSION_OBSERVED, at, { reason: outcome.reason, detail: outcome.detail });
          break;
        case 'not_sent':
          if (from === S.SUBMISSION_OBSERVED) {
            // A target that already confirmed receipt cannot later prove no-send.
            return { state: c.state, changed: false, contradiction: true };
          }
          transition(c, S.REJECTED, at, { reason: outcome.reason ?? REASON.TARGET_REFUSED, detail: outcome.detail });
          c.attempted = false;
          break;
        case 'unknown':
          if (from === S.DISPATCHED) transition(c, S.UNRESOLVED, at, { reason: outcome.reason ?? REASON.OUTCOME_UNKNOWN, detail: outcome.detail });
          else { c.reason = outcome.reason ?? c.reason; c.updated_utc = at; }
          break;
        case 'pending':
          if (!observing && from === S.DISPATCHED) transition(c, S.UNRESOLVED, at, { reason: REASON.OUTCOME_UNKNOWN, detail: 'adapter returned pending on deliver' });
          break;
        default: break;
      }
      appendEvent(draft, at, observing ? 'command.observed_update' : 'command.dispatched', { command_id: c.command_id, state: c.state, reason: c.reason });
      // A report is DATA posted into the commander: once its submission is
      // observed the source is reported, even if the commander model never
      // acknowledges (its ack only settles the report's own lock).
      if (c.op === 'report' && c.state === S.SUBMISSION_OBSERVED) {
        const source = c.report_of && draft.commands[c.report_of];
        if (source && source.state === S.REPLY_CHECKED) {
          transition(source, S.REPORTED, at);
          appendEvent(draft, at, 'report.posted', { command_id: c.report_of, report_command_id: c.command_id, acknowledged: false });
        }
      }
      // A report command that got its correlated acknowledgement completes both.
      if (c.op === 'report' && c.state === S.REPLY_CHECKED) {
        transition(c, S.REPORTED, at);
        const source = c.report_of && draft.commands[c.report_of];
        if (source && source.state === S.REPLY_CHECKED) transition(source, S.REPORTED, at);
        appendEvent(draft, at, 'report.posted', { command_id: c.report_of, report_command_id: c.command_id });
      }
      return { state: c.state, changed: c.state !== from };
    });
    return { ...result, outcome: outcome.outcome, reason: outcome.reason };
  }

  /** The single attempt. Never called twice for one command: DISPATCHED is durable first. */
  async function dispatch(commandId) {
    const { result: prepared } = await store.mutate((draft, { now: at }) => {
      const c = draft.commands[commandId];
      if (!c) refuse(REASON.UNKNOWN_AGENT, `no command ${commandId}`);
      if (c.state !== S.RESERVED) return { skip: true, state: c.state };
      if (draft.kill.engaged) {
        transition(c, S.HALTED, at, { reason: REASON.KILL_ENGAGED, detail: 'kill switch engaged before dispatch' });
        c.text = null;
        appendEvent(draft, at, 'kill.engaged', { command_id: c.command_id });
        return { skip: true, state: c.state };
      }
      const agent = draft.agents[c.to];
      const text = c.text;
      const commander = draft.commander.agent_id ? draft.agents[draft.commander.agent_id] : null;
      const req = {
        command_id: c.command_id, op: c.op, kind: c.op === 'report' ? 'report' : 'command',
        correlation_id: c.correlation_id, reply_token: c.reply_token, text,
        binding: { ref: agent.binding.ref, label: agent.binding.label },
        agent: { agent_id: agent.agent_id, name: agent.name, role_id: agent.role_id, kind: agent.kind },
        grant: { grant_id: c.grant_id, cwd: draft.grants[c.grant_id]?.cwd ?? null },
        origin: { commander_name: commander?.name ?? null, chain_id: c.chain_id, hop: c.hop },
        cancel_target: null,
      };
      if (c.op === 'cancel') {
        const target = Object.values(draft.commands).filter((x) => x.to === c.to && x.op === 'send' && ACTIVE.includes(x.state))
          .sort((a, b) => a.created_utc.localeCompare(b.created_utc)).pop();
        req.cancel_target = target ? { command_id: target.command_id, correlation_id: target.correlation_id, executor_ref: target.executor_ref } : null;
      }
      transition(c, S.DISPATCHED, at);
      c.attempted = true;
      c.text = null;
      draft.rate.push({ agent_id: c.to, at });
      return { skip: false, req, adapterName: agent.binding.adapter };
    });
    if (prepared.skip) return { state: prepared.state, dispatched: false };

    const adapter = adapters[prepared.adapterName];
    let raw;
    try {
      if (!adapter) raw = { outcome: 'not_sent', reason: REASON.NO_ADAPTER, detail: 'adapter unloaded after reservation' };
      else if (prepared.req.op === 'cancel') {
        raw = !prepared.req.cancel_target ? { outcome: 'not_sent', reason: REASON.NOTHING_TO_CANCEL }
          : typeof adapter.cancel === 'function' ? await adapter.cancel(prepared.req) : { outcome: 'not_sent', reason: REASON.OP_NOT_SUPPORTED };
      } else raw = await adapter.deliver(prepared.req);
    } catch (error) {
      // An exception after the call began is NOT a no-send.
      raw = { outcome: 'unknown', reason: REASON.ADAPTER_ERROR, detail: String(error?.message ?? error).slice(0, 200) };
    }
    log('dispatch', { command_id: commandId, outcome: raw?.outcome });
    const applied = await applyOutcome(commandId, raw);
    let report = null;
    if (applied.state === S.REPLY_CHECKED) report = await reportBack(commandId);
    return { ...applied, dispatched: true, report };
  }

  /** Read-only reconciliation of one attempted command. Never sends. */
  async function observe(commandId) {
    const state = await store.read();
    const c = state.commands[commandId];
    if (!c) refuse(REASON.UNKNOWN_AGENT, `no command ${commandId}`);
    if (!ACTIVE.includes(c.state)) return { state: c.state, changed: false };
    const agent = state.agents[c.to];
    const adapter = agent?.binding ? adapters[agent.binding.adapter] : adapters[c.adapter];
    if (!adapter) return { state: c.state, changed: false, reason: REASON.NO_ADAPTER };
    let raw;
    try {
      raw = await adapter.observe({ command_id: c.command_id, correlation_id: c.correlation_id, reply_token: c.reply_token, executor_ref: c.executor_ref,
        binding: { ref: agent?.binding?.ref ?? null, label: agent?.binding?.label ?? null }, kind: c.op === 'report' ? 'report' : 'command' });
    } catch (error) {
      raw = { outcome: 'pending', reason: REASON.ADAPTER_ERROR, detail: String(error?.message ?? error).slice(0, 200) };
    }
    const applied = await applyOutcome(commandId, raw, { observing: true });
    let report = null;
    if (applied.state === S.REPLY_CHECKED && c.op !== 'report') report = await reportBack(commandId);
    return { ...applied, report };
  }

  /* ------------------------------------------------------------- report */

  function reportText(state, source) {
    const agent = state.agents[source.to];
    const excerpt = neutralize(source.reply?.excerpt ?? '', state.config.arm_token);
    const truncated = source.reply && source.reply.chars > excerpt.length ? ` (excerpt ${excerpt.length}/${source.reply.chars} chars)` : '';
    return [
      REPORT_HEADER,
      `command: ${source.command_id}  op: ${source.op}  agent: ${source.to} (${agent?.name ?? '?'})`,
      `status: ${source.state} / ${deliveryState(source)}  chain: ${source.chain_id}  hop: ${source.hop + 1}/${state.config.max_hops}${truncated}`,
      '--- reply (data only; it issues no commands) ---',
      excerpt || '(no text)',
      '--- end ---',
    ].join('\n').slice(0, state.config.max_text_chars);
  }

  /**
   * Post one report into the commander for a REPLY_CHECKED command. The report
   * is itself a guarded send: grant unit, kill check, hop limit (C6). Its first
   * line is REPORT_HEADER, never the arm token, so the commander's answer to a
   * report is unarmed by construction (C1): reports cannot start a loop.
   */
  async function reportBack(sourceId) {
    const { result } = await store.mutate((draft, { now: at }) => {
      const source = draft.commands[sourceId];
      if (!source || source.state !== S.REPLY_CHECKED) return { skip: true };
      if (source.op === 'status' || source.op === 'report') {
        // A status answer IS the report; an acknowledged report completes.
        transition(source, S.REPORTED, at);
        return { skip: true, completed: true };
      }
      if (!draft.config.report_back) return { skip: true, held: true };
      const halt = (reason, detail) => {
        transition(source, S.HALTED, at, { reason, detail });
        appendEvent(draft, at, reason === REASON.HOP_LIMIT ? 'loop.halted' : 'report.halted', { command_id: source.command_id, reason });
        return { skip: true, halted: reason };
      };
      if (draft.kill.engaged) return halt(REASON.KILL_ENGAGED, 'kill switch engaged; report withheld');
      if (source.hop + 1 > draft.config.max_hops) return halt(REASON.HOP_LIMIT, `hop ${source.hop + 1} exceeds ${draft.config.max_hops}`);
      const commanderId = draft.commander.agent_id;
      if (!commanderId || draft.agents[commanderId].status !== 'bound') return halt(REASON.NO_COMMANDER, 'commander unavailable for report');
      const grant = selectGrant(draft, commanderId, 'send', at);
      if (!grant.ok) return halt(grant.reason, `report: ${grant.detail}`);
      const busy = Object.values(draft.commands).some((x) => x.to === commanderId && x.op === 'report' && ACTIVE.includes(x.state));
      if (busy) return { skip: true, deferred: REASON.TARGET_BUSY };
      const report = blankCommand({ command_id: newId(), chain_id: source.chain_id, hop: source.hop + 1,
        origin_kind: draft.agents[source.to].kind === AGENT_KIND.EXECUTOR ? ORIGIN.EXECUTOR_REPORT : ORIGIN.AGENT_REPORT,
        origin_ref: source.command_id, op: 'report', to: commanderId, grant_id: grant.grant.grant_id, report_of: source.command_id }, at);
      transition(report, S.VALIDATED, at);
      reserveInDraft(draft, report, reportText(draft, source), at);
      draft.commands[report.command_id] = report;
      source.report_command_id = report.command_id;
      return { skip: false, report_id: report.command_id };
    });
    if (result.skip) return result;
    return { report_id: result.report_id, ...(await dispatch(result.report_id)) };
  }

  /** Retry a DEFERRED report (commander was busy). A report is a new send, never a resend. */
  async function flushReports() {
    const state = await store.read();
    const out = [];
    for (const c of Object.values(state.commands)) {
      if (c.state !== S.REPLY_CHECKED || c.op === 'report') continue;
      const prior = c.report_command_id ? state.commands[c.report_command_id] : null;
      if (prior) {
        // Retry ONLY a report that was positively not sent (never an unknown one), bounded.
        const notSent = prior.state === S.REJECTED && prior.attempted === false;
        const attempts = Object.values(state.commands).filter((x) => x.op === 'report' && x.report_of === c.command_id).length;
        if (!notSent) continue;
        if (attempts >= MAX_REPORT_ATTEMPTS) {
          await store.mutate((d, { now: at }) => {
            const src = d.commands[c.command_id];
            if (src?.state === S.REPLY_CHECKED) transition(src, S.HALTED, at, { reason: REASON.REPORT_RETRIES_EXHAUSTED, detail: `${attempts} report attempts were refused before sending` });
          });
          out.push({ command_id: c.command_id, halted: REASON.REPORT_RETRIES_EXHAUSTED });
          continue;
        }
        await store.mutate((d) => { if (d.commands[c.command_id]) d.commands[c.command_id].report_command_id = null; });
      }
      out.push(await reportBack(c.command_id));
    }
    return out;
  }

  /**
   * OWNER disposal of an unresolved command after looking at the target
   * conversation. Releases the adapter's lock (ChatGPT task store) and halts
   * the command. Never re-sends. A disposed report marks its source reported
   * only if the owner saw it delivered.
   */
  async function dispose(commandId, { disposition, by }) {
    if (!DISPOSITIONS.includes(disposition)) refuse(REASON.BAD_VALUE, `disposition must be one of ${DISPOSITIONS.join('|')}`);
    if (typeof by !== 'string' || !by.trim()) refuse(REASON.BAD_VALUE, 'disposal needs an owner reference');
    const state = await store.read();
    const c = state.commands[commandId];
    if (!c) refuse(REASON.UNKNOWN_AGENT, `no command ${commandId}`);
    if (!ACTIVE.includes(c.state)) return { state: c.state, disposed: false, detail: 'not unresolved' };
    const adapter = adapters[c.adapter];
    let released = null;
    if (adapter && typeof adapter.dispose === 'function') {
      released = await adapter.dispose({ command_id: c.command_id, correlation_id: c.correlation_id, disposition });
      if (!released?.ok && released?.code !== 'task_already_resolved' && released?.code !== 'operation_not_reserved') {
        return { state: c.state, disposed: false, detail: `adapter refused disposal: ${released?.code ?? 'unknown'}` };
      }
    }
    const { result } = await store.mutate((d, { now: at }) => {
      const x = d.commands[commandId];
      if (!x || !ACTIVE.includes(x.state)) return { state: x?.state, disposed: false };
      transition(x, S.HALTED, at, { reason: REASON.OWNER_DISPOSED, detail: `${disposition} by ${String(by).slice(0, 80)}` });
      if (disposition === 'owner_saw_not_delivered') x.attempted = false;
      if (x.op === 'report' && disposition === 'owner_saw_delivered') {
        const src = x.report_of && d.commands[x.report_of];
        if (src?.state === S.REPLY_CHECKED) transition(src, S.REPORTED, at);
      }
      appendEvent(d, at, 'command.disposed', { command_id: commandId, disposition });
      return { state: x.state, disposed: true, lock_released: released ? released.ok === true : null };
    });
    return result;
  }

  /**
   * After a restart: halt reservations that were never attempted (a stale owner
   * command is not executed late), and observe every attempted command.
   */
  async function reconcile({ observeActive = true } = {}) {
    // Read first: a reconcile with nothing stale writes nothing (status stays read-only).
    const before = await store.read();
    const stale = Object.values(before.commands).some((c) => c.state === S.RESERVED);
    const { result: halted } = !stale ? { result: [] } : await store.mutate((draft, { now: at }) => {
      const ids = [];
      for (const c of Object.values(draft.commands)) {
        if (c.state === S.RESERVED) {
          transition(c, S.HALTED, at, { reason: REASON.STALE_RESERVATION, detail: 'found reserved after restart; not dispatched late' });
          c.text = null;
          ids.push(c.command_id);
        }
      }
      if (ids.length) appendEvent(draft, at, 'reconcile.halted', { count: ids.length });
      return ids;
    });
    const observed = [];
    if (observeActive) {
      const state = await store.read();
      for (const c of Object.values(state.commands)) if (ACTIVE.includes(c.state)) observed.push({ command_id: c.command_id, ...(await observe(c.command_id)) });
    }
    return { halted, observed };
  }

  /**
   * Dispatch reservations made by structured ingress (MCP/CLI) in ANOTHER
   * process. Fresh ones (younger than maxAgeMs) are attempted once; older ones
   * are halted, never executed late. Chat-turn reservations are dispatched by
   * the process that made them and are not touched here.
   */
  async function dispatchPending({ maxAgeMs = 5 * 60 * 1000 } = {}) {
    const state = await store.read();
    const t = Date.parse(now());
    const out = [];
    for (const c of Object.values(state.commands)) {
      if (c.state !== S.RESERVED || ![ORIGIN.MCP_INGRESS].includes(c.origin_kind)) continue;
      if (t - Date.parse(c.created_utc) > maxAgeMs) {
        await store.mutate((d, { now: at }) => {
          const x = d.commands[c.command_id];
          if (x?.state === S.RESERVED) { transition(x, S.HALTED, at, { reason: REASON.STALE_RESERVATION, detail: 'ingress reservation too old; not dispatched late' }); x.text = null; }
        });
        out.push({ command_id: c.command_id, state: S.HALTED });
      } else {
        out.push({ command_id: c.command_id, ...(await dispatch(c.command_id)) });
      }
    }
    return out;
  }

  async function process(observation) {
    const ingested = await ingest(observation);
    if (!ingested.accepted) return { ingested };
    return { ingested, dispatched: await dispatch(ingested.command_id) };
  }

  /* ------------------------------------------------------ owner controls */

  async function owner(fn) { return (await store.mutate(fn)).result; }

  // Adapters that learn results asynchronously (ACP) report the correlation;
  // the bus observes that command at once so the result becomes durable.
  for (const adapter of Object.values(adapters)) {
    if (typeof adapter.setOnSettled !== 'function') continue;
    adapter.setOnSettled(async (correlationId) => {
      const state = await store.read();
      const c = Object.values(state.commands).find((x) => x.correlation_id === correlationId);
      if (c && ACTIVE.includes(c.state)) await observe(c.command_id);
    });
  }

  return {
    store,
    adapters: Object.freeze({ ...adapters }),
    ingest, ingestStructured, dispatch, dispatchPending, observe, reconcile, process, reportBack, flushReports, dispose,

    async status() {
      const state = await store.read();
      const commands = Object.values(state.commands).map((c) => ({ command_id: c.command_id, op: c.op, to: c.to, state: c.state,
        delivery: deliveryState(c), reason: c.reason, hop: c.hop, chain_id: c.chain_id, origin_kind: c.origin_kind,
        reply_chars: c.reply?.chars ?? null, updated_utc: c.updated_utc }));
      return {
        schema: state.schema, seq: state.seq, kill: state.kill, commander: state.commander.agent_id, config: state.config,
        adapters: Object.values(adapters).map((a) => a.manifest),
        agents: Object.values(state.agents).map((a) => ({ agent_id: a.agent_id, parent_agent_id: a.parent_agent_id, name: a.name,
          kind: a.kind, status: a.status, adapter: a.binding?.adapter ?? null, label: a.binding?.label ?? null, ops: a.ops })),
        grants: Object.values(state.grants).map((g) => ({ ...g })),
        commands, tree: renderTree(state.agents), events: state.events.slice(-50),
      };
    },
    async readCommand(id) { const s = await store.read(); return s.commands[id] ? structuredClone(s.commands[id]) : null; },

    kill: (reason = 'owner kill switch') => owner((d, { now: at }) => { d.kill = { engaged: true, at, reason: String(reason).slice(0, 160) }; appendEvent(d, at, 'kill.engaged', { reason }); return d.kill; }),
    resume: (by) => owner((d, { now: at }) => { d.kill = { engaged: false, at, reason: null }; appendEvent(d, at, 'kill.released', { by: String(by ?? 'owner') }); return d.kill; }),
    setConfig: (partial) => owner((d, { now: at }) => {
      for (const [k, v] of Object.entries(partial ?? {})) {
        if (!Object.hasOwn(DEFAULT_CONFIG, k)) refuse(REASON.UNKNOWN_KEY, `config ${k}`);
        d.config[k] = v;
      }
      appendEvent(d, at, 'config.updated', { keys: Object.keys(partial ?? {}).join(',') });
      return d.config;
    }),
    addAgent: (input) => owner((d, { now: at }) => { d.agents = addAgent(d.agents, input, at); appendEvent(d, at, 'agent.registered', { agent_id: input.agent_id }); return d.agents[input.agent_id]; }),
    bind: (agentId, { adapter, ref, label = null, confirmed_by }) => owner((d, { now: at }) => {
      const a = adapters[adapter];
      if (!a) refuse(REASON.NO_ADAPTER, `adapter ${adapter} is not loaded`);
      if (!isAgentId(agentId) || !d.agents[agentId]) refuse(REASON.UNKNOWN_AGENT, `no agent ${agentId}`);
      if (a.manifest.kind !== d.agents[agentId].kind) refuse(REASON.NO_ADAPTER, `${adapter} cannot serve a ${d.agents[agentId].kind}`);
      if (typeof confirmed_by !== 'string' || !confirmed_by.trim()) refuse(REASON.BAD_VALUE, 'binding needs confirmed_by (owner reference)');
      const canonical = a.canonicalRef(ref);
      d.agents = bindAgent(d.agents, agentId, { adapter, ref: canonical, label, confirmed_by }, at);
      appendEvent(d, at, 'agent.updated', { agent_id: agentId, bound: adapter });
      return d.agents[agentId];
    }),
    unbind: (agentId) => owner((d, { now: at }) => {
      if (d.commander.agent_id === agentId) d.commander = { agent_id: null, baseline_sig: null, baseline_utc: null, last_seen_sig: null };
      d.agents = unbindAgent(d.agents, agentId, at); appendEvent(d, at, 'agent.updated', { agent_id: agentId, bound: null }); return d.agents[agentId];
    }),
    pause: (agentId, paused = true) => owner((d, { now: at }) => { d.agents = setPaused(d.agents, agentId, paused, at); return d.agents[agentId]; }),
    retire: (agentId) => owner((d, { now: at }) => {
      if (d.commander.agent_id === agentId) refuse(REASON.BAD_VALUE, 'designate another commander before retiring this one');
      d.agents = retireAgent(d.agents, agentId, at); appendEvent(d, at, 'agent.retired', { agent_id: agentId }); return d.agents[agentId];
    }),
    /** The commander's scan baseline was lost: start again from `sig`; the gap is undelivered, never replayed. */
    rebaseline: (sig, reason = 'baseline not visible') => owner((d, { now: at }) => {
      if (!d.commander.agent_id) refuse(REASON.NO_COMMANDER, 'no commander');
      d.commander.baseline_sig = typeof sig === 'string' ? sig.slice(0, 128) : null;
      d.commander.baseline_utc = at;
      d.commander.last_seen_sig = d.commander.baseline_sig;
      appendEvent(d, at, 'commander.gap', { reason: String(reason).slice(0, 120) });
      return d.commander;
    }),
    designateCommander: (agentId, { baseline_sig = null } = {}) => owner((d, { now: at }) => {
      const a = d.agents[agentId];
      if (!a) refuse(REASON.UNKNOWN_AGENT, `no agent ${agentId}`);
      if (a.kind !== AGENT_KIND.CONVERSATION || a.status !== 'bound') refuse(REASON.AGENT_UNBOUND, 'commander must be a bound conversation agent');
      if (!adapters[a.binding.adapter]?.manifest.capabilities.report_target) refuse(REASON.OP_NOT_SUPPORTED, 'adapter cannot receive reports');
      d.commander = { agent_id: agentId, baseline_sig, baseline_utc: at, last_seen_sig: baseline_sig };
      appendEvent(d, at, 'commander.designated', { agent_id: agentId });
      return d.commander;
    }),
    grant: (input) => owner((d, { now: at }) => { const g = createGrant(d, input, at); appendEvent(d, at, 'grant.created', { grant_id: g.grant_id }); return g; }),
    revoke: (grantId) => owner((d, { now: at }) => { const g = revokeGrant(d, grantId); appendEvent(d, at, 'grant.revoked', { grant_id: grantId }); return g; }),
  };
}

export { ATTEMPTED_STATES };
