import MonsterZone from "./MonsterZone.jsx";
import SpellTrapZone from "./SpellTrapZone.jsx";
import HandDisplay from "./HandDisplay.jsx";

// 对称布局：对手从上到下=手卡→魔陷→怪兽，己方从上到下=怪兽→魔陷→手卡
// 卡组和墓地显示组件（可导出供 GameBoard 在血条旁使用）
export function DeckGraveyardRow({ player, onGraveyardClick, compact = false }) {
  const boxClass = compact
    ? "w-9 h-12 border border-amber-700 rounded flex items-center justify-center"
    : "w-9 h-12 border-2 border-amber-700 rounded flex items-center justify-center";
  return (
    <div className="flex gap-0.5 items-end shrink-0">
      <div className="text-center">
        <div className="text-[9px] text-slate-400">卡组</div>
        <div className={`${boxClass} bg-amber-900`}>
          <span className="text-amber-200 font-bold text-xs">{player.deck.length}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[9px] text-slate-400">墓地</div>
        <div
          className={`${boxClass} bg-slate-700 border-slate-500 cursor-pointer hover:bg-slate-600 ${onGraveyardClick ? "" : ""}`}
          onClick={onGraveyardClick}
        >
          <span className="text-slate-300 font-bold text-xs">{player.graveyard.length}</span>
        </div>
      </div>
    </div>
  );
}

export default function PlayerArea({
  player,
  isOpponent,
  monsterZones,
  spellTrapZones,
  hand,
  onMonsterZoneClick,
  onSpellTrapZoneClick,
  onHandCardClick,
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
  const handContent = !isOpponent ? (
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      {canActivateSpell && onActivateSpell && (
        <button
          className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-xs self-center shrink-0"
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
  ) : (
    <div className="flex gap-0.5 justify-center items-end flex-1 min-h-[108px]">
      {hand.map((_, i) => (
        <div key={i} className="w-[68px] h-[108px] bg-amber-900 border border-amber-700 rounded shrink-0" />
      ))}
    </div>
  );

  // 卡组墓地已移至血条旁显示，手牌行仅显示手牌
  const handRow = (
    <div className="flex flex-nowrap items-end justify-center shrink-0 w-full">
      {handContent}
    </div>
  );

  const spellTrap = (
    <div className="shrink-0">
    <SpellTrapZone
      zones={spellTrapZones}
      onZoneClick={onSpellTrapZoneClick}
      onZoneDrop={onSpellTrapZoneDrop}
      onViewDetails={onViewDetails}
      selectedZone={selectedSpellTrapZone}
    />
    </div>
  );

  const monster = (
    <div className="h-[120px] shrink-0 flex items-center justify-center overflow-visible">
    <MonsterZone
      zones={monsterZones}
      onZoneClick={onMonsterZoneClick}
      onZoneDrop={onMonsterZoneDrop}
      onViewDetails={onViewDetails}
      selectedZone={selectedMonsterZone}
      tributeSelection={tributeIndices}
    />
    </div>
  );

  // 对手：手卡(上) → 魔陷 → 怪兽(下，靠近中线)
  // 己方：怪兽(上，靠近中线) → 魔陷 → 手卡(下)
  return (
    <div className={`flex flex-col gap-0 flex-1 min-h-0 min-w-0 overflow-hidden`}>
      {isOpponent ? (
        <>
          {handRow}
          {spellTrap}
          {monster}
        </>
      ) : (
        <>
          {monster}
          {spellTrap}
          {handRow}
        </>
      )}
    </div>
  );
}
