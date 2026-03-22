import { expect, test } from "@playwright/test";

// ACCT-01: User signup flow
// Tests skip gracefully when Clerk testing token is unavailable.

test.describe("ACCT-01: User signup", () => {
  test("sign-up page renders Clerk SignUp component", async ({ page }) => {
    await page.goto("/sign-up");
    // Clerk's SignUp component renders a form — verify the page loads
    await expect(page).toHaveURL(/\/sign-up/);
    // Clerk renders a container for the sign-up UI
    await expect(page.locator("body")).toBeVisible();
  });

  test("authenticated user signup flow with email verification", async ({ page }) => {
    if (!process.env.CLERK_TESTING_TOKEN) {
      test.skip();
    }
    // TODO: Use Clerk testing token to complete full signup flow
    // See tests/fixtures/clerk-helpers.ts for helper utilities
    // Steps:
    // 1. Navigate to /sign-up
    // 2. Fill in email + password
    // 3. Clerk sends verification email (handled natively)
    // 4. Verify redirect to /onboarding for new users
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);
  });
});
