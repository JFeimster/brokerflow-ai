# Partner Reactivation / Nurture Workflow

1. Receive `POST /api/no-auth/partner-reactivation`; validate segment, optional dates, channel, relationship strength, configured request secret, and supported fields.
2. Select the fixed segment plan and prepare a message, recommended channel, priority, cadence, and next step.
3. Create a CRM activity or internal task using `reactivation_id`; assign high-value dormant partner follow-up to the relationship manager.
4. Optionally forward the allowlisted result and input to `PARTNER_REACTIVATION_WEBHOOK_URL` with the shared `x-brokerflow-secret` header.
5. Respect opt-outs and stop after the finite cadence. For `prospect_never_contacted`, use initial-outreach handling.

An unconfirmed downstream delivery returns a generic tracked 502. Check downstream state before retrying; idempotency keys are not implemented.
