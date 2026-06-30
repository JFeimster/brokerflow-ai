# No-Auth Actions: Follow-Up

This file defines the **no-auth follow-up Actions** for the Loan Broker Automation Architect GPT. These Actions start communication sequences — borrower nurture, referral partner updates, renewal reminders, and post-funding review requests — by sending a trigger to a workflow that handles the actual messaging.

Follow-up is where deals are won or lost. Automating the *trigger* (not the human judgment) keeps borrowers warm without letting the GPT send sensitive or approval-like messages on its own.

---

## 📋 Actions in This File

| Action Name | Description | Required Inputs | Optional Inputs | Result | Human Review |
|-------------|-------------|-----------------|-----------------|--------|--------------|
| Start Borrower Follow-Up | Triggers a borrower nurture sequence | Deal ID, borrower contact, sequence type | Channel, first-message delay | Sequence started | Optional |
| Start Referral Partner Follow-Up | Updates/nurtures a referral partner | Partner contact, update type | Deal ID, message | Sequence started | Optional |
| Schedule Renewal Reminder | Queues a renewal reminder by funded date | Deal ID, funded date, reminder offset | Channel, message | Reminder queued | No |
| Start Post-Funding Review Request | Requests a review/referral after funding | Deal ID, borrower contact | Channel, incentive note | Request queued | Optional |
| Start Declined-File Nurture | Safely re-engages a declined or stalled file | Deal ID, borrower contact | Reason, cooldown days | Nurture started | Yes |

---

## 🔑 Shared Conventions

- **Auth type:** None
- **Method:** POST
- **The GPT triggers sequences; it does not write the borrower message live.** Sequences use pre-approved templates stored in your workflow tool.
- Any sequence that could imply approval, eligibility, or terms requires **human review** before borrower-facing content goes out.

---

## 1. Start Borrower Follow-Up

**Endpoint**

    POST https://your-domain.com/webhook/borrower-followup

**Required inputs:** deal ID, borrower contact, sequence type
**Optional inputs:** channel, first-message delay

**Common sequence types**

    new_lead_response
    application_incomplete
    docs_missing
    docs_received
    stalled_deal
    broker_review_update

**Request**

    {
      "source": "custom_gpt",
      "event_type": "borrower_followup",
      "event_id": "evt_40001",
      "submitted_at": "2026-06-30T15:10:00-04:00",
      "human_review_required": false,
      "payload": {
        "deal_id": "deal_12345",
        "borrower": {
          "first_name": "Sam",
          "email": "sam@example.com",
          "phone": "+15555550123",
          "preferred_contact_method": "sms"
        },
        "sequence_type": "docs_missing",
        "channel": "sms",
        "first_message_delay_hours": 2
      }
    }

**Response**

    {
      "status": "accepted",
      "message": "Borrower follow-up sequence started.",
      "external_record_id": "seq_77010"
    }

**Guardrail:** Sequences that discuss terms, eligibility, or approval must be reviewed by a human before launch.

---

## 2. Start Referral Partner Follow-Up

**Endpoint**

    POST https://your-domain.com/webhook/referral-followup

**Required inputs:** partner contact, update type
**Optional inputs:** deal ID, message

**Common update types**

    new_referral_received
    status_update
    ready_for_review
    funded_notice
    monthly_recap
    reactivation

**Request**

    {
      "source": "custom_gpt",
      "event_type": "referral_followup",
      "event_id": "evt_40100",
      "payload": {
        "referral_partner": {
          "name": "ABC Consulting",
          "email": "morgan@example.com"
        },
        "update_type": "status_update",
        "deal_id": "deal_12345",
        "message": "The referred file is now ready for broker review."
      }
    }

**Response**

    { "status": "accepted", "message": "Partner follow-up queued." }

**Guardrail:** Review partner-facing messages before sending if they include borrower deal details.

---

## 3. Schedule Renewal Reminder

**Endpoint**

    POST https://your-domain.com/webhook/renewal-reminder

**Required inputs:** deal ID, funded date, reminder offset (days)
**Optional inputs:** channel, message

**Request**

    {
      "source": "custom_gpt",
      "event_type": "renewal_reminder",
      "event_id": "evt_40200",
      "payload": {
        "deal_id": "deal_12345",
        "funded_date": "2026-06-01",
        "reminder_in_days": 180,
        "channel": "email",
        "message": "Check in on renewal eligibility and additional funding needs."
      }
    }

**Response**

    { "status": "queued", "message": "Renewal reminder scheduled for 2026-11-28." }

---

## 4. Start Post-Funding Review Request

Turns funded deals into reviews, referrals, and repeat business.

**Endpoint**

    POST https://your-domain.com/webhook/review-request

**Required inputs:** deal ID, borrower contact
**Optional inputs:** channel, incentive note

**Request**

    {
      "source": "custom_gpt",
      "event_type": "post_funding_review_request",
      "event_id": "evt_40300",
      "payload": {
        "deal_id": "deal_12345",
        "borrower": { "first_name": "Sam", "email": "sam@example.com" },
        "channel": "email",
        "incentive_note": "Mention the referral bonus for introducing another business owner."
      }
    }

**Response**

    { "status": "queued", "message": "Post-funding review request queued." }

---

## 5. Start Declined-File Nurture

Re-engages declined or stalled files **safely**, without implying a different outcome is guaranteed.

**Endpoint**

    POST https://your-domain.com/webhook/declined-file-nurture

**Required inputs:** deal ID, borrower contact
**Optional inputs:** reason, cooldown days

**Request**

    {
      "source": "custom_gpt",
      "event_type": "declined_file_nurture",
      "event_id": "evt_40400",
      "submitted_at": "2026-06-30T15:20:00-04:00",
      "human_review_required": true,
      "payload": {
        "deal_id": "deal_12345",
        "borrower": { "first_name": "Sam", "email": "sam@example.com" },
        "reason": "Time in business too short for prior options",
        "cooldown_days": 90
      }
    }

**Response**

    { "status": "accepted", "message": "Declined-file nurture queued for human review." }

**Guardrail:** Nurture messaging must avoid promises. Use language like "options may have changed" — never "you'll qualify now."

---

## 🛡️ Follow-Up Guardrails

- The GPT triggers **pre-approved** sequences; it does not improvise borrower messages live.
- Any message implying approval, eligibility, terms, or guarantees requires **human review**.
- Honor contact preferences and opt-outs in every sequence.
- Keep deal details minimal in partner-facing messages.
- Declined/reactivation nurture must never promise a different outcome.

---

## 🔗 Next

- Calculators → `actions-no-auth-calculator-actions.md`
- Schema snippets → `actions-no-auth-schema-examples.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*