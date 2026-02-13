// Spell/Trap effect handlers - resolve effects and return state updates

import {
  drawCard,
  placeMonsterZone,
  placeSpellTrapZone,
  sendToGraveyard,
  clearMonsterZone,
  clearSpellTrapZone,
  setLP,
  removeFromHandByIndex,
  searchDeckAddToHand,
  getEmptySpellTrapZoneIndex,
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

export function resolveSpellEffect(state, playerId, card, target, optLogs) {
  const id = String(card.id || card.name || "");
  const oppId = playerId === "player1" ? "player2" : "player1";
  const log = (text) => { if (optLogs) optLogs.push({ text, source: "player" }); };

  switch (id) {
    case "101":
      log("贪欲之壶：抽 2 张牌");
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
      const emptyZone = target?.zoneIndex != null && player.monsterZones[target.zoneIndex] === null
        ? target.zoneIndex
        : player.monsterZones.findIndex((z) => !z);
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
      log(`死者苏生：从墓地特殊召唤 ${graveMonster?.name || "怪兽"}`);
      return placeMonsterZone(newState, playerId, emptyZone, graveMonster, "attack");
    }

    case "103": {
      log("黑洞：双方场上所有怪兽破坏，送入墓地");
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
      const destroyed = state.players[oppId].monsterZones.filter(Boolean).map((m) => m?.name).join("、");
      log(`雷击：破坏对方场上所有怪兽${destroyed ? `（${destroyed}）送入墓地` : ""}`);
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
      log("光之护封剑：对方 3 回合内不能宣言攻击");
      const player = state.players[playerId];
      const spellZoneIndex = target?.spellZoneIndex != null && !player.spellTrapZones[target.spellZoneIndex]
        ? target.spellZoneIndex
        : getEmptySpellTrapZoneIndex(player);
      if (spellZoneIndex < 0) return state;
      const oppId = playerId === "player1" ? "player2" : "player1";
      let s = placeSpellTrapZone(state, playerId, spellZoneIndex, card, false);
      s = {
        ...s,
        lightSwordActive: oppId,
        lightSwordCard: { controllerPlayerId: playerId, zoneIndex: spellZoneIndex, turnsRemaining: 3 },
      };
      return s;
    }

    case "106": {
      let stTarget = null;
      if (target?.type === "spellTrap" && target.playerId != null && target.zoneIndex != null && state.players[target.playerId]?.spellTrapZones[target.zoneIndex]) {
        stTarget = { playerId: target.playerId, zoneIndex: target.zoneIndex };
      }
      if (!stTarget) stTarget = getFirstSpellTrapOnField(state, playerId);
      if (!stTarget) return state;
      const stCard = state.players[stTarget.playerId]?.spellTrapZones[stTarget.zoneIndex];
      log(`旋风：破坏 ${stCard?.name || "魔法·陷阱"}，送入墓地`);
      return destroySpellTrapAt(state, stTarget.playerId, stTarget.zoneIndex);
    }

    case "107":
      log("大风暴：破坏双方场上所有魔法·陷阱");
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
      log(`心变：获得对方 ${monster?.name || "怪兽"} 的控制权`);
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
      log(`过早的埋葬：支付 800 LP，从墓地特殊召唤 ${graveMonster?.name || "怪兽"}，装备于此卡`);
      const monsterZoneIndex = target?.zoneIndex != null && player.monsterZones[target.zoneIndex] === null
        ? target.zoneIndex
        : player.monsterZones.findIndex((z) => !z);
      if (monsterZoneIndex < 0) return s;
      const newGraveyard = player.graveyard.filter((c) => c.instanceId !== graveMonster.instanceId);
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: { ...player, graveyard: newGraveyard },
        },
      };
      s = placeMonsterZone(s, playerId, monsterZoneIndex, graveMonster, "attack");
      const spellZoneIndex = target?.spellZoneIndex != null && !player.spellTrapZones[target.spellZoneIndex]
        ? target.spellZoneIndex
        : getEmptySpellTrapZoneIndex(s.players[playerId]);
      if (spellZoneIndex >= 0) {
        s = placeSpellTrapZone(s, playerId, spellZoneIndex, card, false, monsterZoneIndex);
      } else {
        s = sendToGraveyard(s, playerId, card);
      }
      return s;
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
      log(`月之书：将对方 ${monster?.name || "怪兽"} 变为里侧守备表示`);
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
      const idx = target?.discardInstanceId != null
        ? player.hand.findIndex((c) => c.instanceId === target.discardInstanceId)
        : 0;
      if (idx < 0) return state;
      const { newState, card: discarded } = removeFromHandByIndex(state, playerId, idx);
      if (!discarded) return state;
      let s = sendToGraveyard(newState, playerId, discarded);
      s = applyGraveyardEffect(s, playerId, discarded);
      const destroyed112 = state.players[oppId].monsterZones.filter(Boolean).map((m) => m?.name);
      log(`闪电漩涡：舍弃 ${discarded?.name || "手牌"}，破坏对方场上所有表侧怪兽${destroyed112.length ? `（${destroyed112.join("、")}）送入墓地` : ""}`);
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
      log(`地割：破坏对方攻击力最低的 ${m?.name || "怪兽"}，送入墓地`);
      let s = sendToGraveyard(state, oppId, m);
      s = applyGraveyardEffect(s, oppId, m);
      return clearMonsterZone(s, oppId, idx);
    }

    case "114":
      return state;

    case "115": {
      const destroyed115 = state.players[oppId].monsterZones
        .filter((m) => m && m.position === "attack")
        .map((m) => m?.name);
      if (destroyed115.length) log(`圣防护罩：破坏对方所有攻击表示怪兽（${destroyed115.join("、")}）送入墓地`);
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

/** Whether this spell needs to choose an empty S/T zone for placement (e.g. 105 光之护封剑) */
export function needsZoneForPlacement(card) {
  if (!card) return false;
  return String(card.id ?? "") === "105";
}

/** Whether this spell/trap requires discarding hand card(s) as cost (e.g. 112 闪电漩涡) */
export function needsDiscard(card) {
  if (!card) return false;
  return String(card.id ?? "") === "112";
}

/** How many hand cards to discard for needsDiscard cards */
export function getDiscardCount(card) {
  if (!card) return 0;
  if (String(card.id ?? "") === "112") return 1;
  return 0;
}

/** Get face-down traps that can be activated when opponent declares attack (e.g. 115 圣防护罩) */
export function getActivatableTrapsOnAttackDeclared(state) {
  if (!state.pendingAttack) return [];
  const defenderId = state.pendingAttack.defenderPlayerId;
  if (state.currentPhase !== "battle") return [];
  const zones = state.players[defenderId]?.spellTrapZones ?? [];
  const turnCount = state.turnCount ?? 1;
  const result = [];
  zones.forEach((slot, zoneIndex) => {
    if (!slot || !slot.faceDown || slot.type !== "trap") return;
    const setOnTurn = slot.setOnTurn ?? 0;
    if (setOnTurn >= turnCount) return; // cannot activate the turn it was set
    const id = String(slot.id ?? "");
    if (id === "115" && canActivateFromFieldInPhase(slot, "battle")) {
      result.push({ playerId: defenderId, zoneIndex, card: slot });
    }
  });
  return result;
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
