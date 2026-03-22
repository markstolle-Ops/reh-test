---
phase: 1
slug: legal-framework-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` — Wave 0 (does not exist yet) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | — | smoke | `npx next build` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | ACCT-01 | E2E | `npx playwright test tests/auth/signup.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | ACCT-02 | E2E | `npx playwright test tests/auth/verify-email.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | ACCT-03 | E2E | `npx playwright test tests/auth/password-reset.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | ACCT-04 | E2E | `npx playwright test tests/auth/session-persistence.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | ACCT-05 | E2E | `npx playwright test tests/auth/role-dashboards.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | ACCT-06 | E2E+unit | `npx playwright test tests/auth/role-switch.spec.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | COST-01 | unit | `npx vitest run src/lib/calculator.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | COST-02 | unit | `npx vitest run src/lib/calculator.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | — | manual | Review legal taxonomy doc | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with React plugin
- [ ] `playwright.config.ts` — Playwright config with base URL, browser targets
- [ ] `src/lib/calculator.test.ts` — Unit tests for commission calculation logic (COST-01, COST-02)
- [ ] `tests/auth/signup.spec.ts` — E2E Clerk signup flow (ACCT-01)
- [ ] `tests/auth/verify-email.spec.ts` — Email verification (ACCT-02; Clerk test mode)
- [ ] `tests/auth/password-reset.spec.ts` — Password reset flow (ACCT-03)
- [ ] `tests/auth/session-persistence.spec.ts` — Refresh and verify session (ACCT-04)
- [ ] `tests/auth/role-dashboards.spec.ts` — Role-specific dashboard routing (ACCT-05)
- [ ] `tests/auth/role-switch.spec.ts` — Role switching and redirect (ACCT-06)
- [ ] `tests/fixtures/` — Clerk test users (buyer + seller) in Clerk test mode

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Legal taxonomy is correct | — | Requires attorney review | Review 01-04 output docs against state bar guidelines |
| State classifications accurate | — | Requires legal expertise | Cross-reference attorney/FSBO classifications with state statutes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
