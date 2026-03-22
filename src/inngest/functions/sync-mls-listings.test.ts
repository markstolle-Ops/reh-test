import { describe, it, expect, vi } from "vitest";

// ─── Mock mls-client ──────────────────────────────────────────────────────────
// vi.mock factory cannot reference outer variables (hoisting).
// Use vi.fn() inline and retrieve via vi.mocked() after import.

vi.mock("@/services/search/mls-client", () => ({
  syncMlsListings: vi.fn().mockResolvedValue(undefined),
}));

import { syncMlsListingsRaw } from "./sync-mls-listings";
import { syncMlsListings } from "@/services/search/mls-client";

describe("syncMlsListingsRaw (Inngest raw function)", () => {
  it("calls syncMlsListings from mls-client", async () => {
    await syncMlsListingsRaw();
    expect(vi.mocked(syncMlsListings)).toHaveBeenCalledOnce();
  });
});
