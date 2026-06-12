# 07 — UI 设计审计：wooly vs pew

> **目的**：以 pew（`/Users/nocoo/workspace/personal/pew`）作为同源 basalt 设计系统下"已成熟落地"的标杆，全面审计 wooly 当前 UI，识别风格漂移、缺失模式、可借鉴细节，给出按优先级排序的改进项。
> **审计日期**：2026-06-12
> **审计人**：claude（基于源码静态对比）

---

## 0. TL;DR

- 两者血缘相同（basalt 模板：3 层灰阶 + AppShell floating island + 同款 sidebar 骨架），所以**框架完全一致**，问题不在"换皮"，而在 wooly 在很多**应该统一的地方走了野路子**。
- **最值得抄的 5 件事**（按 ROI 排）：
  1. **`DashboardSegment` 段落标题**——pew 把仪表盘切成 Overview / Trends / Insights 三段，用 `text-xs uppercase tracking-wider` 小标签 + 1px 分隔线。wooly 全靠 grid 堆，缺乏信息层级。**注意 wooly 落地需补响应式规则**（中文标题 + 动态 action 在 sm 屏会挤压，详见 §2.1）。
  2. **侧边栏分组标题改为 `uppercase tracking-wider`**——pew 的"工程感"主要靠这一处。wooly 现在用 `text-sm font-normal`，看着像普通正文。
  3. **在仪表盘的"模式互斥切换"位上引入 segment-control**——只用在 1-2 个明确的 mode toggle（如未来的"本月/本季/全部"或 tracker 的"日志/可核销"视图切换）。**不替换** tracker 撤销按钮（那是 action）、settings 左导航（垂直结构）、`MemberFilterBar`（动态数量 + 可换行）。详见 §2.3。
  4. **StatCard 顶部 accent bar**——pew 在重要指标上加 `h-0.5 w-8` 的彩色细条，零成本拉视觉重心，wooly 的 `StatCardWidget` 完全没有。
  5. **统一 Badge 语言**——wooly 已经有 `src/components/ui/badge.tsx` 的 `Badge` + `badgeVariants`（含 destructive/success/warning），但 `BenefitStatusBadge` 又自己 hardcode 了一套类名。先把现有 status badge 收编到 `Badge` 上，**不要新造平行 Pill 组件**。详见 §2.6。
- **wooly 独有的设计资产**（pew 抄不到）：30 色 chart palette（含 6 张黑卡变体）、SourceCard 银行卡视觉、login 工牌 badge——这些已经是好东西，**不要因为对齐 pew 而稀释**。
- **建议方向**：保留 wooly 的"金融/家庭温度感"主调（玫红 + 多彩），但把**信息密度高的页面（仪表盘、追踪台、设置）**向 pew 的"工程化分段"靠拢。卡片秀场（sources）继续放飞。
- **执行原则**：所有视觉改动必须走"截图矩阵"验收闭环（详见 §3），不口头通过。

---

## 1. 设计血统对比

| 维度 | wooly | pew | 结论 |
|---|---|---|---|
| 模板源头 | basalt | basalt | 同源 ✅ |
| AppShell | `DashboardLayout.tsx`（floating island, `rounded-[16px] md:rounded-[20px]`, `bg-card`, `px-2 pb-2`）| `app-shell.tsx`（同上）| **完全一致** |
| Sidebar 宽度 | 260 / 68 px | 260 / 68 px | 一致 |
| 3 层灰阶 | L0 `220 14% 94%` / L1 `220 14% 97%` / L2 `0 0% 100%` | L0 `260 20% 95%` / L1 `260 20% 98%` / L2 `0 0% 100%` | 同体系，wooly 更暖中性，pew 更冷紫调 |
| 主色 | Magenta `320 70% 55%` | Electric Violet `270 85% 52%` | 都是高饱和紫红系，pew 更"激光"更游戏化 |
| 字体 | Inter（body）+ DM Sans（display）| Inter + Space Grotesk（display）+ Caveat（handwriting，仅 logo）| pew 多一把 Caveat 给品牌名做手写签名感 |
| Radius token | `--radius-card: 14px` / `--radius-widget: 10px` | 同上 | 一致 |
| Chart 数量 | **30 色**（含 25-30 黑卡变体）+ 4 套 heatmap（绿红蓝橙）| 8 色 + 1 套 heatmap（绿）| wooly 远更丰富；pew 更克制 |

**判断**：wooly 不是"另一个设计系统"，是 basalt 同款骨架的家庭版分支。漂移基本都是 wooly 单方面"加戏"或"少做"。

---

## 2. 风格漂移逐项

### 2.1 仪表盘缺少分段标题 — **优先级 P0**

**wooly**（`src/app/(dashboard)/page.tsx:74-135`）：

```tsx
<div className="space-y-4 md:space-y-6">
  <StatGrid columns={4}>{stats.map(...)}</StatGrid>
  <div className="grid gap-4 md:gap-6 md:grid-cols-3">
    <RecentListCard ... />
    <RadialProgressCard ... />
  </div>
  <div className="grid gap-4 md:gap-6 md:grid-cols-3">
    <BarChartCard ... />
    <ItemListCard ... />
  </div>
</div>
```

