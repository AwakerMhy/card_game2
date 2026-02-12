// Spell effect handlers - resolve spell effects and return state updates

import { drawCard, placeMonsterZone, sendToGraveyard, clearMonsterZone } from "./gameState.js";

export function resolveSpellEffect(state, playerId, card) {
  const id = card.id || card.name;
  switch (id) {
    case "101": // 贪欲之壶
      return drawCard(drawCard(state, playerId), playerId);
    case "102": { // 死者苏生
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
    case "103": { // 黑洞 - 破坏场上所有怪兽
      let s1 = state;
      for (const pid of ["player1", "player2"]) {
        for (let i = 4; i >= 0; i--) {
          const m = s1.players[pid].monsterZones[i];
          if (m) {
            s1 = sendToGraveyard(s1, pid, m);
            s1 = clearMonsterZone(s1, pid, i);
          }
        }
      }
      return s1;
    }
    case "104": { // 雷击 - 破坏对方所有怪兽
      const oppId = playerId === "player1" ? "player2" : "player1";
      let s2 = state;
      for (let i = 4; i >= 0; i--) {
        const m = s2.players[oppId].monsterZones[i];
        if (m) {
          s2 = sendToGraveyard(s2, oppId, m);
          s2 = clearMonsterZone(s2, oppId, i);
        }
      }
      return s2;
    }
    default:
      return state;
  }
}

export function hasSpellEffect(card) {
  if (!card) return false;
  const id = String(card.id || card.name || "");
  return ["101", "102", "103", "104"].includes(id);
}
