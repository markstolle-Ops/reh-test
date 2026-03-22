# RESPA Compliance Framework

> **Review Status:** DRAFT — Requires RESPA specialist attorney review before platform launches.

This document analyzes the RealEstateHunter platform's compliance with the Real Estate Settlement Procedures Act (RESPA), 12 U.S.C. § 2601 et seq., as implemented by Regulation X (12 C.F.R. Part 1024), administered by the Consumer Financial Protection Bureau (CFPB). It covers the platform's fee structure, referral patterns, and operational practices.

---

## Overview of RESPA Scope

RESPA applies to "federally related mortgage loans" — purchase money mortgages on residential real estate (1–4 family dwellings) covered by federal insurance or guaranty, or made by federally regulated lenders. RESPA governs:
- Settlement service provider conduct (Section 8)
- Title insurance requirements (Section 9)
- Escrow account requirements (Section 10)
- Disclosure requirements (Loan Estimate, Closing Disclosure)

**Platform RESPA exposure is primarily in Sections 8 and 9.** The platform does not hold escrow accounts (Section 10 not applicable) and is not a lender (HUD-1/Closing Disclosure responsibilities limited).

---

## Section 8 Analysis — Kickbacks and Referral Fees

### What Section 8 Prohibits

RESPA Section 8 prohibits:
- **§ 8(a):** Any person giving or receiving a "fee, kickback, or thing of value" pursuant to an agreement or understanding that business involving a federally related mortgage loan will be referred to a particular person
- **§ 8(b):** Any person giving or accepting any portion, split, or percentage of any charge made for a settlement service, other than for services actually performed
- **§ 8(c)(2):** Payments for goods or services genuinely performed at fair market value are exempt

### How the Platform Fee Structure Avoids Section 8

**1. Flat subscription/technology fee**

The platform charges a flat fee for access to its tools and platform services. This fee is:
- Charged in advance, not contingent on transaction completion
- Compensation for technology services (tools, AI guidance, document management), not for referring users to any settlement service provider
- Not shared with any lender, title company, attorney, or other settlement service provider

**Result: Platform subscription fee does not constitute a RESPA referral fee because it is not contingent on the referral of settlement services business.**

**2. No transaction-contingent compensation**

The platform does not receive any fee from settlement service providers (title companies, lenders, escrow agents, attorneys) based on user referrals. Any referral to a title company, attorney, or other settlement service provider is:
- For informational purposes only
- Not compensated by the referred service provider
- Based on state requirement (e.g., attorney-required states) or user request, not platform arrangement

**Result: No Section 8(a) violation because there is no agreement or understanding to receive anything of value for referrals.**

**3. Pre-existing affiliates (if any)**

If the platform ever develops relationships with title companies, lenders, or other settlement service providers that include any form of compensation, value, or benefit (including co-marketing arrangements, data sharing, lead generation payments), those arrangements must be:
- Reviewed under the Affiliated Business Arrangement (AfBA) rules below
- Disclosed to users at the time of referral
- Reviewed by RESPA counsel before implementation

**CRITICAL: Any arrangement in which the platform receives value from a settlement service provider in connection with a user transaction must be reviewed by RESPA counsel before implementation.**

---

## Section 8(c)(4) — Affiliated Business Arrangements (AfBA)

### What an AfBA Is

An Affiliated Business Arrangement exists when:
1. A person in a position to refer settlement services has an ownership interest in, or has made a capital or credit contribution to, a settlement service provider; OR
2. The person regularly refers business to that provider

### Platform AfBA Exposure

**Current status:** The platform has no ownership interest in any settlement service provider (title company, escrow company, lender, attorney firm) and has no agreement to refer business in exchange for compensation.

**Future risk:** If the platform:
- Acquires an ownership interest in a title company (for Phase 4 integration)
- Enters a co-marketing arrangement with a title company or lender
- Creates a referral network where service providers pay to be listed or promoted

...then AfBA disclosure requirements apply.

### AfBA Disclosure Requirements (if triggered)

If an AfBA exists, RESPA requires:
1. Provide the AfBA disclosure at or before the time of referral (on paper or electronically)
2. The disclosure must: describe the business arrangement, the nature of the relationship between the referrer and provider, estimated charges for the settlement services
3. The referred party must not be required to use the referred provider
4. The only thing of value received by the referring party must be a return on ownership interest (not a referral fee)

**Disclosure template (if AfBA is established):**

```
AFFILIATED BUSINESS ARRANGEMENT DISCLOSURE

[Platform Name] has a business relationship with [Service Provider Name].
Because of this relationship, [Platform Name] may refer you to [Service Provider Name].
You are NOT required to use [Service Provider Name] as a condition of [settlement service].

[Description of the business arrangement and estimated charges]

Set forth below is the estimated charge or range of charges for the settlement services
listed. You are not required to use these providers.
```

---

## Section 9 Analysis — Seller-Required Title Insurance

### What Section 9 Prohibits

RESPA Section 9 prohibits a seller from requiring, as a condition of sale, that a buyer purchase title insurance from a particular title company. Violations are punishable by an amount equal to three times all charges made for the title insurance.

### Platform Compliance with Section 9

The platform does not:
- Recommend or require specific title companies as a condition of using the platform
- Structure any seller workflow that conditions the transaction on use of a specific title company
- Receive compensation from title companies for steering users to them

**Platform must not:**
- List only one title company option in any state without making clear that others are available and the user may choose freely
- Create any workflow that presents a specific title company as the only option for closing

**Implementation requirement:**
When the platform surfaces title company information or referrals (Phase 4), it must:
1. Present multiple options (or direct users to find their own)
2. Include language: "You are free to choose any licensed title company. The platform does not require you to use a specific provider."
3. Never condition platform service on the user selecting a particular title company

