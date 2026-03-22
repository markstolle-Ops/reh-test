---
phase: 05-agent-for-hire-marketplace-buyer-matching
plan: "04"
subsystem: search
tags: [gpt-4o, nlq, natural-language, ai-sdk, zod, nextjs, react]

# Dependency graph
requires:
  - phase: 05-03
    provides: buyer matching engine and preference profiler
  - phase: 03-buyer-discovery-disclosure-esignature
    provides: searchListings service, SearchParams interface, buyer search page

provides:
  - GPT-4o natural language query parsing via parseNaturalLanguageQuery
  - NlqSearchBar component on /buyer/search with AI disclaimer
  - GET /api/search?nlq= endpoint that merges NLQ params with explicit filters
  - Dismissible NLQ active-query banner on search results page

affects:
  - 05-agent-for-hire-marketplace-buyer-matching
  - future search enhancements
  - Fair Housing compliance audit

# Tech tracking
tech-stack:
  added: [openai (SDK, installed for Phase 05-03 dynamic imports)]
  patterns: [generateObject with zod schema for structured AI output, dollar-to-cents conversion at parser boundary, NLQ params merge with explicit filter override]

key-files:
  created:
    - src/services/search/nlq-parser.ts
    - src/services/search/nlq-parser.test.ts
    - src/components/search/NlqSearchBar.tsx
  modified:
    - src/app/api/search/route.ts
    - src/app/buyer/search/page.tsx
    - src/app/api/buyer-events/route.ts
    - src/services/agent/agent-dispatch.ts

key-decisions:
  - "NLQ parser prompt explicitly forbids school quality, walkability, crime rates, and demographics — Fair Housing Act compliance"
  - "GPT-4o returns prices in dollars; parser boundary converts to cents — keeps AI output human-readable, internal representation consistent"
  - "Explicit filter params override NLQ-parsed values — gives buyers precise control over AI interpretation"
  - "openai package installed as explicit dependency — Phase 05-03 dynamic imports required it at build time despite lazy loading"
  - "z.record(z.string(), z.unknown()) required in Zod v4 — two-argument form replaces one-argument z.record()"

patterns-established:
  - "NLQ boundary conversion: AI returns dollars, service layer converts to cents before returning SearchParams"
  - "NLQ merge pattern: parseNaturalLanguageQuery fills base params, explicit URL params override any NLQ-parsed field"

requirements-completed: [MTCH-03]

# Metrics
duration: 11min
completed: 2026-03-16
---

# Phase 05 Plan 04: Natural Language Search Summary

**GPT-4o NLQ parser converting buyer plain-English queries to SearchParams with Fair Housing-compliant field exclusions, wired into /api/search and surfaced via NlqSearchBar on /buyer/search**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-16T20:14:29Z
- **Completed:** 2026-03-16T20:25:42Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- GPT-4o NLQ parser (`parseNaturalLanguageQuery`) extracts objective features only — price, beds, baths, sqft, property type, location — with explicit prompt exclusions for school quality, walkability, and demographics
- Search API now accepts `?nlq=` parameter, parses it via GPT-4o, and merges results with any explicit filter params (explicit wins)
- Buyer search page features a full-width `NlqSearchBar` above traditional filters, with dismissible active-query banner and "Clear" button
- 12 tests covering dollar-to-cents conversion, schema validation, prompt content verification, and all property type values

## Task Commits

Each task was committed atomically:

1. **Task 1: NLQ parser service** - `42c8da6` (feat - TDD: test + implementation)
2. **Task 2: Wire NLQ into search API + search bar component** - `5aae60c` (feat)
3. **Deviation: Pre-existing build blockers** - `b2350ba` (fix)

## Files Created/Modified

