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

### 改动 9：单元测试

**日期**：2025-02-12

**改动内容**
- 引入 Vitest 测试框架
- 测试 gameState、spellEffects、battleCalculator、summonValidator、chainResolver

**涉及文件**
- `vitest.config.js`（新增）
- `src/game-logic/*.test.js`（新增）

---

### 改动 10：魔法卡发动逻辑修复

**日期**：2025-02-12

**改动内容**
- 手牌魔法：满足条件时可点击「发动魔法」发动
- 盖放魔法：点击盖牌查看详情时，主阶段可点击「发动」发动
- 新增 `ACTIVATE_SPELL_FROM_FIELD` action
- 新增 `clearSpellTrapZone` 辅助函数

**涉及文件**
- `src/game-logic/gameState.js`
- `src/components/GameBoard.jsx`
- `src/components/CardDetailModal.jsx`

---

### 改动 11：AI 操作变慢 + 操作日志

**日期**：2025-02-12

**改动内容**
- AI 操作间隔由 600ms 调整为 1300ms
- 新增 `ActionLog` 组件，显示玩家与 AI 操作记录
- 操作日志位于右下角，不遮挡主界面

**涉及文件**
- `src/components/ActionLog.jsx`（新增）
- `src/components/GameBoard.jsx`

---

### 改动 12：布局与阶段自动化（v0.5.0）

**日期**：2025-02-12

**布局与 UI**
- 盖放魔法卡在主阶段满足条件时可发动（详情弹窗「发动」、`ACTIVATE_SPELL_FROM_FIELD`）
- 移除「战线」显示；血条：己方左下角、对方右上角（可点击直接攻击）
- 对称布局：对方从上到下 手卡→魔陷→怪兽，己方 怪兽→魔陷→手卡；魔陷区与怪兽区尺寸统一（w-[72px] h-[120px]）
- 卡组、墓地移至血条旁：己方在血条上方，对方在血条下方；导出 `DeckGraveyardRow` 供 GameBoard 使用
- 双方场地间隙缩小（gap-3→gap-1）；怪兽区固定高度、不压缩，保证卡牌显示完全
- 手卡与怪兽区对齐，使用与场地一致的 md 卡牌尺寸；整体卡牌略放大（md: 68×108px，区格 72×120px）
- 删除「Yu-Gi-Oh 卡牌游戏」标题（App.jsx）；阶段指示、回合数、AI 勾选、结束回合按钮全部移至屏幕左侧中间；结束回合按钮紧靠回合数右侧
- 魔法卡背景绿色加深（bg-emerald-100）

**阶段自动化**
- 抽牌阶段：进入后约 400ms 自动执行抽牌（如需）并进入准备阶段
- 准备阶段：进入后约 600ms 自动进入主阶段 1
- 抽牌、准备阶段隐藏「下一阶段」按钮；AI 回合的抽牌/准备由同一自动流程处理，AI 仅处理 main1/battle/main2/end

**涉及文件**
- `src/App.jsx`
- `src/components/GameBoard.jsx`
- `src/components/PlayerArea.jsx`
- `src/components/PhaseIndicator.jsx`
- `src/components/Card.jsx`
- `src/components/CardDetailModal.jsx`
- `src/components/MonsterZone.jsx`
- `src/components/SpellTrapZone.jsx`
- `src/components/HandDisplay.jsx`

---

### 改动 13：v1.0.0 版本发布

**日期**：2025-02-12

**魔法·陷阱效果（101–115）**
- 101 贪欲之壶、102 死者苏生、103 黑洞、104 雷击（沿用）
- 105 光之护封剑：发动后对方不能宣言攻击；回合结束清除
- 106 旋风、107 大风暴：破坏场上魔陷
- 109 心变：夺取对方一只怪兽至己方，回合结束归还
- 110 过早的埋葬、111 月之书、112 闪电漩涡、113 地割、115 圣防护罩（陷阱，战斗阶段发动）
- 盖放陷阱可从场地发动，115 仅战斗阶段可发动

**怪兽效果**
- 002 暗黑幻觉师：通常召唤成功时从卡组加一张魔陷
- 007 栗子球：受到战斗伤害时可弃此卡使该次伤害为 0
- 010 羽翼栗子球：对方宣言攻击时可弃此卡使攻击无效（宣言攻击→选择允许/无效）
- 011 三眼怪、012 黑森林女巫：送入墓地时从卡组加怪兽（ATK/DEF≤1500）
- 018 幻影墙：被攻击且伤害计算后，将攻击怪兽返回对方手牌

**vs AI 视角**
- 与 AI 对局时固定视角：上方始终为 AI，下方始终为玩家，不随回合切换
- AI 回合时隐藏「结束回合」「下一阶段」，避免误操作

**涉及文件**
- `src/game-logic/gameState.js`（lightSwordActive、borrowedMonsters、pendingAttack、addCardToHand 等）
- `src/game-logic/spellEffects.js`（105–115、canActivateFromFieldInPhase）
- `src/game-logic/monsterEffects.js`（新增，applyOnSummon、applyGraveyardEffect）
- `src/components/GameBoard.jsx`（END_TURN 归还心变、光剑挡攻击、陷阱发动、怪兽效果、固定视角）

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
| `src/components/ActionLog.jsx` | 操作日志 |
| `src/game-logic/monsterEffects.js` | 怪兽效果触发（召唤成功、送入墓地） |

---

## 五、版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| 0.1.0 | 2025-02-12 | 完成 Phase 1-5 全部实现 |
| 0.2.0 | 2025-02-12 | 卡牌中文化、详情弹窗、墓地查看、阶段仅显示 |
| 0.3.0 | 2025-02-12 | 怪兽每回合仅攻击一次、盖牌可查看、音效 |
| 0.4.0 | 2025-02-12 | 单元测试、魔法卡从手牌/场地发动、AI 操作变慢、操作日志 |
| 0.5.0 | 2025-02-12 | 布局重构（血条/卡组墓地/对称区格）、左侧控制区、卡牌放大、抽牌/准备阶段自动推进 |
| 1.0.0 | 2025-02-12 | 全卡牌效果实现（魔法 101–113、陷阱 114–115）、怪兽效果（002/007/010/011/012/018）、光之护封剑/心变/圣防护罩等、vs AI 固定视角（不随回合切换） |
