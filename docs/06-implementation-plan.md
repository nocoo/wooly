# 06 - 分阶段实施计划

## 概述

整个 MVP 实现分为 **6 个阶段**，每个阶段自闭环、可独立验证。严格遵循**测试驱动开发 (TDD)**：先写测试，再写实现，每个阶段结束时必须通过 UT + Lint 检查才能进入下一阶段。

每个阶段包含一系列**原子化提交**，遵循 Conventional Commits 规范。

## 阶段总览

| 阶段 | 名称 | 主要交付 | 前置依赖 |
|---|---|---|---|
| P1 | 领域基础层 | types + cycle engine + format utils（含时区工具）+ CRUD 验证工具 + UT | 无 |
| P2 | 假数据与业务模型 | mock.ts + benefit/source/dashboard/points/member/redemption models（含 CRUD 纯函数）+ UT | P1 |
| P3 | ViewModel 层 | 5 个 ViewModel hooks（含完整 CRUD 状态管理 + 时区）+ UT | P2 |
| P4 | UI 组件库 | 从 basalt 移植/新建的展示组件 + CRUD 表单弹窗 | P1 |
| P5 | 页面组装 | 5 个页面（全中文 UI）+ 路由注册 + 侧边栏 | P3, P4 |
| P6 | 集成收尾 | 积分模块 + 归档功能 + 端到端验证 + 文档更新 | P5 |

## 质量闸门

每个阶段结束时必须满足：

```bash
bun run test         # UT 全部通过
bun run lint         # 零 Error、零 Warning
bun run build        # 构建成功
```

**覆盖率要求**：Model 层和 ViewModel 层 >= 90%（statements, branches, functions, lines）。

---

## 阶段 P1：领域基础层

**目标**：建立类型系统和周期计算引擎，这是整个系统的地基。

**验收标准**：cycle engine 所有边界测试通过，format 工具函数测试通过。

### 提交序列

#### Commit 1.1: `feat: add domain type definitions`

**文件**：`src/models/types.ts`

**内容**：
- 定义所有领域接口：`Member`, `MemberRelationship`, `Source`, `SourceCategory`, `CycleAnchor`, `Benefit`, `BenefitType`, `Redemption`, `PointsSource`, `Redeemable`
- 定义计算结果接口：`CycleWindow`, `BenefitCycleInfo`, `BenefitCycleStatus`
- 定义 CRUD 辅助类型：`ValidationError`, `DependentsSummary`, `CreateSourceInput`, `UpdateSourceInput`, `CreateBenefitInput`, `CreateMemberInput` 等

**测试**：类型定义无需 UT，由 TypeScript 编译器验证。

#### Commit 1.2: `test: add cycle engine unit tests`

**文件**：`src/test/models/cycle.test.ts`

**内容**（TDD - 先写测试）：
- `resolveCycleAnchor`：继承 vs 覆盖
- `getCurrentCycleWindow`：
  - monthly: 锚点前/后/当天
  - monthly: anchor=31 遇短月
  - yearly: 锚点前/后
  - quarterly: 标准 + 跨年
- `getDaysUntilCycleEnd`：常规 + 最后一天
- `isCycleExpiringSoon`：阈值内外
- `countRedemptionsInWindow`：窗口内/外/边界
- `computeBenefitCycleStatus`：所有状态路径

**预期**：此时测试全部失败（实现尚未写）。

#### Commit 1.3: `feat: implement cycle engine`

**文件**：`src/models/cycle.ts`

**内容**：
- 实现 `resolveCycleAnchor`
- 实现 `clampDay` 辅助函数
- 实现 `getCurrentCycleWindow`（monthly/quarterly/yearly 三个分支）
- 实现 `getDaysUntilCycleEnd`
- 实现 `isCycleExpiringSoon`
- 实现 `countRedemptionsInWindow`
- 实现 `computeBenefitCycleStatus`

**验证**：所有 cycle.test.ts 测试通过。

#### Commit 1.4: `test: add format utils unit tests`

**文件**：`src/test/models/format.test.ts`

