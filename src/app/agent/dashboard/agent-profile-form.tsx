"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LAUNCH_STATES = ["CA", "TX", "FL", "NY", "GA", "NC", "AZ", "OH", "PA", "IL"];

export function AgentProfileForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    licenseNumber: "",
    licenseStates: [] as string[],
  });

  function toggleState(state: string) {
    setForm((prev) => ({
      ...prev,
      licenseStates: prev.licenseStates.includes(state)
        ? prev.licenseStates.filter((s) => s !== state)
        : [...prev.licenseStates, state],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.licenseStates.length === 0) {
      setError("Select at least one licensed state.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create profile. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 text-left space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
        <input
          type="text"
          required
          value={form.licenseNumber}
          onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. DRE123456"
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Licensed States</p>
        <div className="flex flex-wrap gap-2">
          {LAUNCH_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors ${
                form.licenseStates.includes(state)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Creating Profile..." : "Create Agent Profile"}
      </button>
    </form>
  );
}
