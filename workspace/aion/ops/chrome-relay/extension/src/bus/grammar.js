// AION Bus — bounded command grammar (C1 owner-armed, C2 bounded parse).
//
// The ONLY inputs this module accepts are:
//   - the text of the user turn immediately preceding a commander reply, used
//     solely to decide whether the owner ARMED it (first non-empty line begins
//     with the arm token), and
//   - the text of that assistant reply, from which exactly one fenced
//     ```AION_CMD_V1 block is extracted.
// It never interprets anything else, never coerces a value, and never returns
// the surrounding transcript. Everything outside the fence is discarded.
//
// Grammar (fixed):
//   ```AION_CMD_V1
//   op: send                # send | status | cancel  (enabled set is config)
//   to: <agent_id>          # required for send/cancel; optional for status
//   text: <one line>        # send only; or the multi-line form below
//   text: <<
//   any lines
//   >>
//   hop: 0                  # optional, advisory; the bus recomputes it
//   nonce: <6-64 [A-Za-z0-9_-]>
//   ```
// Full-line `#` comments are ignored. A trailing ` # comment` is stripped from
// every key EXCEPT single-line `text`, whose value is taken verbatim.

import { COMMAND_BLOCK, CONTROL, DEFAULT_CONFIG, NONCE, OPS, REASON, isAgentId } from './contracts.js';

