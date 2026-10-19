// AION Bus — service-worker endpoints (`aion/bus-*`).
//
// Registered behind the worker's existing sender check (extension pages only;
// tabs and web pages are refused before this file runs). Every endpoint that
// changes authority — binding, grants, commander, resume, config, scanning that
// may dispatch — additionally requires `user_gesture: true` from the panel. The
// kill switch requires nothing: stopping must always be one click.
//
// The watcher is PULL-ONLY: the worker asks the commander tab for new pairs
// through the read-only `commander-scan` port action. A tab can never push a
// command into the worker.

import { createBus } from '../bus/bus.js';
import { REASON, isPlain } from '../bus/contracts.js';
import { canonicalConversation } from '../lib/chatgpt-tasks.js';
import { CHATGPT_ADAPTER, createChatGPTAdapter } from '../bus/adapters/chatgpt.js';
import { SYNC0_KEY, addSample, finishProbe, markReload, startProbe } from '../bus/sync0.js';

export const BUS_ALARM = 'aion.bus.watch';
export const BUS_WATCH_PERIOD_MINUTES = 0.5;

export const BUS_ENDPOINTS = Object.freeze([
  'aion/bus-status', 'aion/bus-scan', 'aion/bus-observe', 'aion/bus-kill', 'aion/bus-resume', 'aion/bus-config',
  'aion/bus-agent', 'aion/bus-commander', 'aion/bus-grant', 'aion/bus-revoke', 'aion/bus-sync0', 'aion/bus-dispose',
  'aion/bus-archive',
]);
const GESTURE_REQUIRED = new Set(['aion/bus-scan', 'aion/bus-resume', 'aion/bus-config', 'aion/bus-agent',
  'aion/bus-commander', 'aion/bus-grant', 'aion/bus-revoke', 'aion/bus-dispose', 'aion/bus-archive']);

function failure(code, error, extra = {}) { return { ok: false, code, error: `${code}: ${error}`, ...extra }; }

/**
 * @param {object} o
 * @param {object} o.storage  chrome.storage.local-shaped
 * @param {(type:string, payload:object)=>Promise<object>} o.call  the worker's bounded ChatGPT runner
 * @param {object[]} [o.extraAdapters]  e.g. the ACP executor adapter (Bus V2)
 * @param {object} [o.alarms]  chrome.alarms
 */
