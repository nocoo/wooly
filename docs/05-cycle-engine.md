# 05 - 周期计算引擎

## 概述

周期计算引擎（`src/models/cycle.ts`）是 Wooly 的核心算法模块。它负责根据 `CycleAnchor` 配置，计算出任意时间点所处的周期窗口，并由此推导出权益的剩余量、到期天数和状态。

所有函数均为**纯函数**，不依赖 React 或外部状态。输入确定则输出确定。

## 核心概念

### 周期窗口（CycleWindow）

一个周期窗口是一个左闭右开的时间区间 `[start, end)`，表示权益的一个重置周期。

```typescript
interface CycleWindow {
  /** 周期开始日（含），ISO 8601 日期字符串 YYYY-MM-DD */
  start: string;
  /** 周期结束日（不含），ISO 8601 日期字符串 YYYY-MM-DD */
  end: string;
}
```

### 锚点解析（Anchor Resolution）

`CycleAnchor` 的 `anchor` 字段可以是：
- `number`：月度周期中的日期（1-31）
- `{ month, day }`：季度/年度周期中的月+日

引擎需要处理：
- **日期溢出**：如 anchor=31 但该月只有 28/30 天 → 取该月最后一天。
- **继承与覆盖**：Benefit 的 `cycleAnchor` 为 null 时，使用 Source 的 `cycleAnchor`。

## 函数设计

### `resolveCycleAnchor`

解析 Benefit 的有效周期配置：若 Benefit 有自定义配置则用之，否则继承 Source 的配置。

```typescript
/**
 * 解析 Benefit 的有效周期锚点。
 * Benefit 级别配置优先于 Source 级别。
 */
function resolveCycleAnchor(
  benefitAnchor: CycleAnchor | null,
  sourceAnchor: CycleAnchor
): CycleAnchor
```

**逻辑**：`return benefitAnchor ?? sourceAnchor`

### `getCurrentCycleWindow`

给定一个日期和周期锚点，计算该日期所在的周期窗口。

```typescript
/**
 * 计算给定日期所在的周期窗口 [start, end)。
 *
 * @param today - 参考日期，ISO 8601 字符串 (YYYY-MM-DD)
 * @param anchor - 周期锚点配置
 * @returns 包含 start 和 end 的 CycleWindow
 */
function getCurrentCycleWindow(today: string, anchor: CycleAnchor): CycleWindow
```

**算法分支**：

#### Monthly（月度周期）

```
anchor = dayOfMonth (如 25)

若 today >= 本月 anchor日:
  window = [本月 anchor日, 下月 anchor日)
否则:
  window = [上月 anchor日, 本月 anchor日)

示例（anchor=25，today=2026-02-13）:
  13 < 25 → window = [2026-01-25, 2026-02-25)
```

#### Quarterly（季度周期）

```
anchor = { month, day } (如 { month: 1, day: 1 })
quarterMonths = [anchor.month, anchor.month+3, anchor.month+6, anchor.month+9]
  (均 mod 12 映射到 1-12)

找到 today 所在的季度区间：
  找最大的 quarterStart <= today，作为 start
  下一个 quarterStart 作为 end

示例（anchor={month:1, day:1}，today=2026-02-13）:
  Q起始月: 1月, 4月, 7月, 10月
  2026-02-13 在 [2026-01-01, 2026-04-01) 中
  window = [2026-01-01, 2026-04-01)
```

#### Yearly（年度周期）

```
anchor = { month, day } (如 { month: 5, day: 20 })

若 today >= 今年 anchor月/日:
  window = [今年 anchor月/日, 明年 anchor月/日)
否则:
  window = [去年 anchor月/日, 今年 anchor月/日)

示例（anchor={month:5, day:20}，today=2026-02-13）:
  02-13 < 05-20 → window = [2025-05-20, 2026-05-20)
```

### `getDaysUntilCycleEnd`

计算从今天到周期结束还有多少天。

```typescript
/**
 * 计算距离周期结束的天数。
 *
 * @param today - 参考日期
 * @param window - 当前周期窗口
 * @returns 剩余天数（>= 0）
 */
function getDaysUntilCycleEnd(today: string, window: CycleWindow): number
```

**逻辑**：`diffInDays(window.end, today)`

### `isCycleExpiringSoon`

判断当前周期是否即将过期（默认阈值 7 天）。

```typescript
/**
 * 判断当前周期是否即将过期。
 *
 * @param daysUntilEnd - 距离周期结束的天数
 * @param threshold - 阈值天数，默认 7
 * @returns 是否即将过期
 */
function isCycleExpiringSoon(daysUntilEnd: number, threshold?: number): boolean
```

**逻辑**：`return daysUntilEnd <= threshold && daysUntilEnd > 0`

### `countRedemptionsInWindow`

统计一个周期窗口内的核销次数。

```typescript
/**
 * 统计给定周期窗口内的核销记录数。
 *
 * @param redemptions - 该 Benefit 的所有核销记录
 * @param window - 当前周期窗口
 * @returns 窗口内的核销次数
 */
function countRedemptionsInWindow(
  redemptions: Redemption[],
  window: CycleWindow
): number
```

**逻辑**：
```
count = redemptions.filter(r =>
  r.redeemedAt >= window.start && r.redeemedAt < window.end
).length
```

### `computeBenefitCycleStatus`

综合计算一个 Benefit 在当前周期内的状态。这是引擎的核心输出函数。

