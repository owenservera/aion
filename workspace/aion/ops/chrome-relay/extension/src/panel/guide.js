// AION Relay Station — human view guide.
//
// Makes the panel easier to use without giving it any new power. This module is a
// separate script on purpose: if it fails, panel.js and every operator control
// still work exactly as before.
//
// What it does:
//   - shows the next step a person could take, derived from results already on
//     the page, and moves keyboard focus there when asked;
//   - fills the EMPTY probe fields with random ids and a starter message, only
//     when the person clicks the button, and never overwrites what they typed;
//   - shows a plain "check before you send" summary and a character count;
//   - copies a result to the clipboard when the person clicks Copy.
//
// What it never does: click a button, tick the confirmation box, choose a tab,
// send a message, call the worker, or run anything on load, on focus or on a
// timer. Fields it fills still pass through panel.js validation, because it
// dispatches the same `input` event a keystroke would.

import {
  IDENTIFIER_PATTERN,
  MAX_PROMPT_LENGTH,
  UNKNOWN,
  generateProbeSet,
  nextStep,
  reviewSummary,
  starterMessage
} from './view-model.js';

function el(id) {
  return document.getElementById(id);
}

function valueOf(id) {
  const node = el(id);
  return node && typeof node.value === 'string' ? node.value : '';
}

function stateOf(id) {
  const node = el(id);
  return node && node.dataset ? node.dataset.state : undefined;
}

function listedTabs() {
  const select = el('tab-select');
  if (!select) return [];
  return Array.from(select.querySelectorAll('option')).filter((option) => option.value !== '');
}

function selectedTabLabel() {
  const select = el('tab-select');
  if (!select || select.value === '') return null;
  const option = Array.from(select.querySelectorAll('option')).find((o) => o.value === select.value);
  return option ? option.textContent : null;
}

