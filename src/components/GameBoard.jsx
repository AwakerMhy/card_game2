import { useReducer, useCallback, useState, useEffect, useRef } from "react";
import PlayerArea, { DeckGraveyardRow } from "./PlayerArea.jsx";
import PhaseIndicator, { PHASES } from "./PhaseIndicator.jsx";
import DamageDisplay from "./DamageDisplay.jsx";
import CardDetailPanel from "./CardDetailPanel.jsx";
import GraveyardModal from "./GraveyardModal.jsx";
import GraveyardSelectModal from "./GraveyardSelectModal.jsx";
import HandSelectModal from "./HandSelectModal.jsx";
import DeckSearchModal from "./DeckSearchModal.jsx";
import EffectConfirmModal from "./EffectConfirmModal.jsx";
import ActionLog from "./ActionLog.jsx";
import {
  createInitialState,
  drawCard,
  removeFromHand,
  removeFromHandByIndex,
  placeMonsterZone,
  placeSpellTrapZone,
  clearMonsterZone,
  setLP,
  sendToGraveyard,
  addCardToHand,
  getEmptyMonsterZoneIndex,
  getEmptySpellTrapZoneIndex,
  clearSpellTrapZone,
  getDeckSearchQualifyingCards,
  executeDeckSearchSelect,
  pushEffectQueue,
  popEffectQueue,
} from "../game-logic/gameState.js";
import { applyOnSummon, applyGraveyardEffect } from "../game-logic/monsterEffects.js";
import { canNormalSummon, getTributeCount } from "../game-logic/summonValidator.js";
import { calculateBattle } from "../game-logic/battleCalculator.js";
import { resolveSpellEffect, hasSpellEffect, hasTrapEffect, canActivateFromField, canActivateFromFieldInPhase, needsTarget, needsZoneForPlacement, needsDiscard, getSpellTargetType, getActivatableTrapsOnAttackDeclared } from "../game-logic/spellEffects.js";
import { getAIAction, getAIEffectConfirmDecision, getAIDeckSearchChoice } from "../game-logic/aiOpponent.js";
import { playDraw, playSummon, playAttack, playDamage, playSet, playPhase } from "../utils/sounds.js";

/** Complete battle resolution after Kuriboh decision. ctx: { attacker, defender, result, attackerPlayerId, attackerZoneIndex, defenderPlayerId, defenderZoneIndex, defenderPlayer, defenderDamageToApply } */
function completeBattleResolution(state, ctx) {
  const { attacker, defender, result, attackerPlayerId, attackerZoneIndex, defenderPlayerId, defenderZoneIndex, defenderPlayer, defenderDamageToApply } = ctx;
  let newState = state;

  if (result.defenderDestroys) {
    newState = sendToGraveyard(newState, attackerPlayerId, attacker);
    const aEff = applyGraveyardEffect(newState, attackerPlayerId, attacker, { useModal: true });
    newState = aEff.state;
    if (aEff.effectTrigger) {
      newState = clearMonsterZone(newState, attackerPlayerId, attackerZoneIndex);
      newState = setLP(newState, attackerPlayerId, state.players[attackerPlayerId].lp - result.attackerDamage);
      const damageAmount = result.attackerDamage;
      const attacked = [...(state.attackedMonsters[attackerPlayerId] || []), attackerZoneIndex];
      return {
        ...newState,
        pendingAttack: null,
        pendingKuribohChoice: null,
        lastDamage: damageAmount,
        lastDamageTarget: attackerPlayerId,
        lastBattleLog: { attackerPlayerId, defenderPlayerId, attackerName: attacker?.name || "怪兽", defenderName: defender?.name || (defenderZoneIndex === -1 ? null : "怪兽"), isDirectAttack: defenderZoneIndex === -1 && !state.players[defenderPlayerId].monsterZones.some((m) => m !== null) },
        attackedMonsters: { ...state.attackedMonsters, [attackerPlayerId]: attacked },
        pendingEffectQueue: [aEff.effectTrigger],
        pendingEffectConfirm: aEff.effectTrigger,
      };
    }
    newState = clearMonsterZone(newState, attackerPlayerId, attackerZoneIndex);
    newState = setLP(newState, attackerPlayerId, state.players[attackerPlayerId].lp - result.attackerDamage);
  }
  if (result.attackerDestroys && defender) {
    newState = sendToGraveyard(newState, defenderPlayerId, defender);
    const dEff = applyGraveyardEffect(newState, defenderPlayerId, defender, { useModal: true });
    newState = dEff.state;
    if (dEff.effectTrigger) {
      newState = clearMonsterZone(newState, defenderPlayerId, defenderZoneIndex);
      if (defenderDamageToApply > 0) newState = setLP(newState, defenderPlayerId, defenderPlayer.lp - defenderDamageToApply);
      const attacked = [...(state.attackedMonsters[attackerPlayerId] || []), attackerZoneIndex];
      return {
        ...newState,
        pendingAttack: null,
        pendingKuribohChoice: null,
        lastDamage: defenderDamageToApply || 0,
        lastDamageTarget: defenderDamageToApply > 0 ? defenderPlayerId : null,
        lastBattleLog: { attackerPlayerId, defenderPlayerId, attackerName: attacker?.name || "怪兽", defenderName: defender?.name || "怪兽", isDirectAttack: false },
        attackedMonsters: { ...state.attackedMonsters, [attackerPlayerId]: attacked },
        pendingEffectQueue: [dEff.effectTrigger],
        pendingEffectConfirm: dEff.effectTrigger,
      };
    }
    newState = clearMonsterZone(newState, defenderPlayerId, defenderZoneIndex);
  }
  if (defenderDamageToApply > 0) {
    newState = setLP(newState, defenderPlayerId, defenderPlayer.lp - defenderDamageToApply);
  }
  if (result.attackerDamage > 0) {
    newState = setLP(newState, attackerPlayerId, state.players[attackerPlayerId].lp - result.attackerDamage);
  }

  if (defender?.id === "018" && !result.defenderDestroys) {
    newState = clearMonsterZone(newState, attackerPlayerId, attackerZoneIndex);
    newState = addCardToHand(newState, attackerPlayerId, attacker);
    const wLogSource = defenderPlayerId === "player1" ? "player" : "ai";
    newState = { ...newState, pendingLogs: [...(newState.pendingLogs || []), { text: `幻影墙效果：${attacker?.name || "攻击怪兽"} 返回持有者手牌`, source: wLogSource }] };
  }

  if (newState.players[defenderPlayerId].lp <= 0) {
    newState = { ...newState, winner: attackerPlayerId };
  }
  const damageAmount = defenderDamageToApply || result.attackerDamage;
  const damageTarget = defenderDamageToApply > 0 ? defenderPlayerId : result.attackerDamage > 0 ? attackerPlayerId : null;
  const attacked = [...(state.attackedMonsters[attackerPlayerId] || []), attackerZoneIndex];
  const attackerName = attacker?.name || "怪兽";
  const defenderName = defender?.name || (defenderZoneIndex === -1 && !state.players[defenderPlayerId].monsterZones.some((m) => m !== null) ? null : "怪兽");
  return {
    ...newState,
    pendingAttack: null,
    pendingKuribohChoice: null,
    lastDamage: damageAmount,
    lastDamageTarget: damageTarget,
    lastBattleLog: {
      attackerPlayerId,
      defenderPlayerId,
      attackerName,
      defenderName,
      isDirectAttack: defenderZoneIndex === -1 && !state.players[defenderPlayerId].monsterZones.some((m) => m !== null),
      attackerDestroys: result.defenderDestroys,
      defenderDestroys: result.attackerDestroys,
      attackerDamage: result.attackerDamage,
      defenderDamage: defenderDamageToApply,
    },
    attackedMonsters: { ...newState.attackedMonsters, [attackerPlayerId]: attacked },
  };
}

