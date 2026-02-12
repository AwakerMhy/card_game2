# Yu-Gi-Oh Style Card Game

A browser-based card game with Yu-Gi-Oh mechanics, built with React and Tailwind CSS.

## Docs

- [Project Log (docs/PROJECT_LOG.md)](docs/PROJECT_LOG.md) - Project plan and change history

## Features

- **Card Types**: Monster (Normal/Effect), Spell, Trap cards
- **Game Board**: Full layout with monster zones, spell/trap zones, deck, graveyard
- **Core Rules**: 8000 LP, 5-card starting hand, tribute summons (Lvl 5-6: 1 tribute, Lvl 7+: 2 tributes)
- **Turn Phases**: Draw, Standby, Main 1, Battle, Main 2, End
- **Battle**: ATK vs ATK, ATK vs DEF, direct attack when no face-up monsters
- **Monster Positions**: Toggle between ATK and DEF in main phase
- **Spell Effects**: Pot of Greed (draw 2), Monster Reborn (special summon from grave)
- **AI Opponent**: Basic AI that summons and attacks
- **Animations**: Damage numbers, smooth transitions
- **Drag & Drop**: Place cards by dragging to zones
- **30+ Cards**: Monsters and spells in card database

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Play

1. **Vs Human**: Uncheck "Vs AI" for 2-player mode
2. **Vs AI**: Check "Vs AI" to play against computer
3. **Phases**: Draw and Standby auto-advance; click "Next Phase" to advance other phases
4. **Summon**: Click monster in hand, then click empty monster zone (or drag)
5. **Attack**: Enter battle phase, click your monster, then click opponent's monster or the direct-attack button
6. **Position**: In main phase, click your monster to toggle ATK/DEF
7. **Spells**: For Pot of Greed, click "Activate" when selected. Set other spells by dragging to S/T zone
