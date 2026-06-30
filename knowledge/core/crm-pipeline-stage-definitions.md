# CRM Pipeline Stage Definitions

## Purpose

This knowledge file gives Loan Broker Automation Architect GPT reusable CRM pipeline stage definitions for loan brokers, funding agencies, processors, referral partner managers, and broker operations teams.

Use this file to help the GPT design clean pipeline stages, deal statuses, automation triggers, broker review tasks, borrower follow-up workflows, referral partner updates, and reporting systems.

The goal is not to approve, decline, qualify, or underwrite borrowers. The goal is to organize each deal so a broker can see where it stands, what is missing, who owns the next step, and what should happen next.

---

## Core Pipeline Principle

A broker CRM pipeline should answer five questions at all times:

1. What stage is the deal in?
2. Who owns the next step?
3. What is missing?
4. What action should happen next?
5. Does this step require human review?

A good pipeline does not just store contacts. It creates operational visibility.

Every stage should have:

- A clear meaning
- Entry criteria
- Exit criteria
- Recommended automations
- Human review rules
- Common stuck points
- Follow-up actions

---

## Universal Safety Guardrail

Do not use CRM stages to imply funding approval, final qualification, underwriting completion, or guaranteed lender acceptance unless a licensed or authorized human has confirmed the status using the correct internal process.

Use safe stage language:

- New Lead
- Intake Incomplete
- Ready for Broker Review
- Docs Requested
- Docs Received
- Ready for Submission Review
- Submitted to Lender
- Lender Reviewing
- Offer Received
- Broker Review Needed
- Borrower Reviewing Options
- Funded
- Stalled
- Closed / Not Moving Forward

Avoid unsafe or overly certain stage language unless manually confirmed:

- Approved
- Guaranteed
- Qualified
- Eligible
- Declined by AI
- Auto-Approved
- Funding Secured
- Lender Accepted
- Underwritten by GPT

---

## Recommended Master Pipeline

Use this as the default CRM pipeline for most loan broker and funding agency workflows.

| Stage # | Stage Name | Short Meaning |
|---:|---|---|
| 1 | New Lead | Lead captured but not reviewed. |
| 2 | Intake Incomplete | Required intake details are missing. |
| 3 | Ready for Broker Review | Intake is complete enough for human review. |
| 4 | Contact Attempted | Broker/team attempted first contact. |
| 5 | Contacted | Borrower responded or conversation started. |
| 6 | Docs Requested | Borrower was asked for documents. |
| 7 | Docs Partially Received | Some documents received, but file is incomplete. |
| 8 | Docs Received | Required starter documents received. |
| 9 | Processor Review | Processor/VA is organizing or checking the file. |
| 10 | Ready for Submission Review | File is organized for broker review before lender submission. |
| 11 | Submitted to Lender | Broker/team submitted file to one or more lenders. |
| 12 | Lender Reviewing | Lender or funding partner is reviewing. |
| 13 | More Info Requested | Lender/broker needs additional info or documents. |
| 14 | Offer Received | A possible offer or term option was received. |
| 15 | Borrower Reviewing Options | Borrower is reviewing available options. |
| 16 | Closing / Funding Steps | Final steps before funding or completion. |
| 17 | Funded | Deal funded or transaction completed. |
| 18 | Renewal / Re-Engagement | Post-funding follow-up or future opportunity. |
| 19 | Stalled | No movement after follow-up attempts. |
| 20 | Closed / Not Moving Forward | File is inactive, withdrawn, not a fit, or closed. |

---

## Stage 1: New Lead

## Definition

A new borrower, business, or referral opportunity has entered the system but has not yet been reviewed by a broker or processor.

## Entry Criteria

A record enters this stage when:

- A website form is submitted
- A referral partner submits a lead
- A spreadsheet row is imported
- A GPT intake submission is received
- A broker manually creates a lead
- A lead arrives from phone, email, SMS, ad, landing page, event, or partner channel

## Required Fields

Minimum useful fields:

| Field | Required? |
|---|---:|
| Borrower name | Yes |
| Email or phone | Yes |
| Business name | Recommended |
| Lead source | Yes |
| Intake channel | Recommended |
| Requested amount | Recommended |
| Created date | Yes |
| Assigned owner | Recommended |

## Recommended Automations

When a lead enters `New Lead`:

1. Create or update CRM contact.
2. Check for duplicate by email, phone, and business name.
3. Assign lead owner.
4. Create broker review task.
5. Send internal alert.
6. Tag lead source.
7. Log intake timestamp.

## Exit Criteria

Move out of `New Lead` when:

- Required fields are checked
- Duplicate review is complete
- Lead is assigned
- Intake completeness is known

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Required fields missing | Intake Incomplete |
| Minimum intake complete | Ready for Broker Review |
| Duplicate suspected | Duplicate Review / Ready for Broker Review |
| Bad or fake submission | Closed / Not Moving Forward |

## Common Stuck Points

- No phone number
- Invalid email
- Duplicate record
- Missing business name
- No assigned owner
- No clear funding request

## Human Review Required?

Yes. A human should review before document requests, lender matching, or borrower-facing recommendations.

---

## Stage 2: Intake Incomplete

## Definition

The lead exists, but required information is missing before a broker can review the file properly.

## Entry Criteria

A record enters this stage when one or more required intake fields are missing.

Common missing fields:

- Borrower name
- Email
- Phone
- Business name
- Funding amount requested
- Use of funds
- Monthly revenue
- Time in business
- State
- Consent to contact
- Lead source

## Recommended Automations

When a deal enters `Intake Incomplete`:

1. Create missing-info task.
2. Send borrower missing-info request if consent exists.
3. Notify assigned owner.
4. Add missing fields to CRM notes.
5. Start follow-up timer.
6. Recheck completeness when new data arrives.

## Borrower Message

Subject: A few details are needed for review

Hi [Borrower Name],

Thanks for reaching out. Before your file can be routed for broker review, we need a few more details:

[Missing Field List]

Please reply with the missing information or complete the intake form here:
[Intake Form Link]

Once received, your file can move to broker review.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out of `Intake Incomplete` when:

- Minimum required fields are complete
- Borrower confirms missing information
- Broker manually decides to review despite missing fields
- File is closed due to no response

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Missing fields completed | Ready for Broker Review |
| Borrower responds but still incomplete | Intake Incomplete |
| No response after follow-ups | Stalled |
| Bad lead or wrong fit | Closed / Not Moving Forward |