export function createWorkerBus({ storage, call, extraAdapters = [], alarms = null, now, randomId } = {}) {
  const chatgpt = createChatGPTAdapter({ call });
  const bus = createBus({ storage, adapters: [chatgpt, ...extraAdapters], now, randomId });
  let scanning = null;
  const clock = now ?? (() => new Date().toISOString());

  async function commanderTab(state) {
    const id = state.commander.agent_id;
    if (!id) return { error: failure(REASON.NO_COMMANDER, 'no commander designated') };
    const binding = state.agents[id].binding;
    if (!binding || binding.adapter !== CHATGPT_ADAPTER) return { error: failure(REASON.NO_ADAPTER, 'the watcher reads chatgpt.com commanders only') };
    const listed = await call('aion/chatgpt-tabs', {});
    const tabs = (listed?.tabs ?? []).filter((t) => { try { return canonicalConversation(t.url) === binding.ref; } catch { return false; } });
    if (tabs.length === 0) return { error: failure(REASON.BINDING_TARGET_MISSING, 'the commander conversation is not open in this browser') };
    if (tabs.length > 1) return { error: failure(REASON.BINDING_AMBIGUOUS, `${tabs.length} tabs show the commander conversation; close all but one`) };
    return { tab: tabs[0], ref: binding.ref };
  }

  async function rawScan(tab, baseline, armToken) {
    return call('aion/chatgpt-commander-scan', { tab_id: tab.tab_id, baseline_sig: baseline, arm_token: armToken });
  }

  /** One watcher pass: new commander pairs -> ingest/dispatch; then read-only reconcile. */
  async function scanOnce(reason) {
    if (scanning) return { ok: true, busy: true, reason: 'a scan is already running' };
    scanning = (async () => {
      const state = await bus.store.read();
      if (state.kill.engaged) return failure(REASON.KILL_ENGAGED, 'kill switch engaged; watcher idle');
      const found = await commanderTab(state);
      if (found.error) return found.error;
      const baseline = state.commander.last_seen_sig ?? state.commander.baseline_sig;
      if (baseline === null) {
        // First scan after designation without a baseline: adopt the tail, act on nothing.
        const first = await rawScan(found.tab, null, state.config.arm_token);
        if (!first?.ok || first.generating) return failure(REASON.OUTCOME_UNKNOWN, 'could not take an idle baseline; try again when no answer is being written');
        await bus.rebaseline(first.tail_sig, 'initial baseline');
        return { ok: true, baselined: first.tail_sig, processed: [] };
      }
      const scan = await rawScan(found.tab, baseline, state.config.arm_token);
      if (!scan?.ok) return failure(scan?.code ?? REASON.ADAPTER_ERROR, scan?.error ?? 'scan failed', { read_only: true });
      if (!scan.baseline_found) {
        if (scan.generating) return { ok: true, waiting: true, reason: 'baseline not visible while an answer is being written' };
        await bus.rebaseline(scan.tail_sig, 'baseline no longer visible; turns in the gap are NOT executed');
        return { ok: true, gap: true, rebaselined: scan.tail_sig, processed: [] };
      }
      const processed = [];
      for (const pair of scan.pairs) {
        const result = await bus.process({ source: { adapter: CHATGPT_ADAPTER, ref: found.ref }, turn_sig: pair.turn_sig,
          user_head: pair.user_head, assistant_text: pair.assistant_text });
        processed.push({ turn_sig: pair.turn_sig, accepted: result.ingested.accepted, reason: result.ingested.reason ?? null,
          command_id: result.ingested.command_id ?? null, state: result.dispatched?.state ?? null });
      }
      const reconciled = await reconcileActive();
      return { ok: true, reason, processed, reconciled };
    })().finally(() => { scanning = null; });
    return scanning;
  }

  async function reconcileActive() {
    const state = await bus.store.read();
    const out = [];
    for (const c of Object.values(state.commands)) {
      if (['DISPATCHED', 'SUBMISSION_OBSERVED', 'UNRESOLVED'].includes(c.state)) out.push({ command_id: c.command_id, ...(await bus.observe(c.command_id)) });
    }
    await bus.flushReports();
    return out;
  }

  async function syncWatch() {
    if (!alarms) return;
    const state = await bus.store.read();
    const probe = await readSync0();
    try {
      if ((state.config.watch && !state.kill.engaged) || probe?.status === 'running') alarms.create(BUS_ALARM, { periodInMinutes: BUS_WATCH_PERIOD_MINUTES });
      else alarms.clear(BUS_ALARM);
    } catch { /* an alarm we cannot set is an off watcher, which is the safe state */ }
  }

  async function readSync0() {
    const bag = await storage.get(SYNC0_KEY);
    return isPlain(bag) && isPlain(bag[SYNC0_KEY]) ? bag[SYNC0_KEY] : null;
  }
  async function writeSync0(probe) { await storage.set({ [SYNC0_KEY]: probe }); return probe; }
  async function sync0Snapshot() {
    const state = await bus.store.read();
    const found = await commanderTab(state);
    if (found.error) return { ok: false, code: found.error.code };
    return rawScan(found.tab, null, state.config.arm_token);
  }

  async function handleSync0(message) {
    const action = message.action;
    if (action === 'status') return { ok: true, probe: await readSync0() };
    if (action === 'start') {
      if (message.user_gesture !== true) return failure('explicit_command_required', 'starting SYNC-0 needs a panel click');
      const snapshot = await sync0Snapshot();
      const state = await bus.store.read();
      const ref = state.commander.agent_id ? state.agents[state.commander.agent_id].binding?.ref ?? null : null;
      const probe = await writeSync0(startProbe(snapshot, clock(), { commander_ref: ref, window_minutes: Number(message.window_minutes) || 5 }));
      await syncWatch();
      return { ok: true, probe };
    }
    const probe = await readSync0();
    if (!probe) return failure(REASON.BAD_VALUE, 'no SYNC-0 probe; start one first');
    if (action === 'sample') return { ok: true, probe: await writeSync0(addSample(probe, await sync0Snapshot(), clock())) };
    if (action === 'reload') return { ok: true, probe: await writeSync0(markReload(probe, clock())) };
    if (action === 'finish') { const done = await writeSync0(finishProbe(probe, clock())); await syncWatch(); return { ok: true, probe: done }; }
    return failure(REASON.BAD_VALUE, `unknown sync0 action ${String(action).slice(0, 16)}`);
  }

  async function handleAgent(m) {
    switch (m.action) {
      case 'add': return bus.addAgent({ agent_id: m.agent_id, parent_agent_id: m.parent_agent_id, name: m.name, kind: m.kind, role_id: m.role_id, ops: m.ops });
      case 'bind': return bus.bind(m.agent_id, { adapter: m.adapter ?? CHATGPT_ADAPTER, ref: m.ref, label: m.label ?? null, confirmed_by: m.confirmed_by });
      case 'unbind': return bus.unbind(m.agent_id);
      case 'pause': return bus.pause(m.agent_id, true);
      case 'unpause': return bus.pause(m.agent_id, false);
      case 'retire': return bus.retire(m.agent_id);
      default: throw Object.assign(new Error(`bad_value: unknown agent action ${String(m.action).slice(0, 16)}`), { code: REASON.BAD_VALUE });
    }
  }

  async function handle(message) {
    const type = message?.type;
    if (!BUS_ENDPOINTS.includes(type)) return failure('unknown_endpoint', String(type).slice(0, 40));
    if (GESTURE_REQUIRED.has(type) && message.user_gesture !== true) {
      return failure('explicit_command_required', `${type} changes bus authority; user_gesture must be true`);
    }
    try {
      switch (type) {
        case 'aion/bus-status': return { ok: true, ...(await bus.status()), scanning: !!scanning };
        case 'aion/bus-scan': return await scanOnce('manual');
        case 'aion/bus-observe': return { ok: true, reconciled: await reconcileActive() };
        case 'aion/bus-kill': { const kill = await bus.kill(typeof message.reason === 'string' ? message.reason : 'panel kill switch'); await syncWatch(); return { ok: true, kill }; }
        case 'aion/bus-resume': { const kill = await bus.resume('panel'); await syncWatch(); return { ok: true, kill }; }
        case 'aion/bus-config': { const config = await bus.setConfig(message.config); await syncWatch(); return { ok: true, config }; }
        case 'aion/bus-agent': return { ok: true, agent: await handleAgent(message) };
        case 'aion/bus-commander': {
          const state = await bus.store.read();
          const agent = state.agents[message.agent_id];
          if (!agent?.binding) return failure(REASON.AGENT_UNBOUND, 'bind the commander conversation first');
          // Baseline at designation: nothing already in the conversation is ever executed.
          const listed = await call('aion/chatgpt-tabs', {});
          const tab = (listed?.tabs ?? []).find((t) => { try { return canonicalConversation(t.url) === agent.binding.ref; } catch { return false; } });
          let baseline = null;
          if (tab) {
            const snap = await rawScan(tab, null, state.config.arm_token);
            if (snap?.ok && !snap.generating) baseline = snap.tail_sig;
          }
          return { ok: true, commander: await bus.designateCommander(message.agent_id, { baseline_sig: baseline }), baseline_taken: baseline !== null };
        }
        case 'aion/bus-grant': return { ok: true, grant: await bus.grant(message.grant) };
        case 'aion/bus-revoke': return { ok: true, grant: await bus.revoke(message.grant_id) };
        case 'aion/bus-sync0': return await handleSync0(message);
        case 'aion/bus-dispose': return { ok: true, ...(await bus.dispose(message.command_id, { disposition: message.disposition, by: message.by ?? 'panel owner' })) };
        case 'aion/bus-archive': return await call('aion/chatgpt-archive', { keep_recent: message.keep_recent ?? 128, user_gesture: true });
        default: return failure('unknown_endpoint', type);
      }
    } catch (error) {
      return failure(error.code ?? REASON.ADAPTER_ERROR, String(error.detail ?? error.message ?? error).slice(0, 240));
    }
  }

  return {
    bus, handle, scanOnce, reconcileActive, syncWatch,
    async onAlarm(alarm) {
      if (alarm?.name !== BUS_ALARM) return null;
      // A running SYNC-0 probe samples read-only and SUSPENDS command processing.
      const probe = await readSync0();
      if (probe?.status === 'running') return handleSync0({ action: 'sample' });
      const state = await bus.store.read();
      if (!state.config.watch || state.kill.engaged) { await syncWatch(); return { ok: true, idle: true }; }
      return scanOnce('alarm');
    },
  };
}
