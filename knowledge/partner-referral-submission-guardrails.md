# Partner Referral Submission Guardrails

- Preserve partner identity and referral attribution in each intake payload.
- Treat permission-to-contact as an explicit boolean. When false, do not route to direct borrower contact; collect consent or ask the partner to make a warm introduction.
- A warm introduction is a workflow recommendation, not consent on its own.
- `borrower_intake_ready` and `lender_fit_routing_ready` reflect field completeness only. Never label them approval, eligibility, qualification, underwriting, or lender acceptance.
- Do not submit to a lender, determine pricing, or make a regulated borrower decision.
- Do not log secrets. The request secret is not included in outbound payloads. Avoid putting sensitive financial or document content in referral notes.
- This endpoint does not persist referrals by itself. Webhook retry delivery can create duplicates; use the referral ID as a downstream correlation key and add durable deduplication in a future integration.
