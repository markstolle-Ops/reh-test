# Unauthorized Practice of Law (UPL) Guardrail Document

> **Review Status:** DRAFT — Requires UPL specialist attorney review. Must be approved before any AI guidance feature ships in Phase 2.

This document defines the Unauthorized Practice of Law (UPL) avoidance framework for all AI features on the RealEstateHunter platform. It is the legal companion to `docs/legal/ai-guidance-taxonomy.md`, which serves as the technical implementation specification for permitted and prohibited AI guidance patterns.

---

## What Is Unauthorized Practice of Law (UPL)?

Unauthorized Practice of Law refers to providing legal services — legal advice, legal opinions, or legal representation — without a license to practice law in the relevant jurisdiction. UPL is prohibited in all U.S. states, though the definition of what constitutes "practicing law" varies by state.

### Core Elements of UPL (general)

Most states agree that UPL occurs when a non-attorney:
1. **Gives legal advice** — advises a person on their specific legal rights or obligations in a particular situation
2. **Drafts legal documents** — prepares contracts, agreements, or legal instruments for a specific transaction on behalf of another
3. **Represents a party** — appears before a tribunal or otherwise acts as a legal representative for another
4. **Interprets the law** — applies statutes or case law to a specific client's facts

**Providing general legal information** (e.g., explaining how the law works generally, defining legal terms, describing the general legal process) is generally **not** UPL. The critical distinction is:
- **Information about the law** → Not UPL
- **Legal advice applied to a specific situation** → UPL risk

---

## Why UPL Matters for AI-Powered Real Estate Platforms

AI models are capable of generating responses that sound like legal advice, even when prompted to stay general. A user asking "Can I cancel my contract and get my deposit back?" is asking for legal advice. An AI that answers "Yes, you can cancel because the inspection contingency gives you that right" has given legal advice — regardless of how sophisticated the disclaimer is.

The platform faces UPL risk because:
1. Real estate transactions involve legally binding contracts with complex rights and obligations
2. Users are motivated to ask specific legal questions about their transactions
3. AI models, without strict guardrails, will answer those questions in ways that constitute legal advice
4. UPL enforcement is state-level — the platform is exposed in all 10 launch states simultaneously
5. UPL violations can result in criminal penalties, civil liability, and platform shutdown

---

## Per-State UPL Definition Nuances

| State | UPL Statute/Authority | Breadth of UPL Definition | Platform-Specific Notes |
|-------|----------------------|--------------------------|------------------------|
| CA | Bus. & Prof. Code §§ 6125–6127 | Moderate — focuses on advice/representation; California Bar has issued guidance on legal document preparers (LDPs) | California's "legal document preparer" exception may apply to template document tools |
| TX | Tex. Penal Code § 38.123; Tex. Gov't Code § 81.101 | Broad — "practice of law" includes legal advice and document preparation; Texas Supreme Court has authority to define | Texas has active UPL enforcement; AI guidance on TX-specific contract terms is high risk |
| FL | Fla. Stat. § 454.23; Fla. Bar v. Brumbaugh | Moderate-broad — FL Supreme Court defined practicing law to include giving advice and preparing documents; non-attorney document preparer exception is narrow | FL courts have found UPL in real estate form completion assistance |
| NY | N.Y. Jud. Law § 478; NY State Bar opinions | Broad — includes preparing legal documents and giving advice on legal matters; NY Bar actively prosecutes UPL | NY is HIGH risk — attorney involvement is customary and expected; AI guidance must be extremely conservative |
| GA | O.C.G.A. § 15-19-51 | Moderate — includes advice and document preparation; Georgia requires attorney at closing, which creates a natural UPL buffer | Attorney-required closing (attorney handles the legal work) reduces but does not eliminate AI guidance risk |
| NC | N.C. Gen. Stat. § 84-4 et seq. | Broad — includes all activities "in the ordinary course of practicing law"; NC State Bar actively enforces | Attorney-required closing; NC State Bar has issued specific guidance on real estate document preparation |
| AZ | A.R.S. § 32-261 | Moderate — focuses on legal advice and representation; Arizona has a "document preparer" registration system | AZ document preparers can complete legal forms without giving legal advice |
| OH | O.R.C. § 4705.01 | Moderate — practicing law defined as representing parties, preparing legal documents for another for compensation | Ohio's definition focuses on the "for compensation" element |
| PA | 42 Pa. C.S. § 2524 | Moderate-broad — includes holding oneself out as attorney, giving legal advice, and document preparation | PA courts have been moderately expansive in defining UPL |
| IL | 705 ILCS 205/1 | Broad — includes preparing documents and giving advice; Illinois State Bar takes expansive view | IL's attorney review period in real estate contracts underscores UPL sensitivity |

