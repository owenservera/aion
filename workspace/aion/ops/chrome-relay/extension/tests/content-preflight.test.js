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
function composer({
  text = '',
  visible = true,
  hidden = false,
  id = 'prompt-textarea',
  className = '',
  contentEditable = null,
  attrs = {}
} = {}) {
  const classes = className.split(/\s+/).filter(Boolean);
  const node = {
    hidden,
    style: visible ? {} : { display: 'none' },
    textContent: text,
    innerText: text,
    classList: { contains: (token) => classes.includes(token) },
    focus() { node.focused = true; },
    getClientRects() {
      return visible ? [{ width: 600, height: 48 }] : [];
    },
    getBoundingClientRect() {
      return visible ? { x: 0, y: 0, width: 600, height: 48 } : { x: 0, y: 0, width: 0, height: 0 };
    },
    dispatchEvent() { return true; },
    getAttribute(name) {
      if (name === 'contenteditable') return contentEditable;
      if (Object.prototype.hasOwnProperty.call(attrs, name)) return attrs[name];
      if (name === 'id') return id;
      return null;
    },
    hasAttribute(name) { return node.getAttribute(name) !== null; },
    ownerDocument: null
  };
  return node;
}

/**
 * The composer the current page renders: a ProseMirror contenteditable div with
 * an accessible name but no legacy `#prompt-textarea` id.
 */
function prosemirrorComposer({ text = '', visible = true, hidden = false, attrs = {}, contentEditable = 'true' } = {}) {
  return composer({
    text,
    visible,
    hidden,
    id: null,
    className: 'ProseMirror',
    contentEditable,
    attrs: { role: 'textbox', 'aria-label': 'Ask ChatGPT', ...attrs }
  });
}

/**
 * Selector matching for the two composer selectors content.js may use.
 *
 * Deliberately literal rather than a general CSS engine: only the forms the
 * production code names are modelled, so the stub cannot silently agree with a
 * broader selector that the code was not supposed to use.
 */
function matchesComposer(node, selector) {
  if (selector === '#prompt-textarea') return node.getAttribute('id') === 'prompt-textarea';
  if (selector === '.ProseMirror[contenteditable="true"]') {
    return node.classList.contains('ProseMirror') && node.getAttribute('contenteditable') === 'true';
  }
  return false;
}

/**
 * A submit control.
 *
 * `legacy` carries the old `data-testid`; `named` carries an exact aria-label;
 * `text` has neither and takes its accessible name from nested text. `disabled`
 * models the empty-composer state where Send exists but cannot be used yet.
 */
function sendButton({
  disabled = false,
  ariaLabel = null,
  text = 'Send',
  dataTestId = 'send-button',
  visible = true,
  hidden = false,
  attrs = {}
} = {}) {
  const node = {
    tagName: 'BUTTON',
    disabled,
    hidden,
    style: visible ? {} : { display: 'none' },
    textContent: text,
    innerText: text,
    focus() { node.focused = true; },
    getClientRects() {
      return visible ? [{ width: 40, height: 40 }] : [];
    },
    getBoundingClientRect() {
      return visible ? { x: 0, y: 0, width: 40, height: 40 } : { x: 0, y: 0, width: 0, height: 0 };
    },
    dispatchEvent() { return true; },
    getAttribute(name) {
      if (name === 'aria-label') return ariaLabel;
      if (name === 'data-testid') return dataTestId;
      if (Object.prototype.hasOwnProperty.call(attrs, name)) return attrs[name];
      return null;
    },
    hasAttribute(name) { return node.getAttribute(name) !== null; },
    ownerDocument: null
  };
  return node;
}

function matchesSend(node, selector) {
  if (!node || node.tagName !== 'BUTTON') return false;
  if (selector === '[data-testid="send-button"]') return node.getAttribute('data-testid') === 'send-button';
  if (selector === 'button[aria-label="Send"]') return node.getAttribute('aria-label') === 'Send';
  if (selector === 'button') return true;
  return false;
}

