# AION-BFF-002 Task 2 — Autopush hardening (PROPOSAL)

> ## WARNING — PROPOSAL ONLY, NOT DEPLOYED
>
> Nothing in this document has been applied. `/usr/local/bin/aion-autopush` and
> `/usr/local/bin/aion-autopush-loop` were **not** read, modified, restarted, or
> executed. The live loop is still running the old script, unmodified.
>
> **Do not copy anything from this document or from
> `ops/autopush-harden.patch` into `/usr/local/bin` without explicit human
> approval.** The live script is the single writer to `origin/main`; replacing it
> is a privileged, production-affecting change.

- Status: proposal, awaiting human review
- Scope: proposal docs only (`/workspace/aion/ops/`)
- Machine: git 2.47.3, flock (util-linux 2.41.5), bash 5.x — all required features present
- shellcheck: **not installed** on this box (use `bash -n`)

---

## 1. Problem statement

The live script, 6 lines, run every 60s by `/usr/local/bin/aion-autopush-loop`
with no supervision and no lock:

```bash
cd / || exit 1
git add -A /.gitignore /README.md /workspace/aion 2>/dev/null
git diff --cached --quiet || git commit -q -m "auto: $(date '+%F %T %Z')"
git pull -q --rebase origin main 2>>/var/log/aion-autopush.log
git push -q origin HEAD:main 2>>/var/log/aion-autopush.log
```

Three independent defects. B1 is the urgent one.

### B1 — Secret leak risk (highest severity, irreversible)

The repo is rooted at `/`, and `git add -A /workspace/aion` stages **everything**
under the workspace. The root `.gitignore` whitelists `/workspace/aion` and, per
current task context, only excludes `node_modules` beneath it. So any credential
that lands in the workspace — `.env`, `*.pem`, `*.key`, `auth.json`, a dumped
`gh` token, a Tailscale auth key — is staged, committed with an `auto:` message,
and pushed to `origin/main` within 60 seconds.

Why this is the worst of the three:

- It is **silent**. `git add ... 2>/dev/null` and `git commit -q` suppress the
  output; the loop never reports what it shipped.
- It is **already in motion**. The loop has been running against this tree.
- It is **not fixable by deleting the file afterwards**. A pushed secret lives in
  remote history. Recovery = rotate the credential, then rewrite history and
  force-push. A `gitignore` rule alone repairs nothing.

Mitigation ordering matters: the real gate must be **in the script** (§3), because
`.gitignore` cannot protect against a file that is already tracked, and it is a
single root-owned file outside the workspace whose current coverage we cannot
audit from inside the workspace.

### B2 — Failed rebase still pushes

```bash
git pull -q --rebase origin main 2>>/var/log/aion-autopush.log   # status discarded
git push -q origin HEAD:main 2>>/var/log/aion-autopush.log      # runs regardless
```

The `pull` exit status is thrown away (no `set -e`, no `||`, no `if`). Whatever
happened, the next line runs. Two distinct bad outcomes:

1. **Rebase stops on conflict** → the tree is left mid-rebase with conflict
   markers in the worktree and a stale `.git/rebase-merge/`. Nothing tells anyone:
   the error goes to a log nobody reads. On the *next* cycle, `git add -A` stages
   the conflicted files — conflict markers included — and
   `git diff --cached --quiet || git commit` commits them. A transient network
   blip or a concurrent edit is enough to push a garbage commit to `main`.
2. **Rebase aborts or the fetch fails** → push is attempted anyway. It normally
   fails as non-fast-forward and is discarded silently, so no harm — but the
   operator's only signal is a log line, and the local commit just sits there.

The sequencing also guarantees the conflict case is *likely*: `commit` runs
**before** `pull --rebase`, so the box's own commit is almost always the thing
being replayed onto a moved `origin/main`.

### B3 — No `flock`: overlapping cycles

The loop sleeps 60s but nothing serialises runs. Two invocations interleave
whenever a cycle runs long (large `git add -A /`, slow network, a hung SSH prompt)
or when anyone runs the script by hand. Concurrent `git add` / `commit` /
`rebase` / `push` against one shared index produces `index.lock` contention,
corrupted rebase state, and lost commits — and these are silent failures, exactly
because of the `2>/dev/null` / `-q` pattern.

