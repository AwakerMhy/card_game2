import { useEffect } from "react";
import Card from "./Card.jsx";

/** Modal to select hand card(s) to discard (e.g. 闪电漩涡) */
export default function HandSelectModal({ hand = [], title = "选择要舍弃的手牌", onSelect, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!hand?.length) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-600 font-bold text-amber-400">{title}</div>
        <div className="p-4 overflow-auto flex-1 flex flex-wrap gap-2 justify-center">
          {hand.map((card, index) => (
            <div
              key={card.instanceId}
              onClick={() => onSelect?.(card, index)}
              className="cursor-pointer hover:ring-2 hover:ring-amber-500 rounded"
            >
              <Card card={card} size="md" />
            </div>
          ))}
        </div>
        <div className="p-3 bg-slate-700 text-center">
          <button className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