**内容**（TDD）：
- `formatCurrency(300, "CNY")` → `"¥300"`
- `formatCurrency(99.5, "USD")` → `"$99.50"`
- `formatCycleLabel` → 人类可读的周期描述
- `formatDateRange` → 日期区间显示
- `formatDaysUntil` → "5天后" / "今天" / "已过期"
- `formatDateInTimezone` → 按时区格式化日期字符串（Asia/Shanghai, America/New_York 等）

#### Commit 1.5: `feat: implement format utils`

**文件**：`src/models/format.ts`

**内容**：实现所有格式化函数。

**验证**：`bun run test && bun run lint`

---

## 阶段 P2：假数据与业务模型

**目标**：构建假数据集和基于周期引擎的业务逻辑模型。

**验收标准**：所有 model 测试通过，mock 数据类型完全匹配。

### 提交序列

#### Commit 2.1: `feat: add mock data`

**文件**：`src/data/mock.ts`

**内容**：
- 按 `04-mock-data.md` 规格编写全部假数据
- 3 个 Members（含 relationship 字段）, 7 个 Sources（含 1 个 archived）, 28 个 Benefits, 20 个 Redemptions
- 3 个 PointsSources, 11 个 Redeemables
- Settings 默认值：timezone = "Asia/Shanghai"

**验证**：TypeScript 编译通过（类型匹配 types.ts）。

#### Commit 2.2: `test: add benefit model unit tests`

**文件**：`src/test/models/benefit.test.ts`

**内容**（TDD）：
- `computeUsageRatio`：0%, 50%, 100%
- `classifyBenefitUrgency`：urgent/warning/normal
- `getBenefitStatusLabel`：各状态的显示文本
- `getBenefitStatusColorClass`：各状态的 Tailwind 类名
- CRUD：`addBenefit`, `updateBenefit`, `removeBenefit`, `validateBenefitInput`

#### Commit 2.3: `feat: implement benefit model`

**文件**：`src/models/benefit.ts`

#### Commit 2.4: `test: add source model unit tests`

**文件**：`src/test/models/source.test.ts`

**内容**（TDD）：
- `computeSourceSummary`：聚合 source 下所有 benefit 的状态
- `groupBenefitsByStatus`：按状态分组
- `getSourceCategoryLabel`：类别显示名
- `filterActiveSources`：过滤掉 archived 的来源
- CRUD：`addSource`, `updateSource`, `removeSource`, `toggleSourceArchived`, `validateSourceInput`, `checkSourceDependents`

#### Commit 2.5: `feat: implement source model`

**文件**：`src/models/source.ts`

#### Commit 2.5a: `test: add member model unit tests`

**文件**：`src/test/models/member.test.ts`

**内容**（TDD）：
- CRUD：`addMember`, `updateMember`, `removeMember`, `validateMemberInput`, `checkMemberDependents`
- `getMemberRelationshipLabel`：枚举值 → 中文标签

#### Commit 2.5b: `feat: implement member model`

**文件**：`src/models/member.ts`

#### Commit 2.5c: `test: add redemption model unit tests`

**文件**：`src/test/models/redemption.test.ts`

**内容**（TDD）：
- `addRedemption`, `removeRedemption`
- `getRedemptionsInWindow`：按周期窗口过滤

#### Commit 2.5d: `feat: implement redemption model`

**文件**：`src/models/redemption.ts`

#### Commit 2.6: `test: add dashboard model unit tests`

**文件**：`src/test/models/dashboard.test.ts`

**内容**（TDD）：
- `computeAlerts`：提取即将过期的权益并按紧急度排序
- `computeOverallProgress`：计算全局使用率
- `computeMonthlyTrend`：按月统计核销次数
- `rankTopSources`：按使用率排名

#### Commit 2.7: `feat: implement dashboard model`

**文件**：`src/models/dashboard.ts`

#### Commit 2.8: `test: add points model unit tests`

**文件**：`src/test/models/points.test.ts`

**内容**（TDD）：
- `computeAffordableItems`：根据余额筛选可兑换项
- `formatPointsBalance`：积分格式化

#### Commit 2.9: `feat: implement points model`

**文件**：`src/models/points.ts`

**验证**：`bun run test && bun run lint`

---

## 阶段 P3：ViewModel 层

**目标**：为 5 个页面构建 ViewModel hooks。

**验收标准**：所有 ViewModel 测试通过，返回值结构正确。

### 提交序列

