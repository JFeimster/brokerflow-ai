# Affiliate Partner Signup Action

**Operation ID:** `submitAffiliatePartnerSignup`
**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/affiliate-partner-signup`
**Canonical schema:** `schemas/no-auth-affiliate-partner-signup.schema.yaml`

Captures a prospective partner's contact, business, audience, referral, and consent details. It assigns an onboarding segment and follow-up priority; it does not approve or activate a partner.

## Environment variables

- `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL` — optional direct automation webhook. Leave blank to disable forwarding.
- `AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET` — optional request-body check. When set, the request must include the matching `shared_secret`.
- `WEBHOOK_SHARED_SECRET` — optional outbound `x-brokerflow-secret` header shared with the receiving automation.

## Request example

```json
{
  "source": "custom_gpt",
  "action_type": "affiliate_partner_signup",
  "partner_name": "Jordan Lee",
  "company_name": "Lee Advisory",
  "email": "jordan@example.com",
  "partner_type": "referral_partner",
  "business_type": "accountant_cpa",
  "expected_referral_volume": 4,
  "compliance_acknowledged": true,
  "consent_to_contact": true
}
```

The response includes a `partner_signup_id`, `partner_segment`, `onboarding_priority`, and `recommended_next_step`.

## Curl test

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/affiliate-partner-signup \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"affiliate_partner_signup","partner_name":"Jordan Lee","email":"jordan@example.com","partner_type":"referral_partner","business_type":"accountant_cpa","compliance_acknowledged":true,"consent_to_contact":true}'
```
