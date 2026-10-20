// Local OpenCode V2 engine: existing AION adapter supplies all protocol actions.
// This module only establishes live/read-only connectivity and never starts
// engines, sends prompts, creates grants, or prints discovered credentials.
const LOOPBACK=/^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d{1,5})?$/;
/**
 * A failed health check must carry a MEANINGFUL reason. An aborted fetch
 * rejects with a DOMException whose legacy code is the number 20; that
 * number is meaningless to an operator, so a timeout gets its own code.
 */
export function engineFailureReason(error,fallback){
  if(error?.name==='AbortError')return 'HEALTH_CHECK_TIMEOUT';
  if(typeof error?.code==='string'&&error.code)return error.code;
  return fallback;
}
export function createOpenCodeConnector({discover,createClient,createAdapter,now=()=>Date.now()}={}) {
 if(![discover,createClient,createAdapter].every(fn=>typeof fn==='function'))throw new TypeError('engine dependencies required');
 return Object.freeze({
  async connect({stateFile=null,url=null,headers={}}={}){
   let address,credentials;
   try {
    if(url!==null){
     if(typeof url!=='string'||!LOOPBACK.test(url))throw Object.assign(new Error('not loopback'),{code:'REMOTE_ENDPOINT_FORBIDDEN'});
     address=url;credentials=headers;
    }else{
     const details=discover({stateFile:stateFile??undefined});
     if(!details||typeof details.url!=='string'||!LOOPBACK.test(details.url))throw Object.assign(new Error('invalid discovery'),{code:'REMOTE_ENDPOINT_FORBIDDEN'});
     address=details.url;credentials=details.headers??{};
    }
   }catch(error){
    return {ok:false,status:'UNAVAILABLE',reason:engineFailureReason(error,'DISCOVERY_FAILED'),adapter:null,observed_utc:new Date(now()).toISOString()};
   }
   try{
    const client=createClient({baseUrl:address,headers:credentials,timeoutMs:3000});
    const info=await client.info();
    if(!info||typeof info!=='object')throw Object.assign(new Error('unverified response'),{code:'BAD_HEALTH_RESPONSE'});
    return {ok:true,status:'CONNECTED',reason:null,endpoint:address,observed_utc:new Date(now()).toISOString(),
      adapter:createAdapter({client,liveVerified:false}),health_verified:true};
   }catch(error){
    return {ok:false,status:'UNAVAILABLE',endpoint:address,reason:engineFailureReason(error,'HEALTH_CHECK_FAILED'),adapter:null,
      observed_utc:new Date(now()).toISOString()};
   }
  }
 });
}