#### Commit 3.1: `test: add dashboard viewmodel tests`

**文件**：`src/test/viewmodels/useDashboardViewModel.test.ts`

**内容**（TDD）：
- 验证返回 stats 数组长度 = 4
- 验证 expiringAlerts 按紧急度排序
- 验证 overallUsage 百分比在 0-100 范围
- 验证 monthlyTrend 数据结构

#### Commit 3.2: `feat: implement dashboard viewmodel`

**文件**：`src/viewmodels/useDashboardViewModel.ts`

#### Commit 3.3: `test: add sources viewmodel tests`

**文件**：`src/test/viewmodels/useSourcesViewModel.test.ts`

**内容**（TDD）：
- 验证默认返回所有 sourceCards（不含已归档）
- 验证 archivedSourceCards 包含归档来源
- 验证 setSelectedMember 后 sourceCards 被过滤
- 验证 pointsSourceCards 结构
- CRUD：验证 handleCreateSource / handleUpdateSource / handleDeleteSource / handleToggleArchive
- 验证 formErrors 在输入无效时正确生成

#### Commit 3.4: `feat: implement sources viewmodel`

**文件**：`src/viewmodels/useSourcesViewModel.ts`

#### Commit 3.5: `test: add source detail viewmodel tests`

**文件**：`src/test/viewmodels/useSourceDetailViewModel.test.ts`

**内容**（TDD）：
- 验证传入有效 sourceId 返回正确 source
- 验证 benefitRows 包含正确的状态标签和进度
- 验证 memberUsage 统计正确
- CRUD：验证 handleCreateBenefit / handleUpdateBenefit / handleDeleteBenefit
- 验证 handleToggleArchive / handleDeleteSource 操作

#### Commit 3.6: `feat: implement source detail viewmodel`

**文件**：`src/viewmodels/useSourceDetailViewModel.ts`

#### Commit 3.7: `test: add tracker viewmodel tests`

**文件**：`src/test/viewmodels/useTrackerViewModel.test.ts`

**内容**（TDD）：
- 验证 recentRedemptions 按时间倒序
- 验证 redeemableBenefits 仅含非 action 且未用完的权益（排除已归档来源）
- 验证 redeem 操作后数据更新
- 验证 undoRedemption 操作（撤销核销）

#### Commit 3.8: `feat: implement tracker viewmodel`

**文件**：`src/viewmodels/useTrackerViewModel.ts`

#### Commit 3.9: `test: add settings viewmodel tests`

**文件**：`src/test/viewmodels/useSettingsViewModel.test.ts`

**内容**（TDD）：
- 验证初始 members 列表（含 relationship 标签）
- 验证 handleCreateMember / handleUpdateMember / handleDeleteMember 操作
- 验证 memberFormErrors 在输入无效时正确生成
- 验证 memberDependents 级联检查
- 验证 activeSection 状态切换
- 验证 timezone 设置和 timezoneOptions 列表

#### Commit 3.10: `feat: implement settings viewmodel`

**文件**：`src/viewmodels/useSettingsViewModel.ts`

**验证**：`bun run test && bun run lint`

---

## 阶段 P4：UI 组件库

**目标**：从 basalt 移植/新建 Wooly 所需的展示组件。

**验收标准**：所有组件可独立渲染，lint 通过。

### 提交序列

#### Commit 4.1: `feat: port StatCardWidget and StatGrid from basalt`

**文件**：
- `src/components/dashboard/StatCardWidget.tsx`
- `src/components/dashboard/StatGrid.tsx`

**适配**：添加 `"use client"` 指令。

#### Commit 4.2: `feat: port RecentListCard from basalt`

**文件**：`src/components/dashboard/RecentListCard.tsx`

**适配**：泛化 icon/amount/date 插槽，支持权益场景。

#### Commit 4.3: `feat: port ItemListCard from basalt`

**文件**：`src/components/dashboard/ItemListCard.tsx`

#### Commit 4.4: `feat: port RadialProgressCard from basalt`

**文件**：`src/components/dashboard/RadialProgressCard.tsx`

**依赖**：需要安装 recharts（`bun add recharts`）。

#### Commit 4.5: `feat: port BarChartCard from basalt`

**文件**：`src/components/dashboard/BarChartCard.tsx`

