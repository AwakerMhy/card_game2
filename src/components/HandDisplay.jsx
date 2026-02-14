import Card from "./Card.jsx";

export default function HandDisplay({
  cards,
  onCardClick,
  onViewDetails,
  playableCards = [],
  selectedCard,
  onDragStart,
  compact = false,
  mobileLarge = false,
}) {
  const handMinH = compact ? (mobileLarge ? "min-h-[84px]" : "min-h-[64px]") : "min-h-[108px]";
  const cardSize = compact ? (mobileLarge ? "smL" : "xs") : "md";
  return (
    <div className={`flex gap-0.5 justify-center items-end py-0.5 overflow-x-auto ${handMinH}`}>
      {cards.map((card) => (
        <Card
          key={card.instanceId}
          card={card}
          size={cardSize}
          onClick={() => onCardClick && onCardClick(card)}
          onViewDetails={onViewDetails}
          selected={selectedCard?.instanceId === card.instanceId}
          playable={playableCards.some((c) => c?.instanceId === card.instanceId)}
          draggable={playableCards.some((c) => c?.instanceId === card.instanceId)}
          onDragStart={onDragStart ? (e) => onDragStart(e, card) : undefined}
        />
      ))}
    </div>
  );
}
