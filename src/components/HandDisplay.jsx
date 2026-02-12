import Card from "./Card.jsx";

export default function HandDisplay({
  cards,
  onCardClick,
  onViewDetails,
  playableCards = [],
  selectedCard,
  onDragStart,
  compact = false,
}) {
  return (
    <div className="flex gap-0.5 justify-center items-end min-h-[108px] py-0.5 overflow-x-auto">
      {cards.map((card) => (
        <Card
          key={card.instanceId}
          card={card}
          size={compact ? "sm" : "md"}
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