---

## Section 10 Analysis — Escrow Accounts

### What Section 10 Covers

RESPA Section 10 limits the amount servicers can require borrowers to deposit into escrow accounts for property taxes and insurance. It also requires servicers to provide annual escrow account statements.

### Platform Compliance with Section 10

**The platform does not hold, manage, or service escrow accounts.** All escrow is handled by:
- Title companies (title-company states: CA, TX, FL, AZ, OH, PA)
- Closing attorneys (attorney-required states: GA, NC)
- Bank-administered escrow (where applicable)

**Platform communication requirement:**
When discussing earnest money deposits, the platform must clearly communicate:
- The platform does not hold earnest money
- All deposits go directly to the escrow agent (title company or attorney)
- The platform has no access to, or control over, escrow funds

**Section 10 does not apply to the platform's current operations.** This section must be re-reviewed if the platform ever implements any form of escrow holding or transaction fund management.

---

## Platform Fee vs. Settlement Service Fee

### Is the Platform Fee a "Settlement Service" Under RESPA?

RESPA defines "settlement services" as including (but not limited to):
- Title searches and title examinations
- Title insurance
- Document preparation
- Attorney services
- Credit reports
- Appraisals
- Origination services

**Analysis:**
The platform's flat subscription fee is for technology tools access — not for any of the enumerated settlement services. Specifically:
- The fee is not for document preparation in connection with a specific loan transaction
- The fee is not for title search, title insurance, or closing services
- The fee is for a SAAS platform that provides educational AI guidance, process management tools, and document checklists

**However:** If the platform evolves to provide transaction-specific document preparation (e.g., preparing a purchase and sale agreement for a specific transaction), that service could be characterized as a settlement service. At that point, the platform fee structure must be re-reviewed.

**Current determination: Platform subscription fee is NOT a settlement service under RESPA.** This determination must be confirmed by RESPA counsel before launch.

---

## Per-State RESPA Equivalents

Several states have their own real estate settlement statutes that extend or modify federal RESPA requirements. Key states:

| State | State Law | Additional Requirements |
|-------|-----------|------------------------|
| CA | Cal. Bus. & Prof. Code § 10176 | Prohibits kickbacks, referral fees; generally consistent with federal RESPA but applies to all transactions (not just federally related loans) |
| TX | Tex. Ins. Code § 2502 | Texas Title Insurance Act; prohibits certain affiliated relationships and kickbacks in title insurance |
| FL | Fla. Stat. § 626.9641 | Florida Insurance Code anti-rebate provisions apply to title insurance |
| NY | N.Y. Ins. Law § 6409 | Anti-rebate provision; title insurance referrals subject to specific rules |
| GA | O.C.G.A. § 33-6-22 | Anti-rebate provisions for insurance (includes title insurance) |
| NC | N.C. Gen. Stat. § 58-33-85 | Anti-rebate rule; referral fees for title insurance prohibited |
| AZ | A.R.S. § 20-1264 | Anti-rebate rule applies to title insurance referrals |
| OH | O.R.C. § 3953.27 | Title insurance: prohibits kickbacks for referrals |
| PA | 40 Pa. C.S. § 910-2 | Title insurance anti-rebate; no kickbacks for referrals |
| IL | 215 ILCS 155/25 | Title Insurance Act; anti-rebate and anti-kickback provisions |

**Implementation note:** All 10 launch states have state-level anti-kickback and anti-referral-fee rules that apply to title insurance, regardless of whether the transaction involves a federally related mortgage loan. The platform's no-referral-fee policy must comply with both federal RESPA and the applicable state statutes in all 10 states.

---

## Compliance Checklist for Platform Launch

Before the platform launches in any state, the following RESPA-related items must be confirmed:

**Fee structure:**
- [ ] Platform subscription fee is confirmed as non-contingent on transaction completion
- [ ] Platform fee is not shared with any settlement service provider
- [ ] No revenue sharing agreement exists with any title company, lender, or attorney

**Referrals:**
- [ ] Platform referrals to title companies, attorneys, or lenders are informational only
- [ ] No compensation (including data, marketing value, or non-cash benefits) is received from referred providers
- [ ] If any compensation arrangement exists, AfBA disclosure review is complete

**Section 9 compliance:**
- [ ] No specific title company is required by platform in any state
- [ ] Multiple title company options are presented where applicable
- [ ] Disclosure language: "You are free to choose any licensed title company"

**Section 10:**
- [ ] Platform does not hold or manage escrow funds
- [ ] Platform communications clearly state funds go directly to escrow agent

**State equivalents:**
- [ ] California RESPA equivalent review complete
- [ ] Texas RESPA equivalent review complete
- [ ] Florida RESPA equivalent review complete
- [ ] New York RESPA equivalent review complete
- [ ] Georgia RESPA equivalent review complete
- [ ] North Carolina RESPA equivalent review complete
- [ ] Arizona RESPA equivalent review complete
- [ ] Ohio RESPA equivalent review complete
- [ ] Pennsylvania RESPA equivalent review complete
- [ ] Illinois RESPA equivalent review complete

---

## References

- 12 U.S.C. § 2601 et seq. (RESPA statute)
- 12 C.F.R. Part 1024 (Regulation X — CFPB implementation)
- CFPB RESPA guidance and enforcement actions (reference for interpretation)
- `docs/legal/state-compliance-classification.md` — state closing type classifications
- `docs/legal/broker-licensing-analysis.md` — platform model and broker structure analysis

---

*Last updated: 2026-03-16*
*Phase: 01-legal-framework-foundation*
*Status: DRAFT — Requires RESPA specialist attorney review before platform launches.*
