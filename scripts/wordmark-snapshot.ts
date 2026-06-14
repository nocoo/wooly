// One-off: render the wordmark candidates HTML and capture light/dark
// composite shots for the audit doc.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  const filePath = path.resolve("docs/visual/3.1-wordmark/wordmark-candidates.html");
  const fileUrl = `file://${filePath}`;
  const outDir = path.resolve("docs/visual/3.1-wordmark");
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext({
        viewport: { width: 1680, height: 900 },
        colorScheme: theme,
      });
      const page = await context.newPage();
      await page.goto(fileUrl, { waitUntil: "load" });
      // Wait for web fonts so wordmark renders with the chosen face.
      await page.evaluate(async () => {
        if ("fonts" in document) await document.fonts.ready;
      });
      if (theme === "dark") {
        // Toggle body background to a dark scene so the dark swatches don't sit
        // on a glaring light page; the swatches themselves already carry their
        // own tokens, so the body just provides ambient surround.
        await page.evaluate(() => {
          document.body.style.background = "hsl(0 0% 6%)";
          document.body.style.color = "hsl(0 0% 90%)";
        });
      }
      await page.screenshot({
        path: path.join(outDir, `wordmark-candidates__${theme}.png`),
        fullPage: true,
      });
      console.log(`✓ wordmark-candidates__${theme}.png`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
