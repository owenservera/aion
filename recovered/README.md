# IAM / UAH artifact recovery — 2026-10-16

## Purpose and provenance
Recovery requested by AION PM on Owen's behalf. GitHub repository: `owenservera/aion`, branch `main`.

The three published **text files** were recovered by reading indexed Project Library content for files originally generated in the UAH and IAM ChatGPT workstreams. Their text was exported from the indexed representation and written to GitHub without manual substantive edits. **These are recovered source-text representations, not proven byte-identical copies of the original uploads** (indexed text can normalize end-of-file newlines). SHA-256 values below describe the exact GitHub-exported file contents, not inaccessible original bytes.

| File | Classification | Source record | SHA-256 of published bytes |
|---|---|---|---|
| `iam/schema.sql` | recovered source text | Project Library `/001.PROJECTS.PM/schema.sql`; 7,958 source-record bytes | `58fa38a4ab6d3da1147aad0ce4c42c496c47848415941412cc9021543be800a0` |
| `iam/build.py` | recovered source text | Project Library `/001.PROJECTS.PM/build.py`; 6,894 source-record bytes | `33ade71081fbae8476de76d619395d2af19ee7be6c8328efdd03ccc1dcfe80b0` |
| `uah/project.yaml` | recovered source text | Project Library `/001.PROJECTS.PM/project.yaml`; 12,012 source-record bytes | `300a5226012f9d5cf4e09ee644b2e4b8b1db27d9d90ec626021fef9f20391972` |

## Binary originals — not recovered
- `iam_core_v0_1.sqlite3`: Project Library record `/001.PROJECTS.PM/iam_core_v0_1.sqlite3`, reported 278,528 bytes. An authorized raw-byte export was denied by the Project file access interface. **No reconstructed binary committed.** Its source-code builder has been recovered, so a **new generated database** can be produced with `python build.py` in `recovered/iam/`; it would not be claimed byte-identical to the original.
- `uah_integration_dispersion_v0_1.sqlite3`: Project Library record `/001.PROJECTS.PM/uah_integration_dispersion_v0_1.sqlite3`, reported 57,344 bytes. Raw-byte export similarly denied. **No reconstructed binary committed.** Do not infer its complete schema or data from `project.yaml`, which says it was generated from a **different** file, `uah_integration_project_v0_2.sqlite3`.

Original Library binary SHA-256 checksums cannot be calculated without original bytes.

## Original conversation identification
- IAM: **IANG Integration Automation Planning** (2026-10-15); this is the workstream where the IAM core data model and three IAM artifacts were reported. 
- UAH: **UAH Project Mapping Design** (2026-10-15); the UAH logical project map and dispersion datasets belong to this workstream.
- Related historical titles: **Universal ACP Hub Design**, **Pull Repos And Boundaries**, **Reusable Integration Toolkit**, and **Remote Sitrep Summary**.
- **Direct `chatgpt.com/c/...` conversation IDs/links were not retrievable** from the accessible evidence, so none have been invented.

## Important qualifications
1. This is a recovery export, not a claim that the IAM and UAH schemas have been reconciled into one canonical SQLite database.
2. `project.yaml` identifies itself as `unified-project-map/v0.2` and its generation source as `uah_integration_project_v0_2.sqlite3`, **not** the requested dispersion v0.1 database.
3. The recovered IAM `schema.sql` and `build.py` are a **candidate v0.1**. Their execution output should be independently tested before promotion.
4. Source-recovery checksums are content checksums of the files published here. They do not establish binary equivalence to the original Library objects.
5. The blocker for recovering both original SQLite databases is raw-byte access to those Library artifacts. The next recovery route is the original downloaded file or an authorized attachment/export surface.