```typescript
interface BenefitCycleInfo {
  /** 当前周期窗口 */
  window: CycleWindow;
  /** 周期内已核销次数 */
  usedCount: number;
  /** 总配额（quota 类型）或 1（credit 类型）或 0（action 类型） */
  totalCount: number;
  /** 使用率 0-1 */
  usageRatio: number;
  /** 距离周期结束天数 */
  daysUntilEnd: number;
  /** 是否即将过期 */
  isExpiringSoon: boolean;
  /** 计算状态 */
  status: BenefitCycleStatus;
}

type BenefitCycleStatus =
  | "available"
  | "partially_used"
  | "exhausted"
  | "expiring_soon"
  | "pending"        // action 类型
  | "not_applicable" // action 类型，不参与核销

/**
 * 计算 Benefit 在当前周期内的完整状态信息。
 */
function computeBenefitCycleStatus(
  benefit: Benefit,
  sourceAnchor: CycleAnchor,
  redemptions: Redemption[],
  today: string
): BenefitCycleInfo
```

**状态判定逻辑**：

```
if benefit.type === "action":
  return status: "pending"

resolve anchor = resolveCycleAnchor(benefit.cycleAnchor, sourceAnchor)
window = getCurrentCycleWindow(today, anchor)
usedCount = countRedemptionsInWindow(redemptions, window)
daysUntilEnd = getDaysUntilCycleEnd(today, window)
isExpiringSoon = isCycleExpiringSoon(daysUntilEnd)

if benefit.type === "quota":
  totalCount = benefit.quota
  if usedCount >= totalCount → status: "exhausted"
  elif usedCount > 0 → status: "partially_used"
  else → status: "available"

if benefit.type === "credit":
  totalCount = 1  (全额核销，要么用了要么没用)
  if usedCount >= 1 → status: "exhausted"
  else → status: "available"

// 叠加过期预警
if status in ["available", "partially_used"] && isExpiringSoon:
  status = "expiring_soon"
```

## 边界情况处理

### 日期溢出

anchor 日期可能大于当月天数（如 anchor=31 遇到 2 月）：

```
clampDay(year, month, day):
  maxDay = daysInMonth(year, month)
  return min(day, maxDay)

示例：anchor=31, 2026年2月 → clampDay(2026, 2, 31) = 28
```

### 季度跨年

anchor = `{ month: 11, day: 1 }` 时，四个季度起始月为 11, 2, 5, 8（跨年）。算法需正确处理年份进位。

### 周期窗口的一致性

窗口是左闭右开 `[start, end)`，确保：
- 今天恰好是 start → 属于新周期
- 今天恰好是 end - 1 → 属于当前周期
- 今天恰好是 end → 属于下一个周期

### 首次使用 / 无历史数据

如果一个 Benefit 没有任何 Redemption 记录，`usedCount = 0`，状态为 `available`。

## 测试用例设计

### 周期窗口计算

| 测试场景 | 输入 | 期望窗口 |
|---|---|---|
| 月度周期，今天在锚点之后 | today=02-28, anchor=25, monthly | [02-25, 03-25) |
| 月度周期，今天在锚点之前 | today=02-13, anchor=25, monthly | [01-25, 02-25) |
| 月度周期，今天恰好是锚点 | today=02-25, anchor=25, monthly | [02-25, 03-25) |
| 月度周期，anchor=31 遇2月 | today=02-15, anchor=31, monthly | [01-31, 02-28) |
| 年度周期，今天在锚点之后 | today=06-01, anchor={5,20}, yearly | [05-20, 05-20+1y) |
| 年度周期，今天在锚点之前 | today=02-13, anchor={5,20}, yearly | [2025-05-20, 2026-05-20) |
| 季度周期，标准Q1 | today=02-13, anchor={1,1}, quarterly | [01-01, 04-01) |
| 季度周期，跨年 | today=12-15, anchor={11,1}, quarterly | [11-01, 02-01+1y) |

### 状态判定

| 测试场景 | 条件 | 期望状态 |
|---|---|---|
| Quota 全部可用 | used=0, total=6 | `available` |
| Quota 部分使用 | used=3, total=6 | `partially_used` |
| Quota 全部用完 | used=6, total=6 | `exhausted` |
| Quota 即将过期且有剩余 | used=2, total=6, daysLeft=3 | `expiring_soon` |
| Quota 即将过期但已用完 | used=6, total=6, daysLeft=3 | `exhausted`（不叠加） |
| Credit 未使用 | used=0 | `available` |
| Credit 已使用 | used=1 | `exhausted` |
| Credit 即将过期 | used=0, daysLeft=5 | `expiring_soon` |
| Action 类型 | — | `pending` |

### 日期边界

| 测试场景 | 说明 |
|---|---|
| 闰年 2 月 29 日 | anchor={2,29} 在非闰年应 clamp 到 2 月 28 日 |
| 跨年周期 | anchor={12,15}, yearly, today=01-10 → 窗口从去年 12-15 开始 |
| 月末日期 | anchor=31 在不同月份的行为 |

## 性能考量

当前 MVP 阶段数据量极小（~26 个权益，~20 条核销记录），所有计算在 ViewModel 的 `useMemo` 中同步执行即可，无需优化。

未来引入真实数据库后，可考虑：
- 在 DB 层预计算 `current_cycle_start` 字段
- 按周期窗口索引核销记录
- 缓存 `BenefitCycleInfo` 计算结果
