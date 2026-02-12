// Monster effect triggers - called from reducer after summon / send to grave

import { searchDeckAddToHand } from "./gameState.js";

/** When this monster was just normal summoned: apply "on summon" effects (e.g. 002). */
export function applyOnSummon(state, playerId, card) {
  if (!card) return state;
  const id = String(card.id ?? "");
  if (id === "002") {
    return searchDeckAddToHand(state, playerId, (c) => c.type === "spell" || c.type === "trap");
  }
  return state;
}

/** When this card was just sent to graveyard: apply "when sent to grave" effects (011, 012). */
export function applyGraveyardEffect(state, playerId, card) {
  if (!card) return state;
  const id = String(card.id ?? "");
  if (id === "011") {
    return searchDeckAddToHand(state, playerId, (c) => c.type === "monster" && (c.atk ?? 0) <= 1500);
  }
  if (id === "012") {
    return searchDeckAddToHand(state, playerId, (c) => c.type === "monster" && (c.def ?? 0) <= 1500);
  }
  return state;
}
