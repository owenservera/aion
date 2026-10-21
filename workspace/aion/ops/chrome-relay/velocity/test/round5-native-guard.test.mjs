import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDevNativeOrigin,createDevNativeManifest} from '../src/native-host/guard.mjs';
import {PINNED_EXTENSION_ID} from '../../bridge/bin/aion-relay-host.mjs';
const dev='a'.repeat(32);
test('dev origin verified only by exact Chrome argv identity',()=>{
 assert.equal(verifyDevNativeOrigin(['chrome-extension://'+dev+'/'],{expectedExtensionId:dev}).ok,true);
 assert.equal(verifyDevNativeOrigin([],{expectedExtensionId:dev}).ok,false);
 assert.equal(verifyDevNativeOrigin(['chrome-extension://'+('b'.repeat(32))+'/'],
   {expectedExtensionId:dev}).reason,'EXTENSION_ID_MISMATCH');
});
test('stable extension ID forbidden; host manifest stays B-only',()=>{
 assert.throws(()=>createDevNativeManifest({expectedExtensionId:PINNED_EXTENSION_ID,
   hostExecutablePath:'C:/aion/dev-host.exe'}),/stable/);
 const out=createDevNativeManifest({expectedExtensionId:dev,
   hostExecutablePath:'C:/aion/dev-host.exe'});
 assert.equal(out.name,'com.aion.relay.dev');
 assert.deepEqual(out.allowed_origins,['chrome-extension://'+dev+'/']);
});
