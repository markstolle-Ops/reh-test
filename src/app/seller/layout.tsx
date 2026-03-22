import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/layout/nav";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;

  if (role !== "seller") {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main>{children}</main>
    </div>
  );
}
