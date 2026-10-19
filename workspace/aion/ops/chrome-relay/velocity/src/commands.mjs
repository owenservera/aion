// Parse user intent only. Never dispatch, reserve, grant authority or select a tab.
// Actual execution must use the existing Bus V1/V2 authority in AIOND.
const ALIAS = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const OPERATIONS = new Set(['doctor', 'status', 'capabilities', 'send', 'observe', 'stop']);
export function parseCommand(argv) {
  if (!Array.isArray(argv) || argv.some(a => typeof a !== 'string')) throw new TypeError('argv must be strings');
  const args = [...argv];
  const jsonIndex = args.indexOf('--json');
  const json = jsonIndex !== -1;
  if (json) args.splice(jsonIndex, 1);
  if (args.some(a => a.startsWith('--'))) throw new Error('unsupported option');
  const [command = 'status', ...rest] = args;
  if (!OPERATIONS.has(command)) throw new Error('unknown command');
  if (['doctor', 'status', 'capabilities', 'stop'].includes(command)) {
    if (rest.length) throw new Error('unexpected arguments');
    return { command, json };
  }
  if (command === 'observe') {
    if (rest.length !== 1 || !/^[A-Za-z0-9_-]{6,128}$/.test(rest[0])) throw new Error('invalid operation id');
    return { command, operation_id: rest[0], json };
  }
  if (rest.length < 2 || !ALIAS.test(rest[0])) throw new Error('send requires a valid alias and text');
  const text = rest.slice(1).join(' ');
  if (!text.trim() || text.length > 2_000) throw new Error('send text out of bounds');
  return { command, alias: rest[0], text, json };
}
