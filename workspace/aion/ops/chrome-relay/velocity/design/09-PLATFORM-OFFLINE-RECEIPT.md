# AION Track B semantic overlay — isolated Node test receipt

**Execution date (UTC):** 2026-10-20T12:01:33Z (start of recorded rerun). **Runner:** Linux container, Node v22.16.0. **Scope:** five new independently staged, exact-blob-matching pure source/test files only, **not** the complete AION repository or owner's Windows machine.

**Exact source/target:** owenservera/aion branch track-b/platform-local-candidate-20261020. Git blob SHA1s below matched both stage files (git hash-object) and current GitHub fetch_file content:

| File under velocity/ | Verified blob SHA1 |
| --- | --- |
| src/platform/semantics.mjs | dfd53bdcfb86251f669f21d28cb467be28db19c3 |
| src/platform/inspect.mjs | cb3e5b54b557caf053e4e7e9590fc2c924106d12 |
| src/platform/harvest.mjs | e463d05cff8ab3833c0d3fb393dccf34063a00ac |
| test/platform-semantics.test.mjs | 7aba9ea54bce411ff73e796a383066d85dd99392 |
| test/platform-harvest.test.mjs | e640b5007b014b55f6173b438f113e727de90dbd |

**Command executed in isolated stage:**

~~~text
node --test /mnt/data/aion-stage/velocity/test/platform-semantics.test.mjs /mnt/data/aion-stage/velocity/test/platform-harvest.test.mjs
~~~

**Observed summary:** 22 tests, 22 PASS, 0 FAIL, 0 cancelled, 0 skipped, 0 todo. Separate geometry smoke test used a fully nested fake checkout with one copied excerpt/one ledger row and verified that the relative Git workspace root and donor-copy SHA audit resolve correctly; returned LANDING_HASHES_MATCH for that synthetic fixture. This is an OFFLINE FIXTURE and **not** a test of the actual 65-row corpus.

**NOT RUN / NOT CLAIMED:** the 5 new test/platform-cli.integration.test.mjs cases (they depend on existing complete repo modules), complete velocity/bus/extension/bridge selftest, actual 65-record SHA audit on Windows, Windows filesystem permissions/registry/native host, current Chrome page/Send or OpenCode provider turns. The earlier Windows 1,082-test receipt is from an older source head and is NOT a current candidate test.

**Review implication:** new pure modules have executable isolated validation, but the PR remains draft and cannot be promoted until L0–L2 full local tests, CENV negative matrix and separate live Chrome acceptance are provided. No secret data, private browser content, native login, online actions or GitHub Actions were used in this receipt.


## Superseding C-004 semantic-family normalization rerun

**Recorded rerun start (UTC):** 2026-10-20T12:07:36Z. **Runner:** same isolated Linux container, Node v22.16.0. After normalizing the semantic master to Crosswalk C-004 (canonical ai_conversation_webapp, explicit ai_chat_webapp alias, provider_id/application_family/application_shape/realization_mode), the **same two isolated source test files** were rerun:

~~~text
node --test /mnt/data/aion-stage/velocity/test/platform-semantics.test.mjs /mnt/data/aion-stage/velocity/test/platform-harvest.test.mjs
~~~

**Observed:** 23 PASS, 0 FAIL, 0 skipped, 0 cancelled. New source/test blobs match current committed GitHub content:
- velocity/src/platform/semantics.mjs — 1d378b113d64ac2f3775695be9307605ad4f0ace
- velocity/test/platform-semantics.test.mjs — 61207d587dc8be45cd0e7a51f4e717482d2785cd
- inspect.mjs, harvest.mjs and platform-harvest.test.mjs retain the same blobs as the original table.

The actual seed JSON C-004 is committed as blob 5535e69d42e6ca8f7ec5e20f0531a301c0c798e1; its **repository-based CLI integrated test remains UNRUN** here. Total new test files now define 15 semantic + 8 Harvest + 5 repository-integrated = **28 tests**. This supersedes the earlier 22-test run as the latest pure-module receipt only; it is not a complete AION selftest or a Windows/live-provider claim.
