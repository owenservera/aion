/**
 * PACK-04 - pure DOM-to-text response serialization.
 * Adapted from multi-ai-chat/src/content/responseSerializer.ts at upstream
 * cdcf6a7fb05609b219fd85395a116f26476a7f92 (MIT).
 *
 * Scope: text fidelity at the read boundary only. No observation, no anchoring,
 * no Send/Stop, no retry, no effect, no storage, no network.
 *
 * Node contract: a node is any object with `nodeType`, and for elements
 * `tagName`, `childNodes`, `textContent` and `getAttribute(name)`. Real DOM
 * nodes satisfy this; tests use a minimal fake tree.
 */

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'DD',
  'DETAILS',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'HEADER',
  'MAIN',
  'NAV',
  'P',
  'SECTION',
]);
const OMITTED_TAGS = new Set(['BUTTON', 'NOSCRIPT', 'SCRIPT', 'STYLE', 'SVG', 'TEMPLATE']);
const TABLE_SECTION_TAGS = new Set(['TBODY', 'TFOOT', 'THEAD']);

const PROTECTED_PREFIX = '\uE000AION_SER_';
const PROTECTED_SUFFIX = '\uE001';

/**
 * Which text to hand back when a response is finalized.
 *
 * Measured on ChatGPT: the stop control disappears while only 39 of the
 * eventual 301 characters have rendered, and the rest lands about 1s later.
 * The "still generating" signal can therefore end before the last render
 * commits, and shipping text cached mid-stream truncates the answer - in the
 * worst case down to its opening line. Streaming is append-only, so the longer
 * of the two is the complete one.
 */
export function longerResponseText(cached, fresh) {
  return fresh && fresh.length > cached.length ? fresh : cached;
}

/**
 * Text for a response element, falling back to an explicit media marker when
 * the provider renders generated media outside the Markdown root.
 */
export function extractResponseContent(response, selectContentRoot = (root) => root) {
  const contentRoot = selectContentRoot(response);
  const text = serializeResponseText(contentRoot);
  if (text) return text;

  const responseTag = typeof response.tagName === 'string' ? response.tagName.toUpperCase() : '';
  const asset = ['IMG', 'CANVAS', 'VIDEO'].includes(responseTag)
    ? response
    : response.querySelector?.('img, canvas, video') ?? null;
  if (!asset) return null;
  const alt = asset.getAttribute?.('alt')?.trim() ?? '';
  return alt ? `[Image generated: ${alt}]` : '[Image generated]';
}

/**
 * Serialize an element subtree to Markdown-ish text.
 *
 * Protected code blocks are replaced by a per-call token and restored with a
 * replacer *function*: `$&`, `$'` and `` $` `` inside a code block are
 * substitution patterns for String.replace and would otherwise rewrite the
 * code being restored. The donor used a fixed token; a per-call nonce keeps the
 * same rule without letting provider text collide with the sentinel.
 */
export function serializeResponseText(root, { tokenNonce = '' } = {}) {
  const context = {
    protectedBlocks: [],
    nonce: tokenNonce || Math.random().toString(36).slice(2, 10),
  };
  const serialized = normalizeDocument(serializeNode(root, context));
  return context.protectedBlocks.reduce(
    (text, block, index) => text.replace(protectedToken(context, index), () => block),
    serialized,
  );
}

