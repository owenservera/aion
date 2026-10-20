# Nine-Repo Leapfrog Discovery — source-only handoff (2026-10-20)

**Worker dispatch:** received in Nine-Repo Discovery chat, High effort. **Scope:** static inspection of existing pinned imports on AION `main`; no donor tests, wiring verification, live CDP/WebMCP, code adaptation or AION runtime change. **Owner:** External Nine Discovery. **Recipient:** Integration Manager via existing [EXCHANGE.jsonl](../../../EXCHANGE.jsonl) records AX-0019–0021, **not an automatically dispatched Integration Manager session**.

**Pinned donor custody:** Cereon `06da45090607dd9c9dc883ef5d523e9c99bcdb24` (MIT); CDPilot `234d8bf3d1c0144792654bf670f07f93ffd8a1d3` (MIT); both existing imported snapshots on AION `main`. Pins are upstream commits, not AION file blob SHAs. Retention baseline [VOMEGA NLCL](../../../landing/sources/vomega/RETENTION-ASSESSMENT.md), already AX-0003. Existing Bridge/Multi-AI PACK-01/02 handled by Integration Manager; not re-harvested.

## Ranked source-backed leads

| Lead | Leverage | Purpose | Primary seam | Decision |
| --- | --- | --- | --- | --- |
| AX-0019 / LF-01 Cereon bounded accessibility inspector | **HIGH** | Reuse compact role/name/visible tree, DOM refs, depth/char budget | P2/I1 read-side diagnostics, later provider family | Most immediately modular; only if PACK-02 needs inspection |
| AX-0020 / LF-02 Cereon MV3 CDP manager, compare CDPilot OOPIF route | **HIGH** (optional) | Avoid custom debugger session fanout and console/network capture; future frame routing | R5 Chrome diagnostics, **not I1 prerequisite** | Park until Dev wants privileged diagnostics |
| AX-0021 / LF-03 CDPilot WebMCP getTools discovery | **HIGH, CONDITIONAL** | Discover page-native tool schema instead of rebuilding UI selectors if any provider supports it | R5 Command Space / native.paths | Research-only; no provider support evidenced |

### LF-01 — Cereon DOM-only bounded inspector

- **Exact pinned source/functions:** [`AccessibilityTreeBuilder.build/walk/renderLine`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/content/accessibility/tree-builder.ts), [`ElementRegistry.getOrAssign/resolve`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/content/dom/element-registry.ts), [`OutputBudget.append`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/content/accessibility/output-budget.ts), plus `accessible-name.ts`, `role-resolver.ts`, `visibility.ts`, `shared/constants.ts`. **Dependencies:** local TypeScript modules and page DOM/content-script context; no `chrome.debugger` for these helpers; MIT attribution.
- **Work eliminated:** generic compact, bounded element/role/name inspector across provider profiles. Depth and character limits, interactive filtering and open-shadow-root descent already appear in source.
- **AION contract seam:** read-only `extension/src/providers/chatgpt/{observer,profile}.js` companion and later multi-provider diagnostics. **Not** a message-ID/revision/page-epoch contract; cannot replace AION `event/1`, `snapshot/1` or PACK-02 terminal classifier.
- **Critical constraints:** references identify a *particular element*, not stable logical message through remount; no recursive iframe traversal; `renderLine` emits input values/URLs and **must be redacted**. `isVisible` may omit legitimate page nodes. Restrict read scope and mark partial coverage.
- **Manager handoff if Development selects:** trim these six modules; convert sensitive output to redacted/bounded data-only diagnostics; scope refs to page epoch; stage code **after** PACK-01/02 without touching Bus/effects. Development tests.

### LF-02 — Cereon MV3 CDP lifecycle + telemetry, versus CDPilot frame engine