Related, lower-severity: `2>/dev/null` on the `git add` also hides a real failure.
If any of the three pathspecs does not exist, `git add` exits non-zero with
`pathspec ... did not match any files`, nothing is staged, and the cycle degrades
into a silent no-op that still runs `pull` and `push`.

---

## 2. Proposed `/.gitignore` additions

Append to the existing root `.gitignore` (keep the current `node_modules` rule).
This file is **root-owned and outside `/workspace/aion`** — out of scope for this
task, so this is a proposal for the human, not an edit. Note the autopush script
stages `/.gitignore` itself, so these rules get committed on the next cycle.

```gitignore
# ---- AION-BFF-002 Task 2: credential hygiene under /workspace/aion ---------
/workspace/aion/.env*
!/workspace/aion/.env.example
!/workspace/aion/**/*.env.example
/workspace/aion/*.pem
/workspace/aion/*.key
/workspace/aion/*.p12
/workspace/aion/*.pfx
/workspace/aion/*.jks
/workspace/aion/*.keystore
/workspace/aion/*.kdbx
/workspace/aion/*.ovpn
/workspace/aion/**/id_rsa
/workspace/aion/**/id_ed25519
/workspace/aion/**/id_ecdsa
/workspace/aion/auth.json
/workspace/aion/**/auth.json
/workspace/aion/credentials.json
/workspace/aion/**/.netrc
/workspace/aion/**/.npmrc
/workspace/aion/**/.pypirc
/workspace/aion/**/*.token
/workspace/aion/**/*credentials*
/workspace/aion/**/secrets.y*ml
/workspace/aion/bff/.env*
/workspace/aion/pm/.env*
/workspace/aion/store/**/*.db-wal
```

Deliberate ordering/negations: `.env*` is broad (it catches `.env.local`,
`.env.production`) so the `!.env.example` negations come **after** it — order is
significant in gitignore. Certificates (`*.crt`, `*.pub`) are *not* ignored; they
are public material and ignoring them causes confusing failures.

**Caveats — read before relying on this:**

- `.gitignore` does **not** untrack anything. Any secret already committed stays
  tracked and keeps being pushed; the rule is inert for it. §3's scan is the gate.
- It protects only paths matching these patterns. A credential pasted into
  `notes.md` or a `.json` fixture sails straight through.
- Untracked-but-ignored files also stop appearing in `git status`, which can hide
  the fact that a real config file is being excluded from the repo.
- Therefore treat §2 as defence-in-depth and §3 as the actual control.

---

## 3. Proposed rewritten `aion-autopush`

Same stage-commit-pull-push shape, three behaviours added:

1. `flock -n` single-writer (B3).
2. Secret scan over **staged content**; on a hit, unstage the offenders, log, and
   exit `2` before any commit or push (B1).
3. `pull --rebase` failure → `git rebase --abort`, log, **skip the push**, exit
   `1` (B2).

Every path is overridable by environment variable, so the loop needs no changes
and the test plan can drive the script against a sandbox clone.

