import Card from "./Card.jsx";

export default function MonsterZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone, playable, tributeSelection }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => (
        <div
          key={index}
          className="w-[72px] h-[120px] min-h-[120px] border-2 border-dashed border-amber-600 rounded bg-amber-900/20 flex items-center justify-center overflow-visible"
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
        >
          {zone ? (
            <Card
              card={zone}
              size="md"
              selected={selectedZone === index || tributeSelection?.includes(index)}
              onClick={() => onZoneClick && onZoneClick(index)}
              onViewDetails={onViewDetails}
            />
          ) : (
            <span className="text-amber-600/50 text-xs">怪兽</span>
          )}
        </div>
      ))}
    </div>
  );
}
