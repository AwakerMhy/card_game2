import { useEffect } from "react";
import Card from "./Card.jsx";

/** Modal to select one card from deck (for 002, 011, 012 effects) - add to hand then shuffle deck */
export default function DeckSearchModal({ playerId, cards, title = "从卡组选择1张卡加入手牌", onSelect, onClose, isOptional = false }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && isOptional) onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isOptional]);

  if (!cards?.length) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={isOptional ? onClose : undefined}>
      <div
        className="bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-600 font-bold text-amber-400">{title}</div>
        <div className="p-4 overflow-auto flex-1 flex flex-wrap gap-2 justify-center">
          {cards.map((card) => (
            <div
              key={card.instanceId}
              onClick={() => onSelect?.(card)}
              className="cursor-pointer hover:ring-2 hover:ring-amber-500 rounded transition-all"
            >
              <Card card={{ ...card, faceDown: false }} faceDown={false} upright size="md" />
            </div>
          ))}
        </div>
        <div className="p-3 bg-slate-700 flex justify-center gap-2">
          {isOptional ? (
            <>
              <button className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500" onClick={onClose}>
                不加入
              </button>
              <button className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500" onClick={onClose}>
                取消
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">选择1张卡加入手牌</p>
          )}
        </div>
      </div>
    </div>
  );
}
