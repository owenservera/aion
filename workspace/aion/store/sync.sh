#!/usr/bin/env bash
# Idempotent: regenerate aion-bff-thread.md + replay/part-*.md from aion-bff-thread.jsonl
# Input: aion-bff-thread.jsonl (one {"ts","role":"owen"|"aion-bff","text"} per line), produced by
# exporting the AION BFF transcript (agent eaf650b7-...) via the ReadTranscript tool.
set -euo pipefail
cd "$(dirname "$0")"
[ -f aion-bff-thread.jsonl ] || { echo "missing aion-bff-thread.jsonl"; exit 1; }
python3 - <<'PY'
import json,os,glob
msgs=[json.loads(l) for l in open('aion-bff-thread.jsonl') if l.strip()]
msgs.sort(key=lambda m:m['ts'])
hdr="# AION BFF <-> Owen thread\nRe-streamable briefing for AION. Roles: owen = user, aion-bff = assistant. Times Europe/Paris.\n\n## Transcript\n\n"
body="".join(f"[{m['ts']}] {m['role']}:\n{m['text']}\n\n" for m in msgs)
open('aion-bff-thread.md','w').write(hdr+body)
os.makedirs('replay',exist_ok=True)
for f in glob.glob('replay/part-*.md'): os.remove(f)
parts,cur=[],""
for blk in body.split("\n\n["):
    blk=blk if blk.startswith("[") else "["+blk
    if len(cur)+len(blk)>11500 and cur: parts.append(cur); cur=""
    cur+=blk+"\n\n"
if cur.strip(): parts.append(cur)
for i,p in enumerate(parts,1):
    open(f'replay/part-{i:02d}.md','w').write(f"AION BFF thread, part {i}/{len(parts)}\n\n"+p)
print(len(msgs),"messages,",len(parts),"parts")
PY
