# No-Auth Actions: Internal Alerts

This file defines the **no-auth internal alert and task Actions** for the Loan Broker Automation Architect GPT. These Actions keep humans in the loop by pushing notifications and tasks to your team's tools — Slack, email, Discord, or a task system — through a public webhook.

Internal alerts are low-risk because they go to **your team**, not the borrower, and they do not change deal outcomes. They are perfect for "a human needs to look at this" moments.

---

## 📋 Actions in This File

| Action Name | Description | Required Inputs | Optional Inputs | Result | Human Review |
|-------------|-------------|-----------------|-----------------|--------|--------------|
| Send Internal Broker Alert | Sends a notification to Slack/email/Discord | Alert title, message | Borrower name, deal ID, priority, channel | Notification sent | No |
| Create Manual Review Task | Creates a review task for broker/processor | Task name, deal ID | Owner, due date, priority, notes | Task created | Yes (by design) |
| Send Escalation Alert | Flags a stuck or high-risk file for attention | Reason, deal ID | Severity, owner, message | Escalation sent | Yes |
| Post Daily Pipeline Digest | Sends a summary alert to the team channel | Summary metrics | Period, owner | Digest posted | No |

---

## 🔑 Shared Conventions

- **Auth type:** None
- **Method:** POST
- **Channel routing:** include a `channel` field so one webhook can fan out to Slack, email, or Discord.
- **Review tasks** intentionally exist to *create* human review — they are the safety mechanism, not a bypass.

---

## 1. Send Internal Broker Alert

**Endpoint**

    POST https://your-domain.com/webhook/broker-alert

**Required inputs:** alert title, message
**Optional inputs:** borrower name, deal ID, priority, channel

**Request**

    {
      "source": "custom_gpt",
      "event_type": "internal_alert",
      "event_id": "evt_30001",
      "submitted_at": "2026-06-30T14:50:00-04:00",
      "human_review_required": false,
      "payload": {
        "alert_title": "Hot lead needs fast response",
        "message": "Sam Rivera requested $75k working capital, urgency within 7 days.",
        "borrower_name": "Sam Rivera",
        "deal_id": "deal_12345",
        "priority": "high",
        "channel": "slack"
      }
    }

**Response**

    { "status": "received", "message": "Alert delivered to #deals." }

---

## 2. Create Manual Review Task

The core safety Action. Use it whenever the GPT reaches a point that requires a human decision.

**Endpoint**

    POST https://your-domain.com/webhook/create-review-task

**Required inputs:** task name, deal ID
**Optional inputs:** owner, due date, priority, notes

**Common task types**

    review_before_lender_submission
    review_before_borrower_terms
    review_lender_match
    review_declined_file
    review_sensitive_documents

**Request**

    {
      "source": "custom_gpt",
      "event_type": "review_task",
      "event_id": "evt_30100",
      "submitted_at": "2026-06-30T14:55:00-04:00",
      "human_review_required": true,
      "payload": {
        "task_name": "Review file before possible lender submission",
        "deal_id": "deal_12345",
        "owner": "jane@example.com",
        "due_at": "2026-07-01T10:00:00-04:00",
        "priority": "high",
        "notes": "GPT prepared a possible lender match. Broker must confirm before any submission."
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Review task created and assigned.",
      "external_record_id": "task_88200"
    }

---

## 3. Send Escalation Alert

For files that are stuck, time-sensitive, or higher risk.

**Endpoint**

    POST https://your-domain.com/webhook/escalation-alert

**Required inputs:** reason, deal ID
**Optional inputs:** severity, owner, message

**Request**

    {
      "source": "custom_gpt",
      "event_type": "escalation_alert",
      "event_id": "evt_30200",
      "submitted_at": "2026-06-30T15:05:00-04:00",
      "human_review_required": true,
      "payload": {
        "reason": "Borrower unresponsive for 5 days on a time-sensitive deal",
        "deal_id": "deal_12345",
        "severity": "high",
        "owner": "jane@example.com",
        "message": "Consider a direct call before the funding window closes."
      }
    }

**Response**

    { "status": "received", "message": "Escalation routed to deal owner." }

---

## 4. Post Daily Pipeline Digest

Sends a once-a-day team summary. Pairs well with a scheduled trigger.

**Endpoint**

    POST https://your-domain.com/webhook/pipeline-digest

**Required inputs:** summary metrics
**Optional inputs:** period, owner

**Request**

    {
      "source": "custom_gpt",
      "event_type": "pipeline_digest",
      "event_id": "evt_30300",
      "submitted_at": "2026-06-30T17:00:00-04:00",
      "human_review_required": false,
      "payload": {
        "period": "2026-06-30",
        "owner": "jane@example.com",
        "summary": {
          "new_leads": 12,
          "ready_for_review": 4,
          "docs_missing": 6,
          "pending_review_submission": 2,
          "stale_over_7_days": 3,
          "funded_today": 1
        }
      }
    }

**Response**

    { "status": "received", "message": "Daily digest posted." }

---

## 🛡️ Alert Guardrails

- Internal alerts go to **your team only** — never auto-send borrower-facing messages from these Actions.
- Keep sensitive details out of channel messages; reference the **deal ID** and let the human open the record.
- Use **Create Manual Review Task** generously — it is the mechanism that keeps funding decisions human.
- Do not use escalation Actions to bypass review; they raise visibility, they do not approve anything.

---

## 🔗 Next

- Follow-up sequences → `actions-no-auth-followup-actions.md`
- Calculators → `actions-no-auth-calculator-actions.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*