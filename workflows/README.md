# Workflows

This folder documents the **automation workflows** that the Loan Broker Automation Architect GPT (BrokerFlow AI) triggers and supports. A workflow is the logic that runs *after* a GPT Action fires — the n8n, Zapier, or Make automation that receives a webhook, processes the data, and routes it through your business.

Where `/actions` defines what the GPT *sends*, `/workflows` defines what *happens next*: create the record, notify the broker, request documents, schedule reminders, and — critically — route every funding decision to a human.

---

## 📌 The Core Pattern

Every workflow follows the same backbone:

    GPT Action (webhook)
      → Workflow receives payload
      → Validate (required fields + shared secret)
      → Branch by event_type
      → Take action (create record / alert / reminder)
      → Flag human review where needed
      → Return a clear status to the GPT

The GPT captures and routes. The workflow executes safe steps. A human makes funding decisions.

---

## 🗂️ Suggested Files

    workflows/
    ├── README.md                          ← you are here
    ├── workflow-borrower-intake.md         ← intake webhook → CRM + review task
    ├── workflow-document-collection.md     ← checklist + missing-doc reminders
    ├── workflow-internal-alerts.md         ← Slack/email/Discord routing
    ├── workflow-followup-sequences.md      ← borrower/partner/renewal nurture
    ├── workflow-pipeline-sync.md           ← deal-stage updates and digests
    ├── workflow-human-review-routing.md    ← the safety routing workflow
    └── workflow-platform-notes.md          ← n8n vs Zapier vs Make tips

---

## 🧩 Core Workflows

| Workflow | Trigger (Action) | What It Does | Human Review |
|----------|------------------|--------------|--------------|
| Borrower Intake | Submit Borrower Intake | Creates CRM lead + "ready for review" task | Yes |
| Referral Intake | Submit Referral Lead | Creates lead with partner attribution | Yes |
| Document Collection | Missing Document Request | Sends reminders, tracks doc status | Optional |
| Internal Alerts | Send Broker Alert | Routes notification to the right channel | No |
| Review Routing | Create Manual Review Task | Assigns a human to decide | Yes (by design) |
| Follow-Up | Start Borrower Follow-Up | Launches a pre-approved sequence | Optional |
| Renewal Reminder | Schedule Renewal Reminder | Queues a future reminder | No |
| Pipeline Digest | Post Daily Pipeline Digest | Summarizes the pipeline for the team | No |

---

## 🔄 Reference Flow: Borrower Intake

A complete example from chat to broker review:

1. **Trigger** — GPT calls `Submit Borrower Intake` with the borrower payload.
2. **Validate** — Workflow checks required fields and the shared secret.
3. **Dedupe** — Skip if `event_id` was already processed.
4. **Create record** — Add or update the CRM contact + deal.
5. **Set stage** — Mark deal as `new_lead` or `ready_for_broker_review`.
6. **Create task** — Generate a "review before any lender submission" task.
7. **Alert** — Notify the assigned broker.
8. **Respond** — Return `accepted` + `external_record_id` to the GPT.

No step approves, declines, or submits anything — a human picks it up at the task.

---

## 🚦 Standard Pipeline Stages

Workflows should map deals to a consistent set of stages:

    new_lead
    contacted
    application_sent
    application_received
    docs_missing
    ready_for_broker_review
    lender_submission_pending_review
    submitted_to_lender
    lender_response_received
    borrower_follow_up_needed
    funded
    not_moving_forward
    renewal_follow_up
    stale
    closed

Note the deliberate review gates: `ready_for_broker_review` and `lender_submission_pending_review` always precede `submitted_to_lender`.

---

## 🛠️ Platform Notes

| Platform | Strengths | Watch For |
|----------|-----------|-----------|
| **n8n** | Self-hostable, flexible logic, low cost at scale | Requires hosting/maintenance |
| **Zapier** | Easiest to start, huge app library | Cost rises with volume |
| **Make** | Visual, powerful branching, good value | Steeper learning curve |

All three accept the no-auth webhook pattern. Start with whichever you already use.

---

## 🛡️ Workflow Guardrails

- **Validate everything** server-side — never trust the incoming payload blindly.
- **Enforce the shared secret** before processing.
- **Dedupe on `event_id`** to avoid duplicate records.
- **Never auto-submit** to a lender; always create a human-review task first.
- **Keep sensitive data out** of logs and notification messages (reference deal IDs).
- **Fail loudly** — return clear errors so the GPT can relay them.
- **Use possible-fit language** in any generated borrower-facing content.

The full safety contract in `../actions/no-auth/actions-no-auth-risk-guardrails.md` applies to workflows too.

---

## 🔗 Related

- Actions that trigger these → `../actions/README.md`
- Schemas for the triggers → `../schemas/README.md`
- Operating procedures → `../sops/README.md`
- Message/record templates → `../templates/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*