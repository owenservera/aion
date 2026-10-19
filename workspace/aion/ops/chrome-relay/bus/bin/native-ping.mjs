#!/usr/bin/env node
// Read-only native host PING, exactly as Chrome would do it: launch the
// REGISTERED launcher with the pinned extension origin as argv, write one
// framed `relay.ping`, read one framed reply, exit. `relay.ping` reports host
// identity only; it does not start the ACP agent or create a session.
//
//   node native-ping.mjs <launcher-path> [--timeout-ms 8000]
// Prints one JSON line: { result: PASS|FAIL, host, agent_status, session_created, error }
import { spawn } from 'node:child_process';
import { encodeNativeFrame, createNativeFrameDecoder } from '../../bridge/src/framing.js';

const PINNED = 'kgjfielmhcdlggjppmliabpiljnonhki';

export function pingLauncher(launcher, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    const origin = `chrome-extension://${PINNED}/`;
    const isScript = /\.(cmd|bat)$/i.test(launcher);
    const child = isScript
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${launcher}" ${origin}`], { windowsVerbatimArguments: true, stdio: ['pipe', 'pipe', 'ignore'] })
      : spawn(launcher, [origin], { stdio: ['pipe', 'pipe', 'ignore'] });
    let done = false;
    const finish = (value) => { if (done) return; done = true; clearTimeout(timer); try { child.kill(); } catch { /* gone */ } resolve(value); };
    const timer = setTimeout(() => finish({ result: 'FAIL', error: `no reply within ${timeoutMs}ms` }), timeoutMs);
    const decoder = createNativeFrameDecoder({ onMessage: (m) => {
      if (m?.id !== 'ping-1') return;
      if (m.type === 'relay.reply' && m.ok === true) finish({ result: 'PASS', host: m.host?.name ?? null, protocol: m.host?.protocol_version ?? null, agent_status: m.agent?.status ?? null, session_created: m.session?.created ?? null });
      else finish({ result: 'FAIL', error: `${m.code ?? 'error'}: ${String(m.message ?? '').slice(0, 160)}` });
    } });
    child.stdout.on('data', (b) => decoder.push(b));
    child.on('error', (e) => finish({ result: 'FAIL', error: `launch failed: ${e.message}` }));
    child.on('exit', (code) => finish({ result: 'FAIL', error: `host exited ${code} before replying` }));
    child.stdin.write(encodeNativeFrame({ type: 'relay.ping', id: 'ping-1' }));
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  const launcher = process.argv[2];
  const t = process.argv.indexOf('--timeout-ms');
  if (!launcher) { process.stdout.write(`${JSON.stringify({ result: 'FAIL', error: 'usage: native-ping.mjs <launcher-path>' })}\n`); process.exit(2); }
  pingLauncher(launcher, { timeoutMs: t > 0 ? Number(process.argv[t + 1]) : 8000 }).then((r) => {
    process.stdout.write(`${JSON.stringify(r)}\n`);
    process.exitCode = r.result === 'PASS' ? 0 : 1;
  });
}
