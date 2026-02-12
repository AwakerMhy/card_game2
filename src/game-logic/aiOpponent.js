// AI opponent - improved decisions (summon best monster, attack wisely, use spells)

import { canNormalSummon, getTributeCount } from "./summonValidator.js";
import { getEmptyMonsterZoneIndex } from "./gameState.js";
import { hasSpellEffect } from "./spellEffects.js";

export function getAIAction(state) {
  const aiPlayerId = "player2";
  const humanPlayerId = "player1";
  const ai = state.players[aiPlayerId];
  const human = state.players[humanPlayerId];

  if (state.currentPhase === "draw") {
    return { type: "DRAW_PHASE" };
  }

  // Main phase: consider spell first, then summon best monster
  if (state.currentPhase === "main1" || state.currentPhase === "main2") {
    const emptyZone = getEmptyMonsterZoneIndex(ai);

    // Use 101 贪欲之壶 when hand has few cards
    const potOfGreed = ai.hand.find((c) => c.type === "spell" && c.id === "101");
    if (potOfGreed && hasSpellEffect(potOfGreed) && ai.hand.length <= 4) {
      return { type: "ACTIVATE_SPELL", playerId: aiPlayerId, card: potOfGreed };
    }

    // Use 102 死者苏生 when graveyard has strong monster and we have empty zone
    const monsterReborn = ai.hand.find((c) => c.type === "spell" && c.id === "102");
    if (monsterReborn && hasSpellEffect(monsterReborn) && emptyZone >= 0) {
      const bestInGrave = [...ai.graveyard]
        .filter((c) => c.type === "monster")
        .sort((a, b) => (b.atk || 0) - (a.atk || 0))[0];
      if (bestInGrave && bestInGrave.atk >= 1500) {
        return { type: "ACTIVATE_SPELL", playerId: aiPlayerId, card: monsterReborn };
      }
    }

    const playableMonsters = ai.hand.filter(
      (c) => c.type === "monster" && canNormalSummon(state, aiPlayerId, c)
    );
    if (playableMonsters.length > 0 && emptyZone >= 0) {
      // Prefer highest ATK monster we can summon
      const sorted = [...playableMonsters].sort((a, b) => (b.atk || 0) - (a.atk || 0));
      const card = sorted[0];
      const tributeCount = getTributeCount(card.level);
      let tributeIndices = [];
      if (tributeCount > 0) {
        const withIndex = ai.monsterZones
          .map((z, i) => (z ? { i, atk: z.atk || 0 } : null))
          .filter(Boolean);
        // Prefer tributing lowest ATK monsters
        withIndex.sort((a, b) => a.atk - b.atk);
        tributeIndices = withIndex.slice(0, tributeCount).map((x) => x.i);
      }
      const zoneIndex = tributeCount > 0 ? tributeIndices[0] : emptyZone;
      return {
        type: "SUMMON",
        playerId: aiPlayerId,
        card,
        zoneIndex,
        tributeIndices: tributeCount > 0 ? tributeIndices : undefined,
      };
    }
  }

  // Battle phase: direct attack first, then best target
  if (state.currentPhase === "battle") {
    const attacked = state.attackedMonsters?.[aiPlayerId] || [];
    const atkMonsters = ai.monsterZones
      .map((z, i) => (z && z.position === "attack" && !attacked.includes(i) ? { zone: i, card: z } : null))
      .filter(Boolean)
      .sort((a, b) => (b.card.atk || 0) - (a.card.atk || 0)); // Prefer attacking with highest ATK first
    const humanAtkMonsters = human.monsterZones
      .map((z, i) => (z && z.position === "attack" ? { zone: i, card: z } : null))
      .filter(Boolean);
    const humanDefMonsters = human.monsterZones
      .map((z, i) => (z && z.position === "defense" ? { zone: i, card: z } : null))
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
      // Prefer destroying highest ATK enemy we can beat (biggest threat first)
      const beatableAtk = humanAtkMonsters
        .filter((t) => t.card.atk < attacker.card.atk)
        .sort((a, b) => (b.card.atk || 0) - (a.card.atk || 0));
      if (beatableAtk.length > 0) {
        return {
          type: "BATTLE",
          attackerPlayerId: aiPlayerId,
          attackerZoneIndex: attacker.zone,
          defenderPlayerId: humanPlayerId,
          defenderZoneIndex: beatableAtk[0].zone,
        };
      }
      // Then defense position we can destroy (prefer highest DEF we can break for board impact)
      const beatableDef = humanDefMonsters
        .filter((t) => t.card.def < attacker.card.atk)
        .sort((a, b) => (b.card.def || 0) - (a.card.def || 0));
      if (beatableDef.length > 0) {
        return {
          type: "BATTLE",
          attackerPlayerId: aiPlayerId,
          attackerZoneIndex: attacker.zone,
          defenderPlayerId: humanPlayerId,
          defenderZoneIndex: beatableDef[0].zone,
        };
      }
    }
  }

  if (state.currentPhase === "draw" || state.currentPhase === "standby" || state.currentPhase === "end") {
    return { type: "NEXT_PHASE" };
  }

  return { type: "NEXT_PHASE" };
}