/** Build the send-control list a test asked for. */
function sendNodesFor({ send = false, sendDisabled = false } = {}) {
  if (send === 'legacy') return [sendButton({ disabled: sendDisabled })];
  if (send === 'named') return [sendButton({ disabled: sendDisabled, ariaLabel: 'Send', dataTestId: null })];
  if (send === 'text') {
    return [sendButton({ disabled: sendDisabled, ariaLabel: null, dataTestId: null, text: 'Send' })];
  }
  return [];
}

/**
 * Install a stub document, run `body`, then remove it.
 *
 * content.js reads `document` at call time, so nothing has to be installed at
 * import time and the stub cannot leak into another test file.
 */
async function withDom({
  composers = [],
  stop = false,
  send = false,
  sendDisabled = false,
  sendNodes = null,
  execCommand = true
}, body) {
  const previousDocument = globalThis.document;
  const previousInputEvent = globalThis.InputEvent;
  const inserted = [];
  const sends = sendNodes || sendNodesFor({ send, sendDisabled });
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
      if (selector === '[data-testid="send-button"]' || selector === 'button[aria-label="Send"]') {
        return sends.find((node) => matchesSend(node, selector)) || null;
      }
      if (selector === '#prompt-textarea' || selector === '.ProseMirror[contenteditable="true"]') {
        return composers.find((node) => matchesComposer(node, selector)) || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '#prompt-textarea' || selector === '.ProseMirror[contenteditable="true"]') {
        return composers.filter((node) => matchesComposer(node, selector));
      }
      if (selector === '[data-testid="send-button"]' || selector === 'button[aria-label="Send"]' || selector === 'button') {
        return sends.filter((node) => matchesSend(node, selector));
      }
      return [];
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
  await withDom({ composers: [editor], send: 'legacy' }, ({ inserted }) => {
    const fill = __testing.composerFill('probe text');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe text']);
    assert.equal(editor.textContent, 'probe text');
  });
});

/* --------------------------------------------------------------- the happy path */

test('exactly one empty visible composer is filled', async () => {
  const editor = composer();
  await withDom({ composers: [editor], send: 'legacy' }, ({ inserted }) => {
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
  await withDom({ composers: [editor], execCommand: false, send: 'legacy' }, ({ inserted }) => {
    const fill = __testing.composerFill('probe text');
    assert.equal(fill.ok, true);
    assert.deepEqual(inserted, [], 'execCommand did nothing');
    assert.equal(editor.textContent, 'probe text', 'the textContent fallback still ran');
  });
});

/* ------------------------------------------- current ProseMirror composer */

test('a legacy #prompt-textarea composer is still discovered', async () => {
  const editor = composer();
  await withDom({ composers: [editor], send: 'legacy' }, ({ inserted }) => {
    assert.equal(__testing.sendState().composer_visible_count, 1);
    assert.deepEqual(__testing.visibleComposers(), [editor]);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
  });
});

test('the current ProseMirror composer is discovered by class and editable state', async () => {
  // The live page reports class `ProseMirror` and accessible name `Ask ChatGPT`
  // with no legacy id. Discovery must accept it without guessing at a generic
  // editable region.
  const editor = prosemirrorComposer();
  await withDom({ composers: [editor], send: 'named' }, ({ inserted }) => {
    assert.equal(__testing.sendState().composer_visible_count, 1);
    const pre = __testing.preflightComposer();
    assert.equal(pre.ok, true, pre.error);
    assert.equal(pre.editor, editor);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
  });
});

test('a node matching both selectors is counted once, not twice', async () => {
  // Legacy id AND ProseMirror class on the same editable node is one composer.
  const editor = composer({ id: 'prompt-textarea', className: 'ProseMirror', contentEditable: 'true' });
  await withDom({ composers: [editor], send: 'legacy' }, () => {
    assert.equal(__testing.visibleComposers().length, 1);
    const pre = __testing.preflightComposer();
    assert.equal(pre.ok, true, pre.error);
    assert.equal(pre.composer_visible_count, 1);
  });
});

test('a generic editable decoy without composer identity is never selected', async () => {
  // A bare contenteditable region is not the composer: no legacy id, no
  // ProseMirror class. It must not be typed into even when it is the only editor.
  const decoy = composer({ id: null, className: '', contentEditable: 'true' });
  await withDom({ composers: [decoy] }, ({ inserted }) => {
    assert.deepEqual(__testing.visibleComposers(), []);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_MISSING);
    assert.deepEqual(inserted, []);
  });
});

test('a non-editable ProseMirror decoy is not counted', async () => {
  const decoy = prosemirrorComposer({ attrs: { 'aria-disabled': 'true' } });
  await withDom({ composers: [decoy] }, ({ inserted }) => {
    assert.deepEqual(__testing.visibleComposers(), []);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.code, NO_SEND.COMPOSER_MISSING);
    assert.deepEqual(inserted, []);
  });
});