页面是 4 行 grid 直接堆。**没有任何"这是统计 / 这是趋势 / 这是热门"的语义分段**。

**pew**（`src/app/(dashboard)/dashboard/page.tsx:212-368`）：

```tsx
<DashboardSegment title="Overview" action={<PeriodSelector />}>
  <StatGrid columns={4}>{...}</StatGrid>
  <StatGrid columns={2}>{...}</StatGrid>
</DashboardSegment>
<DashboardSegment title="Trends">{...}</DashboardSegment>
<DashboardSegment title="Insights">{...}</DashboardSegment>
```

`DashboardSegment`（`src/components/dashboard/dashboard-segment.tsx`）核心实现就 8 行：

```tsx
<section className="space-y-3 md:space-y-4">
  <div className="flex items-center gap-3">
    <h2 className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {title}
    </h2>
    <div className="h-px flex-1 bg-border/60" />
    {action && <div className="shrink-0">{action}</div>}
  </div>
  {children}
</section>
```

**改进建议**：
- 在 `src/components/dashboard/` 下新建 `DashboardSegment.tsx`，**不要照抄 pew 原版**——pew 的 `flex items-center` + `shrink-0` 假设了"短英文标题 + 短 PeriodSelector"，wooly 的中文标题（"即将过期提醒" 7 个字）+ 动态 action 在 sm 屏会被挤压换行得很难看。
- wooly 版必须支持两种 header 行为，建议如下落地：
  ```tsx
  <section className="space-y-3 md:space-y-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <h2 className="shrink-0 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </h2>
      <div className="hidden sm:block h-px flex-1 bg-border/60" />
      {action && <div className="sm:shrink-0">{action}</div>}
    </div>
    {children}
  </section>
  ```
  - 移动端：标题、action 各占一行，分隔线隐藏。
  - 桌面端：还原 pew 的横向布局。
  - `tracking-[0.15em]` 让中文 uppercase 失效但保留"标签感"，详见 §2.2。
- 应用范围：**先只改 `dashboard/page.tsx`**。**注意每个 widget 自己已经有标题**（`即将过期提醒` / `月度核销趋势` / `热门账户`）——再套段标题等于双层小标题，会显得重复。阶段 1 先按"概览 / 关注 / 分析"切 **2-3 段**，截图评审后再决定是否细分：
  - 「概览」= StatGrid（4 张数字卡）
  - 「关注」= 过期提醒 + 总体使用率（这两个是行动信号，单独成段）
  - 「分析」= 月度趋势 + 热门账户（这两个是回顾性数据）
- 不要在阶段 1 就切到 4 段；先用 2 段（合并"关注"和"分析"）也是合理选择，看截图谁更舒服。

### 2.2 侧边栏分组标题缺乏"工程感" — **优先级 P1**

**wooly**（`src/components/AppSidebar.tsx:69-70`）：
```tsx
<span className="text-sm font-normal text-muted-foreground">{group.label}</span>
```
渲染出来是普通的"总览"、"系统"，看着像段落。

**pew**（`src/components/layout/sidebar.tsx:120-122`）：
```tsx
<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
  {group.label}
</span>
```
渲染出来是「TOTAL · SYSTEM」感，紧凑、扁平、像 IDE。

**改进建议**：
- 直接对齐 pew：`text-xs font-medium uppercase tracking-wider text-muted-foreground/70`。
- 中文 uppercase 无效，但 `tracking-wider` 对中文也有效；为了视觉一致，建议组名改成英文小写或保留中文但加 `tracking-[0.15em]`。
  - 选 A：英文化（"OVERVIEW"、"SYSTEM"）——和 pew 一模一样，但和"全中文 UI"原则冲突。
  - 选 B：中文 + 增大字距（"总览"、"系统"，class 加 `tracking-[0.2em]`）——视觉上有"分类"感，同时不破坏中文。
  - 推荐 B。

### 2.3 缺少统一的 SegmentedControl 原子组件 — **优先级 P1**

**pew**（`src/components/dashboard/period-selector.tsx`）：

```tsx
<div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
  {options.map(opt => (
    <button className={cn(
      "rounded-md px-3 py-1.5 text-xs font-medium",
      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
    )}>
      {opt.label}
    </button>
  ))}
</div>
```

外壳 `bg-secondary p-1`、内态 `bg-card shadow-sm`——典型的 iOS 风 segment control。**pew 仪表盘的 tabs（Tokens/Cost）也用同款**（`src/app/(dashboard)/dashboard/page.tsx:315-330`）。

**wooly 现状盘点**（避免误判）：
| 用途 | 现实现 | 文件 | 是否换 SegmentedControl |
|---|---|---|---|
| 时段筛选（未实现） | — | — | ✅ 适用，未来加 |
| Tracker 撤销按钮 | ghost button | `src/app/(dashboard)/tracker/page.tsx:129-143` | ❌ 这是 action（操作），不是 mode toggle |
| Settings 左导航 | 自定义垂直按钮组 | `src/app/(dashboard)/settings/page.tsx:61-81` | ❌ 垂直 + 4 项，不是水平互斥模式 |
| MemberFilterBar | flex-wrap pills | `src/components/MemberFilterBar.tsx:23-46` | ❌ 动态数量（成员数）+ 移动端会换行，segment-control 不适合 |