function serializeNode(node, context) {
  if (!node) return '';
  if (node.nodeType === TEXT_NODE) return normalizeText(node.textContent ?? '');
  const element = node;
  if (node.nodeType !== ELEMENT_NODE && node.nodeType !== undefined) return '';
  if (typeof element.tagName !== 'string') return '';
  if (OMITTED_TAGS.has(tagName(element)) || attribute(element, 'aria-hidden') === 'true') return '';
  if (!element.childNodes) return normalizeText(element.textContent ?? '');

  const tag = tagName(element);
  if (tag === 'BR') return '\n';
  if (tag === 'HR') return block('---');
  if (tag === 'PRE') return block(protectCodeBlock(element, context));
  if (tag === 'TABLE') return block(tableToMarkdown(element));
  if (tag === 'UL' || tag === 'OL') return block(serializeList(element, tag === 'OL', context, 0));
  if (tag === 'BLOCKQUOTE') return block(serializeBlockquote(element, context));
  if (/^H[1-6]$/.test(tag)) {
    const content = serializeChildren(element, context).trim();
    return content ? block(`${'#'.repeat(Number(tag[1]))} ${content}`) : '';
  }

  const content = serializeChildren(element, context);
  if (tag === 'STRONG' || tag === 'B') return wrapInline(content, '**');
  if (tag === 'EM' || tag === 'I') return wrapInline(content, '*');
  if (tag === 'DEL' || tag === 'S' || tag === 'STRIKE') return wrapInline(content, '~~');
  if (tag === 'CODE') return inlineCode(element.textContent ?? content);
  if (tag === 'A') return serializeLink(element, content);
  if (tag === 'IMG' || tag === 'CANVAS' || tag === 'VIDEO') return '';
  if (tag === 'LI') return block(content);
  return BLOCK_TAGS.has(tag) ? block(content) : content;
}

function serializeChildren(element, context) {
  let output = '';
  for (const child of Array.from(element.childNodes ?? [])) output += serializeNode(child, context);
  return output;
}

function serializeBlockquote(element, context) {
  const content = normalizeDocument(serializeChildren(element, context));
  if (!content) return '';
  return content
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function serializeList(element, ordered, context, depth) {
  const items = directChildElements(element).filter((child) => tagName(child) === 'LI');
  return items
    .map((item, index) => serializeListItem(item, ordered ? `${index + 1}.` : '-', context, depth))
    .filter(Boolean)
    .join('\n');
}

function serializeListItem(item, marker, context, depth) {
  let content = '';
  const nested = [];
  for (const child of Array.from(item.childNodes ?? [])) {
    if (child.nodeType === ELEMENT_NODE) {
      const childTag = tagName(child);
      if (childTag === 'UL' || childTag === 'OL') {
        const nestedList = serializeList(child, childTag === 'OL', context, depth + 1);
        if (nestedList) nested.push(nestedList);
        continue;
      }
    }
    content += serializeNode(child, context);
  }

  const indent = '  '.repeat(depth);
  const continuationIndent = `${indent}${' '.repeat(marker.length + 1)}`;
  const lines = normalizeDocument(content)
    .split('\n')
    .filter((line, index, all) => line || (index > 0 && index < all.length - 1));
  const first = lines.shift() ?? '';
  const output = [`${indent}${marker}${first ? ` ${first}` : ''}`];
  output.push(...lines.map((line) => `${continuationIndent}${line}`));
  output.push(...nested);
  return output.join('\n');
}

function tableToMarkdown(table) {
  const rows = tableRows(table)
    .map((row) => directChildElements(row).filter((cell) => ['TH', 'TD'].includes(tagName(cell))).map(tableCellText))
    .filter((row) => row.length > 0);
  if (rows.length === 0) return '';

  const width = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => [...row, ...Array.from({ length: width - row.length }, () => '')]);
  const line = (cells) => `| ${cells.join(' | ')} |`;
  const [header, ...body] = normalizedRows;
  return [line(header), line(Array.from({ length: width }, () => '---')), ...body.map(line)].join('\n');
}

function tableRows(table) {
  const rows = [];
  const visit = (container) => {
    for (const child of directChildElements(container)) {
      const tag = tagName(child);
      if (tag === 'TR') rows.push(child);
      else if (TABLE_SECTION_TAGS.has(tag)) visit(child);
    }
  };
  visit(table);
  return rows;
}

