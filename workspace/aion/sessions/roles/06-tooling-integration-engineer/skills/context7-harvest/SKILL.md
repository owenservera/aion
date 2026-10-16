---
name: context7-harvest
description: Fetch version-specific primary documentation and provenance for AION tools via connected Context7 and persist the corpus to SOFTWARE_HQ.
---
# Context7 Canonical Documentation Harvest

## Standing source rule
ALL Context7 pulls—raw docs plus search/request scripts or exact queries—must be saved and pushed to the dedicated SOFTWARE_HQ folder once the actual authorized repo path is confirmed. No storing only a prose summary in AION.

## Recipe
1. Identify component + pinned installed/target version and precise interoperability question.
2. Resolve vendor/library identity and docs source via connected Context7 when available, otherwise cite vendor primary docs and state source.
3. Pull targeted protocol endpoints, CLI flags, session lifecycle, permissions, configuration, compatibility and failure behavior; avoid irrelevant bulk dumps.
4. Preserve raw retrieved content subject to licensing and connector terms, request/query metadata, origin URL, fetched date, library version, relevant file paths and checksum.
5. Commit to confirmed SOFTWARE_HQ location through authorized process; write index/link back to AION TOOL-REGISTRY and relevant SKILL.md.
6. Convert each critical uncertainty into an explicit test or version-capability gate. Do not assume docs prove the installed tool behaves identically.

## Contract
If exact SOFTWARE_HQ destination is unknown, leave a documented pending staging reference and obtain the canonical destination; never invent a folder or claim a successful push.
