# COI Niche Scoring Guardrails

- This score is an internal partner-development prioritization score. It is not a borrower credit score, underwriting model, qualification score, or lending decision.
- Score only partner access, funding-trigger frequency, advisory trust, repeat-referral potential, niche fit, relationship strength, and urgency supplied in the request.
- Never use the score to assess a borrower, predict approval, or determine lending eligibility.
- The score recommends internal outreach prioritization; it does not send outreach, approve a partner, authorize compensation, or activate an agreement.
- Do not submit borrower PII, private records, financial documents, or lender credentials.
- Optional `shared_secret` is checked against `COI_NICHE_SCORING_SHARED_SECRET` and is never forwarded or logged.
- Outbound forwarding uses `COI_NICHE_SCORING_WEBHOOK_URL` and the shared `x-brokerflow-secret` header convention.
