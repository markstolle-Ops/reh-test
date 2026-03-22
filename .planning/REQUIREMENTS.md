# Requirements: RealEstateHunter

**Defined:** 2026-03-16
**Core Value:** Eliminate the need for traditional real estate agents by providing AI-powered transaction management that saves buyers and sellers thousands of dollars while delivering superior 24/7 service.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### User Accounts

- [x] **ACCT-01**: User can create account as buyer or seller with email and password
- [x] **ACCT-02**: User receives email verification after signup
- [x] **ACCT-03**: User can reset password via email link
- [x] **ACCT-04**: User session persists across browser refresh
- [x] **ACCT-05**: Buyer and seller have separate dashboards with role-specific views
- [x] **ACCT-06**: User can switch between buyer and seller roles

### Property Listings

- [x] **LIST-01**: Seller can create a property listing with address, price, beds, baths, sqft, lot size, property type
- [x] **LIST-02**: Seller can upload multiple photos per listing with drag-and-drop ordering
- [x] **LIST-03**: AI generates MLS-quality listing description from uploaded photos and property details
- [x] **LIST-04**: Seller can edit AI-generated description before publishing
- [x] **LIST-05**: Seller can mark listing as active, pending, or sold
- [x] **LIST-06**: Seller can edit listing details after publishing
- [x] **LIST-07**: Listings display on the platform with photo gallery and full details
- [x] **LIST-08**: Listing supports residential sales (single-family, condos, townhouses) and land/lots

### Buyer Search & Discovery

- [x] **SRCH-01**: Buyer can search properties by location (city, zip, state)
- [x] **SRCH-02**: Buyer can filter by price range, beds, baths, sqft, property type
- [x] **SRCH-03**: Buyer can view properties on an interactive map
- [x] **SRCH-04**: Buyer can save searches and receive email alerts when new matching listings appear
- [x] **SRCH-05**: Buyer can save/favorite individual listings
- [x] **SRCH-06**: Search results display with photo thumbnails, price, key details

### AI Chatbot

- [x] **CHAT-01**: AI chatbot available 24/7 on every listing page to answer property questions
- [x] **CHAT-02**: AI chatbot can answer state-specific process questions (what happens next, what forms are needed)
- [x] **CHAT-03**: AI chatbot can schedule showing requests on behalf of buyers
- [x] **CHAT-04**: AI chatbot provides general guidance with explicit "not legal advice" disclaimers
- [x] **CHAT-05**: AI chatbot responses are grounded in RAG knowledge base (not hallucinated)

### AI Negotiation Assistant

- [x] **NEGO-01**: AI provides comparable sales analysis for any listed property
- [x] **NEGO-02**: AI suggests offer price strategy based on comps, days on market, and market conditions
- [x] **NEGO-03**: AI guides buyer through offer/counteroffer process with templates
- [x] **NEGO-04**: AI provides seller with counteroffer strategy recommendations
- [x] **NEGO-05**: All AI negotiation guidance includes "not legal/financial advice" disclaimers

### AI Transaction Coordinator

- [x] **TXCO-01**: AI generates state-specific transaction checklist after offer acceptance
- [x] **TXCO-02**: AI tracks deadlines (inspection period, financing contingency, closing date) and sends reminders
- [x] **TXCO-03**: AI flags missing required documents per state
- [x] **TXCO-04**: AI monitors CFPB 3-day closing disclosure rule compliance
- [x] **TXCO-05**: Transaction dashboard shows real-time status of all pending items

### AI Buyer Matching

- [ ] **MTCH-01**: AI tracks buyer search behavior (views, saves, searches) to build preference profile
- [ ] **MTCH-02**: AI proactively suggests listings matching inferred preferences
- [x] **MTCH-03**: Buyer can use natural language search ("3BR ranch with big yard near good schools under $350K")
- [ ] **MTCH-04**: AI sends personalized listing recommendations via email

### State Legal Workflows

