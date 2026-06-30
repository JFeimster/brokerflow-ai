# API Key Authentication — Overview
> Folder: `actions/api-key/` · Repo: `brokerflow-ai` · GPT: Loan Broker Automation Architect (BrokerFlow AI)
## What this folder covers
This folder documents how to connect the BrokerFlow AI Custom GPT to your CRM or backend using **API key authentication**. It contains the overview (this file), one doc per API-key variant, the CRM and pipeline action references, and copy/paste schema examples. Pair these docs with the matching OpenAPI schema in `schemas/`.
## When to use API key auth
Use API key auth when your CRM/backend issues a static secret (an API key or token) that the GPT sends on every request. It is the fastest auth to stand up and fits internal tools, Airtable, GoHighLevel, and most custom CRMs. Use OAuth instead (see `actions/oauth/`) when you need per-user consent, token refresh, or a provider that mandates OAuth (e.g. HubSpot, QuickBooks, Google Drive).
## The three API-key variants
| Variant | Where the key goes | Doc | Schema |
| --- | --- | --- | --- |
| Basic / default header | `Authorization: <key>` | `actions-api-key-basic.md` | `schemas/openapi-api-key-basic.yaml` |
| Bearer token | `Authorization: Bearer <key>` | `actions-api-key-bearer.md` | `schemas/openapi-api-key-bearer.yaml` |
| Custom header | `X-Api-Key: <key>` (or your own) | `actions-api-key-custom-header.md` | `schemas/openapi-api-key-custom-header.yaml` |
Pick exactly one variant that matches what your CRM expects. The `components-shared.yaml` schema holds the shared schemas (request/response objects, enums) referenced by all variants.
## Required environment variables
Set these in your backend / proxy (never hardcode secrets into the schema):
| Variable | Purpose | Example |
| --- | --- | --- |
| `CRM_API_BASE_URL` | Base URL all Actions call | `https://api.your-crm.example.com` |
| `CRM_API_KEY` | The secret sent on each request | `sk_live_...` |
| `API_KEY_AUTH_SCHEME` | Which variant is active | `bearer` \| `basic` \| `custom_header` |
| `API_KEY_CUSTOM_HEADER_NAME` | Header name when using the custom-header variant | `X-Api-Key` |
## Actions exposed (8 operationIds)
All variants expose the same operations; only the auth header differs.
| operationId | Method | Purpose |
| --- | --- | --- |
| `upsertContact` | POST | Create or update a borrower/contact record |
| `upsertDeal` | POST | Create or update a deal/funding application |
| `advanceDealStage` | POST | Move a deal to a new pipeline stage (review-safe stages only) |
| `addDealNote` | POST | Append a timestamped note to a deal |
| `createFollowUpTask` | POST | Schedule a follow-up task/reminder |
| `recordMissingDocuments` | POST | Flag which required documents are still outstanding |
| `getDealStatus` | GET | Read a deal's current stage, notes, and missing docs |
| `searchRecords` | GET | Search contacts/deals by query |
## Pipeline stage guardrail (review-safe writes)
`advanceDealStage` must only **write** stages a GPT is allowed to set. The schema enforces a `ReviewSafeStage` allowlist:
- **Writable:** `new_lead`, `contacted`, `application_sent`, `application_received`, `docs_missing`, `ready_for_broker_review`, `lender_submission_pending_review`, `borrower_follow_up_needed`, `renewal_follow_up`, `stale`
- **Blocked (human-only):** `submitted_to_lender`, `lender_response_received`, `funded`, `not_moving_forward`, `closed`
`getDealStatus` may *read* any stage; only writes are restricted.
## Compliance language (hard rule)
BrokerFlow AI may recommend, draft, prepare, route, and log — it must never approve, decline, qualify, underwrite, guarantee, or fund. Notes, tasks, and statuses must use safe language: "potential fit", "ready for broker review", "possible lender match", "based on information provided". Never write "approved", "guaranteed", "qualified", or "eligible" into CRM records.
## Setting it up in the OpenAI Actions builder
1. Open your GPT → **Configure** → **Actions** → **Create new action**.
2. Paste the matching schema from `schemas/` into the schema box.
3. Under **Authentication**, choose **API Key**, then set the auth type to match your variant (Bearer, Basic, or Custom header name).
4. Paste your `CRM_API_KEY` value as the key.
5. Set the schema `servers.url` to your `CRM_API_BASE_URL`.
6. Save, then test each operation with a sandbox record before going live.
## See also
- `actions-api-key-basic.md` · `actions-api-key-bearer.md` · `actions-api-key-custom-header.md`
- `actions-api-key-crm-actions.md` · `actions-api-key-pipeline-actions.md` · `actions-api-key-schema-examples.md`
- `actions-api-key-airtable-actions.md` · `actions-api-key-gohighlevel.md`
- OAuth alternative: `actions/oauth/actions-oauth-overview.md`
