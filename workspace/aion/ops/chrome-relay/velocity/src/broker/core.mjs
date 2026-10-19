// Thin Track B controller: the existing Bus remains the ONLY command authority.
// The controller never persists a second command queue or supplies fake grants.
import {resolveRole} from './roles.mjs';
import {selectGrant} from '../../../extension/src/bus/grants.js';
import {projectResult} from '../result.mjs';

const ACTIVE=new Set(['RESERVED','DISPATCHED','SUBMISSION_OBSERVED','UNRESOLVED']);
const response=(ok,code,more={})=>({ok,code,...more});

export function createCommandPlane({bus,roleCatalog,capabilities,events}={}) {
  if(!bus?.store?.read || !bus.ingestStructured || !bus.dispatch || !bus.readCommand)
    throw new TypeError('AION Bus instance required');
  if(!capabilities?.get || !events?.publish) throw new TypeError('projections required');

  const inFlight=new Set();
  async function inspect(id){
    const c=await bus.readCommand(id);
    if(!c) return response(false,'OPERATION_UNKNOWN');
    return response(true,'OBSERVED',{operation_id:c.command_id,result:projectResult(c)});
  }
  async function sendTo(to,text,nonce,grantRef,{expectedRevision=null}={}){
    // Preflight is read-only; the REAL Bus validates grants, locks and nonce under mutate().
    const state=await bus.store.read();
    const agent=state.agents?.[to];
    if(!agent?.binding || agent.status!=='bound')
      return response(false,'TARGET_UNBOUND',{delivery:'NOT_SENT'});
    if(expectedRevision!==null && agent.revision!==expectedRevision)
      return response(false,'BINDING_CHANGED',{delivery:'NOT_SENT'});
    const ready=capabilities.get('agent:'+to);
    if(ready.actions.submit!=='READY')
      return response(false,'CAPABILITY_NOT_READY',{delivery:'NOT_SENT',readiness:ready.actions.submit});
    const grant=selectGrant(state,to,'send',new Date().toISOString());
    if(!grant.ok || grant.grant.grant_id!==grantRef)
      return response(false,'GRANT_NOT_SELECTED',{delivery:'NOT_SENT'});
    if(Object.values(state.commands??{}).some(c=>c.to===to && ACTIVE.has(c.state)))
      return response(false,'TARGET_BUSY',{delivery:'NOT_SENT'});
    let accepted;
    try{
      accepted=await bus.ingestStructured({op:'send',to,text,nonce,
        origin_kind:'operator_cli',origin_ref:'track-b-dev'});
    }catch{
      return response(false,'ADMISSION_FAILED',{delivery:'UNKNOWN'});
    }
    if(!accepted.accepted){
      events.publish('operation.refused',{target:to,reason:accepted.reason});
      return response(false,accepted.reason??'REFUSED',{
        operation_id:accepted.command_id??null,delivery:'NOT_SENT'
      });
    }
    const id=accepted.command_id;
    events.publish('operation.admitted',{operation_id:id,target:to,state:'RESERVED'});
    // Admission returns immediately. The broker outlives this RPC and owns the
    // ONE attempt; never retry if the client disconnects or the attempt fails.
    const job=Promise.resolve().then(async()=>{
      try{
        const sent=await bus.dispatch(id);
        events.publish('operation.dispatched',{operation_id:id,target:to,
          state:sent.state??'UNRESOLVED'});
        const observed=await inspect(id);
        events.publish('operation.settled',{operation_id:id,target:to,
          state:observed.result?.bus_state??'UNKNOWN'});
      }catch{
        events.publish('operation.settled',{operation_id:id,target:to,state:'UNRESOLVED',
          reason:'dispatch_outcome_uncertain'});
      }
    });
    inFlight.add(job);
    void job.finally(()=>inFlight.delete(job));
    return response(true,'ADMITTED',{operation_id:id,state:'RESERVED'});
  }

  async function sendAlias({alias,text,nonce}){
      const state=await bus.store.read();
      const binding=resolveRole(alias,roleCatalog,state.agents);
      if(!binding.ok) return response(false,binding.reason,{delivery:'NOT_SENT'});
      const grant=selectGrant(state,binding.target,'send',new Date().toISOString());
      if(!grant.ok) return response(false,grant.reason,{delivery:'NOT_SENT'});
      return sendTo(binding.target,text,nonce,grant.grant.grant_id,{
        expectedRevision:binding.revision});
    }
  return Object.freeze({
    sendAlias,
    async waitForIdle(){await Promise.allSettled([...inFlight]);},
    async handle(method,params={}){
      switch(method){
        case 'doctor': return {schema:'aion.doctor/1',channel:'dev',
          browser_runtime:'UNVERIFIED',windows_runtime:'NOT_CONNECTED',live_verified:false};
        case 'capabilities': return {schema:'aion.capabilities/1',items:capabilities.list()};
        case 'status': {
          const s=await bus.status();
          return {schema:'aion.status/1',channel:'dev',kill:s.kill,seq:s.seq,
            agents:s.agents.map(a=>({agent_id:a.agent_id,status:a.status,adapter:a.adapter})),
            active_operations:s.commands.filter(c=>ACTIVE.has(c.state))
              .map(c=>({operation_id:c.command_id,to:c.to,state:c.state}))};
        }
        case 'observe': return inspect(params.operation_id);
        case 'send': return sendTo(params.to,params.text,params.nonce,params.grant_ref);
        case 'sendAlias': return sendAlias(params);
        case 'stop': {
          const killed=await bus.kill(params.reason);
          events.publish('runtime.stopped',{state:'HALTED'});
          return {schema:'aion.stop/1',kill:killed};
        }
        default:return response(false,'UNSUPPORTED');
      }
    }
  });
}
