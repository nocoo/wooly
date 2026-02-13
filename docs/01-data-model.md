# 01 - 数据模型设计

## 概述

Wooly 的数据模型围绕一个核心关系展开：**Source（来源）** 拥有多个 **Benefit（权益）**，权益在周期内被 **Redemption（核销）** 消耗。此外，**Points Source（积分来源）** 作为特殊的 Source 类型，其下挂载的是 **Redeemable（可兑换项）** 而非 Benefit。

所有实体归属于一个单一的户主账户（通过 NextAuth Google 登录），家庭成员以 **Member（受益人）** 的形式存在，不需要独立登录。

## 实体关系图

```
Member (受益人)
  │
  ├──< Source (来源)
  │     │
  │     ├──< Benefit (权益)
  │     │     │
  │     │     └──< Redemption (核销记录)
  │     │
  │     └── currency (币种，由 Source 定义)
  │         cycleAnchor (周期锚点，由 Source 定义)
  │
  └──< PointsSource (积分来源)
        │
        ├── balance (当前积分余额)
        │
        └──< Redeemable (可兑换项)
```

## 实体定义

### Member（受益人）

户主在 Settings 中预先定义的家庭成员。每个 Source 必须绑定一个 Member 作为默认受益人。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `name` | `string` | 是 | 显示名称，如"张三"、"李四" |
| `relationship` | `MemberRelationship` | 是 | 与户主的关系（见下方） |
| `avatar` | `string \| null` | 否 | 头像 URL 或 emoji |
| `createdAt` | `string` | 是 | ISO 8601 创建时间 |

**MemberRelationship 枚举：**

```typescript
type MemberRelationship =
  | "self"      // 本人
  | "spouse"    // 配偶
  | "parent"    // 父母
  | "child"     // 子女
  | "sibling"   // 兄弟姐妹
  | "other"     // 其他
```

### Source（来源）

权益的来源载体，如信用卡、保险、会员服务。每个 Source 归属于一个默认受益人（Member）。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `memberId` | `string` | 是 | 默认受益人 FK → Member.id |
| `name` | `string` | 是 | 如"招商银行经典白金卡" |
| `icon` | `string \| null` | 否 | 图标标识（emoji 或 lucide icon 名） |
| `category` | `SourceCategory` | 是 | 分类枚举（见下方） |
| `currency` | `string` | 是 | 币种代码，如 "CNY"、"USD" |
| `cycleAnchor` | `CycleAnchor` | 是 | 默认周期锚点配置（见下方） |
| `archived` | `boolean` | 是 | 是否已归档（默认 `false`）|
| `memo` | `string \| null` | 否 | 备注 |
| `createdAt` | `string` | 是 | ISO 8601 创建时间 |

**归档规则：**

- 归档的 Source 及其全部 Benefit **不参与**仪表盘统计、即将过期提醒、浪费统计。
- 归档的 Source 在来源列表页底部显示（灰色），默认折叠隐藏。
- 归档操作是**可逆**的（可取消归档）。
- 已归档的 Source 仍然保留历史核销记录，可在详情页查看。

**SourceCategory 枚举：**

```typescript
type SourceCategory =
  | "credit-card"    // 信用卡
  | "insurance"      // 保险
  | "membership"     // 会员服务（如 88VIP、京东 PLUS）
  | "telecom"        // 电信/宽带
  | "other"          // 其他
```

### CycleAnchor（周期锚点配置）

定义权益的重置周期和起始日。这是一个值对象（Value Object），嵌入在 Source 中作为默认值，Benefit 可以覆盖。

```typescript
interface CycleAnchor {
  /** 重置频率 */
  period: "monthly" | "quarterly" | "yearly";

  /**
   * 周期起始日的锚点。
   *
   * - monthly:  dayOfMonth (1-31)，表示每月几号重置。
   * - quarterly: { month: 1-12, day: 1-31 }，表示季度从哪个月的哪天开始。
   * - yearly:   { month: 1-12, day: 1-31 }，表示年度从哪个月的哪天开始。
   *
   * 例如：
   *   保单日 5月20日 → { period: "yearly", anchor: { month: 5, day: 20 } }
   *   账单日每月25号 → { period: "monthly", anchor: 25 }
   *   自然月         → { period: "monthly", anchor: 1 }
   *   自然年         → { period: "yearly", anchor: { month: 1, day: 1 } }
   */
  anchor: number | { month: number; day: number };
}
```

