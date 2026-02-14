// Monster effect triggers - called from reducer after summon / send to grave

import { searchDeckAddToHand, getDeckSearchQualifyingCards } from "./gameState.js";

/** Returns effect trigger info if this card has deck search effect and has qualifying cards */
export function getDeckSearchEffectTrigger(state, playerId, card) {
  if (!card) return null;
  const id = String(card.id ?? "");
  if (id === "002") {
    const q = getDeckSearchQualifyingCards(state, playerId, "002");
    return q.length > 0 ? { playerId, filterType: "002", sourceCardName: card.name } : null;
  }
  if (id === "011") {
    const q = getDeckSearchQualifyingCards(state, playerId, "011");
    return q.length > 0 ? { playerId, filterType: "011", sourceCardName: card.name } : null;
  }
  if (id === "012") {
    const q = getDeckSearchQualifyingCards(state, playerId, "012");
    return q.length > 0 ? { playerId, filterType: "012", sourceCardName: card.name } : null;
  }
  return null;
}

/** When this monster was just normal summoned: apply "on summon" effects (e.g. 002). */
export function applyOnSummon(state, playerId, card, { useModal = false } = {}) {
  if (!card) return { state };
  const id = String(card.id ?? "");
  if (id === "002") {
    const trigger = getDeckSearchEffectTrigger(state, playerId, card);
    if (useModal && trigger) return { state, effectTrigger: trigger };
    return { state: searchDeckAddToHand(state, playerId, (c) => c.type === "spell" || c.type === "trap") };
  }
  return { state };
}

/** When this card was just sent to graveyard: apply "when sent to grave" effects (011, 012). */
export function applyGraveyardEffect(state, playerId, card, { useModal = false } = {}) {
  if (!card) return { state };
  const id = String(card.id ?? "");
  if (id === "011") {
    const trigger = getDeckSearchEffectTrigger(state, playerId, card);
    if (useModal && trigger) return { state, effectTrigger: trigger };
    return { state: searchDeckAddToHand(state, playerId, (c) => c.type === "monster" && (c.atk ?? 0) <= 1500) };
  }
  if (id === "012") {
    const trigger = getDeckSearchEffectTrigger(state, playerId, card);
    if (useModal && trigger) return { state, effectTrigger: trigger };
    return { state: searchDeckAddToHand(state, playerId, (c) => c.type === "monster" && (c.def ?? 0) <= 1500) };
  }
  return { state };
}
