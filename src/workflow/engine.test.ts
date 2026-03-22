import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { createTransactionActor, transactionMachine } from "./engine";
import { getStateWorkflowConfig } from "./states";

describe("transactionMachine", () => {
  describe("GA (attorney-required) routing", () => {
    it("routes to attorney_review when offer is accepted in attorney-required state", () => {
      const gaConfig = getStateWorkflowConfig("GA");
      const actor = createTransactionActor("txn-ga-001", "GA", gaConfig);
      actor.start();

      actor.send({ type: "OFFER_ACCEPTED" });

      expect(actor.getSnapshot().value).toBe("attorney_review");
      actor.stop();
    });
  });

  describe("CA (title-company) routing", () => {
    it("routes directly to inspection_period (no attorney_review) when offer accepted", () => {
      const caConfig = getStateWorkflowConfig("CA");
      const actor = createTransactionActor("txn-ca-001", "CA", caConfig);
      actor.start();

      actor.send({ type: "OFFER_ACCEPTED" });

      expect(actor.getSnapshot().value).toBe("inspection_period");
      actor.stop();
    });
  });

  describe("NY (customary-attorney) routing", () => {
    it("routes to attorney_review when offer accepted in customary-attorney state", () => {
      const nyConfig = getStateWorkflowConfig("NY");
      const actor = createTransactionActor("txn-ny-001", "NY", nyConfig);
      actor.start();

      actor.send({ type: "OFFER_ACCEPTED" });

      expect(actor.getSnapshot().value).toBe("attorney_review");
      actor.stop();
    });
  });

  describe("counter offer flow", () => {
    it("stays in counter_pending on COUNTER_OFFERED, then advances on OFFER_ACCEPTED", () => {
      const caConfig = getStateWorkflowConfig("CA");
      const actor = createTransactionActor("txn-ca-002", "CA", caConfig);
      actor.start();

      actor.send({ type: "COUNTER_OFFERED" });
      expect(actor.getSnapshot().value).toBe("counter_pending");

      actor.send({ type: "OFFER_ACCEPTED" });
      expect(actor.getSnapshot().value).toBe("inspection_period");
      actor.stop();
    });
  });

  describe("rejection flow", () => {
    it("reaches closed_lost when offer is rejected", () => {
      const caConfig = getStateWorkflowConfig("CA");
      const actor = createTransactionActor("txn-ca-003", "CA", caConfig);
      actor.start();

      actor.send({ type: "OFFER_REJECTED" });

      expect(actor.getSnapshot().value).toBe("closed_lost");
      actor.stop();
    });

    it("reaches closed_lost when rejected from counter_pending", () => {
      const txConfig = getStateWorkflowConfig("TX");
      const actor = createTransactionActor("txn-tx-001", "TX", txConfig);
      actor.start();

      actor.send({ type: "COUNTER_OFFERED" });
      actor.send({ type: "OFFER_REJECTED" });

      expect(actor.getSnapshot().value).toBe("closed_lost");
      actor.stop();
    });
  });

  describe("full happy path (title-company FSBO)", () => {
    it("reaches closed_won through full lifecycle", () => {
      const flConfig = getStateWorkflowConfig("FL");
      const actor = createTransactionActor("txn-fl-001", "FL", flConfig);
      actor.start();

      // offer submitted -> accepted -> inspection -> financing -> disclosure -> close
      actor.send({ type: "OFFER_ACCEPTED" });
      expect(actor.getSnapshot().value).toBe("inspection_period");

      actor.send({ type: "INSPECTION_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("financing_period");

      actor.send({ type: "FINANCING_CLEARED" });
      expect(actor.getSnapshot().value).toBe("pending_closing");

      actor.send({ type: "CLOSING_DISCLOSURE_SENT" });
      expect(actor.getSnapshot().value).toBe("pending_closing");

      actor.send({ type: "CLOSED" });
      expect(actor.getSnapshot().value).toBe("closed_won");
      actor.stop();
    });
  });

  describe("full happy path (attorney-required)", () => {
    it("reaches closed_won for GA through attorney_review step", () => {
      const gaConfig = getStateWorkflowConfig("GA");
      const actor = createTransactionActor("txn-ga-002", "GA", gaConfig);
      actor.start();

      actor.send({ type: "OFFER_ACCEPTED" });
      expect(actor.getSnapshot().value).toBe("attorney_review");

      actor.send({ type: "INSPECTION_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("financing_period");

      actor.send({ type: "FINANCING_CLEARED" });
      expect(actor.getSnapshot().value).toBe("pending_closing");

      actor.send({ type: "CLOSING_DISCLOSURE_SENT" });
      actor.send({ type: "CLOSED" });
      expect(actor.getSnapshot().value).toBe("closed_won");
      actor.stop();
    });
  });

  describe("data-driven config swap (LEGL-06)", () => {
    it("GA routes to attorney_review but AZ routes to inspection_period (same machine, different config)", () => {
      const gaConfig = getStateWorkflowConfig("GA");
      const azConfig = getStateWorkflowConfig("AZ");

      const gaActor = createTransactionActor("txn-ga-003", "GA", gaConfig);
      const azActor = createTransactionActor("txn-az-001", "AZ", azConfig);

      gaActor.start();
      azActor.start();

      gaActor.send({ type: "OFFER_ACCEPTED" });
      azActor.send({ type: "OFFER_ACCEPTED" });

      expect(gaActor.getSnapshot().value).toBe("attorney_review");
      expect(azActor.getSnapshot().value).toBe("inspection_period");

      gaActor.stop();
      azActor.stop();
    });

    it("NC routes to attorney_review but OH routes to inspection_period (attorney-required vs title-company)", () => {
      const ncConfig = getStateWorkflowConfig("NC");
      const ohConfig = getStateWorkflowConfig("OH");

      const ncActor = createTransactionActor("txn-nc-001", "NC", ncConfig);
      const ohActor = createTransactionActor("txn-oh-001", "OH", ohConfig);

      ncActor.start();
      ohActor.start();

      ncActor.send({ type: "OFFER_ACCEPTED" });
      ohActor.send({ type: "OFFER_ACCEPTED" });

      expect(ncActor.getSnapshot().value).toBe("attorney_review");
      expect(ohActor.getSnapshot().value).toBe("inspection_period");

      ncActor.stop();
      ohActor.stop();
    });
  });

  describe("transactionMachine export", () => {
    it("exports transactionMachine as a valid XState machine", () => {
      expect(transactionMachine).toBeDefined();
      expect(typeof transactionMachine).toBe("object");
    });
  });
});
