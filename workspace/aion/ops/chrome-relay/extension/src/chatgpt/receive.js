// AION Chrome Relay Station — READ-ONLY conversation receive content script.
//
// WHAT THIS FILE IS FOR
//   The page half of the P2 passive receive path. It exposes ONE more port,
//   `aion-conversation-receive`, which is strictly separate from the existing
//   `aion-chatgpt` turn port in content.js. Nothing here can compose, submit,
//   click, type or stop anything: the module it drives (providers/chatgpt/
//   passive-lifecycle.js) only reads the DOM of THIS tab.
//
// TRUST
//   The page is untrusted and never reaches this file: there is no
//   `window.addEventListener('message')`, no `postMessage` to the page and no
//   read of page-supplied identity. The only channel is the extension port,
//   which a web page cannot open.
//
// ACCOUNT REGISTRATION (the explicit, one-shot path)
//   `register-account` asks THIS page for the account address of the session
//   that is signed in here, exactly ONCE, through the bounded email-only
//   reader (providers/chatgpt/account-registration.js). It is reached ONLY by
//   an explicit `account.register` request from the owner: the watch path, the
//   reconnect path and the observation itself never call it.
//
//   The page must be EXACTLY the conversation the owner named, and an
//   incognito window is refused. No cookies API, no header sniffing, no
//   backend call: the reader performs one same-origin session lookup and
//   projects one field.
//
// ACCOUNT CONTEXT (the registered account)
//   The watch actions carry the REGISTERED account of the owner's lane as
//   CONTEXT. It says WHICH registration this observation belongs to. It is
//   NOT a promise that a particular account is signed in right now, and it
//   is never re-read per sample: a manual account switch inside a lane is
//   deliberately not detected.
//
// PROTOCOL
//   request : { id, action: 'start' | 'read' | 'replay' | 'stop' |
//               'register-account', binding, registered_account_key?,
//               account_proof?, cursor?, limit?, url? }
//   reply   : { id, ok, read_only: true, snapshot?, page?, cursor?, code? }
//   push    : { type: 'aion.conversation.hint', binding, page_epoch, cursor }
//
//   The push is DATA ONLY: it says "the conversation moved to this cursor" and
//   carries no message text. The owner pulls the canonical page itself.

import { createPassiveLifecycle, PASSIVE_CODE } from '../providers/chatgpt/passive-lifecycle.js';
import { validateConversationBinding } from '../lib/conversation-contract.js';
import { readChatGptRegistrationEmail } from '../providers/chatgpt/account-registration.js';

const PORT_NAME = 'aion-conversation-receive';
const HINT_TYPE = 'aion.conversation.hint';
/** The explicit registration action of this port. */
const REGISTER_ACTION = 'register-account';

/** One subscription per page. A second, different binding is REFUSED. */
let active = null;
/** The code of the last revocation on this page, if any. */
let lastRevocation = null;
/** Every connected receive port, so a hint can be pushed to the owner. */
const ports = new Set();
let streamCounter = 0;
let pagehideHooked = false;

/**
 * A fresh random token.
 *
 * The page epoch identifies THIS DOCUMENT: a reload or a fresh navigation
 * produces a new one, so a cursor from a previous document can never be
 * mistaken for a cursor in this one. It is generated here, not accepted from
 * the caller, and never derived from anything the page supplied.
 */
function freshToken(prefix) {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return `${prefix}-${c.randomUUID()}`;
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return null;
}

/** One page epoch per document; generated lazily, once. */
let pageEpoch = null;
function documentPageEpoch() {
  if (pageEpoch === null) pageEpoch = freshToken('page');
  return pageEpoch;
}

/** Origin + path only: query strings and fragments are page content. */
function currentUrl() {
  try {
    return `${location.origin}${location.pathname}`;
  } catch {
    return '';
  }
}

function sameBinding(a, b) {
  return Boolean(a && b)
    && a.ref === b.ref
    && a.account_key === b.account_key
    && a.conversation_id === b.conversation_id
    && a.provider === b.provider
    && a.revision === b.revision;
}

/** DATA ONLY: a hint carries no message text. */
function pushHint(hint) {
  for (const port of ports) {
    try {
      port.postMessage(hint);
    } catch {
      /* a closed port cannot be pushed to; the next read still works */
    }
  }
}

