export const PHASES = [
  { id: "draw", label: "抽牌", short: "DP" },
  { id: "standby", label: "准备", short: "SP" },
  { id: "main1", label: "主阶段1", short: "M1" },
  { id: "battle", label: "战斗", short: "BP" },
  { id: "main2", label: "主阶段2", short: "M2" },
  { id: "end", label: "结束", short: "EP" },
];

export default function PhaseIndicator({ currentPhase, onNextPhase }) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const canAdvance = currentIndex >= 0 && currentIndex < PHASES.length - 1;
  const isAutoPhase = currentPhase === "draw" || currentPhase === "standby";

  return (
    <div className="flex gap-1 items-center px-2 py-1 bg-slate-800 rounded-lg">
      <div className="flex gap-0.5">
        {PHASES.map((phase) => (
          <div
            key={phase.id}
            className={`px-2 py-0.5 rounded text-xs font-medium cursor-default ${
              currentPhase === phase.id
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-700 text-slate-400"
            }`}
            title={phase.label}
          >
            {phase.short}
          </div>
        ))}
      </div>
      {canAdvance && !isAutoPhase && onNextPhase && (
        <button
          className="px-2 py-0.5 bg-slate-600 text-white rounded hover:bg-slate-500 text-xs"
          onClick={onNextPhase}
        >
          下一阶段
        </button>
      )}
    </div>
  );
}
