import { useState } from "react";

export default function Card({
  card,
  faceDown = false,
  size = "md",
  onClick,
  onContextMenu,
  selected = false,
  playable = false,
  draggable = false,
  onDragStart,
}) {
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    sm: "w-12 h-[68px] text-[6px]",
    md: "w-16 h-[88px] text-[8px]",
    lg: "w-24 h-[132px] text-xs",
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onContextMenu) onContextMenu(e);
    else setShowDetails((d) => !d);
  };

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} bg-amber-900 border-2 border-amber-700 rounded cursor-pointer shadow-lg flex items-center justify-center select-none`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
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
    ? "bg-emerald-50"
    : "bg-rose-50";

  const borderColor = selected
    ? "border-4 border-blue-500"
    : playable
    ? "border-2 border-green-500 shadow-green-500/50"
    : "border-2 border-amber-800";

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} ${borderColor} rounded overflow-hidden cursor-pointer shadow-lg flex flex-col select-none transition-all touch-manipulation ${
        playable ? "shadow-lg hover:scale-105" : ""
      }`}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      title={position === "defense" ? "DEF" : "ATK"}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="font-bold truncate px-0.5 pt-0.5 border-b border-amber-200">
        {card.name}
      </div>
      {isMonster && (
        <div className="flex-1 p-0.5 space-y-0.5">
          <div className="flex justify-between">
            <span>{card.attribute}</span>
            <span>Lv{card.level}</span>
          </div>
          <div className="text-[6px] truncate">{card.race}</div>
          <div className="flex justify-between font-bold">
            <span>ATK {card.atk}</span>
            <span>DEF {card.def}</span>
          </div>
        </div>
      )}
      {(isSpell || isTrap) && (
        <div className="flex-1 p-0.5 overflow-hidden text-[6px] line-clamp-3">
          {card.effect}
        </div>
      )}
      {(showDetails || (card.effect && isMonster)) && card.effect && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-1 text-[6px] rounded z-10">
          {card.effect}
        </div>
      )}
    </div>
  );
}
