// Read-only Chrome M1 readiness inspection; NEVER composes, clicks or sends.
// Designed so the owner can see the exact remaining step before a live test.
import {dirname} from 'node:path';
import {planBrowserSetup,inspectBrowserSetup} from './setup.mjs';
import {localStatePath,openLocal} from '../local-runtime.mjs';
import {resolveRole} from '../broker/roles.mjs';
import {selectGrant} from '../../../extension/src/bus/grants.js';
import {canonicalConversation} from '../../../extension/src/lib/chatgpt-tasks.js';
import {CHATGPT_ADAPTER} from '../../../extension/src/bus/adapters/chatgpt.js';

const step=(stage,code,next_action,detail={})=>({
 schema:'aion.b.browser-preflight/1',ok:false,stage,code,
 live_send_verified:false,next_action,...detail
});
export async function runBrowserPreflight({alias='chief',stateDir=dirname(localStatePath()),
  inspect=inspectBrowserSetup,open=openLocal}={}){
 const plan=planBrowserSetup({stateDir});
 const installed=inspect(plan);
 if(!installed.ok)
   return step('SETUP',installed.code,'aion setup browser --apply',
     {extension_dir:plan.extensionDir});
 let rt;
 try{rt=await open({withBrowser:true});}
 catch(error){return step('STATE',error?.code??'STATE_UNAVAILABLE','aion doctor');}
 try{
   if(rt.browser?.ok!==true)
     return step('CONNECTOR',rt.browser?.reason??'CHROME_NOT_CONNECTED',
       'Load the unpacked Track B extension in the dedicated dev profile, then run aion connections',
       {extension_id:installed.extension_id,chrome:rt.browser?.state??'NOT_CONNECTED'});
   if(rt.browser.extension_id!==installed.extension_id)
     return step('IDENTITY','DEV_EXTENSION_ID_MISMATCH',
       'Reload the Track B extension and inspect the registered development host');
   const state=await rt.bus.store.read();
   if(state.kill?.engaged)
     return step('BUS','BUS_STOPPED','aion resume');
   const role=resolveRole(alias,rt.roleCatalog,state.agents);
   if(!role.ok)return step('BINDING',role.reason,
     'aion connect '+alias+' --conversation https://chatgpt.com/c/<conversation-id>');
   if(role.adapter!==CHATGPT_ADAPTER)
     return step('BINDING','ROLE_NOT_CHATGPT','Reconnect the intended ChatGPT conversation explicitly');
   const grant=selectGrant(state,role.target,'send',new Date().toISOString());
   if(!grant.ok)return step('GRANT',grant.reason,
     'aion connect '+alias+' --conversation '+role.ref+' --max 1 --hours 1');
   let tabs;
   try{tabs=await rt.browser.link.request('aion/chatgpt-tabs',{}, {timeoutMs:10000});}
   catch(error){return step('TABS',error.code??'TAB_PROBE_UNAVAILABLE',
     'Check the Track B dev extension service worker and retry preflight');}
   if(tabs?.ok!==true||!Array.isArray(tabs.tabs))
     return step('TABS','TAB_LISTING_FAILED','Open the target chat in the Track B Chrome profile');
   const matching=tabs.tabs.filter(tab=>{
     try{return canonicalConversation(tab.url)===canonicalConversation(role.ref);}
     catch{return false;}
   });
   if(matching.length!==1)
     return step('TABS',matching.length?'TARGET_TAB_AMBIGUOUS':'TARGET_TAB_NOT_OPEN',
       'Keep exactly one tab open on the bound conversation in the Track B dev profile',
       {matching_tabs:matching.length});
   const active=Object.values(state.commands??{}).filter(c=>c.to===role.target
     &&['RESERVED','DISPATCHED','SUBMISSION_OBSERVED','UNRESOLVED'].includes(c.state));
   if(active.length)return step('OPERATION','TARGET_BUSY',
     'Observe the existing operation before attempting a new send',
     {active_operation_ids:active.map(c=>c.command_id)});
   return {schema:'aion.b.browser-preflight/1',ok:true,code:'READY_FOR_OWNER_LIVE_TEST',
     stage:'PRELIVE',target:role.target,extension_id:installed.extension_id,
     matching_tabs:1,grant_id:grant.grant.grant_id,
     send_actuation:'NOT_YET_LIVE_VERIFIED',live_send_verified:false,
     next_action:'aion send '+alias+' "Reply with OK"'};
 }finally{await rt.close();}
}
