---
phase: 01-legal-framework-foundation
plan: 04
subsystem: legal
tags: [legal, upl, respa, broker-licensing, compliance, ai-guardrails]

# Dependency graph
requires:
  - phase: 01-03
    provides: ai-guidance-taxonomy.md (permitted/prohibited AI patterns), state-compliance-classification.md (10 launch state closing types)
provides:
  - docs/legal/broker-licensing-analysis.md: per-state broker licensing requirements and risk levels for all 10 launch states, 3-option platform model trade-offs
  - docs/legal/respa-compliance-framework.md: RESPA Section 8/9/10 compliance analysis, AfBA disclosure rules, platform fee determination
  - docs/legal/upl-guardrail-document.md: UPL avoidance framework with per-feature risk mapping and 5-layer technical guardrail architecture
affects:
  - phase 2 (AI features must not ship until ai-guidance-taxonomy.md and upl-guardrail-document.md are attorney-reviewed)
  - phase 4 (transaction workflow engine references state classifications and attorney routing rules)
  - all phases (broker licensing decision affects MLS access structure and platform model)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Legal docs as first-class artifacts — three governance documents gate all AI feature development in Phase 2
    - UPL guardrail layered defense — system prompt + output filtering + attorney referral triggers + disclaimer + logging
    - RESPA analysis tied to platform fee structure — flat subscription fee is not a settlement service

key-files:
  created:
    - docs/legal/broker-licensing-analysis.md
    - docs/legal/respa-compliance-framework.md
    - docs/legal/upl-guardrail-document.md
  modified: []

key-decisions:
  - "Attorney review is a hard gate — Phase 2 AI features must not ship until UPL guardrail document and AI guidance taxonomy are reviewed by counsel"
  - "Platform broker licensing decision (owned brokerage / partner brokerage / designated broker) is a business/legal decision documented with trade-offs but not decided here"
  - "RESPA: platform subscription fee is NOT a settlement service under RESPA — must be confirmed by counsel before launch"
  - "NY is HIGH broker licensing risk — partner broker is required, not optional, for New York"
  - "AfBA disclosure required if platform ever receives value from title company, lender, or attorney referrals"

patterns-established:
  - "Pattern: Legal doc as gate — UPL guardrail references ai-guidance-taxonomy.md as the implementation spec; one is legal framework, one is technical spec"
  - "Pattern: Feature risk mapping — each AI feature assigned NONE/LOW/MEDIUM/HIGH UPL risk with specific guardrails per risk level"
  - "Pattern: Per-state risk differentiation — broker licensing and UPL analysis is state-specific, not one-size-fits-all"

requirements-completed: [ACCT-01]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 1 Plan 04: Legal Opinion Documents Summary

**Three legal governance documents (broker licensing, RESPA, UPL guardrails) covering all 10 launch states, with per-feature AI risk mapping and 5-layer technical guardrail architecture blocking Phase 2 AI development until attorney-reviewed**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T12:12:37Z
- **Completed:** 2026-03-16T12:20:43Z
- **Tasks:** 2 (1 executed + 1 auto-approved checkpoint)
- **Files modified:** 3

## Accomplishments

- Three legal governance documents establish the complete legal foundation for platform operation: broker licensing risk levels per state, RESPA fee structure compliance analysis, and UPL avoidance framework for all AI features
- Per-state broker licensing analysis identifies NY as HIGH risk (partner broker required), CA/FL/IL/GA/NC as MEDIUM risk, and TX/AZ/OH/PA as LOW risk — with trade-off analysis for three platform model options
- UPL guardrail document maps every planned AI feature to a risk level (NONE through HIGH) with specific 5-layer technical implementation requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Legal opinion documents for 10 launch states** - `afee2c3` (feat)
2. **Task 2: Attorney review gate** - Auto-approved checkpoint (no commit)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `docs/legal/broker-licensing-analysis.md` — Per-state broker licensing analysis: 10 states with risk levels (LOW/MEDIUM/HIGH), mitigation strategies, and 3-option platform model trade-off analysis (owned brokerage / partner brokerage / designated broker). References state-compliance-classification.md.
- `docs/legal/respa-compliance-framework.md` — RESPA Section 8/9/10 compliance analysis: platform fee vs settlement service determination, AfBA disclosure framework, Section 9 title insurance compliance, per-state RESPA equivalent statutes for all 10 states.
- `docs/legal/upl-guardrail-document.md` — UPL avoidance framework: per-state UPL definitions, per-feature risk mapping (cost calculator NONE, listing description LOW, process chatbot MEDIUM, contract interpretation HIGH-PROHIBITED, negotiation suggestions MEDIUM), 5-layer guardrail architecture, and incident response protocol. References ai-guidance-taxonomy.md as implementation spec.

## Decisions Made

- Attorney review is a hard gate — Phase 2 AI features must not ship until UPL guardrail document and AI guidance taxonomy are reviewed by counsel. This is documented in STATE.md as a blocker.
- Platform broker licensing decision (owned brokerage / partner brokerage / designated broker) is explicitly deferred as a business/legal decision — the documents contain trade-offs and cost estimates but no recommendation.
- RESPA: platform subscription fee is NOT a settlement service under RESPA (preliminary determination) — must be confirmed by RESPA counsel before launch.
- New York is the highest-risk state: HIGH broker licensing risk (partner broker required, not optional) and the state's customary-attorney standard creates UPL exposure that demands conservative AI guidance.
- AfBA disclosure protocol documented for future use if platform ever establishes referral relationships with settlement service providers.

## Deviations from Plan

None — plan executed exactly as written.

**Checkpoint Task 2:** Attorney review gate is AUTO-APPROVED per execution instructions. Logged: "⚡ Auto-approved: attorney review gate checkpoint."

## Issues Encountered

None — document creation tasks completed without blocking issues.

## User Setup Required

**Attorney review required before Phase 2.** No automated environment setup needed. However:

1. Engage a real estate attorney (or firm with multi-state capabilities) to review all 5 legal documents in `docs/legal/`:
   - `ai-guidance-taxonomy.md` (from 01-03)
   - `state-compliance-classification.md` (from 01-03)
   - `broker-licensing-analysis.md` (this plan)
   - `respa-compliance-framework.md` (this plan)
   - `upl-guardrail-document.md` (this plan)

2. After review, update each document's status from `DRAFT` to `REVIEWED — [Attorney Name], [Date], [Conditions if any]`

3. **Phase 2 (AI features) MUST NOT begin until at minimum the AI Guidance Taxonomy and UPL Guardrail documents are attorney-reviewed.**

## Next Phase Readiness

- Phase 1 legal framework is complete — all 5 legal governance documents exist as DRAFTs
- **Phase 2 AI features are gated behind attorney review** — this is the documented blocker
- Broker licensing decision (platform model selection) must be made before Phase 2 architecture is finalized
- State classifications and attorney routing rules are ready for Phase 4 transaction workflow engine

## Self-Check: PASSED

All created files verified present on disk. Task commits verified in git log.

- docs/legal/broker-licensing-analysis.md - FOUND
- docs/legal/respa-compliance-framework.md - FOUND
- docs/legal/upl-guardrail-document.md - FOUND
- Commit afee2c3 - FOUND

---
*Phase: 01-legal-framework-foundation*
*Completed: 2026-03-16*
