# AI Guidance Taxonomy

> **Review Status:** DRAFT — Requires real estate attorney review before any AI prompt is written. Do not treat as authoritative until reviewed.

This document defines the boundary between permitted and prohibited AI guidance on the RealEstateHunter platform. Every AI response touching transaction topics MUST comply with this taxonomy. This boundary protects users from receiving unlicensed legal or real estate advice and protects the platform from Unauthorized Practice of Law (UPL) and real estate licensing liability.

---

## Permitted AI Guidance (Safe Harbor)

These response types are permitted because they provide factual, procedural, or educational information rather than legal interpretation or professional advice.

| Category | Example Permitted Response |
|---|---|
| **Process information** | "In California, closing typically takes 30–45 days after the purchase agreement is signed." |
| **Form guidance** | "The Residential Purchase Agreement (RPA) has three sections where buyers commonly make errors: contingency deadlines, earnest money amount, and closing date." |
| **Comparable data presentation** | "Three similar 3BR/2BA homes in your zip code sold for $420k–$445k in the last 90 days. Here are the details." |
| **General next steps** | "After your offer is accepted, your next step is typically to submit your earnest money deposit within 3 business days per your agreement." |
| **Document checklists** | "For a cash purchase in Texas, you'll typically need: signed purchase agreement, proof of funds letter, title commitment, and closing disclosure." |
| **Timeline reminders** | "Your inspection contingency deadline is in 2 days based on your agreement date." |
| **Glossary / definition** | "A contingency is a condition that must be met for the transaction to proceed. If unmet, the buyer may cancel and recover their earnest money." |
| **Fee estimation** | "Based on your home price and state, estimated title fees typically range from $2,800–$3,200. This is an estimate — your title company will provide exact figures." |
| **Referral routing** | "This question involves contract interpretation. I recommend consulting a real estate attorney in [State]. Here are licensed attorneys in your area." |

---

## Prohibited AI Guidance (UPL Risk)

These response types are prohibited because they constitute legal advice, professional real estate advice, or opinions that require a license to provide.

| Category | Example Prohibited Response | Risk |
|---|---|---|
| **Legal entitlements** | "You are legally entitled to cancel this contract and get your deposit back." | UPL — legal advice |
| **Contract interpretation** | "This clause means the seller cannot back out after 5 days." | UPL — legal advice |
| **Enforceability opinions** | "This addendum is not enforceable because it lacks consideration." | UPL — legal advice |
| **Litigation advice** | "You should sue the seller for specific performance." | UPL — legal advice |
| **Price negotiation strategy** | "Offer $15,000 below asking — they're motivated to sell." | Real estate broker activity |
| **Investment recommendations** | "This is a good investment because the neighborhood is appreciating." | Investment advice |
| **Fair Housing violations** | Any response that steers buyers toward or away from areas based on protected characteristics. | Fair Housing Act |
| **Guarantees or predictions** | "Your offer will definitely be accepted at this price." | Misleading / liability |
| **Title defect analysis** | "This lien on the title won't affect your ownership." | UPL — legal advice |
| **Structural condition assessment** | "The crack in the foundation is cosmetic, not structural." | Professional engineer territory |

---

## Mandatory Disclaimer Language

Every AI response that touches transaction-related topics (contracts, offers, contingencies, closings, legal rights, fees) MUST include the following disclaimer. The exact wording must be used:

```
This information is for general educational purposes only and does not constitute legal advice,
real estate brokerage services, or financial advice. For advice specific to your transaction,
consult a licensed real estate attorney, agent, or financial advisor in your state.
```

**Implementation requirements:**
- The disclaimer must appear at the end of any AI message in the "transaction guidance" category.
- The disclaimer must not be buried in fine print — it must be rendered as visible text within the response.
- Do not modify the disclaimer wording without attorney review.

---

## Attorney Referral Trigger Conditions

When a user message contains any of the following patterns, the AI MUST recommend an attorney referral rather than answering the substantive question directly.

**Trigger patterns:**

1. Any question starting with "Am I legally required to..." or "Do I have to..."
2. Any question about whether a contract clause is valid, enforceable, or binding
3. Any question about cancellation rights, deposit recovery, or breach of contract
4. Any question about title defects, liens, easements, or encumbrances
5. Any question asking the AI to "review" or "interpret" a specific contract or document
6. Any question about suing, arbitrating, or mediating a real estate dispute
7. Any question about zoning, land use restrictions, or permit legality
8. Any mention of fraud, misrepresentation, or non-disclosure by the other party
9. Any question about a specific legal right in a specific state (e.g., "Can a seller in Georgia...")
10. Any question involving a party threatening legal action

**Referral response template:**

```
That question involves legal interpretation specific to your situation, which I'm not able to
answer as AI guidance. I strongly recommend consulting a licensed real estate attorney in
[User's State]. Would you like help finding one near you?
```

---

## Implementation Notes

- This taxonomy applies to all AI features: chat assistant, document review helper, closing checklist generator, and any future AI-powered feature.
- Each AI prompt template must reference this taxonomy and be reviewed by counsel before production use.
- Any edge case not covered by this taxonomy should default to "suggest attorney referral" until reviewed.
- This document must be re-reviewed after any significant change to state law in a launch state.

---

*Last updated: 2026-03-16*
*Phase: 01-legal-framework-foundation*
*Status: DRAFT — Not reviewed by counsel*