test('a disabled legacy composer is not counted', async () => {
  const decoy = composer();
  decoy.disabled = true;
  await withDom({ composers: [decoy] }, ({ inserted }) => {
    assert.deepEqual(__testing.visibleComposers(), []);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.code, NO_SEND.COMPOSER_MISSING);
    assert.deepEqual(inserted, []);
  });
});

test('hidden ProseMirror clones are ignored and the visible one is chosen', async () => {
  const visible = prosemirrorComposer();
  const displayNone = prosemirrorComposer({ visible: false });
  const hiddenAttr = prosemirrorComposer({ hidden: true });
  await withDom({ composers: [visible, displayNone, hiddenAttr], send: 'named' }, () => {
    assert.deepEqual(__testing.visibleComposers(), [visible]);
    const pre = __testing.preflightComposer();
    assert.equal(pre.ok, true, pre.error);
    assert.equal(pre.editor, visible);
  });
});

test('two visible ProseMirror composers are refused as ambiguous', async () => {
  await withDom({ composers: [prosemirrorComposer(), prosemirrorComposer()] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_AMBIGUOUS);
    assert.equal(fill.composer_visible_count, 2);
    assert.deepEqual(inserted, []);
  });
});

test('an existing ProseMirror draft is preserved', async () => {
  const editor = prosemirrorComposer({ text: 'half-written operator prompt' });
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_DRAFT_PRESENT);
    assert.deepEqual(inserted, []);
    assert.equal(editor.textContent, 'half-written operator prompt');
    assert.equal(editor.focused, undefined, 'and the composer was not even focused');
  });
});

test('an unreadable ProseMirror draft refuses: unread is not empty', async () => {
  const editor = prosemirrorComposer();
  Object.defineProperty(editor, 'value', {
    get() { throw new Error('cross-origin read blocked'); }
  });
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.COMPOSER_STATE_UNKNOWN);
    assert.deepEqual(inserted, []);
  });
});

test('a running generation still refuses the ProseMirror composer', async () => {
  const editor = prosemirrorComposer();
  await withDom({ composers: [editor], stop: true }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.code, NO_SEND.GENERATION_ACTIVE);
    assert.deepEqual(inserted, []);
  });
});

/* ---------------------------------------------- send control (legacy/current) */

test('a legacy [data-testid="send-button"] is discovered', async () => {
  const editor = composer();
  await withDom({ composers: [editor], send: 'legacy' }, ({ inserted }) => {
    assert.equal(__testing.sendControls().length, 1);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
  });
});

test('the current Send button is discovered by exact accessible name', async () => {
  // UI Automation reports a Button named "Send" with no data-testid.
  const editor = prosemirrorComposer();
  await withDom({ composers: [editor], send: 'named' }, ({ inserted }) => {
    const controls = __testing.sendControls();
    assert.equal(controls.length, 1);
    assert.equal(controls[0].getAttribute('aria-label'), 'Send');
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
  });
});

test('a Send button whose name is nested text is discovered without aria', async () => {
  const editor = prosemirrorComposer();
  await withDom({ composers: [editor], send: 'text' }, ({ inserted }) => {
    const controls = __testing.sendControls();
    assert.equal(controls.length, 1);
    assert.equal(controls[0].getAttribute('aria-label'), null);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
  });
});

