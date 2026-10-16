# AION-BFF-002 Task 3 — autopush hardening (PROPOSAL ONLY)

> **STATUS: NOT DEPLOYED — AWAITING AION APPROVAL.**
> No live host files were read or modified. The live scripts below are quoted
> verbatim from the task brief. The hardened scripts exist only as the companion
> patch `ops/proposals/aion-autopush-hardening.patch`. Do not apply without
> explicit AION approval.

## 1. Source scripts (verbatim from brief, not read from disk)

### `/usr/local/bin/aion-autopush`

```bash
#!/bin/bash
cd / || exit 1
git add -A /.gitignore /README.md /workspace/aion 2>/dev/null
git diff --cached --quiet || git commit -q -m "auto: $(date '+%F %T %Z')"
git pull -q --rebase origin main 2>>/var/log/aion-autopush.log
git push -q origin HEAD:main 2>>/var/log/aion-autopush.log
```

### `/usr/local/bin/aion-autopush-loop`

```bash
#!/bin/bash
while true; do /usr/local/bin/aion-autopush; sleep 60; done
```

## 2. Problem analysis

### P1 — Broad `git add` with no secret guard (data-loss / credential-leak risk)

- `git add -A /.gitignore /README.md /workspace/aion` stages **everything**
  under `/workspace/aion` on every 60s tick.
- Any accidentally dropped secret (`.env`, `auth.json`, `*.pem`, `id_rsa*`,
  `*token*`, service-account JSON, etc.) is committed and then **pushed to
  `origin main`** automatically. There is no `.gitignore` enforcement and no
  staged-content inspection.
- `2>/dev/null` hides `add` errors, so a partial/failing add still proceeds to
  commit/push.
- Credential values must never appear in logs/alerts; the current script has no
  such discipline (it logs almost nothing at all).

### P2 — Rebase failure leaves repo broken, push still attempted

- `git pull -q --rebase origin main` exit status is ignored (no `set -e`, no
  `$?` check). On conflict the repo is left **mid-rebase** (`REBASE_HEAD` /
  `rebase-merge/` present).
- The next line `git push -q origin HEAD:main` runs unconditionally: it either
  fails confusingly, or — worse — pushes a half-rebased state. The following
  loop iteration then compounds the conflicted state.
- There is no `git rebase --abort`, no alert file, no non-zero exit, and no
  explicit prohibition of force-push (`--force` / `--force-with-lease`). A
  future "fix" that adds `--force` to unstick the loop would rewrite shared
  `main` history.

### P3 — No run lock; overlapping cycles corrupt the index

- `aion-autopush-loop` fires every 60 s regardless of whether the previous
  `aion-autopush` finished. Two concurrent `add/commit/rebase/push` sequences
  race on the same index/worktree (`index.lock` failures, duplicate `auto:`
  commits, interleaved rebase + push).
- Exit status is always 0 (last `push` status is not propagated under the
  current structure, and failures are only appended to the log), so no caller
  or monitor can distinguish ok / skipped / failed.
- `cd /` assumes `/` is the repo root without verifying
  (`git rev-parse --git-dir`), and there is no `set -u`, no log rotation
  discipline, and no alert path other than one log file.

## 3. Design (proposal — see patch for exact diff)

Principles: **never commit secrets, never push after a failed rebase, never
force-push, never log credential values** (log only filenames + matched rule
names), **non-blocking skip on lock contention**.

### B1 — Secret-file guard (gitignore + pre-commit refusal)

