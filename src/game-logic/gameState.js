// Game state management - immutable updates

import { CARD_DATABASE } from "../data/cardDatabase.js";

const STARTING_LP = 8000;
const STARTING_HAND_SIZE = 5;

// Fisher-Yates shuffle
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build starter deck: 20 cards (10 monsters, 10 spells)
export function buildStarterDeck() {
  const monsters = CARD_DATABASE.filter((c) => c.type === "monster");
  const spells = CARD_DATABASE.filter((c) => c.type === "spell");
  const deck = [
    ...shuffle(monsters).slice(0, 10).map((c) => ({ ...c, instanceId: crypto.randomUUID() })),
    ...shuffle(spells).slice(0, 10).map((c) => ({ ...c, instanceId: crypto.randomUUID() })),
  ];
  return shuffle(deck);
}

// Build deck from array of card ids
export function buildDeckFromIds(deckIds) {
  if (!deckIds?.length) return buildStarterDeck();
  const deck = deckIds
    .map((id) => {
      const card = CARD_DATABASE.find((c) => c.id === id);
      return card ? { ...card, instanceId: crypto.randomUUID() } : null;
    })
    .filter(Boolean);
  return shuffle(deck);
}

// Create initial game state. options: { player1DeckIds?: string[], player2DeckIds?: string[] }
export function createInitialState(options = {}) {
  const player1Deck = options.player1DeckIds
    ? buildDeckFromIds(options.player1DeckIds)
    : buildStarterDeck();
  const player2Deck = options.player2DeckIds
    ? buildDeckFromIds(options.player2DeckIds)
    : buildStarterDeck();

  const player1Hand = player1Deck.splice(0, STARTING_HAND_SIZE);
  const player2Hand = player2Deck.splice(0, STARTING_HAND_SIZE);

  return {
    players: {
      player1: {
        id: "player1",
        lp: STARTING_LP,
        deck: player1Deck,
        hand: player1Hand,
        monsterZones: [null, null, null, null, null],
        spellTrapZones: [null, null, null, null, null],
        graveyard: [],
        extraDeck: [],
      },
      player2: {
        id: "player2",
        lp: STARTING_LP,
        deck: player2Deck,
        hand: player2Hand,
        monsterZones: [null, null, null, null, null],
        spellTrapZones: [null, null, null, null, null],
        graveyard: [],
        extraDeck: [],
      },
    },
    currentTurn: 1,
    currentPhase: "draw",
    phaseOrder: ["draw", "standby", "main1", "battle", "main2", "end"],
    turnCount: 1,
    canNormalSummon: true,
    chain: [],
    winner: null,
    attackedMonsters: { player1: [], player2: [] },
    lightSwordActive: null,
    lightSwordCard: null,
    borrowedMonsters: [],
    pendingAttack: null,
    changedPositionThisTurn: { player1: [], player2: [] },
    pendingLogs: [],
    deckConfig: options.player1DeckIds != null ? { player1DeckIds: options.player1DeckIds, player2DeckIds: options.player2DeckIds } : null,
    pendingDeckSearch: null,
    pendingEffectConfirm: null,
    pendingEffectQueue: [],
    pendingKuribohChoice: null,
  };
}

/** Add effect to queue and set pendingEffectConfirm from first */
export function pushEffectQueue(state, trigger) {
  if (!trigger) return state;
  const queue = [...(state.pendingEffectQueue || []), trigger];
  return {
    ...state,
    pendingEffectQueue: queue,
    pendingEffectConfirm: queue.length === 1 ? queue[0] : state.pendingEffectConfirm,
  };
}

/** Pop first from queue, set pendingEffectConfirm from next */
export function popEffectQueue(state) {
  const queue = [...(state.pendingEffectQueue || [])];
  queue.shift();
  return {
    ...state,
    pendingEffectQueue: queue,
    pendingEffectConfirm: queue.length > 0 ? queue[0] : null,
  };
}

/** Get qualifying cards in deck for deck search effects (002, 011, 012) */
export function getDeckSearchQualifyingCards(state, playerId, filterType) {
  const player = state.players[playerId];
  if (!player?.deck?.length) return [];
  const pred =
    filterType === "002"
      ? (c) => c.type === "spell" || c.type === "trap"
      : filterType === "011"
        ? (c) => c.type === "monster" && (c.atk ?? 0) <= 1500
        : filterType === "012"
          ? (c) => c.type === "monster" && (c.def ?? 0) <= 1500
          : () => false;
  return player.deck.filter(pred);
}

/** Remove selected card from deck, add to hand, shuffle deck */
export function executeDeckSearchSelect(state, playerId, instanceId) {
  const player = state.players[playerId];
  const idx = player.deck.findIndex((c) => c.instanceId === instanceId);
  if (idx < 0) return { ...state, pendingDeckSearch: null };
  const [found] = player.deck.filter((c) => c.instanceId === instanceId);
  const newDeck = player.deck.filter((c) => c.instanceId !== instanceId);
  const shuffledDeck = shuffle(newDeck);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        deck: shuffledDeck,
        hand: [...player.hand, { ...found, instanceId: found.instanceId || crypto.randomUUID() }],
      },
    },
    pendingDeckSearch: null,
  };
}

// Draw card from deck
export function drawCard(state, playerId) {
  const player = state.players[playerId];
  if (player.deck.length === 0) {
    return { ...state, winner: playerId === "player1" ? "player2" : "player1" };
  }
  const [drawn, ...restDeck] = player.deck;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        deck: restDeck,
        hand: [...player.hand, drawn],
      },
    },
  };
}

