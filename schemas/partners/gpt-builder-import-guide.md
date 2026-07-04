# GPT Builder Import Guide — Partner Action Schemas

This guide explains how to prepare the partner OpenAPI schemas in this folder for use inside GPT Builder Actions.

## Purpose

The partner schema set is designed to give a Custom GPT controlled ways to trigger internal workflows for partner, affiliate, referral partner, and channel partner operations.

Use these Actions for:

- partner signup intake
- referral lead intake
- COI prospect capture
- warm-intro requests
- partner CRM sync
- partner attribution
- onboarding and training workflow triggers
- partner health checks
- partner resource recommendations
- partner quarterly review prep

Do not use these Actions for approval, underwriting, funding, payment, lender submission, or automatic partner activation.

## Before Importing

Each schema uses placeholder base URLs. Replace these before importing into GPT Builder:

```txt
https://YOUR-AUTOMATION-DOMAIN.com
https://brokerflow-ai.vercel.app/api
https://brokerflow-ai.vercel.app/api/calendar
https://brokerflow-ai.vercel.app/api/drive
```

For no-auth webhook Actions, set the server URL to your real automation endpoint such as:

```txt
https://n8n.example.com
https://hooks.zapier.com
https://hook.make.com
```

For API-key Actions, use a backend you control:

```txt
https://brokerflow-ai.vercel.app/api
https://api.yourdomain.com/v1
```

For OAuth Actions, replace placeholder provider OAuth URLs with the real provider or wrapper OAuth endpoints before production use.

## Recommended Import Order

Start with the lowest-risk Actions first.

```txt
1. openapi-no-auth-partner-signup.yaml
2. openapi-no-auth-referral-lead-intake.yaml
3. openapi-no-auth-channel-partner-prospect.yaml
4. openapi-no-auth-warm-intro-request.yaml
5. openapi-no-auth-partner-followup-trigger.yaml
```

Then import controlled backend Actions:

```txt
6. openapi-api-key-partner-crm-sync.yaml
7. openapi-api-key-partner-attribution.yaml
8. openapi-api-key-partner-onboarding.yaml
9. openapi-api-key-partner-fit-scoring.yaml
10. openapi-api-key-partner-program-review.yaml
11. openapi-api-key-partner-training-progress.yaml
12. openapi-api-key-partner-health-monitor.yaml
13. openapi-api-key-partner-resource-recommendations.yaml
14. openapi-api-key-partner-quarterly-review.yaml
```

Import OAuth Actions last:

```txt
15. openapi-oauth-partner-calendar-scheduling.yaml
16. openapi-oauth-partner-drive-folder.yaml
```

## GPT Builder Setup Steps

1. Open GPT Builder.
2. Go to **Configure**.
3. Open **Actions**.
4. Create a new Action.
5. Paste one OpenAPI schema file into the schema editor.
6. Replace placeholder server URLs before saving.
7. Configure authentication:
   - No-auth schemas: no auth in GPT Builder; backend should still validate `shared_secret`.
   - API-key schemas: use API Key / Bearer token auth.
   - OAuth schemas: configure OAuth provider URLs and scopes.
8. Test one endpoint at a time using non-sensitive sample data.
9. Confirm the backend logs show the expected event.
10. Confirm human-review tasks are created for review-required workflows.

## Authentication Setup

### No Auth

No-auth does not mean no protection. These payloads include:

```txt
event_id
shared_secret
human_review_required
```

The automation backend should:

- validate `shared_secret`
- dedupe by `event_id`
- reject missing required fields
- log source and submitted timestamp
- route funding-adjacent actions to human review

### API Key Bearer

Use GPT Builder API Key authentication with Bearer format:

```http
Authorization: Bearer YOUR_API_KEY
```

Backend expectations:

- reject missing or invalid keys
- support staging and production keys
- log every write action
- rate limit by key
- avoid delete/destructive endpoints

### OAuth

OAuth schemas are wrapper-oriented. Prefer a thin controlled backend wrapper for Google Calendar, Google Drive, HubSpot, or other providers.

OAuth requirements:

- use least-privilege scopes
- avoid broad account permissions
- do not store private borrower documents in partner resource folders
- do not include sensitive borrower details in calendar events

## Safe Test Payload Rules

Use synthetic test data only:

```txt
partner_id: partner_test_001
lead_id: lead_test_001
deal_id: deal_test_001
email: test@example.com
phone: +15555550123
```

Do not use:

- real borrower SSNs
- bank statements
- tax returns
- personal credit data
- real lender credentials
- private borrower documents

## Success Criteria

A schema is ready for GPT Builder use when:

- GPT Builder accepts the schema without validation errors
- authentication is correctly configured
- test calls reach the backend
- backend validates shared secrets or API keys
- duplicate `event_id` values are rejected or ignored
- human-review flags create review tasks where required
- no Action can approve, decline, qualify, underwrite, fund, pay, or activate automatically

## Recommended GPT Instruction Snippet

Add this to the GPT instructions for partner Actions:

```txt
Use partner Actions only to create internal records, queue review tasks, log attribution, prepare summaries, or recommend next internal actions. Never approve partners, activate partners, promise funding, submit deals to lenders, authorize payouts, or send external partner-facing messages without human review. When an Action includes `human_review_required`, preserve it and explain that the next step is internal review.
```