---

## Platform Feature UPL Risk Mapping

### Feature 1: Cost Calculator

**UPL Risk: NONE**

**Rationale:** The cost calculator performs mathematical calculations based on home price, state, and known fee structures (title fees, platform fee, commission savings). It does not:
- Interpret any legal document
- Provide advice on any legal right
- Apply the law to a specific situation

The calculator is pure arithmetic. Even in the most expansive UPL jurisdictions, mathematical calculations are not legal advice.

**Technical implementation:** No special guardrails required. Disclaimer language noting estimates are not legal advice is good practice but not legally required.

---

### Feature 2: AI Listing Description Generator

**UPL Risk: LOW**

**Rationale:** Generating marketing copy for a property listing is not legal advice. The listing description:
- Does not make legal representations about the property
- Does not interpret contracts or legal documents
- Does not advise on legal rights or obligations

**Risk area:** AI-generated listing descriptions must not:
- Make representations about zoning or permitted uses ("great for commercial use") without verified facts
- Imply any legal warranty about the property's condition
- Make statements that could constitute fraudulent misrepresentation (e.g., "no known defects")

**Technical guardrails:**
1. AI prompt must instruct the model to generate marketing copy only — not legal representations
2. Output filtering: flag and remove any language about warranties, legal status, or undisclosed conditions
3. Mandatory disclaimer appended to generated descriptions: "This listing description is draft marketing copy. Review for accuracy before publication. Platform makes no warranty as to the accuracy of listing information."

---

### Feature 3: AI Chatbot — Process Questions

**UPL Risk: MEDIUM**

**Rationale:** A chatbot that answers general process questions ("What happens after my offer is accepted?", "How long does escrow typically take in California?") is providing **process information**, not legal advice. However, the line between process information and legal advice is thin when users ask about their specific transaction.

**Permitted chatbot responses (process questions):**
- Explaining what a contingency is and how it generally works
- Describing the general closing timeline in a state
- Listing typical next steps after offer acceptance
- Explaining what a title search is and why it is done
- Describing what earnest money is and what it is generally used for

**Prohibited chatbot responses (legal advice triggers):**
- Telling a user whether their specific contingency has been satisfied
- Advising a user whether they can legally cancel their specific contract
- Interpreting a clause in the user's specific contract
- Advising on remedies for the other party's alleged breach

**Technical guardrails:**
1. System prompt must enforce the ai-guidance-taxonomy.md Permitted list strictly
2. Attorney referral triggers (defined in ai-guidance-taxonomy.md) must be checked before every response
3. Any response that contains the user's specific contract terms, property address, or specific legal question must be routed to attorney referral
4. Mandatory disclaimer: "This information is for general educational purposes only and does not constitute legal advice, real estate brokerage services, or financial advice. For advice specific to your transaction, consult a licensed real estate attorney, agent, or financial advisor in your state."

---

### Feature 4: AI Chatbot — Contract Interpretation

**UPL Risk: HIGH — PROHIBITED**

**Rationale:** Interpreting what a contract clause means, whether a clause is enforceable, or what rights it creates for a specific user is legal advice. This is the core of what attorneys do. Any AI response that purports to explain what a user's specific contract says or means constitutes UPL in all 10 launch states.

**Examples of prohibited responses:**
- "This clause means that the seller cannot back out after Day 5."
- "You have a right to cancel under Section 14 of your contract."
- "The contingency removal deadline has passed, so you may have waived your right to cancel."
- "Based on this contract language, you are entitled to the earnest money refund."

