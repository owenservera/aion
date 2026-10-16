#!/usr/bin/env node
'use strict';
/**
 * send-m05.js — smallest one-shot Node/Playwright CDP script for the M05
 * transport verification (AION-M05-20261016-COC-001).
 *
 * DEFAULT MODE IS DRY-RUN: attaches to the preexisting local Chrome CDP
 * endpoint, lists tabs, reports whether exactly one authenticated
 * chatgpt.com WEB APP tab exists, and exits. Sends nothing.
 *
 * LIVE SEND requires BOTH flags (otherwise refused):
 *   --live --confirm-correlation AION-M05-20261016-COC-001
 *
 * READ-LAST (no-send recovery) attaches over CDP, finds the single
 * chatgpt.com tab, locates the LAST user turn containing the correlation
 * ID and captures the assistant turn immediately after it. It NEVER
 * types, focuses, clicks or submits anything:
 *   --read-last --correlation AION-M05-20261016-COC-001
 *
 * INSPECT-DOM (read-only structure probe) attaches over CDP, uses exactly
 * the same tab selection and the same no-interaction guarantees as
 * --read-last (no focus, typing, clicking, key presses, no navigation),
 * evaluates in the page and prints JSON to stdout: per-element index,
 * tag, data-testid, data-message-author-role, data-turn, data-message-id
 * presence (boolean), matchedSelectors (which inspect selector(s) matched),
 * classTokens (class tokens only, max 12), containsCorrelation (boolean),
 * containsAck (boolean, text contains 'ACK-M05'), textLength, and a depth /
 * ancestor-chain summary of tags+data-testid (no text); plus a depth-limited
 * (6 levels, max 200 nodes) 'tree' from the deepest common ancestor of
 * correlation text nodes (tag, data-testid, role, aria-label presence,
 * class tokens max 8, dir, marker booleans, textLength) and per marker text
 * node ancestor chains (tag+data-testid+classes max 4, up to 12 levels).
 * The element text itself is NEVER printed. Page URL (scrubbed) and title
 * are included. Writes no receipt file:
 *   --inspect-dom --correlation AION-M05-20261016-COC-001
 *
 * Hard rules:
 * - Message text comes ONLY from ../AION-OUTBOUND-M05-001.md (verbatim).
 * - One submit, no retries. No profiles, no cookie/token logging,
 *   no unrelated tabs, no secrets on stdout.
 *
 * Run with: NODE_PATH=/home/box/aion-tools/node_modules node send-m05.js
 * (playwright 1.64.1 from /home/box/aion-tools; no npm install needed)
 */

const fs = require('node:fs');
const path = require('node:path');
const lib = require('./lib');

function fail(code, message, extra) {
  const out = { ok: false, code, message };
  if (extra) out.extra = extra;
  console.error(JSON.stringify(out));
  process.exit(2);
}

async function dryRun(cdp) {
  // Lazy require: unit tests never touch this path (no real CDP connection).
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.connectOverCDP(cdp);
  } catch (err) {
    fail('E_CDP_CONNECT', `Cannot attach to preexisting Chrome CDP endpoint at ${cdp}: ${err.message}. Start Chrome with --remote-debugging-port first; this script never launches profiles itself.`);
  }
  try {
    const tabs = [];
    for (const ctx of browser.contexts()) {
      for (const p of ctx.pages()) {
        let url = '';
        try {
          url = p.url();
        } catch {
          url = '';
        }
        tabs.push({ url, isChatGptWebApp: lib.isChatGptWebAppTab(url) });
      }
    }
    const matches = tabs.filter((t) => t.isChatGptWebApp);
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry-run',
      cdp,
      tabCount: tabs.length,
      chatGptWebAppTabs: matches.length,
      chatGptWebAppTabUrlSafe: matches.map((t) => lib.safeTabUrl(t.url)),
      note: matches.length === 1
        ? 'Exactly one authenticated chatgpt.com web-app tab detected. Live send still requires --live --confirm-correlation.'
        : 'Live send would refuse: need exactly one authenticated chatgpt.com web-app tab.',
    }));
    process.exit(0);
  } finally {
    try {
      await browser.close();
    } catch {
      /* best effort */
    }
  }
}

async function live(args, outbound) {
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.connectOverCDP(args.cdp);
  } catch (err) {
    fail('E_CDP_CONNECT', `Cannot attach to preexisting Chrome CDP endpoint at ${args.cdp}: ${err.message}.`);
  }
  const startedAt = new Date().toISOString();
  try {
    const receipt = await lib.runOnce(browser, {
      message: outbound.message,
      correlation: outbound.correlation,
      expectedReply: outbound.expectedReply,
      timeoutMs: args.timeoutMs,
    });
    const fname = `receipt-${outbound.correlation}-${startedAt.replace(/[:.]/g, '-')}.json`;
    const fpath = path.join(args.receiptDir, fname);
    fs.writeFileSync(fpath, JSON.stringify(receipt, null, 2) + '\n');
    console.log(JSON.stringify({ ok: true, receiptFile: fname, receipt }));
    process.exit(0);
  } catch (err) {
    if (err instanceof lib.AdapterError) {
      // Record a sanitized failure receipt (no secrets, URL scrubbed).
      try {
        const fname = `receipt-${outbound.correlation}-${startedAt.replace(/[:.]/g, '-')}-FAILED.json`;
        fs.writeFileSync(
          path.join(args.receiptDir, fname),
          JSON.stringify({
            tool: 'aion-m05-chatgpt-webapp-adapter',
            mode: 'live',
            correlation: outbound.correlation,
            matched: false,
            code: err.code,
            message: err.message,
            startedAt,
            endedAt: new Date().toISOString(),
          }, null, 2) + '\n',
        );
      } catch {
        /* best effort */
      }
      fail(err.code, err.message);
    }
    fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
  } finally {
    try {
      await browser.close();
    } catch {
      /* best effort */
    }
  }
}

