import { describe, it, expect } from "vitest";
import { getTributeCount, canNormalSummon } from "./summonValidator.js";
import { createInitialState } from "./gameState.js";

describe("summonValidator", () => {
  it("getTributeCount returns 0 for level 1-4", () => {
    expect(getTributeCount(1)).toBe(0);
    expect(getTributeCount(4)).toBe(0);
  });

  it("getTributeCount returns 1 for level 5-6", () => {
    expect(getTributeCount(5)).toBe(1);
    expect(getTributeCount(6)).toBe(1);
  });

  it("getTributeCount returns 2 for level 7+", () => {
    expect(getTributeCount(7)).toBe(2);
    expect(getTributeCount(12)).toBe(2);
  });

  it("canNormalSummon allows level 4 with empty zone", () => {
    const state = createInitialState();
    const card = { type: "monster", level: 4 };
    expect(canNormalSummon(state, "player1", card)).toBe(true);
  });

  it("canNormalSummon false when canNormalSummon already used", () => {
    const state = { ...createInitialState(), canNormalSummon: false };
    const card = { type: "monster", level: 4 };
    expect(canNormalSummon(state, "player1", card)).toBe(false);
  });
});
