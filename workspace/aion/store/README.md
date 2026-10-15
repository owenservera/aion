# AION store

- `aion-bff-thread.jsonl` — one JSON object per message: `ts` (ISO, Europe/Paris), `role` (`owen`|`aion-bff`), `text`.
- `aion-bff-thread.md` — human/LLM-readable briefing + full chronological transcript.
- `replay/part-NN.md` — the transcript split into chunks <= 12000 chars.
- `sync.sh` — regenerates the .md and replay parts from the .jsonl (idempotent).

## Replay into AION
Paste `replay/part-01.md`, `part-02.md`, ... in order into ChatGPT/AION, or have AION read raw files from
https://raw.githubusercontent.com/owenservera/aion/main/workspace/aion/store/

Status: the .jsonl has not been populated yet — the transcript export tool was unavailable to the agent that created this folder.
