import { currentUser } from "@clerk/nextjs/server";
import { RoleSwitcher } from "@/components/layout/role-switcher";

export default async function SellerDashboardPage() {
  const user = await currentUser();

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.emailAddresses?.[0]?.emailAddress ?? "Seller");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="mt-1 text-gray-500">Welcome back, {displayName}</p>
        </div>
        <RoleSwitcher />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Listings */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Listings</h2>
          <p className="text-sm text-gray-500">
            No active listings yet. Create your first property listing to get started.
          </p>
        </div>

        {/* Transaction History */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h2>
          <p className="text-sm text-gray-500">
            No completed transactions yet. Your closed deals will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