## Common Stuck Points

- Borrower does not respond
- Lead source provides bad data
- Phone number is invalid
- Borrower does not know exact revenue or time in business
- Form is too long or confusing

## Human Review Required?

Yes. A broker or processor should decide whether to continue, pause, or close incomplete files.

---

## Stage 3: Ready for Broker Review

## Definition

The lead has enough information for a broker or processor to review the file and decide the next step.

This does not mean the borrower is qualified, eligible, approved, or likely to be funded.

## Entry Criteria

Minimum intake is complete.

Recommended minimum fields:

| Field | Recommended Requirement |
|---|---|
| Borrower name | Present |
| Email or phone | Present |
| Business name | Present if business funding |
| Funding amount requested | Present |
| Use of funds | Present or summarized |
| Monthly revenue | Present or range |
| Time in business | Present or range |
| State | Present |
| Lead source | Present |
| Consent to contact | Confirmed if outreach is automated |

## Recommended Automations

When a deal enters `Ready for Broker Review`:

1. Create broker review task.
2. Notify assigned broker.
3. Add file to daily review queue.
4. Summarize intake details.
5. Suggest possible next steps for human review.
6. Do not automatically request sensitive documents unless broker-approved.

## Broker Review Checklist

Broker should review:

- Borrower contact details
- Business type
- Requested amount
- Revenue range
- Time in business
- Use of funds
- Existing debt or advances
- Lead source
- Urgency
- Product path possibilities
- Whether document request is appropriate

## Exit Criteria

Move out of this stage when broker decides the next action.

## Next Stage Options

| Broker Decision | Next Stage |
|---|---|
| Contact borrower first | Contact Attempted |
| Request documents | Docs Requested |
| Needs more info | Intake Incomplete |
| Not worth pursuing now | Closed / Not Moving Forward |
| Follow up later | Stalled or Nurture |

## Common Stuck Points

- Broker review task is not assigned
- Broker does not know what to check
- No priority rules
- Lead volume exceeds broker capacity
- Missing summary forces broker to read raw form data

## Human Review Required?

Yes. This stage exists specifically for human review.

---

## Stage 4: Contact Attempted

## Definition

The broker, VA, processor, or system attempted to contact the borrower, but the borrower has not yet responded.

## Entry Criteria

A contact attempt has been made through:

- Phone call
- Email
- SMS
- CRM sequence
- Calendar booking link
- Referral partner follow-up

## Recommended Automations

When a deal enters `Contact Attempted`:

1. Log contact attempt.
2. Create follow-up task.
3. Send first response email or SMS if consent exists.
4. Start speed-to-lead sequence.
5. Notify broker if high-priority lead.
6. Update last contact attempt date.

## Contact Attempt Tracking Fields

| Field | Purpose |
|---|---|
| Last contact attempt date | Shows most recent outreach. |
| Contact attempt count | Prevents over-contacting. |
| Contact method | Phone, email, SMS, partner, etc. |
| Next follow-up date | Keeps pipeline moving. |
| Response received? | Moves file to Contacted. |

## Exit Criteria

Move out of this stage when:

- Borrower responds
- Contact attempts are exhausted
- Broker manually pauses the file
- Lead is disqualified manually or closed

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Borrower responds | Contacted |
| Borrower provides missing info | Ready for Broker Review or Docs Requested |
| No response after follow-ups | Stalled |
| Wrong number / bad contact info | Closed / Not Moving Forward |

## Human Review Required?

Recommended. Automations can send basic follow-ups, but a human should control sensitive borrower communications and funding discussions.

---

## Stage 5: Contacted

## Definition

The borrower has responded or the broker/team has successfully connected with the borrower.

## Entry Criteria

The borrower has:

- Answered a call
- Replied to email or SMS
- Completed a call booking
- Provided missing information
- Confirmed interest
- Asked questions about next steps

## Recommended Automations

When a deal enters `Contacted`:

1. Log conversation notes.
2. Update intake fields.
3. Create next-step task.
4. Send document request only if broker-approved.
5. Send call recap if appropriate.
6. Update lead temperature or priority.

## Conversation Note Template

Use this structure for notes:

| Section | Details |
|---|---|
| Contact date | [Date] |
| Contact method | [Phone / Email / SMS / Meeting] |
| Borrower goal | [Funding need] |
| Use of funds | [Use] |
| Timeline | [Timeline] |
| Key concerns | [Notes] |
| Missing info | [Missing fields] |
| Next step | [Task] |
| Human review needed | Yes |

## Exit Criteria

Move out of this stage when the next operational step is selected.

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Ready to collect docs | Docs Requested |
| More info needed | Intake Incomplete |
| Broker needs review | Ready for Broker Review |
| Borrower delays | Stalled |
| Borrower no longer interested | Closed / Not Moving Forward |

## Human Review Required?

Yes. Human review is especially important before document requests, funding path recommendations, and lender submissions.

---

## Stage 6: Docs Requested

## Definition

The borrower has been asked to provide documents through a secure upload method.

## Entry Criteria

A broker, processor, or authorized workflow requested documents.

## Recommended Automations

When a deal enters `Docs Requested`:

1. Send document request message.
2. Generate secure upload link.
3. Create document checklist.
4. Set document statuses to `Requested`.
5. Start missing-document reminder timer.
6. Create processor follow-up task.
7. Update requested date.

## Required Fields

| Field | Purpose |
|---|---|
| Document checklist | Tracks requested items. |
| Secure upload link | Keeps sensitive files out of chat/email. |
| Requested date | Starts reminder timing. |
| Assigned processor | Owns document follow-up. |
| Reminder schedule | Controls follow-up cadence. |

## Exit Criteria

Move out of this stage when:

- Some documents are received
- All starter documents are received
- Borrower does not respond
- Broker cancels request

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Some docs received | Docs Partially Received |
| All starter docs received | Docs Received |
| No response after reminders | Stalled |
| Borrower withdraws | Closed / Not Moving Forward |

## Human Review Required?

Yes. A human should approve what documents are requested and review them before lender submission.

---

## Stage 7: Docs Partially Received

## Definition

Some requested documents have been received, but the file is still incomplete.

