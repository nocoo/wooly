# 02 - MVVM 分层架构

## 概述

Wooly 严格遵循 basalt 项目确立的 **Model-ViewModel-View (MVVM)** 架构模式，并针对 Next.js App Router 进行适配。核心原则：**各层之间的导入方向单向流动，禁止反向依赖。**

## 数据流

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  src/data/   │     │    src/models/        │     │  src/models/        │
│  mock.ts     │────►│    <name>.ts          │◄────│  types.ts           │
│              │     │                       │     │  (领域接口)          │
│  (类型化的    │     │  纯函数：              │     └─────────────────────┘
│   常量数据)   │     │  classify, compute,   │
│              │     │  format, derive,      │
└──────┬───────┘     │  filter, resolve      │
       │             └───────────┬───────────┘
       │      ┌──────────────────┘
       ▼      ▼
┌──────────────────────────────┐
│  src/viewmodels/             │
│  use<Name>ViewModel.ts       │
│                              │
│  React hook：                 │
│  1. 导入 mock 数据             │
│  2. 导入 model 纯函数          │
│  3. useMemo / useState /     │
│     useCallback              │
│  4. 返回扁平对象：              │
│     展示就绪数据 + 操作回调      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐     ┌─────────────────────┐
│  src/app/(dashboard)/        │     │  src/lib/palette.ts  │
│  <route>/page.tsx            │◄────│  (图表配色)           │
│                              │     └─────────────────────┘
│  解构 ViewModel，              │
│  仅渲染 JSX，                  │
│  零业务逻辑。                   │
└──────────────────────────────┘
```

## 导入规则（强制）

| 层级 | 允许导入 | 禁止导入 |
|---|---|---|
| **Model** (`src/models/`) | `types.ts`、其他 model 文件 | React、ViewModel、View、mock 数据、UI 组件、palette |
| **ViewModel** (`src/viewmodels/`) | model 函数、`types.ts`、mock 数据、React hooks | View 组件、UI 组件、palette、CSS |
| **View** (`src/app/` pages) | ViewModel hook、UI 组件、palette、icons | model 函数、`types.ts`、mock 数据（直接） |
| **Mock Data** (`src/data/`) | `types.ts` | 其他所有层 |

## 各层职责与规范

### Layer 1: Types（领域接口）

**位置**：`src/models/types.ts`（单文件）

定义所有领域实体的 TypeScript 接口，对应 `01-data-model.md` 中的实体定义。

```typescript
// src/models/types.ts
// Domain interfaces for Wooly.
// Edit these to match your domain — all layers depend on this file.

export type SourceCategory = "credit-card" | "insurance" | "membership" | "telecom" | "other";
export type BenefitType = "quota" | "credit" | "action";

export interface CycleAnchor {
  period: "monthly" | "quarterly" | "yearly";
  anchor: number | { month: number; day: number };
}

