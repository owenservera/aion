// AION Bus — offline end-to-end demonstrations (FAKES ONLY; OFFLINE_PASS evidence).
//
//   D1  ChatGPT.com pilot shape: commander -> two ChatGPT conversation agents
//       -> correlated replies -> reports, through the REAL watcher scan, REAL
//       chatgpt-port driver and REAL no-resend task store over scripted pages.
//   D2  Bus V2: commander -> OpenCode-shaped ACP executor through the REAL
//       native host in-process and REAL ACP client, against the fake ACP agent.
//   D3  Portability: the same core with an independent fake non-ChatGPT
//       browser-chat provider as commander and agents.
// Nothing here touches Chrome, ChatGPT, OpenCode or the network.

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';

import { createBus } from '../../extension/src/bus/bus.js';
import { createChatGPTAdapter, createDriverCall } from '../../extension/src/bus/adapters/chatgpt.js';
import { createAcpExecutorAdapter } from '../../extension/src/bus/adapters/acp-executor.js';
import { createWorkerBus } from '../../extension/src/background/bus.js';
import { createExampleChat } from '../../extension/tests/fixtures/bus-example-chat.js';
import { memoryStorage } from '../../extension/tests/fixtures/bus-memory.js';
import { scriptedChatGPT } from '../../extension/tests/fixtures/bus-chatgpt-page.js';

const fence = (b) => `\`\`\`AION_CMD_V1\n${b}\n\`\`\``;
const GRANT = (agents, extra = {}) => ({ grant_id: 'g-demo', ref: 'offline demo grant', agents, ops: ['send', 'status'], max_count: 20, rate_per_hour: 20,
  expires_utc: new Date(Date.now() + 3600e3).toISOString(), ...extra });

async function d1() {
  const CMD = 'https://chatgpt.com/c/demo-commander', A = 'https://chatgpt.com/c/demo-toolsmith', B = 'https://chatgpt.com/c/demo-intake';
  const page = scriptedChatGPT({ tabs: [[7, CMD], [9, A], [10, B]] });
  const wb = createWorkerBus({ storage: memoryStorage(), call: createDriverCall(page.driver) });
  const g = { user_gesture: true };
  await wb.handle({ type: 'aion/bus-agent', action: 'bind', agent_id: 'aion', ref: CMD, confirmed_by: 'demo', ...g });
  await wb.handle({ type: 'aion/bus-agent', action: 'bind', agent_id: 'role-06', ref: A, confirmed_by: 'demo', ...g });
  await wb.handle({ type: 'aion/bus-agent', action: 'bind', agent_id: 'role-07', ref: B, confirmed_by: 'demo', ...g });
  await wb.handle({ type: 'aion/bus-commander', agent_id: 'aion', ...g });
  await wb.handle({ type: 'aion/bus-grant', grant: GRANT(['aion', 'role-06', 'role-07']), ...g });
  page.transcripts[CMD].push({ role: 'user', text: 'AION> from my phone: ask 06 and 07' },
    { role: 'assistant', text: `${fence('op: send\nto: role-06\ntext: run the offline suite\nnonce: demo-d1-a')}` });
  await wb.handle({ type: 'aion/bus-scan', ...g });
  page.transcripts[CMD].push({ role: 'user', text: 'AION> now 07' }, { role: 'assistant', text: fence('op: send\nto: role-07\ntext: list intake\nnonce: demo-d1-b') });
  await wb.handle({ type: 'aion/bus-scan', ...g });
  const s = await wb.handle({ type: 'aion/bus-status' });
  const sends = s.commands.filter((c) => c.op === 'send');
  return { ok: sends.length === 2 && sends.every((c) => c.delivery === 'CONSUMED') && page.submits(A).length === 1 && page.submits(B).length === 1 && page.submits(CMD).length === 2,
    detail: `${sends.map((c) => `${c.to}:${c.delivery}`).join(' ')}; submits A=${page.submits(A).length} B=${page.submits(B).length} reports=${page.submits(CMD).length}` };
}

