# Partner Objection Handler / Response Draft Guardrails

- Never promise approval, funding, rates, eligibility, or outcomes.
- Compensation responses explain process only. No trusted terms source is integrated: caller notes, an inbound secret, or a successful webhook are not approved compensation terms.
- Compliance responses avoid legal conclusions. Route the specific question to a specialist while allowing ordinary drafting and internal routing to continue.
- Trust and client-relationship concerns recommend controlled communications, a respectful handoff, and confidentiality expectations; do not invent implemented security safeguards.
- Keyword classification can miss or over-classify ambiguity; downstream systems must preserve the borrower boundary regardless of the returned label. Short responses retain the full substantive caveat and may exceed one SMS segment.
- Use only non-sensitive partner business context. Do not include borrower documents, account information, private records, credentials, or secrets in notes.
- This is partner business development, not credit scoring, qualification, underwriting, lender submission, approval/denial, pricing, or funding.
- Routine message generation, classification, routing, meeting preparation, and internal tasks may be automated without a blanket review gate.
- Legal/compliance ambiguity, actual compensation commitments, payouts, private-record access, and regulated borrower decisions require the appropriate review or authorization.
- The endpoint validates structure and limits; it is not a private-data detector. Callers and downstream workflows must enforce data minimization and existing access controls.