## Entry Criteria

At least one document has been uploaded or received, but one or more required documents remain missing.

## Recommended Automations

When a deal enters `Docs Partially Received`:

1. Update received document statuses.
2. Identify missing documents.
3. Send missing-document reminder.
4. Create processor task.
5. Update reminder count.
6. Notify broker if key documents are missing.

## Missing Document Message

Subject: Missing documents for your file

Hi [Borrower Name],

We received part of your file, but the following documents are still missing:

[Missing Document List]

Please upload them here:
[Secure Upload Link]

Once these are received, your file can continue to broker review.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out of this stage when:

- All required starter documents are received
- Borrower stops responding
- Broker decides to review with partial docs
- File is closed

## Next Stage Options

| Condition | Next Stage |
|---|---|
| All required docs received | Docs Received |
| Broker chooses to review anyway | Processor Review |
| No response after reminders | Stalled |
| Borrower withdraws | Closed / Not Moving Forward |

## Human Review Required?

Yes. A processor or broker should determine whether partial documents are enough to continue.

---

## Stage 8: Docs Received

## Definition

The required starter documents have been received, but they may not yet be checked, organized, or accepted for submission.

## Entry Criteria

Starter checklist is complete.

Example starter set:

- Completed funding application
- Required bank statements
- Government-issued ID through secure upload
- Existing debt statements, if applicable
- Product-specific starter documents, if relevant

## Recommended Automations

When a deal enters `Docs Received`:

1. Notify processor.
2. Create document review task.
3. Mark file as ready for organization.
4. Check for outdated or unreadable documents.
5. Prepare file summary.
6. Do not submit to lenders automatically.

## Exit Criteria

Move out of this stage when:

- Processor begins review
- Documents are accepted for file
- Replacement documents are needed
- Broker decides next step

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Processor starts review | Processor Review |
| Docs have issues | More Info Requested or Docs Partially Received |
| File is ready for broker | Ready for Submission Review |

## Human Review Required?

Yes. Documents should be reviewed by a human before any lender submission.

---

## Stage 9: Processor Review

## Definition

A processor, VA, broker assistant, or broker is organizing the file, checking documents, cleaning CRM fields, and preparing the deal for broker review.

## Entry Criteria

Documents have been received or the broker wants the file organized.

## Recommended Automations

When a deal enters `Processor Review`:

1. Create processor review checklist.
2. Check document completeness.
3. Check document readability.
4. Update missing fields.
5. Prepare deal summary.
6. Flag issues for broker.
7. Create broker submission review task when ready.

## Processor Review Checklist

| Item | Complete? |
|---|---|
| Borrower contact details verified |
| Business details completed |
| Requested amount confirmed |
| Use of funds summarized |
| Bank statements received |
| Document dates checked |
| Existing debt noted |
| Product-specific documents attached |
| Duplicate records checked |
| Referral partner attribution checked |
| File summary drafted |
| Human review task created |

## Exit Criteria

Move out of this stage when:

- File is organized for broker review
- Missing information is identified
- Borrower needs to replace documents
- File is paused or closed

## Next Stage Options

| Condition | Next Stage |
|---|---|
| File organized | Ready for Submission Review |
| Missing docs/info | More Info Requested |
| Borrower not responsive | Stalled |
| Not moving forward | Closed / Not Moving Forward |

## Human Review Required?

Yes. Processor review supports broker review; it does not replace underwriting or approval.

---

## Stage 10: Ready for Submission Review

## Definition

The file is organized enough for the broker to decide whether, where, and how to submit it.

This stage must not mean the borrower is approved, qualified, or eligible.

## Entry Criteria

A processor or broker has organized the file and believes it is ready for broker review before any lender submission.

## Recommended Automations

When a deal enters `Ready for Submission Review`:

1. Create broker submission review task.
2. Generate file summary.
3. List possible product paths if requested.
4. List missing risks or issues.
5. Prepare lender submission checklist.
6. Require human confirmation before any submission.

## Broker Submission Review Checklist

Broker should review:

- Borrower profile
- Business profile
- Funding amount requested
- Use of funds
- Revenue and cash-flow indicators
- Time in business
- Industry
- State
- Existing debt
- Document completeness
- Product path possibilities
- Lender fit possibilities
- Compliance or sensitivity concerns
- Borrower communication history

## Exit Criteria

Move out of this stage when broker chooses the next action.

## Next Stage Options

| Broker Decision | Next Stage |
|---|---|
| Submit to lender/funder | Submitted to Lender |
| Request more info | More Info Requested |
| Discuss options with borrower first | Borrower Reviewing Options |
| Pause | Stalled |
| Close | Closed / Not Moving Forward |

## Human Review Required?

Yes. This stage is a mandatory human review point.

---

## Stage 11: Submitted to Lender

## Definition

The broker or authorized team member submitted the file to one or more lenders, funders, marketplaces, or internal review partners.

## Entry Criteria

Manual broker/team submission occurred.

## Required Fields

| Field | Purpose |
|---|---|
| Lender/funder name | Tracks where file was submitted. |
| Submission date | Starts follow-up timer. |
| Submission owner | Person responsible. |
| Submitted documents | Shows package details. |
| Submission notes | Tracks context. |
| Follow-up date | Prevents files from going stale. |

## Recommended Automations

When a deal enters `Submitted to Lender`:

1. Log submission.
2. Create lender follow-up task.
3. Update submission tracker.
4. Notify broker/team.
5. Optionally notify referral partner with safe language.
6. Start lender status check timer.

## Safe Referral Partner Update

[Borrower / Business Name] has been submitted for lender review.

We’ll update you when there is a status change or if more information is requested.

## Exit Criteria

Move out of this stage when:

- Lender confirms review started
- Lender requests more information
- Offer or option is received
- Submission is withdrawn
- File is declined or closed manually

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Lender reviewing | Lender Reviewing |
| More info requested | More Info Requested |
| Offer received | Offer Received |
| No response | Stalled |
| Not moving forward | Closed / Not Moving Forward |

## Human Review Required?

Yes. Submission should be authorized by a human.

---

## Stage 12: Lender Reviewing

## Definition

A lender, funder, or funding partner is reviewing the submitted file.

## Entry Criteria

A lender or partner has acknowledged or begun review.

