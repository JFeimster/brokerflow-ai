# Broker Intake Workflow Examples

## Purpose

This knowledge file gives Loan Broker Automation Architect GPT reusable intake workflow patterns for loan brokers, funding agencies, referral partners, and broker operations teams.

Use this file to help the GPT design practical intake automations that capture borrower information, route leads, reduce manual data entry, prevent duplicate records, trigger document collection, and create broker review tasks.

The goal is not to approve or decline borrowers. The goal is to move new opportunities into a clean, reviewable workflow.

---

## Core Intake Principle

Every broker intake workflow should answer six questions:

1. Where did the lead come from?
2. What information was captured?
3. Is the borrower record new or existing?
4. What should happen automatically?
5. What should require human review?
6. What is the next status or task?

A good intake workflow does not try to automate underwriting. It organizes information so a broker can review the file faster.

---

## Recommended Intake Statuses

Use these statuses as a starting point for CRM, Notion, Airtable, HubSpot, GoHighLevel, Pipedrive, or spreadsheet-based systems.

| Status | Meaning | Automation Trigger |
|---|---|---|
| New Lead | Lead was captured but not reviewed yet. | Create contact/deal record and notify broker. |
| Intake Incomplete | Required fields are missing. | Send completion request or create follow-up task. |
| Ready for Broker Review | Minimum intake data is complete. | Create broker review task. |
| Docs Requested | Borrower has been asked for documents. | Start document collection workflow. |
| Docs Partially Received | Some documents are uploaded, but file is incomplete. | Send missing-doc reminder. |
| Ready for Submission Review | File appears organized enough for broker review before lender submission. | Create manual review task. |
| Submitted to Lender | Broker or processor submitted the file. | Start lender status tracking workflow. |
| Stalled | Borrower has not responded or file has not moved. | Trigger follow-up sequence. |
| Funded | Deal closed or borrower received funding. | Trigger review, referral, renewal, and reporting workflow. |
| Not a Fit / Closed | Broker marked the file as inactive or not currently workable. | Add nurture or archive workflow. |

---

## Required Intake Fields

These fields are the minimum recommended starting point for most business funding or loan broker intake workflows.

### Borrower / Contact Fields

| Field | Type | Required? | Notes |
|---|---:|---:|---|
| Borrower first name | Text | Yes | Use legal name if possible. |
| Borrower last name | Text | Yes | Required for CRM matching. |
| Email | Email | Yes | Primary duplicate check field. |
| Phone | Phone | Yes | Secondary duplicate check field. |
| Preferred contact method | Select | No | Email, phone, SMS, other. |
| Consent to contact | Checkbox | Yes | Required before outreach automation. |
| Referral partner name | Text / Relation | No | Important for attribution. |

### Business Fields

| Field | Type | Required? | Notes |
|---|---:|---:|---|
| Business name | Text | Yes | Primary business record field. |
| Industry | Select/Text | Recommended | Useful for lender-fit review. |
| State | Select/Text | Recommended | Useful for licensing/product availability. |
| Time in business | Select/Number | Recommended | Use ranges if exact date is unknown. |
| Monthly revenue | Number/Range | Recommended | Use borrower-provided estimate. |
| Annual revenue | Number/Range | Optional | Useful for larger deals. |
| Existing debt / advances | Text/Number | Optional | Should be reviewed manually. |

### Funding Request Fields

| Field | Type | Required? | Notes |
|---|---:|---:|---|
| Funding amount requested | Number | Yes | Do not treat as approved amount. |
| Use of funds | Text/Select | Recommended | Working capital, equipment, expansion, payroll, etc. |
| Funding timeline | Select | Recommended | Immediate, 7 days, 30 days, flexible. |
| Product interest | Select | Optional | Line of credit, term loan, MCA, equipment, SBA, etc. |
| Credit score range | Select | Optional | Use broad self-reported ranges. |
| Documents available | Multi-select | Optional | Bank statements, tax returns, ID, application, etc. |

### Tracking / Attribution Fields

