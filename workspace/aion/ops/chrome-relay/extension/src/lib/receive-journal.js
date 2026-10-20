/**
 * AION P1 — integrated, read-only bounded observation journal.
 * Adapted from chatgpt-bridge ObservedTurnJournal at upstream
 * 0ffdae90239988f253058c05253226152acd55d2
 * src/bridge/observedTurns/observedTurnJournal.js (MIT).
 *
 * Internal receive journal; no Bus, Send or wire authority.
 * Development must inject the canonical P1 event/1 validator.
 */
export const JOURNAL_LIMITS = Object.freeze({
  retained: 200,
  page: 100,
  eventBytes: 32 * 1024,
  textChars: 16 * 1024,
});

function positiveInteger(value, fallback, maximum) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, maximum) : fallback;
}

export function boundObservedText(value, maxChars = JOURNAL_LIMITS.textChars) {
  const limit = positiveInteger(maxChars, JOURNAL_LIMITS.textChars, JOURNAL_LIMITS.textChars);
  const text = typeof value === 'string' ? value : '';
  return { text: text.slice(0, limit), truncated: text.length > limit };
}

function validIdentity(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 512;
}

/**
 * Journal identity is supplied from AION's EXACT bound session. bindingKey is
 * the opaque, canonical P1 fingerprint; pageEpoch is a separate page lifetime;
 * streamEpoch is a caller-generated *observation* cursor epoch, not a Bus op ID.
 *
 * Every appended event must already be admitted by AION P1's strict validator.
 * The module never interprets event text, event.kind or operation-shaped fields.
 */
export class BoundedReceiveJournal {
  #bindingKey;
  #pageEpoch;
  #streamEpoch;
  #validateEvent;
  #entries = [];
  #latest = 0;
  #retained;
  #maxEventBytes;
  #historyKnownComplete = false;
  #coverageIssue = '';
  #truncated = false;

  constructor({ bindingKey, pageEpoch, streamEpoch, validateEvent,
    retained = JOURNAL_LIMITS.retained,
    maxEventBytes = JOURNAL_LIMITS.eventBytes } = {}) {
    if (![bindingKey, pageEpoch, streamEpoch].every(validIdentity)) {
      throw new TypeError('exact bindingKey, pageEpoch and streamEpoch required');
    }
    if (typeof validateEvent !== 'function') {
      throw new TypeError('AION P1 event/1 validator required');
    }
    this.#bindingKey = bindingKey;
    this.#pageEpoch = pageEpoch;
    this.#streamEpoch = streamEpoch;
    this.#validateEvent = validateEvent;
    this.#retained = positiveInteger(retained, JOURNAL_LIMITS.retained, 1000);
    this.#maxEventBytes = positiveInteger(maxEventBytes, JOURNAL_LIMITS.eventBytes, JOURNAL_LIMITS.eventBytes);
  }

  metadata() {
    return {
      streamEpoch: this.#streamEpoch,
      pageEpoch: this.#pageEpoch,
      latestSequence: this.#latest,
      retainedFromSequence: this.#entries[0]?.sequence ?? this.#latest + 1,
      retainedCount: this.#entries.length,
      retentionTruncated: this.#truncated,
      complete_history: this.#historyKnownComplete && !this.#truncated && !this.#coverageIssue,
      coverageIssue: this.#coverageIssue || null,
    };
  }

  // Caller may ONLY supply completeness proved by authoritative DOM coverage,
  // never inferred from having read the current retained journal window.
  setCoverage({ complete_history = false, issue = '' } = {}) {
    this.#historyKnownComplete = complete_history === true;
    if (issue) this.#coverageIssue = String(issue).slice(0, 128);
  }

