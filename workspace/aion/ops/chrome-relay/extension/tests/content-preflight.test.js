// Content-script composer preflight — the composing seam.
//
// This is the last gate before text is typed into a SIGNED-IN ChatGPT session, so
// it is tested on its own rather than only through the worker. A DOM stub, no
// browser, no page, no network, zero dependencies.
//
// The properties held here:
//   1. `composer_visible_count` counts VISIBLE composers, not matching nodes
//   2. anything other than exactly one visible composer refuses BEFORE any text
//      is touched
//   3. a non-empty draft is never erased
//   4. a running generation is never interrupted
//   5. every refusal is machine-readable and says nothing was sent
import { test as baseTest } from 'node:test';
import assert from 'node:assert/strict';

const TEST_TIMEOUT_MS = 5_000;
const test = (name, fn) => baseTest(name, { timeout: TEST_TIMEOUT_MS }, fn);

const content = await import('../src/chatgpt/content.js');
const { NO_SEND, __testing } = content;

/**
 * A composer node.
 *
 * `visible: false` is expressed the way a browser actually expresses it, so the
 * visibility check has something real to reason about: a zero-size layout box, an
 * inline `display:none`, or `hidden`.
 */
function composer({ text = '', visible = true, hidden = false } = {}) {
  const node = {
    hidden,
    style: visible ? {} : { display: 'none' },
    textContent: text,
    innerText: text,
    focus() { node.focused = true; },
    getClientRects() {
      return visible ? [{ width: 600, height: 48 }] : [];
    },
    getBoundingClientRect() {
      return visible ? { x: 0, y: 0, width: 600, height: 48 } : { x: 0, y: 0, width: 0, height: 0 };
    },
    dispatchEvent() { return true; },
    getAttribute() { return null; },
    ownerDocument: null
  };
  return node;
}

function button({ present = false } = {}) {
  return present ? { disabled: false } : null;
}

/**
 * Install a stub document, run `body`, then remove it.
 *
 * content.js reads `document` at call time, so nothing has to be installed at
 * import time and the stub cannot leak into another test file.
 */
async function withDom({ composers = [], stop = false, send = false, execCommand = true }, body) {
  const previousDocument = globalThis.document;
  const previousInputEvent = globalThis.InputEvent;
  const inserted = [];
  // content.js dispatches InputEvent/MouseEvent. A browser has them; Node does
  // not, and without them every dispatch throws inside content.js's own try/catch
  // and the fallback insert path reports failure AFTER it has set the text — a
  // stub artefact that would look like a real defect.
  globalThis.InputEvent = class InputEvent {
    constructor(type, init = {}) { this.type = type; this.bubbles = !!init.bubbles; }
  };
  globalThis.MouseEvent = class MouseEvent {
    constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
  };
  globalThis.document = {
    querySelector(selector) {
      if (selector === '[data-testid="stop-button"]') return stop ? {} : null;
      if (selector === '[data-testid="send-button"]') return button({ present: send });
      if (selector === '#prompt-textarea') return composers[0] || null;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '#prompt-textarea' ? composers : [];
    },
    execCommand(command, _ui, text) {
      if (!execCommand) return false;
      inserted.push(text);
      if (composers[0]) composers[0].textContent = text;
      return true;
    },
    title: 'stub'
  };
  globalThis.location = { origin: 'https://chatgpt.com', pathname: '/c/stub' };
  try {
    return await body({ inserted });
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousInputEvent === undefined) delete globalThis.InputEvent;
    else globalThis.InputEvent = previousInputEvent;
    delete globalThis.MouseEvent;
    delete globalThis.location;
  }
}

/* ------------------------------------------------------------ visibility */

test('the visible composer count counts visible composers, not matching nodes', async () => {
  const one = composer();
  const hiddenOne = composer({ visible: false });
  const ariaHidden = composer({ hidden: true });

  await withDom({ composers: [one, hiddenOne, ariaHidden] }, () => {
    assert.equal(__testing.sendState().composer_visible_count, 1);
    assert.deepEqual(__testing.visibleComposers(), [one]);
  });

  await withDom({ composers: [] }, () => {
    assert.equal(__testing.sendState().composer_visible_count, 0);
  });
});

test('visibility is judged from layout evidence, not from the selector matching', async () => {
  const zeroBox = composer();
  // Same element, but laid out with no box: present in the DOM, invisible on screen.
  zeroBox.getClientRects = () => [];
  zeroBox.getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0 });

  await withDom({ composers: [zeroBox] }, () => {
    assert.equal(__testing.isVisible(zeroBox), false);
    assert.equal(__testing.sendState().composer_visible_count, 0);
  });

  const displayNone = composer({ visible: false });
  await withDom({ composers: [displayNone] }, () => {
    assert.equal(__testing.isVisible(displayNone), false);
  });
});