```bash
#!/bin/bash
# aion-autopush - hardened autopush cycle (PROPOSAL, AION-BFF-002 Task 2).
# Deltas vs the live script: flock single-writer, staged-secret scan that
# aborts before commit, and rebase --abort + skip-push on pull failure.
# `set -e` is deliberately omitted: every failure mode is handled explicitly,
# and an implicit abort mid-rebase is exactly the failure we are fixing.
set -uo pipefail

ROOT=${ROOT:-/}                  # repo worktree root (git toplevel is "/")
SCAN_PATH=${SCAN_PATH:-/workspace/aion}
LOG=${LOG:-/var/log/aion-autopush.log}
LOCK=${LOCK:-/var/lock/aion-autopush.lock}
BRANCH=${BRANCH:-main}
SECRET_SCAN=${SECRET_SCAN:-1}    # 0 = emergency escape hatch, logged loudly
BLOCK_SOFT=${BLOCK_SOFT:-1}      # 1 = block heuristic hits, 0 = log only

log() { printf '%s [autopush] %s\n' "$(date -Is)" "$*" >>"$LOG" 2>/dev/null; }
fatal() { log "FATAL: $*"; exit 1; }

# ---- single writer (B3) -----------------------------------------------------
# Without this, an overlapping manual run or a >60s cycle interleaves
# add/commit/rebase/push against the shared index and the ref lock.
command -v flock >/dev/null 2>&1 || fatal "flock not found; refusing to run unlocked"
mkdir -p "$(dirname "$LOCK")" 2>/dev/null
exec 9>"$LOCK" || fatal "cannot open lock file $LOCK"
flock -n 9 || { log "SKIP: another autopush holds $LOCK"; exit 0; }

cd "$ROOT" || fatal "cannot cd $ROOT"

# ---- stage ------------------------------------------------------------------
# Same three paths as the live script, minus the error-swallowing 2>/dev/null,
# minus pathspecs that do not exist in this worktree.
add_paths=()
for p in "$ROOT/.gitignore" "$ROOT/README.md" "$SCAN_PATH"; do
  [ -e "$p" ] && add_paths+=("$p")
done
if [ "${#add_paths[@]}" -eq 0 ]; then
  log "SKIP: nothing to stage (no matching paths under $ROOT)"
  exit 0
fi
git add -A -- "${add_paths[@]}" || fatal "git add failed"

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR)
if [ "${#staged[@]}" -eq 0 ]; then
  # Do NOT exit here: pull/push still have to run so that a commit stranded by
  # an earlier failed cycle gets retried. The live script did this implicitly.
  log "idle: no local changes at $(git rev-parse --short HEAD 2>/dev/null); syncing only"
fi

# ---- staged secret scan (B1) ------------------------------------------------
# Gitignore is one root-owned file that already demonstrably misses secrets,
# and it cannot untrack a file committed before a rule existed. So the real
# gate is this scan, run against the index: exactly the bytes this cycle is
# about to commit, not whatever the working tree happens to hold.
DENY_HARD_RE='-----BEGIN ([A-Z ]+)?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|glpat-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-(live|test|proj)-[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
DENY_NAME_RE='^(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore|kdbx|ovpn)$|auth\.json|credentials(\.json)?|\.netrc|\.npmrc|id_(rsa|dsa|ecdsa|ed25519))$'
DENY_SOFT_RE='(api[_-]?key|secret|token|password|passwd|client[_-]?secret)[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9/+_.-]{16,}'

block_path=()
block_why=()

# one log line per path, even when several rules match it
block_add() {
  local p=$1 w=$2 i
  for i in "${!block_path[@]}"; do
    [ "${block_path[$i]}" = "$p" ] && return
  done
  block_path+=("$p"); block_why+=("$w")
}

if [ "${#staged[@]}" -eq 0 ]; then
  : # nothing staged, nothing to scan
elif [ "$SECRET_SCAN" = "1" ]; then
  for f in "${staged[@]}"; do
    if [[ "${f##*/}" =~ $DENY_NAME_RE ]]; then block_add "$f" "filename-denied"; fi
  done
  # `git grep --cached` reads the index, so this sees post-`git add` content.
  hits=$(git grep --cached -I -l -E -e "$DENY_HARD_RE" -- "${staged[@]}" 2>/dev/null)
  if [ -n "$hits" ]; then
    while IFS= read -r f; do block_add "$f" "hard-pattern"; done <<<"$hits"
  fi
  if [ "$BLOCK_SOFT" = "1" ]; then
    hits=$(git grep --cached -I -l -i -E -e "$DENY_SOFT_RE" -- "${staged[@]}" 2>/dev/null)
    if [ -n "$hits" ]; then
      while IFS= read -r f; do block_add "$f" "soft-pattern"; done <<<"$hits"
    fi
  fi
else
  log "WARN: SECRET_SCAN=0 - secret scan disabled by operator override"
fi

if [ "${#block_path[@]}" -gt 0 ]; then
  for i in "${!block_path[@]}"; do
    log "BLOCK-SECRET staged:${block_path[$i]} reason=${block_why[$i]}"
  done
  for f in "${block_path[@]}"; do
    git reset -q HEAD -- "$f" 2>/dev/null || log "WARN: could not unstage $f"
  done
  log "ABORT: ${#block_path[@]} secret-shaped staged path(s); nothing committed or pushed"
  log "offenders left in the worktree - gitignore or move them, then retry next cycle"
  exit 2
fi

# ---- commit (leaves the tree clean, which makes the rebase safe) -----------
# Skipped when nothing is staged; the sync steps below still run.
if [ "${#staged[@]}" -gt 0 ]; then
  git commit -q -m "auto: $(date '+%F %T %Z')" || fatal "git commit failed"
fi

# ---- pull --rebase, abort on failure (B2) ----------------------------------
# The live script ignored the exit status and pushed anyway: a transient
# failure left a half-rebased tree that the *next* 60s cycle would commit.
if ! git pull -q --rebase origin "$BRANCH" >>"$LOG" 2>&1; then
  git rebase --abort >>"$LOG" 2>&1 || log "WARN: rebase --abort found no rebase in progress"
  log "SKIP PUSH: pull --rebase failed; rebase aborted, local commit retained for next cycle"
  exit 1
fi

# ---- push ------------------------------------------------------------------
if git push -q origin "HEAD:$BRANCH" >>"$LOG" 2>&1; then
  log "OK $(git rev-parse --short HEAD) -> origin/$BRANCH"
else
  log "ERROR: push failed; will retry next cycle"
  exit 1
fi
```