async function d2() {
  const { createConfig } = await import('../../bridge/src/config.js');
  const { createInProcessRelay } = await import('../../bridge/src/bus-relay.js');
  const slash = (v) => String(v).split(String.fromCharCode(92)).join('/');
  const cwd = slash(join(tmpdir(), 'aion-bus-demo-cwd'));
  mkdirSync(cwd, { recursive: true });
  const config = createConfig({ expectedExtensionId: 'kgjfielmhcdlggjppmliabpiljnonhki', agentPath: slash(process.execPath),
    agentArgs: [slash(fileURLToPath(new URL('../../bridge/tests/fixtures/fake-acp-agent.mjs', import.meta.url)))], sessionCwd: cwd, logLevel: 'error',
    timeouts: { spawnMs: 10_000, requestMs: 10_000, initializeMs: 10_000, promptMs: 0 } });
  const relay = createInProcessRelay({ config });
  try {
    const chat = createExampleChat();
    const bus = createBus({ storage: memoryStorage(), adapters: [chat, createAcpExecutorAdapter({ relay })] });
    await bus.bind('aion', { adapter: 'example-chat', ref: 'example://room/commander', confirmed_by: 'demo' });
    await bus.bind('opencode', { adapter: 'acp', ref: 'opencode', confirmed_by: 'demo' });
    await bus.designateCommander('aion');
    await bus.grant(GRANT(['aion', 'opencode'], { cwd }));
    const r = await bus.process({ source: { adapter: 'example-chat', ref: 'example://room/commander' }, turn_sig: 'demo-d2-turn', user_head: 'AION> go',
      assistant_text: fence('op: send\nto: opencode\ntext: summarise the repo\nnonce: demo-d2-a') });
    const report = chat.rooms.get('example://room/commander')?.inbox[0] ?? '';
    return { ok: r.dispatched?.report?.state === 'REPORTED' && /echo: summarise the repo/.test(report), detail: `executor ${r.dispatched?.state}; report ${r.dispatched?.report?.state}` };
  } finally { await relay.close(); }
}

async function d3() {
  const chat = createExampleChat();
  const bus = createBus({ storage: memoryStorage(), adapters: [chat] });
  for (const [id, room] of [['aion', 'commander'], ['role-06', 'r06'], ['role-07', 'r07']]) await bus.bind(id, { adapter: 'example-chat', ref: `example://room/${room}`, confirmed_by: 'demo' });
  await bus.designateCommander('aion');
  await bus.grant(GRANT(['aion', 'role-06', 'role-07']));
  const out = [];
  for (const [to, n] of [['role-06', 'a'], ['role-07', 'b']]) {
    out.push(await bus.process({ source: { adapter: 'example-chat', ref: 'example://room/commander' }, turn_sig: `demo-d3-${n}`, user_head: 'AION> go',
      assistant_text: fence(`op: send\nto: ${to}\ntext: hello\nnonce: demo-d3-${n}`) }));
  }
  return { ok: out.every((r) => r.dispatched?.report?.state === 'REPORTED'), detail: out.map((r) => r.dispatched?.report?.state).join(' ') };
}

export async function runDemo({ json = false } = {}) {
  const rows = [];
  for (const [id, name, fn] of [['D1', 'ChatGPT.com pilot shape (scripted pages)', d1], ['D2', 'ACP executor (fake agent)', d2], ['D3', 'fake non-ChatGPT provider', d3]]) {
    try { rows.push({ id, name, ...(await fn()) }); } catch (error) { rows.push({ id, name, ok: false, detail: String(error.message ?? error) }); }
  }
  if (json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
  else for (const r of rows) process.stdout.write(`${r.ok ? 'OFFLINE_PASS' : 'FAIL        '}  ${r.id}  ${r.name}: ${r.detail}\n`);
  process.stdout.write('Fakes only. WINDOWS_PENDING, CHATGPT_LIVE_PENDING. Not evidence of a live send.\n');
  return rows.every((r) => r.ok) ? 0 : 1;
}
