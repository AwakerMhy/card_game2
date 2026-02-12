import { getAttributeDisplay, getRaceDisplay } from "../utils/cardDisplay.js";

export default function Card({
  card,
  faceDown = false,
  size = "md",
  onClick,
  onContextMenu,
  onViewDetails,
  selected = false,
  playable = false,
  draggable = false,
  onDragStart,
}) {
  const sizeClasses = {
    sm: "w-[52px] h-[72px] text-[6px]",
    md: "w-[68px] h-[108px] text-[8px]",
    lg: "w-24 h-[132px] text-xs",
  };

  const handleCardClick = (e) => {
    onViewDetails?.(card);
    onClick?.(e);
  };

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} bg-amber-900 border-2 border-amber-700 rounded cursor-pointer shadow-lg flex items-center justify-center select-none relative`}
        onClick={onClick}
      >
        <div className="w-8 h-12 bg-amber-800 rounded" />
      </div>
    );
  }

  if (!card) return null;

  const isMonster = card.type === "monster";
  const isSpell = card.type === "spell";
  const isTrap = card.type === "trap";
  const position = card.position || "attack";

  const bgColor = isMonster
    ? "bg-amber-50"
    : isSpell
    ? "bg-emerald-100"
    : "bg-rose-50";

  const borderColor = selected
    ? "border-4 border-blue-500"
    : playable
    ? "border-2 border-green-500 shadow-green-500/50"
    : "border-2 border-amber-800";

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} ${borderColor} rounded overflow-hidden cursor-pointer shadow-lg flex flex-col select-none transition-all touch-manipulation relative ${
        playable ? "shadow-lg hover:scale-105" : ""
      }`}
      onClick={handleCardClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="font-bold truncate px-0.5 pt-0.5 border-b border-amber-200">
        {card.name}
      </div>
      {isMonster && (
        <div className="flex-1 p-0.5 space-y-0.5">
          <div className="flex justify-between">
            <span>{getAttributeDisplay(card.attribute)}</span>
            <span>Lv{card.level}</span>
          </div>
          <div className="text-[6px] truncate">{getRaceDisplay(card.race)}</div>
          <div className="flex justify-between font-bold">
            <span>攻{card.atk}</span>
            <span>守{card.def}</span>
          </div>
        </div>
      )}
      {(isSpell || isTrap) && (
        <div className="flex-1 p-0.5 flex items-center justify-center">
          <span className="text-[6px] text-slate-500">{card.type === "spell" ? "魔法" : "陷阱"}</span>
        </div>
      )}
    </div>
  );
}
