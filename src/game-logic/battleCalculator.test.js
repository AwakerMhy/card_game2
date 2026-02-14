import { describe, it, expect } from "vitest";
import { calculateBattle } from "./battleCalculator.js";

describe("battleCalculator", () => {
  it("ATK vs ATK: higher destroys lower, diff as damage", () => {
    const attacker = { atk: 2000, position: "attack" };
    const defender = { atk: 1500, position: "attack" };
    const result = calculateBattle(attacker, defender, false);

    expect(result.attackerDestroys).toBe(true);
    expect(result.defenderDestroys).toBe(false);
    expect(result.defenderDamage).toBe(500);
    expect(result.attackerDamage).toBe(0);
  });

  it("ATK vs ATK: lower attacked by higher, attacker destroyed", () => {
    const attacker = { atk: 1500, position: "attack" };
    const defender = { atk: 2000, position: "attack" };
    const result = calculateBattle(attacker, defender, false);

    expect(result.attackerDestroys).toBe(false);
    expect(result.defenderDestroys).toBe(true);
    expect(result.attackerDamage).toBe(500);
    expect(result.defenderDamage).toBe(0);
  });

  it("ATK vs DEF: attacker takes (DEF-ATK) damage when DEF higher", () => {
    const attacker = { atk: 2000, position: "attack" };
    const defender = { atk: 1000, def: 2500, position: "defense" };
    const result = calculateBattle(attacker, defender, false);

    expect(result.attackerDestroys).toBe(false);
    expect(result.defenderDestroys).toBe(false);
    expect(result.defenderDamage).toBe(0);
    expect(result.attackerDamage).toBe(500);
  });

  it("ATK vs DEF: destroys when ATK higher", () => {
    const attacker = { atk: 2000, position: "attack" };
    const defender = { atk: 1000, def: 1500, position: "defense" };
    const result = calculateBattle(attacker, defender, false);

    expect(result.attackerDestroys).toBe(true);
    expect(result.defenderDamage).toBe(0);
  });

  it("ATK vs face-down DEF: treated as defense, attacker takes (DEF-ATK) when DEF higher", () => {
    const attacker = { atk: 2000, position: "attack" };
    const defender = { atk: 1000, def: 2500, position: "defense", faceDown: true };
    const result = calculateBattle(attacker, defender, false);

    expect(result.attackerDestroys).toBe(false);
    expect(result.defenderDestroys).toBe(false);
    expect(result.attackerDamage).toBe(500);
  });

  it("direct attack deals full ATK as damage", () => {
    const attacker = { atk: 2000, position: "attack" };
    const result = calculateBattle(attacker, null, true);

    expect(result.defenderDamage).toBe(2000);
    expect(result.attackerDestroys).toBe(false);
  });
});
