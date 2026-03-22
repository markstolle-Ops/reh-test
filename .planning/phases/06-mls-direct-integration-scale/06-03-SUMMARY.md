---
phase: 06-mls-direct-integration-scale
plan: "03"
subsystem: infra
tags: [redis, upstash, caching, search, reso, rag, performance]

# Dependency graph
requires:
  - phase: 06-01
    provides: RESO Web API OData client (fetchResoListings/fetchResoDelta)
  - phase: 03-buyer-discovery-disclosure-esignature
    provides: searchListings unified search service and NormalizedListing type
  - phase: 04-transaction-engine-state-compliance
    provides: streamTransactionGuide with queryKnowledgeBase RAG
provides:
  - Upstash Redis client with typed cacheGet/cacheSet/cacheWrap/buildCacheKey helpers
  - 60s Redis cache on all searchListings calls (search:* key namespace)
  - 5-minute Redis cache on all RESO API responses (reso:{boardId}:* key namespace)
  - 10-minute Redis cache on RAG context retrieval (rag:{stateCode}:* key namespace)
  - Graceful degradation — all caching silently skips when Redis env vars are absent
affects: [search, mls-sync, ai-agents, performance]

# Tech tracking
tech-stack:
  added: ["@upstash/redis (REST-based serverless Redis client)"]
  patterns:
    - "Lazy Redis singleton — no client created until env vars are present at call time"
    - "cacheWrap pattern — cache-aside with transparent fallback to source function"
    - "buildCacheKey — deterministic key from sorted JSON of params object"
    - "Fire-and-forget cache writes — result returned immediately, Redis write is async"

key-files:
  created:
    - src/lib/redis.ts
    - src/lib/redis.test.ts
  modified:
    - src/services/search/listings-search.ts
    - src/services/search/listings-search.test.ts
    - src/services/mls/reso-client.ts
    - src/ai/agents/transaction-guide.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Redis singleton resets per test via vi.resetModules() — module-level _redis caching requires module re-import between test cases when env vars change"
  - "Constructor mock for Redis requires plain function (not vi.fn().mockImplementation) — vi.fn() arrow returns are not valid constructors"
  - "cacheSet is fire-and-forget in cacheWrap — write failure must not block the response; .catch() used to suppress unhandled rejection"
  - "RESO delta sync results also cached — same 5-minute TTL via fetchResoListings wrapper"

patterns-established:
  - "All cache keys namespaced by subsystem: search:, reso:{boardId}:, rag:{stateCode}: — prevents cross-subsystem collisions"
  - "Test mocks for @/lib/redis use vi.mock with passthrough cacheWrap — existing tests unchanged, cache tests opt-in"

requirements-completed: [MLS-04]

# Metrics
duration: 92min
completed: 2026-03-17
---

# Phase 6 Plan 03: Redis Caching Layer Summary

**Upstash Redis caching added to search queries (60s TTL), RESO API responses (5min TTL), and RAG context (10min TTL) with complete graceful degradation when Redis is unavailable**

## Performance

- **Duration:** 92 min
- **Started:** 2026-03-17T22:07:33Z
- **Completed:** 2026-03-17T23:39:00Z
- **Tasks:** 1 (TDD: RED + GREEN commits)
- **Files modified:** 8

## Accomplishments

- Created `src/lib/redis.ts` — lazy Upstash Redis client with `cacheGet`, `cacheSet`, `cacheWrap`, and `buildCacheKey` exports; zero-throw when Redis is down
- Wrapped `searchListings` in `cacheWrap` with 60s TTL — repeated identical queries bypass DB entirely
- Wrapped `fetchResoListings` in `cacheWrap` with 5-minute TTL — reduces RESO API rate limit consumption during concurrent searches
- Cached RAG `queryKnowledgeBase` in `transaction-guide.ts` with 10-minute TTL — prevents duplicate OpenAI embedding calls per state+query pair
- 25 tests pass covering hit/miss/error/fallback/no-env-vars scenarios

## Task Commits

1. **TDD RED — failing tests** - `5455516` (test)
2. **TDD GREEN — implementation** - `16bdb76` (feat)

## Files Created/Modified

- `/Users/roybomb/Desktop/RealEstateHunter/src/lib/redis.ts` — Upstash Redis client with lazy init + cacheGet/cacheSet/cacheWrap/buildCacheKey
- `/Users/roybomb/Desktop/RealEstateHunter/src/lib/redis.test.ts` — 14 tests: constructor mock, hit/miss/error/no-env-vars per helper
- `/Users/roybomb/Desktop/RealEstateHunter/src/services/search/listings-search.ts` — wrapped DB queries in cacheWrap(60s)
- `/Users/roybomb/Desktop/RealEstateHunter/src/services/search/listings-search.test.ts` — added Redis mock + 3 cache integration tests
- `/Users/roybomb/Desktop/RealEstateHunter/src/services/mls/reso-client.ts` — wrapped RESO fetch in cacheWrap(300s)
- `/Users/roybomb/Desktop/RealEstateHunter/src/ai/agents/transaction-guide.ts` — RAG context call wrapped in cacheWrap(600s)
- `package.json` / `package-lock.json` — @upstash/redis added

## Decisions Made

- **Redis singleton + vi.resetModules():** The module-level `_redis` variable is cached for performance but prevents env var changes from taking effect in tests. Fixed by calling `vi.resetModules()` in `beforeEach` and re-importing the module dynamically per test.
- **Constructor mock pattern:** `vi.fn().mockImplementation(() => ({ get, set }))` is not a valid constructor. Used a plain `function RedisMock() { return { get, set } }` declaration inside the `vi.mock` factory instead.
- **Fire-and-forget cache writes:** `cacheSet` in `cacheWrap` uses `.catch(() => {})` to avoid unhandled rejection warnings when Redis write fails after a cache miss. The result is returned to the caller immediately.
- **RESO delta caching:** `fetchResoDelta` delegates to `fetchResoListings` with a filter param — caching is applied automatically at the `fetchResoListings` layer without duplication.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Two test setup issues required iterative fixes (both Rule 1 / self-correcting):

1. **Constructor mock**: `vi.fn().mockImplementation()` arrow functions cannot be used with `new` — fixed with plain `function RedisMock()` in mock factory.
2. **Singleton isolation**: Module-level `_redis` persisted across tests — fixed with `vi.resetModules()` + dynamic import per test describe group.

Both issues are consistent with established project patterns (see STATE.md: "vi.mock factory must use vi.fn() inline due to Vitest hoisting behavior").

## User Setup Required

To enable Redis caching in production, add to `.env.local`:

```
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

The app runs without Redis — caching is a performance optimization. Without these vars, all cache operations silently no-op and the app falls through to DB/API calls.

## Next Phase Readiness

- Redis caching layer complete — search latency reduced for repeated queries
- `cacheWrap` and `buildCacheKey` available for any future service that needs caching
- Upstash Redis credentials still needed for production deployment

---
*Phase: 06-mls-direct-integration-scale*
*Completed: 2026-03-17*
