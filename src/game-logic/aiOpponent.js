// AI opponent - improved decisions (summon, spells, traps, attack)

import { canNormalSummon, getTributeCount } from "./summonValidator.js";
import { getDeckSearchQualifyingCards } from "./gameState.js";
import { getEmptyMonsterZoneIndex, getEmptySpellTrapZoneIndex } from "./gameState.js";
import { hasSpellEffect } from "./spellEffects.js";

// Human has strong board (high ATK monsters in attack position)
function humanHasStrongBoard(human) {
  const atkMonsters = (human?.monsterZones || []).filter(
    (z) => z && z.position === "attack"
  );
  const maxAtk = Math.max(0, ...atkMonsters.map((z) => z.atk || 0));
  return atkMonsters.length >= 2 || maxAtk >= 2000;
}

// AI is behind (fewer/weaker monsters)
function aiIsBehind(ai, human) {
  const aiCount = (ai?.monsterZones || []).filter(Boolean).length;
  const humanCount = (human?.monsterZones || []).filter(Boolean).length;
  const aiMaxAtk = Math.max(0, ...(ai?.monsterZones || []).map((z) => (z && z.position === "attack" ? z.atk || 0 : 0)));
  const humanMaxAtk = Math.max(0, ...(human?.monsterZones || []).map((z) => (z && z.position === "attack" ? z.atk || 0 : 0)));
  return humanCount > aiCount || humanMaxAtk > aiMaxAtk + 500;
}

/** AI decides whether to activate deck search effect. 002=optional, 011/012=mandatory when qualifying. */
export function getAIEffectConfirmDecision(state, pending) {
  if (!pending || pending.playerId !== "player2") return null;
  const qualifying = getDeckSearchQualifyingCards(state, pending.playerId, pending.filterType);
  if (qualifying.length === 0) return false;
  if (pending.filterType === "011" || pending.filterType === "012") return true;
  if (pending.filterType === "002") return true;
  return true;
}

/** AI picks best card from qualifying deck search. 011=highest ATK, 012=highest DEF, 002=prefer spells. */
export function getAIDeckSearchChoice(state, pending) {
  if (!pending || pending.playerId !== "player2") return null;
  const qualifying = getDeckSearchQualifyingCards(state, pending.playerId, pending.filterType);
  if (qualifying.length === 0) return null;
  if (pending.filterType === "011") {
    const best = [...qualifying].sort((a, b) => (b.atk || 0) - (a.atk || 0))[0];
    return best?.instanceId;
  }
  if (pending.filterType === "012") {
    const best = [...qualifying].sort((a, b) => (b.def || 0) - (a.def || 0))[0];
    return best?.instanceId;
  }
  if (pending.filterType === "002") {
    const spells = qualifying.filter((c) => c.type === "spell");
    const traps = qualifying.filter((c) => c.type === "trap");
    const prefer = spells.length > 0 ? spells : traps;
    const useful = prefer.filter((c) => ["104", "112", "109", "102", "101"].includes(String(c.id)));
    const arr = useful.length > 0 ? useful : prefer;
    const pick = [...arr].sort((a, b) => {
      const order = { "104": 5, "112": 4, "109": 3, "102": 2, "101": 1 };
      return (order[String(b.id)] || 0) - (order[String(a.id)] || 0);
    })[0];
    return pick?.instanceId || qualifying[0]?.instanceId;
  }
  return qualifying[0]?.instanceId;
}

