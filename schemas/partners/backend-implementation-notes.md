# Backend Implementation Notes — Partner Actions

This document describes how to implement the backend layer behind the partner OpenAPI schemas.

## Architecture Pattern

Use a controlled backend or automation gateway between GPT Builder and business systems.

```txt
Custom GPT Action
  -> OpenAPI schema
  -> controlled endpoint or webhook
  -> validation layer
  -> workflow router
  -> CRM / task system / automation tool
  -> human-review queue
```

The GPT should never write directly to sensitive production systems without a validation and review layer.

## Backend Responsibilities

Every backend endpoint should handle:

- authentication or shared-secret validation
- request validation
- dedupe
- rate limiting
- structured logging
- workflow routing
- error responses
- human-review enforcement
- safe data minimization

## No-Auth Webhook Backend

No-auth webhook endpoints should still protect themselves.

Minimum validation:

```txt
shared_secret exists
shared_secret matches environment value
event_id exists
event_type is allowed
payload exists
required nested fields exist
```

Recommended environment variables:

```txt
BROKERFLOW_PARTNER_WEBHOOK_SECRET
BROKERFLOW_ENV=staging|production
BROKERFLOW_LOG_LEVEL=info
```

Recommended webhook response:

```json
{
  "status": "accepted",
  "message": "Event received and queued for review.",
  "external_record_id": "rec_test_001"
}
```

Reject invalid requests with:

```json
{
  "status": "invalid_request",
  "message": "Missing required field: event_id"
}
```

## API-Key Backend

API-key endpoints should sit behind your own API wrapper.

Recommended auth check:

```http
Authorization: Bearer YOUR_API_KEY
```

Backend expectations:

- validate bearer key
- use different staging and production keys
- rotate keys periodically
- log every write operation
- block destructive write operations
- avoid exposing raw CRM/provider responses to GPT

Recommended headers:

```http
Authorization: Bearer <BROKERFLOW_API_KEY>
Content-Type: application/json
Idempotency-Key: optional-client-generated-key
```

## OAuth Backend

OAuth schemas should preferably target wrapper endpoints you control rather than direct provider APIs.

Recommended provider integrations:

- Google Calendar for partner discovery calls
- Google Drive for partner resource folders
- HubSpot for partner CRM workflows
- Notion or Airtable for internal partner ops records

OAuth safety rules:

- use least-privilege scopes
- store tokens securely
- support token revocation
- handle expired tokens gracefully
- never place private borrower documents in partner folders
- never include borrower-sensitive data in event descriptions

## Data Minimization

Partner Actions should use references rather than sensitive payloads.

Prefer:

```txt
partner_id
lead_id
deal_id
review_id
resource_id
campaign_id
```

Avoid:

```txt
bank statements
tax returns
SSNs
full financial statements
raw borrower documents
lender credentials
private underwriting notes
```

## Human-Review Queue

Any workflow involving funding-adjacent actions, partner activation, partner-facing content, payout readiness, or borrower details should create a review task.

Suggested review task fields:

```json
{
  "task_type": "partner_review",
  "partner_id": "partner_test_001",
  "source_action": "scorePartnerFit",
  "priority": "medium",
  "human_review_required": true,
  "notes": "Review partner fit score and recommended next action."
}
```

## Idempotency

Use `event_id` for no-auth webhooks and `Idempotency-Key` for API-key writes.

Backend behavior:

- first request: process normally
- duplicate request: return prior accepted/processed status
- conflicting duplicate: reject and log

Suggested duplicate response:

```json
{
  "status": "accepted",
  "message": "Duplicate event ignored; original event already processed.",
  "external_record_id": "rec_test_001"
}
```

## Rate Limiting

Suggested default limits:

```txt
No-auth intake webhooks: 30 requests/min/source
No-auth internal triggers: 30-60 requests/min/source
API-key backend writes: 30-60 requests/min/key
API-key analytics reads: 60-120 requests/min/key
OAuth wrapper endpoints: provider limits apply
```

Rate-limit response:

```json
{
  "status": "error",
  "message": "Rate limit exceeded. Try again later."
}
```

## Logging

Log these fields for every Action call:

```txt
request_id
event_id or idempotency_key
operation_id
source
auth_type
partner_id
lead_id if present
deal_id if present
human_review_required
status
created_at
```

Do not log full sensitive payloads.

## Suggested Backend Routes

No-auth routes:

```txt
POST /webhook/partner-signup
POST /webhook/partner-referral-lead
POST /webhook/channel-partner-prospect
POST /webhook/warm-intro-request
POST /webhook/partner-followup
```

API-key routes:

```txt
POST /partners/upsert
POST /partner-attribution/events
POST /partners/{partner_id}/onboarding-checklist
POST /partners/{partner_id}/health-check
POST /partners/{partner_id}/resource-recommendations
POST /partners/{partner_id}/quarterly-review
```

OAuth wrapper routes:

```txt
GET /availability
POST /partner-discovery-call
POST /partner-resource-folder
```

## Deployment Notes

For Vercel static projects, these schemas are documentation/API-contract assets unless API routes are added separately.

Implementation options:

- n8n webhooks for no-auth endpoints
- Zapier/Make webhooks for lightweight intake
- Vercel Functions for API-key wrapper endpoints
- HubSpot private app/API wrapper for CRM sync
- Airtable API wrapper for partner ops records
- Google OAuth wrapper for Calendar/Drive

## Backend Acceptance Criteria

A backend implementation is ready when:

- no-auth webhooks validate `shared_secret`
- writes are idempotent
- API-key endpoints reject invalid keys
- OAuth flows use least-privilege scopes
- human-review tasks are created where required
- logs capture source/action/status without sensitive payload leakage
- rate limits are active
- error responses are stable and GPT-readable
- no endpoint can automatically approve, fund, pay, activate, deactivate, or submit a deal to a lender
