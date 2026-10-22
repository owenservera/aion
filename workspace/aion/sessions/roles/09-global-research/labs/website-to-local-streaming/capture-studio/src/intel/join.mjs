// Verified stream-to-DOM join: ties each parsed stream message (and its blocks) to the rendered
// DOM turn (and block) it produced. Deterministic, honest: an unmatched element stays unlinked and
// a tie stays ambiguous. Pure functions on plain objects; no I/O; no imports from capture code.
//
// INPUT
//   messages: [{ key, messageId, role, text, final: bool, blocks: [{ key, index, type, text }] }]
//     stream order. key: `${messageId}:${index}`-style string, or null (then joined by text only).
//     blocks[].index: stream block index. type: optional stream block type (paragraph, heading,
//     list, quote, code, ...); when absent, the type check is skipped.
//   turns: [{ index, id, domId, role, text, blocks: [{ ord, type, text }] }]
//     document order. blocks[].ord: 0-based ordinal among sibling blocks in document order.
//
// OUTPUT
//   { links, summary }
//   link = { messageKey, messageIndex, messageId, role, turnIndex, turnId, domId, status,
//            textMatch, blockLinks, evidence }
//   status (message and block level):
//     verified        aligned (order or unique text) AND normalized text equal (final stream)
//     partial         stream text is a strict prefix of rendered text (stream not final, or render
//                     ahead); also an exact match of a stream message still marked not final
//     ambiguous       more than one candidate fits and order/ordinal does not decide; no link
//     text_mismatch   aligned by order but text differs (or render is behind stream); no text
//                     with nothing to verify (both empty) also lands here
//     unlinked_stream a stream element with no candidate
//     unlinked_dom    a DOM element no stream element claimed
//   textMatch: exact | prefix | differs | none
//   evidence.rule: order+text (position + text), ordinal (duplicate text decided by position with
//     all earlier messages aligned), text-only (joined by text; order not used), null (unlinked).
//
// RULES
//   Per role (user/assistant/...):
//   - Equal role counts and keyed message: positional. Stream i <-> DOM i, then text decides.
//     Duplicate DOM text: ordinal decides only if every earlier message of the role was aligned;
//     otherwise ambiguous.
//   - Otherwise (counts differ, or null key): text only. A message links to a free DOM turn only
//     when exactly one free turn fits (equal or stream-prefix); several fitting turns -> ambiguous.
//     Ordering is not assumed and evidence.notes says so.
//   Blocks: linked only for verified/partial messages, and only when block counts agree. Stream
//     block index -> DOM block with the same ord; type must be compatible (text-like stream types
//     map to paragraph/heading/list/quote/code; equal types always compatible).
//   Normalization (normalizeForJoin): NFKC, smart quotes -> ASCII, drop ** __ ` markers, strip
//     heading #, quote >, and list-bullet prefixes at line start, lowercase, collapse whitespace.

const STATUSES = ['verified', 'partial', 'ambiguous', 'text_mismatch', 'unlinked_stream', 'unlinked_dom'];
const TEXT_LIKE = new Set(['paragraph', 'text', 'heading', 'list', 'quote', 'code', 'markdown']);
const DOM_TEXT = new Set(['paragraph', 'heading', 'list', 'quote', 'code']);