### Benefit（权益）

Source 下的具体权益单元。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `sourceId` | `string` | 是 | FK → Source.id |
| `name` | `string` | 是 | 如"机场贵宾厅" |
| `type` | `BenefitType` | 是 | 权益类型（见下方） |
| `quota` | `number \| null` | 条件必填 | 仅 `quota` 类型：每周期可用次数 |
| `creditAmount` | `number \| null` | 条件必填 | 仅 `credit` 类型：每周期额度金额 |
| `shared` | `boolean` | 是 | 是否可在家庭成员间共享使用 |
| `cycleAnchor` | `CycleAnchor \| null` | 否 | 覆盖 Source 的默认周期；null 表示继承 |
| `memo` | `string \| null` | 否 | 备注，如使用方式说明 |
| `createdAt` | `string` | 是 | ISO 8601 创建时间 |

**BenefitType 枚举：**

```typescript
type BenefitType =
  | "quota"    // 次数型：每周期 N 次（如每年 6 次贵宾厅）
  | "credit"   // 额度型：每周期 N 元（如每月 20 元红包，一次性全额核销）
  | "action"   // 任务型：仅提醒，无需核销（如每月消费 1 笔免月费）
```

### Redemption（核销记录）

记录权益被使用的事件。仅 `quota` 和 `credit` 类型的 Benefit 会产生 Redemption。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `benefitId` | `string` | 是 | FK → Benefit.id |
| `memberId` | `string` | 是 | 实际使用人 FK → Member.id |
| `redeemedAt` | `string` | 是 | ISO 8601 核销时间 |
| `memo` | `string \| null` | 否 | 核销备注 |

**设计决策说明：**

- **Quota 类型**：每次核销产生一条 Redemption，`quota` 计数通过 `COUNT(redemptions in current cycle)` 计算剩余。
- **Credit 类型**：一次性全额核销，每个周期内最多一条 Redemption 即表示"已用"。
- **Action 类型**：不产生 Redemption。系统根据当前周期自动计算是否"待办"。
- **Redemption 不记录金额**：因为 Credit 类型是一次性全额核销，无需记录具体金额。

### PointsSource（积分来源）

积分是一种特殊的 Source，拥有余额和可兑换项列表。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `memberId` | `string` | 是 | 归属受益人 FK → Member.id |
| `name` | `string` | 是 | 如"招行永久积分"、"平安万里通" |
| `icon` | `string \| null` | 否 | 图标 |
| `balance` | `number` | 是 | 当前积分余额 |
| `memo` | `string \| null` | 否 | 备注 |
| `createdAt` | `string` | 是 | ISO 8601 创建时间 |

### Redeemable（可兑换项）

积分可以兑换的内容。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | 是 | UUID |
| `pointsSourceId` | `string` | 是 | FK → PointsSource.id |
| `name` | `string` | 是 | 如"星巴克中杯拿铁" |
| `cost` | `number` | 是 | 所需积分数量 |
| `memo` | `string \| null` | 否 | 备注 |
| `createdAt` | `string` | 是 | ISO 8601 创建时间 |

## 状态机

### Benefit 周期状态

每个 Benefit 在一个重置周期内有以下计算状态（非存储字段，由 ViewModel 实时计算）：

```
                    ┌─────────────┐
                    │  available  │  周期开始，权益可用
                    └──────┬──────┘
                           │
                    用户核销 / 部分核销
                           │
                    ┌──────▼──────┐
                    │ partially   │  仅 quota 类型：已用部分次数
                    │   used      │
                    └──────┬──────┘
                           │
                  全部用完 / 全额核销
                           │
                    ┌──────▼──────┐
                    │  exhausted  │  本周期已用完
                    └─────────────┘

  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

                    ┌─────────────┐
                    │  expiring   │  距离周期结束 ≤ 7 天，且仍有未用完的权益
                    │   soon      │  （叠加在 available / partially_used 之上）
                    └─────────────┘

                    ┌─────────────┐
                    │   wasted    │  周期已结束，仍有未用完的权益
                    │             │  （用于历史复盘，标灰）
                    └─────────────┘
```

**状态计算规则：**

