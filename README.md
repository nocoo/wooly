<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/dark-256.png" />
    <source media="(prefers-color-scheme: light)" srcset="public/logo/light-256.png" />
    <img alt="Wooly" src="public/logo/light-256.png" width="128" height="128" />
  </picture>
</p>

<h1 align="center">Wooly</h1>

<p align="center">
  The missing dashboard for your scattered family perks.<br/>
  Track credit card rewards, insurance benefits, and membership rights before they expire.
</p>

---

## Features

- **Benefit Sources** — credit cards, insurance policies, memberships, loyalty programs
- **Cycle Tracking** — monthly, quarterly, and yearly benefit quotas with automatic period detection
- **Family Members** — track per-member usage across shared benefits
- **Points System** — loyalty point balances with redeemable item management
- **Expiry Alerts** — never miss a benefit window again

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · recharts · NextAuth.js v5

## Getting Started

```bash
bun install
cp .env.example .env.local   # fill in Google OAuth credentials
bun run dev                   # http://localhost:7018
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server (Turbopack, port 7018) |
| `bun run build` | Production build |
| `bun run start` | Production server |
| `bun run test` | Run tests |
| `bun run test:coverage` | Run tests with coverage report |
| `bun run lint` | ESLint |

## Architecture

Wooly follows an **MVVM** pattern:

| Layer | Location | Responsibility |
|---|---|---|
| **Model** | `src/models/` | Pure functions — CRUD, validation, computation |
| **ViewModel** | `src/viewmodels/` | React hooks — orchestrate models, manage state |
| **View** | `src/app/`, `src/components/` | React components — render UI, no business logic |

## License

Private
