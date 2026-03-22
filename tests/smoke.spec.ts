import { expect, test } from "@playwright/test";

test("homepage has RealEstateHunter heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "RealEstateHunter" })).toBeVisible();
});
