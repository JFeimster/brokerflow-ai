# Partner Referral Submission Action

**Operation:** `submitPartnerReferral`
**Endpoint:** `POST /api/no-auth/partner-referral`
**Schema:** `schemas/no-auth-partner-referral-submission.schema.yaml`

Captures partner and referred-business context, contact permission, and warm-introduction availability. The handler assigns a tracking ID, reports whether supplied fields are ready for borrower intake or high-level lender-fit routing, and optionally forwards the allowlisted payload to a configured workflow.

Readiness means required scenario fields were supplied. It is not a borrower credit score, qualification, lender decision, approval, or funding indication. When contact permission is false, the next step is consent collection or a partner-mediated introduction; do not contact the borrower directly.

Configure `PARTNER_REFERRAL_WEBHOOK_URL` and optional `PARTNER_REFERRAL_SHARED_SECRET`. Outbound requests reuse `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`. The request `shared_secret` is removed before forwarding. Webhook retries may create duplicate downstream records; check downstream state after a 502.

```powershell
curl.exe -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-referral `
  -H "Content-Type: application/json" `
  -d '{"source":"custom_gpt","action_type":"partner_referral","partner_id":"partner_123","partner_name":"Alex Rivera","referral_type":"working_capital","borrower_name":"Jordan Lee","business_name":"Lee Design Studio","borrower_email":"jordan@example.com","borrower_state":"NY","requested_amount":75000,"loan_purpose":"Purchase inventory","relationship_to_borrower":"client","permission_to_contact":true,"warm_intro_available":true}'
```