**改进建议**：
- 在 `src/components/ui/` 下新建 `segmented-control.tsx`，**严格只用于互斥模式切换**（≤4 个固定选项、横向、不换行）。
- 当下唯一明确用例是未来仪表盘的「本月 / 本季 / 全部」筛选；其他场景**不要扩张**。
- 与 `MemberFilterBar` 的关系：两者**共享视觉 token**（圆角、active 用 primary/card 对比），但**保留各自形态**——SegmentedControl 是固定槽位，MemberFilterBar 是动态 pill 列表。可以做的是把 MemberFilterBar 的 active 态从 `bg-primary text-primary-foreground` 调整为更柔和的 `bg-card text-foreground shadow-sm`（如果觉得现在的实色太重），但**不要强行改成胶囊容器**。
- Settings 左导航**不动**——垂直导航有自己的语言（更像 sidebar），当前实现 OK。

### 2.4 StatCard 缺少 accent 视觉锚点 — **优先级 P2**

**wooly**（`src/components/dashboard/StatCardWidget.tsx`）：单一卡片样式，标题 → 数字 → 趋势。

**pew**（`src/components/dashboard/stat-card.tsx`）多了三件事：
1. `variant: "primary" | "secondary"`，主指标更大字号（`text-3xl md:text-4xl` vs `text-2xl md:text-3xl`）和更多内边距。
2. **顶部 accent bar**：`<div className="h-0.5 w-8 rounded-full mb-4 bg-gradient-to-r from-primary to-chart-8" />`，主指标用渐变，次要指标传 `accentColor="bg-chart-3"` 等单色。
3. **多趋势支持**（`trends` 数组），可以同时显示 "vs 上月 / vs 同期"。

**改进建议**：
- `StatCardWidget` 加 `variant` 和 `accentColor` props（向后兼容默认值）。
- 仪表盘的 4 个 StatCard 至少 1-2 个用 primary 变体（"总核销次数"、"总账户数"），其余维持 secondary。

### 2.5 SourceCard 设计强度过高，与 dashboard 风格断裂 — **优先级 P2**

**wooly** 的 SourceCard（`src/components/SourceCard.tsx`，417 行）是当前 UI 的视觉巅峰：
- 86:54 银行卡比例 + 6 套 category gradient + 24+6 个自定义 colorIndex；
- 装饰圆 `absolute -top-12 -right-12 h-40 w-40` + NFC 图标 + 卡号 `•••• 1234` + 进度条 + 有效期/客服/成本三栏。
- **极强的金融视觉语言**，pew 全站找不到对手。

但同一个 `sources/page.tsx` 上，下半部分又出现了 RadialProgressCard / BarChartCard / ItemListCard——这些是仪表盘风的扁平 secondary 卡。**两种语言并置，过渡突兀**。

**改进建议（不是要删掉 SourceCard，是给它一个"舞台"）**：
- 用 `DashboardSegment` 把 `sources/page.tsx` 切成清晰的两段：「账户卡」（SourceCard 网格）和「用量分析」（扁平 widget 群），中间加分隔线。
- 或者把 SourceCard 网格放进一个 `bg-card` 的 island 里（外套层级 +1），让它视觉上"成组"。
- 建议保留 SourceCard 的所有装饰，只是在页面层级上"框"住它。

### 2.6 Status badge 实现存在双轨 — **优先级 P3**

**wooly 现状**：

- `src/components/ui/badge.tsx` 已经有完善的 `Badge` + `badgeVariants`，含 `default / secondary / destructive / success / warning / outline` 6 个变体。`src/app/(dashboard)/sources/[id]/page.tsx:183` 已在用它。
- 但 `src/components/BenefitStatusBadge.tsx` 自己 hardcode 了一套 `STATUS_STYLES` 映射（`bg-emerald-500/10 text-emerald-600` 等），完全没用 `Badge`。
- 此外 `SourceCard.tsx:267-275` 内联了 `已过期` / `即将到期` chip（又是另一份样式）。

**pew 对照**：用 `TokenTierBadge`（`src/components/leaderboard/token-tier-badge.tsx`）和 `RankBadge`（`rank-badge.tsx`）做"小语义徽章"。这两个是**业务专属**徽章——pew 同时也有 `src/components/ui/badge.tsx` 做基础语言。所以 pew 的模式是：**`Badge` 是基础原子，业务徽章在它上面薄薄包一层**。

