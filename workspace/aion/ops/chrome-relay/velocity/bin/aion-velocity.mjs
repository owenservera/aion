#!/usr/bin/env node
// Read-only/offline-safe Track B prototype client. NOT the final 'aion' CLI.
import { parseCommand } from '../src/commands.mjs';
import { projectReadiness } from '../src/readiness.mjs';

export function run(argv, write = line => process.stdout.write(line + '\n')) {
  let input;
  try { input = parseCommand(argv); }
  catch (error) {
    write(JSON.stringify({ ok: false, code: 'BAD_COMMAND', detail: error.message }));
    return 2;
  }
  if (input.command === 'doctor' || input.command === 'status' || input.command === 'capabilities') {
    const result = {
      ok: true, schema: 'aion.velocity.bootstrap/1', channel: 'dev',
      local_runtime: 'NOT_CONNECTED', browser_runtime: 'NOT_CONNECTED',
      adapter_readiness: projectReadiness(null), live_verified: false,
      execution_enabled: false, message: 'Track B source staging only; no Windows or Chrome inspection performed'
    };
    write(JSON.stringify(result, null, input.json ? 0 : 2));
    return 0;
  }
  write(JSON.stringify({
    ok: false, command: input.command, code: 'RUNTIME_NOT_CONNECTED',
    delivery: 'NOT_SENT', operation_id: null, execution_enabled: false,
    message: 'Offline Track B scaffold refuses live actions; no attempt was made'
  }));
  return 3;
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1].replaceAll('\\', '/')).href) {
  process.exitCode = run(process.argv.slice(2));
}
