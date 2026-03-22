import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

// Mock schema
vi.mock("@/db/schema", () => ({
  agentLicenseChecks: { agentId: "agentId", id: "id" },
  agentProfiles: { id: "id" },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

import { verifyAgentLicense } from "./license-verification";
import { db } from "@/db";

describe("verifyAgentLicense - manual method", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("inserts agentLicenseChecks row with verified=true for manual method", async () => {
    const mockCheck = {
      id: "check_001",
      agentId: "agent_001",
      state: "CA",
      method: "manual",
      arelloResult: null,
      verified: true,
      verifiedAt: new Date(),
      expiresAt: null,
      createdAt: new Date(),
    };

    const returningMock = vi.fn().mockResolvedValue([mockCheck]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    vi.mocked(db.insert).mockImplementation(insertMock);

    // Mock update for setting agent verified=true
    const executeMock = vi.fn().mockResolvedValue(undefined);
    const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    const result = await verifyAgentLicense("agent_001", "CA", "manual");

    expect(db.insert).toHaveBeenCalled();
    expect(result.verified).toBe(true);
    expect(result.method).toBe("manual");
    expect(result.state).toBe("CA");
  });

  it("sets agentProfiles.verified=true after manual verification", async () => {
    const mockCheck = {
      id: "check_002",
      agentId: "agent_001",
      state: "TX",
      method: "manual",
      arelloResult: null,
      verified: true,
      verifiedAt: new Date(),
      expiresAt: null,
      createdAt: new Date(),
    };

    const returningMock = vi.fn().mockResolvedValue([mockCheck]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    vi.mocked(db.insert).mockImplementation(insertMock);

    const executeMock = vi.fn().mockResolvedValue(undefined);
    const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    await verifyAgentLicense("agent_001", "TX", "manual");

    // update should be called to set verified=true on agentProfiles
    expect(db.update).toHaveBeenCalled();
  });
});

describe("verifyAgentLicense - arello method", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("throws error when ARELLO not configured", async () => {
    // No ARELLO_API_URL set
    await expect(
      verifyAgentLicense("agent_001", "CA", "arello")
    ).rejects.toThrow("ARELLO not configured — use manual verification");
  });

  it("calls ARELLO API and inserts check row when configured", async () => {
    vi.stubEnv("ARELLO_API_URL", "https://arello.example.com/api");
    vi.stubEnv("ARELLO_API_CREDENTIALS", "dGVzdDp0ZXN0"); // base64 test:test

    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `<?xml version="1.0"?>
        <LicenseVerificationResponse>
          <LicenseStatus>Active</LicenseStatus>
          <LicenseNumber>DRE123456</LicenseNumber>
          <ExpirationDate>2026-12-31</ExpirationDate>
        </LicenseVerificationResponse>`
      ),
    });
    vi.stubGlobal("fetch", mockFetch);

    const mockCheck = {
      id: "check_003",
      agentId: "agent_002",
      state: "CA",
      method: "arello",
      arelloResult: '{"status":"Active"}',
      verified: true,
      verifiedAt: new Date(),
      expiresAt: new Date("2026-12-31"),
      createdAt: new Date(),
    };

    // Mock db.select for license number lookup
    const selectWhereMock = vi.fn().mockResolvedValue([{ licenseNumber: "DRE123456" }]);
    const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
    const selectMock = vi.fn().mockReturnValue({ from: selectFromMock });
    vi.mocked(db.select).mockImplementation(selectMock);

    const returningMock = vi.fn().mockResolvedValue([mockCheck]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    vi.mocked(db.insert).mockImplementation(insertMock);

    const executeMock = vi.fn().mockResolvedValue(undefined);
    const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    const result = await verifyAgentLicense("agent_002", "CA", "arello");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://arello.example.com/api",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Basic dGVzdDp0ZXN0",
        }),
      })
    );
    expect(result.verified).toBe(true);
    expect(result.method).toBe("arello");
  });
});
