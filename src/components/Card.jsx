import { getAttributeDisplay, getRaceDisplay } from "../utils/cardDisplay.js";
import CardIllustration from "./CardIllustration.jsx";

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
  upright = false,
}) {
  const sizeClasses = {
    xs: "w-[44px] h-[64px] text-[5px]",
    sm: "w-[52px] h-[72px] text-[6px]",
    md: "w-[68px] h-[108px] text-[8px]",
    lg: "w-24 h-[132px] text-xs",
  };

  const handleCardClick = (e) => {
    onViewDetails?.(card);
    onClick?.(e);
  };

  const position = card?.position || "attack";
  const isDefense = position === "defense" && !upright;
  const rotationClass = isDefense ? "rotate-90" : "";

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} ${rotationClass} bg-amber-900 border-2 border-amber-700 rounded cursor-pointer shadow-lg flex items-center justify-center select-none relative`}
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

  const imageSizeClass = size === "xs" ? "w-6 h-6" : size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12";

  return (
    <div
      className={`${sizeClasses[size]} ${rotationClass} ${bgColor} ${borderColor} rounded overflow-hidden cursor-pointer shadow-lg flex flex-col select-none transition-all touch-manipulation relative ${
        playable ? "shadow-lg hover:scale-105" : ""
      }`}
      onClick={handleCardClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="font-bold truncate px-0.5 pt-0.5 border-b border-amber-200 shrink-0">
        {card.name}
      </div>
      <div className="flex-1 flex items-center justify-center p-0.5 min-h-0">
        <CardIllustration cardId={card.id} className={`${imageSizeClass} flex-shrink-0`} />
      </div>
      {isMonster && (
        <div className="shrink-0 p-0.5 space-y-0.5 border-t border-amber-200">
          <div className="flex justify-between text-[6px]">
            <span>{getAttributeDisplay(card.attribute)}</span>
            <span>Lv{card.level}</span>
          </div>
          <div className="text-[5px] truncate">{getRaceDisplay(card.race)}</div>
          <div className="flex justify-between font-bold text-[6px]">
            <span>攻{card.atk}</span>
            <span>守{card.def}</span>
          </div>
        </div>
      )}
      {(isSpell || isTrap) && (
        <div className="shrink-0 px-0.5 pb-0.5 text-center">
          <span className="text-[6px] text-slate-500">{card.type === "spell" ? "魔法" : "陷阱"}</span>
        </div>
      )}
    </div>
  );
}
