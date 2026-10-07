# Partner Onboarding Checklist Workflow

1. Receive `POST /api/no-auth/partner-onboarding-checklist`; validate source, action type, partner type, optional enums, booleans, completed item keys, and configured request secret.
2. Generate the checklist deterministically from partner type, referral model, compensation model, and requested training, messaging, and CRM setup.
3. Store the checklist ID, status, missing/completed item keys, partner segment, and recommended next step in the partner CRM or task queue.
4. If configured, forward the allowlisted result and input to `PARTNER_ONBOARDING_CHECKLIST_WEBHOOK_URL`; validate the shared outbound `x-brokerflow-secret` when configured.
5. Treat compensation notes as descriptive only. Keep private borrower records and request secrets out of downstream payloads.

The endpoint returns 502 when delivery is unconfirmed. Check downstream state before retrying because this action does not provide idempotency keys.
