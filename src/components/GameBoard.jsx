import { useReducer, useCallback, useState, useEffect } from "react";
import PlayerArea from "./PlayerArea.jsx";
import PhaseIndicator, { PHASES } from "./PhaseIndicator.jsx";
import DamageDisplay from "./DamageDisplay.jsx";
import CardDetailModal from "./CardDetailModal.jsx";
import GraveyardModal from "./GraveyardModal.jsx";
import ActionLog from "./ActionLog.jsx";
import {
  createInitialState,
  drawCard,
  removeFromHand,
  placeMonsterZone,
  placeSpellTrapZone,
  clearMonsterZone,
  setLP,
  sendToGraveyard,
  getEmptyMonsterZoneIndex,
  getEmptySpellTrapZoneIndex,
  clearSpellTrapZone,
} from "../game-logic/gameState.js";
import { canNormalSummon, getTributeCount } from "../game-logic/summonValidator.js";
import { calculateBattle } from "../game-logic/battleCalculator.js";
import { resolveSpellEffect, hasSpellEffect } from "../game-logic/spellEffects.js";
import { getAIAction } from "../game-logic/aiOpponent.js";
import { playDraw, playSummon, playAttack, playDamage, playSet, playPhase } from "../utils/sounds.js";

const initialState = createInitialState();

function gameReducer(state, action) {
  switch (action.type) {
    case "DRAW":
      return drawCard(state, action.playerId);
    case "SET_PHASE":
      return { ...state, currentPhase: action.phase };
    case "SUMMON": {
      const { playerId, card, zoneIndex, tributeIndices } = action;
      let newState = removeFromHand(state, playerId, card.instanceId);
      if (tributeIndices?.length) {
        tributeIndices.forEach((idx) => {
          const tributed = state.players[playerId].monsterZones[idx];
          newState = sendToGraveyard(newState, playerId, tributed);
          newState = clearMonsterZone(newState, playerId, idx);
        });
      }
      newState = placeMonsterZone(newState, playerId, zoneIndex, card, "attack");
      return { ...newState, canNormalSummon: false };
    }
    case "SET_SPELL_TRAP": {
      const { playerId, card, zoneIndex, faceDown } = action;
      let newState = removeFromHand(state, playerId, card.instanceId);
      return placeSpellTrapZone(newState, playerId, zoneIndex, card, faceDown);
    }
    case "ACTIVATE_SPELL": {
      const { playerId, card } = action;
      let newState = removeFromHand(state, playerId, card.instanceId);
      newState = resolveSpellEffect(newState, playerId, card);
      return sendToGraveyard(newState, playerId, card);
    }
    case "ACTIVATE_SPELL_FROM_FIELD": {
      const { playerId, zoneIndex } = action;
      const { newState: clearedState, card } = clearSpellTrapZone(state, playerId, zoneIndex);
      if (!card || card.type !== "spell") return state;
      let newState = resolveSpellEffect(clearedState, playerId, card);
      return sendToGraveyard(newState, playerId, card);
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
    case "BATTLE": {
      const { attackerPlayerId, attackerZoneIndex, defenderPlayerId, defenderZoneIndex } = action;
      const attacker = state.players[attackerPlayerId].monsterZones[attackerZoneIndex];
      const defenderPlayer = state.players[defenderPlayerId];
      const defender = defenderZoneIndex >= 0
        ? defenderPlayer.monsterZones[defenderZoneIndex]
        : null;
      const defenderHasAtkMonsters = defenderPlayer.monsterZones.some(
        (m) => m && m.position === "attack"
      );
      const isDirectAttack = !defenderHasAtkMonsters && defenderZoneIndex === -1;

      const result = calculateBattle(attacker, defender, isDirectAttack);
      if (!result) return state;

      let newState = state;

      if (result.defenderDestroys) {
        newState = sendToGraveyard(newState, attackerPlayerId, attacker);
        newState = clearMonsterZone(newState, attackerPlayerId, attackerZoneIndex);
        newState = setLP(newState, attackerPlayerId, state.players[attackerPlayerId].lp - result.attackerDamage);
      }
      if (result.attackerDestroys && defender) {
        newState = sendToGraveyard(newState, defenderPlayerId, defender);
        newState = clearMonsterZone(newState, defenderPlayerId, defenderZoneIndex);
      }
      if (result.defenderDamage > 0) {
        newState = setLP(newState, defenderPlayerId, defenderPlayer.lp - result.defenderDamage);
      }

      if (newState.players[defenderPlayerId].lp <= 0) {
        newState = { ...newState, winner: attackerPlayerId };
      }
      const damageAmount = result.defenderDamage || result.attackerDamage;
      const damageTarget = result.defenderDamage > 0 ? defenderPlayerId : result.attackerDamage > 0 ? attackerPlayerId : null;
      const attacked = [...(state.attackedMonsters[attackerPlayerId] || []), attackerZoneIndex];
      return {
        ...newState,
        lastDamage: damageAmount,
        lastDamageTarget: damageTarget,
        attackedMonsters: {
          ...newState.attackedMonsters,
          [attackerPlayerId]: attacked,
        },
      };
    }
    case "CLEAR_DAMAGE":
      return { ...state, lastDamage: null, lastDamageTarget: null };
    case "CHANGE_POSITION": {
      const { playerId, zoneIndex } = action;
      const player = state.players[playerId];
      const zone = player.monsterZones[zoneIndex];
      if (!zone) return state;
      const newPosition = zone.position === "attack" ? "defense" : "attack";
      const newZones = [...player.monsterZones];
      newZones[zoneIndex] = { ...zone, position: newPosition };
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            monsterZones: newZones,
          },
        },
      };
    }
    case "END_TURN":
      return {
        ...state,
        currentTurn: state.currentTurn === 1 ? 2 : 1,
        currentPhase: "draw",
        canNormalSummon: true,
        turnCount: state.currentTurn === 2 ? state.turnCount + 1 : state.turnCount,
        attackedMonsters: { player1: [], player2: [] },
      };
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}

