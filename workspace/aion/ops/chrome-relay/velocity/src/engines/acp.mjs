// Read-only ACP executable probe; reuses the existing AION bridge config.
// Does not start an agent, register a native host, or modify a browser.
import {statSync} from 'node:fs';
import {loadHostConfig} from '../../../bridge/bin/aion-relay-host.mjs';
import {assertValidConfig,assertCwdAllowed} from '../../../bridge/src/config.js';

export function createAcpProbe({loadConfig,validateConfig,stat=statSync,now=()=>Date.now()}={}){
 if(typeof loadConfig!=='function'||typeof validateConfig!=='function')throw new TypeError('ACP config callbacks required');
 return ()=>{
  try{
   const config=loadConfig();validateConfig(config);
   if(typeof config.agentPath!=='string')throw Object.assign(new Error('no binary'),{code:'AGENT_PATH_MISSING'});
   const info=stat(config.agentPath);
   if(!info.isFile())throw Object.assign(new Error('agent not a file'),{code:'AGENT_PATH_MISSING'});
   return {ok:true,engine:'acp',status:'BINARY_PRESENT',
     endpoint:'in-process-acp',observed_utc:new Date(now()).toISOString(),
     live_verified:false};
  }catch(error){
   return {ok:false,engine:'acp',status:'UNAVAILABLE',reason:error.code??'ACP_BINARY_UNAVAILABLE',
     observed_utc:new Date(now()).toISOString(),live_verified:false};
  }
 };
}
export const probeAcpBinary=createAcpProbe({loadConfig:loadHostConfig,validateConfig:assertValidConfig});

export function verifyAcpCwd(cwd,{loadConfig=loadHostConfig,allow=assertCwdAllowed}={}){
 try{
  const result=allow(loadConfig(),cwd);
  return {ok:result?.allowed===true,code:result?.allowed===true?null:'ACP_CWD_NOT_ALLOWLISTED'};
 }catch{return {ok:false,code:'ACP_CWD_UNVERIFIED'};}
}
