# RealEstateHunter Phased Audit Design

## Problem

RealEstateHunter was scaffolded by GSD agents over 2 days. All 6 phases were planned and executed automatically. The build passes and 427/433 tests pass, but no human has verified the code works correctly end-to-end. Before building on this foundation, we need to systematically audit and verify each phase.

## Approach

Audit-first, phase-by-phase, with a gate between each phase. No UI redesign — this is a code quality and correctness audit.

## Audit Pipeline (per phase)

1. **Explore** — Deep-trace the phase's code: execution paths, architecture layers, dependencies, patterns. Cross-reference decisions logged in `.planning/STATE.md` for the current phase — these document known workarounds, API version constraints, and architectural choices that must be verified.
2. **Review** — Hunt for bugs, logic errors, security vulnerabilities, dead code, mock problems
3. **Fix** — Patch issues found in review with root-cause discipline
4. **Verify** — Build passes, all tests green, no regressions introduced
5. **Tag** — Git tag for the verified phase state

For phases with UI components (2-5), a visual audit follows after all 6 phases pass code review.

## Phase 0: Warm-up — Fix Known Failing Tests

Run `npx vitest run` and fix the 6 known failures:

| File | Tests Failing | Root Cause |
|------|--------------|------------|
| `src/services/matching/listing-recommendations.test.ts` | 1 | OpenAI embedding mock returns wrong shape (`response.data[0].embedding` undefined) |
| `src/services/mls/syndication.test.ts` | 3 | Resend mock is arrow function, not constructor — `new Resend()` throws |
| (remaining 2 from same files) | 2 | Same root causes as above |

## Phase Details

Each phase's file scope is derived from the corresponding `.planning/phases/0X-*/` plan and summary files, which list all created/modified files.

| Phase | Name | Key Areas | File Scope Pointer |
|-------|------|-----------|-------------------|
| 1 | Legal Framework + Foundation | Clerk auth, role routing, cost calculator, legal docs | `.planning/phases/01-legal-framework-foundation/` |
| 2 | Listing Creation + AI Core | Drizzle schema, R2 upload, AI descriptions, chatbot, fees | `.planning/phases/02-listing-creation-ai-core/` |
| 3 | Buyer Discovery + Disclosure + eSign | Search, Mapbox, saved searches, disclosure forms, SignWell | `.planning/phases/03-buyer-discovery-disclosure-esignature/` |
| 4 | Transaction Engine + State Compliance | XState workflows, negotiation AI, transaction coordinator, wire fraud | `.planning/phases/04-transaction-engine-state-compliance/` |
| 5 | Agent-for-Hire Marketplace | Stripe Connect, license verification, buyer matching, NLQ search | `.planning/phases/05-agent-for-hire-marketplace-buyer-matching/` |
| 6 | MLS Direct Integration + Scale | RESO Web API, 50-state expansion, Redis caching | `.planning/phases/06-mls-direct-integration-scale/` |

## Known Security Deferrals

These items were explicitly deferred during the initial build and must be cataloged (not necessarily fixed) during audit:

- **Wire instructions stored as plaintext** — column-level encryption via Supabase Vault deferred to pre-production hardening (Phase 4)
- **SignWell webhook has no HMAC verification** — `x-signwell-signature` header validation not implemented (Phase 3)
- **MFA gate uses `twoFactorEnabled` check, not step-up auth** — step-up requires Clerk enterprise plan (Phase 4)

## Scope

### In Scope
- Code correctness and logic verification
- Test fixes and coverage gaps
- Security review (auth, injection, XSS, OWASP top 10)
- Library API currency (Next.js 16, AI SDK v6, Clerk v7, XState 5)
- Mock/test quality
- Dead code removal
- Cataloging deferred security items

### Out of Scope
- UI/visual design changes (deferred to post-audit UI pass)
- Setting up real services (Supabase, Clerk, Stripe credentials)
- New feature development
- Performance optimization beyond what exists
- Deployment pipeline

## Success Criteria

- Zero TypeScript errors, zero Biome lint errors, build completes successfully (Next.js informational warnings acceptable)
- All tests green (433/433 or more)
- Each phase tagged in git (e.g., `audit/phase-1-verified`)
- All deferred security items cataloged with severity
- Library APIs verified against current docs via Context7
