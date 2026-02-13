import { useState, useMemo, useEffect } from "react";
import { CARD_DATABASE } from "../data/cardDatabase.js";
import { ATTRIBUTES, RACES_FULL } from "../utils/cardDisplay.js";
import Card from "./Card.jsx";
import CardDetailPanel from "./CardDetailPanel.jsx";

const SPELL_TYPES = { normal: "通常", quickplay: "速攻", equip: "装备", field: "场地", continuous: "永续" };
const TRAP_TYPES = { normal: "通常", counter: "反击", continuous: "永续" };

function getSearchableText(c) {
  const parts = [c.name, c.effect];
  if (c.type === "monster") {
    parts.push(ATTRIBUTES[c.attribute] || c.attribute, RACES_FULL[c.race] || c.race);
  } else if (c.type === "spell") {
    parts.push(SPELL_TYPES[c.spellType] || c.spellType, "魔法");
  } else if (c.type === "trap") {
    parts.push(TRAP_TYPES[c.trapType] || c.trapType, "陷阱");
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export default function CardBrowser({ onClose }) {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewingCard, setViewingCard] = useState(null);

  const filteredCards = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const byType =
      typeFilter === "all"
        ? CARD_DATABASE
        : typeFilter === "monster"
          ? CARD_DATABASE.filter((c) => c.type === "monster")
          : typeFilter === "spell"
            ? CARD_DATABASE.filter((c) => c.type === "spell")
            : CARD_DATABASE.filter((c) => c.type === "trap");

    if (!q) return byType;
    return byType.filter((c) => getSearchableText(c).includes(q));
  }, [searchText, typeFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (viewingCard) setViewingCard(null);
        else onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewingCard, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex flex-col z-[100]"
      onClick={(e) => e.target === e.currentTarget && !viewingCard && onClose?.()}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold text-amber-400">卡牌图鉴</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索卡名、效果、属性..."
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-amber-100 placeholder-slate-500 w-full sm:w-64 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-amber-100"
            >
              <option value="all">全部</option>
              <option value="monster">怪兽</option>
              <option value="spell">魔法</option>
              <option value="trap">陷阱</option>
            </select>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg shrink-0"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="flex flex-wrap gap-2 justify-center p-2">
              {filteredCards.length === 0 ? (
                <div className="text-slate-400 py-12">未找到匹配的卡牌</div>
              ) : (
                filteredCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setViewingCard(card)}
                    className="cursor-pointer hover:ring-2 hover:ring-amber-500 rounded transition-all"
                  >
                    <Card card={{ ...card, instanceId: card.id }} upright size="md" />
                  </div>
                ))
              )}
            </div>
          </div>

          {viewingCard && (
            <div className="w-52 shrink-0 flex flex-col">
              <CardDetailPanel card={viewingCard} onClear={() => setViewingCard(null)} />
            </div>
          )}
        </div>

        <div className="text-slate-500 text-xs mt-2 shrink-0">
          共 {filteredCards.length} 张 / {CARD_DATABASE.length} 张
        </div>
      </div>
    </div>
  );
}
