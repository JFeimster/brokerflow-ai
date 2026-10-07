# Partner Meeting / Call Prep Brief Guardrails

- `partner_profile` contains caller-supplied, unverified context. Missing fields stay null.
- `likely_client_base.provided` records supplied context; `suggested_to_verify` is a category hypothesis.
- Triggers, pitch angles, objections, and cross-referral opportunities are recommendations, never assertions of partner activity or demand.
- Performance review uses only supplied context. Never invent referral counts, conversion rates, revenues, commissions, or prior outcomes.
- No external lookup, private record access, calendar scheduling, or borrower decision is performed.
- Use only non-sensitive partner business context. Do not include borrower documents, account information, private records, credentials, or secrets in notes.
- This is partner business development, not credit scoring, qualification, underwriting, lender submission, approval/denial, pricing, or funding.
- Routine message generation, classification, routing, meeting preparation, and internal tasks may be automated without a blanket review gate.
- Legal/compliance ambiguity, actual compensation commitments, payouts, private-record access, and regulated borrower decisions require the appropriate review or authorization.
- The endpoint validates structure and limits; it is not a private-data detector. Callers and downstream workflows must enforce data minimization and existing access controls.
