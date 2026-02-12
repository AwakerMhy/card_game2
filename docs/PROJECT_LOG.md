# 项目日志 - Yu-Gi-Oh 风格卡牌游戏

本文档记录项目的主要计划、实现阶段及每次改动。

---

## 目录

1. [项目计划概述](#一项目计划概述)
2. [实现阶段记录](#二实现阶段记录)
3. [后期改动记录](#三后期改动记录)
4. [文件变更总览](#四文件变更总览)
5. [版本历史](#五版本历史)

---

## 一、项目计划概述

### 1.1 项目目标

构建一个可在浏览器中完整游玩的游戏王风格卡牌游戏，使用纯自定义逻辑，无外部游戏库。

### 1.2 技术栈

| 模块 | 技术 |
|------|------|
| UI 框架 | React (Hooks) |
| 样式 | Tailwind CSS |
| 构建工具 | Vite |
| 游戏逻辑 | 纯自定义实现，无外部游戏库 |

### 1.3 游戏规格

**卡牌类型**
- 怪兽卡：Normal / Effect，含 Level(1-12)、ATK、DEF、attribute、race
- 魔法卡：Normal / Quick-Play / Equip / Field / Continuous
- 陷阱卡：Normal / Counter / Continuous

**核心规则**
- 起始 LP：8000
- 起手：5 张（先攻不抽牌）
- 通常召唤：1-4 星无祭品，5-6 星 1 祭品，7+ 星 2 祭品
- 怪兽姿态：表攻、表守、里守
- 战斗：攻 vs 攻、攻 vs 守、直接攻击
- 每只怪兽每回合只能攻击一次

**回合阶段**
1. 抽牌阶段 (DP)
2. 准备阶段 (SP)
3. 主阶段 1 (M1)
4. 战斗阶段 (BP)
5. 主阶段 2 (M2)
6. 结束阶段 (EP)

### 1.4 代码结构

```
src/
  components/     Card, GameBoard, PlayerArea, MonsterZone, SpellTrapZone,
                  HandDisplay, PhaseIndicator, DamageDisplay, ChainDisplay,
                  CardDetailModal, GraveyardModal
  game-logic/     gameState, battleCalculator, chainResolver, summonValidator,
                  spellEffects, aiOpponent
  data/           cardDatabase.js
  utils/          cardDisplay.js
  App.jsx
```

---

## 二、实现阶段记录

### Phase 1 - 核心搭建（已完成）

**完成内容**
- 创建 React + Vite + Tailwind 项目结构
- 游戏状态结构：`gameState.js`（玩家、卡组、手牌、场地、墓地、LP）
- 卡牌组件 `Card.jsx`：正反面显示
- 游戏板布局：`GameBoard.jsx`、`PlayerArea.jsx`、`MonsterZone.jsx`、`SpellTrapZone.jsx`
- Fisher-Yates 洗牌算法
- 20 张起手卡组（10 怪兽 + 10 魔法）
- 卡牌数据库 `cardDatabase.js`（35 张卡牌）

**涉及文件**
- `package.json`, `vite.config.js`, `tailwind.config.js`
- `src/data/cardDatabase.js`
- `src/game-logic/gameState.js`
- `src/components/Card.jsx`, `GameBoard.jsx`, `PlayerArea.jsx`, `MonsterZone.jsx`, `SpellTrapZone.jsx`, `HandDisplay.jsx`

---

### Phase 2 - 基础行动（已完成）

**完成内容**
- 手牌展示与选择，可打出卡牌高亮
- 召唤机制：无祭品（1-4 星）、1 祭品（5-6 星）、2 祭品（7+ 星）
- 祭品召唤选择 UI（选择祭品怪兽）
- 盖放魔法/陷阱
- 从手牌发动魔法：贪欲之壶、死者苏生
- 战斗计算：ATK vs ATK、ATK vs DEF、直接攻击
- 拖拽放置卡牌（拖到手牌区/魔法陷阱区）

**涉及文件**
- `src/game-logic/summonValidator.js`
- `src/game-logic/battleCalculator.js`
- `src/game-logic/spellEffects.js`
- `src/components/GameBoard.jsx`

---

### Phase 3 - 回合系统（已完成）

**完成内容**
- 6 阶段视觉指示：DP、SP、M1、BP、M2、EP
- 「下一阶段」按钮推进阶段
- 抽牌阶段：先攻不抽牌，后续回合抽 1 张
- 结束回合按钮
- 阶段切换逻辑

**涉及文件**
- `src/components/PhaseIndicator.jsx`
- `src/components/GameBoard.jsx`

---

### Phase 4 - 进阶机制（已完成）

**完成内容**
- 怪兽姿态变更：主阶段点击怪兽切换 ATK/DEF
- 祭品召唤选择 UI（选择祭品怪兽并确认）
- 连锁系统数据结构（`chainResolver.js`、`ADD_TO_CHAIN` / `RESOLVE_CHAIN` action）
- `ChainDisplay` 组件（连锁展示）

**涉及文件**
- `src/game-logic/chainResolver.js`
- `src/components/ChainDisplay.jsx`
- `src/components/GameBoard.jsx`

---

### Phase 5 - 打磨（已完成）

**完成内容**
- 伤害数字动画（`DamageDisplay`，`-XXX` 闪烁）
- CSS 动画：`cardDraw`、`cardSummon`、`cardDestroy`、`damageFlash`
- 拖拽放置卡牌
- 基础 AI 对手：自动抽牌、召唤、攻击、结束回合
- 「对战 AI」开关
- 35 张卡牌数据

**涉及文件**
- `src/components/DamageDisplay.jsx`
- `src/game-logic/aiOpponent.js`
- `src/index.css`

---

## 三、后期改动记录

### 改动 1：卡牌内容中文化

**日期**：2025-02-12

**改动内容**
- 所有卡牌名称、效果描述改为中文
- 属性、种族显示为中文（光/暗/地，龙族/魔法师族等）

**涉及文件**
- `src/data/cardDatabase.js`
- `src/utils/cardDisplay.js`（新增）

---

### 改动 2：卡牌简化展示 + 详情弹窗

**日期**：2025-02-12

**改动内容**
- 手牌、场上卡牌不再展示效果描述
- 仅显示：名称、攻/守、属性、等级、类型
- 卡牌右上角增加「?」按钮
- 点击「?」弹出 `CardDetailModal` 查看完整效果

**涉及文件**
- `src/components/Card.jsx`
- `src/components/CardDetailModal.jsx`（新增）
- `src/components/HandDisplay.jsx`
- `src/components/MonsterZone.jsx`
- `src/components/SpellTrapZone.jsx`
- `src/components/PlayerArea.jsx`
- `src/components/GameBoard.jsx`

---

### 改动 3：墓地查看功能

**日期**：2025-02-12

**改动内容**
- 墓地区域可点击
- 点击后弹出 `GraveyardModal` 显示墓地内所有卡牌
- 在墓地弹窗中点击单张卡牌可查看详情

**涉及文件**
- `src/components/GraveyardModal.jsx`（新增）
- `src/components/PlayerArea.jsx`
- `src/components/GameBoard.jsx`

---

### 改动 4：阶段仅显示，只能点「下一阶段」

**日期**：2025-02-12

**改动内容**
- 阶段按钮 (DP、SP、M1、BP、M2、EP) 改为仅展示，不可点击
- 玩家只能通过「下一阶段」按钮推进阶段
- 抽牌阶段点击「下一阶段」时，自动执行抽牌并进入下一阶段
- 移除独立「抽牌」按钮，统一由「下一阶段」处理

**涉及文件**
- `src/components/PhaseIndicator.jsx`
- `src/components/GameBoard.jsx`

---

### 改动 5：界面文案中文化

**日期**：2025-02-12

**改动内容**
- 空区占位符：「Monster」→「怪兽」，「S/T」→「魔陷」

**涉及文件**
- `src/components/MonsterZone.jsx`
- `src/components/SpellTrapZone.jsx`

---

### 改动 6：每只怪兽每回合只能攻击一次

**日期**：2025-02-12

**改动内容**
- 新增 `attackedMonsters` 状态，记录本回合已攻击的怪兽
- 战斗阶段仅允许选择未攻击过的表攻怪兽
- 回合结束时重置 `attackedMonsters`
- AI 对手同步遵守该规则

**涉及文件**
- `src/game-logic/gameState.js`
- `src/components/GameBoard.jsx`
- `src/game-logic/aiOpponent.js`

---

### 改动 7：盖下的魔法/陷阱可点击查看

**日期**：2025-02-12

**改动内容**
- 玩家点击自己盖放的魔法/陷阱卡可弹出详情弹窗查看
- 仅本人可见，对手无法查看

**涉及文件**
- `src/components/GameBoard.jsx`

---

### 改动 8：添加音效

**日期**：2025-02-12

**改动内容**
- 使用 Web Audio API 合成音效，无需外部音频文件
- 抽牌、召唤、攻击、盖牌、阶段切换、伤害均有音效

**涉及文件**
- `src/utils/sounds.js`（新增）
- `src/components/GameBoard.jsx`

---

## 四、文件变更总览

| 文件 | 说明 |
|------|------|
| `src/data/cardDatabase.js` | 卡牌数据库，35 张中文化卡牌 |
| `src/utils/cardDisplay.js` | 属性、种族显示映射 |
| `src/utils/sounds.js` | 音效（Web Audio API 合成） |
| `src/components/Card.jsx` | 卡牌组件，含详情按钮 |
| `src/components/CardDetailModal.jsx` | 卡牌详情弹窗 |
| `src/components/GraveyardModal.jsx` | 墓地查看弹窗 |
| `src/components/PhaseIndicator.jsx` | 阶段仅显示，不可点击 |

---

## 五、版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| 0.1.0 | 2025-02-12 | 完成 Phase 1-5 全部实现 |
| 0.2.0 | 2025-02-12 | 卡牌中文化、详情弹窗、墓地查看、阶段仅显示 |
| 0.3.0 | 2025-02-12 | 怪兽每回合仅攻击一次、盖牌可查看、音效 |
