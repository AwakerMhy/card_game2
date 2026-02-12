/** Show damage near the injured player's LP. damageTargetPlayerId: "player1" | "player2" */
export default function DamageDisplay({ amount, damageTargetPlayerId }) {
  if (!amount || amount <= 0 || !damageTargetPlayerId) return null;
  const isPlayer1 = damageTargetPlayerId === "player1";
  return (
    <div
      className={`fixed animate-damage-flash text-red-500 font-bold text-3xl pointer-events-none z-30 ${
        isPlayer1 ? "bottom-24 left-20" : "top-24 right-20"
      }`}
    >
      -{amount}
    </div>
  );
}
