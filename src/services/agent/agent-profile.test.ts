import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock database
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

// Mock Stripe — must use function (not arrow) for constructor mock
vi.mock("stripe", () => {
  const Stripe = vi.fn(function () {
    return {
      accounts: {
        create: vi.fn().mockResolvedValue({ id: "acct_test_123" }),
      },
    };
  });
  return { default: Stripe };
});

// Mock schema
vi.mock("@/db/schema", () => ({
  agentProfiles: { id: "id", userId: "userId" },
  agentLicenseChecks: { agentId: "agentId" },
}));

// Mock drizzle-orm eq
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

import { createAgentProfile, getAgentProfile, updateAgentProfile } from "./agent-profile";
import { db } from "@/db";

describe("createAgentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("inserts DB row first with pending stripeAccountId, then updates after Stripe creation", async () => {
    const mockInsertProfile = {
      id: "agent_001",
      userId: "user_001",
      firstName: "Jane",
      lastName: "Smith",
      licenseStates: ["CA", "TX"],
      licenseNumber: "DRE123456",
      stripeAccountId: "pending",
      stripeOnboardingComplete: false,
      verified: false,
      availableForDispatch: false,
      flatFeeCents: 50000,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockUpdatedProfile = { ...mockInsertProfile, stripeAccountId: "acct_test_123" };

    // Mock insert chain
    const insertReturningMock = vi.fn().mockResolvedValue([mockInsertProfile]);
    const insertValuesMock = vi.fn().mockReturnValue({ returning: insertReturningMock });
    const insertMock = vi.fn().mockReturnValue({ values: insertValuesMock });
    vi.mocked(db.insert).mockImplementation(insertMock);

    // Mock update chain (called after Stripe account creation)
    const updateReturningMock = vi.fn().mockResolvedValue([mockUpdatedProfile]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: updateReturningMock });
    const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    const updateMock = vi.fn().mockReturnValue({ set: updateSetMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    const result = await createAgentProfile({
      userId: "user_001",
      firstName: "Jane",
      lastName: "Smith",
      licenseStates: ["CA", "TX"],
      licenseNumber: "DRE123456",
    });

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result.stripeAccountId).toBe("acct_test_123");
  });

  it("stores stripeAccountId from Stripe Express account creation", async () => {
    const mockInsertProfile = {
      id: "agent_002",
      userId: "user_002",
      firstName: "Bob",
      lastName: "Jones",
      licenseStates: ["FL"],
      licenseNumber: "FL789",
      stripeAccountId: "pending",
      stripeOnboardingComplete: false,
      verified: false,
      availableForDispatch: false,
      flatFeeCents: 50000,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockUpdatedProfile = { ...mockInsertProfile, stripeAccountId: "acct_test_123" };

    const insertReturningMock = vi.fn().mockResolvedValue([mockInsertProfile]);
    const insertValuesMock = vi.fn().mockReturnValue({ returning: insertReturningMock });
    const insertMock = vi.fn().mockReturnValue({ values: insertValuesMock });
    vi.mocked(db.insert).mockImplementation(insertMock);

    const updateReturningMock = vi.fn().mockResolvedValue([mockUpdatedProfile]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: updateReturningMock });
    const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    const updateMock = vi.fn().mockReturnValue({ set: updateSetMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    const result = await createAgentProfile({
      userId: "user_002",
      firstName: "Bob",
      lastName: "Jones",
      licenseStates: ["FL"],
      licenseNumber: "FL789",
    });

    expect(result.stripeAccountId).toBe("acct_test_123");
  });
});

describe("getAgentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns agent profile for given userId", async () => {
    const mockProfile = {
      id: "agent_001",
      userId: "user_001",
      firstName: "Jane",
      lastName: "Smith",
      licenseStates: ["CA"],
      licenseNumber: "DRE123456",
      stripeAccountId: "acct_test_123",
      stripeOnboardingComplete: false,
      verified: false,
      availableForDispatch: false,
      flatFeeCents: 50000,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const whereMock = vi.fn().mockResolvedValue([mockProfile]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });
    vi.mocked(db.select).mockImplementation(selectMock);

    const result = await getAgentProfile("user_001");

    expect(db.select).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user_001");
  });

  it("returns null when no profile found", async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });
    vi.mocked(db.select).mockImplementation(selectMock);

    const result = await getAgentProfile("nonexistent_user");

    expect(result).toBeNull();
  });
});

describe("updateAgentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates mutable fields (bio, licenseStates, availableForDispatch)", async () => {
    const updatedProfile = {
      id: "agent_001",
      userId: "user_001",
      firstName: "Jane",
      lastName: "Smith",
      licenseStates: ["CA", "TX", "FL"],
      licenseNumber: "DRE123456",
      stripeAccountId: "acct_test_123",
      stripeOnboardingComplete: false,
      verified: false,
      availableForDispatch: true,
      flatFeeCents: 50000,
      bio: "Experienced buyer's agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const returningMock = vi.fn().mockResolvedValue([updatedProfile]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateMock = vi.fn().mockReturnValue({ set: setMock });
    vi.mocked(db.update).mockImplementation(updateMock);

    const result = await updateAgentProfile("agent_001", {
      bio: "Experienced buyer's agent",
      licenseStates: ["CA", "TX", "FL"],
      availableForDispatch: true,
    });

    expect(db.update).toHaveBeenCalled();
    expect(result.bio).toBe("Experienced buyer's agent");
    expect(result.availableForDispatch).toBe(true);
  });
});