- `src/services/search/nlq-parser.ts` - parseNaturalLanguageQuery + nlqOutputSchema export
- `src/services/search/nlq-parser.test.ts` - 12 tests with mocked AI
- `src/components/search/NlqSearchBar.tsx` - Full-width NLQ input with icon and AI disclaimer
- `src/app/api/search/route.ts` - Added nlq param parsing, NLQ-first merge with explicit override
- `src/app/buyer/search/page.tsx` - NlqSearchBar above filters, nlq state, dismissible banner
- `src/app/api/buyer-events/route.ts` - Fixed Zod v4 z.record() signature (pre-existing)
- `src/services/agent/agent-dispatch.ts` - Fixed drizzle db.execute() return type (pre-existing)

## Decisions Made

- NLQ parser prompt explicitly forbids school quality, walkability, crime rates, and demographics — Fair Housing Act compliance
- GPT-4o returns prices in dollars; parser boundary converts to cents — keeps AI output human-readable while maintaining internal consistency
- Explicit filter params override NLQ-parsed values — gives buyers precise control when AI interpretation is incorrect
- `openai` installed as explicit dependency — Phase 05-03 used dynamic `import('openai')` which webpack resolves at build time

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing openai package**
- **Found during:** Task 2 build verification
- **Issue:** `npm install openai` was never run; Phase 05-03 used dynamic `import('openai')` in embed-listing.ts and listing-recommendations.ts — webpack resolves dynamic imports at build time
- **Fix:** `npm install openai`
- **Files modified:** package.json, package-lock.json
- **Verification:** Build compiled successfully after install
- **Committed in:** b2350ba

**2. [Rule 1 - Bug] Fixed Zod v4 z.record() two-argument requirement**
- **Found during:** Task 2 build verification (TypeScript check phase)
- **Issue:** `z.record(z.unknown())` requires two arguments in Zod v4 — `z.record(keySchema, valueSchema)`
- **Fix:** Changed to `z.record(z.string(), z.unknown())` in buyer-events route
- **Files modified:** src/app/api/buyer-events/route.ts
- **Verification:** Build TypeScript check passed
- **Committed in:** b2350ba

**3. [Rule 1 - Bug] Fixed drizzle db.execute() return type for newer drizzle-orm**
- **Found during:** Task 2 build verification (TypeScript check phase)
- **Issue:** `result.rows` no longer exists on `RowList<Record<string, unknown>[]>` in updated drizzle-orm — the result is directly iterable
- **Fix:** Changed `result.rows as Array<...>` to `Array.from(result) as Array<...>`
- **Files modified:** src/services/agent/agent-dispatch.ts
- **Verification:** Build TypeScript check passed
- **Committed in:** b2350ba

---

**Total deviations:** 3 auto-fixed (1 blocking dependency, 2 pre-existing type bugs from Phase 05-03)
**Impact on plan:** All fixes required for build to pass. No scope creep — issues were in files from prior phases, not new code.

## Issues Encountered

- Build was failing before this plan's changes due to missing `openai` package and Zod v4/drizzle type errors from Phase 05-03 — fixed inline per deviation rules

## User Setup Required

None — no new external service configuration required. OPENAI_API_KEY (already required) is used by the NLQ parser at runtime.

## Next Phase Readiness

- NLQ search fully operational end-to-end via existing searchListings infrastructure
- Phase 05 plan 05 (if any) can rely on NlqSearchBar being present on /buyer/search
- Fair Housing civil rights attorney review of buyer matching algorithm still pending (pre-existing blocker from Phase 05 planning)

## Self-Check: PASSED

- FOUND: src/services/search/nlq-parser.ts
- FOUND: src/services/search/nlq-parser.test.ts
- FOUND: src/components/search/NlqSearchBar.tsx
- FOUND: .planning/phases/05-agent-for-hire-marketplace-buyer-matching/05-04-SUMMARY.md
- FOUND commit: 42c8da6 (feat(05-04): NLQ parser service with GPT-4o)
- FOUND commit: 5aae60c (feat(05-04): wire NLQ into search API and add NlqSearchBar component)
- FOUND commit: b2350ba (fix(05-04): install missing openai package and fix pre-existing Zod v4 and drizzle type errors)

---
*Phase: 05-agent-for-hire-marketplace-buyer-matching*
*Completed: 2026-03-16*
