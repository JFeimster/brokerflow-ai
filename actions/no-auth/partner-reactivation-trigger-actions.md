# Partner Reactivation / Nurture Trigger

**Endpoint:** `POST /api/no-auth/partner-reactivation`
**Operation ID:** `triggerPartnerReactivation`
**Canonical schema:** `schemas/no-auth-partner-reactivation.schema.yaml`

Classify the supplied segment and prepare a deterministic message, channel, offer angle, follow-up schedule, and internal next step. `prospect_never_contacted` produces initial outreach language. `prospect_contacted_no_response` uses a short sequence with a pause. `high_value_dormant_partner` routes to personalized relationship-manager follow-up.

## Request and response

Required: `source`, `action_type: partner_reactivation`, and `reactivation_segment`. Optional fields include partner context, activity/referral dates (`YYYY-MM-DD`), relationship strength, preferred channel, and internal notes. The output includes a unique `reactivation_id`, priority, recommended channel/message, bounded cadence, and next step.

Configure optional `PARTNER_REACTIVATION_SHARED_SECRET` and `PARTNER_REACTIVATION_WEBHOOK_URL`. Outbound authentication reuses `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`.

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-reactivation \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"partner_reactivation","reactivation_segment":"inactive_90_days","partner_name":"Alex Rivera","preferred_channel":"email"}'
```