- [x] **LEGL-01**: Platform maintains a legal workflow configuration for each of the 50 US states
- [x] **LEGL-02**: Each state config specifies: attorney required (yes/no/partial), agent required (yes/no), RON available (yes/no), specific disclosure forms, closing process steps
- [x] **LEGL-03**: Transaction flow automatically adapts based on the property's state
- [x] **LEGL-04**: States requiring attorneys route users to attorney referral or agent-for-hire
- [x] **LEGL-05**: States allowing FSBO provide fully self-service workflow
- [x] **LEGL-06**: State configs are data-driven (JSON/DB) and updatable without code deploys
- [x] **LEGL-07**: Platform displays state-specific legal requirements to users before they begin a transaction

### State Disclosure Forms

- [x] **DISC-01**: Platform provides state-specific disclosure forms for all 50 states
- [x] **DISC-02**: Forms are fillable digitally within the platform
- [x] **DISC-03**: AI assists users in completing disclosure forms with guided prompts
- [x] **DISC-04**: Completed forms are stored and attached to the transaction record

### eSignature

- [x] **SIGN-01**: Users can sign transaction documents digitally via DocuSign integration
- [x] **SIGN-02**: eSignature workflow supports multi-party signing (buyer, seller, agent if applicable)
- [x] **SIGN-03**: Signed documents are stored in the transaction record with audit trail
- [x] **SIGN-04**: Platform complies with E-SIGN Act and UETA across all 50 states

### Agent-for-Hire Marketplace

- [x] **AGNT-01**: Licensed real estate agents can create profiles and list availability by state
- [ ] **AGNT-02**: Platform dispatches agent-for-hire requests in states requiring licensed agent involvement
- [x] **AGNT-03**: Agents are paid a nominal flat fee per contract signing
- [x] **AGNT-04**: Agent marketplace includes verification of active license status per state
- [ ] **AGNT-05**: Users see transparent breakdown: platform fee + agent fee (where applicable)

### Home Valuation & Data

- [x] **DATA-01**: Seller can get automated home value estimate (AVM) before listing
- [x] **DATA-02**: AVM integrates with property data provider (HouseCanary or similar)
- [x] **DATA-03**: Buyer can view neighborhood data (walkability, school ratings, market trends) on listing pages
- [x] **DATA-04**: Market analysis shows price trends, days on market, inventory levels per area

### Cost & Fee Transparency

- [x] **COST-01**: Cost-benefit calculator on homepage compares platform fees vs. traditional 5-6% commission
- [x] **COST-02**: Calculator takes home price and state as input, shows itemized savings
- [x] **COST-03**: Every transaction shows full fee breakdown: platform fee, title company fee, attorney fee (where required), agent-for-hire fee (where required)
- [x] **COST-04**: Fee breakdown is visible before user commits to a transaction

### MLS Integration

- [x] **MLS-01**: Seller listings syndicate to MLS via broker partner network
- [x] **MLS-02**: MLS listings from partner feeds appear in buyer search results
- [x] **MLS-03**: Platform supports RESO Web API 2.0 for MLS data ingestion
- [x] **MLS-04**: MLS syndication covers top 10-15 highest-volume markets initially

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **RON-01**: Remote Online Notarization integration for fully digital closings (44 states)
- **SHOW-01**: Seller showing management calendar with buyer booking
- **PRED-01**: Predictive valuation alerts ("your home is worth X more now")
- **PERF-01**: Agent-for-hire performance ratings within marketplace

### Expanded Scope