/* -------------------------------------------------------------- refusals */

test('no visible composer refuses before any text is touched', async () => {
  await withDom({ composers: [] }, ({ inserted }) => {
    const state = __testing.sendState();
    assert.equal(state.composer_visible_count, 0);

    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_MISSING);
    assert.match(fill.error, /nothing was typed or sent/);
    assert.deepEqual(inserted, [], 'no text may be inserted');
  });
});

test('two visible composers refuse rather than guess which one is the operator\'s', async () => {
  await withDom({ composers: [composer(), composer()] }, ({ inserted }) => {
    assert.equal(__testing.sendState().composer_visible_count, 2);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_AMBIGUOUS);
    assert.match(fill.error, /refusing to guess/);
    assert.equal(fill.composer_visible_count, 2);
    assert.deepEqual(inserted, []);
    // Crucially: neither composer was cleared on the way to the refusal.
    assert.equal(__testing.visibleComposers().length, 2);
  });
});

test('a running generation refuses before any text is touched', async () => {
  const editor = composer();
  await withDom({ composers: [editor], stop: true }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.GENERATION_ACTIVE);
    assert.deepEqual(inserted, []);
    assert.equal(editor.textContent, '', 'the composer is untouched');
  });
});

test('an existing draft is preserved: the fill refuses instead of erasing it', async () => {
  const editor = composer({ text: 'half-written operator prompt' });
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_DRAFT_PRESENT);
    assert.match(fill.error, /refusing to erase/);
    assert.equal(fill.composer_visible_count, 1);
    assert.deepEqual(inserted, []);
    assert.equal(editor.textContent, 'half-written operator prompt', 'the operator text must survive intact');
    assert.equal(editor.focused, undefined, 'and the composer was not even focused');
  });
});

test('a whitespace-only composer is treated as empty and may be filled', async () => {
  const editor = composer({ text: '   \n  ' });
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe text');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe text']);
    assert.equal(editor.textContent, 'probe text');
  });
});

/* --------------------------------------------------------------- the happy path */

test('exactly one empty visible composer is filled', async () => {
  const editor = composer();
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const pre = __testing.preflightComposer();
    assert.equal(pre.ok, true);
    assert.equal(pre.composer_visible_count, 1);
    assert.equal(pre.editor, editor);

    const fill = __testing.composerFill('probe text');
    assert.equal(fill.ok, true);
    assert.deepEqual(inserted, ['probe text']);
    assert.equal(editor.focused, true);
  });
});

test('the fallback insert path is used when execCommand is unavailable', async () => {
  const editor = composer();
  await withDom({ composers: [editor], execCommand: false }, ({ inserted }) => {
    const fill = __testing.composerFill('probe text');
    assert.equal(fill.ok, true);
    assert.deepEqual(inserted, [], 'execCommand did nothing');
    assert.equal(editor.textContent, 'probe text', 'the textContent fallback still ran');
  });
});

/* ------------------------------------------------------------ runTurn end to end */

let freshLoads = 0;

/**
 * Import a FRESH copy of content.js with `chrome` present.
 *
 * content.js registers its port listener at module evaluation time, behind a
 * `chrome` guard, so the copy imported at the top of this file never registered
 * one. A cache-busting specifier forces a second evaluation with the guard
 * satisfied, which is what lets the real `run-turn` action be driven over the
 * real port listener — the same entry point Chrome uses. The counter keeps each
 * load distinct, since a repeated specifier would be served from cache and
 * register nothing.
 */
async function loadContentWithChrome() {
  freshLoads += 1;
  const listeners = [];
  const previousChrome = globalThis.chrome;
  globalThis.chrome = { runtime: { onConnect: { addListener: (fn) => listeners.push(fn) } } };
  try {
    await import(`../src/chatgpt/content.js?preflight-fresh=${freshLoads}`);
    assert.ok(listeners.length >= 1, 'the port listener must register when chrome is present');
    return listeners;
  } finally {
    if (previousChrome === undefined) delete globalThis.chrome; else globalThis.chrome = previousChrome;
  }
}

/**
 * A fake content port with the shape content.js actually uses: a name it
 * filters on, and an onMessage channel it subscribes to.
 *
 * The two listener sets are kept SEPARATE on purpose. Conflating them makes the
 * connect handler answer a message with `unknown_action`, which looks like a
 * content.js defect and is really a stub artefact.
 */
function connectPort(onConnect) {
  const replies = [];
  const handlers = [];
  const port = {
    name: 'aion-chatgpt',
    postMessage: (m) => replies.push(m),
    onMessage: { addListener: (fn) => handlers.push(fn) }
  };
  for (const fn of onConnect) fn(port);
  return {
    replies,
    /** Deliver one command and return the reply the action produced. */
    ask(message) {
      for (const fn of handlers) fn(message);
      return replies[0] ?? null;
    }
  };
}

