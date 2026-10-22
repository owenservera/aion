// Unit tests for the verified stream-to-DOM join (src/intel/join.mjs). Synthetic data only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinStreamToDom, normalizeForJoin } from '../../src/intel/join.mjs';

const msg = (o) => ({ key: null, messageId: null, role: 'assistant', text: '', final: true, blocks: [], ...o });
const turn = (o) => ({ index: 0, id: null, domId: null, role: 'assistant', text: '', blocks: [], ...o });
const linkAt = (r, messageIndex) => r.links.find((l) => l.messageIndex === messageIndex);
const domOnly = (r, turnIndex) => r.links.find((l) => l.messageIndex === null && l.turnIndex === turnIndex);

test('normalizeForJoin strips common markdown markers, unifies smart quotes and collapses whitespace', () => {
  assert.equal(normalizeForJoin('## Title\n- **bold** and `code`\n> quoted'), 'title bold and code quoted');
  assert.equal(normalizeForJoin('It\u2019s \u201Cfine\u201D'), 'it\'s "fine"');
  assert.equal(normalizeForJoin(undefined), '');
});

test('verified happy path: three alternating turns, markdown in stream and plain text in DOM', () => {
  const r = joinStreamToDom({
    messages: [
      msg({ key: 'm1:0', messageId: 'm1', role: 'user', text: 'Hello **there**, friend.' }),
      msg({ key: 'm2:0', messageId: 'm2', role: 'assistant', text: '## Harbour notes\n- lamp is lit\n- tide is `high`' }),
      msg({ key: 'm3:0', messageId: 'm3', role: 'user', text: 'Thanks \u201Ca lot\u201D.' }),
    ],
    turns: [
      turn({ index: 0, id: 't0', domId: 'd0', role: 'user', text: 'Hello there, friend.' }),
      turn({ index: 1, id: 't1', domId: 'd1', role: 'assistant', text: 'Harbour notes lamp is lit tide is high' }),
      turn({ index: 2, id: 't2', domId: 'd2', role: 'user', text: 'Thanks "a lot".' }),
    ],
  });
  assert.equal(r.links.length, 3);
  r.links.forEach((l, i) => {
    assert.equal(l.status, 'verified');
    assert.equal(l.textMatch, 'exact');
    assert.equal(l.turnIndex, i);
    assert.equal(l.evidence.rule, 'order+text');
  });
  assert.equal(r.links[1].turnId, 't1');
  assert.equal(r.links[1].domId, 'd1');
  assert.equal(r.summary.messageStatus.verified, 3);
  assert.equal(r.summary.rules['order+text'], 3);
});

test('partial: a streaming prefix of the rendered text, and an exact but non-final stream', () => {
  const prefix = joinStreamToDom({
    messages: [msg({ key: 's:0', messageId: 's', role: 'assistant', text: 'The lighthouse is', final: false })],
    turns: [turn({ index: 0, role: 'assistant', text: 'The lighthouse is lit every night.' })],
  });
  assert.equal(prefix.links[0].status, 'partial');
  assert.equal(prefix.links[0].textMatch, 'prefix');
  assert.equal(prefix.links[0].turnIndex, 0);
  assert.ok(prefix.links[0].evidence.notes.includes('stream_not_final'));

  const open = joinStreamToDom({
    messages: [msg({ key: 's:1', messageId: 's', role: 'assistant', text: 'Same text.', final: false })],
    turns: [turn({ index: 0, role: 'assistant', text: 'Same text.' })],
  });
  assert.equal(open.links[0].status, 'partial');
  assert.equal(open.links[0].textMatch, 'exact');
});

test('text_mismatch: aligned by order, text differs, nothing forced', () => {
  const r = joinStreamToDom({
    messages: [msg({ key: 'x:0', messageId: 'x', role: 'user', text: 'Hi there' })],
    turns: [turn({ index: 0, role: 'user', text: 'Completely different words' })],
  });
  assert.equal(r.links[0].status, 'text_mismatch');
  assert.equal(r.links[0].textMatch, 'differs');
  assert.equal(r.links[0].turnIndex, 0);
});