| Field | Type | Required? | Notes |
|---|---:|---:|---|
| Lead source | Select | Yes | Website, referral, ad, partner, outbound, event. |
| Campaign | Text | Optional | Useful for marketing reports. |
| UTM source | Text | Optional | Capture from landing pages. |
| UTM medium | Text | Optional | Capture from landing pages. |
| UTM campaign | Text | Optional | Capture from landing pages. |
| Intake channel | Select | Recommended | Form, phone, email, chat, partner portal, spreadsheet. |
| Assigned broker | Person/Text | Recommended | Used for routing. |
| Intake timestamp | Date/time | Yes | Auto-generated. |

---

## Workflow Pattern 1: Website Form to CRM

### Use Case

A borrower submits a funding request form on a website or landing page.

### Recommended Flow

1. Trigger: New website form submission.
2. Validate required fields.
3. Check for duplicate lead by email, phone, and business name.
4. If no duplicate exists, create a new CRM contact and deal.
5. If duplicate exists, update the existing record and add a note.
6. Assign the lead to a broker.
7. Create a manual review task.
8. Send an internal broker alert.
9. Optionally send a borrower confirmation message.

### Automation Map

Website form submitted
→ Validate required fields
→ Search CRM by email
→ Search CRM by phone
→ Search CRM by business name
→ IF duplicate found
    → Update existing record
    → Add intake note
    → Notify assigned broker
→ ELSE
    → Create contact
    → Create company/business record
    → Create deal/opportunity
    → Assign broker
→ Create broker review task
→ Send internal alert
→ Send borrower confirmation

### Required Human Review

Human review is required before:

- Marking the borrower as a good fit
- Sending to lenders
- Discussing funding terms
- Requesting sensitive documents beyond the basic checklist
- Making any approval-like statement

### Sample Broker Alert

New funding intake submitted.

Borrower: [Borrower Name]
Business: [Business Name]
Requested Amount: [Funding Amount]
Revenue: [Monthly Revenue]
Time in Business: [Time in Business]
Source: [Lead Source]

Next step: Review intake and decide whether to request documents.

---

## Workflow Pattern 2: Referral Partner Lead Intake

### Use Case

A referral partner submits a borrower lead.

### Recommended Flow

1. Trigger: Referral partner form submitted.
2. Capture referral partner identity.
3. Capture borrower contact and business details.
4. Check for existing borrower record.
5. Create or update borrower record.
6. Attach referral partner attribution.
7. Create broker review task.
8. Notify broker and referral partner manager.
9. Optionally send confirmation to partner.

### Automation Map

Referral partner submits lead
→ Validate partner name/email
→ Validate borrower contact fields
→ Search CRM for borrower
→ Create or update borrower record
→ Link referral partner
→ Add lead source = Referral Partner
→ Create broker review task
→ Notify broker
→ Notify partner manager
→ Send partner confirmation

### Key Fields

| Field | Notes |
|---|---|
| Referral partner name | Required for attribution. |
| Referral partner email | Useful for updates and commission records. |
| Borrower name | Required. |
| Borrower email | Required if available. |
| Borrower phone | Required if available. |
| Business name | Required if business funding. |
| Requested amount | Recommended. |
| Partner notes | Useful context for broker review. |

### Partner Confirmation Message

Thanks for the referral. We received the borrower information and will route it for broker review.

We’ll update you once the file has been reviewed or if more information is needed.

### Guardrail

Do not automatically tell the referral partner that the borrower is qualified, approved, eligible, or likely to be funded.

Use safe language:

- Received for review
- Routed to the broker
- Needs manual review
- More information may be needed

---

## Workflow Pattern 3: Phone Call Intake to CRM

### Use Case

A broker, VA, or processor collects borrower information during a phone call and needs to log it cleanly.

### Recommended Flow

1. Broker or VA fills out an internal intake form.
2. Automation validates required fields.
3. CRM is searched for duplicates.
4. Existing record is updated or new record is created.
5. Call notes are added.
6. Follow-up task is created.
7. Status is set based on completeness.

### Automation Map

Internal intake form submitted
→ Validate required fields
→ Search CRM for duplicate
→ Create/update borrower record
→ Add call notes
→ IF minimum fields complete
    → Set status = Ready for Broker Review
    → Create broker review task
→ ELSE
    → Set status = Intake Incomplete
    → Create missing-info follow-up task

### Minimum Complete Intake

A file can be marked `Ready for Broker Review` when it has:

- Borrower name
- Email or phone
- Business name
- Funding amount requested
- Use of funds
- Monthly revenue or revenue range
- Time in business or range
- Lead source
- Consent to contact

