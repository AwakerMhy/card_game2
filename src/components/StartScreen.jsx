import { useState } from "react";
import CardBrowser from "./CardBrowser.jsx";
import DeckEditor from "./DeckEditor.jsx";

const CUSTOM_DECK_KEY = "cardGame_customDeck";

export default function StartScreen({ onStart }) {
  const [vsAI, setVsAI] = useState(true);
  const [showCardBrowser, setShowCardBrowser] = useState(false);
  const [showDeckEditor, setShowDeckEditor] = useState(false);
  const [useCustomDeck, setUseCustomDeck] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cardGame_useCustomDeck") ?? "false");
    } catch {
      return false;
    }
  });
  const [customDeckIds, setCustomDeckIds] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DECK_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [mobileLayout, setMobileLayout] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cardGame_mobileLayout") ?? "false");
    } catch {
      return false;
    }
  });

  const handleDeckSave = (deckIds) => {
    setCustomDeckIds(deckIds);
    try {
      localStorage.setItem(CUSTOM_DECK_KEY, JSON.stringify(deckIds));
    } catch (_) {}
    setShowDeckEditor(false);
  };

  const handleUseCustomDeckChange = (value) => {
    setUseCustomDeck(value);
    try {
      localStorage.setItem("cardGame_useCustomDeck", JSON.stringify(value));
    } catch (_) {}
  };

  const handleMobileLayoutChange = (e) => {
    const value = e.target.checked;
    setMobileLayout(value);
    try {
      localStorage.setItem("cardGame_mobileLayout", JSON.stringify(value));
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-400 tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            决斗
          </h1>
          <p className="mt-2 text-slate-400 text-sm tracking-widest">CARD GAME</p>
        </div>

        {/* 边框装饰 */}
        <div className="w-full max-w-sm border-2 border-amber-700/60 rounded-xl bg-slate-900/80 backdrop-blur-sm shadow-xl shadow-amber-900/20 p-8">
          <div className="flex flex-col gap-6">
            <p className="text-amber-200/90 text-center text-sm font-medium">选择对战模式</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setVsAI(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  vsAI
                    ? "bg-amber-600 text-slate-900 ring-2 ring-amber-500"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                }`}
              >
                对战 AI
              </button>
              <button
                onClick={() => setVsAI(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !vsAI
                    ? "bg-amber-600 text-slate-900 ring-2 ring-amber-500"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
                }`}
              >
                双人对战
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-amber-200/90 text-center text-sm font-medium">卡组</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleUseCustomDeckChange(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    !useCustomDeck
                      ? "bg-amber-600 text-slate-900 ring-2 ring-amber-500"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  默认卡组
                </button>
                <button
                  onClick={() => handleUseCustomDeckChange(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    useCustomDeck
                      ? "bg-amber-600 text-slate-900 ring-2 ring-amber-500"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  自定义卡组
                </button>
              </div>
              {useCustomDeck && (
                <button
                  onClick={() => setShowDeckEditor(true)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-600 hover:bg-slate-500 text-amber-200 text-sm"
                >
                  编辑卡组 ({customDeckIds.length} 张)
                </button>
              )}
            </div>

            <label className="flex items-center justify-center gap-2 text-slate-400 cursor-pointer text-sm hover:text-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={mobileLayout}
                onChange={handleMobileLayoutChange}
                className="rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>适配移动端</span>
            </label>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={() =>
            onStart?.({
              vsAI,
              mobileLayout,
              customDeckIds: useCustomDeck && customDeckIds.length >= 15 ? customDeckIds : null,
            })
          }
          disabled={useCustomDeck && (customDeckIds.length < 15 || customDeckIds.length > 25)}
          className="py-4 px-12 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold text-lg shadow-lg shadow-amber-900/30 hover:shadow-amber-500/20 transition-all hover:scale-105 active:scale-[0.98]"
        >
          开始决斗
        </button>

        <button
          onClick={() => setShowCardBrowser(true)}
          className="text-slate-400 hover:text-amber-400 text-sm underline underline-offset-2 transition-colors"
        >
          卡牌图鉴
        </button>

        <p className="text-slate-500 text-xs mt-2">游戏王风格卡牌对战</p>
      </div>

      {showCardBrowser && <CardBrowser onClose={() => setShowCardBrowser(false)} />}
      {showDeckEditor && (
        <DeckEditor
          deckIds={customDeckIds}
          onSave={handleDeckSave}
          onClose={() => setShowDeckEditor(false)}
        />
      )}
    </div>
  );
}
