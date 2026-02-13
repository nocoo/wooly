# Wooly — Project Intelligence

## Overview

**Wooly** is a Next.js dashboard application that inherits the full UI design system from the **basalt** template project (a Vite + React SPA at `/Users/nocoo/workspace/personal/basalt`). The primary brand color is **Magenta** (`HSL 320 70% 55%`).

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) | 4.1.18 |
| Component Library | shadcn/ui (Radix UI primitives) | — |
| Icons | lucide-react | 0.563.0 |
| Toast | sonner | 1.7.4 |
| Command Palette | cmdk | 1.1.1 |
| Authentication | NextAuth.js (Auth.js v5) | 5.0.0-beta.30 |
| Package Manager | bun | 1.3.6 |
| Unit Testing | Vitest + @testing-library/react + jsdom | 4.0.18 |
| Coverage | @vitest/coverage-v8 (90% threshold) | 4.0.18 |
| Linting | ESLint + eslint-config-next (core-web-vitals + typescript) | 9.32.0 |
| Git Hooks | Husky (pre-commit: test, pre-push: test + lint) | 9.1.7 |

## Key Commands

```bash
bun run dev          # Start dev server on port 7018 (Turbopack)
bun run build        # Production build
bun run start        # Production server on port 7018
bun run test         # Run Vitest (single run)
bun run test:watch   # Run Vitest in watch mode
bun run test:coverage # Run Vitest with v8 coverage report
bun run lint         # ESLint
```

## Architecture

### Directory Structure

```
src/
  app/                         # Next.js App Router
    globals.css                # ALL design tokens (Tailwind v4 @theme, CSS variables)
    layout.tsx                 # Root layout (fonts, providers, Toaster — NO sidebar)
    api/auth/[...nextauth]/    # NextAuth.js API route handler
      route.ts
    (dashboard)/               # Route group: pages with DashboardLayout (sidebar + header)
      layout.tsx               # Wraps children with DashboardLayout
      page.tsx                 # Dashboard home page
      loading.tsx              # Loading state (renders LoadingScreen)
    (auth)/                    # Route group: standalone pages (no sidebar)
      login/page.tsx           # Badge login page (basalt BadgeLoginPage template)
  auth.ts                      # NextAuth.js config (Google provider, whitelist callback)
  middleware.ts                # Route protection (redirects unauthenticated to /login)
  components/
    ui/                        # shadcn/ui primitives (9 components)
      avatar.tsx
      card.tsx
      collapsible.tsx
      command.tsx               # Command palette (cmdk)
      dialog.tsx
      input.tsx
      separator.tsx
      sonner.tsx                # Toast notifications
      tooltip.tsx
    AppSidebar.tsx              # Collapsible sidebar with nav groups, search (Cmd+K), user footer
    DashboardLayout.tsx         # Main shell: sidebar + header + content area
    LoadingScreen.tsx           # Full-screen loading (basalt LoadingPage template)
    Logo.tsx                    # Logo component (auto dark/light, size presets sm/md/lg/xl)
    SessionProvider.tsx         # Client-side NextAuth SessionProvider wrapper
    ThemeToggle.tsx             # Light/Dark/System theme cycler (uses shared use-theme hook)
  hooks/
    use-mobile.ts              # useIsMobile() — useSyncExternalStore based
    use-theme.ts               # Shared theme store (useTheme, useAppliedTheme, applyTheme)
  lib/
    auth.ts                    # Email whitelist utilities (parseEmailWhitelist, isEmailAllowed)
    utils.ts                   # cn() helper (clsx + tailwind-merge)
    palette.ts                 # Chart color constants, withAlpha(), CHART_COLORS array
  test/
    setup.ts                   # Vitest setup (jest-dom matchers)
scripts/
  generate_logo.py             # Resize logo-light/dark.png → public/ assets
public/
  favicon.png                  # 32x32 favicon (light variant)
  logo/                        # Generated logo assets (light/dark × 32/64/128/256px)
  logo-loading-light.png       # 256x256 loading splash (light)
  logo-loading-dark.png        # 256x256 loading splash (dark)
```

### Config Files (Project Root)

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (port 7018), bun packageManager |
| `tsconfig.json` | TypeScript config, `@/*` path alias to `./src/*` |
| `next.config.ts` | Next.js config (Google avatar image remotePatterns) |
| `postcss.config.mjs` | Tailwind CSS v4 via `@tailwindcss/postcss` |
| `eslint.config.mjs` | ESLint flat config (next core-web-vitals + typescript) |
| `vitest.config.ts` | Vitest with jsdom, react-swc plugin, v8 coverage (90%) |
| `components.json` | shadcn/ui config (aliases, style, RSC enabled) |
| `.husky/pre-commit` | Runs `bun run test` |
| `.husky/pre-push` | Runs `bun run test && bun run lint` |