```typescript
type BenefitCycleStatus =
  | "available"       // 可用（quota: 已用 < 总数 / credit: 未核销）
  | "partially_used"  // 部分已用（仅 quota: 0 < 已用 < 总数）
  | "exhausted"       // 已用完（quota: 已用 = 总数 / credit: 已核销）
  | "expiring_soon"   // 即将过期（叠加标记：距周期结束 ≤ 7 天 + 未用完）
  | "wasted"          // 已浪费（周期已过，未用完）
  | "pending"         // 仅 action 类型：本周期待办
  | "done"            // 仅 action 类型：本周期已完成（无核销，不跟踪）
```

> **注意**：`expiring_soon` 是一个叠加标记，可以与 `available` 或 `partially_used` 同时成立。在 UI 中表现为高亮/橙色警告。

### Action 类型的特殊处理

Action 类型的 Benefit 不参与核销系统。它的状态始终由周期引擎自动计算：
- 周期内 → `pending`（显示为待办提醒）
- 周期结束 → 不产生 `wasted`（因为系统无法验证用户是否实际执行了任务）

## 索引策略

以下索引建议在引入真实数据库时实施（MVP 假数据阶段无需）：

| 表 | 索引 | 用途 |
|---|---|---|
| `benefit` | `(sourceId)` | 按 Source 查询所有权益 |
| `redemption` | `(benefitId, redeemedAt)` | 按权益 + 时间查询周期内核销记录 |
| `source` | `(memberId)` | 按受益人查询所有来源 |
| `points_source` | `(memberId)` | 按受益人查询积分来源 |
| `redeemable` | `(pointsSourceId)` | 按积分来源查询可兑换项 |

## CRUD 操作规范

所有实体均支持完整的 CRUD（增删改查），操作通过 Model 层的纯函数实现，ViewModel 层暴露给 View。

### 操作矩阵

| 实体 | Create | Read | Update | Delete | 特殊操作 |
|---|---|---|---|---|---|
| **Member** | 在 Settings 中新增成员 | 列表 + 筛选 | 修改名称/关系/头像 | 删除（级联检查） | — |
| **Source** | 在来源页新增 | 列表 + 详情 + 按成员筛选 | 修改字段 | 删除（级联检查） | `archive` / `unarchive` |
| **Benefit** | 在来源详情页新增 | 列表 + 状态计算 | 修改字段 | 删除（级联检查） | — |
| **Redemption** | 核销操作时自动创建 | 按周期查看历史 | 修改备注 | 撤销核销（删除记录） | — |
| **PointsSource** | 在来源页新增 | 列表 + 余额 | 修改字段 + 更新余额 | 删除（级联检查） | — |
| **Redeemable** | 在积分详情页新增 | 列表 | 修改字段 | 删除 | — |

### 级联删除规则

删除操作必须处理外键依赖关系：

| 删除目标 | 级联影响 | 策略 |
|---|---|---|
| Member | 该成员名下所有 Source、PointsSource 及下属实体 | **阻止删除** — 必须先迁移或删除关联 Source |
| Source | 该来源下所有 Benefit 及其 Redemption | **确认后级联删除** — 弹窗提示影响范围 |
| Benefit | 该权益的所有 Redemption | **确认后级联删除** |
| PointsSource | 该积分来源下所有 Redeemable | **确认后级联删除** |
| Redemption | 无下游依赖 | **直接删除** |
| Redeemable | 无下游依赖 | **直接删除** |

### 表单验证规则

| 实体 | 字段 | 验证规则 |
|---|---|---|
| Member | `name` | 非空，≤ 20 字符，同一账户内唯一 |
| Member | `relationship` | 必须为 `MemberRelationship` 枚举值之一 |
| Source | `name` | 非空，≤ 50 字符 |
| Source | `memberId` | 必须引用已存在的 Member |
| Source | `currency` | 非空，3 字符 ISO 4217 代码 |
| Benefit | `name` | 非空，≤ 50 字符 |
| Benefit | `quota` | 当 `type = "quota"` 时必填，正整数 |
| Benefit | `creditAmount` | 当 `type = "credit"` 时必填，正数 |
| PointsSource | `name` | 非空，≤ 50 字符 |
| PointsSource | `balance` | 非负数 |
| Redeemable | `name` | 非空，≤ 50 字符 |
| Redeemable | `cost` | 正整数 |
