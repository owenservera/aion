// Phase C — registration and command nucleus (D1-020..029).
import { describe, expect } from "bun:test";
import * as port from "../../src/index.ts";
import { commandDigest, currentCommand, interpretRevision, dispatch, validation } from "../../src/index.ts";
import { gate } from "./_gate.ts";
import { ambiguous, PERSONAL, PROMPT, reversedKeys, says, start, WORK } from "./_helpers.ts";

const REG1 = "add my Claude work account";
const REG2 = "add another Claude account and call it Personal";

describe("Phase C — registration and command nucleus", () => {
  gate("D1-020", "registration is an interpretation result applied by the reducer, not a side door", () => {
    const s0 = dispatch(start("W0"), { type: "input", text: REG1 });
    const r = interpretRevision(s0, s0.active);
    expect(r.kind).toBe("registration");
    expect(r.worldDelta?.addAccounts?.length).toBe(1);
    expect(s0.world.accounts.length).toBe(0); // interpreting alone changes nothing
    for (const k of Object.keys(port)) expect(k).not.toMatch(/^(register|add)Account/i);
  });

  gate("D1-021", "\"add my Claude work account\" registers one synthetic Claude Account", () => {
    const s = says(start("W0"), REG1);
    expect(s.world.accounts.length).toBe(1);
    const a = s.world.accounts[0]!;
    expect(a.provider).toBe("provider:claude");
    expect(a.origin).toBe("registration");
    expect(a.label.toLowerCase()).toContain("work");
    expect(s.world.provenance.class).toBe("synthetic-fixture");
    expect(s.world.revision).toBe(1);
  });

  gate("D1-022", "\"add another Claude account and call it Personal\" adds a second distinct Account", () => {
    const s = says(start("W0"), REG1, REG2);
    expect(s.world.accounts.length).toBe(2);
    const [a, b] = s.world.accounts;
    expect(a!.id).not.toBe(b!.id);
    expect(b!.label.toLowerCase()).toContain("personal");
    expect(b!.provider).toBe("provider:claude");
  });

  gate("D1-023", "subsequent interpretation sees both registered Accounts", () => {
    const s = says(start("W0"), REG1, REG2, PROMPT);
    const cmd = currentCommand(s)!;
    expect(cmd.account).toBeNull();
    const ids = s.world.accounts.map((a) => a.id).sort();
    const u = cmd.unresolved.find((x) => x.field === "account")!;
    expect([...u.options].sort()).toEqual(ids);
  });

  gate("D1-024", "UseCommand carries every release field explicitly", () => {
    const cmd = currentCommand(ambiguous())!;
    for (const k of ["capability", "provider", "account", "model", "params", "contextRefs", "basis", "unresolved", "consequence", "authority", "realization", "expectedEvidence"]) {
      expect(Object.prototype.hasOwnProperty.call(cmd, k)).toBe(true);
    }
    expect(cmd.expectedEvidence).toBe("SIMULATED");
    expect(cmd.basis.worldDigest).toMatch(/^sha256:/);
  });

  gate("D1-025", "canonical journey phrase compiles to prompt.send with its payload", () => {
    const cmd = currentCommand(ambiguous())!;
    expect(cmd.capability).toBe("prompt.send@1");
    expect(cmd.provider).toBe("provider:claude");
    expect(String(cmd.params["prompt"])).toContain("build failed");
  });

  gate("D1-026", "two Claude Accounts stay visibly ambiguous", () => {
    const s = ambiguous();
    const cmd = currentCommand(s)!;
    expect(cmd.account).toBeNull();
    const u = cmd.unresolved.find((x) => x.field === "account")!;
    expect(u.reason).toBe("ambiguous");
    expect([...u.options].sort()).toEqual([PERSONAL, WORK].sort());
    expect(validation(s).state).toBe("needs-choice");
  });

  gate("D1-027", "typed \"use Work\" changes only the Account and its dependents", () => {
    const before = currentCommand(ambiguous())!;
    const after = currentCommand(says(ambiguous(), "use Work"))!;
    expect(after.account).toBe(WORK);
    expect(after.capability).toBe(before.capability);
    expect(after.params).toEqual(before.params);
    expect(after.provider).toBe(before.provider);
    expect(after.unresolved.find((u) => u.field === "account")).toBeUndefined();
  });

  gate("D1-028", "Account words inside a quoted payload never retarget", () => {
    const cmd = currentCommand(says(start("W2"), "send 'tell Claude Personal hello' to work claude"))!;
    expect(cmd.account).toBe(WORK);
    expect(String(cmd.params["prompt"])).toContain("Claude Personal");
  });

  gate("D1-029", "command digest is deterministic and semantic", () => {
    const a = currentCommand(says(ambiguous(), "use Work"))!;
    const b = currentCommand(says(ambiguous(), "use Work"))!;
    expect(commandDigest(a)).toBe(commandDigest(b));
    const shuffled = reversedKeys(a);
    expect(commandDigest(shuffled)).toBe(commandDigest(a));
    const p = currentCommand(says(ambiguous(), "use Personal"))!;
    expect(commandDigest(p)).not.toBe(commandDigest(a));
  });
});
