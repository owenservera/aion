/**
 * PACK-04 offline fixtures. No DOM implementation, no browser, no network.
 * Run: node --test packs/PACK-04/
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractResponseContent,
  longerResponseText,
  serializeResponseText,
} from './response-serializer.js';

function text(value) {
  return { nodeType: 3, textContent: value };
}

function el(tagName, { attrs = {}, children = [] } = {}) {
  return {
    nodeType: 1,
    tagName,
    childNodes: children,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    get textContent() {
      return children.map((child) => child.textContent ?? '').join('');
    },
    querySelector(selector) {
      const wanted = new Set(
        String(selector).split(',').map((part) => part.trim().toUpperCase()).filter(Boolean),
      );
      const visit = (node) => {
        for (const child of node.childNodes ?? []) {
          if (child.nodeType === 1 && wanted.has(String(child.tagName).toUpperCase())) return child;
          const found = visit(child);
          if (found) return found;
        }
        return null;
      };
      return visit(this);
    },
  };
}

test('longerResponseText keeps the longer text and never shrinks', () => {
  assert.equal(longerResponseText('abc', 'abcd'), 'abcd');
  assert.equal(longerResponseText('abcd', 'abc'), 'abcd');
  assert.equal(longerResponseText('abcd', null), 'abcd');
  assert.equal(longerResponseText('abcd', ''), 'abcd');
  // Strictly longer wins: an equal-length rewrite keeps the cached text.
  assert.equal(longerResponseText('abcd', 'abce'), 'abcd');
});

test('code fences preserve String.replace substitution patterns', () => {
  const code = 'const a = "$&"; const b = "$`"; const c = "$\'";';
  const root = el('PRE', { children: [el('CODE', { attrs: { class: 'language-js' }, children: [text(code)] })] });
  const out = serializeResponseText(root, { tokenNonce: 'fixture' });

  assert.ok(out.startsWith('```js\n'), out);
  assert.ok(out.endsWith('\n```'), out);
  assert.ok(out.includes('$&'), 'must not expand $&');
  assert.ok(out.includes('$`'), 'must not expand $`');
  assert.ok(out.includes("$'"), "must not expand $'");
  assert.ok(!out.includes('\uE000AION_SER_'), 'protection token must not leak');
});

test('a code block containing backticks gets a longer fence', () => {
  const root = el('PRE', { children: [el('CODE', { children: [text('a ``` b')] })] });
  const out = serializeResponseText(root, { tokenNonce: 'fixture' });
  assert.ok(out.startsWith('````\n'), out);
  assert.ok(out.endsWith('\n````'), out);
});

test('tables become markdown with escaped cell content', () => {
  const root = el('TABLE', {
    children: [
      el('THEAD', {
        children: [el('TR', { children: [el('TH', { children: [text('A')] }), el('TH', { children: [text('B|c')] })] })],
      }),
      el('TBODY', {
        children: [el('TR', { children: [el('TD', { children: [text('1\\')] }), el('TD', { children: [text('2')] })] })],
      }),
    ],
  });
  const out = serializeResponseText(root, { tokenNonce: 'fixture' });
  const lines = out.split('\n');

  assert.equal(lines[0], String.raw`| A | B\|c |`);
  assert.equal(lines[1], '| --- | --- |');
  assert.equal(lines[2], String.raw`| 1\\ | 2 |`);
});

test('media-only responses produce an explicit marker', () => {
  assert.equal(extractResponseContent(el('IMG', { attrs: { alt: 'a cat' } })), '[Image generated: a cat]');
  assert.equal(extractResponseContent(el('IMG')), '[Image generated]');

  const wrapper = el('DIV', { children: [el('IMG', { attrs: { alt: 'chart' } })] });
  assert.equal(extractResponseContent(wrapper), '[Image generated: chart]');
});

test('nested lists indent by depth', () => {
  const root = el('UL', {
    children: [
      el('LI', { children: [text('one'), el('UL', { children: [el('LI', { children: [text('nested')] })] })] }),
      el('LI', { children: [text('two')] }),
    ],
  });
  assert.equal(serializeResponseText(root), '- one\n  - nested\n- two');
});

test('ordered lists number items', () => {
  const root = el('OL', {
    children: [el('LI', { children: [text('a')] }), el('LI', { children: [text('b')] })],
  });
  assert.equal(serializeResponseText(root), '1. a\n2. b');
});

test('blockquotes prefix every line', () => {
  const root = el('BLOCKQUOTE', {
    children: [el('P', { children: [text('first')] }), el('P', { children: [text('second')] })],
  });
  assert.equal(serializeResponseText(root), '> first\n>\n> second');
});

test('headings keep their level', () => {
  const root = el('DIV', {
    children: [el('H2', { children: [text('Title')] }), el('P', { children: [text('body')] })],
  });
  assert.equal(serializeResponseText(root), '## Title\n\nbody');
});

test('inline code grows its fence and pads edge backticks', () => {
  assert.equal(
    serializeResponseText(el('P', { children: [el('CODE', { children: [text('a `b` c')] })] })),
    '``a `b` c``',
  );
  assert.equal(
    serializeResponseText(el('P', { children: [el('CODE', { children: [text('`edge`')] })] })),
    '`` `edge` ``',
  );
});

test('links keep http(s) targets and drop unsafe ones', () => {
  const safe = el('P', {
    children: [
      el('A', { attrs: { href: 'https://example.com/x' }, children: [text('label')] }),
    ],
  });
  assert.equal(serializeResponseText(safe), '[label](https://example.com/x)');

  const javascript = el('P', {
    children: [el('A', { attrs: { href: 'javascript:alert(1)' }, children: [text('label')] })],
  });
  assert.equal(serializeResponseText(javascript), 'label');

  const brackets = el('P', {
    children: [el('A', { attrs: { href: 'https://example.com/a(b)' }, children: [text('a [b]')] })],
  });
  assert.equal(serializeResponseText(brackets), '[a \\[b\\]](https://example.com/a%28b%29)');
});

test('scripts, styles and aria-hidden content are omitted', () => {
  const root = el('P', {
    children: [
      el('SCRIPT', { children: [text('ignore me')] }),
      el('STYLE', { children: [text('ignore me too')] }),
      el('SPAN', { attrs: { 'aria-hidden': 'true' }, children: [text('hidden')] }),
      text('visible'),
    ],
  });
  assert.equal(serializeResponseText(root), 'visible');
});

test('inline emphasis keeps surrounding whitespace outside the markers', () => {
  const root = el('P', {
    children: [text('before '), el('STRONG', { children: [text(' bold ')] }), text(' after')],
  });
  assert.equal(serializeResponseText(root), 'before  **bold**  after');
});
