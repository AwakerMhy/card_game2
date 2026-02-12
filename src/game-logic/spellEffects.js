// Spell/Trap effect handlers - resolve effects and return state updates

import {
  drawCard,
  placeMonsterZone,
  sendToGraveyard,
  clearMonsterZone,
  clearSpellTrapZone,
  setLP,
  removeFromHandByIndex,
  searchDeckAddToHand,
} from "./gameState.js";
import { applyGraveyardEffect } from "./monsterEffects.js";

function destroySpellTrapAt(state, playerId, zoneIndex) {
  const { newState, card } = clearSpellTrapZone(state, playerId, zoneIndex);
  return card ? sendToGraveyard(newState, playerId, card) : newState;
}

// Find first S/T on field: opponent first, then self
function getFirstSpellTrapOnField(state, casterId) {
  const oppId = casterId === "player1" ? "player2" : "player1";
  for (const pid of [oppId, casterId]) {
    const zones = state.players[pid].spellTrapZones;
    for (let i = 0; i < zones.length; i++) {
      if (zones[i]) return { playerId: pid, zoneIndex: i };
    }
  }
  return null;
}

// Destroy all S/T on field (both players)
function destroyAllSpellTraps(state) {
  let s = state;
  for (const pid of ["player1", "player2"]) {
    for (let i = 4; i >= 0; i--) {
      if (s.players[pid].spellTrapZones[i]) {
        s = destroySpellTrapAt(s, pid, i);
      }
    }
  }
  return s;
}

