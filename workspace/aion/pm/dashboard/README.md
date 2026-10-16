# AION PM dashboard
Static single page (src/index.html) plus build.mjs, which bundles ../ledger.json, ../RISKS.md and ../DECISIONS.md into dist/data.json.
Vercel project: aion-pm-dashboard (Vercel Authentication on all deployments).
URL: https://aion-pm-dashboard-owens-projects-11d54253.vercel.app
Deploy today: run ./snapshot.sh, then a source deploy (Vercel MCP create_deployment) of pm-snapshot.json, build.mjs, src/index.html and vercel.json.
Git auto-deploy from owenservera/aion is connected but BLOCKED: autopush commits are authored by "AION BFF", who is not a member of the Vercel account.
The page re-fetches data.json every 60 s and re-renders when it changes.
