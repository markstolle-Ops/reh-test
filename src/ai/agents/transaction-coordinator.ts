/**
 * Transaction Coordinator AI Agent
 *
 * Utility functions for generating and rendering state-specific transaction
 * checklists, checking document compliance, and formatting status for the
 * transaction dashboard.
 *
 * These are pure data-transformation helpers — no AI calls here.
 * The AI prompt for user-facing chat is in src/ai/prompts/transaction-coordinator.ts
 */

import type { StateWorkflowConfig, WorkflowStep } from "@/workflow/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  stepId: string;
  label: string;
  requiredDocuments: string[];
  deadlineDays?: number;
  deadlineType?: string;
  /** Whether this step has all required documents on record */
  complete: boolean;
}

export interface DocumentComplianceResult {
  /** Documents confirmed present (from events or signature envelopes) */
  complete: string[];
  /** Documents required but not yet on record */
  missing: string[];
}

export interface TransactionEventRecord {
  eventType: string;
  payload: string;
  occurredAt: Date;
}

export interface ChecklistWithStatus {
  stepId: string;
  label: string;
  requiredDocuments: string[];
  complete: boolean;
  missingDocuments: string[];
  deadlineDays?: number;
  deadlineType?: string;
}

// ─── Checklist Generation ─────────────────────────────────────────────────────

/**
 * Maps state workflow config steps to a flat user-facing checklist.
 * Returns all steps, including those without deadlines.
 */
export function generateChecklist(config: StateWorkflowConfig): ChecklistItem[] {
  return config.steps.map((step: WorkflowStep) => ({
    stepId: step.id,
    label: step.label,
    requiredDocuments: step.requiredDocuments,
    deadlineDays: step.deadlineDays,
    deadlineType: step.deadlineType,
    complete: false, // default — caller enriches with compliance data
  }));
}

// ─── Document Compliance ──────────────────────────────────────────────────────

/**
 * Compares required documents per config step against existing events.
 *
 * A document is considered "present" if a transactionEvent with
 * eventType matching `document_received:{docType}` or `{docType}_signed`
 * exists in the event log.
 *
 * This is a heuristic check — attorney review must validate actual documents.
 */
export function checkDocumentCompliance(
  config: StateWorkflowConfig,
  transactionEvents: TransactionEventRecord[]
): DocumentComplianceResult {
  const eventTypes = new Set(transactionEvents.map((e) => e.eventType));

  const allRequired = config.steps.flatMap((step) => step.requiredDocuments);
  const uniqueRequired = [...new Set(allRequired)];

  const complete: string[] = [];
  const missing: string[] = [];

  for (const doc of uniqueRequired) {
    // Check for any event signaling this document is present
    const isPresent =
      eventTypes.has(`document_received:${doc}`) ||
      eventTypes.has(`${doc}_signed`) ||
      eventTypes.has(`${doc}_received`) ||
      eventTypes.has(`${doc}_completed`);

    if (isPresent) {
      complete.push(doc);
    } else {
      missing.push(doc);
    }
  }

  return { complete, missing };
}

// ─── Checklist + Compliance Merge ─────────────────────────────────────────────

/**
 * Merges checklist items with compliance data for dashboard rendering.
 * Each item knows whether it's complete and which documents are missing.
 */
export function formatChecklistWithStatus(
  checklist: ChecklistItem[],
  compliance: DocumentComplianceResult
): ChecklistWithStatus[] {
  const completeSet = new Set(compliance.complete);

  return checklist.map((item) => {
    const missingDocuments = item.requiredDocuments.filter(
      (doc) => !completeSet.has(doc)
    );

    return {
      stepId: item.stepId,
      label: item.label,
      requiredDocuments: item.requiredDocuments,
      complete: missingDocuments.length === 0,
      missingDocuments,
      deadlineDays: item.deadlineDays,
      deadlineType: item.deadlineType,
    };
  });
}
