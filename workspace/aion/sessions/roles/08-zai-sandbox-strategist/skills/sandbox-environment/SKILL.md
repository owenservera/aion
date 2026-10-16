---
name: sandbox-environment
description: Build an evidence-qualified minimal Linux sandbox environment fingerprint and reproducible bootstrap without touching personal host data.
---
# Sandbox Environment & Bootstrap
**Trigger:** New model spin-up, first run, package install, repeated setup, unknown preview/browser features.

1. Only within an owner-submitted authorized sandbox turn, capture `uname`, relevant runtime versions, `git --version`, working directory, package manager/permissions and available browser preview. Redact hostnames, private directories, tokens and sensitive environment variables.
2. Distinguish disposable per-run files, persisted workspace volumes, home dirs and external mounts by directly tested markers, not guesswork.
3. Pin dependency versions and prefer built-in Node/Bun tests. Do not install an entire toolchain without task-specific need.
4. Run a short local app/fixture and inspect actual logs; record exact browser capability and URL-forwarding evidence if observed.
5. Save a minimal idempotent bootstrap script **as an experimental artifact** (Z.ai sandbox code may be written within approved turn), plus clean rollback/cleanup.
6. Output capability matrix and restore checklist. Do not assume a sandbox can see the user's Windows files or signed-in sessions.
**Stop:** privileged command, unexpected external mount, secret requirement, unapproved deployment.
