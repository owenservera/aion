import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VersionedStore } from '../../../sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/store/versioned.mjs';
import { createProfileCasOwner } from '../src/profile-cas-owner.mjs';

const code=c=>e=>e?.code===c;
const payload=n=>({schema:'aion.readonly-adapter/1',
  description:'candidate-'+n,origin:'https://novel-chat.invalid',
  authority:{sendPermission:false,autoExecution:false}});
function setup(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aion-read-cas-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const store=new VersionedStore(dir),owner=createProfileCasOwner({store});
  return {dir,store,owner};
}
test('CAS publishes versioned read-only snapshots using EXISTING store',t=>{
  const {store,owner}=setup(t);
  const a=owner.proposeSave('unknown-lab',payload(1),null);
  assert.equal(a.version,1);assert.equal(a.productionActivationAuthorized,false);
  assert.equal(store.load('unknown-lab').description,'candidate-1');
  const b=owner.proposeSave('unknown-lab',payload(2),1);
  assert.equal(b.version,2);assert.equal(store.current('unknown-lab'),2);
  assert.equal(store.versions('unknown-lab').length,2);
});
test('stale expected version cannot overwrite another writer',t=>{
  const {store,owner}=setup(t);owner.proposeSave('unknown-lab',payload(1),null);
  owner.proposeSave('unknown-lab',payload(2),1);
  assert.throws(()=>owner.proposeSave('unknown-lab',payload(3),1),
    code('STALE_PROFILE_VERSION'));
  assert.equal(store.current('unknown-lab'),2);
  assert.equal(store.versions('unknown-lab').length,2);
});
test('rollback uses atomic CURRENT replacement while retaining immutable versions',t=>{
  const {store,owner}=setup(t);owner.proposeSave('unknown-lab',payload(1),null);
  owner.proposeSave('unknown-lab',payload(2),1);
  const r=owner.rollback('unknown-lab',1,2);
  assert.equal(r.toVersion,1);assert.equal(store.current('unknown-lab'),1);
  assert.equal(store.load('unknown-lab').description,'candidate-1');
  assert.equal(store.versions('unknown-lab').length,2);
  const after=owner.proposeSave('unknown-lab',payload(3),1);
  assert.equal(after.version,3);assert.equal(store.versions('unknown-lab').length,3);
});
test('stale rollback refusal is fail-closed',t=>{
  const {store,owner}=setup(t);owner.proposeSave('unknown-lab',payload(1),null);
  owner.proposeSave('unknown-lab',payload(2),1);
  assert.throws(()=>owner.rollback('unknown-lab',1,1),code('STALE_PROFILE_VERSION'));
  assert.equal(store.current('unknown-lab'),2);
});
test('missing rollback target fails before touching CURRENT',t=>{
  const {store,owner}=setup(t);owner.proposeSave('unknown-lab',payload(1),null);
  assert.throws(()=>owner.rollback('unknown-lab',99,1));
  assert.equal(store.current('unknown-lab'),1);
});
test('a preexisting lock is not automatically stolen or deleted',t=>{
  const {dir,owner}=setup(t);const d=path.join(dir,'unknown-lab');
  fs.mkdirSync(d,{recursive:true});const lock=path.join(d,'.aion-profile-owner.lock');
  fs.writeFileSync(lock,'other writer');
  assert.throws(()=>owner.proposeSave('unknown-lab',payload(1),null),
    code('PROFILE_OWNER_BUSY'));
  assert.equal(fs.readFileSync(lock,'utf8'),'other writer');
});
test('unsafe payload cannot gain send capability through a read publisher',t=>{
  const {owner}=setup(t);
  assert.throws(()=>owner.proposeSave('unknown-lab',
    {authority:{sendPermission:true,autoExecution:false}},null),
  code('WRITE_AUTHORITY_NOT_EXPLICITLY_DENIED'));
});
test('invalid path/profile names cannot escape the store directory',t=>{
  const {owner}=setup(t);
  assert.throws(()=>owner.proposeSave('../escape',payload(1),null),
    code('INVALID_PROFILE_NAME'));
});
test('a synchronous store failure releases only its own acquired lock',t=>{
  const {dir,store,owner}=setup(t);
  const save=store.save;store.save=()=>{throw Error('disk failure')};
  assert.throws(()=>owner.proposeSave('unknown-lab',payload(1),null),/disk failure/);
  assert.equal(fs.existsSync(path.join(dir,'unknown-lab','.aion-profile-owner.lock')),false);
  store.save=save;
  assert.equal(owner.proposeSave('unknown-lab',payload(1),null).version,1);
});
test('store without the expected canonical VersionedStore interface refuses owner',()=>{
  assert.throws(()=>createProfileCasOwner({store:{dir:'/tmp'}}),
    code('EXISTING_VERSIONED_STORE_REQUIRED'));
});
