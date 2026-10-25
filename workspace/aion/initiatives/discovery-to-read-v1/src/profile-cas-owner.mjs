// Optional serialized publisher for the EXISTING Capture Studio VersionedStore.
// This does not create another registry. It is safe only when ALL processes
// writing a given profile name use the same filesystem lock protocol.
// Fail-closed locks after process crashes require operator reconciliation;
// do NOT infer that an old lock permits automatic destructive takeover.
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdirSync, openSync, closeSync, writeSync, fsyncSync,
  renameSync, rmSync } from 'node:fs';

export const CAS_OWNER_SCHEMA = 'aion.discovery.profile-cas-owner/1';
const N=/^[a-z0-9][a-z0-9._-]{0,63}$/i;
function fail(code){const e=new Error(code);e.code=code;throw e;}
function version(v){return v===null || Number.isSafeInteger(v)&&v>0;}
function fsyncFile(filename){
  let fd;
  try {fd=openSync(filename,'r');fsyncSync(fd);}
  finally{if(fd!==undefined)closeSync(fd);}
}
export function createProfileCasOwner({store}={}) {
  if(!store || typeof store.dir!=='string' || ![
    store.current,store.load,store.save,store.versions].every(fn=>typeof fn==='function'))
    fail('EXISTING_VERSIONED_STORE_REQUIRED');
  const owner=(name,fn)=>{
    if(typeof name!=='string'||!N.test(name))fail('INVALID_PROFILE_NAME');
    const dir=path.join(store.dir,name);
    mkdirSync(dir,{recursive:true});
    const lock=path.join(dir,'.aion-profile-owner.lock');
    let fd;
    try{fd=openSync(lock,'wx',0o600);}
    catch(e){if(e?.code==='EEXIST')fail('PROFILE_OWNER_BUSY');throw e;}
    try{
      writeSync(fd,JSON.stringify({schema:CAS_OWNER_SCHEMA,pid:process.pid,
        name,createdAt:new Date().toISOString()}));
      fsyncSync(fd);
      return fn(dir);
    }finally{
      closeSync(fd);
      // This removes only a lock acquired by this call. Stale locks that
      // survive process death are NEVER auto-stolen.
      rmSync(lock,{force:true});
    }
  };
  const currentOrNull=name=>store.current(name)??null;
  const assertVersion=(actual,expected)=>{
    if(!version(expected))fail('INVALID_EXPECTED_VERSION');
    if(actual!==expected)fail('STALE_PROFILE_VERSION');
  };
  function proposeSave(name,readOnlyPayload,expectedVersion,note='learned read-only proposal'){
    if(!readOnlyPayload || typeof readOnlyPayload!=='object'
      || readOnlyPayload.authority?.sendPermission!==false
      || readOnlyPayload.authority?.autoExecution!==false)
      fail('WRITE_AUTHORITY_NOT_EXPLICITLY_DENIED');
    return owner(name,(dir)=>{
      assertVersion(currentOrNull(name),expectedVersion);
      // Store unchanged; it already owns immutable vNNNN.json and CURRENT.
      const snapshot=store.save(name,readOnlyPayload,note);
      if(!Number.isSafeInteger(snapshot?.version) || store.current(name)!==snapshot.version)
        fail('PROFILE_COMMIT_UNCONFIRMED');
      // Best effort file fsync on Windows/Linux. Do not claim full crash atomicity:
      // VersionedStore.save itself precedes this sync and CURRENT rename.
      fsyncFile(path.join(dir,'v'+String(snapshot.version).padStart(4,'0')+'.json'));
      fsyncFile(path.join(dir,'CURRENT'));
      return {schema:CAS_OWNER_SCHEMA,kind:'saved-proposal',
        name,version:snapshot.version,priorVersion:expectedVersion,
        readOnly:true,productionActivationAuthorized:false,
        sendPermission:false};
    });
  }
  function rollback(name,targetVersion,expectedVersion){
    if(!Number.isSafeInteger(targetVersion)||targetVersion<1)fail('INVALID_ROLLBACK_VERSION');
    return owner(name,(dir)=>{
      assertVersion(currentOrNull(name),expectedVersion);
      // Confirm target exists before touching CURRENT. Atomic replacement here
      // avoids the plain store.rollback() direct CURRENT overwrite.
      const target=store.load(name,targetVersion);
      if(target?.version!==targetVersion)fail('INVALID_ROLLBACK_TARGET');
      const temporary=path.join(dir,'CURRENT.'+randomBytes(8).toString('hex')+'.tmp');
      let fd;
      try{
        fd=openSync(temporary,'wx',0o600);
        writeSync(fd,String(targetVersion));fsyncSync(fd);closeSync(fd);fd=undefined;
        renameSync(temporary,path.join(dir,'CURRENT'));
      }finally{
        if(fd!==undefined)closeSync(fd);
        rmSync(temporary,{force:true});
      }
      if(store.current(name)!==targetVersion)fail('ROLLBACK_UNCONFIRMED');
      return {schema:CAS_OWNER_SCHEMA,kind:'rollback-pointer',name,
        fromVersion:expectedVersion,toVersion:targetVersion,readOnly:true,
        productionActivationAuthorized:false,sendPermission:false};
    });
  }
  return Object.freeze({proposeSave,rollback});
}
