# Z-FORGE — Vendor Documentation & Web-App Verification Map
Initial public research date: 2026-10-16.
**Target product:** Z.ai web Full-Stack / Agent Mode, as seen at https://chat.z.ai/?mode=agent .
There is **no authenticated account access** to the user's Z.ai web session from this ChatGPT thread. Descriptions of model selection, Linux sandbox, clone permissions and internal agent team originate from owner observations unless separately tested.

## Sources with product boundaries
1. **Z.ai official landing page** https://chat.z.ai/?mode=agent
   - Supports: web interface visibly includes a **Full-Stack** category.
   - Does NOT support: exact personal sandbox OS/image, file mounts, git scopes, models selectable in owner's account, subagent count, export pipeline or turn quotas.
2. **Z.ai official GLM-4.5 launch blog** https://z.ai/blog/glm-4.5
   - Supports: Z.ai publicly markets integrated full-stack development and iterative full-stack creation; vendor describes a coding agent demo for web apps.
   - Does NOT support: today's account-level sandbox internals, current model/quotas or private repo access.
3. **Z.ai official GLM-4.6 blog** https://z.ai/blog/glm-4.6
   - Supports: vendor-reported coding/agentic abilities of GLM-4.6 and historical model capabilities.
   - Does NOT support: actual currently selected GLM model in this user's Agent Mode sandbox.
4. **ZCode official documentation** https://zcode.z.ai/en/docs/welcome ; https://zcode.z.ai/en/docs/agents ; https://zcode.z.ai/en/docs/browser-use
   - Supports: separately installed **ZCode** agentic development workspace/browser features.
   - Does NOT support: automatic transfer of ZCode's subagents, browser controls, client capabilities, quotas or persistence to Z.ai *web* Agent Mode.
5. **Owner firsthand description** (2026-10-16, project conversation)
   - Claims, to verify at the account: Chat versus Agent web modes, Linux computer sandbox, one selected model per spin-up, internal agent team, repo cloning, web browsing, full-stack development and Chrome extension testing.
   - Treat as valuable OWNER_REPORTED product experience, not independent proof from web/public documentation.

## Fastest evidence capture without wasting a development turn
- Have owner supply one sanitized screenshot of the Z.ai web Agent Mode header/model choice and available tool/artifact controls, if convenient; otherwise use the first real turn receipt as the source.
- Ask initial sandbox prompt for minimal redacted version/tool inventory, allowed preview/extension loading and export modes, **not credential or private file data**.
- Build one disposable source artifact to test actual compile, tests and export instead of merely asking the model to describe capabilities.
- Capture exact URL/mode/model/date, which controls appear vs which are actually usable, and artifact download evidence. Update CAPABILITY-LEDGER.md with citation, not guesses.

## Non-goals
No attempts to access session cookies, log into personal accounts, bypass authentication, purchase tools, install native tools on owner's machine, or use Playwright/Puppeteer.
