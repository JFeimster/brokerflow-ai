# API Key Actions — CRM Actions

> Part of the BrokerFlow AI Actions library.
> Auth tier: **API Key** (Basic, Bearer, or custom header such as `X-Api-Key`).
> See `actions/api-key/README.md` for how API Key auth is configured, and
> `actions/actions-authentication-decision-guide.md` for choosing a tier.

---

## Purpose

These Actions let the Loan Broker Automation Architect GPT read from and write to
your CRM so it can keep borrower records, pipeline stages, notes, and follow-up
tasks in sync — using an API-key-authenticated connector instead of public,
no-auth webhooks.

Use this tier when your CRM exposes a stable HTTPS API and you can issue a
scoped API key. If you only have inbound automation webhooks (n8n/Zapier/Make),
use the no-auth tier instead (`actions/no-auth/`).

---

## Core operating principle (non-negotiable)

BrokerFlow AI may **recommend, draft, prepare, route, and log**. It must **never
approve, decline, qualify, guarantee, underwrite, or fund**. Every CRM write
that could imply a funding outcome must set `human_review_required: true` and
route the decision to a human owner.

**Safe language** to write into CRM notes/fields:
- "potential fit", "ready for broker review", "possible lender match",
  "based on information provided".

**Never** write these as system-generated conclusions:
- "approved", "guaranteed", "qualified", "eligible", "declined".

Any stage that represents a decision (e.g. moving to a lender-submission stage)
must be expressed as *pending review*, not as a completed approval.

---

## Authentication

This connector authenticates with an API key. Pick the scheme your CRM expects:

- **Bearer**: `Authorization: Bearer <CRM_API_KEY>`
- **Basic**: `Authorization: Basic <base64(user:key)>`
- **Custom header**: `X-Api-Key: <CRM_API_KEY>`

Configuration values come from `.env` (see `.env.example`):
- `CRM_API_BASE_URL` — base URL for all endpoints below.
- `CRM_API_KEY` — the scoped key.
- `API_KEY_AUTH_SCHEME` — basic | bearer | custom-header.
- `API_KEY_CUSTOM_HEADER_NAME` — header name when scheme = custom-header.

Scope the key to the minimum needed: read/write contacts, deals, notes, and
tasks. Do not grant billing, user-management, or delete-all scopes.

---

## Shared request envelope

Every write Action sends the standard BrokerFlow envelope so the CRM (or a relay
in front of it) can verify origin and enforce review:

    {
      "source": "loan-broker-automation-architect-gpt",
      "event_type": "crm.contact.upsert",
      "event_id": "evt_8f3c2fe3",
      "submitted_at": "2026-06-30T12:00:00Z",
      "shared_secret": "<WEBHOOK_SHARED_SECRET or omit when key-auth is enough>",
      "human_review_required": true,
      "payload": { }
    }

Standard response statuses returned to the GPT:
`received`, `accepted`, `queued`, `processed`, `error`, `invalid_request`.

---

## Canonical enums

**Pipeline stages** (use these exact values):
new_lead, contacted, application_sent, application_received, docs_missing,
ready_for_broker_review, lender_submission_pending_review, submitted_to_lender,
lender_response_received, borrower_follow_up_needed, funded,
not_moving_forward, renewal_follow_up, stale, closed.

Decision-bearing stages — `submitted_to_lender`, `funded` — must **never** be
set by the GPT directly. The GPT may only advance to `ready_for_broker_review`
or `lender_submission_pending_review` and flag for a human.

**Document types**:
bank_statements, business_tax_return, personal_tax_return, driver_license,
voided_check, debt_schedule, profit_and_loss, balance_sheet, application, other.

---

## Action catalog

### 1. Upsert Contact / Borrower
- **Intent**: create or update a borrower record from intake info.
- **Method / path**: `POST {CRM_API_BASE_URL}/contacts/upsert`
- **Writes**: name, business name, email, phone, source, tags.
- **Guardrail**: never write decision language into contact fields.
- **Payload**:

      {
        "match_on": "email",
        "contact": {
          "first_name": "Jordan",
          "last_name": "Avery",
          "business_name": "Avery Logistics LLC",
          "email": "jordan@averylogistics.example.com",
          "phone": "+1-555-0142",
          "source": "website_intake",
          "tags": ["new_lead", "needs_review"]
        }
      }

- **Response**:

      { "status": "processed", "contact_id": "cON_10293", "created": true }

### 2. Create / Update Deal
- **Intent**: open or update the funding opportunity tied to a contact.
- **Method / path**: `POST {CRM_API_BASE_URL}/deals/upsert`
- **Writes**: amount_requested, product_interest, stage, notes.
- **Guardrail**: `stage` limited to non-decision stages (see enums above).
- **Payload**:

      {
        "match_on": "deal_id",
        "deal": {
          "contact_id": "cON_10293",
          "amount_requested": 75000,
          "product_interest": "working_capital",
          "stage": "ready_for_broker_review",
          "human_review_required": true,
          "summary": "Potential fit based on information provided; ready for broker review."
        }
      }