export interface Member { ... }
export interface Source { ... }
export interface Benefit { ... }
export interface Redemption { ... }
export interface PointsSource { ... }
export interface Redeemable { ... }
```

**规范**：
- 仅包含 `interface`、`type`、`enum` 定义。
- 零逻辑、零函数。
- 所有层都依赖此文件。

### Layer 2: Model（纯业务逻辑）

**位置**：`src/models/<kebab-case>.ts`

**文件头注释（强制）**：
```typescript
// Pure business logic for <功能描述>.
// No React dependency — fully testable with plain unit tests.
```

**核心 Model 文件规划**：

| 文件 | 职责 | 主要函数示例 |
|---|---|---|
| `cycle.ts` | 周期计算引擎（核心） | `resolveCycleAnchor()`, `getCurrentCycleWindow()`, `getDaysUntilExpiry()`, `isCycleExpiringSoon()` |
| `benefit.ts` | 权益状态计算 + CRUD | `computeBenefitStatus()`, `computeUsageRatio()`, `addBenefit()`, `updateBenefit()`, `removeBenefit()`, `validateBenefitInput()` |
| `source.ts` | 来源聚合 + CRUD + 归档 + 图标解析 + 有效期 | `computeSourceSummary()`, `resolveSourceIcon()`, `extractDomain()`, `isSourceExpired()`, `isSourceExpiringSoon()`, `addSource()`, `updateSource()`, `removeSource()`, `toggleSourceArchived()`, `validateSourceInput()` |
| `dashboard.ts` | Dashboard 聚合逻辑 | `computeAlerts()`, `computeOverallProgress()`, `rankByUrgency()` |
| `points.ts` | 积分计算 + CRUD | `computeAffordableItems()`, `addPointsSource()`, `addRedeemable()`, `validatePointsSourceInput()` |
| `format.ts` | 共享格式化工具 | `formatCurrency()`, `formatCycleLabel()`, `formatDateRange()` |
| `member.ts` | 成员 CRUD + 验证 | `addMember()`, `updateMember()`, `removeMember()`, `validateMemberInput()`, `checkMemberDependents()` |
| `redemption.ts` | 核销 CRUD | `addRedemption()`, `removeRedemption()`, `getRedemptionsInWindow()` |

**函数模式（继承 basalt）**：

| 模式 | 说明 | 示例 |
|---|---|---|
| **Classification** | 原始值 → 语义类别 | `classifyBenefitUrgency(daysLeft) → "urgent" \| "warning" \| "normal"` |
| **Computation** | 集合 → 聚合值 | `computeUsageRatio(benefit, redemptions) → number` |
| **Resolution** | 配置 + 上下文 → 具体值 | `resolveCycleAnchor(benefit, source) → CycleAnchor` |
| **Formatting** | 原始值 → 显示字符串 | `formatCurrency(300, "CNY") → "¥300"` |
| **Derivation** | 原始数据 → 展示就绪数据 | `deriveAlertItem(benefit, window) → AlertItem` |
| **Filtering** | 集合 + 条件 → 子集 | `filterBenefitsByMember(benefits, memberId) → Benefit[]` |
| **Mutation** | 集合 + 变更 → 新集合 | `addSource(sources, newSource) → Source[]` |
| **Validation** | 输入 → 错误列表 | `validateSource(input) → ValidationError[]` |
| **Icon Resolution** | URL/配置 → 图标信息 | `resolveSourceIcon(source) → { type, value }` |
| **Temporal Check** | 日期 + 实体 → 状态判定 | `isSourceExpired(source, today) → boolean` |

**CRUD 函数模式（所有实体通用）**：

每个可 CRUD 的实体在对应 Model 文件中至少包含以下纯函数：

```typescript
// src/models/source.ts — CRUD 纯函数示例

/** 新增：返回插入新项后的新数组 */
function addSource(sources: Source[], input: CreateSourceInput): Source[];

/** 更新：返回替换对应项后的新数组 */
function updateSource(sources: Source[], id: string, input: UpdateSourceInput): Source[];

/** 删除：返回移除对应项后的新数组 */
function removeSource(sources: Source[], id: string): Source[];

/** 归档/取消归档 */
function toggleSourceArchived(sources: Source[], id: string): Source[];

/** 表单验证：返回空数组表示通过 */
function validateSourceInput(input: CreateSourceInput | UpdateSourceInput): ValidationError[];

/** 级联检查：返回依赖该实体的下游实体统计 */
function checkSourceDependents(sourceId: string, benefits: Benefit[]): DependentsSummary;

/** 从 URL 提取域名（用于 favicon.im 服务） */
function extractDomain(url: string): string | null;

/**
 * 解析来源图标。优先级：favicon > 手动 icon > 默认分类图标。
 * 返回 { type: "favicon" | "icon" | "category", value: string }。
 * - favicon: value 为 `https://favicon.im/{domain}`
 * - icon: value 为 emoji 或 lucide icon 名
 * - category: value 为 SourceCategory 对应的默认 lucide icon 名
 */
function resolveSourceIcon(source: Source): { type: "favicon" | "icon" | "category"; value: string };

/** 判断来源是否已过期（validUntil < today） */
function isSourceExpired(source: Source, today: string): boolean;

