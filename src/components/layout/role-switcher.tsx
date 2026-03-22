"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setUserRole } from "@/lib/auth";
import type { UserRole } from "@/types";

export function RoleSwitcher() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoaded || !user) return null;

  const currentRole = user.publicMetadata?.role as UserRole | undefined;
  const targetRole: UserRole = currentRole === "buyer" ? "seller" : "buyer";
  const targetPath = targetRole === "buyer" ? "/buyer/dashboard" : "/seller/dashboard";

  async function switchRole() {
    setIsLoading(true);
    try {
      await setUserRole(user!.id, targetRole);
      // Force immediate session refresh — avoids 60s stale token window
      await user!.reload();
      router.push(targetPath);
    } catch (error) {
      console.error("Failed to switch role:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">
        Role: <span className="font-medium capitalize text-gray-800">{currentRole ?? "none"}</span>
      </span>
      <Button variant="outline" size="sm" onClick={switchRole} disabled={isLoading}>
        {isLoading ? "Switching..." : `Switch to ${targetRole}`}
      </Button>
    </div>
  );
}
