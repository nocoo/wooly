# 03 - 页面设计与 UI 映射

> Historical page and interaction design. Current views live in [src/pages](../src/pages), with routes in [src/App.tsx](../src/App.tsx). Use the [current route map](10-maintainer-notes.md#pages) for names and ViewModels; the original layouts and interface sketches below are retained as design history.

## 概述

MVP 包含 **5 个核心页面**，全部位于 `(dashboard)` 路由组下（带侧边栏 + 顶栏）。所有 UI 组件优先从 basalt 模板库复用或适配，确保视觉一致性。

## 页面总览

| 路由 | 页面 | 功能定位 | 对应需求模块 |
|---|---|---|---|
| `/` | Dashboard | 情报中心：回答"现在要用什么？还剩多少？" | 情报中心 |
| `/sources` | Sources | 资产库列表：所有来源的卡片视图 | 资产库 |
| `/sources/[id]` | Source Detail | 资产库详情：单个来源的权益清单与状态 | 资产库 |
| `/tracker` | Tracker | 操作台：快速核销 + 核销日志 | 权益追踪 |
| `/settings` | Settings | 设置：受益人管理 + 偏好设置 | — |

## 侧边栏导航更新

在 `AppSidebar.tsx` 的 `NAV_GROUPS` 中添加：

```typescript
const NAV_GROUPS = [
  {
    label: "总览",
    items: [
      { title: "仪表盘", url: "/", icon: LayoutDashboard },
      { title: "来源",   url: "/sources", icon: Wallet },
      { title: "核销台", url: "/tracker", icon: CheckCircle },
    ],
  },
  {
    label: "系统",
    items: [
      { title: "设置", url: "/settings", icon: Settings },
    ],
  },
];
```

---

## 页面一：Dashboard（情报中心）

**路由**：`/`
**ViewModel**：`useDashboardViewModel`
**核心问题**：现在要用什么？还剩多少？全家概览。

### 布局

```
┌─────────────────────────────────────────────────────────┐
│  Row 1: StatGrid (4列)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 总权益数  │ │ 即将过期  │ │ 当期已用  │ │ 已用完    │   │
│  │    24    │ │    3     │ │    8     │ │   12     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│  Row 2: 2:1 分栏                                         │
│  ┌────────────────────────────┐ ┌──────────────────┐    │
│  │  即将过期提醒列表            │ │  总体使用率       │    │
│  │  (RecentListCard 适配)      │ │  (RadialProgress) │    │
│  │                            │ │      68%         │    │
│  │  ⚠ 招行酒店 · 5天后过期     │ │                  │    │
│  │  ⚠ 平安体检 · 12天后过期    │ │  已用 / 总数     │    │
│  │  ⚠ 88VIP红包 · 月底过期    │ │  剩余            │    │
│  │  🔴 招行白金卡 · 即将到期   │ │                  │    │
│  └────────────────────────────┘ └──────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 3: 2:1 分栏                                         │
│  ┌────────────────────────────┐ ┌──────────────────┐    │
│  │  月度核销趋势               │ │  热门来源         │    │
│  │  (BarChartCard 适配)        │ │  (ItemListCard)   │    │
│  │  █ █ ▇ ▅ ▆ █              │ │  招行白金 · 5/8   │    │
│  │  1  2  3  4  5  6         │ │  平安保险 · 3/6   │    │
│  └────────────────────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 组件映射

| 区域 | basalt 组件 | 适配方式 |
|---|---|---|
| StatGrid 摘要 | `StatCardWidget` + `StatGrid` | **直接复用**，替换数据 |
| 即将过期列表 | `RecentListCard` | **适配**：icon 改为警告级别图标，amount 改为过期天数，date 改为来源名 |
| 总体使用率 | `RadialProgressCard` | **直接复用**，Saved→已用，Target→总数，Remaining→剩余 |
| 月度趋势 | `BarChartCard` | **适配**：数据改为每月核销次数 |
| 热门来源 | `ItemListCard` | **适配**：balance 改为使用计数，change% 改为使用率% |

### ViewModel 输出

```typescript
interface DashboardViewModel {
  // Row 1: 摘要统计
  stats: StatCard[];            // 4 个统计卡片

  // Row 2
  expiringAlerts: AlertItem[];  // 即将过期提醒列表（含权益周期到期 + 来源有效期到期）
  overallUsage: {               // 总体使用率
    usedCount: number;
    totalCount: number;
    percentage: number;
  };

  // Row 3
  monthlyTrend: MonthlyBar[];   // 月度核销趋势
  topSources: SourceSummary[];  // 热门来源
}

// AlertItem 支持两种到期类型
interface AlertItem {
  id: string;
  label: string;               // 权益名或来源名
  sourceName: string;          // 所属来源名（权益到期时显示）
  alertType: "benefit_cycle" | "source_validity";  // 权益周期到期 vs 来源有效期到期
  daysUntil: number;           // 距到期天数
  urgencyClass: string;        // Tailwind 类名
}
```

---

## 页面二：Sources（资产库列表）

**路由**：`/sources`
**ViewModel**：`useSourcesViewModel`
**核心问题**：我有哪些来源？每个来源的使用情况如何？

### 布局

```
┌─────────────────────────────────────────────────────────┐
│  Row 1: StatGrid (3列)                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  总来源数     │ │  活跃权益     │ │  积分来源     │    │
│  │     8        │ │     24       │ │     3        │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 2: 受益人筛选条                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [全部]  [爸爸]  [妈妈]  [奶奶]      [+ 新增来源] │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 3: 来源卡片网格 (md:2列)                              │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │ [favicon] 招行经典白金卡│ │ 🛡 平安全家福保险      │     │
│  │ 爸爸 · 信用卡         │ │ 爸爸 · 保险           │     │
│  │ 📞 95555              │ │ 📞 95511              │     │
│  │ ████████░░░░ 5/8 权益 │ │ ██████░░░░░░ 3/6 权益│     │
│  │ 下次重置：3月25日      │ │ 有效期至 2028-05-20   │     │
│  └──────────────────────┘ └──────────────────────┘     │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │ [favicon] 88VIP       │ │ ⭐ 招行永久积分        │     │
│  │  妈妈 · 会员           │ │ 爸爸 · 积分           │     │
│  │  ██████████░░ 4/5 权益 │ │ 余额: 23,500 积分     │     │
│  │  下次重置：3月1日       │ │ 可兑换 3 项           │     │
│  └──────────────────────┘ └──────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Row 4: 已归档来源 (默认折叠)                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ▶ 已归档 (1)                                    │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │  🏦 工商银行白金卡 (已归档)               │   │    │
│  │  │  爸爸 · 信用卡 · [取消归档]               │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

> **来源卡片右键/操作菜单**：每张来源卡片的右上角提供 `⋮` 操作菜单，包含：编辑、归档、删除。
```

### 组件映射

| 区域 | basalt 组件 | 适配方式 |
|---|---|---|
| StatGrid 摘要 | `StatCardWidget` + `StatGrid` | **直接复用** |
| 受益人筛选条 | — | **新建**：水平 pill 按钮行 |
| 来源卡片 | `TargetCardsPage` 的目标卡片模式 | **适配**：favicon 图标（含加载失败 fallback）+ 标题 + 服务热线 + 进度条 + 底部元数据（有效期/下次重置）+ 已过期标签 + 操作菜单（编辑/归档/删除） |
| 积分来源卡片 | `TargetCardsPage` 的目标卡片模式 | **适配**：进度条替换为余额显示 + 可兑换项计数 |

### ViewModel 输出

```typescript
interface SourcesViewModel {
  stats: StatCard[];
  members: MemberOption[];            // 筛选选项
  selectedMember: string | null;
  setSelectedMember: (id: string | null) => void;
  sourceCards: SourceCard[];          // 过滤后的来源卡片（不含已归档）
  archivedSourceCards: SourceCard[];  // 已归档来源卡片
  pointsSourceCards: PointsSourceCard[];  // 积分来源卡片

  // CRUD 操作
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editingSource: Source | null;
  formInput: CreateSourceInput;
  setFormInput: (input: CreateSourceInput) => void;
  formErrors: ValidationError[];
  handleCreateSource: () => void;
  handleUpdateSource: () => void;
  handleDeleteSource: (id: string) => void;
  handleToggleArchive: (id: string) => void;
  startEditSource: (id: string) => void;

  // 积分来源 CRUD
  handleCreatePointsSource: () => void;
  handleDeletePointsSource: (id: string) => void;
}
```

---

## 页面三：Source Detail（资产库详情）

**路由**：`/sources/[id]`
**ViewModel**：`useSourceDetailViewModel(id)`
**核心问题**：这个来源有哪些权益？各自状态如何？

### 布局

```
┌─────────────────────────────────────────────────────────┐
│  Row 1: 来源头部卡片 (全宽)                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [favicon] 招行经典白金卡          [已过期] 标签  │    │
│  │  受益人：爸爸 · 信用卡 · CNY                       │    │
│  │  📞 95555 · 🌐 cmbchina.com                      │    │
│  │  有效期：2024-01-15 ~ 2027-01-15                  │    │
│  │  ████████████░░░ 62% 已使用                      │    │
│  │  周期：每月25日重置 · 下次重置：3月25日              │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 2: StatGrid (3列)                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  权益总数     │ │  已用完       │ │  即将过期     │    │
│  │     8        │ │     5        │ │     1        │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 3: 2:1 分栏                                         │
│  ┌────────────────────────────────┐ ┌──────────────┐   │
│  │  权益进度列表                    │ │  受益人使用    │   │
│  │                                │ │   统计        │   │
│  │  ✅ 机场贵宾厅    [4/6 次]      │ │              │   │
│  │  ████████░░░░░░░              │ │  爸爸 · 8次   │   │
│  │                                │ │  妈妈 · 3次   │   │
│  │  🟡 酒店权益      [0/1 次]      │ │              │   │
│  │  ░░░░░░░░░░░░░░░  ⚠ 5天后过期 │ │              │   │
│  │                                │ │              │   │
│  │  ✅ 星巴克买一送一  已使用       │ │              │   │
│  │  ████████████████              │ │              │   │
│  │                                │ │              │   │
│  │  🔔 消费1笔免月费  待办         │ │              │   │
│  │  (Action 类型，仅显示提醒)       │ │              │   │
│  │                                │ │              │   │
│  │  [+ 添加权益]                   │ │              │   │
│  └────────────────────────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘

> **权益行操作**：每行右侧提供操作按钮组：编辑、删除。Quota/Credit 类型额外显示 [核销] 快捷按钮。
```

### 组件映射

| 区域 | basalt 组件 | 适配方式 |
|---|---|---|
| 来源头部卡片 | `TargetCardsPage` 目标卡片 | **适配**：放大为全宽，增加周期信息 |
| StatGrid | `StatCardWidget` + `StatGrid` | **直接复用** |
| 权益进度列表 | `ProgressTrackingPage` 的预算进度列表 | **适配**：label→权益名，spent/limit→已用/总数，进度条颜色按状态 |
| 受益人使用统计 | `ItemListCard` | **适配**：账户→受益人头像+名字，余额→核销次数 |
| 状态徽章 | — | **新建**：多状态小标签组件（available/exhausted/expiring/wasted） |

### ViewModel 输出

```typescript
interface SourceDetailViewModel {
  source: SourceHeader;             // 来源头部信息
  stats: StatCard[];                // 3 个统计
  benefitRows: BenefitRow[];        // 权益进度列表
  memberUsage: MemberUsageItem[];   // 受益人使用统计

  // 来源编辑
  handleUpdateSource: (updates: Partial<Source>) => void;
  handleDeleteSource: () => void;  // 删除后导航回 /sources
  handleToggleArchive: () => void;

  // 权益 CRUD
  benefitFormOpen: boolean;
  setBenefitFormOpen: (open: boolean) => void;
  editingBenefitId: string | null;
  benefitFormInput: CreateBenefitInput;
  setBenefitFormInput: (input: CreateBenefitInput) => void;
  benefitFormErrors: ValidationError[];
  handleCreateBenefit: () => void;
  handleUpdateBenefit: () => void;
  handleDeleteBenefit: (id: string) => void;
  startEditBenefit: (id: string) => void;

  // 快捷核销
  redeem: (benefitId: string, memberId: string, memo?: string) => void;
}

// ViewModel 本地接口
interface SourceHeader {
  id: string;
  name: string;
  memberName: string;
  categoryLabel: string;            // "信用卡"、"保险" 等
  currency: string;
  icon: { type: "favicon" | "icon" | "category"; value: string };  // resolveSourceIcon 结果
  phone: string | null;             // 服务热线
  websiteDomain: string | null;     // 从 website 提取的域名（用于显示）
  validFromLabel: string | null;    // 格式化的生效日期
  validUntilLabel: string | null;   // 格式化的到期日期
  isExpired: boolean;               // 是否已过期
  isExpiringSoon: boolean;          // 是否即将到期
  expiryWarning: string | null;     // "已过期" | "30天后到期" | null
  overallUsagePercent: number;
  cycleLabel: string;               // "每月25日重置"
  nextResetLabel: string;           // "下次重置：3月25日"
  archived: boolean;
}

interface BenefitRow {
  id: string;
  name: string;
  type: BenefitType;
  statusLabel: string;              // "4/6 次" | "已使用" | "待办"
  statusColorClass: string;         // Tailwind 类名
  progressPercent: number;
  isExpiringSoon: boolean;
  expiryWarning: string | null;     // "5天后过期"
  cycleLabel: string;
  shared: boolean;
}
```

---

## 页面四：Tracker（操作台）

**路由**：`/tracker`
**ViewModel**：`useTrackerViewModel`
**核心问题**：快速核销一个权益，查看最近的核销记录。

### 布局

```
┌─────────────────────────────────────────────────────────┐
│  Row 1: StatGrid (3列)                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  今日核销     │ │  本周核销     │ │  本月核销     │    │
│  │     2        │ │     7        │ │     15       │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Row 2: 2:1 分栏                                         │
│  ┌────────────────────────────────┐ ┌──────────────┐   │
│  │  核销日志                       │ │  快捷操作     │   │
│  │  (RecentListCard 适配)          │ │ (ActionGrid)  │   │
│  │                                │ │              │   │
│  │  ✅ 机场贵宾厅 · 爸爸           │ │  [🎫 核销]    │   │
│  │     2月10日 · 招行白金          │ │  [📋 查看]    │   │
│  │                                │ │  [➕ 新来源]  │   │
│  │  ✅ 星巴克买一送一 · 妈妈       │ │  [⚡ 积分]    │   │
│  │     2月9日 · 88VIP             │ │              │   │
│  │                                │ │              │   │
│  │  ✅ 月度红包 · 爸爸             │ │              │   │
│  │     2月1日 · 88VIP             │ │              │   │
│  └────────────────────────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Row 3: 可核销权益列表 (全宽)                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📋 可核销权益                                    │    │
│  │                                                  │    │
│  │  招行白金 · 酒店权益     0/1次  ⚠ 5天后   [核销]  │    │
│  │  招行白金 · 洗牙         0/1次  30天后    [核销]  │    │
│  │  88VIP · 视频会员月卡    未使用  月底过期  [核销]  │    │
│  │  平安 · 体检             0/1次  90天后    [核销]  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 组件映射

| 区域 | basalt 组件 | 适配方式 |
|---|---|---|
| StatGrid | `StatCardWidget` + `StatGrid` | **直接复用** |
| 核销日志 | `RecentListCard` | **适配**：交易图标→权益图标，金额→来源名，日期→核销日期 |
| 快捷操作 | `ActionGridCard` | **直接复用**，替换操作标签和图标 |
| 可核销权益列表 | `ProgressTrackingPage` 预算列表 | **适配**：增加 [核销] 按钮 |
| 核销确认 | shadcn `Dialog` | **新建**：选择受益人 → 确认核销的弹窗 |

### 核销交互流程

```
用户点击 [核销] 按钮
      │
      ▼
  ┌─────────────────────┐
  │  核销确认 Dialog      │
  │                     │
  │  权益：机场贵宾厅     │
  │  来源：招行白金       │
  │  类型：次数型 (4/6)   │
  │                     │
  │  使用人：[爸爸 ▾]     │   ← 默认为 Source 的受益人
  │  备注：[________]    │   ← 可选
  │                     │
  │  [取消]   [确认核销]  │
  └─────────────────────┘
      │
      ▼
  Toast: "✅ 已核销：机场贵宾厅 (5/6)"
```

### ViewModel 输出

```typescript
interface TrackerViewModel {
  stats: StatCard[];
  recentRedemptions: RedemptionLogItem[];
  redeemableBenefits: RedeemableBenefitItem[];

  // 核销操作
  redeem: (benefitId: string, memberId: string, memo?: string) => void;

  // 撤销核销
  undoRedemption: (redemptionId: string) => void;
}
```

---

## 页面五：Settings（设置）

**路由**：`/settings`
**ViewModel**：`useSettingsViewModel`
**核心问题**：管理家庭受益人、调整偏好。

### 布局

```
┌───────────────────────────────────────────────────────────┐
│  grid lg:grid-cols-4                                       │
│  ┌──────────┐ ┌──────────────────────────────────────┐    │
│  │ 导航      │ │  内容区                               │    │
│  │          │ │                                      │    │
│  │ 受益人 ← │ │  ┌──────────────────────────────┐    │    │
│  │ 偏好设置  │ │  │  家庭受益人                     │    │    │
│  │ 时区     │ │  │                              │    │    │
│  │ 账户     │ │  │  👤 爸爸 (本人)  [编辑] [删除] │    │    │
│  │          │ │  │  👤 妈妈 (配偶)  [编辑] [删除] │    │    │
│  │          │ │  │  👤 奶奶 (父母)  [编辑] [删除] │    │    │
│  │          │ │  │                              │    │    │
│  │          │ │  │  [+ 添加受益人]               │    │    │
│  │          │ │  └──────────────────────────────┘    │    │
│  │          │ │                                      │    │
│  └──────────┘ └──────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

> **添加/编辑受益人弹窗**：点击 [+ 添加受益人] 或 [编辑] 时弹出 Dialog 表单，包含：名称（必填）、与户主关系（下拉选择 MemberRelationship 枚举，必填）、头像（可选 emoji 选择器）。

### 设置分区

| 分区 | 内容 | basalt 来源 |
|---|---|---|
| **受益人** | 家庭成员 CRUD 列表（显示名称+关系） | `SecuritySection` 会话列表适配 + `ProfileSection` 表单适配 |
| **偏好设置** | 主题切换、通知开关 | `AppearanceSection` + `NotificationsSection` 直接复用 |
| **时区** | 时区选择（用于周期计算的日期判定） | 新增，下拉选择常用时区（默认 Asia/Shanghai） |
| **账户** | Google 账户信息（只读）、登出 | `ProfileSection` 适配（只读模式） |

### 时区设置详情

时区影响周期引擎中"今天是几号"的判定。例如：
- 用户在 UTC+8 区域，当地时间 2026-03-01 01:00，此时 UTC 仍为 2026-02-28 17:00。
- 如果不考虑时区，月度权益可能提前/延后重置。

```
┌──────────────────────────────────────┐
│  时区设置                              │
│                                      │
│  当前时区：Asia/Shanghai (UTC+8)       │
│                                      │
│  [Asia/Shanghai ▾]                   │
│                                      │
│  常用时区：                            │
│  · Asia/Shanghai (UTC+8) 北京/上海    │
│  · Asia/Tokyo (UTC+9) 东京            │
│  · America/New_York (UTC-5) 纽约     │
│  · America/Los_Angeles (UTC-8) 洛杉矶 │
│  · Europe/London (UTC+0) 伦敦         │
│                                      │
│  提示：时区影响权益周期的日期判定。       │
│  修改时区后，当前周期的剩余天数计算       │
│  可能发生变化。                         │
└──────────────────────────────────────┘
```

### ViewModel 输出

```typescript
interface SettingsViewModel {
  // 导航
  activeSection: string;
  setActiveSection: (section: string) => void;

  // 受益人 CRUD
  members: MemberItem[];  // 包含 name + relationship 显示
  memberFormOpen: boolean;
  setMemberFormOpen: (open: boolean) => void;
  editingMemberId: string | null;
  memberFormInput: CreateMemberInput;  // { name, relationship, avatar }
  setMemberFormInput: (input: CreateMemberInput) => void;
  memberFormErrors: ValidationError[];
  handleCreateMember: () => void;
  handleUpdateMember: () => void;
  handleDeleteMember: (id: string) => void;
  startEditMember: (id: string) => void;
  memberDependents: DependentsSummary | null;  // 删除前的级联检查

  // 时区
  timezone: string;                     // IANA 时区标识，如 "Asia/Shanghai"
  setTimezone: (tz: string) => void;
  timezoneOptions: TimezoneOption[];    // 常用时区列表
}

interface MemberItem {
  id: string;
  name: string;
  relationship: MemberRelationship;
  relationshipLabel: string;  // 预计算的中文标签："本人"、"配偶"等
  avatar: string | null;
  sourceCount: number;  // 关联的来源数量（用于删除检查提示）
}

interface TimezoneOption {
  value: string;         // "Asia/Shanghai"
  label: string;         // "Asia/Shanghai (UTC+8) 北京/上海"
  offsetLabel: string;   // "UTC+8"
}
```

---

## 新建组件清单

以下组件需要从零构建（遵循 basalt 视觉风格）：

| 组件 | 使用页面 | 复杂度 | 说明 |
|---|---|---|---|
| `MemberFilterBar` | Sources | 低 | 水平 pill 按钮行，选中态用 `bg-primary` |
| `BenefitStatusBadge` | Source Detail, Tracker | 低 | 多状态小标签：available(绿)/exhausted(灰)/expiring(橙)/wasted(红)/pending(蓝) |
| `RedeemDialog` | Tracker, Source Detail | 中 | 核销确认弹窗：选择受益人 + 备注 + 确认。基于 shadcn Dialog |
| `BenefitProgressRow` | Source Detail, Tracker | 低 | 权益进度行：名称 + 状态标签 + 进度条 + 操作按钮（核销/编辑/删除）。从 ProgressTrackingPage 的预算行适配 |
| `SourceCard` | Sources | 低 | 来源卡片：favicon 图标（加载失败 fallback 到 icon/分类默认图标）+ 名称 + 服务热线 + 进度条 + 元数据（有效期、下次重置）+ 已过期/即将到期标签 + 操作菜单（编辑/归档/删除）。从 TargetCardsPage 的目标卡片适配 |
| `PointsSourceCard` | Sources | 低 | 积分来源卡片：余额 + 可兑换项计数 + 操作菜单 |
| `SourceFormDialog` | Sources, Source Detail | 中 | 新增/编辑来源弹窗：名称、网站URL、服务热线、分类、币种、受益人、周期锚点配置、生效日期、到期日期。基于 shadcn Dialog。网站字段含格式提示（需含 https://）。有效期字段使用日期选择器。 |
| `BenefitFormDialog` | Source Detail | 中 | 新增/编辑权益弹窗：名称、类型、配额/额度、周期覆盖、共享设置。基于 shadcn Dialog |
| `MemberFormDialog` | Settings | 低 | 新增/编辑受益人弹窗：名称、关系、头像。基于 shadcn Dialog |
| `DeleteConfirmDialog` | 全局通用 | 低 | 删除确认弹窗：显示级联影响统计 + 确认按钮。基于 shadcn AlertDialog |
| `TimezoneSelect` | Settings | 低 | 时区下拉选择器，含常用时区和 UTC 偏移显示 |

## 页面路由注册

在 `DashboardLayout.tsx` 的 `PAGE_TITLES` 中添加：

```typescript
const PAGE_TITLES: Record<string, string> = {
  "/": "仪表盘",
  "/sources": "来源",
  "/tracker": "核销台",
  "/settings": "设置",
  // 动态路由 /sources/[id] 的标题由页面组件自行设置（显示来源名称）
};
```
