// AION Track B — the LOCAL command parser.
//
// THIS FILE IS DELIBERATELY MINIMAL. It parses the watch-only chat command
// and nothing else: the native send options of the older candidate CLI are
// NOT imported here, so `aion chat <role>` can never reach a send path from
// this parser. There is no Send implementation in this branch.
export const USAGE=[
  'aion chat <role> --watch   observe ONE bound conversation, read-only (no Send)',
  "aion account register <role>   register this lane's account (explicit, one shot)",
  'aion help                  this text',
].join('\n');

export const COMMAND_CODES=Object.freeze({
  BAD_COMMAND:'BAD_COMMAND',
  WATCH_ONLY:'WATCH_ONLY',
});

/**
 * Parse the CLI arguments.
 *
 *   {ok:true, command:'help'}
 *   {ok:true, command:'chat', role, watch:true, stateFile}
 *   {ok:true, command:'account', action:'register', role, stateFile}
 *   {ok:false, code, reason?, usage}
 */
export function parseCommand(argv=[]){
  const args=(Array.isArray(argv)?argv:[]).map(a=>String(a));
  if(args.length===0)return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  const head=args[0];
  if(head==='help'||head==='--help'||head==='-h')return {ok:true,command:'help'};
  if(head==='account')return parseAccount(args);
  if(head!=='chat')return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  const role=args[1];
  if(!role||role.startsWith('-'))
    return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  let watch=false;
  let stateFile=null;
  for(let i=2;i<args.length;i+=1){
    const arg=args[i];
    if(arg==='--watch'){
      if(watch)return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
      watch=true;
      continue;
    }
    if(arg==='--bus-state'){
      const value=args[i+1];
      if(!value||value.startsWith('-'))
        return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
      stateFile=value;
      i+=1;
      continue;
    }
    return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  }
  if(!watch)
    return {
      ok:false,
      code:COMMAND_CODES.WATCH_ONLY,
      reason:'watch-only: use `aion chat <role> --watch` (Send is not implemented)',
      usage:USAGE,
    };
  return {ok:true,command:'chat',role,watch:true,stateFile};
}

/**
 * `aion account register <role>` - the ONLY registration command.
 *
 * There is no automatic registration, no `--auto` flag and no second action:
 * the owner names the role, the role's EXISTING bound conversation is read
 * from the local Bus metadata, and the account of that conversation is
 * registered once, explicitly.
 */
function parseAccount(args){
  const action=args[1];
  if(action!=='register')return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  const role=args[2];
  if(!role||role.startsWith('-'))
    return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  let stateFile=null;
  for(let i=3;i<args.length;i+=1){
    const arg=args[i];
    if(arg==='--bus-state'){
      const value=args[i+1];
      if(!value||value.startsWith('-'))
        return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
      stateFile=value;
      i+=1;
      continue;
    }
    return {ok:false,code:COMMAND_CODES.BAD_COMMAND,usage:USAGE};
  }
  return {ok:true,command:'account',action:'register',role,stateFile};
}
