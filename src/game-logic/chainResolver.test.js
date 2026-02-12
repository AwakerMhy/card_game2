import { describe, it, expect } from "vitest";
import { canChain, resolveChain, SPELL_SPEED } from "./chainResolver.js";

describe("chainResolver", () => {
  it("empty chain can add any card", () => {
    expect(canChain([], { type: "spell", spellType: "normal" })).toBe(true);
  });

  it("quickplay can chain normal spell", () => {
    const chain = [{ type: "spell", spellType: "normal" }];
    expect(canChain(chain, { type: "spell", spellType: "quickplay" })).toBe(true);
  });

  it("resolveChain returns reversed order", () => {
    const chain = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const resolved = resolveChain(chain);
    expect(resolved[0].id).toBe(3);
    expect(resolved[2].id).toBe(1);
  });
});
