---
phase: 02-listing-creation-ai-core
plan: 06
subsystem: ai, chat, rag
tags: [ai-sdk-v6, pgvector, rag, useChat, streaming, tool-calling, upl-guardrails, chatbot]

# Dependency graph
requires:
  - phase: 02-listing-creation-ai-core
    plan: 01
    provides: knowledgeChunks table, showingRequests table, db singleton
  - phase: 02-listing-creation-ai-core
    plan: 03
    provides: listing detail page with chat-widget-slot placeholder

provides:
  - RAG service (queryKnowledgeBase) with pgvector cosine similarity search
  - CHATBOT_SYSTEM_PROMPT with full UPL guardrails (PERMITTED/PROHIBITED/DISCLAIMER/ATTORNEY_REFERRAL)
  - pgvector SQL migration (extension, embedding column, HNSW index, match_documents function)
  - Knowledge seeding script for legal docs
  - POST /api/chat streaming endpoint with scheduleShowing tool
  - ChatWidget floating component with @ai-sdk/react v6 useChat
  - ChatWidget integrated into listing detail page

affects:
  - All Phase 3+ AI features — chat architecture and UPL guardrail pattern established

# Tech tracking
tech-stack:
  added:
    - "@ai-sdk/react (v1.x) — React hooks for AI SDK v6"
    - "supabase/migrations/001_pgvector.sql — pgvector extension and match_documents function"
  patterns:
    - "AI SDK v6: tool() uses inputSchema (not parameters) for tool definition"
    - "AI SDK v6: streamText result uses toUIMessageStreamResponse() (not toDataStreamResponse())"
    - "AI SDK v6: useChat requires DefaultChatTransport for API/body config (no direct api/body props)"
    - "AI SDK v6: useChat returns sendMessage({ text }) + status (not input/handleSubmit)"
    - "AI SDK v6: tool invocation state is output-available (not result)"
    - "AI SDK v6: maxOutputTokens (not maxTokens) for generateText/streamText"
    - "RAG pattern: embed query -> call match_documents pgvector fn -> concatenate top-5 chunks"
    - "System prompt pattern: context injected via CHATBOT_SYSTEM_PROMPT() function call before LLM"
    - "ChatWidget: owns its own input state, calls sendMessage() on form submit"

key-files:
  created:
    - supabase/migrations/001_pgvector.sql
    - src/services/chat/rag.ts
    - src/services/chat/rag.test.ts
    - src/ai/prompts/chatbot-system.ts
    - src/ai/prompts/chatbot-system.test.ts
    - src/ai/rag/seed/seed-knowledge.ts
    - src/app/api/chat/route.ts
    - src/app/api/chat/route.test.ts
    - src/components/chatbot/ChatWidget.tsx
  modified:
    - src/app/listings/[id]/page.tsx (replaced chat-widget-slot div with ChatWidget)
    - package.json (added @ai-sdk/react)
    - src/services/chat/rag.ts (KnowledgeChunkRow extends Record<string, unknown>)
    - src/components/neighborhood/MarketTrends.tsx (Recharts formatter type fix)
    - src/inngest/functions/generate-description.ts (maxTokens -> maxOutputTokens)

key-decisions:
  - "AI SDK v6 uses inputSchema (not parameters) in tool() — breaking change from v4/v5 docs"
  - "AI SDK v6 useChat requires DefaultChatTransport for API URL/body (not direct props)"
  - "pgvector embedding column added via raw SQL migration (not Drizzle schema) — vector type not natively supported"
  - "ChatWidget uses @ai-sdk/react (separate package) not ai/react (path doesn't exist in v6)"
  - "scheduleShowing auth check is inside tool execute (not route-level) — allows public read chat"

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 02 Plan 06: RAG-Powered AI Chatbot Summary

**pgvector knowledge base, RAG retrieval service, streaming chat API (gpt-4o-mini) with scheduleShowing tool call, UPL-guardrailed system prompt, and floating ChatWidget integrated into listing pages — all 17 tests passing, build clean.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T17:52:37Z
- **Completed:** 2026-03-16T18:05:07Z
- **Tasks:** 2
- **Files modified:** 9 created, 5 modified

## Accomplishments