### Follow-Up Task Example

Task: Complete borrower intake

Borrower: [Borrower Name]
Missing fields: [Missing Fields]
Assigned to: [Owner]
Due: [Due Date]

Notes: Call borrower to confirm missing intake details before requesting documents.

---

## Workflow Pattern 4: Spreadsheet Import to CRM

### Use Case

A broker has leads in Google Sheets, CSV, Airtable, or another list and wants to move them into a CRM.

### Recommended Flow

1. Trigger: New row added or CSV imported.
2. Normalize column names.
3. Validate required fields.
4. Clean phone, email, and amount fields.
5. Check for duplicates.
6. Create or update CRM records.
7. Tag imported records with batch name.
8. Create review tasks for valid records.
9. Create cleanup report for invalid records.

### Automation Map

New spreadsheet row
→ Normalize fields
→ Validate required data
→ Clean email/phone/amount fields
→ Search CRM for duplicate
→ IF valid and not duplicate
    → Create CRM record
    → Tag import batch
    → Create review task
→ IF duplicate
    → Update existing record
    → Add import note
→ IF invalid
    → Add to cleanup sheet
    → Flag missing fields

### Common Data Cleanup Rules

| Field | Cleanup Rule |
|---|---|
| Email | Lowercase and trim spaces. |
| Phone | Remove symbols and standardize format. |
| Funding amount | Convert text like “50k” into numeric value when possible. |
| Business name | Trim extra spaces and remove duplicate punctuation. |
| State | Standardize to two-letter abbreviation if needed. |
| Lead source | Map messy values into accepted source list. |

### Import Batch Tag

Use a tag like:

import_2026_06_website_leads

or:

partner_batch_acme_referrals_june_2026

This makes it easier to audit where records came from.

---

## Workflow Pattern 5: Chatbot or GPT Intake to Broker Review

### Use Case

A borrower or broker uses a GPT-style assistant to capture funding details and send the summary into a workflow.

### Recommended Flow

1. GPT collects borrower details.
2. GPT summarizes intake.
3. User confirms the data should be submitted.
4. Automation sends data to webhook or CRM.
5. CRM creates or updates borrower record.
6. Broker review task is created.
7. GPT returns a safe confirmation.

### Automation Map

GPT collects intake
→ GPT summarizes borrower details
→ User confirms submission
→ Send structured intake to webhook
→ Create/update CRM record
→ Create broker review task
→ Return confirmation to user

### Required Confirmation

Before submitting real lead data, the GPT should ask:

Do you want me to send this intake summary for broker review?

The GPT should not submit borrower information silently.

### Safe Confirmation Message

The intake summary has been sent for broker review. This does not mean the borrower is approved or qualified. A broker should review the details and decide the next step.

---

## Workflow Pattern 6: Missing Required Fields Follow-Up

### Use Case

A lead arrives without enough information for broker review.

### Recommended Flow

1. Intake is received.
2. Automation checks required fields.
3. Missing fields are identified.
4. Status is set to `Intake Incomplete`.
5. Borrower or broker gets a missing-info request.
6. A follow-up task is created.
7. Once fields are complete, status moves to `Ready for Broker Review`.

### Automation Map

New intake received
→ Check required fields
→ IF fields missing
    → Set status = Intake Incomplete
    → Create missing-info task
    → Send missing-info request
→ IF all required fields present
    → Set status = Ready for Broker Review
    → Create broker review task

### Missing Information Request

Hi [Borrower Name],

Thanks for reaching out. Before we can review your funding request, we need a few more details:

[Missing Fields]

Please reply with the missing information or complete the intake form here:
[Intake Form Link]

Once received, your file can be routed for broker review.

### Guardrail

Do not say:

- Once received, we can get you approved.
- You are likely to qualify.
- This should be easy to fund.

Use:

- Routed for review
- Reviewed by a broker
- Next step
- Possible options

---

## Workflow Pattern 7: Duplicate Lead Detection

### Use Case

A borrower submits multiple forms, calls more than once, or comes through a referral partner after already existing in the CRM.

### Recommended Duplicate Logic

Check in this order:

1. Exact email match
2. Exact phone match
3. Business name match
4. Borrower name + state match
5. Business name + phone match
6. Fuzzy match on business name

