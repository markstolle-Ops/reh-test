import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock env vars ────────────────────────────────────────────────────────────
vi.stubEnv("SIMPLYRETS_API_KEY", "test-key");
vi.stubEnv("SIMPLYRETS_API_SECRET", "test-secret");

// ─── Mock DB upsert ───────────────────────────────────────────────────────────
const mockConflictTarget = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockResolvedValue([]);
const mockOnConflictDoUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockValues = vi.fn().mockReturnValue({
  onConflictDoUpdate: mockOnConflictDoUpdate,
});
const mockInsertInto = vi.fn().mockReturnValue({ values: mockValues });
vi.mock("@/db", () => ({
  db: { insert: mockInsertInto },
}));

// ─── SimplyRETS sample response ───────────────────────────────────────────────
const simplyRetsResponse = [
  {
    mlsId: "TX1234567",
    listPrice: 450000,
    address: {
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      full: "100 Oak St, Austin, TX 78701",
    },
    property: {
      bedrooms: 3,
      bathsFull: 2,
      area: 1800,
      type: "Residential",
    },
    geo: { lat: 30.2672, lng: -97.7431 },
    photos: ["https://cdn.example.com/1.jpg", "https://cdn.example.com/2.jpg"],
    mls: { status: "Active" },
  },
];

describe("fetchSimplyRetsListings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => simplyRetsResponse,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls SimplyRETS API with correct base URL", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    await fetchSimplyRetsListings({});
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("api.simplyrets.com/properties");
  });

  it("includes Basic auth header with encoded credentials", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    await fetchSimplyRetsListings({});
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = fetchCall[1] as RequestInit;
    const authHeader = (options.headers as Record<string, string>)["Authorization"];
    // Basic base64("test-key:test-secret")
    const expected = "Basic " + btoa("test-key:test-secret");
    expect(authHeader).toBe(expected);
  });

  it("appends status=Active to query params", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    await fetchSimplyRetsListings({});
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("status=Active");
  });

  it("appends q param when city provided", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    await fetchSimplyRetsListings({ q: "Austin" });
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("q=Austin");
  });

  it("appends minprice and maxprice when provided", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    await fetchSimplyRetsListings({ minPrice: 200000, maxPrice: 500000 });
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("minprice=200000");
    expect(url).toContain("maxprice=500000");
  });

  it("returns parsed JSON response", async () => {
    const { fetchSimplyRetsListings } = await import("./mls-client");
    const result = await fetchSimplyRetsListings({});
    expect(result).toHaveLength(1);
    expect(result[0].mlsId).toBe("TX1234567");
  });
});

describe("syncMlsListings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => simplyRetsResponse,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => [], // second page empty → stop
        }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("upserts fetched records into mlsListings table shape", async () => {
    const { syncMlsListings } = await import("./mls-client");
    await syncMlsListings();
    // db.insert should have been called
    expect(mockInsertInto).toHaveBeenCalled();
    // values should have been called with an array of records
    expect(mockValues).toHaveBeenCalled();
    const inserted = mockValues.mock.calls[0][0];
    expect(Array.isArray(inserted)).toBe(true);
    expect(inserted[0].id).toBe("TX1234567");
    expect(inserted[0].mlsSource).toBe("simplyrets");
  });
});
