# Broker Licensing Analysis — 10 Launch States

> **Review Status:** DRAFT — Requires review by real estate attorneys licensed in each analyzed state. Do not treat as legal advice.

This document analyzes whether the RealEstateHunter platform model triggers broker licensing requirements in each of the 10 launch states. The platform model is: flat-fee tools + AI guidance + document management, with no direct agent representation and no negotiation services on behalf of a party.

---

## Platform Model Description

RealEstateHunter operates as a technology platform that provides:
- AI-powered transaction guidance (educational, process-based — see ai-guidance-taxonomy.md)
- Document preparation tools and checklists
- MLS listing access for buyers (via broker partner middleware)
- FSBO listing tools for sellers
- Cost calculators and market data

The platform does **not**:
- Represent buyers or sellers as an agent
- Negotiate on behalf of any party
- Prepare contracts for specific transactions (provides templates only)
- Receive compensation contingent on transaction completion

See `docs/legal/state-compliance-classification.md` for per-state closing type classification.

---

## Summary Table — All 10 Launch States

| State | Risk Level | Platform Model Triggers Licensing? | Mitigation Required |
|-------|-----------|-------------------------------------|---------------------|
| CA | MEDIUM | Possibly — broad "acts" definition | Partner broker for MLS/offer submission |
| TX | LOW | No — FSBO tools + flat fee unlikely to trigger | Disclaim no agency; flat-fee model |
| FL | MEDIUM | Possibly — "transaction broker" standard | Partner broker or designated broker |
| NY | HIGH | Likely — AI guidance scope may cross into brokerage | Partner broker required |
| GA | MEDIUM | Possibly — attorney-required closing reduces but does not eliminate risk | Partner broker for MLS access |
| NC | MEDIUM | Possibly — attorney-required state; NC has broad broker-in-charge rules | Partner broker for MLS access |
| AZ | LOW | No — FSBO tools + flat fee unlikely to trigger | Disclaim no agency; flat-fee model |
| OH | LOW | No — FSBO tools + flat fee unlikely to trigger | Disclaim no agency; flat-fee model |
| PA | LOW | No — FSBO tools + flat fee unlikely to trigger | Disclaim no agency; flat-fee model |
| IL | MEDIUM | Possibly — AI guidance could be characterized as broker activity | Partner broker for MLS access |

---

## Per-State Analysis

### California (CA)

**Key statute:** Cal. Bus. & Prof. Code §§ 10130–10139.5

**Analysis:**
California's broker licensing law is broad. Any person who, for compensation, performs any of the following "acts" must hold a broker license:
- Sells or offers to sell real property
- Buys or offers to buy real property on behalf of another
- Solicits prospective sellers or buyers of real property
- Lists real property for sale (critically: if listing involves any compensation tied to the transaction)

The platform's FSBO listing tool and AI guidance features present the most risk. California courts and the DRE have taken expansive views of what constitutes a "broker act." Specifically:
- Providing AI guidance on negotiation strategy (even framed educationally) may constitute "soliciting" or "advising" in a compensated capacity.
- Flat-fee model with no transaction-contingent compensation reduces risk substantially.
- MLS access (IDX/broker partner middleware) must be structured through a licensed broker — the platform cannot provide direct MLS access without a license.

**Mitigation (MEDIUM risk):**
- Structure MLS listing submission through a licensed California broker partner
- Ensure all AI responses stay within ai-guidance-taxonomy.md Permitted zone
- Flat fee must be characterized as a technology/tools fee, not a real estate service fee
- Do not take any action "on behalf of" a buyer or seller

---

### Texas (TX)

**Key statute:** Tex. Occ. Code § 1101.002

**Analysis:**
Texas defines broker activity as acting for another for compensation in connection with a real estate transaction. The critical element is "acting for another" — a platform providing tools for users to act for themselves does not trigger licensing.

Texas FSBO is well-established. The Texas Real Estate Commission (TREC) distinguishes between:
- Licensed activity: Representing a client in negotiations, preparing transaction-specific contracts (requires license)
- Unlicensed activity: Providing information, forms, and educational tools for FSBO sellers (does not require license)

Texas also has a "legal forms exception" — using standard TREC forms without modification for the user's own transaction is not unauthorized practice.

