# Affiliate Partner Signup Guardrails

- Capture only partner contact, organization, audience, referral, consent, and onboarding information.
- Require `compliance_acknowledged: true` and `consent_to_contact: true`; do not schedule partner contact without consent.
- The returned segment and priority are internal onboarding aids. They do not approve, activate, contract with, or authorize compensation for a partner.
- Do not request or include borrower PII, financial records, lender credentials, or private borrower records.
- Optional `shared_secret` is checked against `AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET` and is never forwarded or logged.
- Forward only to `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL`; outbound authentication uses the shared `x-brokerflow-secret` header convention.
- Legal/compliance questions and compensation or payout disputes require authorized human handling.