/** 判断来源是否即将过期（validUntil 在 today 后 threshold 天内） */
function isSourceExpiringSoon(source: Source, today: string, threshold?: number): boolean;
```

所有 Mutation 函数遵循**不可变原则**：永远不修改输入参数，返回新数组/新对象。

### Layer 3: ViewModel（React Hook 组合层）

**位置**：`src/viewmodels/use<PascalCase>ViewModel.ts`

**文件头注释（强制）**：
```typescript
// ViewModel for the <Page Name> page.
// Composes model logic with data source — View consumes this hook only.
```

**三种复杂度层级**：

#### Tier 1: 无状态（纯转换）
仅使用 `useMemo` 对 mock 数据调用 model 函数。

```typescript
// src/viewmodels/useSourceDetailViewModel.ts
export function useSourceDetailViewModel(sourceId: string) {
  const source = useMemo(() => findSourceById(sources, sourceId), [sourceId]);
  const benefits = useMemo(() => getBenefitsForSource(allBenefits, sourceId), [sourceId]);
  const summary = useMemo(() => computeSourceSummary(benefits, redemptions, now), [benefits]);
  return { source, benefits, summary };
}
```

#### Tier 2: 有状态（拥有 UI 状态 + 操作回调）
使用 `useState` 管理交互状态，`useCallback` 暴露操作。

```typescript
// src/viewmodels/useTrackerViewModel.ts
export function useTrackerViewModel() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const filteredBenefits = useMemo(
    () => filterBenefitsByMember(allBenefits, selectedMember),
    [selectedMember]
  );
  const redeem = useCallback((benefitId: string, memberId: string) => {
    // 操作 mock 数据（MVP 阶段）
  }, []);
  return { selectedMember, setSelectedMember, filteredBenefits, redeem };
}
```

#### Tier 3: CRUD 管理（完整 CRUD + 表单状态）
管理实体的增删改查，包含表单输入状态、验证错误、确认弹窗状态。

```typescript
// src/viewmodels/useSourcesViewModel.ts — CRUD 部分
export function useSourcesViewModel() {
  // 数据源
  const [sources, setSources] = useState<Source[]>(mockSources);

  // 表单状态
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInput, setFormInput] = useState<CreateSourceInput>(defaultInput);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const dependents = useMemo(
    () => deleteTarget ? checkSourceDependents(deleteTarget, benefits) : null,
    [deleteTarget]
  );

  // CRUD 操作回调
  const handleCreate = useCallback(() => {
    const errors = validateSourceInput(formInput);
    if (errors.length > 0) { setFormErrors(errors); return; }
    setSources((prev) => addSource(prev, formInput));
    setFormOpen(false);
  }, [formInput]);

  const handleUpdate = useCallback(() => {
    if (!editingId) return;
    const errors = validateSourceInput(formInput);
    if (errors.length > 0) { setFormErrors(errors); return; }
    setSources((prev) => updateSource(prev, editingId, formInput));
    setEditingId(null);
    setFormOpen(false);
  }, [editingId, formInput]);

  const handleDelete = useCallback((id: string) => {
    setSources((prev) => removeSource(prev, id));
    setDeleteTarget(null);
  }, []);

  const handleToggleArchive = useCallback((id: string) => {
    setSources((prev) => toggleSourceArchived(prev, id));
  }, []);

  return {
    // 列表展示
    sourceCards, memberFilter, setMemberFilter,
    // 表单
    formOpen, setFormOpen, editingId, formInput, setFormInput, formErrors,
    handleCreate, handleUpdate,
    // 删除
    deleteTarget, setDeleteTarget, dependents, handleDelete,
    // 归档
    handleToggleArchive,
  };
}
```

**ViewModel 本地接口**：展示就绪的数据结构定义在 ViewModel 文件内（而非 `types.ts`），它们是 ViewModel 与 View 之间的契约。

```typescript
// 定义在 ViewModel 文件内部
interface BenefitRow {
  id: string;
  name: string;
  statusLabel: string;       // 预计算的显示文本
  statusColorClass: string;  // 预计算的 Tailwind 类名
  usageText: string;         // 如 "3/6 次" 或 "已使用"
  progressPercent: number;   // 0-100
  isExpiringSoon: boolean;
  cycleLabel: string;        // 如 "2026年2月"
}
```

**返回值规范**：
- 始终返回扁平对象，属性为数据数组、标量值、或操作回调。
- 永不返回数组或类实例。

### Layer 4: View（页面组件）

**位置**：`src/app/(dashboard)/<route>/page.tsx`

**规范**：
- Next.js App Router 下，页面组件默认为 Server Component。含有 hooks 的页面需添加 `"use client"`。
- 组件体第一行：解构 ViewModel hook。
- **零业务逻辑**：不允许 `if (amount > 0)`、`.filter()`、`.reduce()` 等逻辑。所有语义决策（颜色类名、格式化字符串、方向标签）由 ViewModel 预计算。
- 允许的操作：JSX 渲染、Tailwind 类名、`map()` 迭代、条件渲染（`&&`、三元表达式）。

```tsx
"use client";
import { useSourcesViewModel } from "@/viewmodels/useSourcesViewModel";