**改进建议（不新增 Pill 抽象）**：
1. **第一步：让 `BenefitStatusBadge` 复用 `Badge`**——把 6 个 `BenefitCycleStatus` 映射成 `Badge` 的 variant：
   ```tsx
   const STATUS_TO_VARIANT: Record<BenefitCycleStatus, BadgeVariant> = {
     available: "success",
     partially_used: "secondary",
     exhausted: "outline",
     expiring_soon: "warning",
     pending: "secondary",
     not_applicable: "outline",
   };
   // BenefitStatusBadge becomes a thin wrapper:
   return <Badge variant={STATUS_TO_VARIANT[status]}>{label ?? STATUS_LABELS[status]}</Badge>;
   ```
   - `partially_used` 现在用 sky 色，新版会变成 secondary 的灰色——**可接受**，因为"部分使用"本就不是 alert 状态。如果产品要求保留 sky 色，给 `Badge` 加一个 `info` variant（`bg-sky-500/15 text-sky-600`），不要绕开它。
2. **第二步：扩展 `Badge` 的 variant**——给它加 `info` (sky) 和 `neutral` (muted)，覆盖所有 BenefitStatusBadge 当前的色域。
3. **第三步：把 `SourceCard.tsx:267-275` 的内联 chip 也换成 `<Badge variant="destructive" className="bg-red-500/20 text-red-200">`**——SourceCard 是深色卡，可能要给 Badge 加 dark-on-color 适配（或 SourceCard 内继续用 inline，因为它的色彩约束特殊）。如果统一难度大，**SourceCard 内联可以保留**，文档化"deep card 上的 status chip 不走 Badge"作为例外。

**不要做的事**：
- ❌ **不要新建 `Pill` 组件**——会和 `Badge` 形成平行抽象，读者要查"用 Badge 还是 Pill"。
- ❌ **不要把 `RankBadge` / `TokenTierBadge` 风格的"业务徽章"当作 wooly 必须有的东西**——那是 pew 的领域语言（leaderboard、token tier）。wooly 真有同等需求时再做（例如"账户健康度 A/B/C"），到时候同样在 `Badge` 上薄薄包一层。

### 2.7 Logo 缺少品牌签名感 — **优先级 P3（品牌探索，不归入对齐项）**

pew 的 logo 用 Caveat 手写体（`font-handwriting`），加上 24px 图形 + version chip：

```tsx
<img src="/logo-24.png" />
<span className="text-[31px] font-bold font-handwriting tracking-tighter mt-[-12px]">pew</span>
<span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">v{APP_VERSION}</span>
```

wooly 的 logo 是粗体 sans + 字母 logo（`AppSidebar.tsx:248`）：
```tsx
<Logo size="sm" />
<span className="text-lg font-bold tracking-tighter text-foreground">wooly</span>
```

**这是品牌识别改动，不是低风险对齐项。** 当前 wooly 只引入了 Inter / DM Sans（`src/app/layout.tsx:2`），换字体涉及：
- 字体加载体积（多一把 web font）
- wordmark 视觉权重重新平衡（手写体的笔画密度和 logo 图形的关系）
- 用户对"品牌一致性"的认知成本

**改进流程（不立刻动手）**：
1. **品牌探索**：用 baoyu-design 的 wireframe 模式，出一组 wordmark 候选（Caveat / Pacifico / Kalam / 当前 sans），每个都搭配 sidebar collapsed/expanded 两种态、light/dark 两种主题，截图矩阵呈现。
2. **截图评审**：哥过目后再决定方向。
3. **如果决定换**：单独开一个 PR，单独做 visual regression（避免和"对齐 pew 的工程化"那批改动混在一起）。

**version chip 单独说明**：

它**不是纯视觉细节**，是可见的产品信息（用户能看到 `v0.0.3` 这种字符串）。当前 wooly 没有 `APP_VERSION` 常量（pew 在 `src/lib/version.ts` 里维护）。落地路径：

1. **新建 `src/lib/version.ts`**，从 `package.json` 的 `version` 字段读出来：
   ```ts
   import pkg from "../../package.json";
   export const APP_VERSION = pkg.version;
   ```
   或者用 build-time env：在 `next.config.js` 里 `env: { NEXT_PUBLIC_APP_VERSION: pkg.version }`。
2. **在 sidebar expanded view 渲染**（`AppSidebar.tsx:248` 附近）：
   ```tsx
   <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
     v{APP_VERSION}
   </span>
   ```
3. **release 流程要带上 version bump**——pew 的 `bun run release` 会同步更新 `package.json` + 源码常量；wooly 当前没有这个，每次发布手动 bump。建议先用方案 1（直接 import package.json），等需要更细粒度时再上 release script。

低风险，但**不是零成本**——需要测试 import package.json 在 build 时不会引入整个文件到 client bundle（Next.js 一般会 tree-shake 掉非 `version` 字段，但要验）。

### 2.8 主题切换 UX 略弱 — **优先级 P3**

两个项目的 `ThemeToggle` 都在 header 右上。wooly 的 ThemeToggle 实现见 `src/components/ThemeToggle.tsx`（已用 `useSyncExternalStore`，技术上更现代）。

但**视觉上，pew 的 toggle 是经典 sun/moon 图标切换，wooly 的有 system/light/dark 3 态**——多一个状态对家庭用户其实是负担（多数人不切系统主题，只切明暗）。

