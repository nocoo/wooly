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

The interface is primarily in Chinese. Google sign-in and an email allowlist control access. Each deployment stores one shared household dataset. Family members are beneficiary records, not separate login accounts. Users maintain the data; automatic synchronization with banks, insurers and loyalty platforms is not implemented.

## Features

- Manage credit-card, insurance, membership, telecom and other benefit accounts, including owner, validity, cost, card identifier and notes. Archive inactive accounts.
- Calculate monthly, quarterly and yearly cycles. Individual benefits can override the account's default cycle.
- Record redemptions, beneficiaries and dates for quota and credit benefits, and review usage in the current cycle.
- View remaining allowances, upcoming expiry and usage trends on the dashboard and benefit tracker.
- Manually maintain points balances, redeemable items and their costs, and see which items the current balance can afford.
- Manage family members and the timezone, and switch between light and dark themes.

Expiry reminders currently appear inside the application. Points items are records for comparison; users complete actual exchanges and update balances themselves.

## Usage

Open the [website](https://wooly.hexly.ai) and sign in with an allowlisted Google account. For initial setup:

1. Add family members and confirm the timezone in Settings.
2. Add an account under Benefit Accounts, choosing its owner, category and default cycle.
3. Add benefits on the account detail page and record redemptions after use.
4. Check remaining allowances and expiry on the dashboard and Benefit Tracker. Maintain points balances and redeemable items separately.

| Benefit type | Current behavior |
| --- | --- |
| Quota | Each redemption consumes one allowance in the current cycle |
| Credit | One full-amount redemption per cycle; partial monetary redemptions are not tracked |
| Action | A reminder only; excluded from redemption counts |

Changes sync automatically to the server. Saves replace the entire household dataset and do not merge concurrent edits. Changes made in multiple windows can overwrite each other.

## Development

Install Bun and Node.js 22.12+. The root `package.json` records the package-manager version. The application and Worker install dependencies separately. This setup uses local D1:

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

Set `API_KEY` in `worker/.dev.vars` and `WOOLY_API_KEY` in `.env.local` to the same value you choose, then change `WOOLY_WORKER_URL` to `http://localhost:8787`. The environment template points to the maintainer's production Worker; copying it alone does not connect your local data.

| `.env.local` variable | Purpose |
| --- | --- |
| `WOOLY_WORKER_URL` / `WOOLY_API_KEY` | Worker address and shared API key, used only by the Next.js server |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth application credentials |
| `AUTH_SECRET` | Session secret; generate one with `openssl rand -base64 32` |
| `AUTH_ALLOWED_EMAILS` | Comma-separated sign-in email allowlist |
| `AUTH_URL` | Application URL; leave empty for detection, or use `http://localhost:7014` locally |
| `USE_SECURE_COOKIES` | Cookie option for an HTTPS development reverse proxy |
| `WOOLY_ALLOW_RESET` | Enable dataset reset, default `false`; also requires Worker `ALLOW_RESET=true` |

The Google OAuth callback is `http://localhost:7014/api/auth/callback/google`. The local application also requires sign-in. After configuration, start these processes in separate terminals:

```bash
# Terminal one: Worker on port 8787
bun run dev:worker
```

```bash
# Terminal two: Next.js on port 7014
bun run dev:site
```

You can also use `bun run dev` to start them together. A local Worker URL starts both processes; a remote URL starts only the site. This script uses `wait -n`, requires Bash 4.3+, and does not replace an existing empty key in the environment file. The separate commands above do not use this orchestration script.

`bun run build` builds with webpack; `bun run start` runs the built site. Use `bun run typecheck`, `bun run typecheck:worker` and `bun run lint` for types and code style.

```text
src/models/          Benefit, cycle, points and member calculations
src/viewmodels/      Page state and user actions
src/app/             Next.js pages, sign-in and data proxy routes
src/services/        Server-side Worker client
worker/src/          Validation, authentication and D1 access
worker/migrations/   D1 database migrations
```

The production site runs in Docker on a VPS and updates after successful CI. The Worker deploys separately. Initial deployment needs your own D1, Worker API key and OAuth configuration; see [development and deployment](08-development.md).

## Tests

Run from the repository root after installing both application and Worker dependencies:

| Layer | Command |
| --- | --- |
| Model / ViewModel and utility tests | `bun run test` |
| Next.js API route tests | `bun run test:api` |
| Worker and local D1 tests | `bun run test:worker` |
| Browser smoke test | `bun run test:e2e:bdd` |

API route tests call handlers directly and mock upstream Worker requests. Worker tests use Miniflare's local D1 without accessing the production database. Install the browser with `bunx playwright install chromium` first. Browser tests start the site on port `27014` and currently check only the login page title and welcome text.

Use `bun run test:watch` for watch mode and `bun run test:coverage` for a coverage report. Complete benefit workflows for signed-in users still need manual verification.

## Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflareworkers&logoColor=white)
![D1](https://img.shields.io/badge/D1-F38020)

| Area | Implementation |
| --- | --- |
| Web interface | Next.js App Router, React, Tailwind CSS and shadcn/ui / Radix UI |
| Charts | Recharts |
| Sign-in | Auth.js / NextAuth and Google OAuth |
| Data service | Cloudflare Workers, D1 and Valibot |
| Development and tests | Bun, TypeScript, Vitest, React Testing Library, Miniflare and Playwright |
| Deployment | Docker, GitHub Container Registry and a VPS |

Dependency versions are recorded in the [root package.json](../package.json), [Worker package.json](../worker/package.json) and their respective `bun.lock` files.

## Documentation

- [Documentation index](README.md)
- [Development and deployment](08-development.md)
- [Data model](01-data-model.md)
- [MVVM structure](02-mvvm-architecture.md)
- [Cycle calculations](05-cycle-engine.md)
- [Logo usage](../assets/brand/README.md)

Earlier design documents preserve the implementation process. Use this README for current data entry points and commands.

## License

[MIT](../LICENSE) © 2026 Zheng Li