export default function SourcesPage() {
  const { sourceCards, memberFilter, setMemberFilter } = useSourcesViewModel();
  return (
    <div className="grid gap-4">
      {sourceCards.map((card) => (
        <Card key={card.id}>...</Card>
      ))}
    </div>
  );
}
```

### Layer 5: Mock Data（假数据层）

**位置**：`src/data/mock.ts`（单文件）

**文件头注释（强制）**：
```typescript
// Centralized mock data for all pages.
// Type definitions live in @/models/types.ts — edit those to match your domain.
```

**规范**：
- 导入所有类型自 `@/models/types`。
- 每个数据区段用 `// ── Section Name ──` 注释分隔。
- 所有导出为强类型 `const` 命名导出。
- 允许文件内私有辅助函数生成动态数据（不导出）。
- 详细内容见 `04-mock-data.md`。

## 目录结构规划

```
src/
  models/
    types.ts              # 领域接口（Member, Source, Benefit, Redemption, ...）
    cycle.ts              # 周期计算引擎
    benefit.ts            # 权益状态计算 + CRUD
    source.ts             # 来源聚合 + CRUD + 归档
    dashboard.ts          # Dashboard 聚合
    points.ts             # 积分计算 + CRUD
    member.ts             # 成员 CRUD + 验证
    redemption.ts         # 核销 CRUD
    format.ts             # 共享格式化工具
  viewmodels/
    useDashboardViewModel.ts      # Dashboard 情报中心
    useSourcesViewModel.ts        # Sources 列表页
    useSourceDetailViewModel.ts   # Source 详情页（含 Benefits）
    useTrackerViewModel.ts        # Tracker 核销操作页
    useSettingsViewModel.ts       # Settings 设置页
  data/
    mock.ts               # 集中式假数据
  app/
    (dashboard)/
      page.tsx                    # Dashboard
      sources/
        page.tsx                  # Sources 列表
        [id]/
          page.tsx                # Source 详情
      tracker/
        page.tsx                  # Tracker 核销
      settings/
        page.tsx                  # Settings
  test/
    models/
      cycle.test.ts
      benefit.test.ts
      source.test.ts
      dashboard.test.ts
      points.test.ts
      member.test.ts
      redemption.test.ts
      format.test.ts
    viewmodels/
      useDashboardViewModel.test.ts
      useSourcesViewModel.test.ts
      useSourceDetailViewModel.test.ts
      useTrackerViewModel.test.ts
      useSettingsViewModel.test.ts
```

## 测试策略

### Model 测试
- 位置：`src/test/models/<kebab-case>.test.ts`
- 使用内联 fixture（**禁止导入 mock.ts**）。
- 纯函数测试：调用函数 → 断言返回值。
- 覆盖边界情况：空数组、零值、无匹配、日期边界。

### ViewModel 测试
- 位置：`src/test/viewmodels/use<Name>ViewModel.test.ts`
- 使用 `renderHook` 调用 hook。
- 通过 `result.current` 访问返回值。
- 有状态 VM 使用 `act()` 包裹状态变更。
- **不 mock** model 函数——ViewModel 测试使用真实 mock 数据 + 真实 model 函数。

### View（Page）测试
- 位置：`src/test/pages/<Name>Page.test.tsx`
- **Mock ViewModel hook**（`vi.mock`），提供固定返回值。
- 断言渲染内容：`screen.getByText()`、`screen.getAllByText()`。
- **不测试业务逻辑**——业务逻辑由 model + viewmodel 测试覆盖。

### 覆盖率要求

| 层级 | 覆盖率阈值 | 说明 |
|---|---|---|
| Model | 90% | 核心业务逻辑，必须严格覆盖 |
| ViewModel | 90% | 组合逻辑 + 状态管理 |
| View (Page) | 不强制 | 渲染测试验证组件不崩溃即可 |
| lib/ | 90% | 工具函数 |