## Recommended Automations

When a deal enters `Lender Reviewing`:

1. Set lender follow-up date.
2. Track lender status.
3. Notify broker/team.
4. Add expected response window if known.
5. Create follow-up task.
6. Do not promise outcome to borrower.

## Tracking Fields

| Field | Purpose |
|---|---|
| Lender name | Identifies reviewing party. |
| Lender contact | Contact person or portal. |
| Submission date | Tracks age of file. |
| Current lender status | Pending, reviewing, more info, offer, no fit. |
| Last lender update | Latest communication. |
| Next follow-up date | Keeps file moving. |

## Exit Criteria

Move out when lender provides an update.

## Next Stage Options

| Lender Update | Next Stage |
|---|---|
| Additional docs needed | More Info Requested |
| Possible terms received | Offer Received |
| Lender not moving forward | Closed / Not Moving Forward or More Submissions |
| No response | Stalled |
| Borrower withdraws | Closed / Not Moving Forward |

## Human Review Required?

Yes. A broker should interpret lender responses and communicate carefully with borrowers.

---

## Stage 13: More Info Requested

## Definition

Additional borrower information, documents, clarification, or replacement documents are needed.

## Entry Criteria

More information is requested by:

- Broker
- Processor
- Lender
- Funder
- Compliance reviewer
- Internal operations team

## Recommended Automations

When a deal enters `More Info Requested`:

1. Create missing-info task.
2. Send borrower request if appropriate.
3. Update document checklist.
4. Set follow-up date.
5. Notify broker or processor.
6. Track request source.

## Required Fields

| Field | Purpose |
|---|---|
| Requested item | What is needed. |
| Request source | Broker, lender, processor, etc. |
| Request date | Starts follow-up timer. |
| Due date | Keeps request moving. |
| Owner | Person responsible. |
| Status | Requested, received, reviewed. |

## Borrower Message

Subject: Additional information needed

Hi [Borrower Name],

A few additional items are needed before your file can continue review:

[Requested Items]

Please upload or provide them here:
[Secure Link or Instructions]

Once received, the broker can review the next step.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out when:

- Requested info is received
- File returns to review
- Borrower stops responding
- Broker closes the file

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Info received | Processor Review or Ready for Submission Review |
| Lender requested docs received | Lender Reviewing |
| No response | Stalled |
| Borrower withdraws | Closed / Not Moving Forward |

## Human Review Required?

Yes. A human should verify whether the new information resolves the issue.

---

## Stage 14: Offer Received

## Definition

A potential funding offer, term sheet, option, or response has been received and needs human review before borrower presentation.

## Entry Criteria

A lender/funder provides possible terms or an offer-like response.

## Recommended Automations

When a deal enters `Offer Received`:

1. Notify broker.
2. Create offer review task.
3. Log offer details.
4. Compare to borrower request.
5. Require human review before borrower communication.
6. Prepare safe summary only after broker approval.

## Offer Tracking Fields

| Field | Purpose |
|---|---|
| Lender/funder | Source of offer. |
| Offer date | Date received. |
| Amount | Proposed amount, if provided. |
| Term | Proposed term, if provided. |
| Payment/remittance | Proposed payment structure, if provided. |
| Fees/costs | If available and allowed. |
| Conditions | Additional requirements. |
| Expiration date | If offer expires. |
| Broker review status | Pending, reviewed, presentable, not presenting. |

## Guardrail

GPT should not independently interpret, recommend, or present financial terms as final advice.

Use:

- “Possible option received”
- “Broker review needed”
- “Terms should be reviewed manually”
- “Borrower-facing summary should be confirmed by the broker”

## Exit Criteria

Move out when broker reviews the offer.

## Next Stage Options

| Broker Decision | Next Stage |
|---|---|
| Present option to borrower | Borrower Reviewing Options |
| Request clarification | More Info Requested |
| Continue lender review | Lender Reviewing |
| Do not proceed | Closed / Not Moving Forward |

## Human Review Required?

Yes. Always.

---

## Stage 15: Borrower Reviewing Options

## Definition

Borrower is reviewing possible funding options, terms, or next steps that a broker has chosen to present.

## Entry Criteria

Broker has reviewed possible option(s) and borrower is considering next step.

## Recommended Automations

When a deal enters `Borrower Reviewing Options`:

1. Log presented options.
2. Set borrower follow-up date.
3. Create broker follow-up task.
4. Track borrower questions.
5. Notify referral partner only with safe status language.
6. Avoid pressure-based automation.

## Borrower Follow-Up Message

Hi [Borrower Name],

Just checking in to see if you had any questions about the options we discussed.

If you want to move forward, reply here or schedule a quick call:
[Calendar Link]

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out when borrower decides or stops responding.

## Next Stage Options

| Borrower Decision | Next Stage |
|---|---|
| Wants to proceed | Closing / Funding Steps |
| Has questions | Borrower Reviewing Options |
| Needs changes | More Info Requested |
| Stops responding | Stalled |
| Declines options | Closed / Not Moving Forward |

## Human Review Required?

Yes. Borrower-facing discussion of terms should be handled or approved by a human.

---

## Stage 16: Closing / Funding Steps

## Definition

The borrower has chosen to proceed and the file is in final steps before funding, completion, or closing.

## Entry Criteria

Borrower has confirmed intent to move forward with a presented option.

## Recommended Automations

When a deal enters `Closing / Funding Steps`:

1. Create closing checklist.
2. Track outstanding conditions.
3. Set expected funding/closing date.
4. Notify broker/team.
5. Create follow-up tasks.
6. Log key documents or signatures.
7. Prepare post-funding workflow after confirmation.

## Closing Checklist

| Item | Status |
|---|---|
| Borrower confirmed option |
| Final documents requested |
| Conditions listed |
| Signatures pending or complete |
| Bank/account verification complete if required |
| Final review complete |
| Funding date confirmed |
| Post-funding workflow ready |

## Guardrail

Do not say funding is complete until confirmed by the appropriate system, lender, or broker.

## Exit Criteria

Move out when:

- Funding is confirmed
- Closing fails
- Borrower withdraws
- Additional information is requested

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Funding confirmed | Funded |
| Additional conditions | More Info Requested |
| Borrower stops responding | Stalled |
| Not moving forward | Closed / Not Moving Forward |