- pgvector SQL migration: `CREATE EXTENSION IF NOT EXISTS vector`, embedding column, HNSW index, `match_documents` cosine similarity function with optional state filter
- `queryKnowledgeBase` service: embeds query with `text-embedding-3-small`, calls `match_documents` (threshold 0.7, top 5), returns concatenated content; graceful degradation (empty string + console.warn) if embed fails
- `CHATBOT_SYSTEM_PROMPT` function: full UPL guardrails from ai-guidance-taxonomy.md — PERMITTED/PROHIBITED sections, mandatory disclaimer text, 10 attorney referral trigger patterns, state-specific referral message
- Knowledge seeding script at `src/ai/rag/seed/seed-knowledge.ts` — chunks legal docs at ~500 tokens with overlap, skips already-seeded sources
- `POST /api/chat`: extracts last user message, calls `queryKnowledgeBase`, builds system prompt, streams with `gpt-4o-mini`; `scheduleShowing` tool inserts into `showingRequests` with auth check
- `ChatWidget`: floating button (bottom-right fixed), expands to 360x480 chat panel, handles `sendMessage` + loading states, tool result display for showing confirmations
- Listing detail page: `chat-widget-slot` placeholder replaced with `<ChatWidget>` (active/pending only)

## Task Commits

Each task was committed atomically:

1. **Task 1: RAG service + chatbot system prompt + pgvector migration** - `9401819` (feat)
2. **Task 2: Chat API route with scheduleShowing tool + ChatWidget + listing page integration** - `8fdf083` (feat)

_Both tasks used TDD flow (test RED → implement GREEN)_

## Files Created/Modified

- `supabase/migrations/001_pgvector.sql` — pgvector extension, embedding column, HNSW index, match_documents function
- `src/services/chat/rag.ts` — queryKnowledgeBase with embed + pgvector cosine search
- `src/services/chat/rag.test.ts` — 4 tests (embed call, state filter, empty result, graceful degradation)
- `src/ai/prompts/chatbot-system.ts` — CHATBOT_SYSTEM_PROMPT with full UPL guardrails
- `src/ai/prompts/chatbot-system.test.ts` — 7 tests (disclaimer, PROHIBITED, attorney referral, RAG context injection)
- `src/ai/rag/seed/seed-knowledge.ts` — knowledge seeding script for 3 legal docs
- `src/app/api/chat/route.ts` — POST handler with RAG + streamText + scheduleShowing tool
- `src/app/api/chat/route.test.ts` — 6 tests (streaming, tool definition, DB insert, auth check)
- `src/components/chatbot/ChatWidget.tsx` — floating chat widget with v6 useChat
- `src/app/listings/[id]/page.tsx` — ChatWidget integration (active/pending guard)
- `package.json` — added @ai-sdk/react dependency

## Decisions Made

- AI SDK v6 uses `inputSchema` in `tool()` (not `parameters`) — plan was written for v4/v5 conventions
- `useChat` in `@ai-sdk/react` v6 requires explicit `DefaultChatTransport` for API URL and body configuration (no direct `api`/`body` props)
- `toDataStreamResponse()` is now `toUIMessageStreamResponse()` in AI SDK v6
- `ChatWidget` manages its own input state and calls `sendMessage({ text })` (v6 API; no `handleSubmit`/`input` props)
- `maxTokens` renamed to `maxOutputTokens` in AI SDK v6 across all text generation calls
- pgvector embedding column added via raw SQL migration (not Drizzle schema) — vector type unsupported by Drizzle natively

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AI SDK v6 test mock missing `tool` export**
- **Found during:** Task 2 (route test RED → GREEN)
- **Issue:** `vi.mock("ai")` only mocked `streamText`, missing `tool` export — route threw "No tool export is defined" at test runtime
- **Fix:** Added `tool: vi.fn((config) => config)` to the `ai` mock (identity pass-through so `execute` is accessible)
- **Files modified:** `src/app/api/chat/route.test.ts`
- **Commit:** `8fdf083`

**2. [Rule 1 - Bug] AI SDK v6 @ai-sdk/openai mock missing `.embedding()` method**
- **Found during:** Task 1 (RAG test GREEN attempt)
- **Issue:** Mock returned `openai = vi.fn(() => {...})` but `openai.embedding` was undefined — RAG service calls `openai.embedding("text-embedding-3-small")`
- **Fix:** Added `openaiMock.embedding = vi.fn(() => ({ modelId: "text-embedding-3-small" }))` to mock
- **Files modified:** `src/services/chat/rag.test.ts`
- **Commit:** `9401819`

