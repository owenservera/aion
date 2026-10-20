# AION Harvest landing zone — capture-first v1
Status: LANDING SCAFFOLD. Source copies not yet populated. Scope: local donor repositories `C:\0-BlackBoxProject-0\vivim-final` and `C:\0-BlackBoxProject-0\Vivim-omega`. Do not claim remote access to local checkout.

## Mission
Identify, FLAG and COPY broad but relevant reusable *technical intelligence* before assessing or integrating it into AION Track B. Harvest does not determine AION authority. Preserve provenance and original semantics. This landing area does not modify existing FINDINGS.md or existing Track B implementation.

## Directory ownership
- `tracks/final.md`: independent worker A — vivim-final; captures under `sources/vivim-final/`.
- `tracks/omega.md`: independent worker B — Vivim-omega; captures under `sources/vivim-omega/`.
- `tracks/crosswalk.md`: independent worker C — cross-repo taxonomy, duplicate/variant relationships, coverage maps; writes under `synthesis/`; may begin from existing FINDINGS.md, updates as A/B publish.
- `SCHEMA.md`: record and evidence rules across all workers.
- `sources/<source>/index.jsonl`: append-only inventory of candidate records (one JSON object per line).
- `sources/<source>/items/<id>/`: evidence card and selective original source excerpts for one candidate; create as needed, not empty placeholders.
- `synthesis/`: crosswalks and unresolved conflicts, never authoritative Track B specifications.

## Capture workflow
1. Inventory relevant source trees, instructions and actual checkout/revision (commit + dirty status). Distinguish canonical modules, forks, generated copies and deprecated experiments.
2. FLAG candidates using broad relevance categories before ranking. Capture items even if their immediate Track B use is uncertain.
3. COPY the bounded owning code/document section and essential caller/contract/test excerpts only, including original terms; preserve relative source paths and line spans. Hash copied bytes. Never claim a partial copy is a complete module.
4. Link related records, mark duplication/variants and original dependencies; record read coverage, actual tests (if any), and known caveats.
5. Publish incremental, independently readable batches. Source copies remain research evidence, not runtime dependencies or permissions.

## Priority capture domains
Provider types/families and implementations; capability semantics and specialization; conversation/session/stream/turn state; observation/action/confirmation; availability/readiness/authority; command/spec/schema; agent/provider/account/model/session identities; adapters, plugin contracts and extension points; reliability/recovery/idempotency; transport and protocol abstraction; tools and integration interfaces; message identity and correlation; context/knowledge/evidence/telemetry; provenance/test fixtures; UI affordance taxonomy; version/migration and feature negotiation.

## Boundaries
Read-only donor sources. No credentials, cookies, account data, private transcripts or bulk datasets. No automated browser work, CDP, Playwright, Puppeteer or Orca. Do not copy entire repositories, large lockfiles, generated build artifacts or vendor directories. Do not change AION product code, canonical specs, grants or running browser state. No background wake/scheduler. Workers use their own paths to avoid write conflicts; commit/push each finished batch on an approved working branch and log commit. Local Windows remains source authority; no remote commit is proof a local checkout was inspected.

## Promotion
Capture -> reviewed source evidence -> proposed AION mapping -> development-owner disposition -> separately tested integration. Nothing captured here is automatically accepted.
