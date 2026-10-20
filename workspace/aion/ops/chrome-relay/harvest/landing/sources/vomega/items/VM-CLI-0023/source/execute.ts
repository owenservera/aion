// Virtual prompt.send realization (D1-063..066). STUB.
// Accepts only committed, validated, authorized commands. Emits start/attempt/
// result events bound to command/World/revision/realization and a receipt whose
// evidenceClass is the literal "SIMULATED". World.simulation["prompt.send@1"]
// = "fail" must produce failure evidence, never success.
import type { Committed, ExecEvent, Receipt, World } from "./contract.ts";
import { notImplemented } from "./not-implemented.ts";

export const VIRTUAL_REALIZATION = { id: "d1-virtual.prompt.send@1", version: "0.1.0" } as const;

export function executeVirtual(committed: Committed, world: World): { events: ExecEvent[]; receipt: Receipt } {
  return notImplemented("D1-063", `executeVirtual(${committed.command.capability} in ${world.id})`);
}