test('a node matching legacy and name selectors is deduped to one control', async () => {
  const both = sendButton({ ariaLabel: 'Send', dataTestId: 'send-button' });
  const editor = composer();
  await withDom({ composers: [editor], sendNodes: [both] }, () => {
    assert.deepEqual(__testing.sendControls(), [both]);
    assert.equal(__testing.preflightComposer().ok, true);
  });
});

test('non-Send and hidden buttons are not send controls', async () => {
  const send = sendButton({ ariaLabel: 'Send', dataTestId: null });
  const cancel = sendButton({ ariaLabel: 'Cancel', dataTestId: null, text: 'Cancel' });
  const hiddenSend = sendButton({ ariaLabel: 'Send', dataTestId: null, visible: false });
  const editor = composer();
  await withDom({ composers: [editor], sendNodes: [send, cancel, hiddenSend] }, () => {
    assert.deepEqual(__testing.sendControls(), [send]);
    assert.equal(__testing.preflightComposer().ok, true);
  });
});

test('two visible Send controls refuse as ambiguous before any text is typed', async () => {
  const editor = composer();
  const first = sendButton();
  const second = sendButton({ ariaLabel: 'Send', dataTestId: null });
  await withDom({ composers: [editor], sendNodes: [first, second] }, ({ inserted }) => {
    assert.equal(__testing.sendControls().length, 2);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.SEND_AMBIGUOUS);
    assert.deepEqual(inserted, [], 'no text may be inserted');
    assert.equal(editor.textContent, '', 'the composer is untouched');
  });
});

test('a missing Send control refuses before any text is typed', async () => {
  const editor = composer();
  await withDom({ composers: [editor] }, ({ inserted }) => {
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, false);
    assert.equal(fill.code, NO_SEND.SEND_MISSING);
    assert.match(fill.error, /nothing was typed or sent/);
    assert.deepEqual(inserted, [], 'no text may be inserted');
    assert.equal(editor.textContent, '', 'the composer is untouched');
    assert.equal(editor.focused, undefined, 'and it was not even focused');
  });
});

test('an empty composer may fill while Send is disabled, then the state reports disabled', async () => {
  // The live page renders Send disabled on an empty composer. Presence is what
  // the preflight needs; enablement is re-checked only after the fill.
  const editor = composer();
  await withDom({ composers: [editor], send: 'named', sendDisabled: true }, ({ inserted }) => {
    assert.equal(__testing.sendState().sendPresent, true);
    assert.equal(__testing.sendState().sendDisabled, true);
    const fill = __testing.composerFill('probe');
    assert.equal(fill.ok, true, fill.error);
    assert.deepEqual(inserted, ['probe']);
    // Still disabled after the fill: runTurn refuses at the post-fill gate.
    assert.equal(__testing.sendState().sendDisabled, true);
  });
});

