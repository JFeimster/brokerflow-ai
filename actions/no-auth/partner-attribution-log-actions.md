# Partner Commission / Attribution Log Action

**Operation:** `logPartnerAttribution`
**Endpoint:** `POST /api/no-auth/partner-attribution-log`
**Schema:** `schemas/no-auth-partner-attribution-log.schema.yaml`

Logs partner, referral, attribution, commission-status, payout-stage, dispute, and operator metadata. It is log-only: values such as `approved_external_system`, `scheduled_external_system`, and `paid_external_system` are descriptive states reported by a trusted workflow or user. This handler never authorizes payments, calculates binding commissions, changes a private payout ledger, or resolves a dispute.

Configure `PARTNER_ATTRIBUTION_LOG_WEBHOOK_URL` and optional `PARTNER_ATTRIBUTION_LOG_SHARED_SECRET`. Outbound requests reuse `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`; request secrets are excluded. A retry after a 502 can create duplicate log records; check downstream state.

```powershell
curl.exe -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-attribution-log `
  -H "Content-Type: application/json" `
  -d '{"source":"custom_gpt","action_type":"partner_attribution_log","partner_id":"partner_123","referral_id":"prf_123","attribution_status":"attributed","commission_status":"pending_completion","payout_stage":"awaiting_deal_completion","dispute_flag":false}'
```