**改进建议**（不强求）：
- 评估一下 settings/preferences 是否已经有 theme 选项；如果有，header toggle 可以简化成 2 态（明 / 暗），系统跟随放进 settings。

### 2.9 GitHub 图标提取在 v1 之后失去工作量管控 — **观察项**

wooly 之前为了升级 lucide v1 抽了 `src/components/icons/github.tsx`（这次重构的成果之一）。pew 现在还在 lucide < v1（`import { Github } from "lucide-react"`），未来 pew 升级时会撞同一堵墙。**这不是 wooly 的问题，是 wooly 走在前面**。

---

## 3. 视觉验收闭环（先于路线图执行）

任何被路线图列入的视觉改动，**合并前必须经过截图矩阵评审**——不能口头通过、不能"我看代码改对了"通过。

### 3.1 截图数量公式

每项改动产出截图数量按下式计算：

```
N = pages × viewports × themes × states
```

- `pages`：本项改动影响的页面数（最少 1）。
- `viewports`：固定为 2（`desktop` 1440×900，`mobile` 390×844）。
- `themes`：固定为 2（`light` / `dark`）。
- `states`：必测状态数（最少 1，正常数据），按 §3.2 决定。

每张文件命名：`<change-id>__<page>__<viewport>__<theme>__<state>.png`。

**举例**：
- §2.2 侧边栏分组标题改 tracking——影响所有页面，但视觉效果在每页相同。**只取 1 个代表页面（dashboard）**做矩阵：1 × 2 × 2 × 1 = **4 张**。
- §2.1 DashboardSegment 阶段 1 上 dashboard——1 页，正常 + 空 + 加载 = 3 状态：1 × 2 × 2 × 3 = **12 张**。
- §2.4 StatCardWidget 加 accent bar——影响 dashboard 和 tracker 两页：2 × 2 × 2 × 1 = **8 张**。

不要追求覆盖率，**够证明问题就行**。

### 3.2 必测状态集合

每项改动开工前先在 PR 描述里声明本项的 `states[]`，按下表挑：

| 状态 | 何时必测 |
|---|---|
| `normal` | 永远必测（基线） |
| `empty` | 改动会影响空态分支（如 DashboardSegment 在无数据时也要切段）|
| `loading` | 改动影响 skeleton（如 StatCardWidget 加 accent bar 时 skeleton 也要加占位）|
| `error` | 改动影响错误展示（多数视觉对齐项不需要） |

**默认只测 `normal`**；只有改动证明会改变其他状态时才加，避免无意义截图爆炸。

### 3.3 改前 / 改后

每项改动的截图分两版：
- `before/<change-id>__...png`：改动前基线（用当前 main 跑）。
- `after/<change-id>__...png`：改动后实现。

哥过目两组对比再决定是否合并。

### 3.4 工具与位置

- 工具：Playwright（首选，wooly 走 base-ci `enable-l3: "false"` 留了升级空间，加进来不冲突）。
- 数据：用 `src/data/mock.ts` 通过 env 变量切到"全量 mock"模式，避免依赖 Worker；空态/加载态各做一个 fixture 函数。
- 位置：截图临时存到 `docs/visual/<change-id>/`（`.gitignore`，评审完即删）。需要存档的关键对比单独提交到 `docs/visual/baseline/`。

### 3.5 视觉验收脚手架（独立工作项，先于阶段 1）

阶段 1 开工前必须先完成。注意脚手架本身要解决三件落地难题（认证、数据源、状态注入），不能模糊带过。

#### 3.5.1 认证绕过（dev-only）

`src/proxy.ts:18` 用 `auth()` middleware 把 `/`、`/sources`、`/tracker`、`/settings` 全部重定向到 `/login`。截图脚本如果不处理认证，拍到的全是登录页。两种方案择一：

- **方案 A — middleware 加 dev-only bypass**（推荐，简单）：
  ```ts
  // src/proxy.ts
  export default auth((req) => {
    // Dev-only visual snapshot bypass
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.WOOLY_VISUAL_BYPASS_AUTH === "true"
    ) {
      return NextResponse.next();
    }
    // ...原有逻辑
  });
  ```
  截图脚本启动 `bun run dev:site` 时设 `WOOLY_VISUAL_BYPASS_AUTH=true`，生产构建里这条分支永远走不到。
- **方案 B — Playwright 注入 Auth.js session cookie**：在 `globalSetup` 里用 next-auth 的 `encode` 生成一个带任意 email 的 JWT，写到 `next-auth.session-token` cookie。能力上更接近真实环境，但维护成本高（next-auth v5 的 cookie 名和签名策略每个版本都可能动）。

**选 A**。视觉脚本不应该依赖 next-auth 内部约定。

#### 3.5.2 mock 数据切换（server-side only）

错位点：`src/data/api.ts:9` 的 `fetchDataset()` 是 client fetch，`process.env.WOOLY_USE_MOCK` 只能在 server 读到；同时 `src/app/api/data/route.ts:15` 在 Worker 没配时直接返 503，截图脚本拿到的也不是 mock。

