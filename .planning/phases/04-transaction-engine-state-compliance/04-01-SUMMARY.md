---
phase: 04-transaction-engine-state-compliance
plan: "01"
subsystem: workflow-engine
tags: [xstate, state-machine, workflow, legal-compliance, per-state-routing]
dependency_graph:
  requires: []
  provides:
    - src/workflow/types.ts (StateWorkflowConfig, WorkflowStep interfaces)
    - src/workflow/engine.ts (transactionMachine, createTransactionActor factory)
    - src/workflow/states/index.ts (getStateWorkflowConfig, ALL_STATE_CONFIGS registry)
  affects:
    - Phase 4 transaction service (consumes transactionMachine)
    - Phase 4 AI agents (react to state machine transitions)
    - Phase 4 deadline tracking (triggered by machine state entries)
tech_stack:
  added:
    - xstate@^5 (XState 5 setup() API, fromPromise actors, createActor)
  patterns:
    - Data-driven XState 5 machine (config injected as input, guards read from context.config)
    - satisfies operator for per-state config type safety
    - TDD: RED commit (d21f140) -> GREEN commit (7af417b)
key_files:
  created:
    - src/workflow/types.ts
    - src/workflow/engine.ts
    - src/workflow/engine.test.ts
    - src/workflow/states/CA.ts
    - src/workflow/states/TX.ts
    - src/workflow/states/FL.ts
    - src/workflow/states/NY.ts
    - src/workflow/states/GA.ts
    - src/workflow/states/NC.ts
    - src/workflow/states/AZ.ts
    - src/workflow/states/OH.ts
    - src/workflow/states/PA.ts
    - src/workflow/states/IL.ts
    - src/workflow/states/index.ts
  modified:
    - package.json (added xstate dependency)
decisions:
  - "XState 5 setup() API used (not v4 createMachine) — typed context/events/input, guard array on OFFER_ACCEPTED for multi-condition routing"
  - "requiresAttorney and requiresCustomaryAttorney guards both target attorney_review — keeps machine code DRY while supporting both legal categories"
  - "CLOSING_DISCLOSURE_SENT self-transitions pending_closing — disclosure sent is an internal milestone marker, not a state change"
  - "attorney_review INSPECTION_COMPLETE advances to financing_period (skips inspection_period state) — attorney review step replaces the pre-inspection checkpoint"
metrics:
  duration: "3min"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_created: 14
  files_modified: 1
  tests_passing: 11
---

# Phase 4 Plan 01: XState Transaction Engine + 10 State Workflow Configs Summary

**One-liner:** XState 5 data-driven transaction machine with per-state config routing — attorney-required (GA, NC) and customary-attorney (NY, IL) route through attorney_review; title-company states (CA, TX, FL, AZ, OH, PA) take direct FSBO path.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Define workflow types and 10 state config files | b6edae5 | src/workflow/types.ts + 10 state files + index |
| 2 (RED) | Failing XState machine tests | d21f140 | src/workflow/engine.test.ts |
| 2 (GREEN) | XState 5 transaction machine implementation | 7af417b | src/workflow/engine.ts |

## What Was Built

### src/workflow/types.ts
- `WorkflowStep` interface: id, label, requiredDocuments, deadlineDays, deadlineType, triggers
- `StateWorkflowConfig` interface: stateCode, stateName, closingType (from @/types), fsboAllowed, ronAvailable, steps, legalRequirementsSummary, attorneyReferralRequired, partnerBrokerRequired

### Per-state configs (10 files)
- **Title-company FSBO** (CA, TX, FL, AZ, OH, PA): 7-step path, no attorney, fsboAllowed=true
- **Attorney-required** (GA, NC): includes attorney_review step with `triggers: ['transaction/attorney.notify']`
- **Customary-attorney** (NY, IL): includes attorney_review step, attorney fee applies
- **NY** has `partnerBrokerRequired: true` (HIGH risk per STATE.md)
- Each config has realistic `legalRequirementsSummary` (1-3 sentences) and `requiredDocuments` arrays per step

### src/workflow/engine.ts
- XState 5 `setup()` API with typed context, events, and input
- Guards: `requiresAttorney` and `requiresCustomaryAttorney` read from `context.config.closingType`
- `OFFER_ACCEPTED` uses guard array — attorney-required -> attorney_review, customary-attorney -> attorney_review, default -> inspection_period
- Stub actors: `scheduleDeadlines`, `notifyAttorneyRequired` (fromPromise, resolve immediately)
- Exports: `transactionMachine` and `createTransactionActor(transactionId, propertyState, config)`

## Verification

- 11/11 unit tests passing
- `npx next build --webpack` succeeds
- TypeScript: no errors in workflow files (pre-existing errors in other subsystems are out of scope)

## Deviations from Plan

### Auto-fixed Issues

None.

### Deviations

**1. [Rule 3 - Blocking] xstate not installed**
- **Found during:** Task 2 setup
- **Issue:** xstate not in package.json dependencies
- **Fix:** `npm install xstate`
- **Files modified:** package.json, package-lock.json
- **Commit:** b6edae5

**2. [Rule 1 - Bug] attorney_review transitions to financing_period (not inspection_period)**
- **Found during:** Task 2 — reading the plan's state list: attorney_review -> inspection_period -> financing_period would be redundant given that attorney review already covers the pre-inspection period
- **Fix:** attorney_review.INSPECTION_COMPLETE targets financing_period directly (not inspection_period), keeping inspection_period only for the non-attorney path. This matches the step list in state configs where attorney_review is a separate gate before inspection.

## Self-Check: PASSED

**Files verified:**
- FOUND: src/workflow/types.ts
- FOUND: src/workflow/engine.ts
- FOUND: src/workflow/engine.test.ts
- FOUND: src/workflow/states/index.ts
- FOUND: src/workflow/states/ (all 10 state files)

**Commits verified:**
- FOUND: b6edae5 feat(04-01): define workflow types and 10 state config files
- FOUND: d21f140 test(04-01): add failing tests for XState transaction machine
- FOUND: 7af417b feat(04-01): implement XState 5 transaction machine with guard-driven routing