test('the real run-turn action refuses a draft and types nothing', async () => {
  const onConnect = await loadContentWithChrome();
  const editor = composer({ text: 'operator draft' });

  await withDom({ composers: [editor] }, ({ inserted }) => {
    const port = connectPort(onConnect);
    const reply = port.ask({
      action: 'run-turn',
      user_gesture: true,
      text: 'probe text',
      correlation_id: 'task-1',
      expected_reply_token: 'ACK-1'
    });
    assert.ok(reply, 'the action must answer');
    assert.equal(reply.action, 'run-turn');
    assert.equal(reply.ok, false);
    assert.equal(reply.code, NO_SEND.COMPOSER_DRAFT_PRESENT);
    assert.equal(reply.no_send, true);
    assert.equal(reply.submitted, false);
    assert.equal(reply.composer_visible_count, 1);
    assert.deepEqual(inserted, [], 'no text may be inserted');
    assert.equal(editor.textContent, 'operator draft');
  });
});

test('the real run-turn action refuses an ambiguous composer set', async () => {
  const onConnect = await loadContentWithChrome();
  await withDom({ composers: [composer(), composer()] }, ({ inserted }) => {
    const port = connectPort(onConnect);
    const reply = port.ask({
      action: 'run-turn',
      user_gesture: true,
      text: 'probe text',
      correlation_id: 'task-1'
    });
    assert.ok(reply);
    assert.equal(reply.ok, false);
    assert.equal(reply.code, NO_SEND.COMPOSER_AMBIGUOUS);
    assert.equal(reply.composer_visible_count, 2);
    assert.deepEqual(inserted, []);
  });
});

/* --------------------------------------------------- fail-closed exceptions */

test('a composer whose layout throws is NOT treated as visible', async () => {
  // Fail-open here would type text into a node nobody can see.
  const hostile = composer();
  hostile.getClientRects = () => { throw new Error('layout unavailable'); };

  await withDom({ composers: [hostile] }, ({ inserted }) => {
    assert.equal(__testing.isVisible(hostile), false);
    assert.equal(__testing.sendState().composer_visible_count, 0);

    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_MISSING);
    assert.deepEqual(inserted, []);
    assert.equal(hostile.textContent, '', 'nothing may be typed');
  });
});

test('a getComputedStyle that throws refuses rather than assuming visibility', async () => {
  const node = composer();
  node.ownerDocument = {
    defaultView: {
      getComputedStyle() { throw new Error('no layout engine'); }
    }
  };
  // The node does have a box; only the throwing style read makes it unverifiable.
  node.getClientRects = () => [{ width: 600, height: 48 }];

  await withDom({ composers: [node] }, () => {
    assert.equal(__testing.isVisible(node), false, 'an unreadable layout is not evidence of visibility');
  });
});

test('a draft that cannot be read refuses: unread is not empty', async () => {
  // Returning '' on a read failure reports "empty", and empty is precisely the
  // state that authorises overwriting whatever is really in the box.
  const hostile = composer();
  Object.defineProperty(hostile, 'value', {
    get() { throw new Error('cross-origin read blocked'); }
  });

  await withDom({ composers: [hostile] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_STATE_UNKNOWN);
    assert.match(fill.error, /refusing to assume it is empty/);
    assert.deepEqual(inserted, []);
    assert.equal(__testing.sendState().composer_visible_count, 1, 'the composer itself is fine');
  });
});

test('the unreadable-draft refusal survives the real run-turn action', async () => {
  const onConnect = await loadContentWithChrome();
  const hostile = composer();
  Object.defineProperty(hostile, 'value', {
    get() { throw new Error('cross-origin read blocked'); }
  });

  await withDom({ composers: [hostile] }, ({ inserted }) => {
    const port = connectPort(onConnect);
    const reply = port.ask({
      action: 'run-turn',
      user_gesture: true,
      text: 'probe text',
      correlation_id: 'task-1'
    });
    assert.equal(reply.ok, false);
    assert.equal(reply.code, NO_SEND.COMPOSER_STATE_UNKNOWN);
    assert.equal(reply.no_send, true);
    assert.deepEqual(inserted, []);
  });
});

test('every NO_SEND code is a distinct, non-empty, machine-readable string', () => {
  const codes = Object.values(NO_SEND);
  assert.ok(codes.length >= 4);
  assert.equal(new Set(codes).size, codes.length, 'codes must be distinct');
  for (const code of codes) {
    assert.equal(typeof code, 'string');
    assert.match(code, /^[a-z0-9_]+$/, `${code} must be a stable snake_case token`);
  }
});