## Human Review Required?

Yes. Closing and funding steps should be human-controlled.

---

## Stage 17: Funded

## Definition

The deal has funded or completed, confirmed by the broker, lender, funder, or internal system.

## Entry Criteria

Funding/completion is confirmed.

## Recommended Automations

When a deal enters `Funded`:

1. Log funded date.
2. Log funded amount if appropriate.
3. Notify team.
4. Notify referral partner if applicable.
5. Trigger post-funding review request.
6. Trigger renewal reminder workflow.
7. Trigger testimonial/referral workflow.
8. Update reporting dashboard.

## Funded Tracking Fields

| Field | Purpose |
|---|---|
| Funded date | Starts renewal and reporting workflows. |
| Funded amount | Revenue and performance reporting. |
| Product type | Tracks product performance. |
| Lender/funder | Tracks partner performance. |
| Broker owner | Commission/performance reporting. |
| Referral partner | Partner attribution. |
| Renewal review date | Future opportunity tracking. |

## Post-Funding Message

Hi [Borrower Name],

Congratulations — your file has been marked funded in our system.

We appreciate the opportunity to help. If you have questions about next steps, renewal timing, or future funding needs, reply here and the team can help.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move to renewal/re-engagement when the post-funding follow-up window begins.

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Renewal timing reached | Renewal / Re-Engagement |
| Borrower requests more funding | New Lead or Renewal / Re-Engagement |
| Relationship inactive | Closed / Not Moving Forward |

## Human Review Required?

Human confirmation is required before marking a file funded.

---

## Stage 18: Renewal / Re-Engagement

## Definition

A funded, inactive, declined, or dormant borrower is being reviewed for future follow-up, renewal, reactivation, or referral opportunities.

## Entry Criteria

A borrower enters this stage when:

- Funded deal reaches renewal review date
- Borrower may need future funding
- Declined/stalled borrower becomes worth recontacting
- Referral partner needs reactivation
- Post-funding check-in is due

## Recommended Automations

When a deal enters `Renewal / Re-Engagement`:

1. Create renewal review task.
2. Send check-in message if appropriate.
3. Review previous funding date and amount.
4. Review borrower history.
5. Notify assigned broker.
6. Create referral/testimonial task if relevant.

## Renewal Timing Examples

| Trigger | Suggested Timing |
|---|---|
| Post-funding check-in | 7 to 14 days after funding |
| Review request | 7 to 30 days after funding |
| Referral ask | 14 to 45 days after funding |
| Renewal reminder | 60 to 120 days after funding, depending on product |
| Dormant lead reactivation | 30, 60, or 90 days after last response |

## Safe Renewal Message

Hi [Borrower Name],

Just checking in to see how things are going since your last funding conversation.

If you want to review future options or update your file, reply here and we can route it for broker review.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out when borrower responds or campaign ends.

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Borrower wants review | Ready for Broker Review |
| Docs needed | Docs Requested |
| No response | Stalled or Closed / Not Moving Forward |
| Not interested | Closed / Not Moving Forward |

## Human Review Required?

Recommended. Renewal conversations should not imply guaranteed eligibility or approval.

---

## Stage 19: Stalled

## Definition

The file is not moving because the borrower, lender, partner, broker, or process has not responded or completed the next step.

## Entry Criteria

A file enters this stage when:

- Borrower stops responding
- Documents remain missing
- Lender has not responded
- Broker follow-up is overdue
- Referral partner has not provided details
- Internal task is overdue

## Recommended Automations

When a deal enters `Stalled`:

1. Identify stall reason.
2. Create follow-up task.
3. Send appropriate reminder.
4. Set recheck date.
5. Escalate if high-value file.
6. Move to closed after final follow-up if no response.

## Stall Reason Options

| Stall Reason | Example |
|---|---|
| Borrower no response | Borrower has not replied. |
| Missing docs | Documents still incomplete. |
| Lender no response | Awaiting lender update. |
| Internal delay | Broker/processor task overdue. |
| Partner no response | Referral partner has not provided details. |
| Borrower undecided | Borrower reviewing options too long. |
| Seasonal / future timing | Borrower asked to revisit later. |

## Final Follow-Up Message

Hi [Borrower Name],

We’re checking in one more time on your funding file.

If you still want to move forward, reply here and we can help with the next step.

If now is not the right time, no problem — we can pause the file.

Thanks,
[Broker / Team Name]

## Exit Criteria

Move out when:

- Borrower responds
- Missing information arrives
- Lender responds
- Internal task is completed
- File is closed

## Next Stage Options

| Condition | Next Stage |
|---|---|
| Borrower responds | Contacted |
| Docs received | Docs Received |
| Lender responds | Lender Reviewing / Offer Received / More Info Requested |
| No response after final follow-up | Closed / Not Moving Forward |
| Future timing | Renewal / Re-Engagement |

## Human Review Required?

Recommended. A human should review before closing high-value or partner-sourced opportunities.

---

## Stage 20: Closed / Not Moving Forward

## Definition

The file is inactive, withdrawn, not moving forward, duplicated, not a fit, or closed for now.

## Entry Criteria

A file enters this stage when:

- Borrower withdraws
- Borrower stops responding after follow-ups
- File is duplicate
- Broker manually closes it
- Borrower is not seeking funding
- Funding request is outside current product paths
- Lender/funder does not move forward and no next path is chosen
- Internal team decides not to pursue

## Recommended Automations

When a deal enters `Closed / Not Moving Forward`:

1. Require close reason.
2. Add final note.
3. Stop active reminders.
4. Remove from active pipeline.
5. Add to nurture if appropriate.
6. Notify referral partner if needed with safe language.
7. Update reporting.

## Close Reason Options

| Close Reason | Notes |
|---|---|
| Duplicate record | Existing CRM record found. |
| No response | No borrower response after follow-ups. |
| Borrower withdrew | Borrower no longer wants to proceed. |
| Not seeking funding now | Future nurture possible. |
| Missing required info | Could not complete file. |
| Missing documents | Documents never received. |
| Product unavailable | No current path selected. |
| Lender not moving forward | Manual status only. |
| Internal decision | Broker/team chose to stop. |
| Funded elsewhere | Borrower completed outside this pipeline. |

## Safe Closure Language

Use:

