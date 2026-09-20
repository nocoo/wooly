<p align="center">
  <img src="assets/brand/icon-rounded.png" alt="Wooly" width="128" height="128" />
</p>

<h1 align="center">Wooly</h1>

<p align="center">集中记录家人的信用卡、保险、会员权益和积分，查看剩余额度与到期时间。</p>

<p align="center">
  <a href="https://wooly.hexly.ai">站点</a> ·
  <a href="docs/README.en.md">English</a>
</p>

## 这是什么

Wooly 是家庭权益管理 Web 应用。它把权益账户、使用周期、受益人和核销记录放在一起，方便查看本期还有哪些权益可用、谁使用过、哪些即将到期。

界面主要使用中文，通过 Cloudflare Access 控制访问。每套部署保存一份共享家庭数据；“家庭成员”是受益人记录，不是独立的登录账户。数据由使用者维护，当前没有银行、保险或积分平台的自动同步。

## 功能

- 管理信用卡、保险、会员、电信等权益账户，记录所属成员、有效期、费用、卡片标识与备注，并归档停用账户。
- 按月、季度或年度计算权益周期；单项权益可覆盖账户默认周期。
- 记录次数型和额度型权益的核销、受益人及日期，查看当前周期的使用情况。
- 在仪表盘和核销台查看剩余额度、即将到期的权益与使用趋势。
- 手动维护积分账户余额、可兑换项目和所需积分，查看当前余额可兑换哪些项目。
- 管理家庭成员和时区，切换浅色 / 深色主题。

到期提醒目前显示在应用页面中。积分项目用于记录与比较，实际兑换和余额更新由使用者完成。

## 使用

打开[站点](https://wooly.hexly.ai)，使用 Cloudflare Access 允许的身份登录。首次使用时：

1. 在“设置”中添加家庭成员并确认时区。
2. 在“权益账户”中添加账户，选择所属成员、类别和默认使用周期。
3. 进入账户详情添加权益，在使用后记录核销。
4. 在仪表盘和“核销台”中核对本期剩余与到期情况；积分账户单独维护余额和兑换项目。

| 权益类型 | 当前行为 |
| --- | --- |
| 次数型 | 每次核销消耗一次本期配额 |
| 额度型 | 每周期记录一次全额使用，不拆分金额核销 |
| 任务型 | 仅作提醒，不参与核销计数 |

更改会自动同步到服务器。当前保存方式是整份家庭数据替换，没有并发编辑合并；多个窗口同时修改可能覆盖彼此的结果。

## 开发

需要 Bun 1.4.0 和 Node.js 22.12+。所有依赖和命令都在根目录；开发默认使用独立本地 D1：

```bash
git clone https://github.com/nocoo/wooly.git
cd wooly
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

打开 `http://127.0.0.1:7014`。本地身份仅在显式 local/test 环境与受信任本地主机生效。`wrangler.jsonc` 已提供 `developer@example.test`，不需要 OAuth 或生产密钥。生产由 Cloudflare Access 登录，Worker 再校验 JWT。

```text
src/pages/           React Router 页面
src/components/      Basalt 界面组件
src/models/          权益、周期、积分与成员的纯函数
src/viewmodels/      页面状态和用户操作
worker/src/          Access 鉴权、数据校验与 D1 读写
worker/migrations/   数据库迁移
```

## 测试与部署

| 检查 | 命令 |
| --- | --- |
| 严格类型 / 代码质量 | `bun run typecheck` / `bun run lint` |
| Model / ViewModel / 会话覆盖率 | `bun run test:unit:coverage` |
| Worker / D1 覆盖率 | `bun run test:worker` |
| 真实 HTTP 与本地 D1 | `bun run test:api` |
| 浏览器操作 | `bun run test:e2e:bdd` |
| 构建 / 部署预检 | `bun run build` / `bun run deploy:check` |

浏览器测试先安装 `bunx playwright install chromium`。测试在端口 `27014` 启动独立 Worker，每次使用带标记的临时 SQLite，不读取生产数据。

生产只部署一个 Cloudflare Worker，包含静态资源和 API，复用原有 D1。`main` 的 CI 通过后自动部署并验证版本、D1 健康状态和 Access 保护。GitHub `production` 环境需要 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`；本机配置后也可 `bun run deploy`。仅改文档的 `main` push 也会走这条流水线，重新部署现有版本。数据库迁移独立执行，不随部署自动运行。详见[开发与部署](docs/08-development.md)。

## 技术栈

| 部分 | 实现 |
| --- | --- |
| Web 界面 | Vite、React Router、React、Tailwind CSS、Basalt |
| 图表 | Recharts |
| 登录 | Cloudflare Access、jose JWT 校验 |
| 数据服务 | Cloudflare Worker、D1、Valibot |
| 开发与测试 | Bun、TypeScript、Vitest、Miniflare、Playwright |
| 部署 | GitHub Actions、Wrangler、Workers Static Assets |

依赖与版本以根 [package.json](package.json) 和 `bun.lock` 为准。

## 文档

- [文档索引](docs/README.md)
- [开发、测试与 CI/CD](docs/08-development.md)
- [当前架构、数据模型与 API](docs/10-maintainer-notes.md)
- [Workers 迁移、发布证据与旧资源清理](docs/11-workers-migration.md)
- [项目维护规则](AGENTS.md)
- [版本记录](CHANGELOG.md)与[事故记录](Retrospective.md)
- [Logo 使用说明](assets/brand/README.md)

早期设计、UI 审计与截图研究已在索引中标为历史资料；当前字段和运行方式以维护文档及源码为准。

## 许可证

[MIT](LICENSE) © 2026 Zheng Li