**Implementation requirement:**
When a user asks the AI to interpret a specific contract, the AI **must** respond with an attorney referral. The system prompt must treat any user message containing contract text, "my contract says," "my agreement says," or similar patterns as an immediate attorney referral trigger.

**Referral response (mandatory):**

```
That question involves interpreting the specific terms of your contract, which I'm not able
to do as AI guidance. I strongly recommend consulting a licensed real estate attorney in
[User's State] for advice on your specific contract. Would you like help finding one near you?
```

**Technical guardrails:**
1. Pattern detection: If user message contains quotation marks around contract text, "my contract," "my agreement," "this clause," trigger attorney referral
2. Output filtering: Block any response that contains language construed as contract interpretation
3. Logging: Log attorney referral triggers for compliance review

---

### Feature 5: AI Negotiation Suggestions

**UPL Risk: MEDIUM**

**Rationale:** There are two types of negotiation-related AI responses:
- **Informational (permitted):** "In your state, buyers commonly request a 2% seller concession in the current market. Here is data on recent comparable transactions."
- **Advisory (prohibited):** "You should offer $15,000 below asking. They are motivated to sell."

The distinction is between presenting market data and process information (permitted) vs. advising on specific negotiation strategy for a specific transaction (broker activity and potentially legal advice).

**Risk area:**
- Price negotiation advice: This is a licensed real estate brokerage activity in all 10 states — the platform cannot give specific negotiation recommendations without a broker license
- Contract term negotiation: Advising which contract terms to include or how to negotiate specific clauses may also constitute UPL if the advice touches on legal rights

**Technical guardrails:**
1. AI responses about negotiation must be framed as market information only ("Here is what comparable transactions have shown") — never as strategic advice ("Here is what you should do")
2. System prompt must prohibit generating specific negotiation strategies, offer amounts, or tactical recommendations
3. Output filtering: Flag and review responses containing dollar amounts as negotiation recommendations
4. Required framing: Responses about market data must include "This is general market information, not a recommendation for your specific transaction. Consult a licensed agent or attorney for advice."

---

## Technical Guardrail Architecture

### Layer 1: System Prompt Enforcement

Every AI interaction on the platform uses a system prompt that:
1. References ai-guidance-taxonomy.md (the implementation specification)
2. Explicitly lists the attorney referral trigger conditions
3. Prohibits contract interpretation, legal advice, and negotiation strategy
4. Requires the mandatory disclaimer on all transaction-related responses
5. Instructs the model to default to attorney referral when uncertain

**System prompt enforcement is the first line of defense.** It must be reviewed by counsel before any production use.

### Layer 2: Output Filtering

Before any AI response is displayed to the user, an output filter checks for:
1. Trigger patterns indicating legal advice: "you are entitled to," "you have a right to," "the contract means," "you should offer," "you can cancel"
2. Contract interpretation language: quotations from contracts with "means" or "requires"
3. Prohibited categories from ai-guidance-taxonomy.md

If a trigger is detected, the response is replaced with the attorney referral template.

### Layer 3: Attorney Referral Trigger Conditions

From `docs/legal/ai-guidance-taxonomy.md`:

1. Any question starting with "Am I legally required to..." or "Do I have to..."
2. Any question about whether a contract clause is valid, enforceable, or binding
3. Any question about cancellation rights, deposit recovery, or breach of contract
4. Any question about title defects, liens, easements, or encumbrances
5. Any question asking the AI to "review" or "interpret" a specific contract or document
6. Any question about suing, arbitrating, or mediating a real estate dispute
7. Any question about zoning, land use restrictions, or permit legality
8. Any mention of fraud, misrepresentation, or non-disclosure by the other party
9. Any question about a specific legal right in a specific state
10. Any question involving a party threatening legal action

### Layer 4: Mandatory Disclaimer Language

From `docs/legal/ai-guidance-taxonomy.md`:

```
This information is for general educational purposes only and does not constitute legal advice,
real estate brokerage services, or financial advice. For advice specific to your transaction,
consult a licensed real estate attorney, agent, or financial advisor in your state.
```

This disclaimer must appear at the end of any AI response in the "transaction guidance" category. It must be rendered as visible text — not in a tooltip or collapsed element.

