// One-time explicit owner command for granting the OpenCode executor.
export function parseEngineSetup(argv){
 if(!Array.isArray(argv)||argv[0]!=='connect'||!['opencode','acp'].includes(argv[1]))throw new Error('usage: aion connect opencode|acp --cwd PATH [--max 10] [--hours 24]');
 let cwd=null,max=10,hours=24;
 const seen=new Set;
 for(let i=2;i<argv.length;i+=2){
   const flag=argv[i], value=argv[i+1];
   if(!['--cwd','--max','--hours'].includes(flag)||typeof value!=='string'||!value.length||seen.has(flag))throw new Error('invalid connect options');
   seen.add(flag);
   if(flag==='--cwd')cwd=value;
   if(flag==='--max'){if(!/^[0-9]{1,3}$/.test(value))throw new Error('invalid max count');max=Number(value);}
   if(flag==='--hours'){if(!/^[0-9]{1,3}$/.test(value))throw new Error('invalid duration');hours=Number(value);}
 }
 if(!cwd||max<1||max>100||hours<1||hours>168)throw new Error('cwd, grant max and hours must be bounded');
 return {engine:argv[1],cwd,max,hours};
}
// Explicit owner command binding a ChatGPT role conversation and granting sends to it.
export function parseRoleConnect(argv){
 const usage='usage: aion connect <role> --conversation https://chatgpt.com/c/<id> [--max 10] [--hours 24]';
 if(!Array.isArray(argv)||argv[0]!=='connect'||typeof argv[1]!=='string'||!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(argv[1])
    ||['opencode','acp'].includes(argv[1]))throw new Error(usage);
 let conversation=null,max=10,hours=24;const seen=new Set;
 for(let i=2;i<argv.length;i+=2){
   const flag=argv[i],value=argv[i+1];
   if(!['--conversation','--max','--hours'].includes(flag)||typeof value!=='string'||!value.length||seen.has(flag))throw new Error(usage);
   seen.add(flag);
   if(flag==='--conversation')conversation=value;
   if(flag==='--max'){if(!/^[0-9]{1,3}$/.test(value))throw new Error('invalid max count');max=Number(value);}
   if(flag==='--hours'){if(!/^[0-9]{1,3}$/.test(value))throw new Error('invalid duration');hours=Number(value);}
 }
 if(!conversation||max<1||max>100||hours<1||hours>168)throw new Error(usage);
 return {alias:argv[1],conversation,max,hours};
}
