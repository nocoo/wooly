import { expect, test, type Locator } from "@playwright/test";

async function paintedWidth(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    let left = rect.left;
    let right = rect.right;
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === "none" || style.visibility === "hidden") return 0;
      if (["hidden", "clip", "auto", "scroll"].includes(style.overflowX)) {
        const clip = ancestor.getBoundingClientRect();
        left = Math.max(left, clip.left);
        right = Math.min(right, clip.right);
      }
    }
    return Math.max(0, right - left);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`sidebar geometry and collapsed identity in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto("/sources");
    const sidebar = page.locator('[data-basalt-sidebar][aria-label="主导航"]');
    const user = sidebar.locator('[data-slot="sidebar-user"]');
    const name = sidebar.locator('[data-slot="sidebar-brand-name"]');
    const version = sidebar.locator('[data-slot="sidebar-brand-version"]');
    const copy = sidebar.locator('[data-slot="sidebar-brand-copy"]');
    await expect(user.getByText("test@example.test", { exact: true })).toBeVisible();
    await expect(name).toHaveText("wooly");
    await expect(version).toHaveText(/^v\d+\.\d+\.\d+$/);
    expect(await paintedWidth(name)).toBeGreaterThan(0);
    expect(await paintedWidth(version)).toBeGreaterThan(0);
    const avatar = user.locator("span.relative").first();
    const expanded = await avatar.boundingBox();
    const emailLineHeight = await user.getByText("test@example.test", { exact: true }).evaluate(
      (element) => getComputedStyle(element).lineHeight,
    );
    expect((await sidebar.boundingBox())?.width).toBe(260);
    expect(expanded?.width).toBe(36);
    expect(expanded?.height).toBe(36);
    expect(emailLineHeight).toBe("16px");
    await page.getByRole("button", { name: "收起侧边栏", exact: true }).click();
    await page.mouse.move(1000, 400);
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(68);
    const collapsed = await avatar.boundingBox();
    expect(collapsed?.width).toBe(36);
    expect(collapsed?.height).toBe(36);
    expect(collapsed?.y).toBe(expanded?.y);
    await expect(copy).toHaveCSS("overflow-x", "hidden");
    expect((await copy.boundingBox())?.width).toBe(0);
    expect(await paintedWidth(name)).toBe(0);
    expect(await paintedWidth(version)).toBe(0);
    await page.getByRole("button", { name: "展开侧边栏", exact: true }).click();
    await page.mouse.move(1000, 400);
    await expect.poll(() => paintedWidth(name)).toBeGreaterThan(0);
    await expect.poll(() => paintedWidth(version)).toBeGreaterThan(0);
    console.log(JSON.stringify({ theme, expanded, collapsed, emailLineHeight, brandClipped: true }));
  });

  for (const width of [390, 640]) {
    test(`mobile SidebarDrawer geometry and one Escape in ${theme} mode at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await page.goto("/sources");
      const opener = page.getByRole("button", { name: "打开导航菜单", exact: true, includeHidden: true });
      const main = await page.locator("[data-basalt-main]").elementHandle();
      await opener.click();
      const drawer = page.locator('[data-slot="sidebar-drawer"]');
      await expect(drawer).toBeVisible();
      const geometry = await drawer.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          width: element.getBoundingClientRect().width,
          innerWidth: element.querySelector("[data-basalt-sidebar]")?.getBoundingClientRect().width,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
        };
      });
      expect(geometry).toEqual({ width: 320, innerWidth: 260, paddingLeft: "0px", paddingRight: "0px" });
      await expect(drawer.getByRole("button", { name: "关闭导航菜单", exact: true })).toBeVisible();
      await expect(opener).toHaveAttribute("aria-controls", await drawer.getAttribute("id") ?? "");
      await expect.poll(() => paintedWidth(drawer.locator('[data-slot="sidebar-brand-name"]'))).toBeGreaterThan(0);
      await expect.poll(() => paintedWidth(drawer.locator('[data-slot="sidebar-brand-version"]'))).toBeGreaterThan(0);
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await opener.click();
      await drawer.locator('a[href="/settings"]').click();
      await expect(page).toHaveURL(/\/settings$/);
      await expect(drawer).toHaveCount(0);
      await expect(opener).toBeFocused();
      expect(await main?.evaluate((element) => element.isConnected)).toBe(true);
      console.log(JSON.stringify({ theme, viewport: width, drawer: geometry, firstEscape: true, routeClose: true }));
    });
  }
}