export default function GameBoard() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [vsAI, setVsAI] = useState(false);
  const [actionLog, setActionLog] = useState([]);

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
    if (state.lastDamage) {
      playDamage();
      const target = state.lastDamageTarget === "player1" ? "玩家 1" : "玩家 2";
      addLog?.(`${target} 受到 ${state.lastDamage} 伤害`, "player");
      const t = setTimeout(() => dispatch({ type: "CLEAR_DAMAGE" }), 1200);
      return () => clearTimeout(t);
    }
  }, [state.lastDamage]);

  // AI turn
  useEffect(() => {
    if (!vsAI || state.winner || state.currentTurn !== 2) return;
    const timer = setTimeout(() => {
      const action = getAIAction(state);
      if (action.type === "DRAW_PHASE") {
        const shouldDraw = !(state.turnCount === 1 && state.currentTurn === 1);
        if (state.currentPhase === "draw" && shouldDraw) {
          playDraw();
          addLog("AI 抽牌", "ai");
          dispatch({ type: "DRAW", playerId: "player2" });
        }
        playPhase();
        addLog("AI 进入准备阶段", "ai");
        dispatch({ type: "SET_PHASE", phase: "standby" });
      } else if (action.type === "SUMMON") {
        playSummon();
        addLog(`AI 召唤 ${action.card?.name}`, "ai");
        dispatch(action);
      } else if (action.type === "BATTLE") {
        playAttack();
        const attacker = state.players.player2?.monsterZones[action.attackerZoneIndex];
        const defender = action.defenderZoneIndex >= 0 ? state.players.player1?.monsterZones[action.defenderZoneIndex] : null;
        addLog(defender ? `AI ${attacker?.name} 攻击 ${defender?.name}` : `AI ${attacker?.name} 直接攻击`, "ai");
        dispatch(action);
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
  }, [vsAI, state.currentTurn, state.currentPhase, state.winner, state.turnCount, state.players, addLog]);

  if (state.winner) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">
            {state.winner === "player1" ? "玩家 1" : "玩家 2"} 获胜！
          </h1>
          <div className="flex gap-2 justify-center">
            <button
              className="px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400"
              onClick={() => dispatch({ type: "RESET" })}
            >
              再玩一局
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex flex-col relative">
      {state.lastDamage && state.lastDamageTarget && (
        <DamageDisplay
          amount={state.lastDamage}
          isOpponent={
            (state.currentTurn === 1 && state.lastDamageTarget === "player2") ||
            (state.currentTurn === 2 && state.lastDamageTarget === "player1")
          }
        />
      )}
      <div className="flex justify-center mb-4">
        <PhaseIndicator
          currentPhase={state.currentPhase}
          onNextPhase={handleNextPhase}
        />
      </div>

      <div className="flex justify-between mb-2 items-center">
        <span className="text-slate-400">
          回合 {state.turnCount} - {state.currentTurn === 1 ? "玩家 1" : vsAI ? "AI" : "玩家 2"} 的回合
        </span>
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={vsAI}
            onChange={(e) => setVsAI(e.target.checked)}
            className="rounded"
          />
          <span>对战 AI</span>
        </label>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
            onClick={handleEndTurn}
          >
            结束回合
          </button>
        </div>
      </div>

      <ActionLog entries={actionLog} />
      <GameBoardInner
        state={state}
        dispatch={dispatch}
        currentPlayerId={currentPlayerId}
        opponentId={opponentId}
        vsAI={vsAI}
        addLog={addLog}
      />
    </div>
  );
}

function GameBoardInner({
  state,
  dispatch,
  currentPlayerId,
  opponentId,
  vsAI,
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

  const currentPlayer = state.players[currentPlayerId];
  const opponent = state.players[opponentId];

  const playableMonsters = state.currentPhase === "main1" || state.currentPhase === "main2"
    ? currentPlayer.hand.filter((c) => c.type === "monster" && canNormalSummon(state, currentPlayerId, c))
    : [];
  const playableSpells = state.currentPhase === "main1" || state.currentPhase === "main2"
    ? currentPlayer.hand.filter((c) => c.type === "spell" || c.type === "trap")
    : [];

  const emptyMonsterIndex = getEmptyMonsterZoneIndex(currentPlayer);
  const emptySpellIndex = getEmptySpellTrapZoneIndex(currentPlayer);

  const tributeCount = selectedHandCard?.type === "monster" ? getTributeCount(selectedHandCard.level) : 0;

  const handleHandCardClick = (card) => {
    if (attackMode) return;
    if (card.type === "monster" && canNormalSummon(state, currentPlayerId, card)) {
      const count = getTributeCount(card.level);
      if (count === 0 && emptyMonsterIndex >= 0) {
        playSummon();
        addLog?.(`召唤 ${card.name}`, "player");
        dispatch({
          type: "SUMMON",
          playerId: currentPlayerId,
          card,
          zoneIndex: emptyMonsterIndex,
        });
        setSelectedHandCard(null);
      } else if (count > 0) {
        setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
        setTributeIndices([]);
      } else {
        setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
      }
    } else if (card.type === "spell" || card.type === "trap") {
      setSelectedHandCard(selectedHandCard?.instanceId === card.instanceId ? null : card);
    }
  };

  const handleSpellTrapZoneClick = (index) => {
    if (attackMode) return;
    const zone = currentPlayer.spellTrapZones[index];
    if (zone) {
      if (zone.faceDown) {
        setViewingCard({ card: zone, zoneIndex: index, playerId: currentPlayerId });
      }
      return;
    }
    if (selectedHandCard && (selectedHandCard.type === "spell" || selectedHandCard.type === "trap")) {
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
        playSummon();
        addLog?.(`召唤 ${draggedCard.name}`, "player");
        dispatch({
          type: "SUMMON",
          playerId: currentPlayerId,
          card: draggedCard,
          zoneIndex,
        });
      }
    }
    setDraggedCard(null);
  };

  const handleSpellTrapZoneDrop = (e, zoneIndex) => {
    e.preventDefault();
    if (!draggedCard || currentPlayer.spellTrapZones[zoneIndex]) return;
    if (draggedCard.type === "spell" || draggedCard.type === "trap") {
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
      addLog?.(`发动魔法 ${selectedHandCard.name}`, "player");
      dispatch({
        type: "ACTIVATE_SPELL",
        playerId: currentPlayerId,
        card: selectedHandCard,
      });
      setSelectedHandCard(null);
    }
  };

  const handleMonsterZoneClick = (index) => {
    if (attackMode) return;
    const canChangePosition =
      (state.currentPhase === "main1" || state.currentPhase === "main2") &&
      !selectedHandCard &&
      currentPlayer.monsterZones[index];
    if (canChangePosition) {
      dispatch({
        type: "CHANGE_POSITION",
        playerId: currentPlayerId,
        zoneIndex: index,
      });
      return;
    }
    if (tributeCount > 0 && selectedHandCard?.type === "monster") {
      const zone = currentPlayer.monsterZones[index];
      if (zone) {
        const newTributes = tributeIndices.includes(index)
          ? tributeIndices.filter((i) => i !== index)
          : [...tributeIndices, index].slice(0, tributeCount);
        setTributeIndices(newTributes);
        if (newTributes.length === tributeCount) {
          playSummon();
          addLog?.(`祭品召唤 ${selectedHandCard.name}`, "player");
          dispatch({
            type: "SUMMON",
            playerId: currentPlayerId,
            card: selectedHandCard,
            zoneIndex: newTributes[0],
            tributeIndices: newTributes,
          });
          setSelectedHandCard(null);
          setTributeIndices([]);
        }
      }
      return;
    }
    if (state.currentPhase === "battle") {
      const monster = currentPlayer.monsterZones[index];
      const hasAttacked = state.attackedMonsters?.[currentPlayerId]?.includes(index);
      if (monster && monster.position === "attack" && !hasAttacked) {
        setAttackMode(true);
        setAttackingZone(index);
      }
    } else if (selectedHandCard?.type === "monster" && tributeCount === 0 && emptyMonsterIndex === index) {
      playSummon();
      addLog?.(`召唤 ${selectedHandCard.name}`, "player");
      dispatch({
        type: "SUMMON",
        playerId: currentPlayerId,
        card: selectedHandCard,
        zoneIndex: index,
      });
      setSelectedHandCard(null);
    }
  };

  const handleOpponentMonsterZoneClick = (index) => {
    if (attackMode && attackingZone !== null) {
      const myMonster = currentPlayer.monsterZones[attackingZone];
      const oppMonster = opponent.monsterZones[index];
      if (myMonster && myMonster.position === "attack") {
        playAttack();
        const def = opponent.monsterZones[index];
        addLog?.(def ? `${myMonster.name} 攻击 ${def.name}` : `${myMonster.name} 攻击`, "player");
        dispatch({
          type: "BATTLE",
          attackerPlayerId: currentPlayerId,
          attackerZoneIndex: attackingZone,
          defenderPlayerId: opponentId,
          defenderZoneIndex: index,
        });
        setAttackMode(false);
        setAttackingZone(null);
      }
    }
  };

  const handleViewDetails = (card) => setViewingCard(card);
  const handleGraveyardClick = (playerId) => setGraveyardViewing(playerId);

  const directAttack = () => {
    if (attackMode && attackingZone !== null) {
      const hasAtk = opponent.monsterZones.some((m) => m && m.position === "attack");
      if (!hasAtk) {
        playAttack();
        const myMonster = currentPlayer.monsterZones[attackingZone];
        addLog?.(`${myMonster?.name} 直接攻击`, "player");
        dispatch({
          type: "BATTLE",
          attackerPlayerId: currentPlayerId,
          attackerZoneIndex: attackingZone,
          defenderPlayerId: opponentId,
          defenderZoneIndex: -1,
        });
        setAttackMode(false);
        setAttackingZone(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {viewingCard && (
        <CardDetailModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
          canActivate={
            viewingCard.zoneIndex !== undefined &&
            viewingCard.playerId === currentPlayerId &&
            viewingCard.card?.type === "spell" &&
            hasSpellEffect(viewingCard.card) &&
            (state.currentPhase === "main1" || state.currentPhase === "main2")
          }
          onActivate={() => {
            if (viewingCard.zoneIndex !== undefined && viewingCard.playerId === currentPlayerId) {
              playPhase();
              addLog?.(`发动盖牌 ${viewingCard.card?.name}`, "player");
              dispatch({
                type: "ACTIVATE_SPELL_FROM_FIELD",
                playerId: viewingCard.playerId,
                zoneIndex: viewingCard.zoneIndex,
              });
            }
          }}
        />
      )}
      {graveyardViewing && (
        <GraveyardModal
          cards={state.players[graveyardViewing]?.graveyard}
          label={graveyardViewing === "player1" ? "玩家 1" : "玩家 2"}
          onClose={() => setGraveyardViewing(null)}
          onViewCard={(card) => setViewingCard(card)}
        />
      )}
      <PlayerArea
        player={opponent}
        isOpponent={true}
        monsterZones={opponent.monsterZones}
        spellTrapZones={opponent.spellTrapZones}
        hand={opponent.hand}
        onMonsterZoneClick={handleOpponentMonsterZoneClick}
        onViewDetails={handleViewDetails}
        onGraveyardClick={() => handleGraveyardClick(opponentId)}
        onDirectAttackClick={
          attackMode &&
          attackingZone !== null &&
          !opponent.monsterZones.some((m) => m && m.position === "attack")
            ? directAttack
            : undefined
        }
      />

      <div className="border-2 border-amber-600 rounded-lg py-2 text-center text-amber-500 font-bold">
        --- 战线 ---
      </div>

      <PlayerArea
        player={currentPlayer}
        isOpponent={false}
        monsterZones={currentPlayer.monsterZones}
        spellTrapZones={currentPlayer.spellTrapZones}
        hand={currentPlayer.hand}
        onMonsterZoneClick={handleMonsterZoneClick}
        onSpellTrapZoneClick={handleSpellTrapZoneClick}
        onHandCardClick={handleHandCardClick}
        onViewDetails={handleViewDetails}
        onGraveyardClick={() => handleGraveyardClick(currentPlayerId)}
        selectedMonsterZone={selectedMonsterZone}
        selectedSpellTrapZone={selectedSpellTrapZone}
        selectedHandCard={selectedHandCard}
        playableHandCards={[...playableMonsters, ...playableSpells]}
        onActivateSpell={handleActivateSpell}
        canActivateSpell={selectedHandCard?.type === "spell" && hasSpellEffect(selectedHandCard)}
        tributeIndices={tributeIndices}
        onDragStart={handleDragStart}
        onMonsterZoneDrop={handleMonsterZoneDrop}
        onSpellTrapZoneDrop={handleSpellTrapZoneDrop}
      />

      {tributeCount > 0 && selectedHandCard?.type === "monster" && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-amber-800 px-4 py-2 rounded-lg">
          <span className="text-amber-200">选择 {tributeCount} 只祭品怪兽</span>
          <button
            className="ml-2 px-2 py-1 bg-slate-600 rounded hover:bg-slate-500"
            onClick={() => { setSelectedHandCard(null); setTributeIndices([]); }}
          >
            取消
          </button>
        </div>
      )}
      {attackMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 px-4 py-2 rounded-lg flex gap-2 items-center">
          <span className="text-amber-400">选择攻击目标</span>
          {!opponent.monsterZones.some((m) => m && m.position === "attack") && (
            <button
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 text-white"
              onClick={directAttack}
            >
              直接攻击
            </button>
          )}
          <button
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 text-white"
            onClick={() => {
              setAttackMode(false);
              setAttackingZone(null);
            }}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
