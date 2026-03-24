"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useSession } from "@clerk/nextjs";
import { setUserRole } from "@/lib/auth";
import type { UserRole } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<UserRole | null>(null);

  if (!isLoaded || !user) return null;

  async function handleRoleSelect(role: UserRole) {
    setIsLoading(role);
    try {
      await setUserRole(user!.id, role);
      await user!.reload();
      // Force Clerk to refresh the JWT so middleware sees the new role
      if (session) {
        await session.getToken({ skipCache: true });
      }
      router.push(role === "buyer" ? "/buyer/dashboard" : "/seller/dashboard");
    } catch (error) {
      console.error("Failed to set role:", error);
      setIsLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to RealEstateHunter</h1>
          <p className="mt-2 text-gray-500">
            Tell us how you plan to use the platform so we can personalize your experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="text-xl">I&apos;m a Buyer</CardTitle>
              <CardDescription>
                Search for properties, save favorites, and manage your purchase journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-6">
                <li>Browse MLS listings</li>
                <li>Save searches and favorites</li>
                <li>AI-powered offer guidance</li>
                <li>Transaction management</li>
              </ul>
              <Button
                className="w-full"
                onClick={() => handleRoleSelect("buyer")}
                disabled={isLoading !== null}
              >
                {isLoading === "buyer" ? "Setting up..." : "Get Started as Buyer"}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="text-xl">I&apos;m a Seller</CardTitle>
              <CardDescription>
                List your property, manage offers, and close deals without a traditional agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-6">
                <li>Flat-fee MLS listing</li>
                <li>AI-powered pricing guidance</li>
                <li>Offer management tools</li>
                <li>Save thousands in commissions</li>
              </ul>
              <Button
                className="w-full"
                onClick={() => handleRoleSelect("seller")}
                disabled={isLoading !== null}
              >
                {isLoading === "seller" ? "Setting up..." : "Get Started as Seller"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
