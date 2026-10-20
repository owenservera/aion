// Parse one operator command. No grant creation, routing, tab selection or I/O.
// Send waits for a result by DEFAULT; --detach returns the durable admission.
const ALIAS = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const OPERATIONS = new Set(['doctor', 'status', 'capabilities', 'send', 'observe', 'stop', 'resume', 'dispose']);
const DEFAULT_WAIT_MS = 120_000;
import {normalizeSendOptions} from '../../extension/src/bus/adapters/opencode-v2.js';
export function parseCommand(argv) {
  if (!Array.isArray(argv) || argv.some(a => typeof a !== 'string'))
    throw new TypeError('argv must be strings');
  const args = [];
  let json = false, detach = false, follow = false, waitMs = null, context = null;
  let project = null, pmRoot = null;
  let saw = null;
  const native = {};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(['--agent','--model','--variant','--file','--session','--parent'].includes(arg)){
      const key=arg.slice(2),value=argv[++i];
      if(!value||value.startsWith('--'))throw new Error(arg+' requires a value');
      if(key==='file')(native.files??=[]).push(value);
      else {if(Object.hasOwn(native,key))throw new Error('duplicate '+arg);native[key]=value;}
    }else if(arg==='--project'||arg==='--pm-root'){
      const value=argv[++i];
      if(!value||value.startsWith('--'))throw new Error(arg+' requires a value');
      if(arg==='--project'){
        if(project!==null)throw new Error('duplicate --project');
        if(!ALIAS.test(value))throw new Error('invalid --project ID');
        project=value;
      }else{
        if(pmRoot!==null)throw new Error('duplicate --pm-root');
        if(!value.trim()||value.length>4096||/[\x00-\x1f]/.test(value))throw new Error('invalid --pm-root path');
        pmRoot=value;
      }
    }else if(arg==='--saw'){
      if(saw!==null)throw new Error('duplicate --saw');
      saw=argv[++i];
      if(!['delivered','not-delivered','abandoned'].includes(saw))throw new Error('--saw requires delivered|not-delivered|abandoned');
    }else if(arg==='--json'){
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
  const hasNative=Object.keys(native).length>0;
  if(hasNative&&command!=='send')throw new Error('native options apply to send only');
  const sendOptions=hasNative?normalizeSendOptions(native):null;
  if(project!==null||pmRoot!==null){
    if(command!=='send'||context===null)throw new Error('project options require send with explicit --context');
    if(context!=='brief')throw new Error('project options require --context brief');
    if(pmRoot!==null&&project===null)throw new Error('--pm-root requires --project');
    if(rest[0]==='opencode'||hasNative)throw new Error('project context requires a conversational send, not native executor egress');
  }
  if(context!==null&&command!=='send')throw new Error('--context applies to send only');
  if(saw!==null&&command!=='dispose')throw new Error('--saw applies to dispose only');
  if(detach&&command!=='send')throw new Error('--detach applies to send only');
  if(follow&&command!=='observe')throw new Error('--follow applies to observe only');
  if(waitMs!==null && command!=='send' && !(command==='observe'&&follow))
    throw new Error('--wait-ms requires send or observe --follow');
  if (['doctor','status','capabilities','stop','resume'].includes(command)) {
    if (rest.length) throw new Error('unexpected arguments');
    return { command, json };
  }
  if (command === 'observe' || command === 'dispose') {
    if (rest.length !== 1 || !/^[A-Za-z0-9_-]{6,128}$/.test(rest[0]))
      throw new Error('invalid operation id');
    if(command==='dispose'){
      if(saw===null)throw new Error('dispose requires explicit --saw delivered|not-delivered|abandoned');
      return {command,operation_id:rest[0],json,disposition:{delivered:'owner_saw_delivered','not-delivered':'owner_saw_not_delivered',abandoned:'owner_abandoned'}[saw]};
    }
    return { command, operation_id: rest[0], json, ...(follow?{follow:true}:{}),
      ...(waitMs!==null?{wait_ms:waitMs}: {}) };
  }
  if (rest.length < 2 || !ALIAS.test(rest[0]))
    throw new Error('send requires a valid alias and text');
  const text = rest.slice(1).join(' ');
  if (!text.trim() || text.length > 2_000) throw new Error('send text out of bounds');
  return { command, alias: rest[0], text, json,
    ...(detach?{detach:true}:{}), ...(waitMs!==null?{wait_ms:waitMs}:{}),
    ...(context!==null?{context}: {}), ...(project!==null?{project}:{}), ...(pmRoot!==null?{pm_root:pmRoot}:{}),
    ...(sendOptions?{send_options:sendOptions}:{}) };
}
export { DEFAULT_WAIT_MS };
