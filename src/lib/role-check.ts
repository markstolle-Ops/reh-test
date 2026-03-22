import type { UserRole } from "@/types";

/**
 * Returns the dashboard path for a given role.
 * Redirects to /onboarding for undefined or unknown roles.
 */
export function getUserDashboardPath(role: string | undefined): string {
  if (role === "buyer") return "/buyer/dashboard";
  if (role === "seller") return "/seller/dashboard";
  return "/onboarding";
}

/**
 * Type guard: returns true if the value is a valid UserRole.
 */
export function isValidRole(role: unknown): role is UserRole {
  return role === "buyer" || role === "seller";
}
