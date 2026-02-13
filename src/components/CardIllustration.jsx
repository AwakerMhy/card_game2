/**
 * 简约几何风格卡图 - 正方形、无文字、纯几何形状
 */

export default function CardIllustration({ cardId, className = "" }) {
  const svgs = ILLUSTRATIONS[cardId];
  return (
    <svg viewBox="0 0 64 64" className={className} preserveAspectRatio="xMidYMid meet">
      {svgs || (
        <circle cx="32" cy="32" r="16" fill="#d1d5db" opacity="0.5" />
      )}
    </svg>
  );
}

// 各卡牌的简约几何插图 (viewBox 64x64)
const ILLUSTRATIONS = {
  "001": (
    <>
      <ellipse cx="32" cy="28" rx="16" ry="8" fill="#60a5fa" opacity="0.9" />
      <polygon points="16,36 32,52 48,36" fill="#93c5fd" opacity="0.8" />
      <circle cx="32" cy="20" r="4" fill="#fff" opacity="0.9" />
    </>
  ),
  "002": (
    <>
      <rect x="24" y="12" width="16" height="24" fill="#4c1d95" rx="2" />
      <polygon points="32,8 36,16 44,16 38,22 40,30 32,26 24,30 26,22 20,16 28,16" fill="#7c3aed" />
      <rect x="28" y="42" width="8" height="14" fill="#5b21b6" rx="1" />
    </>
  ),
  "003": (
    <>
      <rect x="20" y="8" width="24" height="32" fill="#312e81" rx="2" />
      <polygon points="32,16 44,28 20,28" fill="#4338ca" />
      <rect x="26" y="42" width="12" height="12" fill="#4f46e5" rx="1" />
    </>
  ),
  "004": (
    <>
      <ellipse cx="32" cy="26" rx="14" ry="8" fill="#991b1b" opacity="0.9" />
      <polygon points="18,34 32,50 46,34" fill="#dc2626" opacity="0.8" />
      <circle cx="32" cy="20" r="3" fill="#fbbf24" />
    </>
  ),
  "005": (
    <>
      <rect x="20" y="16" width="24" height="28" fill="#365314" rx="2" />
      <polygon points="32,8 38,20 26,20" fill="#65a30d" />
      <rect x="28" y="24" width="8" height="20" fill="#4d7c0f" rx="1" />
    </>
  ),
  "006": (
    <>
      <polygon points="32,4 48,32 32,60 16,32" fill="#581c87" />
      <polygon points="32,12 42,32 32,52 22,32" fill="#7e22ce" />
      <line x1="32" y1="8" x2="32" y2="56" stroke="#fbbf24" strokeWidth="2" />
    </>
  ),
  "007": (
    <>
      <circle cx="32" cy="32" r="18" fill="#374151" />
      <circle cx="32" cy="32" r="12" fill="#4b5563" />
      <ellipse cx="32" cy="28" rx="4" ry="3" fill="#6b7280" />
    </>
  ),
  "008": (
    <>
      <ellipse cx="32" cy="28" rx="20" ry="12" fill="#78350f" />
      <polygon points="12,36 20,52 44,52 52,36" fill="#92400e" />
      <polygon points="24,24 32,8 40,24" fill="#a16207" stroke="#78350f" strokeWidth="1" />
    </>
  ),
  "009": (
    <>
      <circle cx="32" cy="32" r="16" fill="#fef3c7" opacity="0.9" />
      <polygon points="32,16 38,28 50,28 40,36 44,48 32,42 20,48 24,36 14,28 26,28" fill="#fde68a" />
    </>
  ),
  "010": (
    <>
      <circle cx="32" cy="32" r="14" fill="#fef9c3" />
      <ellipse cx="32" cy="26" rx="8" ry="6" fill="#fef08a" />
      <path d="M24 36 Q32 44 40 36" stroke="#fde047" strokeWidth="2" fill="none" />
    </>
  ),
  "011": (
    <>
      <circle cx="32" cy="32" r="18" fill="#1f2937" />
      <circle cx="24" cy="26" r="6" fill="#4b5563" />
      <circle cx="40" cy="26" r="6" fill="#4b5563" />
      <circle cx="32" cy="40" r="6" fill="#4b5563" />
    </>
  ),
  "012": (
    <>
      <polygon points="32,8 48,28 40,56 24,56 16,28" fill="#422006" />
      <polygon points="32,18 42,32 38,50 26,50 22,32" fill="#78350f" />
      <circle cx="32" cy="32" r="4" fill="#92400e" />
    </>
  ),
  "013": (
    <>
      <polygon points="32,8 44,24 56,24 46,36 50,52 32,44 14,52 18,36 8,24 20,24" fill="#fbbf24" />
      <polygon points="32,20 38,30 48,30 40,38 43,48 32,42 21,48 24,38 16,30 26,30" fill="#fcd34d" />
    </>
  ),
  "014": (
    <>
      <rect x="14" y="20" width="36" height="24" fill="#b45309" rx="4" />
      <ellipse cx="32" cy="28" rx="14" ry="8" fill="#d97706" />
      <rect x="26" y="8" width="12" height="16" fill="#ea580c" rx="2" />
    </>
  ),
  "015": (
    <>
      <polygon points="32,4 56,32 32,60 8,32" fill="#1f2937" />
      <polygon points="32,16 48,32 32,48 16,32" fill="#374151" opacity="0.8" />
      <circle cx="32" cy="32" r="6" fill="#4b5563" />
    </>
  ),
  "016": (
    <>
      <rect x="18" y="8" width="28" height="48" fill="#44403c" rx="2" />
      <rect x="22" y="12" width="20" height="40" fill="#57534e" rx="1" />
      <rect x="26" y="16" width="12" height="32" fill="#78716c" rx="1" />
    </>
  ),
  "017": (
    <>
      <circle cx="32" cy="24" r="12" fill="#1f2937" />
      <polygon points="20,36 32,56 44,36" fill="#374151" />
      <polygon points="26,28 32,20 38,28" fill="#4b5563" />
    </>
  ),
  "018": (
    <>
      <rect x="12" y="16" width="40" height="32" fill="#312e81" rx="2" opacity="0.8" />
      <path d="M20 32 L32 20 L44 32 L32 44 Z" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="32" cy="32" r="4" fill="#818cf8" opacity="0.6" />
    </>
  ),
  "019": (
    <>
      <circle cx="32" cy="20" r="10" fill="#1f2937" />
      <rect x="22" y="32" width="20" height="24" fill="#374151" rx="2" />
      <circle cx="28" cy="42" r="3" fill="#4b5563" />
      <circle cx="36" cy="42" r="3" fill="#4b5563" />
    </>
  ),
  "020": (
    <>
      <polygon points="32,4 52,24 52,44 32,60 12,44 12,24" fill="#44403c" />
      <polygon points="32,14 46,26 46,42 32,52 18,42 18,26" fill="#57534e" />
      <rect x="28" y="28" width="8" height="16" fill="#78716c" rx="1" />
    </>
  ),
  "101": (
    <>
      <ellipse cx="32" cy="36" rx="18" ry="12" fill="#065f46" />
      <ellipse cx="32" cy="34" rx="12" ry="8" fill="#047857" />
      <rect x="28" y="12" width="8" height="16" fill="#059669" rx="2" />
    </>
  ),
  "102": (
    <>
      <circle cx="32" cy="28" r="12" fill="#047857" />
      <path d="M32 16 L32 40 M24 28 L32 20 L40 28" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="32" cy="36" r="4" fill="#34d399" />
    </>
  ),
  "103": (
    <>
      <circle cx="32" cy="32" r="20" fill="#1f2937" />
      <circle cx="32" cy="32" r="12" fill="#374151" />
      <circle cx="32" cy="32" r="4" fill="#4b5563" />
    </>
  ),
  "104": (
    <>
      <polygon points="32,4 38,24 56,24 42,36 48,56 32,46 16,56 22,36 8,24 26,24" fill="#fbbf24" />
      <polygon points="32,14 36,26 48,26 38,34 42,48 32,40 22,48 26,34 16,26 28,26" fill="#fcd34d" />
    </>
  ),
  "105": (
    <>
      <rect x="8" y="20" width="48" height="8" fill="#fef3c7" rx="1" />
      <rect x="8" y="36" width="48" height="8" fill="#fde68a" rx="1" />
      <line x1="32" y1="8" x2="32" y2="56" stroke="#fcd34d" strokeWidth="2" />
    </>
  ),
  "106": (
    <>
      <path d="M16 48 Q32 16 48 48 Q32 32 16 48" fill="none" stroke="#10b981" strokeWidth="3" />
      <circle cx="32" cy="20" r="4" fill="#34d399" />
    </>
  ),
  "107": (
    <>
      <circle cx="20" cy="24" r="8" fill="#fef3c7" opacity="0.8" />
      <circle cx="44" cy="24" r="8" fill="#fef3c7" opacity="0.8" />
      <circle cx="32" cy="44" r="8" fill="#fde68a" opacity="0.8" />
      <path d="M20 24 L32 44 M44 24 L32 44" stroke="#fcd34d" strokeWidth="1" opacity="0.6" />
    </>
  ),
  "108": (
    <>
      <circle cx="24" cy="28" r="10" fill="#7c3aed" opacity="0.7" />
      <circle cx="40" cy="28" r="10" fill="#8b5cf6" opacity="0.7" />
      <polygon points="32,36 24,48 40,48" fill="#a78bfa" opacity="0.8" />
    </>
  ),
  "109": (
    <>
      <path d="M20 40 Q32 16 44 40" fill="none" stroke="#8b5cf6" strokeWidth="2" />
      <circle cx="32" cy="24" r="6" fill="#a78bfa" />
      <ellipse cx="32" cy="44" rx="8" ry="4" fill="#c4b5fd" opacity="0.6" />
    </>
  ),
  "110": (
    <>
      <rect x="18" y="12" width="28" height="36" fill="#047857" rx="2" />
      <path d="M32 24 L32 44 M26 34 L32 28 L38 34" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="32" cy="48" r="3" fill="#34d399" />
    </>
  ),
  "111": (
    <>
      <rect x="12" y="16" width="40" height="32" fill="#1e3a5f" rx="2" />
      <circle cx="32" cy="32" r="10" fill="#1e40af" opacity="0.8" />
      <path d="M24 28 L32 36 L40 28" stroke="#3b82f6" strokeWidth="1" fill="none" />
    </>
  ),
  "112": (
    <>
      <polygon points="32,8 44,24 40,44 24,44 20,24" fill="#78350f" />
      <line x1="20" y1="24" x2="44" y2="24" stroke="#fbbf24" strokeWidth="2" />
      <line x1="32" y1="8" x2="32" y2="44" stroke="#fbbf24" strokeWidth="2" />
    </>
  ),
  "113": (
    <>
      <rect x="22" y="28" width="20" height="16" fill="#44403c" rx="2" />
      <path d="M16 20 L48 20" stroke="#78716c" strokeWidth="2" />
      <polygon points="28,20 32,12 36,20" fill="#57534e" />
    </>
  ),
  "114": (
    <>
      <rect x="16" y="20" width="32" height="24" fill="#7f1d1d" rx="2" />
      <circle cx="24" cy="32" r="4" fill="#991b1b" />
      <circle cx="40" cy="32" r="4" fill="#991b1b" />
      <path d="M28 32 L36 32" stroke="#b91c1c" strokeWidth="1" strokeDasharray="2 2" />
    </>
  ),
  "115": (
    <>
      <polygon points="32,8 56,32 32,56 8,32" fill="#7f1d1d" />
      <polygon points="32,18 48,32 32,46 16,32" fill="#991b1b" opacity="0.8" />
      <rect x="28" y="28" width="8" height="8" fill="#dc2626" rx="1" />
    </>
  ),
};
