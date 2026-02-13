import Card from "./Card.jsx";

const ZONE_SIZE = {
  default: "w-[72px] h-[120px] min-h-[120px]",
  mobile: "w-[56px] h-[94px] min-h-[94px]",
};

export default function SpellTrapZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, mobileLayout = false }) {
  const sizeClass = mobileLayout ? ZONE_SIZE.mobile : ZONE_SIZE.default;
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => (
        <div
          key={index}
          className={`${sizeClass} border-2 border-dashed border-emerald-600 rounded bg-emerald-900/20 flex items-center justify-center overflow-visible touch-manipulation`}
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
        >
          {zone ? (
            <Card
              card={zone}
              faceDown={zone.faceDown}
              size={mobileLayout ? "sm" : "md"}
              selected={selectedZone === index}
              onClick={() => onZoneClick && onZoneClick(index)}
              onViewDetails={zone.faceDown ? undefined : onViewDetails}
            />
          ) : (
            <span className="text-emerald-600/50 text-[10px]">魔陷</span>
          )}
        </div>
      ))}
    </div>
  );
}
