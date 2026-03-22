import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export async function Nav() {
  const { userId } = await auth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold text-gray-900">
        RealEstateHunter
      </Link>

      <div className="flex items-center gap-4">
        {userId ? (
          <UserButton />
        ) : (
          <>
            <SignInButton mode="redirect">
              <button
                type="button"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button
                type="button"
                className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign Up
              </button>
            </SignUpButton>
          </>
        )}
      </div>
    </nav>
  );
}
