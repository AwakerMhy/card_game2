// Battle damage calculation
// ATK vs ATK: higher destroys lower, difference = damage to LP
// ATK vs DEF: if DEF > ATK, attacker takes (DEF-ATK) damage; if ATK > DEF, destroy monster only
// Face-down defender: treated as face-up defense for damage calc (flip happens before call)
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

  // Face-down monsters attacked become face-up defense; use DEF for damage calc
  const defenderPosition = defender.faceDown ? "defense" : (defender.position || "attack");
  const defenderStat = defenderPosition === "attack" ? defender.atk : (defender.def ?? 0);

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
  // DEF > ATK: neither destroyed, attacking player takes (DEF - ATK) as damage
  if (defenderStat > attacker.atk) {
    return {
      attackerDestroys: false,
      defenderDestroys: false,
      attackerDamage: defenderStat - attacker.atk,
      defenderDamage: 0,
    };
  }
  // DEF === ATK: no damage
  return {
    attackerDestroys: false,
    defenderDestroys: false,
    attackerDamage: 0,
    defenderDamage: 0,
  };
}
