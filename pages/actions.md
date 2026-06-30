---
title: BrokerFlow Actions — CRM Sync, Pipeline, Documents, Tasks
description: The connected actions BrokerFlow AI uses to keep your CRM clean and deals moving — all writes route through review-safe stages.
slug: /actions
order: 3
---
# Actions
Actions are how BrokerFlow AI does work in your stack. Each action is a single, well-scoped operation — create a contact, advance a stage, log a note, request a document — exposed to the agent through an authenticated API. Actions never make lending decisions; they move data and prepare files for human review.
> Every write that touches a deal can only set a **review-safe stage**. Decision-bearing stages (submitted to lender, funded, closed) are blocked at the schema level and require a human.
## Core operations
BrokerFlow ships with eight core operations that cover the full intake-to-review loop:
| Operation | What it does | Writes? |
| --- | --- | --- |
| `upsertContact` | Create or update a borrower/contact record | Yes |
| `upsertDeal` | Create or update a deal record | Yes |
| `advanceDealStage` | Move a deal to a review-safe stage | Yes |
| `addDealNote` | Log a note on a deal | Yes |
| `createFollowUpTask` | Create a follow-up task for a broker | Yes |
| `recordMissingDocuments` | Flag and track missing documents | Yes |
| `getDealStatus` | Read a deal's current status and pipeline | No |
| `searchRecords` | Search contacts and deals | No |
## Review-safe writes
All write operations validate the target stage against an allowlist:
- **Agent may set:** new_lead, contacted, application_sent, application_received, docs_missing, ready_for_broker_review, lender_submission_pending_review, borrower_follow_up_needed, renewal_follow_up, stale.
- **Blocked (human only):** submitted_to_lender, lender_response_received, funded, not_moving_forward, closed.
Reads (`getDealStatus`, `searchRecords`) can return the full pipeline so the agent can summarize accurately; only writes are constrained.
## What the actions cover
- **CRM sync.** Keep contacts and deals current without manual copy/paste.
- **Pipeline hygiene.** Advance review-safe stages and surface stale or stuck deals.
- **Document tracking.** Record what is missing or received (bank statements, tax returns, P&L, and more) and prepare reminders.
- **Tasks & notes.** Create follow-up tasks and log a clean activity trail.
- **Status reads.** Answer "where does this deal stand?" from live data.
## Authentication
Actions are organized by how they authenticate, so you can connect them to your stack the right way:
- **No-auth webhooks** — fastest to test; best for intake, logging, notifications, and review-routing into n8n, Zapier, or Make.
- **API key** — the practical default for broker-office automations. Supports three placements:
  - Bearer: `Authorization: Bearer <key>`
  - Custom header: `X-Api-Key: <key>`
  - Basic: `Authorization: Basic <token>`
- **OAuth** — for per-user access to a CRM, calendar, or storage account (authorization-code flow).
## OpenAPI schemas
Every action set ships with a versioned OpenAPI schema under `schemas/`:
- `openapi-no-auth-webhooks.yaml`
- `openapi-api-key-bearer.yaml`
- `openapi-api-key-custom-header.yaml`
- `openapi-oauth-default-post.yaml`
- `components-shared.yaml` (shared schemas and security schemes)
All write operations are marked `x-openai-isConsequential: true` so the agent confirms before acting.
## Configuration
Actions read connection details from environment variables — credentials stay in your environment, never in chat:
- `CRM_API_BASE_URL` — base URL for your CRM/API.
- `CRM_API_KEY` — the API key or token.
- `API_KEY_AUTH_SCHEME` — `bearer`, `custom_header`, or `basic`.
- `API_KEY_CUSTOM_HEADER_NAME` — header name when using a custom header (e.g. `X-Api-Key`).
## Safety rules
- Actions never approve, decline, qualify, guarantee, or fund.
- Writes are limited to review-safe stages; decisions stay with humans.
- Sensitive document contents are never sent through chat — actions pass metadata and secure links only.
- Consequential writes always require confirmation.
## Footer
[Home](./home.md) · [Agent](./agents.md) · [Knowledge](./knowledge.md) · [Workflows](./workflows.md)
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. Actions provide operational support only and do not approve, qualify, guarantee, or fund financing.
