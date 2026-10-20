// Release USE-command determinism corpus — seed (roadmap task CMD-02).
// Source of truth: ./fixtures/release-use-corpus.json. See
// .project/roadmap/workstreams/WS-CMD-command-nucleus.md.
//
// Cases with baseline "fail" run as test.failing: the suite stays green while a
// known gap exists and turns red the moment an adaptation fixes it, forcing the
// case to be promoted to baseline "pass" in the fixture (no silent drift).
//
// `status`/`statusNot` assert what nlcl itself reported. `d1StateNot` asserts the
// D1 READY law instead (D1-005): a case may pass while nlcl's own status is
// wrong, because READY is recomputed from the capability declaration rather than
// trusted from the interpreter. Those are different claims and the fixture names
// which one it is making.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_FRAMES, emptyWorld, interpret } from "@vivim/omega-nlcl-pure";
import type { Interpretation, OpFrame, WorldModel } from "@vivim/omega-nlcl-pure";
import { validateInterpretation } from "../../../experimental/d1/src/index.ts";

interface Expect {
  op?: string | null; opNot?: string; account?: string | null; prompt?: string;
  status?: string; statusNot?: string[]; alternativesInclude?: string[];
  effectGate?: string; deterministic?: boolean; d1StateNot?: string[];
}
interface Case { id: string; category: string; world: string; input: string; expect: Expect; baseline: "pass" | "fail"; task?: string }
interface Corpus {
  candidateFrames: Array<OpFrame & { note?: string }>;
  worlds: Record<string, Partial<WorldModel> & { extends?: string }>;
  cases: Case[];
}

const corpus = JSON.parse(readFileSync(join(import.meta.dir, "fixtures/release-use-corpus.json"), "utf-8")) as Corpus;

function buildWorld(name: string): WorldModel {
  const spec = corpus.worlds[name];
  if (!spec) throw new Error(`unknown corpus world ${name}`);
  const base = spec.extends ? buildWorld(spec.extends) : emptyWorld();
  const { extends: _ignored, ...rest } = spec;
  return { ...base, ...structuredClone(rest) } as WorldModel;
}

function check(c: Case, r: Interpretation, again: Interpretation): void {
  const e = c.expect;
  const op = r.ir?.intent ?? null;
  const acct = r.ir?.slots?.["account"];
  if (e.op !== undefined) expect(op).toBe(e.op);
  if (e.opNot !== undefined) expect(op).not.toBe(e.opNot);
  if (e.account !== undefined) expect(acct?.entityId ?? null).toBe(e.account);
  if (e.prompt !== undefined) expect(r.ir?.payload?.["prompt"]).toBe(e.prompt);
  if (e.status !== undefined) expect(r.status).toBe(e.status);
  if (e.statusNot !== undefined) expect(e.statusNot).not.toContain(r.status);
  if (e.alternativesInclude !== undefined) {
    const ids = (acct?.matches ?? []).map((m) => m.entity.id);
    for (const id of e.alternativesInclude) expect(ids).toContain(id);
  }
  if (e.effectGate !== undefined) expect(r.effects.map((x) => x.gate)).toContain(e.effectGate);
  if (e.d1StateNot !== undefined) expect(e.d1StateNot).not.toContain(validateInterpretation(r).state);
  if (e.deterministic) expect(JSON.stringify(again)).toBe(JSON.stringify(r));
}

const injected: OpFrame[] = [];
beforeAll(() => {
  for (const f of corpus.candidateFrames) {
    const { note: _note, ...frame } = f;
    DEFAULT_FRAMES.push(frame as OpFrame);
    injected.push(DEFAULT_FRAMES[DEFAULT_FRAMES.length - 1]!);
  }
});
afterAll(() => {
  for (const f of injected) {
    const i = DEFAULT_FRAMES.indexOf(f);
    if (i >= 0) DEFAULT_FRAMES.splice(i, 1);
  }
});

describe("release USE corpus (FIRST-PRODUCT-RELEASE-DESIGN §16) — seed", () => {
  for (const c of corpus.cases) {
    const name = `${c.id} [${c.category}] ${JSON.stringify(c.input)}${c.task ? ` → ${c.task}` : ""}`;
    const body = () => {
      const world = buildWorld(c.world);
      check(c, interpret(c.input, world), interpret(c.input, world));
    };
    if (c.baseline === "pass") test(name, body);
    else test.failing(name, body);
  }

  test("corpus covers every §16 category at least once", () => {
    const cats = new Set(corpus.cases.map((c) => c.category));
    for (const k of ["paraphrase-equivalence", "explicit-target-precedence", "ambiguity-preservation",
      "unknown-capability", "replay", "authority-separation"]) expect(cats.has(k)).toBe(true);
    // ui-parity is proven by SHL-04's harness (typed vs clicked → same command digest), not here.
  });
});
