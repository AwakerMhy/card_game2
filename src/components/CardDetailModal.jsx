import { useEffect } from "react";
import { ATTRIBUTES, RACES_FULL } from "../utils/cardDisplay.js";

const SPELL_TYPES = { normal: "通常", quickplay: "速攻", equip: "装备", field: "场地", continuous: "永续" };
const TRAP_TYPES = { normal: "通常", counter: "反击", continuous: "永续" };

export default function CardDetailModal({ card, onClose, onActivate, canActivate }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const actualCard = card?.card || card;
  if (!actualCard) return null;

  const isMonster = actualCard.type === "monster";
  const isSpell = actualCard.type === "spell";
  const isTrap = actualCard.type === "trap";
  const bgColor = isMonster ? "bg-amber-50" : isSpell ? "bg-emerald-50" : "bg-rose-50";
  const c = actualCard;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${bgColor} border-2 border-amber-800 rounded-lg shadow-2xl max-w-sm w-full overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-amber-200">
          <div className="font-bold text-lg">{c.name}</div>
          <div className="text-sm text-slate-600 mt-1">
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
        <div className="p-4">
          {isMonster && (
            <div className="flex justify-between font-bold text-slate-700">
              <span>攻击力 {c.atk}</span>
              <span>守备力 {c.def}</span>
            </div>
          )}
          {(c.effect || (isMonster && c.monsterType === "effect")) && (
            <div className="mt-3 text-sm text-slate-700 leading-relaxed">
              <div className="font-medium text-slate-600 mb-1">效果</div>
              {c.effect || "（无效果描述）"}
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-100 text-center flex gap-2 justify-center flex-wrap">
          {canActivate && onActivate && (
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
              onClick={() => { onActivate(); onClose?.(); }}
            >
              发动
            </button>
          )}
          <button
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
