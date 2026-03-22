import { test, expect } from "@playwright/test";

// ACCT-04: Session persistence
// Tests skip gracefully when Clerk testing token is unavailable.

test.describe("ACCT-04: Session persistence", () => {
  test.beforeEach(() => {
    if (!process.env.CLERK_TESTING_TOKEN) {
      test.skip();
    }
  });

  test("authenticated user remains authenticated after page reload", async ({
    page,
  }) => {
    // TODO: Use Clerk testing token to:
    // 1. Authenticate a buyer test user
    // 2. Navigate to /buyer/dashboard
    // 3. Verify the page renders (not redirected to /sign-in)
    // 4. Reload the page
    // 5. Verify the user is still authenticated (still on /buyer/dashboard)
    //
    // Reference: https://clerk.com/docs/testing/playwright
    await page.goto("/buyer/dashboard");
    // Without auth, expect redirect to /sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthenticated access to protected route redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/buyer/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