const KEYS = Object.freeze(['op', 'to', 'text', 'hop', 'nonce']);
const FENCE_OPEN = new RegExp('^[ \\t]{0,3}(`{3,}|~{3,})[ \\t]*' + COMMAND_BLOCK + '[ \\t]*$');
const ANY_FENCE = /^[ \t]{0,3}(`{3,}|~{3,})(.*)$/;

function reject(reason, detail) { return { ok: false, reason, detail }; }

/** C1: is this user turn owner-armed? Only the first non-empty line counts. */
export function isArmed(userText, armToken = DEFAULT_CONFIG.arm_token) {
  if (typeof userText !== 'string' || typeof armToken !== 'string' || armToken.length < 2) return false;
  const first = userText.split(/\r?\n/).find((line) => line.trim() !== '');
  if (first === undefined) return false;
  const line = first.replace(/^\s+/, '');
  if (!line.startsWith(armToken)) return false;
  const next = line.charAt(armToken.length);
  return next === '' || next === ' ' || next === '\t';
}

/**
 * Extract the fenced command blocks from assistant text.
 * Returns { blocks: [string], unterminated: bool, sawCommandFence: bool }.
 * Fences of other languages are skipped whole, so a command-looking block
 * quoted INSIDE another fence is not a command.
 */
export function extractBlocks(text) {
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let inside = null; // { marker, command, body }
  for (const line of lines) {
    if (inside) {
      const close = line.match(/^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === inside.marker[0] && close[1].length >= inside.marker.length) {
        if (inside.command) blocks.push(inside.body.join('\n'));
        inside = null;
      } else {
        inside.body.push(line);
      }
      continue;
    }
    const open = line.match(ANY_FENCE);
    if (open) {
      const command = FENCE_OPEN.test(line);
      inside = { marker: open[1], command, body: [] };
    }
  }
  return { blocks, unterminated: !!(inside && inside.command) };
}

function stripComment(value) {
  const at = value.search(/\s#/);
  return (at >= 0 ? value.slice(0, at) : value).trim();
}

/**
 * Parse one block body into a command. Strict: unknown/duplicate keys, bad
 * values, oversize text and control characters are refusals, never repairs.
 */
export function parseBlock(body, config = DEFAULT_CONFIG) {
  const maxText = config.max_text_chars ?? DEFAULT_CONFIG.max_text_chars;
  const maxBlock = config.max_block_chars ?? DEFAULT_CONFIG.max_block_chars;
  if (body.length > maxBlock) return reject(REASON.BLOCK_TOO_LARGE, `block is ${body.length} chars, max ${maxBlock}`);
  const fields = {};
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].replace(/\r$/, '');
    if (raw.trim() === '' || /^\s*#/.test(raw)) continue;
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s?(.*)$/);
    if (!m) return reject(REASON.MALFORMED_LINE, `line ${i + 1} is not "key: value"`);
    const key = m[1];
    if (!KEYS.includes(key)) return reject(REASON.UNKNOWN_KEY, `unknown key "${key.slice(0, 32)}"`);
    if (Object.hasOwn(fields, key)) return reject(REASON.DUPLICATE_KEY, `duplicate key "${key}"`);
    let value = m[2];
    if (key === 'text' && value.trim() === '<<') {
      const collected = [];
      let closed = false;
      for (i += 1; i < lines.length; i += 1) {
        const l = lines[i].replace(/\r$/, '');
        if (l.trim() === '>>') { closed = true; break; }
        collected.push(l);
      }
      if (!closed) return reject(REASON.UNTERMINATED_TEXT, 'multi-line text has no ">>" terminator');
      value = collected.join('\n');
    } else if (key !== 'text') {
      value = stripComment(value);
    }
    fields[key] = value;
  }

  const op = fields.op;
  if (op === undefined) return reject(REASON.MISSING_KEY, 'op is required');
  if (!OPS.includes(op)) return reject(REASON.BAD_VALUE, `op "${String(op).slice(0, 16)}" is not in ${OPS.join('|')}`);
  if (fields.nonce === undefined) return reject(REASON.MISSING_KEY, 'nonce is required');
  if (!NONCE.test(fields.nonce)) return reject(REASON.BAD_VALUE, 'nonce must be 6-64 chars of [A-Za-z0-9_-]');
  if (fields.to !== undefined && !isAgentId(fields.to)) return reject(REASON.BAD_VALUE, 'to must be a registered agent id shape');
  if ((op === 'send' || op === 'cancel') && fields.to === undefined) return reject(REASON.MISSING_KEY, `${op} requires to`);
  let hop = null;
  if (fields.hop !== undefined) {
    if (!/^\d{1,3}$/.test(fields.hop)) return reject(REASON.BAD_VALUE, 'hop must be a small non-negative integer');
    hop = Number(fields.hop);
  }
  let text = null;
  if (op === 'send') {
    if (fields.text === undefined) return reject(REASON.MISSING_KEY, 'send requires text');
    text = fields.text.replace(/^\n+|\s+$/g, '');
    if (text.trim() === '') return reject(REASON.BAD_VALUE, 'text is empty');
    if (text.length > maxText) return reject(REASON.TEXT_TOO_LONG, `text is ${text.length} chars, max ${maxText}`);
    if (CONTROL.test(text)) return reject(REASON.CONTROL_CHARACTERS, 'text contains control or bidi-override characters');
  } else if (fields.text !== undefined) {
    return reject(REASON.UNKNOWN_KEY, `text is not allowed for op ${op}`);
  }
  return { ok: true, command: { op, to: fields.to ?? null, text, hop_advisory: hop, nonce: fields.nonce } };
}

/**
 * Parse a commander reply. Exactly one AION_CMD_V1 block, or a refusal.
 * Never returns surrounding text.
 */
export function parseCommanderReply(assistantText, config = DEFAULT_CONFIG) {
  if (typeof assistantText !== 'string') return reject(REASON.NO_BLOCK, 'no assistant text');
  if (assistantText.length > 64 * 1024) return reject(REASON.BLOCK_TOO_LARGE, 'assistant turn too large to scan');
  const { blocks, unterminated } = extractBlocks(assistantText);
  if (unterminated) return reject(REASON.UNTERMINATED_BLOCK, 'AION_CMD_V1 fence is not closed');
  if (blocks.length === 0) return reject(REASON.NO_BLOCK, 'no AION_CMD_V1 block');
  if (blocks.length > 1) return reject(REASON.MULTIPLE_BLOCKS, `${blocks.length} AION_CMD_V1 blocks; exactly one is allowed`);
  return parseBlock(blocks[0], config);
}

/** Does this text contain anything that could be mistaken for a command block? */
export function containsCommandFence(text) {
  return extractBlocks(String(text)).blocks.length > 0 || /AION_CMD_V1/.test(String(text));
}

/**
 * Neutralise report/agent text before it re-enters the commander, so quoted
 * agent output can never carry an AION_CMD_V1 fence or start with the arm token.
 * Reports are data (DECISION §5); this makes that true at the byte level too.
 */
export function neutralize(text, armToken = DEFAULT_CONFIG.arm_token) {
  return String(text)
    .replace(new RegExp(CONTROL.source, 'g'), '')
    .replace(/AION_CMD_V1/g, 'AION_CMD_V1(quoted)')
    .replace(/(^|\n)([ \t]*)(`{3,}|~{3,})/g, (_, nl, ws, fence) => `${nl}${ws}${fence[0] === '`' ? "'''" : '^^^'}`)
    .split('\n')
    .map((line) => (line.trimStart().startsWith(armToken) ? `(quoted) ${line}` : line))
    .join('\n');
}
