import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditHarvestLedger} from '../src/platform/harvest.mjs';
import {runPlatformInspect} from '../src/platform/inspect.mjs';

const copy=Buffer.from('controlled donor excerpt\n');
const digest=createHash('sha256').update(copy).digest('hex');
const location='workspace/aion/ops/chrome-relay/harvest/landing/sources/vivim-final/items/VF-0001/excerpt.ts';
const copied=()=>({id:'VF-0001',capture_status:'COPIED_EXCERPT',copied_path:location,
  copy_sha256_reported:digest,aion_integration_approved:false});
const flagged=()=>({id:'VO-GH-0001',capture_status:'FLAGGED',copied_path:null,
  aion_integration_approved:false});
const ledger=(...rows)=>rows.map(x=>JSON.stringify(x)).join('\n')+'\n';
const probe=(value,opts={})=>auditHarvestLedger(value,{repoRoot:'/tmp/staged-checkout',
  readCopy:()=>copy,...opts});

test('harvest bytes match independent source capture hashes without claiming live capability',()=>{
  const r=probe(ledger(copied(),flagged()));
  assert.equal(r.ok,true);assert.equal(r.records,2);
  assert.equal(r.matching,1);assert.equal(r.flagged,1);
  assert.equal(r.live_provider_verification,'NOT_ESTABLISHED');
  assert.equal(r.execution_authority,false);
});
test('mismatched copy is detected, never silently recast as validated source',()=>{
  const r=probe(ledger(copied()),{readCopy:()=>Buffer.from('tampered')});
  assert.equal(r.ok,false);assert.equal(r.mismatched,1);
  assert(r.issues.some(x=>x.includes('hash_mismatch')));
});
test('copied files missing from local checkout fail with exact record ID',()=>{
  const r=probe(ledger(copied()),{readCopy:()=>{throw Error('missing')}});
  assert.equal(r.missing,1);assert.equal(r.ok,false);
  assert(r.issues.includes('VF-0001:copy_unreadable'));
});
test('missing hash, traversal and copied-without-source entries fail before reading',()=>{
  for(const x of [
    {...copied(),copy_sha256_reported:'bad'},
    {...copied(),copied_path:location.replace('/VF-0001/','/../')},
    {...copied(),copied_path:'/home/private.secret'}
  ]){
    let reads=0;
    const r=probe(ledger(x),{readCopy:()=>{reads++;return copy}});
    assert.equal(r.ok,false);assert.equal(reads,0);
  }
});
test('duplicate, malformed and invalid status entries never pass',()=>{
  assert.equal(probe(ledger(copied(),copied())).ok,false);
  assert.equal(probe('{bad json').ok,false);
  assert.equal(probe(ledger({...copied(),capture_status:'ACCEPTED_FOR_RUNTIME'})).ok,false);
});
test('research metadata flags cannot grant runtime integration',()=>{
  const r=probe(ledger({...copied(),aion_integration_approved:true}));
  assert.equal(r.ok,false);assert.equal(r.research_approval_flags,1);
  assert.equal(r.execution_authority,false);
});
test('platform harvest CLI is read-only, does not load the semantic seed or Bus',()=>{
  const lines=[];let seedReads=0,audits=0;
  const code=runPlatformInspect(['harvest','--json'],{print:x=>lines.push(JSON.parse(x)),
    readSeed:()=>{seedReads++;throw Error('not allowed')},
    audit:()=>{audits++;return probe(ledger(copied()))}});
  assert.equal(code,0);assert.equal(seedReads,0);assert.equal(audits,1);
  assert.equal(lines[0].schema,'aion.platform.harvest-audit/1');
  assert.equal(lines[0].matching,1);
});