**3. [Rule 3 - Blocking] `ai/react` path does not exist in AI SDK v6**
- **Found during:** Task 2 (build verification)
- **Issue:** `useChat` moved to `@ai-sdk/react` package — `ai/react` path throws `Module not found` at build time
- **Fix:** Installed `@ai-sdk/react`, updated import from `ai/react` to `@ai-sdk/react`
- **Files modified:** `src/components/chatbot/ChatWidget.tsx`, `package.json`
- **Commit:** `8fdf083`

**4. [Rule 1 - Bug] AI SDK v6 `useChat` API change — `api`/`body` props removed**
- **Found during:** Task 2 (build verification)
- **Issue:** `useChat({ api, body })` no longer valid — v6 requires `transport: new DefaultChatTransport({ api, body })`
- **Fix:** Imported `DefaultChatTransport` from `ai`, updated ChatWidget to use explicit transport
- **Files modified:** `src/components/chatbot/ChatWidget.tsx`
- **Commit:** `8fdf083`

**5. [Rule 1 - Bug] AI SDK v6 `streamText` result method rename**
- **Found during:** Task 2 (build verification)
- **Issue:** `result.toDataStreamResponse()` no longer exists — renamed to `toUIMessageStreamResponse()`
- **Fix:** Updated route and test mock to use `toUIMessageStreamResponse()`
- **Files modified:** `src/app/api/chat/route.ts`, `src/app/api/chat/route.test.ts`
- **Commit:** `8fdf083`

**6. [Rule 1 - Bug] AI SDK v6 `tool()` uses `inputSchema` not `parameters`**
- **Found during:** Task 2 (build verification)
- **Issue:** TypeScript error — `parameters` is not a known property in v6 tool definition
- **Fix:** Changed `parameters: z.object(...)` to `inputSchema: z.object(...)` in route
- **Files modified:** `src/app/api/chat/route.ts`
- **Commit:** `8fdf083`

**7. [Rule 1 - Bug] Pre-existing MarketTrends Recharts formatter type error**
- **Found during:** Task 2 (build verification)
- **Issue:** `(value: number, name: string)` formatter signature incompatible with Recharts v3 `Formatter<ValueType, NameType>` — `value` and `name` can be `undefined` in the generic type
- **Fix:** Removed explicit types, used `Number(value ?? 0)` and `String(name)` for safe coercion
- **Files modified:** `src/components/neighborhood/MarketTrends.tsx`
- **Commit:** `8fdf083`

**8. [Rule 1 - Bug] Pre-existing generate-description `maxTokens` (AI SDK v6 renamed)**
- **Found during:** Task 2 (build verification)
- **Issue:** AI SDK v6 renamed `maxTokens` to `maxOutputTokens` — TypeScript build error
- **Fix:** Renamed `maxTokens: 800` to `maxOutputTokens: 800`
- **Files modified:** `src/inngest/functions/generate-description.ts`
- **Commit:** `8fdf083`

**9. [Rule 1 - Bug] `KnowledgeChunkRow` missing index signature for `db.execute<T>` constraint**
- **Found during:** Task 2 (build verification)
- **Issue:** Drizzle's `db.execute<T>` requires `T extends Record<string, unknown>` — plain interface fails
- **Fix:** Changed `interface KnowledgeChunkRow` to `interface KnowledgeChunkRow extends Record<string, unknown>`
- **Files modified:** `src/services/chat/rag.ts`
- **Commit:** `8fdf083`

---

**Total deviations:** 9 auto-fixed (all Rule 1 bugs — AI SDK v6 breaking changes from plan assumptions + pre-existing issues)
**Impact on plan:** All bugs were AI SDK v6 API surface changes. No architectural scope changes. Plan objectives fully met.

## User Setup Required

New environment variable required before chatbot is functional:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Required for embed() and streamText() calls — already in .env.example |

One-time setup required before chatbot can answer questions:
1. Run pgvector migration in Supabase SQL editor: `supabase/migrations/001_pgvector.sql`
2. Seed knowledge base: `npx tsx src/ai/rag/seed/seed-knowledge.ts`

## Next Phase Readiness

- Chat API at `/api/chat` is ready for any Phase 3+ feature that needs conversational AI
- UPL guardrail pattern (CHATBOT_SYSTEM_PROMPT) established — reuse for future AI features
- Showing request flow complete (chat -> tool call -> DB insert -> seller notification needed in Phase 3)

## Self-Check: PASSED

All 9 required files verified present. Both task commits (9401819, 8fdf083) confirmed in git log. All 17 tests passing. Build succeeds with clean output showing `/api/chat` route compiled.

---
*Phase: 02-listing-creation-ai-core*
*Completed: 2026-03-16*
