import { ATTRIBUTES, RACES_FULL } from "../utils/cardDisplay.js";

const SPELL_TYPES = { normal: "通常", quickplay: "速攻", equip: "装备", field: "场地", continuous: "永续" };
const TRAP_TYPES = { normal: "通常", counter: "反击", continuous: "永续" };

export default function CardDetailPanel({ card, onClear, onActivate, canActivate, equippedMonsterName }) {
  const actualCard = card?.card || card;
  if (!actualCard) {
    return (
      <div className="w-52 rounded-lg border border-slate-600 bg-slate-800/95 p-3 text-center text-slate-500 text-sm">
        点击卡牌查看详情
      </div>
    );
  }

  const isMonster = actualCard.type === "monster";
  const isSpell = actualCard.type === "spell";
  const isTrap = actualCard.type === "trap";
  const bgColor = isMonster ? "bg-amber-50" : isSpell ? "bg-emerald-100" : "bg-rose-50";
  const c = actualCard;

  return (
    <div
      className={`${bgColor} border-2 border-amber-800 rounded-lg shadow-xl w-52 h-full overflow-hidden flex flex-col min-h-0`}
    >
      <div className="p-3 border-b border-amber-200 shrink-0">
        <div className="font-bold text-base">{c.name}</div>
        <div className="text-xs text-slate-600 mt-1">
          {isMonster && (
            <>
              {ATTRIBUTES[c.attribute] || c.attribute} / {RACES_FULL[c.race] || c.race} /{" "}
              {c.monsterType === "effect" ? "效果" : "通常"}怪兽 / 等级{c.level}
            </>
          )}
          {isSpell && <>魔法 / {SPELL_TYPES[c.spellType] || c.spellType}魔法</>}
          {isTrap && <>陷阱 / {TRAP_TYPES[c.trapType] || c.trapType}陷阱</>}
        </div>
      </div>
      <div className="p-3 overflow-auto flex-1 min-h-0">
        {isMonster && (
          <div className="flex justify-between font-bold text-slate-700 text-sm">
            <span>攻击力 {c.atk}</span>
            <span>守备力 {c.def}</span>
          </div>
        )}
        {equippedMonsterName && (
          <div className="mt-2 text-xs text-cyan-700 font-medium">
            装备于：{equippedMonsterName}
          </div>
        )}
        {(c.effect || (isMonster && c.monsterType === "effect")) && (
          <div className="mt-2 text-xs text-slate-700 leading-relaxed">
            <div className="font-medium text-slate-600 mb-1">效果</div>
            {c.effect || "（无效果描述）"}
          </div>
        )}
      </div>
      <div className="p-2 bg-slate-100 border-t border-amber-200 flex gap-2 flex-wrap shrink-0">
        {canActivate && onActivate && (
          <button
            className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-sm"
            onClick={() => onActivate()}
          >
            发动
          </button>
        )}
        {onClear && (
          <button
            className="px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
            onClick={onClear}
          >
            关闭
          </button>
        )}
      </div>
    </div>
  );
}
