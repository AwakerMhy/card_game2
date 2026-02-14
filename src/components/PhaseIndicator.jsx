export const PHASES = [
  { id: "draw", label: "抽牌", short: "DP" },
  { id: "standby", label: "准备", short: "SP" },
  { id: "main1", label: "主阶段1", short: "M1" },
  { id: "battle", label: "战斗", short: "BP" },
  { id: "main2", label: "主阶段2", short: "M2" },
  { id: "end", label: "结束", short: "EP" },
];

export default function PhaseIndicator({ currentPhase, onNextPhase, isMyTurn = true, compact = false }) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const canAdvance = currentIndex >= 0 && currentIndex < PHASES.length - 1;
  const isAutoPhase = currentPhase === "draw" || currentPhase === "standby";
  const currentPhaseHighlight = isMyTurn ? "bg-blue-500 text-white" : "bg-red-500 text-white";

  return (
    <div className={`flex gap-1 items-center rounded-lg bg-slate-800 ${compact ? "px-1.5 py-0.5 gap-0.5" : "px-2 py-1"}`}>
      <div className={`flex ${compact ? "gap-0.5" : "gap-0.5"}`}>
        {PHASES.map((phase) => (
          <div
            key={phase.id}
            className={`rounded font-medium cursor-default ${
              compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
            } ${
              currentPhase === phase.id ? currentPhaseHighlight : "bg-slate-700 text-slate-400"
            }`}
            title={phase.label}
          >
            {phase.short}
          </div>
        ))}
      </div>
      {canAdvance && !isAutoPhase && onNextPhase && (
        <button
          className={`bg-slate-600 text-white rounded hover:bg-slate-500 ${compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}
          onClick={onNextPhase}
        >
          {compact ? "下一" : "下一阶段"}
        </button>
      )}
    </div>
  );
}