- “Not moving forward at this time”
- “File closed for now”
- “No current next step”
- “Can be reopened if the borrower responds”
- “Needs future review”

Avoid:

- “Rejected by AI”
- “Automatically declined”
- “Not eligible”
- “Unqualified”
- “Impossible to fund”

## Exit Criteria

A closed file can reopen if:

- Borrower responds
- New documents arrive
- Broker manually reactivates it
- Renewal/re-engagement workflow begins
- Referral partner provides updated info

## Human Review Required?

Yes, especially before closing referral, high-value, or previously submitted files.

---

## Pipeline Variations by Business Model

## Simple Broker Pipeline

Use this for small teams, solo brokers, or early CRM setups.

| Stage # | Stage Name |
|---:|---|
| 1 | New Lead |
| 2 | Intake Incomplete |
| 3 | Ready for Broker Review |
| 4 | Docs Requested |
| 5 | Docs Received |
| 6 | Submitted to Lender |
| 7 | Offer Received |
| 8 | Funded |
| 9 | Stalled |
| 10 | Closed / Not Moving Forward |

## Processor-Heavy Pipeline

Use this when the team has processors, VAs, or back-office support.

| Stage # | Stage Name |
|---:|---|
| 1 | New Lead |
| 2 | Intake Incomplete |
| 3 | Ready for Broker Review |
| 4 | Contacted |
| 5 | Docs Requested |
| 6 | Docs Partially Received |
| 7 | Docs Received |
| 8 | Processor Review |
| 9 | Ready for Submission Review |
| 10 | Submitted to Lender |
| 11 | Lender Reviewing |
| 12 | More Info Requested |
| 13 | Offer Received |
| 14 | Borrower Reviewing Options |
| 15 | Closing / Funding Steps |
| 16 | Funded |
| 17 | Renewal / Re-Engagement |
| 18 | Stalled |
| 19 | Closed / Not Moving Forward |

## Referral Partner Pipeline

Use this when lead flow comes heavily from affiliates, partners, brokers, or referral sources.

| Stage # | Stage Name |
|---:|---|
| 1 | Referral Lead Received |
| 2 | Partner Attribution Confirmed |
| 3 | Borrower Contact Attempted |
| 4 | Borrower Contacted |
| 5 | Intake Incomplete |
| 6 | Ready for Broker Review |
| 7 | Docs Requested |
| 8 | Docs Received |
| 9 | Submitted to Lender |
| 10 | Partner Update Needed |
| 11 | Offer Received |
| 12 | Funded |
| 13 | Partner Commission / Follow-Up |
| 14 | Stalled |
| 15 | Closed / Not Moving Forward |

## MCA / Revenue-Based Funding Pipeline

Use this for fast-moving alternative funding workflows.

| Stage # | Stage Name |
|---:|---|
| 1 | New Lead |
| 2 | Intake Incomplete |
| 3 | Ready for Broker Review |
| 4 | Bank Statements Requested |
| 5 | Statements Received |
| 6 | Existing Positions Review |
| 7 | Submitted to Funder |
| 8 | Funder Reviewing |
| 9 | Additional Stips Requested |
| 10 | Offer Received |
| 11 | Borrower Reviewing Options |
| 12 | Contracts / Funding Steps |
| 13 | Funded |
| 14 | Renewal Watch |
| 15 | Stalled |
| 16 | Closed / Not Moving Forward |

## SBA / Bank-Style Pipeline

Use this for longer, more document-heavy workflows.

| Stage # | Stage Name |
|---:|---|
| 1 | New Inquiry |
| 2 | Intake Incomplete |
| 3 | Initial Broker Review |
| 4 | Full Application Requested |
| 5 | Financial Documents Requested |
| 6 | Docs Partially Received |
| 7 | Docs Received |
| 8 | Packaging / Processor Review |
| 9 | Ready for Lender Review |
| 10 | Submitted to Bank / SBA Lender |
| 11 | Lender Reviewing |
| 12 | Conditions / More Info |
| 13 | Term Discussion |
| 14 | Closing Process |
| 15 | Funded / Closed |
| 16 | Stalled |
| 17 | Closed / Not Moving Forward |

---

## Stage Entry Automation Rules

Use these rules to trigger automations when records enter stages.

| Stage | Recommended Entry Automation |
|---|---|
| New Lead | Create task, check duplicate, assign owner, send internal alert. |
| Intake Incomplete | Send missing-info request, create follow-up task. |
| Ready for Broker Review | Create broker review task, summarize intake. |
| Contact Attempted | Log attempt, schedule follow-up. |
| Contacted | Create next-step task, update notes. |
| Docs Requested | Send document request, create checklist, start reminders. |
| Docs Partially Received | Send missing-doc reminder, update checklist. |
| Docs Received | Notify processor, create document review task. |
| Processor Review | Create processor checklist, prepare file summary. |
| Ready for Submission Review | Create broker submission review task. |
| Submitted to Lender | Log submission, create lender follow-up task. |
| Lender Reviewing | Set lender status check reminder. |
| More Info Requested | Send request, create task, track due date. |
| Offer Received | Notify broker, create offer review task. |
| Borrower Reviewing Options | Create borrower follow-up task. |
| Closing / Funding Steps | Create closing checklist. |
| Funded | Trigger post-funding, review, referral, renewal workflows. |
| Renewal / Re-Engagement | Create renewal review task. |
| Stalled | Send final follow-up or create escalation task. |
| Closed / Not Moving Forward | Stop active reminders, require close reason. |

---

## Stage Exit Rules

Every stage should have a clear exit rule.

| Stage | Exit When |
|---|---|
| New Lead | Intake completeness and duplicate status are checked. |
| Intake Incomplete | Missing fields are completed or file is paused. |
| Ready for Broker Review | Broker chooses next step. |
| Contact Attempted | Borrower responds or follow-ups are exhausted. |
| Contacted | Next operational step is selected. |
| Docs Requested | Documents are received or borrower stops responding. |
| Docs Partially Received | Missing docs arrive or file stalls. |
| Docs Received | Processor begins review. |
| Processor Review | File is ready or more info is requested. |
| Ready for Submission Review | Broker submits, requests more info, or closes. |
| Submitted to Lender | Lender responds or follow-up is needed. |
| Lender Reviewing | Lender requests info, sends terms, or stops review. |
| More Info Requested | Requested info is received or file stalls. |
| Offer Received | Broker reviews and decides whether to present. |
| Borrower Reviewing Options | Borrower proceeds, pauses, or declines. |
| Closing / Funding Steps | Funding completes, conditions arise, or file closes. |
| Funded | Post-funding workflow starts. |
| Renewal / Re-Engagement | Borrower responds or campaign ends. |
| Stalled | File reactivates or closes. |
| Closed / Not Moving Forward | File is manually reopened or archived. |

