// Synthetic World loading, provenance enforcement and identity.
// IMPLEMENTED in the seed (domain-neutral): D1-011, D1-012, and the structural
// checks behind D1-010. These are load-bearing for every other gate.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AccountRec, World, WorldDelta, WorldFixture } from "./contract.ts";
import { digest } from "./digest.ts";

export class WorldError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "WorldError";
  }
}

const KIND_PREFIX = { providers: "provider:", accounts: "account:", models: "model:" } as const;
export const WORLD_DIR = join(import.meta.dir, "..", "worlds");

function fail(code: string, msg: string): never {
  throw new WorldError(code, msg);
}

/** Validate a fixture object and give it identity. Pure: same content ⇒ same digest. */
export function loadWorld(raw: unknown, revision = 0): World {
  if (raw === null || typeof raw !== "object") fail("WORLD_SHAPE", "fixture must be an object");
  const f = raw as Partial<WorldFixture>;
  if (f.schema !== "d1.world/0") fail("WORLD_SCHEMA", `expected schema d1.world/0, got ${String(f.schema)}`);
  const prov = f.provenance as Partial<WorldFixture["provenance"]> | undefined;
  if (!prov || typeof prov !== "object") fail("PROVENANCE_MISSING", `${f.id ?? "?"} has no provenance; D1 Worlds must be explicitly synthetic`);
  if (prov.class !== "synthetic-fixture") fail("PROVENANCE_NOT_SYNTHETIC", `${f.id ?? "?"} provenance class "${String(prov.class)}" is not "synthetic-fixture"`);
  if (typeof prov.label !== "string" || !/synthetic/i.test(prov.label)) fail("PROVENANCE_LABEL", `${f.id ?? "?"} provenance label must say it is synthetic`);
  for (const k of ["id", "title"] as const) if (typeof f[k] !== "string" || !f[k]) fail("WORLD_SHAPE", `missing ${k}`);
  for (const k of ["providers", "accounts", "models", "capabilities", "realizations"] as const) {
    if (!Array.isArray(f[k])) fail("WORLD_SHAPE", `${f.id}: ${k} must be an array`);
  }
  for (const k of ["authority", "defaults", "simulation"] as const) {
    if (!f[k] || typeof f[k] !== "object" || Array.isArray(f[k])) fail("WORLD_SHAPE", `${f.id}: ${k} must be an object`);
  }
  const fixture = structuredClone(f) as WorldFixture;

  // identity separation: one id, one kind; kind is visible in the id prefix
  const seen = new Map<string, string>();
  for (const kind of ["providers", "accounts", "models"] as const) {
    for (const rec of fixture[kind]) {
      if (!rec.id?.startsWith(KIND_PREFIX[kind])) fail("ID_KIND", `${fixture.id}: ${kind} id "${rec.id}" must start with ${KIND_PREFIX[kind]}`);
      if (seen.has(rec.id)) fail("ID_COLLISION", `${fixture.id}: "${rec.id}" appears in ${seen.get(rec.id)} and ${kind}`);
      seen.set(rec.id, kind);
      if (!Array.isArray(rec.names) || rec.names.some((n) => n !== n.toLowerCase())) fail("NAMES", `${rec.id}: names must be lowercase strings`);
    }
  }
  const providerIds = new Set(fixture.providers.map((p) => p.id));
  for (const a of fixture.accounts) {
    if (!providerIds.has(a.provider)) fail("DANGLING_PROVIDER", `${a.id} references unknown provider ${a.provider}`);
    if (!["fresh", "stale", "unknown"].includes(a.freshness)) fail("FRESHNESS", `${a.id}: bad freshness ${a.freshness}`);
    if (a.origin !== "fixture" && a.origin !== "registration") fail("ORIGIN", `${a.id}: origin must be fixture|registration`);
  }
  for (const m of fixture.models) if (!providerIds.has(m.provider)) fail("DANGLING_PROVIDER", `${m.id} references unknown provider ${m.provider}`);
  for (const r of fixture.realizations) {
    if (!providerIds.has(r.provider)) fail("DANGLING_PROVIDER", `${r.id} references unknown provider ${r.provider}`);
    if (!fixture.capabilities.includes(r.capability)) fail("DANGLING_CAPABILITY", `${r.id} realizes undeclared ${r.capability}`);
  }
  const accountIds = new Set(fixture.accounts.map((a) => a.id));
  for (const [cap, acct] of Object.entries(fixture.defaults)) {
    if (!accountIds.has(acct)) fail("DANGLING_DEFAULT", `default for ${cap} names unknown ${acct}`);
  }
  return { ...fixture, revision, digest: digest({ fixture, revision }) };
}

export function worldDigest(w: World): string {
  const { digest: _d, revision, ...fixture } = w;
  return digest({ fixture, revision });
}

export function readWorldFile(id: string): unknown {
  return JSON.parse(readFileSync(join(WORLD_DIR, `${id}.json`), "utf8"));
}

export function loadNamedWorld(id: string): World {
  return loadWorld(readWorldFile(id));
}

/** Apply a registration delta through the same validation as fixture loading. */
export function applyWorldDelta(w: World, delta: WorldDelta): World {
  const { digest: _d, revision, ...fixture } = w;
  const next: WorldFixture = structuredClone(fixture);
  for (const p of delta.addProviders ?? []) next.providers.push(p);
  for (const a of delta.addAccounts ?? []) next.accounts.push(a);
  return loadWorld(next, revision + 1);
}

/** Accounts that could serve a capability right now: available realization for the provider AND fresh. */
export function compatibleAccounts(w: World, capability: string): AccountRec[] {
  const providers = new Set(w.realizations.filter((r) => r.capability === capability && r.status === "available").map((r) => r.provider));
  return w.accounts.filter((a) => providers.has(a.provider) && a.freshness === "fresh");
}

/** Fixture view without identity fields (what a replay bundle pins). */
export function fixtureOf(w: World): WorldFixture {
  const { digest: _d, revision: _r, ...fixture } = w;
  return structuredClone(fixture);
}
