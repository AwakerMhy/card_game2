// Summon validation logic
// Lvl 1-4: no tribute, Lvl 5-6: 1 tribute, Lvl 7+: 2 tributes

export function getTributeCount(level) {
  if (level <= 4) return 0;
  if (level <= 6) return 1;
  return 2;
}

export function canNormalSummon(state, playerId, card) {
  if (!state.canNormalSummon) return false;
  const player = state.players[playerId];
  const tributeCount = getTributeCount(card.level);
  const monsterCount = player.monsterZones.filter((z) => z !== null).length;

  if (tributeCount === 0) {
    return monsterCount < 5; // Need empty zone
  }

  return monsterCount >= tributeCount && monsterCount < 5;
}

// Get indices of monsters that can be tributed
export function getTributeableIndices(player, count) {
  const indices = player.monsterZones
    .map((z, i) => (z ? i : -1))
    .filter((i) => i >= 0);
  if (indices.length < count) return [];
  // For simplicity, return first N - combinations would need more logic
  return indices.slice(0, count);
}
