// AION Bus — commander watcher, page side (READ-ONLY). ChatGPT.com specific.
//
// Answers the `commander-scan` port action. It reads the ordered turns the
// content script already reads for correlation, pairs each user turn with the
// assistant turn after it, and returns ONLY:
//   - a continuity signature per pair (FNV-1a over the two texts; not a digest),
//   - the user turn's first line IF AND ONLY IF it begins with the arm token
//     (that line is the owner's instruction to the bus; nothing else of the
//     user's text leaves the page),
//   - the AION_CMD_V1 fenced blocks of the assistant turn, re-fenced, and
//     nothing else of the assistant's text.
// Pairs at or before the baseline are not returned. A baseline that is no
// longer visible (virtualised, edited, navigated) returns NO pairs and says
// so, so the worker re-baselines instead of guessing (fail closed: a gap is
// reported as undelivered, never replayed).
//
// It composes nothing, clicks nothing, stores nothing.

import { extractBlocks } from '../bus/grammar.js';
import { COMMAND_BLOCK, fnv1a } from '../bus/contracts.js';

export const MAX_SCAN_PAIRS = 10;
export const MAX_HEAD_CHARS = 200;

function firstLine(text) {
  return (String(text).split(/\r?\n/).find((line) => line.trim() !== '') ?? '').trim();
}

/**
 * Pure scan over `[{ role: 'user'|'assistant', text }]` in document order.
 * `generating` drops a trailing pair whose answer is still being written.
 */
export function scanTurns(blocks, { baseline_sig = null, arm_token = 'AION>', generating = false, max_pairs = MAX_SCAN_PAIRS } = {}) {
  const pairs = [];
  const seen = new Map();
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].role !== 'user') continue;
    // The answer is every assistant block up to the next user turn.
    let j = i + 1;
    const answer = [];
    while (j < blocks.length && blocks[j].role !== 'user') { if (blocks[j].role === 'assistant') answer.push(blocks[j].text); j += 1; }
    const userText = String(blocks[i].text);
    const assistantText = answer.join('\n');
    const base = `cs-${fnv1a(userText)}${fnv1a(assistantText)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    pairs.push({ sig: n === 1 ? base : `${base}-${n}`, userText, assistantText, complete: answer.length > 0, last: false });
  }
  if (pairs.length) pairs[pairs.length - 1].last = true;
  const tailSig = pairs.length ? pairs[pairs.length - 1].sig : 'cs-empty';
  let start = 0;
  let baselineFound = baseline_sig === null;
  if (baseline_sig !== null) {
    if (baseline_sig === 'cs-empty') { baselineFound = true; start = 0; }
    else {
      const at = pairs.map((p) => p.sig).lastIndexOf(baseline_sig);
      if (at >= 0) { baselineFound = true; start = at + 1; }
    }
  }
  const out = [];
  if (baselineFound && baseline_sig !== null) {
    for (const pair of pairs.slice(start)) {
      if (!pair.complete || (pair.last && generating)) break; // never read an unfinished answer
      const head = firstLine(pair.userText);
      const armed = head.startsWith(arm_token) && [undefined, '', ' ', '\t'].includes(head.charAt(arm_token.length) || '');
      const { blocks: cmdBlocks } = extractBlocks(pair.assistantText);
      out.push({
        turn_sig: pair.sig,
        user_head: armed ? head.slice(0, MAX_HEAD_CHARS) : '',
        assistant_text: cmdBlocks.map((b) => `\`\`\`${COMMAND_BLOCK}\n${b}\n\`\`\``).join('\n'),
        block_count: cmdBlocks.length,
      });
      if (out.length >= max_pairs) break;
    }
  }
  return { ok: true, pair_count: pairs.length, tail_sig: tailSig, baseline_found: baselineFound, pairs: out, generating: !!generating };
}
