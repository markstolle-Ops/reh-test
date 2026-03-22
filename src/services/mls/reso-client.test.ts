import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchResoListings, fetchResoDelta } from "./reso-client";
import type { ResoBoardConfig } from "./reso-client";

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const testBoard: ResoBoardConfig = {
  boardId: "test-board",
  apiUrl: "https://api.example.com/reso",
  apiToken: "test-token-abc",
  name: "Test MLS",
};

function makeResoResponse(
  value: object[],
  nextLink?: string
): Response {
  return {
    ok: true,
    json: async () => ({
      value,
      "@odata.nextLink": nextLink,
    }),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── fetchResoListings tests ──────────────────────────────────────────────────

describe("fetchResoListings", () => {
  it("sends Authorization Bearer token header", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    await fetchResoListings(testBoard);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-token-abc"
    );
  });

  it("calls /Property endpoint on the board apiUrl", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    await fetchResoListings(testBoard);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://api.example.com/reso/Property");
  });

  it("includes $expand=Media in default query", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    await fetchResoListings(testBoard);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("expand=Media");
  });

  it("passes custom $filter param when provided", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    await fetchResoListings(testBoard, { filter: "ListPrice gt 100000" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("ListPrice+gt+100000");
  });

  it("returns array of property objects from response value", async () => {
    const listing = { ListingKey: "L1", ListPrice: 300000 };
    mockFetch.mockResolvedValueOnce(makeResoResponse([listing]));

    const result = await fetchResoListings(testBoard);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ ListingKey: "L1" });
  });

  it("follows @odata.nextLink for pagination", async () => {
    const page1 = [{ ListingKey: "L1" }];
    const page2 = [{ ListingKey: "L2" }];

    mockFetch
      .mockResolvedValueOnce(
        makeResoResponse(page1, "https://api.example.com/reso/Property?$skip=100")
      )
      .mockResolvedValueOnce(makeResoResponse(page2));

    const result = await fetchResoListings(testBoard);

    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // second call should use the nextLink URL directly
    const [secondUrl] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(secondUrl).toBe("https://api.example.com/reso/Property?$skip=100");
  });

  it("caps pagination at 10 pages to prevent runaway fetches", async () => {
    // Mock always returns a nextLink — should stop at 10 pages
    const page = [{ ListingKey: "L1" }];
    for (let i = 0; i < 11; i++) {
      mockFetch.mockResolvedValueOnce(
        makeResoResponse(page, "https://api.example.com/reso/Property?$skip=" + (i + 1) * 100)
      );
    }

    const result = await fetchResoListings(testBoard);

    expect(mockFetch).toHaveBeenCalledTimes(10);
    expect(result).toHaveLength(10);
  });

  it("throws on non-ok HTTP response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as unknown as Response);

    await expect(fetchResoListings(testBoard)).rejects.toThrow("401");
  });
});

// ─── fetchResoDelta tests ─────────────────────────────────────────────────────

describe("fetchResoDelta", () => {
  it("includes ModificationTimestamp filter in query", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    const since = new Date("2025-01-01T00:00:00.000Z");
    await fetchResoDelta(testBoard, since);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("ModificationTimestamp");
    expect(url).toContain("2025-01-01T00%3A00%3A00.000Z");
  });

  it("uses 'gt' operator in ModificationTimestamp filter", async () => {
    mockFetch.mockResolvedValueOnce(makeResoResponse([]));

    const since = new Date("2025-06-15T12:00:00.000Z");
    await fetchResoDelta(testBoard, since);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    // filter should be ModificationTimestamp gt <isoString>
    expect(url).toMatch(/ModificationTimestamp.*gt/);
  });

  it("returns listings modified after the since date", async () => {
    const listing = { ListingKey: "L99", ListPrice: 500000 };
    mockFetch.mockResolvedValueOnce(makeResoResponse([listing]));

    const result = await fetchResoDelta(testBoard, new Date("2025-01-01T00:00:00.000Z"));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ ListingKey: "L99" });
  });
});
