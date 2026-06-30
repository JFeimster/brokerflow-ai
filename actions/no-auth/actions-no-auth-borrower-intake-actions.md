# No-Auth Actions: Borrower Intake

This file defines the **no-auth intake Actions** for the Loan Broker Automation Architect GPT. These are the highest-value Actions to build first: they turn the GPT into a front-end intake assistant that captures structured borrower, referral, and review data and routes it into your workflow tools.

All Actions here are **write-only** and **human-review-gated**. None of them approve, qualify, or submit a borrower.

---

## 📋 Actions in This File

| Action Name | Description | Required Inputs | Optional Inputs | Result | Human Review |
|-------------|-------------|-----------------|-----------------|--------|--------------|
| Submit Borrower Intake | Sends borrower info to broker workflow webhook | Name, email, phone, business name, funding amount requested | Monthly revenue, time in business, industry, credit score range, use of funds | Intake record created | Yes |
| Submit Referral Lead | Sends referral partner lead details to workflow | Partner name, borrower name, borrower email, borrower phone | Business name, requested amount, notes | Referral lead logged | Yes |
| Create Review Task | Creates a task for broker/processor review | Borrower name, task type, notes | Priority, due date, owner | Review task created | Yes |
| Send Broker Alert | Sends an urgent alert to broker/team | Alert title, borrower name, message | Deal status, source, priority | Internal notification sent | Yes |
| Log GPT Summary | Sends structured conversation summary to storage | Summary, borrower name, timestamp | Tags, next step, owner | Summary logged | Optional |

---

## 🔑 Shared Conventions

- **Auth type:** None
- **Method:** POST
- **Envelope:** uses the base webhook envelope (`source`, `event_type`, `event_id`, `submitted_at`, `shared_secret`, `human_review_required`, `payload`)
- **Default:** `human_review_required` is `true` for all deal-related Actions

---

## 1. Submit Borrower Intake

**Endpoint**

    POST https://your-domain.com/webhook/borrower-intake

**Required inputs:** borrower name, email, phone, business name, funding amount requested
**Optional inputs:** monthly revenue, time in business, industry, credit score range (use a range, never a raw score), use of funds, lead source

**Request**

    {
      "source": "custom_gpt",
      "event_type": "borrower_intake",
      "event_id": "evt_10001",
      "submitted_at": "2026-06-30T14:25:00-04:00",
      "human_review_required": true,
      "payload": {
        "borrower": {
          "first_name": "Sam",
          "last_name": "Rivera",
          "email": "sam@example.com",
          "phone": "+15555550123",
          "preferred_contact_method": "sms"
        },
        "business": {
          "legal_business_name": "Rivera Logistics LLC",
          "industry": "Transportation",
          "state": "NY",
          "monthly_revenue": 85000,
          "time_in_business_months": 38,
          "credit_score_range": "650_699"
        },
        "funding_request": {
          "product_type": "working_capital",
          "funding_amount_requested": 75000,
          "use_of_funds": "Equipment repairs and payroll",
          "urgency": "within_7_days"
        },
        "lead_source": "Google Ads"
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Lead created and queued for broker review.",
      "external_record_id": "lead_55012"
    }

**Guardrail:** Require explicit borrower consent to contact before creating or updating a real lead. Add a `consent_to_contact: true` field when your forms collect it.

---

## 2. Submit Referral Lead

**Endpoint**

    POST https://your-domain.com/webhook/referral-lead

**Required inputs:** partner name, borrower name, borrower email, borrower phone
**Optional inputs:** business name, requested amount, notes

**Request**

    {
      "source": "custom_gpt",
      "event_type": "referral_lead",
      "event_id": "evt_10100",
      "submitted_at": "2026-06-30T14:40:00-04:00",
      "human_review_required": true,
      "payload": {
        "referral_partner": {
          "name": "ABC Consulting",
          "contact_name": "Morgan Lee",
          "email": "morgan@example.com"
        },
        "borrower": {
          "first_name": "Sam",
          "last_name": "Rivera",
          "email": "sam@example.com",
          "phone": "+15555550123"
        },
        "business": { "legal_business_name": "Rivera Logistics LLC" },
        "requested_amount": 75000,
        "notes": "Partner referral — warm intro made."
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Referral lead logged with partner attribution.",
      "external_record_id": "lead_55013"
    }

---

## 3. Create Review Task

**Endpoint**

    POST https://your-domain.com/webhook/create-review-task

**Required inputs:** borrower name, task type, notes
**Optional inputs:** priority, due date, owner

**Request**

    {
      "source": "custom_gpt",
      "event_type": "review_task",
      "event_id": "evt_10200",
      "submitted_at": "2026-06-30T14:45:00-04:00",
      "human_review_required": true,
      "payload": {
        "borrower_name": "Sam Rivera",
        "task_type": "review_before_lender_submission",
        "notes": "Confirm documents are complete before any submission.",
        "priority": "high",
        "due_at": "2026-07-01T10:00:00-04:00",
        "owner": "jane@example.com"
      }
    }

**Response**

    { "status": "accepted", "message": "Review task created." }

---

## 4. Send Broker Alert

**Endpoint**

    POST https://your-domain.com/webhook/broker-alert

**Required inputs:** alert title, borrower name, message
**Optional inputs:** deal status, source, priority

**Request**

    {
      "source": "custom_gpt",
      "event_type": "broker_alert",
      "event_id": "evt_10300",
      "submitted_at": "2026-06-30T14:50:00-04:00",
      "human_review_required": false,
      "payload": {
        "alert_title": "New high-priority lead",
        "borrower_name": "Sam Rivera",
        "message": "$75k working capital request, needs funding within 7 days.",
        "deal_status": "new_lead",
        "source": "Google Ads",
        "priority": "high"
      }
    }

**Response**

    { "status": "received", "message": "Broker alert sent." }

---

## 5. Log GPT Summary

**Endpoint**

    POST https://your-domain.com/webhook/log-summary

**Required inputs:** summary, borrower name, timestamp
**Optional inputs:** tags, next step, owner

**Request**

    {
      "source": "custom_gpt",
      "event_type": "conversation_summary",
      "event_id": "evt_10400",
      "submitted_at": "2026-06-30T15:00:00-04:00",
      "human_review_required": false,
      "payload": {
        "borrower_name": "Sam Rivera",
        "summary": "Discussed working capital options; collected intake; flagged for broker review.",
        "tags": ["working_capital", "new_lead"],
        "next_step": "Broker to review and request documents.",
        "owner": "jane@example.com"
      }
    }

**Response**

    { "status": "accepted", "message": "Summary logged." }

---

## 🛡️ Intake Guardrails

- Capture **consent to contact** before creating real leads.
- Use **credit score ranges**, never raw scores or full credit data.
- Keep **raw documents out** of intake payloads — collect those via secure upload later.
- Default deal-related Actions to **human review**.
- Use **possible-fit language** only; never imply approval or eligibility.

---

## 🔗 Next

- Document workflows → `actions-no-auth-document-actions.md`
- Alerts and tasks → `actions-no-auth-internal-alert-actions.md`
- Field definitions → see the Funding Workflow Data Dictionary in `../../knowledge/`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*