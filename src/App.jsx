import { useState } from "react";
import GameBoard from "./components/GameBoard.jsx";
import StartScreen from "./components/StartScreen.jsx";

export default function App() {
  const [gameConfig, setGameConfig] = useState(null);

  if (!gameConfig) {
    return (
      <div className="min-h-screen bg-slate-900">
        <StartScreen onStart={(config) => setGameConfig(config)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <GameBoard
        initialVsAI={gameConfig.vsAI}
        initialMobileLayout={gameConfig.mobileLayout}
        initialDeckConfig={
          gameConfig.customDeckIds
            ? { player1DeckIds: gameConfig.customDeckIds }
            : {}
        }
        onBackToMenu={() => setGameConfig(null)}
      />
    </div>
  );
}
