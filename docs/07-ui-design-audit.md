# 07 — UI 设计审计：wooly vs pew

> **目的**：以 pew（`/Users/nocoo/workspace/personal/pew`）作为同源 basalt 设计系统下"已成熟落地"的标杆，全面审计 wooly 当前 UI，识别风格漂移、缺失模式、可借鉴细节，给出按优先级排序的改进项。
> **审计日期**：2026-06-12
> **审计人**：claude（基于源码静态对比）

---

## 0. TL;DR

- 两者血缘相同（basalt 模板：3 层灰阶 + AppShell floating island + 同款 sidebar 骨架），所以**框架完全一致**，问题不在"换皮"，而在 wooly 在很多**应该统一的地方走了野路子**。
- **最值得抄的 5 件事**（按 ROI 排）：
  1. **`DashboardSegment` 段落标题**——pew 把仪表盘切成 Overview / Trends / Insights 三段，用 `text-xs uppercase tracking-wider` 小标签 + 1px 分隔线。wooly 全靠 grid 堆，缺乏信息层级。
  2. **侧边栏分组标题改为 `uppercase tracking-wider`**——pew 的"工程感"主要靠这一处。wooly 现在用 `text-sm font-normal`，看着像普通正文。
  3. **`PeriodSelector` 模式**——pew 用一致的 segment-control（圆角胶囊 + bg-secondary p-1）切换"本月/本季/全部"。wooly 的 `tracker` 页用了 ghost button，`sources` 页用了原生筛选条，**风格不一致**。
  4. **StatCard 顶部 accent bar**——pew 在重要指标上加 `h-0.5 w-8` 的彩色细条，零成本拉视觉重心，wooly 的 `StatCardWidget` 完全没有。
  5. **TokenTierBadge 那种"小语言"**——pew 用 `A8.3` 这种 7 字符语义化 chip 把"千万级"压成一个 hue-encoded 的徽章。wooly 的 SourceCard 卡片是另一极（华丽渐变满屏），**缺少这种克制的小标记**。
- **wooly 独有的设计资产**（pew 抄不到）：30 色 chart palette（含 6 张黑卡变体）、SourceCard 银行卡视觉、login 工牌 badge——这些已经是好东西，**不要因为对齐 pew 而稀释**。
- **建议方向**：保留 wooly 的"金融/家庭温度感"主调（玫红 + 多彩），但把**信息密度高的页面（仪表盘、追踪台、设置）**向 pew 的"工程化分段"靠拢。卡片秀场（sources）继续放飞。

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
- 在 `src/components/dashboard/` 下新建 `DashboardSegment.tsx`，照抄即可。
- wooly 仪表盘按"概览 / 提醒 / 趋势 / 热门"切 3-4 段；`tracker` 页按"统计 / 日志 / 可核销"切 2 段；`sources` 页按"账户 / 用量 / 归档"切 2-3 段。

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

### 2.3 缺少统一的 PeriodSelector / Segment Control — **优先级 P1**

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

**wooly**：完全没有这个组件。`tracker` 的"撤销"按钮用 ghost button、`sources` 用 `MemberFilterBar` 自创筛选条、`settings` 左侧分类导航又是另一种实现（`src/app/(dashboard)/settings/page.tsx:64-81`）。

**改进建议**：
- 在 `src/components/ui/` 下新建 `segmented-control.tsx`，把 pew 的实现照抄。
- 用它统一替换：`settings` 左导航的 active 状态（其实也可以保留 vertical 版本但用同套 token）、未来添加的"本月/本季/全部"筛选。

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

### 2.6 缺少"小语义徽章"语言 — **优先级 P3**

pew 的 `TokenTierBadge`（`src/components/leaderboard/token-tier-badge.tsx`）用 `A8.3` 这种 4 字符 chip 把数量级编码到颜色 + 标签。`RankBadge`（`src/components/leaderboard/rank-badge.tsx`）用 Trophy/Medal/Award icon 替换前 3 名的纯数字。

wooly 现在的 status 表达是：
- `BenefitStatusBadge`（OK，但只有 4 个 status）；
- `SourceCard` 内联的 `已过期` / `即将到期` 红/琥珀 chip——**写在大卡片上，看不到全局**。

**改进建议（不必现在做，列入 backlog）**：
- 抽一个统一的 `Pill` 原子组件：`<Pill tone="info|warn|danger|success" size="sm|md">`；
- 用它替换 SourceCard 内联 chip、tracker 的"3 天后过期"文本、settings 的依赖关系标签——形成全局一致的"小标签"语言。

### 2.7 Logo 缺少品牌签名感 — **优先级 P3**

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

