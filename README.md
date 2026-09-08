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

界面主要使用中文，通过 Google 登录与邮箱白名单控制访问。每套部署保存一份共享家庭数据；“家庭成员”是受益人记录，不是独立的登录账户。数据由使用者维护，当前没有银行、保险或积分平台的自动同步。

## 功能

- 管理信用卡、保险、会员、电信等权益账户，记录所属成员、有效期、费用、卡片标识与备注，并归档停用账户。
- 按月、季度或年度计算权益周期；单项权益可覆盖账户默认周期。
- 记录次数型和额度型权益的核销、受益人及日期，查看当前周期的使用情况。
- 在仪表盘和权益追踪页查看剩余额度、即将到期的权益与使用趋势。
- 手动维护积分账户余额、可兑换项目和所需积分，查看当前余额可兑换哪些项目。
- 管理家庭成员和时区，切换浅色 / 深色主题。

到期提醒目前显示在应用页面中。积分项目用于记录与比较，实际兑换和余额更新由使用者完成。

## 使用

打开[站点](https://wooly.hexly.ai)，使用白名单中的 Google 账号登录。首次使用时：

1. 在“设置”中添加家庭成员并确认时区。
2. 在“权益账户”中添加账户，选择所属成员、类别和默认使用周期。
3. 进入账户详情添加权益，在使用后记录核销。
4. 在仪表盘和“权益追踪”中核对本期剩余与到期情况；积分账户单独维护余额和兑换项目。

| 权益类型 | 当前行为 |
| --- | --- |
| 次数型 | 每次核销消耗一次本期配额 |
| 额度型 | 每周期记录一次全额使用，不拆分金额核销 |
| 任务型 | 仅作提醒，不参与核销计数 |

更改会自动同步到服务器。当前保存方式是整份家庭数据替换，没有并发编辑合并；多个窗口同时修改可能覆盖彼此的结果。

## 开发

需要 Bun 和 Node.js 22.12+。包管理器版本记录在根 `package.json`。应用和 Worker 分别安装依赖，以下流程使用本地 D1：

```bash
git clone https://github.com/nocoo/wooly.git
cd wooly
bun install --frozen-lockfile
cd worker
bun install --frozen-lockfile
cp wrangler.toml.example wrangler.toml
cp .dev.vars.example .dev.vars
bun run migrate:local
cd ..
cp .env.example .env.local
```

将 `worker/.dev.vars` 的 `API_KEY` 与 `.env.local` 的 `WOOLY_API_KEY` 设置为同一个自定义值，并把 `WOOLY_WORKER_URL` 改为 `http://localhost:8787`。环境模板默认指向维护者的生产 Worker，仅复制文件还不能连接自己的本地数据。

| `.env.local` 变量 | 用途 |
| --- | --- |
| `WOOLY_WORKER_URL` / `WOOLY_API_KEY` | Worker 地址及共享 API key，仅由 Next.js 服务端使用 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth 应用凭据 |
| `AUTH_SECRET` | 会话密钥，可用 `openssl rand -base64 32` 生成 |
| `AUTH_ALLOWED_EMAILS` | 逗号分隔的登录邮箱白名单 |
| `AUTH_URL` | 应用地址，可留空自动检测；本地地址为 `http://localhost:7014` |
| `USE_SECURE_COOKIES` | 开发 HTTPS 反向代理使用的 cookie 选项 |
| `WOOLY_ALLOW_RESET` | 是否允许重置数据，默认 `false`；还需 Worker 的 `ALLOW_RESET=true` |

Google OAuth 回调地址为 `http://localhost:7014/api/auth/callback/google`。本地应用同样需要登录。完成配置后，在两个终端分别运行：

```bash
# 终端一：Worker，端口 8787
bun run dev:worker
```

```bash
# 终端二：Next.js，端口 7014
bun run dev:site
```

也可使用 `bun run dev` 统一启动：本地 Worker URL 会启动两个进程，远端 URL 只启动站点。该脚本使用 `wait -n`，需要 Bash 4.3+，且不会替换环境文件中已经存在的空 key。上面的分别启动命令不依赖这一编排脚本。

`bun run build` 使用 webpack 构建，`bun run start` 运行构建后的站点。类型与代码风格检查使用 `bun run typecheck`、`bun run typecheck:worker` 和 `bun run lint`。

```text
src/models/          权益、周期、积分与成员的计算逻辑
src/viewmodels/      页面状态和用户操作
src/app/             Next.js 页面、登录与数据代理路由
src/services/        服务端 Worker 客户端
worker/src/          数据校验、鉴权与 D1 读写
worker/migrations/   D1 数据库迁移
```

生产站点通过 Docker 部署到 VPS，CI 成功后自动更新；Worker 独立发布。首次部署需要自己的 D1、Worker API key 和 OAuth 配置，见[开发与部署说明](docs/08-development.md)。

## 测试

从仓库根目录运行，先安装根目录与 Worker 依赖：

| 测试层 | 命令 |
| --- | --- |
| Model / ViewModel 与工具函数测试 | `bun run test` |
| Next.js API 路由测试 | `bun run test:api` |
| Worker 与本地 D1 测试 | `bun run test:worker` |
| 浏览器冒烟测试 | `bun run test:e2e:bdd` |

API 路由测试直接调用 handler，并模拟上游 Worker 请求；Worker 测试使用 Miniflare 的本地 D1，不访问生产数据库。浏览器测试需先运行 `bunx playwright install chromium`，测试会启动端口 `27014` 的站点，当前只检查登录页标题和欢迎文案。

`bun run test:watch` 进入监听模式，`bun run test:coverage` 生成覆盖率报告。已登录用户的完整权益操作仍需手动验证。

## 技术栈

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflareworkers&logoColor=white)
![D1](https://img.shields.io/badge/D1-F38020)

| 部分 | 实现 |
| --- | --- |
| Web 界面 | Next.js App Router、React、Tailwind CSS、shadcn/ui / Radix UI |
| 图表 | Recharts |
| 登录 | Auth.js / NextAuth、Google OAuth |
| 数据服务 | Cloudflare Workers、D1、Valibot |
| 开发与测试 | Bun、TypeScript、Vitest、React Testing Library、Miniflare、Playwright |
| 部署 | Docker、GitHub Container Registry、VPS |

依赖以[根 package.json](package.json)、[Worker package.json](worker/package.json) 和各自的 `bun.lock` 为准。

## 文档

- [文档索引](docs/README.md)
- [开发与部署](docs/08-development.md)
- [数据模型](docs/01-data-model.md)
- [MVVM 结构](docs/02-mvvm-architecture.md)
- [周期计算](docs/05-cycle-engine.md)
- [Logo 使用说明](assets/brand/README.md)

早期设计文档保留了实现过程，当前数据入口和运行命令以本 README 为准。

## 许可证

[MIT](LICENSE) © 2026 Zheng Li
