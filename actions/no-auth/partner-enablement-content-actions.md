# Partner Training / Enablement Content Request

**Endpoint:** `POST /api/no-auth/partner-enablement-content`
**Operation ID:** `requestPartnerEnablementContent`
**Canonical schema:** `schemas/no-auth-partner-enablement-content.schema.yaml`

Prepare concise, category-specific enablement copy from the requested content type, business type, target audience, funding focus, tone, format, and use case. Supported partner categories follow the shared partner category enum. Category guidance includes CPA cash-flow/tax timing, broker acquisition transactions, attorney transaction context, merchant/payroll growth signals, and equipment purchase timing.

## Request and response

Required: `source`, `action_type: partner_enablement_content`, `partner_category`, `business_type`, `content_type`, and `target_audience`. The response contains a draft, partner segment, usage notes, safe messaging notes, and next step. Content is deterministic and intended to be adapted for the requested audience.

Configure optional `PARTNER_ENABLEMENT_CONTENT_SHARED_SECRET` and `PARTNER_ENABLEMENT_CONTENT_WEBHOOK_URL`. Outbound authentication reuses `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`.

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-enablement-content \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"partner_enablement_content","partner_category":"accountant_cpa","business_type":"accounting practice","content_type":"funding_trigger_guide","target_audience":"small business clients"}'
```
