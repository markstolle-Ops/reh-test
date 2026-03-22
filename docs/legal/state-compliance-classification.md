# State Compliance Classification — 10 Launch States

> **Review Status:** DRAFT — Requires attorney review for each classified state before production use. Classifications are based on public legal research and should not be treated as authoritative legal advice.

This document classifies the 10 RealEstateHunter launch states by their real estate closing requirements and FSBO (For Sale By Owner) transaction rules. It is used by Phase 4 (Transaction Flow engine) to determine required workflow steps, mandatory disclosures, and attorney routing logic.

---

## Closing Type Definitions

| Closing Type | Definition |
|---|---|
| **title-company** | Closing is conducted by a title/escrow company. An attorney is not required by state law, though buyers and sellers may optionally hire one. |
| **attorney-required** | State law requires a licensed real estate attorney to be present at closing and/or to perform certain closing acts (e.g., title examination, deed preparation). |
| **customary-attorney** | An attorney is not legally mandated but attorney involvement is strongly customary and expected in the state's real estate market. |

---

## Launch State Classification Table

| State | Code | Closing Type | Attorney Required by Law | Agent Required | FSBO Allowed | Notes |
|---|---|---|---|---|---|---|
| California | CA | title-company | No | No | Yes | Escrow companies conduct closings; FSBO is common. Seller must provide Transfer Disclosure Statement (TDS). |
| Texas | TX | title-company | No | No | Yes | Title companies handle closings. FSBO permitted; seller must provide Seller's Disclosure Notice. |
| Florida | FL | title-company | No | No | Yes | Either title company or attorney may close; attorney not required. FSBO permitted with proper disclosures. |
| New York | NY | customary-attorney | No (customary) | No | Technically yes | Attorney involvement at closing is nearly universal and strongly expected. Platform workflows must prompt users to retain NY real estate counsel. |
| Georgia | GA | attorney-required | Yes | No | Yes | Georgia law requires a licensed attorney to perform the title examination and conduct the closing. Platform must route GA transactions to a closing attorney. |
| North Carolina | NC | attorney-required | Yes | No | Yes | NC law requires a licensed attorney to supervise closing and disburse funds. All closings must be handled by a NC-licensed real estate attorney. |
| Arizona | AZ | title-company | No | No | Yes | Title/escrow companies conduct closings; no attorney requirement. FSBO permitted. |
| Ohio | OH | title-company | No | No | Yes | Title companies or attorneys may close; attorney not legally required. FSBO permitted with proper disclosures. |
| Pennsylvania | PA | title-company | No | No | Yes | Title companies typically close. Attorney not required. FSBO permitted; no mandatory seller disclosure form but required to disclose known defects. |
| Illinois | IL | customary-attorney | No (customary) | No | Yes | Attorney involvement is strongly customary (attorney review period is standard in IL contracts). Platform should prompt IL users to engage real estate counsel. |

---

## Workflow Implications for Phase 4

These classifications drive the transaction workflow engine in Phase 4. The following logic applies:

### attorney-required states (GA, NC)
- The transaction checklist must include: "Hire a licensed closing attorney"
- The AI assistant must not suggest that users can close without an attorney
- The platform must surface attorney referral at the time an offer is accepted
- Attorney fee ($1,500 estimate) is always shown in the cost calculator for these states

### customary-attorney states (NY, IL)
- The transaction checklist should include a recommended step: "Consider retaining a real estate attorney (strongly recommended in [State])"
- The AI assistant should recommend attorney involvement but not block the workflow
- Attorney fee ($1,500 estimate) is shown in the cost calculator as an expected cost
- For NY specifically: attorney review period clauses may appear in contracts — platform must accommodate

### title-company states (CA, TX, FL, AZ, OH, PA)
- Closing is handled by escrow/title company
- Attorney referral is available on request but not prompted by default
- Attorney fee shows as $0 / N/A in the cost calculator
- Platform may partner with title companies in these states for integrated closing services (Phase 4)

---

## FSBO Legal Considerations by State

All 10 launch states permit FSBO transactions. However, disclosure obligations vary:

| State | Key Seller Disclosure Requirement |
|---|---|
| CA | Transfer Disclosure Statement (TDS) — mandatory for most residential sales |
| TX | Seller's Disclosure Notice — mandatory for residential sales |
| FL | Must disclose known material defects; no single mandated form |
| NY | Property Condition Disclosure Statement (or $500 credit to buyer in lieu) |
| GA | Seller's Property Disclosure Statement — recommended; no single mandatory form |
| NC | Residential Property and Owners' Association Disclosure Statement — mandatory |
| AZ | Disclosure statement required; SPDS (Seller's Property Disclosure Statement) standard |
| OH | Residential Property Disclosure Form — mandatory for most sales |
| PA | Seller's Property Disclosure Statement — mandatory |
| IL | Residential Real Property Disclosure Report — mandatory |

---

## Data Sources and Review Requirements

The classifications in this table are based on:
- State statutes and bar association guidance (current as of research date)
- RealEstateHunter Phase 1 legal research (01-RESEARCH.md)

Before production use in any state, this classification must be reviewed and confirmed by:
- [ ] California — real estate attorney
- [ ] Texas — real estate attorney
- [ ] Florida — real estate attorney
- [ ] New York — real estate attorney
- [ ] Georgia — real estate attorney
- [ ] North Carolina — real estate attorney
- [ ] Arizona — real estate attorney
- [ ] Ohio — real estate attorney
- [ ] Pennsylvania — real estate attorney
- [ ] Illinois — real estate attorney

---

*Last updated: 2026-03-16*
*Phase: 01-legal-framework-foundation*
*Status: DRAFT — Not reviewed by counsel*