/** Everything the guide knows, read off the page. Nothing here is remembered. */
function readInputs() {
  const select = el('tab-select');
  const hold = el('probe-hold');
  const run = el('btn-chatgpt-run');
  const confirm = el('probe-confirm');
  return {
    hostState: stateOf('result-native'),
    tabsListed: listedTabs().length,
    tabSelected: !!select && select.value !== '',
    tabState: stateOf('result-chatgpt'),
    hasText: valueOf('probe-text').trim() !== '',
    correlationValid: IDENTIFIER_PATTERN.test(valueOf('probe-correlation').trim()),
    tokenValid: IDENTIFIER_PATTERN.test(valueOf('probe-token').trim()),
    confirmed: !!confirm && confirm.checked === true,
    armed: !!run && run.disabled === false,
    probePhase: hold && hold.dataset ? hold.dataset.hold : 'clear'
  };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

let currentTarget = null;

function renderNext(step) {
  const banner = el('next-step');
  const text = el('next-step-text');
  const go = el('next-step-go');
  if (!banner || !text) return;

  banner.dataset.tone = step.tone;
  banner.dataset.step = step.id;
  text.textContent = step.text;

  currentTarget = step.target;
  if (go) go.hidden = !(step.target && el(step.target));

  // Dim steps that are still ahead. Presentation only: no control is disabled.
  const steps = document.querySelectorAll('.step');
  steps.forEach((node, index) => {
    const n = index + 1;
    node.dataset.reach = n < step.step ? 'past' : n === step.step ? 'current' : 'later';
  });
}

function renderCount() {
  const node = el('probe-text-count');
  if (!node) return;
  const length = valueOf('probe-text').length;
  node.textContent = length + ' / ' + MAX_PROMPT_LENGTH;
  node.dataset.over = length > MAX_PROMPT_LENGTH ? 'yes' : 'no';
}

function renderReview() {
  const review = reviewSummary({
    tabLabel: selectedTabLabel(),
    text: valueOf('probe-text'),
    correlation: valueOf('probe-correlation'),
    token: valueOf('probe-token')
  });

  const tab = el('review-tab');
  if (tab) tab.textContent = review.tab === UNKNOWN ? 'No tab selected' : review.tab;

  const length = el('review-length');
  if (length) {
    length.textContent = review.message_over_limit
      ? review.message_length + ' characters. Over the ' + review.message_limit + ' limit.'
      : review.message_length + ' characters (limit ' + review.message_limit + ')';
  }

  const token = el('review-token');
  if (token) {
    if (!review.correlation_valid || !review.token_valid) {
      token.textContent = 'Not ready: add a correlation id and a reply token.';
    } else if (!review.message_mentions_correlation || !review.message_mentions_token) {
      token.textContent =
        'The message does not ask for both your id and your token, so the reply would be refused. Add them to the message.';
    } else {
      token.textContent =
        'The message contains both. A reply is accepted only if it has your id and your token on a line of its own.';
    }
  }
}

function refresh() {
  renderNext(nextStep(readInputs()));
  renderCount();
  renderReview();
}

/* ------------------------------------------------------------------ *
 * Actions (each is one explicit click)
 * ------------------------------------------------------------------ */

function randomBytes(n) {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function setField(id, value) {
  const node = el(id);
  if (!node) return;
  node.value = value;
  // The same event a keystroke raises, so panel.js re-validates and re-arms itself.
  node.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillEmptyFields() {
  const generated = generateProbeSet(randomBytes);

  if (valueOf('probe-correlation').trim() === '') setField('probe-correlation', generated.correlation);
  if (valueOf('probe-token').trim() === '') setField('probe-token', generated.token);

  // The starter message asks for whatever id and token are in the fields now,
  // which may be ones the person typed themselves.
  if (valueOf('probe-text').trim() === '') {
    const correlation = valueOf('probe-correlation').trim();
    const token = valueOf('probe-token').trim();
    if (IDENTIFIER_PATTERN.test(correlation) && IDENTIFIER_PATTERN.test(token)) {
      setField('probe-text', starterMessage(correlation, token));
    }
  }
  refresh();
  const text = el('probe-text');
  if (text && typeof text.focus === 'function') text.focus();
}

function goToTarget() {
  const node = currentTarget ? el(currentTarget) : null;
  if (!node) return;
  if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'center' });
  // Focus only. Moving focus never activates a control.
  if (typeof node.focus === 'function') {
    if (!node.hasAttribute('tabindex') && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(node.tagName)) {
      node.setAttribute('tabindex', '-1');
    }
    node.focus();
  }
}

async function copyResult(targetId) {
  const status = el('copy-status');
  const source = el(targetId);
  const say = (message) => {
    if (status) status.textContent = message;
  };
  if (!source) {
    say('Nothing to copy.');
    return;
  }
  try {
    await navigator.clipboard.writeText(source.textContent || '');
    say('Copied.');
  } catch (error) {
    say('Could not copy (' + String(error && error.message ? error.message : error) + '). Select the text and copy it by hand.');
  }
}

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */

function watch() {
  for (const id of ['probe-text', 'probe-correlation', 'probe-token']) {
    const node = el(id);
    if (node) node.addEventListener('input', refresh);
  }
  for (const id of ['tab-select', 'probe-confirm']) {
    const node = el(id);
    if (node) node.addEventListener('change', refresh);
  }

  if (typeof MutationObserver === 'function') {
    // Results, the hold line and the run button are written by panel.js. The
    // guide only reads them. It writes to its own nodes, which are not observed.
    const observer = new MutationObserver(refresh);
    const options = { attributes: true, childList: true, subtree: true, characterData: true };
    for (const id of ['result-native', 'result-chatgpt', 'probe-hold', 'btn-chatgpt-run', 'tab-select']) {
      const node = el(id);
      if (node) observer.observe(node, options);
    }
  }
}

function boot() {
  const go = el('next-step-go');
  if (go) go.addEventListener('click', goToTarget);

  const generate = el('btn-generate-ids');
  if (generate) generate.addEventListener('click', fillEmptyFields);

  document.addEventListener('click', (event) => {
    const button = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('[data-copy-target]')
      : null;
    if (button) copyResult(button.getAttribute('data-copy-target'));
  });

  watch();
  refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
