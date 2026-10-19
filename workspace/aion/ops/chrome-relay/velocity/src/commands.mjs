// Parse one operator command. No grant creation, routing, tab selection or I/O.
// Send waits for a result by DEFAULT; --detach returns the durable admission.
const ALIAS = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const OPERATIONS = new Set(['doctor', 'status', 'capabilities', 'send', 'observe', 'stop', 'resume']);
const DEFAULT_WAIT_MS = 120_000;
export function parseCommand(argv) {
  if (!Array.isArray(argv) || argv.some(a => typeof a !== 'string'))
    throw new TypeError('argv must be strings');
  const args = [];
  let json = false, detach = false, follow = false, waitMs = null, context = null;
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--json'){
      if(json)throw new Error('duplicate --json');
      json=true;
    }else if(arg==='--detach'){
      if(detach)throw new Error('duplicate --detach');
      detach=true;
    }else if(arg==='--follow'){
      if(follow)throw new Error('duplicate --follow');
      follow=true;
    }else if(arg==='--context'){
      if(context!==null)throw new Error('duplicate --context');
      const value=argv[++i];
      if(!['bootstrap','sitrep','both','brief'].includes(value))throw new Error('invalid --context scope');
      context=value;
    }else if(arg==='--wait-ms'){
      if(waitMs!==null)throw new Error('duplicate --wait-ms');
      const raw=argv[++i];
      if(!/^[0-9]{1,6}$/.test(raw??''))throw new Error('--wait-ms requires milliseconds');
      waitMs=Number(raw);
      if(waitMs<1000||waitMs>600000)throw new Error('--wait-ms outside 1000..600000');
    }else if(arg.startsWith('--')){
      throw new Error('unsupported option: '+arg);
    }else args.push(arg);
  }
  const [command = 'status', ...rest] = args;
  if (!OPERATIONS.has(command)) throw new Error('unknown command');
  if(context!==null&&command!=='send')throw new Error('--context applies to send only');
  if(detach&&command!=='send')throw new Error('--detach applies to send only');
  if(follow&&command!=='observe')throw new Error('--follow applies to observe only');
  if(waitMs!==null && command!=='send' && !(command==='observe'&&follow))
    throw new Error('--wait-ms requires send or observe --follow');
  if (['doctor','status','capabilities','stop','resume'].includes(command)) {
    if (rest.length) throw new Error('unexpected arguments');
    return { command, json };
  }
  if (command === 'observe') {
    if (rest.length !== 1 || !/^[A-Za-z0-9_-]{6,128}$/.test(rest[0]))
      throw new Error('invalid operation id');
    return { command, operation_id: rest[0], json, ...(follow?{follow:true}:{}),
      ...(waitMs!==null?{wait_ms:waitMs}: {}) };
  }
  if (rest.length < 2 || !ALIAS.test(rest[0]))
    throw new Error('send requires a valid alias and text');
  const text = rest.slice(1).join(' ');
  if (!text.trim() || text.length > 2_000) throw new Error('send text out of bounds');
  return { command, alias: rest[0], text, json,
    ...(detach?{detach:true}:{}), ...(waitMs!==null?{wait_ms:waitMs}:{}),
    ...(context!==null?{context}: {}) };
}
export { DEFAULT_WAIT_MS };
