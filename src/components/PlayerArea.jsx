import MonsterZone from "./MonsterZone.jsx";
import SpellTrapZone from "./SpellTrapZone.jsx";
import HandDisplay from "./HandDisplay.jsx";

export default function PlayerArea({
  player,
  isOpponent,
  monsterZones,
  spellTrapZones,
  hand,
  onMonsterZoneClick,
  onSpellTrapZoneClick,
  onHandCardClick,
  onDirectAttackClick,
  onActivateSpell,
  canActivateSpell,
  onDragStart,
  onMonsterZoneDrop,
  onSpellTrapZoneDrop,
  onViewDetails,
  onGraveyardClick,
  selectedMonsterZone,
  tributeIndices = [],
  selectedSpellTrapZone,
  selectedHandCard,
  playableHandCards,
}) {
  return (
    <div className={`flex flex-col gap-2 ${isOpponent ? "order-first" : ""}`}>
      <div
        className={`flex items-center justify-between px-4 py-2 bg-slate-800 rounded-lg ${
          onDirectAttackClick ? "cursor-pointer hover:bg-slate-700" : ""
        }`}
        onClick={onDirectAttackClick}
      >
        <span className="font-bold text-amber-400">
          {isOpponent ? "对手" : "你"} 
        </span>
        <span className="text-2xl font-bold text-red-500">{player.lp}</span>
      </div>

      <div className="flex gap-4 justify-center items-end">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">卡组</div>
          <div className="w-12 h-16 bg-amber-900 border-2 border-amber-700 rounded flex items-center justify-center">
            <span className="text-amber-200 font-bold">{player.deck.length}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">墓地</div>
          <div
            className={`w-12 h-16 bg-slate-700 border-2 border-slate-500 rounded flex items-center justify-center cursor-pointer hover:bg-slate-600 ${onGraveyardClick ? "" : ""}`}
            onClick={onGraveyardClick}
          >
            <span className="text-slate-300 font-bold">{player.graveyard.length}</span>
          </div>
        </div>
      </div>

      <SpellTrapZone
        zones={spellTrapZones}
        onZoneClick={onSpellTrapZoneClick}
        onZoneDrop={onSpellTrapZoneDrop}
        onViewDetails={onViewDetails}
        selectedZone={selectedSpellTrapZone}
      />

      <MonsterZone
        zones={monsterZones}
        onZoneClick={onMonsterZoneClick}
        onZoneDrop={onMonsterZoneDrop}
        onViewDetails={onViewDetails}
        selectedZone={selectedMonsterZone}
        tributeSelection={tributeIndices}
      />

      {!isOpponent && (
        <div className="flex flex-col gap-2">
          {canActivateSpell && onActivateSpell && (
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 self-center"
              onClick={onActivateSpell}
            >
              发动魔法
            </button>
          )}
          <HandDisplay
            cards={hand}
            onCardClick={onHandCardClick}
            onViewDetails={onViewDetails}
            playableCards={playableHandCards}
            selectedCard={selectedHandCard}
            onDragStart={onDragStart}
          />
        </div>
      )}

      {isOpponent && hand.length > 0 && (
        <div className="flex gap-1 justify-center">
          {hand.map((_, i) => (
            <div
              key={i}
              className="w-12 h-[68px] bg-amber-900 border-2 border-amber-700 rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
}
