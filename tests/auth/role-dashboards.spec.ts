import { expect, test } from "@playwright/test";

// ACCT-05: Role-specific dashboards
// Requires CLERK_TESTING_TOKEN for authenticated test sessions.
// Tests skip gracefully when Clerk testing token is unavailable.

test.describe("ACCT-05: Role-specific dashboards", () => {
  test.beforeEach(() => {
    if (!process.env.CLERK_TESTING_TOKEN) {
      test.skip();
    }
  });

  test("buyer-role user sees /buyer/dashboard", async ({ page }) => {
    // TODO: Use Clerk testing token to authenticate as a buyer-role user
    // See tests/fixtures/clerk-helpers.ts for helper utilities
    await page.goto("/buyer/dashboard");
    await expect(page.getByRole("heading", { name: "Buyer Dashboard" })).toBeVisible();
  });

  test("seller-role user sees /seller/dashboard", async ({ page }) => {
    // TODO: Use Clerk testing token to authenticate as a seller-role user
    await page.goto("/seller/dashboard");
    await expect(page.getByRole("heading", { name: "Seller Dashboard" })).toBeVisible();
  });

  test("unauthenticated user accessing /buyer/* is redirected to /sign-in", async ({ page }) => {
    await page.goto("/buyer/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthenticated user accessing /seller/* is redirected to /sign-in", async ({ page }) => {
    await page.goto("/seller/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
