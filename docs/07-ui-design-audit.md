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
- 应用范围：**先只改 `dashboard/page.tsx`**，按"概览 / 提醒 / 趋势 / 热门"切 4 段；其他页（tracker、sources）等阶段 1 验收完再推。

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

**version chip** 是低风险且独立的，可以阶段 1 单独加，**不绑定字体决策**。

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

### 3.1 截图矩阵规格

每项改动产出一组 8 张截图，命名 `<change-id>__<page>__<viewport>__<theme>.png`：

| 维度 | 取值 |
|---|---|
| 页面 | `dashboard` / `sources` / `tracker` / `settings`（按改动影响范围取子集） |
| 视口 | `desktop`（1440×900）/ `mobile`（390×844，iPhone 14 Pro 物理像素） |
| 主题 | `light` / `dark` |

例如 §2.1 `DashboardSegment` 改动会产出：
```
2.1__dashboard__desktop__light.png
2.1__dashboard__desktop__dark.png
2.1__dashboard__mobile__light.png
2.1__dashboard__mobile__dark.png
```

如果改动还波及 sources/tracker，按页加。

### 3.2 状态覆盖

每张截图至少覆盖以下任一状态（按页面适用）：

| 状态 | 仪表盘 | 账户 | 追踪台 | 设置 |
|---|---|---|---|---|
| 正常数据 | ✅ | ✅ | ✅ | ✅ |
| 空态 | ✅（无核销）| ✅（无账户）| ✅（无可核销）| ✅（无受益人）|
| 加载态 | ✅ | ✅ | ✅ | — |
| 错误态 | ✅（API 503）| — | — | ✅（删除依赖冲突）|

**正常数据**是必拍项；**空态**只要页面有空态分支就要拍；**加载态**只要 ViewModel 有 loading skeleton 就要拍；**错误态**先做能验的就行。

### 3.3 改前 / 改后

每项改动的截图矩阵分两版交付：
- `before/<change-id>__...png`：改动前基线（用当前 main 跑）。
- `after/<change-id>__...png`：改动后实现。

哥过目两组对比再决定是否合并。改动覆盖到的所有页面 + 视口 + 主题 + 状态都要齐。

### 3.4 工具与位置

- 工具：用 Playwright 或 Puppeteer 走 headless 截图，固定 viewport + 固定 mock 数据（避免随机性）。可在 `src/test/visual/` 放截图脚本。
- 位置：截图临时存到 `docs/visual/<change-id>/`（注意加 `.gitignore`，不入库；评审完即删）。如果需要存档保留几张关键对比，单独提交到 `docs/visual/baseline/`。
- **不要把全部截图入 git**——每张 desktop 200KB+，矩阵会让 repo 膨胀。

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

### 阶段 1（半天 — 低风险对齐）

- [ ] **新增 `DashboardSegment` 组件**，使用 §2.1 的响应式版本（不是 pew 原版），**只应用到 `dashboard/page.tsx`** 切 4 段。tracker/sources 等阶段 1 验收后再推。
- [ ] **侧边栏分组标题改 `text-xs font-medium tracking-[0.15em] text-muted-foreground/70`**（`AppSidebar.tsx:70` 单行改；中文不变，靠字距和字号"标签化"）。
- [ ] **sidebar 加 `v{APP_VERSION}` chip**——独立于字体决策，零风险。

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
