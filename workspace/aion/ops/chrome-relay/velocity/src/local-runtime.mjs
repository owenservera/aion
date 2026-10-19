// Self-contained Track B local process: reuses the EXISTING Node Bus runner
// and OpenCode V2 adapter. No daemon, GitHub Actions, cloud endpoint or second queue.
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openBus} from '../../bus/bin/aion-bus.mjs';
import {discoverOpenCodeService} from '../../bus/opencode-service.js';
import {createOpenCodeHttpClient,createOpenCodeV2Adapter} from '../../extension/src/bus/adapters/opencode-v2.js';
import {createOpenCodeConnector} from './engines/connection.mjs';
import {probeAcpBinary} from './engines/acp.mjs';
import {assertPrivateStateDir} from './security.mjs';
import {createCommandPlane} from './broker/core.mjs';
import {createEventStream} from './broker/events.mjs';
import {selectGrant} from '../../extension/src/bus/grants.js';

export function localStatePath(env=process.env) {
  const home=env.LOCALAPPDATA||join(env.USERPROFILE||env.HOME||homedir(),'.aion');
  return resolve(env.AION_DEV_STATE||join(home,'AION','track-b','bus.json'));
}
export function connector() {
  return createOpenCodeConnector({discover:discoverOpenCodeService,
    createClient:createOpenCodeHttpClient,createAdapter:createOpenCodeV2Adapter});
}
export async function engineProbe({stateFile=process.env.AION_OPENCODE_STATE}={}){
  return connector().connect({stateFile:stateFile??null});
}
const root=fileURLToPath(new URL('../../role-launcher/ROLES.json',import.meta.url));
export function readRoleCatalog(){return JSON.parse(readFileSync(root,'utf8'));}

export async function openLocal({withEngine=false,engineChoice=null,stateFile=localStatePath(),
  serviceState=process.env.AION_OPENCODE_STATE}={}){
  const state=resolve(stateFile);
  // No implicit use of the stable ~/.aion/bus/state.json or Chrome journal.
  if(state===resolve(join(homedir(),'.aion','bus','state.json')))
    throw Object.assign(new Error('stable Bus state is forbidden'),{code:'STABLE_STATE_FORBIDDEN'});
  assertPrivateStateDir(state);
  // One validated read chooses the existing owner-bound engine. No invisible
  // ACP/V2 fallback: the Bus binding selects the transport deterministically.
  let selected=engineChoice;
  if(withEngine&&!selected){
    const inspect=await openBus({state});
    try{
      const s=await inspect.bus.store.read();
      selected=s.agents?.opencode?.binding?.adapter??'opencode-v2';
    }finally{await inspect.close();}
  }
  if(selected&&!['acp','opencode-v2'].includes(selected))
    throw Object.assign(new Error('Unsupported local engine binding'),{code:'ENGINE_UNSUPPORTED'});
  const info=!withEngine?null:(selected==='acp'
    ? probeAcpBinary():await engineProbe({stateFile:serviceState}));
  const args={state};
  if(info?.ok&&selected==='acp')args.live=true;
  if(info?.ok&&selected==='opencode-v2'){
    args['opencode-url']='auto';
    if(serviceState)args['opencode-state']=serviceState;
  }
  const opened=await openBus(args);
  const roleCatalog=readRoleCatalog();
  const events=createEventStream();
  const capabilities={
    async refresh(){
      const s=await opened.bus.store.read();
      const agent=s.agents?.opencode;
      const grant=selectGrant(s,'opencode','send',new Date().toISOString());
      const ready=info?.ok && agent?.status==='bound'
        && agent.binding?.adapter===selected&&grant.ok;
      return ready;
    },
    list(){return info?.ok?[{engine:selected,state:info.status,endpoint:info.endpoint}]:[];}
  };
  let ready=await capabilities.refresh();
  const plane=createCommandPlane({bus:opened.bus,roleCatalog,
    capabilities:{get:()=>({actions:{submit:ready?'READY':'UNKNOWN'}}),list:capabilities.list},
    events});
  return {bus:opened.bus,plane,engine:info,events,statePath:state,
    async refresh(){ready=await capabilities.refresh();return ready;},close:opened.close};
}
