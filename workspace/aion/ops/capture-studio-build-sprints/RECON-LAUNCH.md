# RECON launch prompt (self-sufficient)

**Set before sending:** Haiku or Sonnet · thinking off or Low · a session with the GitHub connector enabled, or Claude Code inside the checkout. Optionally append `USAGE=NN%` to the first line.

Copy everything inside the block below into a fresh session.

```
#AION @CAPTURE-STUDIO /BUILD-SPRINT RECON

AUTHORIZATION AND ACCESS (read first):
- The repo owenservera/aion is MY repository (I am the owner, Owen Wallace-Servera). It is private. This session has full read and write access to it through the GitHub connector/tools. I explicitly authorize you to read all of it and to commit and push to main for this task.
- Use the GitHub connector/tools (or git with the session's credentials) to read files. Do NOT try to open github.com URLs as an anonymous web page: a private repo returns 404 there, and that does not mean the repo or path is missing.
- If you truly have no GitHub connector, no repo checkout, and no shell/git, STOP and reply only: "NO REPO ACCESS". Never answer from memory, notes, or prior chats, and never ask me to paste files.

FIRST ACTIONS:
1. Get the latest commit SHA of main on owenservera/aion (record it as the RECON SHA).
2. List the folder workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/ . If the list fails or is empty, STOP and report the exact error.
3. Read workspace/aion/ops/capture-studio-build-sprints/LAUNCH.md and SPRINT-01.md (nothing else yet).

JOB: Read-only on product source. Read the full first-party Capture Studio source tree once, plus direct imports into surrounding AION modules. Skip node_modules, build output, lockfiles, vendored code.
For each of the seven layers (Capture & Observation, Evidence & Memory, Interpretation & Derivation, Knowledge & Relationships, Learning & Adaptation, Behavior & Reconstruction, Experience & Control) list what currently exists for: identity, semantics, temporal continuity, provenance.
Row format: layer -> mechanism -> file:symbol -> status (solid | partial | absent) -> one-line note.
Then three short sections:
(a) Top 5 high-blast-radius weaknesses, each with file:symbol.
(b) Contradictions between current code and SPRINT-01.md or worklog W1-W18, each classified current-source-supported | superseded | hypothesis | unknown.
(c) Any significant first-party code you could not read.

RULES: every row must cite a real file:symbol you actually opened; if you did not read it, mark it unknown. No opinions on what to build (that is the DECIDE phase). No tests, no test files, no benchmark runs. Hard cap 2000 tokens for the digest.

OUTPUT:
- Write the digest to workspace/aion/ops/capture-studio-build-sprints/RECON.md with the RECON SHA at the top.
- Update workspace/aion/ops/capture-studio-build-sprints/STATE.json: phase.completed = "RECON", phase.next = "DECIDE", last_observed_product_sha = the RECON SHA.
- Fetch main first, then commit and push to main (no force-push). Commit message ends with the co-author trailer for the model you are.
- Reply with: the remote commit hash, the RECON SHA, and the 5 weaknesses in one line each. Then STOP. Do not start DECIDE.
```
