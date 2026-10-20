import { expect, test } from "@playwright/test";

test("navigation retains the shell and collapsed sidebar", async ({ page }) => {
  let documents = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents += 1;
  });
  await page.goto("/sources");
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  const main = await page.locator("[data-basalt-main]").elementHandle();
  const header = await page.locator("[data-basalt-header]").elementHandle();
  const island = await page.locator("[data-basalt-island]").elementHandle();
  const sidebar = await page.locator("[data-basalt-sidebar]").elementHandle();
  const initialDocuments = documents;

  let release = () => {};
  const ready = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/src/pages/SettingsPage.tsx*", async (route) => {
    await ready;
    await route.continue();
  });
  const requested = page.waitForRequest("**/src/pages/SettingsPage.tsx*");
  try {
    await page.getByRole("button", { name: "设置", exact: true }).click();
    await requested;
    await expect(page.locator("[data-basalt-header]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { name: "设置", exact: true, level: 1 }).last()).toBeVisible();

  for (const title of ["核销台", "权益账户", "仪表盘"]) {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/sources$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);

  for (const node of [main, header, island, sidebar]) {
    expect(await node?.evaluate((element) => element.isConnected)).toBe(true);
    expect(await node?.isVisible()).toBe(true);
  }
  expect(documents).toBe(initialDocuments);
});

test("mobile navigation closes the drawer without replacing the shell", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sources");
  const opener = page.getByRole("button", { name: "打开导航菜单", exact: true });
  await expect(opener).toBeVisible();
  const main = await page.locator("[data-basalt-main]").elementHandle();
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "导航菜单" });
  await drawer.getByRole("button", { name: "设置", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await main?.evaluate((element) => element.isConnected)).toBe(true);
  expect(await main?.isVisible()).toBe(true);
});
