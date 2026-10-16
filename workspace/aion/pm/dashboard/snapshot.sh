#!/bin/bash
# Writes pm-snapshot.json (ledger + RISKS + DECISIONS) for source deploys. Prints its sha.
cd "$(dirname "$0")" && python3 -c '
import json,hashlib,datetime
d={f:open("../"+f).read() for f in ["ledger.json","RISKS.md","DECISIONS.md"]}
d["sha"]=hashlib.sha1("".join(d.values()).encode()).hexdigest()[:7]
d["at"]=datetime.datetime.now().astimezone().isoformat(timespec="seconds")
json.dump(d,open("pm-snapshot.json","w"));print(d["sha"])'
