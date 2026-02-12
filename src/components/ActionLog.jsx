export default function ActionLog({ entries = [], maxEntries = 8 }) {
  const display = entries.slice(-maxEntries).reverse();

  return (
    <div className="fixed bottom-4 right-4 w-52 max-h-48 overflow-auto bg-slate-800/95 rounded-lg border border-slate-600 shadow-lg z-40">
      <div className="p-2 text-xs font-bold text-amber-400 border-b border-slate-600 sticky top-0 bg-slate-800">
        操作记录
      </div>
      <div className="p-2 space-y-1 text-sm">
        {display.length === 0 ? (
          <div className="text-slate-500 text-xs py-2">暂无记录</div>
        ) : (
          display.map((entry, i) => (
            <div
              key={i}
              className={`text-xs py-1 px-2 rounded ${
                entry.source === "ai" ? "bg-slate-700/80 text-cyan-300" : "bg-slate-700/50 text-amber-100"
              }`}
            >
              {entry.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