### Design notes

| Decision | Rationale |
| --- | --- |
| Scan the **index** (`git grep --cached`), not the worktree | Scans exactly the bytes about to be committed, including what a partial `git add` picked up. |
| Scope the scan to **newly staged paths** | A pre-existing leak should not freeze autopush forever; it belongs in the one-time audit (§6 step 1), not the hot loop. |
| Unstage offenders, don't `reset` | The secret stays in the worktree for the operator to deal with; nothing is silently discarded. |
| No `set -e` | Each failure mode is handled explicitly; an implicit exit mid-rebase would recreate B2. |
| Commit **before** pull | Keeps the original ordering (small, reviewable diff) and leaves the tree clean, which is what makes `pull --rebase` reliable. |
| Keep pull/push running when idle | An earlier draft exited early on "idle" — that silently stranded commits left by a failed cycle. Caught in sandbox testing (§5) and fixed. |
| No `set -e`, no `trap` on the rebase | `git rebase --abort` is the deterministic cleanup; verified to leave no `rebase-merge`/`rebase-apply`. |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Cycle succeeded, or skipped because another autopush held the lock |
| `1` | Error: `git add` / commit / pull / push failed; nothing unsafe was pushed |
| `2` | Blocked by the secret scan; nothing committed or pushed, offenders unstaged |

---

## 4. Unified diff against the live script

Machine-generated, and verified to apply with `patch -p1` and reproduce §3
byte-for-byte. Full file: `ops/autopush-harden.patch`.

