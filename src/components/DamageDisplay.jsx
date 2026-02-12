export default function DamageDisplay({ amount, isOpponent }) {
  if (!amount || amount <= 0) return null;

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 animate-damage-flash text-red-500 font-bold text-3xl pointer-events-none z-30 ${
        isOpponent ? "top-32" : "bottom-40"
      }`}
    >
      -{amount}
    </div>
  );
}
