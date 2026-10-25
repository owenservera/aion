// FICTIONAL FIXTURE. The .invalid origin and original-source lookup are test doubles.
// No live browser, authenticated provider or accepted capture is implied.
import { RECEIPT_SCHEMA } from '../src/evidence-receipts.mjs';
import { NATIVE_EVENT_SCHEMA } from '../src/native-projection.mjs';
const copy = x => structuredClone(x);

export function makeUnknownSiteFixture() {
  const siteId='unknown-lab';
  const scope={origin:'https://novel-chat.invalid',account:'synthetic-account',surface:'chat'};
  const captures=Array.from({length:5},(_,i)=>{
    const n=i+1, captureId='unknown-fixture-'+n;
    const receipt={schema:RECEIPT_SCHEMA,scope:copy(scope),evidenceClass:'SYNTHETIC_TEST',
      source:{captureId,lineageRoot:'lineage-'+n,familyId:'independent-family-'+n,
        rawDigest:'raw-synthetic-'+n,domDigest:'dom-synthetic-'+n,
        seqStart:n*100,seqEnd:n*100+90}};
    const probes=[
      {feature:'user-turn',type:'selector',candidate:'[data-role="human"]',
        outcome:'present',carrier:'dom',coverage:'complete',sequence:n*100+1},
      {feature:'assistant-turn',type:'selector',candidate:'[data-role="ai"]',
        outcome:'present',carrier:'dom',coverage:'complete',sequence:n*100+2},
      {feature:'thread-route',type:'route',candidate:'/chat/{conversation}',
        outcome:'present',carrier:'dom',coverage:'complete',sequence:n*100+3}
    ];
    return {receipt,probes};
  });
  // This lookup deliberately simulates the future trusted server adapter.
  // A real integration must reconstruct and verify these fields from the on-disk originals.
  const canonical=new Map(captures.map(c=>[c.receipt.source.captureId,
    {verifiedOriginal:true,scope:copy(c.receipt.scope),
      evidenceClass:c.receipt.evidenceClass,source:copy(c.receipt.source)}]));
  const lookupCapture=async captureId=>copy(canonical.get(captureId) ?? null);
  const nativeScope={...scope,conversationId:'native-conversation-7'};
  const mk=(sequence,turnId,blockId,op,revision,extra={})=>({
    schema:NATIVE_EVENT_SCHEMA,scope:copy(nativeScope),sequence,turnId,blockId,op,revision,
    eventId:'event-'+sequence,
    evidence:{grounded:true,sid:'synthetic-sid-7',seq:sequence},...extra});
  const nativeEvents=[
    mk(1,'turn-user','block-user','open',0,{role:'user',kind:'answer',text:'Show example'}),
    mk(2,'turn-user','block-user','close',0),
    mk(3,'turn-ai','block-answer','open',0,{role:'assistant',kind:'answer',
      nativeType:'vendor.response.delta',text:'AIO'}),
    mk(4,'turn-ai','block-answer','append',1,{text:'N demo'}),
    mk(5,'turn-ai','block-answer','replace',2,{text:'AION demo — revised'}),
    mk(6,'turn-ai','block-answer','close',2),
    mk(7,'turn-ai','block-artifact','open',0,{role:'assistant',kind:'artifact',
      nativeType:'vendor.artifact.v2',payload:{title:'Demo',revision:1,sections:[{title:'Example'}]}}),
    mk(8,'turn-ai','block-artifact','close',0)
  ];
  return {siteId,scope,training:captures.slice(0,3),heldout:captures.slice(3),
    captures,lookupCapture,nativeScope,nativeEvents};
}