function gameReducer(state, action) {
  switch (action.type) {
    case "DRAW":
      return drawCard(state, action.playerId);
    case "SET_PHASE":
      return { ...state, currentPhase: action.phase };
    case "SUMMON": {
      const { playerId, card, zoneIndex, tributeIndices, position = "attack", faceDown = false, logSource = "player" } = action;
      let newState = removeFromHand(state, playerId, card.instanceId);
      const tributeNames = tributeIndices?.map((idx) => state.players[playerId].monsterZones[idx]?.name).filter(Boolean) || [];
      let effectQueue = [];
      if (tributeIndices?.length) {
        tributeIndices.forEach((idx) => {
          const tributed = state.players[playerId].monsterZones[idx];
          const borrowed = (newState.borrowedMonsters || []).find(
            (b) => b.toPlayerId === playerId && b.card?.instanceId === tributed?.instanceId
          );
          const graveOwnerId = borrowed ? borrowed.fromPlayerId : playerId;
          newState = sendToGraveyard(newState, graveOwnerId, tributed);
          if (borrowed) {
            newState = {
              ...newState,
              borrowedMonsters: (newState.borrowedMonsters || []).filter(
                (b) => !(b.toPlayerId === playerId && b.card?.instanceId === tributed?.instanceId)
              ),
            };
          }
          const eff = applyGraveyardEffect(newState, graveOwnerId, tributed, { useModal: true });
          newState = eff.state;
          if (eff.effectTrigger) effectQueue.push(eff.effectTrigger);
          newState = clearMonsterZone(newState, playerId, idx);
        });
      }
      newState = placeMonsterZone(newState, playerId, zoneIndex, card, position, faceDown, faceDown ? state.turnCount : null);
      const summonEff = applyOnSummon(newState, playerId, card, { useModal: true });
      newState = summonEff.state;
      if (summonEff.effectTrigger) effectQueue.push(summonEff.effectTrigger);
      const logEntry = tributeNames.length
        ? { text: faceDown ? `里侧守备表示祭品召唤1只怪兽（祭品：${tributeNames.join("、")}）→ 送入墓地` : `祭品召唤 ${card.name}（祭品：${tributeNames.join("、")}）→ 送入墓地`, source: logSource }
        : faceDown ? { text: `里侧守备表示召唤1只怪兽`, source: logSource } : { text: `召唤 ${card.name}`, source: logSource };
      newState = { ...newState, canNormalSummon: false, pendingLogs: [...(state.pendingLogs || []), logEntry] };
      if (effectQueue.length > 0) {
        newState = { ...newState, pendingEffectQueue: effectQueue, pendingEffectConfirm: effectQueue[0] };
      }
      return newState;
    }
    case "SET_SPELL_TRAP": {
      const { playerId, card, zoneIndex, faceDown } = action;
      let newState = removeFromHand(state, playerId, card.instanceId);
      return placeSpellTrapZone(newState, playerId, zoneIndex, card, faceDown, null, state.turnCount);
    }
    case "ACTIVATE_SPELL": {
      const { playerId, card, target, logSource = "player" } = action;
      const effectLogs = [];
      let newState = removeFromHand(state, playerId, card.instanceId);
      const spellResult = resolveSpellEffect(newState, playerId, card, target, effectLogs);
      newState = spellResult.state;
      // 清除对手装备等操作可能产生引用污染，再次确保已用魔法已从手牌移除（如心变对装备过早埋葬的怪兽）
      newState = removeFromHand(newState, playerId, card.instanceId);
      const withLogs = effectLogs.length ? { ...newState, pendingLogs: [...(state.pendingLogs || []), ...effectLogs.map((e) => ({ ...e, source: logSource }))] } : newState;
      if (String(card.id) === "110" || String(card.id) === "105") return withLogs;
      let result = sendToGraveyard(withLogs, playerId, card);
      if (spellResult.effectQueue?.length > 0) {
        result = { ...result, pendingEffectQueue: spellResult.effectQueue, pendingEffectConfirm: spellResult.effectQueue[0] };
      }
      return result;
    }
    case "ACTIVATE_SPELL_FROM_FIELD": {
      const { playerId, zoneIndex, target, logSource = "player" } = action;
      const { newState: clearedState, card } = clearSpellTrapZone(state, playerId, zoneIndex);
      if (!card || (card.type !== "spell" && card.type !== "trap")) return state;
      if (!canActivateFromField(card)) return state;
      const targetWithSpellZone = (String(card.id) === "110" || String(card.id) === "105")
        ? { ...target, spellZoneIndex: target?.spellZoneIndex ?? zoneIndex }
        : target;
      const effectLogs = [];
      const spellResult = resolveSpellEffect(clearedState, playerId, card, targetWithSpellZone, effectLogs);
      let newState = spellResult.state;
      const withLogs = effectLogs.length ? { ...newState, pendingLogs: [...(state.pendingLogs || []), ...effectLogs.map((e) => ({ ...e, source: logSource }))] } : newState;
      if (String(card.id) === "110" || String(card.id) === "105") return withLogs;
      let result = sendToGraveyard(withLogs, playerId, card);
      if (card.type === "trap" && state.pendingAttack) result = { ...result, pendingAttack: null };
      if (spellResult.effectQueue?.length > 0) {
        result = { ...result, pendingEffectQueue: spellResult.effectQueue, pendingEffectConfirm: spellResult.effectQueue[0] };
      }
      return result;
    }
    case "ADD_TO_CHAIN": {
      const { card, playerId } = action;
      return {
        ...state,
        chain: [...state.chain, { card, playerId }],
      };
    }
    case "RESOLVE_CHAIN": {
      const chain = [...state.chain].reverse();
      let newState = state;
      for (const link of chain) {
        if (link.card.type === "spell" && link.card.id === "101") {
          newState = drawCard(drawCard(newState, link.playerId), link.playerId);
        }
        newState = sendToGraveyard(newState, link.playerId, link.card);
      }
      return { ...newState, chain: [] };
    }
    case "PREPARE_ATTACK": {
      return {
        ...state,
        pendingAttack: {
          attackerPlayerId: action.attackerPlayerId,
          attackerZoneIndex: action.attackerZoneIndex,
          defenderPlayerId: action.defenderPlayerId,
          defenderZoneIndex: action.defenderZoneIndex,
        },
      };
    }
    case "CLEAR_PENDING_ATTACK":
      return { ...state, pendingAttack: null };
    case "EFFECT_CONFIRM_YES": {
      if (!state.pendingEffectConfirm) return state;
      const pc = state.pendingEffectConfirm;
      const logEntry = action.logEntry ? { ...state, pendingLogs: [...(state.pendingLogs || []), action.logEntry] } : state;
      return {
        ...logEntry,
        pendingDeckSearch: pc,
        pendingEffectConfirm: null,
      };
    }
    case "EFFECT_CONFIRM_NO": {
      if (!state.pendingEffectConfirm) return state;
      const pc = state.pendingEffectConfirm;
      const logEntry = action.logEntry ? { ...state, pendingLogs: [...(state.pendingLogs || []), action.logEntry] } : state;
      return popEffectQueue({ ...logEntry, pendingEffectConfirm: null });
    }
    case "DECK_SEARCH_SELECT": {
      const { playerId: pid, instanceId } = action;
      if (!state.pendingDeckSearch || state.pendingDeckSearch.playerId !== pid) return state;
      const added = state.players[pid]?.deck?.find((c) => c.instanceId === instanceId);
      let nextState = executeDeckSearchSelect(state, pid, instanceId);
      const logSource = pid === "player1" ? "player" : "ai";
      nextState = {
        ...nextState,
        pendingLogs: [...(state.pendingLogs || []), { text: `${state.pendingDeckSearch.sourceCardName} 效果：${added?.name || "卡"} 加入手牌，卡组洗切`, source: logSource }],
      };
      const queue = (nextState.pendingEffectQueue || []).slice(1);
      if (queue.length > 0) {
        nextState = { ...nextState, pendingEffectQueue: queue, pendingEffectConfirm: queue[0] };
      } else {
        nextState = { ...nextState, pendingEffectQueue: [], pendingEffectConfirm: null };
      }
      return nextState;
    }
    case "DECK_SEARCH_CANCEL": {
      if (!state.pendingDeckSearch) return state;
      const nextState = { ...state, pendingDeckSearch: null };
      const queue = nextState.pendingEffectQueue || [];
      if (queue.length > 0) {
        return { ...nextState, pendingEffectQueue: queue.slice(1), pendingEffectConfirm: queue[1] || null };
      }
      return nextState;
    }
    case "NEGATE_ATTACK": {
      const { defenderPlayerId, handIndex } = action;
      const def = state.players[defenderPlayerId];
      if (!state.pendingAttack || handIndex < 0 || handIndex >= def.hand.length) return { ...state, pendingAttack: null };
      const card = def.hand[handIndex];
      if (String(card?.id) !== "010") return { ...state, pendingAttack: null };
      let newState = removeFromHandByIndex(state, defenderPlayerId, handIndex).newState;
      newState = sendToGraveyard(newState, defenderPlayerId, card);
      const negEff = applyGraveyardEffect(newState, defenderPlayerId, card, { useModal: false });
      newState = negEff.state;
      const logSource = defenderPlayerId === "player1" ? "player" : "ai";
      const logEntry = { text: `丢弃 ${card?.name || "羽翼栗子球"}，攻击无效`, source: logSource };
      return { ...newState, pendingAttack: null, pendingLogs: [...(state.pendingLogs || []), logEntry] };
    }
    case "BATTLE": {
      const { attackerPlayerId, attackerZoneIndex, defenderPlayerId, defenderZoneIndex } = action;
      const attacker = state.players[attackerPlayerId].monsterZones[attackerZoneIndex];
      const defenderPlayer = state.players[defenderPlayerId];
      let defender = defenderZoneIndex >= 0
        ? defenderPlayer.monsterZones[defenderZoneIndex]
        : null;
      const defenderHasAnyMonsters = defenderPlayer.monsterZones.some((m) => m !== null);
      const isDirectAttack = defenderZoneIndex === -1 && !defenderHasAnyMonsters;
      if (defenderZoneIndex === -1 && defenderHasAnyMonsters) return state;

      let newState = state;
      if (defender?.faceDown) {
        const flipped = { ...defender, faceDown: false, position: "defense" };
        const newZones = [...defenderPlayer.monsterZones];
        newZones[defenderZoneIndex] = flipped;
        newState = {
          ...state,
          players: {
            ...state.players,
            [defenderPlayerId]: { ...defenderPlayer, monsterZones: newZones },
          },
          pendingLogs: [...(state.pendingLogs || []), { text: `${defender?.name || "里侧怪兽"} 被攻击翻开为表侧守备表示`, source: defenderPlayerId === "player1" ? "player" : "ai" }],
        };
        defender = flipped;
      }

      const result = calculateBattle(attacker, defender, isDirectAttack);
      if (!result) return state;

      let defenderDamageToApply = result.defenderDamage;

      // 007 栗子球: 人类防守方可选择是否舍弃；AI 防守方自动舍弃
      if (defenderDamageToApply > 0) {
        const kuribohIdx = newState.players[defenderPlayerId].hand.findIndex((c) => String(c?.id) === "007");
        if (kuribohIdx >= 0) {
          if (defenderPlayerId === "player1") {
            // 人类：弹窗让玩家选择
            return {
              ...newState,
              pendingAttack: null,
              pendingKuribohChoice: {
                attackerPlayerId,
                attackerZoneIndex,
                defenderPlayerId,
                defenderZoneIndex,
                attacker,
                defender,
                defenderPlayer,
                result,
                defenderDamageToApply,
              },
            };
          }
          // AI：自动舍弃栗子球
          const { newState: s2, card: kuriboh } = removeFromHandByIndex(newState, defenderPlayerId, kuribohIdx);
          newState = sendToGraveyard(s2, defenderPlayerId, kuriboh);
          const kEff = applyGraveyardEffect(newState, defenderPlayerId, kuriboh, { useModal: false });
          newState = kEff.state;
          defenderDamageToApply = 0;
          const kLogSource = "ai";
          newState = { ...newState, pendingLogs: [...(newState.pendingLogs || []), { text: `舍弃 ${kuriboh?.name || "栗子球"}，战斗伤害变为 0`, source: kLogSource }] };
        }
      }

      return completeBattleResolution(newState, {
        attacker,
        defender,
        result,
        attackerPlayerId,
        attackerZoneIndex,
        defenderPlayerId,
        defenderZoneIndex,
        defenderPlayer,
        defenderDamageToApply,
      });
    }
    case "KURIBOH_CHOICE": {
      const { useKuriboh } = action;
      const pc = state.pendingKuribohChoice;
      if (!pc) return state;
      const { attackerPlayerId, attackerZoneIndex, defenderPlayerId, defenderZoneIndex, attacker, defender, defenderPlayer, result, defenderDamageToApply } = pc;
      let newState = state;
      if (useKuriboh) {
        const kuribohIdx = newState.players[defenderPlayerId].hand.findIndex((c) => String(c?.id) === "007");
        if (kuribohIdx >= 0) {
          const { newState: s2, card: kuriboh } = removeFromHandByIndex(newState, defenderPlayerId, kuribohIdx);
          newState = sendToGraveyard(s2, defenderPlayerId, kuriboh);
          const kEff = applyGraveyardEffect(newState, defenderPlayerId, kuriboh, { useModal: false });
          newState = kEff.state;
          newState = { ...newState, pendingLogs: [...(newState.pendingLogs || []), { text: `舍弃 ${kuriboh?.name || "栗子球"}，战斗伤害变为 0`, source: "player" }] };
        }
        return completeBattleResolution(newState, { ...pc, defenderPlayer: newState.players[defenderPlayerId], defenderDamageToApply: 0 });
      }
      return completeBattleResolution(newState, { ...pc, defenderDamageToApply });
    }
    case "CLEAR_DAMAGE":
      return { ...state, lastDamage: null, lastDamageTarget: null, lastBattleLog: null };
    case "CLEAR_PENDING_LOGS":
      return { ...state, pendingLogs: [] };
    case "CHANGE_POSITION": {
      const { playerId, zoneIndex, newPosition, logSource = "player" } = action;
      const player = state.players[playerId];
      const zone = player.monsterZones[zoneIndex];
      if (!zone) return state;
      const changed = state.changedPositionThisTurn?.[playerId] ?? [];
      if (changed.includes(zoneIndex)) return state;
      const turnCount = state.turnCount ?? 1;
      if (zone.faceDown && (zone.setOnTurn ?? 0) >= turnCount) return state;
      const nextPosition = newPosition ?? (zone.position === "attack" ? "defense" : "attack");
      const newZones = [...player.monsterZones];
      const flipped = zone.faceDown ? { ...zone, position: nextPosition, faceDown: false } : { ...zone, position: nextPosition };
      newZones[zoneIndex] = flipped;
      const posStr = nextPosition === "attack" ? "攻击" : "守备";
      const flipStr = zone.faceDown ? "翻开为" : "改为";
      const logEntry = { text: `${zone?.name || "怪兽"} ${flipStr} ${posStr} 表示`, source: logSource };
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...player, monsterZones: newZones },
        },
        changedPositionThisTurn: {
          ...state.changedPositionThisTurn,
          [playerId]: [...changed, zoneIndex],
        },
        pendingLogs: [...(state.pendingLogs || []), logEntry],
      };
    }
    case "END_TURN": {
      const endingPlayerId = state.currentTurn === 1 ? "player1" : "player2";
      let endState = {
        ...state,
        currentTurn: state.currentTurn === 1 ? 2 : 1,
        currentPhase: "draw",
        canNormalSummon: true,
        turnCount: state.turnCount + 1,
        attackedMonsters: { player1: [], player2: [] },
        borrowedMonsters: [],
        changedPositionThisTurn: { player1: [], player2: [] },
      };
      const ls = state.lightSwordCard;
      if (ls && endingPlayerId === (ls.controllerPlayerId === "player1" ? "player2" : "player1")) {
        const remains = ls.turnsRemaining - 1;
        if (remains <= 0) {
          const { newState: ns, card: lsCard } = clearSpellTrapZone(endState, ls.controllerPlayerId, ls.zoneIndex);
          endState = lsCard ? sendToGraveyard(ns, ls.controllerPlayerId, lsCard) : ns;
          endState = {
            ...endState,
            lightSwordActive: null,
            lightSwordCard: null,
            pendingLogs: [...(endState.pendingLogs || []), { text: `光之护封剑 3 回合结束，破坏送入墓地`, source: "player" }],
          };
        } else {
          endState = { ...endState, lightSwordCard: { ...ls, turnsRemaining: remains }, lightSwordActive: state.lightSwordActive };
        }
      } else {
        endState = { ...endState, lightSwordActive: ls ? state.lightSwordActive : null, lightSwordCard: ls || null };
      }
      const borrowed = (state.borrowedMonsters || []).filter((b) => b.toPlayerId === endingPlayerId);
      for (const b of borrowed) {
        const toP = endState.players[b.toPlayerId];
        const card = toP?.monsterZones[b.toZoneIndex];
        if (!card || (b.card?.instanceId && card.instanceId !== b.card.instanceId)) continue;
        endState = clearMonsterZone(endState, b.toPlayerId, b.toZoneIndex);
        endState = placeMonsterZone(endState, b.fromPlayerId, b.fromZoneIndex, card, card.position || "attack", card.faceDown);
        endState = { ...endState, pendingLogs: [...(endState.pendingLogs || []), { text: `心变结束：${card?.name || "怪兽"} 归还对方`, source: "player" }] };
      }
      const stillBorrowed = (state.borrowedMonsters || []).filter((b) => b.toPlayerId !== endingPlayerId);
      endState = { ...endState, borrowedMonsters: stillBorrowed };
      return endState;
    }
    case "RESET":
      return createInitialState(state.deckConfig || {});
    default:
      return state;
  }
}