export function getAIAction(state) {
  const aiPlayerId = "player2";
  const humanPlayerId = "player1";
  const ai = state.players[aiPlayerId];
  const human = state.players[humanPlayerId];

  if (state.currentPhase === "draw") {
    return { type: "DRAW_PHASE" };
  }

  // Main phase: offensive spells → set trap → other spells → summon
  if (state.currentPhase === "main1" || state.currentPhase === "main2") {
    const emptyZone = getEmptyMonsterZoneIndex(ai);
    const emptySpellZone = getEmptySpellTrapZoneIndex(ai);
    const humanFaceUpCount = (human?.monsterZones || []).filter((z) => z && !z.faceDown).length;
    const humanMonsters = (human?.monsterZones || [])
      .map((z, i) => (z ? { ...z, zoneIndex: i } : null))
      .filter(Boolean);

    // 109 心变: take human's best monster when AI has empty zone and human has strong monster
    const changeOfHeart = ai.hand.find((c) => c.type === "spell" && c.id === "109");
    if (changeOfHeart && hasSpellEffect(changeOfHeart) && emptyZone >= 0 && humanMonsters.length > 0) {
      const best = humanMonsters.filter((m) => !m.faceDown).sort((a, b) => (b.atk || 0) - (a.atk || 0))[0];
      if (best && (best.atk || 0) >= 1500) {
        return {
          type: "ACTIVATE_SPELL",
          playerId: aiPlayerId,
          card: changeOfHeart,
          target: { type: "monster", playerId: humanPlayerId, zoneIndex: best.zoneIndex },
        };
      }
    }

    // 112 闪电漩涡: when human has 2+ face-up monsters, discard low-value card
    const lightningVortex = ai.hand.find((c) => c.type === "spell" && c.id === "112");
    if (lightningVortex && hasSpellEffect(lightningVortex) && ai.hand.length >= 2 && humanFaceUpCount >= 2) {
      const toDiscard = ai.hand
        .filter((c) => c.instanceId !== lightningVortex.instanceId)
        .sort((a, b) => (a.atk || 0) - (b.atk || 0))[0];
      if (toDiscard) {
        return {
          type: "ACTIVATE_SPELL",
          playerId: aiPlayerId,
          card: lightningVortex,
          target: { discardInstanceId: toDiscard.instanceId },
        };
      }
    }

    // 104 雷击: when human has monsters
    const raigeki = ai.hand.find((c) => c.type === "spell" && c.id === "104");
    if (raigeki && hasSpellEffect(raigeki) && humanMonsters.length > 0) {
      return { type: "ACTIVATE_SPELL", playerId: aiPlayerId, card: raigeki };
    }

    // 113 地割: when human has face-up monsters
    const fissure = ai.hand.find((c) => c.type === "spell" && c.id === "113");
    if (fissure && hasSpellEffect(fissure) && humanFaceUpCount > 0) {
      return { type: "ACTIVATE_SPELL", playerId: aiPlayerId, card: fissure };
    }

    // Set 115 圣防护罩 when we have it and empty spell zone
    const mirrorForce = ai.hand.find((c) => c.type === "trap" && c.id === "115");
    if (mirrorForce && emptySpellZone >= 0) {
      return {
        type: "SET_SPELL_TRAP",
        playerId: aiPlayerId,
        card: mirrorForce,
        zoneIndex: emptySpellZone,
        faceDown: true,
      };
    }

    // 101 贪欲之壶 when hand has few cards
    const potOfGreed = ai.hand.find((c) => c.type === "spell" && c.id === "101");
    if (potOfGreed && hasSpellEffect(potOfGreed) && ai.hand.length <= 4) {
      return { type: "ACTIVATE_SPELL", playerId: aiPlayerId, card: potOfGreed };
    }

    // 102 死者苏生 when graveyard has strong monster
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
      const sorted = [...playableMonsters].sort((a, b) => (b.atk || 0) - (a.atk || 0));
      const card = sorted[0];
      const tributeCount = getTributeCount(card.level);
      let tributeIndices = [];
      if (tributeCount > 0) {
        const withIndex = ai.monsterZones
          .map((z, i) => (z ? { i, atk: z.atk || 0 } : null))
          .filter(Boolean);
        withIndex.sort((a, b) => a.atk - b.atk);
        tributeIndices = withIndex.slice(0, tributeCount).map((x) => x.i);
      }
      const zoneIndex = tributeCount > 0 ? tributeIndices[0] : emptyZone;
      // Defensive: face-down defense when human has strong board and AI is behind
      const useFaceDownDefense = humanHasStrongBoard(human) && aiIsBehind(ai, human) && (card.def || 0) >= 1000;
      return {
        type: "SUMMON",
        playerId: aiPlayerId,
        card,
        zoneIndex,
        tributeIndices: tributeCount > 0 ? tributeIndices : undefined,
        position: useFaceDownDefense ? "defense" : "attack",
        faceDown: useFaceDownDefense,
      };
    }
  }

  // Battle phase: direct attack first, then best target
  if (state.currentPhase === "battle") {
    if (state.lightSwordActive === aiPlayerId) return { type: "NEXT_PHASE" };
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
    const humanHasAnyMonsters = human.monsterZones.some((m) => m !== null);

    if (atkMonsters.length > 0) {
      const attacker = atkMonsters[0];
      if (!humanHasAnyMonsters) {
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