正确做法是**只动 server route，不碰 client**，并复用现有的 `getDataset()`（`src/data/datasets.ts:32`）——它已经返回深拷贝的完整 Dataset，扩展一个可选 `state` 参数即可，不用新建 `getMockDataset` 工厂：

```ts
// src/data/datasets.ts —— 扩展 getDataset()
export type DatasetState = "normal" | "empty";

export function getDataset(state: DatasetState = "normal"): Dataset {
  if (state === "empty") {
    return {
      members: [],
      sources: [],
      benefits: [],
      redemptions: [],
      pointsSources: [],
      redeemables: [],
      defaultSettings: { ...mock.defaultSettings },
    };
  }
  return {
    members: [...mock.members],
    // ...原有字段
  };
}
```

```ts
// src/app/api/data/route.ts —— 顶部加 dev-only 分支
export async function GET(req: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.WOOLY_USE_MOCK === "true"
  ) {
    const { getDataset } = await import("@/data/datasets");
    const state = req.nextUrl.searchParams.get("_visual");
    return NextResponse.json(getDataset(state === "empty" ? "empty" : "normal"));
  }
  if (!isWorkerConfigured()) { /* ...原有 503 */ }
  // ...原有逻辑
}

export async function PUT(req: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.WOOLY_USE_MOCK === "true"
  ) {
    // No-op: mock mode is read-only, swallow writes to silence ViewModel sync
    const dataset = await req.json();
    return NextResponse.json(dataset);
  }
  // ...原有逻辑
}
```

- 客户端**完全不动**。`fetchDataset()` 继续打 `/api/data`，server route 在 mock 模式下直接返本地 dataset；PUT 静默成功（避免 ViewModel 的 debounce sync 报错）。
- `getDataset()` 已经有现有 test 覆盖（`src/test/`），加 state 参数时要补一个 empty 分支的单测。

不要用 `NEXT_PUBLIC_*`：那会把 mock 标志泄漏到生产 client bundle。

#### 3.5.3 状态夹具（empty / loading / normal）

错位点：让每个 ViewModel 自己识别 `?_visual=empty` 是把测试逻辑扩散到业务层（ViewModel 数量多，迟早漏一个）。

正确做法是**集中在 `/api/data` GET 处理 query string**：

```ts
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "production" && process.env.WOOLY_USE_MOCK === "true") {
    const state = req.nextUrl.searchParams.get("_visual") ?? "normal";
    if (state === "loading") {
      // Hold response open long enough that Playwright can screenshot the skeleton
      await new Promise((r) => setTimeout(r, 60_000));
      // Will never resolve in screenshot window — that's the point
    }
    const { getDataset } = await import("@/data/datasets");
    return NextResponse.json(getDataset(state === "empty" ? "empty" : "normal"));
  }
  // ...
}
```

ViewModel / hook / fetchDataset 全部不动。Playwright 在导航 URL 时带上 `?_visual=empty`，server route 自己分发；`loading` 通过让请求挂起来保留 skeleton 状态。

> **截图 loading 状态的等待策略**：Playwright 的 `page.goto()` 默认 `waitUntil: "load"` 会等到 `/api/data` 返回——loading 模式下这个请求永远挂着，goto 必然超时。截图脚本对 loading 状态必须做两件事：
> 1. **`page.goto(url, { waitUntil: "domcontentloaded" })`**——让 DOM 完成解析就返回，不等 network idle。
> 2. **`page.goto` 之后再 `await page.waitForSelector(...)` 等到 skeleton 容器可见**（推荐用 `[data-visual-state="loading"]` 这种语义稳定的选择器，绑在 skeleton 顶层）——`domcontentloaded` 只保证 DOM 解析完，React hydration 还在跑，截图过早会拍到空白。
>
> 其他状态用 `waitUntil: "load"` 默认值，不需要 waitForSelector。

> **当前现状（important）**：dashboard 页面**还没有接 loading 分支**——`src/app/(dashboard)/page.tsx:21` 直接消费 `useDashboardViewModel()` 的字段，但 ViewModel 在 loading 时返回的是 `EMPTY_RESULT`（`src/viewmodels/useDashboardViewModel.ts:27-34`），页面渲染出来等同于空态而非 skeleton。`src/components/dashboard/DashboardSkeleton.tsx` 已经存在但从未被引用。
>
> 因此 §5 阶段 1 的「DashboardSegment + states=[normal, empty, loading]」**必须先决定**：
> - **方案 A（推荐）**：把"接上 loading 分支"作为阶段 1 的前置任务，让 `dashboard/page.tsx` 在 `vm.loading` 时渲染 `<DashboardSkeleton />`，然后截 loading 状态才有意义。
> - **方案 B**：阶段 1 截图矩阵先只跑 `states=[normal, empty]`，等接上 skeleton 再补 loading。
>
> 选 A 更彻底，但会让阶段 1 多出半天工作量；选 B 风险更小。**建议选 A**——loading 缺失本身也是 UI 问题，顺手修。tracker / sources 的 loading 分支也要同时检查。

