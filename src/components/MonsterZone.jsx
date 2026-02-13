import Card from "./Card.jsx";

const ZONE_SIZE = {
  default: "w-[72px] h-[120px] min-h-[120px]",
  mobile: "w-[56px] h-[94px] min-h-[94px]",
};

export default function MonsterZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, playable, tributeSelection, summonTargetZones, mobileLayout = false }) {
  const sizeClass = mobileLayout ? ZONE_SIZE.mobile : ZONE_SIZE.default;
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => {
        const isSummonTarget = summonTargetZones?.includes(index);
        const zoneClass = isSummonTarget
          ? `${sizeClass} border-2 border-dashed border-green-500 rounded bg-green-900/30 flex items-center justify-center overflow-visible cursor-pointer hover:bg-green-900/50 touch-manipulation`
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
              size={mobileLayout ? "sm" : "md"}
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
