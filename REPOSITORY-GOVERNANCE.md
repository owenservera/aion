# AION — Repository Steady-State Governance

**Status:** OWNER-DIRECTED • **Effective:** 2026-10-20 • **Repository:** `owenservera/aion`

This is the single governing document for **repository structure, Git workflow, and workstream custody**. For runtime authorization, evidence, and machine safety, `AGENTS.md`, the current owner instruction, and proven machine state still govern. A document, Git merge, or research artifact is never itself proof of a live capability.

## 1. Desired steady state

**One repository. One authoritative development branch: `main`. One continuously integrated AION.**

- The owner's **Windows local machine is the human-controlled master workspace**. `origin/main` is the canonical shared Git record. Neither side may silently overwrite unique changes on the other.
- All routine **development, harvest, and research** happens within **the same repository and the same evolving `main`**. These are folders/workstreams, **not three permanent development branches**.
- **Track B is the one active development path**, with its source eventually integrated directly on `main` after validation. The name denotes scope/history, **not** a future permanent `track-b/*` integration branch.
- **Track A is deprecated.** Do not open new Track A tasks, branches, implementations, or maintain a parallel Track A roadmap. Keep its historical artifacts only when needed for provenance or a specific reuse decision.
- Agent-runtime expansion and speculative parallel architectures are **on hold**, not ready for runtime promotion. Existing draft work remains preserved until explicitly resumed or retired.
- No extra coordination repositories, duplicate capability registries, permanent integration queues, Git mirrors, or overlapping GitHub Projects are necessary for this workflow.

**Steady-state acceptance:** current `main` contains the selected code, the latest useful source snapshots and concise governing docs; Windows local `main` and `origin/main` resolve to the same SHA after synchronization; all remaining branch/PR differences are explicitly known, not accidentally abandoned.

## 2. Canonical layout and ownership

| Workstream | Canonical home | Owns | Does not own |
| --- | --- | --- | --- |
| **Development (former Track B)** | `workspace/aion/ops/chrome-relay/` and relevant existing executable packages | AION product source, one command/control plane, tests, interfaces, current implementation docs | A second Track A runtime or a duplicate provider-capability registry |
| **Harvest** | `workspace/aion/ops/chrome-relay/harvest/` | Pinned external donor source **snapshots**, Omega/VIVIM evidence, crosswalk, source comparisons and decisions | Production behavior merely because code or evidence was imported |
| **Research** | Existing `workspace/aion/ops/chrome-relay/velocity/research/`, `workspace/aion/ops/command-space/`, and current AION research homes | Investigation, evidence, provider native paths, recommendations and reusable findings | A competing active product line, executable grants, or automatic implementation |
| **Governance and status** | `REPOSITORY-GOVERNANCE.md`, `AGENTS.md`, `README.md`, `workspace/aion/STATE.json` | Policy, entry point, agent rules, **evidence-backed** current operating state | Duplicate policy copies or speculative status claims |

Do **not** reorganize the established codebase merely to make it resemble this table. Reuse existing folders. New subfolders only for a distinct deliverable with a clear owner.

**Flow:** Research finds → Harvest captures/compares where needed → Development chooses, implements, tests → `main` integrates. Direct Development work may skip Research/Harvest when no outside source investigation is required.

## 3. Git rules — deliberately minimal

1. **Default:** develop on `main` after `git fetch origin --prune --tags`, checking local and remote state. Use normal commits and pushes with conflict checks; prefer small logical commits.
2. **Temporary branches/worktrees are allowed only when useful** for concurrent agents, risky changes, independent review, or protected-main checks. Base them on the latest `origin/main`; merge promptly back into `main`. They are **not** parallel long-lived development tracks.
3. If two agents are working at once, isolate edits with a temporary worktree/branch rather than concurrently pushing blindly to `main`. A concise PR is sufficient for review; do not introduce a special integration bureaucracy.
4. **No destructive shortcuts:** never force-push `main`, hard-reset or delete uncommitted user work, silently replace local-only commits, or rebase another agent's published work. Stop and surface an actual conflict.
5. **Fast-forward synchronization:** after remote integration, fetch and safely update local `main` to the identical remote SHA; account for local-only work first. A successful fetch does not imply source was merged; a matching `main` SHA does not imply every historical branch was merged.
6. **Delete only disposable branches made for a finished task**, after confirming their unique work is on `main` or intentionally retired. Keep meaningful historical refs until audited. Do not create an archive branch for every closed PR.
7. **No Git history rewrite for cosmetic cleanup or size alone.** A current-tree deletion does not remove prior Git blobs. Any future history rewrite must be explicitly scoped and owner-approved.
8. **No donor nested `.git` directories** in AION. Keep useful source snapshots and licenses; omit generated demos, promo videos, build caches, credentials and redundant binaries where not needed for understanding/reuse.