### Design System (inherited from basalt)

The entire design token system lives in `src/app/globals.css`. No `tailwind.config.js` — Tailwind CSS v4 uses `@theme inline` blocks.

**3-Layer Background System:**
- **L0** (body): `--background` — light `220 14% 94%` / dark `0 0% 9%`
- **L1** (content panel): `--card` — light `220 14% 97%` / dark `0 0% 10.6%`
- **L2** (inner cards): `--secondary` — light `0 0% 100%` / dark `0 0% 12.2%`

**Primary Color:** Magenta `320 70% 55%` (light) / `320 70% 60%` (dark)

**Visualization Palette:** 24 sequential chart colors (`--chart-1` through `--chart-24`), with chart-1 = Magenta (primary). Accessed via `src/lib/palette.ts` constants.

**Heatmap Scales:** 4 color families (green, red, blue, orange) x 4 intensity levels each.

**Custom Radii:** `--radius-card: 14px`, `--radius-widget: 10px`, plus standard sm/md/lg.

**Typography:**
- Body: **Inter** (variable font via `next/font/google`)
- Display: **DM Sans** (weights 500/600/700, utility class `font-display`)

### Layout Architecture

`layout.tsx` (Server Component) -> `DashboardLayout` (Client) -> `LayoutInner` (Client)

- Root `layout.tsx` provides fonts, `SessionProvider`, `TooltipProvider`, and `Toaster` — it does **not** wrap with `DashboardLayout`.
- Route group `(dashboard)/layout.tsx` wraps children with `DashboardLayout` (sidebar + header).
- Route group `(auth)/` has no layout wrapper — standalone pages like login render without sidebar.
- `DashboardLayout` reads `usePathname()` and passes it as `key` to `LayoutInner`, causing React to remount and reset `mobileOpen` state on route change (avoids `setState` in `useEffect`).
- `LayoutInner` manages: sidebar collapsed state, mobile overlay, header with title + GitHub link + ThemeToggle.
- `AppSidebar` owns: collapsible nav groups, Cmd+K command palette search, user avatar footer.

### Component Patterns

- All interactive components use `"use client"` directive.
- State patterns use `useSyncExternalStore` where possible to comply with React 19 strict ESLint rules:
  - `useIsMobile` — external `matchMedia` listener
  - `ThemeToggle` — external `localStorage` + `matchMedia` store (via shared `use-theme` hook)
  - `Toaster` (sonner) — external store pattern
- Page components under `src/app/` are Server Components by default.

### Testing

