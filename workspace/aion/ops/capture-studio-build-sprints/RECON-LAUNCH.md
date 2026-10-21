# RECON launch prompt (self-sufficient)

**Set before sending:** Haiku or Sonnet · thinking off or Low · a session that can run shell/git (Claude Code or a repo-linked session). Optionally append `USAGE=NN%` to the first line.

Copy everything inside the block below into a fresh session.

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT RECON

ACCESS CHECK (do this first, answer nothing from memory):
1. If the repo is not already present, run: git clone --depth 1 https://github.com/owenservera/aion
   then cd into it. If cloning fails or you have no shell/git, STOP and reply only: "NO REPO ACCESS - run this in Claude Code or a repo-linked session." Do not summarize from notes or prior chats.
2. Run: git rev-parse HEAD  (record it as the RECON SHA)
3. Run: ls workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/
   If this fails or is empty, STOP and report the exact error.

CONTEXT (read these two files, nothing else yet):
- workspace/aion/ops/capture-studio-build-sprints/LAUNCH.md
- workspace/aion/ops/capture-studio-build-sprints/SPRINT-01.md

JOB: Read-only on product source. Read the full first-party Capture Studio source tree once (the folder in step 3, plus direct imports into surrounding AION modules). Skip node_modules, build output, lockfiles, vendored code.

For each of the seven layers (Capture & Observation, Evidence & Memory, Interpretation & Derivation, Knowledge & Relationships, Learning & Adaptation, Behavior & Reconstruction, Experience & Control) list what currently exists for: identity, semantics, temporal continuity, provenance.
Row format: layer -> mechanism -> file:symbol -> status (solid | partial | absent) -> one-line note.

Then add three short sections:
(a) Top 5 high-blast-radius weaknesses, each with file:symbol.
(b) Contradictions between current code and SPRINT-01.md or worklog W1-W18, each classified current-source-supported | superseded | hypothesis | unknown.
(c) Any significant first-party code you could not read.

RULES: every row must cite a real file:symbol you actually opened; if you did not read it, mark it unknown. No opinions on what to build (that is the DECIDE phase). No tests, no test files, no benchmark runs. Hard cap 2000 tokens for the digest.

OUTPUT:
- Write the digest to workspace/aion/ops/capture-studio-build-sprints/RECON.md, with the RECON SHA at the top.
- Update workspace/aion/ops/capture-studio-build-sprints/STATE.json: phase.completed = "RECON", phase.next = "DECIDE", last_observed_product_sha = the RECON SHA.
- git fetch origin main, then commit and push to main (no force-push). Commit message ends with the co-author trailer for the model you are.
- Reply with: the remote commit hash, the RECON SHA, and the 5 weaknesses in one line each. Then STOP. Do not start DECIDE.
```
