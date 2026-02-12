import Card from "./Card.jsx";

export default function SpellTrapZone({ zones, onZoneClick, onZoneDrop, selectedZone }) {
  return (
    <div className="flex gap-1 justify-center">
      {zones.map((zone, index) => (
        <div
          key={index}
          className="w-16 h-24 border-2 border-dashed border-emerald-600 rounded bg-emerald-900/20 flex items-center justify-center min-h-[96px]"
          onClick={() => onZoneClick && onZoneClick(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onZoneDrop && onZoneDrop(e, index)}
        >
          {zone ? (
            <Card
              card={zone}
              faceDown={zone.faceDown}
              size="sm"
              selected={selectedZone === index}
              onClick={() => onZoneClick && onZoneClick(index)}
            />
          ) : (
            <span className="text-emerald-600/50 text-[10px]">S/T</span>
          )}
        </div>
      ))}
    </div>
  );
}
