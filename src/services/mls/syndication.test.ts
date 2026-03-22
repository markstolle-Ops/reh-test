import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock Resend ──────────────────────────────────────────────────────────────

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue({ data: { id: "resend-msg-id-123" }, error: null }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockSendEmail,
    },
  })),
}));

// ─── Mock DB ──────────────────────────────────────────────────────────────────

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/db", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  },
}));

vi.mock("@/db/schema", () => ({
  mlsSyndications: {},
}));

// ─── submitToMls tests ────────────────────────────────────────────────────────

describe("submitToMls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ data: { id: "resend-msg-id-123" }, error: null });
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockResolvedValue([]),
      }),
    });
  });

  it("sends a structured HTML email with listing details", async () => {
    const { submitToMls } = await import("./syndication");

    const request = {
      listingId: "listing-abc",
      sellerUserId: "user-xyz",
      mlsRegion: "CA-LA",
      address: "123 Main St, Los Angeles, CA 90001",
      price: 75000000, // cents
      bedrooms: 3,
      bathrooms: "2.0",
      sqft: 1500,
      lotSizeSqft: 4000,
      propertyType: "single_family" as const,
      description: "A lovely home",
      photoUrls: ["https://cdn.example.com/photo1.jpg"],
      sellerEmail: "seller@example.com",
      sellerName: "Jane Seller",
    };

    await submitToMls(request);

    expect(mockSendEmail).toHaveBeenCalledOnce();
    const callArgs = mockSendEmail.mock.calls[0][0];
    // Subject should mention the address
    expect(callArgs.subject).toContain("MLS Submission");
    // HTML body should include listing details
    expect(callArgs.html).toContain("123 Main St");
    expect(callArgs.html).toContain("$750,000.00");
    expect(callArgs.html).toContain("3");
    expect(callArgs.html).toContain("1,500");
    expect(callArgs.html).toContain("https://cdn.example.com/photo1.jpg");
  });

  it("returns { submissionId, status: 'submitted', submittedAt }", async () => {
    const { submitToMls } = await import("./syndication");

    const result = await submitToMls({
      listingId: "listing-abc",
      sellerUserId: "user-xyz",
      mlsRegion: "CA-LA",
      address: "123 Main St, Los Angeles, CA 90001",
      price: 75000000,
      bedrooms: 3,
      bathrooms: "2.0",
      sqft: 1500,
      propertyType: "single_family" as const,
      description: "A lovely home",
      photoUrls: [],
      sellerEmail: "seller@example.com",
      sellerName: "Jane Seller",
    });

    expect(result.status).toBe("submitted");
    expect(result.submissionId).toBeDefined();
    expect(typeof result.submissionId).toBe("string");
    expect(result.submittedAt).toBeInstanceOf(Date);
  });

  it("persists submission record to DB", async () => {
    const { submitToMls } = await import("./syndication");

    await submitToMls({
      listingId: "listing-db-persist",
      sellerUserId: "user-xyz",
      mlsRegion: "TX-DFW",
      address: "456 Oak Ave, Dallas, TX 75001",
      price: 45000000,
      bedrooms: 4,
      bathrooms: "3.0",
      sqft: 2200,
      propertyType: "single_family" as const,
      description: "Spacious home",
      photoUrls: [],
      sellerEmail: "seller2@example.com",
      sellerName: "Bob Seller",
    });

    expect(mockInsert).toHaveBeenCalledOnce();
  });
});

// ─── getMlsStatus tests ───────────────────────────────────────────────────────

describe("getMlsStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere,
      }),
    });
  });

  it("returns null when no syndication record exists", async () => {
    mockWhere.mockResolvedValue([]);
    const { getMlsStatus } = await import("./syndication");

    const result = await getMlsStatus("listing-no-record");
    expect(result).toBeNull();
  });

  it("returns syndication status from DB record", async () => {
    const submittedAt = new Date("2026-01-01T00:00:00Z");
    mockWhere.mockResolvedValue([
      {
        id: "syn-id-1",
        listingId: "listing-123",
        submissionId: "sub-abc",
        status: "submitted",
        brokerEmail: "broker@listwithfreedom.com",
        submittedAt,
        confirmedAt: null,
        rejectionReason: null,
      },
    ]);
    const { getMlsStatus } = await import("./syndication");

    const result = await getMlsStatus("listing-123");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("submitted");
    expect(result!.submittedAt).toEqual(submittedAt);
  });
});