> 副作用：`/api/data` 上的 query string 在 normal 模式不会被读到；mock 模式下也只在 dev 生效。生产构建里 `WOOLY_USE_MOCK !== "true"`，整个分支走不到，零运行时开销。

#### 3.5.4 阶段 0 任务清单

- [ ] **`src/proxy.ts` 加 `WOOLY_VISUAL_BYPASS_AUTH` dev bypass**（§3.5.1 方案 A）。
- [ ] **`src/app/api/data/route.ts` 加 `WOOLY_USE_MOCK` server-side 分支 + `?_visual=` 状态分发**（§3.5.2 + §3.5.3）。
- [ ] **`src/data/datasets.ts` 的 `getDataset()` 加 `state: "normal" | "empty"` 参数**（§3.5.2），补一个 empty 分支的单测。
- [ ] **装 `@playwright/test`**（`bun add -d @playwright/test` + `bunx playwright install chromium`）。
- [ ] **`scripts/visual-snapshot.ts`** —— 参数 `--change <id> --pages <list> --states <list>`：
  - 启动 dev server（带 `WOOLY_VISUAL_BYPASS_AUTH=true WOOLY_USE_MOCK=true`）；
  - 对每个 (page, viewport, theme, state) 组合：
    - 导航到 `http://localhost:7014/<page>?_visual=<state>`；
    - **`loading` 状态**：用 `page.goto(url, { waitUntil: "domcontentloaded" })` + `await page.waitForSelector("[data-visual-state='loading']")`；不要用 `"networkidle"`，否则 loading 请求永远挂着会等到超时；不要省略 waitForSelector，否则 hydration 未完成就截会拍到空白。
    - **其他状态**：默认 `waitUntil: "load"`，不需要 waitForSelector。
    - 用 `page.evaluate(() => localStorage.setItem("theme", "<theme>"))` + reload 切主题；
    - 截图到 `docs/visual/<id>/{before,after}/<id>__<page>__<viewport>__<theme>__<state>.png`。
- [ ] **`docs/visual/README.md`** 描述用法。
- [ ] **`docs/visual/.gitignore`**——只忽略每项改动的 before/after 输出，保留 README 和 baseline：
  ```gitignore
  /*/before/
  /*/after/
  !/README.md
  !/baseline/
  ```

**预算**：脚手架本身大约一天（不止半天，因为认证 bypass + server route 改动 + Playwright 配置都要测）。完成后阶段 1 才能开工。

> ⚠️ 脚手架没做完之前，阶段 1 不能开工——没有 before/after 对比的视觉改动等于没改。先磨刀。

---

## 4. wooly 独有亮点（请保留）

| 资产 | 文件 | 价值 |
|---|---|---|
| 30 色 chart palette（含黑卡变体）| `src/app/globals.css:158-188` `src/lib/palette.ts` | 远超 pew 的 8 色，给"自定义颜色账户"提供了真实的表达空间 |
| 4 套 heatmap 配色（绿红蓝橙）| `globals.css:194-213` | pew 只有绿。wooly 多套是为不同语义（用量/到期/时段）准备的，是好事 |
| SourceCard 银行卡视觉 | `src/components/SourceCard.tsx` | 项目身份的核心，唯一辨识度 |
| Login 工牌 badge | `src/app/(auth)/login/page.tsx` | 视觉记忆点强，比 pew 的同款再加一点点温度 |
| Tracker 快捷操作 ActionGridCard | `src/components/dashboard/ActionGridCard.tsx` + `tracker/page.tsx:55-84` | 4 色彩色 icon 块，操作密度合理 |
| Cmd+K Command Palette | `AppSidebar.tsx:163-180, 306-326` | pew sidebar 没有这个，wooly 是赢家 |

---

## 5. 改进路线图

按优先级 + 工作量分组。**每项改动合并前必须完成 §3 截图矩阵评审**。

### 阶段 0（一天 — 视觉验收脚手架，前置）

详见 §3.5。**没做完之前，所有视觉改动都不能开工**——因为没法做改前/改后对比。

- [ ] `src/proxy.ts` 加 `WOOLY_VISUAL_BYPASS_AUTH` dev-only bypass（§3.5.1）。
- [ ] `src/app/api/data/route.ts` 加 `WOOLY_USE_MOCK` server-side 分支 + `?_visual=` 状态分发（§3.5.2 + §3.5.3）；client/`fetchDataset()` 不动。
- [ ] `src/data/datasets.ts` 的 `getDataset()` 加 `state` 参数（normal/empty）。
- [ ] 装 `@playwright/test` + chromium。
- [ ] `scripts/visual-snapshot.ts` 截图脚本（loading 状态用 `waitUntil: "domcontentloaded"`，主题切换 + before/after 目录）。
- [ ] `docs/visual/README.md` + 精确的 `.gitignore`。

### 阶段 1（一天 — 低风险对齐 + loading 接线）

