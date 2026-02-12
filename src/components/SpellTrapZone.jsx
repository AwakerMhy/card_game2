import Card from "./Card.jsx";

export default function SpellTrapZone({ zones, onZoneClick, onZoneDrop, onViewDetails, selectedZone }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {zones.map((zone, index) => (
        <div
          key={index}
          className="w-[72px] h-[120px] min-h-[120px] border-2 border-dashed border-emerald-600 rounded bg-emerald-900/20 flex items-center justify-center overflow-visible"
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
        >
          {zone ? (
            <Card
              card={zone}
              faceDown={zone.faceDown}
              size="md"
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