// Remove card from hand
export function removeFromHand(state, playerId, instanceId) {
  const player = state.players[playerId];
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: player.hand.filter((c) => c.instanceId !== instanceId),
      },
    },
  };
}

// Add a card to a player's hand (e.g. monster returned from field)
export function addCardToHand(state, playerId, card) {
  const player = state.players[playerId];
  const c = { ...card, instanceId: card.instanceId || crypto.randomUUID() };
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: [...player.hand, c],
      },
    },
  };
}

// Remove one card from hand by index; returns { newState, card }
export function removeFromHandByIndex(state, playerId, handIndex) {
  const player = state.players[playerId];
  if (handIndex < 0 || handIndex >= player.hand.length) return { newState: state, card: null };
  const card = player.hand[handIndex];
  const newHand = player.hand.filter((_, i) => i !== handIndex);
  return {
    newState: {
      ...state,
      players: {
        ...state.players,
        [playerId]: { ...player, hand: newHand },
      },
    },
    card,
  };
}

// Remove first card from deck matching predicate and add to hand
export function searchDeckAddToHand(state, playerId, predicate) {
  const player = state.players[playerId];
  const idx = player.deck.findIndex(predicate);
  if (idx < 0) return state;
  const foundCard = player.deck[idx];
  const newDeck = player.deck.filter((_, i) => i !== idx);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        deck: newDeck,
        hand: [...player.hand, { ...foundCard, instanceId: foundCard.instanceId || crypto.randomUUID() }],
      },
    },
  };
}

// Clear spell/trap zone (returns card without sending to grave)
export function clearSpellTrapZone(state, playerId, zoneIndex) {
  const player = state.players[playerId];
  const newZones = [...player.spellTrapZones];
  const card = newZones[zoneIndex];
  newZones[zoneIndex] = null;
  return {
    newState: {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          spellTrapZones: newZones,
        },
      },
    },
    card,
  };
}

// Remove card from spell/trap zone and send to graveyard
export function removeFromSpellTrapZone(state, playerId, zoneIndex) {
  const { newState, card } = clearSpellTrapZone(state, playerId, zoneIndex);
  return card ? sendToGraveyard(newState, playerId, card) : newState;
}

// Add card to graveyard
export function sendToGraveyard(state, playerId, card) {
  const player = state.players[playerId];
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        graveyard: [...player.graveyard, card],
      },
    },
  };
}

// Place card in monster zone (position: "attack"|"defense", faceDown for 里侧守备, setOnTurn for 里侧怪兽下回合才能翻开)
export function placeMonsterZone(state, playerId, zoneIndex, card, position = "attack", faceDown = false, setOnTurn = null) {
  const player = state.players[playerId];
  const newZones = [...player.monsterZones];
  const slot = { ...card, position, faceDown: !!faceDown };
  if (faceDown && setOnTurn != null) slot.setOnTurn = setOnTurn;
  newZones[zoneIndex] = slot;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        monsterZones: newZones,
      },
    },
  };
}

// Place card in spell/trap zone (equippedToMonsterZoneIndex for equip spells like 过早的埋葬, setOnTurn for face-down)
export function placeSpellTrapZone(state, playerId, zoneIndex, card, faceDown = false, equippedToMonsterZoneIndex = null, setOnTurn = null) {
  const player = state.players[playerId];
  const newZones = [...player.spellTrapZones];
  const slot = { ...card, faceDown };
  if (equippedToMonsterZoneIndex != null) slot.equippedToMonsterZoneIndex = equippedToMonsterZoneIndex;
  if (faceDown && setOnTurn != null) slot.setOnTurn = setOnTurn;
  newZones[zoneIndex] = slot;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        spellTrapZones: newZones,
      },
    },
  };
}

// Destroy equip spells (e.g. 过早的埋葬) when equipped monster leaves the field
function destroyEquipSpellsForMonsterZone(state, playerId, zoneIndex) {
  const player = state.players[playerId];
  if (!player) return state;
  let s = state;
  const zones = player.spellTrapZones;
  for (let i = 0; i < zones.length; i++) {
    const slot = zones[i];
    if (slot && slot.equippedToMonsterZoneIndex === zoneIndex && String(slot.id) === "110") {
      const { newState, card } = clearSpellTrapZone(s, playerId, i);
      s = card ? sendToGraveyard(newState, playerId, card) : newState;
      const logSource = playerId === "player1" ? "player" : "ai";
      s = { ...s, pendingLogs: [...(s.pendingLogs || []), { text: "过早的埋葬 因装备怪兽离场送入墓地", source: logSource }] };
    }
  }
  return s;
}

// Clear monster zone (also destroys 过早的埋葬 if equipped to this monster)
export function clearMonsterZone(state, playerId, zoneIndex) {
  let s = destroyEquipSpellsForMonsterZone(state, playerId, zoneIndex);
  const player = s.players[playerId];
  const newZones = [...player.monsterZones];
  newZones[zoneIndex] = null;
  return {
    ...s,
    players: {
      ...s.players,
      [playerId]: {
        ...player,
        monsterZones: newZones,
      },
    },
  };
}

// Update LP
export function setLP(state, playerId, lp) {
  const player = state.players[playerId];
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        lp: Math.max(0, lp),
      },
    },
  };
}

// Check for empty monster zone index
export function getEmptyMonsterZoneIndex(player) {
  return player.monsterZones.findIndex((z) => z === null);
}

export function getEmptySpellTrapZoneIndex(player) {
  const zones = player?.spellTrapZones;
  if (!Array.isArray(zones)) return -1;
  return zones.findIndex((z) => z === null);
}