**Normal local sequence (Windows PowerShell, clean `main`):**

```powershell
git status --short
git fetch origin --prune --tags
git switch main
git merge --ff-only origin/main
# Make scoped changes; review them and run relevant checks
git add <specific paths>
git commit -m "scope: useful change"
git push origin main
```

If the working tree is dirty or local `main` has diverged, **do not execute those steps blindly**: preserve local changes and use a scoped temporary worktree/branch, then reconcile deliberately. Existing branch protections and checks always apply.

## 4. Work intake, proof, promotion and closeout

- **Intake:** one concrete issue or existing task thread only when coordination is useful. Small direct changes need no extra issue, tracking file or plan.
- **Implementation:** modify the authoritative existing file/code path, not a competing version. Link supporting Harvest or Research evidence as needed.
- **Validation:** run the relevant offline tests and (when applicable/authorized) Windows or live tests. State untested boundaries plainly. Research data is never treated as live availability, permission or observed effect.
- **Promotion:** integrate only accepted, tested and compatible changes into `main` with a commit or minimal PR; do not automatically merge draft runtime candidates.
- **Closeout:** report commit SHA, changed paths, test results and unresolved blockers. Update `STATE.json` only for an actual proven change in project/runtime status. No mandatory receipts database, new metadata schema or duplicate status docs.
- **Safety:** no secrets, cookies, tokens, private transcripts, unapproved host/browser actions or Playwright/Puppeteer. Preserve original licenses and copyright notices.

## 5. Handling existing branches and PRs (transition, not a new track)

Historical `track-b/*`, `harvest/*`, `design/*` and other branches can remain readable while unique work is checked. Their existence does **not** grant standing authority to continue parallel development.

- **Track B #46:** existing unvalidated runtime candidate; keep source and review history; reconcile explicitly against current `main` when development resumes. Do not automatically merge #33/#34/#46 or claim live acceptance.
- **Agent Fabric #35:** on hold pending a scoped resume decision. Preserve, do not promote now.
- **Harvest and Command Space:** selected source snapshots, 65-row crosswalk, donor catalog and P0 command-space data are already on `main`. Do **not** re-clone or regenerate them. Older capture PRs are provenance, not active queues.
- **Track A:** deprecated historical reference only; no parallel maintenance or new feature work.
- **Cleanup order:** verify unique changes → merge accepted items or document intentional retirement → close superseded PRs → remove only safely disposable branches. Do not delete historical refs merely to minimize their number.

## 6. Tooling budget

**Required:** local Git, GitHub remote, Windows shell, the existing repo's build/test tools.

**Optional when already available:** GitHub CLI (`gh`) for PR operations, normal Git worktrees for concurrency, GitHub Actions/checks already configured. No new daemon, scheduler, sync service, branch manager, duplicate PM board or GitOps framework merely to manage this repository.

Agents can use GitHub tools remotely to review/edit/merge safe, bounded files. **Remote GitHub work is not proof that the owner's local Windows checkout or browser runtime was updated.**

## 7. Quick steady-state check

1. `git status`: no overlooked local changes; current checked-out work understood.
2. `git fetch origin --prune --tags`; `git rev-parse main` equals `git rev-parse origin/main` after safe synchronization.
3. New accepted code, Harvest and Research updates live in their existing folders on `main`.
4. No actively maintained Track A, no parallel permanent dev branch, no unmanaged or duplicate runtime authority.
5. Remaining draft branches/PRs have a real unfinished purpose; merged/obsolete work is not being recopied.
6. The repository's README and this document point to one entry and one active plan.

**Operating principle: build and integrate continuously on `main`; research and harvest support the build, they do not fragment the product.**
