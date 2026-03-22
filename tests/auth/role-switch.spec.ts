import { test, expect } from "@playwright/test";

// ACCT-06: Role switching
// Tests skip gracefully when Clerk testing token is unavailable.

test.describe("ACCT-06: Role switching", () => {
  test.beforeEach(() => {
    if (!process.env.CLERK_TESTING_TOKEN) {
      test.skip();
    }
  });

  test("buyer can switch to seller role and is redirected to seller dashboard", async ({
    page,
  }) => {
    // TODO: Use Clerk testing token to:
    // 1. Authenticate as a buyer-role user
    // 2. Navigate to /buyer/dashboard
    // 3. Click the "Switch to seller" button in RoleSwitcher
    // 4. Wait for role switch (setUserRole server action + user.reload())
    // 5. Verify redirect to /seller/dashboard
    //
    // Reference: https://clerk.com/docs/testing/playwright
    await page.goto("/buyer/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("seller can switch to buyer role and is redirected to buyer dashboard", async ({
    page,
  }) => {
    // TODO: Use Clerk testing token to:
    // 1. Authenticate as a seller-role user
    // 2. Navigate to /seller/dashboard
    // 3. Click the "Switch to buyer" button in RoleSwitcher
    // 4. Wait for role switch (setUserRole server action + user.reload())
    // 5. Verify redirect to /buyer/dashboard
    await page.goto("/seller/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
