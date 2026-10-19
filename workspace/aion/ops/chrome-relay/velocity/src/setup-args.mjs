// One-time explicit owner command for granting the OpenCode executor.
export function parseEngineSetup(argv){
 if(!Array.isArray(argv)||argv[0]!=='connect'||argv[1]!=='opencode')throw new Error('usage: aion connect opencode --cwd PATH [--max 10] [--hours 24]');
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
 return {cwd,max,hours};
}