```diff
--- a/usr/local/bin/aion-autopush
+++ b/usr/local/bin/aion-autopush
@@ -1,6 +1,125 @@
 #!/bin/bash
-cd / || exit 1
-git add -A /.gitignore /README.md /workspace/aion 2>/dev/null
-git diff --cached --quiet || git commit -q -m "auto: $(date '+%F %T %Z')"
-git pull -q --rebase origin main 2>>/var/log/aion-autopush.log
-git push -q origin HEAD:main 2>>/var/log/aion-autopush.log
\ No newline at end of file
+# aion-autopush - hardened autopush cycle (PROPOSAL, AION-BFF-002 Task 2).
+# Deltas vs the live script: flock single-writer, staged-secret scan that
+# aborts before commit, and rebase --abort + skip-push on pull failure.
+# `set -e` is deliberately omitted: every failure mode is handled explicitly,
+# and an implicit abort mid-rebase is exactly the failure we are fixing.
+set -uo pipefail
+
+ROOT=${ROOT:-/}                  # repo worktree root (git toplevel is "/")
+SCAN_PATH=${SCAN_PATH:-/workspace/aion}
+LOG=${LOG:-/var/log/aion-autopush.log}
+LOCK=${LOCK:-/var/lock/aion-autopush.lock}
+BRANCH=${BRANCH:-main}
+SECRET_SCAN=${SECRET_SCAN:-1}    # 0 = emergency escape hatch, logged loudly
+BLOCK_SOFT=${BLOCK_SOFT:-1}      # 1 = block heuristic hits, 0 = log only
+
+log() { printf '%s [autopush] %s\n' "$(date -Is)" "$*" >>"$LOG" 2>/dev/null; }
+fatal() { log "FATAL: $*"; exit 1; }
+
+# ---- single writer (B3) -----------------------------------------------------
+# Without this, an overlapping manual run or a >60s cycle interleaves
+# add/commit/rebase/push against the shared index and the ref lock.
+command -v flock >/dev/null 2>&1 || fatal "flock not found; refusing to run unlocked"
+mkdir -p "$(dirname "$LOCK")" 2>/dev/null
+exec 9>"$LOCK" || fatal "cannot open lock file $LOCK"
+flock -n 9 || { log "SKIP: another autopush holds $LOCK"; exit 0; }
+
+cd "$ROOT" || fatal "cannot cd $ROOT"
+
+# ---- stage ------------------------------------------------------------------
+# Same three paths as the live script, minus the error-swallowing 2>/dev/null,
+# minus pathspecs that do not exist in this worktree.
+add_paths=()
+for p in "$ROOT/.gitignore" "$ROOT/README.md" "$SCAN_PATH"; do
+  [ -e "$p" ] && add_paths+=("$p")
+done
+if [ "${#add_paths[@]}" -eq 0 ]; then
+  log "SKIP: nothing to stage (no matching paths under $ROOT)"
+  exit 0
+fi
+git add -A -- "${add_paths[@]}" || fatal "git add failed"
+
+mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR)
+if [ "${#staged[@]}" -eq 0 ]; then
+  # Do NOT exit here: pull/push still have to run so that a commit stranded by
+  # an earlier failed cycle gets retried. The live script did this implicitly.
+  log "idle: no local changes at $(git rev-parse --short HEAD 2>/dev/null); syncing only"
+fi
+
+# ---- staged secret scan (B1) ------------------------------------------------
+# Gitignore is one root-owned file that already demonstrably misses secrets,
+# and it cannot untrack a file committed before a rule existed. So the real
+# gate is this scan, run against the index: exactly the bytes this cycle is
+# about to commit, not whatever the working tree happens to hold.
+DENY_HARD_RE='-----BEGIN ([A-Z ]+)?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|glpat-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-(live|test|proj)-[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
+DENY_NAME_RE='^(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore|kdbx|ovpn)$|auth\.json|credentials(\.json)?|\.netrc|\.npmrc|id_(rsa|dsa|ecdsa|ed25519))$'
+DENY_SOFT_RE='(api[_-]?key|secret|token|password|passwd|client[_-]?secret)[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9/+_.-]{16,}'
+
+block_path=()
+block_why=()
+
+# one log line per path, even when several rules match it
+block_add() {
+  local p=$1 w=$2 i
+  for i in "${!block_path[@]}"; do
+    [ "${block_path[$i]}" = "$p" ] && return
+  done
+  block_path+=("$p"); block_why+=("$w")
+}
+
+if [ "${#staged[@]}" -eq 0 ]; then
+  : # nothing staged, nothing to scan
+elif [ "$SECRET_SCAN" = "1" ]; then
+  for f in "${staged[@]}"; do
+    if [[ "${f##*/}" =~ $DENY_NAME_RE ]]; then block_add "$f" "filename-denied"; fi
+  done
+  # `git grep --cached` reads the index, so this sees post-`git add` content.
+  hits=$(git grep --cached -I -l -E -e "$DENY_HARD_RE" -- "${staged[@]}" 2>/dev/null)
+  if [ -n "$hits" ]; then
+    while IFS= read -r f; do block_add "$f" "hard-pattern"; done <<<"$hits"
+  fi
+  if [ "$BLOCK_SOFT" = "1" ]; then
+    hits=$(git grep --cached -I -l -i -E -e "$DENY_SOFT_RE" -- "${staged[@]}" 2>/dev/null)
+    if [ -n "$hits" ]; then
+      while IFS= read -r f; do block_add "$f" "soft-pattern"; done <<<"$hits"
+    fi
+  fi
+else
+  log "WARN: SECRET_SCAN=0 - secret scan disabled by operator override"
+fi
+
+if [ "${#block_path[@]}" -gt 0 ]; then
+  for i in "${!block_path[@]}"; do
+    log "BLOCK-SECRET staged:${block_path[$i]} reason=${block_why[$i]}"
+  done
+  for f in "${block_path[@]}"; do
+    git reset -q HEAD -- "$f" 2>/dev/null || log "WARN: could not unstage $f"
+  done
+  log "ABORT: ${#block_path[@]} secret-shaped staged path(s); nothing committed or pushed"
+  log "offenders left in the worktree - gitignore or move them, then retry next cycle"
+  exit 2
+fi
+
+# ---- commit (leaves the tree clean, which makes the rebase safe) -----------
+# Skipped when nothing is staged; the sync steps below still run.
+if [ "${#staged[@]}" -gt 0 ]; then
+  git commit -q -m "auto: $(date '+%F %T %Z')" || fatal "git commit failed"
+fi
+
+# ---- pull --rebase, abort on failure (B2) ----------------------------------
+# The live script ignored the exit status and pushed anyway: a transient
+# failure left a half-rebased tree that the *next* 60s cycle would commit.
+if ! git pull -q --rebase origin "$BRANCH" >>"$LOG" 2>&1; then
+  git rebase --abort >>"$LOG" 2>&1 || log "WARN: rebase --abort found no rebase in progress"
+  log "SKIP PUSH: pull --rebase failed; rebase aborted, local commit retained for next cycle"
+  exit 1
+fi
+
+# ---- push ------------------------------------------------------------------
+if git push -q origin "HEAD:$BRANCH" >>"$LOG" 2>&1; then
+  log "OK $(git rev-parse --short HEAD) -> origin/$BRANCH"
+else
+  log "ERROR: push failed; will retry next cycle"
+  exit 1
+fi
```

