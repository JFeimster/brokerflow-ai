# Automated Trusted Intake

The protected GPT Action is `createPersistedLenderMatchReview` in `schemas/no-auth-brokerflow-actions.combined.schema.yaml`. It calls only `POST /api/ingest/lender-match-review`, requires a bearer credential and `Idempotency-Key`, and is bound to the organization configured in `BROKERFLOW_INGEST_ORGANIZATION_ID`. The older no-auth lender review action does not create a durable review and must not be used for this workflow.

For each accepted request, the API authenticates the integration, validates the allowlisted funding scenario, checks that the configured organization is active, consumes a durable rate-limit slot, and invokes the atomic review RPC. That RPC commits one `queued_for_human_review` row and one `trusted_integration` creation event. A retry with the same key and same normalized payload returns the same `review_request_id` with `duplicate: true`; reuse of a key with changed content returns HTTP 409. The authorized broker Review Queue queries the same organization-scoped row. No endpoint makes a lending decision or submits an application.

## Durable rate limits

`supabase/migrations/20261019000100_brokerflow_rate_limits.sql` adds a prefixed counter table and service-role-only atomic RPC. PostgreSQL upsert serializes concurrent requests for the same identity, scope, and minute. The table stores SHA-256 identity hashes, not bearer tokens or user IDs. Current per-minute limits are 60 trusted ingestions per configured organization, 30 authenticated review creations per organization/user, and 60 review actions per organization/user. Exceeded requests return HTTP 429 and `Retry-After`; inability to use the limiter returns HTTP 503. Old windows are pruned opportunistically after seven days.

No Vercel Firewall feature or paid service is enabled. The migration is tested only in the disposable PostgreSQL CI service. It must not be applied to shared `platform-core` without separate owner authorization.

## Owner-controlled activation

The implementation is ready, but live automation needs the owner to configure one credential and target:

1. Apply and verify the two prepared BrokerFlow migrations (`20261018000100_brokerflow_reviews.sql` and `20261019000100_brokerflow_rate_limits.sql`) through the approved change process on the explicitly selected database. The PR and CI do not apply them to shared `platform-core`.
2. Configure server-only Vercel variables `BROKERFLOW_INGEST_API_KEY` and `BROKERFLOW_INGEST_ORGANIZATION_ID` for the intended environment. Confirm the existing Supabase OTP controls and explicit organization review permissions remain in place.
3. In GPT Builder, import the combined Action schema, configure API Key/Bearer authentication with the same ingest credential, and test with synthetic business funding information. Use the stable `review_request_id` to confirm the broker-visible queue and event.

Do not put the integration credential in the Action schema, source code, GitHub Actions, test fixtures, or PR description. Start with Preview; production activation remains a separate release decision.