  /**
   * Arguments are internal adaptation inputs, NOT aion.conversation.event/1.
   * Reject cross-bound, remounted or stale-revision events before storage.
   * Revision equality is deduped for retained message keys only; unknown older
   * history is never asserted to be deduplicated or complete.
   */
  publish({ event, bindingKey, pageEpoch, messageKey, revision } = {}) {
    if (bindingKey !== this.#bindingKey || pageEpoch !== this.#pageEpoch) {
      return { accepted: false, reason: 'binding_or_page_epoch_mismatch' };
    }
    if (!validIdentity(messageKey) || !Number.isSafeInteger(revision) || revision < 0) {
      return { accepted: false, reason: 'invalid_message_identity_or_revision' };
    }
    if (!this.#validateEvent(event)) {
      return { accepted: false, reason: 'p1_event_validation_failed' };
    }
    let json;
    try { json = JSON.stringify(event); } catch { json = undefined; }
    if (typeof json !== 'string' || new TextEncoder().encode(json).length > this.#maxEventBytes) {
      // Never silently truncate a canonical event and then claim intact replay.
      this.#coverageIssue = 'event_unrepresentable_or_oversized';
      return { accepted: false, reason: this.#coverageIssue };
    }
    const previous = this.#entries.findLast((item) => item.messageKey === messageKey);
    if (previous && revision <= previous.revision) {
      return { accepted: false, reason: 'stale_or_duplicate_revision' };
    }

    const item = {
      streamEpoch: this.#streamEpoch,
      sequence: ++this.#latest,
      pageEpoch: this.#pageEpoch,
      messageKey,
      revision,
      event: JSON.parse(json),
    };
    this.#entries.push(item);
    if (this.#entries.length > this.#retained) {
      this.#entries.splice(0, this.#entries.length - this.#retained);
      this.#truncated = true;
      this.#historyKnownComplete = false;
    }
    return { accepted: true, cursor: { epoch: this.#streamEpoch, sequence: item.sequence } };
  }

  classifyCursor(cursor = {}) {
    const meta = this.metadata();
    const epoch = cursor?.epoch ?? '';
    const after = cursor?.sequence ?? 0;
    if (!Number.isSafeInteger(after) || after < 0 || typeof epoch !== 'string') {
      return { status: 'reset', reason: 'invalid_cursor', ...meta };
    }
    if (epoch && epoch !== this.#streamEpoch) {
      return { status: 'reset', reason: 'stream_epoch_changed', ...meta };
    }
    if (!epoch && after > 0) {
      return { status: 'reset', reason: 'missing_epoch_for_resume', ...meta };
    }
    // Check regardless of whether caller supplied the correct epoch.
    if (after > this.#latest) {
      return { status: 'reset', reason: 'sequence_ahead_of_stream', ...meta };
    }
    // Includes after=0 when older history was evicted: no initial tail
    // window may masquerade as a complete replay.
    if (after < meta.retainedFromSequence - 1) {
      return { status: 'gap', reason: 'cursor_before_retained_range', ...meta };
    }
    if (this.#coverageIssue) {
      return { status: 'gap', reason: this.#coverageIssue, ...meta };
    }
    return { status: 'ok', reason: '', ...meta };
  }

  readPage({ cursor = { epoch: '', sequence: 0 }, limit = JOURNAL_LIMITS.page } = {}) {
    const classification = this.classifyCursor(cursor);
    if (classification.status !== 'ok') {
      return { ...classification, items: [], hasMore: false, nextCursor: null };
    }
    const after = cursor.sequence ?? 0;
    const count = positiveInteger(limit, JOURNAL_LIMITS.page, 1000);
    // FIRST unseen N, never donor's tail slice(-N).
    const entries = this.#entries.filter((item) => item.sequence > after).slice(0, count);
    const nextSequence = entries.at(-1)?.sequence ?? after;
    const hasMore = nextSequence < this.#latest;
    return {
      ...classification,
      items: entries.map((entry) => ({
        ...entry, event: JSON.parse(JSON.stringify(entry.event)),
      })),
      nextCursor: { epoch: this.#streamEpoch, sequence: nextSequence },
      hasMore,
      // A page is not a whole-history proof. Read snapshot metadata separately.
      complete_history: classification.complete_history && !hasMore,
    };
  }

  snapshot({ limit = JOURNAL_LIMITS.page } = {}) {
    const meta = this.metadata();
    const status = this.classifyCursor({ epoch: this.#streamEpoch, sequence: 0 });
    if (status.status !== 'ok') {
      return { status: 'gap', reason: status.reason, ...meta, items: [], complete_history: false };
    }
    const page = this.readPage({ limit });
    return {
      status: page.status, reason: page.reason, ...meta,
      items: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore,
      complete_history: Boolean(meta.complete_history && !page.hasMore),
    };
  }
}