### Automation Map

New intake received
→ Search by email
→ IF match found
    → Update existing record
    → Add new intake note
    → Notify assigned broker
→ ELSE search by phone
→ ELSE search by business name
→ IF possible duplicate found
    → Create duplicate review task
→ ELSE create new record

### Duplicate Review Task

Task: Review possible duplicate lead

New intake:
[New Intake Summary]

Possible existing record:
[Existing Record Link or Summary]

Recommended action:
Review before creating a new deal or merging records.

### Best Practice

Do not auto-merge records unless the matching logic is extremely reliable. For most broker teams, create a review task instead.

---

## Workflow Pattern 8: Intake to Document Request

### Use Case

A borrower provides enough information to begin document collection.

### Recommended Flow

1. Intake is completed.
2. Broker reviews the borrower profile.
3. Broker approves document request step.
4. Automation sends document checklist.
5. Upload folder or secure link is created.
6. CRM status changes to `Docs Requested`.
7. Reminder workflow starts.

### Automation Map

Intake complete
→ Broker manual review
→ Broker approves document request
→ Generate document checklist
→ Create secure upload link/folder
→ Send document request
→ Update status = Docs Requested
→ Start missing-doc reminder timer

### Common Document Checklist

Use only as a general starting point. Adjust for product type and broker requirements.

- Completed funding application
- Last 3–6 months business bank statements
- Government-issued ID
- Voided business check
- Business formation documents
- Existing financing statements, if applicable
- Tax returns or financial statements, if required

### Guardrail

Sensitive financial documents should be uploaded through secure systems, not pasted into GPT chat.

---

## Workflow Pattern 9: Lead Routing by Source or Broker

### Use Case

Different lead sources, states, products, or partner relationships should route to different brokers or team members.

### Routing Rules

| Condition | Assignment |
|---|---|
| Referral partner = VIP partner | Assign to senior broker. |
| Funding amount above threshold | Assign to experienced broker. |
| State = restricted/special handling | Assign to broker trained for that state. |
| Product interest = equipment financing | Assign to equipment specialist. |
| Source = paid ads | Assign to speed-to-lead queue. |
| Missing required fields | Assign to VA/processor for cleanup. |

### Automation Map

New intake received
→ Evaluate routing rules
→ Assign broker/team
→ Set priority
→ Create task
→ Notify assigned owner

### Priority Rules

| Priority | Example Condition |
|---|---|
| High | Large requested amount, hot referral, urgent timeline |
| Medium | Complete intake, normal timeline |
| Low | Incomplete intake, cold lead, long-term nurture |

### Internal Alert

New lead assigned.

Assigned to: [Assigned Owner]
Priority: [Priority]
Reason: [Routing Reason]
Source: [Lead Source]
Next step: Review intake and contact borrower if appropriate.

---

## Workflow Pattern 10: Intake Audit and Cleanup

### Use Case

A broker has a messy intake process and wants to identify what should be automated first.

### Audit Questions

Ask the user:

1. Where do new leads currently come from?
2. Where are those leads stored?
3. Who reviews them first?
4. What information is usually missing?
5. What tasks are repeated every day?
6. Where do deals usually get stuck?
7. Which follow-ups are most often forgotten?
8. What should never happen without broker approval?

### Output Format

When auditing a messy intake process, produce:

# Intake Workflow Audit

## Current Intake Sources
## Current Manual Steps
## Missing or Messy Data
## Duplicate Risks
## Follow-Up Gaps
## Recommended Automations
## Human Review Points
## Minimum Viable Intake Workflow
## Advanced Intake Workflow
## Next Build Step

### Minimum Viable Intake Workflow

The first version should usually include:

1. One intake form
2. Required field validation
3. CRM/contact creation
4. Duplicate check
5. Broker review task
6. Internal alert
7. Safe borrower confirmation

### Advanced Intake Workflow

The advanced version can add:

1. Lead scoring for internal prioritization
2. Partner attribution
3. UTM tracking
4. Document request automation
5. Missing-doc reminders
6. Daily pipeline summaries
7. Renewal tracking
8. Referral partner updates

---

## Safe Language Rules

### Use This Language

