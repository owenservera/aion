# AION Universal Command Space

**Version:** 0.1.0 (2026-10-20) · **Status:** seeded research registry, not a live capability oracle.

This is AION's one-stop, provider-neutral inventory of semantic commands and candidate execution routes: **13 providers, 22 commands, 25 documented or proposed routes, and 550 provider/command/route mappings**. It distinguishes what an external product documents from what AION implements and what was actually verified on this account.

## Files

- [aion_command_matrix.csv](aion_command_matrix.csv) — human-reviewable and Git-diffable source registry; each row is a command on one provider-specific route.
- [build_sqlite.py](build_sqlite.py) — rebuilds the searchable SQLite database from this CSV, using the Python standard library.
- [EXTENSION-GUIDE.md](EXTENSION-GUIDE.md) — how to extend the command vocabulary, provider routes, evidence, and maturity levels.
- [AION-INTEGRATION.md](AION-INTEGRATION.md) — proposed router integration without rewriting Bus V1/V2.

Run from this folder:

```bash
python build_sqlite.py
python build_sqlite.py --check
```

The generator produces `aion_command_space.sqlite` **locally**. The versioned CSV is the portable source of truth; never let generated SQLite edits silently overwrite CSV. An XLSX inspection snapshot also exists in the owner's original development package but is not required by the runtime.

## Fields

- `provider`, `vendor`: marketed product and company.
- `surface`: web, API, app/plugin, ACP, CLI or local transport.
- `command`, `cli_verb`: provider-neutral intent, independent of transport.
- `native_path`, `transport`: candidate provider or platform integration mechanism.
- `native_support`: DOCUMENTED / CANDIDATE / UNKNOWN / NOT_APPLICABLE.
- `native_entitlement`: UNKNOWN / REQUIRES_ACCOUNT_TEST / NOT_REQUIRED.
- `aion_status`: OFFLINE_IMPLEMENTED / PLANNED / PENDING / NOT_APPLICABLE.
- `runtime_status`: OFFLINE_PASS_REPORTED / LIVE_PENDING / UNKNOWN.
- `fidelity`: SAME_WEB_CONVERSATION / NEW_API_SESSION / LOCAL_RUNTIME / UNKNOWN.
- `verification_status`: DOCUMENTATION_ONLY / INTERNAL_REPO_REPORT / NOT_RESEARCHED / LIVE_VERIFIED.
- `confidence`, `priority`: investigation confidence and rough triage.
- `documentation_url`, `notes`: evidence trail and crucial caveats.

**Strict invariants:** documentation does not prove entitlement; API session ≠ web conversation; offline tests ≠ live support; pending remains pending until a verified implementation receipt; no automatic resend after uncertain submission.

## Quick queries

```sql
SELECT * FROM command_matrix WHERE provider='ChatGPT' AND command='send';
SELECT * FROM missing_aion_paths WHERE command IN ('send','observe','reply.read');
SELECT provider, surface, native_path, aion_status, runtime_status
FROM command_matrix WHERE command='send' ORDER BY provider, surface;
```

## Existing AION context

See [Bus V1/V2](../chrome-relay/bus/README.md), [TOOLSMITH research](../../sessions/roles/06-tooling-integration-engineer/research/ACCELERATION-AND-PLUGIN-2026-10-18.md), and [TOOLSMITH SITREP](../../sessions/roles/06-tooling-integration-engineer/SITREP.md).

This registry **does not yet drive the live router**; integrating it is proposed in AION-INTEGRATION.md. No local Windows installation or provider-live checks are asserted here.
