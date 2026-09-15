import { test, expect } from "@playwright/test";

test("public landing page renders its main conversion sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("أحمد فرحان");
  await expect(page.locator("#contact")).toBeVisible();
});

test("login page is available without an authenticated session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toContainText("تسجيل الدخول");
});
