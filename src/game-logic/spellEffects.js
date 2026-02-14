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
  let effectQueue = [];

  const collectAndReturn = (s) => ({ state: s, effectQueue });

  switch (id) {
    case "101":
      log("贪欲之壶：抽 2 张牌");
      return collectAndReturn(drawCard(drawCard(state, playerId), playerId));

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
      if (!graveMonster) return collectAndReturn(state);
      const emptyZone = target?.zoneIndex != null && player.monsterZones[target.zoneIndex] === null
        ? target.zoneIndex
        : player.monsterZones.findIndex((z) => !z);
      if (emptyZone < 0) return collectAndReturn(state);
      const owner = state.players[graveOwnerId];
      const newGraveyard = owner.graveyard.filter((c) => c.instanceId !== graveMonster.instanceId);
      let newState = {
        ...state,
        players: {
          ...state.players,
          [graveOwnerId]: { ...owner, graveyard: newGraveyard },
        },
      };
      const position = target?.position === "defense" ? "defense" : "attack";
      log(`死者苏生：从墓地特殊召唤 ${graveMonster?.name || "怪兽"}`);
      return collectAndReturn(placeMonsterZone(newState, playerId, emptyZone, graveMonster, position));
    }

    case "103": {
      log("黑洞：双方场上所有怪兽破坏，送入墓地");
      let s1 = state;
      for (const pid of ["player1", "player2"]) {
        for (let i = 4; i >= 0; i--) {
          const m = s1.players[pid].monsterZones[i];
          if (m) {
            s1 = sendToGraveyard(s1, pid, m);
            const eff = applyGraveyardEffect(s1, pid, m, { useModal: true });
            s1 = eff.state;
            if (eff.effectTrigger) effectQueue.push(eff.effectTrigger);
            s1 = clearMonsterZone(s1, pid, i);
          }
        }
      }
      return collectAndReturn(s1);
    }

    case "104": {
      const destroyed = state.players[oppId].monsterZones.filter(Boolean).map((m) => m?.name).join("、");
      log(`雷击：破坏对方场上所有怪兽${destroyed ? `（${destroyed}）送入墓地` : ""}`);
      let s2 = state;
      for (let i = 4; i >= 0; i--) {
        const m = s2.players[oppId].monsterZones[i];
        if (m) {
          s2 = sendToGraveyard(s2, oppId, m);
          const eff = applyGraveyardEffect(s2, oppId, m, { useModal: true });
          s2 = eff.state;
          if (eff.effectTrigger) effectQueue.push(eff.effectTrigger);
          s2 = clearMonsterZone(s2, oppId, i);
        }
      }
      return collectAndReturn(s2);
    }

    case "105": {
      log("光之护封剑：对方 3 回合内不能宣言攻击");
      const player = state.players[playerId];
      const spellZoneIndex = target?.spellZoneIndex != null && !player.spellTrapZones[target.spellZoneIndex]
        ? target.spellZoneIndex
        : getEmptySpellTrapZoneIndex(player);
      if (spellZoneIndex < 0) return collectAndReturn(state);
      const oppId = playerId === "player1" ? "player2" : "player1";
      let s = placeSpellTrapZone(state, playerId, spellZoneIndex, card, false);
      s = {
        ...s,
        lightSwordActive: oppId,
        lightSwordCard: { controllerPlayerId: playerId, zoneIndex: spellZoneIndex, turnsRemaining: 3 },
      };
      return collectAndReturn(s);
    }

    case "106": {
      let stTarget = null;
      if (target?.type === "spellTrap" && target.playerId != null && target.zoneIndex != null && state.players[target.playerId]?.spellTrapZones[target.zoneIndex]) {
        stTarget = { playerId: target.playerId, zoneIndex: target.zoneIndex };
      }
      if (!stTarget) stTarget = getFirstSpellTrapOnField(state, playerId);
      if (!stTarget) return collectAndReturn(state);
      const stCard = state.players[stTarget.playerId]?.spellTrapZones[stTarget.zoneIndex];
      log(`旋风：破坏 ${stCard?.name || "魔法·陷阱"}，送入墓地`);
      return collectAndReturn(destroySpellTrapAt(state, stTarget.playerId, stTarget.zoneIndex));
    }

    case "107":
      log("大风暴：破坏双方场上所有魔法·陷阱");
      return collectAndReturn(destroyAllSpellTraps(state));

    case "108":
      return collectAndReturn(state);

    case "109": {
      const opp = state.players[oppId];
      let fromZone = -1;
      if (target?.type === "monster" && target.playerId === oppId && target.zoneIndex != null) {
        const slot = opp.monsterZones?.[target.zoneIndex];
        if (slot && (!target.instanceId || slot.instanceId === target.instanceId)) {
          fromZone = target.zoneIndex;
        }
      }
      if (fromZone < 0) return collectAndReturn(state);
      const myEmpty = state.players[playerId].monsterZones.findIndex((z) => z === null);
      if (myEmpty < 0) return collectAndReturn(state);
      const monster = opp.monsterZones[fromZone];
      let s = clearMonsterZone(state, oppId, fromZone);
      s = placeMonsterZone(s, playerId, myEmpty, monster, monster.position || "attack");
      log(`心变：获得对方 ${monster?.name || "怪兽"} 的控制权`);
      s = {
        ...s,
        borrowedMonsters: [
          ...(s.borrowedMonsters || []),
          { fromPlayerId: oppId, fromZoneIndex: fromZone, toPlayerId: playerId, toZoneIndex: myEmpty, card: monster },
        ],
      };
      return collectAndReturn(s);
    }

    case "110": {
      const p = state.players[playerId];
      if (!p?.graveyard) return collectAndReturn(state);
      let s = setLP(state, playerId, (p.lp || 0) - 800);
      const player = s.players[playerId];
      if (!player?.graveyard) return collectAndReturn(s);
      let graveMonster = null;
      if (target?.type === "graveyard" && target.playerId === playerId && target.instanceId) {
        graveMonster = player.graveyard.find((c) => c?.instanceId === target.instanceId && c?.type === "monster");
      }
      if (!graveMonster) graveMonster = player.graveyard.find((c) => c?.type === "monster");
      if (!graveMonster) return collectAndReturn(s);
      log(`过早的埋葬：支付 800 LP，从墓地特殊召唤 ${graveMonster?.name || "怪兽"}，装备于此卡`);
      const mz = player.monsterZones ?? [null, null, null, null, null];
      const monsterZoneIndex =
        target?.zoneIndex != null && target.zoneIndex >= 0 && target.zoneIndex < mz.length && mz[target.zoneIndex] === null
          ? target.zoneIndex
          : mz.findIndex((z) => !z);
      if (monsterZoneIndex < 0) return collectAndReturn(s);
      const position = target?.position === "defense" ? "defense" : "attack";
      const newGraveyard = (player.graveyard || []).filter((c) => c?.instanceId !== graveMonster.instanceId);
      s = {
        ...s,
        players: {
          ...s.players,
          [playerId]: { ...player, graveyard: newGraveyard },
        },
      };
      s = placeMonsterZone(s, playerId, monsterZoneIndex, graveMonster, position);
      const currentPlayer = s.players[playerId];
      const stz = (currentPlayer?.spellTrapZones ?? [null, null, null, null, null]);
      const spellZoneIndex =
        target?.spellZoneIndex != null && target.spellZoneIndex >= 0 && target.spellZoneIndex < stz.length && !stz[target.spellZoneIndex]
          ? target.spellZoneIndex
          : getEmptySpellTrapZoneIndex({ spellTrapZones: stz });
      if (spellZoneIndex >= 0 && card) {
        s = placeSpellTrapZone(s, playerId, spellZoneIndex, card, false, monsterZoneIndex);
      } else if (card) {
        s = sendToGraveyard(s, playerId, card);
      }
      return collectAndReturn(s);
    }

    case "111": {
      let zoneIndex = -1;
      if (target?.type === "monster" && target.playerId === oppId && target.zoneIndex != null) {
        const m = state.players[oppId]?.monsterZones[target.zoneIndex];
        if (m) zoneIndex = target.zoneIndex;
      }
      if (zoneIndex < 0) zoneIndex = getFirstFaceUpMonster(state, oppId);
      if (zoneIndex < 0) return collectAndReturn(state);
      const player = state.players[oppId];
      const monster = player.monsterZones[zoneIndex];
      const newZones = [...player.monsterZones];
      newZones[zoneIndex] = { ...monster, position: "defense", faceDown: true };
      log(`月之书：将对方 ${monster?.name || "怪兽"} 变为里侧守备表示`);
      return collectAndReturn({
        ...state,
        players: {
          ...state.players,
          [oppId]: { ...player, monsterZones: newZones },
        },
      });
    }

    case "112": {
      const player = state.players[playerId];
      if (player.hand.length === 0) return collectAndReturn(state);
      const idx = target?.discardInstanceId != null
        ? player.hand.findIndex((c) => c.instanceId === target.discardInstanceId)
        : 0;
      if (idx < 0) return collectAndReturn(state);
      const { newState, card: discarded } = removeFromHandByIndex(state, playerId, idx);
      if (!discarded) return collectAndReturn(state);
      let s = sendToGraveyard(newState, playerId, discarded);
      const eff1 = applyGraveyardEffect(s, playerId, discarded, { useModal: true });
      s = eff1.state;
      if (eff1.effectTrigger) effectQueue.push(eff1.effectTrigger);
      const destroyed112 = state.players[oppId].monsterZones.filter(Boolean).map((m) => m?.name);
      log(`闪电漩涡：舍弃 ${discarded?.name || "手牌"}，破坏对方场上所有表侧怪兽${destroyed112.length ? `（${destroyed112.join("、")}）送入墓地` : ""}`);
      for (let i = 4; i >= 0; i--) {
        const m = s.players[oppId].monsterZones[i];
        if (m) {
          s = sendToGraveyard(s, oppId, m);
          const eff2 = applyGraveyardEffect(s, oppId, m, { useModal: true });
          s = eff2.state;
          if (eff2.effectTrigger) effectQueue.push(eff2.effectTrigger);
          s = clearMonsterZone(s, oppId, i);
        }
      }
      return collectAndReturn(s);
    }

    case "113": {
      const idx = getLowestAtkFaceUpMonster(state, oppId);
      if (idx < 0) return collectAndReturn(state);
      const m = state.players[oppId].monsterZones[idx];
      log(`地割：破坏对方攻击力最低的 ${m?.name || "怪兽"}，送入墓地`);
      let s = sendToGraveyard(state, oppId, m);
      const eff3 = applyGraveyardEffect(s, oppId, m, { useModal: true });
      s = eff3.state;
      if (eff3.effectTrigger) effectQueue.push(eff3.effectTrigger);
      return collectAndReturn(clearMonsterZone(s, oppId, idx));
    }

    case "114":
      return collectAndReturn(state);

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
          const eff2 = applyGraveyardEffect(s, oppId, m, { useModal: true });
          s = eff2.state;
          if (eff2.effectTrigger) effectQueue.push(eff2.effectTrigger);
          s = clearMonsterZone(s, oppId, i);
        }
      }
      return collectAndReturn(s);
    }

    default:
      return collectAndReturn(state);
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

/** true if this S/T can be activated in the given phase (for field activation)
 * @param {boolean} isControllerTurn - true when it's the card controller's turn
 * Normal spell (set): only main1/main2 when controller's turn.
 * Quick-Play (set): main1/main2/battle when controller's turn; main1/main2/battle/end when opponent's turn (respond).
 * Trap (set): like Quick-Play, or 115 battle-only.
 */
export function canActivateFromFieldInPhase(card, phase, isControllerTurn = true) {
  if (!card) return false;
  const id = String(card.id ?? "");
  if (id === "115") return phase === "battle"; // 圣防护罩 only in battle
  const mainOrBattle = phase === "main1" || phase === "main2" || phase === "battle";
  if (card.type === "spell") {
    if (card.spellType === "quickplay") {
      return isControllerTurn ? mainOrBattle : mainOrBattle || phase === "end";
    }
    // 通常魔法：仅在自己回合的主阶段
    return (phase === "main1" || phase === "main2") && isControllerTurn;
  }
  // 陷阱：与速攻类似，自己回合 main/battle，对方回合可响应 main/battle/end
  return isControllerTurn ? mainOrBattle : mainOrBattle || phase === "end";
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