export function normalizeForJoin(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\*\*|__|`/g, '')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const roleOf = (r) => String(r ?? '').trim().toLowerCase();

// Relation of stream text s to rendered text t (both normalized).
function relate(s, t) {
  if (s === '' && t === '') return 'empty';
  if (s === t) return 'exact';
  if (t.length > s.length && t.startsWith(s)) return 'prefix';
  if (s.length > t.length && s.startsWith(t) && t !== '') return 'render_behind';
  return 'differs';
}
const fitsRel = (rel) => rel === 'exact' || rel === 'prefix';
const textMatchOf = (rel) => (fitsRel(rel) ? rel : rel === 'empty' ? 'none' : 'differs');

// Turns a relation into a status. Exact text is verified only for a final stream message.
function decide(rel, final, notes) {
  if (rel === 'exact') {
    if (final === false) { notes.push('stream_not_final'); return 'partial'; }
    return 'verified';
  }
  if (rel === 'prefix') { notes.push(final === false ? 'stream_not_final' : 'stream_prefix_of_render'); return 'partial'; }
  if (rel === 'render_behind') notes.push('rendered_text_behind_stream');
  if (rel === 'empty') notes.push('no_text_to_verify');
  return 'text_mismatch';
}

function blockCompatible(s, d) {
  if (!s.type) return true;
  const st = String(s.type).toLowerCase(), dt = String(d.type ?? '').toLowerCase();
  if (st === dt) return true;
  return TEXT_LIKE.has(st) && DOM_TEXT.has(dt);
}

function linkBlocks(sbs, dbs) {
  const out = [];
  if (sbs.length !== dbs.length) {
    const reason = `block counts differ (stream ${sbs.length}, dom ${dbs.length}): no ordinal link`;
    for (const s of sbs) out.push({ blockKey: s.key, ord: null, status: 'unlinked_stream', textMatch: 'none', evidence: { rule: null, reason } });
    for (const d of dbs) out.push({ blockKey: null, ord: d.ord, status: 'unlinked_dom', textMatch: 'none', evidence: { rule: null, reason } });
    return out;
  }
  const usedOrd = new Set();
  for (const s of sbs) {
    const d = dbs.find((x) => x.ord === s.index);
    if (!d) {
      out.push({ blockKey: s.key, ord: null, status: 'unlinked_stream', textMatch: 'none', evidence: { rule: null, reason: 'no DOM block with this ordinal' } });
      continue;
    }
    if (!blockCompatible(s, d)) {
      out.push({ blockKey: s.key, ord: null, status: 'unlinked_stream', textMatch: 'none', evidence: { rule: null, reason: `type ${s.type} incompatible with dom ${d.type}` } });
      continue;
    }
    usedOrd.add(d.ord);
    const notes = [];
    const rel = relate(s.nt, d.nt);
    out.push({ blockKey: s.key, ord: d.ord, status: decide(rel, undefined, notes), textMatch: textMatchOf(rel), evidence: { rule: 'order+text', ordering: 'ordinal', notes } });
  }
  for (const d of dbs) if (!usedOrd.has(d.ord)) out.push({ blockKey: null, ord: d.ord, status: 'unlinked_dom', textMatch: 'none', evidence: { rule: null, reason: 'no stream block linked to this ordinal' } });
  return out;
}

export function joinStreamToDom({ messages = [], turns = [] } = {}) {
  const ms = (Array.isArray(messages) ? messages : []).map((m, pos) => {
    const x = m ?? {};
    return {
      pos, key: x.key ?? null, messageId: x.messageId ?? null, role: roleOf(x.role), nt: normalizeForJoin(x.text), final: x.final,
      blocks: (Array.isArray(x.blocks) ? x.blocks : []).map((b, i) => { const y = b ?? {}; return { key: y.key ?? null, index: y.index ?? i, type: y.type ?? null, nt: normalizeForJoin(y.text) }; }),
    };
  });
  const ts = (Array.isArray(turns) ? turns : []).map((t, pos) => {
    const x = t ?? {};
    return {
      pos, index: x.index ?? pos, id: x.id ?? null, domId: x.domId ?? null, role: roleOf(x.role), nt: normalizeForJoin(x.text),
      blocks: (Array.isArray(x.blocks) ? x.blocks : []).map((b) => { const y = b ?? {}; return { ord: y.ord ?? null, type: y.type ?? null, nt: normalizeForJoin(y.text) }; }),
    };
  });

  const res = new Array(ms.length).fill(null); // message pos -> { status, turnPos, textMatch, evidence }
  const claimed = new Map();                    // turn pos -> message pos
  const candidateOf = new Map();                // turn pos -> [message pos] (ambiguous candidacy)
  const addCand = (tp, mp) => { if (!candidateOf.has(tp)) candidateOf.set(tp, []); candidateOf.get(tp).push(mp); };
  const roles = [...new Set([...ms, ...ts].map((x) => x.role))];

  for (const role of roles) {
    const mL = ms.filter((x) => x.role === role);
    const tL = ts.filter((x) => x.role === role);
    const countsEqual = mL.length === tL.length;
    const countNote = countsEqual ? null : `role counts differ (stream ${mL.length}, dom ${tL.length}): aligned by text, ordering not assumed`;
    let aligned = true;

    // Pass 1: positional (equal counts, keyed messages).
    for (let i = 0; i < mL.length; i++) {
      const m = mL[i];
      if (!countsEqual || m.key === null) continue;
      const t = tL[i];
      const rel = relate(m.nt, t.nt);
      const notes = ['ordering assumed from equal role counts'];
      const fits = tL.filter((x) => fitsRel(relate(m.nt, x.nt)));
      const evidence = { rule: 'order+text', ordering: 'position', notes, candidates: [] };
      let status, turnPos = t.pos;
      if (fitsRel(rel) && fits.length > 1) {
        evidence.rule = 'ordinal';
        evidence.candidates = fits.map((x) => x.index);
        if (aligned) {
          notes.push('duplicate text decided by ordinal: all earlier messages aligned');
          status = decide(rel, m.final, notes);
        } else {
          status = 'ambiguous';
          turnPos = null;
          notes.push('duplicate text and earlier messages not aligned: no ordinal decision');
          for (const c of fits) addCand(c.pos, m.pos);
        }
      } else {
        status = decide(rel, m.final, notes);
      }
      res[m.pos] = { status, turnPos, textMatch: status === 'ambiguous' ? 'none' : textMatchOf(rel), evidence };
      if (turnPos !== null) claimed.set(turnPos, m.pos);
      if (status !== 'verified' && status !== 'partial') aligned = false;
    }

    // Pass 2: text only (counts differ, or null key). Ordering is not used.
    for (const m of mL) {
      if (res[m.pos]) continue;
      const notes = countNote ? [countNote] : [];
      if (m.key === null) notes.push('no message key: joined by text');
      const evidence = { rule: 'text-only', ordering: 'text', notes, candidates: [] };
      const fits = tL.filter((x) => !claimed.has(x.pos) && fitsRel(relate(m.nt, x.nt)));
      if (!fits.length) {
        res[m.pos] = { status: 'unlinked_stream', turnPos: null, textMatch: 'none', evidence: { ...evidence, rule: null } };
        continue;
      }
      if (fits.length > 1) {
        evidence.candidates = fits.map((x) => x.index);
        notes.push('several turns fit the text; ordering not used');
        for (const c of fits) addCand(c.pos, m.pos);
        res[m.pos] = { status: 'ambiguous', turnPos: null, textMatch: 'none', evidence };
        continue;
      }
      const t = fits[0];
      const rel = relate(m.nt, t.nt);
      res[m.pos] = { status: decide(rel, m.final, notes), turnPos: t.pos, textMatch: textMatchOf(rel), evidence };
      claimed.set(t.pos, m.pos);
    }
  }

  const links = [];
  for (const m of ms) {
    const r = res[m.pos];
    const t = r.turnPos === null ? null : ts[r.turnPos];
    const blockLinks = t && (r.status === 'verified' || r.status === 'partial') ? linkBlocks(m.blocks, t.blocks) : [];
    links.push({
      messageKey: m.key, messageIndex: m.pos, messageId: m.messageId, role: m.role,
      turnIndex: t ? t.index : null, turnId: t ? t.id : null, domId: t ? t.domId : null,
      status: r.status, textMatch: r.textMatch, blockLinks, evidence: r.evidence,
    });
  }
  for (const t of ts) {
    if (claimed.has(t.pos)) continue;
    links.push({
      messageKey: null, messageIndex: null, messageId: null, role: t.role,
      turnIndex: t.index, turnId: t.id, domId: t.domId,
      status: 'unlinked_dom', textMatch: 'none', blockLinks: [],
      evidence: { rule: null, ordering: 'none', notes: [], candidates: [], candidateOf: candidateOf.get(t.pos) ?? [] },
    });
  }

  const messageStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const blockStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const rules = { 'order+text': 0, 'text-only': 0, ordinal: 0 };
  for (const l of links) {
    messageStatus[l.status]++;
    if (l.evidence.rule) rules[l.evidence.rule]++;
    for (const b of l.blockLinks) blockStatus[b.status]++;
  }
  const summary = { messages: ms.length, turns: ts.length, messageStatus, blockStatus, rules };
  return { links, summary };
}