| Safe Phrase | Why |
|---|---|
| Possible fit | Avoids approval language. |
| Ready for broker review | Keeps human review central. |
| Preliminary match | Indicates non-final assessment. |
| May be worth reviewing | Avoids certainty. |
| Needs manual review | Reinforces guardrail. |
| Based on information provided | Limits overclaiming. |
| Next step is review | Does not imply approval. |

### Avoid This Language

| Unsafe Phrase | Why |
|---|---|
| Approved | Approval decision. |
| Qualified | May imply underwriting decision. |
| Eligible | Can imply lender approval. |
| Guaranteed | Unsafe and misleading. |
| This lender will fund you | Unsupported claim. |
| You should get funding | Unsupported prediction. |
| Declined | Should be handled carefully and manually. |

---

## Recommended Automation Triggers

| Trigger | Best Use |
|---|---|
| New form submission | Website intake, referral intake, partner intake |
| New spreadsheet row | CSV imports, partner lead sheets |
| New email parsed | Email-based lead capture |
| New CRM contact | Trigger review or enrichment |
| GPT webhook submission | GPT-assisted intake capture |
| Manual internal form | Phone call or broker-entered intake |
| Partner portal submission | Referral partner workflows |

---

## Recommended Automation Actions

| Action | Best Use |
|---|---|
| Create contact | Add borrower to CRM. |
| Create company/business | Track business separately from contact. |
| Create deal/opportunity | Track funding request. |
| Update existing record | Avoid duplicate records. |
| Add note | Preserve source-specific context. |
| Assign owner | Route to broker or processor. |
| Create task | Force manual review. |
| Send internal alert | Speed-to-lead notification. |
| Send borrower confirmation | Acknowledge receipt safely. |
| Create upload folder/link | Start document collection. |
| Add import tag | Track batch or source. |
| Add referral attribution | Track partner performance. |

---

## Example Intake JSON Payload

Use this as a generic structure for webhook or API-based intake actions.

{
  "source": "custom_gpt",
  "action_type": "borrower_intake",
  "intake_timestamp": "2026-06-30T10:00:00Z",
  "borrower": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "preferred_contact_method": "",
    "consent_to_contact": true
  },
  "business": {
    "business_name": "",
    "industry": "",
    "state": "",
    "time_in_business": "",
    "monthly_revenue": "",
    "annual_revenue": ""
  },
  "funding_request": {
    "amount_requested": "",
    "use_of_funds": "",
    "timeline": "",
    "product_interest": "",
    "credit_score_range": "",
    "documents_available": []
  },
  "tracking": {
    "lead_source": "",
    "referral_partner": "",
    "campaign": "",
    "utm_source": "",
    "utm_medium": "",
    "utm_campaign": ""
  },
  "routing": {
    "assigned_broker": "",
    "priority": "",
    "human_review_required": true
  },
  "notes": ""
}

---

## GPT Behavior Instructions

When helping a user design a broker intake automation, the GPT should:

1. Identify the intake source.
2. Define required fields.
3. Recommend a duplicate-check method.
4. Define the CRM or database record structure.
5. Identify what should happen automatically.
6. Identify what requires human review.
7. Create a simple workflow map.
8. Recommend a minimum viable version first.
9. Avoid approval or underwriting language.
10. End with a clear next build step.

---

## Default Intake Blueprint Template

Use this output format when the user asks for an intake automation.

# Broker Intake Automation Blueprint: [Workflow Name]

## 1. Goal
Explain what this intake workflow should accomplish.

## 2. Intake Source
Identify where the lead starts.

## 3. Required Fields
List required and optional fields.

## 4. Duplicate Check Logic
Explain how the system should find existing records.

## 5. Automation Flow
Map each trigger, condition, action, and update.

## 6. CRM / Database Updates
List records created or updated.

## 7. Human Review Points
Show where a broker, processor, or owner must review.

## 8. Notifications
List internal and external messages.

## 9. Error Handling
Explain what happens when fields are missing or systems fail.

## 10. Minimum Viable Version
Give the simplest version to build first.

## 11. Advanced Version
Give improvements to add later.

## 12. Final Recommendation
Give the next build step.

---

## Final Rule

The intake workflow should make the broker faster, not reckless.

Automate intake capture, cleanup, routing, reminders, and task creation.

Do not automate sensitive lending decisions, lender submissions, approval language, or borrower-facing funding promises without human review.