1. **One-time `.gitignore` update (separate, reviewed commit, not done by the
   script):** ensure the repo root `/.gitignore` denies at least:
   `.env*`, `auth.json`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`,
   `id_dsa*`, `id_ecdsa*`, `id_ed25519*`, `*token*`, `secrets.json`,
   `service-account*.json`, `.aws/`. The script does **not** auto-edit
   `.gitignore`; it only refuses to commit regardless of gitignore state
   (defense in depth against `git add -f` / missing entries).
2. **Pre-commit refusal in `aion-autopush`:** after `git add`, enumerate
   staged files (`git diff --cached --name-only -z --diff-filter=ACMRT`) and
   test each against:
   - *Path rules (case-insensitive where noted):* `(^|/)\.env(\.|$|/|-)`,
     `(^|/)auth\.json$`, `\.pem$`, `\.key$`, `\.p12$`, `\.pfx$`,
     `(^|/)id_rsa`, `(^|/)id_dsa`, `(^|/)id_ecdsa`, `(^|/)id_ed25519`,
     `token` in basename, `secrets\.json$`, `service-account.*\.json$`.
   - *Content rules on staged blobs (`git show :<path>`):*
     `-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----`,
     `AKIA[0-9A-Z]{16}`, `gh[pousr]_[A-Za-z0-9_]{20,}`,
     `sk-(live|test)-[A-Za-z0-9]{10,}`, `xox[bpas]-[A-Za-z0-9-]{10,}`,
     `aws_secret_access_key`, `password\s*[:=]`.
3. On any hit: `git reset -q HEAD -- <hit files>` (**unstage**, do not delete
   worktree files), write an alert to `/var/log/aion-autopush.log` **and**
   `/var/log/aion-autopush.alert` containing only filenames + rule names,
   **skip commit/pull/push entirely**, exit non-zero. Operator then moves the
   secret out of the tree, fixes gitignore, and re-runs.

### B2 — Failed rebase: abort, no push, alert, non-zero exit, never force-push

```bash
if ! git pull -q --rebase origin main 2>>"$LOG_FILE"; then
  git rebase --abort 2>>"$LOG_FILE" || true
  alert "git pull --rebase failed; aborted rebase; push skipped" "see $LOG_FILE"
  exit 1
fi
# ...
# Never force push: no --force / --force-with-lease anywhere in the scripts.
if ! git push -q origin HEAD:main 2>>"$LOG_FILE"; then
  alert "git push failed" "see $LOG_FILE"
  exit 1
fi
```

- `git rebase --abort` is guarded with `|| true` so a non-rebase failure
  (network, auth) still alerts without a spurious abort error masking the
  cause.
- Push is **never reached** after a failed rebase; the cycle exits 1.
- The patch contains an explicit comment banning `--force`; review must reject
  any future `--force`/`--force-with-lease` addition.

### B3 — `flock` run lock with non-blocking skip

- `aion-autopush` self-locks per cycle:
  `exec 9>"$LOCK_FILE"; flock -n 9 || { log "skip …"; exit 0; }`
  (`/tmp/aion-autopush.lock`). Contended cycles **skip with exit 0** (not an
  error) so logs/monitors are not spammed.
- `aion-autopush-loop` takes a **separate** daemon lock
  (`/tmp/aion-autopush-loop.lock`, `flock -n`, exit 1 with a message if a
  second loop daemon starts). It deliberately does **not** nest a second
  `flock(1)` on the cycle lock: nesting `flock /tmp/aion-autopush.lock
  aion-autopush` around a script that itself does `flock -n` on the same path
  self-deadlocks (the inner open contends with the outer holder and every
  cycle would "skip"). Per-cycle overlap is therefore enforced inside
  `aion-autopush`, which also protects manual invocations.
- Loop body propagates no silent swallowing beyond `|| true` per tick (the
  tick's own log/alert files carry the reason); the daemon itself never exits
  on a single failed tick.

## 4. Test plan (throwaway temp git repo + bare remote — no live paths)

No credential values are used anywhere. Secret-like fixtures contain only
obviously fake placeholders (e.g. `AKIAIOSFODNN7EXAMPLE`-style is avoided;
use `FAKE_TOKEN_FOR_TEST_123` matched by the `token` path rule and a
`-----BEGIN FAKE TEST KEY-----` marker matched by a test-only rule, or the
real patterns with redacted bodies).

```bash
set -u
T="$(mktemp -d)"; REMOTE="$T/remote.git"; C1="$T/c1"; C2="$T/c2"
git init -q --bare "$REMOTE"
git clone -q "$REMOTE" "$C1" && git clone -q "$REMOTE" "$C2"
for r in "$C1" "$C2"; do
  git -C "$r" config user.email "test@example.com"
  git -C "$r" config user.name "test"
  git -C "$r" commit -q --allow-empty -m init && git -C "$r" push -q origin HEAD:main 2>/dev/null \
    || git -C "$r" push -q origin HEAD:master