**Mitigation (LOW risk):**
- Maintain clear no-agency disclaimer
- Do not assist with contract negotiation or preparation beyond providing standard TREC forms
- Ensure flat fee is clearly a technology subscription fee
- MLS access requires licensed broker middleware (already planned via SimplyRETS/iHomeFinder)

---

### Florida (FL)

**Key statute:** Fla. Stat. § 475.01 et seq.

**Analysis:**
Florida's real estate licensing law covers "real estate services," defined broadly to include buying, selling, exchanging, auctioning, or leasing real property for another for compensation. Florida also has a unique "transaction broker" standard — most licensees in Florida operate as transaction brokers (limited representation) rather than fiduciaries.

The AI guidance features present moderate risk in Florida because:
- Florida's definition of "real estate services" is broad
- Providing specific guidance on offer amounts or negotiation terms could be characterized as acting as a transaction broker
- Florida does not have a clear "tools and information only" exemption equivalent to Texas

**Mitigation (MEDIUM risk):**
- Partner with licensed Florida real estate broker for any MLS-related functionality
- Ensure AI guidance stays strictly in the "educational/process" safe harbor
- Consider designated broker model for Florida to provide clear regulatory cover
- Flat fee structure must not be tied to transaction completion

---

### New York (NY)

**Key statute:** N.Y. Real Prop. Law § 440 et seq.

**Analysis:**
New York has one of the most demanding real estate licensing frameworks in the country. The definition of a "real estate broker" includes any person who:
- Negotiates or attempts to negotiate a real estate transaction for another
- Offers or attempts to offer real property for sale on behalf of another
- Provides guidance or advice in connection with a real estate transaction for compensation

New York is HIGH risk because:
1. Attorney involvement is customary (NY, IL are customary-attorney states per state-compliance-classification.md)
2. NY's courts have interpreted "real estate broker" expansively
3. The New York Real Estate Board and the NY DOS (Department of State) actively enforce licensing requirements
4. AI guidance, even educational, provided in the context of a specific NY transaction could be characterized as unlicensed broker activity
5. MLS access in NY requires affiliation with a licensed broker

**Mitigation (HIGH risk — partner broker required):**
- Partner broker model is required in New York, not optional
- All NY MLS listing functionality must route through a licensed NY broker
- AI guidance must be gated: NY users should receive enhanced disclaimers
- Consider designated broker for NY as a higher-protection structure
- Attorney referral must be surfaced prominently for NY users (supports customary-attorney workflow)

---

### Georgia (GA)

**Key statute:** O.C.G.A. § 43-40-1 et seq.

**Analysis:**
Georgia requires a real estate license for any person who, for compensation, performs broker acts including selling, buying, negotiating, or aiding in completing real estate transactions. However, Georgia's attorney-required closing law (O.C.G.A. § 15-19-52) means that a licensed attorney handles the closing in all GA transactions — this reduces (but does not eliminate) broker licensing exposure.

Platform risk areas:
- FSBO listing tool: Lower risk if no compensation tied to transaction
- MLS access: Requires licensed broker (as in all states)
- AI guidance on GA-specific contract terms: MEDIUM risk — GA contracts have specific provisions (GAMLS standard forms) that the AI should not interpret

**Mitigation (MEDIUM risk):**
- Broker partner for MLS access
- Surface attorney routing early in GA workflows (required for closing; see state-compliance-classification.md)
- AI guidance must route GA-specific legal questions to attorney referral
- Flat fee structure mitigates compensation-contingent licensing trigger

---

### North Carolina (NC)

**Key statute:** N.C. Gen. Stat. § 93A-1 et seq.

**Analysis:**
North Carolina has a broad real estate licensing statute that applies to any person who, for compensation, performs real estate brokerage services. NC's Real Estate Commission (NCREC) actively enforces these requirements.

Key NC-specific factors:
- NC is attorney-required for closing (like GA): attorney must supervise closing and disburse funds
- NC has a "broker-in-charge" (BIC) rule: every real estate office must have a BIC with specific credentials
- NC distinguishes between "provisional" and "full" broker licenses
- NC courts have found unlicensed activity in cases involving advisory services, even without direct representation

**Mitigation (MEDIUM risk):**
- Broker partner for MLS access; ensure partner has valid BIC designation in NC
- Attorney routing must be surfaced at or before offer acceptance in NC workflows
- AI guidance must be particularly conservative in NC — any interpretation of NC-specific contract language (e.g., NC Offer to Purchase and Contract form) must route to attorney referral
- Flat fee structure mitigates compensation trigger

