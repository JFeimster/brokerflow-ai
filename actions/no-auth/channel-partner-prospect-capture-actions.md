# Channel Partner Prospect Capture Action

**Operation ID:** `captureChannelPartnerProspect`
**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/channel-partner-prospect`
**Canonical schema:** `schemas/no-auth-channel-partner-prospect-capture.schema.yaml`

Captures a center-of-influence prospect and deterministically recommends its internal outreach priority and next step. It uses the submitted business information and does not access private records or send outreach.

## Environment variables

- `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL` — optional direct automation webhook.
- `CHANNEL_PARTNER_PROSPECT_SHARED_SECRET` — optional request-body check; include `shared_secret` when configured.
- `WEBHOOK_SHARED_SECRET` — optional outbound `x-brokerflow-secret` header.

## Request example

```json
{
  "source": "custom_gpt",
  "action_type": "channel_partner_prospect",
  "company_name": "Northside Accounting",
  "contact_name": "Alex Morgan",
  "partner_category": "accountant_cpa",
  "niche": "construction",
  "target_client_type": "small_business_owner",
  "estimated_referral_potential": "high",
  "relationship_strength": "aware"
}
```

The response includes a `prospect_id`, `recommended_priority`, and `recommended_next_step`.

## Curl test

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/channel-partner-prospect \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"channel_partner_prospect","company_name":"Northside Accounting","contact_name":"Alex Morgan","partner_category":"accountant_cpa","niche":"construction","target_client_type":"small_business_owner","estimated_referral_potential":"high","relationship_strength":"aware"}'
```
