# Partner Deal Status Update Draft Action

**Operation:** `draftPartnerStatusUpdate`
**Endpoint:** `POST /api/no-auth/partner-status-update-draft`
**Schema:** `schemas/no-auth-partner-status-update-draft.schema.yaml`

Creates a partner-safe draft from a controlled deal-stage phrase. The handler does not reuse free-text `known_status` or `notes`. It defaults disclosure to `minimal`; free-text details are considered only when `borrower_disclosure_level` is `expanded_with_consent` and are filtered for restricted terms and caller-listed restrictions. Inspect the recipient and consent basis before sending.

Never share credit, bank, tax, detailed financial, decline-reason, private lender, sensitive document, or unapproved pricing/term details. The draft does not promise lender acceptance or funding.

Configure `PARTNER_STATUS_UPDATE_WEBHOOK_URL` and optional `PARTNER_STATUS_UPDATE_SHARED_SECRET`. Outbound requests reuse `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`; request secrets are excluded. Webhook retries can repeat downstream tasks; inspect after a 502.

```powershell
curl.exe -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-status-update-draft `
  -H "Content-Type: application/json" `
  -d '{"source":"custom_gpt","action_type":"partner_status_update_draft","referral_id":"prf_123","deal_stage":"documents_pending","update_type":"document_update","borrower_disclosure_level":"minimal"}'
```
