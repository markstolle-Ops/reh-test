---
phase: 2
slug: listing-creation-ai-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit/integration) + Playwright 1.58 (E2E) |
| **Config file** | `vitest.config.ts` — EXISTS from Phase 1 |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test tests/listings/ tests/chatbot/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LIST-01 | unit | `npx vitest run src/services/listing/create.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | LIST-02 | unit | `npx vitest run src/services/listing/photos.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | LIST-05 | unit | `npx vitest run src/services/listing/update.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | LIST-07 | E2E | `npx playwright test tests/listings/listing-detail.spec.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 3 | LIST-03 | unit | `npx vitest run src/inngest/functions/generate-description.test.ts` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 3 | DATA-01 | unit | `npx vitest run src/services/avm/housecanary.test.ts` | ❌ W0 | ⬜ pending |
| 02-06-01 | 06 | 4 | CHAT-01,05 | unit | `npx vitest run src/services/chat/rag.test.ts` | ❌ W0 | ⬜ pending |
| 02-06-02 | 06 | 4 | CHAT-04 | unit | `npx vitest run src/ai/prompts/chatbot-system.test.ts` | ❌ W0 | ⬜ pending |
| 02-07-01 | 07 | 4 | COST-03 | unit | `npx vitest run src/components/fees/FeeBreakdown.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/listing/create.test.ts` — listing creation validation (LIST-01, LIST-08)
- [ ] `src/services/listing/photos.test.ts` — photo ordering logic (LIST-02)
- [ ] `src/services/listing/update.test.ts` — status transitions (LIST-05, LIST-06)
- [ ] `src/inngest/functions/generate-description.test.ts` — mock inngest + AI SDK (LIST-03)
- [ ] `src/services/avm/housecanary.test.ts` — AVM stub adapter (DATA-01)
- [ ] `src/services/chat/rag.test.ts` — pgvector query with mock (CHAT-05)
- [ ] `src/ai/prompts/chatbot-system.test.ts` — disclaimer presence (CHAT-04)
- [ ] `src/app/api/chat/route.test.ts` — tool call integration (CHAT-03)
- [ ] `src/components/fees/FeeBreakdown.test.tsx` — fee component (COST-03)
- [ ] `tests/listings/listing-detail.spec.ts` — gallery, chatbot, fee breakdown
- [ ] `tests/listings/edit-description.spec.ts` — AI draft edit
- [ ] `tests/listings/edit-listing.spec.ts` — edit after publish
- [ ] `tests/chatbot/chatbot-basic.spec.ts` — chat widget interaction

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI description quality | LIST-03 | Subjective quality assessment | Review 3 generated descriptions for MLS-quality prose |
| AVM accuracy vs market | DATA-01 | Requires real market data | Compare stub output format with expected HouseCanary schema |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
