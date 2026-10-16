#!/usr/bin/env bash
# AION-BFF-002 / Task 1 - GitHub issue #14 inbox poller.
# OBSERVATION ONLY: comment bodies are read, truncated, and printed as text.
# They are never eval'd, executed, sourced, or acted upon. This script only
# reads (GET) and writes local files under the state + evidence directories.
set -euo pipefail

STATE_DIR=/workspace/aion-bff-state
CURSOR_FILE=$STATE_DIR/issue14-poller-cursor
EVIDENCE_DIR=/workspace/aion/ops/evidence
CORRELATION=AION-BFF-002-POLLER
REPO=owenservera/aion
ISSUE=14

mkdir -p "$STATE_DIR" "$EVIDENCE_DIR"

# ---- cursor -----------------------------------------------------------------
cursor_before=0
if [ -f "$CURSOR_FILE" ]; then
  digits=$(tr -dc '0-9' < "$CURSOR_FILE" || true)
  if [ -n "$digits" ]; then cursor_before=$((digits)); fi
fi

command -v gh >/dev/null 2>&1 || { echo "FATAL: gh not found" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "FATAL: jq not found" >&2; exit 1; }

# ---- fetch (read-only) ------------------------------------------------------
# --paginate emits one JSON array per page; jq -s 'add // []' merges them.
ALL=$(gh api "repos/$REPO/issues/$ISSUE/comments?per_page=100" --paginate | jq -s 'add // []')

NEW=$(printf '%s' "$ALL" | jq --argjson cursor "$cursor_before" '
  [ .[] | select(((.id // 0) | tonumber? // 0) > $cursor) ] | sort_by(.id)')

new_count=$(printf '%s' "$NEW" | jq 'length')

max_id=$(printf '%s' "$ALL" | jq '[ .[] | ((.id // 0) | tonumber? // 0) ] | max // 0')
cursor_after=$cursor_before
if [ "$max_id" -gt "$cursor_before" ]; then cursor_after=$max_id; fi
printf '%s\n' "$cursor_after" > "$CURSOR_FILE"

# ---- render (text only, never evaluated) ------------------------------------
PREVIEW_JQ='def preview:
  ((.body // "")
   | gsub("[\\r\\n\\t]+"; " ")
   | gsub("  +"; " ")
   | sub("^ +"; "")
   | sub(" +$"; "")) as $b
  | if ($b | length) > 120 then ($b[0:120] + "~") else $b end;
def md: gsub("\\\\"; "\\\\") | gsub("[|]"; "\\|") | gsub("`"; "\\`");
'

mapfile -t ROWS < <(printf '%s' "$NEW" | jq -r "$PREVIEW_JQ"' .[] | [ (.id|tostring), (.user.login // "unknown"), (.created_at // "unknown"), (preview | md) ] | "| \(.[0]) | \(.[1]) | \(.[2]) | \(.[3]) |"')

# ---- receipt ----------------------------------------------------------------
ISO_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
STAMP=$(date +%Y%m%dT%H%M%S%z)
RECEIPT=$EVIDENCE_DIR/${CORRELATION}-${STAMP}-receipt.md

{
  printf '# %s receipt\n\n' "$CORRELATION"
  printf -- '- correlation_id: %s\n' "$CORRELATION"
  printf -- '- timestamp_iso: %s\n' "$ISO_TS"
  printf -- '- source: repos/%s/issues/%s/comments (read-only GET)\n' "$REPO" "$ISSUE"
  printf -- '- cursor_before: %s\n' "$cursor_before"
  printf -- '- cursor_after: %s\n' "$cursor_after"
  printf -- '- cursor_file: %s\n' "$CURSOR_FILE"
  printf -- '- new_count: %s\n' "$new_count"
  printf -- '- observation: true\n\n'
  printf '## New comments (%s)\n\n' "$new_count"
  if [ "$new_count" -gt 0 ]; then
    printf '| id | author | created_at | preview (120 chars, single line) |\n'
    printf '| --- | --- | --- | --- |\n'
    printf '%s\n' "${ROWS[@]}"
  else
    printf '_none_\n'
  fi
  printf '\n'
  printf 'OBSERVATION MODE: comment bodies were NOT executed, evaluated, or acted upon.\n'
  printf '\n'
  printf 'Bodies were flattened to a single line and truncated to 120 characters for display only.\n'
} > "$RECEIPT"

# ---- stdout summary ---------------------------------------------------------
echo "$CORRELATION: cursor $cursor_before -> $cursor_after, new=$new_count"
if [ "$new_count" -gt 0 ]; then
  printf '%s\n' "${ROWS[@]}" | sed 's/^| /  /; s/ |$//'
fi
echo "receipt: $RECEIPT"

exit 0