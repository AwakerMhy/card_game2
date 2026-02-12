// 卡牌属性显示映射
export const ATTRIBUTES = {
  LIGHT: "光",
  DARK: "暗",
  EARTH: "地",
  FIRE: "炎",
  WATER: "水",
  WIND: "风",
};

export const RACES = {
  Dragon: "龙",
  Spellcaster: "魔",
  Warrior: "战",
  Fiend: "恶",
  Beast: "兽",
  "Beast-Warrior": "兽战",
  Fairy: "天",
};

export const RACES_FULL = {
  Dragon: "龙族",
  Spellcaster: "魔法师族",
  Warrior: "战士族",
  Fiend: "恶魔族",
  Beast: "兽族",
  "Beast-Warrior": "兽战士族",
  Fairy: "天使族",
};

export function getAttributeDisplay(attr) {
  return ATTRIBUTES[attr] || attr;
}

export function getRaceDisplay(race) {
  return RACES[race] || race;
}

export function getRaceDisplayFull(race) {
  return RACES_FULL[race] || race;
}
