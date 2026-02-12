import Card from "./Card.jsx";

export default function MonsterZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, playable, tributeSelection, summonTargetZones }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => {
        const isSummonTarget = summonTargetZones?.includes(index);
        const zoneClass = isSummonTarget
          ? "w-[72px] h-[120px] min-h-[120px] border-2 border-dashed border-green-500 rounded bg-green-900/30 flex items-center justify-center overflow-visible cursor-pointer hover:bg-green-900/50"
          : "w-[72px] h-[120px] min-h-[120px] border-2 border-dashed border-amber-600 rounded bg-amber-900/20 flex items-center justify-center overflow-visible";
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
              size="md"
              selected={selectedZone === index || tributeSelection?.includes(index)}
              onClick={() => onZoneClick && onZoneClick(index)}
              onViewDetails={onViewDetails}
            />
          ) : (
            <span className={isSummonTarget ? "text-green-500/80 text-xs" : "text-amber-600/50 text-xs"}>怪兽</span>
          )}
        </div>
        );
      })}
    </div>
  );
}
