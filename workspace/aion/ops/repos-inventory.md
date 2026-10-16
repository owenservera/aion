# Repos Inventory

Generated at: 2026-10-16T02:18:46Z

Source: live `git` queries executed against each directory in `/workspace/repos`.
HEAD SHA via `git rev-parse HEAD`, upstream SHA via `git rev-parse @{u}`,
clean/dirty via `git status --porcelain` (empty = clean),
last fetch time = mtime of `.git/FETCH_HEAD` in UTC ISO8601.

| Name | Local path | Branch | HEAD SHA | Upstream SHA | Clean/Dirty | Last fetch (UTC) |
| --- | --- | --- | --- | --- | --- | --- |
| 001.PROJECTS.PM | /workspace/repos/001.PROJECTS.PM | main | d8775804cd501ff47d76fe2d2b8ddd2eacc947c4 | d8775804cd501ff47d76fe2d2b8ddd2eacc947c4 | clean | 2026-10-16T02:18:29Z |
| ACP | /workspace/repos/ACP | main | 1adf9891592db54c37d1803ca6c9e8ed43ab592b | 1adf9891592db54c37d1803ca6c9e8ed43ab592b | clean | 2026-10-16T02:18:30Z |
| Product_Hub | /workspace/repos/Product_Hub | main | 594607b577bac933589509812cf73bc1970a39f2 | 594607b577bac933589509812cf73bc1970a39f2 | clean | 2026-10-16T02:18:30Z |
| SOFTWARE_HQ | /workspace/repos/SOFTWARE_HQ | main | 3fa19e8b3735ad29819d429d26f236e528fd4078 | 3fa19e8b3735ad29819d429d26f236e528fd4078 | clean | 2026-10-16T02:18:31Z |
| VOMEGA | /workspace/repos/VOMEGA | main | 12c853259f60cf3a883c7fb1c9f329d696606d64 | 12c853259f60cf3a883c7fb1c9f329d696606d64 | clean | 2026-10-16T02:18:31Z |
| aion | /workspace/repos/aion | main | 7cd099f9b12215a5583b594833d4630bde3d4120 | 40c7d3475adb78fc0abb330721e5cca773d70d1b | clean | 2026-10-16T02:18:32Z |
| grokbot-telemetry | /workspace/repos/grokbot-telemetry | main | 745086134b5c08debc2175ed0bd111b9f3e4f674 | 78a46a0d092ba36bff2ba0323822f5a9b1848b3a | clean | 2026-10-16T02:18:32Z |
| hermes-company-os | /workspace/repos/hermes-company-os | main | b3c215547eea50f6bd7d88f6ccbf8e6441a942c8 | b3c215547eea50f6bd7d88f6ccbf8e6441a942c8 | clean | 2026-10-16T02:18:33Z |
| hq | /workspace/repos/hq | main | 2e5d70dbde9f127c24c920ba0d09823726b31969 | 2e5d70dbde9f127c24c920ba0d09823726b31969 | clean | 2026-10-16T02:18:33Z |
| machine-steward | /workspace/repos/machine-steward | main | d7b17d601806c6226645608c8e6a4d37ddf073be | d7b17d601806c6226645608c8e6a4d37ddf073be | clean | 2026-10-16T02:18:34Z |
| zcode-bots | /workspace/repos/zcode-bots | main | 659bc7e2b67dd2e213c2cdb37c0a3f8399cdc0b5 | 659bc7e2b67dd2e213c2cdb37c0a3f8399cdc0b5 | clean | 2026-10-16T02:18:34Z |
| zcode-pocket | /workspace/repos/zcode-pocket | main | 13597a7ef9c5bf5db2a40a643429fc7c53fbf709 | 13597a7ef9c5bf5db2a40a643429fc7c53fbf709 | clean | 2026-10-16T02:18:35Z |
| zcode-setup | /workspace/repos/zcode-setup | main | a39d35f45072428553dee9800dca20cad2710865 | a39d35f45072428553dee9800dca20cad2710865 | clean | 2026-10-16T02:18:35Z |

## Notes

- All 13 repositories are on branch `main` and all report `clean` working trees.
- `aion` and `grokbot-telemetry` have a local HEAD that differs from their upstream SHA
  (local is behind or has diverged); the other 11 match upstream exactly.
- The working repository at `/workspace/aion` is a separate checkout and has no upstream
  configured on `main`, so `git rev-parse @{u}` fails there.