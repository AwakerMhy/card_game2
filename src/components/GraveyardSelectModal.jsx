import { useEffect } from "react";
import Card from "./Card.jsx";

/** Modal to select one monster from one or two graveyards (for 102/110) */
export default function GraveyardSelectModal({ graves, title = "选择墓地中的1只怪兽", onSelect, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!graves?.length) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-600 font-bold text-amber-400">{title}</div>
        <div className="p-4 overflow-auto flex-1 flex flex-col gap-4">
          {graves.map(({ playerId, label, cards }) => {
            const monsters = (cards || []).filter((c) => c.type === "monster");
            if (monsters.length === 0) return null;
            return (
              <div key={playerId}>
                <div className="text-slate-400 text-sm mb-2">{label} 墓地</div>
                <div className="flex flex-wrap gap-2">
                  {monsters.map((card) => (
                    <div
                      key={card.instanceId}
                      onClick={() => onSelect?.(card, playerId)}
                      className="cursor-pointer hover:ring-2 hover:ring-amber-500 rounded"
                    >
                      <Card card={card} size="md" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