- **Exact pinned Cereon modules/functions:** [`CdpSessionManager.session/registerListeners/dropTab`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/background/cdp/cdp-manager.ts); [`CdpSession.ensureAttached/ensureDomain/send/markDetached`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/background/cdp/cdp-session.ts); [`NetworkObserver.handle/snapshot`](https://github.com/cereon-labs/cereon-browser-operator/blob/06da45090607dd9c9dc883ef5d523e9c99bcdb24/src/background/cdp/observers/network-observer.ts) using `CdpEventObserver` and `RingBuffer`. **Dependencies:** MV3 `chrome.debugger` / tabs/windows APIs, TypeScript local modules; MIT.
- **What Cereon eliminates:** per-tab session/detach bookkeeping, centralized CDP event listener, console/network observer fanout and bounded request/response correlation keyed by CDP requestId. This is *tab diagnostics*, not chat reply identity.
- **Differentiated CDPilot option:** [`_FrameRoute`, `_frame_context_for`, `_frame_route_push`, `_frame_route_rewrite`](https://github.com/mehmetnadir/cdpilot/blob/234d8bf3d1c0144792654bf670f07f93ffd8a1d3/src/cdpilot.py#L3819-L4530) handle nested/same-process and out-of-process cross-origin iframes using frameId and flat Target sessions; useful when AION later needs explicit deep iframe coverage. But it is embedded in a ~20,268-line Python CDP tool with effectful commands; **not a low-friction MV3 transplant**. Stdlib-heavy Python rather than Cereon's TypeScript/MV3.
- **AION seam:** *optional* guarded Chrome diagnostic inspector after watch-only I1; no second actuator or direct dispatch from incoming page text.
- **Critical constraints:** debugger attach needs explicit permissions, ownership and compatibility study; Cereon `CdpSession.send` allows arbitrary CDP methods, and `ensureAttached` performs `Emulation.setDeviceMetricsOverride` (an effect), so the donor is **not inherently read-only**. Service-worker revival/detach and captured URL privacy need an AION-owned interface. No donor wiring was verified.
- **Manager handoff if selected:** reduce Cereon to diagnostics-only lifecycle and bounded redacted observers; leave cross-origin frame code as separately pinned future research, not part of I1.

### LF-03 — CDPilot native browser WebMCP tool discovery (unexpected engine)

- **Exact pinned source/functions:** [`WEBMCP_LIST_JS` / `WEBMCP_CALL_JS`, `_webmcp_list`, `cmd_tools_list`, `_webmcp_validate_args`, `cmd_tools_call`](https://github.com/mehmetnadir/cdpilot/blob/234d8bf3d1c0144792654bf670f07f93ffd8a1d3/src/cdpilot.py#L16466-L17035). **Dependencies:** Python stdlib + CDP transport and browser-provided `document.modelContext`; donor records Chromium **146+** and experimental `--enable-features=WebMCP` or an origin trial. MIT; browser/protocol availability unverified outside donor source.
- **Potential work eliminated:** if an AI website registers first-party tools, reading its `getTools()` descriptions and `inputSchema` can replace individual DOM-selector reverse engineering and feed AION Command Space *availability research*. Schema discovery is not an action grant.
- **Differentiating details:** `_webmcp_list` tries isolated-world evaluation, then sometimes main-world fallback; `cmd_tools_list` reports empty/not-available cases. `cmd_tools_call` validates arguments and invokes `executeTool`, so it is **effectful** and must not be routed from Discovery or copied as a secondary actuator.
- **Critical limitation:** **no target ChatGPT/Claude/Gemini/Grok page has been shown to publish WebMCP tools** by this source review. Experimental flag, origin/permissions policy, main-world manipulation and web-thread fidelity are unresolved. Never mark provider native commands available solely from this donor.
- **Manager handoff if Development selects:** only a bounded **list/discover** interface behind AION native capability inventory; defer invocation until Development establishes provider support, target scope and Bus-controlled grants. Not a P1/I1 blocker.

## Explicit dedup / no new claim

- **Parser kernel:** VOMEGA [retention assessment](../../../landing/sources/vomega/RETENTION-ASSESSMENT.md) already establishes 6/11 pure NLCL KEEP candidates, 5/11 ADAPT candidates, D1 declaration validation/digest, and known false-ready account ambiguity. Nine-repo browser/adapter code yielded **no stronger differentiated deterministic semantic compiler** in this bounded sweep. Do **not** create AX-0022 or repeat AX-0003/AX-0005. Future R6, not I1.
- **Transport/recovery:** Bridge AX-0016/0017 already describes cursor/gap/SSE. Cereon SSE is primarily **remote command ingress**, not drop-in AION data-only MV3→host native IPC; no independent transport breakthrough is claimed. Do not replace P3/IPC or create another queue.
- **Source inspection only:** no running of donor tests, no attempt to verify internal wiring, no Playwright/Puppeteer, no provider effects, no source adaptation, no runtime claims, no permission grant. AION snapshot presence is not live functionality.

## Who works next — order and dispatch boundary

| Order | Owner | Assignment | State / dependency | Owner dispatch |
| --- | --- | --- | --- | --- |
| **1** | Integration Manager | PACK-01 Bridge cursor/journal code | Separate dedicated worker instruction already given by owner in conversation; **no source delivery confirmed in this Discovery run** | Review that worker's actual commit, do not infer from TODO |
| **2, parallel to 1** | **External Nine Discovery** | AX-0019/20/21 source sweep + exchange + memo | **DISPATCHED / DELIVERED by this session**, source only | None for this bounded discovery |
| **3** | Integration Manager | PACK-02 read-only Multi-AI helper code | After/alongside PACK-01 *within that worker's dispatch*; not performed here | Wait for package commit and handoff |
| **4** | Development | Decide if AX-0019 beats bespoke inspector, then consider AX-0020, AX-0021 | **NOT DISPATCHED by exchange record**; selection only after actual receipt | Send a concrete packaging task to Integration Manager only if selected |
| **5** | Development | Integrate/test I0→I1 and owner-authorized local receipt | Blocked on actual AION implementation and test; discovery does not unblock itself | Explicitly dispatch live/local agent only when ready |

**Definition of publication:** these three OFFER records are saved to the single exchange for Integration Manager discovery; that does **not** mean an Integration Manager session read or accepted them.
