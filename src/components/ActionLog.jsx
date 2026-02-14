export default function ActionLog({ entries = [], maxEntries = 16, mobileLayout = false, mobileLarge = false }) {
  const display = entries.slice(-maxEntries).reverse();
  const mobileMaxH = mobileLarge ? "max-h-32" : "max-h-24";

  return (
    <div
      className={`fixed overflow-auto bg-slate-800/95 rounded-lg border border-slate-600 shadow-lg z-40 ${
        mobileLayout
          ? `bottom-2 left-2 right-2 w-auto ${mobileMaxH}`
          : "bottom-2 right-2 w-56 max-h-48"
      } text-xs`}
    >
      <div className={`p-2 font-bold text-amber-400 border-b border-slate-600 sticky top-0 bg-slate-800 ${mobileLayout && mobileLarge ? "text-sm" : "text-xs"}`}>
        操作记录
      </div>
      <div className="p-2 space-y-1 text-sm">
        {display.length === 0 ? (
          <div className={`text-slate-500 py-2 ${mobileLayout && mobileLarge ? "text-sm" : "text-xs"}`}>暂无记录</div>
        ) : (
          display.map((entry, i) => (
            <div
              key={i}
              className={`py-1 px-2 rounded ${mobileLayout && mobileLarge ? "text-sm" : "text-xs"} ${
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
