# Partner Action Idempotency and Persistence Plan

## Current retry risk

Handlers generate a random tracking ID for each request and do not persist request state. The request ID is not an idempotency key. A caller retry after timeout or a handler 502 can invoke the webhook twice even if the first delivery created a downstream record. The webhooks have no built-in retry queue or delivery receipt store.

## Recommended design

1. Accept a caller-supplied `Idempotency-Key` header (or an explicit request `idempotency_key`) and scope it by action, partner, and tenant/source. Hash the key before storage; do not log secrets.
2. Persist a request fingerprint, `in_progress`/`succeeded`/`failed` state, original action tracking ID, response, and webhook delivery result with a TTL of at least 7 days. Same key + same payload returns the stored response; same key + different payload returns 409.
3. Use a transactional outbox for webhook delivery. Commit the referral/log record and outbox message together; deliver with bounded exponential retry and a stable webhook event ID. Mark delivery only after receiver acknowledgement.
4. Require downstream consumers to enforce unique external IDs. For referrals, dedupe by stable referral submission ID and/or a reviewed composite such as normalized partner ID + borrower/business identity + time window. Do not silently merge a potential duplicate with a different consent state.
5. For CRM integrations, store source partner ID, referral ID, action ID, and provider record ID with unique constraints. Treat caller-provided referral IDs as correlation values, not proof that a record is unique.

## Storage options

- **Preferred system of record:** Postgres/Supabase (or the existing CRM if it supports atomic unique constraints and audit history) for referrals, attribution logs, idempotency keys, and outbox rows.
- **Short-lived idempotency cache:** Redis/Vercel KV can suppress short retry windows, but should not be the only attribution/audit system of record.
- **Workflow-only implementation:** n8n/Zapier/Make can work if the receiver has a durable store and unique-key/locking behavior. A workflow execution history alone may not provide safe exactly-once effects.

## Priority

1. Partner Referral Submission: borrower PII, source ownership, and consent state can be duplicated or overwritten.
2. Partner Attribution Log: duplicate rows can confuse eligibility/dispute workflows; record changes need audit history.
3. Affiliate Partner Signup and Channel Partner Prospect Capture: duplicate partner/CRM records create operational noise.
4. Partner Status Update Draft and reactivation/outreach triggers: retries can produce duplicate communication tasks or messages.
5. Scoring, call prep, objection, onboarding checklist, and enablement drafts: lower data-integrity urgency, but keep tracking IDs for correlation.

Do not claim idempotency until storage and retry behavior are implemented and tested. For payment/payout state, use a protected audited ledger workflow; this recommendation does not authorize payment handling in BrokerFlow's no-auth endpoint.