---

### Arizona (AZ)

**Key statute:** A.R.S. § 32-2101 et seq.

**Analysis:**
Arizona's broker licensing statute applies to persons who, for compensation, act as a broker or salesperson in connection with real estate transactions. Arizona has a relatively clear distinction between:
- Licensed activities: Acting for another in buying/selling/negotiating real estate
- Unlicensed activities: Providing information, educational content, and tools for FSBO use

Arizona's strong FSBO culture and title company closing model (no attorney required) make the risk profile lower than NY or FL.

**Mitigation (LOW risk):**
- Maintain clear no-agency disclaimer
- MLS access through licensed AZ broker (required for all MLS access)
- Flat fee structure clearly as technology subscription
- AI guidance must stay within educational safe harbor

---

### Ohio (OH)

**Key statute:** O.R.C. § 4735.01 et seq.

**Analysis:**
Ohio's real estate licensing statute is relatively standard — it applies to persons performing broker acts for another for compensation. Ohio has a reasonably clear distinction between licensed real estate activity and providing information and tools.

Ohio-specific considerations:
- Ohio requires a broker's license to "list" or offer to "list" property for sale — however, providing a FSBO platform where the seller lists their own property is distinguishable from a licensee listing it for them
- Ohio's Real Estate Commission has issued guidance distinguishing flat-fee internet listing services (which may require a license) from pure technology tools
- If the platform assists a seller in creating their listing (even a FSBO listing), Ohio may characterize this as "listing" activity

**Mitigation (LOW risk with caveats):**
- Ensure FSBO listing tool is clearly user-driven (seller creates their own listing, platform provides tools)
- MLS access through licensed OH broker
- Platform must not characterize its role as "listing" the property
- Flat fee must be clearly a technology/tools fee

---

### Pennsylvania (PA)

**Key statute:** 63 Pa. C.S. § 455.101 et seq.

**Analysis:**
Pennsylvania's Real Estate Licensing and Registration Act (RELRA) requires a license for persons acting as brokers, salespersons, or cemetery brokers in connection with real estate transactions. Pennsylvania has a broad definition but courts have focused on the "for another" element.

Pennsylvania-specific considerations:
- PA requires a license to negotiate or attempt to negotiate real estate transactions "for another"
- PA's approach to FSBO platforms has been generally permissive for pure technology tools
- PA has no mandatory attorney requirement but title companies dominate closings
- PA's disclosure requirements (Seller's Property Disclosure Statement) can be facilitated by a technology platform without triggering licensing

**Mitigation (LOW risk):**
- Clear no-agency disclaimer; platform acts as tool for user, not as broker for user
- MLS access through licensed PA broker
- Flat fee structure as technology subscription

---

### Illinois (IL)

**Key statute:** 225 ILCS 454/1-10 et seq.

**Analysis:**
Illinois's Real Estate License Act of 2000 is one of the more detailed state licensing frameworks. Key definitions:
- "Broker" includes any entity that performs real estate brokerage services for compensation
- "Real estate brokerage services" includes assisting or directing in procurement, negotiation, or completion of any agreement related to real property
- Illinois's "attorney review period" (customary in IL contracts) underscores the state's expectation that legal professionals, not just real estate professionals, are involved in transactions

The AI guidance features present moderate risk in Illinois because:
- "Assisting or directing in procurement or negotiation" could be interpreted broadly
- IL is a customary-attorney state — attorney involvement is expected and the platform must accommodate attorney review periods
- The ILRELA is enforced by the Department of Financial and Professional Regulation (IDFPR)

**Mitigation (MEDIUM risk):**
- Broker partner for MLS access
- AI guidance must stay strictly educational; must not assist with negotiation strategy
- Surface attorney routing for IL users (customary-attorney state)
- Accommodate IL attorney review period in transaction workflow (Phase 4)
- Flat fee structure mitigates compensation-contingent licensing trigger

---

## Platform Model Options Analysis

The broker licensing question has three structural solutions. This section documents trade-offs only — **the business/legal decision must be made by the operator and counsel before Phase 2 begins.**

### Option 1: Platform-Owned Brokerage

**Description:** RealEstateHunter obtains its own broker's license (or creates a licensed brokerage entity) in each launch state.