const MOBILE_LAYOUT_KEY = "cardGame_mobileLayout";
const MOBILE_LARGE_KEY = "cardGame_mobileLarge";

export default function GameBoard({ initialVsAI = false, initialMobileLayout, initialMobileLarge, initialDeckConfig, onBackToMenu }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialDeckConfig,
    (config) => createInitialState(config || {})
  );
  const [vsAI, setVsAI] = useState(initialVsAI);
  const [mobileLayout, setMobileLayout] = useState(() => {
    if (initialMobileLayout !== undefined) return initialMobileLayout;
    try {
      return JSON.parse(localStorage.getItem(MOBILE_LAYOUT_KEY) ?? "false");
    } catch {
      return false;
    }
  });
  const [mobileLarge, setMobileLarge] = useState(() => {
    if (initialMobileLarge !== undefined) return initialMobileLarge;
    try {
      return JSON.parse(localStorage.getItem(MOBILE_LARGE_KEY) ?? "false");
    } catch {
      return false;
    }
  });
  const [actionLog, setActionLog] = useState([]);

  const setMobileLayoutPersist = useCallback((value) => {
    setMobileLayout(value);
    try {
      localStorage.setItem(MOBILE_LAYOUT_KEY, JSON.stringify(value));
    } catch (_) {}
  }, []);

  const setMobileLargePersist = useCallback((value) => {
    setMobileLarge(value);
    try {
      localStorage.setItem(MOBILE_LARGE_KEY, JSON.stringify(value));
    } catch (_) {}
  }, []);

  const addLog = useCallback((text, source = "player") => {
    setActionLog((prev) => [...prev, { text, source }]);
  }, []);

  const currentPlayerId = state.currentTurn === 1 ? "player1" : "player2";
  const opponentId = state.currentTurn === 1 ? "player2" : "player1";
  const currentPlayer = state.players[currentPlayerId];
  const opponent = state.players[opponentId];

  const handleNextPhase = useCallback(() => {
    const idx = PHASES.findIndex((p) => p.id === state.currentPhase);
    if (idx < 0) return;
    if (state.currentPhase === "draw") {
      const shouldDraw = !(state.turnCount === 1 && state.currentTurn === 1);
      if (shouldDraw) {
        playDraw();
        dispatch({ type: "DRAW", playerId: currentPlayerId });
        addLog?.(`玩家 ${state.currentTurn} 抽牌`, "player");
      }
    }
    if (idx < PHASES.length - 1) {
      playPhase();
      const nextPhase = PHASES[idx + 1];
      const phaseNames = { draw: "抽牌", standby: "准备", main1: "主阶段1", battle: "战斗", main2: "主阶段2", end: "结束" };
      addLog?.(`进入${phaseNames[nextPhase.id] || nextPhase.id}阶段`, "player");
      dispatch({ type: "SET_PHASE", phase: nextPhase.id });
    }
  }, [state.currentPhase, state.turnCount, state.currentTurn, currentPlayerId, addLog]);

  const handleEndTurn = useCallback(() => {
    addLog?.(`玩家 ${state.currentTurn} 结束回合`, "player");
    dispatch({ type: "END_TURN" });
  }, [addLog, state.currentTurn]);

  useEffect(() => {
    const logs = state.pendingLogs;
    if (logs?.length) {
      logs.forEach((entry) => addLog?.(entry.text, entry.source));
      dispatch({ type: "CLEAR_PENDING_LOGS" });
    }
  }, [state.pendingLogs]);

  useEffect(() => {
    const log = state.lastBattleLog;
    if (log) {
      const atkLabel = log.attackerPlayerId === "player1" ? "玩家1" : "玩家2";
      const defLabel = log.defenderPlayerId === "player1" ? "玩家1" : "玩家2";
      if (log.isDirectAttack) {
        addLog?.(`${atkLabel} 的 ${log.attackerName} 直接攻击 ${defLabel}`, "player");
      } else {
        addLog?.(`${atkLabel} 的 ${log.attackerName} 攻击 ${defLabel} 的 ${log.defenderName}`, "player");
      }
      if (log.defenderDestroys && log.defenderName) {
        addLog?.(`${defLabel} 的 ${log.defenderName} 被战斗破坏，送入墓地`, "player");
      }
      if (log.attackerDestroys) {
        addLog?.(`${atkLabel} 的 ${log.attackerName} 被战斗破坏，送入墓地`, "player");
      }
    }
    if (state.lastDamage != null && state.lastDamageTarget) {
      playDamage();
      const target = state.lastDamageTarget === "player1" ? "玩家1" : "玩家2";
      addLog?.(`${target} 受到 ${state.lastDamage} 战斗伤害`, "player");
    }
    if (state.lastBattleLog || (state.lastDamage != null && state.lastDamageTarget)) {
      const t = setTimeout(() => dispatch({ type: "CLEAR_DAMAGE" }), state.lastBattleLog ? 2400 : 1200);
      return () => clearTimeout(t);
    }
  }, [state.lastDamage, state.lastDamageTarget, state.lastBattleLog]);

  // 抽牌阶段：自动抽牌并进入准备阶段
  useEffect(() => {
    if (state.winner || state.currentPhase !== "draw") return;
    const timer = setTimeout(() => {
      const shouldDraw = !(state.turnCount === 1 && state.currentTurn === 1);
      if (shouldDraw) {
        playDraw();
        dispatch({ type: "DRAW", playerId: currentPlayerId });
        addLog?.(`玩家 ${state.currentTurn} 抽牌`, "player");
      }
      playPhase();
      addLog?.("进入准备阶段", "player");
      dispatch({ type: "SET_PHASE", phase: "standby" });
    }, 400);
    return () => clearTimeout(timer);
  }, [state.currentPhase, state.turnCount, state.currentTurn, state.winner, currentPlayerId, addLog]);

  // 准备阶段：处理完效果后自动进入主阶段1
  useEffect(() => {
    if (state.winner || state.currentPhase !== "standby") return;
    const timer = setTimeout(() => {
      playPhase();
      addLog?.("进入主阶段1", "player");
      dispatch({ type: "SET_PHASE", phase: "main1" });
    }, 600);
    return () => clearTimeout(timer);
  }, [state.currentPhase, state.winner, addLog]);

  // AI turn
  useEffect(() => {
    if (!vsAI || state.winner || state.currentTurn !== 2) return;
    // 若有待处理的效果确认、卡组检索或栗子球选择（人类需选择），则等待
    if (state.pendingEffectConfirm || state.pendingDeckSearch || state.pendingKuribohChoice) return;
    // 若 AI 已宣言攻击、防守方是人类，则等待人类响应，不继续执行
    if (state.pendingAttack && state.pendingAttack.defenderPlayerId === "player1") return;
    const timer = setTimeout(() => {
      const action = getAIAction(state);
      // 抽牌与准备阶段由上方 useEffect 自动处理，AI 仅处理 main1/battle/main2/end
      if (action.type === "DRAW_PHASE") {
        return;
      }
      if (action.type === "SUMMON") {
        playSummon();
        dispatch({ ...action, logSource: "ai" });
      } else if (action.type === "SET_SPELL_TRAP") {
        playSet();
        dispatch(action);
      } else if (action.type === "ACTIVATE_SPELL") {
        playPhase();
        dispatch({ ...action, logSource: "ai" });
      } else if (action.type === "BATTLE") {
        addLog?.(`AI ${action.defenderZoneIndex >= 0 ? "宣言攻击" : "宣言直接攻击"}`, "ai");
        dispatch({
          type: "PREPARE_ATTACK",
          attackerPlayerId: action.attackerPlayerId,
          attackerZoneIndex: action.attackerZoneIndex,
          defenderPlayerId: action.defenderPlayerId,
          defenderZoneIndex: action.defenderZoneIndex,
        });
      } else if (action.type === "NEXT_PHASE") {
        const idx = PHASES.findIndex((p) => p.id === state.currentPhase);
        if (idx >= 0 && idx < PHASES.length - 1) {
          playPhase();
          const nextPhase = PHASES[idx + 1];
          const phaseNames = { draw: "抽牌", standby: "准备", main1: "主阶段1", battle: "战斗", main2: "主阶段2", end: "结束" };
          addLog(`AI 进入${phaseNames[nextPhase.id] || nextPhase.id}阶段`, "ai");
          dispatch({ type: "SET_PHASE", phase: nextPhase.id });
        } else if (state.currentPhase === "end") {
          addLog("AI 结束回合", "ai");
          dispatch({ type: "END_TURN" });
        }
      }
    }, 1300);
    return () => clearTimeout(timer);
  }, [vsAI, state.currentTurn, state.currentPhase, state.winner, state.turnCount, state.players, state.pendingAttack, addLog]);

  // AI 的卡组检索效果：自动决定是否发动、选择哪张卡，并记录到操作日志
  useEffect(() => {
    if (!vsAI || state.winner) return;
    const pc = state.pendingEffectConfirm;
    const pd = state.pendingDeckSearch;
    if (pc && pc.playerId === "player2") {
      const timer = setTimeout(() => {
        const shouldActivate = getAIEffectConfirmDecision(state, pc);
        if (shouldActivate) {
          playPhase();
          dispatch({ type: "EFFECT_CONFIRM_YES", logEntry: { text: `AI 发动 ${pc.sourceCardName} 的效果`, source: "ai" } });
        } else {
          dispatch({ type: "EFFECT_CONFIRM_NO", logEntry: { text: `AI 不发动 ${pc.sourceCardName} 的效果`, source: "ai" } });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    if (pd && pd.playerId === "player2") {
      const timer = setTimeout(() => {
        const instanceId = getAIDeckSearchChoice(state, pd);
        if (instanceId) {
          playPhase();
          dispatch({ type: "DECK_SEARCH_SELECT", playerId: "player2", instanceId });
        } else {
          dispatch({ type: "DECK_SEARCH_CANCEL" });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [vsAI, state.winner, state.pendingEffectConfirm, state.pendingDeckSearch, state.players, addLog, dispatch]);

  // 防守方无可 responding 选项（无陷阱、无010）时，自动允许攻击
  useEffect(() => {
    if (state.winner || !state.pendingAttack) return;
    const traps = getActivatableTrapsOnAttackDeclared(state);
    const defHand = state.players[state.pendingAttack.defenderPlayerId]?.hand || [];
    const has010 = defHand.some((c) => String(c?.id) === "010");
    if (traps.length > 0 || has010) return;
    const timer = setTimeout(() => {
      playAttack();
      addLog?.(state.pendingAttack.defenderZoneIndex >= 0 ? "攻击成立" : "直接攻击成立", "player");
      dispatch({ type: "BATTLE", ...state.pendingAttack });
    }, vsAI && state.pendingAttack.defenderPlayerId === "player1" ? 400 : 600);
    return () => clearTimeout(timer);
  }, [state.pendingAttack, state.winner, state.players, vsAI, addLog]);

  // AI 作为防守方时，回应攻击宣言（允许/羽翼栗子球/陷阱）
  useEffect(() => {
    if (!vsAI || state.winner || !state.pendingAttack) return;
    if (state.pendingAttack.defenderPlayerId !== "player2") return;
    const timer = setTimeout(() => {
      const defHand = state.players.player2?.hand ?? [];
      const idx010 = defHand.findIndex((c) => String(c?.id) === "010");
      const activatableTraps = getActivatableTrapsOnAttackDeclared(state);
      if (activatableTraps.length > 0) {
        playPhase();
        addLog?.("AI 发动陷阱卡", "ai");
        const t = activatableTraps[0];
        dispatch({
          type: "ACTIVATE_SPELL_FROM_FIELD",
          playerId: t.playerId,
          zoneIndex: t.zoneIndex,
          logSource: "ai",
        });
      } else if (idx010 >= 0) {
        addLog?.("AI 丢弃羽翼栗子球，攻击无效", "ai");
        dispatch({ type: "NEGATE_ATTACK", defenderPlayerId: "player2", handIndex: idx010 });
      } else {
        playAttack();
        addLog?.("攻击成立", "player");
        dispatch({ type: "BATTLE", ...state.pendingAttack });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [vsAI, state.pendingAttack, state.winner, state.players, addLog]);

  if (state.winner) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">
            {state.winner === "player1" ? (vsAI ? "你" : "玩家 1") : vsAI ? "AI" : "玩家 2"} 获胜！
          </h1>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              className="px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400"
              onClick={() => dispatch({ type: "RESET" })}
            >
              再玩一局
            </button>
            {onBackToMenu && (
              <button
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500"
                onClick={onBackToMenu}
              >
                返回主菜单
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-slate-900 flex flex-col relative overflow-hidden ${mobileLayout ? "game-mobile" : "p-1"}`}>
      {state.lastDamage && state.lastDamageTarget && (
        <DamageDisplay amount={state.lastDamage} damageTargetPlayerId={state.lastDamageTarget} />
      )}
      {mobileLayout ? (
        <div className="shrink-0 flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-slate-800/95 border-b border-slate-700 z-10">
          {onBackToMenu && (
            <button
              className="px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 text-xs"
              onClick={onBackToMenu}
            >
              退出
            </button>
          )}
          <PhaseIndicator
            currentPhase={state.currentPhase}
            onNextPhase={vsAI && state.currentTurn === 2 ? undefined : handleNextPhase}
            isMyTurn={state.currentTurn === 1}
            compact={true}
          />
          <span className="text-slate-400 text-xs shrink-0">
            {state.turnCount}回 · {state.currentTurn === 1 ? "你" : vsAI ? "AI" : "P2"}
          </span>
          {(!vsAI || state.currentTurn === 1) && (
            <button
              className="px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 text-xs shrink-0"
              onClick={handleEndTurn}
            >
              结束
            </button>
          )}
          <label className="flex items-center gap-1 text-slate-400 cursor-pointer text-xs ml-auto">
            <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} className="rounded" />
            <span>AI</span>
          </label>
          <label className="flex items-center gap-1 text-slate-400 cursor-pointer text-xs">
            <input type="checkbox" checked={mobileLayout} onChange={(e) => setMobileLayoutPersist(e.target.checked)} className="rounded" />
            <span>竖屏</span>
          </label>
          {mobileLayout && (
            <label className="flex items-center gap-1 text-slate-400 cursor-pointer text-xs">
              <input type="checkbox" checked={mobileLarge} onChange={(e) => setMobileLargePersist(e.target.checked)} className="rounded" />
              <span>大号</span>
            </label>
          )}
        </div>
      ) : (
        <>
          {onBackToMenu && (
            <button
              className="absolute left-2 top-2 z-10 px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
              onClick={onBackToMenu}
            >
              退出到主菜单
            </button>
          )}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            <PhaseIndicator
              currentPhase={state.currentPhase}
              onNextPhase={vsAI && state.currentTurn === 2 ? undefined : handleNextPhase}
              isMyTurn={state.currentTurn === 1}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-sm">
                回合 {state.turnCount} - {state.currentTurn === 1 ? "玩家 1" : vsAI ? "AI" : "玩家 2"} 的回合
              </span>
              {(!vsAI || state.currentTurn === 1) && (
                <button
                  className="px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm shrink-0"
                  onClick={handleEndTurn}
                >
                  结束回合
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer text-sm">
              <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} className="rounded" />
              <span>对战 AI</span>
            </label>
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer text-sm">
              <input type="checkbox" checked={mobileLayout} onChange={(e) => setMobileLayoutPersist(e.target.checked)} className="rounded" />
              <span>适配移动端</span>
            </label>
          </div>
        </>
      )}

      <ActionLog entries={actionLog} mobileLayout={mobileLayout} mobileLarge={mobileLarge} />
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${!mobileLayout ? "ml-36" : ""}`}>
        <GameBoardInner
          state={state}
          dispatch={dispatch}
          currentPlayerId={currentPlayerId}
          opponentId={opponentId}
          vsAI={vsAI}
          mobileLayout={mobileLayout}
          mobileLarge={mobileLarge}
          addLog={addLog}
        />
      </div>
    </div>
  );
}

function GameBoardInner({
  state,
  dispatch,
  currentPlayerId,
  opponentId,
  vsAI,
  mobileLayout = false,
  mobileLarge = false,
  addLog,
}) {
  const [selectedHandCard, setSelectedHandCard] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);
  const [graveyardViewing, setGraveyardViewing] = useState(null);
  const [selectedMonsterZone, setSelectedMonsterZone] = useState(null);
  const [selectedSpellTrapZone, setSelectedSpellTrapZone] = useState(null);
  const [attackMode, setAttackMode] = useState(false);
  const [attackingZone, setAttackingZone] = useState(null);
  const [tributeIndices, setTributeIndices] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [pendingSpellTarget, setPendingSpellTarget] = useState(null);
  const [pendingSpecialSummonZone, setPendingSpecialSummonZone] = useState(null);
  const [pendingPrematureBurialZone, setPendingPrematureBurialZone] = useState(null);
  const [pendingLightSwordZone, setPendingLightSwordZone] = useState(null);
  const [pendingDiscardSelect, setPendingDiscardSelect] = useState(null);
  const [pendingSummon, setPendingSummon] = useState(null);
  const [tributeConfirmed, setTributeConfirmed] = useState(false);
  const [positionChangeZone, setPositionChangeZone] = useState(null);

  // 攻击结算后（BATTLE 或 auto-allow/AI 流程）pendingAttack 从有值变为 null 时，清除攻击模式
  const prevPendingAttackRef = useRef(state.pendingAttack);
  useEffect(() => {
    const hadPending = prevPendingAttackRef.current != null;
    const nowNull = state.pendingAttack == null;
    prevPendingAttackRef.current = state.pendingAttack;
    if (hadPending && nowNull && (attackMode || attackingZone !== null)) {
      setAttackMode(false);
      setAttackingZone(null);
    }
  }, [state.pendingAttack, attackMode, attackingZone]);

  const currentPlayer = state.players[currentPlayerId];
  const opponent = state.players[opponentId];

  // vs AI 时固定视角：上方始终为 AI (player2)，下方始终为玩家 (player1)
  const topPlayerId = vsAI ? "player2" : opponentId;
  const bottomPlayerId = vsAI ? "player1" : currentPlayerId;
  const topPlayer = state.players[topPlayerId];
  const bottomPlayer = state.players[bottomPlayerId];
  const isBottomActive = currentPlayerId === bottomPlayerId;

  const playableMonsters = state.currentPhase === "main1" || state.currentPhase === "main2"
    ? currentPlayer.hand.filter((c) => c.type === "monster" && canNormalSummon(state, currentPlayerId, c))
    : [];
  const inMainPhase = state.currentPhase === "main1" || state.currentPhase === "main2";
  const inBattlePhase = state.currentPhase === "battle";
  const playableSpells = inMainPhase
    ? currentPlayer.hand.filter((c) => c.type === "spell" || c.type === "trap")
    : inBattlePhase
      ? currentPlayer.hand.filter((c) => c.type === "spell" && c.spellType === "quickplay")
      : [];

  const emptyMonsterIndex = getEmptyMonsterZoneIndex(currentPlayer);
  const emptySpellIndex = getEmptySpellTrapZoneIndex(currentPlayer);

  const tributeCount = selectedHandCard?.type === "monster" ? getTributeCount(selectedHandCard.level) : 0;
  const tributeZoneChoice = tributeCount > 0 && tributeIndices.length === tributeCount;
  const emptyZoneIndices = currentPlayer.monsterZones.map((z, i) => (z === null ? i : -1)).filter((i) => i >= 0);
  const canShowSummonForm =
    selectedHandCard?.type === "monster" &&
    (tributeCount === 0 ? emptyZoneIndices.length > 0 : tributeIndices.length === tributeCount && tributeConfirmed) &&
    !pendingSummon;
  const casterEmptyZones = pendingSpecialSummonZone
    ? (state.players[pendingSpecialSummonZone.casterPlayerId]?.monsterZones ?? [])
        .map((z, i) => (z === null ? i : -1))
        .filter((i) => i >= 0)
    : [];
  const summonTargetZones =
    pendingSpecialSummonZone && bottomPlayerId === pendingSpecialSummonZone.casterPlayerId
      ? casterEmptyZones
      : pendingSummon?.position != null
        ? pendingSummon.tributeIndices?.length
          ? [...new Set([...emptyZoneIndices, ...pendingSummon.tributeIndices])]
          : emptyZoneIndices
        : selectedHandCard?.type === "monster"
          ? tributeCount === 0
            ? emptyZoneIndices
            : tributeZoneChoice
              ? tributeIndices
              : null
          : null;

  const handleHandCardClick = (card) => {
    if (attackMode) return;
    if (card.type === "monster" && canNormalSummon(state, currentPlayerId, card)) {
      const count = getTributeCount(card.level);
      if (count > 0) {
        setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
        setTributeIndices([]);
        setTributeConfirmed(false);
      } else {
        setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
      }
    } else if (card.type === "spell" || card.type === "trap") {
      setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
    }
  };

  const handleSpellTrapZoneClick = (index) => {
    if (attackMode) return;
    if (pendingPrematureBurialZone && bottomPlayerId === pendingPrematureBurialZone.casterPlayerId && bottomPlayer.spellTrapZones[index] === null) {
      const pp = pendingPrematureBurialZone;
      playPhase();
      addLog?.(pp.fromField ? `发动盖牌 ${pp.spellCard.name}` : `发动魔法 ${pp.spellCard.name}`, "player");
      const target = { ...pp.target, spellZoneIndex: index };
      if (pp.fromField) {
        dispatch({
          type: "ACTIVATE_SPELL_FROM_FIELD",
          playerId: pp.casterPlayerId,
          zoneIndex: pp.zoneIndex,
          target,
        });
      } else {
        dispatch({
          type: "ACTIVATE_SPELL",
          playerId: pp.casterPlayerId,
          card: pp.spellCard,
          target,
        });
        setSelectedHandCard(null);
      }
      setPendingPrematureBurialZone(null);
      return;
    }
    if (pendingLightSwordZone && bottomPlayerId === pendingLightSwordZone.casterPlayerId && bottomPlayer.spellTrapZones[index] === null) {
      playPhase();
      addLog?.(`发动魔法 ${pendingLightSwordZone.card.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL",
        playerId: pendingLightSwordZone.casterPlayerId,
        card: pendingLightSwordZone.card,
        target: { spellZoneIndex: index },
      });
      setSelectedHandCard(null);
      setPendingLightSwordZone(null);
      return;
    }
    if (pendingSpellTarget?.targetType === "spellTrap" && bottomPlayer.spellTrapZones[index]) {
      handleSpellTargetSelected({ type: "spellTrap", playerId: bottomPlayerId, zoneIndex: index });
      return;
    }
    const zone = bottomPlayer.spellTrapZones[index];
    if (zone) {
      setViewingCard({ card: zone, zoneIndex: index, playerId: bottomPlayerId });
      setSelectedSpellTrapZone(selectedSpellTrapZone === index ? null : index);
      return;
    }
    setSelectedSpellTrapZone(null);
    // 处于发动流程中的卡（如心变选择对象时）不可盖放；仅在自己回合可盖放
    const cardInActivation = pendingSpellTarget?.card?.instanceId || pendingDiscardSelect?.card?.instanceId || pendingLightSwordZone?.card?.instanceId || pendingPrematureBurialZone?.spellCard?.instanceId;
    if (isBottomActive && selectedHandCard && (selectedHandCard.type === "spell" || selectedHandCard.type === "trap") && selectedHandCard.instanceId !== cardInActivation) {
      playSet();
      addLog?.(`盖放 ${selectedHandCard.name}`, "player");
      dispatch({
        type: "SET_SPELL_TRAP",
        playerId: currentPlayerId,
        card: selectedHandCard,
        zoneIndex: index,
        faceDown: true,
      });
      setSelectedHandCard(null);
    }
    setSelectedSpellTrapZone(null);
  };

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.setData("application/json", JSON.stringify({ instanceId: card.instanceId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => setDraggedCard(null);

  const handleMonsterZoneDrop = (e, zoneIndex) => {
    e.preventDefault();
    if (!draggedCard || attackMode) return;
    if (draggedCard.type === "monster" && canNormalSummon(state, currentPlayerId, draggedCard)) {
      if (getTributeCount(draggedCard.level) === 0 && currentPlayer.monsterZones[zoneIndex] === null) {
        setPendingSummon({ card: draggedCard, zoneIndex, tributeIndices: null });
      }
    }
    setDraggedCard(null);
  };

  const handleSpellTrapZoneDrop = (e, zoneIndex) => {
    e.preventDefault();
    if (!draggedCard || currentPlayer.spellTrapZones[zoneIndex]) return;
    const cardInActivation = pendingSpellTarget?.card?.instanceId || pendingDiscardSelect?.card?.instanceId || pendingLightSwordZone?.card?.instanceId || pendingPrematureBurialZone?.spellCard?.instanceId;
    if ((draggedCard.type === "spell" || draggedCard.type === "trap") && draggedCard.instanceId !== cardInActivation) {
      playSet();
      addLog?.(`盖放 ${draggedCard.name}`, "player");
      dispatch({
        type: "SET_SPELL_TRAP",
        playerId: currentPlayerId,
        card: draggedCard,
        zoneIndex,
        faceDown: true,
      });
    }
    setDraggedCard(null);
  };

  const handleActivateSpell = () => {
    if (selectedHandCard && selectedHandCard.type === "spell" && hasSpellEffect(selectedHandCard)) {
      if (needsZoneForPlacement(selectedHandCard)) {
        addLog?.(`发动 ${selectedHandCard.name}，请选择魔陷格放置`, "player");
        setPendingLightSwordZone({ card: selectedHandCard, casterPlayerId: currentPlayerId });
        return;
      }
      if (needsDiscard(selectedHandCard)) {
        const hand = state.players[currentPlayerId]?.hand ?? [];
        const handWithoutSpell = hand.filter((c) => c.instanceId !== selectedHandCard.instanceId);
        if (handWithoutSpell.length === 0) return;
        addLog?.(`发动 ${selectedHandCard.name}，请选择要舍弃的手牌`, "player");
        setPendingDiscardSelect({ card: selectedHandCard, fromField: false, casterPlayerId: currentPlayerId });
        return;
      }
      if (needsTarget(selectedHandCard)) {
        addLog?.(`发动 ${selectedHandCard.name}，请选择对象`, "player");
        setPendingSpecialSummonZone(null); // 清除可能残留的 102/110 选格状态，避免心变后误触
        setPendingSpellTarget({
          card: selectedHandCard,
          fromField: false,
          casterPlayerId: currentPlayerId,
          targetType: getSpellTargetType(selectedHandCard),
        });
        return;
      }
      addLog?.(`发动魔法 ${selectedHandCard.name}`, "player");
      dispatch({ type: "ACTIVATE_SPELL", playerId: currentPlayerId, card: selectedHandCard });
      setSelectedHandCard(null);
    }
  };

  const handleSpellTargetSelected = (target) => {
    const pending = pendingSpellTarget;
    if (!pending) return;
    const label = (pid) => (pid === "player1" ? "玩家1" : "玩家2");
    if (target.type === "graveyard") {
      const ownerLabel = label(target.playerId);
      addLog?.(`选择 ${ownerLabel} 墓地的 ${target.cardName || "怪兽"}`, "player");
      if (String(pending.card?.id) === "102" || String(pending.card?.id) === "110") {
        setPendingSpecialSummonZone({
          spellCard: pending.card,
          target: { type: "graveyard", playerId: target.playerId, instanceId: target.instanceId, cardName: target.cardName },
          fromField: pending.fromField,
          casterPlayerId: pending.casterPlayerId,
          zoneIndex: pending.zoneIndex,
          position: undefined,
        });
        setPendingSpellTarget(null);
        setViewingCard(null);
        return;
      }
    } else if (target.type === "spellTrap") {
      addLog?.(`选择 ${label(target.playerId)} 场上的魔法·陷阱`, "player");
    } else if (target.type === "monster") {
      addLog?.(`选择 ${label(target.playerId)} 场上的 ${target.monsterName || "怪兽"}`, "player");
    }
    playPhase();
    if (pending.fromField) {
      addLog?.(`发动盖牌 ${pending.card.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL_FROM_FIELD",
        playerId: pending.casterPlayerId,
        zoneIndex: pending.zoneIndex,
        target: { type: target.type, playerId: target.playerId, zoneIndex: target.zoneIndex, instanceId: target.instanceId },
      });
    } else {
      addLog?.(`发动魔法 ${pending.card.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL",
        playerId: pending.casterPlayerId,
        card: pending.card,
        target: { type: target.type, playerId: target.playerId, zoneIndex: target.zoneIndex, instanceId: target.instanceId },
      });
      setSelectedHandCard(null);
    }
    setPendingSpellTarget(null);
    setViewingCard(null);
  };

  const handleSpecialSummonPositionSelected = (position) => {
    const p = pendingSpecialSummonZone;
    if (!p) return;
    setPendingSpecialSummonZone({ ...p, position });
  };

  const handleSpecialSummonZoneSelected = (zoneIndex) => {
    const p = pendingSpecialSummonZone;
    if (!p || !casterEmptyZones.includes(zoneIndex)) return;
    if (p.position == null) return;
    const target = { ...p.target, zoneIndex, position: p.position };
    if (String(p.spellCard?.id) === "110") {
      setPendingSpecialSummonZone(null);
      setPendingPrematureBurialZone({
        spellCard: p.spellCard,
        target,
        casterPlayerId: p.casterPlayerId,
        fromField: p.fromField,
        zoneIndex: p.zoneIndex,
      });
      setViewingCard(null);
      return;
    }
    playPhase();
    if (p.fromField) {
      addLog?.(`发动盖牌 ${p.spellCard.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL_FROM_FIELD",
        playerId: p.casterPlayerId,
        zoneIndex: p.zoneIndex,
        target,
      });
    } else {
      addLog?.(`发动魔法 ${p.spellCard.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL",
        playerId: p.casterPlayerId,
        card: p.spellCard,
        target,
      });
      setSelectedHandCard(null);
    }
    setPendingSpecialSummonZone(null);
    setViewingCard(null);
  };

  const handleMonsterZoneClick = (index) => {
    if (attackMode) return;
    if (pendingSpecialSummonZone && bottomPlayerId === pendingSpecialSummonZone.casterPlayerId && casterEmptyZones.includes(index)) {
      handleSpecialSummonZoneSelected(index);
      return;
    }
    if (pendingSummon?.position != null && summonTargetZones?.includes(index)) {
      playSummon();
      dispatch({
        type: "SUMMON",
        playerId: currentPlayerId,
        card: pendingSummon.card,
        zoneIndex: index,
        tributeIndices: pendingSummon.tributeIndices ?? undefined,
        position: pendingSummon.position,
        faceDown: pendingSummon.faceDown,
      });
      setSelectedHandCard(null);
      setTributeIndices([]);
      setPendingSummon(null);
      setTributeConfirmed(false);
      return;
    }
    const monster = currentPlayer.monsterZones[index];
    const turnCount = state.turnCount ?? 1;
    const faceDownSetThisTurn = monster?.faceDown && (monster?.setOnTurn ?? 0) >= turnCount;
    const canChangePosition =
      (state.currentPhase === "main1" || state.currentPhase === "main2") &&
      !selectedHandCard &&
      !pendingSummon &&
      monster &&
      !faceDownSetThisTurn &&
      !(state.changedPositionThisTurn?.[currentPlayerId] ?? []).includes(index);
    if (canChangePosition) {
      setPositionChangeZone(index);
      return;
    }
    if (tributeCount > 0 && selectedHandCard?.type === "monster" && !pendingSummon) {
      const zone = currentPlayer.monsterZones[index];
      if (zone) {
        const newTributes = tributeIndices.includes(index)
          ? tributeIndices.filter((i) => i !== index)
          : [...tributeIndices, index].slice(0, tributeCount);
        setTributeIndices(newTributes);
      }
      return;
    }
    if (state.currentPhase === "battle") {
      const blockedByLightSword = state.lightSwordActive === currentPlayerId;
      const monster = currentPlayer.monsterZones[index];
      const hasAttacked = state.attackedMonsters?.[currentPlayerId]?.includes(index);
      if (!blockedByLightSword && monster && monster.position === "attack" && !hasAttacked) {
        setAttackMode(true);
        setAttackingZone(index);
      }
    }
  };

  const confirmSummonPosition = (position, faceDown) => {
    const card = pendingSummon?.card ?? selectedHandCard;
    const tributes = pendingSummon?.tributeIndices ?? (tributeCount > 0 ? tributeIndices : null);
    if (!card) return;
    if (pendingSummon?.zoneIndex != null) {
      playSummon();
      dispatch({
        type: "SUMMON",
        playerId: currentPlayerId,
        card,
        zoneIndex: pendingSummon.zoneIndex,
        tributeIndices: tributes ?? undefined,
        position,
        faceDown,
      });
      setSelectedHandCard(null);
      setTributeIndices([]);
      setPendingSummon(null);
      setTributeConfirmed(false);
    } else {
      setPendingSummon({ card, tributeIndices: tributes, position, faceDown });
    }
  };

  const handleOpponentMonsterZoneClick = (index) => {
    if (pendingSpellTarget?.targetType === "opponentMonster") {
      const m = topPlayer.monsterZones[index];
      if (m) {
        handleSpellTargetSelected({
          type: "monster",
          playerId: topPlayerId,
          zoneIndex: index,
          instanceId: m.instanceId,
          monsterName: m.name,
        });
      }
      return;
    }
    if (state.lightSwordActive === currentPlayerId) return;
    if (attackMode && attackingZone !== null) {
      const myMonster = currentPlayer.monsterZones[attackingZone];
      const oppMonster = topPlayer.monsterZones[index];
      if (myMonster && myMonster.position === "attack") {
        const def = topPlayer.monsterZones[index];
        addLog?.(def ? `${myMonster.name} 宣言攻击 ${def.name}` : `${myMonster.name} 宣言攻击`, "player");
        dispatch({
          type: "PREPARE_ATTACK",
          attackerPlayerId: currentPlayerId,
          attackerZoneIndex: attackingZone,
          defenderPlayerId: topPlayerId,
          defenderZoneIndex: index,
        });
      }
    }
  };

  const handleViewDetails = (card) => setViewingCard(card);
  const handleGraveyardClick = (playerId) => setGraveyardViewing(playerId);

  const directAttack = () => {
    if (state.lightSwordActive === currentPlayerId) return;
    if (attackMode && attackingZone !== null) {
      const hasAnyMonsters = topPlayer.monsterZones.some((m) => m !== null);
      if (!hasAnyMonsters) {
        const myMonster = currentPlayer.monsterZones[attackingZone];
        addLog?.(`${myMonster?.name} 宣言直接攻击`, "player");
        dispatch({
          type: "PREPARE_ATTACK",
          attackerPlayerId: currentPlayerId,
          attackerZoneIndex: attackingZone,
          defenderPlayerId: topPlayerId,
          defenderZoneIndex: -1,
        });
      }
    }
  };

  const confirmAttack = () => {
    if (!state.pendingAttack) return;
    playAttack();
    addLog?.(state.pendingAttack.defenderZoneIndex >= 0 ? "攻击成立" : "直接攻击成立", "player");
    dispatch({
      type: "BATTLE",
      ...state.pendingAttack,
    });
    setAttackMode(false);
    setAttackingZone(null);
  };

  const negateAttackWith010 = (handIndex) => {
    if (!state.pendingAttack) return;
    const defId = state.pendingAttack.defenderPlayerId;
    dispatch({ type: "NEGATE_ATTACK", defenderPlayerId: defId, handIndex });
    setAttackMode(false);
    setAttackingZone(null);
  };

  const cancelPendingAttack = () => {
    dispatch({ type: "CLEAR_PENDING_ATTACK" });
    setAttackMode(false);
    setAttackingZone(null);
  };

  const activateTrapDuringAttack = (playerId, zoneIndex) => {
    if (!state.pendingAttack) return;
    playPhase();
    addLog?.(`发动陷阱卡`, "player");
    dispatch({
      type: "ACTIVATE_SPELL_FROM_FIELD",
      playerId,
      zoneIndex,
      logSource: playerId === "player1" ? "player" : "ai",
    });
    setAttackMode(false);
    setAttackingZone(null);
  };

  const confirmPositionChange = (newPosition) => {
    if (positionChangeZone == null) return;
    dispatch({
      type: "CHANGE_POSITION",
      playerId: currentPlayerId,
      zoneIndex: positionChangeZone,
      newPosition,
    });
    setPositionChangeZone(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden relative">
      {viewingCard && (
      <div
        className="fixed right-4 bottom-72 z-30 max-h-[45vh] flex flex-col items-end pointer-events-auto"
      >
        <CardDetailPanel
          card={viewingCard}
          equippedMonsterName={
            viewingCard?.playerId && viewingCard?.card?.equippedToMonsterZoneIndex != null
              ? state.players[viewingCard.playerId]?.monsterZones[viewingCard.card.equippedToMonsterZoneIndex]?.name
              : null
          }
          onClear={viewingCard ? () => { setViewingCard(null); setSelectedSpellTrapZone(null); } : undefined}
          canActivate={
            viewingCard &&
            viewingCard.zoneIndex !== undefined &&
            viewingCard.playerId === bottomPlayerId &&
            (viewingCard.card?.type === "trap" || viewingCard.card?.type === "spell") &&
            canActivateFromField(viewingCard.card) &&
            canActivateFromFieldInPhase(viewingCard.card, state.currentPhase, viewingCard.playerId === currentPlayerId) &&
            !(viewingCard.card?.type === "trap" && viewingCard.card?.faceDown && (viewingCard.card?.setOnTurn ?? 0) >= (state.turnCount ?? 1)) &&
            !(viewingCard.card?.equippedToMonsterZoneIndex != null)
          }
          onActivate={() => {
            if (viewingCard?.zoneIndex !== undefined && viewingCard?.playerId === bottomPlayerId) {
              const card = viewingCard.card;
              if (needsDiscard(card)) {
                const hand = state.players[currentPlayerId]?.hand ?? [];
                if (hand.length === 0) return;
                addLog?.(`发动盖牌 ${card.name}，请选择要舍弃的手牌`, "player");
                setPendingDiscardSelect({
                  card,
                  fromField: true,
                  casterPlayerId: viewingCard.playerId,
                  zoneIndex: viewingCard.zoneIndex,
                });
                return;
              }
              if (needsTarget(card)) {
                addLog?.(`发动盖牌 ${card.name}，请选择对象`, "player");
                setPendingSpecialSummonZone(null);
                setPendingSpellTarget({
                  card,
                  fromField: true,
                  casterPlayerId: viewingCard.playerId,
                  zoneIndex: viewingCard.zoneIndex,
                  targetType: getSpellTargetType(card),
                });
                return;
              }
              playPhase();
              addLog?.(`发动盖牌 ${card.name}`, "player");
              dispatch({
                type: "ACTIVATE_SPELL_FROM_FIELD",
                playerId: viewingCard.playerId,
                zoneIndex: viewingCard.zoneIndex,
              });
              setViewingCard(null);
            }
          }}
        />
      </div>
      )}
      {state.pendingEffectConfirm && !state.pendingDeckSearch && !(vsAI && state.pendingEffectConfirm.playerId === "player2") && (
        <EffectConfirmModal
          cardName={state.pendingEffectConfirm.sourceCardName}
          onConfirm={() => {
            playPhase();
            dispatch({ type: "EFFECT_CONFIRM_YES" });
          }}
          onDecline={() => dispatch({ type: "EFFECT_CONFIRM_NO" })}
        />
      )}
      {state.pendingDeckSearch && !(vsAI && state.pendingDeckSearch.playerId === "player2") && (() => {
        const qualifying = getDeckSearchQualifyingCards(state, state.pendingDeckSearch.playerId, state.pendingDeckSearch.filterType);
        if (qualifying.length === 0) return null;
        return (
        <DeckSearchModal
          playerId={state.pendingDeckSearch.playerId}
          cards={qualifying}
          title={`${state.pendingDeckSearch.sourceCardName} 效果：选择1张卡加入手牌`}
          onSelect={(card) => {
            playPhase();
            dispatch({ type: "DECK_SEARCH_SELECT", playerId: state.pendingDeckSearch.playerId, instanceId: card.instanceId });
          }}
          onClose={() => dispatch({ type: "DECK_SEARCH_CANCEL" })}
          isOptional={state.pendingDeckSearch.filterType === "002"}
        />
        );
      })()}
      {graveyardViewing && !pendingSpellTarget && !state.pendingDeckSearch && (
        <GraveyardModal
          cards={state.players[graveyardViewing]?.graveyard}
          label={graveyardViewing === "player1" ? "玩家 1" : "玩家 2"}
          onClose={() => setGraveyardViewing(null)}
          onViewCard={(card) => setViewingCard(card)}
        />
      )}
      {pendingDiscardSelect && (
        <HandSelectModal
          hand={
            (() => {
              const pid = pendingDiscardSelect.casterPlayerId;
              const hand = state.players[pid]?.hand ?? [];
              return pendingDiscardSelect.fromField
                ? hand
                : hand.filter((c) => c.instanceId !== pendingDiscardSelect.card?.instanceId);
            })()
          }
          title={`选择要舍弃的手牌（${pendingDiscardSelect.card?.name}）`}
          onSelect={(card) => {
            const p = pendingDiscardSelect;
            playPhase();
            addLog?.(p.fromField ? `发动盖牌 ${p.card.name}` : `发动魔法 ${p.card.name}`, "player");
            if (p.fromField) {
              dispatch({
                type: "ACTIVATE_SPELL_FROM_FIELD",
                playerId: p.casterPlayerId,
                zoneIndex: p.zoneIndex,
                target: { discardInstanceId: card.instanceId },
              });
            } else {
              dispatch({
                type: "ACTIVATE_SPELL",
                playerId: p.casterPlayerId,
                card: p.card,
                target: { discardInstanceId: card.instanceId },
              });
              setSelectedHandCard(null);
            }
            setPendingDiscardSelect(null);
            setViewingCard(null);
          }}
          onClose={() => {
            setPendingDiscardSelect(null);
            if (pendingDiscardSelect && !pendingDiscardSelect.fromField) setSelectedHandCard(null);
            setViewingCard(null);
          }}
        />
      )}
      {pendingSpellTarget?.targetType === "graveyard" && (
        <GraveyardSelectModal
          title={`选择目标（${pendingSpellTarget.card?.name}）`}
          graves={
            pendingSpellTarget.card?.id === "102"
              ? [
                  { playerId: "player1", label: "玩家1", cards: state.players.player1?.graveyard },
                  { playerId: "player2", label: "玩家2", cards: state.players.player2?.graveyard },
                ]
              : [
                  {
                    playerId: pendingSpellTarget.casterPlayerId,
                    label: pendingSpellTarget.casterPlayerId === "player1" ? "玩家1" : "玩家2",
                    cards: state.players[pendingSpellTarget.casterPlayerId]?.graveyard,
                  },
                ]
          }
          onSelect={(card, playerId) =>
            handleSpellTargetSelected({ type: "graveyard", playerId, instanceId: card.instanceId, cardName: card.name })
          }
          onClose={() => {
            setPendingSpellTarget(null);
            if (pendingSpellTarget && !pendingSpellTarget.fromField) setSelectedHandCard(null);
            setViewingCard(null);
          }}
        />
      )}
      <div className="relative flex-1 flex flex-col gap-0.5 min-h-0 overflow-hidden">
        <div className={`absolute top-0 right-0 z-10 flex flex-col gap-0.5 items-end ${mobileLayout ? "px-1" : "right-4 gap-1"}`}>
          <div
            className={`bg-slate-800 rounded-lg ${mobileLayout ? "px-2 py-1" : "px-4 py-2"} ${
              attackMode && attackingZone !== null && isBottomActive && !topPlayer.monsterZones.some((m) => m !== null)
                ? "cursor-pointer hover:bg-slate-700 ring-2 ring-amber-500"
                : ""
            }`}
            onClick={
              attackMode && attackingZone !== null && isBottomActive && !topPlayer.monsterZones.some((m) => m !== null)
                ? directAttack
                : undefined
            }
          >
            <span className={`font-bold text-amber-400 ${mobileLayout ? (mobileLarge ? "text-base" : "text-xs") : ""}`}>{topPlayerId === "player2" && vsAI ? "AI" : topPlayerId === "player1" ? "玩家 1" : "玩家 2"}</span>
            <span className={`ml-1 font-bold text-red-500 ${mobileLayout ? (mobileLarge ? "text-xl" : "text-base") : "ml-2 text-xl"}`}>{topPlayer.lp}</span>
          </div>
          <DeckGraveyardRow player={topPlayer} onGraveyardClick={() => handleGraveyardClick(topPlayerId)} compact={mobileLayout} mobileLarge={mobileLarge} />
        </div>

        <PlayerArea
          player={topPlayer}
          isOpponent={true}
          mobileLayout={mobileLayout}
          mobileLarge={mobileLarge}
          monsterZones={topPlayer.monsterZones}
          spellTrapZones={topPlayer.spellTrapZones}
          hand={topPlayer.hand}
          onMonsterZoneClick={handleOpponentMonsterZoneClick}
          onSpellTrapZoneClick={
            pendingSpellTarget?.targetType === "spellTrap"
              ? (idx) => {
                  if (topPlayer.spellTrapZones[idx]) handleSpellTargetSelected({ type: "spellTrap", playerId: topPlayerId, zoneIndex: idx });
                }
              : undefined
          }
          onViewDetails={handleViewDetails}
          onGraveyardClick={() => handleGraveyardClick(topPlayerId)}
          onDirectAttackClick={
            attackMode &&
            attackingZone !== null &&
            isBottomActive &&
            !topPlayer.monsterZones.some((m) => m !== null)
              ? directAttack
              : undefined
          }
        />

        <PlayerArea
        player={bottomPlayer}
        isOpponent={false}
        mobileLayout={mobileLayout}
        mobileLarge={mobileLarge}
        monsterZones={bottomPlayer.monsterZones}
        spellTrapZones={bottomPlayer.spellTrapZones}
        hand={bottomPlayer.hand}
        onMonsterZoneClick={isBottomActive ? handleMonsterZoneClick : undefined}
        onSpellTrapZoneClick={handleSpellTrapZoneClick}
        onHandCardClick={isBottomActive ? handleHandCardClick : undefined}
        onViewDetails={handleViewDetails}
        onGraveyardClick={() => handleGraveyardClick(bottomPlayerId)}
        selectedMonsterZone={isBottomActive ? selectedMonsterZone : null}
        selectedSpellTrapZone={isBottomActive ? selectedSpellTrapZone : null}
        spellTrapHighlightIndices={
          (pendingLightSwordZone && bottomPlayerId === pendingLightSwordZone.casterPlayerId) || (pendingPrematureBurialZone && bottomPlayerId === pendingPrematureBurialZone.casterPlayerId)
            ? (state.players[(pendingLightSwordZone || pendingPrematureBurialZone).casterPlayerId]?.spellTrapZones ?? [])
                .map((z, i) => (z === null ? i : -1))
                .filter((i) => i >= 0)
            : null
        }
        equipHighlightZoneIndex={
          isBottomActive && selectedSpellTrapZone != null
            ? bottomPlayer.spellTrapZones[selectedSpellTrapZone]?.equippedToMonsterZoneIndex ?? null
            : null
        }
        selectedHandCard={isBottomActive ? selectedHandCard : null}
        playableHandCards={isBottomActive ? [...playableMonsters, ...playableSpells] : []}
        tributeIndices={isBottomActive ? tributeIndices : []}
        summonTargetZones={isBottomActive ? summonTargetZones : null}
        onDragStart={isBottomActive ? handleDragStart : undefined}
        onMonsterZoneDrop={isBottomActive ? handleMonsterZoneDrop : undefined}
        onSpellTrapZoneDrop={isBottomActive ? handleSpellTrapZoneDrop : undefined}
      />

        <div className={`absolute z-10 flex flex-col items-start ${mobileLayout ? (mobileLarge ? "bottom-40 left-0 px-1 gap-0.5" : "bottom-24 left-0 px-1 gap-0.5") : "bottom-0 left-4 gap-1"}`}>
          <DeckGraveyardRow player={bottomPlayer} onGraveyardClick={() => handleGraveyardClick(bottomPlayerId)} compact={mobileLayout} mobileLarge={mobileLarge} />
          <div className={`bg-slate-800 rounded-lg ${mobileLayout ? "px-2 py-1" : "px-4 py-2"}`}>
            <span className={`font-bold text-amber-400 ${mobileLayout ? (mobileLarge ? "text-base" : "text-xs") : ""}`}>{(vsAI && bottomPlayerId === "player1") || (!vsAI && currentPlayerId === bottomPlayerId) ? "你" : bottomPlayerId === "player1" ? "玩家 1" : "玩家 2"}</span>
            <span className={`font-bold text-red-500 ${mobileLayout ? (mobileLarge ? "ml-1 text-xl" : "ml-1 text-base") : "ml-2 text-xl"}`}>{bottomPlayer.lp}</span>
          </div>
        </div>
      </div>

      {isBottomActive && selectedHandCard?.type === "spell" && hasSpellEffect(selectedHandCard) && !pendingSpellTarget && !pendingLightSwordZone && !pendingDiscardSelect && !pendingSpecialSummonZone && !pendingPrematureBurialZone && (inMainPhase || (inBattlePhase && selectedHandCard?.spellType === "quickplay")) && (
        <div className="fixed inset-0 z-30" onClick={() => setSelectedHandCard(null)}>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <span className="text-amber-200 text-xs">发动魔法：</span>
            <button className="px-2 py-0.5 bg-emerald-600 rounded hover:bg-emerald-500 text-white text-xs" onClick={handleActivateSpell}>
              发动 {selectedHandCard?.name}
            </button>
            <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => setSelectedHandCard(null)}>取消</button>
          </div>
        </div>
      )}
      {(canShowSummonForm || (pendingSummon && pendingSummon.position == null)) && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">{tributeCount > 0 ? "2. " : ""}选择表示形式：</span>
          <button className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-500 text-white text-xs" onClick={() => confirmSummonPosition("attack", false)}>表侧攻击</button>
          <button className="px-2 py-0.5 bg-amber-600 rounded hover:bg-amber-500 text-white text-xs" onClick={() => confirmSummonPosition("defense", true)}>里侧守备</button>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingSummon(null); setSelectedHandCard(null); setTributeIndices([]); setTributeConfirmed(false); }}>取消</button>
        </div>
      )}
      {pendingSpecialSummonZone && pendingSpecialSummonZone.position == null && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">选择表示形式：</span>
          <button className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-500 text-white text-xs" onClick={() => handleSpecialSummonPositionSelected("attack")}>攻击</button>
          <button className="px-2 py-0.5 bg-amber-600 rounded hover:bg-amber-500 text-white text-xs" onClick={() => handleSpecialSummonPositionSelected("defense")}>守备</button>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingSpecialSummonZone(null); setViewingCard(null); setSelectedHandCard(null); }}>取消</button>
        </div>
      )}
      {pendingSpecialSummonZone && pendingSpecialSummonZone.position != null && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">点击一个格子放置复活的怪兽</span>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingSpecialSummonZone(null); setViewingCard(null); setSelectedHandCard(null); }}>取消</button>
        </div>
      )}
      {pendingPrematureBurialZone && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">点击一个魔陷格放置过早的埋葬</span>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingPrematureBurialZone(null); setViewingCard(null); setSelectedHandCard(null); }}>取消</button>
        </div>
      )}
      {pendingLightSwordZone && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">点击一个魔陷格放置光之护封剑</span>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingLightSwordZone(null); setSelectedHandCard(null); }}>取消</button>
        </div>
      )}
      {pendingSummon?.position != null && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">{pendingSummon?.tributeIndices?.length ? "3. " : ""}点击一个格子放置怪兽</span>
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => { setPendingSummon(null); setSelectedHandCard(null); setTributeIndices([]); setTributeConfirmed(false); }}>取消</button>
        </div>
      )}
      {pendingSpellTarget?.targetType === "spellTrap" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-700 px-2.5 py-1.5 rounded flex items-center gap-1.5 text-amber-200 text-xs z-30 shadow-lg">
          点击场上的一张魔法·陷阱卡选择对象
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500" onClick={() => { setPendingSpellTarget(null); setSelectedHandCard(null); setViewingCard(null); }}>取消</button>
        </div>
      )}
      {pendingSpellTarget?.targetType === "opponentMonster" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-700 px-2.5 py-1.5 rounded flex items-center gap-1.5 text-amber-200 text-xs z-30 shadow-lg">
          点击对方场上1只怪兽选择对象
          <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500" onClick={() => { setPendingSpellTarget(null); setSelectedHandCard(null); setViewingCard(null); }}>取消</button>
        </div>
      )}
      {positionChangeZone !== null && (
        <div className="fixed inset-0 z-30" onClick={() => setPositionChangeZone(null)}>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <span className="text-amber-200 text-xs">改变表示形态：</span>
            <button className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-500 text-white text-xs" onClick={() => confirmPositionChange("attack")}>攻击</button>
            <button className="px-2 py-0.5 bg-amber-600 rounded hover:bg-amber-500 text-white text-xs" onClick={() => confirmPositionChange("defense")}>守备</button>
            <button className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs" onClick={() => setPositionChangeZone(null)}>取消</button>
          </div>
        </div>
      )}
      {tributeCount > 0 && selectedHandCard?.type === "monster" && !pendingSummon && !tributeConfirmed && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-amber-800 px-2.5 py-1.5 rounded flex items-center gap-1.5 z-30 shadow-lg">
          <span className="text-amber-200 text-xs">1. 选择 {tributeCount} 只祭品怪兽</span>
          <button
            className="px-2 py-0.5 bg-green-600 rounded hover:bg-green-500 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setTributeConfirmed(true)}
            disabled={!tributeZoneChoice}
          >
            确认祭品
          </button>
          <button
            className="px-1.5 py-0.5 bg-slate-600 rounded hover:bg-slate-500 text-xs"
            onClick={() => { setSelectedHandCard(null); setTributeIndices([]); setTributeConfirmed(false); }}
          >
            取消
          </button>
        </div>
      )}
      {state.pendingAttack && (!vsAI || state.pendingAttack.defenderPlayerId === "player1") && (() => {
        const traps = getActivatableTrapsOnAttackDeclared(state);
        const defHand = state.players[state.pendingAttack.defenderPlayerId]?.hand || [];
        const has010 = defHand.some((c) => String(c?.id) === "010");
        return traps.length > 0 || has010;
      })() && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex gap-1.5 items-center flex-wrap z-30 shadow-lg">
          <span className="text-amber-400 text-xs">宣言攻击中 — 允许/无效/陷阱/取消：</span>
          <button className="px-2 py-0.5 bg-green-600 rounded hover:bg-green-500 text-white text-xs" onClick={confirmAttack}>
            允许
          </button>
          {(() => {
            const defHand = state.players[state.pendingAttack.defenderPlayerId]?.hand || [];
            const idx010 = defHand.findIndex((c) => String(c?.id) === "010");
            if (idx010 >= 0) {
              return (
                <button className="px-2 py-0.5 bg-amber-600 rounded hover:bg-amber-500 text-white text-xs" onClick={() => negateAttackWith010(idx010)}>
                  羽翼栗子球无效
                </button>
              );
            }
            return null;
          })()}
          {getActivatableTrapsOnAttackDeclared(state).map(({ playerId, zoneIndex, card }) => (
            <button
              key={`${playerId}-${zoneIndex}`}
              className="px-2 py-0.5 bg-rose-600 rounded hover:bg-rose-500 text-white text-xs"
              onClick={() => activateTrapDuringAttack(playerId, zoneIndex)}
            >
              发动 {card?.name}
            </button>
          ))}
          <button className="px-2 py-0.5 bg-red-600 rounded hover:bg-red-500 text-white text-xs" onClick={cancelPendingAttack}>
            取消
          </button>
        </div>
      )}
      {state.pendingKuribohChoice && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-3 py-2 rounded flex gap-2 items-center z-30 shadow-lg">
          <span className="text-amber-400 text-sm">
            受到 {state.pendingKuribohChoice.defenderDamageToApply} 战斗伤害，是否舍弃栗子球使伤害变为 0？
          </span>
          <button
            className="px-2 py-1 bg-green-600 rounded hover:bg-green-500 text-white text-sm"
            onClick={() => dispatch({ type: "KURIBOH_CHOICE", useKuriboh: true })}
          >
            使用栗子球
          </button>
          <button
            className="px-2 py-1 bg-slate-600 rounded hover:bg-slate-500 text-white text-sm"
            onClick={() => dispatch({ type: "KURIBOH_CHOICE", useKuriboh: false })}
          >
            不使用
          </button>
        </div>
      )}
      {attackMode && !state.pendingAttack && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 field-popup bg-slate-800 px-2.5 py-1.5 rounded flex gap-1.5 items-center z-30 shadow-lg">
          <span className="text-amber-400 text-xs">选择攻击目标</span>
          {!opponent.monsterZones.some((m) => m !== null) && (
            <button
              className="px-2 py-0.5 bg-green-600 rounded hover:bg-green-500 text-white text-xs"
              onClick={directAttack}
            >
              直接攻击
            </button>
          )}
          <button
            className="px-2 py-0.5 bg-red-600 rounded hover:bg-red-500 text-white text-xs"
            onClick={cancelPendingAttack}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
