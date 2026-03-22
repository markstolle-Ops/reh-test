---
phase: 3
slug: buyer-discovery-disclosure-esignature
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit/integration) + Playwright 1.58 (E2E) |
| **Config file** | `vitest.config.ts` — EXISTS from Phase 1 |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SRCH-01,02 | unit | `npx vitest run src/services/search/search.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SRCH-06 | build | `npx next build 2>&1 \| tail -20` | N/A | ⬜ pending |
| 03-02-01 | 02 | 2 | SRCH-03,05 | unit | `npx vitest run src/services/search/saved.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | SRCH-04 | unit | `npx vitest run src/inngest/functions/match-saved-searches.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | DISC-01,02 | unit | `npx vitest run src/services/disclosure/forms.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 3 | DISC-03,04 | unit | `npx vitest run src/services/disclosure/ai-assist.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 4 | SIGN-01,02 | unit | `npx vitest run src/services/esign/signwell.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-02 | 05 | 4 | SIGN-03,04 | unit | `npx vitest run src/services/esign/signwell.test.ts` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `src/services/search/search.test.ts` — PostGIS search + filter tests (SRCH-01, SRCH-02)
- [ ] `src/services/search/saved.test.ts` — saved search CRUD + favorite tests (SRCH-04, SRCH-05)
- [ ] `src/inngest/functions/match-saved-searches.test.ts` — alert matching (SRCH-04)
- [ ] `src/services/disclosure/forms.test.ts` — form schema + completion (DISC-01, DISC-02)
- [ ] `src/services/disclosure/ai-assist.test.ts` — AI guidance for forms (DISC-03, DISC-04)
- [ ] `src/services/esign/signwell.test.ts` — SignWell adapter (SIGN-01-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map renders with markers | SRCH-03 | Mapbox GL requires browser | Open search page, verify map loads with listing pins |
| SignWell embedded signing | SIGN-01 | Requires live SignWell sandbox | Create test envelope, complete signing flow |
| Disclosure form legal accuracy | DISC-01 | Requires attorney review | Verify form fields match state requirements |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