**改进建议**：
- "wooly" 这个名字本身有"软毛/家庭"的暖意，**比 pew 更适合手写体**。建议加一把 Caveat 或 Pacifico，让它更有"家"的人格。
- sidebar 加个 `v{APP_VERSION}` chip——已有 version 信息，零成本视觉细节。

### 2.8 主题切换 UX 略弱 — **优先级 P3**

两个项目的 `ThemeToggle` 都在 header 右上。wooly 的 ThemeToggle 实现见 `src/components/ThemeToggle.tsx`（已用 `useSyncExternalStore`，技术上更现代）。

但**视觉上，pew 的 toggle 是经典 sun/moon 图标切换，wooly 的有 system/light/dark 3 态**——多一个状态对家庭用户其实是负担（多数人不切系统主题，只切明暗）。

**改进建议**（不强求）：
- 评估一下 settings/preferences 是否已经有 theme 选项；如果有，header toggle 可以简化成 2 态（明 / 暗），系统跟随放进 settings。

### 2.9 GitHub 图标提取在 v1 之后失去工作量管控 — **观察项**

wooly 之前为了升级 lucide v1 抽了 `src/components/icons/github.tsx`（这次重构的成果之一）。pew 现在还在 lucide < v1（`import { Github } from "lucide-react"`），未来 pew 升级时会撞同一堵墙。**这不是 wooly 的问题，是 wooly 走在前面**。

---

## 3. wooly 独有亮点（请保留）

| 资产 | 文件 | 价值 |
|---|---|---|
| 30 色 chart palette（含黑卡变体）| `src/app/globals.css:158-188` `src/lib/palette.ts` | 远超 pew 的 8 色，给"自定义颜色账户"提供了真实的表达空间 |
| 4 套 heatmap 配色（绿红蓝橙）| `globals.css:194-213` | pew 只有绿。wooly 多套是为不同语义（用量/到期/时段）准备的，是好事 |
| SourceCard 银行卡视觉 | `src/components/SourceCard.tsx` | 项目身份的核心，唯一辨识度 |
| Login 工牌 badge | `src/app/(auth)/login/page.tsx` | 视觉记忆点强，比 pew 的同款再加一点点温度 |
| Tracker 快捷操作 ActionGridCard | `src/components/dashboard/ActionGridCard.tsx` + `tracker/page.tsx:55-84` | 4 色彩色 icon 块，操作密度合理 |
| Cmd+K Command Palette | `AppSidebar.tsx:163-180, 306-326` | pew sidebar 没有这个，wooly 是赢家 |

---

## 4. 改进路线图

按优先级 + 工作量分组：

### 阶段 1（半天，立刻动手）

- [ ] **新增 `DashboardSegment` 组件**（30 行）+ 应用到 `dashboard/page.tsx` `tracker/page.tsx` `sources/page.tsx`。
- [ ] **侧边栏分组标题改 uppercase + tracking**（`AppSidebar.tsx:70` 单行改）。
- [ ] **wooly logo 字体换 Caveat 或 Pacifico**（动 `layout.tsx` 字体引入 + `AppSidebar.tsx:248`、`Logo.tsx`）。
- [ ] **sidebar 加 v0.0.3 chip**。

### 阶段 2（1-2 天，有真实业务诉求时做）

- [ ] **抽 `SegmentedControl` 组件**（参照 pew `period-selector.tsx`），用它统一 `settings` 左导航 + 未来时段筛选。
- [ ] **`StatCardWidget` 加 variant + accentColor**（dashboard 主指标 + tracker 主指标用 primary）。
- [ ] **`sources/page.tsx` 用 DashboardSegment 把账户卡群和分析 widget 群分开**。

### 阶段 3（半周到一周，可延后）

- [ ] **抽 `Pill` 原子组件**（`tone × size` 矩阵），全站替换内联 chip。
- [ ] **设计一个 wooly 版的"小语义徽章"**（类似 TokenTierBadge），比如「家庭使用率」分级（A/B/C/D）。
- [ ] **评估 ThemeToggle 简化为 2 态**（settings 里保留 system 选项）。

---

## 5. 不推荐做的事（避免过度对齐 pew）

1. **不要把主色改成紫色**——magenta 是 wooly 的家庭温度，pew 的 violet 是赛博质感，两者目标用户不同。
2. **不要砍 chart palette 到 8 色**——SourceCard 的颜色丰富度是核心特性。
3. **不要为了"工程感"全站 uppercase**——中文 UI 配 uppercase 英文会割裂；只在「分段标题、ALL CAPS 标签」这种功能位置用。
4. **不要把 SourceCard 改成扁平卡片**——那是放弃辨识度。

---

## 6. 一句话总结

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
