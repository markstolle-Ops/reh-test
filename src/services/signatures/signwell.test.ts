import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock db module before any imports
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  signatureEnvelopes: {},
}));

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234-5678-abcd";
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => mockUUID),
});

import {
  createDocumentForSigning,
  getDocumentStatus,
  getEmbeddedSigningUrl,
  processWebhookEvent,
} from "./signwell";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("SignWell adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SIGNWELL_API_KEY = "test-api-key";
  });

  describe("createDocumentForSigning", () => {
    it("sends POST to SignWell API with correct URL and x-api-key header", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          recipients: [{ id: "r1", embedded_signing_url: "https://signwell.com/sign/r1" }],
        }),
      });

      await createDocumentForSigning({
        pdfBase64: "base64content",
        signers: [{ name: "Alice", email: "alice@example.com", role: "buyer" }],
        name: "Test Document",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.signwell.com/api/v1/documents",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "x-api-key": "test-api-key",
          }),
        })
      );
    });

    it("sets test_mode=true when NODE_ENV is not production", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          recipients: [],
        }),
      });

      vi.stubEnv("NODE_ENV", "test");

      await createDocumentForSigning({
        pdfBase64: "base64content",
        signers: [{ name: "Alice", email: "alice@example.com", role: "buyer" }],
        name: "Test Document",
      });

      const callBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(callBody.test_mode).toBe(true);

      vi.unstubAllEnvs();
    });

    it("sets test_mode=false when NODE_ENV is production", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          recipients: [],
        }),
      });

      vi.stubEnv("NODE_ENV", "production");

      await createDocumentForSigning({
        pdfBase64: "base64content",
        signers: [{ name: "Alice", email: "alice@example.com", role: "buyer" }],
        name: "Test Document",
      });

      const callBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(callBody.test_mode).toBe(false);

      vi.unstubAllEnvs();
    });

    it("supports multi-party signers (buyer + seller + agent)", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          recipients: [
            { id: "r1", embedded_signing_url: "https://signwell.com/sign/r1" },
            { id: "r2", embedded_signing_url: "https://signwell.com/sign/r2" },
            { id: "r3", embedded_signing_url: "https://signwell.com/sign/r3" },
          ],
        }),
      });

      const signers = [
        { name: "Alice Buyer", email: "alice@example.com", role: "buyer" },
        { name: "Bob Seller", email: "bob@example.com", role: "seller" },
        { name: "Carol Agent", email: "carol@example.com", role: "agent" },
      ];

      await createDocumentForSigning({
        pdfBase64: "base64content",
        signers,
        name: "Multi-Party Document",
      });

      const callBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(callBody.recipients).toHaveLength(3);
      expect(callBody.recipients[0].name).toBe("Alice Buyer");
      expect(callBody.recipients[0].email).toBe("alice@example.com");
      expect(callBody.recipients[0].placeholder_name).toBe("buyer");
      expect(callBody.recipients[1].placeholder_name).toBe("seller");
      expect(callBody.recipients[2].placeholder_name).toBe("agent");
    });

    it("sets embedded_signing=true and send_email=false for all recipients", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          recipients: [{ id: "r1" }],
        }),
      });

      await createDocumentForSigning({
        pdfBase64: "base64content",
        signers: [{ name: "Alice", email: "alice@example.com", role: "buyer" }],
        name: "Test Document",
      });

      const callBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(callBody.embedded_signing).toBe(true);
      expect(callBody.recipients[0].send_email).toBe(false);
    });

    it("returns envelopeId, signwellDocumentId, and recipients", async () => {
      const { db } = await import("@/db");
      const insertChain = { values: vi.fn().mockResolvedValue([]) };
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-999",
          recipients: [
            { id: "r1", embedded_signing_url: "https://signwell.com/sign/r1" },
          ],
        }),
      });

      const result = await createDocumentForSigning({
        pdfBase64: "base64content",
        signers: [{ name: "Alice", email: "alice@example.com", role: "buyer" }],
        name: "Test Document",
        listingId: "listing-123",
      });

      expect(result.signwellDocumentId).toBe("sw-doc-999");
      expect(result.envelopeId).toBeDefined();
      expect(result.recipients).toHaveLength(1);
    });
  });

  describe("getDocumentStatus", () => {
    it("fetches document by ID from SignWell API and returns status", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          status: "completed",
          recipients: [{ id: "r1", name: "Alice" }],
          audit_trail: [{ action: "signed", timestamp: "2026-01-01T00:00:00Z" }],
        }),
      });

      const result = await getDocumentStatus("sw-doc-id");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.signwell.com/api/v1/documents/sw-doc-id",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": "test-api-key",
          }),
        })
      );
      expect(result.status).toBe("completed");
      expect(result.recipients).toHaveLength(1);
      expect(result.audit_trail).toHaveLength(1);
    });
  });

  describe("getEmbeddedSigningUrl", () => {
    it("returns the embedded_signing_url for a specific recipient", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          status: "pending",
          recipients: [
            { id: "r1", embedded_signing_url: "https://signwell.com/sign/r1" },
            { id: "r2", embedded_signing_url: "https://signwell.com/sign/r2" },
          ],
          audit_trail: [],
        }),
      });

      const url = await getEmbeddedSigningUrl("sw-doc-id", "r2");
      expect(url).toBe("https://signwell.com/sign/r2");
    });

    it("returns undefined when recipient is not found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "sw-doc-id",
          status: "pending",
          recipients: [{ id: "r1", embedded_signing_url: "https://signwell.com/sign/r1" }],
          audit_trail: [],
        }),
      });

      const url = await getEmbeddedSigningUrl("sw-doc-id", "nonexistent");
      expect(url).toBeUndefined();
    });
  });

  describe("processWebhookEvent", () => {
    it("updates signatureEnvelopes status to completed on document_completed event", async () => {
      const { db } = await import("@/db");
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain);

      const payload = {
        event_type: "document_completed" as const,
        document: {
          id: "sw-doc-id",
          audit_trail: [{ action: "signed", signer: "Alice", timestamp: "2026-01-01T00:00:00Z" }],
        },
      };

      await processWebhookEvent(payload);

      expect(db.update).toHaveBeenCalled();
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          auditTrail: JSON.stringify(payload.document.audit_trail),
          completedAt: expect.any(Date),
        })
      );
    });

    it("updates signatureEnvelopes status to declined on document_declined event", async () => {
      const { db } = await import("@/db");
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain);

      const payload = {
        event_type: "document_declined" as const,
        document: {
          id: "sw-doc-id",
          audit_trail: [],
        },
      };

      await processWebhookEvent(payload);

      expect(db.update).toHaveBeenCalled();
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "declined",
        })
      );
    });
  });
});
