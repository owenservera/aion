// AION Bus panel. Every authority-changing click sends `user_gesture: true`;
// the worker refuses those endpoints without it. Data from the worker is
// rendered with textContent only (it is data, never markup).

const el = (id) => document.getElementById(id);
const say = (id, text) => { const n = el(id); if (n) n.textContent = text; };

export function send(message) {
  return new Promise((resolve) => {
    try { chrome.runtime.sendMessage(message, (reply) => resolve(reply ?? { ok: false, error: 'no reply' })); }
    catch (error) { resolve({ ok: false, error: String(error?.message ?? error) }); }
  });
}
const act = (type, extra = {}) => send({ type, user_gesture: true, ...extra });
const errText = (r) => (r?.ok ? 'ok' : `refused: ${r?.error ?? r?.code ?? 'unknown'}`);

export function renderStatus(s) {
  say('bus-kill-state', `Kill switch: ${s.kill?.engaged ? `ENGAGED${s.kill.reason ? ` (${s.kill.reason})` : ''}` : 'off'}`);
  const open = (s.commands ?? []).filter((c) => !['REPORTED', 'REJECTED', 'HALTED'].includes(c.state)).length;
  say('bus-summary', `Commander: ${s.commander ?? 'none'} · open commands: ${open} · adapters: ${(s.adapters ?? []).map((a) => a.name).join(', ')} · live verified: ${(s.adapters ?? []).some((a) => a.capabilities?.live_verified) ? 'some' : 'none'}`);
  say('bus-tree', s.tree ?? '');
  const list = el('bus-commands');
  if (list) {
    list.replaceChildren(...(s.commands ?? []).slice(-12).reverse().map((c) => {
      const li = document.createElement('li');
      li.textContent = `${c.command_id} · ${c.op} → ${c.to ?? '-'} · ${c.state} / ${c.delivery}${c.reason ? ` · ${c.reason}` : ''}`;
      return li;
    }));
  }
  const select = el('bind-agent');
  if (select && select.options.length === 0) {
    for (const a of (s.agents ?? []).filter((x) => x.kind !== 'owner')) {
      const o = document.createElement('option'); o.value = a.agent_id; o.textContent = `${a.agent_id} — ${a.name}`; select.append(o);
    }
  }
  const watch = el('watch-toggle');
  if (watch) watch.checked = s.config?.watch === true;
  say('watch-state', s.config?.watch ? 'Watching (only acts on owner-armed turns after the baseline).' : 'Not watching.');
}

async function refresh() {
  const s = await send({ type: 'aion/bus-status' });
  if (s?.ok) renderStatus(s); else say('bus-summary', errText(s));
}

function wire() {
  el('bus-kill')?.addEventListener('click', async () => { say('bus-kill-state', errText(await send({ type: 'aion/bus-kill', reason: 'panel stop' }))); refresh(); });
  el('bus-resume')?.addEventListener('click', async () => { say('bus-kill-state', errText(await act('aion/bus-resume'))); refresh(); });
  el('bus-refresh')?.addEventListener('click', refresh);
  el('bus-scan')?.addEventListener('click', async () => { const r = await act('aion/bus-scan'); say('bus-summary', r.ok ? `scan: ${r.processed?.length ?? 0} new turn(s)${r.gap ? ', gap re-baselined' : ''}` : errText(r)); refresh(); });
  el('bus-observe')?.addEventListener('click', async () => { await send({ type: 'aion/bus-observe' }); refresh(); });
  el('bind-go')?.addEventListener('click', async () => {
    const r = await act('aion/bus-agent', { action: 'bind', agent_id: el('bind-agent').value, adapter: el('bind-adapter').value, ref: el('bind-ref').value.trim(), confirmed_by: el('bind-by').value.trim() });
    say('bind-result', errText(r)); refresh();
  });
  el('commander-go')?.addEventListener('click', async () => {
    const r = await act('aion/bus-commander', { agent_id: el('bind-agent').value });
    say('bind-result', r.ok ? `commander set${r.baseline_taken ? ' (baseline taken: nothing already in that chat will run)' : ' (open the commander tab, then scan once to take the baseline)'}` : errText(r)); refresh();
  });
  el('grant-go')?.addEventListener('click', async () => {
    const hours = Number(el('grant-hours').value) || 1;
    const r = await act('aion/bus-grant', { grant: { grant_id: el('grant-id').value.trim(), ref: el('grant-ref').value.trim(),
      agents: el('grant-agents').value.split(',').map((x) => x.trim()).filter(Boolean), ops: ['send', 'status'],
      max_count: Number(el('grant-max').value) || 1, rate_per_hour: 10, expires_utc: new Date(Date.now() + hours * 3600e3).toISOString() } });
    say('grant-result', errText(r)); refresh();
  });
  el('watch-toggle')?.addEventListener('change', async (e) => { say('watch-state', errText(await act('aion/bus-config', { config: { watch: e.target.checked } }))); refresh(); });
  const sync = (action) => async () => {
    const r = await (action === 'start' ? act('aion/bus-sync0', { action }) : send({ type: 'aion/bus-sync0', action }));
    const p = r?.probe;
    say('sync-state', !r?.ok ? errText(r) : `status ${p.status}; samples ${p.samples.length}; first change ${p.first_change_utc ?? 'none'}${p.verdict ? `; verdict ${p.verdict}` : ''}`);
  };
  for (const a of ['start', 'sample', 'reload', 'finish']) el(`sync-${a}`)?.addEventListener('click', sync(a));
}

if (typeof document !== 'undefined' && typeof chrome !== 'undefined') { wire(); refresh(); }
