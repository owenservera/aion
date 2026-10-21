// Cross-layer correlation as scored hypotheses, never asserted facts.
//
//   action -> stream   causal vs merely temporal (precedence, latency, intervening actions,
//                      initiator type, action kind)
//   entity -> element  which rendered element shows which entity/stream: TF-IDF weighted
//                      salient-value overlap + text shingle containment + activity overlap
//   payload <-> UI     final assembled content vs final rendered text (agreement / divergence)
// Each hypothesis carries features, score and a status: likely | ambiguous | conflict | weak.
import { shingles, containment } from './identity.mjs';

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const STREAMING = new Set(['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET']);

export function correlateActions(actions, streams, { windowMs = 3000 } = {}) {
  const hyps = [];
  const acts = actions.filter((a) => ['click', 'enter', 'submit', 'scroll', 'toggle', 'input'].includes(a.kind)).sort((a, b) => a.t - b.t);
  for (const s of streams) {
    if (!s.startedT) continue;
    const prior = acts.filter((a) => a.t <= s.startedT + 50 && s.startedT - a.t <= windowMs);
    if (!prior.length) continue;
    const cands = prior.map((a) => {
      const dt = Math.max(0, s.startedT - a.t);
      const intervening = acts.filter((b) => b.t > a.t && b.t <= s.startedT).length;
      const kindW = { click: 1.2, enter: 1.4, submit: 1.5, scroll: 0.6, toggle: 0.7, input: 0.2 }[a.kind] ?? 0.3;
      const x = 2.2 - dt / 700 - 1.6 * intervening + kindW + (s.initiator === 'script' ? 0.4 : s.initiator === 'parser' ? -0.8 : 0) + (STREAMING.has(s.transport) ? 0.3 : 0) - (s.resourceType === 'Image' ? 1 : 0);
      return { action: a, dt, intervening, score: sigmoid(x - 1.5) };
    }).sort((a, b) => b.score - a.score);
    const best = cands[0];
    const second = cands[1];
    const causal = best.score >= 0.7 && best.intervening === 0;
    hyps.push({ kind: 'action_causes_request', t: s.startedT, from: { actionSeq: best.action.seq, kind: best.action.kind, label: best.action.target?.label }, to: { sid: s.sid }, score: +best.score.toFixed(3), relation: causal ? 'causal' : 'temporal', features: { latencyMs: best.dt, interveningActions: best.intervening, initiator: s.initiator ?? null }, status: second && best.score - second.score < 0.1 ? 'ambiguous' : best.score >= 0.6 ? 'likely' : 'weak' });
  }
  return hyps;
}

// Salient values of an object: long-ish strings and distinctive numbers, flattened.
function salient(obj, out = [], depth = 0) {
  if (depth > 6 || obj === null || obj === undefined) return out;
  if (typeof obj === 'string') { const s = obj.trim(); if (s.length >= 3 && s.length <= 4000 && !/^[0-9a-f-]{20,}$/i.test(s)) out.push(s); return out; }
  if (typeof obj === 'number') { if (Math.abs(obj) >= 10 || !Number.isInteger(obj)) out.push(String(obj), obj.toFixed(2)); return out; }
  if (Array.isArray(obj)) { for (const x of obj.slice(0, 50)) salient(x, out, depth + 1); return out; }
  if (typeof obj === 'object') for (const v of Object.values(obj)) salient(v, out, depth + 1);
  return out;
}

const tok = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}.]+/u).filter((t) => t.length >= 2);

// subjects: [{ id, kind: 'entity'|'stream', attrs|text, t0, t1 }] ; elements: [{ id, text, firstT, lastT }]
export function correlateRendered(subjects, elements, { minScore = 0.35 } = {}) {
  // Document frequency of tokens across rendered elements (specificity).
  const df = new Map();
  const elTok = elements.map((e) => { const ts = new Set(tok(e.text ?? '')); for (const t of ts) df.set(t, (df.get(t) ?? 0) + 1); return ts; });
  const elSh = elements.map((e) => shingles(e.text ?? ''));
  const N = Math.max(1, elements.length);
  const idf = (t) => Math.log((N + 1) / ((df.get(t) ?? 0) + 0.5));
  const hyps = [];
  for (const s of subjects) {
    const vals = s.text ? [s.text] : salient(s.attrs);
    const sTok = new Set(vals.flatMap(tok));
    if (!sTok.size) continue;
    const sSh = shingles(vals.filter((v) => v.length > 20).join(' '));
    const totalW = [...sTok].reduce((a, t) => a + idf(t), 0) || 1;
    const scored = elements.map((e, i) => {
      let w = 0; for (const t of sTok) if (elTok[i].has(t)) w += idf(t);
      const tfidf = w / totalW;
      const shC = sSh.size ? containment(sSh, elSh[i]) : 0;
      const overlap = s.t0 && e.firstT ? (e.lastT >= s.t0 - 500 && e.firstT <= (s.t1 ?? s.t0) + 5000 ? 1 : 0) : 0.5;
      const score = 0.5 * tfidf + 0.35 * shC + 0.15 * overlap;
      return { element: e, score, features: { tfidf: +tfidf.toFixed(3), shingleContainment: +shC.toFixed(3), activityOverlap: overlap } };
    }).filter((x) => x.score >= minScore).sort((a, b) => b.score - a.score);
    if (!scored.length) { hyps.push({ kind: 'rendered_as', from: { [s.kind]: s.id }, to: null, score: 0, status: 'no_rendered_match', features: {} }); continue; }
    // Prefer the most specific element among near-equal scores (a child block over its container).
    const best = scored[0];
    const second = scored.find((x) => x.element.id !== best.element.id && !(x.element.text ?? '').includes(best.element.text ?? '\u0000') && !(best.element.text ?? '').includes(x.element.text ?? '\u0000'));
    hyps.push({ kind: 'rendered_as', t: Number.isFinite(s.t0) && Number.isFinite(best.element.firstT) ? Math.max(s.t0, best.element.firstT) : null, from: { [s.kind]: s.id }, to: { element: best.element.id }, score: +best.score.toFixed(3), features: best.features, status: second && best.score - second.score < 0.08 ? 'ambiguous' : best.score >= 0.6 ? 'likely' : 'weak', alternatives: scored.slice(1, 3).map((x) => ({ element: x.element.id, score: +x.score.toFixed(3) })) });
  }
  // Conflicts: one element claimed (likely) by several different subjects.
  const claims = new Map();
  for (const hy of hyps) if (hy.to && hy.status === 'likely') { const k = hy.to.element; if (!claims.has(k)) claims.set(k, []); claims.get(k).push(hy); }
  for (const [, list] of claims) if (list.length > 1) { const top = Math.max(...list.map((x) => x.score)); for (const hy of list) if (top - hy.score < 0.1) { hy.status = 'conflict'; hy.conflictsWith = list.filter((x) => x !== hy).map((x) => x.from); } }
  return hyps;
}

// Partial -> final: does what the payload finally said match what the page finally shows?
export function reconcileFinal(assembledText, renderedText) {
  const a = shingles(assembledText ?? ''), r = shingles(renderedText ?? '');
  const forward = containment(a, r), backward = containment(r, a);
  const agreement = +Math.min(forward, Math.max(backward, forward * 0.9)).toFixed(3);
  return { agreement, payloadInUi: +forward.toFixed(3), uiInPayload: +backward.toFixed(3), status: forward >= 0.9 ? 'consistent' : forward >= 0.5 ? 'partially_rendered' : 'diverges' };
}
