<p align="center">
  <img src="../assets/brand/icon-rounded.png" alt="Wooly" width="128" height="128" />
</p>

<h1 align="center">Wooly</h1>

<p align="center">Keep family credit-card, insurance, membership and points benefits together, with remaining allowances and expiry dates.</p>

<p align="center">
  <a href="https://wooly.hexly.ai">Website</a> ·
  <a href="../README.md">简体中文</a>
</p>

## What it does

Wooly is a web application for household benefits. It keeps benefit accounts, usage cycles, beneficiaries and redemption records together so you can see what remains available, who used it and what expires soon.

The interface is primarily in Chinese. Cloudflare Access controls sign-in. Each deployment stores one shared household dataset. Family members are beneficiary records, not separate login accounts. Users maintain the data; automatic synchronization with banks, insurers and loyalty platforms is not implemented.

## Features

- Manage credit-card, insurance, membership, telecom and other benefit accounts, including owner, validity, cost, card identifier and notes. Archive inactive accounts.
- Calculate monthly, quarterly and yearly cycles. Individual benefits can override the account's default cycle.
- Record redemptions, beneficiaries and dates for quota and credit benefits, and review usage in the current cycle.
- View remaining allowances, upcoming expiry and usage trends on the dashboard and Redemption Desk.
- Manually maintain points balances, redeemable items and their costs, and see which items the current balance can afford.
- Manage family members and the timezone, and switch between light and dark themes.

Expiry reminders currently appear inside the application. Points items are records for comparison; users complete actual exchanges and update balances themselves.

## Usage

Open the [website](https://wooly.hexly.ai) and sign in with an identity allowed by Cloudflare Access. For initial setup:

1. Add family members and confirm the timezone in Settings.
2. Add an account under Benefit Accounts, choosing its owner, category and default cycle.
3. Add benefits on the account detail page and record redemptions after use.
4. Check remaining allowances and expiry on the dashboard and Redemption Desk. Maintain points balances and redeemable items separately.

| Benefit type | Current behavior |
| --- | --- |
| Quota | Each redemption consumes one allowance in the current cycle |
| Credit | One full-amount redemption per cycle; partial monetary redemptions are not tracked |
| Action | A reminder only; excluded from redemption counts |

Changes sync automatically to the server. Saves replace the entire household dataset and do not merge concurrent edits. Changes made in multiple windows can overwrite each other.

## Development

Requires Bun 1.4.0 and Node.js 22.12+. Install once from the root; development uses isolated local D1:

```bash
git clone https://github.com/nocoo/wooly.git
cd wooly
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

Open `http://127.0.0.1:7014`. Local identity requires an explicit local/test environment and a trusted local host. `wrangler.jsonc` already supplies `developer@example.test`; local development needs no OAuth or production credentials. Production sign-in is handled by Cloudflare Access and verified again by the Worker.

```text
src/pages/           React Router pages
src/components/      Basalt UI components
src/models/          Pure benefit, cycle, points and member functions
src/viewmodels/      Page state and user actions
worker/src/          Access JWT verification, validation and D1 access
worker/migrations/   Database migrations
```

## Tests and deployment

| Check | Command |
| --- | --- |
| Strict types / code quality | `bun run typecheck` / `bun run lint` |
| Model / ViewModel / session coverage | `bun run test:unit:coverage` |
| Worker / D1 coverage | `bun run test:worker` |
| Real HTTP and local D1 | `bun run test:api` |
| Browser journeys | `bun run test:e2e:bdd` |
| Build / deployment dry run | `bun run build` / `bun run deploy:check` |

Install Chromium with `bunx playwright install chromium`. Browser tests start an isolated Worker on port 27014 with a unique temporary SQLite database and verified marker. Tests never read production data.

Production deploys one Cloudflare Worker containing static assets and APIs, with the existing D1 database. Successful CI on main triggers deployment and verifies the version, D1 connectivity and Access protection. The GitHub `production` environment requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Authorized local deployments use `bun run deploy`. Documentation-only main pushes also follow this pipeline and redeploy the existing version. Schema migrations remain manual and separate from deployment. See [development and deployment](08-development.md).

## Stack

| Area | Implementation |
| --- | --- |
| Web interface | Vite, React Router, React, Tailwind CSS and Basalt |
| Charts | Recharts |
| Sign-in | Cloudflare Access and jose JWT verification |
| Data service | Cloudflare Worker, D1 and Valibot |
| Development and tests | Bun, TypeScript, Vitest, Miniflare and Playwright |
| Deployment | GitHub Actions, Wrangler and Workers Static Assets |

Dependency versions are recorded in the root [package.json](../package.json) and `bun.lock`.

## Documentation

- [Documentation index](README.md)
- [Development, tests and CI/CD](08-development.md)
- [Current architecture, domain model and API](10-maintainer-notes.md)
- [Workers migration, release evidence and old-resource cleanup](11-workers-migration.md)
- [Project handbook](../AGENTS.md)
- [Changelog](../CHANGELOG.md) and [retrospective](../Retrospective.md)
- [Logo usage](../assets/brand/README.md)

Earlier designs, UI audits and screenshot studies are labeled historical in the index. Maintained documentation and source define the current fields and runtime behavior.

## License

[MIT](../LICENSE) © 2026 Zheng Li