- **Response**:

      { "status": "processed", "deal_id": "dEAL_55012", "stage": "ready_for_broker_review" }

### 3. Advance Pipeline Stage (review-safe)
- **Intent**: move a deal forward to a review checkpoint only.
- **Method / path**: `PATCH {CRM_API_BASE_URL}/deals/{deal_id}/stage`
- **Allowed targets**: contacted, application_sent, application_received,
  docs_missing, ready_for_broker_review, lender_submission_pending_review,
  borrower_follow_up_needed, renewal_follow_up, stale.
- **Blocked targets** (require a human): submitted_to_lender, funded,
  not_moving_forward, closed.
- **Payload**:

      {
        "target_stage": "lender_submission_pending_review",
        "reason": "All documents received; prepared package ready for broker review.",
        "human_review_required": true
      }

- **Response**:

      { "status": "accepted", "deal_id": "dEAL_55012", "pending_review": true }

### 4. Add Note / Activity Log
- **Intent**: append a timestamped note or conversation summary.
- **Method / path**: `POST {CRM_API_BASE_URL}/deals/{deal_id}/notes`
- **Guardrail**: factual, review-safe language only.
- **Payload**:

      {
        "type": "conversation_summary",
        "body": "Borrower confirmed 14 months in business and ~$40k monthly revenue. Possible lender match pending broker review.",
        "author": "brokerflow-ai"
      }

- **Response**:

      { "status": "processed", "note_id": "nOTE_9001" }

### 5. Create Follow-up Task
- **Intent**: queue a human action with an owner and due date.
- **Method / path**: `POST {CRM_API_BASE_URL}/tasks`
- **Payload**:

      {
        "deal_id": "dEAL_55012",
        "title": "Broker review: confirm lender match and next steps",
        "owner_email": "broker@moonshinecapital.example.com",
        "due_at": "2026-07-01T16:00:00Z",
        "priority": "high",
        "human_review_required": true
      }

- **Response**:

      { "status": "processed", "task_id": "tASK_7781" }

### 6. Record Missing-Document Request
- **Intent**: log which documents are outstanding (uses document-type enum).
- **Method / path**: `POST {CRM_API_BASE_URL}/deals/{deal_id}/document-requests`
- **Payload**:

      {
        "missing": ["bank_statements", "business_tax_return", "voided_check"],
        "note": "Requested from borrower; deal set to docs_missing.",
        "set_stage": "docs_missing"
      }

- **Response**:

      { "status": "processed", "request_id": "dREQ_4410", "stage": "docs_missing" }

### 7. Fetch Deal Status (read-only)
- **Intent**: read current stage, amount, owner, and open tasks.
- **Method / path**: `GET {CRM_API_BASE_URL}/deals/{deal_id}`
- **Response**:

      {
        "status": "processed",
        "deal_id": "dEAL_55012",
        "stage": "ready_for_broker_review",
        "amount_requested": 75000,
        "owner_email": "broker@moonshinecapital.example.com",
        "open_tasks": 1
      }

### 8. Search Contacts / Deals (read-only)
- **Intent**: look up records before writing to avoid duplicates.
- **Method / path**: `GET {CRM_API_BASE_URL}/search?q=...&type=contact|deal`
- **Response**:

      {
        "status": "processed",
        "results": [
          { "contact_id": "cON_10293", "name": "Jordan Avery", "deal_id": "dEAL_55012" }
        ]
      }

---

## Error handling

- On `invalid_request`, surface the field-level message to the user and do not
  retry blindly.
- On `error` with a 5xx, retry once with backoff; if it still fails, log and
  tell the user the CRM is unavailable — do not fabricate a success.
- Never report a write as complete unless the response status is `processed`,
  `accepted`, or `queued`.

---

## Testing checklist

- [ ] API key stored in env, never hard-coded; correct auth scheme selected.
- [ ] Upsert is idempotent on the chosen `match_on` key (no duplicate contacts).
- [ ] Stage changes reject all blocked/decision stages with a clear message.
- [ ] Every decision-adjacent write sets `human_review_required: true`.
- [ ] No note or field ever contains "approved", "guaranteed", "qualified",
      or "eligible" as a system-generated conclusion.
- [ ] Read actions are used before writes to prevent duplicates.
- [ ] Failures are reported honestly; no fabricated success responses.

---

## Related files

- `actions/api-key/README.md` — API Key auth setup.
- `actions/api-key/actions-api-key-pipeline-actions.md` — deeper pipeline ops.
- `actions/api-key/actions-api-key-airtable-actions.md` — Airtable as a store.
- `actions/api-key/actions-api-key-schema-examples.md` — full OpenAPI snippets.
- `actions/no-auth/borrower-intake-actions.md` — the no-auth equivalent.