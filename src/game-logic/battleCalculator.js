// Battle damage calculation
// ATK vs ATK: higher destroys lower, difference = damage to LP
// ATK vs DEF: no damage if DEF >= ATK; if ATK > DEF, destroy monster only
// Direct attack: full ATK as damage when no face-up ATK monsters

export function calculateBattle(attacker, defender, isDirectAttack = false) {
  if (isDirectAttack) {
    return {
      attackerDestroys: false,
      defenderDestroys: false,
      attackerDamage: 0,
      defenderDamage: attacker.atk,
    };
  }

  if (!defender) return null;

  const defenderPosition = defender.position || "attack";
  const defenderStat = defenderPosition === "attack" ? defender.atk : defender.def;

  if (defenderPosition === "attack") {
    // ATK vs ATK
    if (attacker.atk > defenderStat) {
      return {
        attackerDestroys: true,
        defenderDestroys: false,
        attackerDamage: 0,
        defenderDamage: attacker.atk - defenderStat,
      };
    }
    if (attacker.atk < defenderStat) {
      return {
        attackerDestroys: false,
        defenderDestroys: true,
        attackerDamage: defenderStat - attacker.atk,
        defenderDamage: 0,
      };
    }
    // Equal - both destroyed
    return {
      attackerDestroys: true,
      defenderDestroys: true,
      attackerDamage: 0,
      defenderDamage: 0,
    };
  }

  // ATK vs DEF
  if (attacker.atk > defenderStat) {
    return {
      attackerDestroys: true,
      defenderDestroys: false,
      attackerDamage: 0,
      defenderDamage: 0,
    };
  }
  // DEF >= ATK: no damage, attacker takes no damage
  return {
    attackerDestroys: false,
    defenderDestroys: false,
    attackerDamage: 0,
    defenderDamage: 0,
  };
}
