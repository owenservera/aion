/**
 * PACK-06 - readiness tri-state and document-instance binding.
 * Adapted from multi-ai-chat at upstream cdcf6a7fb05609b219fd85395a116f26476a7f92 (MIT):
 *   src/content/loginStatusStability.ts
 *   src/background/service-worker.ts (currentTopFrameDocumentId / waiter document binding)
 *
 * Pure decisions only. The caller owns Chrome APIs, messaging, storage and time.
 * No effect, no retry executor, no provider call.
 */

/**
 * Treat a mounted composer as an immediate positive signal, but do not turn a
 * short SPA remount into a logout. An explicit login/signup surface remains an
 * immediate negative. Unknown readiness reports `null` (checking), never
 * `false` (login required).
 *
 * @param {{reported?: boolean|null, missingSince?: number}} previous
 * @param {{ready: boolean|null, explicitlyLoggedOut: boolean, now: number, lossDelayMs: number}} signals
 */
export function decideLoginStatus(previous, signals) {
  if (signals.explicitlyLoggedOut) {
    return {
      state: { reported: false },
      report: previous.reported === false ? undefined : false,
    };
  }

  if (signals.ready === null) {
    return {
      state: { reported: null },
      report: previous.reported === null ? undefined : null,
    };
  }

  if (signals.ready) {
    return {
      state: { reported: true },
      report: previous.reported === true ? undefined : true,
    };
  }

  if (previous.reported === false) return { state: previous };

  const delay = Math.max(0, signals.lossDelayMs);
  const missingSince = previous.missingSince ?? signals.now;
  const remaining = Math.max(0, delay - (signals.now - missingSince));
  if (remaining > 0) {
    return {
      state: { ...previous, missingSince },
      retryInMs: remaining,
    };
  }

  return {
    state: { reported: false },
    report: false,
  };
}

/**
 * Decision half of `currentTopFrameDocumentId`. The runtime performs the
 * injection; this function only accepts a result set that proves a single
 * top-frame document.
 *
 * @param {Array<{frameId?: number, documentId?: string}>} results
 * @returns {string|undefined}
 */
export function captureTopFrameDocumentId(results) {
  const list = Array.isArray(results) ? results : [];
  const [result] = list;
  return list.length === 1 && result?.frameId === 0 && result.documentId
    ? result.documentId
    : undefined;
}

/**
 * Accept a provider message only when it comes from the exact document the
 * request was bound to, on the top frame.
 *
 * @param {{frameId?: number, documentId?: string}} sender
 * @param {{documentId?: string}} expected
 */
export function evaluateSenderBinding(sender, expected) {
  if (typeof expected?.documentId !== 'string' || !expected.documentId) {
    return { accepted: false, reason: 'binding_required' };
  }
  if (sender?.frameId !== 0) {
    return { accepted: false, reason: 'frame_not_top' };
  }
  if (typeof sender?.documentId !== 'string' || !sender.documentId) {
    return { accepted: false, reason: 'document_id_missing' };
  }
  if (sender.documentId !== expected.documentId) {
    return { accepted: false, reason: 'document_changed' };
  }
  return { accepted: true, reason: 'bound' };
}

/**
 * Reconnect/reload check: a waiter may survive only if its bound document is
 * still the current top-frame document. An unreadable current document fails
 * closed, because a missing id cannot prove continuity.
 */
export function verifyBoundDocument(boundDocumentId, currentDocumentId) {
  if (typeof boundDocumentId !== 'string' || !boundDocumentId) {
    return { keep: false, reason: 'unbound' };
  }
  if (typeof currentDocumentId !== 'string' || !currentDocumentId) {
    return { keep: false, reason: 'current_document_unknown' };
  }
  if (boundDocumentId !== currentDocumentId) {
    return { keep: false, reason: 'document_changed' };
  }
  return { keep: true, reason: 'bound' };
}