// Opponent's face-up monster zone index with lowest ATK; -1 if none
function getLowestAtkFaceUpMonster(state, opponentId) {
  const zones = state.players[opponentId].monsterZones;
  let bestIndex = -1;
  let bestAtk = Infinity;
  for (let i = 0; i < zones.length; i++) {
    const m = zones[i];
    if (m && m.position === "attack" && m.atk < bestAtk) {
      bestAtk = m.atk;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// First face-up monster on opponent's field
function getFirstFaceUpMonster(state, opponentId) {
  const zones = state.players[opponentId].monsterZones;
  for (let i = 0; i < zones.length; i++) {
    if (zones[i] && zones[i].position === "attack") return i;
  }
  return -1;
}

export function resolveSpellEffect(state, playerId, card, target) {
  const id = String(card.id || card.name || "");
  const oppId = playerId === "player1" ? "player2" : "player1";

  switch (id) {
    case "101":
      return drawCard(drawCard(state, playerId), playerId);

    case "102": {
      const player = state.players[playerId];
      let graveMonster = null;
      let graveOwnerId = playerId;
      if (target?.type === "graveyard" && target.instanceId) {
        const tid = target.playerId || playerId;
        graveMonster = state.players[tid]?.graveyard?.find((c) => c.instanceId === target.instanceId && c.type === "monster");
        if (graveMonster) graveOwnerId = tid;
      }
      if (!graveMonster) {
        graveMonster = player.graveyard.find((c) => c.type === "monster");
      }
      if (!graveMonster) return state;
      const emptyZone = player.monsterZones.findIndex((z) => !z);
      if (emptyZone < 0) return state;
      const owner = state.players[graveOwnerId];
      const newGraveyard = owner.graveyard.filter((c) => c.instanceId !== graveMonster.instanceId);
      let newState = {
        ...state,
        players: {
          ...state.players,
          [graveOwnerId]: { ...owner, graveyard: newGraveyard },
        },
      };
      return placeMonsterZone(newState, playerId, emptyZone, graveMonster, "attack");
    }

    case "103": {
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

    case "104": {
      let s2 = state;
      for (let i = 4; i >= 0; i--) {
        const m = s2.players[oppId].monsterZones[i];
        if (m) {
          s2 = sendToGraveyard(s2, oppId, m);
          s2 = applyGraveyardEffect(s2, oppId, m);
          s2 = clearMonsterZone(s2, oppId, i);
        }
      }
      return s2;
    }

    case "105": {
      return { ...state, lightSwordActive: playerId };
    }

    case "106": {
      let stTarget = null;
      if (target?.type === "spellTrap" && target.playerId != null && target.zoneIndex != null && state.players[target.playerId]?.spellTrapZones[target.zoneIndex]) {
        stTarget = { playerId: target.playerId, zoneIndex: target.zoneIndex };
      }
      if (!stTarget) stTarget = getFirstSpellTrapOnField(state, playerId);
      if (!stTarget) return state;
      return destroySpellTrapAt(state, stTarget.playerId, stTarget.zoneIndex);
    }

    case "107":
      return destroyAllSpellTraps(state);

    case "108":
      return state;

    case "109": {
      const opp = state.players[oppId];
      let fromZone = -1;
      if (target?.type === "monster" && target.playerId === oppId && target.zoneIndex != null && opp.monsterZones[target.zoneIndex]) {
        fromZone = target.zoneIndex;
      }
      if (fromZone < 0) fromZone = opp.monsterZones.findIndex((z) => z !== null);
      if (fromZone < 0) return state;
      const myEmpty = state.players[playerId].monsterZones.findIndex((z) => z === null);
      if (myEmpty < 0) return state;
      const monster = opp.monsterZones[fromZone];
      let s = clearMonsterZone(state, oppId, fromZone);
      s = placeMonsterZone(s, playerId, myEmpty, monster, monster.position || "attack");
      return {
        ...s,
        borrowedMonsters: [
          ...(s.borrowedMonsters || []),
          { fromPlayerId: oppId, fromZoneIndex: fromZone, toPlayerId: playerId, toZoneIndex: myEmpty, card: monster },
        ],
      };
    }

    case "110": {
      let s = setLP(state, playerId, state.players[playerId].lp - 800);
      const player = s.players[playerId];
      let graveMonster = null;
      if (target?.type === "graveyard" && target.playerId === playerId && target.instanceId) {
        graveMonster = player.graveyard.find((c) => c.instanceId === target.instanceId && c.type === "monster");
      }
      if (!graveMonster) graveMonster = player.graveyard.find((c) => c.type === "monster");
      if (!graveMonster) return s;
      const emptyZone = player.monsterZones.findIndex((z) => !z);
      if (emptyZone < 0) return s;
      const newGraveyard = player.graveyard.filter((c) => c.instanceId !== graveMonster.instanceId);
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: { ...player, graveyard: newGraveyard },
        },
      };
      return placeMonsterZone(s, playerId, emptyZone, graveMonster, "attack");
    }

    case "111": {
      let zoneIndex = -1;
      if (target?.type === "monster" && target.playerId === oppId && target.zoneIndex != null) {
        const m = state.players[oppId]?.monsterZones[target.zoneIndex];
        if (m) zoneIndex = target.zoneIndex;
      }
      if (zoneIndex < 0) zoneIndex = getFirstFaceUpMonster(state, oppId);
      if (zoneIndex < 0) return state;
      const player = state.players[oppId];
      const monster = player.monsterZones[zoneIndex];
      const newZones = [...player.monsterZones];
      newZones[zoneIndex] = { ...monster, position: "defense", faceDown: true };
      return {
        ...state,
        players: {
          ...state.players,
          [oppId]: { ...player, monsterZones: newZones },
        },
      };
    }

    case "112": {
      const player = state.players[playerId];
      if (player.hand.length === 0) return state;
      const { newState, card: discarded } = removeFromHandByIndex(state, playerId, 0);
      if (!discarded) return state;
      let s = sendToGraveyard(newState, playerId, discarded);
      s = applyGraveyardEffect(s, playerId, discarded);
      for (let i = 4; i >= 0; i--) {
        const m = s.players[oppId].monsterZones[i];
        if (m) {
          s = sendToGraveyard(s, oppId, m);
          s = applyGraveyardEffect(s, oppId, m);
          s = clearMonsterZone(s, oppId, i);
        }
      }
      return s;
    }

    case "113": {
      const idx = getLowestAtkFaceUpMonster(state, oppId);
      if (idx < 0) return state;
      const m = state.players[oppId].monsterZones[idx];
      let s = sendToGraveyard(state, oppId, m);
      s = applyGraveyardEffect(s, oppId, m);
      return clearMonsterZone(s, oppId, idx);
    }

    case "114":
      return state;

    case "115": {
      let s = state;
      for (let i = 4; i >= 0; i--) {
        const m = s.players[oppId].monsterZones[i];
        if (m && m.position === "attack") {
          s = sendToGraveyard(s, oppId, m);
          s = applyGraveyardEffect(s, oppId, m);
          s = clearMonsterZone(s, oppId, i);
        }
      }
      return s;
    }

    default:
      return state;
  }
}

export function hasSpellEffect(card) {
  if (!card) return false;
  const id = String(card.id || card.name || "");
  return ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113"].includes(id);
}

export function hasTrapEffect(card) {
  if (!card) return false;
  const id = String(card.id || card.name || "");
  return ["114", "115"].includes(id);
}

export function canActivateFromField(card) {
  if (!card) return false;
  return hasSpellEffect(card) || hasTrapEffect(card);
}

/** true if this S/T can be activated in the given phase (for field activation) */
export function canActivateFromFieldInPhase(card, phase) {
  if (!card) return false;
  const id = String(card.id ?? "");
  if (id === "115") return phase === "battle"; // 圣防护罩 only in battle
  return phase === "main1" || phase === "main2";
}

/** Whether this spell/trap requires the player to choose a target before resolution */
export function needsTarget(card) {
  if (!card) return false;
  const id = String(card.id ?? "");
  return ["102", "106", "109", "110", "111"].includes(id);
}

/** Target type: 'graveyard' (102 both graves, 110 own grave), 'spellTrap' (106), 'opponentMonster' (109, 111) */
export function getSpellTargetType(card) {
  if (!card) return null;
  const id = String(card.id ?? "");
  if (id === "102" || id === "110") return "graveyard";
  if (id === "106") return "spellTrap";
  if (id === "109" || id === "111") return "opponentMonster";
  return null;
}
