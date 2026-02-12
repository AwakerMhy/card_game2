import GameBoard from "./components/GameBoard.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 py-4 text-center">
        <h1 className="text-2xl font-bold text-amber-400">Yu-Gi-Oh 卡牌游戏</h1>
      </header>
      <main>
        <GameBoard />
      </main>
    </div>
  );
}
