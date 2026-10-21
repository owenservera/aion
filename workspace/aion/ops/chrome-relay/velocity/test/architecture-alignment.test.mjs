import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = rel => readFileSync(new URL(rel, import.meta.url), 'utf8');
const canon = '12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md';
const design = '../design/';
const sources = [
  '02-BUILD-ROADMAP.md',
  '05-AION-PLATFORM-SEMANTIC-GOVERNANCE.md',
  '06-AION-PLATFORM-IMPLEMENTATION-PACKETS.md',
  '07-PLATFORM-LOCAL-DEV-HANDOFF.md',
  '08-CHAT-FANOUT-PROMPTS.md',
  '10-INTERACTIVE-CLI-RECEIVE-ARCHITECTURE.md',
  '11-PRINCIPAL-ARCHITECT-REVIEW-2026-10-20.md'
];

test('all previously active Track B design entry points defer to the accepted architecture', () => {
  for (const file of sources) {
    const body=read(design+file);
    assert.ok(body.includes(canon), file+' missing canonical architecture pointer');
  }
  assert.ok(read('../README.md').includes(canon));
});

test('state current goal, architecture pointer, freeze and live-test boundary agree', () => {
  const state=JSON.parse(read('../../../../STATE.json'));
  assert.equal(state.track_b_architecture?.decision_id,'AION-BIDIRECTIONAL-CLI-ARCH-2026-10-20');
  assert.ok(state.track_b_architecture?.source_path.endsWith(canon));
  assert.equal(state.track_b_architecture?.status,
    'OWNER_ACCEPTED_DEVELOPMENT_DIRECTION_IMPLEMENTATION_PENDING');
  assert.equal(state.track_b_architecture?.m1_live_verified,false);
  assert.equal(state.track_b_architecture?.code_development_authorized,true);
  assert.equal(state.dev_model,'GITHUB_AUTHORING_WITH_OWNER_WINDOWS_MASTER_FOR_LIVE_TESTING');
  assert.equal(state.current_phase,'TRACK_B_ARCHITECTURE_OWNER_ACCEPTED_BUILD_READY_LIVE_ACCEPTANCE_PENDING');
  assert.match(state.current_goal,/bidirectional CLI/);
  assert.ok(!/implementation changes remain frozen/i.test(state.current_live_scope.code_policy));
});

test('accepted architecture freezes decision outcomes and chronological gates',()=>{
  const d=read(design+canon);
  for(const token of ['M1 framing','M2 read scope','M3 retention','M4 actuator','M5 freeze','M6 authority',
    'I0','I1','I2','I3','P1 SHARED CONTRACT','P6 CHAT SEND','push hints + pull snapshots',
    'PR #51','NOT YET merged']){
    assert.ok(d.includes(token),'missing canonical decision or gate: '+token);
  }
  assert.match(d,/Bus as a unified message\\+command queue \\| \\*\\*REJECTED/i);
});

test('the canonical entry point is read-only architecture, not evidence of implemented chat',()=>{
  const s=read(design+canon);
  assert.ok(s.includes('IMPLEMENTATION AND LIVE ACCEPTANCE PENDING'));
  assert.ok(s.includes('same web identity'));
});