/** Drop the subscription and EVERY retained page text. */
function revokeAll(cause) {
  lastRevocation = cause;
  if (!active) return;
  const { lifecycle } = active;
  active = null;
  try {
    lifecycle.revoke(cause);
  } catch {
    /* a failed revoke must not keep the subscription alive */
  }
}

/**
 * The page is going away: the observation ends with it and nothing is kept.
 *
 * The hook is installed when the FIRST subscription starts, not when the module
 * loads: a content script that never observes a conversation never listens to
 * the page at all.
 */
function hookPagehide() {
  if (pagehideHooked) return;
  pagehideHooked = true;
  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('pagehide', () => revokeAll('page_hidden'));
  }
}

function reply(port, id, payload) {
  try {
    port.postMessage({ id, read_only: true, ...payload });
  } catch {
    /* the port closed before the reply; nothing is owed */
  }
}

/** The comparable route of a URL: origin + path, no query, no fragment. */
function canonicalRoute(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

/**
 * The EXPLICIT registration of this page's account.
 *
 * One call, one request, one field. The page must be exactly the
 * conversation the owner named, and an incognito window is refused. The
 * answer carries the address and nothing else.
 */
async function handleRegisterAccount(port, id, message) {
  const requested = typeof message?.url === 'string' ? message.url : '';
  if (!requested || canonicalRoute(requested) !== canonicalRoute(currentUrl())) {
    reply(port, id, {
      ok: false,
      code: 'registration_url_mismatch',
      reason: 'this page is not the bound conversation the owner named',
    });
    return;
  }
  if (chrome?.extension?.inIncognitoContext === true) {
    reply(port, id, {
      ok: false,
      code: 'registration_incongnito_refused',
      reason: 'an incognito window is not registered',
    });
    return;
  }
  // ONE call. No retry, no polling, no second request.
  const result = await readChatGptRegistrationEmail({ url: currentUrl() });
  if (!result.ok) {
    reply(port, id, { ok: false, code: result.code });
    return;
  }
  reply(port, id, { ok: true, email: result.email });
}

function handleStart(port, id, message) {
  const binding = message?.binding;
  if (!validateConversationBinding(binding)) {
    reply(port, id, {
      ok: false,
      code: PASSIVE_CODE.INVALID_BINDING,
      reason: 'the binding is not a canonical AION conversation binding',
    });
    return;
  }
  hookPagehide();
  lastRevocation = null;

  if (active) {
    if (sameBinding(active.binding, binding)) {
      // The SAME binding is already observed here: idempotent, and crucially
      // no SECOND observer is installed on this page.
      const state = active.lifecycle.status();
      const read = active.lifecycle.read();
      reply(port, id, {
        ok: true,
        status: state.status,
        already_active: true,
        page_epoch: state.page_epoch,
        stream_epoch: state.stream_epoch,
        binding,
        snapshot: read.ok ? (read.snapshot ?? null) : null,
      });
      return;
    }
    // A COMPETING binding for this page is refused: one page, one binding.
    reply(port, id, {
      ok: false,
      code: PASSIVE_CODE.BINDING_CONFLICT,
      reason: 'this page is already bound to another conversation; stop it before rebinding',
    });
    return;
  }

  const epoch = documentPageEpoch();
  if (!epoch) {
    reply(port, id, {
      ok: false,
      code: PASSIVE_CODE.ADAPTER_ERROR,
      reason: 'no secure randomness is available for a page epoch',
    });
    return;
  }

  streamCounter += 1;
  // The REGISTERED account of the owner's lane, sent as CONTEXT. It says
  // WHICH registration this observation belongs to; it is NOT a promise that
  // a particular account is signed in right now, and it is never re-read per
  // sample. `account_proof` is accepted as a documented compatibility alias.
  const registeredKey = typeof message?.registered_account_key === 'string'
    ? message.registered_account_key
    : (typeof message?.account_proof === 'string' ? message.account_proof : '');
  const lifecycle = createPassiveLifecycle({
    binding,
    pageEpoch: epoch,
    streamEpoch: freshToken(`stream${streamCounter}`) ?? `stream-${epoch}-${streamCounter}`,
    registeredAccountKey: registeredKey,
    getAccountKey: () => (registeredKey.length > 0 ? registeredKey : null),
    root: () => globalThis.document ?? null,
    pageUrl: () => currentUrl(),
    onHint: (hint) => pushHint(hint),
  });

  const result = lifecycle.start();
  if (!result.ok) {
    reply(port, id, {
      ok: false,
      code: result.code,
      reason: result.reason,
      status: result.status,
    });
    return;
  }
  active = { lifecycle, binding };
  reply(port, id, {
    ok: true,
    status: result.status,
    page_epoch: result.page_epoch,
    stream_epoch: result.stream_epoch,
    binding,
    baseline_captured: result.baseline_captured,
    degraded: Boolean(result.degraded),
    last_issue: result.last_issue ?? null,
    observer: result.observer,
    snapshot: result.snapshot ?? null,
  });
}

function handleRead(port, id) {
  if (!active) {
    reply(port, id, {
      ok: false,
      code: lastRevocation ? PASSIVE_CODE.REVOKED : PASSIVE_CODE.NOT_STARTED,
      reason: lastRevocation
        ? `the subscription was revoked (${lastRevocation}); no page text is retained`
        : 'no conversation subscription is active on this page',
    });
    return;
  }
  const result = active.lifecycle.read();
  if (!result.ok) {
    reply(port, id, { ok: false, code: result.code, reason: result.reason, status: result.status });
    return;
  }
  reply(port, id, {
    ok: true,
    status: result.status,
    snapshot: result.snapshot ?? null,
    cursor: result.cursor ?? null,
    coverage: result.coverage ?? null,
    last_issue: result.last_issue ?? null,
    page_epoch: result.page_epoch,
    stream_epoch: result.stream_epoch,
    binding: result.binding,
  });
}

function handleReplay(port, id, message) {
  if (!active) {
    reply(port, id, {
      ok: false,
      code: lastRevocation ? PASSIVE_CODE.REVOKED : PASSIVE_CODE.NOT_STARTED,
      reason: lastRevocation
        ? `the subscription was revoked (${lastRevocation}); no page text is retained`
        : 'no conversation subscription is active on this page',
    });
    return;
  }
  const cursor = message?.cursor && typeof message.cursor === 'object' ? message.cursor : undefined;
  const limit = Number.isSafeInteger(message?.limit) && message.limit > 0 ? message.limit : undefined;
  const result = active.lifecycle.replay({ cursor, limit });
  if (!result.ok) {
    reply(port, id, { ok: false, code: result.code, reason: result.reason, status: result.status });
    return;
  }
  reply(port, id, {
    ok: true,
    status: result.status,
    page: result.page,
    page_epoch: result.page_epoch,
    stream_epoch: result.stream_epoch,
    binding: result.binding,
  });
}

function handleStop(port, id) {
  if (!active) {
    reply(port, id, {
      ok: true,
      status: 'revoked',
      code: lastRevocation || 'subscription_stopped',
      reason: 'no conversation subscription is active on this page',
    });
    return;
  }
  const { lifecycle, binding } = active;
  active = null;
  lastRevocation = 'subscription_stopped';
  const result = lifecycle.stop('subscription_stopped');
  reply(port, id, {
    ok: true,
    status: result.status,
    code: result.code,
    page_epoch: result.page_epoch,
    stream_epoch: result.stream_epoch,
    binding,
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return;
    ports.add(port);
    port.onMessage.addListener((message) => {
      const id = message && message.id !== undefined ? message.id : null;
      const action = message && typeof message.action === 'string' ? message.action : '';
      try {
        if (action === REGISTER_ACTION) void handleRegisterAccount(port, id, message);
        else if (action === 'start') handleStart(port, id, message);
        else if (action === 'read') handleRead(port, id);
        else if (action === 'replay') handleReplay(port, id, message);
        else if (action === 'stop') handleStop(port, id);
        else {
          reply(port, id, {
            ok: false,
            code: 'unknown_action',
            reason: `no action ${JSON.stringify(action)}`,
          });
        }
      } catch (err) {
        reply(port, id, {
          ok: false,
          code: PASSIVE_CODE.ADAPTER_ERROR,
          reason: String(err && err.message ? err.message : err),
        });
      }
    });
    // A closed owner port ends the observation: the text is dropped.
    port.onDisconnect?.addListener(() => {
      ports.delete(port);
      revokeAll('port_disconnected');
    });
  });
}

// The page is going away: the observation ends with it and nothing is kept.
// The hook itself is installed by hookPagehide() when a subscription starts.

export const __testing = {
  HINT_TYPE,
  PORT_NAME,
  REGISTER_ACTION,
  sameBinding,
  freshToken,
  canonicalRoute,
};
