// Basic AI opponent - makes simple decisions

import { canNormalSummon, getTributeCount } from "./summonValidator.js";
import { getEmptyMonsterZoneIndex } from "./gameState.js";

export function getAIAction(state) {
  const aiPlayerId = "player2";
  const humanPlayerId = "player1";
  const ai = state.players[aiPlayerId];
  const human = state.players[humanPlayerId];

  // Draw phase - just advance
  if (state.currentPhase === "draw") {
    return { type: "DRAW_PHASE" };
  }

  // Main phase - try to summon
  if (state.currentPhase === "main1" || state.currentPhase === "main2") {
    const playableMonsters = ai.hand.filter(
      (c) => c.type === "monster" && canNormalSummon(state, aiPlayerId, c)
    );
    const emptyZone = getEmptyMonsterZoneIndex(ai);

    if (playableMonsters.length > 0 && emptyZone >= 0) {
      const tributeCount = getTributeCount(playableMonsters[0].level);
      const tributeIndices =
        tributeCount > 0
          ? ai.monsterZones
              .map((z, i) => (z ? i : -1))
              .filter((i) => i >= 0)
              .slice(0, tributeCount)
          : [];
      return {
        type: "SUMMON",
        playerId: aiPlayerId,
        card: playableMonsters[0],
        zoneIndex: tributeCount > 0 ? tributeIndices[0] : emptyZone,
        tributeIndices: tributeCount > 0 ? tributeIndices : undefined,
      };
    }
  }

  // Battle phase - try to attack
  if (state.currentPhase === "battle") {
    const attacked = state.attackedMonsters?.[aiPlayerId] || [];
    const atkMonsters = ai.monsterZones
      .map((z, i) => (z && z.position === "attack" && !attacked.includes(i) ? { zone: i, card: z } : null))
      .filter(Boolean);
    const humanAtkMonsters = human.monsterZones
      .map((z, i) => (z && z.position === "attack" ? { zone: i, card: z } : null))
      .filter(Boolean);
    const humanHasAtk = humanAtkMonsters.length > 0;

    if (atkMonsters.length > 0) {
      const attacker = atkMonsters[0];
      if (!humanHasAtk) {
        return {
          type: "BATTLE",
          attackerPlayerId: aiPlayerId,
          attackerZoneIndex: attacker.zone,
          defenderPlayerId: humanPlayerId,
          defenderZoneIndex: -1,
        };
      }
      // Attack weakest monster we can beat
      const target = humanAtkMonsters.find(
        (t) => t.card.atk < attacker.card.atk
      );
      if (target) {
        return {
          type: "BATTLE",
          attackerPlayerId: aiPlayerId,
          attackerZoneIndex: attacker.zone,
          defenderPlayerId: humanPlayerId,
          defenderZoneIndex: target.zone,
        };
      }
      // Attack defense position if we can destroy
      const humanDefMonsters = human.monsterZones
        .map((z, i) => (z && z.position === "defense" ? { zone: i, card: z } : null))
        .filter(Boolean);
      const defTarget = humanDefMonsters.find(
        (t) => t.card.def < attacker.card.atk
      );
      if (defTarget) {
        return {
          type: "BATTLE",
          attackerPlayerId: aiPlayerId,
          attackerZoneIndex: attacker.zone,
          defenderPlayerId: humanPlayerId,
          defenderZoneIndex: defTarget.zone,
        };
      }
    }
  }

  // End phase or nothing to do - advance
  if (state.currentPhase === "draw" || state.currentPhase === "standby" || state.currentPhase === "end") {
    return { type: "NEXT_PHASE" };
  }

  return { type: "NEXT_PHASE" };
}
