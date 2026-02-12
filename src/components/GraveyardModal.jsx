import { useEffect } from "react";
import Card from "./Card.jsx";

export default function GraveyardModal({ cards, label, onClose, onViewCard }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!cards) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-600 font-bold text-amber-400">
          {label} - 墓地 ({cards.length}张)
        </div>
        <div className="p-4 overflow-auto flex-1 flex flex-wrap gap-2 justify-center">
          {cards.length === 0 ? (
            <div className="text-slate-400 py-8">墓地为空</div>
          ) : (
            cards.map((card) => (
              <div
                key={card.instanceId}
                onClick={() => onViewCard?.(card)}
                className="cursor-pointer"
              >
                <Card
                  card={card}
                  size="md"
                  onViewDetails={onViewCard ? () => onViewCard(card) : undefined}
                />
              </div>
            ))
          )}
        </div>
        <div className="p-3 bg-slate-700 text-center">
          <button
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
