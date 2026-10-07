# Channel Partner Prospect Guardrails

- Use public business information or details provided by the user; do not enrich prospects from private records.
- Priority is an internal business-development routing aid, never a borrower score, qualification, underwriting, or lending decision.
- The endpoint recommends follow-up; it does not send partner-facing outreach or activate a relationship.
- Do not include borrower names, financial details, raw documents, or private lender data in notes.
- Optional `shared_secret` is checked against `CHANNEL_PARTNER_PROSPECT_SHARED_SECRET` and is not forwarded or logged.
- Outbound forwarding uses `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL` and the shared `x-brokerflow-secret` header convention.