function tableCellText(cell) {
  const text = serializeTableCellChildren(cell).replace(/\s+/g, ' ').trim();
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

function serializeTableCellChildren(element) {
  let output = '';
  for (const child of Array.from(element.childNodes ?? [])) {
    if (child.nodeType === TEXT_NODE) {
      output += child.textContent ?? '';
      continue;
    }
    if (child.nodeType !== ELEMENT_NODE || typeof child.tagName !== 'string') continue;
    const tag = tagName(child);
    if (OMITTED_TAGS.has(tag)) continue;
    if (tag === 'BR') output += ' ';
    else output += ` ${serializeTableCellChildren(child)} `;
  }
  return output;
}

function protectCodeBlock(element, context) {
  const codeElement = firstDescendantByTag(element, 'CODE');
  const code = (codeElement?.textContent ?? element.textContent ?? '').replace(/\r\n?/g, '\n');
  const language = codeLanguage(codeElement ?? element);
  const longestFence = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(Math.max(3, longestFence + 1));
  const blockText = `${fence}${language ? language : ''}\n${code}${code.endsWith('\n') ? '' : '\n'}${fence}`;
  const index = context.protectedBlocks.push(blockText) - 1;
  return protectedToken(context, index);
}

function inlineCode(value) {
  const code = value.replace(/\s*\n\s*/g, ' ');
  if (!code) return '';
  const longestFence = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(Math.max(1, longestFence + 1));
  const needsPadding = /^\s|\s$|^`|`$/.test(code);
  return `${fence}${needsPadding ? ' ' : ''}${code}${needsPadding ? ' ' : ''}${fence}`;
}

function serializeLink(element, content) {
  const label = normalizeText(element.textContent ?? content).trim();
  const href = safeHttpUrl(attribute(element, 'href'));
  if (!label) return href ?? '';
  if (!href || label === href) return label;
  const escapedLabel = label.replace(/(\\|\[|\])/g, '\\$1');
  const escapedHref = href.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');
  return `[${escapedLabel}](${escapedHref})`;
}

function safeHttpUrl(value) {
  if (!value || Array.from(value).some((character) => character.charCodeAt(0) <= 31)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function codeLanguage(element) {
  const className = attribute(element, 'class') ?? '';
  const classMatch = className.match(/(?:^|\s)language-([\w+-]+)/i);
  const candidate = classMatch?.[1] ?? attribute(element, 'data-language') ?? '';
  return /^[\w+-]+$/.test(candidate) ? candidate : '';
}

function firstDescendantByTag(element, wantedTag) {
  for (const child of directChildElements(element)) {
    if (tagName(child) === wantedTag) return child;
    const descendant = firstDescendantByTag(child, wantedTag);
    if (descendant) return descendant;
  }
  return undefined;
}

function directChildElements(element) {
  return Array.from(element.childNodes ?? []).filter(
    (child) => child.nodeType === ELEMENT_NODE && typeof child.tagName === 'string',
  );
}

function wrapInline(content, marker) {
  const leading = content.match(/^\s*/)?.[0] ?? '';
  const trailing = content.match(/\s*$/)?.[0] ?? '';
  const core = content.slice(leading.length, content.length - trailing.length);
  return core ? `${leading}${marker}${core}${marker}${trailing}` : content;
}

function block(content) {
  const normalized = content.replace(/^\n+|\n+$/g, '');
  return normalized ? `\n\n${normalized}\n\n` : '';
}

function normalizeText(value) {
  return value.replace(/[\t\r\n ]+/g, ' ');
}

function normalizeDocument(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => (line.trim() ? line.replace(/[\t ]+$/g, '') : ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function attribute(element, name) {
  try {
    return element.getAttribute?.(name) ?? undefined;
  } catch {
    return undefined;
  }
}

function tagName(element) {
  return element.tagName.toUpperCase();
}

function protectedToken(context, index) {
  return `${PROTECTED_PREFIX}${context.nonce}_${index}${PROTECTED_SUFFIX}`;
}
