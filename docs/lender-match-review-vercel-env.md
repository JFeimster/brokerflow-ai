# Vercel Environment: Lender Match Review

File path: `docs/lender-match-review-vercel-env.md`

## Required

With no webhook configured, the legacy compatibility endpoint returns `persisted: false` and does not log the submitted payload. It is not the durable private review queue. Use the protected `/api/ingest/lender-match-review` endpoint described in [PR #26 setup](./pr26-live-review-queue.md) for persisted reviews.

## Optional

### `LENDER_MATCH_REVIEW_WEBHOOK_URL`

Full downstream automation webhook URL for n8n, Zapier, Make, Pipedream, or a custom workflow receiver.

### `LENDER_MATCH_REVIEW_SHARED_SECRET`

Optional body-level shared secret. When set, requests must include matching `shared_secret`.

### `WEBHOOK_SHARED_SECRET`

Optional header-level secret sent to the downstream automation workflow as `x-brokerflow-secret`.

## Endpoint

`POST https://brokerflow-ai.vercel.app/api/no-auth/lender-match-review` (legacy compatibility/webhook behavior only; never returns `persisted: true`)
