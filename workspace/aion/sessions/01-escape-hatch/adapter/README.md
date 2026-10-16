# M05 ChatGPT web-app adapter (`adapter/`)

One-shot Node/Playwright CDP script that carries the exact AION-owned
message from `../AION-OUTBOUND-M05-001.md`
(correlation `AION-M05-20261016-COC-001`) into the preexisting,
authenticated **chatgpt.com web app** tab in the BFF Linux Chrome.

## Files

- `send-m05.js` — main script (dry-run default; live only with both flags).
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

## Tests

```sh
cd adapter && NODE_PATH=/home/box/aion-tools/node_modules node --test
```

Covers: dry-run default, confirmation-flag gating, missing tab, missing
composer, mismatched response, mock happy path, verbatim outbound load,
`127.0.0.1` fixture serving, receipt sanitization.

## Status

Tested: unit suite only (mocks/fixture). NOT yet tested against the real
chatgpt.com site — do not claim live success until a human-authorized run
produces a real receipt.
