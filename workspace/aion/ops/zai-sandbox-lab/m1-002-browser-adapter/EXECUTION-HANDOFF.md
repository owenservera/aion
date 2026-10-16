# AION M1-002 — executable two-role handoff
Status: ASSIGNED_IN_GITHUB / NO INDEPENDENT ROLE ACK / NO M1-002 TEST RUN.
Authoritative issue: https://github.com/owenservera/aion/issues/26
Upstream independently checked mock export receipt: https://github.com/owenservera/aion/issues/24#issuecomment-6226081655
M1-001 owner-supplied export ZIP SHA256: a99998356829ca28291ea04563eb35d3c9863061edacf8e21247768ddddce50a (not present as GitHub repo bytes).

## TOOLSMITH 06 — launch packet
You are TOOLSMITH 06, technical lead for AION M1-002. Read issue #26, canonical M1, relay ENVELOPE-CONTRACT.md, M1-001 receipt and current 06 SITREP. Produce implementable minimal browser adapter contract for a disposable ChatGPT-like test page: exact event envelope/ACK/reply/readback, origin and grant checks, UI send and response capture including streaming, dedup/reload/retry/recovery and false-proof negatives, no real ChatGPT selectors assumed. Publish TOOLSMITH-ADAPTER-CONTRACT.md in this folder and report real evidence on issue #26 using AION_M1_002_COMPONENT_V1. If you can build and run a safe mock-only adapter, include actual source and test receipts; otherwise provide exact Z.ai build instructions and mark tests NOT_RUN. No Playwright/Puppeteer or real account/session access. Respond with the actual files read, current blockers and next executable action.

## Z-FORGE 08 — launch packet
You are Z-FORGE 08, integration lead for AION M1-002. Read issue #26, TOOLSMITH 06's *actual* component (or label its absence), M1-001 independently checked export and canonical M1. Prepare the smallest owner-attachable offline ZIP for Z.ai WEB Agent Mode: isolated fake ChatGPT-like page, browser adapter, simulated AION consumer, deterministic tests including wrong-origin/target, duplicate composer, mismatched correlation, streaming/partial reply, reload, disconnect/reconnect, replay, forged LIVE/M1, and export tampering; source/file hashes and extraction/rerun instructions; one copy-ready prompt and conditional repair-only prompt. Preserve ACK != response != AION consumption. If the role is not activated or Z.ai has not run, report PACKAGE_PREPARED_NOT_RUN or BLOCKED, not SANDBOX_TESTED. Never assume private repo clone works. Do not touch authenticated ChatGPT, production hosts, secrets or use Playwright/Puppeteer. Publish actual artifacts and AION_M1_002_COMPONENT_V1 on issue #26.

## CoS 03
Obtain actual separate role-chat acknowledgments from 06 and 08 and report to #26. Repo/SITREP edits are NOT employee activation. If no chat access, report exactly that.

## Pre-live acceptance
- Contract reviewed and no unsupported selectors/permissions.
- Actual disposable fake page and adapter source present; negative tests pass.
- ZIP manifest and SHA-256; fresh extraction tests pass independently.
- Real Z.ai run results explicitly separated from local tests.
- No live M1 claim; owner must authorize a separate authenticated ChatGPT web-app trial for G6.
