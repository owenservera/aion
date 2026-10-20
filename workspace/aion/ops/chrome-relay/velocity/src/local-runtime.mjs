// Self-contained Track B local process: reuses the EXISTING Node Bus runner
// and OpenCode V2 adapter. No daemon, GitHub Actions, cloud endpoint or second queue.
import {homedir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openBus} from '../../bus/bin/aion-bus.mjs';
import {discoverOpenCodeService} from '../../bus/opencode-service.js';
import {createOpenCodeHttpClient,createOpenCodeV2Adapter} from '../../extension/src/bus/adapters/opencode-v2.js';
import {createOpenCodeConnector} from './engines/connection.mjs';
import {probeAcpBinary} from './engines/acp.mjs';
import {assertPrivateStateDirAsync} from './security.mjs';
import {createCommandPlane} from './broker/core.mjs';
import {createEventStream} from './broker/events.mjs';
import {selectGrant} from '../../extension/src/bus/grants.js';
import {connectHost} from './transport/local-ipc.mjs';
import {createRemoteChatGPTAdapter,createOfflineChatGPTAdapter} from './browser/remote-call.mjs';
import {CHATGPT_ADAPTER} from '../../extension/src/bus/adapters/chatgpt.js';
import {PING} from './native-host/relay.mjs';

/** Truthful Chrome leg probe: CONNECTED only after a worker answered a ping through the host. */
export async function browserProbe({stateDir=dirname(localStatePath()),connect=connectHost}={}){
  let link;
  try{link=await connect({stateDir});}
  catch(error){return {ok:false,state:'NOT_CONNECTED',reason:error.code??'HOST_UNREACHABLE',link:null};}
  try{
    const pong=await link.request(PING,{},{timeoutMs:3000});
    if(pong?.ok!==true||pong.pong!==true)throw Object.assign(new Error('bad pong'),{code:'WORKER_NOT_ANSWERING'});
    return {ok:true,state:'CONNECTED',extension_id:pong.extension_id??link.session.extension_id,
      ipc_auth:link.session.ipc_auth,pipe_dacl:link.session.pipe_dacl,link};
  }catch(error){link.close();return {ok:false,state:'HOST_UP_WORKER_SILENT',reason:error.code??'WORKER_NOT_ANSWERING',link:null};}
}
export const publicBrowser=b=>b?{state:b.state,reason:b.reason??null,extension_id:b.extension_id??null,
  ipc_auth:b.ipc_auth??null,pipe_dacl:b.pipe_dacl??null}:{state:'NOT_PROBED'};

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
  serviceState=process.env.AION_OPENCODE_STATE,withBrowser=false,probeBrowser=browserProbe}={}){
  const state=resolve(stateFile);
  // No implicit use of the stable ~/.aion/bus/state.json or Chrome journal.
  if(state===resolve(join(homedir(),'.aion','bus','state.json')))
    throw Object.assign(new Error('stable Bus state is forbidden'),{code:'STABLE_STATE_FORBIDDEN'});
  await assertPrivateStateDirAsync(state);
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
  // The ChatGPT adapter is always loaded so role bindings validate; it can only
  // deliver when a live host link answered a ping (otherwise it refuses, NOT_SENT).
  const browser=withBrowser?await probeBrowser({stateDir:dirname(state)}):null;
  const chat=browser?.ok?createRemoteChatGPTAdapter({link:browser.link}):createOfflineChatGPTAdapter();
  const args={state,extraAdapters:[chat]};
  if(info?.ok&&selected==='acp')args.live=true;
  if(info?.ok&&selected==='opencode-v2'){
    args['opencode-url']='auto';
    if(serviceState)args['opencode-state']=serviceState;
  }
  const opened=await openBus(args);
  const roleCatalog=readRoleCatalog();
  const events=createEventStream();
  const readyFor=(s,id)=>{
    const agent=s.agents?.[id];
    if(agent?.status!=='bound')return false;
    if(!selectGrant(s,id,'send',new Date().toISOString()).ok)return false;
    if(agent.binding?.adapter===CHATGPT_ADAPTER)return browser?.ok===true;
    return id==='opencode'&&info?.ok===true&&agent.binding?.adapter===selected;
  };
  let snapshot=null;
  const capabilities={
    async refresh(){snapshot=await opened.bus.store.read();return readyFor(snapshot,'opencode');},
    list(){return info?.ok?[{engine:selected,state:info.status,endpoint:info.endpoint}]:[];}
  };
  await capabilities.refresh();
  const plane=createCommandPlane({bus:opened.bus,roleCatalog,
    capabilities:{get:key=>({actions:{submit:snapshot&&readyFor(snapshot,String(key).replace(/^agent:/,''))?'READY':'UNKNOWN'}}),
      list:capabilities.list},events});
  return {bus:opened.bus,plane,engine:info,browser,events,statePath:state,roleCatalog,
    async refresh(){return capabilities.refresh();},
    async readyFor(id){snapshot=await opened.bus.store.read();return readyFor(snapshot,id);},
    async close(){try{browser?.link?.close();}finally{await opened.close();}}};
}