test('send discovery is scoped to the composer form when one exists', async () => {
  const inForm = sendButton({ ariaLabel: 'Send', dataTestId: null });
  const outside = sendButton({ ariaLabel: 'Send', dataTestId: null });
  const form = {
    querySelectorAll: (selector) => {
      if (selector === 'button' || selector === 'button[aria-label="Send"]') {
        return [inForm].filter((node) => matchesSend(node, selector));
      }
      return [];
    }
  };
  const editor = prosemirrorComposer();
  editor.closest = (selector) => (selector === 'form' ? form : null);
  await withDom({ composers: [editor], sendNodes: [inForm, outside] }, () => {
    assert.deepEqual(__testing.sendControls(), [inForm], 'the same-named button outside the form is ignored');
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

test('the real run-turn action rejects malformed work budgets before filling', async () => {
  const onConnect = await loadContentWithChrome();
  for (const timeout_ms of [null, '300000', NaN, Infinity, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await withDom({ composers: [composer()] }, ({ inserted }) => {
      const port = connectPort(onConnect);
      const reply = port.ask({ action: 'run-turn', user_gesture: true, text: 'test', timeout_ms });
      assert.equal(reply.reason, 'invalid_work_budget');
      assert.equal(reply.submitted, false);
      assert.deepEqual(inserted, []);
    });
  }
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

/* --------------------------------------- read-only probes over the real port */

/**
 * Drain pending microtasks so a reply delivered through a promise chain lands.
 *
 * A synchronous handler answers during `ask`; a handler that returns a promise
 * answers on a later microtask. Draining both is what lets these tests hold
 * whatever shape the port listener forwards a returned value in — and what makes
 * "no reply at all" (the pre-fix defect) show up as an empty reply list rather
 * than as a race.
 */
async function drainMicrotasks() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

test('the real ping action answers with page state instead of being dropped', async () => {
  const onConnect = await loadContentWithChrome();
  await withDom({ composers: [composer()] }, async () => {
    const port = connectPort(onConnect);
    port.ask({ action: 'ping' });
    await drainMicrotasks();

    assert.equal(port.replies.length, 1, 'ping must answer exactly once');
    const reply = port.replies[0];
    assert.equal(reply.action, 'ping');
    assert.equal(reply.ok, true);
    assert.equal(reply.href, 'https://chatgpt.com/c/stub');
    assert.equal(reply.title, 'stub');
    assert.equal(reply.state.composer_visible_count, 1);
    assert.equal(reply.state.generating, false);
    assert.match(reply.note, /nothing composed or sent/);
  });
});

test('the real state action answers with sendState instead of being dropped', async () => {
  const onConnect = await loadContentWithChrome();
  await withDom({ composers: [composer()] }, async () => {
    const port = connectPort(onConnect);
    port.ask({ action: 'state' });
    await drainMicrotasks();

    assert.equal(port.replies.length, 1, 'state must answer exactly once');
    const reply = port.replies[0];
    assert.equal(reply.action, 'state');
    assert.equal(reply.ok, true);
    assert.deepEqual(reply.state, {
      generating: false,
      sendPresent: false,
      sendDisabled: true,
      sendControlCount: 0,
      composer_visible_count: 1
    });
  });
});

test('the real stop action answers instead of being dropped', async () => {
  const onConnect = await loadContentWithChrome();
  // No stop button in the DOM: the honest answer is "not generating".
  await withDom({ composers: [composer()] }, async () => {
    const port = connectPort(onConnect);
    port.ask({ action: 'stop' });
    await drainMicrotasks();

    assert.equal(port.replies.length, 1, 'stop must answer exactly once');
    const reply = port.replies[0];
    assert.equal(reply.action, 'stop');
    assert.equal(reply.ok, true);
    assert.equal(reply.what, 'not generating');
  });
});

test('a callback action still answers exactly once after a probe-style return', async () => {
  // The regression guard: the probe fix forwards a handler's RETURN value, so a
  // callback action that answers through `respond` and also returns must not be
  // answered a second time.
  const onConnect = await loadContentWithChrome();
  const editor = composer({ text: 'operator draft' });
  await withDom({ composers: [editor] }, async () => {
    const port = connectPort(onConnect);
    const reply = port.ask({
      action: 'run-turn',
      user_gesture: true,
      text: 'probe text',
      correlation_id: 'task-1'
    });
    await drainMicrotasks();

    assert.ok(reply, 'the callback action must answer');
    assert.equal(reply.action, 'run-turn');
    assert.equal(port.replies.length, 1, 'a callback handler must not be answered twice');
  });
});

test('read-final answers exactly once through its own respond path', async () => {
  const onConnect = await loadContentWithChrome();
  await withDom({ composers: [composer()] }, async () => {
    const port = connectPort(onConnect);
    const reply = port.ask({ action: 'read-final', correlation_id: 'task-1', expected_reply_token: 'ACK-1' });
    await drainMicrotasks();

    assert.ok(reply, 'read-final must answer');
    assert.equal(reply.action, 'read-final');
    assert.equal(port.replies.length, 1, 'read-final must not be answered twice');
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
