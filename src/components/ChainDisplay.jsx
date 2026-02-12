import Card from "./Card.jsx";

export default function ChainDisplay({ chain, onResolve }) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800/95 p-4 rounded-lg border-2 border-amber-500 z-20">
      <div className="text-amber-400 font-bold mb-2">连锁 ({chain.length})</div>
      <div className="flex gap-2 flex-wrap justify-center">
        {chain.map((link, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-xs text-slate-400">链 {i + 1}</span>
            <Card card={link.card} size="sm" />
          </div>
        ))}
      </div>
      {onResolve && (
        <button
          className="mt-2 w-full py-2 bg-amber-500 text-slate-900 font-bold rounded hover:bg-amber-400"
          onClick={onResolve}
        >
          结算连锁
        </button>
      )}
    </div>
  );
}
