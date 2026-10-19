---
title: BrokerFlow Workflows — n8n, Zapier, and Make Automations
description: The automation recipes that connect BrokerFlow AI to your stack — intake, document chasing, lender-match routing, renewals, and daily summaries.
slug: /workflows
order: 5
---
# Workflows
Workflow guides describe possible integrations for n8n, Zapier, and Make. The checked-in n8n exports are inactive preview starters: they validate required fields and return a preview response. They do not persist BrokerFlow records, write to a CRM, contact borrowers or submit applications.
> Every workflow that touches a decision pauses for a human. Automations prepare and route; they never approve, submit to a lender, or fund.
## How they're organized
Workflows are grouped by the tool that runs them. Start with whichever platform you already use — the logic is the same across all three.
### n8n
The most flexible option, best for teams that want full control:
| Workflow | What it does |
| --- | --- |
| `borrower-intake-to-crm` | Validate a preview intake payload; CRM writing is not configured |
| `missing-doc-reminder-workflow` | Validate reported document statuses; no reminder is sent |
| `referral-partner-lead-routing` | Validate supplied attribution references; no record is written |
| `no-auth-lender-match-review` | Existing REST webhook receipt example; inspect its contract before use |
| `renewal-reminder-workflow` | Validate supplied renewal metadata; no schedule or outreach is active |
| `daily-pipeline-summary` | Validate a supplied snapshot; no data reader or delivery is configured |
### Zapier
The fastest way to get started for simpler stacks:
- `borrower-intake-zap` — form submission to CRM record.
- `missing-doc-followup-zap` — reminder sequence for outstanding documents.
- `referral-partner-zap` — partner lead capture and notification.
### Make
A visual middle ground with strong branching:
- `borrower-intake-scenario` — structured intake into your CRM.
- `document-reminder-scenario` — timed document chasing.
- `crm-update-scenario` — keep records and stages in sync.
## Anatomy of a workflow
Every BrokerFlow recipe follows the same shape, so they're easy to read and adapt:
1. **Trigger** — what starts it (form submission, schedule, status change).
2. **Validate** — check required fields and prevent duplicates.
3. **Act** — create/update records, request documents, log notes.
4. **Follow up** — prepare a draft; delivery needs a separately authorized integration.
5. **Human review** — pause for a broker before anything decision-bearing.
6. **Update** — advance to a review-safe stage and record the outcome.
## Starter recipes
New to automation? Build these first — high value, low risk, easy to test:
1. New lead intake to CRM.
2. Missing document reminder sequence.
3. Borrower status update workflow.
4. Referral partner notification.
5. Daily pipeline summary.
6. Funded client renewal reminder.
7. Post-funding review request.
## Safety rules
- Human review is required before lender submission, funding terms, declines, or sending sensitive information.
- Workflows write only review-safe stages; decision-bearing stages stay manual.
- Sensitive documents are passed as secure links and metadata, never raw contents.
- Build the minimum viable version first, test with sample leads, then expand.
## Footer
[Home](./home.md) · [Agent](./agents.md) · [Actions](./actions.md) · [Knowledge](./knowledge.md)
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. Workflows provide operational automation only and do not approve, qualify, guarantee, or fund financing.
