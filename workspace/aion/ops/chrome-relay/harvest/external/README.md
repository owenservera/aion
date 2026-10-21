# AION External Donor Harvest — staging scaffold

**START HERE: [00-START-HERE.md](00-START-HERE.md).**

This is **scaffolding only**: source manifest, pinned reference registry, future candidate capability universe, two prioritized worker launches, and evidence/promotion protocol. **No cloning, code harvesting, worker execution, native/CDP testing, or runtime integration has been performed by this branch.** The preceding experimental clone/index runner has been removed to keep execution owned by the worker chat.

## Run order — exactly two setup workers before deep harvest

1. [01-CLONE-CUSTODIAN.md](01-CLONE-CUSTODIAN.md) — clone all nine repositories outside AION, push isolated forks/mirrors where authorized, pin upstream+mirror revisions, produce custody receipts (actual pushes separately verified).
2. [02-REPO-PRIORITIZATION.md](02-REPO-PRIORITIZATION.md) — do a fast **repo-by-repo** source survey, attribute unique functionality, pick **ONE primary donor per capability cluster** and at most one substantively different backup, create ranked non-overlapping deep-harvest lanes. **No deep harvest in either of these two workers.**
3. Later, after triage signoff, run dedicated deep harvest workers from the prioritized assignments under [03-EVIDENCE-AND-PROMOTION.md](03-EVIDENCE-AND-PROMOTION.md).

## Scope and separation

**9 donor repositories:** [sources.json](sources.json). **40 existing semantic operations × 25 provider routes:** [reference/command-matrix-1000.csv](reference/command-matrix-1000.csv). **Core priority/effect definitions:** [reference/core-operations.csv](reference/core-operations.csv). **Native/custom/ingress route origins:** [reference/route-origins.csv](reference/route-origins.csv). **105-item capability universe:** [reference/capability-universe.csv](reference/capability-universe.csv), where **65 future capabilities are unapproved research candidates**, not promises or implemented features. Some future rows are protocol/data capabilities rather than standalone user commands.

Claude's [PR #50](https://github.com/owenservera/aion/pull/50) reconciliation contributes **chatgpt-bridge**, receive cursor/message identity/send correlation research axes, and explicit prohibition on transplanting Multi-AI Chat heuristic resend/fallback. PR #51 supplies the current 40-command source registry; these pinned copies are **reference only** and must not become a competing authoritative registry. The two source branches have not been assumed merged together; report source SHA on cards.

## Isolation and GitHub ownership

Donor raw clones/forks are quarantined and do not enter this AION branch. Custody owns `landing/custody/`, triage owns `landing/triage/`, and future harvest lane workers receive exclusive module/card paths. All worker PRs target `harvest/external-browser-donors-20261020`, not `main` or live Track B runtime. No hidden background processing or implicit worker activation.

Only a later reviewed AION implementation PR may transfer specific source ideas/code after license review, tests, exact conversation identity, read permissions and no-resend safety. No Playwright/Puppeteer/Orca and no assumption that CDP is needed in the initial source-harvest phases.

**Current status:** nine clone intentions, zero verified clones/mirrors, zero inspected donor implementation cards from this initiative, zero live claims. Start the custodian using the prompt in file 01.
