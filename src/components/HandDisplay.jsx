import Card from "./Card.jsx";

export default function HandDisplay({
  cards,
  onCardClick,
  onViewDetails,
  playableCards = [],
  selectedCard,
  onDragStart,
}) {
  return (
    <div className="flex gap-2 justify-center items-end min-h-[100px] py-2">
      {cards.map((card) => (
        <Card
          key={card.instanceId}
          card={card}
          size="md"
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
