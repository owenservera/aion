# Project management source-list inventory — Oct 14–16, 2026

**Author:** AION · **Proof method:** fetched recursive GitHub trees and each listed path's `GET /commits?path=<path>&per_page=1`, 2026-10-16.
**Semantics:** commit is the latest commit to **that file**, NOT proof that the content is exhaustive/complete. All entries below had latest file-commit dates within Oct 14–16 UTC. This is an index; project-native files remain the source.

| Repository | Exact path | Last-touch commit | Purpose |
|---|---|---|---|
| `001.PROJECTS.PM` | `PLAN.md` | `d7d174f67e0e6083e79bd0451b482d3c60e740a8` | initial global PM operating plan |
| `001.PROJECTS.PM` | `docs/WORKPLAN.md` | `c65d01a18ce210fc2ad9d07e63ebc074c30ea0c6` | PM workplan |
| `001.PROJECTS.PM` | `intake/conversation-atomization-2026-10-14/atomic-1000.v0.1.json` | `648d5ea9031e78e0551b72e82db9a6a6dd1b270f` | 1,000 provisional atomic work items |
| `001.PROJECTS.PM` | `intake/conversation-atomization-2026-10-14/atomic-1000.v0.1.csv` | `60b98acaf60c4cf6def4b57dc343b3893fea2280` | CSV companion |
| `001.PROJECTS.PM` | `programs/integration-automation/data/atomic-1000-tagged.csv` | `cfc97c8d734b7fd75afa41b9a2583b0d6378e7f3` | classification |
| `001.PROJECTS.PM` | `programs/integration-automation/data/portfolio-usecases-100.json` | `49342a6037e0e7fd0582fd57ff0e84e612723998` | 100 candidate integrations |
| `001.PROJECTS.PM` | `programs/integration-automation/workload-registry.json` | `e53592872cae4aa42c77eae9454974410b379b16` | W01–W03 workloads |
| `001.PROJECTS.PM` | `reports/BOARD.md` | `0f124f3fa5687cf958f74f55c1462531ad2c2edf` | portfolio board |
| `001.PROJECTS.PM` | `reports/board.v0.1.json` | `946f1e8b62079122db1ce593c61788e98a2a0e46` | machine-readable board |
| `001.PROJECTS.PM` | `programs/uah-iang/CEO-RECONCILIATION-PLAN.md` | `5eb568be41dcd34aadd6ff59164a8d614c4c0fad` | UAH/IANG reconciliation milestone plan |
| `001.PROJECTS.PM` | `reports/audits/2026-10-15-portfolio-hygiene.md` | `eb0eb02233bc114cc01bd5ac07b3d59ec52b8d4e` | audit findings/gates |
| `001.PROJECTS.PM` | `governance/pm-response-queue-contract-v1.md` | `a8d4f5f2d16e5ebdd41d247f7054b3c0266ae544` | work-order protocol |
| `SOFTWARE_HQ` | `TASKS.md` | `5d41dec3203e0f492801ccf3707372ec5ddd8314` | app/software tasks |
| `SOFTWARE_HQ` | `TRACKER.md` | `5d41dec3203e0f492801ccf3707372ec5ddd8314` | software tracker |
| `SOFTWARE_HQ` | `integrations/TRACKER.md` | `5d41dec3203e0f492801ccf3707372ec5ddd8314` | integrations tracker |
| `SOFTWARE_HQ` | `integrations/oracle-reconciliation/alignment/TRACKER.md` | `c8eb3202349ef6f4b4c12c0fb573c0657ff13c53` | UAH alignment tracker |
| `SOFTWARE_HQ` | `integrations/oracle-reconciliation/alignment/queue.csv` | `58e88011af1e65c102fc2bb9b926734cb5bc8f70` | alignment queue |
| `SOFTWARE_HQ` | `integrations/oracle-reconciliation/alignment/signals.json` | `2fa4d3de46b162b05f7df7e815c46331b1367aca` | alignment signals |
| `ACP` | `backlog/TASKS.yaml` | `1adf9891592db54c37d1803ca6c9e8ed43ab592b` | parent ACP task backlog |
| `ACP` | `architecture/roadmap.md` | `8ee5f758a0ac265b0207b036bf9a0b0a7311d7c4` | sequencing |
| `ACP` | `harvest/requirements.yaml` | `1adf9891592db54c37d1803ca6c9e8ed43ab592b` | source requirements |
| `Product_Hub` | `PROJECT_TRACKER.md` | `bdcefe7dd386f861f387d569b9ef7fc6dbaae936` | Product Hub tracker |
| `Product_Hub` | `docs/IMPLEMENTATION_PLAN.md` | `b5a7e7b4dc646579b70b996612676c278ce110d6` | Product Hub workplan |
| `Product_Hub` | `config/workstreams.json` | `fbb18727a17139901bc46e36675e779ec6874383` | workstream registry |
| `hq` | `projects/storage-rescue/PLAN.md` | `be5253f64db934cec0bb2edab58ea6cf8f5ddd50` | capacity incident action queue |
| `hq` | `recon/PLAN.md` | `9105ecb931b7d09604f781e9ff59b5dd7a09f712` | PC HQ reconnaissance |
| `zcode-setup` | `TRACKER.md` | `301d82fe76ad77ecc3b1899119fe032b24d395cf` | ZCode playbook work |
| `aion` | `workspace/aion/canon/EXECUTIVE-DECISIONS-2026-10-16-COS.md` | `e90923e07b854319cf5b3a0aa8b58a8a9975fbf6` | executive work allocation |

## Historical but NOT touched within this 2-day window
`VOMEGA/.project/pm/generated/BUILD-PLAN.md` latest `fdd4740e2efbf86043f36a03f033b834b05ed383` on 2026-10-07; `VOMEGA/.project/pm/build-plan.json` latest `10a8bebbdda776de2a8c2a35699505e049e02b68` on 2026-10-06. These are useful planning **history**, not newly pushed PM lists on Oct 14–16. Other source work orders/issues, dry-run audit reports, and GitHub issue trackers exist and are not exhaustively enumerated here.

## Rules for AION PM ingestion
1. Normalize these as **source artifacts** with repo/path/latest-file-commit; do not duplicate their contents wholesale, do not promote provisional 1,000 items into active tasks.
2. Reconcile task identity across ACP, Product Hub, UAH, PWA, ZBot and Global PM using original issue IDs and source references.
3. Distinguish list artifacts vs 13-repo active project state vs unpublished/missing assets; label project-specific completion only from independent proof.
4. AION PM is responsible for `pm/ledger.md` and response files in `pm/outbox/`; AION accepts decisions; BFF executes. The file existing proves publication, not that PM is polling.
