import { expect, test, type Locator, type Page } from "@playwright/test";

const SIDEBAR_NAV_HREF: Record<string, string> = {
  仪表盘: "/",
  权益账户: "/sources",
  核销台: "/tracker",
  设置: "/settings",
};

async function clickSidebarNav(page: Page, label: keyof typeof SIDEBAR_NAV_HREF, root?: Locator) {
  const href = SIDEBAR_NAV_HREF[label];
  const scope = root ?? page.locator("[data-basalt-sidebar]");
  await scope.locator(`a[href="${href}"]`).click();
}

test("navigation retains the shell and collapsed sidebar", async ({ page }) => {
  let documents = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents += 1;
  });
  await page.goto("/sources");
  await page.getByRole("button", { name: "收起侧边栏", exact: true }).click();
  const main = await page.locator("[data-basalt-main]").elementHandle();
  const header = await page.locator("[data-basalt-header]").elementHandle();
  const island = await page.locator("[data-basalt-island]").elementHandle();
  const sidebar = await page.locator("[data-basalt-sidebar]").elementHandle();
  const initialDocuments = documents;

  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/pages/SettingsPage.tsx*", async (route) => {
    await ready;
    await route.continue();
  });
  const requested = page.waitForRequest("**/src/pages/SettingsPage.tsx*");
  try {
    await clickSidebarNav(page, "设置");
    await requested;
    await expect(page.locator("[data-basalt-header]")).toBeVisible();
    await expect(page.getByRole("button", { name: "展开侧边栏", exact: true })).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { name: "设置", exact: true, level: 1 }).last()).toBeVisible();

  for (const title of ["核销台", "权益账户", "仪表盘"] as const) {
    await clickSidebarNav(page, title);
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "展开侧边栏", exact: true })).toBeVisible();
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
  await clickSidebarNav(page, "设置", drawer);
  await expect(page).toHaveURL(/\/settings$/);
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await main?.evaluate((element) => element.isConnected)).toBe(true);
  expect(await main?.isVisible()).toBe(true);
});

test("mobile drawer closes from the brand dismiss control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "打开导航菜单", exact: true });
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "导航菜单" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "关闭导航菜单", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});