Before / after, in words:

| | Live | Proposed |
| --- | --- | --- |
| Concurrency | none | `flock -n` on fd 9; second runner exits 0 and logs `SKIP` |
| Secret gate | none (gitignore only) | staged-content scan, unstage + exit 2 |
| `git add` errors | swallowed by `2>/dev/null` | `FATAL:` + exit 1; missing pathspecs skipped |
| `pull` failure | ignored; push runs anyway | `rebase --abort`, log, skip push, exit 1 |
| Idle cycle | commits nothing, still pulls/pushes | same, plus an explicit `idle:` log line |
| Observability | `2>>log` for git errors only | every outcome logged with ISO timestamp |
| Idempotence | — | one cycle = at most one commit, or none |

---

## 5. Verification already performed (sandbox only)

The script was exercised against a throwaway bare origin under `/tmp` — the live
repo at `/` was never used as a test target and `origin/main` was never touched.

| # | Scenario | Result |
| --- | --- | --- |
| 1 | clean tree | `idle: ... syncing only`, no commit, exit 0 |
| 2 | normal change | committed + `OK <sha> -> origin/main` |
| 3 | `.env` staged | exit 2, `BLOCK-SECRET ... filename-denied`, nothing committed, not on origin |
| 4 | `ghp_` token in a plain `.txt` | exit 2, `hard-pattern`, no commit |
| 5 | `*.pem` private key | exit 2, exactly 1 deduped log line |
| 6 | soft heuristic | blocked by default; `BLOCK_SOFT=0` allows |
| 7 | `SECRET_SCAN=0` | commits, logs `WARN: SECRET_SCAN=0` |
| 8 | two concurrent runs | one skips, `SKIP: another autopush holds ...`, no contention |
| 9 | genuine add/add divergence | exit 1, `rebase --abort`, **no rebase state left**, origin untouched, local commit retained; repeat cycle keeps holding |
| 10 | transient pull failure | exit 1, commit not pushed; next cycle pushes it once the remote is reachable |

