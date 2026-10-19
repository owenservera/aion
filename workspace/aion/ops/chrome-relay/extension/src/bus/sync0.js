// AION Bus — SYNC-0: the no-send phone-to-PC visibility experiment.
//
// Question (DECISION §4/§7 P0): when the owner sends a message to the commander
// conversation from the ChatGPT PHONE app, does the commander tab open in
// Chrome on the PC show the new turn — without a reload, only after a manual
// reload, or not at all? Option A (tab watcher) is viable only if the answer is
// "without reload". This module RECORDS observations; it never sends, never
// reloads, never navigates. The operator protocol is in bus/README.md §SYNC-0.
//
// The probe only knows that the commander conversation's tail CHANGED. It does
// not and cannot know the change came from the phone; the protocol (owner sends
// only from the phone during the window, touches nothing on the PC) supplies
// that, and the verdict says so.

export const SYNC0_KEY = 'aion.relay.bus.sync0.v1';
export const SYNC0_SCHEMA = 'aion.bus.sync0/1';
export const SYNC0_VERDICT = Object.freeze({
  WITHOUT_RELOAD: 'PHONE_TURN_VISIBLE_WITHOUT_RELOAD',
  AFTER_RELOAD: 'PHONE_TURN_VISIBLE_AFTER_RELOAD',
  NO_CHANGE: 'NO_CHANGE_OBSERVED',
  INCONCLUSIVE: 'INCONCLUSIVE',
});
const MAX_SAMPLES = 240;

function snap(s) {
  return { tail_sig: typeof s?.tail_sig === 'string' ? s.tail_sig.slice(0, 96) : null,
    pair_count: Number.isSafeInteger(s?.pair_count) ? s.pair_count : null, generating: s?.generating === true,
    ok: s?.ok === true, error: s?.ok === true ? null : String(s?.code ?? s?.error ?? 'scan_failed').slice(0, 64) };
}

export function startProbe(snapshot, now, { commander_ref = null, window_minutes = 5 } = {}) {
  const base = snap(snapshot);
  return { schema: SYNC0_SCHEMA, status: base.ok && !base.generating ? 'running' : 'invalid', commander_ref,
    started_utc: now, window_minutes, baseline: base, samples: [], reload_marked_utc: null, first_change_utc: null,
    change_before_reload: null, ended_utc: null, verdict: null,
    note: base.ok ? (base.generating ? 'baseline taken while an answer was being written; restart when idle' : null) : 'baseline scan failed' };
}

export function addSample(probe, snapshot, now) {
  if (probe.status !== 'running') return probe;
  const s = { at: now, ...snap(snapshot) };
  probe.samples.push(s);
  if (probe.samples.length > MAX_SAMPLES) probe.samples.splice(1, probe.samples.length - MAX_SAMPLES);
  const changed = s.ok && s.tail_sig !== null && s.tail_sig !== probe.baseline.tail_sig;
  if (changed && probe.first_change_utc === null) {
    probe.first_change_utc = now;
    probe.change_before_reload = probe.reload_marked_utc === null;
  }
  return probe;
}

/** The operator reloaded the commander tab by hand (the extension never does). */
export function markReload(probe, now) {
  if (probe.status === 'running' && probe.reload_marked_utc === null) probe.reload_marked_utc = now;
  return probe;
}

export function finishProbe(probe, now) {
  if (probe.status !== 'running') { probe.verdict = probe.verdict ?? SYNC0_VERDICT.INCONCLUSIVE; return probe; }
  probe.status = 'done';
  probe.ended_utc = now;
  const okSamples = probe.samples.filter((s) => s.ok).length;
  if (probe.first_change_utc !== null) {
    probe.verdict = probe.change_before_reload ? SYNC0_VERDICT.WITHOUT_RELOAD : SYNC0_VERDICT.AFTER_RELOAD;
  } else if (okSamples === 0) {
    probe.verdict = SYNC0_VERDICT.INCONCLUSIVE;
  } else {
    probe.verdict = SYNC0_VERDICT.NO_CHANGE;
  }
  probe.summary = {
    samples: probe.samples.length, ok_samples: okSamples,
    option_a_viable: probe.verdict === SYNC0_VERDICT.WITHOUT_RELOAD,
    caveat: 'A tail change proves the PC tab saw A new turn; that it came from the phone rests on the operator protocol.',
  };
  return probe;
}
