import { useState, useMemo } from "react";
import { CARD_DATABASE } from "../data/cardDatabase.js";
import Card from "./Card.jsx";

const DECK_MIN = 15;
const DECK_MAX = 25;
const MAX_COPIES = 3;

export default function DeckEditor({ deckIds = [], onSave, onClose }) {
  const [deck, setDeck] = useState([...deckIds]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredPool = useMemo(() => {
    let cards = CARD_DATABASE;
    if (filter === "monster") cards = cards.filter((c) => c.type === "monster");
    else if (filter === "spell") cards = cards.filter((c) => c.type === "spell");
    else if (filter === "trap") cards = cards.filter((c) => c.type === "trap");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      cards = cards.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.effect || "").toLowerCase().includes(q)
      );
    }
    return cards;
  }, [filter, search]);

  const countInDeck = (id) => deck.filter((x) => x === id).length;

  const addCard = (id) => {
    const count = countInDeck(id);
    if (count >= MAX_COPIES) return;
    if (deck.length >= DECK_MAX) return;
    setDeck([...deck, id]);
  };

  const removeCard = (index) => {
    setDeck(deck.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (deck.length < DECK_MIN || deck.length > DECK_MAX) return;
    onSave?.(deck);
    onClose?.();
  };

  const canSave = deck.length >= DECK_MIN && deck.length <= DECK_MAX;

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col z-[100]">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold text-amber-400">卡组编辑</h2>
          <div className="flex gap-2 items-center">
            <span
              className={`text-sm ${deck.length >= DECK_MIN && deck.length <= DECK_MAX ? "text-amber-200" : "text-red-400"}`}
            >
              {deck.length} / {DECK_MIN}-{DECK_MAX} 张
            </span>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-medium rounded-lg"
            >
              保存卡组
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">
              取消
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* 卡组区 */}
          <div className="w-48 shrink-0 flex flex-col border border-slate-600 rounded-lg bg-slate-800/80 p-3">
            <div className="font-bold text-amber-400 mb-2">当前卡组</div>
            <div className="flex-1 overflow-auto space-y-1 max-h-48">
              {deck.map((id, i) => {
                const card = CARD_DATABASE.find((c) => c.id === id);
                return (
                  <div
                    key={`${id}-${i}`}
                    className="flex items-center gap-1 group cursor-pointer hover:bg-slate-700 rounded p-1"
                    onClick={() => removeCard(i)}
                  >
                    <span className="text-amber-200 text-xs truncate flex-1">{card?.name || id}</span>
                    <span className="text-red-400 text-xs opacity-0 group-hover:opacity-100">×</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 卡池区 */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex gap-2 mb-2 shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..."
                className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-amber-100 text-sm"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-amber-100 text-sm"
              >
                <option value="all">全部</option>
                <option value="monster">怪兽</option>
                <option value="spell">魔法</option>
                <option value="trap">陷阱</option>
              </select>
            </div>
            <div className="flex-1 overflow-auto flex flex-wrap gap-1 justify-start content-start">
              {filteredPool.map((card) => {
                const count = countInDeck(card.id);
                const canAdd = count < MAX_COPIES && deck.length < DECK_MAX;
                return (
                  <div
                    key={card.id}
                    onClick={() => canAdd && addCard(card.id)}
                    className={`cursor-pointer rounded ${canAdd ? "hover:ring-2 hover:ring-amber-500" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <div className="relative">
                      <Card card={{ ...card, instanceId: card.id }} upright size="md" />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-600 text-slate-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
