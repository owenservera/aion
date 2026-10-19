// Track B native-host origin guard. Reuses stable Chrome-origin parsing but
// REQUIRES a different, separately pinned dev extension ID.
import {extractExtensionId,PINNED_EXTENSION_ID} from '../../../bridge/bin/aion-relay-host.mjs';
const EXT_ID=/^[a-p]{32}$/;
export const DEV_HOST_NAME='com.aion.relay.dev';
export function validateDevIdentity(expectedExtensionId){
 if(typeof expectedExtensionId!=='string'||!EXT_ID.test(expectedExtensionId))
   throw new TypeError('dev extension ID must be pinned');
 if(expectedExtensionId===PINNED_EXTENSION_ID)
   throw new Error('Track A stable extension ID cannot be used for Track B');
 return expectedExtensionId;
}
export function verifyDevNativeOrigin(argv,{expectedExtensionId}={}){
 validateDevIdentity(expectedExtensionId);
 if(!Array.isArray(argv))return {ok:false,reason:'MISSING_CHROME_ORIGIN'};
 const observed=extractExtensionId(argv);
 if(!observed)return {ok:false,reason:'MISSING_CHROME_ORIGIN'};
 if(observed!==expectedExtensionId)return {ok:false,reason:'EXTENSION_ID_MISMATCH'};
 return {ok:true,extension_id:expectedExtensionId,host:DEV_HOST_NAME,channel:'dev'};
}
export function createDevNativeManifest({expectedExtensionId,hostExecutablePath}={}){
 validateDevIdentity(expectedExtensionId);
 if(typeof hostExecutablePath!=='string'||!hostExecutablePath.trim()
    || !/^(?:[A-Za-z]:[\\/]|\/)/.test(hostExecutablePath))
   throw new TypeError('absolute native host executable path required');
 return {name:DEV_HOST_NAME,description:'AION Track B isolated development native host',
   path:hostExecutablePath,type:'stdio',
   allowed_origins:[`chrome-extension://${expectedExtensionId}/`]};
}
