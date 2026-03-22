# RealEstateHunter

## What This Is

An AI-powered real estate transaction platform that replaces traditional real estate agents across all 50 US states. Buyers and sellers interact with 24/7 AI agents that handle property marketing, buyer matching, transaction guidance, negotiation assistance, and legal compliance — at a fraction of the cost of traditional agent commissions. The platform provides state-by-state legal workflows to ensure every transaction is compliant.

## Core Value

Eliminate the need for traditional real estate agents by providing AI-powered transaction management that saves buyers and sellers thousands of dollars while delivering superior 24/7 service.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] State-by-state legal workflow engine covering all 50 states
- [ ] Property listing system (seller uploads photos, details; AI generates marketing copy)
- [ ] AI chatbot for property marketing and self-promotion
- [ ] AI-powered buyer matching (criteria-based search, alerts)
- [ ] AI transaction guide (paperwork, deadlines, legal steps per state)
- [ ] AI negotiation assistant (comps analysis, offer/counteroffer strategy)
- [ ] Cost-benefit calculator comparing RealEstateHunter fees vs. traditional agent commissions
- [ ] Transparent fee breakdown per transaction (platform fee + title company + attorney + agent-for-hire where required)
- [ ] Licensed agent-for-hire marketplace for states requiring agent involvement (nominal fee for contract signing)
- [ ] Support for residential sales (single-family, condos, townhouses)
- [ ] Support for land/lot transactions
- [ ] User-uploaded property listings with photo management
- [ ] MLS/API feed integration (Zillow, Realtor.com, MLS data)
- [ ] State compliance verification (confirm legal workflows meet each state's requirements)

### Out of Scope

- Residential rentals/leasing — focus on sales transactions first
- Commercial real estate — different legal/regulatory landscape, defer to v2+
- Mortgage origination — partner opportunity, not core platform
- Home inspection services — referral model only

## Context

- Founded by same team as FinancialAIguru — same disruption philosophy (AI replaces gatekeepers)
- Real estate agent commissions are typically 5-6% of sale price — on a $400K home that's $20-24K
- RealEstateHunter will charge a flat fee (TBD, market research needed, ~$2-3K range) plus pass-through costs
- States vary wildly on agent requirements: some require licensed agents for any transaction, some allow FSBO with minimal oversight, some require attorneys at closing
- The "agent-for-hire" model needs legal verification per state — concept is to have licensed agents available to sign contracts for a nominal fee in states where legally required
- MLS access is gated — will need to investigate IDX feeds, RETS, and newer APIs
- Competitor landscape includes Redfin, Opendoor, Zillow, FSBO.com, but none fully replace the agent with AI

## Constraints

- **Legal compliance**: Must verify all workflows against actual state real estate law — cannot guess
- **Licensing**: Platform itself may need broker licenses in some states
- **MLS access**: MLS data requires IDX agreements which vary by MLS board
- **Two-sided marketplace**: Need both buyers and sellers — chicken-and-egg problem requires strategy

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first, not agent-assisted | Agents are the cost center being eliminated, not augmented | — Pending |
| Flat fee model over percentage | Core value prop is savings vs. traditional commission | — Pending |
| State-by-state legal workflows | Legal requirements vary by state; one-size-fits-all won't work | — Pending |
| Start with user uploads + MLS feeds | User uploads for MVP, MLS for comprehensive listings | — Pending |
| Residential + land only for v1 | Commercial has different regulatory requirements | — Pending |

---
*Last updated: 2026-03-15 after initialization*
