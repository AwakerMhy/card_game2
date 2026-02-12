import { describe, it, expect, vi } from "vitest";
import {
  createInitialState,
  drawCard,
  shuffle,
  buildStarterDeck,
  setLP,
  sendToGraveyard,
  placeMonsterZone,
  placeSpellTrapZone,
  removeFromHand,
  getEmptyMonsterZoneIndex,
} from "./gameState.js";

describe("gameState", () => {
  it("createInitialState creates valid state", () => {
    const state = createInitialState();
    expect(state.players.player1.lp).toBe(8000);
    expect(state.players.player2.lp).toBe(8000);
    expect(state.players.player1.hand).toHaveLength(5);
    expect(state.players.player2.hand).toHaveLength(5);
    expect(state.players.player1.deck).toHaveLength(15);
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("draw");
  });

  it("shuffle returns new array", () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr);
    expect(result).not.toBe(arr);
    expect(result).toHaveLength(3);
  });

  it("drawCard adds card to hand", () => {
    const state = createInitialState();
    const player = state.players.player1;
    const handBefore = player.hand.length;
    const deckBefore = player.deck.length;

    const newState = drawCard(state, "player1");

    expect(newState.players.player1.hand).toHaveLength(handBefore + 1);
    expect(newState.players.player1.deck).toHaveLength(deckBefore - 1);
  });

  it("drawCard when deck empty sets winner", () => {
    const state = createInitialState();
    let newState = state;
    while (newState.players.player1.deck.length > 0) {
      newState = drawCard(newState, "player1");
    }
    newState = drawCard(newState, "player1");
    expect(newState.winner).toBe("player2");
  });

  it("setLP updates life points", () => {
    const state = createInitialState();
    const newState = setLP(state, "player1", 5000);
    expect(newState.players.player1.lp).toBe(5000);
  });

  it("placeMonsterZone places card correctly", () => {
    const state = createInitialState();
    const card = { id: "001", name: "test", type: "monster", atk: 1000, def: 500, level: 4, instanceId: "x" };
    const newState = placeMonsterZone(state, "player1", 0, card, "attack");

    expect(newState.players.player1.monsterZones[0]).toBeDefined();
    expect(newState.players.player1.monsterZones[0].name).toBe("test");
    expect(newState.players.player1.monsterZones[0].position).toBe("attack");
  });

  it("placeSpellTrapZone places card with faceDown", () => {
    const state = createInitialState();
    const card = { id: "101", name: "test", type: "spell", instanceId: "x" };
    const newState = placeSpellTrapZone(state, "player1", 0, card, true);

    expect(newState.players.player1.spellTrapZones[0]).toBeDefined();
    expect(newState.players.player1.spellTrapZones[0].faceDown).toBe(true);
  });
});