- [ ] **接上 dashboard 的 loading 分支**（前置）：`src/app/(dashboard)/page.tsx` 在 `vm.loading` 时渲染 `<DashboardSkeleton />`（已存在但从未引用），并在 skeleton 顶层加 `data-visual-state="loading"` 选择器供截图脚本等待。tracker / sources 同步检查（如有相同问题，一起接）。详见 §3.5.3 现状说明。
- [ ] **新增 `DashboardSegment` 组件**（§2.1 响应式版本，不是 pew 原版）。**只应用到 `dashboard/page.tsx`**，先切 2-3 段（概览 / 关注 / 分析），不要直接切 4 段——避免和 widget 自带标题形成双层小标题。截图矩阵 `states=[normal, empty, loading]`（loading 必须在前置任务完成后才能跑）。
- [ ] **侧边栏分组标题改 `text-xs font-medium tracking-[0.15em] text-muted-foreground/70`**（`AppSidebar.tsx:70` 单行改；中文不变，靠字距和字号"标签化"）。截图矩阵 `pages=[dashboard]`（每页效果相同，取代表）。
- [ ] **新增 `src/lib/version.ts` + sidebar version chip**（§2.7 落地路径）——独立于字体决策，但**不是零成本**，需要验 client bundle 不带整个 package.json。截图矩阵 `pages=[dashboard]`。

### 阶段 2（1-2 天 — 系统化对齐）

- [ ] **抽 `SegmentedControl` 组件**（`src/components/ui/segmented-control.tsx`），严格按 §2.3 的"互斥模式 toggle ≤4 项"规则使用；不替换 MemberFilterBar / settings 导航 / tracker 撤销。
- [ ] **`StatCardWidget` 加 `variant` + `accentColor`**（默认值向后兼容；dashboard 主指标用 primary）。
- [ ] **DashboardSegment 推到 `tracker/page.tsx` 和 `sources/page.tsx`**——前提是阶段 1 dashboard 的截图矩阵通过。
- [ ] **统一 Badge 语言**：把 `BenefitStatusBadge` 改成 `Badge` 的薄包装（§2.6 第一步）；`Badge` 加 `info` variant；评估 `SourceCard` 内联 chip 是否能合并（不能就文档化例外）。

### 阶段 3（半周到一周 — 战略品牌探索）

- [ ] **品牌字体探索**：用 baoyu-design 出 wordmark 候选矩阵（Caveat / Pacifico / Kalam / 当前 sans × light/dark × collapsed/expanded），哥评审后再决定是否换。**不在阶段 1 动手**。
- [ ] **评估 ThemeToggle 简化为 2 态**（settings 里保留 system 选项）——非阻塞。

### 阶段 4（backlog — 等业务真有需求再做）

- [ ] **wooly 版"小语义徽章"**（如"账户健康度 A/B/C"），到时候同样在 `Badge` 上薄包，不新增 `Pill`。

---

## 6. 不推荐做的事（避免过度对齐 pew）

1. **不要把主色改成紫色**——magenta 是 wooly 的家庭温度，pew 的 violet 是赛博质感，两者目标用户不同。
2. **不要砍 chart palette 到 8 色**——SourceCard 的颜色丰富度是核心特性。
3. **不要为了"工程感"全站 uppercase**——中文 UI 配 uppercase 英文会割裂；只在「分段标题、ALL CAPS 标签」这种功能位置用，且对中文走 `tracking-[0.15em]` 路线。
4. **不要把 SourceCard 改成扁平卡片**——那是放弃辨识度。
5. **不要新建 `Pill` 组件**——用现有 `Badge`，详见 §2.6。
6. **不要在阶段 1 换品牌字体**——详见 §2.7。

---

## 7. 一句话总结

> wooly 和 pew 是同一个设计系统下两种生活方式：pew 用克制的工程化语言展示数字，wooly 用丰富的金融化卡片承载家庭。这次审计的核心动作不是让 wooly 变得更像 pew，而是**把 pew 在"信息组织"上的工程化经验（分段标题、segment control、accent bar）借过来，去服务 wooly 自己的家庭温度感**。

---

## 附录：本审计读过的文件

**wooly**（21 个文件）：
- `src/app/globals.css` `src/app/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/page.tsx` `sources/page.tsx` `tracker/page.tsx` `settings/page.tsx`
- `src/components/DashboardLayout.tsx` `AppSidebar.tsx` `SourceCard.tsx`
- `src/components/dashboard/{StatCardWidget,RecentListCard,RadialProgressCard,BarChartCard}.tsx`
- `src/lib/palette.ts`

**pew**（14 个文件）：
- `packages/web/src/app/globals.css` `app/layout.tsx`
- `packages/web/src/app/login/page.tsx`
- `packages/web/src/app/(dashboard)/dashboard/page.tsx`
- `packages/web/src/components/landing/landing-content.tsx`
- `packages/web/src/components/layout/{app-shell,sidebar}.tsx`
- `packages/web/src/components/dashboard/{stat-card,heatmap-hero,heatmap-calendar,dashboard-segment,period-selector,snapshot-alert,usage-trend-chart}.tsx`
- `packages/web/src/components/leaderboard/{rank-badge,token-tier-badge,page-header}.tsx`
