// Chain system - LIFO resolution
// Spell Speed: Trap/Quick-Play > Normal Spell

export const SPELL_SPEED = {
  NORMAL: 1,
  QUICKPLAY: 2,
  TRAP: 2,
  COUNTER: 3,
};

export function canChain(currentChain, newCard) {
  if (currentChain.length === 0) return true;
  const lastSpeed = getSpellSpeed(currentChain[currentChain.length - 1]);
  const newSpeed = getSpellSpeed(newCard);
  return newSpeed >= lastSpeed;
}

function getSpellSpeed(card) {
  if (!card) return 0;
  if (card.type === "trap") {
    return card.trapType === "counter" ? SPELL_SPEED.COUNTER : SPELL_SPEED.TRAP;
  }
  if (card.type === "spell") {
    return card.spellType === "quickplay" ? SPELL_SPEED.QUICKPLAY : SPELL_SPEED.NORMAL;
  }
  return 0;
}

export function resolveChain(chain) {
  // LIFO - process in reverse order
  return [...chain].reverse();
}
