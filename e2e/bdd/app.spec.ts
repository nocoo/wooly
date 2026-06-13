import { test, expect } from "@playwright/test";

test.describe("App — BDD Smoke", () => {
  test("Given the app is running, When I visit the login page, Then I see the welcome badge", async ({ page }) => {
    // Given: app is running (webServer handles this)

    // When: visit the public login page
    await page.goto("/login");

    // Then: page loads with the expected title and the welcome badge is visible
    await expect(page).toHaveTitle(/wooly/i, { timeout: 15_000 });
    await expect(page.getByText("Welcome")).toBeVisible();
  });
});
