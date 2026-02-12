export const PHASES = [
  { id: "draw", label: "抽牌", short: "DP" },
  { id: "standby", label: "准备", short: "SP" },
  { id: "main1", label: "主阶段1", short: "M1" },
  { id: "battle", label: "战斗", short: "BP" },
  { id: "main2", label: "主阶段2", short: "M2" },
  { id: "end", label: "结束", short: "EP" },
];

export default function PhaseIndicator({ currentPhase, onPhaseChange, onNextPhase }) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const canAdvance = currentIndex >= 0 && currentIndex < PHASES.length - 1;

  return (
    <div className="flex gap-2 items-center p-2 bg-slate-800 rounded-lg">
      <div className="flex gap-1">
        {PHASES.map((phase) => (
          <button
            key={phase.id}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentPhase === phase.id
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            onClick={() => onPhaseChange && onPhaseChange(phase.id)}
            title={phase.label}
          >
            {phase.short}
          </button>
        ))}
      </div>
      {canAdvance && onNextPhase && (
        <button
          className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
          onClick={onNextPhase}
        >
          下一阶段
        </button>
      )}
    </div>
  );
}