Verification caught one real defect: the first draft exited early on the idle
path, which would have stranded commits left behind by a failed cycle. Fixed, and
step 10 above is the regression test for it.

**Not verified:** behaviour under a slow/large `git add -A /` with the live repo,
and the `LOCK` path's writability for whatever user the loop runs as (see §7).

---

## 6. Test plan (run AFTER a human deploys)

> Do not perform these steps without human approval. Steps 1–3 are read-only and
> safe. Step 4 changes privileged state. Steps 5–8 observe. Steps 9–12 inject
> faults and should run on the sandbox clone, not on the live box.

**Phase 0 — before deploying**

1. **Audit history for already-pushed secrets.** This is the check that matters
   most; the hardening only prevents the next leak.
   ```bash
   git -C / ls-files /workspace/aion | grep -Ei '\.env|auth\.json|\.pem$|\.key$|credential|token'
   git -C / log --all --diff-filter=A --name-only --pretty=format: -- /workspace/aion \
     | sort -u | grep -Ei '\.env|auth\.json|\.pem$|\.key$|credential|token'
   ```
   Any hit = a credential may already be on `origin/main` → **rotate it first**,
   then decide on history rewrite. Also grep recent trees for the hard patterns:
   ```bash
   for c in $(git -C / rev-list --max-count=200 --all -- /workspace/aion); do
     git -C / grep -I -l -E 'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|BEGIN [A-Z ]*PRIVATE KEY' \
       "$c" -- /workspace/aion 2>/dev/null
   done | sort -u
   ```

2. **Syntax-check the candidate before it goes anywhere privileged.**
   ```bash
   bash -n /workspace/aion/ops/autopush-harden.patch 2>/dev/null  # n/a; use step 3
   patch -p1 --dry-run -d /path/to/copy/of/tree < /workspace/aion/ops/autopush-harden.patch
   ```

3. **Dry-run against a sandbox clone** (repeat §5): build a bare origin + clone
   under `/tmp`, then run the proposed script with the overrides
   `ROOT=/tmp/sbx/wt SCAN_PATH=/tmp/sbx/wt/work LOG=/tmp/sbx/log LOCK=/tmp/sbx/lock`.
   Expect the §5 table. Add a guard so `git -C` can never fall back to the live
   repo at `/`:
   ```bash
   [ "$(git -C /tmp/sbx/wt rev-parse --show-toplevel)" = /tmp/sbx/wt ] || { echo "NOT SANDBOXED"; exit 1; }
   ```

**Deploy (human only)**

4. Back up, then install:
   ```bash
   sudo cp -a /usr/local/bin/aion-autopush /usr/local/bin/aion-autopush.bak-$(date +%F-%H%M%S)
   sudo patch -p1 -d / < /workspace/aion/ops/autopush-harden.patch
   bash -n /usr/local/bin/aion-autopush && echo OK
   ```
   The loop needs **no** change — same path, same 60s cadence. Do not restart it
   unless it is already broken.

**Phase A — post-deploy observation (read-only)**

5. **Lock file is writable by the loop's user.** If it is not, the script
   fail-closes with `FATAL: cannot open lock file` and autopush stops dead:
   ```bash
   ls -l /var/lock/aion-autopush.lock || sudo mkdir -p /var/lock
   ```

6. **Three consecutive cycles look healthy**, ~180s:
   ```bash
   tail -20 /var/log/aion-autopush.log
   ```
   Expect one `idle: ...` + `OK <sha> -> origin/main` pair per 60s, and
   **no** `FATAL:`, `BLOCK-SECRET`, or `SKIP PUSH` lines.

7. **Loop still alive and on cadence:**
   ```bash
   pgrep -af aion-autopush-loop
   grep '\[autopush\]' /var/log/aion-autopush.log | tail -6   # ~60s spacing
   ```

8. **Concurrency actually serialises** (safe to run by hand):
   ```bash
   /usr/local/bin/aion-autopush; echo "manual rc=$?"
   ```
   If it collides with a loop tick, the log gains
   `SKIP: another autopush holds /var/lock/aion-autopush.lock` — that is a PASS.

