# No-Auth Actions: Webhook Patterns

This file gives you **reusable webhook patterns** for no-auth Custom GPT Actions. Instead of designing each endpoint from scratch, copy one of these patterns and adapt the fields. Every pattern is built for the Loan Broker Automation Architect GPT and assumes a public webhook on n8n, Zapier, or Make.

---

## 🧱 The Base Pattern

Every no-auth webhook Action shares the same skeleton. Start here and add fields per use case.

**Endpoint**

    POST https://your-domain.com/webhook/{event-name}

**Request body (base envelope)**

    {
      "source": "custom_gpt",
      "event_type": "borrower_intake",
      "event_id": "evt_10001",
      "submitted_at": "2026-06-30T14:25:00-04:00",
      "shared_secret": "REPLACE_WITH_YOUR_SECRET",
      "human_review_required": true,
      "payload": {
        "...": "use-case-specific fields go here"
      }
    }

**Expected response**

    {
      "status": "received",
      "message": "Webhook accepted.",
      "event_id": "evt_10001",
      "external_record_id": "rec_abc123"
    }

**Why this shape works**
- `source` and `event_type` let one webhook route many event kinds.
- `event_id` enables idempotency (avoid duplicate processing).
- `shared_secret` lets your workflow reject random hits.
- `human_review_required` keeps funding decisions human-controlled.
- `payload` isolates the use-case data from envelope metadata.

---

## 🔁 Pattern 1 — Fire-and-Forget (Trigger Only)

The GPT sends data and does not need anything back except confirmation.

**Use for:** alerts, logging, reminders, blueprint storage.

**Request**

    {
      "source": "custom_gpt",
      "event_type": "internal_alert",
      "submitted_at": "2026-06-30T14:30:00-04:00",
      "human_review_required": false,
      "payload": {
        "alert_title": "New high-priority lead",
        "message": "Sam Rivera submitted a $75k working capital request.",
        "priority": "high"
      }
    }

**Response**

    { "status": "received", "message": "Alert sent." }

---

## 📥 Pattern 2 — Create-Record (Intake)

The GPT captures structured data and the workflow creates a record.

**Use for:** borrower intake, referral leads, review tasks.

**Request**

    {
      "source": "custom_gpt",
      "event_type": "borrower_intake",
      "submitted_at": "2026-06-30T14:25:00-04:00",
      "human_review_required": true,
      "payload": {
        "borrower": {
          "first_name": "Sam",
          "last_name": "Rivera",
          "email": "sam@example.com",
          "phone": "+15555550123"
        },
        "business": {
          "legal_business_name": "Rivera Logistics LLC",
          "industry": "Transportation",
          "state": "NY",
          "monthly_revenue": 85000,
          "time_in_business_months": 38
        },
        "funding_request": {
          "product_type": "working_capital",
          "funding_amount_requested": 75000,
          "use_of_funds": "Equipment repairs and payroll"
        }
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Lead created.",
      "external_record_id": "lead_55012"
    }

---

## 📤 Pattern 3 — Request-and-Echo (Generate Draft)

The GPT sends inputs and the workflow returns a generated artifact (e.g., a checklist or status draft) for the GPT to show the user.

**Use for:** document checklists, status update drafts.

**Request**

    {
      "source": "custom_gpt",
      "event_type": "document_checklist",
      "payload": {
        "product_type": "working_capital",
        "employment_type": "business_owner"
      }
    }

**Response**

    {
      "status": "received",
      "checklist": [
        "Last 4 months business bank statements",
        "Owner driver's license",
        "Voided business check"
      ]
    }

Note: even when the workflow can return data, keep it **non-sensitive**. Return checklists and templates, not private records.

---

## ⏲️ Pattern 4 — Scheduled-Trigger (Deferred)

The GPT requests a future action; the workflow schedules it.

**Use for:** renewal reminders, follow-up sequences.

**Request**

    {
      "source": "custom_gpt",
      "event_type": "renewal_reminder",
      "payload": {
        "deal_id": "deal_12345",
        "funded_date": "2026-06-01",
        "reminder_in_days": 180,
        "channel": "email"
      }
    }

**Response**

    { "status": "queued", "message": "Renewal reminder scheduled." }

---

## 📦 Standard Response Status Values

Use a consistent set so the GPT can interpret results:

| Status | Meaning |
|--------|---------|
| `received` | Endpoint got the request |
| `accepted` | Valid and will be processed |
| `queued` | Scheduled for later |
| `processed` | Completed synchronously |
| `error` | Something went wrong (see `message`) |
| `invalid_request` | Payload failed validation |

---

## ⚠️ Error Response Pattern

Always return a readable error the GPT can relay to the user:

    {
      "status": "invalid_request",
      "message": "Missing required field: borrower.email",
      "errors": ["borrower.email is required"]
    }

---

## 🧪 Idempotency Tip

Send a unique `event_id` on every call. In your workflow, store seen `event_id`s and skip duplicates. This prevents double-creating a lead if the GPT retries.

---

## 🛡️ Pattern Guardrails

- Keep `human_review_required: true` for any deal-related event.
- Never put raw documents, full SSNs, or credit-report data in `payload`.
- Validate the `shared_secret` server-side before processing.
- Strip or mask sensitive fields in any logs your workflow writes.

---

## 🔗 Next

- Concrete intake Actions → `actions-no-auth-borrower-intake-actions.md`
- Copy-paste OpenAPI → `actions-no-auth-schema-examples.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*