- Test files are co-located: `*.test.ts` next to source files.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`).
- Coverage thresholds: 90% for statements, branches, functions, and lines.
- Current: 38 tests across 4 files (utils, palette, use-mobile, auth).

## Conventions

- **Imports**: Use `@/*` path alias (maps to `src/*`).
- **CSS Colors**: Always use CSS custom properties via `hsl(var(--token))`. Never hardcode color values in components.
- **Chart Colors**: Use `palette.ts` constants (`chart.primary`, `CHART_COLORS[i]`, `withAlpha("chart-1", 0.5)`). Never access CSS variables directly in JS for chart colors.
- **New shadcn/ui components**: Install via `bunx shadcn@latest add <component>`. Config in `components.json`.
- **New pages**: Create `src/app/<route>/page.tsx` (Server Component). Add route to `PAGE_TITLES` in `DashboardLayout.tsx` and `NAV_GROUPS` in `AppSidebar.tsx`.
  - **Dashboard pages** go under `src/app/(dashboard)/` — they get sidebar + header automatically.
  - **Standalone pages** (login, loading, etc.) go under `src/app/(auth)/` or a new route group — no sidebar wrapper.
- **Environment variables**: Secrets go in `.env.local` (gitignored). Template goes in `.env.example` (committed).

## Authentication

Uses **NextAuth.js v5** (Auth.js) with Google OAuth provider and email whitelist.

**Configuration** (`src/auth.ts`):
- Google provider with `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from env.
- `signIn` callback checks email against `AUTH_ALLOWED_EMAILS` whitelist.
- Non-whitelisted users see "Access Denied" on the login page (`?error=AccessDenied`).
- Custom pages: `signIn: "/login"`, `error: "/login"`.

**Route protection** (`src/middleware.ts`):
- All routes require authentication except: `/login`, `/api/auth/*`, `/_next`, `/favicon*`, `/logo/*`.
- Unauthenticated users are redirected to `/login?callbackUrl=<original-path>`.

**Session management**:
- `SessionProvider` wraps the entire app in root `layout.tsx`.
- Client components use `useSession()` from `next-auth/react` (e.g., `AppSidebar` for user info).
- Server components can use `auth()` from `@/auth` for server-side session checks.

**Whitelist utilities** (`src/lib/auth.ts`):
- `parseEmailWhitelist(raw)` — parses comma-separated string into normalized array.
- `isEmailAllowed(email, whitelist)` — checks email against whitelist (empty whitelist = allow all).

**Environment variables** (`.env.local`):
- `AUTH_GOOGLE_ID` — Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret
- `AUTH_SECRET` — NextAuth.js session encryption key
- `AUTH_URL` — Base URL (e.g., `http://localhost:7018`)
- `AUTH_ALLOWED_EMAILS` — Comma-separated whitelist of allowed Google emails

**Google OAuth callback URL**: `http://localhost:7018/api/auth/callback/google` (must be registered in Google Cloud Console).

## Logo System

Source images (`logo-light.png`, `logo-dark.png`) are 2048×2048 RGBA PNGs in the project root. **Never modify the originals** — run `python scripts/generate_logo.py` to regenerate all derived assets.

**Generated assets:**
- `public/logo/{light,dark}-{32,64,128,256}.png` — sized variants for `Logo` component
- `public/logo-loading-{light,dark}.png` — 256×256 for `LoadingScreen`
- `public/favicon.png` — 32×32 (light variant; favicon cannot auto-detect dark mode)

**Logo component** (`src/components/Logo.tsx`):
- Uses `next/image` with size presets: `sm` (32px), `md` (64px), `lg` (128px), `xl` (256px)
- Automatically selects light/dark variant via `useAppliedTheme()` from `use-theme` hook
- Used in: `AppSidebar` (sm), login page (lg), `LoadingScreen` (xl)

**Theme hook** (`src/hooks/use-theme.ts`):
- Shared store extracted from `ThemeToggle` to avoid duplication across `Logo`, `ThemeToggle`, and future consumers.
- Exports: `useTheme()` (returns current setting), `useAppliedTheme()` (resolves "system" to actual light/dark), `applyTheme()` (persists + applies), `emitThemeChange()` (notifies listeners).
- Built on `useSyncExternalStore` to comply with React 19 strict ESLint rules.

## Basalt Template Mapping

Pages ported from basalt templates (not written from scratch):

| Wooly Page | Basalt Template | Key Adaptations |
|---|---|---|
| `(auth)/login/page.tsx` | `BadgeLoginPage.tsx` | Badge card with barcode, Google sign-in, orbital secure-auth footer |
| `LoadingScreen.tsx` | `LoadingPage.tsx` | Full-screen circle with logo + orbital CSS spinner |

Basalt has 19 total routes (14 dashboard, 5 standalone). Wooly currently has 2 routes.

## Upstream Reference

The basalt template project at `/Users/nocoo/workspace/personal/basalt` is the source of truth for the design system. When porting new components or tokens from basalt, remember:

- basalt uses Vite + React Router; wooly uses Next.js App Router.
- Replace `useLocation` -> `usePathname`, `useNavigate` -> `useRouter`, `<Outlet>` -> `{children}`.
- Add `"use client"` to any component with hooks, event handlers, or browser APIs.
- basalt uses `@tailwindcss/vite`; wooly uses `@tailwindcss/postcss`.
- basalt's chart-1 was blue `217 91% 60%`; in wooly it is magenta `320 70% 55%` (swapped with chart-12).

## Retrospective

- **React 19 strict ESLint rules**: `eslint-config-next@16.1.6` enforces `react-hooks/set-state-in-effect` (no direct `setState` in `useEffect`) and `react-hooks/refs` (no ref access during render). This required rewriting `useIsMobile`, `ThemeToggle`, `Toaster`, and `DashboardLayout` to use `useSyncExternalStore` or key-based state reset patterns. Always use these patterns from the start when porting from basalt.
- **Tailwind CSS v4 has no `tailwind.config.js`**: All theming is done via CSS `@theme inline` blocks and CSS custom properties in `globals.css`. This is framework-agnostic and ports directly between Vite and Next.js.
- **Triple-slash reference in vitest config**: `/// <reference types="vitest" />` triggers `@typescript-eslint/triple-slash-reference` error. Removed it; Vitest works fine without it in the standalone config file.
- **`Record<string, unknown>` vs `object` in generic constraints**: TypeScript interfaces lack an implicit index signature, so `T extends Record<string, unknown>` rejects interface types like `UpdateBenefitInput`. Use `T extends object` instead when the function only needs to iterate keys (e.g., `stripUndefined`). Vitest runs in a more permissive mode and won't catch this — always run `next build` to verify strict TypeScript compilation.
