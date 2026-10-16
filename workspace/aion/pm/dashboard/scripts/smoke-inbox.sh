#!/usr/bin/env bash
# Smoke test for the AION inbox API (correlation AION-BFF-003-VERCEL-INBOX).
# Offline: syntax-checks the handlers, then runs them against a mocked fetch.
# Never prints or requires a real GitHub token.
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"
cd "$root" || exit 1

echo "== node --check: inbox API =="
rc=0
for f in api/_lib/github.js api/inbox/send.js api/inbox/recent.js; do
  if node --check "$f"; then
    echo "  PASS  $f"
  else
    echo "  FAIL  $f"
    rc=1
  fi
done

echo
echo "== node --check: smoke harness =="
if node --check scripts/smoke-inbox.mjs; then
  echo "  PASS  scripts/smoke-inbox.mjs"
else
  echo "  FAIL  scripts/smoke-inbox.mjs"
  rc=1
fi

if [ -n "${GITHUB_TOKEN:-}${AION_GITHUB_TOKEN:-}" ]; then
  echo
  echo "NOTE: a token is present in this shell. The harness overrides globalThis.fetch"
  echo "      and asserts against a stub token, so no real API call is made."
else
  echo
  echo "NOTE: GITHUB_TOKEN / AION_GITHUB_TOKEN unset in this shell."
  echo "      Expected live behaviour of both endpoints in that state:"
  echo "        HTTP 503 {\"ok\":false,\"error\":\"GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server\"}"
  echo "      The harness asserts exactly this response shape."
fi

echo
echo "== behaviour (mocked fetch) =="
node scripts/smoke-inbox.mjs || rc=1

echo
echo "== live checks (skipped unless INBOX_BASE_URL is set) =="
base="${INBOX_BASE_URL:-}"
if [ -z "$base" ]; then
  echo "  SKIP  set INBOX_BASE_URL=https://<your-deployment> to run the curl checks"
  echo "        (a deployed URL with Vercel Authentication will still return 401/403"
  echo "         for an unauthenticated curl; the 503 here is the no-token case)"
else
  echo "  POST /api/inbox/send"
  curl -sS -o /tmp/inbox-send.json -w '    http %{http_code}\n' \
    -X POST "$base/api/inbox/send" \
    -H 'Content-Type: application/json' \
    --data '{"text":"AION-BFF-003 smoke note"}' || rc=1
  echo "    body: $(head -c 300 /tmp/inbox-send.json 2>/dev/null)"

  echo "  GET /api/inbox/recent?limit=10"
  curl -sS -o /tmp/inbox-recent.json -w '    http %{http_code}\n' \
    "$base/api/inbox/recent?limit=10" || rc=1
  echo "    body: $(head -c 300 /tmp/inbox-recent.json 2>/dev/null)"
fi

echo
if [ "$rc" -eq 0 ]; then echo "SMOKE OK"; else echo "SMOKE FAILED"; fi
exit "$rc"