### Layer 5: Logging and Compliance Review

All AI interactions that trigger:
- Attorney referral
- Output filter block
- Prohibited category detection

...must be logged for compliance review. Logs must include: timestamp, trigger type, user state, conversation ID. Logs must not contain PII beyond what is necessary for compliance purposes.

---

## Incident Response

### What to Do When AI Generates UPL-Risk Content

If an AI response crosses the UPL boundary (either detected by output filter or reported by a user or attorney):

**Immediate actions:**
1. Disable the specific AI feature or prompt configuration that generated the response (if pattern is reproducible)
2. Log the incident with: AI response text, user question, timestamp, user state, conversation ID
3. Notify the platform's RESPA/UPL counsel immediately

**Short-term actions (within 48 hours):**
4. Investigate whether the incident was caused by: prompt misconfiguration, model behavior outside prompting constraints, or novel user input not anticipated by the taxonomy
5. Update the system prompt and/or output filter to block the pattern that caused the incident
6. Test the fix against the incident pattern before re-enabling the feature

**Longer-term actions:**
7. Determine if the incident creates any legal exposure — was the response delivered to a user who may have relied on it?
8. If user reliance is possible: consult counsel about whether any disclosure or remediation is appropriate
9. Update ai-guidance-taxonomy.md and this document to reflect the new pattern
10. Re-submit updated taxonomy to counsel for review

**Do NOT:**
- Attempt to characterize a UPL-risk response as "just information" without counsel review
- Dismiss incidents as one-off model errors without investigating the root cause
- Continue operating a feature that is producing UPL-risk responses

---

## Reference to Implementation Specification

**This document is the legal framework. The implementation specification is:**

`docs/legal/ai-guidance-taxonomy.md` — Permitted AI Guidance, Prohibited AI Guidance, Mandatory Disclaimer Language, Attorney Referral Trigger Conditions

Every AI prompt template, output filter, and feature implementation in Phase 2 must be validated against both documents.

**Review cadence:**
- Both documents must be re-reviewed after: any significant change to state law in a launch state, any new AI feature development, any UPL incident, and annually
- Attorney sign-off is required before any Phase 2 AI feature ships to production

---

## Attorney Review Checklist

Before any AI guidance feature ships in Phase 2:

- [ ] California UPL analysis — reviewed by CA State Bar-licensed attorney
- [ ] Texas UPL analysis — reviewed by TX State Bar-licensed attorney
- [ ] Florida UPL analysis — reviewed by FL Bar-licensed attorney
- [ ] New York UPL analysis — reviewed by NY Bar-licensed attorney (**HIGH PRIORITY**)
- [ ] Georgia UPL analysis — reviewed by GA Bar-licensed attorney
- [ ] North Carolina UPL analysis — reviewed by NC State Bar-licensed attorney
- [ ] Arizona UPL analysis — reviewed by AZ State Bar-licensed attorney
- [ ] Ohio UPL analysis — reviewed by OH Supreme Court-admitted attorney
- [ ] Pennsylvania UPL analysis — reviewed by PA Bar-licensed attorney
- [ ] Illinois UPL analysis — reviewed by IL ARDC-registered attorney
- [ ] System prompt reviewed by UPL counsel before production use
- [ ] Output filtering rules reviewed by UPL counsel
- [ ] Mandatory disclaimer language approved by UPL counsel
- [ ] Attorney referral trigger conditions approved by UPL counsel
- [ ] Incident response protocol reviewed by UPL counsel

---

## References

- `docs/legal/ai-guidance-taxonomy.md` — Implementation specification (permitted/prohibited patterns, mandatory disclaimers, attorney referral triggers)
- `docs/legal/state-compliance-classification.md` — State closing classifications (attorney-required, customary-attorney, title-company)
- `docs/legal/broker-licensing-analysis.md` — Broker licensing analysis and platform model options
- `docs/legal/respa-compliance-framework.md` — RESPA compliance analysis

---

*Last updated: 2026-03-16*
*Phase: 01-legal-framework-foundation*
*Status: DRAFT — Requires UPL specialist attorney review. Must be approved before any AI guidance feature ships in Phase 2.*