done
# Copy ONLY the patched scripts to temp bin (never touch /usr/local/bin):
BIN="$T/bin"; mkdir -p "$BIN"
# (extract patched files from the proposal patch into $BIN for the test)
# Rewrite LOG_FILE/ALERT_FILE/LOCK_FILE/REPO_ROOT via env overrides or sed to point under $T.

# T1 — B1 path guard: create $C1/.env with FAKETOKEN=1, run autopush, expect:
#   exit != 0, no commit created (git log --oneline unchanged),
#   file unstaged (git diff --cached --name-only empty), alert file non-empty,
#   alert contains filename but NOT the file body.
# T2 — B1 content guard: clean tree, add notes.txt containing
#   "-----BEGIN RSA PRIVATE KEY----- FAKE", run, expect same refusal behavior.
# T3 — B1 negative: normal notes2.txt commits + pushes to bare remote fine.
# T4 — B2 rebase conflict: conflicting edits in C1/C2, push C2 first, then run
#   autopush in C1; expect exit != 0, `git -C C1 rebase --show-current-patch`
#   fails / no rebase-merge dir (aborted), `git status --porcelain` clean of
#   conflict markers, NO push to remote (bare remote HEAD unchanged), alert
#   written to log + alert file.
# T5 — B2 no-force: grep patched scripts for --force/--force-with-lease, expect
#   zero matches.
# T6 — B3 lock skip: hold lock with `flock -n /tmp/aion-autopush.lock sleep 20 &`,
#   run autopush, expect exit 0 with "skip: another run holds" in log and no git
#   activity. Second loop daemon: start loop, start second loop, expect second
#   exits 1 immediately with "another loop daemon" message.
# T7 — Loop resilience: failing tick (e.g. remote down: mv remote.git remote.bak)
#   keeps daemon alive; restoring remote resumes ok cycles.
# Cleanup: kill background holders, rm -rf "$T".
```

Pass criteria: T1–T7 all behave as above; `shellcheck -S warning` clean on both
patched scripts; `bash -n` clean; patch applies with `git apply --check`.

## 5. Rollout / rollback (only after explicit AION approval)

**Rollout (manual, off-loop):**

1. Approve this proposal; back up live files:
   `cp /usr/local/bin/aion-autopush /root/aion-autopush.bak.$(date +%F)`.
2. `git apply --check ops/proposals/aion-autopush-hardening.patch` from a
   checkout of this repo, then apply to a **staging copy first** and run §4.
3. Stop the loop daemon, install both files with `install -m0755`, verify
   `bash -n` + a dry-run cycle, confirm log/alert files writable, then restart
   the loop and watch one full 60 s tick (`tail -f /var/log/aion-autopush.log`).
4. Land the one-time `/.gitignore` secret-entries commit separately (reviewed).

**Rollback:** restore the `.bak` files, restart the loop, confirm a tick
succeeds. The patch changes no repo history and no remote state, so rollback
is two `cp` commands + daemon restart. Keep the `.bak` files until AION
confirms the hardened behavior over ≥24 h.

## 6. Open questions for AION

- Alert routing: is file-only alerting (`/var/log/aion-autopush.alert`)
  sufficient, or should B1/B2 also page/webhook?
- Should B1 refusal commit the *non-secret* remainder, or abort the whole
  cycle (current proposal: abort whole cycle for operator review)?
- Log rotation for `/var/log/aion-autopush.log` — acceptable to add a
  `logrotate(8)` stanza in a follow-up?

---
*End of proposal. Reminder: **NOT DEPLOYED — awaiting AION approval.***