#### Commit 4.6: `feat: port ActionGridCard from basalt`

**文件**：`src/components/dashboard/ActionGridCard.tsx`

#### Commit 4.7: `feat: add BenefitStatusBadge component`

**文件**：`src/components/BenefitStatusBadge.tsx`

**新建**：多状态标签组件（available/exhausted/expiring/pending）。

#### Commit 4.8: `feat: add BenefitProgressRow component`

**文件**：`src/components/dashboard/BenefitProgressRow.tsx`

**新建**：从 basalt ProgressTrackingPage 的预算行模式适配。

#### Commit 4.9: `feat: add SourceCard component`

**文件**：`src/components/SourceCard.tsx`

**新建**：从 basalt TargetCardsPage 的目标卡片模式适配。

#### Commit 4.10: `feat: add PointsSourceCard component`

**文件**：`src/components/PointsSourceCard.tsx`

**新建**：积分来源卡片（余额 + 可兑换项计数）。

#### Commit 4.11: `feat: add MemberFilterBar component`

**文件**：`src/components/MemberFilterBar.tsx`

**新建**：水平 pill 按钮筛选条。

#### Commit 4.12: `feat: add RedeemDialog component`

**文件**：`src/components/RedeemDialog.tsx`

**新建**：基于 shadcn Dialog 的核销确认弹窗。

#### Commit 4.13: `feat: add SourceFormDialog component`

**文件**：`src/components/SourceFormDialog.tsx`

**新建**：基于 shadcn Dialog 的来源新增/编辑弹窗，包含：名称、分类下拉、币种、受益人选择、周期锚点配置。

#### Commit 4.14: `feat: add BenefitFormDialog component`

**文件**：`src/components/BenefitFormDialog.tsx`

**新建**：基于 shadcn Dialog 的权益新增/编辑弹窗，包含：名称、类型下拉（quota/credit/action）、配额/额度输入、周期覆盖、共享开关。

#### Commit 4.15: `feat: add MemberFormDialog component`

**文件**：`src/components/MemberFormDialog.tsx`

**新建**：基于 shadcn Dialog 的受益人新增/编辑弹窗，包含：名称、关系下拉（MemberRelationship）、头像 emoji 选择。

#### Commit 4.16: `feat: add DeleteConfirmDialog component`

**文件**：`src/components/DeleteConfirmDialog.tsx`

**新建**：基于 shadcn AlertDialog 的通用删除确认弹窗，显示级联影响统计。

#### Commit 4.17: `feat: add TimezoneSelect component`

**文件**：`src/components/TimezoneSelect.tsx`

**新建**：时区下拉选择器，含常用时区列表和 UTC 偏移显示。

**验证**：`bun run lint && bun run build`

---

## 阶段 P5：页面组装

**目标**：组装 5 个页面，连接 ViewModel 和 UI 组件。

**验收标准**：所有页面可正常渲染，路由可导航，lint + build 通过。

### 提交序列

#### Commit 5.1: `feat: update sidebar navigation for wooly pages`

**文件**：
- `src/components/AppSidebar.tsx`：更新 NAV_GROUPS（全中文标签：仪表盘、来源、核销台、设置）
- `src/components/DashboardLayout.tsx`：更新 PAGE_TITLES（全中文标题）

#### Commit 5.2: `feat: implement dashboard page`

**文件**：`src/app/(dashboard)/page.tsx`

**内容**：组装 StatGrid + 过期提醒列表 + RadialProgressCard + BarChartCard + ItemListCard。

#### Commit 5.3: `feat: implement sources list page`

**文件**：`src/app/(dashboard)/sources/page.tsx`

**内容**：组装 StatGrid + MemberFilterBar + SourceCard 网格 + PointsSourceCard + 归档来源折叠区 + SourceFormDialog（新增/编辑来源）+ DeleteConfirmDialog。

#### Commit 5.4: `feat: implement source detail page`

**文件**：`src/app/(dashboard)/sources/[id]/page.tsx`

**内容**：组装来源头部 + StatGrid + BenefitProgressRow 列表 + ItemListCard 受益人统计 + BenefitFormDialog（新增/编辑权益）+ RedeemDialog + DeleteConfirmDialog。