test('identical duplicate turns with an earlier mismatch are ambiguous, not forced', () => {
  const r = joinStreamToDom({
    messages: [
      msg({ key: 'a:0', messageId: 'a', role: 'assistant', text: 'Other reply.' }),
      msg({ key: 'a:1', messageId: 'a', role: 'assistant', text: 'Same reply.' }),
    ],
    turns: [
      turn({ index: 0, role: 'assistant', text: 'Same reply.' }),
      turn({ index: 1, role: 'assistant', text: 'Same reply.' }),
    ],
  });
  assert.equal(linkAt(r, 0).status, 'text_mismatch');
  const amb = linkAt(r, 1);
  assert.equal(amb.status, 'ambiguous');
  assert.equal(amb.turnIndex, null);
  assert.equal(amb.textMatch, 'none');
  assert.deepEqual(amb.evidence.candidates, [0, 1]);
  // The second duplicate is not claimed by anyone, so it is reported as an unlinked DOM turn.
  assert.equal(domOnly(r, 1).evidence.candidateOf[0], 1);
});

test('identical duplicate turns resolve by ordinal only when all earlier messages are aligned', () => {
  const r = joinStreamToDom({
    messages: [
      msg({ key: 'a:0', messageId: 'a', role: 'assistant', text: 'Same reply.' }),
      msg({ key: 'a:1', messageId: 'a', role: 'assistant', text: 'Same reply.' }),
    ],
    turns: [
      turn({ index: 0, role: 'assistant', text: 'Same reply.' }),
      turn({ index: 1, role: 'assistant', text: 'Same reply.' }),
    ],
  });
  assert.equal(linkAt(r, 0).status, 'verified');
  assert.equal(linkAt(r, 0).evidence.rule, 'ordinal');
  assert.equal(linkAt(r, 1).status, 'verified');
  assert.equal(linkAt(r, 1).turnIndex, 1);
  assert.equal(linkAt(r, 1).evidence.rule, 'ordinal');
});

test('identical duplicate turns with counts differing are ambiguous (text only, no ordering)', () => {
  const r = joinStreamToDom({
    messages: [msg({ key: 'x:0', messageId: 'x', role: 'assistant', text: 'Same reply.' })],
    turns: [
      turn({ index: 0, role: 'assistant', text: 'Same reply.' }),
      turn({ index: 1, role: 'assistant', text: 'Same reply.' }),
      turn({ index: 2, role: 'user', text: 'Question.' }),
    ],
  });
  const l = linkAt(r, 0);
  assert.equal(l.status, 'ambiguous');
  assert.equal(l.turnIndex, null);
  assert.equal(l.evidence.rule, 'text-only');
  assert.equal(l.evidence.ordering, 'text');
  assert.deepEqual(l.evidence.candidates, [0, 1]);
});

test('counts differ, stream message with no DOM turn -> unlinked_stream; text-free DOM turns stay unlinked', () => {
  const r = joinStreamToDom({
    messages: [
      msg({ key: 'q:0', messageId: 'q', role: 'user', text: 'Q1' }),
      msg({ key: 'a:0', messageId: 'a', role: 'assistant', text: 'A1' }),
      msg({ key: 'q:1', messageId: 'q', role: 'user', text: 'Q2' }),
    ],
    turns: [
      turn({ index: 0, role: 'user', text: 'Q1' }),
      turn({ index: 1, role: 'assistant', text: 'A1' }),
    ],
  });
  assert.equal(linkAt(r, 0).status, 'verified');
  assert.equal(linkAt(r, 1).status, 'verified');
  const orphan = linkAt(r, 2);
  assert.equal(orphan.status, 'unlinked_stream');
  assert.equal(orphan.turnIndex, null);
  assert.equal(orphan.evidence.rule, null);
  assert.equal(r.summary.messageStatus.unlinked_stream, 1);
});

test('counts differ, extra DOM turn -> unlinked_dom; a stream message is never forced onto a non-matching turn', () => {
  const extra = joinStreamToDom({
    messages: [msg({ key: 'q:0', messageId: 'q', role: 'user', text: 'Q1' })],
    turns: [turn({ index: 0, role: 'user', text: 'Q1' }), turn({ index: 1, role: 'assistant', text: 'Extra reply' })],
  });
  assert.equal(linkAt(extra, 0).status, 'verified');
  const d = domOnly(extra, 1);
  assert.equal(d.status, 'unlinked_dom');
  assert.equal(d.messageKey, null);

  const forced = joinStreamToDom({
    messages: [msg({ key: 'q:9', messageId: 'q', role: 'user', text: 'Q9' })],
    turns: [turn({ index: 0, role: 'user', text: 'Q1' }), turn({ index: 1, role: 'user', text: 'Q2' })],
  });
  assert.equal(linkAt(forced, 0).status, 'unlinked_stream');
  assert.equal(forced.summary.messageStatus.unlinked_dom, 2);
});