**Pros:**
- Maximum regulatory cover — platform operates as a licensed entity in all states
- No dependency on third-party broker relationships
- Full control over compliance and service delivery
- Simplifies MLS access (licensed brokerage can access MLS directly)
- Platform can provide a wider range of services (licensed broker can do more)

**Cons:**
- High compliance cost — broker licensing in 10 states requires significant time and expense
- Requires a licensed broker principal/designated broker in each state
- Subjects platform to real estate commission oversight in all 10 states
- Potential fiduciary duty exposure — licensed brokers have duties to clients that technology platforms may find difficult to fulfill at scale
- Regulatory changes in any state affect platform operations

**Cost estimate:** $50k–$150k initial (license applications, designated brokers, legal setup) + ongoing compliance costs

---

### Option 2: Partner Brokerage Network

**Description:** Platform partners with licensed brokerages in each state to provide "brokerage middleware." The partner broker holds the license; the platform provides the technology.

**Pros:**
- Lower cost than platform-owned brokerage
- Faster time to market
- Partner brokers provide local market knowledge and existing MLS access
- Regulatory risk is distributed — partner broker is responsible for licensed activities

**Cons:**
- Dependency risk — if a partner broker exits, the platform loses functionality in that state
- Revenue sharing required — partner brokers will expect compensation
- Less control over user experience and compliance at the broker level
- Partner broker's compliance failures can affect platform reputation
- Contract complexity — partnership agreements, liability allocation, indemnification

**Typical revenue share:** 10–30% of platform fee or per-transaction fee to broker partner

---

### Option 3: Designated Broker Per State

**Description:** Platform employs or contracts with a designated broker (an individual or entity with a broker license) in each state. The designated broker is affiliated with the platform and oversees compliance.

**Pros:**
- Middle ground — more control than partner brokerage network, lower cost than full brokerage operation
- Designated broker model is used by several tech-enabled real estate platforms (e.g., flat-fee MLS listing services)
- Allows platform to structure MLS access and some licensed activities under the designated broker's license
- Can be structured as employment (platform employs broker) or contractor arrangement

**Cons:**
- Still requires finding and retaining qualified designated brokers in all 10 states
- Designated broker's license can be revoked or lapse, creating operational risk
- Some states impose specific designated broker requirements (e.g., NC broker-in-charge rules)
- Liability questions: is the platform vicariously liable for the designated broker's acts?

**Cost estimate:** $20k–$80k initial + ongoing designated broker compensation

---

### Recommendation Framework

**This is a business and legal decision — the following questions should be answered by operator and counsel:**

1. What is the platform's intended scope of licensed activities? (MLS access only, vs. full transaction coordination)
2. What is the startup budget for legal/compliance infrastructure?
3. What is the timeline pressure? (Partner brokerage is fastest to market)
4. What is the operator's risk tolerance for dependency on third-party brokers?
5. Are there lead investors or strategic partners who may have broker relationships to offer?

**Common path for early-stage real estate tech startups:**
Partner brokerage for MVP launch (fastest, lowest cost) → evaluate platform-owned brokerage after product-market fit is established.

---

## Attorney Review Checklist

Before relying on this document for any operational decision:

- [ ] California — review by CA-licensed real estate broker/attorney
- [ ] Texas — review by TX-licensed real estate broker/attorney
- [ ] Florida — review by FL-licensed real estate broker/attorney
- [ ] New York — review by NY-licensed real estate broker/attorney (**HIGH PRIORITY**)
- [ ] Georgia — review by GA-licensed real estate broker/attorney
- [ ] North Carolina — review by NC-licensed real estate broker/attorney
- [ ] Arizona — review by AZ-licensed real estate broker/attorney
- [ ] Ohio — review by OH-licensed real estate broker/attorney
- [ ] Pennsylvania — review by PA-licensed real estate broker/attorney
- [ ] Illinois — review by IL-licensed real estate broker/attorney

---

## References

- `docs/legal/state-compliance-classification.md` — closing type classification for all 10 launch states
- `src/lib/constants.ts` — LAUNCH_STATES, ATTORNEY_STATES, CUSTOMARY_ATTORNEY_STATES arrays
- `docs/legal/ai-guidance-taxonomy.md` — permitted/prohibited AI guidance (UPL boundary)

---

*Last updated: 2026-03-16*
*Phase: 01-legal-framework-foundation*
*Status: DRAFT — Requires review by real estate attorneys licensed in each analyzed state. Do not treat as legal advice.*
