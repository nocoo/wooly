#!/usr/bin/env bun
// Visual snapshot scaffold — drives Playwright to capture a screenshot matrix
// for one design change. See docs/07-ui-design-audit.md §3.5 for the full
// contract (waitUntil/selector rules, mock mode, dev-only env, etc.).
//
// Usage:
//   bun scripts/visual-snapshot.ts \
//     --change 1.1 \
//     --pages dashboard,sources \
//     --states normal,empty,loading \
//     --phase after
//
// Defaults:
//   --pages   dashboard
//   --states  normal
//   --phase   after  (use "before" for the baseline pre-change capture)
//
// Required pre-conditions:
//   - dev server already running on http://localhost:7014 with
//       WOOLY_VISUAL_BYPASS_AUTH=true WOOLY_USE_MOCK=true bun run dev:site
//   - target pages render a [data-visual-state] attribute on their root
//     (see docs §3.5.3 + stage 1.0)

import { chromium, type Browser } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// CLI parsing — keep dependency-free (no commander/yargs)
// ---------------------------------------------------------------------------

type Phase = "before" | "after";
type State = "normal" | "empty" | "loading";

interface Args {
  change: string;
  pages: string[];
  states: State[];
  phase: Phase;
  baseUrl: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };

  const change = get("--change");
  if (!change) {
    console.error("Missing --change <id> (e.g. --change 1.1)");
    process.exit(1);
  }

  const pages = (get("--pages") ?? "dashboard")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const validStates: State[] = ["normal", "empty", "loading"];
  const states = (get("--states") ?? "normal")
    .split(",")
    .map((s) => s.trim() as State)
    .filter((s): s is State => validStates.includes(s));

  const phase = (get("--phase") ?? "after") as Phase;
  if (phase !== "before" && phase !== "after") {
    console.error(`Invalid --phase ${phase} (must be "before" or "after")`);
    process.exit(1);
  }

  return {
    change,
    pages,
    states,
    phase,
    baseUrl: get("--base-url") ?? "http://localhost:7014",
  };
}

// ---------------------------------------------------------------------------
// Matrix constants
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const THEMES = ["light", "dark"] as const;

const PAGE_PATHS: Record<string, string> = {
  dashboard: "/",
  sources: "/sources",
  tracker: "/tracker",
  settings: "/settings",
};

// ---------------------------------------------------------------------------
// Per-state wait strategy — table from docs §3.5.3
// ---------------------------------------------------------------------------

interface WaitStrategy {
  waitUntil: "load" | "domcontentloaded";
  selector: string;
}

function waitStrategyFor(state: State): WaitStrategy {
  if (state === "loading") {
    return {
      waitUntil: "domcontentloaded",
      selector: '[data-visual-state="loading"]',
    };
  }
  return {
    waitUntil: "load",
    selector: `[data-visual-state="${state}"]`,
  };
}

// ---------------------------------------------------------------------------
// Single shot
// ---------------------------------------------------------------------------

async function captureOne(
  browser: Browser,
  args: Args,
  pageName: string,
  viewport: (typeof VIEWPORTS)[number],
  theme: (typeof THEMES)[number],
  state: State,
): Promise<void> {
  const pagePath = PAGE_PATHS[pageName];
  if (!pagePath) {
    throw new Error(`Unknown page "${pageName}"; add it to PAGE_PATHS`);
  }

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });

  // Seed theme via localStorage BEFORE the page loads so the inline FOUC-prevention
  // script in src/app/layout.tsx picks the right class on first paint.
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {
      // ignore — incognito etc
    }
  }, theme);

  const page = await context.newPage();

  const url = `${args.baseUrl}${pagePath}?_visual=${state}`;
  const { waitUntil, selector } = waitStrategyFor(state);

  try {
    await page.goto(url, { waitUntil, timeout: 15_000 });
    await page.waitForSelector(selector, { timeout: 10_000 });
  } catch (err) {
    console.error(
      `[${args.change}] ${pageName} ${viewport.name} ${theme} ${state} — failed waiting for ${selector}: ${(err as Error).message}`,
    );
    await context.close();
    throw err;
  }

  const outDir = path.resolve(
    "docs",
    "visual",
    args.change,
    args.phase,
  );
  await mkdir(outDir, { recursive: true });

  const filename = `${args.change}__${pageName}__${viewport.name}__${theme}__${state}.png`;
  const outPath = path.join(outDir, filename);
  await page.screenshot({ path: outPath, fullPage: true });

  console.log(`✓ ${filename}`);

  await context.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs();
  console.log(
    `▸ change=${args.change} phase=${args.phase} pages=[${args.pages.join(",")}] states=[${args.states.join(",")}]`,
  );
  console.log(
    `▸ matrix: ${args.pages.length} pages × ${VIEWPORTS.length} viewports × ${THEMES.length} themes × ${args.states.length} states = ${args.pages.length * VIEWPORTS.length * THEMES.length * args.states.length} shots`,
  );

  // Sanity-check that the dev server is reachable before opening Chromium.
  try {
    const probe = await fetch(`${args.baseUrl}/api/data`, { method: "HEAD" });
    if (probe.status === 503) {
      console.error(
        `Dev server returned 503 — mock mode not enabled. Restart with:\n  WOOLY_VISUAL_BYPASS_AUTH=true WOOLY_USE_MOCK=true bun run dev:site`,
      );
      process.exit(1);
    }
  } catch {
    console.error(`Dev server not reachable at ${args.baseUrl}. Start it first.`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  try {
    for (const pageName of args.pages) {
      for (const viewport of VIEWPORTS) {
        for (const theme of THEMES) {
          for (const state of args.states) {
            await captureOne(browser, args, pageName, viewport, theme, state);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
