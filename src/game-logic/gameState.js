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

// Create initial game state
export function createInitialState() {
  const player1Deck = buildStarterDeck();
  const player2Deck = buildStarterDeck();

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

// Place card in monster zone
export function placeMonsterZone(state, playerId, zoneIndex, card, position = "attack") {
  const player = state.players[playerId];
  const newZones = [...player.monsterZones];
  newZones[zoneIndex] = { ...card, position };
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

// Place card in spell/trap zone
export function placeSpellTrapZone(state, playerId, zoneIndex, card, faceDown = false) {
  const player = state.players[playerId];
  const newZones = [...player.spellTrapZones];
  newZones[zoneIndex] = { ...card, faceDown };
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

// Clear monster zone
export function clearMonsterZone(state, playerId, zoneIndex) {
  const player = state.players[playerId];
  const newZones = [...player.monsterZones];
  newZones[zoneIndex] = null;
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
  return player.spellTrapZones.findIndex((z) => z === null);
}