- **COMM-01**: Commercial real estate transaction support
- **RENT-01**: Residential rental/leasing transaction support
- **LAND-01**: Specialized land/lot transaction workflows (beyond basic support)
- **INTL-01**: International market expansion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mortgage origination | Wrong regulatory regime (NMLS licensing); partner with Rocket/Better instead |
| Home inspection booking | Operationally complex, highly local; referral model only |
| Direct buyer-seller chat | Fair Housing liability + emotional escalation; route through AI assistant |
| Automated legal advice | Unauthorized Practice of Law exposure; guided workflows with disclaimers only |
| iBuyer / cash offers | Requires capital/balance sheet risk; refer to Opendoor/Offerpad |
| Social features / property reviews | Fair Housing Act restricts property commentary |
| Aggressive email/SMS drip campaigns | TCPA violation risk; opt-in transactional notifications only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACCT-01 | Phase 1 | Complete |
| ACCT-02 | Phase 1 | Complete |
| ACCT-03 | Phase 1 | Complete |
| ACCT-04 | Phase 1 | Complete |
| ACCT-05 | Phase 1 | Complete |
| ACCT-06 | Phase 1 | Complete |
| COST-01 | Phase 1 | Complete |
| COST-02 | Phase 1 | Complete |
| LIST-01 | Phase 2 | Complete |
| LIST-02 | Phase 2 | Complete |
| LIST-03 | Phase 2 | Complete |
| LIST-04 | Phase 2 | Complete |
| LIST-05 | Phase 2 | Complete |
| LIST-06 | Phase 2 | Complete |
| LIST-07 | Phase 2 | Complete |
| LIST-08 | Phase 2 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| CHAT-01 | Phase 2 | Complete |
| CHAT-02 | Phase 2 | Complete |
| CHAT-03 | Phase 2 | Complete |
| CHAT-04 | Phase 2 | Complete |
| CHAT-05 | Phase 2 | Complete |
| COST-03 | Phase 2 | Complete |
| COST-04 | Phase 2 | Complete |
| SRCH-01 | Phase 3 | Complete |
| SRCH-02 | Phase 3 | Complete |
| SRCH-03 | Phase 3 | Complete |
| SRCH-04 | Phase 3 | Complete |
| SRCH-05 | Phase 3 | Complete |
| SRCH-06 | Phase 3 | Complete |
| DISC-01 | Phase 3 | Complete |
| DISC-02 | Phase 3 | Complete |
| DISC-03 | Phase 3 | Complete |
| DISC-04 | Phase 3 | Complete |
| SIGN-01 | Phase 3 | Complete |
| SIGN-02 | Phase 3 | Complete |
| SIGN-03 | Phase 3 | Complete |
| SIGN-04 | Phase 3 | Complete |
| MLS-02 | Phase 3 | Complete |
| MLS-03 | Phase 3 | Complete |
| LEGL-01 | Phase 4 | Complete |
| LEGL-02 | Phase 4 | Complete |
| LEGL-03 | Phase 4 | Complete |
| LEGL-04 | Phase 4 | Complete |
| LEGL-05 | Phase 4 | Complete |
| LEGL-06 | Phase 4 | Complete |
| LEGL-07 | Phase 4 | Complete |
| NEGO-01 | Phase 4 | Complete |
| NEGO-02 | Phase 4 | Complete |
| NEGO-03 | Phase 4 | Complete |
| NEGO-04 | Phase 4 | Complete |
| NEGO-05 | Phase 4 | Complete |
| TXCO-01 | Phase 4 | Complete |
| TXCO-02 | Phase 4 | Complete |
| TXCO-03 | Phase 4 | Complete |
| TXCO-04 | Phase 4 | Complete |
| TXCO-05 | Phase 4 | Complete |
| MLS-01 | Phase 4 | Complete |
| AGNT-01 | Phase 5 | Complete |
| AGNT-02 | Phase 5 | Pending |
| AGNT-03 | Phase 5 | Complete |
| AGNT-04 | Phase 5 | Complete |
| AGNT-05 | Phase 5 | Pending |
| MTCH-01 | Phase 5 | Pending |
| MTCH-02 | Phase 5 | Pending |
| MTCH-03 | Phase 5 | Complete |
| MTCH-04 | Phase 5 | Pending |
| MLS-04 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 71 total
- Mapped to phases: 71
- Unmapped: 0 ✓

**Note:** The header originally stated 58 requirements. Actual count from the requirement list is 71. Coverage is 100%.

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation — traceability populated*