async function readLast(args, correlation) {
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.connectOverCDP(args.cdp);
  } catch (err) {
    fail('E_CDP_CONNECT', `Cannot attach to preexisting Chrome CDP endpoint at ${args.cdp}: ${err.message}.`);
  }
  const startedAt = new Date().toISOString();
  try {
    // No-send path: never types, focuses, clicks or submits (see lib.runReadLast).
    const receipt = await lib.runReadLast(browser, { correlation });
    const fname = `receipt-${correlation}-${startedAt.replace(/[:.]/g, '-')}-read-last.json`;
    const fpath = path.join(args.receiptDir, fname);
    fs.writeFileSync(fpath, JSON.stringify(receipt, null, 2) + '\n');
    console.log(JSON.stringify({ ok: true, receiptFile: fname, receipt }));
    process.exit(0);
  } catch (err) {
    if (err instanceof lib.AdapterError) {
      try {
        const fname = `receipt-${correlation}-${startedAt.replace(/[:.]/g, '-')}-read-last-FAILED.json`;
        fs.writeFileSync(
          path.join(args.receiptDir, fname),
          JSON.stringify({
            tool: 'aion-m05-chatgpt-webapp-adapter',
            mode: 'read-last',
            correlation,
            matched: false,
            code: err.code,
            message: err.message,
            startedAt,
            endedAt: new Date().toISOString(),
          }, null, 2) + '\n',
        );
      } catch {
        /* best effort */
      }
      fail(err.code, err.message);
    }
    fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
  } finally {
    try {
      await browser.close();
    } catch {
      /* best effort */
    }
  }
}

async function inspectDom(args, correlation) {
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.connectOverCDP(args.cdp);
  } catch (err) {
    fail('E_CDP_CONNECT', `Cannot attach to preexisting Chrome CDP endpoint at ${args.cdp}: ${err.message}.`);
  }
  try {
    // Read-only path: same tab selection and same no-interaction
    // guarantees as --read-last (see lib.runInspectDom). Evaluate-only:
    // no focus, typing, clicking, key presses, no navigation.
    // Prints TEXT-FREE JSON to stdout; writes no receipt file.
    const summary = await lib.runInspectDom(browser, { correlation });
    console.log(JSON.stringify({ ok: true, ...summary }));
    process.exit(0);
  } catch (err) {
    if (err instanceof lib.AdapterError) fail(err.code, err.message);
    fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
  } finally {
    try {
      await browser.close();
    } catch {
      /* best effort */
    }
  }
}

async function main() {
  const args = lib.parseArgs(process.argv.slice(2));
  // Read-last (no-send) path takes precedence over dry-run; live gate unchanged.
  if (args.readLast) {
    let correlation = args.correlation ?? args.confirmCorrelation;
    try {
      const checked = lib.assertReadLastConfirmed(
        { readLast: true, correlation },
        lib.EXPECTED_CORRELATION,
      );
      correlation = checked.correlation;
    } catch (err) {
      if (err instanceof lib.AdapterError) fail(err.code, err.message);
      fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
    }
    await readLast(args, correlation);
    return;
  }
  // Inspect-dom (read-only) path: same tab selection + no-interaction
  // guarantees as read-last; takes precedence over dry-run/live.
  if (args.inspectDom) {
    let correlation = args.correlation ?? args.confirmCorrelation;
    try {
      const checked = lib.assertInspectDomConfirmed(
        { inspectDom: true, correlation },
        lib.EXPECTED_CORRELATION,
      );
      correlation = checked.correlation;
    } catch (err) {
      if (err instanceof lib.AdapterError) fail(err.code, err.message);
      fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
    }
    await inspectDom(args, correlation);
    return;
  }
  if (!args.live) {
    await dryRun(args.cdp);
    return;
  }
  // Live path: load outbound FIRST (refuses to fabricate), then gate on flags.
  let outbound;
  try {
    outbound = lib.loadOutbound(args.outboundFile);
  } catch (err) {
    if (err instanceof lib.AdapterError) fail(err.code, err.message);
    fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
  }
  try {
    lib.assertLiveConfirmed(args, outbound.correlation);
  } catch (err) {
    if (err instanceof lib.AdapterError) fail(err.code, err.message);
    fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`);
  }
  await live(args, outbound);
}

if (require.main === module) {
  main().catch((err) => fail('E_UNEXPECTED', `Unexpected failure: ${err && err.message}`));
}
