// AION Track B: zero-dependency local validation engine. No GitHub Actions.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const VELOCITY = resolve(HERE, '..');
const RELAY = resolve(VELOCITY, '..');
export const DEFAULT_SUITES = Object.freeze([
  { name:'velocity', cwd:VELOCITY, argv:['--test'] },
  { name:'bus', cwd:resolve(RELAY,'bus'), argv:['--test'] },
  { name:'extension', cwd:resolve(RELAY,'extension'), argv:['--test'] },
  { name:'bridge', cwd:resolve(RELAY,'bridge'), argv:['--test'] }
]);
export function runLocalSelftest({ suites=DEFAULT_SUITES, executor=spawnSync, node=process.execPath, print=()=>{} }={}){
  const started=Date.now();
  const results=[];
  for(const suite of suites){
    if(!suite || !Array.isArray(suite.argv) || suite.argv.some(a=>typeof a!=='string') ||
       typeof suite.cwd!=='string' || typeof suite.name!=='string') throw new TypeError('invalid test suite');
    const begun=Date.now();
    // Existing suites are first-party Node tests, not shell strings or network jobs.
    let r;
    try {r=executor(node,suite.argv,{cwd:suite.cwd,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024,shell:false,env:{...process.env, AION_OFFLINE_TEST:'1'}});}
    catch(error){r={status:null,error,stdout:'',stderr:''};}
    const item={suite:suite.name,state:r.status===0&&!r.error?'PASS':'FAIL',exit_code:r.status??null,
      elapsed_ms:Date.now()-begun,error_code:r.error?.code??null};
    results.push(item);print(item);
  }
  return {schema:'aion.selftest/1',execution:'LOCAL_NODE_ONLY',node:process.version,
    all_pass:results.length>0 && results.every(r=>r.state==='PASS'),elapsed_ms:Date.now()-started,
    suites:results,tests_executed:true};
}
