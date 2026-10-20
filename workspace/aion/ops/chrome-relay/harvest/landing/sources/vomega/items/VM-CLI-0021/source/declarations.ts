// Source-native D1 declarations (capability, realization, action). These JSON
// files are the structural source the Reflection extractor reads and the
// validator derives required fields from. IMPLEMENTED: loading only.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { SourceFile } from "./contract.ts";

export const DECLARATION_DIR = join(import.meta.dir, "..", "declarations");
export const OMEGA_BASELINE = join(import.meta.dir, "..", "..", "..");

export interface ParamDecl { name: string; type: string; required: boolean; semantic: string; explain: string; derivedFrom?: string }
export interface CapabilityDecl {
  schema: "d1.declaration/0"; kind: "capability"; id: string; title: string; summary: string;
  params: ParamDecl[];
  consequence: { class: "external-transfer" | "local-only"; crossesLocalBoundary: boolean; carries: string[]; to: string; explain: string };
  authority: { requires: "consent" | "none"; scope: string };
  evidence: { classes: string[]; explain: string };
  realizations: string[];
}
export interface RealizationDecl {
  schema: "d1.declaration/0"; kind: "realization"; id: string; capability: string; virtual: true;
  evidenceClass: "SIMULATED"; version: string; requires: string[]; emits: string[]; failureModes: string[]; explain: string;
}
export interface ActionDecl { schema: "d1.declaration/0"; kind: "action"; id: string; edits: string; via: string[]; explain: string }
export type Declaration = CapabilityDecl | RealizationDecl | ActionDecl;

/** Declaration files as SourceFiles with omega-baseline-relative paths (stable across machines). */
export function declarationSources(): SourceFile[] {
  return readdirSync(DECLARATION_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const full = join(DECLARATION_DIR, f);
      return { path: relative(OMEGA_BASELINE, full).replaceAll("\\", "/"), text: readFileSync(full, "utf8") };
    });
}

export function parseDeclarations(sources: SourceFile[]): Declaration[] {
  return sources.map((s) => JSON.parse(s.text) as Declaration);
}

export function loadDeclarations(): Declaration[] {
  return parseDeclarations(declarationSources());
}

export function capabilityDecl(id: string, decls: Declaration[] = loadDeclarations()): CapabilityDecl | undefined {
  return decls.find((d): d is CapabilityDecl => d.kind === "capability" && d.id === id);
}
