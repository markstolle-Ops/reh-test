import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Clerk E2E testing helpers.
 *
 * Usage:
 * 1. Set CLERK_TESTING_TOKEN in your .env.local or CI environment.
 * 2. Call clerkSetup() in your globalSetup (see playwright.config.ts).
 * 3. Use setupClerkTestingToken({ page }) before navigating to protected routes.
 *
 * See: https://clerk.com/docs/testing/playwright
 */

export { clerkSetup };

/**
 * Returns true if Clerk testing token is available in the environment.
 * Use this to conditionally skip tests that require Clerk test sessions.
 */
export function hasClerkTestingToken(): boolean {
  return Boolean(process.env.CLERK_TESTING_TOKEN);
}

/**
 * Common test user credentials for Clerk test mode.
 * These are only valid in test environments with CLERK_TESTING_TOKEN set.
 */
export const TEST_USERS = {
  buyer: {
    email: process.env.TEST_BUYER_EMAIL ?? "test-buyer@example.com",
    password: process.env.TEST_BUYER_PASSWORD ?? "test-password-buyer",
  },
  seller: {
    email: process.env.TEST_SELLER_EMAIL ?? "test-seller@example.com",
    password: process.env.TEST_SELLER_PASSWORD ?? "test-password-seller",
  },
} as const;
