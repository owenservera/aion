      };
    },

    "browser.release@1": async (payload: unknown, ctx: PluginContext) => {
      const op = "browser.release@1";
      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error(`${op}: payload must be an object {sessionId}`);
      }
      const sid = reqStr(op, "sessionId", (payload as Record<string, unknown>).sessionId);
      const got = await portCall<VaultGetResult>(ctx, "vault.get@1", { ns: PROVIDERS_NS, id: sid });
      const session = asSessionRecord(got.data);
      if (!session) throw new Error(`${op}: session ${sid} is malformed — refusing (fail-closed)`);
      if (session.status !== "ATTACHED") throw new Error(`${op}: session ${sid} is ${session.status}, not ATTACHED`);
      const w = await portCall<VaultAppendResult>(ctx, "vault.append@1", {
        ns: PROVIDERS_NS, id: session.sessionId,
        data: { ...session, status: "RELEASED" },
        meta: { type: "session", archetype: session.archetypeSlug, provider: "browser", status: "RELEASED" },
        refs: [session.captureRef],
      });
      return { sessionId: session.sessionId, status: "RELEASED", rev: w.rev };
    },

    "message.send@1": async (payload: unknown, ctx: PluginContext, meta: CallMeta) => {
      const op = "message.send@1";
      const cfg = resolveConfig(ctx);

      // ── Bar 1 — the day-one fence holds ────────────────────────────────
      const fenceHolds = (ctx as PluginContext & { __browserFenceHolds?: boolean }).__browserFenceHolds === true;
      if (!fenceHolds) {
        throw new Error(
          `${op}: browser fence incomplete (registered ${fenceSnapshot.registered.length}, failed [${fenceSnapshot.failed.join(", ")}]) — day-one forbidden entries are not registered; sends fail closed (D-338/D-357 bar 1)`,
        );
      }
      const input = validateSendPayload(op, payload);
      if (cfg.fencedRecipients.some((r) => input.to === r || input.to.endsWith(`@${r}`))) {
        throw new Error(`${op}: recipient ${input.to} is fenced by the composition's day-one entries — refusing`);
      }

      // ── Bar 2 — the session is attached ────────────────────────────────
      const sessGot = await tryGet<VaultGetResult>(ctx, "vault.get@1", { ns: PROVIDERS_NS, id: input.sessionId });
      const session = sessGot ? asSessionRecord(sessGot.data) : null;
      if (!session) throw new Error(`${op}: session ${input.sessionId} is missing or malformed — refusing (bar 2)`);
      if (session.status !== "ATTACHED") throw new Error(`${op}: session ${input.sessionId} is ${session.status} — refusing (bar 2)`);
      if (session.archetypeSlug !== "message.send") throw new Error(`${op}: session realizes ${session.archetypeSlug}, not message.send (bar 2)`);

      // ── Bar 3 — the realization is PROMOTED (standard lifecycle) ───────
      const realId = `realization:message.send:browser`;
      const realGot = await tryGet<VaultGetResult>(ctx, "vault.get@1", { ns: PROVIDERS_NS, id: realId });
      const realization = realGot ? (realGot.data as ProviderRealization | null) : null;
      if (!realization || typeof realization !== "object") {
        throw new Error(`${op}: no realization row for ${realId} — run discovery.verify@1 first (bar 3)`);
      }
      if (realization.status !== "PROMOTED") {
        throw new Error(`${op}: realization ${realId} is ${String((realization as { status?: unknown }).status)}, not PROMOTED — refusing (bar 3)`);
      }
      if (realization.providerClass !== "BROWSER_MEDIATED") {
        throw new Error(`${op}: realization ${realId} is ${String(realization.providerClass)} — the browser bar demands BROWSER_MEDIATED (bar 3)`);
      }

      // ── Bar 4 — a pin covers the parser version ────────────────────────
      const manifestParserVersion = ctx.manifest.contributions.parser?.[0]?.version ?? PARSER_VERSION;
      if (session.parserVersion !== manifestParserVersion) {
        throw new Error(`${op}: session parser v${session.parserVersion} does not match the manifest's v${manifestParserVersion} — refusing (bar 4)`);
      }
      const pins = realization.parserPins ?? [];
      const covered = pins.some((pin) => pinMatches(pin, "browser", "message.send", session.parserVersion));
      if (!covered) {
        throw new Error(`${op}: no verified pin covers browser/message.send v${session.parserVersion} (pins: ${pins.length}) — refusing (bar 4)`);
      }

      // ── The gated replay ───────────────────────────────────────────────
      const capGot = await portCall<VaultGetResult>(ctx, "vault.get@1", {
        ns: session.captureRef.ns, id: session.captureRef.id, rev: session.captureRef.rev,
      });
      const capture = asCaptureRecord(capGot.data);
      if (!capture) throw new Error(`${op}: capture row ${session.captureRef.id} is malformed — refusing (fail-closed)`);
      const parsed = resolveParser(session.parserVersion).transform(capture.redactedText);
      const chunks: StreamChunk[] = buildChunkEnvelope(meta.causationId, parsed); // exactly-one-final, seq discipline pre-checked
      for (const c of chunks) meta.emit(c.data, c.final); // the shim enforces strict seq + close-once (D-352)

      const id = `msg_${randomBytes(8).toString("hex")}`;
      const sentAt = Date.now();
      const message = {
        id,
        threadId: input.threadId ?? threadIdFor(input.subject, input.to),
        folder: "sent",
        from: cfg.from,
        to: input.to,
        subject: input.subject,
        body: input.body,
        sentAt,
        flags: { seen: true, flagged: false, draft: false }, // materialized in state sent (pack state machine)
      };
      const append = await portCall<VaultAppendResult>(ctx, "vault.append@1", {
        ns: "email", id, data: message,
        meta: { type: "message", provider: "browser", sessionId: session.sessionId, captureRef: session.captureRef },
        refs: [{ ns: PROVIDERS_NS, id: session.sessionId, rev: sessGot.rev }, session.captureRef],
      });
      void meta.causationId; // stamped into the vault changelog by the vault itself
      return { messageId: id, rev: append.rev, sentAt, chunks: chunks.length };
    },
  },
});

startPlugin(def);