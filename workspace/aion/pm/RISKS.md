# Risks, drift, blockers
|ID|Type|Risk|Evidence|
|-|-|-|-|
|R1|Blocker|Core DBs (IAM 33-table, UAH dispersion v0.2, project.yaml) exist only in ChatGPT sandbox; can be lost|IAM_CORE_V0_1.md L39; D1|
|R2|Drift|Table counts differ: UAH 8 / IANG 23 / IAM 33 / older 28-DDL. No single schema yet|D2|
|R3|Drift|Two "project.yaml"s: SOFTWARE_HQ inventory one vs. missing generated one. Easy to confuse|D1|
|R4|Blocker|UAH CLI has no entry point; ACP Bridge missing (blocks P4 agents domain)|SOFTWARE_HQ tree; MAP.md (claimed)|
|R5|Blocker|W01-W03 unproven; W03 was only a manual one-off|workload-registry.json|
|R6|Drift|Name drift: Universal ACP Hub vs Universal Agent Hub; IAM vs IANG|D3|
|R7|Ops|PC disk ~6.3 GB free (10-14 reading); current value UNKNOWN|hq#7|
|R8|Process|aion autopush loop pushes all of /workspace/aion every 60 s with no review gate|bff/aion-autopush|
|R9|Process|Dispatch issues piling up in 001.PROJECTS.PM with no consumer|D4|

|R0|Blocker|P0#1 AION capabilities on Owen's PC blocked: ACP Bridge missing, no receipt consumer, Tailscale/Windows approvals pending, low disk|PM-000|
|R10|Security|Bus V1 commander channel: prompt injection could yield a valid AION_CMD_V1 block when the owner arms a turn that reads hostile content|decision 2026-10-19 §5|
|R11|Process|Bus V1 runaway loop between agents/commander; mitigated only by hop limit, rate and kill switch (not built)|decision 2026-10-19 §5|
|R12|Ops|PC asleep/offline or Chrome closed: phone commands undeliverable; must not be queued and replayed silently|decision 2026-10-19 §7|
|R13|Account|Consumer-UI automation of chatgpt.com may violate terms or trigger account action; UNVERIFIED, owner decision|decision 2026-10-19|
|R14|Assumption|UNVERIFIED: a phone-sent message appears in an open PC tab without reload (SYNC-0 unrun)|decision 2026-10-19 §7|
