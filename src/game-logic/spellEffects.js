// Spell effect handlers - resolve spell effects and return state updates

import { drawCard, placeMonsterZone } from "./gameState.js";

export function resolveSpellEffect(state, playerId, card) {
  const id = card.id || card.name;
  switch (id) {
    case "101": // Pot of Greed
      return drawCard(drawCard(state, playerId), playerId);
    case "102": { // Monster Reborn - Special Summon from graveyard
      const player = state.players[playerId];
      const graveMonster = player.graveyard.find((c) => c.type === "monster");
      if (!graveMonster) return state;
      const emptyZone = player.monsterZones.findIndex((z) => !z);
      if (emptyZone < 0) return state;
      const newGraveyard = player.graveyard.filter((c) => c.instanceId !== graveMonster.instanceId);
      const newState = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            graveyard: newGraveyard,
          },
        },
      };
      return placeMonsterZone(newState, playerId, emptyZone, graveMonster, "attack");
    }
    default:
      return state;
  }
}

export function hasSpellEffect(card) {
  const id = card.id || card.name;
  return id === "101" || id === "102"; // Pot of Greed, Monster Reborn
}
