import { createActor, fromPromise, setup } from "xstate";
import type { StateWorkflowConfig } from "@/workflow/types";

// ─── Event types ────────────────────────────────────────────────────────────

type TransactionEvent =
  | { type: "OFFER_SUBMITTED" }
  | { type: "COUNTER_OFFERED" }
  | { type: "OFFER_ACCEPTED" }
  | { type: "OFFER_REJECTED" }
  | { type: "INSPECTION_COMPLETE" }
  | { type: "FINANCING_CLEARED" }
  | { type: "CLOSING_DISCLOSURE_SENT" }
  | { type: "CLOSED" };

// ─── Context type ────────────────────────────────────────────────────────────

interface TransactionContext {
  transactionId: string;
  propertyState: string;
  config: StateWorkflowConfig;
  currentStep: string;
}

// ─── Input type ──────────────────────────────────────────────────────────────

interface TransactionInput {
  transactionId: string;
  propertyState: string;
  config: StateWorkflowConfig;
}

// ─── Machine factory ─────────────────────────────────────────────────────────

export const transactionMachine = setup({
  types: {
    context: {} as TransactionContext,
    events: {} as TransactionEvent,
    input: {} as TransactionInput,
  },
  actors: {
    scheduleDeadlines: fromPromise(async () => {
      // Stub — real implementation will schedule deadline reminders
      return { scheduled: true };
    }),
    notifyAttorneyRequired: fromPromise(async () => {
      // Stub — real implementation will notify attorney referral service
      return { notified: true };
    }),
  },
  guards: {
    requiresAttorney: ({ context }) => context.config.closingType === "attorney-required",
    requiresCustomaryAttorney: ({ context }) => context.config.closingType === "customary-attorney",
  },
}).createMachine({
  id: "transaction",
  initial: "offer_submitted",
  context: ({ input }: { input: TransactionInput }) => ({
    transactionId: input.transactionId,
    propertyState: input.propertyState,
    config: input.config,
    currentStep: "offer_submitted",
  }),
  states: {
    offer_submitted: {
      on: {
        OFFER_ACCEPTED: [
          {
            guard: "requiresAttorney",
            target: "attorney_review",
          },
          {
            guard: "requiresCustomaryAttorney",
            target: "attorney_review",
          },
          {
            target: "inspection_period",
          },
        ],
        COUNTER_OFFERED: {
          target: "counter_pending",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    counter_pending: {
      on: {
        OFFER_ACCEPTED: [
          {
            guard: "requiresAttorney",
            target: "attorney_review",
          },
          {
            guard: "requiresCustomaryAttorney",
            target: "attorney_review",
          },
          {
            target: "inspection_period",
          },
        ],
        COUNTER_OFFERED: {
          target: "counter_pending",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    attorney_review: {
      on: {
        INSPECTION_COMPLETE: {
          target: "financing_period",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    inspection_period: {
      on: {
        INSPECTION_COMPLETE: {
          target: "financing_period",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    financing_period: {
      on: {
        FINANCING_CLEARED: {
          target: "pending_closing",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    pending_closing: {
      on: {
        CLOSING_DISCLOSURE_SENT: {
          // Stay in pending_closing — disclosure sent is an internal milestone
          target: "pending_closing",
        },
        CLOSED: {
          target: "closed_won",
        },
        OFFER_REJECTED: {
          target: "closed_lost",
        },
      },
    },

    closed_won: {
      type: "final",
    },

    closed_lost: {
      type: "final",
    },
  },
});

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Creates and returns a started XState actor for a transaction.
 * Caller is responsible for calling actor.stop() when done.
 */
export function createTransactionActor(
  transactionId: string,
  propertyState: string,
  config: StateWorkflowConfig,
) {
  return createActor(transactionMachine, {
    input: { transactionId, propertyState, config },
  });
}