---

## Required CRM Properties

Use these fields in HubSpot, GoHighLevel, Pipedrive, Salesforce, Airtable, Notion, Google Sheets, or custom CRMs.

## Core Deal Fields

| Field | Type | Purpose |
|---|---|---|
| Deal name | Text | Usually business name + funding request. |
| Pipeline stage | Select | Current operational status. |
| Stage entered date | Date | Tracks stage age. |
| Assigned broker | Person | Owner of borrower relationship. |
| Assigned processor | Person | Owner of document/file prep. |
| Lead source | Select | Attribution. |
| Referral partner | Relation/Text | Partner tracking. |
| Requested amount | Number | Borrower’s requested amount. |
| Product interest | Select | Product path or category. |
| Use of funds | Text/Select | Funding purpose. |
| Priority | Select | High, medium, low. |
| Next step | Text | Current action needed. |
| Next follow-up date | Date | Prevents stale files. |
| Human review required | Checkbox | Should usually be true. |
| Close reason | Select | Required when closed. |

## Borrower Fields

| Field | Type |
|---|---|
| Borrower first name | Text |
| Borrower last name | Text |
| Email | Email |
| Phone | Phone |
| Preferred contact method | Select |
| Consent to contact | Checkbox |
| State | Select/Text |
| Notes | Text |

## Business Fields

| Field | Type |
|---|---|
| Business name | Text |
| Industry | Select/Text |
| Time in business | Select/Number |
| Monthly revenue | Number/Range |
| Annual revenue | Number/Range |
| Existing debt / advances | Text/Number |
| Entity type | Select |
| Website | URL |

## Document Fields

| Field | Type |
|---|---|
| Document checklist status | Select |
| Secure upload link | URL |
| Docs requested date | Date |
| Docs received date | Date |
| Missing document list | Text |
| Last document reminder date | Date |
| Document reminder count | Number |

## Submission Fields

| Field | Type |
|---|---|
| Submitted to lender? | Checkbox |
| Lender/funder name | Text/Relation |
| Submission date | Date |
| Lender status | Select |
| Last lender update | Date |
| Next lender follow-up date | Date |
| Offer received? | Checkbox |
| Offer review status | Select |

## Funded / Post-Funding Fields

| Field | Type |
|---|---|
| Funded date | Date |
| Funded amount | Number |
| Product funded | Select |
| Renewal review date | Date |
| Review request sent | Checkbox |
| Referral ask sent | Checkbox |
| Post-funding notes | Text |

---

## Pipeline Automation Examples

## Example 1: New Lead Intake Automation

Trigger:
New form submission

Flow:
New form submitted
→ Create or update contact
→ Create deal
→ Check duplicate
→ Assign owner
→ Set stage = New Lead
→ Validate required fields
→ If missing fields, set stage = Intake Incomplete
→ If complete, set stage = Ready for Broker Review
→ Create broker review task

Human Review:
Required before document request or lender submission.

---

## Example 2: Document Request Automation

Trigger:
Broker approves document request

Flow:
Broker clicks “Request Docs”
→ Set stage = Docs Requested
→ Create document checklist
→ Generate secure upload link
→ Send document request message
→ Wait 24 hours
→ Check received docs
→ If missing, send reminder
→ If received, set stage = Docs Received

Human Review:
Required before requesting sensitive documents and before lender submission.

---

## Example 3: Lender Submission Tracking

Trigger:
Broker manually marks file as submitted

Flow:
Set stage = Submitted to Lender
→ Log lender name
→ Log submission date
→ Create lender follow-up task
→ Wait 48 hours
→ Check lender status
→ If more info requested, set stage = More Info Requested
→ If possible offer received, set stage = Offer Received
→ If no response, create follow-up task

Human Review:
Required for all lender communications and borrower-facing updates.

---

## Example 4: Stalled File Recovery

Trigger:
No activity for defined number of days

Flow:
Check last activity date
→ If no borrower response, set stall reason = Borrower no response
→ Set stage = Stalled
→ Send safe follow-up
→ Create owner task
→ Wait 5 days
→ If no response, send final follow-up
→ If still no response, set stage = Closed / Not Moving Forward

Human Review:
Recommended before closing high-value leads or referral partner leads.

---

## Example 5: Funded Deal Post-Funding Automation

Trigger:
Broker confirms funded status

Flow:
Set stage = Funded
→ Log funded date
→ Log funded amount
→ Notify internal team
→ Notify referral partner if applicable
→ Create review request task
→ Set renewal review date
→ Create post-funding check-in task
→ Add borrower to renewal workflow

Human Review:
Required before marking funded.

---

## Stage Aging Rules

Use stage aging to prevent deals from getting stuck.

| Stage | Suggested Alert Timing |
|---|---|
| New Lead | Alert if not reviewed within 1 business day. |
| Intake Incomplete | Alert after 2 days without missing info. |
| Ready for Broker Review | Alert after 1 business day. |
| Contact Attempted | Alert after 1 day with no next follow-up. |
| Docs Requested | Alert after 1 day if no docs received. |
| Docs Partially Received | Alert after 2 days if key docs missing. |
| Docs Received | Alert after 1 business day if not reviewed. |
| Processor Review | Alert after 2 business days. |
| Ready for Submission Review | Alert after 1 business day. |
| Submitted to Lender | Alert after 2 business days without lender update. |
| Lender Reviewing | Alert based on lender SLA. |
| More Info Requested | Alert after 2 days. |
| Offer Received | Alert same day or next business day. |
| Borrower Reviewing Options | Alert after 1 to 2 days. |
| Closing / Funding Steps | Alert daily until complete. |
| Stalled | Review weekly. |
| Renewal / Re-Engagement | Review based on campaign cadence. |

---

## Reporting Views

Use these views for dashboards, daily review, and pipeline management.

