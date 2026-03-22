"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import type { UserRole } from "@/types";

/**
 * Sets the user's role in Clerk's publicMetadata.
 * Role is available in sessionClaims via the JWT template (see middleware.ts).
 * Verifies the caller is the target user to prevent role escalation.
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const { userId: callerUserId } = await auth();
  if (!callerUserId || callerUserId !== userId) {
    throw new Error("Unauthorized: caller does not match target user");
  }

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  });
}
