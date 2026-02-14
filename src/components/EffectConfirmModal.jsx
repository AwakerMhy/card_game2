import { useEffect } from "react";

/** Modal to ask whether to activate deck search effect (002, 011, 012) */
export default function EffectConfirmModal({ cardName = "", onConfirm, onDecline }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onDecline?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDecline]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onDecline}>
      <div
        className="bg-slate-800 rounded-lg shadow-2xl px-8 py-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-amber-400 font-bold text-center mb-4">是否发动 {cardName} 的效果？</div>
        <div className="flex gap-3 justify-center">
          <button
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-medium"
            onClick={onConfirm}
          >
            发动
          </button>
          <button
            className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 font-medium"
            onClick={onDecline}
          >
            不发动
          </button>
        </div>
      </div>
    </div>
  );
}
