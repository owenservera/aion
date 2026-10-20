// Phase A — establish executable truth (D1-001..006).
import { describe, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_FRAMES, emptyWorld, interpret } from "../../../../plugins/vivim-nlcl-pure/src/index.ts";
import type { OpFrame, WorldModel } from "../../../../plugins/vivim-nlcl-pure/src/index.ts";
import { capabilityDecl, initialState, requiredFields, say, validateInterpretation, validation } from "../../src/index.ts";
import { gate } from "./_gate.ts";
import { world } from "./_helpers.ts";

const CORPUS_PATH = join(import.meta.dir, "../../../../plugins/vivim-nlcl/test/fixtures/release-use-corpus.json");
const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8")) as {
  candidateFrames: Array<OpFrame & { note?: string }>;
  worlds: Record<string, Partial<WorldModel> & { extends?: string }>;
  cases: Array<{ id: string; input: string; world: string; baseline: string }>;
};

function corpusWorld(name: string): WorldModel {
  const spec = corpus.worlds[name]!;
  const base = spec.extends ? corpusWorld(spec.extends) : emptyWorld();
  const { extends: _e, ...rest } = spec;
  return { ...base, ...structuredClone(rest) } as WorldModel;
}

/** Interpret with the corpus candidate prompt.send frame injected, then restore the frame table. */
function withCandidateFrame<T>(fn: () => T): T {
  const added: OpFrame[] = corpus.candidateFrames.map(({ note: _n, ...f }) => f as OpFrame);
  DEFAULT_FRAMES.push(...added);
  try { return fn(); } finally { for (const f of added) DEFAULT_FRAMES.splice(DEFAULT_FRAMES.indexOf(f), 1); }
}

const u1 = corpus.cases.find((c) => c.id === "U1")!;
const interpU1 = () => withCandidateFrame(() => interpret(u1.input, corpusWorld(u1.world)));

describe("Phase A — executable truth", () => {
  gate("D1-003", "U1 false-READY is reproduced in isolation (or the corpus has promoted the fix)", () => {
    const r = interpU1();
    const defectPresent = r.status === "ok" && r.ir?.slots?.["account"]?.entityId === undefined;
    expect(defectPresent || u1.baseline === "pass").toBe(true);
  });

  gate("D1-004", "prompt.send declares account and prompt required, model optional", () => {
    const d = capabilityDecl("prompt.send@1")!;
    expect(d).toBeDefined();
    const rules = requiredFields("prompt.send@1");
    expect([...rules.required].sort()).toEqual(d.params.filter((p) => p.required).map((p) => p.name).sort());
    expect(rules.required).toContain("account");
    expect(rules.required).toContain("prompt");
    expect(rules.optional).toContain("model");
    expect(rules.required).not.toContain("model");
  });

  gate("D1-005", "validator never reports READY for corpus U1 (unresolved required account)", () => {
    const v = validateInterpretation(interpU1());
    expect(v.state).not.toBe("ready");
    expect(v.missing).toContain("account");
  });

  gate("D1-005", "corpus U1 is promoted to baseline pass (red-to-green, not hidden)", () => {
    expect(u1.baseline).toBe("pass");
  });

  gate("D1-006", "missing account target is never READY", () => {
    const r = withCandidateFrame(() => interpret("send 'review this'", corpusWorld("three-accounts")));
    expect(validateInterpretation(r).state).not.toBe("ready");
  });

  gate("D1-006", "missing payload is never READY and names prompt", () => {
    const r = withCandidateFrame(() => interpret("send to work claude", corpusWorld("three-accounts")));
    const v = validateInterpretation(r);
    expect(v.state).not.toBe("ready");
    expect(v.missing).toContain("prompt");
  });

  gate("D1-006", "incompatible account (no realization) is never READY", () => {
    const s = say(initialState(world("W4")), "send 'x' to mailbox home");
    const v = validation(s);
    expect(v.state).not.toBe("ready");
    expect(["unavailable", "needs-choice", "unknown", "refused"]).toContain(v.state);
  });
});
