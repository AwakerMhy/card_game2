import MonsterZone from "./MonsterZone.jsx";
import SpellTrapZone from "./SpellTrapZone.jsx";
import HandDisplay from "./HandDisplay.jsx";

// 对称布局：对手从上到下=手卡→魔陷→怪兽，己方从上到下=怪兽→魔陷→手卡
// 卡组和墓地显示组件（可导出供 GameBoard 在血条旁使用）
export function DeckGraveyardRow({ player, onGraveyardClick, compact = false, mobileLarge = false }) {
  const boxClass = compact
    ? mobileLarge
      ? "w-9 h-12 border border-amber-700 rounded flex items-center justify-center"
      : "w-7 h-9 border border-amber-700 rounded flex items-center justify-center"
    : "w-9 h-12 border-2 border-amber-700 rounded flex items-center justify-center";
  const labelClass = compact ? (mobileLarge ? "text-[10px]" : "text-[8px]") : "text-[9px]";
  const numClass = compact ? (mobileLarge ? "text-sm" : "text-[10px]") : "text-xs";
  return (
    <div className={`flex gap-0.5 items-end shrink-0 ${compact ? "flex-row" : ""}`}>
      <div className="text-center">
        <div className={`text-slate-400 ${labelClass}`}>卡组</div>
        <div className={`${boxClass} bg-amber-900`}>
          <span className={`text-amber-200 font-bold ${numClass}`}>{player.deck.length}</span>
        </div>
      </div>
      <div className="text-center">
        <div className={`text-slate-400 ${labelClass}`}>墓地</div>
        <div
          className={`${boxClass} bg-slate-700 border-slate-500 cursor-pointer hover:bg-slate-600 ${onGraveyardClick ? "" : ""}`}
          onClick={onGraveyardClick}
        >
          <span className={`text-slate-300 font-bold ${numClass}`}>{player.graveyard.length}</span>
        </div>
      </div>
    </div>
  );
}

export default function PlayerArea({
  player,
  isOpponent,
  mobileLayout = false,
  mobileLarge = false,
  monsterZones,
  spellTrapZones,
  hand,
  onMonsterZoneClick,
  onSpellTrapZoneClick,
  onHandCardClick,
  onDragStart,
  onMonsterZoneDrop,
  onSpellTrapZoneDrop,
  onViewDetails,
  onGraveyardClick,
  selectedMonsterZone,
  tributeIndices = [],
  summonTargetZones,
  selectedSpellTrapZone,
  spellTrapHighlightIndices,
  selectedHandCard,
  playableHandCards,
  equipHighlightZoneIndex,
}) {
  const handContent = !isOpponent ? (
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <HandDisplay
        cards={hand}
        onCardClick={onHandCardClick}
        onViewDetails={onViewDetails}
        playableCards={playableHandCards}
        selectedCard={selectedHandCard}
        onDragStart={onDragStart}
        compact={mobileLayout}
        mobileLarge={mobileLarge}
      />
    </div>
  ) : (
    <div className={`flex gap-0.5 justify-center items-end flex-1 overflow-x-auto py-0.5 ${mobileLayout ? (mobileLarge ? "min-h-[84px]" : "min-h-[64px]") : "min-h-[108px]"}`}>
      {hand.map((_, i) => (
        <div
          key={i}
          className={mobileLayout ? (mobileLarge ? "w-[60px] h-[84px] bg-amber-900 border border-amber-700 rounded shrink-0" : "w-[44px] h-[64px] bg-amber-900 border border-amber-700 rounded shrink-0") : "w-[68px] h-[108px] bg-amber-900 border border-amber-700 rounded shrink-0"}
        />
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
      highlightEmptyIndices={spellTrapHighlightIndices}
      mobileLayout={mobileLayout}
      mobileLarge={mobileLarge}
    />
    </div>
  );

  const monster = (
    <div className={`shrink-0 flex items-center justify-center overflow-visible ${mobileLayout ? (mobileLarge ? "h-[108px]" : "h-[84px]") : "h-[120px]"}`}>
    <MonsterZone
      zones={monsterZones}
      onZoneClick={onMonsterZoneClick}
      onZoneDrop={onMonsterZoneDrop}
      onViewDetails={onViewDetails}
      selectedZone={selectedMonsterZone}
      tributeSelection={tributeIndices}
      summonTargetZones={summonTargetZones}
      equipHighlightZoneIndex={equipHighlightZoneIndex}
      mobileLayout={mobileLayout}
      mobileLarge={mobileLarge}
    />
    </div>
  );

  // 对手：手卡(上) → 魔陷 → 怪兽(下，靠近中线)
  // 己方：怪兽(上，靠近中线) → 魔陷 → 手卡(下)
  return (
    <div className={`flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden ${mobileLayout ? "gap-0.5 justify-center" : "gap-0"}`}>
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