#### Commit 5.5: `feat: implement tracker page`

**文件**：`src/app/(dashboard)/tracker/page.tsx`

**内容**：组装 StatGrid + RecentListCard + ActionGridCard + 可核销列表 + RedeemDialog。

#### Commit 5.6: `feat: implement settings page`

**文件**：`src/app/(dashboard)/settings/page.tsx`

**内容**：从 basalt SettingsPage 适配，包含受益人管理（MemberFormDialog + DeleteConfirmDialog）+ 偏好设置 + 时区设置（TimezoneSelect）+ 账户信息四个分区。

#### Commit 5.7: `test: add page render tests`

**文件**：
- `src/test/pages/DashboardPage.test.tsx`
- `src/test/pages/SourcesPage.test.tsx`
- `src/test/pages/SourceDetailPage.test.tsx`
- `src/test/pages/TrackerPage.test.tsx`
- `src/test/pages/SettingsPage.test.tsx`

**内容**：Mock ViewModel，验证关键文本渲染。

**验证**：`bun run test && bun run lint && bun run build`

---

## 阶段 P6：集成收尾

**目标**：完善积分模块的页面集成、端到端流程验证、文档更新。

**验收标准**：完整 MVP 功能可用，所有测试通过，覆盖率达标。

### 提交序列

#### Commit 6.1: `feat: integrate points source into sources page`

**内容**：确保 Sources 页面正确展示积分来源卡片，点击可查看可兑换项。

#### Commit 6.2: `feat: add points detail section to source detail page`

**内容**：当 Source Detail 页面接收一个积分来源 ID 时，展示积分余额和可兑换项列表（含 Redeemable CRUD）。

#### Commit 6.3: `feat: verify archive feature end-to-end`

**内容**：验证归档/取消归档操作的完整流程——归档后来源在列表底部灰色显示、不参与 Dashboard 统计、不出现在 Tracker 核销列表中。

#### Commit 6.4: `test: add integration-level viewmodel tests`

**内容**：跨 ViewModel 的集成验证，确保 Dashboard 的数据与 Sources/Tracker 一致。

#### Commit 6.4: `chore: verify coverage thresholds`

**内容**：运行 `bun run test:coverage`，确保 Model/ViewModel 层覆盖率 >= 90%。补充遗漏的测试用例。

#### Commit 6.5: `docs: update CLAUDE.md with wooly architecture`

**内容**：更新 CLAUDE.md，记录新增的路由、组件、MVVM 结构。

**验证**：`bun run test:coverage && bun run lint && bun run build`

---

## 时间线估算

| 阶段 | 预估提交数 | 复杂度 |
|---|---|---|
| P1 领域基础层 | 5 | 中（周期算法有边界情况） |
| P2 假数据与业务模型 | 13 | 中（CRUD 纯函数 + 验证逻辑） |
| P3 ViewModel 层 | 10 | 中-高（CRUD 状态管理 + 表单验证） |
| P4 UI 组件库 | 17 | 中（移植 + 适配 + CRUD 表单弹窗） |
| P5 页面组装 | 7 | 中（布局 + CRUD 连接） |
| P6 集成收尾 | 6 | 低（归档验证 + 查缺补漏） |
| **合计** | **~58** | — |

## 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| 周期引擎边界情况遗漏 | P1 阶段用 TDD 覆盖所有已知边界，P2/P3 阶段用真实 mock 数据二次验证 |
| basalt 组件适配成本超预期 | P4 按组件独立提交，发现不适配可快速回退或重写 |
| React 19 ESLint 规则冲突 | 沿用 basalt 已验证的 `useSyncExternalStore` 模式，避免 `setState` in `useEffect` |
| mock 数据与周期引擎不一致 | P2 的 mock 数据日期全部基于 2026-02-13 手工验算 |
| CRUD 表单状态复杂度 | 每个实体的 CRUD 遵循统一的 Model 纯函数 + ViewModel 状态管理模式，减少一次性设计负担 |
| 时区处理引入复杂度 | 时区转换仅在 ViewModel 层执行一次（`formatDateInTimezone`），周期引擎保持纯日期字符串输入 |
| 级联删除操作风险 | 所有删除操作强制弹窗确认，显示影响范围统计；Member 删除采用阻止策略 |