## Daily Broker Review View

Filter:

- Stage is `Ready for Broker Review`
- Assigned broker is current user
- Next follow-up date is today or overdue

Show:

- Borrower name
- Business name
- Requested amount
- Lead source
- Priority
- Created date
- Next step

## Missing Documents View

Filter:

- Stage is `Docs Requested` or `Docs Partially Received`
- Missing document list is not empty

Show:

- Borrower name
- Business name
- Missing documents
- Last reminder sent
- Reminder count
- Assigned processor
- Next follow-up date

## Lender Follow-Up View

Filter:

- Stage is `Submitted to Lender` or `Lender Reviewing`
- Next lender follow-up date is today or overdue

Show:

- Business name
- Lender/funder
- Submission date
- Last lender update
- Assigned broker
- Next follow-up date

## Stalled Deals View

Filter:

- Stage is `Stalled`

Show:

- Borrower name
- Business name
- Stall reason
- Last activity date
- Assigned owner
- Next follow-up date
- Lead source

## Funded Deals View

Filter:

- Stage is `Funded`

Show:

- Business name
- Funded date
- Funded amount
- Broker
- Referral partner
- Product funded
- Renewal review date

## Renewal Watch View

Filter:

- Stage is `Renewal / Re-Engagement`
- Renewal review date is today, overdue, or within next 14 days

Show:

- Borrower name
- Business name
- Funded date
- Funded amount
- Product funded
- Assigned broker
- Next follow-up date

---

## Pipeline Cleanup Rules

Use these rules to keep the CRM clean.

## Required Cleanup Rules

1. Every active deal must have an assigned owner.
2. Every active deal must have a next step.
3. Every active deal should have a next follow-up date.
4. Every closed deal must have a close reason.
5. Every funded deal must have a funded date.
6. Every submitted deal must have a lender/funder name.
7. Every referral lead should have referral partner attribution.
8. Every document-stage deal should have a document checklist.
9. Every stalled deal should have a stall reason.
10. Every duplicate should link to the primary record if possible.

## Weekly Pipeline Cleanup Checklist

| Task | Complete? |
|---|---|
| Review unassigned leads |
| Review leads stuck in New Lead |
| Review Intake Incomplete files |
| Review overdue broker tasks |
| Review missing-document files |
| Review submitted files with no lender update |
| Review stalled deals |
| Confirm close reasons |
| Confirm funded records |
| Confirm referral partner attribution |
| Confirm renewal dates |

---

## Safe Status Update Language

## Borrower-Facing Safe Language

Use:

- “Your file is being reviewed.”
- “We’re waiting on a few more documents.”
- “Your file has been routed for broker review.”
- “A lender or funding partner is reviewing the file.”
- “Additional information was requested.”
- “A broker will review the next step.”
- “Your file is not moving forward at this time.”
- “We can revisit this later if your situation changes.”

Avoid:

- “You are approved.”
- “You are qualified.”
- “You are eligible.”
- “You are guaranteed funding.”
- “The lender will fund this.”
- “You were automatically declined.”
- “The AI rejected your file.”

## Referral Partner Safe Language

Use:

- “The file was received.”
- “The borrower has been contacted.”
- “Documents have been requested.”
- “The file is in broker review.”
- “The file was submitted for lender review.”
- “More information was requested.”
- “The file is not moving forward at this time.”
- “We’ll update you if the status changes.”

Avoid:

- “Your referral is approved.”
- “This deal is guaranteed.”
- “They qualify.”
- “They are eligible.”
- “The lender accepted them.”

---

## GPT Behavior Instructions

When the user asks for CRM pipeline help, the GPT should:

1. Identify the broker’s business model.
2. Recommend a simple pipeline first.
3. Define each stage clearly.
4. Include entry and exit rules.
5. Include automations for stage changes.
6. Include human review points.
7. Include safe borrower-facing language.
8. Include close reasons and stalled reasons.
9. Include reporting views.
10. Avoid approval, qualification, or underwriting language.

---

## Default Output Format

Use this format when generating a CRM pipeline.

# CRM Pipeline Blueprint: [Broker / Funding Workflow Name]

## 1. Purpose
Explain what this pipeline is designed to manage.

## 2. Recommended Pipeline Stages
Provide a stage table with clear meanings.

## 3. Stage Definitions
For each stage, include entry criteria, exit criteria, owner, and next step.

## 4. Required CRM Fields
List borrower, business, deal, document, submission, and post-funding fields.

## 5. Automation Triggers
Explain what should happen when a record enters each stage.

## 6. Human Review Points
Show where broker or processor review is mandatory.

## 7. Follow-Up Rules
Define reminder timing and stage aging alerts.

## 8. Reporting Views
Recommend dashboards or saved views.

## 9. Cleanup Rules
List weekly CRM hygiene tasks.

## 10. Final Recommendation
Give the simplest next build step.

---

## Example CRM Pipeline Payload

Use this as a generic structure for CRM updates or workflow automation.

{
  "source": "custom_gpt",
  "action_type": "crm_pipeline_update",
  "deal": {
    "deal_id": "",
    "deal_name": "",
    "pipeline_stage": "Ready for Broker Review",
    "previous_stage": "New Lead",
    "stage_entered_date": "",
    "next_step": "",
    "next_follow_up_date": "",
    "priority": "Medium"
  },
  "borrower": {
    "name": "",
    "email": "",
    "phone": "",
    "state": ""
  },
  "business": {
    "business_name": "",
    "industry": "",
    "time_in_business": "",
    "monthly_revenue": "",
    "requested_amount": "",
    "use_of_funds": ""
  },
  "ownership": {
    "assigned_broker": "",
    "assigned_processor": "",
    "referral_partner": ""
  },
  "review": {
    "human_review_required": true,
    "review_reason": "Broker review required before document request or lender submission.",
    "review_task_created": true
  },
  "automation": {
    "create_task": true,
    "send_internal_alert": true,
    "send_borrower_message": false,
    "message_template": ""
  }
}

---

## Final Rule

The CRM pipeline should make the broker’s next step obvious.

Automate stage tracking, task creation, reminders, document follow-up, lender follow-up, reporting, and cleanup.

Do not automate approval decisions, underwriting conclusions, lender submissions, offer presentation, borrower-facing funding promises, or final close decisions without human review.