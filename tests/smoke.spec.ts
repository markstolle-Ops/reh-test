import { test, expect } from "@playwright/test";

test("homepage has REH heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "REH" })).toBeVisible();
});
