# M05 ChatGPT web-app adapter (`adapter/`)

One-shot Node/Playwright CDP script that carries the exact AION-owned
message from `../AION-OUTBOUND-M05-001.md`
(correlation `AION-M05-20261016-COC-001`) into the preexisting,
authenticated **chatgpt.com web app** tab in the BFF Linux Chrome.

## Files

- `send-m05.js` — main script (dry-run default; live only with both
  flags; read-only `--read-last` / `--inspect-dom` with `--correlation`).
- `lib.js` — testable helpers (arg gating, verbatim outbound loading,
  tab selection, composer location, reply verify, sanitized receipt).
- `send-m05.test.js` — `node:test` suite (mocks + `127.0.0.1` fixture
  server only; never touches real Chrome/CDP 9244/9245).
- `fixture.html` — mock composer/assistant markup for the fixture test.
- `receipt-*.json` — written only by live runs (sanitized, no secrets).

## Usage

Libs come from `/home/box/aion-tools` (playwright 1.64.1). No install.

```sh
cd /workspace/aion/sessions/01-escape-hatch/adapter
NODE_PATH=/home/box/aion-tools/node_modules node send-m05.js        # dry-run tab detection (default)
```

Dry-run attaches to the preexisting Chrome at `http://127.0.0.1:9244`,
reports tab counts, and sends nothing. If no (or more than one)
authenticated chatgpt.com web-app tab exists, it says so and exits.

Live send (human-authorized only, after explicit confirmation) requires
BOTH flags with the exact correlation from the outbound file:

```sh
NODE_PATH=/home/box/aion-tools/node_modules node send-m05.js --live --confirm-correlation AION-M05-20261016-COC-001
```

Anything else (missing/wrong correlation, no tab, login page, ambiguous
composer, no new reply, reply without the exact `ACK-M05-COC-001` line)
fails with a clear `E_*` code. One submit, no retries. No profiles, no
cookie/token logging, no unrelated tabs, no secrets on stdout. A short
sanitized JSON receipt (`correlation`, timestamps, actual response,
scrubbed tab URL) is written to `receipt-<correlation>-<ts>.json`.

Reply detection targets the current ChatGPT DOM: turns are
`article[data-testid^="conversation-turn-"]`, assistant turns contain
`[data-message-author-role="assistant"]`, text in `.markdown`. The live
flow snapshots the assistant-turn count before submit, waits for a new
assistant turn, then waits for streaming to finish
(`[data-testid=stop-button]` disappears) and for the text to stabilize
before verifying.

No-send recovery (read-only): if a live run submitted but reported
`E_NO_RESPONSE` while ChatGPT actually replied, recover without sending
anything:

```sh
NODE_PATH=/home/box/aion-tools/node_modules node send-m05.js --read-last --correlation AION-M05-20261016-COC-001
```

It attaches over CDP, requires the single authenticated chatgpt.com tab,
locates the LAST user turn containing the correlation ID, captures the
assistant turn immediately after it, and writes a sanitized
`receipt-<correlation>-<ts>-read-last.json` (`mode: read-last`,
correlation, reply text, query/hash-stripped tab URL, UTC ISO times). It
never types, focuses, clicks or submits.

Read-only DOM inspection (no-send structure probe): same tab selection
and same no-interaction guarantees as `--read-last` (no focus, typing,
clicking, key presses, no navigation). Evaluates in the page and prints
TEXT-FREE JSON to stdout — per element matching any of `article`,
`[data-testid*="conversation-turn"]`, `[data-message-author-role]`,
`[data-turn]`, `div.whitespace-pre-wrap`, `.markdown`: `index`, `tag`,
`data-testid`, `data-message-author-role`, `data-turn`,
`hasDataMessageId` (boolean), `containsCorrelation` (boolean),
`containsAck` (boolean, text contains `ACK-M05`), `textLength`, plus
`depth` and an `ancestors` chain of tags+data-testid (no text). The
element text itself is NEVER printed. The scrubbed page URL and title
are included. Writes no receipt file:

```sh
NODE_PATH=/home/box/aion-tools/node_modules node send-m05.js --inspect-dom --correlation AION-M05-20261016-COC-001
```

## Tests

```sh
cd adapter && NODE_PATH=/home/box/aion-tools/node_modules node --test
```

Covers: dry-run default, confirmation-flag gating, missing tab, missing
composer, mismatched response, mock happy path, verbatim outbound load,
`127.0.0.1` fixture serving, receipt sanitization, read-last gating +
no-touch proof, inspect-dom gating + text-free evaluate proof + no
interaction methods called.

## Status

Tested: unit suite only (mocks/fixture). NOT yet tested against the real
chatgpt.com site — do not claim live success until a human-authorized run
produces a real receipt.
