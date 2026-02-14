import Card from "./Card.jsx";

const ZONE_SIZE = {
  default: "w-[72px] h-[120px] min-h-[120px]",
  mobile: "w-[50px] h-[84px] min-h-[84px]",
  mobileLarge: "w-[68px] h-[108px] min-h-[108px]",
};

export default function MonsterZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, playable, tributeSelection, summonTargetZones, equipHighlightZoneIndex, mobileLayout = false, mobileLarge = false }) {
  const sizeClass = mobileLayout ? (mobileLarge ? ZONE_SIZE.mobileLarge : ZONE_SIZE.mobile) : ZONE_SIZE.default;
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => {
        const isSummonTarget = summonTargetZones?.includes(index);
        const isEquipHighlight = equipHighlightZoneIndex === index;
        const zoneClass = isSummonTarget
          ? `${sizeClass} border-2 border-dashed border-green-500 rounded bg-green-900/30 flex items-center justify-center overflow-visible cursor-pointer hover:bg-green-900/50 touch-manipulation`
          : isEquipHighlight
            ? `${sizeClass} border-2 border-dashed border-cyan-500 rounded bg-cyan-900/30 flex items-center justify-center overflow-visible touch-manipulation ring-2 ring-cyan-500`
            : `${sizeClass} border-2 border-dashed border-amber-600 rounded bg-amber-900/20 flex items-center justify-center overflow-visible touch-manipulation`;
        return (
        <div
          key={index}
          className={zoneClass}
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
        >
          {zone ? (
            <Card
              card={zone}
              faceDown={zone.faceDown}
              size={mobileLayout ? (mobileLarge ? "smL" : "xs") : "md"}
              selected={selectedZone === index || tributeSelection?.includes(index)}
              onClick={() => onZoneClick && onZoneClick(index)}
              onViewDetails={onViewDetails}
            />
          ) : (
            <span className={isSummonTarget ? "text-green-500/80 text-[10px]" : "text-amber-600/50 text-[10px]"}>{mobileLayout ? "怪" : "怪兽"}</span>
          )}
        </div>
        );
      })}
    </div>
  );
}
