import Link from "next/link";
import { SavingsCalculator } from "@/components/calculator/savings-calculator";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-12 px-4 py-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">RealEstateHunter</h1>
        <p className="max-w-md text-center text-lg text-muted-foreground">
          AI-powered real estate transactions. Save thousands on commissions with 24/7 guidance from
          listing to closing.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-input px-6 py-2 text-sm font-medium hover:bg-accent"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Cost-benefit calculator */}
      <section className="flex w-full flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">See How Much You Could Save</h2>
        <p className="max-w-md text-center text-muted-foreground">
          Enter your home price and state to see a side-by-side breakdown of what you&apos;d pay
          with a traditional agent vs. RealEstateHunter.
        </p>
        <SavingsCalculator />
      </section>
    </main>
  );
}
