# 开发与部署

基础启动与测试命令见[中文 README](../README.md)或 [English README](README.en.md)。本文补充持久化配置和各组件的部署入口。

## 数据链路

浏览器请求 Next.js 的 `/api/data`，Next.js 使用 `WOOLY_API_KEY` 在服务端调用 Worker 的 `/api/v1/dataset`。Worker 通过 `DB` binding 读写 D1。所有允许登录的邮箱使用同一份家庭数据，家庭成员只是数据中的受益人记录。

更新是整份 dataset 替换：Worker 先校验数据与关联，再在 D1 batch 中删除旧内容、写入新内容。当前没有多窗口版本比较或并发合并。

## 首次本地初始化

1. 在根目录和 `worker/` 分别执行 `bun install --frozen-lockfile`。
2. 在 `worker/` 复制 `wrangler.toml.example` 为 `wrangler.toml`，复制 `.dev.vars.example` 为 `.dev.vars`。
3. 从 `worker/` 执行 `bun run migrate:local`。这个命令显式使用 `--local`，数据保存在 `worker/.wrangler/state/`。纯本地模式可保留示例中的 D1 占位值，不需要先创建线上数据库；上线前必须填写真实资源。
4. 在根目录复制 `.env.example` 为 `.env.local`，将 `WOOLY_WORKER_URL` 改为 `http://localhost:8787`。填写匹配 Worker `API_KEY` 的 `WOOLY_API_KEY`，以及自己的 Google OAuth、会话密钥和邮箱白名单。
5. 分别启动 `bun run dev:worker` 和 `bun run dev:site`。本地仍使用 Google 登录，回调为 `http://localhost:7014/api/auth/callback/google`。

`bun run dev` 的编排脚本根据 URL 选择本地 / 远端 Worker，需要 Bash 4.3+。它只补充不存在的环境变量，不会替换模板中已经存在但为空的 `WOOLY_API_KEY=`，因此 key 必须显式填写。

日常连接远端 Worker 时，配置自己的远端 URL 和对应 API key；环境模板中的 `https://wooly.worker.hexly.ai` 是维护者的生产服务。

## Worker 部署

需要自己的 Cloudflare 账户、D1 数据库和 Worker。将 D1 名称、ID 填入 `worker/wrangler.toml`，确认应用连接的 Worker 地址，再从 `worker/` 执行：

```bash
bun run migrate:remote
bunx wrangler secret put API_KEY
bun run deploy
```

`secret put` 通过交互输入 key，该值须与站点的 `WOOLY_API_KEY` 相同。迁移与部署是分开的步骤；`deploy` 不会自动应用迁移。

重置接口需要站点 `WOOLY_ALLOW_RESET=true` 和 Worker `ALLOW_RESET=true` 同时开启。生产默认保持关闭。

## 站点部署

[Dockerfile](../Dockerfile) 生成 Next.js standalone 镜像，容器内监听 `7014`。Worker URL、API key、Google OAuth、会话密钥及邮箱白名单在运行时注入。

当前 [Release 工作流](../.github/workflows/release.yml) 在 `main` 的 CI 成功后构建镜像，推送 GHCR，并通过 SSH 更新 VPS 上的应用容器。工作流也支持手动运行。它使用项目的 `production` Environment，部署配置包括 `VPS_HOST`、`VPS_USER`、`VPS_SSH_KEY`、`VPS_PORT`、`GHCR_PULL_USER` 和 `GHCR_PULL_TOKEN`。

站点域名、VPS 目录和容器名称均为维护者部署配置。自行部署需替换这些目标，准备自己的容器运行环境和反向代理。此流程只更新站点，不发布 Worker。
