import Card from "./Card.jsx";

export default function MonsterZone({ zones, onZoneClick, onZoneDrop, selectedZone, playable, tributeSelection }) {
  return (
    <div className="flex gap-1 justify-center">
      {zones.map((zone, index) => (
        <div
          key={index}
          className="w-20 h-28 border-2 border-dashed border-amber-600 rounded bg-amber-900/20 flex items-center justify-center min-h-[112px]"
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
            />
          ) : (
            <span className="text-amber-600/50 text-xs">Monster</span>
          )}
        </div>
      ))}
    </div>
  );
}
