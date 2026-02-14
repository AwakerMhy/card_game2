import Card from "./Card.jsx";

const ZONE_SIZE = {
  default: "w-[72px] h-[120px] min-h-[120px]",
  mobile: "w-[50px] h-[84px] min-h-[84px]",
  mobileLarge: "w-[60px] h-[96px] min-h-[96px]",
};

export default function SpellTrapZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, highlightEmptyIndices, mobileLayout = false, mobileLarge = false }) {
  const sizeClass = mobileLayout ? (mobileLarge ? ZONE_SIZE.mobileLarge : ZONE_SIZE.mobile) : ZONE_SIZE.default;
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => {
        const isHighlightEmpty = highlightEmptyIndices?.includes(index) && zone === null;
        const zoneClass = isHighlightEmpty
          ? `${sizeClass} border-2 border-dashed border-green-500 rounded bg-green-900/30 flex items-center justify-center overflow-visible cursor-pointer hover:bg-green-900/50 touch-manipulation relative`
          : `${sizeClass} border-2 border-dashed rounded flex items-center justify-center overflow-visible touch-manipulation relative ${
              selectedZone === index && zone?.equippedToMonsterZoneIndex != null
                ? "border-cyan-500 bg-cyan-900/20 ring-2 ring-cyan-500"
                : "border-emerald-600 bg-emerald-900/20"
            }`;
        return (
        <div
          key={index}
          className={zoneClass}
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
          data-zone-index={index}
        >
          {zone ? (
            <>
              <Card
                card={zone}
                faceDown={zone.faceDown}
                size={mobileLayout ? (mobileLarge ? "sm" : "xs") : "md"}
                selected={selectedZone === index}
                onClick={() => onZoneClick && onZoneClick(index)}
                onViewDetails={zone.faceDown ? undefined : onViewDetails}
              />
              {selectedZone === index && zone.equippedToMonsterZoneIndex != null && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 whitespace-nowrap">装备→</span>
              )}
            </>
          ) : (
            <span className={isHighlightEmpty ? "text-green-500/80 text-[10px]" : "text-emerald-600/50 text-[10px]"}>魔陷</span>
          )}
        </div>
        );
      })}
    </div>
  );
}
