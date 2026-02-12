import { describe, it, expect } from "vitest";
import { resolveSpellEffect, hasSpellEffect } from "./spellEffects.js";
import { createInitialState } from "./gameState.js";

describe("spellEffects", () => {
  it("hasSpellEffect returns true for Pot of Greed", () => {
    expect(hasSpellEffect({ id: "101", name: "贪欲之壶", type: "spell" })).toBe(true);
  });

  it("hasSpellEffect returns true for Monster Reborn", () => {
    expect(hasSpellEffect({ id: "102", name: "死者苏生", type: "spell" })).toBe(true);
  });

  it("hasSpellEffect returns false for non-effect spell", () => {
    expect(hasSpellEffect({ id: "999", name: "other", type: "spell" })).toBe(false);
  });

  it("Pot of Greed draws 2 cards", () => {
    const state = createInitialState();
    const deckLen = state.players.player1.deck.length;
    const handLen = state.players.player1.hand.length;
    const card = { id: "101", type: "spell", instanceId: "x" };

    const newState = resolveSpellEffect(state, "player1", card);

    expect(newState.players.player1.hand).toHaveLength(handLen + 2);
    expect(newState.players.player1.deck).toHaveLength(deckLen - 2);
  });

  it("Monster Reborn summons from graveyard", () => {
    const state = createInitialState();
    const monster = { id: "001", type: "monster", atk: 1000, def: 500, level: 4, instanceId: "m1" };
    const player = state.players.player1;
    const stateWithGrave = {
      ...state,
      players: {
        ...state.players,
        player1: {
          ...player,
          graveyard: [monster],
        },
      },
    };
    const card = { id: "102", type: "spell", instanceId: "x" };

    const newState = resolveSpellEffect(stateWithGrave, "player1", card);

    expect(newState.players.player1.graveyard).toHaveLength(0);
    expect(newState.players.player1.monsterZones[0]).toBeDefined();
    expect(newState.players.player1.monsterZones[0].id).toBe("001");
  });
});
