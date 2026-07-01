# Vercel Environment: Lender Match Review

File path: `docs/lender-match-review-vercel-env.md`

## Required

No environment variables are strictly required for local testing. With no webhook configured, the serverless function logs the payload and returns a success response.

## Optional

### `LENDER_MATCH_REVIEW_WEBHOOK_URL`

Full downstream automation webhook URL for n8n, Zapier, Make, Pipedream, or a custom workflow receiver.

### `LENDER_MATCH_REVIEW_SHARED_SECRET`

Optional body-level shared secret. When set, requests must include matching `shared_secret`.

### `WEBHOOK_SHARED_SECRET`

Optional header-level secret sent to the downstream automation workflow as `x-brokerflow-secret`.

## Endpoint

`POST https://brokerflow-ai.vercel.app/api/no-auth/lender-match-review`
