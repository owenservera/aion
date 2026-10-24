import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStudioSourceReader } from '../src/studio-source-reader.mjs';
import { qualifyObservation } from '../src/evidence-receipts.mjs';

const exactCode=code=>e=>e?.code===code;
function harness(t,{ synthetic=false }={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aion-source-reader-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const id='20261024-novel-abcdef';
  const dir=path.join(root,id);fs.mkdirSync(dir);
  const raw='a'.repeat(64),dom='b'.repeat(64);
  const session={ id,dir,meta:{id,status:'complete',
    target:{id:'captured-target-1',url:'https://novel-chat.invalid/chat/7'},
    synthetic },records:async function*(){yield {k:'chunk',seq:1};yield {k:'done',seq:2};},
    verify:async()=>({ok:true,records:2,unexplainedSeqGaps:0,
      gapRecords:0,droppedRecords:0,
      segments:[{inManifest:true,shaMatches:true,torn:false}]} ) };
  const identity={ bindingSessionId:id,targetId:'captured-target-1',
    scope:{origin:'https://novel-chat.invalid',account:'server-account',surface:'chat'},
    lineageRoot:'l1',familyId:'acquisition-1',
    evidenceClass:synthetic?'SYNTHETIC_TEST':'SAVED_REAL_CAPTURE' };
  const acceptance={verdict:'capture_accepted',binding:{rawDigest:raw,domDigest:dom,seqRange:[1,2]},
    gates:Object.fromEntries(['G1','G2','G3','G4','G5','G6','G7'].map(k=>[k,{value:'passed'}]))};
  const deps={sessionsDir:root,resolveTrustedIdentity:async()=>identity,
    openSession:async()=>session,digestRaw:()=>({digest:raw}),digestDom:()=>dom,
    readStoredAcceptance:()=>acceptance,allowSynthetic:synthetic};
  return { root,id,dir,raw,dom,session,identity,acceptance,deps };
}

test('Studio trusted source mints receipt from exactly bound persisted Session metadata',async t=>{
  const h=harness(t),source=createStudioSourceReader(h.deps);
  const actual=await source.lookupCapture(h.id);
  assert.equal(actual.verifiedOriginal,true);
  assert.equal(actual.source.captureId,h.id);
  assert.equal(actual.source.rawDigest,h.raw);
  assert.equal(actual.source.domDigest,h.dom);
  assert.equal(actual.source.lineageRoot,'l1');
  assert.equal(actual.acceptance.conversationAccepted,true);
  assert.equal(actual.productionActivationAuthorized,false);
  assert.equal(actual.sendAuthorized,false);
  const receipt=await source.mintReceipt(h.id);
  const qualified=await qualifyObservation(receipt,{lookupCapture:source.lookupCapture});
  assert.equal(qualified.originalQualified,true);
  assert.equal(qualified.acceptedConversation,false);
});

test('Studio lookup forbids ambiguous prefix, path and unsafe capture IDs',async t=>{
  const h=harness(t),reader=createStudioSourceReader(h.deps);
  await assert.rejects(reader.lookupCapture('../anything'),exactCode('INVALID_CAPTURE_ID'));
  await assert.rejects(reader.lookupCapture('latest'),exactCode('SESSION_IDENTITY_MISMATCH'));
  await assert.rejects(reader.lookupCapture(h.id.slice(0,10)),exactCode('SESSION_IDENTITY_MISMATCH'));
});

test('original source cannot be verified while recorder is active',async t=>{
  const h=harness(t);h.session.meta.status='recording';
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('SESSION_NOT_FINAL'));
});

test('untrusted account or acquisition lineage refuses minting',async t=>{
  const h=harness(t);h.identity.scope.account='';
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('TRUSTED_IDENTITY_UNAVAILABLE'));
  h.identity.scope.account='server-account';delete h.identity.familyId;
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('TRUSTED_IDENTITY_UNAVAILABLE'));
});

test('tampered target identity or origin refuses source read',async t=>{
  const h=harness(t);h.identity.targetId='different-target';
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('TRUSTED_IDENTITY_UNAVAILABLE'));
  h.identity.targetId='captured-target-1';h.identity.scope.origin='https://different.invalid';
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('TRUSTED_IDENTITY_UNAVAILABLE'));
});

test('raw with unverifiable manifest hash or unexplained gap is rejected',async t=>{
  const h=harness(t);h.session.verify=async()=>({ok:true,records:2,unexplainedSeqGaps:0,
    gapRecords:0,droppedRecords:0,segments:[{inManifest:false,shaMatches:null,torn:false}]});
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('RAW_INTEGRITY_UNVERIFIED'));
});

test('excluded or truncated raw body cannot silently become a qualified original',async t=>{
  const h=harness(t);
  h.session.records=async function*(){yield {k:'body.truncated',seq:1};yield {k:'done',seq:2};};
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('RAW_COVERAGE_INCOMPLETE'));
});

test('raw evidence modified during source read is detected',async t=>{
  const h=harness(t);let calls=0;
  h.deps.digestRaw=()=>({digest:++calls===1?h.raw:'c'.repeat(64)});
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('SOURCE_CHANGED_DURING_READ'));
});

test('conversation acceptance is not inferred from merely stored verdict',async t=>{
  const h=harness(t);h.acceptance.gates.G3.value='unknown';
  const result=await createStudioSourceReader(h.deps).lookupCapture(h.id);
  assert.equal(result.acceptance.verdict,'capture_accepted');
  assert.equal(result.acceptance.conversationAccepted,false);
});

test('synthetic capture cannot be passed off as real, even by resolver',async t=>{
  const h=harness(t,{synthetic:true});h.identity.evidenceClass='SAVED_REAL_CAPTURE';
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('SYNTHETIC_REAL_MISCLASSIFIED'));
});

test('synthetic source requires explicit fixture mode',async t=>{
  const h=harness(t,{synthetic:true});h.deps.allowSynthetic=false;
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('SYNTHETIC_READER_DISABLED'));
});

test('linked session directories cannot evade read boundary',async t=>{
  const h=harness(t); const elsewhere=fs.mkdtempSync(path.join(os.tmpdir(),'aion-evil-'));
  t.after(()=>fs.rmSync(elsewhere,{recursive:true,force:true}));
  h.session.dir=elsewhere;
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),exactCode('SESSION_IDENTITY_MISMATCH'));
});

test('symlinked session dir to outside sessions root fails closed',async t=>{
  const h=harness(t),elsewhere=fs.mkdtempSync(path.join(os.tmpdir(),'aion-escaped-'));
  t.after(()=>fs.rmSync(elsewhere,{recursive:true,force:true}));
  fs.rmSync(h.dir,{recursive:true,force:true});
  try {fs.symlinkSync(elsewhere,h.dir,process.platform==='win32'?'junction':'dir');}
  catch(e) {
    if(['EPERM','EACCES','ENOTSUP'].includes(e?.code)){t.skip('creating directory symlinks is prohibited on this host');return;}
    throw e;
  }
  await assert.rejects(createStudioSourceReader(h.deps).lookupCapture(h.id),
    exactCode('SESSION_IDENTITY_MISMATCH'));
});