test('block-level: matching counts link stream block index to DOM ord with compatible types', () => {
  const r = joinStreamToDom({
    messages: [msg({
      key: 'b:0', messageId: 'b', role: 'assistant', text: 'Intro line\n- one\n- two',
      blocks: [
        { key: 'b:0', index: 0, type: 'paragraph', text: 'Intro line' },
        { key: 'b:1', index: 1, type: 'list', text: '- one\n- two' },
      ],
    })],
    turns: [turn({
      index: 0, role: 'assistant', text: 'Intro line one two',
      blocks: [
        { ord: 0, type: 'paragraph', text: 'Intro line' },
        { ord: 1, type: 'list', text: 'one two' },
      ],
    })],
  });
  const l = linkAt(r, 0);
  assert.equal(l.status, 'verified');
  assert.equal(l.blockLinks.length, 2);
  assert.deepEqual(l.blockLinks.map((b) => [b.blockKey, b.ord, b.status, b.textMatch]), [
    ['b:0', 0, 'verified', 'exact'],
    ['b:1', 1, 'verified', 'exact'],
  ]);
  assert.equal(l.blockLinks[0].evidence.rule, 'order+text');
  assert.equal(r.summary.blockStatus.verified, 2);
});

test('block-level: counts disagree -> no ordinal link; incompatible type -> not linked', () => {
  const disagree = joinStreamToDom({
    messages: [msg({
      key: 'c:0', messageId: 'c', role: 'assistant', text: 'One two',
      blocks: [{ key: 'c:0', index: 0, type: 'paragraph', text: 'One' }, { key: 'c:1', index: 1, type: 'paragraph', text: 'two' }],
    })],
    turns: [turn({ index: 0, role: 'assistant', text: 'One two', blocks: [{ ord: 0, type: 'paragraph', text: 'One two' }] })],
  });
  const l = linkAt(disagree, 0);
  assert.equal(l.status, 'verified');
  assert.ok(l.blockLinks.every((b) => b.ord === null || b.status.startsWith('unlinked')));
  assert.ok(l.blockLinks.every((b) => b.status !== 'verified' && b.status !== 'partial'));
  assert.equal(l.blockLinks.filter((b) => b.status === 'unlinked_stream').length, 2);

  const typed = joinStreamToDom({
    messages: [msg({ key: 'd:0', messageId: 'd', role: 'assistant', text: 'print one', blocks: [{ key: 'd:0', index: 0, type: 'code', text: 'print one' }] })],
    turns: [turn({ index: 0, role: 'assistant', text: 'print one', blocks: [{ ord: 0, type: 'table', text: 'print one' }] })],
  });
  assert.equal(linkAt(typed, 0).blockLinks[0].status, 'unlinked_stream');
  assert.equal(linkAt(typed, 0).blockLinks[0].evidence.rule, null);
});

test('null message keys still join by text and report evidence rule text-only', () => {
  const r = joinStreamToDom({
    messages: [msg({ key: null, messageId: null, role: 'user', text: 'Plain question' })],
    turns: [turn({ index: 0, role: 'user', text: 'Plain question' })],
  });
  assert.equal(r.links[0].status, 'verified');
  assert.equal(r.links[0].textMatch, 'exact');
  assert.equal(r.links[0].messageKey, null);
  assert.equal(r.links[0].evidence.rule, 'text-only');
  assert.equal(r.summary.rules['text-only'], 1);
});

test('determinism: the same input gives deep-equal output and the input is not mutated', () => {
  const input = () => ({
    messages: [
      msg({ key: 'k:0', messageId: 'k', role: 'user', text: 'Hi **there**' }),
      msg({ key: 'k:1', messageId: 'k', role: 'assistant', text: 'Same reply.' }),
      msg({ key: 'k:2', messageId: 'k', role: 'assistant', text: 'Same reply.', final: false }),
    ],
    turns: [
      turn({ index: 0, role: 'user', text: 'Hi there' }),
      turn({ index: 1, role: 'assistant', text: 'Same reply.' }),
      turn({ index: 2, role: 'assistant', text: 'Same reply.' }),
    ],
  });
  const a = input();
  const snapshot = JSON.stringify(a);
  const first = joinStreamToDom(a);
  const second = joinStreamToDom(input());
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(a), snapshot);
});

test('empty inputs produce no links and zero counts', () => {
  for (const r of [joinStreamToDom({ messages: [], turns: [] }), joinStreamToDom()]) {
    assert.deepEqual(r.links, []);
    assert.equal(r.summary.messages, 0);
    assert.equal(r.summary.turns, 0);
    assert.ok(Object.values(r.summary.messageStatus).every((n) => n === 0));
    assert.ok(Object.values(r.summary.rules).every((n) => n === 0));
  }
});