**Phase B — fault injection (sandbox preferred; live box needs explicit sign-off)**

9. **Secret block.** Sandbox: create `/tmp/sbx/wt/work/.env`, run with overrides →
   expect `rc=2`, `BLOCK-SECRET staged:work/.env`, and
   `git -C /tmp/sbx/wt diff --cached --name-only` empty. Live box (needs
   sign-off): use a **dummy** value, never a real credential —
   ```bash
   printf 'API_KEY=sk-live-DUMMYNOTREAL0000000000\n' > /workspace/aion/.env
   /usr/local/bin/aion-autopush; echo "rc=$?"          # expect 2
   git -C / diff --cached --name-only                  # expect: no .env
   git -C / fetch -q origin && \
     git -C / grep -I -l 'DUMMYNOTREAL' origin/main -- /workspace/aion  # expect: empty
   rm /workspace/aion/.env
   ```
   Then add the §2 `.gitignore` rules and confirm the file stops being staged.

10. **Rebase conflict.** Sandbox only (§5 step 9): expect `rc=1`,
    `SKIP PUSH: ... rebase aborted ...`, no `.git/rebase-merge`, origin unchanged,
    local commit retained, and every subsequent cycle still `rc=1` until a human
    resolves. Confirm nothing was pushed:
    `git -C /tmp/sbx/origin.git rev-parse --short main` must equal the pre-test value.

11. **Stranded-commit retry.** Sandbox only (§5 step 10): break the remote URL, run
    → `rc=1` and nothing pushed; restore the URL, run again → the earlier commit is
    pushed and `OK` is logged.

12. **Soak.** Leave it for ≥1 hour (~60 cycles) and confirm:
    ```bash
    grep -c 'BLOCK-SECRET' /var/log/aion-autopush.log   # expect 0
    grep -c 'SKIP PUSH' /var/log/aion-autopush.log      # expect 0
    grep -c '\[autopush\] OK' /var/log/aion-autopush.log # expect ~60
    ```

**Rollback (human only, any time)**

```bash
sudo cp -a /usr/local/bin/aion-autopush.bak-<timestamp> /usr/local/bin/aion-autopush
```

---

## 7. Residual risks and open questions

1. **The `LOCK` default may not be writable** by the user the loop runs as
   (`/var/lock` is root-owned). The script fails closed, which means autopush
   stops rather than running unlocked — correct, but it *will* look like a
   breakage. Verify in §6 step 5; if it fails, set `LOCK` to a writable path.
2. **Soft-pattern false positives halt autopush.** A fixture containing
   `token: "…16+ chars…"` will block every cycle until fixed. Loud in the log,
   tunable with `BLOCK_SOFT=0`; documented rather than silently downgraded.
3. **Existing leaks are not cleaned up** by either change. A pushed secret needs
   rotation + history rewrite regardless — §6 step 1.
4. **`git grep -I` skips binary files**, and filenames containing newlines are not
   handled by the line-based loop. Both are accepted for this repo.
5. **The loop itself is untouched.** `flock` makes overlap safe, but a crashed
   cycle that dies without cleanup leaves no lock (fd-based locking releases on
   process exit, so this is safe by construction).
6. **Ordering is unchanged** (commit, then pull, then push). This keeps the diff
   reviewable; moving the pull first would reduce conflicts further but enlarges
   the behavioural change. Worth considering as a follow-up.
7. **Not proposed:** a pre-receive hook on the remote (the only true B1 backstop
   for force-pushes and other clients), and reducing the 60s cadence.
8. Requires bash 4+ (`mapfile`), git 2.23+ — satisfied here (bash 5.x, git 2.47.3).

---

## 8. Files

| Path | Role |
| --- | --- |
| `/workspace/aion/ops/autopush-harden-proposal.md` | this proposal |
| `/workspace/aion/ops/autopush-harden.patch` | unified diff, verified with `patch -p1` |

Reminder: proposal only. Nothing deployed, no loop restarted, no live script read
or written, no change to the root `.gitignore`.